import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn(() => ({
	select: vi.fn(() => ({
		single: vi.fn(async () => ({ data: { id: "550e8400-e29b-41d4-a716-446655440001" }, error: null })),
	})),
}));

const maybeSingleMock = vi.fn(async () => ({ data: null as { id: string } | null, error: null }));
const updateEqMock = vi.fn(async () => ({ error: null }));

const queryChain = {
	insert: insertMock,
	select: vi.fn(() => queryChain),
	eq: vi.fn(() => queryChain),
	is: vi.fn(() => queryChain),
	maybeSingle: maybeSingleMock,
	update: vi.fn(() => ({ eq: updateEqMock })),
};

const fromMock = vi.fn(() => queryChain);

vi.mock("$lib/server/guards.js", () => ({
	assertPermission: vi.fn(),
}));

vi.mock("$lib/server/supabase-admin.js", () => ({
	getServiceRoleClient: vi.fn(() => ({
		from: fromMock,
	})),
}));

const { actions } = await import("./+page.server.js");

function createMockRequest(formData: FormData): Request {
	return new Request("http://localhost/employees", {
		method: "POST",
		body: formData,
	});
}

function createMockLocals() {
	return {
		user: {
			id: "00000000-0000-0000-0000-000000000001",
			name: "Admin User",
			email: "admin@test.com",
			username: "admin",
			role: "admin" as const,
		},
	};
}

const sampleUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("Employees actions validation", () => {
	beforeEach(() => {
		insertMock.mockClear();
		fromMock.mockClear();
		maybeSingleMock.mockClear();
		updateEqMock.mockClear();
		maybeSingleMock.mockResolvedValue({ data: null, error: null });
	});

	it("rejects invalid employee payload", async () => {
		const formData = new FormData();
		formData.set("firstName", "");
		formData.set("lastName", "");
		formData.set("email", "invalid");

		const result = await actions.createEmployee({
			request: createMockRequest(formData),
			locals: createMockLocals(),
		} as never);

		expect(result).toHaveProperty("status", 400);
		expect(insertMock).not.toHaveBeenCalled();
	});

	it("rejects invalid assignment payload", async () => {
		const formData = new FormData();
		formData.set("employeeId", "not-a-uuid");
		formData.set("positionId", "not-a-uuid");
		formData.set("orgUnitId", "not-a-uuid");
		formData.set("startsAt", "2026-13-40");

		const result = await actions.assignPrimary({
			request: createMockRequest(formData),
			locals: createMockLocals(),
		} as never);

		expect(result).toHaveProperty("status", 400);
		expect(insertMock).not.toHaveBeenCalled();
		expect(maybeSingleMock).not.toHaveBeenCalled();
	});

	it("assignPrimary inserts when no active primary exists", async () => {
		const formData = new FormData();
		formData.set("employeeId", sampleUuid);
		formData.set("positionId", "6ba7b810-9dad-11d1-80b4-00c04fd430c8");
		formData.set("orgUnitId", "6ba7b811-9dad-11d1-80b4-00c04fd430c8");
		formData.set("startsAt", "2026-05-01");
		formData.set("isPrimary", "true");

		const result = await actions.assignPrimary({
			request: createMockRequest(formData),
			locals: createMockLocals(),
		} as never);

		expect(result).toEqual({ success: true, action: "assignPrimary" });
		expect(maybeSingleMock).toHaveBeenCalled();
		expect(insertMock).toHaveBeenCalled();
		expect(updateEqMock).not.toHaveBeenCalled();
	});

	it("assignPrimary updates when an active primary already exists", async () => {
		maybeSingleMock.mockResolvedValueOnce({
			data: { id: "770e8400-e29b-41d4-a716-446655440099" },
			error: null,
		});

		const formData = new FormData();
		formData.set("employeeId", sampleUuid);
		formData.set("positionId", "6ba7b810-9dad-11d1-80b4-00c04fd430c8");
		formData.set("orgUnitId", "6ba7b811-9dad-11d1-80b4-00c04fd430c8");
		formData.set("startsAt", "2026-05-01");
		formData.set("isPrimary", "true");

		const result = await actions.assignPrimary({
			request: createMockRequest(formData),
			locals: createMockLocals(),
		} as never);

		expect(result).toEqual({ success: true, action: "assignPrimary" });
		expect(insertMock).not.toHaveBeenCalled();
		expect(updateEqMock).toHaveBeenCalled();
	});
});
