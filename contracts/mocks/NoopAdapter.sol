// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal DEX adapter stub for tests: does not pull tokens, just echoes amountIn.
contract NoopAdapter {
    address public usdc;
    address public weth;

    event Configured(address usdc, address weth);

    function configure(address _usdc, address _weth) external {
        usdc = _usdc;
        weth = _weth;
        emit Configured(_usdc, _weth);
    }

    /// @notice Pretend to swap USDC->WETH. Returns amountIn as amountOut without transfers.
    function swapUsdcToEth(uint256 amountIn, uint256 /*minOut*/) external returns (uint256 amountOut) {
        return amountIn;
    }
}
