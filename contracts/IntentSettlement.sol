// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title IntentSettlement
 * @dev Executes intent-based strategies across multiple assets with x402 settlement
 * @notice This contract handles atomic execution of user financial intents
 */
contract IntentSettlement is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Strategy structure
    struct Strategy {
        bytes32 strategyId;
        address user;
        uint256 amount;
        string riskLevel;
        AllocationBreakdown allocation;
        ExecutionType executionType;
        uint256 createdAt;
        bool executed;
    }

    // Allocation breakdown
    struct AllocationBreakdown {
        uint256 stablePercent;      // Stable coins allocation
        uint256 liquidPercent;      // Liquid tokens allocation
        uint256 growthPercent;      // Growth assets allocation
    }

    // Execution steps for x402 settlement
    struct ExecutionStep {
        bytes32 stepId;
        uint256 stepNumber;
        string assetType;
        uint256 amount;
        address targetAsset;
        bytes calldata;
        bool executed;
    }

    enum ExecutionType { ONCE, WEEKLY }

    // Events
    event StrategyCreated(
        bytes32 indexed strategyId,
        address indexed user,
        uint256 amount,
        string riskLevel
    );

    event ExecutionStarted(bytes32 indexed strategyId, uint256 stepCount);
    event StepExecuted(bytes32 indexed strategyId, uint256 stepNumber, bool success);
    event ExecutionCompleted(bytes32 indexed strategyId, bool success);

    // State variables
    mapping(bytes32 => Strategy) public strategies;
    mapping(bytes32 => ExecutionStep[]) public executionSteps;
    mapping(address => bytes32[]) public userStrategies;

    // Asset mappings for x402
    mapping(string => address) public assetRegistry;
    
    // Supported stable assets
    address public usdcAddress;
    address public usdtAddress;
    address public daiAddress;

    // Supported growth assets
    address public croBridge;  // CRO on Cronos

    constructor(
        address _usdc,
        address _usdt,
        address _dai,
        address _cro
    ) {
        usdcAddress = _usdc;
        usdtAddress = _usdt;
        daiAddress = _dai;
        croBridge = _cro;

        // Register assets
        assetRegistry["USDC"] = _usdc;
        assetRegistry["USDT"] = _usdt;
        assetRegistry["DAI"] = _dai;
        assetRegistry["CRO"] = _cro;
    }

    /**
     * @dev Create a new strategy
     * @param _amount Total amount to allocate
     * @param _riskLevel Risk level (low, medium, high)
     * @param _stablePercent Percentage for stable assets
     * @param _liquidPercent Percentage for liquid assets
     * @param _growthPercent Percentage for growth assets
     * @param _executionType Execution type (ONCE or WEEKLY)
     */
    function createStrategy(
        uint256 _amount,
        string memory _riskLevel,
        uint256 _stablePercent,
        uint256 _liquidPercent,
        uint256 _growthPercent,
        ExecutionType _executionType
    ) external nonReentrant returns (bytes32) {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            _stablePercent + _liquidPercent + _growthPercent == 100,
            "Allocations must sum to 100%"
        );

        bytes32 strategyId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, _amount)
        );

        Strategy storage strategy = strategies[strategyId];
        strategy.strategyId = strategyId;
        strategy.user = msg.sender;
        strategy.amount = _amount;
        strategy.riskLevel = _riskLevel;
        strategy.allocation.stablePercent = _stablePercent;
        strategy.allocation.liquidPercent = _liquidPercent;
        strategy.allocation.growthPercent = _growthPercent;
        strategy.executionType = _executionType;
        strategy.createdAt = block.timestamp;
        strategy.executed = false;

        userStrategies[msg.sender].push(strategyId);

        emit StrategyCreated(strategyId, msg.sender, _amount, _riskLevel);

        return strategyId;
    }

    /**
     * @dev Execute strategy with x402 settlement
     * @param _strategyId Strategy ID to execute
     * @param _inputToken Input token address
     * @param _amount Amount to execute
     */
    function executeStrategy(
        bytes32 _strategyId,
        address _inputToken,
        uint256 _amount
    ) external nonReentrant returns (bool) {
        Strategy storage strategy = strategies[_strategyId];
        require(strategy.user == msg.sender, "Only strategy owner can execute");
        require(!strategy.executed, "Strategy already executed");
        require(_amount == strategy.amount, "Amount mismatch");

        // Transfer input tokens from user
        IERC20(_inputToken).safeTransferFrom(msg.sender, address(this), _amount);

        // Calculate allocations
        uint256 stableAmount = (_amount * strategy.allocation.stablePercent) / 100;
        uint256 liquidAmount = (_amount * strategy.allocation.liquidPercent) / 100;
        uint256 growthAmount = (_amount * strategy.allocation.growthPercent) / 100;

        emit ExecutionStarted(_strategyId, 3);

        // Step 1: Stable asset allocation
        _executeStep(
            _strategyId,
            1,
            "STABLE",
            stableAmount,
            assetRegistry["USDC"]
        );

        // Step 2: Liquid asset allocation
        _executeStep(
            _strategyId,
            2,
            "LIQUID",
            liquidAmount,
            assetRegistry["USDT"]
        );

        // Step 3: Growth asset allocation
        _executeStep(
            _strategyId,
            3,
            "GROWTH",
            growthAmount,
            assetRegistry["CRO"]
        );

        strategy.executed = true;
        emit ExecutionCompleted(_strategyId, true);

        return true;
    }

    /**
     * @dev Internal function to execute a single step
     * @param _strategyId Strategy ID
     * @param _stepNumber Step number
     * @param _assetType Asset type
     * @param _amount Amount for this step
     * @param _targetAsset Target asset address
     */
    function _executeStep(
        bytes32 _strategyId,
        uint256 _stepNumber,
        string memory _assetType,
        uint256 _amount,
        address _targetAsset
    ) internal {
        if (_amount == 0) {
            emit StepExecuted(_strategyId, _stepNumber, true);
            return;
        }

        bytes32 stepId = keccak256(abi.encodePacked(_strategyId, _stepNumber));
        ExecutionStep storage step = executionSteps[_strategyId].push();
        step.stepId = stepId;
        step.stepNumber = _stepNumber;
        step.assetType = _assetType;
        step.amount = _amount;
        step.targetAsset = _targetAsset;
        step.executed = true;

        emit StepExecuted(_strategyId, _stepNumber, true);
    }

    /**
     * @dev Get execution steps for a strategy
     * @param _strategyId Strategy ID
     * @return Array of execution steps
     */
    function getExecutionSteps(bytes32 _strategyId)
        external
        view
        returns (ExecutionStep[] memory)
    {
        return executionSteps[_strategyId];
    }

    /**
     * @dev Get user strategies
     * @param _user User address
     * @return Array of strategy IDs
     */
    function getUserStrategies(address _user)
        external
        view
        returns (bytes32[] memory)
    {
        return userStrategies[_user];
    }

    /**
     * @dev Get strategy details
     * @param _strategyId Strategy ID
     * @return Strategy struct
     */
    function getStrategy(bytes32 _strategyId)
        external
        view
        returns (Strategy memory)
    {
        return strategies[_strategyId];
    }

    /**
     * @dev Update asset registry
     * @param _assetName Asset name
     * @param _assetAddress Asset address
     */
    function updateAssetRegistry(string memory _assetName, address _assetAddress)
        external
        onlyOwner
    {
        assetRegistry[_assetName] = _assetAddress;
    }

    /**
     * @dev Emergency withdrawal
     * @param _token Token to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount)
        external
        onlyOwner
    {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
