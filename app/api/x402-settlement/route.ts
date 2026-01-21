import { NextRequest, NextResponse } from 'next/server';
import { x402Client } from '@/lib/x402-client';
import { getSupabaseClient } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intent, amount, allocation, walletAddress, executionType } = body;

    // Validate required fields
    if (!intent || !amount || !allocation || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: intent, amount, allocation, walletAddress' },
        { status: 400 }
      );
    }

    // Ensure amount is string for x402Client
    const amountStr = typeof amount === 'string' ? amount : amount.toString();

    console.log('[x402] Creating settlement order for:', { intent, amount: amountStr, allocation, walletAddress });

    // Initialize x402 client
    await x402Client.initializeProvider();

    // Create x402 order with string amount
    const order = await x402Client.createOrder(intent, amountStr, allocation, walletAddress);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Failed to create x402 order' },
        { status: 500 }
      );
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError) {
      console.log('[x402] Creating new user for wallet:', walletAddress);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress })
        .select()
        .single();

      if (createError) {
        console.error('[x402] Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    const userId = user?.id || (await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()).data?.id;

    // Save strategy to database with x402 data
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        user_id: userId,
        intent: order.intent,
        amount: parseFloat(amountStr), // Convert string to number for database
        risk_level: allocation.stable > 50 ? 'low' : allocation.growth > 50 ? 'high' : 'medium',
        stable_percent: allocation.stable,
        liquid_percent: allocation.liquid,
        growth_percent: allocation.growth,
        execution_type: executionType || order.executionType,
        monitoring: 'weekly',
        explanation: `x402 settlement order for ${intent}`,
        x402_order_id: order.id,
        x402_enabled: true,
        mev_protection: order.mevProtection,
        cross_chain: order.crossChain,
        estimated_gas: order.estimatedGas,
        estimated_time: order.estimatedTime,
      })
      .select()
      .single();

    if (strategyError) {
      console.error('[x402] Error saving strategy:', strategyError);
      return NextResponse.json(
        { error: 'Failed to save strategy' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        strategy_id: strategy.id,
        action: 'x402_order_created',
        details: {
          orderId: order.id,
          routes: order.routes,
          mevProtection: order.mevProtection,
          crossChain: order.crossChain,
        },
      });

    console.log('[x402] Settlement order created successfully:', order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        estimatedGas: order.estimatedGas,
        estimatedTime: order.estimatedTime,
        mevProtection: order.mevProtection,
        crossChain: order.crossChain,
        routes: order.routes,
      },
      strategy: {
        id: strategy.id,
        x402OrderId: order.id,
      },
      x402Features: {
        mevProtection: order.mevProtection,
        crossChain: order.crossChain,
        batchExecution: parseFloat(order.amount) > 1000,
        gasOptimization: true,
      },
    });

  } catch (error) {
    console.error('[x402] Error creating settlement order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create settlement order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, walletAddress } = body;

    if (!orderId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, walletAddress' },
        { status: 400 }
      );
    }

    console.log('[x402] Executing settlement for order:', orderId);

    // Initialize x402 client
    await x402Client.initializeProvider();

    // Execute settlement
    const settlement = await x402Client.executeSettlement(orderId, walletAddress);
    
    if (!settlement) {
      return NextResponse.json(
        { error: 'Failed to execute x402 settlement' },
        { status: 500 }
      );
    }

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Update strategy status in database
    const { error: updateError } = await supabase
      .from('strategies')
      .update({
        status: 'executing',
        tx_hash: settlement.txHash,
        updated_at: new Date().toISOString(),
      })
      .eq('x402_order_id', orderId);

    if (updateError) {
      console.error('[x402] Error updating strategy:', updateError);
    }

    // Log settlement execution
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (user) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'x402_settlement_executed',
          details: {
            orderId,
            txHash: settlement.txHash,
            gasUsed: settlement.gasUsed,
            executionTime: settlement.executionTime,
            mevSavings: settlement.mevSavings,
            steps: settlement.steps,
          },
        });
    }

    console.log('[x402] Settlement executed successfully:', settlement.txHash);

    return NextResponse.json({
      success: true,
      settlement: {
        orderId: settlement.orderId,
        txHash: settlement.txHash,
        status: settlement.status,
        gasUsed: settlement.gasUsed,
        executionTime: settlement.executionTime,
        mevSavings: settlement.mevSavings,
        steps: settlement.steps,
      },
      x402Features: {
        mevProtectionActive: settlement.mevSavings !== '0',
        multiStepExecution: settlement.steps.length > 1,
        gasOptimized: true,
      },
    });

  } catch (error) {
    console.error('[x402] Error executing settlement:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute settlement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    console.log('[x402] Getting settlements for wallet:', walletAddress);

    // Get Supabase client
    const supabase = getSupabaseClient();

    // Get user ID first
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!userData) {
      return NextResponse.json({
        settlements: [],
        total: 0,
        x402Stats: {
          totalSettlements: 0,
          mevProtectedSettlements: 0,
          crossChainSettlements: 0,
          completedSettlements: 0,
        },
      });
    }

    // Get user's x402 orders from database
    const { data: strategies, error } = await supabase
      .from('strategies')
      .select(`
        *,
        activity_logs (
          action,
          details,
          created_at
        )
      `)
      .eq('user_id', userData.id)
      .eq('x402_enabled', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[x402] Error fetching settlements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settlements' },
        { status: 500 }
      );
    }

    interface Settlement {
      id: any;
      orderId: any;
      intent: any;
      amount: any;
      status: string;
      txHash: any;
      mevProtection: any;
      crossChain: any;
      estimatedGas: any;
      gasUsed: any;
      mevSavings: any;
      executionTime: any;
      createdAt: any;
      updatedAt: any;
      activityLogs: any;
    }

    const settlements: Settlement[] = await Promise.all(
      strategies?.map(async (strategy: any) => {
        let settlementStatus = null;
        if (strategy.x402_order_id) {
          settlementStatus = await x402Client.getSettlementStatus(strategy.x402_order_id);
        }

        return {
          id: strategy.id,
          orderId: strategy.x402_order_id,
          intent: strategy.intent,
          amount: strategy.amount,
          status: settlementStatus?.status || strategy.status || 'pending',
          txHash: strategy.tx_hash || settlementStatus?.txHash,
          mevProtection: strategy.mev_protection,
          crossChain: strategy.cross_chain,
          estimatedGas: strategy.estimated_gas,
          gasUsed: settlementStatus?.gasUsed,
          mevSavings: settlementStatus?.mevSavings,
          executionTime: settlementStatus?.executionTime,
          createdAt: strategy.created_at,
          updatedAt: strategy.updated_at,
          activityLogs: strategy.activity_logs,
        };
      }) || []
    );

    return NextResponse.json({
      settlements,
      total: settlements.length,
      x402Stats: {
        totalSettlements: settlements.length,
        mevProtectedSettlements: settlements.filter((s: Settlement) => s.mevProtection).length,
        crossChainSettlements: settlements.filter((s: Settlement) => s.crossChain).length,
        completedSettlements: settlements.filter((s: Settlement) => s.status === 'confirmed' || s.status === 'completed').length,
      },
    });

  } catch (error) {
    console.error('[x402] Error getting settlements:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get settlements',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}