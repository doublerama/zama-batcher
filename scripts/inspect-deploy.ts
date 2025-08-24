import { ethers } from "hardhat";

const REGISTRY = "0x033eF945C847bC95df6E876D9D4dd595A66d388a";
const BATCHER  = "0xb64De059d3827BF916c9f07762C3D8B6A96A23f2";
const ADAPTER  = "0x86DA8dC560EbEae631Ae138b9a8d437a1ad7D496";

async function main() {
  const [signer] = await ethers.getSigners();

  const registry = await ethers.getContractAt("FHEIntentRegistry", REGISTRY, signer);
  const batcher  = await ethers.getContractAt("DCABatcher", BATCHER, signer);
  const adapter  = await ethers.getContractAt("DexAdapterUniswap", ADAPTER, signer);

  console.log("== Registry ==");
  console.log("address:", await registry.getAddress());

  console.log("\n== Batcher ==");
  console.log("address:", await batcher.getAddress());
  console.log("adapter:", await batcher.adapter());

  console.log("\n== Adapter ==");
  console.log("address:", await adapter.getAddress());
  console.log("router:", await adapter.router());
  console.log("weth:", await adapter.weth());
  console.log("poolFee:", (await adapter.poolFee()).toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
