import { expect } from "chai";
import { ethers, deployments } from "hardhat";

describe("Starter smoke", () => {
  it("deploys core contracts", async () => {
    await deployments.fixture(["core"]);

    // addresses из hardhat-deploy
    const reg = await deployments.get("FHEIntentRegistry");
    const batcher = await deployments.get("DCABatcher");
    const adapter = await deployments.get("DexAdapterUniswap");

    // просто проверим, что адреса валидные
    expect(ethers.isAddress(reg.address)).to.eq(true);
    expect(ethers.isAddress(batcher.address)).to.eq(true);
    expect(ethers.isAddress(adapter.address)).to.eq(true);

    // и что контракт реально существует (публичное поле возвращает 0n)
    const regC = await ethers.getContractAt("FHEIntentRegistry", reg.address);
    const next = await regC.nextId();
    expect(next).to.equal(0n);
  });
});
