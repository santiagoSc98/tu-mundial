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
          stage: string | null
          home_team_code: string | null
          away_team_code: string | null
          exact_score_home: number | null
          exact_score_away: number | null
          duration: string | null
          penalty_home: number | null
          penalty_away: number | null
          winner_name: string | null
          tournament_id: string | null
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
          stage?: string | null
          home_team_code?: string | null
          away_team_code?: string | null
          exact_score_home?: number | null
          exact_score_away?: number | null
          duration?: string | null
          penalty_home?: number | null
          penalty_away?: number | null
          winner_name?: string | null
          tournament_id?: string | null
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
          stage?: string | null
          home_team_code?: string | null
          away_team_code?: string | null
          exact_score_home?: number | null
          exact_score_away?: number | null
          duration?: string | null
          penalty_home?: number | null
          penalty_away?: number | null
          winner_name?: string | null
          tournament_id?: string | null
          created_at?: string
        }
      }
      tournaments: {
        Row: {
          id: string
          name: string
          slug: string
          status: 'upcoming' | 'active' | 'finished'
          logo_url: string | null
          competition_id: number | null
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          status?: 'upcoming' | 'active' | 'finished'
          logo_url?: string | null
          competition_id?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          status?: 'upcoming' | 'active' | 'finished'
          logo_url?: string | null
          competition_id?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
      }
      tournament_standings: {
        Row: {
          id: string
          user_id: string
          tournament_id: string
          total_points: number
          correct_predictions: number
          exact_predictions: number
        }
        Insert: {
          id?: string
          user_id: string
          tournament_id: string
          total_points?: number
          correct_predictions?: number
          exact_predictions?: number
        }
        Update: {
          id?: string
          user_id?: string
          tournament_id?: string
          total_points?: number
          correct_predictions?: number
          exact_predictions?: number
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
