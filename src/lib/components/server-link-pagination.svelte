<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

	let {
		currentPage,
		totalPages,
		totalItems,
		pageSize,
		pageHref,
		locale = "th",
	}: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		pageSize: number;
		pageHref: (page: number) => string;
		locale?: "en" | "th";
	} = $props();

	const copy = $derived.by(() =>
		locale === "th"
			? {
					showing: "แสดงรายการที่",
					to: "ถึง",
					of: "จากทั้งหมด",
					items: "รายการ",
					prev: "ก่อนหน้า",
					next: "ถัดไป",
					noResults: "ไม่พบผลลัพธ์",
				}
			: {
					showing: "Showing",
					to: "to",
					of: "of",
					items: "items",
					prev: "Previous",
					next: "Next",
					noResults: "No results",
				}
	);

	const startItem = $derived(totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0);
	const endItem = $derived(Math.min(currentPage * pageSize, totalItems));

	const pageNumbers = $derived.by(() => {
		const numbers: (number | string)[] = [];
		const delta = 1;

		for (let i = 1; i <= totalPages; i++) {
			if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
				numbers.push(i);
			} else if (
				(i === currentPage - delta - 1 && i > 1) ||
				(i === currentPage + delta + 1 && i < totalPages)
			) {
				numbers.push("...");
			}
		}

		return numbers.filter((val, idx, arr) => {
			if (val === "...") return arr.indexOf("...") === idx;
			return true;
		});
	});
</script>

{#if totalItems > 0}
	<div class="bg-muted/20 flex items-center justify-between border-t p-4">
		<div class="flex flex-1 justify-between sm:hidden">
			<Button
				variant="outline"
				size="sm"
				href={pageHref(Math.max(1, currentPage - 1))}
				disabled={currentPage <= 1}
			>
				<ChevronLeftIcon data-icon="inline-start" />
				{copy.prev}
			</Button>
			<Button
				variant="outline"
				size="sm"
				href={pageHref(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage >= totalPages}
			>
				{copy.next}
				<ChevronRightIcon data-icon="inline-end" />
			</Button>
		</div>
		<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
			<div>
				<p class="text-muted-foreground text-xs">
					{copy.showing}
					<span class="text-foreground font-semibold">{startItem}</span>
					{copy.to}
					<span class="text-foreground font-semibold">{endItem}</span>
					{copy.of}
					<span class="text-foreground font-semibold">{totalItems}</span>
					{copy.items}
				</p>
			</div>
			{#if totalPages > 1}
				<nav class="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
					<Button
						variant="outline"
						size="sm"
						class="rounded-r-none"
						href={pageHref(currentPage - 1)}
						disabled={currentPage <= 1}
					>
						<ChevronLeftIcon data-icon="inline-start" />
						{copy.prev}
					</Button>
					{#each pageNumbers as page, i (page === "..." ? `ellipsis-${i}` : page)}
						{#if page === "..."}
							<span
								class="border-border bg-background text-muted-foreground inline-flex h-8 shrink-0 items-center justify-center rounded-none border border-l-0 px-2.5 text-sm whitespace-nowrap select-none"
							>
								...
							</span>
						{:else}
							<Button
								variant={currentPage === page ? "secondary" : "outline"}
								size="sm"
								class="rounded-none border-l-0"
								href={pageHref(Number(page))}
							>
								{page}
							</Button>
						{/if}
					{/each}
					<Button
						variant="outline"
						size="sm"
						class="rounded-l-none border-l-0"
						href={pageHref(currentPage + 1)}
						disabled={currentPage >= totalPages}
					>
						{copy.next}
						<ChevronRightIcon data-icon="inline-end" />
					</Button>
				</nav>
			{/if}
		</div>
	</div>
{/if}
