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
      dishes: {
        Row: {
          id: string
          created_at: string
          group_id: string
          name: string
          description: string | null
          recipe: string | null
          ingredients: string[]
          image_url: string | null
          tags: string[]
          category: 'appetizer' | 'main' | 'dessert'
          deleted_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          group_id: string
          name: string
          description?: string | null
          recipe?: string | null
          ingredients: string[]
          image_url?: string | null
          tags?: string[]
          category: 'appetizer' | 'main' | 'dessert'
          deleted_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          group_id?: string
          name?: string
          description?: string | null
          recipe?: string | null
          ingredients?: string[]
          image_url?: string | null
          tags?: string[]
          category?: 'appetizer' | 'main' | 'dessert'
          deleted_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          created_at: string
          group_id: string
          title: string
          event_date: string
          description: string | null
          status: 'draft' | 'active' | 'closed'
          appetizer_ids: string[]
          main_dish_ids: string[]
          dessert_ids: string[]
          main_selection_type: 'choose_one' | 'fixed'
        }
        Insert: {
          id?: string
          created_at?: string
          group_id: string
          title: string
          event_date: string
          description?: string | null
          status?: 'draft' | 'active' | 'closed'
          appetizer_ids?: string[]
          main_dish_ids?: string[]
          dessert_ids?: string[]
          main_selection_type?: 'choose_one' | 'fixed'
        }
        Update: {
          id?: string
          created_at?: string
          group_id?: string
          title?: string
          event_date?: string
          description?: string | null
          status?: 'draft' | 'active' | 'closed'
          appetizer_ids?: string[]
          main_dish_ids?: string[]
          dessert_ids?: string[]
          main_selection_type?: 'choose_one' | 'fixed'
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          owner_id: string
          is_personal: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          owner_id: string
          is_personal?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          owner_id?: string
          is_personal?: boolean
        }
        Relationships: []
      }
      group_members: {
        Row: {
          id: string
          created_at: string
          group_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
        }
        Insert: {
          id?: string
          created_at?: string
          group_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
        }
        Update: {
          id?: string
          created_at?: string
          group_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
        }
        Relationships: []
      }
      guests: {
        Row: {
          id: string
          created_at: string
          event_id: string
          email: string
          name: string | null
          google_id: string | null
          has_responded: boolean
          has_submitted_feedback: boolean
          magic_token: string
        }
        Insert: {
          id?: string
          created_at?: string
          event_id: string
          email: string
          name?: string | null
          google_id?: string | null
          has_responded?: boolean
          has_submitted_feedback?: boolean
          magic_token?: string
        }
        Update: {
          id?: string
          created_at?: string
          event_id?: string
          email?: string
          name?: string | null
          google_id?: string | null
          has_responded?: boolean
          has_submitted_feedback?: boolean
          magic_token?: string
        }
        Relationships: []
      }
      selections: {
        Row: {
          id: string
          created_at: string
          guest_id: string
          event_id: string
          selected_main_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          guest_id: string
          event_id: string
          selected_main_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          guest_id?: string
          event_id?: string
          selected_main_id?: string | null
        }
        Relationships: []
      }
      dessert_votes: {
        Row: {
          id: string
          created_at: string
          guest_id: string
          event_id: string
          dessert_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          guest_id: string
          event_id: string
          dessert_id: string
        }
        Update: {
          id?: string
          created_at?: string
          guest_id?: string
          event_id?: string
          dessert_id?: string
        }
        Relationships: []
      }
      dish_feedback: {
        Row: {
          id: string
          created_at: string
          guest_id: string
          event_id: string
          dish_id: string
          rating: 'up' | 'down'
          comment: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          guest_id: string
          event_id: string
          dish_id: string
          rating: 'up' | 'down'
          comment?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          guest_id?: string
          event_id?: string
          dish_id?: string
          rating?: 'up' | 'down'
          comment?: string | null
        }
        Relationships: []
      }
      event_feedback: {
        Row: {
          id: string
          created_at: string
          guest_id: string
          event_id: string
          comment: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          guest_id: string
          event_id: string
          comment?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          guest_id?: string
          event_id?: string
          comment?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          avatar_url: string | null
          is_host: boolean
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          is_host?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          is_host?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
