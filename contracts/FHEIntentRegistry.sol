// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./fhe/FHENumeric.sol";

/**
 * @title FHEIntentRegistry (starter, scaffolded)
 * @notice Stores ENCRYPTED DCA parameters. Currently kept as FHENumeric.Cipher (bytes wrapper).
 *         Next step: replace Cipher with fhEVM euint types and wire the gateway/relayer.
 */
contract FHEIntentRegistry {
    using FHENumeric for FHENumeric.Cipher;

    struct EncryptedIntent {
        address owner;
        FHENumeric.Cipher budgetEnc;       // was: bytes
        FHENumeric.Cipher perIntervalEnc;  // was: bytes
        FHENumeric.Cipher frequencyEnc;    // was: bytes
        FHENumeric.Cipher durationEnc;     // was: bytes
        FHENumeric.Cipher dipFactorEnc;    // optional
        bool active;
    }

    uint256 public nextId;
    mapping(uint256 => EncryptedIntent) public intents;
    mapping(address => uint256[]) public ownerIntents;

    event IntentSubmitted(uint256 indexed id, address indexed owner);
    event IntentCancelled(uint256 indexed id, address indexed owner);

    /**
     * @dev Keep the external ABI as `bytes` so frontends/offchain encryptors don’t break,
     *      but store wrapped into FHENumeric.Cipher to prepare for fhEVM euint types.
     */
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
            budgetEnc: FHENumeric.Cipher(budgetEnc),
            perIntervalEnc: FHENumeric.Cipher(perIntervalEnc),
            frequencyEnc: FHENumeric.Cipher(frequencyEnc),
            durationEnc: FHENumeric.Cipher(durationEnc),
            dipFactorEnc: FHENumeric.Cipher(dipFactorEnc),
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
