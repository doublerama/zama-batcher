// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FHEIntentRegistry (starter, scaffolded)
 * @notice Stores ENCRYPTED DCA parameters. Currently kept as raw bytes.
 *         In the next step, replace bytes with fhEVM euint types and wire the gateway/relayer.
 */
contract FHEIntentRegistry {
    struct EncryptedIntent {
        address owner;
        bytes budgetEnc;        // TODO: euint
        bytes perIntervalEnc;   // TODO: euint
        bytes frequencyEnc;     // TODO: euint
        bytes durationEnc;      // TODO: euint
        bytes dipFactorEnc;     // optional, TODO: euint
        bool active;
    }

    uint256 public nextId;
    mapping(uint256 => EncryptedIntent) public intents;
    mapping(address => uint256[]) public ownerIntents;

    event IntentSubmitted(uint256 indexed id, address indexed owner);
    event IntentCancelled(uint256 indexed id, address indexed owner);

    function submitIntent(
        bytes calldata budgetEnc,
        bytes calldata perIntervalEnc,
        bytes calldata frequencyEnc,
        bytes calldata durationEnc,
        bytes calldata dipFactorEnc
    ) external returns (uint256 id) {
        id = ++nextId;
        intents[id] = EncryptedIntent({
            owner: msg.sender,
            budgetEnc: budgetEnc,
            perIntervalEnc: perIntervalEnc,
            frequencyEnc: frequencyEnc,
            durationEnc: durationEnc,
            dipFactorEnc: dipFactorEnc,
            active: true
        });
        ownerIntents[msg.sender].push(id);
        emit IntentSubmitted(id, msg.sender);
    }

    function cancelIntent(uint256 id) external {
        EncryptedIntent storage it = intents[id];
        require(it.owner == msg.sender, "not owner");
        it.active = false;
        emit IntentCancelled(id, msg.sender);
    }

    // --- Minimal API for the batcher ---

    function isActive(uint256 id) external view returns (bool) {
        return intents[id].active;
    }

    function ownerOf(uint256 id) external view returns (address) {
        return intents[id].owner;
    }
}
