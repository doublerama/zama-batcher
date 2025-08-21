// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/ISwapRouter.sol";

/**
 * @title DexAdapterUniswap
 * @notice Minimal Uniswap V3 adapter for USDC→WETH via SwapRouter02.
 *         Keeps WETH on this contract; batcher can sweep it to users.
 */
contract DexAdapterUniswap {
    address public router;   // Uniswap V3 SwapRouter02
    address public usdc;     // USDC token address
    address public weth;     // WETH token address
    uint24  public poolFee;  // e.g. 3000 = 0.3%

    address public batcher;  // allowed caller (DCABatcher)

    event Configured(address router, address usdc, address weth, uint24 fee);
    event BatcherSet(address batcher);
    event SwapExecuted(uint256 amountIn, uint256 amountOut);
    event WethSwept(address to, uint256 amount);

    modifier onlyBatcher() {
        require(msg.sender == batcher, "only batcher");
        _;
    }

    function setBatcher(address _batcher) external {
        // TODO: protect with timelock/governance in production
        batcher = _batcher;
        emit BatcherSet(_batcher);
    }

    function configure(address _router, address _usdc, address _weth, uint24 _fee) external {
        // TODO: protect via timelock/governance
        router = _router;
        usdc = _usdc;
        weth = _weth;
        poolFee = _fee;
        emit Configured(_router, _usdc, _weth, _fee);
    }

    /// @dev Batcher must transfer USDC to this adapter before calling (production).
    function swapUsdcToEth(uint256 amountIn, uint256 minOut) external onlyBatcher returns (uint256 amountOut) {
        require(router != address(0) && usdc != address(0) && weth != address(0), "not configured");
        require(amountIn > 0, "amountIn=0");

        // Approve router if needed
        if (IERC20(usdc).allowance(address(this), router) < amountIn) {
            IERC20(usdc).approve(router, type(uint256).max);
        }

        // NOTE: For MVP totalIn may be 0 (no USDC funded) → amountOut stays 0.
        if (IERC20(usdc).balanceOf(address(this)) >= amountIn) {
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
        } else {
            amountOut = 0;
        }

        emit SwapExecuted(amountIn, amountOut);
        return amountOut;
    }

    /// @notice Transfer WETH held by this adapter to a user (called by batcher).
    function sweepWeth(address to, uint256 amount) external onlyBatcher {
        require(to != address(0), "zero to");
        require(IERC20(weth).transfer(to, amount), "WETH transfer failed");
        emit WethSwept(to, amount);
    }
}
