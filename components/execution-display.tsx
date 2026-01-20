'use client';

import { useApp } from '@/lib/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export function ExecutionDisplay() {
  const { isExecuting, executionSteps, currentStrategy } = useApp();

  if (!isExecuting && executionSteps.length === 0) {
    return null;
  }

  const allStepsCompleted = executionSteps.every(step => step.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Execution Header */}
      <Card className="border-primary/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {allStepsCompleted ? 'Strategy Executed Successfully!' : 'Executing Strategy'}
            </CardTitle>
            {allStepsCompleted ? (
              <Badge className="bg-green-500/20 text-green-400">Complete</Badge>
            ) : (
              <Badge className="bg-primary/20 text-primary animate-pulse">In Progress</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Execution Steps */}
      <div className="space-y-3">
        {executionSteps.map((step, index) => (
          <Card key={step.id} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {step.status === 'completed' && (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  )}
                  {step.status === 'executing' && (
                    <div className="relative h-6 w-6">
                      <Image
                        src="/loader.jpg"
                        alt="Loading..."
                        fill
                        className="object-contain rounded-full animate-spin"
                      />
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                  {step.status === 'failed' && (
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{step.name}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success Message */}
      {allStepsCompleted && (
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">
                  Your funds have been deployed according to the allocation.
                </h4>
                <p className="text-sm text-muted-foreground">
                  ${currentStrategy?.amount} has been distributed across your strategy with {currentStrategy?.riskLevel} risk profile. Check the dashboard for activity logs and upcoming scheduled actions.
                </p>
              </div>
              <Link href="/dashboard">
                <Button className="w-full">View Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
