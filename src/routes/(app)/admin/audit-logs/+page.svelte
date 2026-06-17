<script lang="ts">
	import NativeSelect from "$lib/components/native-select.svelte";
	import ServerLinkPagination from "$lib/components/server-link-pagination.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import type { PageData } from "./$types";
	import SearchIcon from "@lucide/svelte/icons/search";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import HistoryIcon from "@lucide/svelte/icons/history";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import XIcon from "@lucide/svelte/icons/x";
	import { resolve } from "$app/paths";

	let { data }: { data: PageData } = $props();

	const auditPage = $derived(data.auditPage);
	const totalPages = $derived(Math.ceil(auditPage.total / auditPage.pageSize));

	function labelAction(action: string): string {
		const map: Record<string, string> = {
			create: "สร้าง",
			update: "แก้ไข",
			self_update: "แก้ไขส่วนตัว",
			soft_delete: "ปิดใช้งาน",
			submit: "ยื่น",
			withdraw: "ถอน",
			verify: "HR ตรวจสอบ",
			grant: "อนุญาต",
			deny: "ปฏิเสธ",
			revoke_request: "ขอยกเลิก",
			revoke_approve: "อนุมัติยกเลิก",
			revoke_reject: "ปฏิเสธยกเลิก",
		};
		return map[action] ?? action;
	}

	function labelEntity(entityType: string): string {
		const map: Record<string, string> = {
			employee: "พนักงาน",
			leave_request: "ใบลา",
			system_change_request: "คำขอเปลี่ยนแปลงระบบ",
			leave_attachment: "ไฟล์แนบ",
			org_unit: "หน่วยงาน",
			user: "บัญชีผู้ใช้",
			fiscal_year: "ปีงบ",
			working_calendar: "ปฏิทิน",
			system_settings: "ตั้งค่า",
			leave_type: "ประเภทลา",
		};
		return map[entityType] ?? entityType;
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString("th-TH", {
			timeZone: "Asia/Bangkok",
			dateStyle: "short",
			timeStyle: "short",
		});
	}

	function prettyJson(raw: string | null): string {
		if (!raw) return "";
		try {
			return JSON.stringify(JSON.parse(raw), null, 2);
		} catch {
			return raw;
		}
	}

	function detailHref(itemId: number): string {
		const params = new URLSearchParams();
		if (data.filter.from) params.set("from", data.filter.from);
		if (data.filter.to) params.set("to", data.filter.to);
		if (data.filter.entityType) params.set("entityType", data.filter.entityType);
		if (data.filter.action) params.set("action", data.filter.action);
		if (data.filter.q) params.set("q", data.filter.q);
		if (auditPage.page > 1) params.set("page", String(auditPage.page));
		params.set("detail", String(itemId));
		return resolve(`/admin/audit-logs?${params.toString()}` as "/");
	}

	function closeDetailHref(): string {
		const params = new URLSearchParams();
		if (data.filter.from) params.set("from", data.filter.from);
		if (data.filter.to) params.set("to", data.filter.to);
		if (data.filter.entityType) params.set("entityType", data.filter.entityType);
		if (data.filter.action) params.set("action", data.filter.action);
		if (data.filter.q) params.set("q", data.filter.q);
		if (auditPage.page > 1) params.set("page", String(auditPage.page));
		const qs = params.toString();
		return qs
			? resolve(`/admin/audit-logs?${qs}` as "/")
			: resolve("/admin/audit-logs" as "/");
	}

	function pageHref(page: number): string {
		const params = new URLSearchParams();
		if (data.filter.from) params.set("from", data.filter.from);
		if (data.filter.to) params.set("to", data.filter.to);
		if (data.filter.entityType) params.set("entityType", data.filter.entityType);
		if (data.filter.action) params.set("action", data.filter.action);
		if (data.filter.q) params.set("q", data.filter.q);
		if (page > 1) params.set("page", String(page));
		const qs = params.toString();
		return qs
			? resolve(`/admin/audit-logs?${qs}` as "/")
			: resolve("/admin/audit-logs" as "/");
	}

	const detailOpen = $derived(data.detail !== null);
</script>

<svelte:head>
	<title>{data.pageTitle} — ONE-IL</title>
</svelte:head>

