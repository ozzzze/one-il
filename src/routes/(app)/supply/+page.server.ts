import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import { assertPermission } from "$lib/server/guards.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals }) => {
	assertPermission(locals.user, "supply:view");
	const admin = getServiceRoleClient();

	const [lowStockRes, pendingRequisitionsRes, assetsByStatusRes, recentMovementsRes] = await Promise.all([
		admin
			.from("material_stock_balances")
			.select("quantity_on_hand, material_items(id,code,name,name_en,reorder_level), stock_locations(id,name,name_en)")
			.order("updated_at", { ascending: false })
			.limit(8),
		admin
			.from("material_requisitions")
			.select("id,requisition_no,purpose,status,requested_at, requester:employees(first_name,last_name)")
			.in("status", ["submitted", "approved", "partially_issued"])
			.order("requested_at", { ascending: false })
			.limit(8),
		admin.from("asset_registers").select("id, status:asset_statuses(code,label_th,label_en)", { count: "exact" }),
		admin
			.from("material_stock_movements")
			.select("id,movement_type,quantity,created_at, material_items(code,name,name_en), stock_locations(name,name_en)")
			.order("created_at", { ascending: false })
			.limit(8),
	]);

	return {
		locale: locals.locale,
		lowStock: (lowStockRes.data ?? []).filter((row) => {
			const typed = row as {
				quantity_on_hand?: number;
				material_items?: { reorder_level?: number } | null;
			};
			return Number(typed.quantity_on_hand ?? 0) <= Number(typed.material_items?.reorder_level ?? 0);
		}),
		pendingRequisitions: pendingRequisitionsRes.data ?? [],
		assetsByStatus: assetsByStatusRes.data ?? [],
		recentMovements: recentMovementsRes.data ?? [],
		errors: {
			lowStock: lowStockRes.error?.message ?? null,
			pendingRequisitions: pendingRequisitionsRes.error?.message ?? null,
			assetsByStatus: assetsByStatusRes.error?.message ?? null,
			recentMovements: recentMovementsRes.error?.message ?? null,
		},
	};
};
