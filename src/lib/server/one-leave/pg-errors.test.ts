import { describe, expect, it } from "vitest";
import { isTransientPgError, userFacingDbError } from "./pg-errors.js";

describe("isTransientPgError", () => {
	it("detects ECONNRESET", () => {
		expect(isTransientPgError(new Error("read ECONNRESET"))).toBe(true);
		expect(isTransientPgError(Object.assign(new Error("reset"), { code: "ECONNRESET" }))).toBe(
			true,
		);
	});

	it("detects Postgres connection codes", () => {
		expect(isTransientPgError(Object.assign(new Error("shutdown"), { code: "57P01" }))).toBe(true);
	});

	it("ignores credential errors", () => {
		expect(isTransientPgError(Object.assign(new Error("auth failed"), { code: "28P01" }))).toBe(
			false,
		);
	});
});

describe("userFacingDbError", () => {
	it("returns fallback for transient errors", () => {
		expect(userFacingDbError(new Error("read ECONNRESET"), "try again")).toBe("try again");
	});

	it("returns fallback for unknown errors", () => {
		expect(userFacingDbError(new Error("syntax error"), "try again")).toBe("try again");
	});
});
