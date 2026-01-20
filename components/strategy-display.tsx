'use client';

import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Zap } from 'lucide-react';

interface StrategyDisplayProps {
  onExecute: () => void;
}

export function StrategyDisplay({ onExecute }: StrategyDisplayProps) {
  const { currentStrategy, isExecuting } = useApp();

  if (!currentStrategy) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">No Strategy Generated</h3>
            <p className="text-sm text-muted-foreground">
              Enter an intent above to generate a strategy
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const riskColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  const allocationData = [
    { name: 'Stable', value: currentStrategy.allocation.stable },
    { name: 'Liquid', value: currentStrategy.allocation.liquid },
    { name: 'Growth', value: currentStrategy.allocation.growth },
  ];

  return (
    <div className="space-y-4">
      {/* Strategy Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle>Strategy Preview</CardTitle>
              <CardDescription>Review before executing</CardDescription>
            </div>
            <Badge
              variant={
                currentStrategy.riskLevel === 'high'
                  ? 'destructive'
                  : currentStrategy.riskLevel === 'low'
                    ? 'default'
                    : 'secondary'
              }
            >
              {currentStrategy.riskLevel.charAt(0).toUpperCase() + currentStrategy.riskLevel.slice(1)} Risk
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="text-sm text-muted-foreground">Amount</div>
              <div className="text-2xl font-bold text-primary">${currentStrategy.amount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="text-sm text-muted-foreground">Execution</div>
              <div className="text-2xl font-bold text-accent capitalize">
                {currentStrategy.execution}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="text-sm text-muted-foreground">Monitoring</div>
              <div className="text-2xl font-bold text-primary capitalize">
                {currentStrategy.monitoring}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={allocationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Bar dataKey="value" fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Explanation */}
      <Card className="border-l-2 border-l-primary bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            AI Explanation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {currentStrategy.explanation}
          </p>
        </CardContent>
      </Card>

      {/* Execute Button */}
      <Button
        onClick={onExecute}
        disabled={isExecuting}
        size="lg"
        className="w-full gap-2"
      >
        <Zap className="h-5 w-5" />
        {isExecuting ? 'Executing Strategy...' : 'Approve & Execute'}
      </Button>
    </div>
  );
}
