# Deployments

## Sepolia — 2025-08-24

### FHEIntentRegistry
- Address: [0x033eF945C847bC95df6E876D9D4dd595A66d388a](https://sepolia.etherscan.io/address/0x033eF945C847bC95df6E876D9D4dd595A66d388a)
- Deploy tx: [0x4dd4641c0570a6a8d472fa2a8354743213c1ede7a0d086cc811217a8d492dea1](https://sepolia.etherscan.io/tx/0x4dd4641c0570a6a8d472fa2a8354743213c1ede7a0d086cc811217a8d492dea1)
- Gas used: **749,657**

---

### DCABatcher
- Address: [0xb64De059d3827BF916c9f07762C3D8B6A96A23f2](https://sepolia.etherscan.io/address/0xb64De059d3827BF916c9f07762C3D8B6A96A23f2)
- Deploy tx: [0x5984aebe1de1486239528c6fca94f1ae2dec6879f46cdcd0762795b98c0d368c](https://sepolia.etherscan.io/tx/0x5984aebe1de1486239528c6fca94f1ae2dec6879f46cdcd0762795b98c0d368c)
- Gas used: **1,485,895**
- Post-deploy:
  - `setDexAdapter` tx: [0x1ae1e1672472cccbcc2347e4c3481251f513b2fa76eb3ac060186ba576ffaedc](https://sepolia.etherscan.io/tx/0x1ae1e1672472cccbcc2347e4c3481251f513b2fa76eb3ac060186ba576ffaedc) — gas **46,082**

---

### DexAdapterUniswap
- Address: [0x86DA8dC560EbEae631Ae138b9a8d437a1ad7D496](https://sepolia.etherscan.io/address/0x86DA8dC560EbEae631Ae138b9a8d437a1ad7D496)
- Deploy tx: [0xebe60d1091a914987c1e7838c1a359fd003b6f63a579a0f93d0b1eee2c0009dd](https://sepolia.etherscan.io/tx/0xebe60d1091a914987c1e7838c1a359fd003b6f63a579a0f93d0b1eee2c0009dd)
- Gas used: **557,247**
- Post-deploy configure:
  - `setBatcher` tx: [0x32900f8af60514d210fc1249a36054ed4bdb7c169cc784a8c0b2ff79beee158a](https://sepolia.etherscan.io/tx/0x32900f8af60514d210fc1249a36054ed4bdb7c169cc784a8c0b2ff79beee158a) — gas **44,979**
  - `configure` tx: [0x1a1b4587dd5d2c8c020b4feafb6f5c496b9d1169ef558b477a7fe0708550495d](https://sepolia.etherscan.io/tx/0x1a1b4587dd5d2c8c020b4feafb6f5c496b9d1169ef558b477a7fe0708550495d) — gas **91,325**
  - Inputs: `router=0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`, `USDC=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`, `WETH=0xfff9976782d46cc05630d1f6ebab18b2324d6b14`, `poolFee=3000`

---

### Summary
- Router (Uniswap V3): `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`
- USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- WETH: `0xfff9976782d46cc05630d1f6ebab18b2324d6b14`
- Pool fee: `3000`
