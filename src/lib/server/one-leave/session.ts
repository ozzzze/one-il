import { createHmac, timingSafeEqual } from "node:crypto";
import type { Cookies } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { sanitizePostLoginRedirect } from "$lib/server/one-leave/paths.js";
import {
	getMockLeaveUserById,
	getMockPasswordChangedAt,
	isMockLeaveUserId,
} from "$lib/server/one-leave/mock-auth.js";
import { getLeaveUserById, getPasswordChangedAt } from "$lib/server/one-leave/users.js";
import type { LeaveAuthUser, LeaveSessionPayload } from "$lib/server/one-leave/types.js";

export const LEAVE_SESSION_COOKIE = "one_leave_session";
const MAX_AGE_SEC = 60 * 60 * 8;
const PWD_CHANGED_SKEW_SEC = 5;

/** Keep aligned with one-leave `getSessionSecret()` so cookies verify on both apps. */
function getSessionSecret(): string {
	const secret = env.SESSION_SECRET?.trim();
	if (secret && secret.length >= 32) return secret;

	if ((env.NODE_ENV ?? "development") === "development") {
		return "dev-only-one-leave-session-secret-32+";
	}

	throw new Error("SESSION_SECRET must be set (32+ characters) in .env — same as one-leave");
}

function sign(payloadB64: string): string {
	return createHmac("sha256", getSessionSecret()).update(payloadB64).digest("base64url");
}

function encodePayload(payload: LeaveSessionPayload): string {
	const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
	return `${body}.${sign(body)}`;
}

/** Set shared SSO cookie after gateway login. */
export async function createLeaveSessionCookie(cookies: Cookies, user: LeaveAuthUser): Promise<void> {
	const pwdAt = isMockLeaveUserId(user.id)
		? getMockPasswordChangedAt(user.id)
		: await getPasswordChangedAt(user.id);
	const payload: LeaveSessionPayload = {
		userId: user.id,
		username: user.username,
		exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
		pwdAt,
	};

	cookies.set(LEAVE_SESSION_COOKIE, encodePayload(payload), {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: !dev,
		maxAge: MAX_AGE_SEC,
	});
}

function decodeToken(token: string): LeaveSessionPayload | null {
	const dot = token.lastIndexOf(".");
	if (dot < 0) return null;

	const body = token.slice(0, dot);
	const sig = token.slice(dot + 1);
	const expected = sign(body);

	try {
		const a = Buffer.from(sig, "base64url");
		const b = Buffer.from(expected, "base64url");
		if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	} catch {
		return null;
	}

	try {
		const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as LeaveSessionPayload;
		const userId = typeof parsed.userId === "number" ? parsed.userId : Number(parsed.userId);
		const exp = typeof parsed.exp === "number" ? parsed.exp : Number(parsed.exp);
		if (!Number.isFinite(userId) || !Number.isFinite(exp)) return null;
		if (exp < Math.floor(Date.now() / 1000)) return null;
		const pwdAt = typeof parsed.pwdAt === "number" ? parsed.pwdAt : 0;
		return { userId, username: parsed.username, exp, pwdAt };
	} catch {
		return null;
	}
}

/** Same session cookie as one-leave — enables SSO on same origin. */
export async function getLeaveSessionUser(cookies: Cookies): Promise<LeaveAuthUser | null> {
	const token = cookies.get(LEAVE_SESSION_COOKIE);
	if (!token) return null;

	const payload = decodeToken(token);
	if (!payload) return null;

	if (isMockLeaveUserId(payload.userId)) {
		return getMockLeaveUserById(payload.userId);
	}

	const dbPwdAt = await getPasswordChangedAt(payload.userId);
	if (dbPwdAt > 0 && (payload.pwdAt ?? 0) + PWD_CHANGED_SKEW_SEC < dbPwdAt) {
		cookies.delete(LEAVE_SESSION_COOKIE, { path: "/" });
		return null;
	}

	return getLeaveUserById(payload.userId);
}

export function leaveLoginUrl(redirectTo: string): string {
	const base = "/leave/login";
	const safe = sanitizePostLoginRedirect(redirectTo);
	if (!safe || safe === "/") return base;
	return `${base}?redirectTo=${encodeURIComponent(safe)}`;
}
