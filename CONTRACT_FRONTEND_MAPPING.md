# Contract ↔️ Frontend Mapping

## ✅ Your Contract Has Everything Your Frontend Needs!

### Frontend Requirements vs Contract Functions

| Frontend Need | Contract Function | Status |
|--------------|------------------|--------|
| Create strategy with AI intent | `createStrategy()` | ✅ |
| Store natural language intent | `Strategy.intent` | ✅ |
| Store risk level (low/medium/high) | `Strategy.riskLevel` | ✅ |
| Store allocation percentages | `Strategy.allocation` | ✅ |
| Execution type (ONCE/WEEKLY) | `Strategy.executionType` | ✅ |
| Execute strategy | `executeStrategy()` | ✅ |
| Get user strategies | `getUserStrategies()` | ✅ |
| Get strategy details | `getStrategy()` | ✅ |
| Get execution history | `getExecutionSteps()` | ✅ |
| Track activity | Events | ✅ |
| Count user strategies | `getUserStrategyCount()` | ✅ |

## Complete Function Mapping

### 1. Strategy Creation (IntentForm Component)

**Frontend Code:**
```typescript
// User types: "Save $1000 safely"
// AI parses to: amount=1000, risk="low", allocations=60/30/10

const tx = await contract.createStrategy(
  ethers.parseUnits("1000", 6),  // amount (USDC has 6 decimals)
  "low",                          // riskLevel
  "Save $1000 safely",            // intent (natural language!)
  60,                             // stable%
  30,                             // liquid%
  10,                             // growth%
  0                               // ExecutionType.ONCE
);
```

**Contract Function:**
```solidity
function createStrategy(
    uint256 _amount,
    string memory _riskLevel,      // ✅ Stored
    string memory _intent,          // ✅ Natural language stored!
    uint256 _stablePercent,
    uint256 _liquidPercent,
    uint256 _growthPercent,
    ExecutionType _executionType   // ✅ ONCE or WEEKLY
) external returns (bytes32 strategyId)
```

**What Gets Stored:**
```solidity
struct Strategy {
    bytes32 strategyId;            // ✅ Unique ID
    address user;                  // ✅ Your wallet
    uint256 amount;                // ✅ 1000 USDC
    string riskLevel;              // ✅ "low"
    string intent;                 // ✅ "Save $1000 safely"
    AllocationBreakdown allocation; // ✅ 60/30/10
    ExecutionType executionType;   // ✅ ONCE or WEEKLY
    uint256 createdAt;             // ✅ Timestamp
    bool executed;                 // ✅ Status
    uint256 executedAt;            // ✅ When executed
}
```

### 2. Strategy Execution

**Frontend Code:**
```typescript
// User clicks "Execute Strategy"
const tx = await contract.executeStrategy(
  strategyId,
  usdcTokenAddress  // Input token
);

await tx.wait();  // Wait for confirmation
```

**Contract Function:**
```solidity
function executeStrategy(
    bytes32 _strategyId,
    address _inputToken    // USDC, USDT, etc.
) external returns (bool)
```

**What Happens:**
1. ✅ Transfers tokens from user
2. ✅ Allocates to stable/liquid/growth
3. ✅ Creates execution steps
4. ✅ Emits events for tracking
5. ✅ Marks strategy as executed

### 3. Dashboard - User Strategies

**Frontend Code:**
```typescript
// Dashboard loads user's strategies
const strategyIds = await contract.getUserStrategies(userAddress);

// Load details for each strategy
const strategies = await Promise.all(
  strategyIds.map(id => contract.getStrategy(id))
);
```

**Contract Functions:**
```solidity
// Get all strategy IDs
function getUserStrategies(address _user) 
    external view returns (bytes32[] memory)

// Get details for one strategy
function getStrategy(bytes32 _strategyId) 
    external view returns (Strategy memory)

// Quick count
function getUserStrategyCount(address _user) 
    external view returns (uint256)
```

### 4. Activity Timeline

**Frontend Code:**
```typescript
// Get execution steps for a strategy
const steps = await contract.getExecutionSteps(strategyId);

steps.forEach(step => {
  console.log(`${step.assetType}: ${step.amount} tokens`);
  console.log(`Target: ${step.targetAsset}`);
  console.log(`Executed: ${step.executed}`);
});
```

**Contract Function:**
```solidity
function getExecutionSteps(bytes32 _strategyId) 
    external view returns (ExecutionStep[] memory)

struct ExecutionStep {
    bytes32 stepId;
    uint256 stepNumber;        // 1, 2, 3
    string assetType;          // "STABLE", "LIQUID", "GROWTH"
    uint256 amount;            // How much allocated
    address targetAsset;       // USDC, USDT, or CRO address
    bool executed;             // true when done
    uint256 executedAt;        // timestamp
}
```

