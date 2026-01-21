// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IntentSettlement
 * @dev Simplified version for frontend integration - executes intent-based DeFi strategies
 * @notice This contract manages user financial strategies with allocation-based execution
 */
contract IntentSettlement is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Strategy structure
    struct Strategy {
        bytes32 strategyId;
        address user;
        uint256 amount;
        string riskLevel;
        string intent;  // User's natural language intent
        AllocationBreakdown allocation;
        ExecutionType executionType;
        uint256 createdAt;
        bool executed;
        uint256 executedAt;
    }

    // Allocation breakdown
    struct AllocationBreakdown {
        uint256 stablePercent;      // Stable coins allocation
        uint256 liquidPercent;      // Liquid tokens allocation
        uint256 growthPercent;      // Growth assets allocation
    }

    // Execution step
    struct ExecutionStep {
        bytes32 stepId;
        uint256 stepNumber;
        string assetType;
        uint256 amount;
        address targetAsset;
        bool executed;
        uint256 executedAt;
    }

    enum ExecutionType { ONCE, WEEKLY }

    // Events
    event StrategyCreated(
        bytes32 indexed strategyId,
        address indexed user,
        uint256 amount,
        string riskLevel,
        string intent
    );

    event ExecutionStarted(bytes32 indexed strategyId, uint256 stepCount);
    event StepExecuted(bytes32 indexed strategyId, uint256 stepNumber, bool success);
    event ExecutionCompleted(bytes32 indexed strategyId, bool success);

    // State variables
    mapping(bytes32 => Strategy) public strategies;
    mapping(bytes32 => ExecutionStep[]) public executionSteps;
    mapping(address => bytes32[]) public userStrategies;

    // Asset mappings
    mapping(string => address) public assetRegistry;
    
    // Supported assets
    address public usdcAddress;
    address public usdtAddress;
    address public daiAddress;
    address public croAddress;

    constructor(
        address _usdc,
        address _usdt,
        address _dai,
        address _cro
    ) Ownable(msg.sender) {
        // Initialize token addresses
        usdcAddress = _usdc;
        usdtAddress = _usdt;
        daiAddress = _dai;
        croAddress = _cro;

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
     * @param _intent User's natural language intent
     * @param _stablePercent Percentage for stable assets
     * @param _liquidPercent Percentage for liquid assets
     * @param _growthPercent Percentage for growth assets
     * @param _executionType Execution type (ONCE or WEEKLY)
     */
    function createStrategy(
        uint256 _amount,
        string memory _riskLevel,
        string memory _intent,
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
            abi.encodePacked(msg.sender, block.timestamp, _amount, _intent)
        );

        Strategy storage strategy = strategies[strategyId];
        strategy.strategyId = strategyId;
        strategy.user = msg.sender;
        strategy.amount = _amount;
        strategy.riskLevel = _riskLevel;
        strategy.intent = _intent;
        strategy.allocation.stablePercent = _stablePercent;
        strategy.allocation.liquidPercent = _liquidPercent;
        strategy.allocation.growthPercent = _growthPercent;
        strategy.executionType = _executionType;
        strategy.createdAt = block.timestamp;
        strategy.executed = false;
        strategy.executedAt = 0;

        userStrategies[msg.sender].push(strategyId);

        emit StrategyCreated(strategyId, msg.sender, _amount, _riskLevel, _intent);

        return strategyId;
    }

    /**
     * @dev Execute strategy
     * @param _strategyId Strategy ID to execute
     * @param _inputToken Input token address
     */
    function executeStrategy(
        bytes32 _strategyId,
        address _inputToken
    ) external nonReentrant returns (bool) {
        Strategy storage strategy = strategies[_strategyId];
        require(strategy.user == msg.sender, "Only strategy owner can execute");
        require(!strategy.executed, "Strategy already executed");
        require(strategy.amount > 0, "Invalid strategy");

        uint256 amount = strategy.amount;

        // Transfer input tokens from user
        IERC20(_inputToken).safeTransferFrom(msg.sender, address(this), amount);

        // Calculate allocations
        uint256 stableAmount = (amount * strategy.allocation.stablePercent) / 100;
        uint256 liquidAmount = (amount * strategy.allocation.liquidPercent) / 100;
        uint256 growthAmount = (amount * strategy.allocation.growthPercent) / 100;

        emit ExecutionStarted(_strategyId, 3);

        // Execute steps
        if (stableAmount > 0) {
            _executeStep(_strategyId, 1, "STABLE", stableAmount, assetRegistry["USDC"]);
        }

        if (liquidAmount > 0) {
            _executeStep(_strategyId, 2, "LIQUID", liquidAmount, assetRegistry["USDT"]);
        }

        if (growthAmount > 0) {
            _executeStep(_strategyId, 3, "GROWTH", growthAmount, assetRegistry["CRO"]);
        }

        strategy.executed = true;
        strategy.executedAt = block.timestamp;
        emit ExecutionCompleted(_strategyId, true);

        return true;
    }

    /**
     * @dev Internal function to execute a single step
     */
    function _executeStep(
        bytes32 _strategyId,
        uint256 _stepNumber,
        string memory _assetType,
        uint256 _amount,
        address _targetAsset
    ) internal {
        bytes32 stepId = keccak256(abi.encodePacked(_strategyId, _stepNumber));
        
        ExecutionStep memory step = ExecutionStep({
            stepId: stepId,
            stepNumber: _stepNumber,
            assetType: _assetType,
            amount: _amount,
            targetAsset: _targetAsset,
            executed: true,
            executedAt: block.timestamp
        });

        executionSteps[_strategyId].push(step);

        emit StepExecuted(_strategyId, _stepNumber, true);
    }

    /**
     * @dev Get execution steps for a strategy
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
     */
    function getStrategy(bytes32 _strategyId)
        external
        view
        returns (Strategy memory)
    {
        return strategies[_strategyId];
    }

    /**
     * @dev Get user strategy count
     */
    function getUserStrategyCount(address _user)
        external
        view
        returns (uint256)
    {
        return userStrategies[_user].length;
    }

    /**
     * @dev Update asset registry
     */
    function updateAssetRegistry(string memory _assetName, address _assetAddress)
        external
        onlyOwner
    {
        assetRegistry[_assetName] = _assetAddress;
    }

    /**
     * @dev Emergency withdrawal
     */
    function emergencyWithdraw(address _token, uint256 _amount)
        external
        onlyOwner
    {
        IERC20(_token).safeTransfer(owner(), _amount);
    }
}
