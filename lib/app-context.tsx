'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface Strategy {
  id?: string;
  intent: string;
  amount: number;
  riskLevel: 'low' | 'medium' | 'high';
  allocation: {
    stable: number;
    liquid: number;
    growth: number;
  };
  execution: 'once' | 'weekly';
  monitoring: string;
  explanation: string;
  status?: string;
  createdAt?: string;
  txHash?: string;
}

export interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  description: string;
  assetType: string;
  amount: number;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  status: 'success' | 'pending' | 'failed';
  strategy: Strategy;
  details: string;
}

interface AppContextType {
  // Wallet
  walletConnected: boolean;
  walletAddress: string | null;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => void;
  
  // Strategy
  currentStrategy: Strategy | null;
  setStrategy: (strategy: Strategy) => void;
  clearStrategy: () => void;
  savedStrategies: Strategy[];
  loadStrategies: () => Promise<void>;
  
  // Execution
  isExecuting: boolean;
  executionSteps: ExecutionStep[];
  executeStrategy: (strategy: Strategy) => Promise<void>;
  
  // Activity Log
  activityLog: ActivityLog[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<Strategy[]>([]);

  // Load strategies when wallet connects
  const loadStrategies = useCallback(async () => {
    if (!walletAddress) return;

    try {
      console.log('[v0] Loading strategies for wallet:', walletAddress);
      const response = await fetch(`/api/strategies?wallet=${walletAddress}`);
      const strategies = await response.json();
      setSavedStrategies(strategies || []);
    } catch (error) {
      console.error('[v0] Failed to load strategies:', error);
    }
  }, [walletAddress]);

  // Load strategies on mount and when wallet changes
  useEffect(() => {
    if (walletConnected && walletAddress) {
      loadStrategies();
    }
  }, [walletConnected, walletAddress, loadStrategies]);

  const connectWallet = useCallback(async (address: string) => {
    console.log('[v0] Connecting wallet:', address);
    setWalletAddress(address);
    setWalletConnected(true);
  }, []);

  const disconnectWallet = useCallback(() => {
    console.log('[v0] Disconnecting wallet');
    setWalletConnected(false);
    setWalletAddress(null);
    setCurrentStrategy(null);
    setSavedStrategies([]);
  }, []);

  const executeStrategy = useCallback(
    async (strategy: Strategy) => {
      if (!walletAddress) {
        console.error('[v0] No wallet connected');
        return;
      }

      setIsExecuting(true);
      console.log('[v0] Starting execution for strategy:', strategy);

      try {
        // Save strategy to Supabase
        const saveResponse = await fetch('/api/strategies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            intent: strategy.intent,
            amount: strategy.amount,
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

        // Initialize execution steps
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
            description: 'Computing optimal asset allocation...',
            assetType: 'calculation',
            amount: 0,
          },
          {
            id: '3',
            name: 'Allocate to Stable Assets',
            status: 'pending',
            description: `Deploying ${strategy.allocation.stable}% to stablecoins (USDC/USDT)...`,
            assetType: 'STABLE',
            amount: (strategy.amount * strategy.allocation.stable) / 100,
          },
          {
            id: '4',
            name: 'Allocate to Liquid Assets',
            status: 'pending',
            description: `Deploying ${strategy.allocation.liquid}% to liquid tokens...`,
            assetType: 'LIQUID',
            amount: (strategy.amount * strategy.allocation.liquid) / 100,
          },
          {
            id: '5',
            name: 'Allocate to Growth Assets',
            status: 'pending',
            description: `Deploying ${strategy.allocation.growth}% to growth assets (CRO)...`,
            assetType: 'GROWTH',
            amount: (strategy.amount * strategy.allocation.growth) / 100,
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

        // Simulate step-by-step execution
        for (let i = 0; i < steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 1500));

          setExecutionSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[i].status = 'completed';
            if (i + 1 < newSteps.length) {
              newSteps[i + 1].status = 'executing';
            }
            return newSteps;
          });
        }

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

        // Reload strategies
        await loadStrategies();
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

  const value: AppContextType = {
    walletConnected,
    walletAddress,
    connectWallet,
    disconnectWallet,
    currentStrategy,
    setStrategy: setCurrentStrategy,
    clearStrategy: () => setCurrentStrategy(null),
    isExecuting,
    executionSteps,
    executeStrategy,
    activityLog,
    savedStrategies,
    loadStrategies,
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
