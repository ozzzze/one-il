import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

/** Fallback ตอนไม่มี `.env` (เช่น build) — runtime ใช้ค่าจาก `.env` เช่น intranet `10.21.1.103:54322` */
const connectionString =
	process.env.DATABASE_URL ??
	"postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
