import { Contract, ethers } from 'ethers'
import { CONTRACT_ADDRESS, CRONOS_TESTNET, TOKENS } from './contract'
import IntentSettlementABI from '../abi/IntentSettlement.json'
import { getAccount, getPublicClient, getWalletClient } from '@wagmi/core'
import { config } from '../config'

export interface OnChainStrategy {
  id: string;
  strategyId: string;
  user: string;
  amount: string;
  riskLevel: string;
  intent: string;
  explanation: string;
  allocation: {
    stable: number;
    liquid: number; 
    growth: number;
  };
  executionType: 'once' | 'weekly' | 'daily' | 'monthly';
  createdAt: number;
  executed: boolean;
  txHash?: string;
}

export interface ContractIntegrationService {
  // Contract read operations
  getStrategy(strategyId: string): Promise<OnChainStrategy | null>;
  getUserStrategies(userAddress: string): Promise<string[]>;
  getStrategySteps(strategyId: string): Promise<any[]>;
  
  // Contract write operations  
  createStrategy(params: CreateStrategyParams): Promise<{ strategyId: string; txHash: string }>;
  executeStrategy(strategyId: string, inputToken: string, amount: string): Promise<{ txHash: string }>;
  
  // Utility functions
  isNetworkCorrect(): Promise<boolean>;
  switchToCorrectNetwork(): Promise<void>;
  getProvider(): Promise<ethers.Provider | null>;
  getSigner(): Promise<ethers.Signer | null>;
}

export interface CreateStrategyParams {
  amount: string;
  riskLevel: 'low' | 'medium' | 'high';
  intent: string;
  stablePercent: number;
  liquidPercent: number;
  growthPercent: number;
  executionType: 'once' | 'weekly' | 'daily' | 'monthly';
}

