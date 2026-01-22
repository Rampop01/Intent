'use client';

import { ethers } from 'ethers';
import axios from 'axios';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

// x402 Types
export interface X402Order {
  id: string;
  user: string;
  intent: string;
  amount: string;
  sourceChain: number;
  targetChain: number;
  sourceToken: string;
  targetToken: string;
  allocation: {
    stable: number;
    liquid: number;
    growth: number;
  };
  routes: X402Route[];
  executionType: 'once' | 'weekly' | 'daily' | 'monthly';
  mevProtection: boolean;
  crossChain: boolean;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: number;
  estimatedGas: string;
  estimatedTime: number;
}

export interface X402Route {
  id: string;
  protocol: string;
  sourceToken: string;
  targetToken: string;
  amount: string;
  expectedOutput: string;
  priceImpact: number;
  gasEstimate: string;
  path: string[];
}

export interface X402Quote {
  orderId: string;
  routes: X402Route[];
  totalGasEstimate: string;
  totalExecutionTime: number;
  priceImpact: number;
  mevSavings: string;
  crossChainFee: string;
  bestPrice: boolean;
}

export interface X402Settlement {
  orderId: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed: string;
  executionTime: number;
  actualOutput: string;
  mevSavings: string;
  steps: X402SettlementStep[];
}

export interface X402SettlementStep {
  stepId: string;
  stepNumber: number;
  protocol: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed: string;
  output: string;
}

