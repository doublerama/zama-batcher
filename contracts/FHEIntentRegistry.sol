// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./fhe/IFHENumeric.sol";

/**
 * @title FHEIntentRegistry (MVP)
 * @notice Stores ENCRYPTED DCA parameters using IFHENumeric.Cipher (bytes wrapper for now).
 *         Later replace Cipher with real fhEVM euint types and FHE ops.
 */
contract FHEIntentRegistry {
    struct EncryptedIntent {
        address owner;
        IFHENumeric.Cipher budgetEnc;       // was: bytes
        IFHENumeric.Cipher perIntervalEnc;  // was: bytes
        IFHENumeric.Cipher frequencyEnc;    // was: bytes
        IFHENumeric.Cipher durationEnc;     // was: bytes
        IFHENumeric.Cipher dipFactorEnc;    // optional
        bool active;
    }

    uint256 public nextId;
    mapping(uint256 => EncryptedIntent) public intents;
    mapping(address => uint256[]) public ownerIntents;

    event IntentSubmitted(uint256 indexed id, address indexed owner);
    event IntentCancelled(uint256 indexed id, address indexed owner);

    /**
     * Keep external ABI as bytes for now (frontends/offchain encryptors),
     * but store wrapped as IFHENumeric.Cipher to prep for fhEVM euint types.
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
            budgetEnc: IFHENumeric.Cipher(budgetEnc),
            perIntervalEnc: IFHENumeric.Cipher(perIntervalEnc),
            frequencyEnc: IFHENumeric.Cipher(frequencyEnc),
            durationEnc: IFHENumeric.Cipher(durationEnc),
            dipFactorEnc: IFHENumeric.Cipher(dipFactorEnc),
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
