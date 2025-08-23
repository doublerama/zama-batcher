import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("reentrancy on claim via malicious adapter", function () {
  it("blocks reentrancy and still pays out", async function () {
    await deployments.fixture(["core"]);
    const [u1, u2] = await ethers.getSigners();

    const regAddr = (await deployments.get("FHEIntentRegistry")).address;
    const batcherAddr = (await deployments.get("DCABatcher")).address;

    const reg = await ethers.getContractAt("FHEIntentRegistry", regAddr, u1);
    const batcher = await ethers.getContractAt("DCABatcher", batcherAddr, u1);

    // deploy malicious adapter
    const Reenter = await ethers.getContractFactory("ReenterAdapter", u1);
    const ra = await Reenter.deploy();
    await ra.waitForDeployment();

    // get mock WETH from fixture (skip if missing)
    const wethDep = await deployments.getOrNull("MockERC20_1");
    if (!wethDep) return this.skip();
    const weth = await ethers.getContractAt("MockERC20", wethDep.address, u1);

    // fund adapter and set it on the batcher
    await (await weth.mint(await ra.getAddress(), 2_000_000)).wait();
    await (await batcher.setDexAdapter(await ra.getAddress())).wait();

    // create two intents (different owners)
    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id = 1 (u1)
    const reg2 = reg.connect(u2);
    await (await reg2.submitIntent("0x11","0x12","0x13","0x14","0x")).wait(); // id = 2 (u2)

    // form a batch of two
    await (await batcher.setParams(2, 3600)).wait();
    await (await batcher.joinBatch(1)).wait();
    await (await batcher.connect(u2).joinBatch(2)).wait();

    // finish batch (simulate relayer): total = 2_000_000 => 1_000_000 each
    await (await batcher.setRelayer(await u1.getAddress())).wait();
    await (await batcher.onDecryptionResult(0, 2_000_000, 0)).wait();

    // payload that tries to re-enter claim from inside adapter.sweepWeth
    const reenterData = batcher.interface.encodeFunctionData("claim", [0, 1]);
    await (await ra.setWeth(wethDep.address)).wait();
    await (await ra.setBatcher(await batcher.getAddress())).wait();
    await (await ra.setReenter(reenterData)).wait();

    const before = await weth.balanceOf(await u1.getAddress());
    await (await batcher.claim(0, 1)).wait(); // reentrancy must be blocked by nonReentrant
    const after = await weth.balanceOf(await u1.getAddress());
    expect(after - before).to.equal(1_000_000);
  });
});
