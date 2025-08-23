# Zama DCA Batcher (FHE-ready)

Privacy-preserving DCA bot with **transaction batching** on Sepolia. Users submit **encrypted DCA intents** (placeholder type today, FHE types when available). The batcher aggregates k intents (target k=10) or falls back after Δt, executes a **single USDC→WETH swap** on a DEX, and distributes WETH back **pro-rata**.

> This repo focuses on the onchain core + offchain relayer. Frontend is optional for the bounty and can be added later.

## Why batching?
- Obfuscates individual strategies (k-anonymity)
- Mitigates MEV & portfolio tracking
- One aggregated swap reveals only totals; per-user amounts remain hidden (encrypted at rest/in transit; computed under FHE once fhEVM is enabled)

## Contracts
- `contracts/FHEIntentRegistry.sol` — stores **encrypted** DCA parameters (today: `bytes` placeholder via `IFHENumeric.Cipher`)
- `contracts/DCABatcher.sol` — collects intents, triggers batch on **k** or **Δt**, calls DEX adapter, emits/handles decryption lifecycle, distributes WETH
- `contracts/DexAdapterUniswap.sol` — minimal Uniswap V3 adapter (Sepolia)
- `contracts/mocks/*` — test adapters & tokens (Noop/Reenter, MockERC20s)

## Offchain
- `offchain/relayer` — daemon that listens for `DecryptionRequested` and calls `onDecryptionResult(totalOut, …)` when:
  - `k` intents joined, or
  - time window Δt elapsed.
  - Uses a simple price source (router quote) for realism; **no private strategy data** is logged.

## Networks & addresses (Sepolia)
- **Router (UniswapV3)**: `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- **WETH**: `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`
- **USDC**: test/mocked ERC20 (or your Sepolia stable)

> You can override these via env or constructor params in deploy scripts.

## Setup
```bash
git clone <your-repo>
cd <your-repo>
npm i
