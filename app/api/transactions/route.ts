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

    console.log('[v0] Fetching transactions for wallet:', walletAddress);

    // First, get strategies for this wallet to generate transactions
    const strategiesResponse = await fetch(`${request.nextUrl.origin}/api/strategies?wallet=${walletAddress}`);
    const strategies = await strategiesResponse.json();

    // Generate transactions based on executed strategies
    const transactions = strategies
      .filter((s: any) => s.status === 'approved' || s.status === 'completed' || s.status === 'executing')
      .flatMap((strategy: any) => {
        const baseAmount = parseFloat(strategy.amount || '0');
        const txs = [];
        const strategyDate = new Date(strategy.created_at || new Date());
        
        // Create transactions for each allocation
        if (strategy.allocation.stable > 0) {
          txs.push({
            id: `${strategy.id}_stable`,
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            timestamp: strategyDate,
            type: 'swap',
            status: strategy.status === 'completed' ? 'confirmed' : 'pending',
            amount: (baseAmount * strategy.allocation.stable / 100).toFixed(2),
            asset: 'USDC',
            gasFee: '0.002',
            from: walletAddress,
            to: '0xA0b86a33E6441406b84b59A0f4C3d1d6e7c46FDB', // USDC contract
            strategy: strategy.intent,
            network: 'Cronos',
            blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
            gasUsed: '21000',
            gasPrice: '20000000000'
          });
        }
        
        if (strategy.allocation.liquid > 0) {
          txs.push({
            id: `${strategy.id}_liquid`,
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            timestamp: new Date(strategyDate.getTime() + 30000), // 30 seconds later
            type: 'swap',
            status: strategy.status === 'completed' ? 'confirmed' : 'pending',
            amount: (baseAmount * strategy.allocation.liquid / 100).toFixed(2),
            asset: 'WETH',
            gasFee: '0.003',
            from: walletAddress,
            to: '0x66d26E3A4A4Fb05b65FA8f7aA53C0Dd3Dda8e6C8', // WETH contract
            strategy: strategy.intent,
            network: 'Cronos',
            blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
            gasUsed: '45000',
            gasPrice: '22000000000'
          });
        }
        
        if (strategy.allocation.growth > 0) {
          txs.push({
            id: `${strategy.id}_growth`,
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            timestamp: new Date(strategyDate.getTime() + 60000), // 1 minute later
            type: 'swap',
            status: strategy.status === 'completed' ? 'confirmed' : 'pending',
            amount: (baseAmount * strategy.allocation.growth / 100).toFixed(2),
            asset: 'CRO',
            gasFee: '0.001',
            from: walletAddress,
            to: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // CRO contract
            strategy: strategy.intent,
            network: 'Cronos',
            blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
            gasUsed: '28000',
            gasPrice: '18000000000'
          });
        }
        
        return txs;
      });

    // Sort by timestamp (newest first)
    transactions.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('[v0] Error fetching transactions:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}