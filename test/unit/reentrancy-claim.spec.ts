import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("reentrancy on claim via malicious adapter", function () {
  it("blocks reentrancy and still pays out", async function () {
    await deployments.fixture(["core"]);
    const [u1, u2] = await ethers.getSigners();

    const reg = await ethers.getContract("FHEIntentRegistry", u1);
    const batcher = await ethers.getContract("DCABatcher", u1);

    // Deploy malicious adapter and set as current
    const Reenter = await ethers.getContractFactory("ReenterAdapter", u1);
    const ra = await Reenter.deploy();
    await ra.waitForDeployment();

    const wethDep = await deployments.getOrNull("MockERC20_1");
    if (!wethDep) this.skip(); // run only in mock stack
    const weth = await ethers.getContractAt("MockERC20", wethDep.address, u1);

    // give adapter enough WETH for sweeping claims
    await (await weth.mint(await ra.getAddress(), 2_000_000)).wait();

    await (await batcher.setDexAdapter(await ra.getAddress())).wait();

    // two intents by different owners
    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id=1 (u1)
    const reg2 = reg.connect(u2);
    await (await reg2.submitIntent("0x11","0x12","0x13","0x14","0x")).wait(); // id=2 (u2)

    // join both
    await (await batcher.setParams(2, 3600)).wait();
    await (await batcher.joinBatch(1)).wait();
    await (await batcher.connect(u2).joinBatch(2)).wait();

    // set relayer and "execute" swap. amountOut = 2_000_000 -> share = 1_000_000 each
    await (await batcher.setRelayer(await u1.getAddress())).wait();
    await (await batcher.onDecryptionResult(0, 2_000_000, 0)).wait();

    // prepare reenter payload: try to re-call claim from inside adapter.sweepWeth
    const reenterData = batcher.interface.encodeFunctionData("claim", [0, 1]);
    await (await ra.setWeth(wethDep.address)).wait();
    await (await ra.setBatcher(await batcher.getAddress())).wait();
    await (await ra.setReenter(reenterData)).wait();

    // balances before
    const b1Before = await weth.balanceOf(await u1.getAddress());

    // claim should succeed; internal reenter attempt must fail silently
    await (await batcher.claim(0, 1)).wait();

    // balances after: +1_000_000
    const b1After = await weth.balanceOf(await u1.getAddress());
    expect(b1After - b1Before).to.equal(1_000_000);
  });
});
