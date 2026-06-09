<script lang="ts">
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

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

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	const startItem = $derived(totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0);
	const endItem = $derived(Math.min(currentPage * pageSize, totalItems));

	const pageNumbers = $derived.by(() => {
		const numbers: (number | string)[] = [];
		const delta = 1; // number of pages to show before and after current page

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
			if (val === "...") {
				return arr.indexOf("...") === idx;
			}
			return true;
		});
	});
</script>

<div class="bg-muted/20 flex items-center justify-between border-t p-4">
	<div class="flex flex-1 justify-between sm:hidden">
		<button
			type="button"
			disabled={currentPage <= 1}
			onclick={() => (currentPage = Math.max(1, currentPage - 1))}
			class="border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
		>
			<ChevronLeftIcon class="size-4 shrink-0" />
			{copy.prev}
		</button>
		<button
			type="button"
			disabled={currentPage >= totalPages}
			onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
			class="border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
		>
			{copy.next}
			<ChevronRightIcon class="size-4 shrink-0" />
		</button>
	</div>
	<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
		<div>
			<p class="text-muted-foreground text-xs">
				{#if totalItems > 0}
					{copy.showing} <span class="text-foreground font-semibold">{startItem}</span>
					{copy.to} <span class="text-foreground font-semibold">{endItem}</span>
					{copy.of} <span class="text-foreground font-semibold">{totalItems}</span>
					{copy.items}
				{:else}
					{copy.noResults}
				{/if}
			</p>
		</div>
		<div>
			<nav class="isolate inline-flex -space-x-px rounded-md" aria-label="Pagination">
				<button
					type="button"
					disabled={currentPage <= 1}
					onclick={() => (currentPage = Math.max(1, currentPage - 1))}
					class="border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] rounded-r-none border bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
				>
					<ChevronLeftIcon class="size-4 shrink-0" />
					{copy.prev}
				</button>
				{#each pageNumbers as page (page)}
					{#if page === "..."}
						<span
							class="border-border bg-background dark:bg-input/30 dark:border-input text-muted-foreground inline-flex h-7 shrink-0 items-center justify-center rounded-none border border-l-0 px-2.5 text-[0.8rem] whitespace-nowrap select-none"
						>
							...
						</span>
					{:else}
						<button
							type="button"
							onclick={() => (currentPage = Number(page))}
							class={page === currentPage
								? "inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-none border border-l-0 border-transparent bg-sky-500 bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap text-white transition-all outline-none select-none hover:bg-sky-600"
								: "border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-none border border-l-0 bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none"}
						>
							{page}
						</button>
					{/if}
				{/each}
				<button
					type="button"
					disabled={currentPage >= totalPages}
					onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
					class="border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] rounded-l-none border border-l-0 bg-clip-padding px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
				>
					{copy.next}
					<ChevronRightIcon class="size-4 shrink-0" />
				</button>
			</nav>
		</div>
	</div>
</div>
