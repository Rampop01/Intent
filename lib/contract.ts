import { ethers } from 'ethers';
import IntentSettlementABI from '../abi/IntentSettlement.json';

// Contract address from deployment on Cronos Testnet
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xd9fc6cC979472A5FA52750ae26805462E1638872';

// Cronos Testnet configuration
export const CRONOS_TESTNET = {
  chainId: 338,
  name: 'Cronos Testnet',
  rpcUrl: 'https://evm-t3.cronos.org',
  blockExplorer: 'https://testnet.cronoscan.com',
  nativeCurrency: {
    name: 'TCRO',
    symbol: 'TCRO',
    decimals: 18,
  },
};

// Token addresses from deployment (from constructor args)
export const TOKENS = {
  USDC: '0x0000000000000000000000000000000000000000', // Zero address from deployment
  USDT: '0x0000000000000000000000000000000000000000', // Zero address from deployment  
  DAI: '0x0000000000000000000000000000000000000000',  // Zero address from deployment
  WCRO: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',  // Real WCRO from deployment
};

// Get contract instance (read-only)
export function getContract(provider: ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, IntentSettlementABI, provider);
}

// Get contract instance with signer (for transactions)
export function getContractWithSigner(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, IntentSettlementABI, signer);
}

// Helper: Create strategy on-chain
export async function createStrategyOnChain(
  signer: ethers.Signer,
  params: {
    amount: string; // In USDT/USDC (e.g., "200")
    riskLevel: string; // "low" | "medium" | "high"
    intent: string; // Natural language
    stablePercent: number;
    liquidPercent: number;
    growthPercent: number;
    executionType: 'once' | 'weekly';
  }
) {
  const contract = getContractWithSigner(signer);

  const tx = await contract.createStrategy(
    ethers.parseUnits(params.amount, 6), // Assuming USDC/USDT (6 decimals)
    params.riskLevel,
    params.intent,
    params.stablePercent,
    params.liquidPercent,
    params.growthPercent,
    params.executionType === 'weekly' ? 1 : 0
  );

  const receipt = await tx.wait();
  
  // Extract strategy ID from event
  const event = receipt.logs.find((log: any) => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed?.name === 'StrategyCreated';
    } catch {
      return false;
    }
  });

  const parsed = contract.interface.parseLog(event);
  const strategyId = parsed?.args[0];

  return { receipt, strategyId };
}

// Helper: Execute strategy on-chain
export async function executeStrategyOnChain(
  signer: ethers.Signer,
  strategyId: string,
  inputTokenAddress: string
) {
  const contract = getContractWithSigner(signer);

  // First, need to approve token spending
  const tokenContract = new ethers.Contract(
    inputTokenAddress,
    ['function approve(address spender, uint256 amount) returns (bool)'],
    signer
  );

  // Get strategy details to know amount
  const strategy = await contract.getStrategy(strategyId);
  
  // Approve contract to spend tokens
  const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, strategy.amount);
  await approveTx.wait();

  // Execute strategy
  const tx = await contract.executeStrategy(strategyId, inputTokenAddress);
  const receipt = await tx.wait();

  return receipt;
}

// Helper: Get user strategies
export async function getUserStrategies(
  provider: ethers.Provider,
  userAddress: string
) {
  const contract = getContract(provider);
  const strategyIds = await contract.getUserStrategies(userAddress);

  // Get details for each strategy
  const strategies = await Promise.all(
    strategyIds.map(async (id: string) => {
      const strategy = await contract.getStrategy(id);
      const steps = await contract.getExecutionSteps(id);
      
      return {
        strategyId: id,
        user: strategy.user,
        amount: ethers.formatUnits(strategy.amount, 6), // Assuming 6 decimals
        riskLevel: strategy.riskLevel,
        intent: strategy.intent,
        allocation: {
          stable: Number(strategy.allocation.stablePercent),
          liquid: Number(strategy.allocation.liquidPercent),
          growth: Number(strategy.allocation.growthPercent),
        },
        executionType: Number(strategy.executionType) === 0 ? 'once' : 'weekly',
        createdAt: new Date(Number(strategy.createdAt) * 1000),
        executed: strategy.executed,
        executedAt: strategy.executedAt > 0 ? new Date(Number(strategy.executedAt) * 1000) : null,
        steps: steps.map((step: any) => ({
          stepNumber: Number(step.stepNumber),
          assetType: step.assetType,
          amount: ethers.formatUnits(step.amount, 6),
          targetAsset: step.targetAsset,
          executed: step.executed,
          executedAt: step.executedAt > 0 ? new Date(Number(step.executedAt) * 1000) : null,
        })),
      };
    })
  );

  return strategies;
}

// Helper: Get single strategy details
export async function getStrategyDetails(
  provider: ethers.Provider,
  strategyId: string
) {
  const contract = getContract(provider);
  const strategy = await contract.getStrategy(strategyId);
  const steps = await contract.getExecutionSteps(strategyId);

  return {
    strategyId,
    user: strategy.user,
    amount: ethers.formatUnits(strategy.amount, 6),
    riskLevel: strategy.riskLevel,
    intent: strategy.intent,
    allocation: {
      stable: Number(strategy.allocation.stablePercent),
      liquid: Number(strategy.allocation.liquidPercent),
      growth: Number(strategy.allocation.growthPercent),
    },
    executionType: Number(strategy.executionType) === 0 ? 'once' : 'weekly',
    createdAt: new Date(Number(strategy.createdAt) * 1000),
    executed: strategy.executed,
    executedAt: strategy.executedAt > 0 ? new Date(Number(strategy.executedAt) * 1000) : null,
    steps: steps.map((step: any) => ({
      stepNumber: Number(step.stepNumber),
      assetType: step.assetType,
      amount: ethers.formatUnits(step.amount, 6),
      targetAsset: step.targetAsset,
      executed: step.executed,
      executedAt: step.executedAt > 0 ? new Date(Number(step.executedAt) * 1000) : null,
    })),
  };
}
