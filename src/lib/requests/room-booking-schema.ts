import { z } from "zod";
import { roomTypes } from "$lib/requests/faculty-request.js";

export const roomBookingSubmissionSchema = z
	.object({
		title: z.string().trim().min(3).max(200),
		details: z.string().trim().max(4000).optional().or(z.literal("")),
		roomId: z.string().uuid(),
		bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		startTime: z.string().regex(/^\d{2}:\d{2}$/),
		endTime: z.string().regex(/^\d{2}:\d{2}$/),
		attendeeCount: z.coerce.number().int().positive().max(2000),
		purpose: z.string().trim().min(3).max(1000),
		contactName: z.string().trim().max(200).optional().or(z.literal("")),
		contactEmail: z.email().max(320).optional().or(z.literal("")),
		contactPhone: z.string().trim().max(50).optional().or(z.literal("")),
		equipmentAssetIds: z.array(z.string().uuid()).default([]),
		setupBufferMinutes: z.coerce.number().int().min(0).max(240),
		cleanupBufferMinutes: z.coerce.number().int().min(0).max(240),
	})
	.refine((value) => value.endTime > value.startTime, {
		message: "End time must be after start time",
		path: ["endTime"],
	});

export type RoomBookingSubmission = z.infer<typeof roomBookingSubmissionSchema>;

export const cancelFacultyRequestSchema = z.object({
	requestId: z.string().uuid(),
	cancelReason: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const roomDecisionSchema = z.object({
	requestId: z.string().uuid(),
	decision: z.enum(["approved", "rejected"]),
	remark: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const roomManagementSchema = z.object({
	roomId: z.string().uuid().optional().or(z.literal("")),
	stockLocationId: z.string().uuid(),
	roomCode: z.string().trim().min(1).max(50),
	name: z.string().trim().min(1).max(200),
	nameEn: z.string().trim().max(200).optional().or(z.literal("")),
	roomType: z.enum(roomTypes),
	capacity: z.coerce.number().int().positive().max(5000),
	approverEmployeeId: z.string().uuid(),
	bookingWindowDays: z.coerce.number().int().positive().max(3650),
	minAdvanceHours: z.coerce.number().int().min(0).max(720),
	setupBufferMinutes: z.coerce.number().int().min(0).max(240),
	cleanupBufferMinutes: z.coerce.number().int().min(0).max(240),
	cancellationCutoffHours: z.coerce.number().int().min(0).max(720),
	allowEquipmentRequest: z.coerce.boolean().default(false),
	note: z.string().trim().max(1000).optional().or(z.literal("")),
	isActive: z.coerce.boolean().default(false),
});

export const roomScheduleBlockSchema = z
	.object({
		roomId: z.string().uuid(),
		blockType: z.enum(["maintenance", "event", "exam", "closed"]),
		startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		startTime: z.string().regex(/^\d{2}:\d{2}$/),
		endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
		endTime: z.string().regex(/^\d{2}:\d{2}$/),
		reason: z.string().trim().min(3).max(1000),
	})
	.refine((value) => `${value.endDate}T${value.endTime}` > `${value.startDate}T${value.startTime}`, {
		message: "End date/time must be after start date/time",
		path: ["endTime"],
	});

export const roomDefaultAssetSchema = z.object({
	roomId: z.string().uuid(),
	assetId: z.string().uuid(),
});

export const roomDefaultAssetDeleteSchema = z.object({
	id: z.string().uuid(),
});

export const reservableAssetSchema = z.object({
	assetId: z.string().uuid(),
	isPortable: z.coerce.boolean().default(false),
});

export const reservableAssetDeleteSchema = z.object({
	assetId: z.string().uuid(),
});
