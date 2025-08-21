import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("E2E with MockAdapter", function () {
  it("performs batch swap & users claim equal WETH shares", async function () {
    await deployments.fixture(["core"]);

    // Run this E2E only when the mock stack is deployed
    const adapterDep = await deployments.getOrNull("MockAdapter");
    const usdcDep    = await deployments.getOrNull("MockERC20");    // mUSDC
    const wethDep    = await deployments.getOrNull("MockERC20_1");  // mWETH
    if (!adapterDep || !usdcDep || !wethDep) {
      console.log("Skipping mock E2E: mocks not deployed in this run");
      this.skip(); // properly mark as skipped
    }

    const [user1, user2] = await ethers.getSigners();

    const regDep = await deployments.get("FHEIntentRegistry");
    const batDep = await deployments.get("DCABatcher");

    const reg = await ethers.getContractAt("FHEIntentRegistry", regDep.address, user1);
    const batcher = await ethers.getContractAt("DCABatcher", batDep.address, user1);

    const usdc = await ethers.getContractAt("MockERC20", usdcDep!.address, user1);
    const weth = await ethers.getContractAt("MockERC20", wethDep!.address, user1);

    // Fund adapter with USDC so it can "burn" and mint WETH 1:1
    await (await usdc.mint(adapterDep!.address, 2_000_000)).wait(); // 2 USDC (6 decimals)

    // k=2 so the batch triggers with two intents
    await (await batcher.setParams(2, 3600)).wait();

    // intents: #1 by user1, #2 by user2
    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id=1
    const regUser2 = reg.connect(user2);
    await (await regUser2.submitIntent("0xa1","0xa2","0xa3","0xa4","0x")).wait(); // id=2

    // both join
    await (await batcher.joinBatch(1)).wait();
    await (await batcher.connect(user2).joinBatch(2)).wait();

    // relayer callback with totalUsdc=2 USDC
    await (await batcher.setRelayer(await user1.getAddress())).wait();
    await (await batcher.onDecryptionResult(0, 2_000_000, 0)).wait();

    // each receives 1 USDC worth of WETH
    const b1Before = await weth.balanceOf(await user1.getAddress());
    await (await batcher.claim(0, 1)).wait();
    const b1After = await weth.balanceOf(await user1.getAddress());
    expect(b1After - b1Before).to.equal(1_000_000);

    const wethAsUser2 = weth.connect(user2);
    const b2Before = await wethAsUser2.balanceOf(await user2.getAddress());
    await (await batcher.connect(user2).claim(0, 2)).wait();
    const b2After = await wethAsUser2.balanceOf(await user2.getAddress());
    expect(b2After - b2Before).to.equal(1_000_000);
  });
});
