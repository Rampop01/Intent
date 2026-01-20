'use client';

import React from 'react';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IntentFormProps {
  onStrategyGenerated: () => void;
}

// Preset strategies
const PRESET_STRATEGIES = {
  safe_save: {
    intent: 'Save $200 safely with minimal risk',
    amount: 200,
    riskLevel: 'low' as const,
    allocation: { stable: 85, liquid: 15, growth: 0 },
    execution: 'once' as const,
    monitoring: 'monthly',
    explanation:
      'Conservative strategy focusing on capital preservation. 85% in stablecoins (USDC/USDT), 15% in liquid tokens.',
  },
  balanced_invest: {
    intent: 'Invest $500 with balanced growth and risk',
    amount: 500,
    riskLevel: 'medium' as const,
    allocation: { stable: 40, liquid: 30, growth: 30 },
    execution: 'weekly' as const,
    monitoring: 'weekly',
    explanation:
      'Balanced approach for steady growth. 40% stablecoins, 30% liquid tokens, 30% growth assets with weekly rebalancing.',
  },
  aggressive_growth: {
    intent: 'Deploy $1000 aggressively for maximum growth',
    amount: 1000,
    riskLevel: 'high' as const,
    allocation: { stable: 10, liquid: 20, growth: 70 },
    execution: 'weekly' as const,
    monitoring: 'daily',
    explanation:
      'Growth-focused strategy for experienced investors. 10% stablecoins, 20% liquid, 70% growth assets with daily monitoring.',
  },
};

export function IntentForm({ onStrategyGenerated }: IntentFormProps) {
  const { walletConnected, setStrategy, currentStrategy } = useApp();
  const [intent, setIntent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!intent.trim() || !walletConnected) return;

    setIsProcessing(true);
    setError(null);

    try {
      console.log('[v0] Parsing intent:', intent);

      // Call real AI parsing API
      const response = await fetch('/api/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse intent');
      }

      const parsedIntent = await response.json();
      console.log('[v0] Parsed intent result:', parsedIntent);

      setStrategy({
        intent,
        amount: parsedIntent.amount,
        riskLevel: parsedIntent.riskLevel,
        allocation: parsedIntent.allocation,
        execution: parsedIntent.executionType,
        monitoring: parsedIntent.monitoring,
        explanation: parsedIntent.explanation,
      });

      setIntent('');
      onStrategyGenerated();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse intent';
      console.error('[v0] Error:', message);
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }

  function handlePreset(key: string) {
    const strategy = PRESET_STRATEGIES[key as keyof typeof PRESET_STRATEGIES];
    setStrategy(strategy);
    setError(null);
    onStrategyGenerated();
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Intent Input */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Express Your Intent
          </CardTitle>
          <CardDescription>
            Describe what you want to do with your money. Our AI will parse your intent and create a strategy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g., Save $200 safely, invest $500 with balanced risk, deploy $1000 aggressively for weekly rebalancing..."
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              disabled={!walletConnected || isProcessing}
              className="min-h-24 resize-none"
            />
            <Button
              type="submit"
              disabled={!intent.trim() || !walletConnected || isProcessing}
              className="w-full gap-2"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Processing with AI...
                </>
              ) : (
                <>
                  Generate Strategy
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preset Strategies */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Templates</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            variant={currentStrategy?.amount === 200 ? 'default' : 'outline'}
            onClick={() => handlePreset('safe_save')}
            disabled={!walletConnected}
            className="flex-col items-start h-auto p-4"
          >
            <div className="font-semibold">Safe Save</div>
            <div className="text-xs opacity-75">$200, Low Risk</div>
          </Button>
          <Button
            variant={currentStrategy?.amount === 500 ? 'default' : 'outline'}
            onClick={() => handlePreset('balanced_invest')}
            disabled={!walletConnected}
            className="flex-col items-start h-auto p-4"
          >
            <div className="font-semibold">Balanced</div>
            <div className="text-xs opacity-75">$500, Medium Risk</div>
          </Button>
          <Button
            variant={currentStrategy?.amount === 1000 ? 'default' : 'outline'}
            onClick={() => handlePreset('aggressive_growth')}
            disabled={!walletConnected}
            className="flex-col items-start h-auto p-4"
          >
            <div className="font-semibold">Growth</div>
            <div className="text-xs opacity-75">$1000, High Risk</div>
          </Button>
        </div>
      </div>
    </div>
  );
}
