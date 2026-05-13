import { hasPermission } from "$lib/auth/roles.js";
import { assertPermission } from "$lib/server/guards.js";
import {
	getCalendarRange,
	loadRoomCalendarData,
	loadUserRequestList,
} from "$lib/server/faculty-requests.js";
import { getServiceRoleClient } from "$lib/server/supabase-admin.js";
import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ locals, url }) => {
	assertPermission(locals.user, "requests:create");
	const admin = getServiceRoleClient();
	const view = url.searchParams.get("view") === "week" ? "week" : "day";
	const roomType = url.searchParams.get("roomType");
	const selectedDate = url.searchParams.get("date");
	const range = getCalendarRange(selectedDate, view);
	const [calendar, ownRequests] = await Promise.all([
		loadRoomCalendarData(admin, {
			selectedDate: range.selectedDate,
			view,
			roomType,
		}),
		loadUserRequestList(admin, locals.user.id),
	]);

	return {
		locale: locals.locale,
		canManage: hasPermission(locals.user.role, "requests:manage"),
		view,
		selectedDate: range.selectedDate,
		roomType,
		rangeStart: range.rangeStart,
		rangeEnd: range.rangeEnd,
		rooms: calendar.rooms,
		bookings: calendar.bookings,
		blocks: calendar.blocks,
		recentRequests: ownRequests.slice(0, 5),
	};
};

