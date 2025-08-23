// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";

/**
 * @dev Malicious adapter that tries to re-enter DCABatcher.claim() inside sweepWeth().
 * The batcher's nonReentrant must block it; we ignore the failed call and still transfer WETH.
 */
contract ReenterAdapter {
    address public weth;
    address public batcher;
    bytes public reenterCalldata;

    event ReenterAttempt(bool success);

    function setBatcher(address _batcher) external { batcher = _batcher; }
    function setWeth(address _weth) external { weth = _weth; }
    function setReenter(bytes calldata data) external { reenterCalldata = data; }

    function swapUsdcToEth(uint256 amountIn, uint256 /*minOut*/) external returns (uint256 amountOut) {
        // Do nothing but report amountIn as amountOut (MVP)
        return amountIn;
    }

    function sweepWeth(address to, uint256 amount) external {
        // Attempt to re-enter batcher
        (bool ok, ) = batcher.call(reenterCalldata);
        emit ReenterAttempt(ok);
        // Continue regardless of reenter outcome
        require(IERC20(weth).transfer(to, amount), "WETH transfer failed");
    }
}
