import { expect } from "chai";
import { deployments, ethers } from "hardhat";

describe("Claim guards", function () {
  it("prevents double claim and non-owner claim; requires executed batch", async function () {
    await deployments.fixture(["core"]);
    const [u1, u2] = await ethers.getSigners();

    const reg = await ethers.getContract("FHEIntentRegistry", u1);
    const batcher = await ethers.getContract("DCABatcher", u1);

    const mockAdapter = await deployments.getOrNull("MockAdapter");
    const mUSDC = await deployments.getOrNull("MockERC20");
    const mWETH = await deployments.getOrNull("MockERC20_1");
    if (!mockAdapter || !mUSDC || !mWETH) this.skip();

    const usdc = await ethers.getContractAt("MockERC20", mUSDC.address, u1);
    const weth = await ethers.getContractAt("MockERC20", mWETH.address, u1);

    await (await usdc.mint(mockAdapter.address, 2_000_000)).wait();

    await (await batcher.setParams(2, 3600)).wait();

    await (await reg.submitIntent("0x01","0x02","0x03","0x04","0x")).wait(); // id=1 owner=u1
    const reg2 = reg.connect(u2);
    await (await reg2.submitIntent("0x11","0x12","0x13","0x14","0x")).wait(); // id=2 owner=u2

    await (await batcher.joinBatch(1)).wait();
    await (await batcher.connect(u2).joinBatch(2)).wait();

    await expect(batcher.claim(0, 1)).to.be.revertedWith("batch not executed");

    await (await batcher.setRelayer(await u1.getAddress())).wait();
    await (await batcher.onDecryptionResult(0, 2_000_000, 0)).wait();

    await expect(batcher.connect(u2).claim(0, 1)).to.be.revertedWith("not owner");

    const before = await weth.balanceOf(await u1.getAddress());
    await (await batcher.claim(0, 1)).wait();
    const after = await weth.balanceOf(await u1.getAddress());
    expect(after - before).to.equal(1_000_000);

    await expect(batcher.claim(0, 1)).to.be.revertedWith("already claimed");
  });
});
