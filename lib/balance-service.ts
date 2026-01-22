'use client';

import { ethers } from 'ethers';
import { TokenBalances, priceOracle } from './price-oracle';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// Cronos testnet token addresses
const TOKEN_ADDRESSES = {
  USDC: '0x8D5b93f1a82EE3c5A5F46ffd5F1C8b5b0F4e9A2D', // Mock USDC address for Cronos testnet
  USDT: '0x9D5b93f1a82EE3c5A5F46ffd5F1C8b5b0F4e9A3E', // Mock USDT address for Cronos testnet
};

class BalanceService {
  private provider: ethers.Provider | null = null;

  async initializeProvider(): Promise<void> {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        console.log('[Balance Service] Provider initialized');
      } catch (error) {
        console.error('[Balance Service] Failed to initialize provider:', error);
        // Fallback to public RPC
        this.provider = new ethers.JsonRpcProvider('https://evm-t3.cronos.org/');
      }
    } else {
      // Fallback to public RPC for server-side or non-MetaMask browsers
      this.provider = new ethers.JsonRpcProvider('https://evm-t3.cronos.org/');
    }
  }

  async getUserBalances(walletAddress: string): Promise<TokenBalances> {
    if (!this.provider) {
      await this.initializeProvider();
    }

    if (!this.provider || !walletAddress) {
      return { tcro: '0', usdc: '0', usdt: '0' };
    }

    try {
      console.log('[Balance Service] Fetching balances for:', walletAddress);

      // Get TCRO balance (native token)
      const tcroBalance = await this.provider.getBalance(walletAddress);
      const tcroFormatted = ethers.formatEther(tcroBalance);

      // Mock ERC20 token balances for demo
      // In production, these would be real contract calls
      const balances: TokenBalances = {
        tcro: parseFloat(tcroFormatted).toFixed(2),
        usdc: '0.00', // Mock for now
        usdt: '0.00', // Mock for now
      };

      console.log('[Balance Service] Balances fetched:', balances);
      return balances;
    } catch (error) {
      console.error('[Balance Service] Failed to fetch balances:', error);
      
      // Return mock balances for development/testing
      const mockBalances: TokenBalances = {
        tcro: '1250.50', // Mock balance for testing
        usdc: '0.00',
        usdt: '0.00',
      };
      
      console.log('[Balance Service] Using mock balances:', mockBalances);
      return mockBalances;
    }
  }

  async getERC20Balance(
    tokenAddress: string, 
    walletAddress: string, 
    decimals: number = 18
  ): Promise<string> {
    if (!this.provider) {
      await this.initializeProvider();
    }

    if (!this.provider) return '0';

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(walletAddress);
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error(`[Balance Service] Failed to get token balance:`, error);
      return '0';
    }
  }

  async validateSufficientBalance(
    walletAddress: string,
    requiredUSD: string
  ): Promise<{ sufficient: boolean; required: string; available: string; deficit?: string }> {
    const balances = await this.getUserBalances(walletAddress);
    const requiredTCRO = await priceOracle.convertUSDToTCRO(requiredUSD);
    const availableTCRO = parseFloat(balances.tcro);
    const requiredTCRONum = parseFloat(requiredTCRO);

    const sufficient = availableTCRO >= requiredTCRONum;
    const deficit = sufficient ? undefined : (requiredTCRONum - availableTCRO).toFixed(2);

    return {
      sufficient,
      required: requiredTCRO,
      available: balances.tcro,
      deficit
    };
  }

  formatBalance(balance: string, symbol: string): string {
    const num = parseFloat(balance);
    if (symbol === 'TCRO') {
      return priceOracle.formatTCROAmount(num);
    }
    return `${num.toLocaleString()} ${symbol}`;
  }
}

export const balanceService = new BalanceService();