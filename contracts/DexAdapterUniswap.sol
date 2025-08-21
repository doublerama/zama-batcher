// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/ISwapRouter.sol";

/**
 * @title DexAdapterUniswap
 * @notice Minimal Uniswap V3 adapter for USDC→WETH swap via SwapRouter02.
 *         Works on Sepolia when configured with real addresses.
 */
contract DexAdapterUniswap {
    address public router;   // Uniswap V3 SwapRouter02
    address public usdc;     // USDC token address
    address public weth;     // WETH token address
    uint24  public poolFee;  // e.g. 3000 = 0.3%

    event Configured(address router, address usdc, address weth, uint24 fee);
    event SwapExecuted(uint256 amountIn, uint256 amountOut);

    function configure(address _router, address _usdc, address _weth, uint24 _fee) external {
        // TODO: protect with timelock/governance in production
        router = _router;
        usdc = _usdc;
        weth = _weth;
        poolFee = _fee;
        emit Configured(_router, _usdc, _weth, _fee);
    }

    /// @dev Caller (batcher) must transfer USDC to this adapter before calling.
    function swapUsdcToEth(uint256 amountIn, uint256 minOut) external returns (uint256 amountOut) {
        require(router != address(0) && usdc != address(0) && weth != address(0), "not configured");
        require(amountIn > 0, "amountIn=0");
        // Ensure this adapter holds the funds
        require(IERC20(usdc).balanceOf(address(this)) >= amountIn, "insufficient USDC");

        // Approve router if needed
        if (IERC20(usdc).allowance(address(this), router) < amountIn) {
            IERC20(usdc).approve(router, type(uint256).max);
        }

        amountOut = ISwapRouter(router).exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: usdc,
                tokenOut: weth,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: 0
            })
        );

        emit SwapExecuted(amountIn, amountOut);
        return amountOut;
    }
}
