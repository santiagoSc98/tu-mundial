export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          total_points: number
          current_streak: number
          is_premium: boolean
          premium_until: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          total_points?: number
          current_streak?: number
          is_premium?: boolean
          premium_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          total_points?: number
          current_streak?: number
          is_premium?: boolean
          premium_until?: string | null
          created_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          deadline: string
          correct_answer: string | null
          difficulty_multiplier: number
          status: 'open' | 'closed' | 'resolved'
          options: Json | null
          fixture_id: string | null
          auto_resolved: boolean
          home_team_code: string | null
          away_team_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          deadline: string
          correct_answer?: string | null
          difficulty_multiplier?: number
          status?: 'open' | 'closed' | 'resolved'
          options?: Json | null
          fixture_id?: string | null
          auto_resolved?: boolean
          home_team_code?: string | null
          away_team_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          deadline?: string
          correct_answer?: string | null
          difficulty_multiplier?: number
          status?: 'open' | 'closed' | 'resolved'
          options?: Json | null
          fixture_id?: string | null
          auto_resolved?: boolean
          home_team_code?: string | null
          away_team_code?: string | null
          created_at?: string
        }
      }
      user_predictions: {
        Row: {
          id: string
          user_id: string
          prediction_id: string
          predicted_answer: string
          confidence_level: number
          points_earned: number | null
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prediction_id: string
          predicted_answer: string
          confidence_level?: number
          points_earned?: number | null
          is_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prediction_id?: string
          predicted_answer?: string
          confidence_level?: number
          points_earned?: number | null
          is_correct?: boolean | null
          created_at?: string
        }
      }
    }
  }
}
