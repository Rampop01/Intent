'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Sidebar } from '@/components/sidebar';
import { WalletConnect } from '@/components/wallet-connect';
import { WalletConnectCompact } from '@/components/wallet-connect-compact';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Calendar,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { HydrationSafeWrapper } from '@/lib/hydration-utils';

export default function StrategiesPage() {
  const { 
    walletConnected, 
    walletAddress, 
    savedStrategies, 
    loadStrategies, 
    pauseStrategy, 
    resumeStrategy, 
    modifyStrategy,
    disconnectWallet 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (walletConnected) {
      loadStrategies();
    }
  }, [walletConnected, loadStrategies]);

  // Filter and sort strategies
  const filteredStrategies = savedStrategies
    .filter(strategy => {
      const matchesSearch = strategy.intent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          strategy.amount.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || strategy.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || strategy.riskLevel === riskFilter;
      
      return matchesSearch && matchesStatus && matchesRisk;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];
      
      if (sortBy === 'amount') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (sortBy === 'createdAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'paused': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'completed': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'failed': return 'bg-red-500/10 text-red-700 border-red-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/10 text-green-700';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700';
      case 'high': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const handleAction = async (action: string, strategyId: string) => {
    switch (action) {
      case 'pause':
        await pauseStrategy(strategyId);
        break;
      case 'resume':
        await resumeStrategy(strategyId);
        break;
      case 'modify':
        // TODO: Implement modification modal
        console.log('Modify strategy:', strategyId);
        break;
      case 'delete':
        // TODO: Implement deletion with confirmation
        console.log('Delete strategy:', strategyId);
        break;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onLogout={disconnectWallet} walletAddress={walletAddress || undefined} />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-6 py-8 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-foreground">Strategies</h1>
              <p className="text-lg text-muted-foreground">Manage all your AI-generated financial strategies</p>
            </div>
            {walletConnected && (
              <div className="hidden md:block">
                <WalletConnectCompact />
              </div>
            )}
          </div>
        </header>

        <div className="px-6 py-8">
          {!walletConnected ? (
            <div className="text-center space-y-6 py-16">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Connect Your Wallet</h2>
                <p className="text-muted-foreground">Connect to view your strategies</p>
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
                        <p className="text-sm font-medium text-muted-foreground">Total Strategies</p>
                        <p className="text-3xl font-bold text-foreground">{savedStrategies.length}</p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <Target className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-green-200/20 bg-green-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                        <p className="text-3xl font-bold text-foreground">
                          {savedStrategies.filter(s => s.status === 'approved').length}
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <Play className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200/20 bg-orange-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Paused</p>
                        <p className="text-3xl font-bold text-foreground">
                          {savedStrategies.filter(s => s.status === 'paused').length}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-500/20 rounded-xl">
                        <Pause className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                        <p className="text-3xl font-bold text-foreground">
                          ${savedStrategies.reduce((sum, s) => sum + parseFloat(s.amount), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-primary/20 rounded-xl">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search strategies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full sm:w-64"
                        />
                      </div>

                      {/* Filters */}
                      <HydrationSafeWrapper fallback={<div className="flex gap-2 h-9"><div className="w-36 h-9 bg-gray-100 rounded animate-pulse"></div><div className="w-32 h-9 bg-gray-100 rounded animate-pulse"></div><div className="w-44 h-9 bg-gray-100 rounded animate-pulse"></div></div>}>
                      <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="approved">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={riskFilter} onValueChange={setRiskFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Risk" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Risk</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-44">
                            <ArrowUpDown className="h-4 w-4 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="createdAt">Date Created</SelectItem>
                            <SelectItem value="amount">Amount</SelectItem>
                            <SelectItem value="riskLevel">Risk Level</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      </HydrationSafeWrapper>
                    </div>

                    <Link href="/app">
                      <Button className="gap-2 px-6 py-3">
                        <Plus className="h-4 w-4" />
                        New Strategy
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Strategies List */}
              {filteredStrategies.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                    <h3 className="text-xl font-semibold mb-3">
                      {savedStrategies.length === 0 ? 'No strategies yet' : 'No matching strategies'}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {savedStrategies.length === 0 
                        ? 'Create your first AI-powered strategy to start optimizing your DeFi portfolio'
                        : 'Try adjusting your filters or search terms to find the strategies you\'re looking for'
                      }
                    </p>
                    {savedStrategies.length === 0 && (
                      <Link href="/app">
                        <Button size="lg" className="px-8">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Strategy
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredStrategies.map((strategy) => (
                    <Card key={strategy.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                <h3 className="font-bold text-2xl text-foreground">
                                  ${strategy.amount.toLocaleString()}
                                </h3>
                                <Badge className={getStatusColor(strategy.status || 'pending')}>
                                  {(strategy.status || 'pending').charAt(0).toUpperCase() + (strategy.status || 'pending').slice(1)}
                                </Badge>
                                <Badge variant="outline" className={getRiskColor(strategy.riskLevel)}>
                                  {strategy.riskLevel} risk
                                </Badge>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">
                                {strategy.intent}
                              </p>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-t border-border">
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">Execution</span>
                              <p className="font-semibold capitalize text-foreground">{strategy.execution}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">Created</span>
                              <p className="font-semibold text-foreground">
                                {strategy.createdAt ? format(new Date(strategy.createdAt), 'MMM d, yyyy') : 'Unknown'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">Allocation</span>
                              <p className="font-semibold text-foreground">
                                {strategy.allocation.stable}%/{strategy.allocation.liquid}%/{strategy.allocation.growth}%
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">Performance</span>
                              <div className="flex items-center gap-1">
                                {strategy.performance?.totalReturnPercent !== undefined ? (
                                  <>
                                    {strategy.performance.totalReturnPercent >= 0 ? (
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                    )}
                                    <span className={`font-semibold ${
                                      strategy.performance.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {strategy.performance.totalReturnPercent >= 0 ? '+' : ''}
                                      {strategy.performance.totalReturnPercent.toFixed(2)}%
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground font-medium">No data</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div className="flex gap-3">
                              {strategy.status === 'approved' && strategy.execution !== 'once' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction('pause', strategy.id!)}
                                  className="gap-2"
                                >
                                  <Pause className="h-4 w-4" />
                                  Pause
                                </Button>
                              )}
                              
                              {strategy.status === 'paused' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction('resume', strategy.id!)}
                                  className="gap-2"
                                >
                                  <Play className="h-4 w-4" />
                                  Resume
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction('modify', strategy.id!)}
                                className="gap-2"
                              >
                                <Edit3 className="h-4 w-4" />
                                Modify
                              </Button>
                            </div>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAction('delete', strategy.id!)}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
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