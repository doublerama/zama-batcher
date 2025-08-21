// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev minimal interface of the intent registry
interface IIntentRegistry {
    function isActive(uint256 id) external view returns (bool);
    function ownerOf(uint256 id) external view returns (address);
}

/// @dev minimal interface of the swap adapter
interface IUniswapAdapter {
    function swapUsdcToEth(uint256 amountIn, uint256 minOut) external returns (uint256 amountOut);
}

/**
 * @title DCABatcher (starter scaffold)
 * @notice Collects intents into a queue and triggers a batch either by k-threshold or by time window.
 *         In this MVP, FHE aggregation is represented by DecryptionRequested event.
 *         Next step: replace placeholders with fhEVM euint ops and a real relayer callback.
 */
contract DCABatcher {
    IIntentRegistry public registry;
    IUniswapAdapter public dexAdapter;

    // k-anonymity and fallback timer
    uint256 public kMin = 10;
    uint256 public fallbackSeconds = 60;

    // queue of intents for the next batch
    uint256[] public queue;
    uint256 public lastBatchTs;
    uint256 public batchNonce;
    address public relayer; // offchain gateway/relayer allowed to call the callback

    event JoinedBatch(uint256 indexed intentId, address indexed user);
    event BatchReady(uint256 indexed batchId, uint256 size);
    event DecryptionRequested(uint256 indexed batchId, bytes aggregateCiphertext, uint256[] intentIds);
    event DecryptionCallback(uint256 indexed batchId, uint256 totalUsdc);
    event SwapExecuted(uint256 indexed batchId, uint256 amountIn, uint256 amountOut);
    event DistributionQueued(uint256 indexed batchId, uint256 totalEth, uint256 size);

    constructor(address _registry) {
        registry = IIntentRegistry(_registry);
        lastBatchTs = block.timestamp;
    }

    // ------- admin params (later: timelock/governance) -------

    function setParams(uint256 _kMin, uint256 _fallbackSeconds) external {
        require(_kMin > 0, "k>0");
        kMin = _kMin;
        fallbackSeconds = _fallbackSeconds;
    }

    function setRelayer(address _relayer) external {
        relayer = _relayer;
    }

    function setDexAdapter(address _adapter) external {
        dexAdapter = IUniswapAdapter(_adapter);
    }

    // ------- user flow -------

    /// @notice User includes their intent into the upcoming batch
    function joinBatch(uint256 intentId) external {
        require(registry.isActive(intentId), "inactive intent");
        require(registry.ownerOf(intentId) == msg.sender, "not owner");

        queue.push(intentId);
        emit JoinedBatch(intentId, msg.sender);

        if (_readyByK() || _readyByTime()) {
            _requestDecryption();
        }
    }

    /// @notice Anyone may poke the batcher (permissionless executors)
    function maybeExecuteBatch() external {
        if (_readyByK() || _readyByTime()) {
            _requestDecryption();
        }
    }

    // ------- offchain hook: relayer returns the decrypted USDC total -------

    function onDecryptionResult(uint256 batchId, uint256 totalUsdc, uint256 minEthOut) external {
        require(msg.sender == relayer, "only relayer");
        require(batchId == batchNonce, "stale batch");

        emit DecryptionCallback(batchId, totalUsdc);

        // 1) single USDC→ETH swap on the DEX
        uint256 amountOut = dexAdapter.swapUsdcToEth(totalUsdc, minEthOut);
        emit SwapExecuted(batchId, totalUsdc, amountOut);

        // 2) distribution placeholder:
        //    In production, compute shares under FHE and store per-user encrypted results.
        emit DistributionQueued(batchId, amountOut, queue.length);

        // reset queue and start a new window
        delete queue;
        lastBatchTs = block.timestamp;
        batchNonce += 1;
    }

    // ------- helpers -------

    function _readyByK() internal view returns (bool) {
        return queue.length >= kMin;
    }

    function _readyByTime() internal view returns (bool) {
        return (block.timestamp - lastBatchTs) >= fallbackSeconds && queue.length > 0;
    }

    function _requestDecryption() internal {
        uint256 id = batchNonce;
        emit BatchReady(id, queue.length);

        // In production: build the aggregated ciphertext from per-interval encrypted amounts.
        bytes memory aggregateCiphertext = ""; // placeholder for fhEVM ciphertext
        emit DecryptionRequested(id, aggregateCiphertext, queue);
    }

    // view helper for UI
    function currentQueue() external view returns (uint256[] memory ids) {
        ids = queue;
    }
}
