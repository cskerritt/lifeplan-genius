export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      care_plan_entries: {
        Row: {
          annual_cost: number
          avg_cost: number | null
          category: string
          cpt_code: string | null
          cpt_description: string | null
          created_at: string | null
          end_age: number
          frequency: string | null
          id: string
          is_one_time: boolean | null
          item: string
          lifetime_cost: number
          max_cost: number | null
          max_duration: number | null
          max_frequency: number | null
          mfr_adjusted: number | null
          min_cost: number | null
          min_duration: number | null
          min_frequency: number | null
          pfr_adjusted: number | null
          plan_id: string
          start_age: number
          updated_at: string | null
          use_age_increments: boolean | null
          age_increments: string | null
        }
        Insert: {
          annual_cost: number
          avg_cost?: number | null
          category: string
          cpt_code?: string | null
          cpt_description?: string | null
          created_at?: string | null
          end_age: number
          frequency?: string | null
          id?: string
          is_one_time?: boolean | null
          item: string
          lifetime_cost: number
          max_cost?: number | null
          max_duration?: number | null
          max_frequency?: number | null
          mfr_adjusted?: number | null
          min_cost?: number | null
          min_duration?: number | null
          min_frequency?: number | null
          pfr_adjusted?: number | null
          plan_id: string
          start_age: number
          updated_at?: string | null
          use_age_increments?: boolean | null
          age_increments?: string | null
        }
        Update: {
          annual_cost?: number
          avg_cost?: number | null
          category?: string
          cpt_code?: string | null
          cpt_description?: string | null
          created_at?: string | null
          end_age?: number
          frequency?: string | null
          id?: string
          is_one_time?: boolean | null
          item?: string
          lifetime_cost?: number
          max_cost?: number | null
          max_duration?: number | null
          max_frequency?: number | null
          mfr_adjusted?: number | null
          min_cost?: number | null
          min_duration?: number | null
          min_frequency?: number | null
          pfr_adjusted?: number | null
          plan_id?: string
          start_age?: number
          updated_at?: string | null
          use_age_increments?: boolean | null
          age_increments?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_entries_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "life_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      cpt_codes: {
        Row: {
          code: string
          code_description: string
          created_at: string | null
          mfu_50th: number
          mfu_75th: number
          mfu_90th: number
          pfr_50th: number
          pfr_75th: number
          pfr_90th: number
        }
        Insert: {
          code: string
          code_description: string
          created_at?: string | null
          mfu_50th: number
          mfu_75th: number
          mfu_90th: number
          pfr_50th: number
          pfr_75th: number
          pfr_90th: number
        }
        Update: {
          code?: string
          code_description?: string
          created_at?: string | null
          mfu_50th?: number
          mfu_75th?: number
          mfu_90th?: number
          pfr_50th?: number
          pfr_75th?: number
          pfr_90th?: number
        }
        Relationships: []
      }
      fee_chart: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          fee: number
          id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          fee?: number
          id?: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          fee?: number
          id?: string
        }
        Relationships: []
      }
      fee_imports_staging: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          processed: boolean | null
          raw_data: Json | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed?: boolean | null
          raw_data?: Json | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed?: boolean | null
          raw_data?: Json | null
        }
        Relationships: []
      }
      fee_sheet: {
        Row: {
          code: string
          code_description: string
          created_at: string | null
          mfu_50th: number
          mfu_75th: number
          mfu_90th: number
          pfr_50th: number
          pfr_75th: number
          pfr_90th: number
        }
        Insert: {
          code: string
          code_description: string
          created_at?: string | null
          mfu_50th: number
          mfu_75th: number
          mfu_90th: number
          pfr_50th: number
          pfr_75th: number
          pfr_90th: number
        }
        Update: {
          code?: string
          code_description?: string
          created_at?: string | null
          mfu_50th?: number
          mfu_75th?: number
          mfu_90th?: number
          pfr_50th?: number
          pfr_75th?: number
          pfr_90th?: number
        }
        Relationships: []
      }
      gaf_import_errors: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          row_data: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          row_data?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          row_data?: string | null
        }
        Relationships: []
      }
      gaf_lookup: {
        Row: {
          asa_factor: number
          city: string | null
          conversion_factor_asa_50th: number
          conversion_factor_asa_75th: number
          county_fips: string
          county_name: string
          created_at: string | null
          id: string
          mfr_code: number
          pfr_code: number
          state_id: string
          state_name: string
          zip: string
        }
        Insert: {
          asa_factor: number
          city?: string | null
          conversion_factor_asa_50th: number
          conversion_factor_asa_75th: number
          county_fips: string
          county_name: string
          created_at?: string | null
          id?: string
          mfr_code: number
          pfr_code: number
          state_id: string
          state_name: string
          zip: string
        }
        Update: {
          asa_factor?: number
          city?: string | null
          conversion_factor_asa_50th?: number
          conversion_factor_asa_75th?: number
          county_fips?: string
          county_name?: string
          created_at?: string | null
          id?: string
          mfr_code?: number
          pfr_code?: number
          state_id?: string
          state_name?: string
          zip?: string
        }
        Relationships: []
      }
      geographic_factors: {
        Row: {
          city: string | null
          county_fips: string
          county_name: string
          created_at: string | null
          gaf_lookup: number | null
          id: string
          mfr_code: string
          mfr_factor: number | null
          pfr_code: string
          pfr_factor: number | null
          state_id: string
          state_name: string
          zip: string
        }
        Insert: {
          city?: string | null
          county_fips: string
          county_name: string
          created_at?: string | null
          gaf_lookup?: number | null
          id?: string
          mfr_code: string
          mfr_factor?: number | null
          pfr_code: string
          pfr_factor?: number | null
          state_id: string
          state_name: string
          zip: string
        }
        Update: {
          city?: string | null
          county_fips?: string
          county_name?: string
          created_at?: string | null
          gaf_lookup?: number | null
          id?: string
          mfr_code?: string
          mfr_factor?: number | null
          pfr_code?: string
          pfr_factor?: number | null
          state_id?: string
          state_name?: string
          zip?: string
        }
        Relationships: []
      }
      import_errors: {
        Row: {
          created_at: string | null
          error_message: string
          id: string
          raw_data: string | null
          row_number: number | null
          table_name: string
        }
        Insert: {
          created_at?: string | null
          error_message: string
          id?: string
          raw_data?: string | null
          row_number?: number | null
          table_name: string
        }
        Update: {
          created_at?: string | null
          error_message?: string
          id?: string
          raw_data?: string | null
          row_number?: number | null
          table_name?: string
        }
        Relationships: []
      }
      life_care_plan_category_totals: {
        Row: {
          annual_cost: number
          avg_cost: number | null
          category: string
          created_at: string | null
          id: string
          lifetime_cost: number
          max_cost: number | null
          min_cost: number | null
          plan_id: string
          updated_at: string | null
        }
        Insert: {
          annual_cost?: number
          avg_cost?: number | null
          category: string
          created_at?: string | null
          id?: string
          lifetime_cost?: number
          max_cost?: number | null
          min_cost?: number | null
          plan_id: string
          updated_at?: string | null
        }
        Update: {
          annual_cost?: number
          avg_cost?: number | null
          category?: string
          created_at?: string | null
          id?: string
          lifetime_cost?: number
          max_cost?: number | null
          min_cost?: number | null
          plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_care_plan_category_totals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "life_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      life_care_plan_totals: {
        Row: {
          created_at: string | null
          id: string
          plan_id: string
          total_annual_cost: number
          total_lifetime_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_id: string
          total_annual_cost?: number
          total_lifetime_cost?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_id?: string
          total_annual_cost?: number
          total_lifetime_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "life_care_plan_totals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: true
            referencedRelation: "life_care_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      life_care_plans: {
        Row: {
          age_at_injury: number | null
          city: string
          county_apc: string
          county_drg: string
          created_at: string | null
          date_of_birth: string
          date_of_injury: string | null
          first_name: string
          gender: string
          id: string
          last_name: string
          life_expectancy: number | null
          projected_age_at_death: number | null
          race: string
          state: string
          statistical_lifespan: number | null
          street_address: string
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          age_at_injury?: number | null
          city?: string
          county_apc?: string
          county_drg?: string
          created_at?: string | null
          date_of_birth: string
          date_of_injury?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          life_expectancy?: number | null
          projected_age_at_death?: number | null
          race?: string
          state?: string
          statistical_lifespan?: number | null
          street_address?: string
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          age_at_injury?: number | null
          city?: string
          county_apc?: string
          county_drg?: string
          created_at?: string | null
          date_of_birth?: string
          date_of_injury?: string | null
          first_name?: string
          gender?: string
          id?: string
          last_name?: string
          life_expectancy?: number | null
          projected_age_at_death?: number | null
          race?: string
          state?: string
          statistical_lifespan?: number | null
          street_address?: string
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      quick_codes: {
        Row: {
          category: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          subcategory: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          subcategory: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          subcategory?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_adjusted_costs: {
        Args: {
          base_fee: number
          mfr_factor: number
          pfr_factor: number
        }
        Returns: {
          min_cost: number
          max_cost: number
          avg_cost: number
          mfr_adjusted: number
          pfr_adjusted: number
        }[]
      }
      clean_currency: {
        Args: {
          value: string
        }
        Returns: number
      }
      clean_fee_data: {
        Args: {
          raw_data: Json
        }
        Returns: Json
      }
      clean_numeric: {
        Args: {
          value: string
        }
        Returns: number
      }
      format_zip: {
        Args: {
          zip_code: string
        }
        Returns: string
      }
      gtrgm_compress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_in: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      gtrgm_options: {
        Args: {
          "": unknown
        }
        Returns: undefined
      }
      gtrgm_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      import_gaf_data: {
        Args: {
          p_zip: string
          p_city: string
          p_state_id: string
          p_state_name: string
          p_county_fips: string
          p_county_name: string
          p_mfr_code: string
          p_pfr_code: string
          p_asa_factor: string
          p_conversion_50th: string
          p_conversion_75th: string
        }
        Returns: undefined
      }
      pad_zip_code:
        | {
            Args: {
              zip_input: string
            }
            Returns: string
          }
        | {
            Args: {
              zip_input: unknown
            }
            Returns: string
          }
      process_fee_import: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_cpt_codes: {
        Args: {
          search_term: string
        }
        Returns: {
          code: string
          description: string
          base_rate_50th: number
          base_rate_75th: number
        }[]
      }
      search_fee_chart: {
        Args: {
          search_query: string
        }
        Returns: {
          code: string
          description: string
          fee: number
        }[]
      }
      search_fee_sheet:
        | {
            Args: {
              search_query: string
              search_code_type: string
            }
            Returns: {
              code: string
              description: string
              base_rate: number
              code_type: string
            }[]
          }
        | {
            Args: {
              search_term: string
            }
            Returns: {
              code: string
              description: string
              base_rate: number
            }[]
          }
      search_geographic_factors: {
        Args: {
          zip_code: string
        }
        Returns: {
          zip: string
          city: string
          state_name: string
          mfr_code: number
          pfr_code: number
        }[]
      }
      set_limit: {
        Args: {
          "": number
        }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: {
          "": string
        }
        Returns: string[]
      }
      validate_cpt_code: {
        Args: {
          code_to_check: string
        }
        Returns: {
          is_valid: boolean
          code_description: string
          pfr_50th: number
          pfr_75th: number
          pfr_90th: number
          mfu_50th: number
          mfu_75th: number
          mfu_90th: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
