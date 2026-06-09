import type { ScrStatus } from "$lib/change-request/types.js";

export type ApprovalStepperState = "completed" | "current" | "pending";

export interface ApprovalStepperItem {
	order: number;
	label: string;
	state: ApprovalStepperState;
	dateLabel?: string;
	timeLabel?: string;
}

export interface ApprovalStepperHistoryEntry {
	toStatus: string;
	actedAt: string;
}

export function formatStepperDateTime(iso: string): { dateLabel: string; timeLabel: string } {
	const d = new Date(iso);
	const buddhistYear = (d.getFullYear() + 543) % 100;
	const dateLabel = `${d.getDate()}/${d.getMonth() + 1}/${buddhistYear}`;
	const timeLabel = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")} น.`;
	return { dateLabel, timeLabel };
}

const SCR_STEP_LABELS = ["ส่งเรื่อง", "หัวหน้าอนุมัติ", "IT ดำเนินการ", "ปิดเรื่อง"] as const;

const STATUS_TO_DONE_COUNT: Record<ScrStatus, number> = {
	draft: 0,
	submitted: 1,
	supervisor_approved: 2,
	implemented: 3,
	closed: 4,
	denied: 1,
	withdrawn: 0,
};

const HISTORY_STATUS_INDEX: Record<string, number> = {
	submitted: 0,
	supervisor_approved: 1,
	implemented: 2,
	closed: 3,
};

function historyTimestamp(
	history: ApprovalStepperHistoryEntry[],
	stepIndex: number
): string | undefined {
	for (const entry of history) {
		const mapped = HISTORY_STATUS_INDEX[entry.toStatus];
		if (mapped === stepIndex) return entry.actedAt;
		if (entry.toStatus === "closed" && stepIndex === 3) return entry.actedAt;
	}
	return undefined;
}

export function buildScrApprovalStepper(options: {
	status: ScrStatus;
	history?: ApprovalStepperHistoryEntry[];
	submittedAt?: string | null;
}): ApprovalStepperItem[] {
	const status = options.status;
	const history = options.history ?? [];
	const labels = [...SCR_STEP_LABELS];
	let doneCount = STATUS_TO_DONE_COUNT[status] ?? 0;
	if (status === "denied") doneCount = 1;

	return labels.map((label, index) => {
		let state: ApprovalStepperState = "pending";
		if (index < doneCount) state = "completed";
		else if (
			index === doneCount &&
			status !== "closed" &&
			status !== "denied" &&
			status !== "withdrawn"
		) {
			state = "current";
		}

		let actedAt = historyTimestamp(history, index);
		if (index === 0 && !actedAt && options.submittedAt) {
			actedAt = options.submittedAt;
		}

		if (!actedAt || state === "pending") {
			return { order: index + 1, label, state };
		}

		const { dateLabel, timeLabel } = formatStepperDateTime(actedAt);
		return { order: index + 1, label, state: "completed", dateLabel, timeLabel };
	});
}
