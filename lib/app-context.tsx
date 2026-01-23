'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAccount, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { X402Order, X402Quote, X402Settlement, x402Client, isX402Enabled } from './x402-client';
import { priceOracle, TokenBalances } from './price-oracle';
import { balanceService } from './balance-service';
import { performanceTracker } from './performance-tracker';
import './force-cleanup'; // Force cleanup mock data immediately

// Demo contract addresses for Cronos Testnet (for future production use)
const DEMO_CONTRACTS = {
  USDC: '0x0000000000000000000000000000000000000001', // Mock USDC contract
  DEX_ROUTER: '0x0000000000000000000000000000000000000002', // Mock DEX router
  CRO_TOKEN: '0x0000000000000000000000000000000000000003', // Mock CRO token
} as const;

export interface Strategy {
  id?: string;
  intent: string;
  amount: string;  // Changed to string for blockchain compatibility
  riskLevel: 'low' | 'medium' | 'high';
  allocation: {
    stable: number;
    liquid: number;
    growth: number;
  };
  execution: 'once' | 'weekly' | 'daily' | 'monthly';
  monitoring: string;
  explanation: string;
  status?: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'paused';
  createdAt?: string;
  txHash?: string;
  nextExecution?: string;
  conditions?: StrategyConditions;
  performance?: StrategyPerformance;
  // x402 specific fields
  x402OrderId?: string;
  x402Enabled?: boolean;
  x402Quote?: X402Quote;
  mevProtection?: boolean;
  crossChain?: boolean;
  estimatedGas?: string;
  estimatedTime?: number;
  gasUsed?: string;
  executionTime?: number;
  mevSavings?: string;
  x402Settlement?: X402Settlement;
}

export interface StrategyConditions {
  stopLoss?: number; // Percentage loss to trigger pause
  takeProfit?: number; // Percentage gain to trigger completion
  marketCondition?: 'bull' | 'bear' | 'stable';
  maxDrawdown?: number;
}

export interface StrategyPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  currentValue: number;
  lastUpdated: string;
  executionCount: number;
}

export interface UpcomingAction {
  id: string;
  strategyId: string;
  strategyName: string;
  action: 'rebalance' | 'monitor' | 'adjust';
  scheduledFor: Date;
  status: 'scheduled' | 'due' | 'overdue';
}

export interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  description: string;
  assetType: string;
  amount: number; // Keep as number for UI calculations
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  status: 'success' | 'pending' | 'failed';
  strategy: Strategy;
  details: string;
}

export interface PortfolioData {
  totalValue: number;
  totalChange: number;
  lastUpdated: string | null;
}

interface AppContextType {
  // Wallet
  walletConnected: boolean;
  walletAddress: string | null;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => void;
  
  // Balances & Pricing
  userBalances: TokenBalances;
  tcroPrice: number;
  refreshBalances: () => Promise<void>;
  validateBalance: (usdAmount: string) => Promise<{ sufficient: boolean; required: string; available: string; deficit?: string }>;
  
  // Strategy
  currentStrategy: Strategy | null;
  setStrategy: (strategy: Strategy) => void;
  clearStrategy: () => void;
  savedStrategies: Strategy[];
  loadStrategies: () => Promise<void>;
  updatePerformance: () => Promise<void>;
  pauseStrategy: (strategyId: string) => Promise<void>;
  resumeStrategy: (strategyId: string) => Promise<void>;
  modifyStrategy: (strategyId: string, updates: Partial<Strategy>) => Promise<void>;
  
  // Execution
  isExecuting: boolean;
  executionSteps: ExecutionStep[];
  executeStrategy: (strategy: Strategy) => Promise<void>;
  
  // Activity Log
  activityLog: ActivityLog[];
  
  // Portfolio Data
  portfolioData: PortfolioData;
  updatePortfolioData: (data: Partial<PortfolioData>) => void;
  
  // Monitoring
  upcomingActions: UpcomingAction[];
  loadUpcomingActions: () => Promise<void>;
  
  // User Experience
  showApprovalFlow: boolean;
  setShowApprovalFlow: (show: boolean) => void;

