import type { ChangeRequestExportRow } from "$lib/server/one-leave/change-request/types.js";

function escapeCsvCell(value: string): string {
	if (value.includes('"') || value.includes(",") || value.includes("\n") || value.includes("\r")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

const CSV_HEADERS: (keyof ChangeRequestExportRow)[] = [
	"requestNumber",
	"requesterName",
	"submittedAt",
	"title",
	"exceptionTypeName",
	"descriptionSummary",
	"businessJustificationSummary",
	"riskAssessmentSummary",
	"compensatingControlsSummary",
	"exceptionStartDate",
	"exceptionEndDate",
	"itSystemName",
	"changeCategoryLabel",
	"statusLabel",
	"supervisorName",
	"supervisorApprovedAt",
	"implementedAt",
	"hasTestEvidence",
	"closedAt",
];

const CSV_HEADER_LABELS: Record<keyof ChangeRequestExportRow, string> = {
	requestNumber: "เลขที่คำขอเปลี่ยนแปลงระบบ",
	requesterName: "ชื่อผู้ขอ",
	requesterEmployeeCode: "รหัสพนักงาน",
	submittedAt: "วันที่ขอ",
	title: "หัวข้อข้อยกเว้น",
	exceptionTypeName: "ประเภทข้อยกเว้น",
	descriptionSummary: "รายละเอียด (ย่อ)",
	businessJustificationSummary: "เหตุผลขอยกเว้น (ย่อ)",
	riskAssessmentSummary: "ความเสี่ยง (ย่อ)",
	compensatingControlsSummary: "มาตรการชดเชย (ย่อ)",
	exceptionStartDate: "วันเริ่มข้อยกเว้น",
	exceptionEndDate: "วันสิ้นสุดข้อยกเว้น",
	itSystemName: "ระบบ IT",
	changeCategory: "หมวด (code)",
	changeCategoryLabel: "ประเภทการดำเนินการ CIS",
	status: "สถานะ (code)",
	statusLabel: "สถานะ",
	supervisorName: "ผู้อนุมัติ (หัวหน้า)",
	supervisorApprovedAt: "วันอนุมัติหัวหน้า",
	implementedAt: "วัน IT ดำเนินการ",
	hasTestEvidence: "มีหลักฐานทดสอบ",
	closedAt: "วันปิดเรื่อง",
};

export function exportChangeRequestsCsv(rows: ChangeRequestExportRow[]): string {
	const headerLine = CSV_HEADERS.map((key) => escapeCsvCell(CSV_HEADER_LABELS[key])).join(",");
	const dataLines = rows.map((row) =>
		CSV_HEADERS.map((key) => escapeCsvCell(String(row[key] ?? ""))).join(",")
	);
	return `\uFEFF${[headerLine, ...dataLines].join("\r\n")}`;
}

export function truncateForExport(text: string | null | undefined, max = 200): string {
	if (!text) return "";
	const t = text.trim();
	if (t.length <= max) return t;
	return `${t.slice(0, max)}…`;
}
