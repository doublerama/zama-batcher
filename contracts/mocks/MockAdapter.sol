// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @notice Mock DEX adapter:
 *         - "burns" USDC by transferring to address(1)
 *         - mints the same amount of WETH to itself
 *         - batcher later sends WETH to users via sweepWeth()
 */
contract MockAdapter {
    address public usdc;
    address public weth;
    address public batcher;

    event Configured(address usdc, address weth);
    event BatcherSet(address batcher);
    event SwapExecuted(uint256 amountIn, uint256 amountOut);
    event WethSwept(address to, uint256 amount);

    modifier onlyBatcher() {
        require(msg.sender == batcher, "only batcher");
        _;
    }

    function setBatcher(address _batcher) external {
        batcher = _batcher;
        emit BatcherSet(_batcher);
    }

    function configure(address _usdc, address _weth) external {
        usdc = _usdc;
        weth = _weth;
        emit Configured(_usdc, _weth);
    }

    function swapUsdcToEth(uint256 amountIn, uint256 /*minOut*/) external onlyBatcher returns (uint256 amountOut) {
        require(usdc != address(0) && weth != address(0), "not configured");
        require(amountIn > 0, "amountIn=0");

        // send USDC to a sink address (mock burn)
        require(IERC20(usdc).transfer(address(1), amountIn), "USDC transfer failed");

        // mint WETH 1:1 to this contract
        IMintable(weth).mint(address(this), amountIn);
        amountOut = amountIn;

        emit SwapExecuted(amountIn, amountOut);
    }

    function sweepWeth(address to, uint256 amount) external onlyBatcher {
        require(IERC20(weth).transfer(to, amount), "WETH transfer failed");
        emit WethSwept(to, amount);
    }
}
