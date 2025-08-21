import { expect } from "chai";
import { ethers, deployments, network } from "hardhat";

describe("DCABatcher triggers", function () {
  it("emits DecryptionRequested when k intents joined (k-trigger)", async function () {
    await deployments.fixture(["core"]);
    const [user] = await ethers.getSigners();

    const regAddr = (await deployments.get("FHEIntentRegistry")).address;
    const batAddr = (await deployments.get("DCABatcher")).address;

    const reg = await ethers.getContractAt("FHEIntentRegistry", regAddr, user);
    const batcher = await ethers.getContractAt("DCABatcher", batAddr, user);

    // require 2 intents to trigger by k
    await (await batcher.setParams(2, 3600)).wait();

    // create two intents (ids 1 and 2)
    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait();
    await (await reg.submitIntent("0x11","0x12","0x13","0x14","0x")).wait();

    // join with both intents; the second join should trigger the batch
    await (await batcher.joinBatch(1)).wait();
    await expect(batcher.joinBatch(2)).to.emit(batcher, "DecryptionRequested");
  });

  it("emits DecryptionRequested when time window passed (Δt-trigger)", async function () {
    await deployments.fixture(["core"]);
    const [user] = await ethers.getSigners();

    const regAddr = (await deployments.get("FHEIntentRegistry")).address;
    const batAddr = (await deployments.get("DCABatcher")).address;

    const reg = await ethers.getContractAt("FHEIntentRegistry", regAddr, user);
    const batcher = await ethers.getContractAt("DCABatcher", batAddr, user);

    // make k very large so only time window can trigger
    await (await batcher.setParams(99, 1)).wait();

    // create one intent (id 1) and join
    await (await reg.submitIntent("0xaa","0xbb","0xcc","0xdd","0x")).wait();
    await (await batcher.joinBatch(1)).wait();

    // advance time to pass fallbackSeconds
    await network.provider.send("evm_increaseTime", [2]);
    await network.provider.send("evm_mine");

    await expect(batcher.maybeExecuteBatch()).to.emit(batcher, "DecryptionRequested");
  });
});
