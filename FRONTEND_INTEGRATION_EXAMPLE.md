# Frontend Integration Guide

## ✅ Your Contract is Deployed and Ready!

**Contract Address:** `0xd9fc6cC979472A5FA52750ae26805462E1638872`

**ABI Location:** `abi/IntentSettlement.json`

**Helper Functions:** `lib/contract.ts`

## How to Use in Your Frontend

### 1. Import the Helper Functions

```typescript
import { 
  createStrategyOnChain, 
  executeStrategyOnChain,
  getUserStrategies,
  getStrategyDetails,
  CONTRACT_ADDRESS,
  TOKENS 
} from '@/lib/contract';
```

### 2. Create a Strategy (When User Submits Intent)

```typescript
// In your IntentForm component or app-context
import { ethers } from 'ethers';
import { createStrategyOnChain } from '@/lib/contract';

async function handleCreateStrategy(aiParsedIntent) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const { receipt, strategyId } = await createStrategyOnChain(signer, {
      amount: aiParsedIntent.amount.toString(),  // "200"
      riskLevel: aiParsedIntent.riskLevel,       // "low"
      intent: aiParsedIntent.originalIntent,     // "Save 200 USDT safely"
      stablePercent: aiParsedIntent.allocation.stable,    // 70
      liquidPercent: aiParsedIntent.allocation.liquid,    // 20
      growthPercent: aiParsedIntent.allocation.growth,    // 10
      executionType: aiParsedIntent.executionType         // "once"
    });

    console.log('Strategy created on-chain!', strategyId);
    console.log('Transaction:', receipt.hash);

    return strategyId;
  } catch (error) {
    console.error('Failed to create strategy:', error);
    throw error;
  }
}
```

### 3. Execute a Strategy

```typescript
import { executeStrategyOnChain, TOKENS } from '@/lib/contract';

async function handleExecuteStrategy(strategyId: string) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Execute with USDT as input token
    const receipt = await executeStrategyOnChain(
      signer,
      strategyId,
      TOKENS.USDT  // Or TOKENS.USDC depending on what user deposited
    );

    console.log('Strategy executed!', receipt.hash);
    
    return receipt;
  } catch (error) {
    console.error('Failed to execute strategy:', error);
    throw error;
  }
}
```

### 4. Load User's Dashboard

```typescript
import { getUserStrategies } from '@/lib/contract';

async function loadUserDashboard(userAddress: string) {
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    const strategies = await getUserStrategies(provider, userAddress);

    console.log('User strategies:', strategies);
    
    // strategies is an array of:
    // {
    //   strategyId,
    //   amount: "200.00",
    //   riskLevel: "low",
    //   intent: "Save 200 USDT safely",
    //   allocation: { stable: 70, liquid: 20, growth: 10 },
    //   executionType: "once",
    //   executed: false,
    //   createdAt: Date,
    //   steps: [...]
    // }

    return strategies;
  } catch (error) {
    console.error('Failed to load strategies:', error);
    throw error;
  }
}
```

### 5. Update Your app-context.tsx

