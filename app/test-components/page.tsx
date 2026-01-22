'use client';

import React from 'react';
import { PortfolioHoldings } from '@/components/portfolio-holdings';
import { X402SettlementDisplay } from '@/components/x402-settlement-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, TestTube } from 'lucide-react';

export default function TestComponentsPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <TestTube className="h-8 w-8 text-accent" />
              Component Testing
            </h1>
            <p className="text-muted-foreground">
              Test the Portfolio Holdings and x402 Settlement components
            </p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-75 transition">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Component Testing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-800 dark:text-blue-200">
            <p>• These components show your investment tracking and x402 settlement history</p>
            <p>• Portfolio Holdings: Shows where your TCRO investments went (staking, DeFi tokens, stable coins)</p>
            <p>• x402 Settlements: Shows how the x402 protocol routed your transactions step-by-step</p>
            <p>• Components populate with real data when you execute strategies from the main app</p>
          </CardContent>
        </Card>

        {/* Component Demo */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="portfolio">📊 Portfolio Holdings</TabsTrigger>
            <TabsTrigger value="settlements">⚡ x402 Settlements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="portfolio" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Holdings Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This component tracks your investment positions across different allocations
                </p>
              </CardHeader>
              <CardContent>
                <PortfolioHoldings />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settlements" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>x402 Settlement Display Component</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This component shows how x402 protocol optimized your strategy executions
                </p>
              </CardHeader>
              <CardContent>
                <X402SettlementDisplay />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/app">
            <Button className="w-full" size="lg">
              Create Test Strategy
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full" size="lg">
              View Full Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" className="w-full" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}