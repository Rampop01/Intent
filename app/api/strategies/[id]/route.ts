import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      );
    }

    // Update strategy in database
    const { data: updatedStrategy, error } = await supabase
      .from('strategies')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating strategy:', error);
      return NextResponse.json(
        { error: 'Failed to update strategy' },
        { status: 500 }
      );
    }

    // Log activity
    if (updates.status) {
      const action = updates.status === 'paused' ? 'Strategy paused' : 
                    updates.status === 'approved' ? 'Strategy resumed' : 
                    'Strategy modified';

      await supabase
        .from('activity_logs')
        .insert({
          user_id: updatedStrategy.user_id,
          strategy_id: id,
          action,
          details: `Strategy status changed to ${updates.status}`,
          timestamp: new Date().toISOString()
        });
    }

    return NextResponse.json(updatedStrategy);
  } catch (error) {
    console.error('Error in strategy update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Strategy ID is required' },
        { status: 400 }
      );
    }

    // Get strategy details for logging
    const { data: strategy } = await supabase
      .from('strategies')
      .select('*')
      .eq('id', id)
      .single();

    // Delete strategy
    const { error } = await supabase
      .from('strategies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting strategy:', error);
      return NextResponse.json(
        { error: 'Failed to delete strategy' },
        { status: 500 }
      );
    }

    // Log activity
    if (strategy) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: strategy.user_id,
          action: 'Strategy deleted',
          details: `Deleted ${strategy.risk_level} risk strategy worth $${strategy.amount}`,
          timestamp: new Date().toISOString()
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in strategy deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}