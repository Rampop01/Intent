'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Sidebar } from '@/components/sidebar';
import { WalletConnect } from '@/components/wallet-connect';
import { ActivityTimeline } from '@/components/activity-timeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar as CalendarIcon,
  Download,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity as ActivityIcon,
  FileText,
  RefreshCw
} from 'lucide-react';
import { format, subDays, isWithinInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { HydrationSafeWrapper } from '@/lib/hydration-utils';

export default function ActivityPage() {
  const { 
    walletConnected, 
    walletAddress, 
    activityLog, 
    upcomingActions,
    loadUpcomingActions,
    disconnectWallet 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (walletConnected) {
      refreshData();
    }
  }, [walletConnected]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await loadUpcomingActions();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter activity logs
  const filteredLogs = activityLog
    .filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.strategy.intent.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      
      const matchesAction = actionFilter === 'all' || log.action.toLowerCase().includes(actionFilter);
      
      const matchesDate = !dateRange?.from || !dateRange?.to || 
                          isWithinInterval(log.timestamp, { start: dateRange.from, end: dateRange.to });
      
      return matchesSearch && matchesStatus && matchesAction && matchesDate;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const exportData = () => {
    const csvContent = [
      ['Date', 'Action', 'Status', 'Amount', 'Details'].join(','),
      ...filteredLogs.map(log => [
        format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.status,
        log.strategy.amount,
        `"${log.details}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Activity statistics
  const totalActivities = activityLog.length;
  const successfulActivities = activityLog.filter(log => log.status === 'success').length;
  const failedActivities = activityLog.filter(log => log.status === 'failed').length;
  const pendingActivities = activityLog.filter(log => log.status === 'pending').length;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onLogout={disconnectWallet} walletAddress={walletAddress || undefined} />
      
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-6 py-8 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-foreground">Activity</h1>
              <p className="text-lg text-muted-foreground">Complete history of all your financial activities</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
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
                <p className="text-muted-foreground">Connect to view your activity history</p>
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
                        <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                        <p className="text-3xl font-bold text-foreground">{totalActivities}</p>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-xl">
                        <ActivityIcon className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-green-200/20 bg-green-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Successful</p>
                        <p className="text-3xl font-bold text-foreground">{successfulActivities}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {totalActivities > 0 ? Math.round((successfulActivities / totalActivities) * 100) : 0}% success rate
                        </p>
                      </div>
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-red-200/20 bg-red-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Failed</p>
                        <p className="text-3xl font-bold text-foreground">{failedActivities}</p>
                      </div>
                      <div className="p-3 bg-red-500/20 rounded-xl">
                        <AlertCircle className="h-6 w-6 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-yellow-200/20 bg-yellow-50/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                        <p className="text-3xl font-bold text-foreground">{upcomingActions.length}</p>
                      </div>
                      <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <Clock className="h-6 w-6 text-yellow-500" />
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
                          placeholder="Search activities..."
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
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Action Filter */}
                      <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Action Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="executed">Executions</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="resumed">Resumed</SelectItem>
                          <SelectItem value="modified">Modifications</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Date Range */}
                      <HydrationSafeWrapper fallback={<Button variant="outline" className="gap-2"><CalendarIcon className="h-4 w-4" />Loading...</Button>}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {dateRange?.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd")} -{" "}
                                  {format(dateRange.to, "LLL dd")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              "Pick a date range"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                      </HydrationSafeWrapper>
                    </div>

                    {/* Export */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setActionFilter('all');
                          setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Results Summary */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredLogs.length} of {totalActivities} activities
                </p>
                <Badge variant="outline">
                  {filteredLogs.length} results
                </Badge>
              </div>

              {/* Activity Timeline */}
              <div>
                {filteredLogs.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No activities found</h3>
                      <p className="text-muted-foreground mb-4">
                        {totalActivities === 0 
                          ? 'No activities yet. Create your first strategy to see activity here.'
                          : 'No activities match your current filters. Try adjusting your search criteria.'
                        }
                      </p>
                      {totalActivities === 0 && (
                        <Button asChild>
                          <a href="/app">Create Strategy</a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <ActivityTimeline />
                )}
              </div>

              {/* Upcoming Actions Section */}
              {upcomingActions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Upcoming Scheduled Actions
                    </CardTitle>
                    <CardDescription>
                      Actions that will be performed automatically based on your strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingActions.slice(0, 5).map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              action.status === 'due' ? 'bg-orange-500' :
                              action.status === 'overdue' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                            }`} />
                            <div>
                              <p className="font-medium text-sm">{action.strategyName}</p>
                              <p className="text-xs text-muted-foreground">
                                {action.action} • {format(action.scheduledFor, 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          <Badge variant={
                            action.status === 'overdue' ? 'destructive' :
                            action.status === 'due' ? 'default' : 'secondary'
                          }>
                            {action.status}
                          </Badge>
                        </div>
                      ))}
                      {upcomingActions.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          And {upcomingActions.length - 5} more upcoming actions...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}