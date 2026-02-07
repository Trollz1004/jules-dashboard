// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDatingRevenueRouter
 * @notice Interface for the dating app revenue router
 * @dev Use this interface for integration with the DatingRevenueRouter contract
 */
interface IDatingRevenueRouter {
    /// @notice Phase enum for the router state machine
    enum Phase {
        SURVIVAL,    // 100% founder
        TRANSITION,  // Gradual shift with timelock
        PERMANENT    // Locked forever, founder max 10%
    }

    /// @notice Emitted when revenue is distributed
    event Distribution(
        address indexed token,
        uint256 totalAmount,
        uint256 founderAmount,
        uint256 daoAmount,
        uint256 charityAmount
    );

    /// @notice Emitted when a new split is scheduled
    event SplitScheduled(
        uint256 pctFounder,
        uint256 pctDao,
        uint256 pctCharity,
        uint256 effectiveTime
    );

    /// @notice Emitted when a scheduled split is applied
    event SplitApplied(
        uint256 pctFounder,
        uint256 pctDao,
        uint256 pctCharity
    );

    /// @notice Emitted when permanent mode is activated
    event PermanentActivated(
        uint256 founderCap,
        uint256 daoAllocation,
        uint256 charityAllocation
    );

    /// @notice Emitted when phase changes
    event PhaseChanged(Phase indexed oldPhase, Phase indexed newPhase);

    /// @notice Emitted when wallet addresses are updated
    event WalletsUpdated(
        address indexed founder,
        address indexed dao,
        address indexed charity
    );

    /// @notice Emitted when a scheduled split is cancelled
    event SplitCancelled();

    // ============ View Functions ============

    /// @notice Returns the current phase
    function currentPhase() external view returns (Phase);

    /// @notice Returns the founder wallet
    function founderWallet() external view returns (address);

    /// @notice Returns the DAO treasury
    function daoTreasury() external view returns (address);

    /// @notice Returns the charity safe
    function charitySafe() external view returns (address);

    /// @notice Returns the current revenue split
    function getCurrentSplit() external view returns (
        uint256 founder,
        uint256 dao,
        uint256 charity
    );

    /// @notice Returns the scheduled split details
    function getScheduledSplit() external view returns (
        uint256 founder,
        uint256 dao,
        uint256 charity,
        uint256 effectiveTime,
        bool isScheduled
    );

    /// @notice Returns pending USDC balance
    function pendingUSDC() external view returns (uint256);

    /// @notice Returns pending ETH balance
    function pendingETH() external view returns (uint256);

    /// @notice Calculates distribution amounts
    function calculateDistribution(uint256 totalAmount) external view returns (
        uint256 founderAmt,
        uint256 daoAmt,
        uint256 charityAmt
    );

    // ============ Distribution Functions ============

    /// @notice Distributes all USDC
    function distributeUSDC() external;

    /// @notice Distributes any ERC20 token
    function distributeToken(address token) external;

    /// @notice Distributes native ETH
    function distributeETH() external;

    // ============ Phase Transition Functions ============

    /// @notice Moves to TRANSITION phase (governor only)
    function enterTransitionPhase() external;

    /// @notice Schedules a new split (governor only, TRANSITION only)
    function scheduleSplit(
        uint256 _pctFounder,
        uint256 _pctDao,
        uint256 _pctCharity,
        uint256 _timelock
    ) external;

    /// @notice Applies a scheduled split (anyone, after timelock)
    function applySplit() external;

    /// @notice Cancels a scheduled split (governor/admin only)
    function cancelScheduledSplit() external;

    /// @notice IRREVERSIBLY activates permanent mode (admin only)
    function activatePermanentSplit(
        uint256 _founderCap,
        uint256 _daoAllocation,
        uint256 _charityAllocation
    ) external;

    // ============ Admin Functions ============

    /// @notice Updates wallet addresses (admin only, not in PERMANENT)
    function updateWallets(
        address _founderWallet,
        address _daoTreasury,
        address _charitySafe
    ) external;
}
