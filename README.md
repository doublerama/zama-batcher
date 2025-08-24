# Zama DCA Batcher (FHE-ready)

Privacy-preserving DCA bot with **transaction batching** on Sepolia. Users submit **encrypted DCA intents** (placeholder type today, FHE types when available). The batcher aggregates k intents (target k=10) or falls back after Δt, executes a **single USDC→WETH swap** on a DEX, and distributes WETH back **pro-rata**.

> This repo focuses on the onchain core + offchain relayer. Frontend is optional for the bounty and can be added later.

## Why batching?
- Obfuscates individual strategies (k-anonymity)
- Mitigates MEV & portfolio tracking
- One aggregated swap reveals only totals; per-user amounts remain hidden (encrypted at rest/in transit; computed under FHE once fhEVM is enabled)

## Contracts (Sepolia)

- **FHEIntentRegistry**: `0x033eF945C847bC95df6E876D9D4dd595A66d388a`
  - Deploy tx: `0x4dd4641c0570a6a8d472fa2a8354743213c1ede7a0d086cc811217a8d492dea1`
- **DexAdapterUniswap**: `0x86DA8dC560EbEae631Ae138b9a8d437a1ad7D496`
  - Deploy tx: `0xebe60d1091a914987c1e7838c1a359fd003b6f63a579a0f93d0b1eee2c0009dd`
  - Post-deploy:
    - `setBatcher` tx: `0x32900f8af60514d210fc1249a36054ed4bdb7c169cc784a8c0b2ff79beee158a`
    - `configure` tx: `0x1a1b4587dd5d2c8c020b4feafb6f5c496b9d1169ef558b477a7fe0708550495d`
- **DCABatcher**: `0xb64De059d3827BF916c9f07762C3D8B6A96A23f2`
  - Deploy tx: `0x5984aebe1de1486239528c6fca94f1ae2dec6879f46cdcd0762795b98c0d368c`
  - Post-deploy:
    - `setDexAdapter` tx: `0x1ae1e1672472cccbcc2347e4c3481251f513b2fa76eb3ac060186ba576ffaedc`

**Uniswap (Sepolia)**
- Router: `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- USDC:   `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- WETH:   `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`
- Pool fee: `3000`


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

## Submission

**Project:** Zama DCA Batcher (FHE-ready)

This repository implements a privacy-preserving DCA bot with on-chain batching (k-anonymity target) and a minimal Uniswap adapter for USDC→WETH on Sepolia. Users submit encrypted DCA intents (placeholder ciphertext type today), the batcher aggregates intents, executes a single swap on the DEX, and distributes shares pro-rata.

### What’s included
- On-chain contracts:
  - `FHEIntentRegistry` – stores encrypted intents (temporary bytes-cipher type, FHE types pluggable).
  - `DCABatcher` – joins intents into a batch (k-trigger or Δt fallback), executes swap via adapter, tracks shares, prevents double claim.
  - `DexAdapterUniswap` – minimal USDC→WETH adapter (exactInputSingle) with `configure(router, usdc, weth, poolFee)`.
- Tests (Hardhat): batch triggers (k/Δt), pause, reentrancy/claim guards, duplicate intent protection, smoke.
- CI: compile + test on pushes/PRs.
- Deploy scripts + post-deploy configuration.
- Docs: overview, architecture, usage.
- `DEPLOYMENTS.md` with addresses and tx hashes.

### How to run locally (quick)
```bash
npm i
npx hardhat test
# deploy to Sepolia (needs RPC + funded EOA):
# npx hardhat deploy --network sepolia

### Sepolia deployments
(Full details and tx hashes are in [`DEPLOYMENTS.md`](./DEPLOYMENTS.md).)

- **FHEIntentRegistry:** `0x033eF945C847bC95df6E876D9D4dd595A66d388a`
- **DexAdapterUniswap:** `0x86DA8dC560EbEae631Ae138b9a8d437a1ad7D496`
- **DCABatcher:** `0xb64De059d3827BF916c9f07762C3D8B6A96A23f2`

**Uniswap (Sepolia) params**
- Router: `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- USDC:   `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- WETH:   `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`
- Pool fee: `3000`

### Notes
- FHE numeric types are mocked with a temporary `bytes`-based cipher wrapper; the design is ready to switch to native FHE types on fhEVM.
- Swaps are unidirectional USDC→WETH, as required by the bounty scope.

