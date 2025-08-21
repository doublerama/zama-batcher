import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("DCABatcher triggers", () => {
  it("emits DecryptionRequested when k intents joined (k-trigger)", async () => {
    await deployments.fixture(["core"]);
    const [user] = await ethers.getSigners();

    const regDep = await deployments.get("FHEIntentRegistry");
    const batcherDep = await deployments.get("DCABatcher");

    const reg = await ethers.getContractAt("FHEIntentRegistry", regDep.address, user);
    const batcher = await ethers.getContractAt("DCABatcher", batcherDep.address, user);

    // make it easy to trigger by k
    await (await batcher.setParams(2, 3600)).wait();

    // submit two encrypted intents (dummy bytes as placeholders)
    const tx1 = await reg.submitIntent("0x01", "0x02", "0x03", "0x04", "0x");
    const r1 = await tx1.wait();
    const id1 = await reg.nextId(); // will be 1 after first submit
    // join 1st (should NOT trigger yet)
    await (await batcher.joinBatch(Number(id1))).wait();

    const tx2 = await reg.submitIntent("0x11", "0x12", "0x13", "0x14", "0x");
    const r2 = await tx2.wait();
    const id2 = await reg.nextId(); // will be 2 after second submit

    // joining 2nd should trigger k condition
    await expect(batcher.joinBatch(Number(id2)))
      .to.emit(batcher, "BatchReady")
      .withArgs(0, 2)
      .and.to.emit(batcher, "DecryptionRequested");
  });

  it("emits DecryptionRequested when time window passed (Δt-trigger)", async () => {
    await deployments.fixture(["core"]);
    const [user] = await ethers.getSigners();

    const regDep = await deployments.get("FHEIntentRegistry");
    const batcherDep = await deployments.get("DCABatcher");

    const reg = await ethers.getContractAt("FHEIntentRegistry", regDep.address, user);
    const batcher = await ethers.getContractAt("DCABatcher", batcherDep.address, user);

    // make it hard to reach k, but short fallback window
    await (await batcher.setParams(10, 1)).wait();

    // 1 intent joined (no trigger yet)
    await (await reg.submitIntent("0xaa", "0xbb", "0xcc", "0xdd", "0x")).wait();
    const id1 = await reg.nextId();
    await (await batcher.joinBatch(Number(id1))).wait();

    // advance time > fallbackSeconds, then poke maybeExecuteBatch
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    await expect(batcher.maybeExecuteBatch())
      .to.emit(batcher, "BatchReady")
      .withArgs(0, 1)
      .and.to.emit(batcher, "DecryptionRequested");
  });
});
