'use client';

import { useEffect, useState } from 'react';
import styles from './crypto-ticker.module.css';
import { Loader } from '@/components/ui/loader';

interface CryptoData {
  symbol: string;
  name: string;
  price: string;
  change: number;
  id: string;
}

// Crypto coins to track with their CoinGecko IDs
const cryptoIds = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos' },
  { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
];

export function CryptoTicker() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const ids = cryptoIds.map((c) => c.id).join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        
        const formattedData: CryptoData[] = cryptoIds.map((crypto) => {
          const coinData = data[crypto.id];
          return {
            id: crypto.id,
            symbol: crypto.symbol,
            name: crypto.name,
            price: `$${coinData.usd.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: coinData.usd < 1 ? 4 : 2,
            })}`,
            change: parseFloat(coinData.usd_24h_change?.toFixed(2) || '0'),
          };
        });
        
        setCryptoData(formattedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        // Fallback to dummy data if API fails
        setCryptoData([
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: '$98,234.56', change: 2.34 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: '$3,456.78', change: -1.23 },
          { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos', price: '$0.1234', change: 5.67 },
          { id: 'tether', symbol: 'USDT', name: 'Tether', price: '$1.00', change: 0.01 },
          { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: '$612.34', change: 3.45 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', price: '$156.78', change: -2.11 },
          { id: 'ripple', symbol: 'XRP', name: 'Ripple', price: '$0.6789', change: 4.23 },
          { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: '$0.5432', change: 1.89 },
        ]);
        setIsLoading(false);
      }
    };

    fetchCryptoData();
    
    // Refresh data every 60 seconds
    const interval = setInterval(fetchCryptoData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading || cryptoData.length === 0) {
    return (
      <div className="relative w-full overflow-hidden border-y border-border bg-card/30 backdrop-blur-sm py-8">
        <Loader size="sm" text="Loading live crypto prices..." />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden border-y border-border bg-card/30 backdrop-blur-sm py-4">
      <div className={styles['ticker-wrapper']}>
        {[...cryptoData, ...cryptoData].map((crypto, index) => (
          <div
            key={`${crypto.symbol}-${index}`}
            className="flex items-center gap-3 px-6 shrink-0 whitespace-nowrap"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {crypto.symbol.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {crypto.symbol}
                </span>
                <span className="text-xs text-muted-foreground">
                  {crypto.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {crypto.price}
              </span>
              <span
                className={`text-xs font-medium ${
                  crypto.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {crypto.change >= 0 ? '↑' : '↓'} {Math.abs(crypto.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Gradient overlays for fade effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-linear-to-r from-background to-transparent z-10"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-linear-to-l from-background to-transparent z-10"></div>
    </div>
  );
}
