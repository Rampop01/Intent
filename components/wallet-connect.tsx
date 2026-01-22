'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect, useChainId } from 'wagmi'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Wallet, Power, CheckCircle, AlertCircle } from 'lucide-react'
import { cronosTestnet } from '@/config'

export function WalletConnect() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  const isCorrectNetwork = chainId === cronosTestnet.id

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect your wallet to create and execute DeFi strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => open()} 
            className="w-full gap-2" 
            size="lg"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          {formatAddress(address!)} • {isCorrectNetwork ? 'Cronos Testnet' : 'Wrong Network'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Network Warning */}
        {!isCorrectNetwork && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <AlertCircle className="h-4 w-4 text-orange-600 mx-auto mb-1" />
            <p className="text-sm text-orange-800 font-medium">Wrong Network</p>
            <p className="text-xs text-orange-700 mb-2">Switch to Cronos Testnet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => open({ view: 'Networks' })}
            >
              Switch Network
            </Button>
          </div>
        )}

        {/* Connected Status */}
        {isCorrectNetwork && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-sm text-green-800 font-medium">Ready to use</p>
            <p className="text-xs text-green-700">Connected to Cronos Testnet</p>
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => disconnect()}
          className="w-full gap-2"
        >
          <Power className="h-4 w-4" />
          Disconnect
        </Button>
      </CardContent>
    </Card>
  )
}
