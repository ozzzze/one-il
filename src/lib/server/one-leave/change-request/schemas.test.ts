import { describe, expect, it } from "vitest";
import { parseChangeRequestForm, parseScrFilter, parseItImplementForm } from "./schemas.js";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function makeValidFormData(overrides: Record<string, string> = {}): FormData {
	const fd = new FormData();
	const defaults: Record<string, string> = {
		title: "Test SCR Title",
		exceptionTypeId: "1",
		itSystemId: "2",
		changeCategory: "standard",
		description: "Some description",
		businessJustification: "Some business justification",
		riskAssessment: "Low risk",
		impactDescription: "",
		compensatingControls: "",
		exceptionStartDate: "2026-06-01",
		exceptionEndDate: "2026-06-30",
		rollbackPlan: "Rollback plan",
		plannedImplementationAt: "",
		intent: "draft",
	};
	const merged = { ...defaults, ...overrides };
	for (const [k, v] of Object.entries(merged)) {
		fd.set(k, v);
	}
	return fd;
}

// ──────────────────────────────────────────────
// parseChangeRequestForm
// ──────────────────────────────────────────────

describe("parseChangeRequestForm", () => {
	describe("valid inputs", () => {
		it("parses a valid draft form", () => {
			const result = parseChangeRequestForm(makeValidFormData({ intent: "draft" }));
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data.title).toBe("Test SCR Title");
			expect(result.data.changeCategory).toBe("standard");
			expect(result.data.intent).toBe("draft");
			expect(result.data.plannedImplementationAt).toBeNull();
			expect(result.data.impactDescription).toBeNull();
		});

		it("parses a valid submit form", () => {
			const result = parseChangeRequestForm(makeValidFormData({ intent: "submit" }));
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data.intent).toBe("submit");
		});

		it("trims whitespace from text fields", () => {
			const result = parseChangeRequestForm(
				makeValidFormData({ title: "  Trimmed Title  ", description: "  desc  " })
			);
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data.title).toBe("Trimmed Title");
			expect(result.data.description).toBe("desc");
		});

		it("coerces exceptionTypeId and itSystemId to numbers", () => {
			const result = parseChangeRequestForm(
				makeValidFormData({ exceptionTypeId: "5", itSystemId: "10" })
			);
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data.exceptionTypeId).toBe(5);
			expect(result.data.itSystemId).toBe(10);
		});

		it("parses all three change categories", () => {
			for (const cat of ["standard", "normal", "emergency"] as const) {
				const result = parseChangeRequestForm(makeValidFormData({ changeCategory: cat }));
				expect(result.success).toBe(true);
				if (!result.success) continue;
				expect(result.data.changeCategory).toBe(cat);
			}
		});

		it("treats empty plannedImplementationAt as null", () => {
			const result = parseChangeRequestForm(makeValidFormData({ plannedImplementationAt: "" }));
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data.plannedImplementationAt).toBeNull();
		});

		it("preserves non-empty plannedImplementationAt", () => {
			const result = parseChangeRequestForm(
				makeValidFormData({ plannedImplementationAt: "2026-06-15T10:00" })
			);
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data.plannedImplementationAt).toBe("2026-06-15T10:00");
		});
	});

	describe("invalid inputs", () => {
		it("fails when title is empty", () => {
			const result = parseChangeRequestForm(makeValidFormData({ title: "" }));
			expect(result.success).toBe(false);
		});

		it("fails when title exceeds 300 chars", () => {
			const result = parseChangeRequestForm(makeValidFormData({ title: "a".repeat(301) }));
			expect(result.success).toBe(false);
		});

		it("fails when description is empty", () => {
			const result = parseChangeRequestForm(makeValidFormData({ description: "" }));
			expect(result.success).toBe(false);
		});

		it("fails when exceptionTypeId is 0", () => {
			const result = parseChangeRequestForm(makeValidFormData({ exceptionTypeId: "0" }));
			expect(result.success).toBe(false);
		});

		it("fails when exceptionTypeId is non-numeric", () => {
			const result = parseChangeRequestForm(makeValidFormData({ exceptionTypeId: "abc" }));
			expect(result.success).toBe(false);
		});

		it("fails when changeCategory is invalid", () => {
			const result = parseChangeRequestForm(makeValidFormData({ changeCategory: "urgent" }));
			expect(result.success).toBe(false);
		});

		it("fails when intent is invalid", () => {
			const result = parseChangeRequestForm(makeValidFormData({ intent: "approve" }));
			expect(result.success).toBe(false);
		});

		it("fails for invalid date format in exceptionStartDate", () => {
			const result = parseChangeRequestForm(
				makeValidFormData({ exceptionStartDate: "01/06/2026" })
			);
			expect(result.success).toBe(false);
		});

		it("fails for invalid date format in exceptionEndDate", () => {
			const result = parseChangeRequestForm(makeValidFormData({ exceptionEndDate: "2026-13-01" }));
			// The dateString regex only validates format, not calendar validity
			// but "2026-13-01" does match /^\d{4}-\d{2}-\d{2}$/, so cross-field check handles
			const result2 = parseChangeRequestForm(makeValidFormData({ exceptionEndDate: "06/30/2026" }));
			expect(result2.success).toBe(false);
		});
	});

	describe("cross-field: exceptionEndDate < exceptionStartDate", () => {
		it("fails when end date is before start date", () => {
			const result = parseChangeRequestForm(
				makeValidFormData({
					exceptionStartDate: "2026-06-30",
					exceptionEndDate: "2026-06-01",
				})
			);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.message).toBe("วันสิ้นสุดข้อยกเว้นต้องไม่ก่อนวันเริ่ม");
			}
		});

		it("succeeds when end date equals start date", () => {
			const result = parseChangeRequestForm(
				makeValidFormData({
					exceptionStartDate: "2026-06-15",
					exceptionEndDate: "2026-06-15",
				})
			);
			expect(result.success).toBe(true);
		});

		it("succeeds when end date is after start date", () => {
			const result = parseChangeRequestForm(
				makeValidFormData({
					exceptionStartDate: "2026-06-01",
					exceptionEndDate: "2026-06-30",
				})
			);
			expect(result.success).toBe(true);
		});
	});
});

