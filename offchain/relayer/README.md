# Minimal Relayer (MVP)

Listens for `DecryptionRequested(batchId, aggregateCiphertext, intentIds)` and
calls `onDecryptionResult(batchId, totalUsdc, minEthOut)` with a dummy total.

## Run locally

1. Copy `.env.example` to `.env` and set:
   - RPC_URL_SEPOLIA
   - PRIVATE_KEY (test wallet with a bit of Sepolia ETH)
   - BATCHER_ADDRESS (deployed DCABatcher)
2. `npm i`
3. `node offchain/relayer/index.js`
