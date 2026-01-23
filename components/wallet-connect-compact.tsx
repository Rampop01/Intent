'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect, useChainId } from 'wagmi'
import { Button } from './ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Wallet, Power, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { cronosTestnet } from '@/config'

export function WalletConnectCompact() {
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
      <Button 
        onClick={() => open()} 
        size="sm"
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isCorrectNetwork ? "outline" : "destructive"} 
          size="sm" 
          className="gap-2"
        >
          {isCorrectNetwork ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {formatAddress(address!)}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{formatAddress(address!)}</p>
          <p className="text-xs text-muted-foreground">
            {isCorrectNetwork ? 'Cronos Testnet' : 'Wrong Network'}
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        {!isCorrectNetwork && (
          <>
            <DropdownMenuItem 
              onClick={() => open({ view: 'Networks' })}
              className="text-orange-600"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Switch to Cronos Testnet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={() => open()}>
          <Wallet className="mr-2 h-4 w-4" />
          Wallet Settings
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => disconnect()}
          className="text-red-600"
        >
          <Power className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}