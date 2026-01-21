'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Sidebar } from '@/components/sidebar';
import { WalletConnect } from '@/components/wallet-connect';
import { IntentForm } from '@/components/intent-form';
import { StrategyDisplay } from '@/components/strategy-display';
import { StrategyApproval } from '@/components/strategy-approval';
import { ExecutionDisplay } from '@/components/execution-display';
import { UserOnboarding } from '@/components/user-onboarding';
import { Button } from '@/components/ui/button';

export default function AppPage() {
  const { 
    walletConnected, 
    walletAddress, 
    currentStrategy, 
    isExecuting, 
    executeStrategy, 
    disconnectWallet,
    showApprovalFlow,
    setShowApprovalFlow,
    clearStrategy
  } = useApp();
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user is new (simplified - in real app, check localStorage or user profile)
  useEffect(() => {
    if (walletConnected && !localStorage.getItem('onboarding_completed')) {
      setShowOnboarding(true);
    }
  }, [walletConnected]);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const handleStrategyGenerated = () => {
    setShowApprovalFlow(true);
  };

  const handleApprove = async () => {
    if (currentStrategy) {
      setShowApprovalFlow(false);
      await executeStrategy(currentStrategy);
    }
  };

  const handleModify = () => {
    setShowApprovalFlow(false);
    // Keep the strategy but allow modification
  };

  const handleCancel = () => {
    setShowApprovalFlow(false);
    clearStrategy();
  };

  // Show onboarding for new users
  if (showOnboarding && walletConnected) {
    return <UserOnboarding onComplete={handleOnboardingComplete} />;
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
                  <IntentForm onStrategyGenerated={handleStrategyGenerated} />
                </div>
              </div>

              {/* Right: Strategy Preview, Approval & Execution */}
              <div>
                <div className="space-y-4">
                  {showApprovalFlow && currentStrategy ? (
                    <StrategyApproval
                      strategy={currentStrategy}
                      onApprove={handleApprove}
                      onCancel={handleCancel}
                      onModify={handleModify}
                    />
                  ) : currentStrategy ? (
                    <>
                      <StrategyDisplay onExecute={() => setShowApprovalFlow(true)} />
                      {isExecuting && <ExecutionDisplay />}
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">Ready to Start</h3>
                        <p>Enter your financial intent on the left, or speak your goal using the microphone button.</p>
                        <p className="text-sm">Our AI will create a personalized strategy for you to review and approve.</p>
                      </div>
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
