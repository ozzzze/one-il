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
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { resolve } from "$app/paths";

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

			<Button href={resolve("/change-requests/new" as "/")} variant="default">
				<PlusIcon data-icon="inline-start" />
				ยื่นคำขอเปลี่ยนแปลงระบบ
			</Button>
		</div>
	</div>

	<form method="GET" class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<div class="flex min-w-0 flex-1 flex-col gap-1.5">
			<div class="relative">
				<SearchIcon
					class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
				/>
				<Input
					id="q"
					name="q"
					type="search"
					placeholder="เลขที่ หัวข้อ ระบบ ชื่อ"
					class="pl-9"
					value={filter.q}
				/>
			</div>
		</div>

		<div class="flex w-full min-w-0 flex-col gap-1.5 sm:w-44">
			<NativeSelect id="status" name="status" value={filter.status} class="py-1 leading-normal">
				<option value="">ทุกสถานะ</option>
				{#if "statusOptions" in data}
					{#each data.statusOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				{/if}
			</NativeSelect>
		</div>

		<div class="flex w-full min-w-0 flex-col gap-1.5 sm:w-44">
			<NativeSelect id="changeCategory" name="changeCategory" value={filter.changeCategory} class="py-1 leading-normal">
				<option value="">ทุกหมวด</option>
				{#if "categoryOptions" in data}
					{#each data.categoryOptions as opt (opt.value)}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				{/if}
			</NativeSelect>
		</div>

		<div class="flex w-full min-w-0 flex-col gap-1.5 sm:w-44">
			<NativeSelect
				id="itSystemId"
				name="itSystemId"
				value={filter.itSystemId ? String(filter.itSystemId) : ""}
				class="py-1 leading-normal"
			>
				<option value="">ทุกระบบ</option>
				{#if "itSystems" in data}
					{#each data.itSystems as sys (sys.id)}
						<option value={String(sys.id)}>{sys.nameTh}</option>
					{/each}
				{/if}
			</NativeSelect>
		</div>

		<div class="flex w-full min-w-0 flex-col gap-1.5 sm:w-44">
			<NativeSelect
				id="exceptionTypeId"
				name="exceptionTypeId"
				value={filter.exceptionTypeId ? String(filter.exceptionTypeId) : ""}
				class="py-1 leading-normal"
			>
				<option value="">ทุกประเภท</option>
				{#if "exceptionTypes" in data}
					{#each data.exceptionTypes as et (et.id)}
						<option value={String(et.id)}>{et.nameTh}</option>
					{/each}
				{/if}
			</NativeSelect>
		</div>

		<div class="flex flex-col gap-2 sm:flex-row">
			<Button variant="outline" type="button" href={resolve("/change-requests" as "/")} class="h-9 px-3" title="ล้างตัวกรอง">
				<RotateCcwIcon class="size-4" />
				<span class="sr-only sm:not-sr-only">ล้าง</span>
			</Button>
			<Button type="submit" variant="outline" class="h-9 px-3">
				<SearchIcon class="size-4" />
				<span class="sr-only sm:not-sr-only">ค้นหา</span>
			</Button>
		</div>
	</form>

	<div class="bg-card overflow-hidden rounded-lg border shadow-sm">
		<Table.Root class="min-w-[960px]">
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
	</div>
</div>
