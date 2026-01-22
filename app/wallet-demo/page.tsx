'use client'

import { useState } from 'react'
import { IntentForm } from '@/components/intent-form'
import { WalletConnect } from '@/components/wallet-connect'
import { ContractDashboard } from '@/components/contract-dashboard'
import { StrategyExecution } from '@/components/strategy-execution'
import { HeaderWalletConnect } from '@/components/header-wallet-connect'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function WalletDemoPage() {
  const { isConnected } = useAccount()
  const [currentStrategy, setCurrentStrategy] = useState<any>(null)

  const handleStrategyGenerated = (strategy: any) => {
    setCurrentStrategy(strategy)
  }

  const handleExecutionComplete = (txHash: string) => {
    console.log('Strategy executed:', txHash)
    // Could update strategy status here
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-semibold text-lg">Intent DeFi</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline">🔗 Cronos Testnet</Badge>
            <Badge variant="outline">⚡ 0x402 Protocol</Badge>
            <HeaderWalletConnect />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Title Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reown AppKit Integration Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real wallet connection with MetaMask, WalletConnect, and 350+ supported wallets. 
            Connected to deployed smart contract on Cronos testnet.
          </p>
        </div>

        {/* Connection Status */}
        <div className="max-w-md mx-auto">
          {!isConnected ? (
            <Card className="border-2 border-dashed border-blue-300">
              <CardHeader className="text-center">
                <CardTitle className="text-blue-600">Ready to Connect</CardTitle>
                <CardDescription>
                  Connect your wallet to start creating real on-chain DeFi strategies
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="border-2 border-green-300 bg-green-50">
              <CardHeader className="text-center">
                <CardTitle className="text-green-700">🎉 Connected Successfully!</CardTitle>
                <CardDescription className="text-green-600">
                  Your wallet is connected and ready for blockchain interactions
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="connect" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="connect">1. Connect</TabsTrigger>
            <TabsTrigger value="create" disabled={!isConnected}>2. Create</TabsTrigger>
            <TabsTrigger value="execute" disabled={!isConnected || !currentStrategy}>3. Execute</TabsTrigger>
            <TabsTrigger value="dashboard" disabled={!isConnected}>4. Monitor</TabsTrigger>
          </TabsList>

          {/* Wallet Connection Tab */}
          <TabsContent value="connect" className="space-y-6">
            <WalletConnect />
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-3">🔗 Reown AppKit Features</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                <div>✅ 350+ supported wallets</div>
                <div>✅ Social logins (Google, Apple, etc.)</div>
                <div>✅ Email wallet creation</div>
                <div>✅ Multi-network support</div>
                <div>✅ Secure connection</div>
                <div>✅ Mobile-optimized</div>
              </div>
            </div>
          </TabsContent>

          {/* Strategy Creation Tab */}
          <TabsContent value="create" className="space-y-6">
            <IntentForm onStrategyGenerated={handleStrategyGenerated} />
            
            {currentStrategy && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">✅ Strategy Created</CardTitle>
                  <CardDescription className="text-green-600">
                    Strategy deployed to blockchain with transaction hash
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Amount:</strong> ${currentStrategy.amount}</div>
                  <div><strong>Risk:</strong> {currentStrategy.riskLevel}</div>
                  <div><strong>TX Hash:</strong> {currentStrategy.txHash?.slice(0, 20)}...</div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Strategy Execution Tab */}
          <TabsContent value="execute" className="space-y-6">
            {currentStrategy ? (
              <StrategyExecution 
                strategy={currentStrategy} 
                onExecutionComplete={handleExecutionComplete}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">Create a strategy first to enable execution</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <ContractDashboard />
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Technical Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold mb-4">🔧 Technical Implementation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">Smart Contract</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Address: 0xd9fc...8872</li>
                <li>• Network: Cronos Testnet</li>
                <li>• Protocol: 0x402 with MEV protection</li>
                <li>• Features: Intent settlement, strategy execution</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Wallet Integration</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Library: Reown AppKit (formerly WalletConnect)</li>
                <li>• Framework: Wagmi + Viem</li>
                <li>• Support: MetaMask, Coinbase, Trust, etc.</li>
                <li>• Features: Network switching, transaction signing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}