<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { labelChangeCategory, labelScrStatus } from "$lib/change-request/labels.js";
	import type { PageData } from "./$types";
	import { resolve } from "$app/paths";

	let { data }: { data: PageData } = $props();

	let currentPage = $state(1);
	const pageSize = 10;
	const totalPages = $derived(Math.ceil(data.items.length / pageSize));
	const paginatedItems = $derived(
		data.items.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	$effect(() => {
		if (data.activeTab !== undefined) {
			currentPage = 1;
		}
	});
</script>

<svelte:head>
	<title>{data.pageTitle} — ONE-IL</title>
</svelte:head>

<div class="flex flex-col gap-6 p-6">
	<!-- Page Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">{data.pageTitle}</h1>
			<p class="text-muted-foreground text-sm">{data.items.length} รายการในคิว</p>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<nav class="flex flex-wrap gap-2">
		<Button
			variant={data.activeTab === "supervisor" ? "default" : "outline"}
			size="sm"
			href="/change-requests/approvals?tab=supervisor"
		>
			หัวหน้างาน
		</Button>
		{#if data.canItTab}
			<Button
				variant={data.activeTab === "it" ? "default" : "outline"}
				size="sm"
				href="/change-requests/approvals?tab=it"
			>
				IT
			</Button>
		{/if}
	</nav>

	<!-- Data Table (Flat Bordered) -->
	<div class="bg-card overflow-x-auto rounded-lg border shadow-sm">
		{#if data.items.length === 0}
			<p class="text-muted-foreground px-4 py-8 text-center text-sm">ไม่มีรายการในคิวนี้</p>
		{:else}
			<table class="w-full min-w-[720px] text-sm">
				<thead>
					<tr class="bg-muted/40 border-b text-left">
						<th class="px-4 py-2 font-medium">เลขที่</th>
						<th class="px-4 py-2 font-medium">ผู้ยื่น</th>
						<th class="px-4 py-2 font-medium">หัวข้อ</th>
						<th class="px-4 py-2 font-medium">ระบบ</th>
						<th class="px-4 py-2 font-medium">หมวด</th>
						<th class="px-4 py-2 font-medium">ช่วงข้อยกเว้น</th>
						<th class="px-4 py-2 font-medium">สถานะ</th>
					</tr>
				</thead>
				<tbody>
					{#each paginatedItems as row (row.id)}
						<tr class="hover:bg-muted/30 border-b last:border-0">
							<td class="px-4 py-3 font-mono text-xs">
								<a
									href={resolve(`/change-requests/${row.id}` as "/")}
									class="text-primary hover:underline"
								>
									{row.requestNumber}
								</a>
							</td>
							<td class="px-4 py-3">
								{row.requesterName}
								{#if row.requesterEmployeeCode}
									<span class="text-muted-foreground block text-xs"
										>{row.requesterEmployeeCode}</span
									>
								{/if}
							</td>
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
					{/each}
				</tbody>
			</table>
			{#if totalPages > 1}
				<div class="bg-muted/20 flex justify-center gap-1.5 border-t p-4">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === 1}
						onclick={() => (currentPage -= 1)}
					>
						ก่อนหน้า
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === totalPages}
						onclick={() => (currentPage += 1)}
					>
						ถัดไป
					</Button>
				</div>
			{/if}
		{/if}
	</div>
</div>
