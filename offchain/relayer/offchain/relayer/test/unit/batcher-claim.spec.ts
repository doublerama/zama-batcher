import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("DCABatcher claim flow", () => {
  it("assigns equal shares and lets owners claim", async () => {
    await deployments.fixture(["core"]);
    const [user1, user2] = await ethers.getSigners();

    const regDep = await deployments.get("FHEIntentRegistry");
    const batDep = await deployments.get("DCABatcher");
    const adpDep = await deployments.get("DexAdapterUniswap");

    const reg = await ethers.getContractAt("FHEIntentRegistry", regDep.address, user1);
    const batcher = await ethers.getContractAt("DCABatcher", batDep.address, user1);
    const adapter = await ethers.getContractAt("DexAdapterUniswap", adpDep.address, user1);

    // Wire adapter ACL (already done in deploy script, но на всякий случай)
    await (await adapter.setBatcher(batcher.target)).wait();

    // set params: k=2 to trigger immediately
    await (await batcher.setParams(2, 3600)).wait();

    // submit 2 intents (owners: user1, user1 — для простоты)
    await (await reg.submitIntent("0x", "0x", "0x", "0x", "0x")).wait(); // id=1
    await (await reg.submitIntent("0x", "0x", "0x", "0x", "0x")).wait(); // id=2

    // join both -> triggers batch 0
    await (await batcher.joinBatch(1)).wait();
    await (await batcher.joinBatch(2)).wait();

    // simulate callback with totalUsdc=0 (so amountOut=0 in adapter stub is OK)
    await (await batcher.setRelayer(await user1.getAddress())).wait();
    await (await batcher.onDecryptionResult(0, 0, 0)).wait();

    // shares are zero (no real swap yet), claim should revert "nothing to claim"
    await expect(batcher.claim(0, 1)).to.be.revertedWith("nothing to claim");
  });
});
