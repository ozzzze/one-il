import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AuthUser } from "$lib/server/one-leave/auth/types.js";
import type { ChangeRequestDetail } from "$lib/server/one-leave/change-request/types.js";

vi.mock("$lib/server/one-leave/org/repository.js", () => ({
	getEmployeeById: vi.fn(),
}));

import { getEmployeeById } from "$lib/server/one-leave/org/repository.js";
import {
	canViewAllScr,
	canItReview,
	canAccessScr,
	canEditScr,
	canWithdrawScr,
	canSupervisorApprove,
	canSupervisorDeny,
	canItImplement,
	canItDeny,
	canEmergencyImplement,
	canCloseScr,
	assertCanCreateScr,
	assertSupervisorSeparation,
	assertItSeparation,
} from "./access.js";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
	return {
		id: 1,
		username: "tester",
		roles: ["employee"],
		displayName: "Tester",
		employeeId: 10,
		employeeCode: "EMP010",
		mustChangePassword: false,
		...overrides,
	};
}

function makeRecord(overrides: Partial<ChangeRequestDetail> = {}): ChangeRequestDetail {
	return {
		id: 100,
		requestNumber: "SCR-0001",
		requesterUserId: 1,
		requesterEmployeeId: 10,
		supervisorEmployeeId: 20,
		itSystemId: 1,
		itSystemCode: "SYS01",
		itSystemName: "Test System",
		exceptionTypeId: 1,
		exceptionTypeCode: "EX01",
		exceptionTypeName: "Test Exception",
		changeCategory: "standard",
		title: "Test SCR",
		description: "desc",
		businessJustification: "justification",
		riskAssessment: "low",
		impactDescription: null,
		compensatingControls: null,
		exceptionStartDate: "2026-06-01",
		exceptionEndDate: "2026-06-30",
		rollbackPlan: "rollback",
		plannedImplementationAt: null,
		status: "draft",
		submittedAt: null,
		supervisorApprovedAt: null,
		implementedAt: null,
		closedAt: null,
		testEnvironment: null,
		testResultSummary: null,
		implementationNotes: null,
		postReviewRequired: false,
		postReviewCompletedAt: null,
		requesterEmployeeCode: "EMP010",
		requesterName: "Requester",
		supervisorEmployeeCode: "EMP020",
		supervisorName: "Supervisor",
		orgUnitName: "IT Dept",
		createdAt: "2026-06-01T00:00:00Z",
		updatedAt: "2026-06-01T00:00:00Z",
		...overrides,
	};
}

// ──────────────────────────────────────────────
// canViewAllScr
// ──────────────────────────────────────────────

describe("canViewAllScr", () => {
	it("returns true for admin", () => {
		expect(canViewAllScr(makeUser({ roles: ["admin"] }))).toBe(true);
	});

	it("returns true for hr_verifier", () => {
		expect(canViewAllScr(makeUser({ roles: ["hr_verifier"] }))).toBe(true);
	});

	it("returns false for plain employee", () => {
		expect(canViewAllScr(makeUser({ roles: ["employee"] }))).toBe(false);
	});

	it("returns false for grantor roles", () => {
		expect(canViewAllScr(makeUser({ roles: ["grantor_head_l1"] }))).toBe(false);
	});
});

// ──────────────────────────────────────────────
// canItReview
// ──────────────────────────────────────────────

describe("canItReview", () => {
	it("returns true for admin", () => {
		expect(canItReview(makeUser({ roles: ["admin"] }))).toBe(true);
	});

	it("returns false for hr_verifier", () => {
		expect(canItReview(makeUser({ roles: ["hr_verifier"] }))).toBe(false);
	});

	it("returns false for employee", () => {
		expect(canItReview(makeUser({ roles: ["employee"] }))).toBe(false);
	});
});

// ──────────────────────────────────────────────
// canAccessScr
// ──────────────────────────────────────────────

