'use client';

export interface TokenPrice {
  usd: number;
  lastUpdated: number;
}

export interface TokenBalances {
  tcro: string;
  usdc: string;
  usdt: string;
}

class PriceOracleService {
  private priceCache: Map<string, TokenPrice> = new Map();
  private cacheTime = 60000; // 1 minute cache

  async getTCROPrice(): Promise<number> {
    const cached = this.priceCache.get('tcro');
    if (cached && (Date.now() - cached.lastUpdated) < this.cacheTime) {
      return cached.usd;
    }

    try {
      // Try CoinGecko API first
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=crypto-com-chain&vs_currencies=usd',
        { next: { revalidate: 60 } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const price = data['crypto-com-chain']?.usd || 0.16; // fallback price
        
        this.priceCache.set('tcro', {
          usd: price,
          lastUpdated: Date.now()
        });
        
        console.log('[Price Oracle] TCRO price updated:', price);
        return price;
      }
    } catch (error) {
      console.warn('[Price Oracle] Failed to fetch from CoinGecko:', error);
    }

    // Fallback to mock price for development
    const fallbackPrice = 0.16; // Approximate TCRO price
    console.log('[Price Oracle] Using fallback TCRO price:', fallbackPrice);
    return fallbackPrice;
  }

  async convertUSDToTCRO(usdAmount: string | number): Promise<string> {
    const tcroPrice = await this.getTCROPrice();
    const usd = typeof usdAmount === 'string' ? parseFloat(usdAmount) : usdAmount;
    const tcroAmount = usd / tcroPrice;
    return tcroAmount.toFixed(2);
  }

  async convertTCROToUSD(tcroAmount: string | number): Promise<string> {
    const tcroPrice = await this.getTCROPrice();
    const tcro = typeof tcroAmount === 'string' ? parseFloat(tcroAmount) : tcroAmount;
    const usdAmount = tcro * tcroPrice;
    return usdAmount.toFixed(2);
  }

  formatTCROAmount(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M TCRO`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K TCRO`;
    }
    return `${num.toLocaleString()} TCRO`;
  }

  formatUSDAmount(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export const priceOracle = new PriceOracleService();