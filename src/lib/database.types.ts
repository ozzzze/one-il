export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  one_il: {
    Tables: {
      menu_groups: {
        Row: {
          code: string
          is_active: boolean
          label_en: string
          label_th: string
          sort_order: number
        }
        Insert: {
          code: string
          is_active?: boolean
          label_en: string
          label_th: string
          sort_order?: number
        }
        Update: {
          code?: string
          is_active?: boolean
          label_en?: string
          label_th?: string
          sort_order?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          group_id: string
          href: string | null
          icon_key: string | null
          id: string
          implementation_status: Database["one_il"]["Enums"]["menu_item_implementation_status"]
          keywords: string[] | null
          label_en: string
          label_th: string
          parent_id: string | null
          required_permission_keys: string[]
          sort_order: number
          visibility: Database["one_il"]["Enums"]["menu_item_visibility"]
        }
        Insert: {
          group_id: string
          href?: string | null
          icon_key?: string | null
          id: string
          implementation_status?: Database["one_il"]["Enums"]["menu_item_implementation_status"]
          keywords?: string[] | null
          label_en: string
          label_th: string
          parent_id?: string | null
          required_permission_keys?: string[]
          sort_order?: number
          visibility?: Database["one_il"]["Enums"]["menu_item_visibility"]
        }
        Update: {
          group_id?: string
          href?: string | null
          icon_key?: string | null
          id?: string
          implementation_status?: Database["one_il"]["Enums"]["menu_item_implementation_status"]
          keywords?: string[] | null
          label_en?: string
          label_th?: string
          parent_id?: string | null
          required_permission_keys?: string[]
          sort_order?: number
          visibility?: Database["one_il"]["Enums"]["menu_item_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_change_requests: {
        Row: {
          created_at: string
          current_value: string | null
          field: string
          id: string
          reason: string | null
          requested_value: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: number | null
          status: string
          updated_at: string
          user_id: number
        }
        Insert: {
          created_at?: string
          current_value?: string | null
          field: string
          id?: string
          reason?: string | null
          requested_value: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          status?: string
          updated_at?: string
          user_id: number
        }
        Update: {
          created_at?: string
          current_value?: string | null
          field?: string
          id?: string
          reason?: string | null
          requested_value?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: number | null
          status?: string
          updated_at?: string
          user_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_role: { Args: never; Returns: boolean }
    }
    Enums: {
      menu_item_implementation_status: "live" | "planned"
      menu_item_visibility: "standard" | "admin_only"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  one_leave: {
    Tables: {
      academic_ranks: {
        Row: {
          code: string
          created_at: string
          id: number
          is_active: boolean
          name_th: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          is_active?: boolean
          name_th: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          is_active?: boolean
          name_th?: string
          sort_order?: number
        }
        Relationships: []
      }
      approval_pipeline_steps: {
        Row: {
          action_type: string
          actor_role: string
          from_status: string
          id: number
          module_code: string
          pipeline_code: string
          step_order: number
          to_status: string
        }
        Insert: {
          action_type: string
          actor_role: string
          from_status: string
          id?: never
          module_code: string
          pipeline_code: string
          step_order: number
          to_status: string
        }
        Update: {
          action_type?: string
          actor_role?: string
          from_status?: string
          id?: never
          module_code?: string
          pipeline_code?: string
          step_order?: number
          to_status?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          after_json: string | null
          before_json: string | null
          created_at: string
          entity_id: number
          entity_type: string
          id: number
          ip_address: string | null
          role_code: string | null
          summary: string | null
          user_id: number | null
        }
        Insert: {
          action: string
          after_json?: string | null
          before_json?: string | null
          created_at?: string
          entity_id: number
          entity_type: string
          id?: never
          ip_address?: string | null
          role_code?: string | null
          summary?: string | null
          user_id?: number | null
        }
        Update: {
          action?: string
          after_json?: string | null
          before_json?: string | null
          created_at?: string
          entity_id?: number
          entity_type?: string
          id?: never
          ip_address?: string | null
          role_code?: string | null
          summary?: string | null
          user_id?: number | null
        }
        Relationships: []
      }
      deputy_grantor_assignments: {
        Row: {
          created_at: string
          deputy_employee_id: number
          id: number
          org_unit_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deputy_employee_id: number
          id?: number
          org_unit_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deputy_employee_id?: number
          id?: number
          org_unit_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deputy_grantor_assignments_deputy_employee_id_fkey"
            columns: ["deputy_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deputy_grantor_assignments_org_unit_id_fkey"
            columns: ["org_unit_id"]
            isOneToOne: true
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sequences: {
        Row: {
          last_number: number
          prefix: string
          year_month: string
        }
        Insert: {
          last_number?: number
          prefix: string
          year_month: string
        }
        Update: {
          last_number?: number
          prefix?: string
          year_month?: string
        }
        Relationships: []
      }
      email_batches: {
        Row: {
          created_at: string
          error_message: string | null
          id: number
          item_count: number
          kind: string
          recipient_email: string
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: never
          item_count?: number
          kind: string
          recipient_email: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: never
          item_count?: number
          kind?: string
          recipient_email?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      email_delivery_log: {
        Row: {
          batch_id: number | null
          created_at: string
          error_message: string | null
          id: number
          outbox_id: number | null
          provider_ref: string | null
          recipient_email: string
          status: string
          subject: string
        }
        Insert: {
          batch_id?: number | null
          created_at?: string
          error_message?: string | null
          id?: never
          outbox_id?: number | null
          provider_ref?: string | null
          recipient_email: string
          status: string
          subject: string
        }
        Update: {
          batch_id?: number | null
          created_at?: string
          error_message?: string | null
          id?: never
          outbox_id?: number | null
          provider_ref?: string | null
          recipient_email?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_email_delivery_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "email_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_email_delivery_outbox"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "email_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      email_dispatch_schedules: {
        Row: {
          enabled: boolean
          kind: string
          send_empty_batch: boolean
          send_time_local: string
          skip_non_working_days: boolean
          timezone: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          enabled?: boolean
          kind: string
          send_empty_batch?: boolean
          send_time_local: string
          skip_non_working_days?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          enabled?: boolean
          kind?: string
          send_empty_batch?: boolean
          send_time_local?: string
          skip_non_working_days?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_email_sched_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempt_count: number
          batch_id: number | null
          created_at: string
          due_at: string
          id: number
          idempotency_key: string
          kind: string
          last_error: string | null
          leave_request_id: number
          payload_json: string
          recipient_email: string
          recipient_employee_id: number | null
          recipient_user_id: number | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempt_count?: number
          batch_id?: number | null
          created_at?: string
          due_at: string
          id?: never
          idempotency_key: string
          kind: string
          last_error?: string | null
          leave_request_id: number
          payload_json: string
          recipient_email: string
          recipient_employee_id?: number | null
          recipient_user_id?: number | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempt_count?: number
          batch_id?: number | null
          created_at?: string
          due_at?: string
          id?: never
          idempotency_key?: string
          kind?: string
          last_error?: string | null
          leave_request_id?: number
          payload_json?: string
          recipient_email?: string
          recipient_employee_id?: number | null
          recipient_user_id?: number | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_email_outbox_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "email_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_email_outbox_leave"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_email_outbox_recipient_user"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_smtp_profiles: {
        Row: {
          from_address: string
          from_name: string | null
          host: string
          id: number
          is_active: boolean
          key_version: number | null
          password_ciphertext: string | null
          password_iv: string | null
          password_tag: string | null
          port: number
          reply_to: string | null
          secure: boolean
          updated_at: string
          updated_by: number | null
          username: string | null
        }
        Insert: {
          from_address: string
          from_name?: string | null
          host: string
          id?: never
          is_active?: boolean
          key_version?: number | null
          password_ciphertext?: string | null
          password_iv?: string | null
          password_tag?: string | null
          port?: number
          reply_to?: string | null
          secure?: boolean
          updated_at?: string
          updated_by?: number | null
          username?: string | null
        }
        Update: {
          from_address?: string
          from_name?: string | null
          host?: string
          id?: never
          is_active?: boolean
          key_version?: number | null
          password_ciphertext?: string | null
          password_iv?: string | null
          password_tag?: string | null
          port?: number
          reply_to?: string | null
          secure?: boolean
          updated_at?: string
          updated_by?: number | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_email_smtp_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_emergency_contacts: {
        Row: {
          contact_name: string | null
          contact_order: number
          created_at: string
          employee_id: number
          id: number
          mobile_phone: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          contact_order: number
          created_at?: string
          employee_id: number
          id?: number
          mobile_phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          contact_order?: number
          created_at?: string
          employee_id?: number
          id?: number
          mobile_phone?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_emergency_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          academic_rank_id: number | null
          affiliation_org_unit_id: number | null
          approval_pipeline: string | null
          birth_date: string | null
          created_at: string
          deputy_grantor_employee_id: number | null
          director_grantor_employee_id: number | null
          email: string | null
          employee_code: string
          employee_line: string
          employment_category: string
          employment_status_id: number | null
          employment_track: string | null
          first_name_th: string
          has_teacher_license: boolean | null
          hire_date: string
          id: number
          is_active: boolean
          is_office_unit_head: boolean
          job_position_title: string | null
          last_name_th: string
          legacy_employee_id: string | null
          mobile_phone: string | null
          nickname: string | null
          org_unit_id: number
          professional_title: string | null
          supervisor_employee_id: number | null
          termination_date: string | null
          termination_reason_code: string | null
          title_th: string | null
          updated_at: string
          vehicle_plate_1: string | null
          vehicle_plate_2: string | null
        }
        Insert: {
          academic_rank_id?: number | null
          affiliation_org_unit_id?: number | null
          approval_pipeline?: string | null
          birth_date?: string | null
          created_at?: string
          deputy_grantor_employee_id?: number | null
          director_grantor_employee_id?: number | null
          email?: string | null
          employee_code: string
          employee_line: string
          employment_category: string
          employment_status_id?: number | null
          employment_track?: string | null
          first_name_th: string
          has_teacher_license?: boolean | null
          hire_date: string
          id?: never
          is_active?: boolean
          is_office_unit_head?: boolean
          job_position_title?: string | null
          last_name_th: string
          legacy_employee_id?: string | null
          mobile_phone?: string | null
          nickname?: string | null
          org_unit_id: number
          professional_title?: string | null
          supervisor_employee_id?: number | null
          termination_date?: string | null
          termination_reason_code?: string | null
          title_th?: string | null
          updated_at?: string
          vehicle_plate_1?: string | null
          vehicle_plate_2?: string | null
        }
        Update: {
          academic_rank_id?: number | null
          affiliation_org_unit_id?: number | null
          approval_pipeline?: string | null
          birth_date?: string | null
          created_at?: string
          deputy_grantor_employee_id?: number | null
          director_grantor_employee_id?: number | null
          email?: string | null
          employee_code?: string
          employee_line?: string
          employment_category?: string
          employment_status_id?: number | null
          employment_track?: string | null
          first_name_th?: string
          has_teacher_license?: boolean | null
          hire_date?: string
          id?: never
          is_active?: boolean
          is_office_unit_head?: boolean
          job_position_title?: string | null
          last_name_th?: string
          legacy_employee_id?: string | null
          mobile_phone?: string | null
          nickname?: string | null
          org_unit_id?: number
          professional_title?: string | null
          supervisor_employee_id?: number | null
          termination_date?: string | null
          termination_reason_code?: string | null
          title_th?: string | null
          updated_at?: string
          vehicle_plate_1?: string | null
          vehicle_plate_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employees_deputy"
            columns: ["deputy_grantor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_director"
            columns: ["director_grantor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_org"
            columns: ["org_unit_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employees_supervisor"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_status_nodes: {
        Row: {
          code: string
          created_at: string
          depth: number
          employment_track: string | null
          id: number
          is_active: boolean
          is_selectable: boolean
          name_th: string
          parent_id: number | null
          quota_category_code: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          depth?: number
          employment_track?: string | null
          id?: number
          is_active?: boolean
          is_selectable?: boolean
          name_th: string
          parent_id?: number | null
          quota_category_code?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          depth?: number
          employment_track?: string | null
          id?: number
          is_active?: boolean
          is_selectable?: boolean
          name_th?: string
          parent_id?: number | null
          quota_category_code?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "employment_status_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "employment_status_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      exception_types: {
        Row: {
          code: string
          id: number
          is_active: boolean
          name_th: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: never
          is_active?: boolean
          name_th: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: never
          is_active?: boolean
          name_th?: string
          sort_order?: number
        }
        Relationships: []
      }
      fiscal_years: {
        Row: {
          code: string
          created_at: string
          end_date: string
          id: number
          is_closed: boolean
          is_current: boolean
          name_th: string
          start_date: string
        }
        Insert: {
          code: string
          created_at?: string
          end_date: string
          id?: never
          is_closed?: boolean
          is_current?: boolean
          name_th: string
          start_date: string
        }
        Update: {
          code?: string
          created_at?: string
          end_date?: string
          id?: never
          is_closed?: boolean
          is_current?: boolean
          name_th?: string
          start_date?: string
        }
        Relationships: []
      }
      it_systems: {
        Row: {
          code: string
          created_at: string
          id: number
          is_active: boolean
          name_en: string | null
          name_th: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          is_active?: boolean
          name_en?: string | null
          name_th: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          is_active?: boolean
          name_en?: string | null
          name_th?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      leave_approvals: {
        Row: {
          acted_at: string
          action_type: string
          actor_role: string
          actor_user_id: number | null
          comment: string | null
          from_status: string
          id: number
          ip_address: string | null
          leave_request_id: number
          step_order: number
          to_status: string
        }
        Insert: {
          acted_at?: string
          action_type: string
          actor_role: string
          actor_user_id?: number | null
          comment?: string | null
          from_status: string
          id?: never
          ip_address?: string | null
          leave_request_id: number
          step_order: number
          to_status: string
        }
        Update: {
          acted_at?: string
          action_type?: string
          actor_role?: string
          actor_user_id?: number | null
          comment?: string | null
          from_status?: string
          id?: never
          ip_address?: string | null
          leave_request_id?: number
          step_order?: number
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_appr_request"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_appr_user"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_attachments: {
        Row: {
          file_name: string
          file_size_bytes: number
          id: number
          leave_request_id: number
          mime_type: string
          storage_path: string
          uploaded_at: string
          uploaded_by: number
        }
        Insert: {
          file_name: string
          file_size_bytes: number
          id?: never
          leave_request_id: number
          mime_type: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: number
        }
        Update: {
          file_name?: string
          file_size_bytes?: number
          id?: never
          leave_request_id?: number
          mime_type?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_attach_request"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attach_user"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          adjusted_days: number
          carried_forward_days: number
          employee_id: number
          entitled_days: number
          fiscal_year_id: number
          id: number
          leave_type_id: number
          updated_at: string
          used_days: number
        }
        Insert: {
          adjusted_days?: number
          carried_forward_days?: number
          employee_id: number
          entitled_days?: number
          fiscal_year_id: number
          id?: never
          leave_type_id: number
          updated_at?: string
          used_days?: number
        }
        Update: {
          adjusted_days?: number
          carried_forward_days?: number
          employee_id?: number
          entitled_days?: number
          fiscal_year_id?: number
          id?: never
          leave_type_id?: number
          updated_at?: string
          used_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_bal_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bal_fiscal"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bal_type"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          employee_id: number
          end_date: string
          fiscal_year_id: number
          granted_at: string | null
          half_day_period: string | null
          health_data_consent: boolean
          id: number
          is_half_day: boolean
          leave_type_id: number
          quota_deducted_at: string | null
          reason: string | null
          reported_by_user_id: number | null
          request_number: string
          sick_leave_subtype: string | null
          start_date: string
          status: string
          submitted_at: string | null
          updated_at: string
          urgent_flag: boolean
          working_days_count: number | null
        }
        Insert: {
          created_at?: string
          employee_id: number
          end_date: string
          fiscal_year_id: number
          granted_at?: string | null
          half_day_period?: string | null
          health_data_consent?: boolean
          id?: never
          is_half_day?: boolean
          leave_type_id: number
          quota_deducted_at?: string | null
          reason?: string | null
          reported_by_user_id?: number | null
          request_number: string
          sick_leave_subtype?: string | null
          start_date: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          urgent_flag?: boolean
          working_days_count?: number | null
        }
        Update: {
          created_at?: string
          employee_id?: number
          end_date?: string
          fiscal_year_id?: number
          granted_at?: string | null
          half_day_period?: string | null
          health_data_consent?: boolean
          id?: never
          is_half_day?: boolean
          leave_type_id?: number
          quota_deducted_at?: string | null
          reason?: string | null
          reported_by_user_id?: number | null
          request_number?: string
          sick_leave_subtype?: string | null
          start_date?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          urgent_flag?: boolean
          working_days_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leave_req_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_req_fiscal"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_req_reported_by"
            columns: ["reported_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_leave_req_type"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_revoke_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by_user_id: number | null
          id: number
          leave_request_id: number
          reason: string
          requested_by_user_id: number
          status: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by_user_id?: number | null
          id?: never
          leave_request_id: number
          reason: string
          requested_by_user_id: number
          status?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by_user_id?: number | null
          id?: never
          leave_request_id?: number
          reason?: string
          requested_by_user_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_revoke_decided_by"
            columns: ["decided_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_revoke_request"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_revoke_requested_by"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          code: string
          created_at: string
          deducts_quota: boolean
          id: number
          mvp_enabled: boolean
          name_th: string
          requires_reason: boolean
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          deducts_quota?: boolean
          id?: never
          mvp_enabled?: boolean
          name_th: string
          requires_reason?: boolean
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          deducts_quota?: boolean
          id?: never
          mvp_enabled?: boolean
          name_th?: string
          requires_reason?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempted_at: string
          id: number
          ip_address: string | null
          success: boolean
          username: string | null
        }
        Insert: {
          attempted_at?: string
          id?: never
          ip_address?: string | null
          success: boolean
          username?: string | null
        }
        Update: {
          attempted_at?: string
          id?: never
          ip_address?: string | null
          success?: boolean
          username?: string | null
        }
        Relationships: []
      }
      org_units: {
        Row: {
          code: string
          created_at: string
          id: number
          is_active: boolean
          name_en: string | null
          name_th: string
          parent_id: number | null
          peer_report_group: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          is_active?: boolean
          name_en?: string | null
          name_th: string
          parent_id?: number | null
          peer_report_group?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          is_active?: boolean
          name_en?: string | null
          name_th?: string
          parent_id?: number | null
          peer_report_group?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_org_units_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "org_units"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_attempts: {
        Row: {
          attempted_at: string
          email: string | null
          id: number
          ip_address: string | null
          outcome: string
        }
        Insert: {
          attempted_at?: string
          email?: string | null
          id?: never
          ip_address?: string | null
          outcome: string
        }
        Update: {
          attempted_at?: string
          email?: string | null
          id?: never
          ip_address?: string | null
          outcome?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: number
          requested_ip: string | null
          token_hash: string
          used_at: string | null
          user_id: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: never
          requested_ip?: string | null
          token_hash: string
          used_at?: string | null
          user_id: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: never
          requested_ip?: string | null
          token_hash?: string
          used_at?: string | null
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_prt_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_entitlement_rules: {
        Row: {
          effective_from: string | null
          effective_to: string | null
          employment_category: string | null
          entitled_days: number
          id: number
          leave_group_code: string
          max_service_years: number | null
          min_service_years: number
          sort_order: number
        }
        Insert: {
          effective_from?: string | null
          effective_to?: string | null
          employment_category?: string | null
          entitled_days: number
          id?: never
          leave_group_code: string
          max_service_years?: number | null
          min_service_years?: number
          sort_order?: number
        }
        Update: {
          effective_from?: string | null
          effective_to?: string | null
          employment_category?: string | null
          entitled_days?: number
          id?: never
          leave_group_code?: string
          max_service_years?: number | null
          min_service_years?: number
          sort_order?: number
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          data_json: string | null
          expires_at: string
          id: string
          user_id: number
        }
        Insert: {
          created_at?: string
          data_json?: string | null
          expires_at: string
          id: string
          user_id: number
        }
        Update: {
          created_at?: string
          data_json?: string | null
          expires_at?: string
          id?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_sessions_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_change_approvals: {
        Row: {
          acted_at: string
          action_type: string
          actor_role: string
          actor_user_id: number | null
          comment: string | null
          from_status: string
          id: number
          ip_address: string | null
          step_order: number
          system_change_request_id: number
          to_status: string
        }
        Insert: {
          acted_at?: string
          action_type: string
          actor_role: string
          actor_user_id?: number | null
          comment?: string | null
          from_status: string
          id?: never
          ip_address?: string | null
          step_order: number
          system_change_request_id: number
          to_status: string
        }
        Update: {
          acted_at?: string
          action_type?: string
          actor_role?: string
          actor_user_id?: number | null
          comment?: string | null
          from_status?: string
          id?: never
          ip_address?: string | null
          step_order?: number
          system_change_request_id?: number
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_scr_appr_request"
            columns: ["system_change_request_id"]
            isOneToOne: false
            referencedRelation: "system_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scr_appr_user"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_change_attachments: {
        Row: {
          attachment_type: string
          file_name: string
          file_size_bytes: number
          id: number
          mime_type: string
          storage_path: string
          system_change_request_id: number
          uploaded_at: string
          uploaded_by: number
        }
        Insert: {
          attachment_type: string
          file_name: string
          file_size_bytes: number
          id?: never
          mime_type: string
          storage_path: string
          system_change_request_id: number
          uploaded_at?: string
          uploaded_by: number
        }
        Update: {
          attachment_type?: string
          file_name?: string
          file_size_bytes?: number
          id?: never
          mime_type?: string
          storage_path?: string
          system_change_request_id?: number
          uploaded_at?: string
          uploaded_by?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_scr_attach_request"
            columns: ["system_change_request_id"]
            isOneToOne: false
            referencedRelation: "system_change_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scr_attach_user"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_change_requests: {
        Row: {
          business_justification: string
          change_category: string
          closed_at: string | null
          compensating_controls: string | null
          created_at: string
          description: string
          exception_end_date: string
          exception_start_date: string
          exception_type_id: number
          id: number
          impact_description: string | null
          implementation_notes: string | null
          implemented_at: string | null
          it_system_id: number
          planned_implementation_at: string | null
          post_review_completed_at: string | null
          post_review_required: boolean
          request_number: string
          requester_employee_id: number
          requester_user_id: number
          risk_assessment: string
          rollback_plan: string
          status: string
          submitted_at: string | null
          supervisor_approved_at: string | null
          supervisor_employee_id: number | null
          test_environment: string | null
          test_result_summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          business_justification: string
          change_category: string
          closed_at?: string | null
          compensating_controls?: string | null
          created_at?: string
          description: string
          exception_end_date: string
          exception_start_date: string
          exception_type_id: number
          id?: never
          impact_description?: string | null
          implementation_notes?: string | null
          implemented_at?: string | null
          it_system_id: number
          planned_implementation_at?: string | null
          post_review_completed_at?: string | null
          post_review_required?: boolean
          request_number: string
          requester_employee_id: number
          requester_user_id: number
          risk_assessment: string
          rollback_plan: string
          status?: string
          submitted_at?: string | null
          supervisor_approved_at?: string | null
          supervisor_employee_id?: number | null
          test_environment?: string | null
          test_result_summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          business_justification?: string
          change_category?: string
          closed_at?: string | null
          compensating_controls?: string | null
          created_at?: string
          description?: string
          exception_end_date?: string
          exception_start_date?: string
          exception_type_id?: number
          id?: never
          impact_description?: string | null
          implementation_notes?: string | null
          implemented_at?: string | null
          it_system_id?: number
          planned_implementation_at?: string | null
          post_review_completed_at?: string | null
          post_review_required?: boolean
          request_number?: string
          requester_employee_id?: number
          requester_user_id?: number
          risk_assessment?: string
          rollback_plan?: string
          status?: string
          submitted_at?: string | null
          supervisor_approved_at?: string | null
          supervisor_employee_id?: number | null
          test_environment?: string | null
          test_result_summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_scr_exception_type"
            columns: ["exception_type_id"]
            isOneToOne: false
            referencedRelation: "exception_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scr_it_system"
            columns: ["it_system_id"]
            isOneToOne: false
            referencedRelation: "it_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scr_requester_employee"
            columns: ["requester_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scr_requester_user"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_scr_supervisor"
            columns: ["supervisor_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: number | null
        }
        Insert: {
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: number | null
        }
        Update: {
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_settings_user"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_admin_audit: {
        Row: {
          action: string
          actor_user_id: number | null
          actor_username: string | null
          created_at: string
          detail: Json | null
          id: number
          target_user_id: number | null
        }
        Insert: {
          action: string
          actor_user_id?: number | null
          actor_username?: string | null
          created_at?: string
          detail?: Json | null
          id?: number
          target_user_id?: number | null
        }
        Update: {
          action?: string
          actor_user_id?: number | null
          actor_username?: string | null
          created_at?: string
          detail?: Json | null
          id?: number
          target_user_id?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          role_code: string
          user_id: number
        }
        Insert: {
          granted_at?: string
          role_code: string
          user_id: number
        }
        Update: {
          granted_at?: string
          role_code?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_roles_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          employee_id: number | null
          id: number
          is_active: boolean
          must_change_password: boolean
          password_changed_at: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          employee_id?: number | null
          id?: never
          is_active?: boolean
          must_change_password?: boolean
          password_changed_at?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          employee_id?: number | null
          id?: never
          is_active?: boolean
          must_change_password?: boolean
          password_changed_at?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      work_activity_approvals: {
        Row: {
          acted_at: string
          action_type: string
          actor_role: string
          actor_user_id: number | null
          comment: string | null
          from_status: string
          id: number
          ip_address: string | null
          step_order: number
          to_status: string
          work_activity_record_id: number
        }
        Insert: {
          acted_at?: string
          action_type: string
          actor_role: string
          actor_user_id?: number | null
          comment?: string | null
          from_status: string
          id?: never
          ip_address?: string | null
          step_order: number
          to_status: string
          work_activity_record_id: number
        }
        Update: {
          acted_at?: string
          action_type?: string
          actor_role?: string
          actor_user_id?: number | null
          comment?: string | null
          from_status?: string
          id?: never
          ip_address?: string | null
          step_order?: number
          to_status?: string
          work_activity_record_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_activity_appr_record"
            columns: ["work_activity_record_id"]
            isOneToOne: false
            referencedRelation: "work_activity_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activity_appr_user"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_activity_records: {
        Row: {
          activity_type: string
          created_at: string
          employee_id: number
          end_date: string
          fiscal_year_id: number
          granted_at: string | null
          id: number
          reason: string | null
          request_number: string
          start_date: string
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          employee_id: number
          end_date: string
          fiscal_year_id: number
          granted_at?: string | null
          id?: never
          reason?: string | null
          request_number: string
          start_date: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          employee_id?: number
          end_date?: string
          fiscal_year_id?: number
          granted_at?: string | null
          id?: never
          reason?: string | null
          request_number?: string
          start_date?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_activity_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activity_fiscal"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
        ]
      }
      working_calendar_days: {
        Row: {
          calendar_date: string
          day_type: string
          fiscal_year_id: number
          note_th: string | null
        }
        Insert: {
          calendar_date: string
          day_type: string
          fiscal_year_id: number
          note_th?: string | null
        }
        Update: {
          calendar_date?: string
          day_type?: string
          fiscal_year_id?: number
          note_th?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_calendar_fiscal"
            columns: ["fiscal_year_id"]
            isOneToOne: false
            referencedRelation: "fiscal_years"
            referencedColumns: ["id"]
          },
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
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_admin_role: { Args: never; Returns: boolean }
      has_support_manage: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  one_il: {
    Enums: {
      menu_item_implementation_status: ["live", "planned"],
      menu_item_visibility: ["standard", "admin_only"],
    },
  },
  one_leave: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

