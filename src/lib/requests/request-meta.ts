import type { FacultyRequestKind } from "./request-schema.js";
import { REQUEST_KIND_LABELS } from "$lib/content/labels.js";
import type { Locale } from "$lib/i18n/locales.js";

export function getRequestKindMeta(locale: Locale): Record<
	FacultyRequestKind,
	{ label: string; description: string }
> {
	if (locale === "th") {
		return {
			leave: {
				label: "คำขอลา",
				description: "ส่งช่วงวันลาและรายละเอียดการมอบหมายงานสำหรับขั้นตอน HR",
			},
			room_booking: {
				label: "จองห้อง",
				description: "จองห้องประชุม ห้องเรียน หรือพื้นที่ใช้งานร่วมของคณะ",
			},
			equipment_borrow: {
				label: "ยืมอุปกรณ์",
				description: "ส่งและติดตามคำขอยืมอุปกรณ์ของคณะหรืออุปกรณ์ส่วนกลาง",
			},
			academic_service: {
				label: "บริการวิชาการ",
				description: "สร้างคำขอบริการวิชาการอย่างเป็นทางการสำหรับอาจารย์ที่ปรึกษาหรือหลักสูตร",
			},
		};
	}

	return {
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
}

export const requestCenterKinds: FacultyRequestKind[] = [
	"leave",
	"room_booking",
	"equipment_borrow",
	"academic_service",
];
