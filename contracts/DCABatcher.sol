// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DCABatcher (starter)
 * @notice Aggregates encrypted intents and triggers a single USDC→ETH swap for a batch.
 *         This starter does NOT include real FHE yet; it's a scaffold for wiring fhEVM.
 */
contract DCABatcher {
    // TODO: wire to FHEIntentRegistry, Uniswap adapter, and relayer callback
    event DecryptionRequested(bytes encryptedTotal);
    event BatchExecuted(uint256 totalInUsdc, uint256 receivedEth);

    uint256 public kMin = 10;
    uint256 public fallbackSeconds = 60;
    uint256 public lastBatchTs;

    function setParams(uint256 _kMin, uint256 _fallbackSeconds) external {
        // TODO: access control / timelock
        require(_kMin > 0, "k>0");
        kMin = _kMin;
        fallbackSeconds = _fallbackSeconds;
    }

    function maybeExecuteBatch() external {
        // TODO: check number of active intents >= kMin OR (block.timestamp - lastBatchTs) >= fallbackSeconds
        // TODO: request decryption for aggregated total (emit DecryptionRequested)
        // TODO: in callback, execute USDC→ETH swap via DexAdapterUniswap and then distribute
    }

    // TODO: add callback entry for relayer to provide decrypted total and proceed with swap
}