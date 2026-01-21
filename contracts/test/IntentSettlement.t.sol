// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/IntentSettlement.sol";
import "../contracts/mocks/MockERC20.sol";

contract IntentSettlementTest is Test {
    IntentSettlement public intentSettlement;
    MockERC20 public usdc;
    MockERC20 public usdt;
    MockERC20 public dai;
    MockERC20 public cro;

    address public owner;
    address public user;

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");

        // Deploy mock tokens
        usdc = new MockERC20("USD Coin", "USDC", 6);
        usdt = new MockERC20("Tether", "USDT", 6);
        dai = new MockERC20("Dai", "DAI", 18);
        cro = new MockERC20("Cronos", "CRO", 18);

        // Deploy IntentSettlement
        intentSettlement = new IntentSettlement(
            address(usdc),
            address(usdt),
            address(dai),
            address(cro)
        );

        // Mint tokens to user
        usdc.mint(user, 10000 * 10**6);
        usdt.mint(user, 10000 * 10**6);
    }

    function testDeployment() public view {
        assertEq(intentSettlement.owner(), owner);
        assertEq(intentSettlement.assetRegistry("USDC"), address(usdc));
        assertEq(intentSettlement.assetRegistry("USDT"), address(usdt));
    }

    function testCreateStrategy() public {
        uint256 amount = 1000 * 10**6;

        vm.startPrank(user);
        
        bytes32 strategyId = intentSettlement.createStrategy(
            amount,
            "low",
            "Save safely with minimal risk",
            60, // 60% stable
            30, // 30% liquid
            10, // 10% growth
            IntentSettlement.ExecutionType.ONCE
        );

        bytes32[] memory strategies = intentSettlement.getUserStrategies(user);
        assertEq(strategies.length, 1);
        assertEq(strategies[0], strategyId);

        IntentSettlement.Strategy memory strategy = intentSettlement.getStrategy(strategyId);
        assertEq(strategy.user, user);
        assertEq(strategy.amount, amount);
        assertEq(strategy.riskLevel, "low");
        assertEq(strategy.allocation.stablePercent, 60);
        assertEq(strategy.allocation.liquidPercent, 30);
        assertEq(strategy.allocation.growthPercent, 10);
        assertFalse(strategy.executed);

        vm.stopPrank();
    }

    function testFailCreateStrategyWithZeroAmount() public {
        vm.prank(user);
        intentSettlement.createStrategy(
            0,
            "low",
            "Test",
            60,
            30,
            10,
            IntentSettlement.ExecutionType.ONCE
        );
    }

    function testFailCreateStrategyWithInvalidAllocations() public {
        vm.prank(user);
        intentSettlement.createStrategy(
            1000 * 10**6,
            "low",
            "Test",
            50, // 50%
            30, // 30%
            10, // 10% = 90% total (should be 100%)
            IntentSettlement.ExecutionType.ONCE
        );
    }

    function testExecuteStrategy() public {
        uint256 amount = 1000 * 10**6;

        vm.startPrank(user);

        // Create strategy
        bytes32 strategyId = intentSettlement.createStrategy(
            amount,
            "low",
            "Save safely",
            60,
            30,
            10,
            IntentSettlement.ExecutionType.ONCE
        );

        // Approve contract
        usdc.approve(address(intentSettlement), amount);

        // Execute strategy
        bool success = intentSettlement.executeStrategy(strategyId, address(usdc));
        assertTrue(success);

        // Check strategy is marked as executed
        IntentSettlement.Strategy memory strategy = intentSettlement.getStrategy(strategyId);
        assertTrue(strategy.executed);
        assertGt(strategy.executedAt, 0);

        // Check execution steps
        IntentSettlement.ExecutionStep[] memory steps = intentSettlement.getExecutionSteps(strategyId);
        assertEq(steps.length, 3);

        vm.stopPrank();
    }

    function testFailExecuteStrategyByNonOwner() public {
        uint256 amount = 1000 * 10**6;

        vm.prank(user);
        bytes32 strategyId = intentSettlement.createStrategy(
            amount,
            "low",
            "Test",
            60,
            30,
            10,
            IntentSettlement.ExecutionType.ONCE
        );

        // Try to execute as different user
        vm.prank(owner);
        intentSettlement.executeStrategy(strategyId, address(usdc));
    }

    function testFailExecuteStrategyTwice() public {
        uint256 amount = 1000 * 10**6;

        vm.startPrank(user);

        bytes32 strategyId = intentSettlement.createStrategy(
            amount,
            "low",
            "Test",
            60,
            30,
            10,
            IntentSettlement.ExecutionType.ONCE
        );

        usdc.approve(address(intentSettlement), amount * 2);

        intentSettlement.executeStrategy(strategyId, address(usdc));
        // This should fail
        intentSettlement.executeStrategy(strategyId, address(usdc));

        vm.stopPrank();
    }

    function testGetUserStrategies() public {
        uint256 amount = 1000 * 10**6;

        vm.startPrank(user);

        intentSettlement.createStrategy(amount, "low", "Test 1", 60, 30, 10, IntentSettlement.ExecutionType.ONCE);
        intentSettlement.createStrategy(amount, "medium", "Test 2", 50, 30, 20, IntentSettlement.ExecutionType.ONCE);

        bytes32[] memory strategies = intentSettlement.getUserStrategies(user);
        assertEq(strategies.length, 2);

        vm.stopPrank();
    }

    function testGetUserStrategyCount() public {
        uint256 amount = 1000 * 10**6;

        vm.prank(user);
        intentSettlement.createStrategy(amount, "low", "Test", 60, 30, 10, IntentSettlement.ExecutionType.ONCE);

        uint256 count = intentSettlement.getUserStrategyCount(user);
        assertEq(count, 1);
    }

    function testUpdateAssetRegistry() public {
        address newToken = makeAddr("newToken");
        
        intentSettlement.updateAssetRegistry("NEWTOKEN", newToken);
        
        assertEq(intentSettlement.assetRegistry("NEWTOKEN"), newToken);
    }

    function testFailUpdateAssetRegistryAsNonOwner() public {
        address newToken = makeAddr("newToken");
        
        vm.prank(user);
        intentSettlement.updateAssetRegistry("NEWTOKEN", newToken);
    }
}
