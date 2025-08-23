import { ethers } from "hardhat";

/**
 * Post-deploy configuration for DexAdapterUniswap.
 *
 * Usage examples:
 *   npx hardhat run scripts/configure-adapter.ts --network sepolia
 *   UNISWAP_ROUTER=0x... WETH=0x... USDC=0x... UNISWAP_POOL_FEE=3000 npx hardhat run scripts/configure-adapter.ts --network sepolia
 *
 * Notes:
 * - Reads the deployed "DexAdapterUniswap" from hardhat-deploy artifacts.
 * - Requires a signer on live networks (PRIVATE_KEY / RPC in .env or GH Secrets).
 */

async function main() {
  const { deployments } = await import("hardhat");

  // Read addresses from env or use sensible defaults (Sepolia examples).
  const router =
    process.env.UNISWAP_ROUTER ??
    "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E"; // Uniswap V3 Router on Sepolia (verify before use)
  const weth =
    process.env.WETH ??
    "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; // Canonical WETH on Sepolia (verify before use)
  const usdc =
    process.env.USDC ?? ethers.ZeroAddress; // set your USDC (or mock) address on Sepolia
  const poolFee = Number(process.env.UNISWAP_POOL_FEE ?? "3000"); // 0.3% tier

  if (!router || !weth) {
    throw new Error("Missing UNISWAP_ROUTER or WETH address");
  }
  if (poolFee !== 500 && poolFee !== 3000 && poolFee !== 10000) {
    throw new Error("UNISWAP_POOL_FEE must be one of 500, 3000, 10000");
  }

  const dep = await deployments.get("DexAdapterUniswap");
  const adapter = await ethers.getContractAt("DexAdapterUniswap", dep.address);

  console.log("[configure-adapter] Using adapter:", dep.address);
  console.log("[configure-adapter] Params:", { router, usdc, weth, poolFee });

  // Call configure(router, usdc, weth, poolFee)
  const tx = await adapter.configure(router, usdc, weth, poolFee);
  console.log("[configure-adapter] Sent tx:", tx.hash);
  await tx.wait();
  console.log("[configure-adapter] Configured.");

  // Try to read back (if adapter exposes public getters/vars).
  try {
    // @ts-ignore - best-effort reads
    const r = await (adapter as any).router();
    // @ts-ignore
    const u = await (adapter as any).usdc();
    // @ts-ignore
    const w = await (adapter as any).weth();
    // @ts-ignore
    const f = await (adapter as any).poolFee();
    console.log("[configure-adapter] Current state:", { router: r, usdc: u, weth: w, poolFee: Number(f) });
  } catch {
    console.log("[configure-adapter] State getters not available; skipped read-back.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
