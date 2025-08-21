// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Mock FHE types & ops. On FHEVM, replace with real euint types and ops.
library FHE {
    struct euint64 { bytes ct; }
    struct euint32 { bytes ct; }

    function wrap64(bytes memory ct) internal pure returns (euint64 memory) { return euint64(ct); }
    function wrap32(bytes memory ct) internal pure returns (euint32 memory) { return euint32(ct); }

    // Mock "addition": keeps ciphertext non-empty; real FHEVM will homomorphically add.
    function add64(euint64 memory a, euint64 memory b) internal pure returns (euint64 memory) {
        return euint64(bytes.concat(a.ct, b.ct));
    }

    function toBytes(euint64 memory a) internal pure returns (bytes memory) { return a.ct; }
    function toBytes32(euint32 memory a) internal pure returns (bytes memory) { return a.ct; }
}
