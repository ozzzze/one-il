<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import { labelChangeCategory, labelScrStatus } from "$lib/change-request/labels.js";
	import type { PageData } from "./$types";
	import { resolve } from "$app/paths";

	let { data }: { data: PageData } = $props();

	let currentPage = $state(1);
	const pageSize = 10;
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
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{data.pageTitle}</h1>
			<p class="text-muted-foreground text-sm">{data.items.length} รายการในคิว</p>
		</div>
	</div>

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

	<Card.Root class="overflow-hidden">
		<Card.Content class="overflow-x-auto p-0">
			{#if data.items.length === 0}
				<p class="text-muted-foreground px-4 py-8 text-center text-sm">ไม่มีรายการในคิวนี้</p>
			{:else}
				<Table.Root class="min-w-[720px]">
					<Table.Header>
						<Table.Row>
							<Table.Head>เลขที่</Table.Head>
							<Table.Head>ผู้ยื่น</Table.Head>
							<Table.Head>หัวข้อ</Table.Head>
							<Table.Head>ระบบ</Table.Head>
							<Table.Head>หมวด</Table.Head>
							<Table.Head>ช่วงข้อยกเว้น</Table.Head>
							<Table.Head>สถานะ</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each paginatedItems as row (row.id)}
							<Table.Row>
								<Table.Cell class="font-mono text-xs">
									<a
										href={resolve(`/change-requests/${row.id}` as "/")}
										class="text-primary hover:underline"
									>
										{row.requestNumber}
									</a>
								</Table.Cell>
								<Table.Cell>
									{row.requesterName}
									{#if row.requesterEmployeeCode}
										<span class="text-muted-foreground block text-xs"
											>{row.requesterEmployeeCode}</span
										>
									{/if}
								</Table.Cell>
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
						{/each}
					</Table.Body>
				</Table.Root>

				<DataTablePagination
					bind:currentPage
					{pageSize}
					totalItems={data.items.length}
					locale="th"
				/>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
