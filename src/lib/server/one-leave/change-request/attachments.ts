import { env } from '$env/dynamic/private';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { getDbPool } from '$lib/server/one-leave/db/pool.js';
import type { AuthUser } from '$lib/server/one-leave/auth/types.js';
import type { AttachmentType, ScrAttachmentRow } from '$lib/server/one-leave/change-request/types.js';

const ALLOWED_ATTACHMENT_MIME = new Set([
	'application/pdf',
	'image/png',
	'image/jpeg',
	'image/webp',
	'image/jpg'
]);

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function uploadRoot(): string {
	const raw = env.CHANGE_UPLOAD_DIR ?? path.join(process.cwd(), 'uploads', 'change-request-gateway');
	if (raw.startsWith('\\\\')) {
		const clean = raw.replace(/\\+/g, '\\');
		return '\\\\' + clean.slice(1);
	}
	return path.resolve(raw);
}

function toInt(value: number | string | null | undefined): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(n) ? n : null;
}

export async function listScrAttachments(
	scrId: number,
	attachmentType?: AttachmentType
): Promise<ScrAttachmentRow[]> {
	const pool = await getDbPool();
	const req = pool.request().input('scrId', scrId);

	let query = `
		SELECT [id], [attachment_type], [file_name], [mime_type], [file_size_bytes], [uploaded_at]
		FROM [one_leave].[system_change_attachments]
		WHERE [system_change_request_id] = @scrId
	`;

	if (attachmentType) {
		req.input('attachmentType', attachmentType);
		query += ' AND [attachment_type] = @attachmentType';
	}

	query += ' ORDER BY [uploaded_at] DESC';

	const result = await req.query<{
		id: number | string;
		attachment_type: string;
		file_name: string;
		mime_type: string;
		file_size_bytes: number | string;
		uploaded_at: Date | string;
	}>(query);

	return result.recordset
		.map((r) => {
			const id = toInt(r.id);
			if (id === null) return null;
			return {
				id,
				attachmentType: r.attachment_type as AttachmentType,
				fileName: r.file_name,
				mimeType: r.mime_type,
				fileSizeBytes: Number(r.file_size_bytes),
				uploadedAt:
					r.uploaded_at instanceof Date ? r.uploaded_at.toISOString() : String(r.uploaded_at)
			};
		})
		.filter((r): r is ScrAttachmentRow => r !== null);
}

export async function hasAttachmentType(
	scrId: number,
	attachmentType: AttachmentType
): Promise<boolean> {
	const attachments = await listScrAttachments(scrId, attachmentType);
	return attachments.length > 0;
}

export async function saveScrAttachment(
	user: AuthUser,
	scrId: number,
	attachmentType: AttachmentType,
	file: File
): Promise<void> {
	if (!file || file.size === 0) {
		throw new Error('เลือกไฟล์ก่อนอัปโหลด');
	}
	if (file.size > MAX_ATTACHMENT_BYTES) {
		throw new Error('ไฟล์ใหญ่เกิน 10 MB');
	}
	const mime = file.type || 'application/octet-stream';
	if (!ALLOWED_ATTACHMENT_MIME.has(mime)) {
		throw new Error('รองรับเฉพาะ PDF, PNG, JPEG, WEBP');
	}

	const safeName = file.name.replace(/[^\w.\-ก-๙() ]+/gu, '_').slice(0, 200);
	const dir = path.join(uploadRoot(), String(scrId), attachmentType);
	await mkdir(dir, { recursive: true });
	const storageName = `${Date.now()}-${safeName}`;
	const storagePath = path.join(dir, storageName);
	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(storagePath, buffer);

	const pool = await getDbPool();
	await pool
		.request()
		.input('scrId', scrId)
		.input('attachmentType', attachmentType)
		.input('fileName', file.name.slice(0, 255))
		.input('storagePath', storagePath)
		.input('mimeType', mime)
		.input('fileSizeBytes', file.size)
		.input('uploadedBy', user.id).query(`
			INSERT INTO [one_leave].[system_change_attachments] (
				[system_change_request_id], [attachment_type], [file_name],
				[storage_path], [mime_type], [file_size_bytes], [uploaded_by]
			)
			VALUES (
				@scrId, @attachmentType, @fileName,
				@storagePath, @mimeType, @fileSizeBytes, @uploadedBy
			)
		`);
}

export async function deleteScrAttachment(
	_user: AuthUser,
	scrId: number,
	attachmentId: number
): Promise<void> {
	const pool = await getDbPool();
	const findResult = await pool
		.request()
		.input('id', attachmentId)
		.input('scrId', scrId).query<{ storage_path: string }>(`
			SELECT [storage_path]
			FROM [one_leave].[system_change_attachments]
			WHERE [id] = @id AND [system_change_request_id] = @scrId
		`);

	const storagePath = findResult.recordset[0]?.storage_path;

	await pool.request().input('id', attachmentId).input('scrId', scrId).query(`
			DELETE FROM [one_leave].[system_change_attachments]
			WHERE [id] = @id AND [system_change_request_id] = @scrId
		`);

	if (storagePath) {
		try {
			await unlink(storagePath);
		} catch (err: unknown) {
			console.error(`[deleteScrAttachment] Failed to delete file ${storagePath}:`, err);
		}
	}
}

export async function readScrAttachmentPath(
	scrId: number,
	attachmentId: number
): Promise<{ storagePath: string; fileName: string; mimeType: string } | null> {
	const pool = await getDbPool();
	const result = await pool
		.request()
		.input('id', attachmentId)
		.input('scrId', scrId).query<{
			storage_path: string;
			file_name: string;
			mime_type: string;
		}>(`
			SELECT [storage_path], [file_name], [mime_type]
			FROM [one_leave].[system_change_attachments]
			WHERE [id] = @id AND [system_change_request_id] = @scrId
		`);

	const row = result.recordset[0];
	if (!row) return null;

	const root = uploadRoot();
	let resolved = row.storage_path;
	if (resolved.startsWith('\\\\')) {
		const clean = resolved.replace(/\\+/g, '\\');
		resolved = '\\\\' + clean.slice(1);
	} else {
		resolved = path.resolve(resolved);
	}

	if (!resolved.startsWith(root)) {
		throw new Error('เส้นทางไฟล์ไม่ถูกต้อง');
	}

	return {
		storagePath: resolved,
		fileName: row.file_name,
		mimeType: row.mime_type
	};
}

export async function assertTestEvidenceAttached(scrId: number): Promise<void> {
	const has = await hasAttachmentType(scrId, 'test_evidence');
	if (!has) {
		throw new Error('ต้องแนบหลักฐานการทดสอบ (test_evidence) ก่อนดำเนินการ');
	}
}
