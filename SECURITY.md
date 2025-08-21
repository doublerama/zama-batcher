# Security & Threat Model (Starter)

- Admin parameters are controlled behind a timelock (to be added).
- Only **aggregated** batch amounts are revealed on-chain.
- Individual user strategy parameters are intended to be stored as encrypted values (euint) within fhEVM.
- Permissionless executor calls `executeBatch()` and receives a small reward.
- Pausing swaps (not withdrawals) may be allowed in emergencies.