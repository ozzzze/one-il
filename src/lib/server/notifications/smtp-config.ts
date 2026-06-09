import { env } from "$env/dynamic/private";

export type SmtpConfig = {
	host: string;
	port: number;
	secure: boolean;
	user: string;
	pass: string;
	from: string;
	replyTo?: string;
};

export function isSmtpConfigured(): boolean {
	const user = env.SMTP_USER?.trim();
	const pass = env.SMTP_PASS?.trim();
	return Boolean(user && pass);
}

/** Gmail / university SMTP — credentials from server env only. */
export function getSmtpConfig(): SmtpConfig | null {
	if (!isSmtpConfigured()) return null;

	const user = env.SMTP_USER!.trim();
	const pass = env.SMTP_PASS!.trim();
	const host = env.SMTP_HOST?.trim() || "smtp.gmail.com";
	const port = Number(env.SMTP_PORT ?? "587");
	const secure = env.SMTP_SECURE === "true" || port === 465;
	const from = env.SMTP_FROM?.trim() || `ONE-IL <${user}>`;
	const replyTo = env.SMTP_REPLY_TO?.trim();

	return {
		host,
		port: Number.isFinite(port) ? port : 587,
		secure,
		user,
		pass,
		from,
		replyTo: replyTo || undefined,
	};
}
