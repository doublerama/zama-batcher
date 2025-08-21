// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev minimal interface of the intent registry
interface IIntentRegistry {
    function isActive(uint256 id) external view returns (bool);
    function ownerOf(uint256 id) external view returns (address);
}

/// @dev swap adapter + sweep for distributions
interface IUniswapAdapter {
    function swapUsdcToEth(uint256 amountIn, uint256 minOut) external returns (uint256 amountOut);
    function sweepWeth(address to, uint256 amount) external;
}

/**
 * @title DCABatcher (starter scaffold + distribution)
 * @notice Collects intents into a queue and triggers a batch either by k-threshold or by time window.
 *         After relayer callback, executes a single swap and assigns equal shares to intents' owners.
 */
contract DCABatcher {
    IIntentRegistry public registry;
    IUniswapAdapter public dexAdapter;

    // k-anonymity and fallback timer
    uint256 public kMin = 10;
    uint256 public fallbackSeconds = 60;

    // queue of intents for the next batch window
    uint256[] public queue;
    uint256 public lastBatchTs;
    uint256 public batchNonce;
    address public relayer; // offchain gateway/relayer allowed to call the callback

    // batch snapshot + results
    struct BatchMeta {
        uint256 createdAt;
        bool executed;
        uint256 totalUsdc;
        uint256 totalEth;
    }
    mapping(uint256 => BatchMeta) public batches;                   // batchId => meta
    mapping(uint256 => uint256[]) public batchIntents;              // batchId => intentIds
    mapping(uint256 => mapping(uint256 => uint256)) public share;   // batchId => intentId => WETH amount (wei)
    mapping(uint256 => mapping(uint256 => bool)) public claimed;    // batchId => intentId => claimed?

    event JoinedBatch(uint256 indexed intentId, address indexed user);
    event BatchReady(uint256 indexed batchId, uint256 size);
    event DecryptionRequested(uint256 indexed batchId, bytes aggregateCiphertext, uint256[] intentIds);
    event DecryptionCallback(uint256 indexed batchId, uint256 totalUsdc);
    event SwapExecuted(uint256 indexed batchId, uint256 amountIn, uint256 amountOut);
    event ShareAssigned(uint256 indexed batchId, uint256 indexed intentId, address owner, uint256 amountWei);
    event Claimed(uint256 indexed batchId, uint256 indexed intentId, address owner, uint256 amountWei);

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
        BatchMeta storage meta = batches[batchId];
        require(!meta.executed, "already executed");

        emit DecryptionCallback(batchId, totalUsdc);

        // 1) single USDC→ETH swap on the DEX
        uint256 amountOut = dexAdapter.swapUsdcToEth(totalUsdc, minEthOut);
        emit SwapExecuted(batchId, totalUsdc, amountOut);

        // 2) assign equal shares (placeholder; real version uses FHE proportional splits)
        uint256 size = batchIntents[batchId].length;
        if (size > 0 && amountOut > 0) {
            uint256 base = amountOut / size; // remainder is ignored in MVP
            for (uint256 i = 0; i < size; i++) {
                uint256 intentId = batchIntents[batchId][i];
                share[batchId][intentId] = base;
                address owner = registry.ownerOf(intentId);
                emit ShareAssigned(batchId, intentId, owner, base);
            }
        }

        // 3) finalize
        meta.createdAt = block.timestamp;
        meta.executed = true;
        meta.totalUsdc = totalUsdc;
        meta.totalEth  = amountOut;

        // reset queue and start a new window
        delete queue;
        lastBatchTs = block.timestamp;
        batchNonce += 1;
    }

    /// @notice Claim assigned WETH for a given intent in an executed batch (transfers from adapter)
    function claim(uint256 batchId, uint256 intentId) external {
        require(batches[batchId].executed, "batch not executed");
        require(registry.ownerOf(intentId) == msg.sender, "not owner");
        require(!claimed[batchId][intentId], "already claimed");

        uint256 amount = share[batchId][intentId];
        require(amount > 0, "nothing to claim");

        claimed[batchId][intentId] = true;
        dexAdapter.sweepWeth(msg.sender, amount);
        emit Claimed(batchId, intentId, msg.sender, amount);
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

        // snapshot queue into batchIntents
        uint256 len = queue.length;
        uint256[] storage arr = batchIntents[id];
        for (uint256 i = 0; i < len; i++) {
            arr.push(queue[i]);
        }

        emit BatchReady(id, len);

        // In production: build the aggregated ciphertext from per-interval encrypted amounts.
        bytes memory aggregateCiphertext = ""; // placeholder for fhEVM ciphertext
        emit DecryptionRequested(id, aggregateCiphertext, queue);
    }

    // view helpers for UI
    function currentQueue() external view returns (uint256[] memory ids) { ids = queue; }
    function getBatchIntents(uint256 batchId) external view returns (uint256[] memory ids) { ids = batchIntents[batchId]; }
    function getShare(uint256 batchId, uint256 intentId) external view returns (uint256) { return share[batchId][intentId]; }
}
