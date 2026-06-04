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
			if (
				i === 1 ||
				i === totalPages ||
				(i >= currentPage - delta && i <= currentPage + delta)
			) {
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

<div class="flex items-center justify-between border-t p-4 bg-muted/20">
	<div class="flex flex-1 justify-between sm:hidden">
		<button
			type="button"
			disabled={currentPage <= 1}
			onclick={() => currentPage = Math.max(1, currentPage - 1)}
			class="border bg-clip-padding font-medium border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
		>
			<ChevronLeftIcon class="size-4 shrink-0" />
			{copy.prev}
		</button>
		<button
			type="button"
			disabled={currentPage >= totalPages}
			onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
			class="border bg-clip-padding font-medium border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
		>
			{copy.next}
			<ChevronRightIcon class="size-4 shrink-0" />
		</button>
	</div>
	<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
		<div>
			<p class="text-muted-foreground text-xs">
				{#if totalItems > 0}
					{copy.showing} <span class="font-semibold text-foreground">{startItem}</span> {copy.to} <span class="font-semibold text-foreground">{endItem}</span> {copy.of} <span class="font-semibold text-foreground">{totalItems}</span> {copy.items}
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
					onclick={() => currentPage = Math.max(1, currentPage - 1)}
					class="border bg-clip-padding font-medium border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-7 gap-1 rounded-[min(var(--radius-md),12px)] rounded-r-none px-2.5 text-[0.8rem] inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
				>
					<ChevronLeftIcon class="size-4 shrink-0" />
					{copy.prev}
				</button>
				{#each pageNumbers as page (page)}
					{#if page === "..."}
						<span class="border border-border bg-background dark:bg-input/30 dark:border-input h-7 px-2.5 text-[0.8rem] text-muted-foreground inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none rounded-none border-l-0">
							...
						</span>
					{:else}
						<button
							type="button"
							onclick={() => currentPage = Number(page)}
							class={page === currentPage
								? "border border-transparent bg-clip-padding font-medium bg-sky-500 text-white hover:bg-sky-600 h-7 gap-1 px-2.5 text-[0.8rem] inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none rounded-none border-l-0"
								: "border bg-clip-padding font-medium border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-7 gap-1 px-2.5 text-[0.8rem] inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none rounded-none border-l-0"
							}
						>
							{page}
						</button>
					{/if}
				{/each}
				<button
					type="button"
					disabled={currentPage >= totalPages}
					onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
					class="border bg-clip-padding font-medium border-border bg-background hover:bg-muted text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-7 gap-1 rounded-[min(var(--radius-md),12px)] rounded-l-none border-l-0 px-2.5 text-[0.8rem] inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50"
				>
					{copy.next}
					<ChevronRightIcon class="size-4 shrink-0" />
				</button>
			</nav>
		</div>
	</div>
</div>
