// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FHE} from "./fhe/FHEMock.sol";

/**
 * @title FHEIntentRegistry
 * @notice Stores encrypted DCA strategy parameters and builds encrypted aggregates
 *         for batching. All user parameters remain encrypted; only the batch total
 *         will be revealed off-chain and fed back to the batcher.
 */
contract FHEIntentRegistry {
    using FHE for FHE.euint64;
    using FHE for FHE.euint32;

    struct EncStrategy {
        // Encrypted fields (mocked as bytes in FHEMock)
        FHE.euint64 budget;       // total USDC budget (e.g. 5000 * 1e6)
        FHE.euint64 perTick;      // amount per interval
        FHE.euint32 frequencySec; // interval in seconds
        FHE.euint32 durationSec;  // total duration in seconds
        bytes aux;                // encrypted extra rules (e.g. buy-the-dip flags)
        // Plain metadata
        address owner;
        bool active;
    }

    // incremental ids starting at 1
    uint256 public nextId = 1;
    mapping(uint256 => EncStrategy) private _intents;

    event Submitted(uint256 indexed id, address indexed owner);
    event Cancelled(uint256 indexed id, address indexed owner);

    // -------- user API --------

    /// @notice Submit encrypted strategy parameters.
    function submitIntent(
        bytes calldata budgetCt,
        bytes calldata perTickCt,
        bytes calldata frequencySecCt,
        bytes calldata durationSecCt,
        bytes calldata auxCt
    ) external returns (uint256 id) {
        id = nextId++;
        _intents[id] = EncStrategy({
            budget: FHE.wrap64(budgetCt),
            perTick: FHE.wrap64(perTickCt),
            frequencySec: FHE.wrap32(frequencySecCt),
            durationSec: FHE.wrap32(durationSecCt),
            aux: auxCt,
            owner: msg.sender,
            active: true
        });
        emit Submitted(id, msg.sender);
    }

    function cancelIntent(uint256 id) external {
        EncStrategy storage s = _intents[id];
        require(s.owner == msg.sender, "not owner");
        require(s.active, "inactive");
        s.active = false;
        emit Cancelled(id, msg.sender);
    }

    // -------- batch helper (FHE aggregate) --------

    /// @notice Build encrypted aggregate of budgets for the given intent ids.
    /// @dev On FHEVM, this will homomorphically add euint64 values.
    function aggregateBudgetCipher(uint256[] calldata ids) external view returns (bytes memory aggCt) {
        FHE.euint64 memory acc = FHE.wrap64("");
        for (uint256 i = 0; i < ids.length; i++) {
            EncStrategy storage s = _intents[ids[i]];
            if (s.active) {
                acc = FHE.add64(acc, s.budget);
            }
        }
        aggCt = FHE.toBytes(acc);
    }

    // -------- views used by the batcher/UI --------

    function isActive(uint256 id) external view returns (bool) {
        return _intents[id].active;
    }

    function ownerOf(uint256 id) external view returns (address) {
        return _intents[id].owner;
    }

    // Optional raw getters (for off-chain gateway, if needed)
    function getBudgetCt(uint256 id) external view returns (bytes memory) { return _intents[id].budget.ct; }
    function getPerTickCt(uint256 id) external view returns (bytes memory) { return _intents[id].perTick.ct; }
    function getFrequencySecCt(uint256 id) external view returns (bytes memory) { return _intents[id].frequencySec.ct; }
    function getDurationSecCt(uint256 id) external view returns (bytes memory) { return _intents[id].durationSec.ct; }
    function getAuxCt(uint256 id) external view returns (bytes memory) { return _intents[id].aux; }
}
