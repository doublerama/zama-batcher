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