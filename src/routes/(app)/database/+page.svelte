<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import HardDriveIcon from "@lucide/svelte/icons/hard-drive";
	import TableIcon from "@lucide/svelte/icons/table-2";
	import RowsIcon from "@lucide/svelte/icons/rows-3";

	let { data } = $props();
const copy = $derived.by(() =>
	data.locale === "th"
		? {
				pageTitle: "ฐานข้อมูล - ONE-IL",
				title: "ฐานข้อมูล",
				description: "ติดตามสถานะฐานข้อมูลและสถิติตาราง",
				dbSize: "ขนาดฐานข้อมูล",
				notAvailableApi: "ไม่พร้อมใช้งานผ่าน API",
				journalMode: "โหมด Journal",
				managedByPostgres: "จัดการโดย Postgres",
				tables: "ตาราง",
				activeTables: "ตารางที่ใช้งาน",
				totalRows: "จำนวนแถวรวม",
				acrossAllTables: "รวมทุกตาราง",
				tablesHeader: "ตาราง",
				tablesDesc: "จำนวนแถวของแต่ละตารางในฐานข้อมูล",
				tableName: "ชื่อตาราง",
				rows: "แถว",
				percentOfTotal: "% ของทั้งหมด",
			}
		: {
				pageTitle: "Database - ONE-IL",
				title: "Database",
				description: "Monitor your database status and table statistics.",
				dbSize: "Database Size",
				notAvailableApi: "Not available via API",
				journalMode: "Journal Mode",
				managedByPostgres: "Managed by Postgres",
				tables: "Tables",
				activeTables: "Active tables",
				totalRows: "Total Rows",
				acrossAllTables: "Across all tables",
				tablesHeader: "Tables",
				tablesDesc: "Row counts for each table in the database.",
				tableName: "Table Name",
				rows: "Rows",
				percentOfTotal: "% of Total",
			}
);

	function formatBytes(bytes: number) {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground">{copy.description}</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{copy.dbSize}</Card.Title>
				<HardDriveIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatBytes(data.dbSize)}</div>
				<p class="text-muted-foreground text-xs">{copy.notAvailableApi}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{copy.journalMode}</Card.Title>
				<DatabaseIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold uppercase">{data.journalMode}</div>
				<p class="text-muted-foreground text-xs">{copy.managedByPostgres}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{copy.tables}</Card.Title>
				<TableIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.tables.length}</div>
				<p class="text-muted-foreground text-xs">{copy.activeTables}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{copy.totalRows}</Card.Title>
				<RowsIcon class="text-muted-foreground size-4" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.totalRows.toLocaleString()}</div>
				<p class="text-muted-foreground text-xs">{copy.acrossAllTables}</p>
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.tablesHeader}</Card.Title>
			<Card.Description>{copy.tablesDesc}</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{copy.tableName}</Table.Head>
						<Table.Head class="text-right">{copy.rows}</Table.Head>
						<Table.Head class="text-right">{copy.percentOfTotal}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.tables as table (table.name)}
						<Table.Row>
							<Table.Cell class="font-mono text-sm">{table.name}</Table.Cell>
							<Table.Cell class="text-right">{table.rows.toLocaleString()}</Table.Cell>
							<Table.Cell class="text-right">
								<Badge variant="outline">
									{data.totalRows > 0 ? Math.round((table.rows / data.totalRows) * 100) : 0}%
								</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
