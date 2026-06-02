import { describe, expect, it } from "vitest";
import { authenticateLeaveMockUser } from "./mock-auth.js";

describe("authenticateLeaveMockUser", () => {
	it("accepts nopparat test user with default mock password", () => {
		const user = authenticateLeaveMockUser(
			"nopparat.jap@mahidol.ac.th",
			"Demo@2569",
		);
		expect(user?.username).toBe("nopparat.jap@mahidol.ac.th");
		expect(user?.roles).toContain("admin");
	});
});
