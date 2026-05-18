import type { Locale } from "$lib/i18n/locales.js";
import { facultyTimeZoneOffset } from "$lib/requests/faculty-request.js";

export type RoomBookingEmailContext = {
	requestNo: string;
	title: string;
	roomName: string;
	roomCode: string;
	requesterName: string;
	startAt: string;
	endAt: string;
	purpose: string;
	attendeeCount: number;
	requestUrl: string;
};

function formatFacultyDateTime(iso: string, locale: Locale): string {
	const date = new Date(iso);
	return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Bangkok",
	}).format(date);
}

export function buildRoomBookingSubmittedEmail(
	locale: Locale,
	ctx: RoomBookingEmailContext,
): { subject: string; body: string } {
	const startLabel = formatFacultyDateTime(ctx.startAt, locale);
	const endLabel = formatFacultyDateTime(ctx.endAt, locale);

	if (locale === "th") {
		return {
			subject: `[ONE-IL] คำขอจองห้องใหม่ ${ctx.requestNo}`,
			body: [
				"มีคำขอจองห้องใหม่รอการอนุมัติ",
				"",
				`เลขที่คำขอ: ${ctx.requestNo}`,
				`หัวข้อ: ${ctx.title}`,
				`ห้อง: ${ctx.roomName} (${ctx.roomCode})`,
				`ผู้ขอ: ${ctx.requesterName}`,
				`วันเวลา: ${startLabel} – ${endLabel} (${facultyTimeZoneOffset})`,
				`วัตถุประสงค์: ${ctx.purpose}`,
				`จำนวนผู้เข้าร่วม: ${ctx.attendeeCount}`,
				"",
				`เปิดคำขอในระบบ: ${ctx.requestUrl}`,
				"",
				"—",
				"อีเมลนี้ส่งจากระบบ ONE-IL (ชั่วคราวผ่าน Gmail จนกว่าจะมีบัญชีอีเมลกลางของคณะ)",
			].join("\n"),
		};
	}

	return {
		subject: `[ONE-IL] New room booking request ${ctx.requestNo}`,
		body: [
			"A new room booking request is waiting for your approval.",
			"",
			`Request no.: ${ctx.requestNo}`,
			`Title: ${ctx.title}`,
			`Room: ${ctx.roomName} (${ctx.roomCode})`,
			`Requester: ${ctx.requesterName}`,
			`When: ${startLabel} – ${endLabel} (${facultyTimeZoneOffset})`,
			`Purpose: ${ctx.purpose}`,
			`Attendees: ${ctx.attendeeCount}`,
			"",
			`Open in ONE-IL: ${ctx.requestUrl}`,
			"",
			"—",
			"Sent by ONE-IL (interim Gmail until faculty central mail is available).",
		].join("\n"),
	};
}
