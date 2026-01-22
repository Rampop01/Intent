import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const {
      walletAddress,
      intent,
      amount,
      riskLevel,
      allocation,
      executionType,
      monitoring,
      explanation,
      status = 'pending', // Allow status to be passed in
    } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Create strategy object
    const strategy = {
      id: `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user_${walletAddress}`,
      intent,
      amount,
      risk_level: riskLevel,
      allocation: { stable: allocation.stable, liquid: allocation.liquid, growth: allocation.growth },
      execution_type: executionType,
      monitoring_frequency: monitoring,
      ai_explanation: explanation,
      status,
      tx_hash: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('[v0] Strategy created:', strategy.id, 'with status:', status);

    return NextResponse.json(strategy);
  } catch (error) {
    console.error('[v0] Error creating strategy:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create strategy',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('[v0] Fetching strategies for wallet:', walletAddress);

    // Return empty array for now
    return NextResponse.json([]);
  } catch (error) {
    console.error('[v0] Error fetching strategies:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch strategies',
      },
      { status: 500 }
    );
  }
}