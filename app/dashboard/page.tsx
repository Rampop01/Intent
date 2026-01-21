'use client';

import { useApp } from '@/lib/app-context';
import { ActivityTimeline } from '@/components/activity-timeline';
import { WalletConnect } from '@/components/wallet-connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Clock, 
  AlertCircle, 
  Calendar,
  PieChart,
  Pause,
  Play,
  Edit3,
  Settings,
  Bell,
  BellOff,
  Target,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { 
    walletConnected, 
    activityLog, 
    savedStrategies,
    upcomingActions,
    loadUpcomingActions,
    loadStrategies,
    pauseStrategy,
    resumeStrategy
  } = useApp();
  
  const [notifications, setNotifications] = useState(true);

  // Load data on mount
  useEffect(() => {
    if (walletConnected) {
      loadStrategies();
      loadUpcomingActions();
    }
  }, [walletConnected, loadStrategies, loadUpcomingActions]);

  // Calculate enhanced stats
  const totalDeployed = activityLog.reduce((sum, log) => sum + parseFloat(log.strategy.amount), 0);
  const successfulExecutions = activityLog.filter(log => log.status === 'success').length;
  const activeStrategies = savedStrategies.filter(s => s.status === 'approved' && s.execution !== 'once').length;
  const pausedStrategies = savedStrategies.filter(s => s.status === 'paused').length;
  
  // Performance calculation
  const totalPerformance = savedStrategies.reduce((sum, strategy) => {
    return sum + (strategy.performance?.totalReturn || 0);
  }, 0);
  
  const avgPerformancePercent = savedStrategies.length > 0 
    ? savedStrategies.reduce((sum, strategy) => sum + (strategy.performance?.totalReturnPercent || 0), 0) / savedStrategies.length
    : 0;

  // Risk distribution
  const riskDistribution = savedStrategies.reduce((acc, strategy) => {
    acc[strategy.riskLevel] = (acc[strategy.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Upcoming actions summary
  const dueActions = upcomingActions.filter(action => action.status === 'due').length;
  const overdueActions = upcomingActions.filter(action => action.status === 'overdue').length;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 hover:opacity-75 transition">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to App</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotifications(!notifications)}
              className="gap-2"
            >
              {notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              Notifications
            </Button>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Monitor your strategies, performance, and upcoming actions
          </p>
        </div>

        {!walletConnected ? (
          <div className="text-center space-y-6 py-16">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Connect Your Wallet</h2>
              <p className="text-muted-foreground">Connect to view your dashboard</p>
            </div>
            <div className="flex justify-center">
              <WalletConnect />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Alerts */}
            {(dueActions > 0 || overdueActions > 0) && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        Action Required
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {overdueActions > 0 && `${overdueActions} overdue action${overdueActions > 1 ? 's' : ''}`}
                        {overdueActions > 0 && dueActions > 0 && ', '}
                        {dueActions > 0 && `${dueActions} action${dueActions > 1 ? 's' : ''} due soon`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Total Deployed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">${totalDeployed.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {savedStrategies.length} {savedStrategies.length === 1 ? 'strategy' : 'strategies'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {avgPerformancePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    Portfolio Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${
                    avgPerformancePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {avgPerformancePercent >= 0 ? '+' : ''}{avgPerformancePercent.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${totalPerformance >= 0 ? '+' : ''}{totalPerformance.toLocaleString()} total return
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    Active Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{activeStrategies}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pausedStrategies > 0 && `${pausedStrategies} paused`}
                    {pausedStrategies === 0 && 'All running normally'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Upcoming Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{upcomingActions.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dueActions > 0 ? `${dueActions} due soon` : 'All scheduled'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Strategy Overview */}
            {savedStrategies.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(riskDistribution).map(([risk, count]) => (
                      <div key={risk} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{risk} Risk</span>
                          <span>{count} strategies</span>
                        </div>
                        <Progress 
                          value={(count / savedStrategies.length) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Strategy Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Strategy Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {savedStrategies.slice(0, 3).map((strategy) => (
                      <div key={strategy.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            strategy.status === 'approved' ? 'bg-green-500' :
                            strategy.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`} />
                          <div>
                            <p className="font-medium text-sm">${strategy.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {strategy.riskLevel} risk • {strategy.execution}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {strategy.status === 'approved' && strategy.execution !== 'once' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => pauseStrategy(strategy.id!)}
                              className="h-8 w-8 p-0"
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          )}
                          {strategy.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resumeStrategy(strategy.id!)}
                              className="h-8 w-8 p-0"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {savedStrategies.length > 3 && (
                      <Button variant="outline" size="sm" className="w-full">
                        View All {savedStrategies.length} Strategies
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Activity Timeline */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Activity & Monitoring
              </h2>
              <ActivityTimeline />
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Create New Strategy</h3>
                    <p className="text-sm text-muted-foreground">
                      Express a new financial intent and let AI create a strategy
                    </p>
                    <Link href="/app">
                      <Button className="gap-2">
                        <Target className="h-4 w-4" />
                        New Strategy
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Emergency Controls</h3>
                    <p className="text-sm text-muted-foreground">
                      Pause all strategies or emergency stop if needed
                    </p>
                    <Button variant="outline" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Emergency Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}