describe("canAccessScr", () => {
	const record = makeRecord({ requesterEmployeeId: 10, supervisorEmployeeId: 20 });

	it("admin can access any record", () => {
		const user = makeUser({ roles: ["admin"], employeeId: 99 });
		expect(canAccessScr(user, record)).toBe(true);
	});

	it("hr_verifier can access any record", () => {
		const user = makeUser({ roles: ["hr_verifier"], employeeId: 99 });
		expect(canAccessScr(user, record)).toBe(true);
	});

	it("requester can access own record", () => {
		const user = makeUser({ roles: ["employee"], employeeId: 10 });
		expect(canAccessScr(user, record)).toBe(true);
	});

	it("supervisor can access record they supervise", () => {
		const user = makeUser({ roles: ["employee"], employeeId: 20 });
		expect(canAccessScr(user, record)).toBe(true);
	});

	it("unrelated user cannot access", () => {
		const user = makeUser({ roles: ["employee"], employeeId: 99 });
		expect(canAccessScr(user, record)).toBe(false);
	});

	it("user with null employeeId (no employee link) cannot access", () => {
		const user = makeUser({ roles: ["employee"], employeeId: null });
		expect(canAccessScr(user, record)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// canEditScr
// ──────────────────────────────────────────────

describe("canEditScr", () => {
	it("requester can edit own draft", () => {
		const user = makeUser({ employeeId: 10 });
		const record = makeRecord({ status: "draft", requesterEmployeeId: 10 });
		expect(canEditScr(user, record)).toBe(true);
	});

	it("requester cannot edit submitted record", () => {
		const user = makeUser({ employeeId: 10 });
		const record = makeRecord({ status: "submitted", requesterEmployeeId: 10 });
		expect(canEditScr(user, record)).toBe(false);
	});

	it("non-requester cannot edit", () => {
		const user = makeUser({ employeeId: 99 });
		const record = makeRecord({ status: "draft", requesterEmployeeId: 10 });
		expect(canEditScr(user, record)).toBe(false);
	});

	it("user with null employeeId cannot edit", () => {
		const user = makeUser({ employeeId: null });
		const record = makeRecord({ status: "draft", requesterEmployeeId: 10 });
		expect(canEditScr(user, record)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// canWithdrawScr
// ──────────────────────────────────────────────

describe("canWithdrawScr", () => {
	it("requester can withdraw draft", () => {
		const user = makeUser({ employeeId: 10 });
		const record = makeRecord({ status: "draft", requesterEmployeeId: 10 });
		expect(canWithdrawScr(user, record)).toBe(true);
	});

	it("requester can withdraw submitted", () => {
		const user = makeUser({ employeeId: 10 });
		const record = makeRecord({ status: "submitted", requesterEmployeeId: 10 });
		expect(canWithdrawScr(user, record)).toBe(true);
	});

	it("requester cannot withdraw supervisor_approved", () => {
		const user = makeUser({ employeeId: 10 });
		const record = makeRecord({ status: "supervisor_approved", requesterEmployeeId: 10 });
		expect(canWithdrawScr(user, record)).toBe(false);
	});

	it("non-requester cannot withdraw", () => {
		const user = makeUser({ employeeId: 99 });
		const record = makeRecord({ status: "submitted", requesterEmployeeId: 10 });
		expect(canWithdrawScr(user, record)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// canSupervisorApprove / canSupervisorDeny
// ──────────────────────────────────────────────

describe("canSupervisorApprove", () => {
	const supervisor = makeUser({ employeeId: 20 });

	it("supervisor can approve submitted record", () => {
		const record = makeRecord({
			status: "submitted",
			supervisorEmployeeId: 20,
			requesterEmployeeId: 10,
		});
		expect(canSupervisorApprove(supervisor, record)).toBe(true);
	});

	it("returns false if record not submitted", () => {
		const record = makeRecord({
			status: "draft",
			supervisorEmployeeId: 20,
			requesterEmployeeId: 10,
		});
		expect(canSupervisorApprove(supervisor, record)).toBe(false);
	});

	it("returns false if user is not the supervisor", () => {
		const user = makeUser({ employeeId: 99 });
		const record = makeRecord({ status: "submitted", supervisorEmployeeId: 20 });
		expect(canSupervisorApprove(user, record)).toBe(false);
	});

	it("returns false if supervisor is also the requester (SoD)", () => {
		const user = makeUser({ employeeId: 10 });
		const record = makeRecord({
			status: "submitted",
			supervisorEmployeeId: 10,
			requesterEmployeeId: 10,
		});
		expect(canSupervisorApprove(user, record)).toBe(false);
	});

	it("returns false if supervisor has null employeeId", () => {
		const user = makeUser({ employeeId: null });
		const record = makeRecord({ status: "submitted", supervisorEmployeeId: null });
		expect(canSupervisorApprove(user, record)).toBe(false);
	});
});

describe("canSupervisorDeny", () => {
	it("mirrors canSupervisorApprove", () => {
		const supervisor = makeUser({ employeeId: 20 });
		const approved = makeRecord({
			status: "submitted",
			supervisorEmployeeId: 20,
			requesterEmployeeId: 10,
		});
		const draft = makeRecord({ status: "draft", supervisorEmployeeId: 20 });
		expect(canSupervisorDeny(supervisor, approved)).toBe(true);
		expect(canSupervisorDeny(supervisor, draft)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// canItImplement / canItDeny
// ──────────────────────────────────────────────

describe("canItImplement", () => {
	const itAdmin = makeUser({ id: 99, roles: ["admin"], employeeId: 99 });

	it("admin can implement supervisor_approved record", () => {
		const record = makeRecord({
			status: "supervisor_approved",
			requesterUserId: 1,
			requesterEmployeeId: 10,
		});
		expect(canItImplement(itAdmin, record)).toBe(true);
	});

	it("returns false if record not supervisor_approved", () => {
		const record = makeRecord({ status: "submitted" });
		expect(canItImplement(itAdmin, record)).toBe(false);
	});

	it("returns false if non-admin", () => {
		const user = makeUser({ roles: ["employee"] });
		const record = makeRecord({ status: "supervisor_approved" });
		expect(canItImplement(user, record)).toBe(false);
	});

	it("returns false if IT user is the requester (SoD by userId)", () => {
		const requester = makeUser({ id: 1, roles: ["admin"], employeeId: 99 });
		const record = makeRecord({ status: "supervisor_approved", requesterUserId: 1 });
		expect(canItImplement(requester, record)).toBe(false);
	});

	it("returns false if IT user is the requester (SoD by employeeId)", () => {
		const requester = makeUser({ id: 99, roles: ["admin"], employeeId: 10 });
		const record = makeRecord({
			status: "supervisor_approved",
			requesterUserId: 1,
			requesterEmployeeId: 10,
		});
		expect(canItImplement(requester, record)).toBe(false);
	});
});

describe("canItDeny", () => {
	it("mirrors canItImplement", () => {
		const itAdmin = makeUser({ id: 99, roles: ["admin"], employeeId: 99 });
		const record = makeRecord({ status: "supervisor_approved", requesterUserId: 1 });
		expect(canItDeny(itAdmin, record)).toBe(canItImplement(itAdmin, record));
	});
});

// ──────────────────────────────────────────────
// canEmergencyImplement
// ──────────────────────────────────────────────

describe("canEmergencyImplement", () => {
	const itAdmin = makeUser({ id: 99, roles: ["admin"], employeeId: 99 });

	it("admin can emergency-implement emergency+submitted record", () => {
		const record = makeRecord({
			status: "submitted",
			changeCategory: "emergency",
			requesterUserId: 1,
			requesterEmployeeId: 10,
		});
		expect(canEmergencyImplement(itAdmin, record)).toBe(true);
	});

	it("returns false for non-emergency category", () => {
		const record = makeRecord({ status: "submitted", changeCategory: "standard" });
		expect(canEmergencyImplement(itAdmin, record)).toBe(false);
	});

	it("returns false if status is not submitted", () => {
		const record = makeRecord({ status: "supervisor_approved", changeCategory: "emergency" });
		expect(canEmergencyImplement(itAdmin, record)).toBe(false);
	});

	it("returns false for non-admin", () => {
		const user = makeUser({ roles: ["employee"] });
		const record = makeRecord({ status: "submitted", changeCategory: "emergency" });
		expect(canEmergencyImplement(user, record)).toBe(false);
	});

	it("returns false if IT user is the requester (SoD)", () => {
		const requester = makeUser({ id: 1, roles: ["admin"], employeeId: 99 });
		const record = makeRecord({
			status: "submitted",
			changeCategory: "emergency",
			requesterUserId: 1,
		});
		expect(canEmergencyImplement(requester, record)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// canCloseScr
// ──────────────────────────────────────────────

describe("canCloseScr", () => {
	it("admin can close implemented record", () => {
		const user = makeUser({ roles: ["admin"] });
		const record = makeRecord({ status: "implemented" });
		expect(canCloseScr(user, record)).toBe(true);
	});

	it("hr_verifier can close implemented record", () => {
		const user = makeUser({ roles: ["hr_verifier"] });
		const record = makeRecord({ status: "implemented" });
		expect(canCloseScr(user, record)).toBe(true);
	});

	it("returns false if record not implemented", () => {
		const user = makeUser({ roles: ["admin"] });
		const record = makeRecord({ status: "supervisor_approved" });
		expect(canCloseScr(user, record)).toBe(false);
	});

	it("returns false for plain employee on implemented record", () => {
		const user = makeUser({ roles: ["employee"] });
		const record = makeRecord({ status: "implemented" });
		expect(canCloseScr(user, record)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// assertCanCreateScr
// ──────────────────────────────────────────────

describe("assertCanCreateScr", () => {
	beforeEach(() => {
		vi.mocked(getEmployeeById).mockReset();
	});

	it("resolves when user has employeeId and employee exists", async () => {
		vi.mocked(getEmployeeById).mockResolvedValue({ id: 10 } as never);
		await expect(assertCanCreateScr(makeUser({ employeeId: 10 }))).resolves.toBeUndefined();
	});

	it("throws when user has null employeeId", async () => {
		await expect(assertCanCreateScr(makeUser({ employeeId: null }))).rejects.toThrow(
			"บัญชีไม่ผูกข้อมูลพนักงาน"
		);
	});

	it("throws when employee record not found in DB", async () => {
		vi.mocked(getEmployeeById).mockResolvedValue(null);
		await expect(assertCanCreateScr(makeUser({ employeeId: 10 }))).rejects.toThrow(
			"ไม่พบข้อมูลพนักงาน"
		);
	});
});

// ──────────────────────────────────────────────
// assertSupervisorSeparation
// ──────────────────────────────────────────────

describe("assertSupervisorSeparation", () => {
	it("does not throw when supervisor is different from requester", () => {
		const supervisor = makeUser({ id: 2, employeeId: 20 });
		const record = makeRecord({ requesterUserId: 1, requesterEmployeeId: 10 });
		expect(() => assertSupervisorSeparation(supervisor, record)).not.toThrow();
	});

	it("throws when supervisor userId matches requesterUserId", () => {
		const user = makeUser({ id: 1, employeeId: 99 });
		const record = makeRecord({ requesterUserId: 1, requesterEmployeeId: 10 });
		expect(() => assertSupervisorSeparation(user, record)).toThrow(
			"ผู้ยื่นคำขอไม่สามารถอนุมัติคำขอของตนเองได้"
		);
	});

	it("throws when supervisor employeeId matches requesterEmployeeId", () => {
		const user = makeUser({ id: 99, employeeId: 10 });
		const record = makeRecord({ requesterUserId: 1, requesterEmployeeId: 10 });
		expect(() => assertSupervisorSeparation(user, record)).toThrow(
			"ผู้ยื่นคำขอไม่สามารถอนุมัติคำขอของตนเองได้"
		);
	});
});

// ──────────────────────────────────────────────
// assertItSeparation
// ──────────────────────────────────────────────

describe("assertItSeparation", () => {
	it("does not throw when IT actor is different from requester", () => {
		const itUser = makeUser({ id: 99, employeeId: 99 });
		const record = makeRecord({ requesterUserId: 1, requesterEmployeeId: 10 });
		expect(() => assertItSeparation(itUser, record)).not.toThrow();
	});

	it("throws when IT actor userId matches requesterUserId", () => {
		const user = makeUser({ id: 1, employeeId: 99 });
		const record = makeRecord({ requesterUserId: 1, requesterEmployeeId: 10 });
		expect(() => assertItSeparation(user, record)).toThrow(
			"ผู้ยื่นคำขอไม่สามารถดำเนินการ IT คำขอของตนเองได้"
		);
	});

	it("throws when IT actor employeeId matches requesterEmployeeId", () => {
		const user = makeUser({ id: 99, employeeId: 10 });
		const record = makeRecord({ requesterUserId: 1, requesterEmployeeId: 10 });
		expect(() => assertItSeparation(user, record)).toThrow(
			"ผู้ยื่นคำขอไม่สามารถดำเนินการ IT คำขอของตนเองได้"
		);
	});
});