  // x402 Settlement
  x402Enabled: boolean;
  createX402Order: (strategy: Strategy) => Promise<X402Order | null>;
  executeX402Settlement: (orderId: string) => Promise<X402Settlement | null>;
  getX402Quote: (strategy: Strategy) => Promise<X402Quote | null>;
  loadX402Settlements: () => Promise<X402Settlement[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// LocalStorage utilities with error handling
const STORAGE_KEYS = {
  ACTIVITY_LOG: 'intent_activity_log',
  SAVED_STRATEGIES: 'intent_saved_strategies',
  PORTFOLIO_DATA: 'intent_portfolio_data',
  USER_BALANCES: 'intent_user_balances'
};

const loadFromStorage = (key: string, defaultValue: any): any => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key: string, data: any): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Clear any old mock data on startup - more aggressive cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let needsCleanup = false;
      
      // Check activity log for mock data
      const activityData = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
      if (activityData) {
        try {
          const logs = JSON.parse(activityData);
          const hasMockData = logs.some((log: any) => 
            log.strategy?.id?.startsWith('strategy_00') || 
            log.id?.startsWith('exec_00') ||
            log.strategy?.amount === '500' ||
            log.strategy?.amount === '1000' ||
            log.strategy?.amount === '300'
          );
          if (hasMockData) needsCleanup = true;
        } catch (error) {
          console.warn('Error checking activity log for mock data:', error);
        }
      }
      
      // Check saved strategies for mock data  
      const strategiesData = localStorage.getItem(STORAGE_KEYS.SAVED_STRATEGIES);
      if (strategiesData) {
        try {
          const strategies = JSON.parse(strategiesData);
          const hasMockData = strategies.some((strategy: any) => 
            strategy.id?.startsWith('strategy_00') ||
            strategy.amount === '500' ||
            strategy.amount === '1000' || 
            strategy.amount === '300'
          );
          if (hasMockData) needsCleanup = true;
        } catch (error) {
          console.warn('Error checking strategies for mock data:', error);
        }
      }
      
      // Check portfolio data for suspicious values
      const portfolioData = localStorage.getItem(STORAGE_KEYS.PORTFOLIO_DATA);
      if (portfolioData) {
        try {
          const portfolio = JSON.parse(portfolioData);
          // Check for known mock values (1800, 1881, etc.)
          if (portfolio.totalValue > 1000 && portfolio.totalValue < 2000) {
            needsCleanup = true;
          }
        } catch (error) {
          console.warn('Error checking portfolio data:', error);
        }
      }
      
