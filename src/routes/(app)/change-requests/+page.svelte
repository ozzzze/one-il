<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { labelChangeCategory, labelScrStatus } from '$lib/change-request/labels.js';
	import type {
		ChangeRequestListFilter,
		ScrQueueCounts
	} from '$lib/server/one-leave/change-request/types.js';
	import type { PageData } from './$types';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	let { data }: { data: PageData } = $props();

	const emptyFilter: ChangeRequestListFilter = {
		status: '',
		q: '',
		changeCategory: '',
		itSystemId: null,
		exceptionTypeId: null
	};
	const emptyQueue: ScrQueueCounts = { supervisorPending: 0, itPending: 0 };

	const requests = $derived('requests' in data ? (data.requests ?? []) : []);
	const filter = $derived(('filter' in data ? data.filter : undefined) ?? emptyFilter);
	const queueCounts = $derived(
		('queueCounts' in data ? data.queueCounts : undefined) ?? emptyQueue
	);

	let currentPage = $state(1);
	const itemsPerPage = 10;
	const totalPages = $derived(Math.ceil(requests.length / itemsPerPage));
	const paginatedRequests = $derived(
		requests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);
	const startItem = $derived(requests.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
	const endItem = $derived(Math.min(currentPage * itemsPerPage, requests.length));

	$effect(() => {
		if (requests.length >= 0) {
			currentPage = 1;
		}
	});

	function exportHref(): string {
		const params = new SvelteURLSearchParams();
		if (filter.status) params.set('status', filter.status);
		if (filter.q) params.set('q', filter.q);
		if (filter.changeCategory) params.set('changeCategory', filter.changeCategory);
		if (filter.itSystemId) params.set('itSystemId', String(filter.itSystemId));
		if (filter.exceptionTypeId) {
			params.set('exceptionTypeId', String(filter.exceptionTypeId));
		}
		params.set('export', 'csv');
		return resolve(`/change-requests?${params.toString()}` as '/');
	}
</script>

<svelte:head>
	<title>{data.pageTitle} — ONE-IL</title>
</svelte:head>

<div class="flex flex-col gap-6 p-6">
	<!-- Page Header -->
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
				<Button href={resolve('/change-requests/approvals' as '/')} variant="outline">
					<InboxIcon class="mr-2 size-4" />
					คิวอนุมัติ
				</Button>
			{/if}
			{#if 'canExport' in data && data.canExport}
				<Button href={exportHref()} variant="outline">
					<DownloadIcon class="mr-2 size-4" />
					ส่งออก CSV
				</Button>
			{/if}
			<Button href={resolve('/change-requests/new' as '/')} variant="default">
				<PlusIcon class="mr-2 size-4" />
				ยื่นคำขอเปลี่ยนแปลงระบบ
			</Button>
		</div>
	</div>

	<!-- Search & Filters (Flat Panel) -->
	<div class="rounded-lg border bg-card p-4 shadow-sm">
		<form method="GET" class="flex flex-col gap-4">
			<div class="flex flex-wrap items-end gap-3">
				<div class="flex min-w-[160px] flex-col gap-1.5">
					<Label for="status">สถานะ</Label>
					<select
						id="status"
						name="status"
						class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
					>
						<option value="" selected={filter.status === ''}>ทุกสถานะ</option>
						{#if 'statusOptions' in data}
							{#each data.statusOptions as opt (opt.value)}
								<option value={opt.value} selected={filter.status === opt.value}>
									{opt.label}
								</option>
							{/each}
						{/if}
					</select>
				</div>
				<div class="flex min-w-[160px] flex-col gap-1.5">
					<Label for="changeCategory">หมวด CIS</Label>
					<select
						id="changeCategory"
						name="changeCategory"
						class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
					>
						<option value="" selected={filter.changeCategory === ''}>ทุกหมวด</option>
						{#if 'categoryOptions' in data}
							{#each data.categoryOptions as opt (opt.value)}
								<option value={opt.value} selected={filter.changeCategory === opt.value}>
									{opt.label}
								</option>
							{/each}
						{/if}
					</select>
				</div>
				<div class="flex min-w-[160px] flex-col gap-1.5">
					<Label for="itSystemId">ระบบ</Label>
					<select
						id="itSystemId"
						name="itSystemId"
						class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
					>
						<option value="" selected={filter.itSystemId === null}>ทุกระบบ</option>
						{#if 'itSystems' in data}
							{#each data.itSystems as sys (sys.id)}
								<option value={String(sys.id)} selected={filter.itSystemId === sys.id}>
									{sys.nameTh}
								</option>
							{/each}
						{/if}
					</select>
				</div>
				<div class="flex min-w-[160px] flex-col gap-1.5">
					<Label for="exceptionTypeId">ประเภทข้อยกเว้น</Label>
					<select
						id="exceptionTypeId"
						name="exceptionTypeId"
						class="border-input bg-background h-8 rounded-lg border px-2.5 text-sm"
					>
						<option value="" selected={filter.exceptionTypeId === null}>ทุกประเภท</option>
						{#if 'exceptionTypes' in data}
							{#each data.exceptionTypes as et (et.id)}
								<option value={String(et.id)} selected={filter.exceptionTypeId === et.id}>
									{et.nameTh}
								</option>
							{/each}
						{/if}
					</select>
				</div>
				<div class="flex min-w-[192px] flex-1 flex-col gap-1.5">
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
				<Button variant="outline" type="button" href={resolve('/change-requests' as '/')}>
					<RotateCcwIcon class="mr-2 size-4" />
					ล้างตัวกรอง
				</Button>
				<Button type="submit" variant="secondary">
					<SearchIcon class="mr-2 size-4" />
					ค้นหา
				</Button>
			</div>
		</form>
	</div>

	<!-- Data Table (Flat Bordered) -->
	<div class="rounded-lg border bg-card overflow-x-auto shadow-sm">
		<table class="w-full min-w-[800px] text-sm">
			<thead>
				<tr class="border-b bg-muted/50 text-left">
					<th class="px-4 py-3 font-medium">เลขที่</th>
					{#if 'viewAll' in data && data.viewAll}
						<th class="px-4 py-3 font-medium">ผู้ยื่น</th>
					{/if}
					<th class="px-4 py-3 font-medium">หัวข้อ</th>
					<th class="px-4 py-3 font-medium">ระบบ</th>
					<th class="px-4 py-3 font-medium">หมวด</th>
					<th class="px-4 py-3 font-medium">ช่วงข้อยกเว้น</th>
					<th class="px-4 py-3 font-medium">สถานะ</th>
				</tr>
			</thead>
			<tbody>
				{#each paginatedRequests as row (row.id)}
					<tr class="border-b last:border-0 hover:bg-muted/30">
						<td class="px-4 py-3 font-mono text-xs">
							<a
								href={resolve(`/change-requests/${row.id}` as '/')}
								class="text-primary hover:underline"
							>
								{row.requestNumber}
							</a>
						</td>
						{#if 'viewAll' in data && data.viewAll}
							<td class="px-4 py-3">
								{row.requesterName}
								{#if row.requesterEmployeeCode}
									<span class="text-muted-foreground block text-xs"
										>{row.requesterEmployeeCode}</span
									>
								{/if}
							</td>
						{/if}
						<td class="px-4 py-3">{row.title}</td>
						<td class="px-4 py-3">{row.itSystemName}</td>
						<td class="px-4 py-3">{labelChangeCategory(row.changeCategory)}</td>
						<td class="px-4 py-3 whitespace-nowrap">
							{row.exceptionStartDate}
							{#if row.exceptionEndDate !== row.exceptionStartDate}
								– {row.exceptionEndDate}
							{/if}
						</td>
						<td class="px-4 py-3">
							<Badge variant="secondary" class="font-normal">
								{labelScrStatus(row.status)}
							</Badge>
						</td>
					</tr>
				{:else}
					<tr>
						<td
							colspan={'viewAll' in data && data.viewAll ? 7 : 6}
							class="text-muted-foreground px-4 py-8 text-center"
						>
							ยังไม่มีคำขอ — กด「ยื่นคำขอเปลี่ยนแปลงระบบ」เพื่อสร้างรายการแรก
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		{#if totalPages > 1}
			<div class="flex items-center justify-between border-t p-4 bg-muted/20">
				<div class="flex flex-1 justify-between sm:hidden">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === 1}
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					>
						<ChevronLeftIcon class="mr-2 size-4 shrink-0" />
						ก่อนหน้า
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === totalPages}
						onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					>
						ถัดไป
						<ChevronRightIcon class="ml-2 size-4 shrink-0" />
					</Button>
				</div>
				<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
					<div>
						<p class="text-muted-foreground text-xs">
							แสดงรายการที่ <span class="font-semibold text-foreground">{startItem}</span> ถึง
							<span class="font-semibold text-foreground">{endItem}</span> จากทั้งหมด
							<span class="font-semibold text-foreground">{requests.length}</span> รายการ
							{#if requests.length === 50}
								<span class="text-muted-foreground/80"> (สูงสุด 50 รายการล่าสุด)</span>
							{/if}
						</p>
					</div>
					<div>
						<nav class="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
							<Button
								variant="outline"
								size="sm"
								class="rounded-r-none"
								disabled={currentPage === 1}
								onclick={() => (currentPage = Math.max(1, currentPage - 1))}
							>
								<ChevronLeftIcon class="mr-1 size-4 shrink-0" />
								ก่อนหน้า
							</Button>
							{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page (page)}
								<Button
									variant={currentPage === page ? 'secondary' : 'outline'}
									size="sm"
									class="rounded-none border-l-0"
									onclick={() => (currentPage = page)}
								>
									{page}
								</Button>
							{/each}
							<Button
								variant="outline"
								size="sm"
								class="rounded-l-none border-l-0"
								disabled={currentPage === totalPages}
								onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
							>
								ถัดไป
								<ChevronRightIcon class="ml-1 size-4 shrink-0" />
							</Button>
						</nav>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
