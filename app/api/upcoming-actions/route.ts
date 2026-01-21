import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Get user by wallet address
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (userError || !user) {
      return NextResponse.json([]);
    }

    // Get active strategies that have recurring execution
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['approved', 'executing'])
      .in('execution_type', ['weekly', 'daily', 'monthly']);

    if (strategiesError) {
      console.error('Error fetching strategies:', strategiesError);
      return NextResponse.json([]);
    }

    // Calculate upcoming actions based on strategy execution frequency
    const upcomingActions = (strategies || []).map(strategy => {
      const now = new Date();
      const createdAt = new Date(strategy.created_at);
      let nextExecution = new Date(createdAt);

      // Calculate next execution based on frequency
      switch (strategy.execution_type) {
        case 'daily':
          nextExecution.setDate(createdAt.getDate() + 1);
          while (nextExecution < now) {
            nextExecution.setDate(nextExecution.getDate() + 1);
          }
          break;
        case 'weekly':
          nextExecution.setDate(createdAt.getDate() + 7);
          while (nextExecution < now) {
            nextExecution.setDate(nextExecution.getDate() + 7);
          }
          break;
        case 'monthly':
          nextExecution.setMonth(createdAt.getMonth() + 1);
          while (nextExecution < now) {
            nextExecution.setMonth(nextExecution.getMonth() + 1);
          }
          break;
      }

      // Determine status
      const hoursDiff = (nextExecution.getTime() - now.getTime()) / (1000 * 60 * 60);
      let status: 'scheduled' | 'due' | 'overdue' = 'scheduled';
      
      if (hoursDiff < 0) {
        status = 'overdue';
      } else if (hoursDiff < 24) {
        status = 'due';
      }

      return {
        id: `${strategy.id}-${nextExecution.getTime()}`,
        strategyId: strategy.id,
        strategyName: `${strategy.risk_level.charAt(0).toUpperCase() + strategy.risk_level.slice(1)} Risk Strategy`,
        action: 'rebalance',
        scheduledFor: nextExecution,
        status
      };
    });

    // Sort by scheduled time
    upcomingActions.sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

    return NextResponse.json(upcomingActions);
  } catch (error) {
    console.error('Error fetching upcoming actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upcoming actions' },
      { status: 500 }
    );
  }
}