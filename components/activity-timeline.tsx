'use client';

import { useApp } from '@/lib/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function ActivityTimeline() {
  const { activityLog } = useApp();

  if (activityLog.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="mb-4 h-8 w-8 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-foreground">No Activity Yet</h3>
          <p className="text-sm text-muted-foreground">
            Execute a strategy to see activity logs here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>History of executed strategies</CardDescription>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <div className="space-y-3">
        {activityLog.map((log, index) => (
          <Card key={log.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Timeline Dot */}
                <div className="flex flex-col items-center">
                  {log.status === 'success' && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                  {log.status === 'pending' && (
                    <Clock className="h-6 w-6 text-yellow-500" />
                  )}
                  {log.status === 'failed' && (
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  )}
                  {index < activityLog.length - 1 && (
                    <div className="my-2 h-8 w-0.5 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-foreground">{log.action}</h4>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                    </div>
                    <Badge
                      variant={log.status === 'success' ? 'default' : 'secondary'}
                      className="flex-shrink-0"
                    >
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </Badge>
                  </div>

                  {/* Strategy Details */}
                  <div className="mt-3 space-y-2 rounded-lg bg-secondary/30 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono font-semibold text-primary">${log.strategy.amount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Risk Level:</span>
                      <span className="capitalize">{log.strategy.riskLevel}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Execution:</span>
                      <span className="capitalize">{log.strategy.execution}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Allocation: {log.strategy.allocation.stable}% Stable, {log.strategy.allocation.liquid}% Liquid,{' '}
                      {log.strategy.allocation.growth}% Growth
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-3 text-xs text-muted-foreground">
                    {format(log.timestamp, 'MMM d, yyyy • h:mm a')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
