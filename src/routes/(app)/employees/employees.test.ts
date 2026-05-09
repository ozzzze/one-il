import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn(async () => ({ error: null }));
const fromMock = vi.fn(() => ({
	insert: insertMock,
}));

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

describe("Employees actions validation", () => {
	beforeEach(() => {
		insertMock.mockClear();
		fromMock.mockClear();
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
	});
});

