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
    <>
      <Sidebar onLogout={disconnectWallet} walletAddress={walletAddress || undefined} />
      
      <main className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-4 py-4 md:px-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Strategies</h1>
              <p className="text-sm text-muted-foreground">Manage all your AI-generated financial strategies</p>
            </div>
            {walletConnected && <WalletConnect />}
          </div>
        </header>

        <div className="px-4 md:px-6 py-8">
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
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Overview */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Total Strategies</span>
                    </div>
                    <p className="text-2xl font-bold">{savedStrategies.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {savedStrategies.filter(s => s.status === 'approved').length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Pause className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Paused</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {savedStrategies.filter(s => s.status === 'paused').length}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Total Value</span>
                    </div>
                    <p className="text-2xl font-bold">
                      ${savedStrategies.reduce((sum, s) => sum + parseFloat(s.amount), 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search strategies..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-full md:w-64"
                        />
                      </div>

                      {/* Filters */}
                      <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-32">
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
                          <SelectTrigger className="w-40">
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
                    </div>

                    <Link href="/app">
                      <Button className="gap-2">
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
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {savedStrategies.length === 0 ? 'No strategies yet' : 'No matching strategies'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {savedStrategies.length === 0 
                        ? 'Create your first strategy to get started'
                        : 'Try adjusting your filters or search terms'
                      }
                    </p>
                    {savedStrategies.length === 0 && (
                      <Link href="/app">
                        <Button>Create Strategy</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredStrategies.map((strategy) => (
                    <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">${strategy.amount.toLocaleString()}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {strategy.intent}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(strategy.status || 'pending')}>
                                  {(strategy.status || 'pending').charAt(0).toUpperCase() + (strategy.status || 'pending').slice(1)}
                                </Badge>
                                <Badge variant="outline" className={getRiskColor(strategy.riskLevel)}>
                                  {strategy.riskLevel} risk
                                </Badge>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Execution:</span>
                                <p className="font-medium capitalize">{strategy.execution}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Created:</span>
                                <p className="font-medium">
                                  {strategy.createdAt ? format(new Date(strategy.createdAt), 'MMM d, yyyy') : 'Unknown'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Allocation:</span>
                                <p className="font-medium">
                                  {strategy.allocation.stable}%/{strategy.allocation.liquid}%/{strategy.allocation.growth}%
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Performance:</span>
                                <div className="flex items-center gap-1">
                                  {strategy.performance?.totalReturnPercent !== undefined ? (
                                    <>
                                      {strategy.performance.totalReturnPercent >= 0 ? (
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <TrendingDown className="h-3 w-3 text-red-500" />
                                      )}
                                      <span className={`font-medium ${
                                        strategy.performance.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {strategy.performance.totalReturnPercent >= 0 ? '+' : ''}
                                        {strategy.performance.totalReturnPercent.toFixed(2)}%
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">No data</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <Separator />
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                {strategy.status === 'approved' && strategy.execution !== 'once' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAction('pause', strategy.id!)}
                                    className="gap-2"
                                  >
                                    <Pause className="h-3 w-3" />
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
                                    <Play className="h-3 w-3" />
                                    Resume
                                  </Button>
                                )}

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction('modify', strategy.id!)}
                                  className="gap-2"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  Modify
                                </Button>
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleAction('delete', strategy.id!)}
                                className="gap-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
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
    </>
  );
}