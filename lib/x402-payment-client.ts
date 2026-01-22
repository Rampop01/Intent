// x402 Payment Protocol Client - HTTP 402 Payment Required
// Integrates with real payment facilitators for API monetization

interface X402PaymentClient {
  checkPaymentRequired(endpoint: string): Promise<PaymentInfo | null>;
  makePayment(paymentInfo: PaymentInfo): Promise<PaymentResult>;
  executeWithPayment<T>(endpoint: string, request: any): Promise<T>;
  getUserTier(userAddress: string): Promise<UserTier>;
}

interface PaymentInfo {
  amount: string; // in USD cents
  currency: 'USD' | 'ETH' | 'BTC';
  facilitator: 'cdp' | 'payai';
  paymentAddress?: string;
  invoiceId: string;
  description: string;
  validUntil: number;
  endpoint: string;
}

interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  receipt?: string;
  error?: string;
}

interface PremiumFeatures {
  aiAnalysis: boolean;
  mevProtection: boolean;
  crossChainOptimization: boolean;
  prioritySupport: boolean;
}

interface UserTier {
  tier: 'free' | 'premium' | 'enterprise';
  features: PremiumFeatures;
  remainingCredits?: number;
  monthlyLimit?: number;
  nextBillingDate?: string;
}

// Real facilitator endpoints
const FACILITATORS = {
  cdp: 'https://pay.coinbase.com/api/v1',
  payai: 'https://api.payai.com/v1'
} as const;

// Premium feature pricing (in USD cents)
const FEATURE_PRICES = {
  aiAnalysis: 50, // $0.50 per analysis
  mevProtection: 100, // $1.00 per transaction
  crossChainOptimization: 200, // $2.00 per cross-chain operation
  prioritySupport: 0 // Included with premium subscription
} as const;

class X402PaymentClientImpl implements X402PaymentClient {
  private facilitator: 'cdp' | 'payai';
  private apiKey: string;
  private enabled: boolean;
  private userTiers: Map<string, UserTier> = new Map();

  constructor(facilitator: 'cdp' | 'payai' = 'cdp', apiKey?: string) {
    this.facilitator = facilitator;
    this.apiKey = apiKey || process.env.X402_API_KEY || '';
    this.enabled = process.env.NEXT_PUBLIC_X402_ENABLED === 'true';
  }

  async getUserTier(userAddress: string): Promise<UserTier> {
    // Check cache first
    if (this.userTiers.has(userAddress)) {
      return this.userTiers.get(userAddress)!;
    }

    // For demo purposes, return free tier by default
    // In production, this would check a subscription database
    const defaultTier: UserTier = {
      tier: 'free',
      features: {
        aiAnalysis: false,
        mevProtection: false,
        crossChainOptimization: false,
        prioritySupport: false
      },
      remainingCredits: 3, // Free tier gets 3 credits
      monthlyLimit: 3
    };

    this.userTiers.set(userAddress, defaultTier);
    return defaultTier;
  }

  async checkPaymentRequired(endpoint: string): Promise<PaymentInfo | null> {
    if (!this.enabled) {
      return null;
    }

    // Determine if endpoint requires payment
    const premiumEndpoints = [
      '/api/premium-analysis',
      '/api/mev-protection',
      '/api/cross-chain-optimize'
    ];

    const requiresPayment = premiumEndpoints.some(ep => endpoint.includes(ep));
    if (!requiresPayment) {
      return null;
    }

    // Generate payment info
    const paymentInfo: PaymentInfo = {
      amount: this.getPriceForEndpoint(endpoint),
      currency: 'USD',
      facilitator: this.facilitator,
      invoiceId: this.generateInvoiceId(),
      description: this.getDescriptionForEndpoint(endpoint),
      validUntil: Date.now() + (15 * 60 * 1000), // 15 minutes
      endpoint
    };

    return paymentInfo;
  }

  async makePayment(paymentInfo: PaymentInfo): Promise<PaymentResult> {
    try {
      const response = await this.processPaymentWithFacilitator(paymentInfo);
      return {
        success: true,
        transactionHash: response.txHash,
        receipt: response.receipt
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  async executeWithPayment<T>(endpoint: string, request: any): Promise<T> {
    const paymentInfo = await this.checkPaymentRequired(endpoint);
    
    if (paymentInfo) {
      const paymentResult = await this.makePayment(paymentInfo);
      if (!paymentResult.success) {
        throw new Error(`Payment required: ${paymentResult.error}`);
      }
    }

    // Execute the actual request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Receipt': paymentInfo?.invoiceId || ''
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private getPriceForEndpoint(endpoint: string): string {
    if (endpoint.includes('premium-analysis')) return FEATURE_PRICES.aiAnalysis.toString();
    if (endpoint.includes('mev-protection')) return FEATURE_PRICES.mevProtection.toString();
    if (endpoint.includes('cross-chain-optimize')) return FEATURE_PRICES.crossChainOptimization.toString();
    return '100'; // Default $1.00
  }

  private getDescriptionForEndpoint(endpoint: string): string {
    if (endpoint.includes('premium-analysis')) return 'Premium AI Strategy Analysis';
    if (endpoint.includes('mev-protection')) return 'MEV Protection Service';
    if (endpoint.includes('cross-chain-optimize')) return 'Cross-Chain Optimization';
    return 'Premium Feature Access';
  }

  private generateInvoiceId(): string {
    return `x402_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processPaymentWithFacilitator(paymentInfo: PaymentInfo): Promise<any> {
    const facilitatorUrl = FACILITATORS[paymentInfo.facilitator];
    
    // Mock payment processing for development
    // In production, integrate with real facilitator APIs
    if (process.env.NODE_ENV === 'development') {
      return {
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        receipt: paymentInfo.invoiceId
      };
    }

    // Real facilitator integration
    const response = await fetch(`${facilitatorUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: paymentInfo.amount,
        currency: paymentInfo.currency,
        description: paymentInfo.description,
        invoiceId: paymentInfo.invoiceId
      })
    });

    if (!response.ok) {
      throw new Error('Facilitator payment failed');
    }

    return response.json();
  }

  // Subscription management
  async upgradeToPremium(userAddress: string): Promise<boolean> {
    const premiumTier: UserTier = {
      tier: 'premium',
      features: {
        aiAnalysis: true,
        mevProtection: true,
        crossChainOptimization: true,
        prioritySupport: true
      },
      monthlyLimit: 100,
      remainingCredits: 100,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.userTiers.set(userAddress, premiumTier);
    return true;
  }

  async consumeCredit(userAddress: string, feature: keyof PremiumFeatures): Promise<boolean> {
    const userTier = await this.getUserTier(userAddress);
    
    if (userTier.tier === 'free' && !userTier.remainingCredits) {
      return false;
    }

    if (userTier.tier === 'premium' && userTier.features[feature]) {
      if (userTier.remainingCredits && userTier.remainingCredits > 0) {
        userTier.remainingCredits--;
        this.userTiers.set(userAddress, userTier);
      }
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const x402Client = new X402PaymentClientImpl();
export type { UserTier, PremiumFeatures, PaymentInfo, PaymentResult };