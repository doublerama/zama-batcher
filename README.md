# Zama DCA Batcher (Starter)

Privacy-preserving DCA bot prototype using FHE + batching (USDC→ETH on Uniswap, Sepolia).  
This is a **starter scaffold** to help you submit to the Zama Bounty. Contracts are minimal and include TODOs
where FHE (euint) logic and relayer callbacks should be added.

## Quick start
1. Install: `npm i`
2. Build: `npx hardhat compile`
3. Test:  `npx hardhat test`

## What’s inside
- `contracts/` – placeholder contracts:
  - `FHEIntentRegistry.sol` – stores encrypted DCA intents (TODO: replace with fhEVM euint types).
  - `DCABatcher.sol` – aggregates intents, triggers batch, executes 1 swap USDC→ETH (TODO: hook Uniswap + relayer).
  - `DexAdapterUniswap.sol` – minimal adapter interface (TODO: implement real swap).
  - `libraries/FHEMath.sol` – helpers (TODO: add FHE ops).
- `offchain/` – placeholders for the permissionless executor and the gateway listener.
- `deploy/` – example Hardhat Deploy script.
- `test/` – smoke test.

## Environment
Copy `.env.example` to `.env` and fill if needed.

## How privacy is preserved
- Users submit encrypted DCA intents (budget, per-interval amount, frequency, duration).
- Batching provides k-anonymity (k configurable, default 10).
- Only an aggregated ciphertext is emitted on-chain; individual amounts never appear on-chain.
- A single swap USDC→ETH is executed for the total amount.
- Distribution is computed under FHE (MVP: equal share; next: proportional shares under FHE).
- Users claim privately from a pooled adapter; per-user amounts are not emitted.

## Decentralization
- Permissionless batching via `maybeExecuteBatch()`.
- Chainlink Automation–compatible (`checkUpkeep`/`performUpkeep`).

## DEX integration
- Uniswap V3 SwapRouter02 adapter (`DexAdapterUniswap`) with real `exactInputSingle`.
- Sepolia addresses configurable via `.env`.

## What can observers see on-chain?
- Batch size and the single USDC→ETH swap total.
- No per-user strategy or per-interval amounts.
- No individual transfers at execute time (distribution happens from a pooled adapter).

## Strategy confidentiality
- Encrypted: budget, per-interval, frequency, duration, optional dip factor.
- Flexible privacy knobs: k, Δt, relayer/gateway trust model, optional Automation.

## Testing & CI
- Unit tests for k/Δt triggers and claim flow, GH Actions CI.
- Gas/coverage to be added with `hardhat-gas-reporter` and `solidity-coverage`.

## Next steps (FHE)
- Replace `FHENumeric.Cipher` with fhEVM `euintX` types.
- Aggregate amounts with FHE ops; decrypt only the total via Zama gateway.
- Compute proportional shares under FHE; store encrypted allocations for private claim.
