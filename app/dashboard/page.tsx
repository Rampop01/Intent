'use client';

import { useApp } from '@/lib/app-context';
import { ActivityTimeline } from '@/components/activity-timeline';
import { WalletConnect } from '@/components/wallet-connect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, DollarSign, Clock, AlertCircle, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { walletConnected, activityLog } = useApp();

  // Calculate stats
  const totalDeployed = activityLog.reduce((sum, log) => sum + log.strategy.amount, 0);
  const successfulExecutions = activityLog.filter(log => log.status === 'success').length;
  const weeklyStrategies = activityLog.filter(log => log.strategy.execution === 'weekly').length;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 hover:opacity-75 transition">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to App</span>
          </Link>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Monitor your executed strategies and activity
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
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Total Deployed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">${totalDeployed}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {activityLog.length} {activityLog.length === 1 ? 'strategy' : 'strategies'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    Successful Executions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{successfulExecutions}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {successfulExecutions === activityLog.length && activityLog.length > 0
                      ? '100% success rate'
                      : `${activityLog.length > 0 ? Math.round((successfulExecutions / activityLog.length) * 100) : 0}% success rate`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-secondary" />
                    Active Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{weeklyStrategies}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Running weekly rebalancing
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Activity Timeline */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
              <ActivityTimeline />
            </div>

            {/* Call to Action */}
            {activityLog.length === 0 && (
              <Card className="border-dashed bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">No strategies executed yet</h3>
                    <p className="text-muted-foreground">
                      Go back to the app and create your first strategy
                    </p>
                    <Link href="/app">
                      <Button>Create Strategy</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scheduled Actions */}
            {weeklyStrategies > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Scheduled Actions</CardTitle>
                  <CardDescription>Your weekly rebalancing schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activityLog
                      .filter(log => log.strategy.execution === 'weekly')
                      .map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between border-b border-border pb-3 last:border-0"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              Weekly Rebalancing - ${log.strategy.amount}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {log.strategy.riskLevel.charAt(0).toUpperCase() + log.strategy.riskLevel.slice(1)} risk profile • {log.strategy.monitoring} monitoring
                            </p>
                          </div>
                          <div className="text-xs font-medium px-2 py-1 rounded bg-primary/10 text-primary">
                            Every Week
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {activityLog.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link href="/app" className="flex-1">
                      <Button variant="outline" className="w-full bg-transparent">
                        Create New Strategy
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
