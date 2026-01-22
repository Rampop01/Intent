'use client'

import { wagmiAdapter, projectId, cronosTestnet } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Intent AI DeFi Platform',
  description: 'AI-powered DeFi strategy platform with 0x402 protocol integration',
  url: 'https://intent-defi.com', // Update with your domain
  icons: ['https://intent-defi.com/icon.svg'] // Update with your icon
}

// Create the modal with Cronos testnet as default for our contract
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [cronosTestnet, mainnet, arbitrum],
  defaultNetwork: cronosTestnet, // Set Cronos testnet as default
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: true, // Enable email login
    socials: ['google', 'x', 'github', 'discord', 'apple'], // Social login options
    emailShowWallets: true, // Show wallet options in email flow
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider