/**
 * Generated manually from Postgres schema / migrations.
 * Regenerate from hosted project when `SUPABASE_ACCESS_TOKEN` is set:
 * `pnpm run supabase:types`
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type GenericSupabaseTable = {
	Row: Record<string, unknown>;
	Insert: Record<string, unknown>;
	Update: Record<string, unknown>;
	Relationships: [];
};

export type Database = {
	public: {
		Tables: {
			app_settings: {
				Row: { key: string; value: string; updated_at: string };
				Insert: { key: string; value: string; updated_at?: string };
				Update: Partial<{ key: string; value: string; updated_at: string }>;
				Relationships: [];
			};
			deduction_types: {
				Row: {
					id: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["deduction_types"]["Row"]>;
				Relationships: [];
			};
			employee_assignments: {
				Row: {
					id: string;
					employee_id: string;
					position_id: string;
					org_unit_id: string;
					starts_at: string;
					ends_at: string | null;
					is_primary: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					employee_id: string;
					position_id: string;
					org_unit_id: string;
					starts_at: string;
					ends_at?: string | null;
					is_primary?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["employee_assignments"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "employee_assignments_employee_id_fkey";
						columns: ["employee_id"];
						isOneToOne: false;
						referencedRelation: "employees";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "employee_assignments_org_unit_id_fkey";
						columns: ["org_unit_id"];
						isOneToOne: false;
						referencedRelation: "org_units";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "employee_assignments_position_id_fkey";
						columns: ["position_id"];
						isOneToOne: false;
						referencedRelation: "positions";
						referencedColumns: ["id"];
					},
				];
			};
			employee_deductions: {
				Row: {
					employee_id: string;
					deduction_type_id: string;
					created_at: string;
				};
				Insert: {
					employee_id: string;
					deduction_type_id: string;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["employee_deductions"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "employee_deductions_deduction_type_id_fkey";
						columns: ["deduction_type_id"];
						isOneToOne: false;
						referencedRelation: "deduction_types";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "employee_deductions_employee_id_fkey";
						columns: ["employee_id"];
						isOneToOne: false;
						referencedRelation: "employees";
						referencedColumns: ["id"];
					},
				];
			};
			employee_emergency_contacts: {
				Row: {
					id: string;
					employee_id: string;
					slot: number;
					contact_name: string | null;
					relationship: string | null;
					phone: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					employee_id: string;
					slot: number;
					contact_name?: string | null;
					relationship?: string | null;
					phone?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["employee_emergency_contacts"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "employee_emergency_contacts_employee_id_fkey";
						columns: ["employee_id"];
						isOneToOne: false;
						referencedRelation: "employees";
						referencedColumns: ["id"];
					},
				];
			};
			employee_supervisors: {
				Row: {
					id: string;
					employee_id: string;
					supervisor_employee_id: string;
					relation_type: string;
					starts_at: string;
					ends_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					employee_id: string;
					supervisor_employee_id: string;
					relation_type?: string;
					starts_at: string;
					ends_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["employee_supervisors"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "employee_supervisors_employee_id_fkey";
						columns: ["employee_id"];
						isOneToOne: false;
						referencedRelation: "employees";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "employee_supervisors_supervisor_employee_id_fkey";
						columns: ["supervisor_employee_id"];
						isOneToOne: false;
						referencedRelation: "employees";
						referencedColumns: ["id"];
					},
				];
			};
			employees: {
				Row: {
					id: string;
					employee_no: string | null;
					first_name: string;
					last_name: string;
					email: string | null;
					user_id: string | null;
					app_role: string | null;
					status: string;
					created_at: string;
					updated_at: string;
					person_title_th: string | null;
					academic_title_th: string | null;
					person_title_en: string | null;
					academic_title_en: string | null;
					first_name_en: string | null;
					last_name_en: string | null;
					nickname: string | null;
					address: string | null;
					gender: string | null;
					duty_kind: string | null;
					professional_teacher_license: boolean;
					professional_recognition_status: string | null;
					birth_date: string | null;
					employment_contract_type_id: string | null;
					personnel_category_id: string | null;
					hr_employment_status_id: string | null;
					employment_started_at: string | null;
					employment_ended_at: string | null;
					photo_object_key: string | null;
				};
				Insert: {
					id?: string;
					employee_no?: string | null;
					first_name: string;
					last_name: string;
					email?: string | null;
					user_id?: string | null;
					app_role?: string | null;
					status?: string;
					created_at?: string;
					updated_at?: string;
					person_title_th?: string | null;
					academic_title_th?: string | null;
					person_title_en?: string | null;
					academic_title_en?: string | null;
					first_name_en?: string | null;
					last_name_en?: string | null;
					nickname?: string | null;
					address?: string | null;
					gender?: string | null;
					duty_kind?: string | null;
					professional_teacher_license?: boolean;
					professional_recognition_status?: string | null;
					birth_date?: string | null;
					employment_contract_type_id?: string | null;
					personnel_category_id?: string | null;
					hr_employment_status_id?: string | null;
					employment_started_at?: string | null;
					employment_ended_at?: string | null;
					photo_object_key?: string | null;
				};
				Update: Partial<Database["public"]["Tables"]["employees"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "employees_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			employment_contract_types: {
				Row: {
					id: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["employment_contract_types"]["Row"]>;
				Relationships: [];
			};
			hr_employment_statuses: {
				Row: {
					id: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["hr_employment_statuses"]["Row"]>;
				Relationships: [];
			};
			notifications: {
				Row: {
					id: string;
					user_id: string | null;
					title: string;
					message: string;
					type: string;
					read: boolean;
					created_at: string;
				};
				Insert: {
					id: string;
					user_id?: string | null;
					title: string;
					message: string;
					type?: string;
					read?: boolean;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "notifications_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			menu_groups: {
				Row: {
					code: string;
					label_th: string;
					label_en: string;
					sort_order: number;
					is_active: boolean;
				};
				Insert: {
					code: string;
					label_th: string;
					label_en: string;
					sort_order?: number;
					is_active?: boolean;
				};
				Update: Partial<Database["public"]["Tables"]["menu_groups"]["Row"]>;
				Relationships: [];
			};
			institutional_holidays: {
				Row: {
					id: string;
					holiday_date: string;
					name_th: string;
					name_en: string | null;
					notes: string | null;
					created_at: string;
					updated_at: string;
					created_by_user_id: string | null;
				};
				Insert: {
					id?: string;
					holiday_date: string;
					name_th: string;
					name_en?: string | null;
					notes?: string | null;
					created_at?: string;
					updated_at?: string;
					created_by_user_id?: string | null;
				};
				Update: Partial<Database["public"]["Tables"]["institutional_holidays"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "institutional_holidays_created_by_user_id_fkey";
						columns: ["created_by_user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			menu_items: {
				Row: {
					id: string;
					group_id: string;
					parent_id: string | null;
					label_th: string;
					label_en: string;
					href: string | null;
					icon_key: string | null;
					keywords: string[] | null;
					required_permission_keys: string[];
					visibility: "standard" | "admin_only";
					implementation_status: "live" | "planned";
					sort_order: number;
				};
				Insert: {
					id: string;
					group_id: string;
					parent_id?: string | null;
					label_th: string;
					label_en: string;
					href?: string | null;
					icon_key?: string | null;
					keywords?: string[] | null;
					required_permission_keys?: string[];
					visibility?: "standard" | "admin_only";
					implementation_status?: "live" | "planned";
					sort_order?: number;
				};
				Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "menu_items_group_id_fkey";
						columns: ["group_id"];
						isOneToOne: false;
						referencedRelation: "menu_groups";
						referencedColumns: ["code"];
					},
					{
						foreignKeyName: "menu_items_parent_id_fkey";
						columns: ["parent_id"];
						isOneToOne: false;
						referencedRelation: "menu_items";
						referencedColumns: ["id"];
					},
				];
			};
			user_menu_shortcuts: {
				Row: {
					id: string;
					user_id: string;
					menu_item_id: string;
					sort_order: number;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					menu_item_id: string;
					sort_order?: number;
					created_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["user_menu_shortcuts"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "user_menu_shortcuts_menu_item_id_fkey";
						columns: ["menu_item_id"];
						isOneToOne: false;
						referencedRelation: "menu_items";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "user_menu_shortcuts_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			org_units: {
				Row: {
					id: string;
					code: string;
					name: string;
					name_en: string | null;
					unit_type: string;
					parent_unit_id: string | null;
					sort_order: number;
					is_active: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					code: string;
					name: string;
					name_en?: string | null;
					unit_type: string;
					parent_unit_id?: string | null;
					sort_order?: number;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["org_units"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "org_units_parent_unit_id_fkey";
						columns: ["parent_unit_id"];
						isOneToOne: false;
						referencedRelation: "org_units";
						referencedColumns: ["id"];
					},
				];
			};
			pages: {
				Row: {
					id: string;
					title: string;
					slug: string;
					content: string;
					template: string;
					status: string;
					author_id: string;
					created_at: string;
					updated_at: string;
					published_at: string | null;
				};
				Insert: {
					id: string;
					title: string;
					slug: string;
					content?: string;
					template?: string;
					status?: string;
					author_id: string;
					created_at?: string;
					updated_at?: string;
					published_at?: string | null;
				};
				Update: Partial<Database["public"]["Tables"]["pages"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "pages_author_id_fkey";
						columns: ["author_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			personnel_categories: {
				Row: {
					id: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					code: string;
					label_th: string;
					label_en: string;
					sort_order?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["personnel_categories"]["Row"]>;
				Relationships: [];
			};
			positions: {
				Row: {
					id: string;
					code: string;
					name: string;
					name_en: string | null;
					role_level: number;
					can_command_staff: boolean;
					deputy_category: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					code: string;
					name: string;
					name_en?: string | null;
					role_level: number;
					can_command_staff?: boolean;
					deputy_category?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["positions"]["Row"]>;
				Relationships: [];
			};
			program_chairs: {
				Row: {
					id: string;
					program_id: string;
					employee_id: string;
					starts_at: string;
					ends_at: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					program_id: string;
					employee_id: string;
					starts_at: string;
					ends_at?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["program_chairs"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "program_chairs_employee_id_fkey";
						columns: ["employee_id"];
						isOneToOne: false;
						referencedRelation: "employees";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "program_chairs_program_id_fkey";
						columns: ["program_id"];
						isOneToOne: false;
						referencedRelation: "programs";
						referencedColumns: ["id"];
					},
				];
			};
			programs: {
				Row: {
					id: string;
					code: string;
					name: string;
					is_active: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					code: string;
					name: string;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["programs"]["Row"]>;
				Relationships: [];
			};
			asset_annual_inspections: GenericSupabaseTable;
			asset_assignments: GenericSupabaseTable;
			asset_categories: GenericSupabaseTable;
			asset_conditions: GenericSupabaseTable;
			asset_disposal_lines: GenericSupabaseTable;
			asset_disposal_requests: GenericSupabaseTable;
			asset_inspection_lines: GenericSupabaseTable;
			asset_maintenance: GenericSupabaseTable;
			asset_registers: GenericSupabaseTable;
			asset_statuses: GenericSupabaseTable;
			asset_transfers: GenericSupabaseTable;
			faculty_request_events: GenericSupabaseTable;
			faculty_request_steps: GenericSupabaseTable;
			faculty_requests: GenericSupabaseTable;
			material_items: GenericSupabaseTable;
			material_receipts: GenericSupabaseTable;
			material_requisition_lines: GenericSupabaseTable;
			material_requisitions: GenericSupabaseTable;
			material_stock_balances: GenericSupabaseTable;
			material_stock_movements: GenericSupabaseTable;
			reservable_asset_settings: GenericSupabaseTable;
			reservable_rooms: GenericSupabaseTable;
			room_booking_equipment_lines: GenericSupabaseTable;
			room_booking_requests: GenericSupabaseTable;
			room_default_assets: GenericSupabaseTable;
			room_schedule_blocks: GenericSupabaseTable;
			stock_locations: GenericSupabaseTable;
			supply_approval_steps: GenericSupabaseTable;
			supply_audit_events: GenericSupabaseTable;
			supply_categories: GenericSupabaseTable;
			supply_documents: GenericSupabaseTable;
			supply_units: GenericSupabaseTable;
			sessions: {
				Row: {
					id: string;
					user_id: string;
					expires_at: number;
					user_agent: string | null;
					ip_address: string | null;
					created_at: string | null;
				};
				Insert: {
					id: string;
					user_id: string;
					expires_at: number;
					user_agent?: string | null;
					ip_address?: string | null;
					created_at?: string | null;
				};
				Update: Partial<Database["public"]["Tables"]["sessions"]["Row"]>;
				Relationships: [
					{
						foreignKeyName: "sessions_user_id_fkey";
						columns: ["user_id"];
						isOneToOne: false;
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			users: {
				Row: {
					id: string;
					email: string;
					username: string;
					password_hash: string | null;
					name: string;
					avatar_url: string | null;
					role: string;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id: string;
					email: string;
					username: string;
					password_hash?: string | null;
					name: string;
					avatar_url?: string | null;
					role?: string;
					created_at?: string;
					updated_at?: string;
				};
				Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
				Relationships: [];
			};
		};
		Views: {
			room_reservable_asset_catalog: GenericSupabaseTable;
		};
		Functions: {
			cancel_faculty_request: {
				Args: {
					p_request_id: string;
					p_actor_user_id: string;
					p_actor_employee_id: string;
					p_cancel_reason?: string | null;
				};
				Returns: undefined;
			};
			decide_room_booking_request: {
				Args: {
					p_request_id: string;
					p_approver_employee_id: string;
					p_actor_user_id: string;
					p_decision: string;
					p_remark?: string | null;
				};
				Returns: undefined;
			};
			has_requests_manage: { Args: Record<PropertyKey, never>; Returns: boolean };
			has_employees_manage: { Args: Record<PropertyKey, never>; Returns: boolean };
			room_booking_windows_overlap: {
				Args: {
					existing_start: string;
					existing_end: string;
					existing_setup_minutes: number;
					existing_cleanup_minutes: number;
					candidate_start: string;
					candidate_end: string;
					candidate_setup_minutes: number;
					candidate_cleanup_minutes: number;
				};
				Returns: boolean;
			};
			submit_room_booking_request: {
				Args: {
					p_request_no: string;
					p_requester_employee_id: string;
					p_created_by_user_id: string;
					p_title: string;
					p_details?: string | null;
					p_room_id: string;
					p_requested_start_at: string;
					p_requested_end_at: string;
					p_setup_buffer_minutes: number;
					p_cleanup_buffer_minutes: number;
					p_attendee_count: number;
					p_purpose: string;
					p_contact_name?: string | null;
					p_contact_email?: string | null;
					p_contact_phone?: string | null;
					p_equipment_asset_ids?: string[] | null;
				};
				Returns: string;
			};
		};
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
