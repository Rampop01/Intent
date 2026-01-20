'use client';

import { useApp } from '@/lib/app-context';
import { Sidebar } from '@/components/sidebar';
import { WalletConnect } from '@/components/wallet-connect';
import { IntentForm } from '@/components/intent-form';
import { StrategyDisplay } from '@/components/strategy-display';
import { ExecutionDisplay } from '@/components/execution-display';
import { Button } from '@/components/ui/button';

export default function AppPage() {
  const { walletConnected, walletAddress, currentStrategy, isExecuting, executeStrategy, disconnectWallet } = useApp();

  async function handleExecute() {
    if (currentStrategy) {
      await executeStrategy(currentStrategy);
    }
  }

  return (
    <>
      <Sidebar onLogout={disconnectWallet} walletAddress={walletAddress || undefined} />
      
      <main className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="px-4 py-4 md:px-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">New Strategy</h1>
            {walletConnected && <WalletConnect />}
          </div>
        </header>

        {/* Main Content */}
        <div className="px-4 md:px-6 py-8">
          {!walletConnected ? (
            <div className="text-center space-y-6 py-16">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-foreground">Connect Your Wallet</h1>
                <p className="text-lg text-muted-foreground">
                  To get started, please connect your Cronos wallet
                </p>
              </div>
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-2">
              {/* Left: Intent Input */}
              <div>
                <div className="sticky top-24">
                  <IntentForm onStrategyGenerated={() => {}} />
                </div>
              </div>

              {/* Right: Strategy Preview & Execution */}
              <div>
                <div className="space-y-4">
                  {currentStrategy ? (
                    <>
                      <StrategyDisplay onExecute={handleExecute} />
                      {(isExecuting || currentStrategy) && <ExecutionDisplay />}
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                      Enter your financial intent on the left to generate a strategy
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
