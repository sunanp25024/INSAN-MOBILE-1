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
      users: {
        Row: {
          id: string
          created_at: string
          full_name: string
          role: 'MasterAdmin' | 'Admin' | 'PIC' | 'Kurir'
          email: string | null
          password_hash: string
          nik: string | null
          jabatan: string | null
          wilayah: string | null
          area: string | null
          work_location: string | null
          join_date: string | null
          position: string | null
          contract_status: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_recipient_name: string | null
          avatar_url: string | null
          photo_id_url: string | null
          status: 'Aktif' | 'Nonaktif' | null
        }
        Insert: {
          id: string
          created_at?: string
          full_name: string
          role: 'MasterAdmin' | 'Admin' | 'PIC' | 'Kurir'
          email?: string | null
          password_hash: string
          nik?: string | null
          jabatan?: string | null
          wilayah?: string | null
          area?: string | null
          work_location?: string | null
          join_date?: string | null
          position?: string | null
          contract_status?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_recipient_name?: string | null
          avatar_url?: string | null
          photo_id_url?: string | null
          status?: 'Aktif' | 'Nonaktif' | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          role?: 'MasterAdmin' | 'Admin' | 'PIC' | 'Kurir'
          email?: string | null
          password_hash?: string
          nik?: string | null
          jabatan?: string | null
          wilayah?: string | null
          area?: string | null
          work_location?: string | null
          join_date?: string | null
          position?: string | null
          contract_status?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_recipient_name?: string | null
          avatar_url?: string | null
          photo_id_url?: string | null
          status?: 'Aktif' | 'Nonaktif' | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          id: string
          created_at: string
          status: 'process' | 'in_transit' | 'delivered' | 'pending_return' | 'returned'
          is_cod: boolean
          recipient_name: string | null
          delivery_proof_photo_url: string | null
          return_proof_photo_url: string | null
          return_lead_receiver_name: string | null
          last_update_time: string
          assigned_courier_id: string | null
          hub_location: string | null
        }
        Insert: {
          id: string
          created_at?: string
          status: 'process' | 'in_transit' | 'delivered' | 'pending_return' | 'returned'
          is_cod: boolean
          recipient_name?: string | null
          delivery_proof_photo_url?: string | null
          return_proof_photo_url?: string | null
          return_lead_receiver_name?: string | null
          last_update_time: string
          assigned_courier_id?: string | null
          hub_location?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          status?: 'process' | 'in_transit' | 'delivered' | 'pending_return' | 'returned'
          is_cod?: boolean
          recipient_name?: string | null
          delivery_proof_photo_url?: string | null
          return_proof_photo_url?: string | null
          return_lead_receiver_name?: string | null
          last_update_time?: string
          assigned_courier_id?: string | null
          hub_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_assigned_courier_id_fkey"
            columns: ["assigned_courier_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_records: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          check_in_time: string | null
          check_out_time: string | null
          status: 'Present' | 'Absent' | 'Late'
          location: string | null
          check_in_photo_url: string | null
          check_out_photo_url: string | null
          check_in_location: string | null
          check_out_location: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          check_in_time?: string | null
          check_out_time?: string | null
          status: 'Present' | 'Absent' | 'Late'
          location?: string | null
          check_in_photo_url?: string | null
          check_out_photo_url?: string | null
          check_in_location?: string | null
          check_out_location?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          status?: 'Present' | 'Absent' | 'Late'
          location?: string | null
          check_in_photo_url?: string | null
          check_out_photo_url?: string | null
          check_in_location?: string | null
          check_out_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_package_inputs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          date: string
          total_packages: number
          cod_packages: number
          non_cod_packages: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          date: string
          total_packages: number
          cod_packages: number
          non_cod_packages: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          date?: string
          total_packages?: number
          cod_packages?: number
          non_cod_packages?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_package_inputs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_activities: {
        Row: {
          id: string
          created_at: string
          kurir_id: string
          package_id: string
          action: 'picked-up' | 'in-transit' | 'delivered' | 'delivery-failed' | 'returned-to-hub'
          timestamp: string
          details: string | null
          location: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          kurir_id: string
          package_id: string
          action: 'picked-up' | 'in-transit' | 'delivered' | 'delivery-failed' | 'returned-to-hub'
          timestamp: string
          details?: string | null
          location?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          kurir_id?: string
          package_id?: string
          action?: 'picked-up' | 'in-transit' | 'delivered' | 'delivery-failed' | 'returned-to-hub'
          timestamp?: string
          details?: string | null
          location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_activities_kurir_id_fkey"
            columns: ["kurir_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_activities_package_id_fkey"
            columns: ["package_id"]
            referencedRelation: "packages"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          id: string
          created_at: string
          type: 'wilayah' | 'area' | 'hub'
          name: string
          parent_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          type: 'wilayah' | 'area' | 'hub'
          name: string
          parent_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          type?: 'wilayah' | 'area' | 'hub'
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      },
      approvals: {
        Row: {
          id: string
          created_at: string
          request_type: 'add_user' | 'update_user' | 'deactivate_user' | 'other'
          requested_by: string
          requested_by_role: 'Admin' | 'PIC'
          status: 'pending' | 'approved' | 'rejected'
          approved_by: string | null
          approval_date: string | null
          notes: string | null
          data_json: Json
        }
        Insert: {
          id?: string
          created_at?: string
          request_type: 'add_user' | 'update_user' | 'deactivate_user' | 'other'
          requested_by: string
          requested_by_role: 'Admin' | 'PIC'
          status: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approval_date?: string | null
          notes?: string | null
          data_json: Json
        }
        Update: {
          id?: string
          created_at?: string
          request_type?: 'add_user' | 'update_user' | 'deactivate_user' | 'other'
          requested_by?: string
          requested_by_role?: 'Admin' | 'PIC'
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approval_date?: string | null
          notes?: string | null
          data_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "approvals_requested_by_fkey"
            columns: ["requested_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      push_subscriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          subscription: string | null
          token: string | null
          platform: 'web' | 'native'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at: string
          user_id: string
          subscription?: string | null
          token?: string | null
          platform: 'web' | 'native'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          subscription?: string | null
          token?: string | null
          platform?: 'web' | 'native'
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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