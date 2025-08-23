# Architecture

## Overview
This repository implements a privacy-preserving DCA bot with **transaction batching** on Sepolia. Users submit **encrypted DCA intents** (ciphertext placeholder type for now; to be swapped with FHE-native encrypted integers once fhEVM is available). The batcher aggregates `k` intents (target k=10) or falls back after a time window Δt, executes **one** USDC→WETH swap on a DEX, then distributes WETH **pro-rata** to participants.

This repo focuses on the on-chain core and an optional off-chain relayer. A separate frontend is not required for the bounty.

## Components
- **FHEIntentRegistry** – Stores user intents as ciphertext bytes (temporary type). Tracks per-pair batches and emits an event when a batch is ready to be executed.
- **DCABatcher** – Orchestrates batching and settlement. After a batch total is provided, calls a DEX adapter to perform a single swap and records each user’s share for later `claim()`.
- **DexAdapterUniswap** – Minimal Uniswap V3 adapter (ExactInputSingle) for USDC→WETH. Router/token/fee are configurable.
- **Relayer (optional, temporary)** – Listens for “batch ready” events and submits the decrypted **aggregate** amount (not individual amounts) back to the batcher. In the fhEVM phase this relayer becomes unnecessary because homomorphic sums happen on-chain.
- **Mocks** – Local testing only: mock tokens and a mock adapter.

## Data model (encrypted user strategy)
Per user intent, the following fields are encrypted and submitted to `FHEIntentRegistry`:
- **budget** – total USDC to invest
- **step** – purchase amount per interval
- **frequency** – interval configuration
- **duration** – total strategy length
- **dynamic rules (optional)** – e.g. “buy the dip” multipliers

All of the above are stored as ciphertext (bytes placeholder today). No plaintext per-user strategy data is written on-chain.

## Triggers
- **k-trigger**: the registry collects intents for the same trading pair; once `k` users joined, the batch becomes ready.
- **Δt-trigger**: if fewer than `k` users join within the time window, the batch becomes ready based on elapsed time.

## Batch lifecycle (happy path)
1. **Users submit intents** (encrypted fields) to `FHEIntentRegistry`.
2. **Batch readiness**: when `k` users have joined (or Δt elapsed), the registry emits `DecryptionRequested(batchId, encryptedAggregateHint, …)`.
3. **Relayer callback** (temporary): the relayer decrypts or otherwise derives the **total** USDC amount for this batch and calls `DCABatcher.onDecryptionResult(batchId, totalAmountIn)`.
4. **DEX swap**: `DCABatcher` calls `DexAdapterUniswap.swapUsdcToEth(totalAmountIn, minOut)` and receives WETH.
5. **Pro-rata accounting**: the batcher attributes WETH shares to each participant proportionally to their (encrypted) contribution within the batch.
6. **Claim**: users call `claim(batchId)` to receive their WETH share.

Only the **aggregate** swap (total USDC in, total WETH out) appears on-chain. Individual user amounts remain hidden.

## Privacy model
- **What observers see**: one aggregated swap per batch; total USDC in and total WETH out; batch identifiers.
- **What observers do not see**: per-user budget/step/frequency/duration/rules; who contributed what; timing patterns of a single user.
- **Why batching helps**: k-anonymity by mixing intents; a single trade minimizes MEV surface and portfolio tracking.

## Security considerations
- **Reentrancy**: guarded on `claim` and settlement paths.
- **Duplicate join/claim**: explicit checks to prevent submitting the same intent twice or claiming twice.
- **Paused mode**: governor can pause swap execution in case of incidents; withdrawals/claims remain possible.
- **Relayer trust**: the relayer is **permissionless** and cannot steal funds. If it withholds results, another relayer can submit. In fhEVM mode, relayer is removed.

## DEX integration
- Current adapter targets Uniswap V3 `exactInputSingle` (USDC→WETH) on Sepolia.
- Router, token addresses and pool fee are configurable via `configure(router, usdc, weth, poolFee)`.
- Slippage is controlled via `minOut` forwarded from the batcher.

## Migration to fhEVM
When fhEVM primitives are available:
1. Replace placeholder ciphertext `bytes` with FHE-native encrypted integer types.
2. Move aggregate sum and pro-rata division from the relayer into on-chain FHE operations.
3. Keep public APIs stable so frontends do not break.

## Non-goals
- Advanced multi-DEX routing and limit orders are out-of-scope.
- Bidirectional batching (ETH→USDC) is intentionally excluded for the bounty scope.
