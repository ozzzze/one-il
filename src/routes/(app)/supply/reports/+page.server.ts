import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "supply:view");
	const admin = getServiceRoleClient();

	const [balancesRes, assetsRes, inspectionsRes, auditRes] = await Promise.all([
		admin
			.from("material_stock_balances")
			.select("quantity_on_hand,updated_at, material_items(code,name,name_en,reorder_level), stock_locations(code,name,name_en)")
			.order("updated_at", { ascending: false }),
		admin
			.from("asset_registers")
			.select("asset_no,name,name_en,acquired_at,acquisition_cost,brand,model,serial_no, category:asset_categories(code,label_th,label_en), status:asset_statuses(code,label_th,label_en), responsible:employees(employee_no,first_name,last_name), org_units(code,name,name_en), stock_locations(code,name,name_en)")
			.order("asset_no", { ascending: true }),
		admin
			.from("asset_inspection_lines")
			.select("found_status,recommendation,remark,inspected_at, asset_registers(asset_no,name,name_en), condition:asset_conditions(code,label_th,label_en), inspection:asset_annual_inspections(fiscal_year,inspection_no,status)")
			.order("updated_at", { ascending: false })
			.limit(500),
		admin
			.from("supply_audit_events")
			.select("entity_type,event_type,summary,created_at, actor:employees(employee_no,first_name,last_name)")
			.order("created_at", { ascending: false })
			.limit(500),
	]);

	return {
		locale: locals.locale,
		balances: balancesRes.data ?? [],
		assets: assetsRes.data ?? [],
		inspections: inspectionsRes.data ?? [],
		auditEvents: auditRes.data ?? [],
		errors: {
			balances: balancesRes.error?.message ?? null,
			assets: assetsRes.error?.message ?? null,
			inspections: inspectionsRes.error?.message ?? null,
			auditEvents: auditRes.error?.message ?? null,
		},
	};
};
