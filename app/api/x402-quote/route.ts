import { NextRequest, NextResponse } from 'next/server';
import { x402Client, X402Route } from '@/lib/x402-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, amount, allocation, walletAddress } = body;

    // Validate required fields
    if (!intent || !amount || !allocation || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: intent, amount, allocation, walletAddress' },
        { status: 400 }
      );
    }

    // Ensure amount is string for x402Client
    const amountStr = typeof amount === 'string' ? amount : amount.toString();

    // Validate allocation percentages
    const totalAllocation = allocation.stable + allocation.liquid + allocation.growth;
    if (Math.abs(totalAllocation - 100) > 0.1) {
      return NextResponse.json(
        { error: 'Allocation percentages must sum to 100%' },
        { status: 400 }
      );
    }

    console.log('[x402] Getting quote for:', { intent, amount: amountStr, allocation, walletAddress });

    // Initialize x402 client
    await x402Client.initializeProvider();

    // Get x402 quote with string amount
    const quote = await x402Client.getQuote(intent, amountStr, allocation);
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to get x402 quote' },
        { status: 500 }
      );
    }

    // Enhance quote with additional analysis
    const mevAnalysis = await x402Client.analyzeMEVProtection(quote.orderId);
    
    // Cross-chain optimization if needed
    let crossChainRoutes: X402Route[] = [];
    if (allocation.growth > 30) {
      crossChainRoutes = await x402Client.optimizeCrossChainRoute(25, 1, amountStr);
    }

    const enhancedQuote = {
      ...quote,
      mevAnalysis,
      crossChainRoutes,
      x402Enabled: true,
      timestamp: new Date().toISOString(),
      features: {
        mevProtection: quote.mevSavings !== '0',
        crossChain: crossChainRoutes.length > 0,
        batchExecution: parseInt(amount) > 1000,
        gasOptimization: true,
      },
      savings: {
        mevSavings: quote.mevSavings,
        gasSavings: (parseFloat(quote.totalGasEstimate) * 0.1).toFixed(6),
        totalSavings: (parseFloat(quote.mevSavings) + parseFloat(quote.totalGasEstimate) * 0.1).toFixed(6),
      }
    };

    console.log('[x402] Quote generated successfully:', enhancedQuote.orderId);

    return NextResponse.json(enhancedQuote);

  } catch (error) {
    console.error('[x402] Error getting quote:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get x402 quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('[x402] Getting quote status for:', orderId);

    // Get settlement status
    const settlement = await x402Client.getSettlementStatus(orderId);
    
    if (!settlement) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderId,
      status: settlement.status,
      txHash: settlement.txHash,
      gasUsed: settlement.gasUsed,
      executionTime: settlement.executionTime,
      mevSavings: settlement.mevSavings,
      steps: settlement.steps,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[x402] Error getting quote status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get quote status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}