import { describe, expect, it } from "vitest";
import { rewriteLeaveProxyPath } from "../../../../scripts/leave-proxy-rewrite.mjs";

describe("rewriteLeaveProxyPath", () => {
	it("maps gateway root to one-leave home", () => {
		expect(rewriteLeaveProxyPath("/leave")).toBe("/");
		expect(rewriteLeaveProxyPath("/leave/")).toBe("/");
	});

	it("maps double-prefixed leave routes", () => {
		expect(rewriteLeaveProxyPath("/leave/leave/new")).toBe("/leave/new");
		expect(rewriteLeaveProxyPath("/leave/leave")).toBe("/leave");
	});

	it("fixes shorthand links missing one /leave segment", () => {
		expect(rewriteLeaveProxyPath("/leave/new")).toBe("/leave/new");
		expect(rewriteLeaveProxyPath("/leave/quota")).toBe("/leave/quota");
		expect(rewriteLeaveProxyPath("/leave/42")).toBe("/leave/42");
	});

	it("maps other app roots", () => {
		expect(rewriteLeaveProxyPath("/leave/org")).toBe("/org");
		expect(rewriteLeaveProxyPath("/leave/change-requests/new")).toBe("/change-requests/new");
		expect(rewriteLeaveProxyPath("/leave/login")).toBe("/login");
	});
});