<div class="flex flex-col gap-6">

	<!-- Filter Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<SearchIcon class="size-4 shrink-0" />
				ค้นหา
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="GET" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<div class="flex flex-col gap-1.5">
					<Label for="from">ตั้งแต่วันที่</Label>
					<Input id="from" name="from" type="date" value={data.filter.from} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="to">ถึงวันที่</Label>
					<Input id="to" name="to" type="date" value={data.filter.to} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="entityType">ประเภทข้อมูล</Label>
					<NativeSelect id="entityType" name="entityType" value={data.filter.entityType}>
						<option value="">ทั้งหมด</option>
						{#each data.entityTypes as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</NativeSelect>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="action">การกระทำ</Label>
					<Input
						id="action"
						name="action"
						type="text"
						placeholder="เช่น create, update"
						value={data.filter.action}
					/>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="q">ค้นหา</Label>
					<Input
						id="q"
						name="q"
						type="search"
						placeholder="ผู้ทำรายการ, รายละเอียด"
						value={data.filter.q}
					/>
				</div>
				<div class="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-5">
					<Button variant="outline" type="button" href={resolve("/admin/audit-logs" as "/")}>
						<RotateCcwIcon data-icon="inline-start" />
						ล้างตัวกรอง
					</Button>
					<Button type="submit" variant="outline">
						<SearchIcon data-icon="inline-start" />
						ค้นหา
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Results Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<HistoryIcon class="size-4 shrink-0" />
				ประวัติการทำรายการ
			</Card.Title>
			<Card.Description>
				{auditPage.total} รายการ
			</Card.Description>
		</Card.Header>
		<Card.Content class="overflow-x-auto p-0">
			<Table.Root class="min-w-215">
				<Table.Header>
					<Table.Row>
						<Table.Head class="whitespace-nowrap">วันที่-เวลา</Table.Head>
						<Table.Head>ผู้ทำ</Table.Head>
						<Table.Head>บทบาท</Table.Head>
						<Table.Head>ประเภท</Table.Head>
						<Table.Head>การกระทำ</Table.Head>
						<Table.Head>รายละเอียด</Table.Head>
						<Table.Head>
							<span class="sr-only">ดูรายละเอียด</span>
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each auditPage.items as item (item.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs whitespace-nowrap">
								{formatDate(item.createdAt)}
							</Table.Cell>
							<Table.Cell>
								{#if item.actorDisplayName}
									<span>{item.actorDisplayName}</span>
									{#if item.actorUsername}
										<span class="text-muted-foreground block text-xs">{item.actorUsername}</span>
									{/if}
								{:else if item.actorUsername}
									<span>{item.actorUsername}</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="text-muted-foreground text-xs">
								{item.roleCode ?? "—"}
							</Table.Cell>
							<Table.Cell class="text-xs">
								{labelEntity(item.entityType)}
								<span class="text-muted-foreground">#{item.entityId}</span>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary" class="font-normal">
									{labelAction(item.action)}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground max-w-xs truncate text-xs">
								{item.summary ?? "—"}
							</Table.Cell>
							<Table.Cell>
								<Button
									variant="ghost"
									size="icon-sm"
									href={detailHref(item.id)}
									title="ดูรายละเอียด"
									aria-label="ดูรายละเอียดรายการ #{item.id}"
								>
									<FileTextIcon class="size-4" />
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={7} class="text-muted-foreground py-8 text-center">
								ไม่พบรายการตามเงื่อนไข
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>

			<ServerLinkPagination
				currentPage={auditPage.page}
				{totalPages}
				totalItems={auditPage.total}
				pageSize={auditPage.pageSize}
				{pageHref}
				locale="th"
			/>
		</Card.Content>
	</Card.Root>
</div>

<!-- Detail Dialog -->
<Dialog.Root open={detailOpen}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content class="sm:max-w-4xl">
			<Dialog.Header>
				<Dialog.Title>รายละเอียดรายการ #{data.detail?.id}</Dialog.Title>
				<Dialog.Description>
					{#if data.detail}
						{formatDate(data.detail.createdAt)} ·
						{labelEntity(data.detail.entityType)} #{data.detail.entityId} ·
						{labelAction(data.detail.action)}
					{/if}
				</Dialog.Description>
			</Dialog.Header>

			{#if data.detail}
				{@const d = data.detail}
				<div class="grid gap-4 py-2 text-sm">
					<div class="grid grid-cols-2 gap-x-6 gap-y-2">
						<div>
							<span class="text-muted-foreground">ผู้ทำรายการ</span>
							<p class="font-medium">{d.actorDisplayName ?? d.actorUsername ?? "—"}</p>
						</div>
						<div>
							<span class="text-muted-foreground">บทบาท</span>
							<p class="font-medium">{d.roleCode ?? "—"}</p>
						</div>
						<div>
							<span class="text-muted-foreground">IP Address</span>
							<p class="font-mono text-xs">{d.ipAddress ?? "—"}</p>
						</div>
						<div>
							<span class="text-muted-foreground">รายละเอียด</span>
							<p>{d.summary ?? "—"}</p>
						</div>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-1.5">
							<p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">ก่อน</p>
							{#if d.beforeJson}
								<pre class="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">{prettyJson(
										d.beforeJson,
									)}</pre>
							{:else}
								<p class="text-muted-foreground text-xs italic">ไม่มีข้อมูล</p>
							{/if}
						</div>
						<div class="flex flex-col gap-1.5">
							<p class="text-muted-foreground text-xs font-medium uppercase tracking-wide">หลัง</p>
							{#if d.afterJson}
								<pre class="max-h-60 overflow-auto rounded bg-muted p-3 text-xs">{prettyJson(
										d.afterJson,
									)}</pre>
							{:else}
								<p class="text-muted-foreground text-xs italic">ไม่มีข้อมูล</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<Dialog.Footer>
				<Button variant="outline" href={closeDetailHref()} class="gap-1.5">
					<XIcon class="size-4" />
					ปิด
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
