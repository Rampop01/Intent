'use client';

import React from 'react';
import { useApp } from '@/lib/app-context';
import { RefreshCw, Wallet, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function BalanceDisplay() {
  const { userBalances, tcroPrice, refreshBalances, walletConnected } = useApp();

  if (!walletConnected) {
    return null;
  }

  const tcroBalance = parseFloat(userBalances.tcro);
  const usdEquivalent = tcroBalance * tcroPrice;

  return (
    <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Your Wallet Balance
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshBalances}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* TCRO Balance */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{tcroBalance.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">TCRO Available</p>
          </div>
          <Badge variant="outline" className="bg-accent/10">
            ${tcroPrice.toFixed(4)} / TCRO
          </Badge>
        </div>

        {/* USD Equivalent */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
          <DollarSign className="h-4 w-4 text-green-600" />
          <div>
            <p className="font-semibold text-green-700">
              ${usdEquivalent.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
            <p className="text-xs text-muted-foreground">USD Equivalent</p>
          </div>
        </div>

        {/* Other Tokens (if any) */}
        {(parseFloat(userBalances.usdc) > 0 || parseFloat(userBalances.usdt) > 0) && (
          <div className="space-y-1 pt-2 border-t border-muted">
            <p className="text-xs font-medium text-muted-foreground">Other Holdings:</p>
            {parseFloat(userBalances.usdc) > 0 && (
              <div className="flex justify-between text-sm">
                <span>USDC</span>
                <span>{parseFloat(userBalances.usdc).toLocaleString()}</span>
              </div>
            )}
            {parseFloat(userBalances.usdt) > 0 && (
              <div className="flex justify-between text-sm">
                <span>USDT</span>
                <span>{parseFloat(userBalances.usdt).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}