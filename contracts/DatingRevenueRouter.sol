// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DatingRevenueRouter
 * @author FOR THE KIDS Platform - Gospel V1.4.1 SURVIVAL MODE
 * @notice Revenue router for dating app with three-phase transition model
 * @dev UUPS Upgradeable contract with the following phases:
 *
 *      SURVIVAL MODE (Phase 1):
 *      - 100% to founder for platform sustainability
 *      - Allows the project to survive and grow
 *
 *      TRANSITION MODE (Phase 2):
 *      - Gradual shift toward charity allocation
 *      - Changes require 7-30 day timelock
 *      - Democratic governance via GOVERNOR_ROLE
 *
 *      PERMANENT MODE (Phase 3):
 *      - IRREVERSIBLE - cannot go back to earlier phases
 *      - Founder capped at maximum 10%
 *      - DAO and Charity receive the rest permanently
 *
 *      "Until no kid is in need"
 */
contract DatingRevenueRouter is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice USDC token address on Base Mainnet
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Basis points denominator (100% = 10000)
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Minimum timelock duration for split changes (7 days)
    uint256 public constant MIN_TIMELOCK = 7 days;

    /// @notice Maximum timelock duration for split changes (30 days)
    uint256 public constant MAX_TIMELOCK = 30 days;

    /// @notice Maximum founder percentage in permanent mode (10%)
    uint256 public constant MAX_FOUNDER_PERMANENT = 1000;

    /// @notice Role identifier for governance operations
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    // ============ Enums ============

    /// @notice The three phases of the revenue router
    enum Phase {
        SURVIVAL,    // 100% founder
        TRANSITION,  // Gradual shift with timelock
        PERMANENT    // Locked forever, founder max 10%
    }

    // ============ State Variables ============

    /// @notice Current operational phase
    Phase public currentPhase;

    /// @notice Founder wallet address
    address public founderWallet;

    /// @notice DAO treasury address
    address public daoTreasury;

    /// @notice Charity safe address
    address public charitySafe;

    /// @notice Current founder percentage in basis points
    uint256 public pctFounder;

    /// @notice Current DAO percentage in basis points
    uint256 public pctDao;

    /// @notice Current charity percentage in basis points
    uint256 public pctCharity;

    // ============ Scheduled Split State ============

    /// @notice Scheduled new founder percentage
    uint256 public scheduledPctFounder;

    /// @notice Scheduled new DAO percentage
    uint256 public scheduledPctDao;

    /// @notice Scheduled new charity percentage
    uint256 public scheduledPctCharity;

    /// @notice Timestamp when scheduled split can be applied
    uint256 public scheduledSplitTime;

    /// @notice Whether a split is currently scheduled
    bool public splitScheduled;

    // ============ Events ============

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

    /// @notice Emitted when permanent mode is activated (IRREVERSIBLE)
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

    // ============ Errors ============

    error InvalidAddress();
    error InvalidPercentages();
    error WrongPhase(Phase required, Phase current);
    error NoSplitScheduled();
    error SplitNotReady();
    error TimelockTooShort();
    error TimelockTooLong();
    error FounderCapExceeded();
    error AlreadyPermanent();
    error SplitAlreadyScheduled();
    error NothingToDistribute();
    error ETHTransferFailed();

    // ============ Modifiers ============

    modifier onlyPhase(Phase required) {
        if (currentPhase != required) {
            revert WrongPhase(required, currentPhase);
        }
        _;
    }

    modifier notPermanent() {
        if (currentPhase == Phase.PERMANENT) {
            revert AlreadyPermanent();
        }
        _;
    }

    // ============ Initialization ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the router in SURVIVAL mode
     * @param _founderWallet Address to receive founder allocation
     * @param _daoTreasury Address for DAO treasury
     * @param _charitySafe Address for charity safe
     * @param _admin Address with DEFAULT_ADMIN_ROLE
     * @param _governor Address with GOVERNOR_ROLE
     * @dev Starts in SURVIVAL mode with 100% to founder
     */
    function initialize(
        address _founderWallet,
        address _daoTreasury,
        address _charitySafe,
        address _admin,
        address _governor
    ) external initializer {
        if (_founderWallet == address(0)) revert InvalidAddress();
        if (_daoTreasury == address(0)) revert InvalidAddress();
        if (_charitySafe == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_governor == address(0)) revert InvalidAddress();

        __UUPSUpgradeable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(GOVERNOR_ROLE, _governor);

        founderWallet = _founderWallet;
        daoTreasury = _daoTreasury;
        charitySafe = _charitySafe;

        // SURVIVAL MODE: 100% to founder
        currentPhase = Phase.SURVIVAL;
        pctFounder = 10000;
        pctDao = 0;
        pctCharity = 0;

        emit PhaseChanged(Phase.SURVIVAL, Phase.SURVIVAL);
        emit WalletsUpdated(_founderWallet, _daoTreasury, _charitySafe);
    }

    // ============ Distribution Functions ============

    /**
     * @notice Distributes all USDC according to current split
     * @dev Anyone can call this to trigger distribution
     */
    function distributeUSDC() external {
        uint256 balance = IERC20(USDC).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();

        _distribute(USDC, balance);
    }

    /**
     * @notice Distributes any ERC20 token according to current split
     * @param token The token address to distribute
     */
    function distributeToken(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert NothingToDistribute();

        _distribute(token, balance);
    }

    /**
     * @notice Distributes native ETH according to current split
     */
    function distributeETH() external {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NothingToDistribute();

        _distributeETH(balance);
    }

    /**
     * @notice Receives native ETH
     */
    receive() external payable {}

    /**
     * @notice Fallback for any calls with data
     */
    fallback() external payable {}

    // ============ Phase Transition Functions ============

    /**
     * @notice Moves from SURVIVAL to TRANSITION phase
     * @dev Only callable by GOVERNOR_ROLE, only from SURVIVAL phase
     */
    function enterTransitionPhase()
        external
        onlyRole(GOVERNOR_ROLE)
        onlyPhase(Phase.SURVIVAL)
    {
        Phase oldPhase = currentPhase;
        currentPhase = Phase.TRANSITION;

        emit PhaseChanged(oldPhase, Phase.TRANSITION);
    }

    /**
     * @notice Schedules a new revenue split with timelock
     * @param _pctFounder New founder percentage in basis points
     * @param _pctDao New DAO percentage in basis points
     * @param _pctCharity New charity percentage in basis points
     * @param _timelock Duration before split can be applied (7-30 days)
     * @dev Only callable in TRANSITION phase by GOVERNOR_ROLE
     */
    function scheduleSplit(
        uint256 _pctFounder,
        uint256 _pctDao,
        uint256 _pctCharity,
        uint256 _timelock
    ) external onlyRole(GOVERNOR_ROLE) onlyPhase(Phase.TRANSITION) {
        if (splitScheduled) revert SplitAlreadyScheduled();
        if (_pctFounder + _pctDao + _pctCharity != BASIS_POINTS) {
            revert InvalidPercentages();
        }
        if (_timelock < MIN_TIMELOCK) revert TimelockTooShort();
        if (_timelock > MAX_TIMELOCK) revert TimelockTooLong();

        scheduledPctFounder = _pctFounder;
        scheduledPctDao = _pctDao;
        scheduledPctCharity = _pctCharity;
        scheduledSplitTime = block.timestamp + _timelock;
        splitScheduled = true;

        emit SplitScheduled(_pctFounder, _pctDao, _pctCharity, scheduledSplitTime);
    }

    /**
     * @notice Applies a scheduled split after timelock expires
     * @dev Can be called by anyone after timelock, only in TRANSITION phase
     */
    function applySplit() external onlyPhase(Phase.TRANSITION) {
        if (!splitScheduled) revert NoSplitScheduled();
        if (block.timestamp < scheduledSplitTime) revert SplitNotReady();

        pctFounder = scheduledPctFounder;
        pctDao = scheduledPctDao;
        pctCharity = scheduledPctCharity;

        // Reset scheduled state
        splitScheduled = false;
        scheduledPctFounder = 0;
        scheduledPctDao = 0;
        scheduledPctCharity = 0;
        scheduledSplitTime = 0;

        emit SplitApplied(pctFounder, pctDao, pctCharity);
    }

    /**
     * @notice Cancels a scheduled split
     * @dev Only callable by GOVERNOR_ROLE or DEFAULT_ADMIN_ROLE
     */
    function cancelScheduledSplit()
        external
        onlyPhase(Phase.TRANSITION)
    {
        if (!hasRole(GOVERNOR_ROLE, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            revert AccessControlUnauthorizedAccount(msg.sender, GOVERNOR_ROLE);
        }
        if (!splitScheduled) revert NoSplitScheduled();

        splitScheduled = false;
        scheduledPctFounder = 0;
        scheduledPctDao = 0;
        scheduledPctCharity = 0;
        scheduledSplitTime = 0;

        emit SplitCancelled();
    }

    /**
     * @notice IRREVERSIBLY activates permanent mode with founder cap
     * @param _founderCap Maximum founder percentage (must be <= 10%)
     * @param _daoAllocation DAO percentage
     * @param _charityAllocation Charity percentage
     * @dev WARNING: This action cannot be undone. Phase becomes PERMANENT forever.
     *      Founder percentage can never exceed _founderCap after this call.
     */
    function activatePermanentSplit(
        uint256 _founderCap,
        uint256 _daoAllocation,
        uint256 _charityAllocation
    ) external onlyRole(DEFAULT_ADMIN_ROLE) notPermanent {
        if (_founderCap > MAX_FOUNDER_PERMANENT) revert FounderCapExceeded();
        if (_founderCap + _daoAllocation + _charityAllocation != BASIS_POINTS) {
            revert InvalidPercentages();
        }

        Phase oldPhase = currentPhase;
        currentPhase = Phase.PERMANENT;

        pctFounder = _founderCap;
        pctDao = _daoAllocation;
        pctCharity = _charityAllocation;

        // Clear any scheduled split
        splitScheduled = false;
        scheduledPctFounder = 0;
        scheduledPctDao = 0;
        scheduledPctCharity = 0;
        scheduledSplitTime = 0;

        emit PhaseChanged(oldPhase, Phase.PERMANENT);
        emit PermanentActivated(_founderCap, _daoAllocation, _charityAllocation);
    }

    // ============ Admin Functions ============

    /**
     * @notice Updates wallet addresses
     * @param _founderWallet New founder wallet
     * @param _daoTreasury New DAO treasury
     * @param _charitySafe New charity safe
     * @dev Only callable by DEFAULT_ADMIN_ROLE, not available in PERMANENT mode
     */
    function updateWallets(
        address _founderWallet,
        address _daoTreasury,
        address _charitySafe
    ) external onlyRole(DEFAULT_ADMIN_ROLE) notPermanent {
        if (_founderWallet == address(0)) revert InvalidAddress();
        if (_daoTreasury == address(0)) revert InvalidAddress();
        if (_charitySafe == address(0)) revert InvalidAddress();

        founderWallet = _founderWallet;
        daoTreasury = _daoTreasury;
        charitySafe = _charitySafe;

        emit WalletsUpdated(_founderWallet, _daoTreasury, _charitySafe);
    }

    // ============ View Functions ============

    /**
     * @notice Returns the current revenue split
     * @return founder Founder percentage in basis points
     * @return dao DAO percentage in basis points
     * @return charity Charity percentage in basis points
     */
    function getCurrentSplit()
        external
        view
        returns (uint256 founder, uint256 dao, uint256 charity)
    {
        return (pctFounder, pctDao, pctCharity);
    }

    /**
     * @notice Returns the scheduled split details
     * @return founder Scheduled founder percentage
     * @return dao Scheduled DAO percentage
     * @return charity Scheduled charity percentage
     * @return effectiveTime Timestamp when split can be applied
     * @return isScheduled Whether a split is scheduled
     */
    function getScheduledSplit()
        external
        view
        returns (
            uint256 founder,
            uint256 dao,
            uint256 charity,
            uint256 effectiveTime,
            bool isScheduled
        )
    {
        return (
            scheduledPctFounder,
            scheduledPctDao,
            scheduledPctCharity,
            scheduledSplitTime,
            splitScheduled
        );
    }

    /**
     * @notice Returns current USDC balance pending distribution
     * @return The USDC balance
     */
    function pendingUSDC() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }

    /**
     * @notice Returns current ETH balance pending distribution
     * @return The ETH balance
     */
    function pendingETH() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Calculates distribution amounts for a given total
     * @param totalAmount The total amount to distribute
     * @return founderAmt Amount for founder
     * @return daoAmt Amount for DAO
     * @return charityAmt Amount for charity
     */
    function calculateDistribution(uint256 totalAmount)
        external
        view
        returns (uint256 founderAmt, uint256 daoAmt, uint256 charityAmt)
    {
        founderAmt = (totalAmount * pctFounder) / BASIS_POINTS;
        daoAmt = (totalAmount * pctDao) / BASIS_POINTS;
        charityAmt = totalAmount - founderAmt - daoAmt; // Remainder to charity
        return (founderAmt, daoAmt, charityAmt);
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to distribute ERC20 tokens
     */
    function _distribute(address token, uint256 totalAmount) internal {
        uint256 founderAmount = (totalAmount * pctFounder) / BASIS_POINTS;
        uint256 daoAmount = (totalAmount * pctDao) / BASIS_POINTS;
        uint256 charityAmount = totalAmount - founderAmount - daoAmount;

        if (founderAmount > 0) {
            IERC20(token).safeTransfer(founderWallet, founderAmount);
        }
        if (daoAmount > 0) {
            IERC20(token).safeTransfer(daoTreasury, daoAmount);
        }
        if (charityAmount > 0) {
            IERC20(token).safeTransfer(charitySafe, charityAmount);
        }

        emit Distribution(token, totalAmount, founderAmount, daoAmount, charityAmount);
    }

    /**
     * @dev Internal function to distribute native ETH
     */
    function _distributeETH(uint256 totalAmount) internal {
        uint256 founderAmount = (totalAmount * pctFounder) / BASIS_POINTS;
        uint256 daoAmount = (totalAmount * pctDao) / BASIS_POINTS;
        uint256 charityAmount = totalAmount - founderAmount - daoAmount;

        if (founderAmount > 0) {
            (bool success, ) = founderWallet.call{value: founderAmount}("");
            if (!success) revert ETHTransferFailed();
        }
        if (daoAmount > 0) {
            (bool success, ) = daoTreasury.call{value: daoAmount}("");
            if (!success) revert ETHTransferFailed();
        }
        if (charityAmount > 0) {
            (bool success, ) = charitySafe.call{value: charityAmount}("");
            if (!success) revert ETHTransferFailed();
        }

        emit Distribution(address(0), totalAmount, founderAmount, daoAmount, charityAmount);
    }

    /**
     * @dev Required override for UUPS upgrades
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
        notPermanent
    {}
}
