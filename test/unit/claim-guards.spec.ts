import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("claim guards", function () {
  it("prevents double claim and non-owner claim; requires executed batch", async function () {
    await deployments.fixture(["core"]);
    const [u1, u2] = await ethers.getSigners();

    const regDep = await deployments.get("FHEIntentRegistry");
    const batcherDep = await deployments.get("DCABatcher");

    const reg = await ethers.getContractAt("FHEIntentRegistry", regDep.address, u1);
    const batcher = await ethers.getContractAt("DCABatcher", batcherDep.address, u1);

    // two intents
    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id = 1 (u1)
    const reg2 = reg.connect(u2);
    await (await reg2.submitIntent("0x11","0x12","0x13","0x14","0x")).wait(); // id = 2 (u2)

    // form a batch of 2 so it can be executed
    await (await batcher.setParams(2, 3600)).wait();
    await (await batcher.joinBatch(1)).wait();
    await (await batcher.connect(u2).joinBatch(2)).wait();

    // --- FUND BATCHER WITH MOCK USDC BEFORE swap ---
    // In fixtures: MockERC20_0 is USDC, MockERC20_1 is WETH
    const usdcDep = await deployments.getOrNull("MockERC20_0");
    if (usdcDep) {
      const usdc = await ethers.getContractAt("MockERC20", usdcDep.address, u1);
      // amountIn that our test swap will consume (2_000_000)
      await (await usdc.mint(batcherDep.address, 2_000_000)).wait();
    }

    // simulate relayer decrypt result: totalOut = 2_000_000 -> 1_000_000 each
    await (await batcher.setRelayer(await u1.getAddress())).wait();
    await (await batcher.onDecryptionResult(0, 2_000_000, 0)).wait();

    // u1 claims once
    await (await batcher.claim(0, 1)).wait();
    await expect(batcher.claim(0, 1)).to.be.revertedWith("already claimed");

    // u2 cannot claim for u1
    await expect(batcher.connect(u2).claim(0, 1)).to.be.revertedWith("not owner");

    // requires executed batch for a later intent
    await (await reg.submitIntent("0x21","0x22","0x23","0x24","0x")).wait(); // id = 3 (u1)
    await expect(batcher.claim(1, 3)).to.be.revertedWith("batch not executed");
  });
});
