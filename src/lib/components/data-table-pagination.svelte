<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ChevronsLeftIcon from "@lucide/svelte/icons/chevrons-left";
	import ChevronsRightIcon from "@lucide/svelte/icons/chevrons-right";

	let {
		totalItems = 0,
		pageSize = $bindable(10),
		currentPage = $bindable(1),
		locale = "en",
	}: {
		totalItems: number;
		pageSize: number;
		currentPage: number;
		locale?: "en" | "th";
	} = $props();
	const copy = $derived.by(() =>
		locale === "th"
			? {
					showing: "แสดง",
					of: "จาก",
					noResults: "ไม่พบผลลัพธ์",
					rows: "แถว",
					firstPage: "หน้าแรก",
					previousPage: "หน้าก่อนหน้า",
					nextPage: "หน้าถัดไป",
					lastPage: "หน้าสุดท้าย",
				}
			: {
					showing: "Showing",
					of: "of",
					noResults: "No results",
					rows: "Rows",
					firstPage: "First page",
					previousPage: "Previous page",
					nextPage: "Next page",
					lastPage: "Last page",
				}
	);

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	const startItem = $derived((currentPage - 1) * pageSize + 1);
	const endItem = $derived(Math.min(currentPage * pageSize, totalItems));

	function goToPage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages));
	}

	const pageSizes = ["10", "25", "50"];
</script>

<div class="flex items-center justify-between px-2 py-4">
	<div class="text-muted-foreground text-sm">
		{#if totalItems > 0}
			{copy.showing} {startItem}–{endItem} {copy.of} {totalItems}
		{:else}
			{copy.noResults}
		{/if}
	</div>
	<div class="flex items-center gap-4">
		<div class="flex items-center gap-2">
			<span class="text-muted-foreground text-sm">{copy.rows}</span>
			<Select.Root
				type="single"
				value={String(pageSize)}
				onValueChange={(v) => {
					if (v) {
						pageSize = Number(v);
						currentPage = 1;
					}
				}}
			>
				<Select.Trigger class="h-8 w-16">
					<span>{pageSize}</span>
				</Select.Trigger>
				<Select.Content>
					{#each pageSizes as size (size)}
						<Select.Item value={size}>{size}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="flex items-center gap-1">
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage <= 1}
				onclick={() => goToPage(1)}
			>
				<ChevronsLeftIcon class="size-4" />
				<span class="sr-only">{copy.firstPage}</span>
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
			>
				<ChevronLeftIcon class="size-4" />
				<span class="sr-only">{copy.previousPage}</span>
			</Button>
			<span class="text-muted-foreground px-2 text-sm">
				{currentPage} / {totalPages}
			</span>
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(currentPage + 1)}
			>
				<ChevronRightIcon class="size-4" />
				<span class="sr-only">{copy.nextPage}</span>
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="size-8"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(totalPages)}
			>
				<ChevronsRightIcon class="size-4" />
				<span class="sr-only">{copy.lastPage}</span>
			</Button>
		</div>
	</div>
</div>
