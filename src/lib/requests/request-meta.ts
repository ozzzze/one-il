import type { FacultyRequestKind } from "./request-schema.js";
import { REQUEST_KIND_LABELS } from "$lib/content/labels.js";

export const requestKindMeta: Record<
	FacultyRequestKind,
	{ label: string; description: string }
> = {
	leave: {
		label: REQUEST_KIND_LABELS.leave,
		description: "Submit leave dates and coverage notes for HR workflows.",
	},
	room_booking: {
		label: REQUEST_KIND_LABELS.roomBooking,
		description: "Reserve meeting rooms, classrooms, or shared faculty spaces.",
	},
	equipment_borrow: {
		label: REQUEST_KIND_LABELS.equipmentBorrowing,
		description: "Submit and track equipment borrowing requests for faculty-owned or pooled gear.",
	},
	academic_service: {
		label: REQUEST_KIND_LABELS.academicService,
		description: "Raise formal academic service requests for advisors or programs.",
	},
};

export const requestCenterKinds: FacultyRequestKind[] = [
	"leave",
	"room_booking",
	"equipment_borrow",
	"academic_service",
];
