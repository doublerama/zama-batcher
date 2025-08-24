# Zama DCA Batcher (FHE-ready)

Privacy-preserving DCA bot with **transaction batching** on Sepolia. Users submit **encrypted DCA intents** (ciphertext placeholder type for now). The batcher aggregates `k` intents or falls back after Δt, executes a **single** USDC→WETH swap on a DEX (Uniswap V3), and distributes WETH **pro-rata**. Individual strategies stay hidden; on-chain observers only see the aggregated swap.

> This repo focuses on on-chain contracts and an optional relayer. A separate frontend is not required for the bounty.

## Key features

- **Batching for privacy (k-anonymity):** one aggregated swap per batch, not per user.
- **Encrypted strategy params:** budget, step (per-interval), frequency, duration, and optional dynamic rules are stored as ciphertext.
- **DEX integration:** minimal Uniswap V3 adapter (ExactInputSingle) for USDC→WETH on Sepolia.
- **Two triggers for execution:** `k` users per pair **or** Δt elapsed.
- **Pro-rata settlement:** users claim WETH shares after batch execution.
- **FHE-ready:** placeholder ciphertext types can be swapped for fhEVM encrypted integers.

## Quick start (local)

```bash
npm i
npx hardhat test

## Sepolia Deployments

- **FHEIntentRegistry:** `0xAfEb7273B9E2E939533a5C2f5C05fBa334B5FF13`
- **DexAdapterUniswap:** `0x7c1D2783d8652f49ee79323868A5982cC4E9c087`
- **DCABatcher:** `0x3B3e5949EA56A6cf332Be0D9a7F3cE1BFDCe8785`

Parameters:
- Uniswap V3 Router: `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- WETH: `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`
- Pool fee: `3000` (0.3%)

> Detailed log: see `DEPLOYMENTS.md`.

