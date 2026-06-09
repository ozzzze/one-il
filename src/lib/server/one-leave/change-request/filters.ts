import { parseScrFilter } from "$lib/server/one-leave/change-request/schemas.js";
import type { ChangeRequestListFilter } from "$lib/server/one-leave/change-request/types.js";

export function parseChangeRequestFilter(params: URLSearchParams): ChangeRequestListFilter {
	return parseScrFilter(params);
}
