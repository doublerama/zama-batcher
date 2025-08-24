import { ethers } from "hardhat";

async function main() {
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  console.log("RPC chainId:", network.chainId.toString());
  const block = await provider.getBlockNumber();
  console.log("Current block:", block);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
