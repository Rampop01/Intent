'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  DollarSign,
  Shield,
  Network
} from 'lucide-react';
import { format } from 'date-fns';
import { X402Settlement } from '@/lib/x402-client';

export function ActivityTimeline() {
  const { activityLog, upcomingActions, loadX402Settlements } = useApp();
  const [x402Settlements, setX402Settlements] = useState<X402Settlement[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'settlements' | 'upcoming'>('all');

  useEffect(() => {
    const fetchX402Data = async () => {
      try {
        const settlements = await loadX402Settlements();
        setX402Settlements(settlements);
      } catch (error) {
        console.error('Failed to load x402 settlements:', error);
      }
    };
    fetchX402Data();
  }, [loadX402Settlements]);

  const renderX402Settlement = (settlement: X402Settlement) => (
    <div key={settlement.orderId} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          <div>
            <h4 className="font-semibold text-sm">x402 Settlement</h4>
            <p className="text-xs text-muted-foreground">
              Order: {settlement.orderId.slice(0, 8)}...
            </p>
          </div>
        </div>
        <Badge variant={settlement.status === 'confirmed' ? 'default' : 'secondary'}>
          {settlement.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="font-medium">Output: {settlement.actualOutput}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" />
          <span className="text-xs">MEV Saved: {settlement.mevSavings}</span>
        </div>
      </div>

      <div className="bg-muted/50 rounded p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <Network className="h-3 w-3" />
          <span className="font-medium">Steps: {settlement.steps.length} protocols</span>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>Gas: {settlement.gasUsed}</span>
          <span>Time: {settlement.executionTime}s</span>
        </div>
      </div>
    </div>
  );

  if (activityLog.length === 0 && x402Settlements.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="mb-4 h-8 w-8 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-foreground">No Activity Yet</h3>
          <p className="text-sm text-muted-foreground">
            Execute strategies to see activity and x402 settlements
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Enhanced Activity Timeline
        </CardTitle>
        <CardDescription>
          Strategy executions and x402 settlements with MEV protection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="settlements">
              x402 Settlements ({x402Settlements.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingActions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            <div className="space-y-4">
              {x402Settlements.slice(0, 3).map(settlement => renderX402Settlement(settlement))}
              
              {activityLog.slice(0, 5).map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      {log.status === 'success' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {log.status === 'pending' && (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      {log.status === 'failed' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{log.action}</h4>
                        <Badge variant={log.status === 'success' ? 'default' : 'secondary'}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <span className="font-medium">${log.strategy.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {log.strategy.riskLevel} risk
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {format(log.timestamp, 'MMM dd, HH:mm')}
                        </div>
                        <div className="text-muted-foreground">
                          {log.strategy.execution}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settlements" className="space-y-4 mt-6">
            <div className="space-y-4">
              {x402Settlements.map(settlement => renderX402Settlement(settlement))}
              {x402Settlements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No x402 settlements yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4 mt-6">
            <div className="space-y-3">
              {upcomingActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      action.status === 'due' ? 'bg-orange-500' :
                      action.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{action.strategyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.action} • {format(action.scheduledFor, 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={action.status === 'due' ? 'destructive' : 'secondary'}>
                    {action.status}
                  </Badge>
                </div>
              ))}
              {upcomingActions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming actions</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
