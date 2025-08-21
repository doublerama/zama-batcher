// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DexAdapterUniswap (starter)
 * @notice Minimal stub. In production we will call Uniswap (SwapRouter02 / Universal Router).
 */
contract DexAdapterUniswap {
    address public router;
    address public usdc;
    address public weth;

    event Configured(address router, address usdc, address weth);
    event SwapExecuted(uint256 amountIn, uint256 amountOut);

    function configure(address _router, address _usdc, address _weth) external {
        // TODO: protect via timelock/governance
        router = _router;
        usdc = _usdc;
        weth = _weth;
        emit Configured(_router, _usdc, _weth);
    }

    function swapUsdcToEth(uint256 amountIn, uint256 /*minOut*/) external returns (uint256 amountOut) {
        // TODO: real Uniswap call; for now, just emit and return 0
        emit SwapExecuted(amountIn, 0);
        return 0;
    }
}
