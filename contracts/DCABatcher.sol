// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// -------- Interfaces --------
interface IIntentRegistry {
    function isActive(uint256 id) external view returns (bool);
    function ownerOf(uint256 id) external view returns (address);
    function aggregateBudgetCipher(uint256[] calldata ids) external view returns (bytes memory);
}

interface IUniswapAdapter {
    function swapUsdcToEth(uint256 amountIn, uint256 minOut) external returns (uint256 amountOut);
    function sweepWeth(address to, uint256 amount) external;
}

// Minimal Chainlink Automation-compatible interface
interface IAutomationCompatible {
    function checkUpkeep(bytes calldata) external view returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

/**
 * @title DCABatcher
 * @notice Collects encrypted DCA intents (by id), triggers a batch by k/Δt,
 *         calls the relayer callback, executes a single swap on a DEX adapter
 *         and assigns shares to intents.
 */
contract DCABatcher is IAutomationCompatible {
    IIntentRegistry public registry;
    IUniswapAdapter public dexAdapter;

    // k-anonymity threshold and time-based fallback
    uint256 public kMin = 10;
    uint256 public fallbackSeconds = 60;

    // rolling queue for the current batch
    uint256[] public queue;
    mapping(uint256 => bool) public inQueue; // prevent duplicate joins
    uint256 public lastBatchTs;
    uint256 public batchNonce;
    address public relayer;

    // --- security ---
    uint256 private _locked;
    address public governor;
    bool public paused;

    modifier nonReentrant() {
        require(_locked == 0, "REENTRANCY");
        _locked = 1;
        _;
        _locked = 0;
    }

    modifier onlyGov() { require(msg.sender == governor, "GOV"); _; }
    modifier whenNotPaused() { require(!paused, "PAUSED"); _; }

    struct BatchMeta {
        uint256 createdAt;
        bool executed;
        uint256 totalUsdc;
        uint256 totalEth;
    }
    mapping(uint256 => BatchMeta) public batches;                   // batchId => metadata
    mapping(uint256 => uint256[]) public batchIntents;              // batchId => intentIds
    mapping(uint256 => mapping(uint256 => uint256)) public share;   // batchId => intentId => WETH amount
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
        governor = msg.sender;
    }

    // ---------------- admin (MVP; in production use timelock/governance) ----------------
    function setParams(uint256 _kMin, uint256 _fallbackSeconds) external onlyGov {
        require(_kMin > 0, "k>0");
        kMin = _kMin;
        fallbackSeconds = _fallbackSeconds;
    }

    function setRelayer(address _relayer) external onlyGov {
        relayer = _relayer;
    }

    function setDexAdapter(address _adapter) external onlyGov {
        dexAdapter = IUniswapAdapter(_adapter);
    }

    function setPaused(bool v) external onlyGov { paused = v; }

    // ---------------- user flow ----------------
    function joinBatch(uint256 intentId) external whenNotPaused {
        require(registry.isActive(intentId), "inactive intent");
        require(registry.ownerOf(intentId) == msg.sender, "not owner");
        require(!inQueue[intentId], "already queued");

        inQueue[intentId] = true;
        queue.push(intentId);
        emit JoinedBatch(intentId, msg.sender);

        if (_readyByK() || _readyByTime()) {
            _requestDecryption();
        }
    }

    function maybeExecuteBatch() external whenNotPaused {
        if (_readyByK() || _readyByTime()) {
            _requestDecryption();
        }
    }

    // --------- relayer callback (after FHE decryption of the total) ---------
    function onDecryptionResult(uint256 batchId, uint256 totalUsdc, uint256 minEthOut) external nonReentrant {
        require(msg.sender == relayer, "only relayer");
        require(batchId == batchNonce, "stale batch");
        require(address(dexAdapter) != address(0), "adapter not set");
        BatchMeta storage meta = batches[batchId];
        require(!meta.executed, "already executed");

        emit DecryptionCallback(batchId, totalUsdc);

        // 1) single USDC->WETH swap on the DEX adapter
        uint256 amountOut = dexAdapter.swapUsdcToEth(totalUsdc, minEthOut);
        emit SwapExecuted(batchId, totalUsdc, amountOut);

        // 2) equal split (MVP; next iteration: proportional shares under FHE)
        uint256 size = batchIntents[batchId].length;
        if (size > 0 && amountOut > 0) {
            uint256 base = amountOut / size;
            for (uint256 i = 0; i < size; i++) {
                uint256 intentId = batchIntents[batchId][i];
                share[batchId][intentId] = base;
                address owner = registry.ownerOf(intentId);
                emit ShareAssigned(batchId, intentId, owner, base);
            }
        }

        // 3) finalize and roll the window
        meta.createdAt = block.timestamp;
        meta.executed = true;
        meta.totalUsdc = totalUsdc;
        meta.totalEth  = amountOut;

        // clear inQueue flags for this batch
        for (uint256 i = 0; i < batchIntents[batchId].length; i++) {
            inQueue[ batchIntents[batchId][i] ] = false;
        }
        delete queue;
        lastBatchTs = block.timestamp;
        batchNonce += 1;
    }

    function claim(uint256 batchId, uint256 intentId) external nonReentrant {
        require(batches[batchId].executed, "batch not executed");
        require(registry.ownerOf(intentId) == msg.sender, "not owner");
        require(!claimed[batchId][intentId], "already claimed");

        uint256 amount = share[batchId][intentId];
        require(amount > 0, "nothing to claim");

        claimed[batchId][intentId] = true;
        dexAdapter.sweepWeth(msg.sender, amount);
        emit Claimed(batchId, intentId, msg.sender, amount);
    }

    // ---------------- internal helpers ----------------
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

        // Build encrypted aggregate of budgets for this batch
        bytes memory aggregateCiphertext = registry.aggregateBudgetCipher(queue);
        emit DecryptionRequested(id, aggregateCiphertext, queue);
    }

    // ---------------- views for UI ----------------
    function currentQueue() external view returns (uint256[] memory ids) { ids = queue; }
    function getBatchIntents(uint256 batchId) external view returns (uint256[] memory ids) { ids = batchIntents[batchId]; }
    function getShare(uint256 batchId, uint256 intentId) external view returns (uint256) { return share[batchId][intentId]; }

    // -------- Chainlink Automation-compatible (inside the contract) --------
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = _readyByK() || _readyByTime();
        performData = "";
    }

    function performUpkeep(bytes calldata) external override whenNotPaused {
        if (_readyByK() || _readyByTime()) {
            _requestDecryption();
        }
    }
}
