import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { headers } from 'next/headers'
import ContextProvider from '@/context'
import { AppProvider } from '@/lib/app-context'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Intent AI - Transform Your Financial Intent Into On-Chain Action',
  description: 'Tell us what you want with your money. Our AI agent converts your intent into an execution plan and executes it on Cronos EVM using x402 settlement flows.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ContextProvider cookies={cookies}>
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ContextProvider>
        <Analytics />
      </body>
    </html>
  )
}
