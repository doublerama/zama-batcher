// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Placeholder for FHE numeric types & ops (to be swapped with fhEVM types)
interface IFHENumeric {
    // bytes carry ciphertext for now; later replace with euintX
    struct Cipher { bytes ct; }
}
