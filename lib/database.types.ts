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
          knockout_tie_id: string | null
          leg_number: number | null
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
          knockout_tie_id?: string | null
          leg_number?: number | null
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
          knockout_tie_id?: string | null
          leg_number?: number | null
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
          user_id: string | null
          tournament_id: string | null
          total_points: number | null
          correct_predictions: number | null
          exact_predictions: number | null
          team_id: number | null
          group_name: string | null
          played: number | null
          wins: number | null
          draws: number | null
          losses: number | null
          goals_for: number | null
          goals_against: number | null
          points_table: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          tournament_id?: string | null
          total_points?: number | null
          correct_predictions?: number | null
          exact_predictions?: number | null
          team_id?: number | null
          group_name?: string | null
          played?: number | null
          wins?: number | null
          draws?: number | null
          losses?: number | null
          goals_for?: number | null
          goals_against?: number | null
          points_table?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          tournament_id?: string | null
          total_points?: number | null
          correct_predictions?: number | null
          exact_predictions?: number | null
          team_id?: number | null
          group_name?: string | null
          played?: number | null
          wins?: number | null
          draws?: number | null
          losses?: number | null
          goals_for?: number | null
          goals_against?: number | null
          points_table?: number | null
        }
      }
      knockout_ties: {
        Row: {
          id: string
          tournament_id: string
          stage: 'KNOCKOUT_PLAYOFF' | 'LAST_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINAL'
          team_home_id: number
          team_away_id: number
          leg1_match_id: string | null
          leg2_match_id: string | null
          aggregate_home: number | null
          aggregate_away: number | null
          decided_by: 'aggregate' | 'extra_time' | 'penalties' | null
          winner_team_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tournament_id: string
          stage: 'KNOCKOUT_PLAYOFF' | 'LAST_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINAL'
          team_home_id: number
          team_away_id: number
          leg1_match_id?: string | null
          leg2_match_id?: string | null
          aggregate_home?: number | null
          aggregate_away?: number | null
          decided_by?: 'aggregate' | 'extra_time' | 'penalties' | null
          winner_team_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tournament_id?: string
          stage?: 'KNOCKOUT_PLAYOFF' | 'LAST_16' | 'QUARTER_FINALS' | 'SEMI_FINALS' | 'FINAL'
          team_home_id?: number
          team_away_id?: number
          leg1_match_id?: string | null
          leg2_match_id?: string | null
          aggregate_home?: number | null
          aggregate_away?: number | null
          decided_by?: 'aggregate' | 'extra_time' | 'penalties' | null
          winner_team_id?: number | null
          created_at?: string
          updated_at?: string
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
