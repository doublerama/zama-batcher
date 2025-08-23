# Architecture

## Components
- **FHEIntentRegistry** — stores encrypted DCA params (budget, perTick, frequency, duration, aux) and builds an encrypted aggregate for a batch.
- **DCABatcher** — k/Δt triggers; emits `DecryptionRequested(aggregateCiphertext, intentIds)`; after the relayer callback executes a single USDC→ETH swap and assigns shares; users `claim`.
- **DEX adapter** — `DexAdapterUniswap` on Sepolia, `MockAdapter` for local tests. One swap per batch.
- **Offchain relayer** — listens to `DecryptionRequested`, decrypts (or simulates) the aggregate total, and calls `onDecryptionResult(batchId,totalUsdc,minOut)`.

## Batch lifecycle
1. Users submit encrypted intents to `FHEIntentRegistry`.
2. Users join the current queue (`joinBatch(intentId)`).
3. When `kMin` or `fallbackSeconds` is reached, batcher snapshots the queue and emits `DecryptionRequested`.
4. Relayer reveals **only the aggregate** total (FHE gateway in production) and calls `onDecryptionResult`.
5. Batcher executes **one** swap on Uniswap and assigns shares; users call `claim`.

## Privacy on chain
- Individual strategy parameters are never posted in plaintext.
- Observers see: batch size `k`, timestamps, one aggregated swap per batch, and `claim` txs. No per-user amount is revealed pre-swap.

## Extensibility
- Replace `contracts/fhe/FHEMock.sol` with real FHEVM types (`euint*`) and gateway ops.
- Proportional distribution: compute shares under FHE (enc_i / enc_total), reveal final amounts only for settlement.