      if (needsCleanup) {
        console.log('[Cleanup] Removing ALL mock data from localStorage');
        localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOG);
        localStorage.removeItem(STORAGE_KEYS.SAVED_STRATEGIES);
        localStorage.removeItem(STORAGE_KEYS.PORTFOLIO_DATA);
        localStorage.removeItem(STORAGE_KEYS.USER_BALANCES);
      }
    }
  }, []);

  // Get real wallet connection status from wagmi
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { sendTransactionAsync } = useSendTransaction();
  
  // Sync wagmi state with app state
  const walletConnected = wagmiConnected;
  const walletAddress = wagmiAddress || null;
  
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  
  // Initialize state with localStorage data, but filter out mock data
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.ACTIVITY_LOG, []);
    // Filter out any mock data that might have loaded
    return stored.filter((log: any) => 
      !log.strategy?.id?.startsWith('strategy_00') && 
      !log.id?.startsWith('exec_00') &&
      log.strategy?.amount !== '500' &&
      log.strategy?.amount !== '1000' &&
      log.strategy?.amount !== '300'
    );
  });
  
  const [savedStrategies, setSavedStrategies] = useState<Strategy[]>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.SAVED_STRATEGIES, []);
    // Filter out any mock data that might have loaded  
    return stored.filter((strategy: any) =>
      !strategy.id?.startsWith('strategy_00') &&
      strategy.amount !== '500' &&
      strategy.amount !== '1000' && 
      strategy.amount !== '300'
    );
  });
  const [upcomingActions, setUpcomingActions] = useState<UpcomingAction[]>([]);
  const [showApprovalFlow, setShowApprovalFlow] = useState(false);

  // Portfolio state with persistence
  const [portfolioData, setPortfolioData] = useState<PortfolioData>(() => 
    loadFromStorage(STORAGE_KEYS.PORTFOLIO_DATA, {
      totalValue: 0,
      totalChange: 0,
      lastUpdated: null
    })
  );

  // New state for balances and pricing
  const [userBalances, setUserBalances] = useState<TokenBalances>(() => 
    loadFromStorage(STORAGE_KEYS.USER_BALANCES, {
      tcro: '0',
      usdc: '0', 
      usdt: '0'
    })
  );
  const [tcroPrice, setTcroPrice] = useState<number>(0.16);

  // Load strategies when wallet connects
  const loadStrategies = useCallback(async () => {
    if (!walletAddress) return;

    try {
      console.log('[v0] Loading strategies for wallet:', walletAddress);
      const response = await fetch(`/api/strategies?wallet=${walletAddress}`);
      const strategies = await response.json();
      console.log('[v0] Loaded strategies from API:', strategies);
      setSavedStrategies(strategies || []);
    } catch (error) {
      console.error('[v0] Failed to load strategies:', error);
    }
  }, [walletAddress]);

  // Update performance for all strategies
  const updatePerformance = useCallback(async () => {
    if (savedStrategies.length === 0) return;

    try {
      console.log('[Performance] Updating performance for', savedStrategies.length, 'strategies');
      const updatedStrategies = await performanceTracker.updateAllStrategiesPerformance(savedStrategies);
      setSavedStrategies(updatedStrategies);
      console.log('[Performance] Performance updated successfully');
    } catch (error) {
      console.error('[Performance] Failed to update performance:', error);
    }
  }, [walletAddress]);

  // Refresh user balances and TCRO price
  const refreshBalances = useCallback(async () => {
    if (!walletAddress) return;

    try {
      console.log('[v0] Refreshing balances and price for:', walletAddress);
      
      // Fetch current TCRO price
      const currentPrice = await priceOracle.getTCROPrice();
      setTcroPrice(currentPrice);
      
      // Fetch user balances
      const balances = await balanceService.getUserBalances(walletAddress);
      setUserBalances(balances);
      
      console.log('[v0] Updated - TCRO price:', currentPrice, 'Balances:', balances);
    } catch (error) {
      console.error('[v0] Failed to refresh balances:', error);
    }
  }, [walletAddress]);

  // Validate if user has sufficient balance for strategy
  const validateBalance = useCallback(async (usdAmount: string) => {
    if (!walletAddress) {
      return { sufficient: false, required: '0', available: '0' };
    }
    return await balanceService.validateSufficientBalance(walletAddress, usdAmount);
  }, [walletAddress]);

  // Portfolio data management
  const updatePortfolioData = useCallback((data: Partial<PortfolioData>) => {
    setPortfolioData(prev => {
      const newData = { ...prev, ...data, lastUpdated: new Date().toISOString() };
      saveToStorage(STORAGE_KEYS.PORTFOLIO_DATA, newData);
      return newData;
    });
  }, []);

  // Auto-save activity log and strategies to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.ACTIVITY_LOG, activityLog);
  }, [activityLog]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SAVED_STRATEGIES, savedStrategies);
  }, [savedStrategies]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_BALANCES, userBalances);
  }, [userBalances]);

  // Load strategies and balances on mount and when wallet changes
  useEffect(() => {
    if (walletConnected && walletAddress) {
      loadStrategies();
      refreshBalances();
    } else {
      // Clear balances when wallet disconnected
      setUserBalances({ tcro: '0', usdc: '0', usdt: '0' });
    }
  }, [walletConnected, walletAddress, loadStrategies, refreshBalances]);

  // Auto-update performance every 30 seconds when strategies exist
  useEffect(() => {
    if (savedStrategies.length === 0) return;

    const interval = setInterval(() => {
      console.log('[Performance] Auto-updating performance...');
      updatePerformance();
    }, 30000); // Update every 30 seconds

    // Initial update
    updatePerformance();

    return () => clearInterval(interval);
  }, [savedStrategies.length, updatePerformance]);

  const connectWallet = useCallback(async (address: string) => {
    console.log('[v0] Wallet connection handled by wagmi:', address);
    // No need to manually set state - wagmi handles this
  }, []);

  const disconnectWallet = useCallback(() => {
    console.log('[v0] Disconnecting wallet via wagmi');
    wagmiDisconnect();
    setCurrentStrategy(null);
    setSavedStrategies([]);
  }, [wagmiDisconnect]);

  const executeStrategy = useCallback(
    async (strategy: Strategy) => {
      if (!strategy) {
        console.error('[v0] No strategy provided for execution');
        return;
      }
      
      if (!walletAddress) {
        console.error('[v0] No wallet connected');
        return;
      }

      // Validate sufficient balance before execution
      const balanceCheck = await validateBalance(strategy.amount);
      if (!balanceCheck.sufficient) {
        const deficit = balanceCheck.deficit || '0';
        throw new Error(`Insufficient TCRO balance. Need ${balanceCheck.required} TCRO, but you have ${balanceCheck.available} TCRO. Deficit: ${deficit} TCRO`);
      }

      setIsExecuting(true);
      console.log('[v0] Starting execution for strategy:', strategy);
      console.log('[v0] Balance validation passed - Required:', balanceCheck.required, 'Available:', balanceCheck.available);

      try {
        // Save strategy to Supabase
        const saveResponse = await fetch('/api/strategies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            intent: strategy.intent,
            amount: strategy.amount, // Already a string now
            riskLevel: strategy.riskLevel,
            allocation: strategy.allocation,
            executionType: strategy.execution,
            monitoring: strategy.monitoring,
            explanation: strategy.explanation,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save strategy');
        }

        const savedStrategy = await saveResponse.json();
        console.log('[v0] Strategy saved:', savedStrategy.id);

        // Initialize execution steps with real TCRO amounts
        const requiredTCRO = await priceOracle.convertUSDToTCRO(strategy.amount);
        const steps: ExecutionStep[] = [
          {
            id: '1',
            name: 'Validate Intent',
            status: 'executing',
            description: 'Parsing and validating your financial intent...',
            assetType: 'validation',
            amount: 0,
          },
          {
            id: '2',
            name: 'Calculate Allocation',
            status: 'pending',
            description: `Computing optimal allocation for ${priceOracle.formatTCROAmount(requiredTCRO)} (≈${priceOracle.formatUSDAmount(strategy.amount)})...`,
            assetType: 'calculation',
            amount: 0,
          },
          {
            id: '3',
            name: 'Allocate to Stable Assets',
            status: 'pending',
            description: `Deploying ${strategy.allocation.stable}% (${priceOracle.formatTCROAmount((parseFloat(requiredTCRO) * strategy.allocation.stable) / 100)}) to stablecoins...`,
            assetType: 'STABLE',
            amount: (parseFloat(requiredTCRO) * strategy.allocation.stable) / 100,
          },
          {
            id: '4',
            name: 'Allocate to Liquid Assets',
            status: 'pending',
            description: `Deploying ${strategy.allocation.liquid}% (${priceOracle.formatTCROAmount((parseFloat(requiredTCRO) * strategy.allocation.liquid) / 100)}) to liquid tokens...`,
            assetType: 'LIQUID',
            amount: (parseFloat(requiredTCRO) * strategy.allocation.liquid) / 100,
          },
          {
            id: '5',
            name: 'Allocate to Growth Assets',
            status: 'pending',
            description: `Staking ${strategy.allocation.growth}% (${priceOracle.formatTCROAmount((parseFloat(requiredTCRO) * strategy.allocation.growth) / 100)}) with validators...`,
            assetType: 'GROWTH',
            amount: (parseFloat(requiredTCRO) * strategy.allocation.growth) / 100,
          },
          {
            id: '6',
            name: 'Confirm Settlement',
            status: 'pending',
            description: 'Finalizing on-chain settlement with x402...',
            assetType: 'settlement',
            amount: 0,
          },
        ];

        setExecutionSteps(steps);

        // Actually execute wallet transactions instead of just simulating
        
        for (let i = 0; i < steps.length; i++) {
          // Update current step to executing
          setExecutionSteps(prevSteps => {
            const newSteps = [...prevSteps];
            if (i > 0) newSteps[i - 1].status = 'completed';
            newSteps[i].status = 'executing';
            return newSteps;
          });

          // For transaction steps (steps 3, 4, 5), trigger wallet
          if (i >= 2 && i <= 4) {
            try {
              console.log(`[v0] Triggering wallet transaction for step ${i + 1}:`, steps[i].name);
              console.log('[v0] Wallet connected:', walletConnected);
              console.log('[v0] Wallet address:', walletAddress);
              
              // Check if wallet is properly connected
              if (!walletConnected || !walletAddress) {
                throw new Error('Wallet not connected');
              }

              // This should prompt the user's wallet to confirm the transaction
              console.log('[v0] About to call sendTransactionAsync...');
              
              // Get appropriate contract address based on asset type
              const getContractAddress = (assetType: string): `0x${string}` => {
                switch (assetType) {
                  case 'STABLE':
                    // In production: return DEMO_CONTRACTS.USDC as `0x${string}`;
                    return walletAddress as `0x${string}`; // Demo: self-transaction
                  case 'LIQUID':
                    // In production: return DEMO_CONTRACTS.DEX_ROUTER as `0x${string}`;
                    return walletAddress as `0x${string}`; // Demo: self-transaction
                  case 'GROWTH':
                    // In production: return DEMO_CONTRACTS.CRO_TOKEN as `0x${string}`;
                    return walletAddress as `0x${string}`; // Demo: self-transaction
                  default:
                    return walletAddress as `0x${string}`;
                }
              };
              
              console.log(`[v0] Demo transaction for ${steps[i].name} (${steps[i].assetType})`);
              const contractAddress = getContractAddress(steps[i].assetType);
              
              // Use actual TCRO amounts for transactions
              const tcroAmount = steps[i].amount > 0 ? steps[i].amount.toString() : '0.001';
              console.log(`[v0] Transaction amount: ${tcroAmount} TCRO`);
              
              const txHash = await sendTransactionAsync({
                to: contractAddress,
                value: parseEther(tcroAmount), // Real TCRO amount based on allocation
                data: '0x' // In production: encoded contract function calls
              });

              console.log('[v0] Transaction completed:', txHash);
              
              // Refresh balances after transaction
              await refreshBalances();
              
            } catch (error) {
              console.error('[v0] Wallet transaction error:', error);
              
              // If user rejects transaction, mark as failed and stop
              setExecutionSteps(prevSteps => {
                const newSteps = [...prevSteps];
                newSteps[i].status = 'failed';
                return newSteps;
              });
              
              throw new Error('Transaction rejected by user');
            }
          } else {
            // For non-transaction steps, just wait
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }

        // Mark final step as completed
        setExecutionSteps(prevSteps => {
          const newSteps = [...prevSteps];
          newSteps[newSteps.length - 1].status = 'completed';
          return newSteps;
        });

        // Add to activity log
        const logEntry: ActivityLog = {
          id: savedStrategy.id,
          timestamp: new Date(),
          action: `Executed ${strategy.execution} strategy`,
          status: 'success',
          strategy: { ...strategy, id: savedStrategy.id },
          details: `Successfully deployed $${strategy.amount} with ${strategy.riskLevel} risk profile.`,
        };

        setActivityLog(prevLog => [logEntry, ...prevLog]);

        // Reload strategies and update performance
        await loadStrategies();
        
        // Calculate initial performance for the new strategy
        setTimeout(() => {
          updatePerformance();
        }, 1000);
      } catch (error) {
        console.error('[v0] Execution error:', error);
        setActivityLog(prevLog => [
          {
            id: Date.now().toString(),
            timestamp: new Date(),
            action: 'Strategy execution failed',
            status: 'failed',
            strategy,
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          ...prevLog,
        ]);
      } finally {
        setIsExecuting(false);
      }
    },
    [walletAddress, loadStrategies]
  );

  // Load upcoming actions
  const loadUpcomingActions = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/upcoming-actions?wallet=${walletAddress}`);
      const actions = await response.json();
      setUpcomingActions(actions || []);
    } catch (error) {
      console.error('[v0] Failed to load upcoming actions:', error);
    }
  }, [walletAddress]);

  // Pause strategy
  const pauseStrategy = useCallback(async (strategyId: string) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paused' }),
      });

      if (response.ok) {
        await loadStrategies();
        await loadUpcomingActions();
      }
    } catch (error) {
      console.error('[v0] Failed to pause strategy:', error);
    }
  }, [loadStrategies, loadUpcomingActions]);

  // Resume strategy
  const resumeStrategy = useCallback(async (strategyId: string) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        await loadStrategies();
        await loadUpcomingActions();
      }
    } catch (error) {
      console.error('[v0] Failed to resume strategy:', error);
    }
  }, [loadStrategies, loadUpcomingActions]);

  // Modify strategy
  const modifyStrategy = useCallback(async (strategyId: string, updates: Partial<Strategy>) => {
    try {
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await loadStrategies();
        await loadUpcomingActions();
      }
    } catch (error) {
      console.error('[v0] Failed to modify strategy:', error);
    }
  }, [loadStrategies, loadUpcomingActions]);

  // x402 Settlement Methods
  const x402Enabled = isX402Enabled();

  // Create x402 order
  const createX402Order = useCallback(async (strategy: Strategy): Promise<X402Order | null> => {
    if (!walletAddress) return null;

    try {
      console.log('[x402] Creating order for strategy:', strategy);
      
      const response = await fetch('/api/x402-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: strategy.intent,
          amount: strategy.amount,
          allocation: strategy.allocation,
          walletAddress,
          executionType: strategy.execution,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create x402 order');
      }

      return result.order;
    } catch (error) {
      console.error('[x402] Error creating order:', error);
      return null;
    }
  }, [walletAddress]);

  // Execute x402 settlement
  const executeX402Settlement = useCallback(async (orderId: string): Promise<X402Settlement | null> => {
    if (!walletAddress) return null;

    try {
      console.log('[x402] Executing settlement for order:', orderId);
      
      const response = await fetch('/api/x402-settlement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          walletAddress,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to execute x402 settlement');
      }

      return result.settlement;
    } catch (error) {
      console.error('[x402] Error executing settlement:', error);
      return null;
    }
  }, [walletAddress]);

  // Get x402 quote
  const getX402Quote = useCallback(async (strategy: Strategy): Promise<X402Quote | null> => {
    try {
      console.log('[x402] Getting quote for strategy:', strategy);
      
      const response = await fetch('/api/x402-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: strategy.intent,
          amount: strategy.amount,
          allocation: strategy.allocation,
          walletAddress,
        }),
      });

      const quote = await response.json();
      if (!quote.orderId) {
        throw new Error('Invalid quote response');
      }

      return quote;
    } catch (error) {
      console.error('[x402] Error getting quote:', error);
      return null;
    }
  }, [walletAddress]);

  // Load x402 settlements
  const loadX402Settlements = useCallback(async (): Promise<X402Settlement[]> => {
    if (!walletAddress) return [];

    try {
      console.log('[x402] Loading settlements for wallet:', walletAddress);
      
      const response = await fetch(`/api/x402-settlement?wallet=${walletAddress}`);
      const result = await response.json();
      
      return result.settlements || [];
    } catch (error) {
      console.error('[x402] Error loading settlements:', error);
      return [];
    }
  }, [walletAddress]);

  // Custom strategy setter that also adds to saved strategies
  const setStrategy = useCallback((strategy: Strategy) => {
    // Guard against undefined/null strategy
    if (!strategy) {
      console.warn('[v0] setStrategy called with undefined/null strategy');
      return;
    }

    // Ensure the strategy has an ID
    const strategyWithId = {
      ...strategy,
      id: (strategy as any).id || `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: (strategy as any).createdAt || new Date().toISOString()
    };
    
    setCurrentStrategy(strategyWithId);
    
    // Add to saved strategies if it's not already there
    setSavedStrategies(prevStrategies => {
      const existingIndex = prevStrategies.findIndex(s => s.id === strategyWithId.id);
      if (existingIndex >= 0) {
        // Update existing strategy
        const updated = [...prevStrategies];
        updated[existingIndex] = strategyWithId;
        return updated;
      } else {
        // Add new strategy to the beginning of the list
        return [strategyWithId, ...prevStrategies];
      }
    });

    // Add to activity log for strategy creation
    const logEntry: ActivityLog = {
      id: `created-${strategyWithId.id}`,
      timestamp: new Date(),
      action: `Created ${strategyWithId.riskLevel} risk strategy`,
      status: 'success',
      strategy: strategyWithId,
      details: `Created new strategy "${strategyWithId.intent}" with $${strategyWithId.amount} allocation.${strategyWithId.txHash ? ` Transaction: ${strategyWithId.txHash}` : ''}`,
    };

    setActivityLog(prevLog => {
      // Check if this creation event already exists
      const exists = prevLog.some(log => log.id === logEntry.id);
      if (!exists) {
        return [logEntry, ...prevLog];
      }
      return prevLog;
    });
  }, []);

  const value: AppContextType = {
    walletConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
    // Balances & Pricing
    userBalances,
    tcroPrice,
    refreshBalances,
    validateBalance,
    currentStrategy,
    setStrategy,
    clearStrategy: () => setCurrentStrategy(null),
    savedStrategies,
    loadStrategies,
    updatePerformance,
    pauseStrategy,
    resumeStrategy,
    modifyStrategy,
    isExecuting,
    executionSteps,
    executeStrategy,
    activityLog,
    portfolioData,
    updatePortfolioData,
    upcomingActions,
    loadUpcomingActions,
    showApprovalFlow,
    setShowApprovalFlow,
    // x402 methods
    x402Enabled,
    createX402Order,
    executeX402Settlement,
    getX402Quote,
    loadX402Settlements,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
