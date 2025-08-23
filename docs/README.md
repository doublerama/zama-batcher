# Zama DCA Batcher (FHE-ready)

Privacy-preserving DCA bot with **transaction batching** on Sepolia. Users submit **encrypted DCA intents** (ciphertext placeholder type for now). The batcher aggregates `k` intents or falls back after Δt, executes a **single** USDC→WETH swap on a DEX (Uniswap V3), and distributes WETH **pro-rata**. Individual strategies stay hidden; on-chain observers only see the aggregated swap.

> This repo focuses on on-chain contracts and an optional relayer. A separate frontend is not required for the bounty.

---

## Key features

- **Batching for privacy (k-anonymity):** one aggregated swap per batch, not per user.
- **Encrypted strategy params:** budget, step (per-interval), frequency, duration, and optional dynamic rules are stored as ciphertext.
- **DEX integration:** minimal Uniswap V3 adapter (ExactInputSingle) for USDC→WETH on Sepolia.
- **Two triggers for execution:** `k` users per pair **or** Δt elapsed.
- **Pro-rata settlement:** users claim WETH shares after batch execution.
- **FHE-ready:** placeholder ciphertext types can be swapped for fhEVM encrypted integers.

---

## Repository layout