### 5. Events for Real-Time Tracking

**Your frontend can listen to these:**

```typescript
// Listen for new strategies
contract.on("StrategyCreated", (strategyId, user, amount, riskLevel, event) => {
  console.log("New strategy:", strategyId);
  // Update UI
});

// Listen for execution start
contract.on("ExecutionStarted", (strategyId, stepCount, event) => {
  console.log("Execution started:", strategyId);
  // Show progress
});

// Listen for each step
contract.on("StepExecuted", (strategyId, stepNumber, success, event) => {
  console.log(`Step ${stepNumber} completed`);
  // Update progress bar
});

// Listen for completion
contract.on("ExecutionCompleted", (strategyId, success, event) => {
  console.log("Strategy executed!");
  // Show success message
});
```

## What Your Frontend DOESN'T Need On-Chain

These are handled in your frontend/backend (not on blockchain):

| Feature | Where It Lives | Why |
|---------|---------------|-----|
| Weekly scheduling | Frontend/Backend | Cron jobs trigger execution |
| Pause/Resume | Database | User preference, not on-chain |
| Modify allocations | Create new strategy | Blockchain is immutable |
| AI parsing | Backend API | OpenAI processing |
| Activity history | Events + Database | Indexed from events |

## Complete Integration Example

```typescript
import { ethers } from 'ethers';
import IntentSettlementABI from './abi/IntentSettlement.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// Initialize contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(
  CONTRACT_ADDRESS, 
  IntentSettlementABI, 
  signer
);

// 1. Create Strategy (from AI-parsed intent)
async function createStrategy(aiResponse) {
  const tx = await contract.createStrategy(
    ethers.parseUnits(aiResponse.amount.toString(), 6),
    aiResponse.riskLevel,
    aiResponse.originalIntent,  // "Save $1000 safely"
    aiResponse.allocation.stable,
    aiResponse.allocation.liquid,
    aiResponse.allocation.growth,
    aiResponse.executionType === "weekly" ? 1 : 0
  );
  
  const receipt = await tx.wait();
  
  // Get strategyId from event
  const event = receipt.logs.find(
    log => log.topics[0] === contract.interface.getEvent("StrategyCreated").topicHash
  );
  const strategyId = event.args[0];
  
  return strategyId;
}

// 2. Execute Strategy
async function executeStrategy(strategyId) {
  // Approve tokens first
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
  const strategy = await contract.getStrategy(strategyId);
  
  await usdc.approve(CONTRACT_ADDRESS, strategy.amount);
  
  // Execute
  const tx = await contract.executeStrategy(strategyId, USDC_ADDRESS);
  await tx.wait();
}

// 3. Load Dashboard
async function loadDashboard(userAddress) {
  const strategyIds = await contract.getUserStrategies(userAddress);
  
  const strategies = await Promise.all(
    strategyIds.map(async (id) => {
      const strategy = await contract.getStrategy(id);
      const steps = await contract.getExecutionSteps(id);
      
      return {
        id,
        ...strategy,
        steps
      };
    })
  );
  
  return strategies;
}

// 4. Listen to Events
function setupEventListeners() {
  contract.on("StrategyCreated", (strategyId, user, amount, riskLevel) => {
    // Update UI
    refreshDashboard();
  });
  
  contract.on("ExecutionCompleted", (strategyId, success) => {
    // Show notification
    toast.success("Strategy executed successfully!");
  });
}
```

## Summary

### ✅ Contract IS Ready For:
1. Creating strategies with AI-parsed intents
2. Storing natural language intent
3. Executing strategies with token transfers
4. Tracking execution history
5. Loading user's strategies
6. Real-time event monitoring
7. Both ONCE and WEEKLY execution types

### ✅ MockERC20 Is Only For:
1. Local testing with `forge test`
2. Testing with Anvil (local node)
3. **NOT needed for testnet** (you have real tokens!)
4. **NOT deployed to blockchain**

### 🎯 You're Good To Deploy!

Your contract has **everything** your frontend needs. The MockERC20 is just a testing helper.

**Next Steps:**
1. Install Foundry: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
2. Install OpenZeppelin: `forge install OpenZeppelin/openzeppelin-contracts`
3. Test locally: `forge test`
4. Deploy to testnet: `forge script script/Deploy.s.sol:DeployScript --rpc-url cronos-testnet --broadcast --verify`
5. Update frontend with contract address
6. Start building! 🚀
