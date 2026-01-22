import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('[x402] Fetching settlements for wallet:', walletAddress);

    // Return mock settlements for now - in production this would query a database
    const settlements = [
      {
        orderId: `order_${Date.now()}_1`,
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        status: 'confirmed',
        gasUsed: '45000',
        executionTime: 120,
        actualOutput: '1000.50',
        mevSavings: '2.50',
        timestamp: new Date().toISOString(),
        steps: [
          {
            stepId: 'step_1',
            stepNumber: 1,
            protocol: 'UniswapV3',
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            status: 'confirmed',
            gasUsed: '21000',
            output: '500.25'
          },
          {
            stepId: 'step_2',
            stepNumber: 2,
            protocol: 'AaveV3',
            txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            status: 'confirmed',
            gasUsed: '24000',
            output: '500.25'
          }
        ]
      }
    ];

    return NextResponse.json({ settlements });
  } catch (error) {
    console.error('[x402] Error fetching settlements:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch settlements',
      },
      { status: 500 }
    );
  }
}