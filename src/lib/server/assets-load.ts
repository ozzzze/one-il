/** Shared PostgREST selects + mapping for asset register list/detail pages. */

export const assetListSelect = `
	id, asset_no, name, name_en, acquired_at, acquisition_cost, brand, model, serial_no,
	category:asset_categories(id, code, label_th, label_en),
	status:asset_statuses(id, code, label_th, label_en),
	condition:asset_conditions(id, code, label_th, label_en),
	responsible:employees(id, employee_no, first_name, last_name),
	org_units(id, code, name, name_en),
	stock_locations(id, code, name, name_en)
`;

export const assetDetailSelect = `
	id, asset_no, name, name_en, acquired_at, acquisition_cost, budget_source, brand, model, serial_no, document_ref, note,
	category:asset_categories(id, code, label_th, label_en),
	status:asset_statuses(id, code, label_th, label_en),
	condition:asset_conditions(id, code, label_th, label_en),
	responsible:employees(id, employee_no, first_name, last_name),
	org_units(id, code, name, name_en),
	stock_locations(id, code, name, name_en)
`;

export const assetAssignmentSelect = `
	id, starts_at, ends_at, note,
	responsible:employees(id, employee_no, first_name, last_name),
	org_units(id, code, name, name_en),
	stock_locations(id, code, name, name_en)
`;

export const assetMaintenanceSelect = `
	id, maintenance_no, status, issue, action_taken, cost, vendor, reported_at, completed_at,
	reporter:employees!reported_by_employee_id(id, employee_no, first_name, last_name)
`;

export type LookupView = {
	id?: string;
	code?: string | null;
	label_th: string;
	label_en?: string | null;
};

export type NamedView = {
	id?: string;
	code?: string | null;
	name: string;
	name_en?: string | null;
};

export type EmployeeView = {
	id?: string;
	employee_no?: string | null;
	first_name?: string | null;
	last_name?: string | null;
};

type Relation<T> = T | T[] | null;

export type AssetRegisterRow = {
	id: string;
	asset_no: string;
	name: string;
	name_en?: string | null;
	acquired_at?: string | null;
	acquisition_cost?: number | null;
	budget_source?: string | null;
	brand?: string | null;
	model?: string | null;
	serial_no?: string | null;
	document_ref?: string | null;
	note?: string | null;
	category: Relation<LookupView>;
	status: Relation<LookupView>;
	condition: Relation<LookupView>;
	responsible: Relation<EmployeeView>;
	org_units: Relation<NamedView>;
	stock_locations: Relation<NamedView>;
};

export type AssetListView = {
	id: string;
	assetNo: string;
	name: string;
	nameEn: string | null;
	acquiredAt: string | null;
	acquisitionCost: number | null;
	brand: string | null;
	model: string | null;
	serialNo: string | null;
	category: LookupView;
	status: LookupView;
	condition: LookupView | null;
	responsible: EmployeeView | null;
	orgUnit: NamedView | null;
	location: NamedView | null;
};

export type AssetDetailView = AssetListView & {
	budgetSource: string | null;
	documentRef: string | null;
	note: string | null;
};

export type AssetAssignmentView = {
	id: string;
	startsAt: string;
	endsAt: string | null;
	note: string | null;
	responsible: EmployeeView | null;
	orgUnit: NamedView | null;
	location: NamedView | null;
};

export type AssetMaintenanceView = {
	id: string;
	maintenanceNo: string;
	status: string;
	issue: string;
	actionTaken: string | null;
	cost: number | null;
	vendor: string | null;
	reportedAt: string | null;
	completedAt: string | null;
	reporter: EmployeeView | null;
};

export type AssetAssignmentRow = {
	id: string;
	starts_at: string;
	ends_at?: string | null;
	note?: string | null;
	responsible: Relation<EmployeeView>;
	org_units: Relation<NamedView>;
	stock_locations: Relation<NamedView>;
};

export type AssetMaintenanceRow = {
	id: string;
	maintenance_no: string;
	status: string;
	issue: string;
	action_taken?: string | null;
	cost?: number | null;
	vendor?: string | null;
	reported_at?: string | null;
	completed_at?: string | null;
	reporter: Relation<EmployeeView>;
};

export function embedOne<T>(value: Relation<T> | undefined): T | null {
	if (value == null) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

function requiredRelation<T>(value: Relation<T> | undefined, fallback: T): T {
	return embedOne(value) ?? fallback;
}

export function mapAssetRowToListView(row: AssetRegisterRow): AssetListView {
	return {
		id: row.id,
		assetNo: row.asset_no,
		name: row.name,
		nameEn: row.name_en ?? null,
		acquiredAt: row.acquired_at ?? null,
		acquisitionCost: row.acquisition_cost ?? null,
		brand: row.brand ?? null,
		model: row.model ?? null,
		serialNo: row.serial_no ?? null,
		category: requiredRelation(row.category, { label_th: "—", label_en: "—" }),
		status: requiredRelation(row.status, { label_th: "—", label_en: "—" }),
		condition: embedOne(row.condition),
		responsible: embedOne(row.responsible),
		orgUnit: embedOne(row.org_units),
		location: embedOne(row.stock_locations),
	};
}

export function mapAssetRowToDetailView(row: AssetRegisterRow): AssetDetailView {
	return {
		...mapAssetRowToListView(row),
		budgetSource: row.budget_source ?? null,
		documentRef: row.document_ref ?? null,
		note: row.note ?? null,
	};
}

export function mapAssetAssignmentRow(row: AssetAssignmentRow): AssetAssignmentView {
	return {
		id: row.id,
		startsAt: row.starts_at,
		endsAt: row.ends_at ?? null,
		note: row.note ?? null,
		responsible: embedOne(row.responsible),
		orgUnit: embedOne(row.org_units),
		location: embedOne(row.stock_locations),
	};
}

export function mapAssetMaintenanceRow(row: AssetMaintenanceRow): AssetMaintenanceView {
	return {
		id: row.id,
		maintenanceNo: row.maintenance_no,
		status: row.status,
		issue: row.issue,
		actionTaken: row.action_taken ?? null,
		cost: row.cost ?? null,
		vendor: row.vendor ?? null,
		reportedAt: row.reported_at ?? null,
		completedAt: row.completed_at ?? null,
		reporter: embedOne(row.reporter),
	};
}
