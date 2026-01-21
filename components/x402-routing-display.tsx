'use client';

import React from 'react';
import { X402Route, X402Quote } from '@/lib/x402-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  Zap, 
  Timer, 
  TrendingUp, 
  Shield, 
  Link2,
  Activity,
  Globe,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface X402RoutingDisplayProps {
  quote: X402Quote;
  className?: string;
}

export function X402RoutingDisplay({ quote, className = '' }: X402RoutingDisplayProps) {
  const totalValue = quote.routes.reduce((sum, route) => sum + parseFloat(route.amount), 0);
  
  const getProtocolIcon = (protocol: string) => {
    if (protocol.toLowerCase().includes('bridge')) return <Globe className="h-4 w-4" />;
    if (protocol.toLowerCase().includes('uniswap')) return <Activity className="h-4 w-4" />;
    if (protocol.toLowerCase().includes('curve')) return <TrendingUp className="h-4 w-4" />;
    return <Link2 className="h-4 w-4" />;
  };

  const getProtocolColor = (protocol: string) => {
    if (protocol.toLowerCase().includes('bridge')) return 'bg-purple-500/10 text-purple-700 border-purple-200';
    if (protocol.toLowerCase().includes('uniswap')) return 'bg-pink-500/10 text-pink-700 border-pink-200';
    if (protocol.toLowerCase().includes('curve')) return 'bg-blue-500/10 text-blue-700 border-blue-200';
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getRiskLevel = (priceImpact: number) => {
    if (priceImpact < 0.01) return { level: 'Low', color: 'text-green-600', icon: CheckCircle2 };
    if (priceImpact < 0.05) return { level: 'Medium', color: 'text-yellow-600', icon: AlertTriangle };
    return { level: 'High', color: 'text-red-600', icon: AlertTriangle };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          x402 Execution Routes
        </CardTitle>
        <CardDescription>
          Optimized routing across {quote.routes.length} protocols with MEV protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Route Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-accent">{quote.routes.length}</p>
            <p className="text-xs text-muted-foreground">Routes</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-green-600">{quote.totalGasEstimate}</p>
            <p className="text-xs text-muted-foreground">Total Gas</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-blue-600">{quote.totalExecutionTime}s</p>
            <p className="text-xs text-muted-foreground">Est. Time</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-purple-600">${quote.mevSavings}</p>
            <p className="text-xs text-muted-foreground">MEV Savings</p>
          </div>
        </div>

        {/* Individual Routes */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Execution Steps</h4>
          {quote.routes.map((route, index) => {
            const percentage = totalValue > 0 ? (parseFloat(route.amount) / totalValue) * 100 : 0;
            const risk = getRiskLevel(route.priceImpact);
            const RiskIcon = risk.icon;

            return (
              <div key={route.id} className="relative">
                {/* Route Card */}
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  {/* Step Number */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Route Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getProtocolIcon(route.protocol)}
                        <span className="font-medium">{route.protocol}</span>
                      </div>
                      <Badge className={getProtocolColor(route.protocol)}>
                        {route.protocol}
                      </Badge>
                    </div>

                    {/* Token Flow */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                        {route.sourceToken}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                        {route.targetToken}
                      </span>
                    </div>

                    {/* Route Metrics */}
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{route.amount} tokens</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{route.gasEstimate} gas</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <RiskIcon className={`h-3 w-3 ${risk.color}`} />
                        <span className={risk.color}>
                          {(route.priceImpact * 100).toFixed(2)}% impact
                        </span>
                      </div>
                    </div>

                    {/* Path Visualization */}
                    {route.path.length > 2 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Path: </span>
                        {route.path.map((token, i) => (
                          <React.Fragment key={i}>
                            <span className="text-accent">{token}</span>
                            {i < route.path.length - 1 && (
                              <ArrowRight className="h-3 w-3 inline mx-1 text-muted-foreground" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount & Percentage */}
                  <div className="text-right space-y-1">
                    <p className="font-bold">${parseFloat(route.expectedOutput).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
                    <Progress value={percentage} className="w-16 h-1" />
                  </div>
                </div>

                {/* Connection Line to Next Step */}
                {index < quote.routes.length - 1 && (
                  <div className="absolute left-6 top-full w-0.5 h-4 bg-border"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* x402 Features Summary */}
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            x402 Settlement Benefits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>MEV Protection Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Atomic Execution Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Best Price Discovery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Gas Optimization</span>
            </div>
          </div>
        </div>

        {/* Best Price Indicator */}
        {quote.bestPrice && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Best Price Guarantee</p>
              <p className="text-sm text-green-600">
                x402 has found the optimal execution path across all available liquidity sources
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}