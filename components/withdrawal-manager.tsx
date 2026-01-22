'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowDownLeft, 
  Coins, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  TrendingDown,
  Lock,
  Unlock,
  RefreshCw,
  DollarSign,
  Wallet,
  Shield
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { priceOracle } from '@/lib/price-oracle';

interface WithdrawalPosition {
  id: string;
  assetType: 'STABLE' | 'LIQUID' | 'GROWTH';
  tokenSymbol: string;
  platform: string;
  totalAmount: string;
  availableAmount: string;
  lockedAmount?: string;
  usdValue: string;
  canWithdraw: boolean;
  withdrawalTime?: string; // For staked positions
  status: 'available' | 'locked' | 'unstaking' | 'pending';
  apr?: number;
}

export function WithdrawalManager() {
  const { savedStrategies, walletAddress, activityLog } = useApp();
  const [positions, setPositions] = useState<WithdrawalPosition[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState<{ [key: string]: string }>({});
  const [isWithdrawing, setIsWithdrawing] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);

  // Generate withdrawal positions based on executed strategies
  React.useEffect(() => {
    const generatePositions = async () => {
      setLoading(true);
      const mockPositions: WithdrawalPosition[] = [];

      // Get executed strategies to create positions
      const executedStrategies = activityLog.filter(log => log.status === 'success');

      for (const execution of executedStrategies) {
        const strategy = execution.strategy;
        
        // Create stable position (USDC)
        if (strategy.allocation.stable > 0) {
          const stableAmount = (parseFloat(strategy.amount) * strategy.allocation.stable / 100);
          mockPositions.push({
            id: `stable_${execution.id}`,
            assetType: 'STABLE',
            tokenSymbol: 'USDC',
            platform: 'VVS Finance',
            totalAmount: stableAmount.toFixed(2),
            availableAmount: stableAmount.toFixed(2),
            usdValue: stableAmount.toFixed(2),
            canWithdraw: true,
            status: 'available'
          });
        }

        // Create growth position (Staked TCRO)
        if (strategy.allocation.growth > 0) {
          const growthAmount = (parseFloat(strategy.amount) * strategy.allocation.growth / 100);
          const tcroPrice = await priceOracle.getTCROPrice();
          const tcroAmount = growthAmount / tcroPrice;
          
          mockPositions.push({
            id: `growth_${execution.id}`,
            assetType: 'GROWTH',
            tokenSymbol: 'TCRO',
            platform: 'Cronos Validators',
            totalAmount: tcroAmount.toFixed(4),
            availableAmount: '0', // Staked, needs unstaking
            lockedAmount: tcroAmount.toFixed(4),
            usdValue: growthAmount.toFixed(2),
            canWithdraw: false, // Need to unstake first
            withdrawalTime: '21 days',
            status: 'locked',
            apr: 8.5
          });
        }

        // Create liquid position (DeFi tokens)
        if (strategy.allocation.liquid > 0) {
          const liquidAmount = (parseFloat(strategy.amount) * strategy.allocation.liquid / 100);
          mockPositions.push({
            id: `liquid_${execution.id}`,
            assetType: 'LIQUID',
            tokenSymbol: 'VVS',
            platform: 'VVS Finance LP',
            totalAmount: (liquidAmount * 1000).toFixed(0), // Mock VVS tokens
            availableAmount: (liquidAmount * 1000 * 0.8).toFixed(0), // 80% available
            lockedAmount: (liquidAmount * 1000 * 0.2).toFixed(0), // 20% in rewards
            usdValue: liquidAmount.toFixed(2),
            canWithdraw: true,
            status: 'available',
            apr: 12.3
          });
        }
      }

      setPositions(mockPositions);
      setLoading(false);
    };

    if (activityLog.length > 0) {
      generatePositions();
    }
  }, [activityLog]);

  const handleWithdraw = async (positionId: string, amount: string) => {
    setIsWithdrawing(prev => ({ ...prev, [positionId]: true }));
    
    try {
      // Simulate withdrawal process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update position after withdrawal
      setPositions(prev => prev.map(pos => {
        if (pos.id === positionId) {
          const withdrawAmount = parseFloat(amount);
          const newAvailable = parseFloat(pos.availableAmount) - withdrawAmount;
          return {
            ...pos,
            availableAmount: Math.max(0, newAvailable).toFixed(pos.tokenSymbol === 'TCRO' ? 4 : 2),
            totalAmount: (parseFloat(pos.totalAmount) - withdrawAmount).toFixed(pos.tokenSymbol === 'TCRO' ? 4 : 2)
          };
        }
        return pos;
      }));

      // Clear withdrawal amount
      setWithdrawalAmount(prev => ({ ...prev, [positionId]: '' }));
      
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setIsWithdrawing(prev => ({ ...prev, [positionId]: false }));
    }
  };

  const handleUnstake = async (positionId: string) => {
    setIsWithdrawing(prev => ({ ...prev, [positionId]: true }));
    
    try {
      // Start unstaking process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPositions(prev => prev.map(pos => {
        if (pos.id === positionId) {
          return {
            ...pos,
            status: 'unstaking' as const,
            canWithdraw: false,
            withdrawalTime: '21 days remaining'
          };
        }
        return pos;
      }));
      
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setIsWithdrawing(prev => ({ ...prev, [positionId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'locked': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'unstaking': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'pending': return 'bg-gray-500/10 text-gray-700 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="h-4 w-4" />;
      case 'locked': return <Lock className="h-4 w-4" />;
      case 'unstaking': return <Clock className="h-4 w-4" />;
      case 'pending': return <RefreshCw className="h-4 w-4 animate-spin" />;
      default: return <Coins className="h-4 w-4" />;
    }
  };

  const totalWithdrawable = positions.reduce((sum, pos) => {
    if (pos.canWithdraw && pos.availableAmount !== '0') {
      return sum + parseFloat(pos.usdValue) * (parseFloat(pos.availableAmount) / parseFloat(pos.totalAmount));
    }
    return sum;
  }, 0);

  const totalLocked = positions.reduce((sum, pos) => {
    if (!pos.canWithdraw || pos.lockedAmount) {
      return sum + parseFloat(pos.usdValue);
    }
    return sum;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownLeft className="h-5 w-5 text-accent" />
          Withdraw Your Money
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your positions and withdraw funds back to your wallet
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto mb-3 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading your positions...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-8">
            <Wallet className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No positions found</p>
            <p className="text-sm text-muted-foreground mt-1">Execute a strategy to see withdrawable positions here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Unlock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Available to Withdraw</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalWithdrawable.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Ready for immediate withdrawal</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Locked/Staking</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    ${totalLocked.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">Earning rewards, requires unstaking</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Individual Positions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Your Positions</h3>
              {positions.map((position) => (
                <div key={position.id} className="border rounded-lg p-4 space-y-4">
                  {/* Position Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        position.assetType === 'STABLE' ? 'bg-green-100 text-green-700' :
                        position.assetType === 'GROWTH' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {position.assetType === 'STABLE' ? <Shield className="h-5 w-5" /> :
                         position.assetType === 'GROWTH' ? <TrendingDown className="h-5 w-5" /> :
                         <Coins className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{position.tokenSymbol}</p>
                        <p className="text-sm text-muted-foreground">{position.platform}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${position.usdValue}</p>
                      <Badge className={getStatusColor(position.status)}>
                        {getStatusIcon(position.status)}
                        <span className="ml-1">{position.status}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Position Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Balance</Label>
                      <p className="font-medium">{position.totalAmount} {position.tokenSymbol}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Available</Label>
                      <p className="font-medium text-green-600">{position.availableAmount} {position.tokenSymbol}</p>
                    </div>
                    {position.lockedAmount && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Locked/Staking</Label>
                        <p className="font-medium text-yellow-600">{position.lockedAmount} {position.tokenSymbol}</p>
                      </div>
                    )}
                    {position.apr && (
                      <div>
                        <Label className="text-xs text-muted-foreground">APR</Label>
                        <p className="font-medium text-blue-600">{position.apr}%</p>
                      </div>
                    )}
                  </div>

                  {/* Withdrawal Actions */}
                  {position.canWithdraw && parseFloat(position.availableAmount) > 0 ? (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`withdraw-${position.id}`} className="text-sm">
                            Withdrawal Amount
                          </Label>
                          <Input
                            id={`withdraw-${position.id}`}
                            type="number"
                            placeholder={`Max: ${position.availableAmount}`}
                            value={withdrawalAmount[position.id] || ''}
                            onChange={(e) => setWithdrawalAmount(prev => ({ 
                              ...prev, 
                              [position.id]: e.target.value 
                            }))}
                            max={position.availableAmount}
                            step={position.tokenSymbol === 'TCRO' ? '0.0001' : '0.01'}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            onClick={() => handleWithdraw(position.id, withdrawalAmount[position.id])}
                            disabled={!withdrawalAmount[position.id] || isWithdrawing[position.id]}
                            className="gap-2"
                          >
                            {isWithdrawing[position.id] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowDownLeft className="h-4 w-4" />
                            )}
                            Withdraw
                          </Button>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWithdrawalAmount(prev => ({ 
                          ...prev, 
                          [position.id]: position.availableAmount 
                        }))}
                      >
                        Withdraw All Available
                      </Button>
                    </div>
                  ) : position.status === 'locked' ? (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Funds are staked and earning {position.apr}% APR
                          </p>
                          <p className="text-xs text-yellow-600">
                            Unstaking required - takes {position.withdrawalTime}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleUnstake(position.id)}
                        disabled={isWithdrawing[position.id]}
                        className="gap-2"
                      >
                        {isWithdrawing[position.id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                        Start Unstaking
                      </Button>
                    </div>
                  ) : position.status === 'unstaking' ? (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Unstaking in progress
                          </p>
                          <p className="text-xs text-blue-600">{position.withdrawalTime}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground">No funds available for withdrawal</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Emergency Withdrawal Warning */}
            {positions.some(p => p.status === 'locked') && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Important: Staked Position Withdrawal
                    </h4>
                    <p className="text-sm text-red-600 mt-1">
                      Staked TCRO positions require a 21-day unstaking period. You'll stop earning rewards during this time. 
                      Plan accordingly and only unstake what you need.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}