class ContractService implements ContractIntegrationService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    this.initializeProvider();
  }

  private async initializeProvider() {
    try {
      // Use wagmi's public client as provider for read operations
      const publicClient = getPublicClient(config)
      if (publicClient) {
        this.provider = new ethers.JsonRpcProvider(CRONOS_TESTNET.rpcUrl)
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, IntentSettlementABI, this.provider)
      }
    } catch (error) {
      console.error('[Contract] Failed to initialize provider:', error)
    }
  }

  async getProvider(): Promise<ethers.Provider | null> {
    if (!this.provider) {
      await this.initializeProvider()
    }
    return this.provider
  }

  async getSigner(): Promise<ethers.Signer | null> {
    try {
      const walletClient = await getWalletClient(config)
      if (walletClient) {
        // Convert viem wallet client to ethers signer
        const provider = new ethers.BrowserProvider(window.ethereum!)
        return await provider.getSigner()
      }
      return null
    } catch (error) {
      console.error('[Contract] Failed to get signer:', error)
      return null
    }
  }

  async isNetworkCorrect(): Promise<boolean> {
    try {
      const account = getAccount(config)
      return account.chainId === CRONOS_TESTNET.chainId
    } catch (error) {
      console.error('[Contract] Failed to check network:', error)
      return false
    }
  }

  async switchToCorrectNetwork(): Promise<void> {
    try {
      const walletClient = await getWalletClient(config)
      if (walletClient) {
        await walletClient.switchChain({ id: CRONOS_TESTNET.chainId })
      }
    } catch (error: any) {
      console.error('[Contract] Failed to switch network:', error)
      throw error
    }
  }

  async getStrategy(strategyId: string): Promise<OnChainStrategy | null> {
    try {
      if (!this.contract) {
        await this.initializeProvider();
        if (!this.contract) return null;
      }

      const strategy = await this.contract.strategies(strategyId);
      
      return {
        id: strategyId,
        strategyId: strategy.strategyId,
        user: strategy.user,
        amount: ethers.formatUnits(strategy.amount, 6), // Assuming 6 decimals for USDC
        riskLevel: strategy.riskLevel,
        intent: strategy.intent || '',
        explanation: strategy.explanation || '',
        allocation: {
          stable: Number(strategy.allocation.stablePercent),
          liquid: Number(strategy.allocation.liquidPercent),
          growth: Number(strategy.allocation.growthPercent),
        },
        executionType: strategy.executionType === 0 ? 'once' : 'weekly',
        createdAt: Number(strategy.createdAt),
        executed: strategy.executed,
      };
    } catch (error) {
      console.error('[Contract] Failed to get strategy:', error);
      return null;
    }
  }

  async getUserStrategies(userAddress: string): Promise<string[]> {
    try {
      if (!this.contract) {
        await this.initializeProvider();
        if (!this.contract) return [];
      }

      const strategies = await this.contract.getUserStrategies(userAddress);
      return strategies.map((id: any) => id.toString());
    } catch (error) {
      console.error('[Contract] Failed to get user strategies:', error);
      return [];
    }
  }

  async getStrategySteps(strategyId: string): Promise<any[]> {
    try {
      if (!this.contract) {
        await this.initializeProvider();
        if (!this.contract) return [];
      }

      const steps = await this.contract.getStrategySteps(strategyId);
      return steps.map((step: any) => ({
        id: step.id,
        stepNumber: Number(step.stepNumber),
        description: step.description,
        protocol: step.protocol,
        executed: step.executed,
        txHash: step.txHash,
        amount: ethers.formatEther(step.amount),
      }));
    } catch (error) {
      console.error('[Contract] Failed to get strategy steps:', error);
      return [];
    }
  }

  async createStrategy(params: CreateStrategyParams): Promise<{ strategyId: string; txHash: string }> {
    const signer = await this.getSigner();
    if (!signer) {
      throw new Error('No signer available. Please connect your wallet.');
    }

    const isCorrectNetwork = await this.isNetworkCorrect();
    if (!isCorrectNetwork) {
      await this.switchToCorrectNetwork();
    }

    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, IntentSettlementABI, signer);
    
    // Convert amount to wei (assuming 6 decimals for USDC)
    const amountWei = ethers.parseUnits(params.amount, 6);
    
    // Convert execution type to enum
    const executionTypeEnum = params.executionType === 'once' ? 0 : 1;

    try {
      const tx = await contractWithSigner.createStrategy(
        amountWei,
        params.riskLevel,
        params.intent,
        params.stablePercent,
        params.liquidPercent,
        params.growthPercent,
        executionTypeEnum
      );

      const receipt = await tx.wait();
      
      // Extract strategy ID from events
      const strategyCreatedEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('StrategyCreated(bytes32,address,uint256,string)')
      );
      
      let strategyId = '';
      if (strategyCreatedEvent) {
        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
          ['bytes32', 'address', 'uint256', 'string'],
          strategyCreatedEvent.data
        );
        strategyId = decoded[0];
      }

      return {
        strategyId,
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('[Contract] Failed to create strategy:', error);
      throw error;
    }
  }

  async executeStrategy(strategyId: string, inputToken: string, amount: string): Promise<{ txHash: string }> {
    const signer = await this.getSigner();
    if (!signer) {
      throw new Error('No signer available. Please connect your wallet.');
    }

    const isCorrectNetwork = await this.isNetworkCorrect();
    if (!isCorrectNetwork) {
      await this.switchToCorrectNetwork();
    }

    const contractWithSigner = new ethers.Contract(CONTRACT_ADDRESS, IntentSettlementABI, signer);
    
    // Convert amount to wei
    const amountWei = ethers.parseUnits(amount, 6);

    try {
      const tx = await contractWithSigner.executeStrategy(
        strategyId,
        inputToken,
        amountWei
      );

      const receipt = await tx.wait();
      
      return {
        txHash: receipt.hash
      };
    } catch (error) {
      console.error('[Contract] Failed to execute strategy:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const contractService = new ContractService();