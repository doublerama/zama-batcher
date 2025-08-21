import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("Starter smoke", function () {
  it("deploys core contracts", async function () {
    await deployments.fixture(["core"]);
    const reg = await ethers.getContract("FHEIntentRegistry");
    const batcher = await ethers.getContract("DCABatcher");
    const adapter = await ethers.getContract("DexAdapterUniswap");
    expect(reg.address).to.properAddress;
    expect(batcher.address).to.properAddress;
    expect(adapter.address).to.properAddress;
  });
});