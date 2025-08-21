import { expect } from "chai";
import { deployments } from "hardhat";

describe("Starter smoke", function () {
  it("deploys core contracts", async function () {
    await deployments.fixture(["core"]);

    const reg = await deployments.get("FHEIntentRegistry");
    const batcher = await deployments.get("DCABatcher");
    const uni = await deployments.getOrNull("DexAdapterUniswap");
    const mock = await deployments.getOrNull("MockAdapter");

    expect(reg.address).to.match(/^0x[0-9a-fA-F]{40}$/);
    expect(batcher.address).to.match(/^0x[0-9a-fA-F]{40}$/);
    expect(!!uni || !!mock, "one adapter should be deployed").to.equal(true);
  });
});
