import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { contractService, OnChainStrategy } from '@/lib/contract-service';
import { CONTRACT_ADDRESS } from '@/lib/contract';
import { useAccount, useChainId } from 'wagmi';
import { cronosTestnet } from '@/config';
import { ExternalLink, RefreshCw, Database, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function ContractDashboard() {
  const { address: walletAddress, isConnected: walletConnected } = useAccount();
  const chainId = useChainId();
  const [strategies, setStrategies] = useState<OnChainStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'checking' | 'correct' | 'incorrect'>('checking');
  const [error, setError] = useState<string>('');

  const isCorrectNetwork = chainId === cronosTestnet.id;

  useEffect(() => {
    if (walletConnected && walletAddress) {
      checkNetwork();
      loadUserStrategies();
    }
  }, [walletConnected, walletAddress]);

  const checkNetwork = async () => {
    setNetworkStatus(isCorrectNetwork ? 'correct' : 'incorrect');
  };

  const loadUserStrategies = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError('');

    try {
      const strategyIds = await contractService.getUserStrategies(walletAddress);
      const strategiesData = await Promise.all(
        strategyIds.map(id => contractService.getStrategy(id))
      );
      
      const validStrategies = strategiesData.filter(s => s !== null) as OnChainStrategy[];
      setStrategies(validStrategies);
    } catch (err: any) {
      console.error('[Contract Dashboard] Failed to load strategies:', err);
      setError(err.message || 'Failed to load strategies from blockchain');
    } finally {
      setLoading(false);
    }
  };

  const switchNetwork = async () => {
    try {
      await contractService.switchToCorrectNetwork();
      await checkNetwork();
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
    }
  };

  const getExplorerUrl = (hash: string) => {
    return `https://testnet.cronoscan.com/tx/${hash}`;
  };

  const getContractExplorerUrl = () => {
    return `https://testnet.cronoscan.com/address/${CONTRACT_ADDRESS}`;
  };

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (executed: boolean) => {
    return executed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Clock className="h-4 w-4 text-blue-600" />
    );
  };

  if (!walletConnected) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Contract Dashboard
          </CardTitle>
          <CardDescription>
            View your on-chain strategies and contract interaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Please connect your wallet to view contract data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Contract Dashboard
        </CardTitle>
        <CardDescription className="space-y-1">
          <div>Connected to IntentSettlement contract on Cronos Testnet</div>
          <Button
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => window.open(getContractExplorerUrl(), '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
          </Button>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Network Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Network Status:</span>
          <div className="flex items-center gap-2">
            {networkStatus === 'checking' && (
              <Badge variant="outline">Checking...</Badge>
            )}
            {networkStatus === 'correct' && (
              <Badge className="bg-green-100 text-green-800">✅ Cronos Testnet</Badge>
            )}
            {networkStatus === 'incorrect' && (
              <>
                <Badge className="bg-red-100 text-red-800">❌ Wrong Network</Badge>
                <Button size="sm" variant="outline" onClick={switchNetwork}>
                  Switch Network
                </Button>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Strategies Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">On-Chain Strategies</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUserStrategies}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading strategies from blockchain...</p>
            </div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No on-chain strategies found</p>
              <p className="text-sm text-gray-500">Create your first strategy using the form above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(strategy.executed)}
                      <span className="font-medium">Strategy {strategy.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskBadgeColor(strategy.riskLevel)}>
                        {strategy.riskLevel.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {strategy.executed ? 'Executed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <div className="font-semibold">{formatAmount(strategy.amount)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <div className="font-semibold">{formatDate(strategy.createdAt)}</div>
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-600">Allocation:</span>
                    <div className="flex gap-4 mt-1">
                      <span className="text-green-600">{strategy.allocation.stable}% Stable</span>
                      <span className="text-blue-600">{strategy.allocation.liquid}% Liquid</span>
                      <span className="text-purple-600">{strategy.allocation.growth}% Growth</span>
                    </div>
                  </div>

                  {strategy.intent && (
                    <div className="text-sm">
                      <span className="text-gray-600">Intent:</span>
                      <p className="text-gray-800 italic mt-1">"{strategy.intent}"</p>
                    </div>
                  )}

                  {strategy.txHash && (
                    <div className="text-xs text-gray-500 pt-2 border-t">
                      <span>Transaction: </span>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => window.open(getExplorerUrl(strategy.txHash!), '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {strategy.txHash.slice(0, 10)}...{strategy.txHash.slice(-8)}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contract Info */}
        <Separator />
        <div className="text-xs text-gray-500 space-y-1">
          <p>✅ Contract deployed on Cronos Testnet</p>
          <p>✅ 0x402 protocol integration enabled</p>
          <p>✅ MEV protection and gas optimization active</p>
        </div>
      </CardContent>
    </Card>
  );
}