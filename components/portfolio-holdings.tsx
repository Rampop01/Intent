'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins, 
  Shield, 
  Zap,
  RefreshCw,
  ExternalLink,
  Eye,
  ArrowDownLeft
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { priceOracle } from '@/lib/price-oracle';
import { balanceService } from '@/lib/balance-service';

interface PortfolioPosition {
  id: string;
  strategyId: string;
  assetType: 'STABLE' | 'LIQUID' | 'GROWTH';
  tokenSymbol: string;
  amount: string;
  usdValue: string;
  percentage: number;
  performance: {
    change24h: number;
    changePercent: number;
  };
  platform?: string;
  apy?: number;
  status: 'active' | 'staking' | 'pending';
}

export function PortfolioHoldings() {
  const { savedStrategies, walletAddress, activityLog } = useApp();
  const [holdings, setHoldings] = useState<PortfolioPosition[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalChange, setTotalChange] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Simulate real portfolio data based on executed strategies
  useEffect(() => {
    const generateHoldings = async () => {
      if (!walletAddress || savedStrategies.length === 0) {
        setHoldings([]);
        setTotalValue(0);
        return;
      }

      setLoading(true);

      try {
        const positions: PortfolioPosition[] = [];
        let portfolioValue = 0;

        // Get executed strategies from activity log
        const executedStrategies = activityLog.filter(log => log.status === 'success');

        for (const execution of executedStrategies) {
          const strategy = execution.strategy;
          const tcroAmount = await priceOracle.convertUSDToTCRO(strategy.amount);
          const baseValue = parseFloat(strategy.amount);
          
          // Stable allocation
          if (strategy.allocation.stable > 0) {
            const stableAmount = (baseValue * strategy.allocation.stable) / 100;
            positions.push({
              id: `${execution.id}-stable`,
              strategyId: strategy.id || execution.id,
              assetType: 'STABLE',
              tokenSymbol: 'USDC',
              amount: stableAmount.toFixed(2),
              usdValue: stableAmount.toFixed(2),
              percentage: strategy.allocation.stable,
              performance: {
                change24h: stableAmount * 0.001, // Minimal stable gains
                changePercent: 0.1
              },
              platform: 'DEX Swap',
              status: 'active'
            });
            portfolioValue += stableAmount;
          }

          // Liquid allocation
          if (strategy.allocation.liquid > 0) {
            const liquidAmount = (baseValue * strategy.allocation.liquid) / 100;
            const performance = Math.random() * 10 - 2; // -2% to +8% random
            positions.push({
              id: `${execution.id}-liquid`,
              strategyId: strategy.id || execution.id,
              assetType: 'LIQUID',
              tokenSymbol: 'Various DeFi',
              amount: (liquidAmount * (1 + performance/100)).toFixed(2),
              usdValue: (liquidAmount * (1 + performance/100)).toFixed(2),
              percentage: strategy.allocation.liquid,
              performance: {
                change24h: liquidAmount * (performance/100),
                changePercent: performance
              },
              platform: 'Multi-DEX',
              status: 'active'
            });
            portfolioValue += liquidAmount * (1 + performance/100);
          }

          // Growth/Staking allocation
          if (strategy.allocation.growth > 0) {
            const growthAmount = (baseValue * strategy.allocation.growth) / 100;
            const stakingRewards = growthAmount * 0.12 * (30/365); // 12% APY for 30 days
            const currentValue = growthAmount + stakingRewards;
            
            positions.push({
              id: `${execution.id}-growth`,
              strategyId: strategy.id || execution.id,
              assetType: 'GROWTH',
              tokenSymbol: 'TCRO',
              amount: (currentValue / await priceOracle.getTCROPrice()).toFixed(0),
              usdValue: currentValue.toFixed(2),
              percentage: strategy.allocation.growth,
              performance: {
                change24h: stakingRewards + (growthAmount * (Math.random() * 6 - 1) / 100),
                changePercent: ((currentValue - growthAmount) / growthAmount) * 100
              },
              platform: 'Cronos Validators',
              apy: 12.5,
              status: 'staking'
            });
            portfolioValue += currentValue;
          }
        }

        setHoldings(positions);
        setTotalValue(portfolioValue);
        
        // Calculate total change
        const totalChange24h = positions.reduce((sum, pos) => sum + pos.performance.change24h, 0);
        setTotalChange(totalChange24h);

      } catch (error) {
        console.error('[Portfolio] Failed to generate holdings:', error);
      } finally {
        setLoading(false);
      }
    };

    generateHoldings();
  }, [savedStrategies, activityLog, walletAddress]);

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'STABLE': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'LIQUID': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'GROWTH': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'staking': return <Zap className="h-3 w-3 text-purple-600" />;
      case 'active': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'pending': return <RefreshCw className="h-3 w-3 text-orange-600 animate-spin" />;
      default: return null;
    }
  };

  if (!walletAddress) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Connect your wallet to view portfolio holdings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Portfolio Overview
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className={`text-2xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">24h Change</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <p className="text-2xl font-bold">{holdings.length}</p>
              <p className="text-sm text-muted-foreground">Active Positions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holdings List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Current Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading portfolio data...</p>
            </div>
          ) : holdings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No positions found</p>
              <p className="text-sm text-muted-foreground mt-1">Execute a strategy to see your holdings here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {holdings.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(holding.status)}
                      <Badge className={getAssetTypeColor(holding.assetType)}>
                        {holding.assetType}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-medium">{holding.tokenSymbol}</p>
                      <p className="text-sm text-muted-foreground">{holding.platform}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{holding.amount} {holding.tokenSymbol === 'TCRO' ? 'TCRO' : ''}</p>
                    <p className="text-sm text-muted-foreground">${holding.usdValue}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-medium ${holding.performance.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.performance.changePercent >= 0 ? '+' : ''}
                      {holding.performance.changePercent.toFixed(2)}%
                    </p>
                    {holding.apy && (
                      <p className="text-sm text-purple-600">{holding.apy}% APY</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-2"
                      onClick={() => {/* Will be handled by withdrawal manager */}}
                    >
                      <ArrowDownLeft className="h-3 w-3" />
                      Withdraw
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}