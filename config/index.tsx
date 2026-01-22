import { cookieStorage, createStorage } from 'wagmi'
import { http } from 'viem'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'

// Get projectId from https://dashboard.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || '359ad909995c5c60ec40cb5251237844'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Define Cronos Testnet configuration (Chain ID: 338)
export const cronosTestnet = {
  id: 338,
  name: 'Cronos Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TCRO',
    symbol: 'TCRO',
  },
  rpcUrls: {
    default: {
      http: ['https://evm-t3.cronos.org'],
      webSocket: ['wss://evm-t3.cronos.org/websocket'],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Cronoscan', 
      url: 'https://testnet.cronoscan.com' 
    },
  },
  testnet: true,
} as const

// Include Cronos Testnet for our contract deployment
export const networks = [cronosTestnet, mainnet, arbitrum]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }) as any, // Type assertion to fix storage compatibility
  ssr: true,
  projectId,
  networks,
  transports: {
    [cronosTestnet.id]: http('https://evm-t3.cronos.org'),
    [mainnet.id]: http(),
    [arbitrum.id]: http()
  }
})

export const config = wagmiAdapter.wagmiConfig