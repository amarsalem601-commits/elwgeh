export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          created_by: string
          id: string
          location: string
          name: string
          orders: number
          phone: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          location?: string
          name: string
          orders?: number
          phone?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          location?: string
          name?: string
          orders?: number
          phone?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          created_by: string
          id: string
          name: string
          price: number
          quantity: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          price?: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string
          date: string
          id: string
          items: number
          order_number: string
          status: string
          supplier: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          date?: string
          id?: string
          items?: number
          order_number?: string
          status?: string
          supplier: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          date?: string
          id?: string
          items?: number
          order_number?: string
          status?: string
          supplier?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          created_by: string
          customer: string
          date: string
          id: string
          items: number
          order_number: string
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer: string
          date?: string
          id?: string
          items?: number
          order_number?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer?: string
          date?: string
          id?: string
          items?: number
          order_number?: string
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      accounting_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          description: string
          entry_date: string
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          created_by: string
          description?: string
          entry_date?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          entry_date?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: []
      }
      ai_assistant_messages: {
        Row: {
          action: Json | null
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          action?: Json | null
          content?: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          action?: Json | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistant_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ai_assistant_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assistant_threads: {
        Row: {
          assistant_type: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_type: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_type?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          address: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          type: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          lead_id: string
          type: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by: string
          id?: string
          lead_id: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          source: string
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          source?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      employee_permissions: {
        Row: {
          created_at: string
          id: string
          page_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_key?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          product_name: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          product_name?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string
          customer_name: string
          customer_phone: string
          discount: number
          id: string
          invoice_number: string
          notes: string | null
          status: string
          subtotal: number
          tax: number
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          id?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_name?: string
          customer_phone?: string
          discount?: number
          id?: string
          invoice_number?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      location_tracking: {
        Row: {
          address: string | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      repair_bookings: {
        Row: {
          appointment_date: string | null
          car_model: string
          car_type: string
          created_at: string
          customer_name: string
          customer_phone: string
          id: string
          problem_description: string
          status: string
        }
        Insert: {
          appointment_date?: string | null
          car_model?: string
          car_type?: string
          created_at?: string
          customer_name: string
          customer_phone: string
          id?: string
          problem_description?: string
          status?: string
        }
        Update: {
          appointment_date?: string | null
          car_model?: string
          car_type?: string
          created_at?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          problem_description?: string
          status?: string
        }
        Relationships: []
      }
      repair_chat_messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          booking_id: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "repair_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_page_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      salaries: {
        Row: {
          amount: number
          bonus: number
          created_at: string
          deductions: number
          id: string
          month: string
          notes: string | null
          paid: boolean
          user_id: string
        }
        Insert: {
          amount?: number
          bonus?: number
          created_at?: string
          deductions?: number
          id?: string
          month: string
          notes?: string | null
          paid?: boolean
          user_id: string
        }
        Update: {
          amount?: number
          bonus?: number
          created_at?: string
          deductions?: number
          id?: string
          month?: string
          notes?: string | null
          paid?: boolean
          user_id?: string
        }
        Relationships: []
      }
      salary_advances: {
        Row: {
          amount: number
          approved: boolean
          created_at: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          approved?: boolean
          created_at?: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved?: boolean
          created_at?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact: string
          created_at: string
          created_by: string
          id: string
          location: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          contact?: string
          created_at?: string
          created_by: string
          id?: string
          location?: string
          name: string
          phone?: string
          updated_at?: string
        }
        Update: {
          contact?: string
          created_at?: string
          created_by?: string
          id?: string
          location?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          name: string
          photo_url: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          name?: string
          photo_url?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          name?: string
          photo_url?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      showcase_products: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouse_stock: {
        Row: {
          id: string
          min_stock: number
          product_name: string
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          min_stock?: number
          product_name?: string
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          min_stock?: number
          product_name?: string
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfers: {
        Row: {
          created_at: string
          created_by: string
          from_warehouse_id: string
          id: string
          notes: string | null
          product_name: string
          quantity: number
          status: string
          to_warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          from_warehouse_id: string
          id?: string
          notes?: string | null
          product_name?: string
          quantity?: number
          status?: string
          to_warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          from_warehouse_id?: string
          id?: string
          notes?: string | null
          product_name?: string
          quantity?: number
          status?: string
          to_warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          location: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          location?: string
          name?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          location?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee"],
    },
  },
} as const
