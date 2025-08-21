const { ethers } = require("ethers");
require("dotenv").config();

const RPC = process.env.RPC_URL_SEPOLIA;
const PK  = process.env.PRIVATE_KEY;
const BATCHER = process.env.BATCHER_ADDRESS;

const abi = [
  "event DecryptionRequested(uint256 indexed batchId, bytes aggregateCiphertext, uint256[] intentIds)",
  "function onDecryptionResult(uint256 batchId, uint256 totalUsdc, uint256 minEthOut) external",
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(PK, provider);
  const batcher = new ethers.Contract(BATCHER, abi, wallet);

  console.log("Relayer listening…");
  batcher.on("DecryptionRequested", async (batchId, agg, ids, ev) => {
    try {
      console.log(`Batch ${batchId} requested, size=${ids.length}`);
      // TODO: call FHE gateway to decrypt aggregate; here we fake total:
      const totalUsdc = BigInt(ids.length) * 1000000n; // 1 USDC * size (6 decimals)
      const minEthOut = 0n;
      const tx = await batcher.onDecryptionResult(batchId, totalUsdc, minEthOut);
      console.log("Callback tx:", tx.hash);
      await tx.wait();
      console.log("Callback mined.");
    } catch (e) {
      console.error("Relayer error:", e);
    }
  });
}

main().catch(console.error);
