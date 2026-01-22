import { getSupabaseClient } from '@/lib/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    console.log('[DB] Starting database setup...');
    
    // Create users table
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
      
    if (usersError) {
      console.log('[DB] Users table does not exist, needs to be created via Supabase dashboard');
    } else {
      console.log('[DB] Users table exists');
    }

    // Create strategies table
    const { error: strategiesError } = await supabase
      .from('strategies')
      .select('id')
      .limit(1);
      
    if (strategiesError) {
      console.log('[DB] Strategies table does not exist, needs to be created via Supabase dashboard');
    } else {
      console.log('[DB] Strategies table exists');
    }

    // Create activity_logs table
    const { error: activityError } = await supabase
      .from('activity_logs')
      .select('id')
      .limit(1);
      
    if (activityError) {
      console.log('[DB] Activity logs table does not exist, needs to be created via Supabase dashboard');
    } else {
      console.log('[DB] Activity logs table exists');
    }

    return NextResponse.json({
      success: true,
      tableStatus: {
        users: !usersError,
        strategies: !strategiesError,
        activity_logs: !activityError
      },
      message: 'Database check completed',
      instruction: 'If tables are missing, please run the SQL script in your Supabase dashboard'
    });
    
  } catch (error) {
    console.error('[DB] Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Database setup failed'
    });
  }
}