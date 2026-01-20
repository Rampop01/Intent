import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase credentials');
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          wallet_address: string;
        };
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          intent: string;
          amount: number;
          risk_level: string;
          allocation: {
            stable: number;
            liquid: number;
            growth: number;
          };
          execution_type: string;
          monitoring_frequency: string;
          ai_explanation: string;
          status: string;
          tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          intent: string;
          amount: number;
          risk_level: string;
          allocation: Record<string, number>;
          execution_type: string;
          monitoring_frequency: string;
          ai_explanation: string;
          status?: string;
          tx_hash?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          strategy_id: string;
          step_number: number;
          step_name: string;
          asset_type: string;
          amount: number;
          contract_address: string | null;
          tx_hash: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          strategy_id: string;
          step_number: number;
          step_name: string;
          asset_type: string;
          amount: number;
          contract_address?: string;
          tx_hash?: string;
          status?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          strategy_id: string | null;
          action: string;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          strategy_id?: string | null;
          action: string;
          details?: Record<string, unknown> | null;
        };
      };
    };
  };
};
