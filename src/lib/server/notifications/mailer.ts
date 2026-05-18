import nodemailer from "nodemailer";
import type { SmtpConfig } from "$lib/server/notifications/smtp-config.js";

export type SendMailInput = {
	to: string;
	subject: string;
	text: string;
};

export async function sendMail(config: SmtpConfig, input: SendMailInput): Promise<void> {
	const transport = nodemailer.createTransport({
		host: config.host,
		port: config.port,
		secure: config.secure,
		auth: {
			user: config.user,
			pass: config.pass,
		},
	});

	await transport.sendMail({
		from: config.from,
		to: input.to,
		replyTo: config.replyTo,
		subject: input.subject,
		text: input.text,
	});
}