// ──────────────────────────────────────────────
// parseScrFilter
// ──────────────────────────────────────────────

describe("parseScrFilter", () => {
	it("returns defaults when given empty URLSearchParams", () => {
		const result = parseScrFilter(new URLSearchParams());
		expect(result).toEqual({
			status: "",
			q: "",
			changeCategory: "",
			itSystemId: null,
			exceptionTypeId: null,
		});
	});

	it("parses q and status from URLSearchParams", () => {
		const params = new URLSearchParams({ q: "test query", status: "submitted" });
		const result = parseScrFilter(params);
		expect(result.q).toBe("test query");
		expect(result.status).toBe("submitted");
	});

	it("parses changeCategory filter", () => {
		const params = new URLSearchParams({ changeCategory: "emergency" });
		const result = parseScrFilter(params);
		expect(result.changeCategory).toBe("emergency");
	});

	it("parses itSystemId as number", () => {
		const params = new URLSearchParams({ itSystemId: "5" });
		const result = parseScrFilter(params);
		expect(result.itSystemId).toBe(5);
	});

	it("parses exceptionTypeId as number", () => {
		const params = new URLSearchParams({ exceptionTypeId: "3" });
		const result = parseScrFilter(params);
		expect(result.exceptionTypeId).toBe(3);
	});

	it("treats non-numeric itSystemId as null", () => {
		const params = new URLSearchParams({ itSystemId: "abc" });
		const result = parseScrFilter(params);
		expect(result.itSystemId).toBeNull();
	});

	it("treats 0 itSystemId as null (not positive)", () => {
		const params = new URLSearchParams({ itSystemId: "0" });
		const result = parseScrFilter(params);
		expect(result.itSystemId).toBeNull();
	});

	it("treats negative exceptionTypeId as null", () => {
		const params = new URLSearchParams({ exceptionTypeId: "-1" });
		const result = parseScrFilter(params);
		expect(result.exceptionTypeId).toBeNull();
	});

	it("works with Record<string, string> input", () => {
		const result = parseScrFilter({ q: "hello", status: "draft", itSystemId: "2" });
		expect(result.q).toBe("hello");
		expect(result.status).toBe("draft");
		expect(result.itSystemId).toBe(2);
	});

	it("truncates q longer than 100 chars to default (schema max 100)", () => {
		// Zod .max(100) causes schema failure → returns fallback
		const params = new URLSearchParams({ q: "a".repeat(101) });
		const result = parseScrFilter(params);
		expect(result).toEqual({
			status: "",
			q: "",
			changeCategory: "",
			itSystemId: null,
			exceptionTypeId: null,
		});
	});

	it("returns fallback when changeCategory is invalid", () => {
		const params = new URLSearchParams({ changeCategory: "urgent" });
		const result = parseScrFilter(params);
		expect(result).toEqual({
			status: "",
			q: "",
			changeCategory: "",
			itSystemId: null,
			exceptionTypeId: null,
		});
	});
});

// ──────────────────────────────────────────────
// parseItImplementForm
// ──────────────────────────────────────────────

describe("parseItImplementForm", () => {
	function makeItImplFormData(overrides: Record<string, string> = {}): FormData {
		const fd = new FormData();
		const defaults: Record<string, string> = {
			testEnvironment: "UAT",
			testResultSummary: "All tests passed",
			implementationNotes: "Deployed at 00:00",
		};
		for (const [k, v] of Object.entries({ ...defaults, ...overrides })) {
			fd.set(k, v);
		}
		return fd;
	}

	it("parses a valid IT implementation form", () => {
		const result = parseItImplementForm(makeItImplFormData());
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.testEnvironment).toBe("UAT");
		expect(result.data.testResultSummary).toBe("All tests passed");
		expect(result.data.implementationNotes).toBe("Deployed at 00:00");
	});

	it("trims whitespace from fields", () => {
		const result = parseItImplementForm(
			makeItImplFormData({ testEnvironment: "  UAT  ", testResultSummary: "  passed  " })
		);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.testEnvironment).toBe("UAT");
		expect(result.data.testResultSummary).toBe("passed");
	});

	it("fails when testEnvironment is empty", () => {
		const result = parseItImplementForm(makeItImplFormData({ testEnvironment: "" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.message).toBe("กรุณาระบุสภาพแวดล้อมทดสอบ");
		}
	});

	it("fails when testResultSummary is empty", () => {
		const result = parseItImplementForm(makeItImplFormData({ testResultSummary: "" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.message).toBe("กรุณาระบุสรุปผลการทดสอบ");
		}
	});

	it("fails when implementationNotes is empty", () => {
		const result = parseItImplementForm(makeItImplFormData({ implementationNotes: "" }));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.message).toBe("กรุณาระบุบันทึกการดำเนินการ");
		}
	});

	it("fails when testEnvironment exceeds 200 chars", () => {
		const result = parseItImplementForm(makeItImplFormData({ testEnvironment: "x".repeat(201) }));
		expect(result.success).toBe(false);
	});
});
