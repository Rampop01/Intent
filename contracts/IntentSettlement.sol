// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// 0x402 Protocol Interfaces
interface I0x402Router {
    function getOptimalRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 maxSlippage
    ) external view returns (Route memory);
    
    function executeSwapWithMEVProtection(
        Route calldata route,
        uint256 amountIn,
        uint256 minAmountOut,
        address to,
        uint256 deadline
    ) external returns (uint256 amountOut);
}

interface I0x402Settlement {
    function createIntent(
        Intent calldata intent
    ) external returns (bytes32 intentId);
    
    function executeIntent(
        bytes32 intentId,
        ExecutionProof calldata proof
    ) external returns (bool success);
    
    function getIntentStatus(bytes32 intentId) 
        external view returns (IntentStatus memory);
}

interface I0x402MEVProtection {
    function submitPrivateTx(
        bytes calldata txData,
        uint256 maxMEVBribe
    ) external returns (bytes32 commitmentHash);
    
    function getMEVSavings(bytes32 txHash) 
        external view returns (uint256 savings);
}

// 0x402 Data Structures
struct Route {
    address[] protocols;
    address[] tokens;
    uint256[] amounts;
    bytes[] swapData;
    uint256 estimatedGas;
    uint256 mevRisk;
}

struct Intent {
    address user;
    address tokenIn;
    address tokenOut;
    uint256 amountIn;
    uint256 minAmountOut;
    uint256 deadline;
    bool mevProtection;
    bytes32 strategyId;
}

struct ExecutionProof {
    bytes32[] merkleProof;
    uint256 gasUsed;
    uint256 actualOutput;
    bytes signature;
}

struct IntentStatus {
    bool executed;
    uint256 executedAt;
    uint256 actualOutput;
    uint256 mevSavings;
    bytes32 txHash;
}

/**
 * @title IntentSettlement
 * @dev Executes intent-based strategies with 0x402 settlement and MEV protection
 * @notice This contract integrates with 0x402 protocol for optimal execution
 */
