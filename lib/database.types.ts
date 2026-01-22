// Supabase database types
export interface Database {
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
          id?: string;
          wallet_address: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      strategies: {
        Row: {
          id: string;
          user_id: string;
          intent: string;
          amount: number;
          risk_level: string;
          allocation: any;
          execution_type: string;
          monitoring_frequency: string;
          ai_explanation: string;
          status: string;
          tx_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          intent: string;
          amount: number;
          risk_level: string;
          allocation: any;
          execution_type: string;
          monitoring_frequency: string;
          ai_explanation: string;
          status?: string;
          tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          intent?: string;
          amount?: number;
          risk_level?: string;
          allocation?: any;
          execution_type?: string;
          monitoring_frequency?: string;
          ai_explanation?: string;
          status?: string;
          tx_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          description: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          description: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          description?: string;
          metadata?: any;
          created_at?: string;
        };
      };
    };
  };
}