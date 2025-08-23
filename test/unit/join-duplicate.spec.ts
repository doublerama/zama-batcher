import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("joinBatch duplicate protection", function () {
  it("reverts when the same intent joins twice", async function () {
    await deployments.fixture(["core"]);
    const [user] = await ethers.getSigners();

    const reg = await ethers.getContract("FHEIntentRegistry", user);
    const batcher = await ethers.getContract("DCABatcher", user);

    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id = 1

    await (await batcher.setParams(3, 3600)).wait(); // prevent auto-trigger

    await (await batcher.joinBatch(1)).wait();
    await expect(batcher.joinBatch(1)).to.be.revertedWith("already queued");
  });
});
