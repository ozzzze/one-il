/**
 * @deprecated Static menu definitions moved to Postgres (`menu_groups`, `menu_items`).
 * Re-exports helpers used by tests and shared types.
 */
export type { IconKey } from "./types.js";
export {
	getAccessibleMenuItemIds,
	type RawMenuItemRow,
	type RawMenuGroupRow,
} from "./catalog.js";
