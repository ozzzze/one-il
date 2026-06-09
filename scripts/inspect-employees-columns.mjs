import pg from "pg";

const connectionString = process.env.SELF_HOSTED_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
	console.error("SELF_HOSTED_DATABASE_URL or DATABASE_URL is required");
	process.exit(1);
}

const client = new pg.Client(connectionString);

try {
	await client.connect();
	const { rows } = await client.query(`
		select column_name
		from information_schema.columns
		where table_schema = 'one_leave'
		  and table_name = 'employees'
		order by ordinal_position
	`);
	for (const row of rows) {
		console.log(row.column_name);
	}
} finally {
	await client.end().catch(() => {});
}