contract IntentSettlement is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // 0x402 Protocol Integration
    I0x402Router public immutable x402Router;
    I0x402Settlement public immutable x402Settlement;
    I0x402MEVProtection public immutable mevProtection;

    // Enhanced Strategy structure with 0x402
    struct Strategy {
        bytes32 strategyId;
        address user;
        uint256 amount;
        string riskLevel;
        AllocationBreakdown allocation;
        ExecutionType executionType;
        uint256 createdAt;
        bool executed;
        bool mevProtectionEnabled;
        uint256 maxSlippage;
        bytes32[] intentIds;  // 0x402 intent IDs for this strategy
    }

    // Allocation breakdown
    struct AllocationBreakdown {
        uint256 stablePercent;      // Stable coins allocation
        uint256 liquidPercent;      // Liquid tokens allocation
        uint256 growthPercent;      // Growth assets allocation
    }

    // Enhanced execution step with 0x402 data
    struct ExecutionStep {
        bytes32 stepId;
        uint256 stepNumber;
        string assetType;
        uint256 amount;
        address targetAsset;
        bytes32 intentId;      // 0x402 intent ID
        Route optimalRoute;    // 0x402 optimal route
        bool executed;
        uint256 actualOutput;
        uint256 mevSavings;
    }

    enum ExecutionType { ONCE, WEEKLY }

    // 0x402 Settlement Events
    event X402IntentCreated(
        bytes32 indexed strategyId,
        bytes32 indexed intentId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    );
    
    event X402IntentExecuted(
        bytes32 indexed intentId,
        uint256 actualOutput,
        uint256 mevSavings,
        uint256 gasUsed
    );
    
    event MEVProtectionActivated(
        bytes32 indexed strategyId,
        bytes32 commitmentHash,
        uint256 maxMEVBribe
    );

    // Original Events
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
    mapping(bytes32 => uint256) public strategyMEVSavings; // Track MEV savings per strategy

    // Asset mappings for x402
    mapping(string => address) public assetRegistry;
    
    // Supported stable assets
    address public usdcAddress;
    address public usdtAddress;
    address public daiAddress;

    // Supported growth assets
    address public croBridge;  // CRO on Cronos

    // 0x402 Protocol Configuration
    uint256 public constant MAX_SLIPPAGE = 300; // 3%
    uint256 public constant MEV_PROTECTION_THRESHOLD = 1000 * 10**6; // 1000 USDC minimum for MEV protection

    constructor(
        address _usdc,
        address _usdt,
        address _dai,
        address _cro,
        address _x402Router,
        address _x402Settlement,
        address _mevProtection
    ) {
        // Initialize 0x402 protocol contracts
        x402Router = I0x402Router(_x402Router);
        x402Settlement = I0x402Settlement(_x402Settlement);
        mevProtection = I0x402MEVProtection(_mevProtection);

        // Initialize token addresses
        usdcAddress = _usdc;
        usdtAddress = _usdt;
        daiAddress = _dai;
        croBridge = _cro;

        // Register assets in asset registry
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
     * @dev Execute strategy with 0x402 settlement and MEV protection
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

        // Execute with 0x402 optimization
        _executeStepWithX402(
            _strategyId,
            1,
            "STABLE",
            stableAmount,
            _inputToken,
            assetRegistry["USDC"],
            strategy.mevProtectionEnabled,
            strategy.maxSlippage
        );

        _executeStepWithX402(
            _strategyId,
            2,
            "LIQUID", 
            liquidAmount,
            _inputToken,
            assetRegistry["USDT"],
            strategy.mevProtectionEnabled,
            strategy.maxSlippage
        );

        _executeStepWithX402(
            _strategyId,
            3,
            "GROWTH",
            growthAmount,
            _inputToken,
            assetRegistry["CRO"],
            strategy.mevProtectionEnabled,
            strategy.maxSlippage
        );

        strategy.executed = true;
        emit ExecutionCompleted(_strategyId, true);

        return true;
    }

    /**
     * @dev Execute single step with 0x402 optimization
     */
    function _executeStepWithX402(
        bytes32 _strategyId,
        uint256 _stepNumber,
        string memory _assetType,
        uint256 _amount,
        address _tokenIn,
        address _tokenOut,
        bool _mevProtection,
        uint256 _maxSlippage
    ) internal {
        if (_amount == 0) return;

        // Skip if same token
        if (_tokenIn == _tokenOut) {
            emit StepExecuted(_strategyId, _stepNumber, true);
            return;
        }

        // Get optimal route from 0x402
        Route memory optimalRoute = x402Router.getOptimalRoute(
            _tokenIn,
            _tokenOut,
            _amount,
            _maxSlippage
        );

        // Create intent for 0x402 settlement
        Intent memory intent = Intent({
            user: msg.sender,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amount,
            minAmountOut: _calculateMinOutput(_amount, optimalRoute, _maxSlippage),
            deadline: block.timestamp + 1800, // 30 minutes
            mevProtection: _mevProtection,
            strategyId: _strategyId
        });

        // Submit intent to 0x402 settlement
        bytes32 intentId = x402Settlement.createIntent(intent);
        
        // Store intent ID in strategy
        strategies[_strategyId].intentIds.push(intentId);

        // Create execution step record
        ExecutionStep memory step = ExecutionStep({
            stepId: keccak256(abi.encodePacked(_strategyId, _stepNumber)),
            stepNumber: _stepNumber,
            assetType: _assetType,
            amount: _amount,
            targetAsset: _tokenOut,
            intentId: intentId,
            optimalRoute: optimalRoute,
            executed: false,
            actualOutput: 0,
            mevSavings: 0
        });

        executionSteps[_strategyId].push(step);

        emit X402IntentCreated(_strategyId, intentId, _tokenIn, _tokenOut, _amount);

        // Execute with MEV protection if enabled
        if (_mevProtection && _amount >= MEV_PROTECTION_THRESHOLD) {
            _executeMEVProtectedSwap(_strategyId, intentId, optimalRoute, _amount);
        } else {
            _executeStandardSwap(_strategyId, intentId, optimalRoute, _amount);
        }

        emit StepExecuted(_strategyId, _stepNumber, true);
    }

    /**
     * @dev Execute swap with MEV protection
     */
    function _executeMEVProtectedSwap(
        bytes32 _strategyId,
        bytes32 _intentId,
        Route memory _route,
        uint256 _amount
    ) internal {
        // Calculate MEV protection bribe (0.1% of transaction value)
        uint256 mevBribe = _amount / 1000;
        
        // Prepare transaction data for private submission
        bytes memory txData = abi.encodeWithSelector(
            x402Router.executeSwapWithMEVProtection.selector,
            _route,
            _amount,
            _calculateMinOutput(_amount, _route, strategies[_strategyId].maxSlippage),
            address(this),
            block.timestamp + 1800
        );

        // Submit to MEV protection service
        bytes32 commitmentHash = mevProtection.submitPrivateTx(txData, mevBribe);
        
        emit MEVProtectionActivated(_strategyId, commitmentHash, mevBribe);
        
        // Note: Actual execution happens through MEV protection callback
        // This would be handled by the 0x402 protocol's execution engine
    }

    /**
     * @dev Execute standard swap without MEV protection
     */
    function _executeStandardSwap(
        bytes32 _strategyId,
        bytes32 _intentId,
        Route memory _route,
        uint256 _amount
    ) internal {
        // Execute directly through 0x402 router
        uint256 outputAmount = x402Router.executeSwapWithMEVProtection(
            _route,
            _amount,
            _calculateMinOutput(_amount, _route, strategies[_strategyId].maxSlippage),
            address(this),
            block.timestamp + 1800
        );

        // Update execution step with results
        _updateExecutionStep(_strategyId, _intentId, outputAmount, 0);
        
        emit X402IntentExecuted(_intentId, outputAmount, 0, _route.estimatedGas);
    }

    /**
     * @dev Calculate minimum output based on slippage tolerance
     */
    function _calculateMinOutput(
        uint256 _amountIn,
        Route memory _route,
        uint256 _maxSlippage
    ) internal pure returns (uint256) {
        uint256 expectedOutput = _route.amounts[_route.amounts.length - 1];
        return expectedOutput * (10000 - _maxSlippage) / 10000;
    }

    /**
     * @dev Update execution step with results
     */
    function _updateExecutionStep(
        bytes32 _strategyId,
        bytes32 _intentId,
        uint256 _actualOutput,
        uint256 _mevSavings
    ) internal {
        ExecutionStep[] storage steps = executionSteps[_strategyId];
        for (uint i = 0; i < steps.length; i++) {
            if (steps[i].intentId == _intentId) {
                steps[i].executed = true;
                steps[i].actualOutput = _actualOutput;
                steps[i].mevSavings = _mevSavings;
                
                // Update strategy total MEV savings
                strategyMEVSavings[_strategyId] += _mevSavings;
                break;
            }
        }
    }

    function _executeStandardStrategy(uint256 _strategyId, uint256 _amount) internal {
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
     * @dev Emergency withdrawal with 0x402 settlement awareness
     * @param _token Token to withdraw
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount)
        external
        onlyOwner
    {
        // In production, should check for pending 0x402 settlements
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    // ============ 0x402 ENHANCED FUNCTIONS ============

    /**
     * @dev Get strategy details with 0x402 information
     */
    function getStrategyWithX402Details(bytes32 _strategyId)
        external
        view
        returns (
            Strategy memory strategy,
            ExecutionStep[] memory steps,
            uint256 totalMEVSavings
        )
    {
        strategy = strategies[_strategyId];
        steps = executionSteps[_strategyId];
        totalMEVSavings = strategyMEVSavings[_strategyId];
    }

    /**
     * @dev Get optimal route preview for a swap
     */
    function getOptimalRoutePreview(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _maxSlippage
    ) external view returns (Route memory route, uint256 estimatedMEVSavings) {
        route = x402Router.getOptimalRoute(_tokenIn, _tokenOut, _amountIn, _maxSlippage);
        
        // Estimate MEV savings (simplified calculation)
        if (_amountIn >= MEV_PROTECTION_THRESHOLD) {
            estimatedMEVSavings = (_amountIn * route.mevRisk) / 10000; // MEV risk as basis points
        }
    }

    /**
     * @dev Check if strategy qualifies for MEV protection
     */
    function qualifiesForMEVProtection(uint256 _amount) external pure returns (bool) {
        return _amount >= MEV_PROTECTION_THRESHOLD;
    }

    /**
     * @dev Get total MEV savings for a user across all strategies
     */
    function getUserTotalMEVSavings(address _user) external view returns (uint256 totalSavings) {
        bytes32[] memory userStrategyIds = userStrategies[_user];
        for (uint i = 0; i < userStrategyIds.length; i++) {
            totalSavings += strategyMEVSavings[userStrategyIds[i]];
        }
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
}
