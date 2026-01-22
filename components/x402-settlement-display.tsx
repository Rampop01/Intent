'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  ArrowRight, 
  ExternalLink, 
  Shield, 
  Zap,
  Globe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { useApp } from '@/lib/app-context';

interface X402Settlement {
  id: string;
  strategyId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp: Date;
  routes: {
    step: number;
    protocol: string;
    action: string;
    inputToken: string;
    outputToken: string;
    amount: string;
    txHash?: string;
    gasUsed?: string;
    status: 'pending' | 'completed' | 'failed';
  }[];
  mevSavings?: string;
  totalGas?: string;
  executionTime?: number;
}

export function X402SettlementDisplay() {
  const { activityLog, savedStrategies } = useApp();
  const [settlements, setSettlements] = useState<X402Settlement[]>([]);

  useEffect(() => {
    // Generate x402 settlement data based on executed strategies
    const generateSettlements = () => {
      const mockSettlements: X402Settlement[] = [];

      // Get executed strategies
      const executedStrategies = activityLog.filter(log => log.status === 'success');

      executedStrategies.forEach((execution, index) => {
        const strategy = execution.strategy;
        const routes = [];

        // Generate settlement routes based on allocation
        let stepCounter = 1;

        if (strategy.allocation.stable > 0) {
          routes.push({
            step: stepCounter++,
            protocol: 'VVS Finance',
            action: 'Swap TCRO → USDC',
            inputToken: 'TCRO',
            outputToken: 'USDC',
            amount: `${(parseFloat(strategy.amount) * strategy.allocation.stable / 100).toFixed(2)} USD`,
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            gasUsed: '0.001234',
            status: 'completed' as const
          });
        }

        if (strategy.allocation.liquid > 0) {
          routes.push({
            step: stepCounter++,
            protocol: 'Multi-DEX Aggregator',
            action: 'Swap TCRO → DeFi Tokens',
            inputToken: 'TCRO',
            outputToken: 'Various',
            amount: `${(parseFloat(strategy.amount) * strategy.allocation.liquid / 100).toFixed(2)} USD`,
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            gasUsed: '0.002156',
            status: 'completed' as const
          });
        }

        if (strategy.allocation.growth > 0) {
          routes.push({
            step: stepCounter++,
            protocol: 'Cronos Validators',
            action: 'Stake TCRO',
            inputToken: 'TCRO',
            outputToken: 'Staked TCRO',
            amount: `${(parseFloat(strategy.amount) * strategy.allocation.growth / 100).toFixed(2)} USD`,
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            gasUsed: '0.000891',
            status: 'completed' as const
          });
        }

        mockSettlements.push({
          id: `x402_${execution.id}`,
          strategyId: strategy.id || execution.id,
          status: 'completed',
          timestamp: execution.timestamp,
          routes,
          mevSavings: (Math.random() * 5 + 1).toFixed(3),
          totalGas: routes.reduce((sum, route) => sum + parseFloat(route.gasUsed || '0'), 0).toFixed(6),
          executionTime: Math.floor(Math.random() * 45) + 15
        });
      });

      setSettlements(mockSettlements.reverse()); // Most recent first
    };

    generateSettlements();
  }, [activityLog]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'executing': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'executing': return <Clock className="h-4 w-4 animate-spin" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getProtocolIcon = (protocol: string) => {
    if (protocol.includes('VVS')) return <Zap className="h-4 w-4 text-blue-600" />;
    if (protocol.includes('Validator')) return <Shield className="h-4 w-4 text-purple-600" />;
    if (protocol.includes('Multi')) return <Globe className="h-4 w-4 text-green-600" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          x402 Settlement History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track how x402 protocol optimized your strategy executions
        </p>
      </CardHeader>
      <CardContent>
        {settlements.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No settlements yet</p>
            <p className="text-sm text-muted-foreground mt-1">Execute a strategy to see x402 routing here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settlements.map((settlement) => (
              <div key={settlement.id} className="border rounded-lg p-4 space-y-3">
                {/* Settlement Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(settlement.status)}
                    <Badge className={getStatusColor(settlement.status)}>
                      {settlement.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {settlement.timestamp.toLocaleDateString()} {settlement.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {settlement.mevSavings && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">${settlement.mevSavings} MEV saved</span>
                      </div>
                    )}
                    {settlement.executionTime && (
                      <span className="text-muted-foreground">{settlement.executionTime}s</span>
                    )}
                  </div>
                </div>

                {/* Settlement Routes */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Execution Flow:</p>
                  {settlement.routes.map((route, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs">
                        {route.step}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getProtocolIcon(route.protocol)}
                        <span className="font-medium text-sm">{route.protocol}</span>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium">{route.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {route.inputToken} → {route.outputToken} ({route.amount})
                        </p>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {route.status}
                        </Badge>
                        {route.gasUsed && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Gas: {route.gasUsed} TCRO
                          </p>
                        )}
                      </div>

                      {route.txHash && (
                        <Button variant="ghost" size="sm" className="p-1">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Settlement Summary */}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Gas Used:</span>
                  <span className="font-medium">{settlement.totalGas} TCRO</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}