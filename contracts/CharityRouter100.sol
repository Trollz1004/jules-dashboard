// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CharityRouter100
 * @author FOR THE KIDS Platform
 * @notice Immutable router that forwards 100% of all received funds to verified pediatric charities
 * @dev This contract is intentionally non-upgradeable and has no admin functions.
 *      Once deployed, it cannot be modified - ensuring permanent 100% charity allocation.
 *
 *      "Until no kid is in need"
 */
contract CharityRouter100 {
    using SafeERC20 for IERC20;

    /// @notice The immutable address where all funds are forwarded
    address public immutable CHARITY_SAFE;

    /// @notice USDC token address on Base Mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Emitted when funds are distributed to charity
    /// @param token The token address (address(0) for native ETH)
    /// @param amount The amount distributed
    /// @param recipient The charity safe address
    event Distribution(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    /// @notice Emitted on contract deployment for transparency
    /// @param charitySafe The immutable charity destination
    /// @param deployer The address that deployed the contract
    event RouterDeployed(
        address indexed charitySafe,
        address indexed deployer
    );

    /// @dev Thrown when charity safe address is zero
    error InvalidCharitySafe();

    /// @dev Thrown when there's nothing to distribute
    error NothingToDistribute();

    /// @dev Thrown when ETH transfer fails
    error ETHTransferFailed();

    /**
     * @notice Deploys the immutable charity router
     * @param _charitySafe The address where all funds will be forwarded forever
     * @dev The charity safe address is immutable and cannot be changed after deployment
     */
    constructor(address _charitySafe) {
        if (_charitySafe == address(0)) revert InvalidCharitySafe();

        CHARITY_SAFE = _charitySafe;

        emit RouterDeployed(_charitySafe, msg.sender);
    }

    /**
     * @notice Receives native ETH and immediately forwards to charity
     * @dev Auto-forwards on receive to ensure funds never sit in contract
     */
    receive() external payable {
        _forwardETH();
    }

    /**
     * @notice Fallback for any calls with data - forwards any ETH received
     * @dev Ensures no ETH can get stuck regardless of how it's sent
     */
    fallback() external payable {
        if (msg.value > 0) {
            _forwardETH();
        }
    }

    /**
     * @notice Distributes all USDC held by this contract to the charity safe
     * @dev Anyone can call this to ensure funds reach charity
     *      Uses SafeERC20 for secure token transfers
     */
    function distributeUSDC() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();

        IERC20(USDC).safeTransfer(CHARITY_SAFE, balance);

        emit Distribution(USDC, balance, CHARITY_SAFE);
    }

    /**
     * @notice Distributes any ERC20 token held by this contract to the charity safe
     * @param token The ERC20 token address to distribute
     * @dev Allows recovery of any tokens accidentally sent to this contract
     *      All tokens go 100% to charity - no exceptions
     */
    function distributeToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();

        IERC20(token).safeTransfer(CHARITY_SAFE, balance);

        emit Distribution(token, balance, CHARITY_SAFE);
    }

    /**
     * @notice Distributes any native ETH held by this contract to the charity safe
     * @dev Backup function in case ETH wasn't auto-forwarded
     */
    function distributeETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToDistribute();

        _forwardETH();
    }

    /**
     * @notice Returns the charity safe address
     * @return The immutable charity destination address
     * @dev This address can never be changed after deployment
     */
    function getCharityAddress() external view returns (address) {
        return CHARITY_SAFE;
    }

    /**
     * @notice Returns the current USDC balance available for distribution
     * @return The USDC balance held by this contract
     */
    function pendingUSDC() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    /**
     * @notice Returns the current balance of any ERC20 token
     * @param token The token address to check
     * @return The token balance held by this contract
     */
    function pendingToken(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Returns the current ETH balance available for distribution
     * @return The ETH balance held by this contract
     */
    function pendingETH() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Internal function to forward ETH to charity safe
     */
    function _forwardETH() internal {
        uint256 balance = address(this).balance;
        if (balance == 0) return;

        (bool success, ) = CHARITY_SAFE.call{value: balance}("");
        if (!success) revert ETHTransferFailed();

        emit Distribution(address(0), balance, CHARITY_SAFE);
    }
}
