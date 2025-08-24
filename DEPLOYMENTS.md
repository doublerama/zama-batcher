# Deployments

Network: **Ethereum Sepolia**

## Parameters

- Uniswap V3 Router: `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- WETH: `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`
- Pool fee (Uniswap V3): `3000` (0.3%)

## Contracts

### FHEIntentRegistry
- Address: `0xAfEb7273B9E2E939533a5C2f5C05fBa334B5FF13`
- Deploy tx: `0x24966bdf29dc85357ae4bdfc72002963e9f544743d94bc5678d022e1aa6f504b`
- Gas used: `749,657`

### DexAdapterUniswap
- Address: `0x7c1D2783d8652f49ee79323868A5982cC4E9c087`
- Deploy tx: `0xa0647d2866c3b0eaccdbedb634c6919b79b33b0c8f2f2fc67cb237789bc52e45`
- Gas used: `557,247`
- Post-deploy configure:
  - Tx: `0xfe58174ad0caa4a5926da3c4a32b1cca2943e5872cd1afc14c1e3cb3df9fd461`
  - Gas used: `91,325`
  - Inputs: router, USDC (placeholder in mock env), WETH, poolFee=3000

### DCABatcher
- Address: `0x3B3e5949EA56A6cf332Be0D9a7F3cE1BFDCe8785`
- Deploy tx: `0xe252e787eabb316541db38378d4d493968eb1967b02f4b26a6fabdfee014faad`
- Gas used: `1,485,895`
- Notes: no on-chain “batch params setter” found, skipping.

---

### Summary

- `FHEIntentRegistry`: `0xAfEb7273B9E2E939533a5C2f5C05fBa334B5FF13`
- `DexAdapterUniswap`: `0x7c1D2783d8652f49ee79323868A5982cC4E9c087`
- `DCABatcher`: `0x3B3e5949EA56A6cf332Be0D9a7F3cE1BFDCe8785`

Artifacts for this run are uploaded under **Actions → Artifacts** as `deployments-sepolia-<run_id>`.
