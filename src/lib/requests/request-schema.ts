import { z } from "zod";

export const requestKindSchema = z.enum([
	"leave",
	"room_booking",
	"equipment_borrow",
	"academic_service",
]);

export type FacultyRequestKind = z.infer<typeof requestKindSchema>;

export const newFacultyRequestFormSchema = z.object({
	kind: requestKindSchema,
	title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
	details: z.string().trim().max(4000).optional(),
});

export type NewFacultyRequestForm = z.infer<typeof newFacultyRequestFormSchema>;
