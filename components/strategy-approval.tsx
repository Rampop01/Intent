'use client';

import { useState, useEffect } from 'react';
import { Strategy } from '@/lib/app-context';
import { x402Client, X402Quote, isX402Enabled } from '@/lib/x402-client';
import { priceOracle } from '@/lib/price-oracle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BalanceDisplay } from '@/components/balance-display';
import { useApp } from '@/lib/app-context';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Shield,
  ArrowRight,
  Edit3,
  X,
  Zap,
  Globe,
  Activity,
  Timer,
  Link2
} from 'lucide-react';

interface StrategyApprovalProps {
  strategy: Strategy;
  onApprove: () => void;
  onCancel: () => void;
  onModify: () => void;
}

export function StrategyApproval({ strategy, onApprove, onCancel, onModify }: StrategyApprovalProps) {
  const { validateBalance, tcroPrice, userBalances } = useApp();
  const [isApproving, setIsApproving] = useState(false);
  const [x402Quote, setX402Quote] = useState<X402Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [x402Error, setX402Error] = useState<string | null>(null);
  const [balanceCheck, setBalanceCheck] = useState<{
    sufficient: boolean;
    required: string;
    available: string;
    deficit?: string;
    tcroEquivalent?: string;
  } | null>(null);

  // Check balance when component loads
  useEffect(() => {
    const checkBalance = async () => {
      const check = await validateBalance(strategy.amount);
      const tcroEquivalent = await priceOracle.convertUSDToTCRO(strategy.amount);
      setBalanceCheck({
        ...check,
        tcroEquivalent
      });
    };
    
    checkBalance();
  }, [strategy.amount, validateBalance]);

  // Load x402 quote when component mounts
  useEffect(() => {
    if (isX402Enabled()) {
      loadX402Quote();
    }
  }, [strategy]);

  const loadX402Quote = async () => {
    try {
      setIsLoadingQuote(true);
      setX402Error(null);
      
      const quote = await x402Client.getQuote(
        strategy.intent,
        strategy.amount.toString(),
        strategy.allocation
      );
      
      setX402Quote(quote);
    } catch (error) {
      console.error('[x402] Error loading quote:', error);
      setX402Error('Failed to load x402 settlement options');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await onApprove();
    setIsApproving(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getRiskDescription = (risk: string) => {
    switch (risk) {
      case 'low': return 'Conservative approach with minimal volatility. Your money is prioritized for safety.';
      case 'medium': return 'Balanced strategy with moderate risk. Seeking steady growth while protecting capital.';
      case 'high': return 'Aggressive growth strategy with higher volatility. Maximum potential returns with increased risk.';
      default: return 'Risk level not specified';
    }
  };

  const getExecutionDescription = (execution: string) => {
    switch (execution) {
      case 'once': return 'This strategy will execute one time only.';
      case 'weekly': return 'This strategy will automatically rebalance every week.';
      default: return 'Execution frequency not specified';
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <BalanceDisplay />

      {/* Balance Validation Alert */}
      {balanceCheck && !balanceCheck.sufficient && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Insufficient Balance!</strong> You need {priceOracle.formatTCROAmount(balanceCheck.required)} TCRO 
            (≈{priceOracle.formatUSDAmount(strategy.amount)}) but only have {priceOracle.formatTCROAmount(balanceCheck.available)} TCRO.
            {balanceCheck.deficit && ` Deficit: ${priceOracle.formatTCROAmount(balanceCheck.deficit)} TCRO.`}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            Review Your Strategy
          </CardTitle>
          <CardDescription>
            Please review the plan below. Nothing will happen until you approve it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">
                  {balanceCheck?.tcroEquivalent ? 
                    `${priceOracle.formatTCROAmount(balanceCheck.tcroEquivalent)}` : 
                    `$${strategy.amount}`
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {balanceCheck?.tcroEquivalent ? 
                    `≈ $${strategy.amount}` : 
                    'Investment Amount'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-accent" />
              <div>
                <Badge className={getRiskColor(strategy.riskLevel)}>
                  {strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)} Risk
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">Risk Level</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold capitalize">{strategy.execution}</p>
                <p className="text-sm text-muted-foreground">Execution</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Risk Explanation */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              What This Means
            </h4>
            <p className="text-sm text-muted-foreground">
              {getRiskDescription(strategy.riskLevel)}
            </p>
            <p className="text-sm text-muted-foreground">
              {getExecutionDescription(strategy.execution)}
            </p>
          </div>

          <Separator />

          {/* Asset Allocation */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              How Your Money Will Be Allocated
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-200">
                <div>
                  <p className="font-medium">Stable Assets (USDC, USDT)</p>
                  <p className="text-sm text-muted-foreground">Swap TCRO → stablecoins for stability</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-700">{strategy.allocation.stable}%</p>
                  <p className="text-sm text-muted-foreground">
                    {balanceCheck?.tcroEquivalent ? 
                      `${priceOracle.formatTCROAmount((parseFloat(balanceCheck.tcroEquivalent) * strategy.allocation.stable) / 100)}` :
                      `$${((parseFloat(strategy.amount) * strategy.allocation.stable) / 100).toLocaleString()}`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-200">
                <div>
                  <p className="font-medium">Liquid Tokens</p>
                  <p className="text-sm text-muted-foreground">TCRO → tradeable DeFi tokens</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-700">{strategy.allocation.liquid}%</p>
                  <p className="text-sm text-muted-foreground">
                    {balanceCheck?.tcroEquivalent ? 
                      `${priceOracle.formatTCROAmount((parseFloat(balanceCheck.tcroEquivalent) * strategy.allocation.liquid) / 100)}` :
                      `$${((parseFloat(strategy.amount) * strategy.allocation.liquid) / 100).toLocaleString()}`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-200">
                <div>
                  <p className="font-medium">Growth Assets (Staking)</p>
                  <p className="text-sm text-muted-foreground">Stake TCRO with validators for rewards</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-700">{strategy.allocation.growth}%</p>
                  <p className="text-sm text-muted-foreground">
                    {balanceCheck?.tcroEquivalent ? 
                      `${priceOracle.formatTCROAmount((parseFloat(balanceCheck.tcroEquivalent) * strategy.allocation.growth) / 100)}` :
                      `$${((parseFloat(strategy.amount) * strategy.allocation.growth) / 100).toLocaleString()}`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* x402 Settlement Features */}
          {isX402Enabled() && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" />
                  <h4 className="font-semibold">x402 Advanced Settlement</h4>
                  <Badge variant="outline" className="text-xs bg-accent/10">Enhanced</Badge>
                </div>
                
                {isLoadingQuote ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" />
                    <span className="text-sm">Loading x402 settlement analysis...</span>
                  </div>
                ) : x402Error ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{x402Error}</AlertDescription>
                  </Alert>
                ) : x402Quote ? (
                  <Tabs defaultValue="overview" className="space-y-3">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="routing">Routing</TabsTrigger>
                      <TabsTrigger value="protection">Protection</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-200">
                          <Zap className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Gas Fee</p>
                            <p className="font-medium text-sm">{x402Quote.totalGasEstimate} CRO</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-200">
                          <Timer className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Exec Time</p>
                            <p className="font-medium text-sm">{x402Quote.totalExecutionTime}s</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-200">
                          <Shield className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">MEV Savings</p>
                            <p className="font-medium text-sm">${x402Quote.mevSavings}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/5 border border-orange-200">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Best Price</p>
                            <p className="font-medium text-sm">{x402Quote.bestPrice ? '✓' : '✗'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {strategy.allocation.growth > 30 && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
                          <Globe className="h-4 w-4 text-accent" />
                          <div>
                            <p className="font-medium text-sm">Cross-Chain Execution Enabled</p>
                            <p className="text-xs text-muted-foreground">
                              Your strategy will execute across multiple blockchains for optimal allocation
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="routing" className="space-y-3">
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Execution Routes</h5>
                        {x402Quote.routes.map((route, index) => (
                          <div key={route.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{route.protocol}</p>
                                <p className="text-xs text-muted-foreground">
                                  {route.sourceToken} → {route.targetToken}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{route.amount} tokens</p>
                              <p className="text-xs text-muted-foreground">
                                {(route.priceImpact * 100).toFixed(2)}% impact
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="protection" className="space-y-3">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-200">
                          <Shield className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">MEV Protection Active</p>
                            <p className="text-xs text-muted-foreground">
                              Protected from front-running and sandwich attacks
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-200">
                          <Link2 className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">Atomic Execution</p>
                            <p className="text-xs text-muted-foreground">
                              All-or-nothing settlement ensures no partial failures
                            </p>
                          </div>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                          <p className="text-sm font-medium mb-2">Settlement Benefits:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• Gas optimization across all transactions</li>
                            <li>• Best price discovery from multiple DEXs</li>
                            <li>• Cross-chain routing when beneficial</li>
                            <li>• MEV protection saves an estimated ${x402Quote.mevSavings}</li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">x402 settlement will be applied during execution</span>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* AI Explanation */}
          <div className="space-y-3">
            <h4 className="font-semibold">AI Strategy Explanation</h4>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm leading-relaxed">{strategy.explanation}</p>
            </div>
          </div>

          {/* Important Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Before you continue:</strong> Make sure you understand this strategy and are comfortable with the risk level. 
              You can modify the strategy or cancel if you're not satisfied.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleApprove} 
              disabled={isApproving || (balanceCheck ? !balanceCheck.sufficient : false)}
              className="flex-1 gap-2"
              size="lg"
            >
              {isApproving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Executing Strategy...
                </>
              ) : (balanceCheck && !balanceCheck.sufficient) ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Insufficient Balance
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Approve & Execute
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onModify}
              disabled={isApproving}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Modify Strategy
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onCancel}
              disabled={isApproving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}