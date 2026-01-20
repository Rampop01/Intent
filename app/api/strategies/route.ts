import { getSupabaseClient } from '@/lib/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const {
      walletAddress,
      intent,
      amount,
      riskLevel,
      allocation,
      executionType,
      monitoring,
      explanation,
    } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('[v0] Creating strategy for wallet:', walletAddress);

    // Get or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Create strategy
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        user_id: user.id,
        intent,
        amount,
        risk_level: riskLevel,
        allocation: { stable: allocation.stable, liquid: allocation.liquid, growth: allocation.growth },
        execution_type: executionType,
        monitoring_frequency: monitoring,
        ai_explanation: explanation,
        status: 'pending',
      })
      .select()
      .single();

    if (strategyError) throw strategyError;

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      strategy_id: strategy.id,
      action: 'strategy_created',
      details: { amount, riskLevel, executionType },
    });

    console.log('[v0] Strategy created:', strategy.id);

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
    const supabase = getSupabaseClient();
    const walletAddress = request.nextUrl.searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    console.log('[v0] Fetching strategies for wallet:', walletAddress);

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return NextResponse.json([]);
    }

    // Get strategies
    const { data: strategies, error: strategyError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (strategyError) throw strategyError;

    return NextResponse.json(strategies || []);
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