```typescript
// In lib/app-context.tsx

import { createStrategyOnChain, executeStrategyOnChain, getUserStrategies } from './contract';

export function AppProvider({ children }: { children: React.ReactNode }) {
  // ... existing state ...

  // Update executeStrategy function
  const executeStrategy = useCallback(async (strategy: Strategy) => {
    if (!walletAddress) return;

    setIsExecuting(true);
    setExecutionSteps([
      { id: '1', name: 'Creating transaction...', status: 'executing', description: 'Preparing on-chain execution', assetType: 'STABLE', amount: 0 },
    ]);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Step 1: Create strategy on-chain (if not already created)
      let strategyId = strategy.id;
      
      if (!strategy.id.startsWith('0x')) {
        // Strategy only exists in frontend, create on-chain
        const result = await createStrategyOnChain(signer, {
          amount: strategy.amount.toString(),
          riskLevel: strategy.riskLevel,
          intent: strategy.intent || 'User strategy',
          stablePercent: strategy.allocation.stable,
          liquidPercent: strategy.allocation.liquid,
          growthPercent: strategy.allocation.growth,
          executionType: strategy.executionType,
        });
        
        strategyId = result.strategyId;
      }

      // Step 2: Execute strategy
      setExecutionSteps([
        { id: '1', name: 'Approving tokens...', status: 'completed', description: 'Token approval confirmed', assetType: 'STABLE', amount: 0 },
        { id: '2', name: 'Executing strategy...', status: 'executing', description: 'Allocating funds on-chain', assetType: 'LIQUID', amount: 0 },
      ]);

      await executeStrategyOnChain(signer, strategyId, TOKENS.USDT);

      // Step 3: Complete
      setExecutionSteps([
        { id: '1', name: 'Tokens approved', status: 'completed', description: 'Token approval confirmed', assetType: 'STABLE', amount: strategy.allocation.stable },
        { id: '2', name: 'Funds allocated', status: 'completed', description: 'Assets distributed', assetType: 'LIQUID', amount: strategy.allocation.liquid },
        { id: '3', name: 'Strategy executed', status: 'completed', description: 'Execution complete!', assetType: 'GROWTH', amount: strategy.allocation.growth },
      ]);

      // Add to activity log
      setActivityLog(prev => [...prev, {
        id: Date.now().toString(),
        timestamp: new Date(),
        action: 'Strategy Executed',
        status: 'success',
        strategy,
        details: `Successfully executed strategy on Cronos Testnet`,
      }]);

    } catch (error) {
      console.error('Execution failed:', error);
      setExecutionSteps(prev => prev.map(step => ({ ...step, status: 'failed' })));
    } finally {
      setIsExecuting(false);
    }
  }, [walletAddress]);

  // Update loadStrategies to load from blockchain
  const loadStrategies = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const onChainStrategies = await getUserStrategies(provider, walletAddress);

      // Convert to frontend format
      const formattedStrategies = onChainStrategies.map(s => ({
        id: s.strategyId,
        amount: parseFloat(s.amount),
        riskLevel: s.riskLevel,
        intent: s.intent,
        allocation: s.allocation,
        executionType: s.executionType,
        monitoring: s.executionType,
        explanation: `${s.riskLevel} risk strategy`,
        isRecurring: s.executionType === 'weekly',
        status: s.executed ? 'executed' : 'pending',
      }));

      setSavedStrategies(formattedStrategies);
    } catch (error) {
      console.error('Failed to load strategies:', error);
    }
  }, [walletAddress]);

  // ... rest of your context
}
```

## Quick Integration Checklist

- [x] ✅ Contract deployed: `0xd9fc6cC979472A5FA52750ae26805462E1638872`
- [x] ✅ ABI extracted: `abi/IntentSettlement.json`
- [x] ✅ Helper functions: `lib/contract.ts`
- [ ] Update `lib/app-context.tsx` to use contract helpers
- [ ] Update `.env` with token addresses (when you have them)
- [ ] Test creating a strategy from your frontend
- [ ] Test executing a strategy
- [ ] Test loading strategies in dashboard

## Testing Your Integration

1. **Connect wallet to Cronos Testnet**
2. **Create a strategy** through your Intent Form
3. **Check Cronoscan:** https://testnet.cronoscan.com/address/0xd9fc6cC979472A5FA52750ae26805462E1638872
4. **See your transaction** appear on-chain!

## Need to Update Token Addresses?

When you get real testnet USDT address, update the contract:

```typescript
import { getContractWithSigner } from '@/lib/contract';

const contract = getContractWithSigner(signer);
await contract.updateAssetRegistry("USDT", "0xREAL_TESTNET_USDT_ADDRESS");
```

---

**Your contract is LIVE and ready to use!** 🚀

Would you like me to integrate these helpers into your app-context now?
