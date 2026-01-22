'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect, useChainId } from 'wagmi'
import { Button } from './ui/button'
import { Wallet, LogOut } from 'lucide-react'
import { cronosTestnet } from '@/config'

export function HeaderWalletConnect() {
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
      <Button onClick={() => open()} className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Address Display */}
      <div className="hidden sm:flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-orange-500'}`}></div>
        <span className="font-mono text-gray-700">
          {formatAddress(address!)}
        </span>
      </div>

      {/* Network Warning for mobile */}
      {!isCorrectNetwork && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => open({ view: 'Networks' })}
          className="text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          Wrong Network
        </Button>
      )}

      {/* Disconnect Button */}
      <Button 
        onClick={() => disconnect()} 
        variant="outline" 
        size="sm"
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Disconnect</span>
      </Button>
    </div>
  )
}