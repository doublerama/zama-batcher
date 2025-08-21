// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DexAdapterUniswap (starter)
 * @notice Minimal stub for a USDC→ETH swap. Implement real router call in production.
 */
contract DexAdapterUniswap {
    address public router;
    address public usdc;
    address public weth;

    constructor() {}

    function configure(address _router, address _usdc, address _weth) external {
        // TODO: access control
        router = _router;
        usdc = _usdc;
        weth = _weth;
    }

    function swapUsdcToEth(uint256 amountIn, uint256 minOut) external returns (uint256 amountOut) {
        // TODO: call Uniswap router here
        // For starter scaffold, we just emit and return 0
        emit SwapExecuted(amountIn, 0);
        return 0;
    }

    event SwapExecuted(uint256 amountIn, uint256 amountOut);
}