import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("claim guards", function () {
  it("prevents double claim and non-owner claim; requires executed batch", async function () {
    await deployments.fixture(["core"]);
    const [u1, u2] = await ethers.getSigners();

    const regAddr = (await deployments.get("FHEIntentRegistry")).address;
    const batcherAddr = (await deployments.get("DCABatcher")).address;

    const reg = await ethers.getContractAt("FHEIntentRegistry", regAddr, u1);
    const batcher = await ethers.getContractAt("DCABatcher", batcherAddr, u1);

    // two intents
    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id = 1 (u1)
    const reg2 = reg.connect(u2);
    await (await reg2.submitIntent("0x11","0x12","0x13","0x14","0x")).wait(); // id = 2 (u2)

    // create a batch and execute the swap (simulate relayer)
    await (await batcher.setParams(2, 3600)).wait();
    await (await batcher.joinBatch(1)).wait();
    await (await batcher.connect(u2).joinBatch(2)).wait();
    await (await batcher.setRelayer(await u1.getAddress())).wait();
    await (await batcher.onDecryptionResult(0, 2_000_000, 0)).wait();

    // u1 claims once
    await (await batcher.claim(0, 1)).wait();
    await expect(batcher.claim(0, 1)).to.be.revertedWith("already claimed");

    // u2 cannot claim for u1
    await expect(batcher.connect(u2).claim(0, 1)).to.be.revertedWith("not owner");

    // requires executed batch
    await (await reg.submitIntent("0x21","0x22","0x23","0x24","0x")).wait(); // id = 3 (u1)
    await expect(batcher.claim(1, 3)).to.be.revertedWith("batch not executed");
  });
});
