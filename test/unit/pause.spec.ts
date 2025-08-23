import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("pause", function () {
  it("blocks joinBatch and performUpkeep when paused", async function () {
    await deployments.fixture(["core"]);
    const [user] = await ethers.getSigners();
    const reg = await ethers.getContract("FHEIntentRegistry", user);
    const batcher = await ethers.getContract("DCABatcher", user);

    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id=1

    await (await batcher.setPaused(true)).wait();

    await expect(batcher.joinBatch(1)).to.be.revertedWith("PAUSED");
    await expect(batcher.performUpkeep("0x")).to.be.revertedWith("PAUSED");
  });
});
