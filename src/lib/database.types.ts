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
      cars: {
        Row: {
          id: string
          model: string
          license_plate: string
          year: number
          created_at: string
          ipva_due_date: string | null
          ipva_paid: boolean
        }
        Insert: {
          id?: string
          model: string
          license_plate: string
          year: number
          created_at?: string
          ipva_due_date?: string | null
          ipva_paid?: boolean
        }
        Update: {
          id?: string
          model?: string
          license_plate?: string
          year?: number
          created_at?: string
          ipva_due_date?: string | null
          ipva_paid?: boolean
        }
      }
      fuel_entries: {
        Row: {
          id: string
          car_id: string
          date: string
          current_km: number
          liters: number
          total_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          car_id: string
          date: string
          current_km: number
          liters: number
          total_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          car_id?: string
          date?: string
          current_km?: number
          liters?: number
          total_cost?: number
          created_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
        }
      }
      technicians: {
        Row: {
          id: string
          name: string
          city_id: string | null
          date: string
          food_expense: number
          fuel_expense: number
          other_expense: number
          accommodation_expense: number
          service_orders: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          city_id?: string | null
          date: string
          food_expense: number
          fuel_expense: number
          other_expense: number
          accommodation_expense: number
          service_orders: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          city_id?: string | null
          date?: string
          food_expense?: number
          fuel_expense?: number
          other_expense?: number
          accommodation_expense?: number
          service_orders?: number
          user_id?: string
          created_at?: string
        }
      }
      technician_configs: {
        Row: {
          id: string
          service_order_value: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          service_order_value: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          service_order_value?: number
          user_id?: string
          created_at?: string
        }
      }
    }
  }
}