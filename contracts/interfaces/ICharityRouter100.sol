// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICharityRouter100
 * @notice Interface for the immutable charity router
 * @dev Use this interface for integration with the CharityRouter100 contract
 */
interface ICharityRouter100 {
    /// @notice Emitted when funds are distributed to charity
    event Distribution(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    /// @notice Emitted on contract deployment
    event RouterDeployed(
        address indexed charitySafe,
        address indexed deployer
    );

    /// @notice Returns the immutable charity safe address
    function CHARITY_SAFE() external view returns (address);

    /// @notice Returns the USDC token address
    function USDC() external view returns (address);

    /// @notice Distributes all USDC to charity
    function distributeUSDC() external;

    /// @notice Distributes any ERC20 token to charity
    function distributeToken(address token) external;

    /// @notice Distributes any ETH to charity
    function distributeETH() external;

    /// @notice Returns the charity safe address
    function getCharityAddress() external view returns (address);

    /// @notice Returns pending USDC balance
    function pendingUSDC() external view returns (uint256);

    /// @notice Returns pending token balance
    function pendingToken(address token) external view returns (uint256);

    /// @notice Returns pending ETH balance
    function pendingETH() external view returns (uint256);
}
