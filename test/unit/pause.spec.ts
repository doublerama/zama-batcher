import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("pause", function () {
  it("blocks joinBatch and performUpkeep when paused", async function () {
    await deployments.fixture(["core"]);
    const [user] = await ethers.getSigners();

    const regAddr = (await deployments.get("FHEIntentRegistry")).address;
    const batcherAddr = (await deployments.get("DCABatcher")).address;

    const reg = await ethers.getContractAt("FHEIntentRegistry", regAddr, user);
    const batcher = await ethers.getContractAt("DCABatcher", batcherAddr, user);

    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id=1

    await (await batcher.setPaused(true)).wait();

    await expect(batcher.joinBatch(1)).to.be.revertedWith("PAUSED");
    await expect(batcher.performUpkeep("0x")).to.be.revertedWith("PAUSED");
  });
});
