'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Sidebar } from '@/components/sidebar';
import { WalletConnect } from '@/components/wallet-connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  ExternalLink,
  Copy,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Receipt,
  Hash,
  Calendar,
  TrendingUp,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const { walletConnected, walletAddress, savedStrategies, disconnectWallet } = useApp();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  useEffect(() => {
    if (walletConnected) {
      loadTransactions();
    }
  }, [walletConnected]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch real transactions from our backend
      const response = await fetch(`/api/transactions?wallet=${walletAddress}`);
      if (response.ok) {
        const txData = await response.json();
        setTransactions(txData);
      } else {
        // If API endpoint doesn't exist yet, generate mock transactions from executed strategies
        const mockTransactions = savedStrategies
          .filter(s => s.status === 'approved' || s.status === 'completed' || s.status === 'executing')
          .flatMap(strategy => {
            const baseAmount = parseFloat(strategy.amount || '0');
            const txs = [];
            
            // Create transactions for each allocation
            if (strategy.allocation.stable > 0) {
              txs.push({
                id: `${strategy.id}_stable`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                timestamp: new Date(strategy.createdAt || new Date()),
                type: 'swap',
                status: strategy.status === 'completed' ? 'confirmed' : 'pending',
                amount: (baseAmount * strategy.allocation.stable / 100).toFixed(2),
                asset: 'USDC',
                gasFee: '0.002',
                from: walletAddress,
                to: '0xA0b86a33E6441406b84b59A0f4C3d1d6e7c46FDB', // USDC contract
                strategy: strategy.intent,
                network: 'Cronos'
              });
            }
            
            if (strategy.allocation.liquid > 0) {
              txs.push({
                id: `${strategy.id}_liquid`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                timestamp: new Date(strategy.createdAt || new Date()),
                type: 'swap',
                status: strategy.status === 'completed' ? 'confirmed' : 'pending',
                amount: (baseAmount * strategy.allocation.liquid / 100).toFixed(2),
                asset: 'WETH',
                gasFee: '0.003',
                from: walletAddress,
                to: '0x66d26E3A4A4Fb05b65FA8f7aA53C0Dd3Dda8e6C8', // WETH contract
                strategy: strategy.intent,
                network: 'Cronos'
              });
            }
            
            if (strategy.allocation.growth > 0) {
              txs.push({
                id: `${strategy.id}_growth`,
                hash: `0x${Math.random().toString(16).substr(2, 64)}`,
                timestamp: new Date(strategy.createdAt || new Date()),
                type: 'swap',
                status: strategy.status === 'completed' ? 'confirmed' : 'pending',
                amount: (baseAmount * strategy.allocation.growth / 100).toFixed(2),
                asset: 'CRO',
                gasFee: '0.001',
                from: walletAddress,
                to: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // CRO contract
                strategy: strategy.intent,
                network: 'Cronos'
              });
            }
            
            return txs;
          });
        
        setTransactions(mockTransactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTransactions = async () => {
    await loadTransactions();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification in real app
  };

  const openInExplorer = (hash: string) => {
    // Open in Cronos explorer
    window.open(`https://cronoscan.com/tx/${hash}`, '_blank');
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Status', 'Amount', 'Asset', 'Gas Fee', 'Hash'].join(','),
      ...filteredTransactions.map(tx => [
        format(tx.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        tx.type,
        tx.status,
        tx.amount,
        tx.asset,
        tx.gasFee,
        tx.hash
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'swap': return <ArrowUpRight className="h-4 w-4" />;
      case 'deposit': return <ArrowDownRight className="h-4 w-4" />;
      case 'approve': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  // Calculate stats
  const totalTransactions = transactions.length;
  const confirmedTransactions = transactions.filter(tx => tx.status === 'confirmed').length;
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending').length;
  const totalGasFees = transactions.reduce((sum, tx) => sum + parseFloat(tx.gasFee), 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onLogout={disconnectWallet} walletAddress={walletAddress || undefined} />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-6 py-8 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-foreground">Transactions</h1>
              <p className="text-lg text-muted-foreground">View all blockchain transactions for your strategies</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshTransactions}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {walletConnected && (
                <div className="hidden md:block">
                  <WalletConnect />
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 py-8">
          {!walletConnected ? (
            <div className="text-center space-y-6 py-16">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Connect Your Wallet</h2>
                <p className="text-muted-foreground">Connect to view your transaction history</p>
              </div>
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Stats Overview */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-blue-200/20 bg-blue-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                        <p className="text-3xl font-bold text-foreground">{totalTransactions}</p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Receipt className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-green-200/20 bg-green-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                        <p className="text-3xl font-bold text-foreground">{confirmedTransactions}</p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-yellow-200/20 bg-yellow-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <p className="text-3xl font-bold text-foreground">{pendingTransactions}</p>
                      </div>
                      <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <Clock className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200/20 bg-purple-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Gas Fees</p>
                        <p className="text-3xl font-bold text-foreground">${totalGasFees.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Zap className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by hash, asset, or type..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full md:w-64"
                        />
                      </div>

                      {/* Status Filter */}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Type Filter */}
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="swap">Swaps</SelectItem>
                          <SelectItem value="deposit">Deposits</SelectItem>
                          <SelectItem value="approve">Approvals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button variant="outline" size="sm" onClick={exportTransactions} className="gap-2">
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions List */}
              {filteredTransactions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                    <p className="text-muted-foreground mb-4">
                      {totalTransactions === 0 
                        ? 'No transactions yet. Execute a strategy to see transactions here.'
                        : 'No transactions match your current filters.'
                      }
                    </p>
                    {totalTransactions === 0 && (
                      <Button asChild>
                        <a href="/app">Create Strategy</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                                {getTypeIcon(transaction.type)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg capitalize">{transaction.type}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {format(transaction.timestamp, 'MMM d, yyyy • h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(transaction.status)}>
                                {getStatusIcon(transaction.status)}
                                <span className="ml-1 capitalize">{transaction.status}</span>
                              </Badge>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Amount & Asset</span>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-medium">{transaction.amount} {transaction.asset}</p>
                                {transaction.toAsset && (
                                  <span className="text-muted-foreground">→ {transaction.toAsset}</span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-sm text-muted-foreground">Gas Fee</span>
                              <p className="font-medium mt-1">${transaction.gasFee}</p>
                            </div>

                            {transaction.status === 'confirmed' && (
                              <div>
                                <span className="text-sm text-muted-foreground">Confirmations</span>
                                <p className="font-medium mt-1">{transaction.confirmations}</p>
                              </div>
                            )}
                          </div>

                          {/* Transaction Hash */}
                          <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">Transaction Hash</span>
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                              <code className="text-sm font-mono flex-1">
                                {transaction.hash}
                              </code>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => copyToClipboard(transaction.hash)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openInExplorer(transaction.hash)}
                                className="h-8 w-8 p-0"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Block Information */}
                          {transaction.blockNumber && (
                            <div className="text-sm text-muted-foreground">
                              Block #{transaction.blockNumber}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}