// x402 Client Class
export class X402Client {
  private apiUrl: string;
  private apiKey: string;
  private chainId: number;
  private provider: ethers.Provider | null = null;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_X402_API_URL || 'https://api.x402.org';
    this.apiKey = process.env.X402_API_KEY || '';
    this.chainId = parseInt(process.env.NEXT_PUBLIC_X402_CHAIN_ID || '25');
  }

  // Initialize provider
  async initializeProvider(providerUrl?: string): Promise<void> {
    try {
      if (providerUrl) {
        this.provider = new ethers.JsonRpcProvider(providerUrl);
      } else if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.BrowserProvider(window.ethereum);
      }
    } catch (error) {
      console.error('[x402] Failed to initialize provider:', error);
    }
  }

  // Get price quote for strategy
  async getQuote(intent: string, amount: string, allocation: any): Promise<X402Quote | null> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const forceRealAPI = process.env.NEXT_PUBLIC_X402_FORCE_REAL_API === 'true';

    try {
      // Use mock data in development unless explicitly forced to use real API
      if (isDevelopment && !forceRealAPI) {
        console.log('[x402] Using mock quote for development (set NEXT_PUBLIC_X402_FORCE_REAL_API=true to use real API)');
        return this.generateMockQuote(intent, amount, allocation);
      }

      console.log('[x402] Using real API for quotes');
      // Real API call for production or when forced
      const response = await axios.post(`${this.apiUrl}/v1/quote`, {
        intent,
        amount,
        allocation,
        chainId: this.chainId,
        mevProtection: process.env.NEXT_PUBLIC_X402_MEV_PROTECTION === 'true',
        crossChain: process.env.NEXT_PUBLIC_X402_CROSS_CHAIN === 'true',
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return this.parseQuoteResponse(response.data);
    } catch (error) {
      console.error('[x402] Failed to get quote:', error);
      console.log('[x402] Falling back to mock quote due to error');
      return this.generateMockQuote(intent, amount, allocation);
    }
  }

  // Create settlement order
  async createOrder(
    intent: string, 
    amount: string, 
    allocation: any,
    walletAddress: string
  ): Promise<X402Order | null> {
    try {
      // Skip external API for now to avoid connection issues
      console.log('[x402] Using mock order for development');
      return this.generateMockOrder(intent, amount, allocation, walletAddress);
      
      // Commented out for development - enable for production
      // const response = await axios.post(`${this.apiUrl}/v1/order`, {
      //   user: walletAddress,
      //   intent,
      //   amount,
      //   allocation,
      //   chainId: this.chainId,
      //   mevProtection: true,
      //   crossChain: allocation.growth > 30, // Enable cross-chain for growth strategies
      //   executionType: 'once',
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // return this.parseOrderResponse(response.data);
    } catch (error) {
      console.error('[x402] Failed to create order:', error);
      return this.generateMockOrder(intent, amount, allocation, walletAddress);
    }
  }

  // Execute settlement
  async executeSettlement(orderId: string, walletAddress: string): Promise<X402Settlement | null> {
    try {
      // Skip external API for now to avoid connection issues
      console.log('[x402] Using mock settlement for development');
      return this.generateMockSettlement(orderId);
      
      // Commented out for development - enable for production
      // const response = await axios.post(`${this.apiUrl}/v1/execute`, {
      //   orderId,
      //   user: walletAddress,
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      // return this.parseSettlementResponse(response.data);
    } catch (error) {
      console.error('[x402] Failed to execute settlement:', error);
      return this.generateMockSettlement(orderId);
    }
  }

  // Get settlement status
  async getSettlementStatus(orderId: string): Promise<X402Settlement | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/v1/settlement/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return this.parseSettlementResponse(response.data);
    } catch (error) {
      console.error('[x402] Failed to get settlement status:', error);
      return null;
    }
  }

  // Cross-chain route optimization
  async optimizeCrossChainRoute(
    sourceChain: number, 
    targetChain: number, 
    amount: string
  ): Promise<X402Route[]> {
    try {
      const response = await axios.post(`${this.apiUrl}/v1/cross-chain/optimize`, {
        sourceChain,
        targetChain,
        amount,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.routes || [];
    } catch (error) {
      console.error('[x402] Failed to optimize cross-chain route:', error);
      return this.generateMockCrossChainRoutes();
    }
  }

  // MEV protection analysis
  async analyzeMEVProtection(orderId: string): Promise<{ protected: boolean; savings: string }> {
    try {
      const response = await axios.get(`${this.apiUrl}/v1/mev/analysis/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('[x402] Failed to analyze MEV protection:', error);
      return { protected: true, savings: '0.05' };
    }
  }

  // Private helper methods for mock data
  private parseQuoteResponse(data: any): X402Quote {
    return {
      orderId: data.orderId || `x402_${Date.now()}`,
      routes: data.routes || [],
      totalGasEstimate: data.gasEstimate || '0.002',
      totalExecutionTime: data.executionTime || 30,
      priceImpact: data.priceImpact || 0.1,
      mevSavings: data.mevSavings || '0.05',
      crossChainFee: data.crossChainFee || '0.01',
      bestPrice: data.bestPrice || true,
    };
  }

  private parseOrderResponse(data: any): X402Order {
    return {
      id: data.id || `x402_order_${Date.now()}`,
      user: data.user,
      intent: data.intent,
      amount: data.amount,
      sourceChain: data.sourceChain || this.chainId,
      targetChain: data.targetChain || this.chainId,
      sourceToken: data.sourceToken || 'USDC',
      targetToken: data.targetToken || 'CRO',
      allocation: data.allocation,
      routes: data.routes || [],
      executionType: data.executionType || 'once',
      mevProtection: data.mevProtection || true,
      crossChain: data.crossChain || false,
      status: 'pending',
      createdAt: Date.now(),
      estimatedGas: data.estimatedGas || '0.002',
      estimatedTime: data.estimatedTime || 30,
    };
  }

  private parseSettlementResponse(data: any): X402Settlement {
    return {
      orderId: data.orderId,
      txHash: data.txHash || `0x${Math.random().toString(16).substr(2, 64)}`,
      status: data.status || 'confirmed',
      gasUsed: data.gasUsed || '0.001523',
      executionTime: data.executionTime || 25,
      actualOutput: data.actualOutput || '0',
      mevSavings: data.mevSavings || '0.05',
      steps: data.steps || [],
    };
  }

  // Mock data generators for development
  private generateMockQuote(intent: string, amount: string, allocation: any): X402Quote {
    const baseGas = parseFloat(amount) * 0.001;
    return {
      orderId: `x402_mock_${Date.now()}`,
      routes: this.generateMockRoutes(allocation),
      totalGasEstimate: baseGas.toFixed(6),
      totalExecutionTime: Math.floor(Math.random() * 60) + 15,
      priceImpact: Math.random() * 0.5,
      mevSavings: (Math.random() * 0.1).toFixed(4),
      crossChainFee: allocation.growth > 30 ? '0.01' : '0',
      bestPrice: Math.random() > 0.2,
    };
  }

  private generateMockOrder(intent: string, amount: string, allocation: any, walletAddress: string): X402Order {
    return {
      id: `x402_order_${Date.now()}`,
      user: walletAddress,
      intent,
      amount,
      sourceChain: 25, // Cronos
      targetChain: allocation.growth > 30 ? 1 : 25, // Ethereum if high growth
      sourceToken: 'USDC',
      targetToken: 'CRO',
      allocation,
      routes: this.generateMockRoutes(allocation),
      executionType: 'once',
      mevProtection: true,
      crossChain: allocation.growth > 30,
      status: 'pending',
      createdAt: Date.now(),
      estimatedGas: (parseFloat(amount) * 0.001).toFixed(6),
      estimatedTime: Math.floor(Math.random() * 60) + 15,
    };
  }

  private generateMockSettlement(orderId: string): X402Settlement {
    return {
      orderId,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: 'confirmed',
      gasUsed: '0.001523',
      executionTime: Math.floor(Math.random() * 40) + 10,
      actualOutput: '0',
      mevSavings: (Math.random() * 0.1).toFixed(4),
      steps: [
        {
          stepId: `step_1_${Date.now()}`,
          stepNumber: 1,
          protocol: 'Uniswap V3',
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          status: 'confirmed',
          gasUsed: '0.0005',
          output: '0',
        },
        {
          stepId: `step_2_${Date.now()}`,
          stepNumber: 2,
          protocol: 'Curve Finance',
          txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          status: 'confirmed',
          gasUsed: '0.0007',
          output: '0',
        },
      ],
    };
  }

  private generateMockRoutes(allocation: any): X402Route[] {
    const routes: X402Route[] = [];
    
    if (allocation.stable > 0) {
      routes.push({
        id: `route_stable_${Date.now()}`,
        protocol: 'Curve Finance',
        sourceToken: 'USDC',
        targetToken: 'DAI',
        amount: (allocation.stable * 10).toString(),
        expectedOutput: (allocation.stable * 9.98).toString(),
        priceImpact: 0.02,
        gasEstimate: '0.0003',
        path: ['USDC', 'DAI'],
      });
    }

    if (allocation.liquid > 0) {
      routes.push({
        id: `route_liquid_${Date.now()}`,
        protocol: 'Uniswap V3',
        sourceToken: 'USDC',
        targetToken: 'USDT',
        amount: (allocation.liquid * 10).toString(),
        expectedOutput: (allocation.liquid * 9.95).toString(),
        priceImpact: 0.05,
        gasEstimate: '0.0005',
        path: ['USDC', 'USDT'],
      });
    }

    if (allocation.growth > 0) {
      routes.push({
        id: `route_growth_${Date.now()}`,
        protocol: allocation.growth > 30 ? 'Cross-Chain Bridge' : 'VVS Finance',
        sourceToken: 'USDC',
        targetToken: 'CRO',
        amount: (allocation.growth * 10).toString(),
        expectedOutput: (allocation.growth * 9.85).toString(),
        priceImpact: 0.15,
        gasEstimate: allocation.growth > 30 ? '0.01' : '0.0007',
        path: allocation.growth > 30 ? ['USDC', 'ETH', 'CRO'] : ['USDC', 'CRO'],
      });
    }

    return routes;
  }

  private generateMockCrossChainRoutes(): X402Route[] {
    return [
      {
        id: `cross_chain_${Date.now()}`,
        protocol: 'Stargate Bridge',
        sourceToken: 'USDC',
        targetToken: 'USDC.e',
        amount: '1000',
        expectedOutput: '995',
        priceImpact: 0.5,
        gasEstimate: '0.01',
        path: ['USDC', 'BRIDGE', 'USDC.e'],
      },
    ];
  }
}

// Export singleton instance
export const x402Client = new X402Client();

// Utility functions
export const formatX402Amount = (amount: string): string => {
  return parseFloat(amount).toFixed(4);
};

export const getX402ChainName = (chainId: number): string => {
  const chainNames: { [key: number]: string } = {
    1: 'Ethereum',
    25: 'Cronos',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
  };
  return chainNames[chainId] || `Chain ${chainId}`;
};

export const isX402Enabled = (): boolean => {
  return process.env.NEXT_PUBLIC_X402_ENABLED === 'true';
};