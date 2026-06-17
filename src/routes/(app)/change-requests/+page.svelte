<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import NativeSelect from "$lib/components/native-select.svelte";
	import { labelChangeCategory, labelScrStatus } from "$lib/change-request/labels.js";
	import type {
		ChangeRequestListFilter,
		ScrQueueCounts,
	} from "$lib/server/one-leave/change-request/types.js";
	import type { PageData } from "./$types";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { resolve } from "$app/paths";
	import { SvelteURLSearchParams } from "svelte/reactivity";

	let { data }: { data: PageData } = $props();

	const emptyFilter: ChangeRequestListFilter = {
		status: "",
		q: "",
		changeCategory: "",
		itSystemId: null,
		exceptionTypeId: null,
	};
	const emptyQueue: ScrQueueCounts = { supervisorPending: 0, itPending: 0 };

	const requests = $derived("requests" in data ? (data.requests ?? []) : []);
	const filter = $derived(("filter" in data ? data.filter : undefined) ?? emptyFilter);
	const queueCounts = $derived(
		("queueCounts" in data ? data.queueCounts : undefined) ?? emptyQueue
	);

	let currentPage = $state(1);
	const itemsPerPage = 10;
	const paginatedRequests = $derived(
		requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	$effect(() => {
		if (requests.length >= 0) {
			currentPage = 1;
		}
	});

	function exportHref(): string {
		const params = new SvelteURLSearchParams();
		if (filter.status) params.set("status", filter.status);
		if (filter.q) params.set("q", filter.q);
		if (filter.changeCategory) params.set("changeCategory", filter.changeCategory);
		if (filter.itSystemId) params.set("itSystemId", String(filter.itSystemId));
		if (filter.exceptionTypeId) {
			params.set("exceptionTypeId", String(filter.exceptionTypeId));
		}
		params.set("export", "csv");
		return resolve(`/change-requests?${params.toString()}` as "/");
	}
</script>

<svelte:head>
	<title>{data.pageTitle} — ONE-IL</title>
</svelte:head>

<div class="flex flex-col gap-6 p-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{data.pageTitle}</h1>
			<p class="text-muted-foreground text-sm">
				{requests.length} รายการ
				{#if queueCounts.supervisorPending > 0 || queueCounts.itPending > 0}
					· รอผู้บังคับบัญชา {queueCounts.supervisorPending} · รอ IT {queueCounts.itPending}
				{/if}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if queueCounts.supervisorPending > 0 || queueCounts.itPending > 0}
				<Button href={resolve("/change-requests/approvals" as "/")} variant="outline">
					<InboxIcon data-icon="inline-start" />
					คิวอนุมัติ
				</Button>
			{/if}
			{#if "canExport" in data && data.canExport}
				<Button href={exportHref()} variant="outline">
					<DownloadIcon data-icon="inline-start" />
					ส่งออก CSV
				</Button>
				<Button
					href={resolve("/admin/audit-logs?entityType=system_change_request" as "/")}
					variant="outline"
				>
					ประวัติ SCR
				</Button>
			{/if}
			<Button href={resolve("/change-requests/new" as "/")} variant="default">
				<PlusIcon data-icon="inline-start" />
				ยื่นคำขอเปลี่ยนแปลงระบบ
			</Button>
		</div>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<SearchIcon class="size-4 shrink-0" />
				ค้นหาและตัวกรอง
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="GET" class="flex flex-col gap-4">
				<div class="flex flex-wrap items-end gap-3">
					<div class="flex min-w-40 flex-col gap-1.5">
						<Label for="status">สถานะ</Label>
						<NativeSelect id="status" name="status" value={filter.status}>
							<option value="">ทุกสถานะ</option>
							{#if "statusOptions" in data}
								{#each data.statusOptions as opt (opt.value)}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							{/if}
						</NativeSelect>
					</div>
					<div class="flex min-w-40 flex-col gap-1.5">
						<Label for="changeCategory">หมวด CIS</Label>
						<NativeSelect id="changeCategory" name="changeCategory" value={filter.changeCategory}>
							<option value="">ทุกหมวด</option>
							{#if "categoryOptions" in data}
								{#each data.categoryOptions as opt (opt.value)}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							{/if}
						</NativeSelect>
					</div>
					<div class="flex min-w-40 flex-col gap-1.5">
						<Label for="itSystemId">ระบบ</Label>
						<NativeSelect
							id="itSystemId"
							name="itSystemId"
							value={filter.itSystemId ? String(filter.itSystemId) : ""}
						>
							<option value="">ทุกระบบ</option>
							{#if "itSystems" in data}
								{#each data.itSystems as sys (sys.id)}
									<option value={String(sys.id)}>{sys.nameTh}</option>
								{/each}
							{/if}
						</NativeSelect>
					</div>
					<div class="flex min-w-40 flex-col gap-1.5">
						<Label for="exceptionTypeId">ประเภทข้อยกเว้น</Label>
						<NativeSelect
							id="exceptionTypeId"
							name="exceptionTypeId"
							value={filter.exceptionTypeId ? String(filter.exceptionTypeId) : ""}
						>
							<option value="">ทุกประเภท</option>
							{#if "exceptionTypes" in data}
								{#each data.exceptionTypes as et (et.id)}
									<option value={String(et.id)}>{et.nameTh}</option>
								{/each}
							{/if}
						</NativeSelect>
					</div>
					<div class="flex min-w-48 flex-1 flex-col gap-1.5">
						<Label for="q">ค้นหา</Label>
						<Input
							id="q"
							name="q"
							type="search"
							placeholder="เลขที่ หัวข้อ ระบบ ชื่อ"
							value={filter.q}
						/>
					</div>
				</div>
				<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
					<Button variant="outline" type="button" href={resolve("/change-requests" as "/")}>
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

	<Card.Root class="overflow-hidden">
		<Card.Content class="overflow-x-auto p-0">
			<Table.Root class="min-w-[800px]">
				<Table.Header>
					<Table.Row>
						<Table.Head>เลขที่</Table.Head>
						{#if "viewAll" in data && data.viewAll}
							<Table.Head>ผู้ยื่น</Table.Head>
						{/if}
						<Table.Head>หัวข้อ</Table.Head>
						<Table.Head>ระบบ</Table.Head>
						<Table.Head>หมวด</Table.Head>
						<Table.Head>ช่วงข้อยกเว้น</Table.Head>
						<Table.Head>สถานะ</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each paginatedRequests as row (row.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs">
								<a
									href={resolve(`/change-requests/${row.id}` as "/")}
									class="text-primary hover:underline"
								>
									{row.requestNumber}
								</a>
							</Table.Cell>
							{#if "viewAll" in data && data.viewAll}
								<Table.Cell>
									{row.requesterName}
									{#if row.requesterEmployeeCode}
										<span class="text-muted-foreground block text-xs"
											>{row.requesterEmployeeCode}</span
										>
									{/if}
								</Table.Cell>
							{/if}
							<Table.Cell>{row.title}</Table.Cell>
							<Table.Cell>{row.itSystemName}</Table.Cell>
							<Table.Cell>{labelChangeCategory(row.changeCategory)}</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								{row.exceptionStartDate}
								{#if row.exceptionEndDate !== row.exceptionStartDate}
									– {row.exceptionEndDate}
								{/if}
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary" class="font-normal">
									{labelScrStatus(row.status)}
								</Badge>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell
								colspan={"viewAll" in data && data.viewAll ? 7 : 6}
								class="text-muted-foreground py-8 text-center"
							>
								ยังไม่มีคำขอ — กด「ยื่นคำขอเปลี่ยนแปลงระบบ」เพื่อสร้างรายการแรก
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>

			{#if requests.length > 0}
				<DataTablePagination
					bind:currentPage
					pageSize={itemsPerPage}
					totalItems={requests.length}
					locale="th"
				/>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
