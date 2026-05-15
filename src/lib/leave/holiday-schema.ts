import { z } from "zod";

export const institutionalHolidayFormSchema = z.object({
	id: z.string().uuid().optional(),
	holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	nameTh: z.string().trim().min(1).max(255),
	nameEn: z.string().trim().max(255).optional().or(z.literal("")),
	notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type InstitutionalHolidayForm = z.infer<typeof institutionalHolidayFormSchema>;
