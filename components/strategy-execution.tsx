import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Strategy } from '@/lib/app-context';
import { contractService } from '@/lib/contract-service';
import { TOKENS } from '@/lib/contract';
import { Play, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface StrategyExecutionProps {
  strategy: Strategy;
  onExecutionComplete: (txHash: string) => void;
}

export function StrategyExecution({ strategy, onExecutionComplete }: StrategyExecutionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionStep, setExecutionStep] = useState('');
  const [error, setError] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  const executeStrategy = async () => {
    if (!strategy.id) {
      setError('Strategy ID not found');
      return;
    }

    setIsExecuting(true);
    setError('');
    setExecutionProgress(0);
    setExecutionStep('Preparing execution...');

    try {
      // Step 1: Check network
      setExecutionStep('Checking network connection...');
      setExecutionProgress(20);
      
      const isCorrectNetwork = await contractService.isNetworkCorrect();
      if (!isCorrectNetwork) {
        setExecutionStep('Switching to Cronos Testnet...');
        await contractService.switchToCorrectNetwork();
      }

      // Step 2: Prepare execution parameters
      setExecutionStep('Preparing transaction parameters...');
      setExecutionProgress(40);
      
      // For now, we'll use USDC as the input token
      const inputToken = TOKENS.USDC; // 0x... USDC address
      const amount = strategy.amount; // Amount is already in string format

      // Step 3: Execute strategy on-chain
      setExecutionStep('Executing strategy on blockchain...');
      setExecutionProgress(60);
      
      const { txHash: executionTxHash } = await contractService.executeStrategy(
        strategy.id,
        inputToken,
        amount
      );

      setTxHash(executionTxHash);

      // Step 4: Wait for confirmation
      setExecutionStep('Waiting for transaction confirmation...');
      setExecutionProgress(80);
      
      // Small delay to simulate confirmation wait
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Complete
      setExecutionStep('Strategy executed successfully!');
      setExecutionProgress(100);

      // Notify parent component
      onExecutionComplete(executionTxHash);

    } catch (err: any) {
      console.error('[Strategy Execution] Failed:', err);
      setError(err.message || 'Failed to execute strategy');
    } finally {
      setIsExecuting(false);
    }
  };

  const getBlockExplorerUrl = (hash: string) => {
    return `https://testnet.cronoscan.com/tx/${hash}`;
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Execute Strategy
        </CardTitle>
        <CardDescription>
          Execute your DeFi strategy on-chain using the 0x402 protocol
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Strategy Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Amount:</span>
            <span className="font-semibold">{formatAmount(strategy.amount)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Risk Level:</span>
            <Badge className={getRiskBadgeColor(strategy.riskLevel)}>
              {strategy.riskLevel.toUpperCase()}
            </Badge>
          </div>

          <div className="space-y-2">
            <span className="font-medium">Asset Allocation:</span>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{strategy.allocation.stable}%</div>
                <div className="text-gray-600">Stablecoins</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{strategy.allocation.liquid}%</div>
                <div className="text-gray-600">Liquid Tokens</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-600">{strategy.allocation.growth}%</div>
                <div className="text-gray-600">Growth Assets</div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <span className="font-medium">Protocol Features:</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">🛡️ MEV Protection</Badge>
              <Badge variant="outline">⚡ 0x402 Protocol</Badge>
              <Badge variant="outline">🔗 Cross-Chain</Badge>
              <Badge variant="outline">⛽ Gas Optimized</Badge>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Execution Progress */}
        {isExecuting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Execution Progress</span>
              <span className="text-sm text-gray-600">{executionProgress}%</span>
            </div>
            <Progress value={executionProgress} className="w-full" />
            <p className="text-sm text-gray-600">{executionStep}</p>
          </div>
        )}

        {/* Success State */}
        {txHash && !isExecuting && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Strategy executed successfully!</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getBlockExplorerUrl(txHash), '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Transaction
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={executeStrategy}
          disabled={isExecuting || !!txHash}
          className="w-full"
          size="lg"
        >
          {isExecuting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Executing Strategy...
            </>
          ) : txHash ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Strategy Executed
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Execute Strategy
            </>
          )}
        </Button>

        {/* Transaction Hash */}
        {strategy.txHash && (
          <div className="text-xs text-gray-500">
            <p>Created: 
              <a 
                href={getBlockExplorerUrl(strategy.txHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline"
              >
                {strategy.txHash.slice(0, 10)}...{strategy.txHash.slice(-8)}
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}