'use client';

import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { useState } from 'react';

export function WalletConnect() {
  const { walletConnected, walletAddress, connectWallet, disconnectWallet } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Simulate wallet connection (in production, use wagmi, web3-react, or ethers.js)
      // For now, generate a random wallet address for demonstration
      const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
      console.log('[v0] Connecting wallet:', mockAddress);
      await connectWallet(mockAddress);
    } catch (error) {
      console.error('[v0] Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!walletConnected) {
    return (
      <Button onClick={handleConnect} disabled={isConnecting} className="gap-2" size="sm">
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Connected: </span>
        <span className="font-mono text-primary">{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}</span>
      </div>
      <Button onClick={disconnectWallet} variant="outline" size="sm" title="Disconnect">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
