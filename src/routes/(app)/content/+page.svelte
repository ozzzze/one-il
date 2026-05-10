<script lang="ts">
	import * as Table from "$lib/components/ui/table/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import DataTablePagination from "$lib/components/data-table-pagination.svelte";
	import DeleteConfirmDialog from "$lib/components/delete-confirm-dialog.svelte";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash-2";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import SearchIcon from "@lucide/svelte/icons/search";
	import ArrowUpDownIcon from "@lucide/svelte/icons/arrow-up-down";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { exportToCSV, exportToJSON } from "$lib/utils/export.js";

	let { data, form } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					done: "เสร็จสิ้น",
					pageTitle: "เนื้อหา - ONE-IL",
					title: "เนื้อหา",
					description: "สร้างและจัดการเนื้อหาในแพลตฟอร์ม",
					newPage: "สร้างหน้าใหม่",
					searchPages: "ค้นหาหน้า...",
					pages: "หน้า",
					delete: "ลบ",
					export: "ส่งออก",
					exportCsv: "ส่งออกเป็น CSV",
					exportJson: "ส่งออกเป็น JSON",
					columns: {
						title: "ชื่อเรื่อง",
						slug: "สลัก",
						status: "สถานะ",
						template: "เทมเพลต",
						author: "ผู้เขียน",
						updated: "อัปเดต",
						actions: "การกระทำ",
					},
					unknown: "ไม่ทราบ",
					noSearchMatch: "ไม่พบหน้าที่ตรงกับคำค้น",
					noPages: "ยังไม่มีหน้า",
					deletePage: "ลบหน้า",
				}
			: {
					done: "Done",
					pageTitle: "Content - ONE-IL",
					title: "Content",
					description: "Create and manage your platform content.",
					newPage: "New Page",
					searchPages: "Search pages...",
					pages: "page",
					delete: "Delete",
					export: "Export",
					exportCsv: "Export as CSV",
					exportJson: "Export as JSON",
					columns: {
						title: "Title",
						slug: "Slug",
						status: "Status",
						template: "Template",
						author: "Author",
						updated: "Updated",
						actions: "Actions",
					},
					unknown: "Unknown",
					noSearchMatch: "No pages match your search.",
					noPages: "No pages yet.",
					deletePage: "page",
				}
	);

	let search = $state("");
	let deleteOpen = $state(false);
	let deleteId = $state("");
	let sortKey = $state<string>("title");
	let sortDir = $state<"asc" | "desc">("asc");
	let pageSize = $state(10);
	let currentPage = $state(1);
	let selectedIds = $state(new Set<string>());

	const filtered = $derived(
		data.pages.filter(
			(p) =>
				p.title.toLowerCase().includes(search.toLowerCase()) ||
				p.slug.toLowerCase().includes(search.toLowerCase())
		)
	);

	const sorted = $derived(() => {
		const arr = [...filtered];
		arr.sort((a, b) => {
			const aVal = String((a as Record<string, unknown>)[sortKey] ?? "");
			const bVal = String((b as Record<string, unknown>)[sortKey] ?? "");
			const cmp = aVal.localeCompare(bVal);
			return sortDir === "asc" ? cmp : -cmp;
		});
		return arr;
	});

	const paginated = $derived(sorted().slice((currentPage - 1) * pageSize, currentPage * pageSize));

	$effect(() => {
		search;
		currentPage = 1;
	});

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) {
			toast.success(copy.done);
			selectedIds = new Set();
		}
	});

	function toggleSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === "asc" ? "desc" : "asc";
		} else {
			sortKey = key;
			sortDir = "asc";
		}
	}

	function sortIcon(key: string) {
		if (sortKey !== key) return ArrowUpDownIcon;
		return sortDir === "asc" ? ArrowUpIcon : ArrowDownIcon;
	}

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleSelectAll() {
		if (selectedIds.size === paginated.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(paginated.map((p) => p.id));
		}
	}

	function statusColor(status: string) {
		switch (status) {
			case "published":
				return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
			case "draft":
				return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
			default:
				return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
		}
	}

	function formatDate(date: Date | string | null) {
		if (!date) return "—";
		return new Intl.DateTimeFormat(data.locale === "th" ? "th-TH" : "en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	}

	function openDelete(id: string) {
		deleteId = id;
		deleteOpen = true;
	}

	function handleExport(format: "csv" | "json") {
		const exportData = filtered.map((p) => ({
			title: p.title,
			slug: p.slug,
			status: p.status,
			template: p.template,
			author: p.authorName ?? copy.unknown,
			updated: formatDate(p.updatedAt),
		}));
		if (format === "csv") exportToCSV(exportData, "content");
		else exportToJSON(exportData, "content");
	}

	const columns = $derived.by(() => [
		{ key: "title", label: copy.columns.title },
		{ key: "slug", label: copy.columns.slug },
		{ key: "status", label: copy.columns.status },
		{ key: "template", label: copy.columns.template },
		{ key: "authorName", label: copy.columns.author },
		{ key: "updatedAt", label: copy.columns.updated },
	]);
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground">{copy.description}</p>
		</div>
		{#if data.canManageContent}
			<Button href="/content/new">
				<PlusIcon class="mr-2 size-4" />
				{copy.newPage}
			</Button>
		{/if}
	</div>

	<!-- Toolbar -->
	<div class="flex items-center gap-2">
		<div class="relative max-w-sm flex-1">
			<SearchIcon class="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
			<Input placeholder={copy.searchPages} class="pl-9" bind:value={search} />
		</div>
		<p class="text-muted-foreground text-sm">{filtered.length} {copy.pages}{filtered.length !== 1 && data.locale !== "th" ? "s" : ""}</p>
		<div class="ml-auto flex items-center gap-2">
			{#if data.canManageContent && selectedIds.size > 0}
				<form method="POST" action="?/bulkDelete" use:enhance>
					<input type="hidden" name="ids" value={[...selectedIds].join(",")} />
					<Button variant="destructive" size="sm" type="submit">
						<TrashIcon class="mr-2 size-4" />
						{copy.delete} {selectedIds.size}
					</Button>
				</form>
			{/if}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" {...props}>
							<DownloadIcon class="mr-2 size-4" />
							{copy.export}
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content>
					<DropdownMenu.Item onclick={() => handleExport("csv")}>{copy.exportCsv}</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => handleExport("json")}>{copy.exportJson}</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</div>
	</div>

	<!-- Table -->
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#if data.canManageContent}
						<Table.Head class="w-[40px]">
							<input
								type="checkbox"
								checked={paginated.length > 0 && selectedIds.size === paginated.length}
								onchange={toggleSelectAll}
								class="accent-primary size-4"
							/>
						</Table.Head>
					{/if}
					{#each columns as col (col.key)}
						{@const SortIcon = sortIcon(col.key)}
						<Table.Head>
							<button class="flex items-center gap-1 text-left font-medium" onclick={() => toggleSort(col.key)}>
								{col.label}
								<SortIcon class="text-muted-foreground size-3" />
							</button>
						</Table.Head>
					{/each}
					{#if data.canManageContent}
						<Table.Head class="w-[100px]">{copy.columns.actions}</Table.Head>
					{/if}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each paginated as p (p.id)}
					<Table.Row class={selectedIds.has(p.id) ? "bg-muted/50" : ""}>
						{#if data.canManageContent}
							<Table.Cell>
								<input
									type="checkbox"
									checked={selectedIds.has(p.id)}
									onchange={() => toggleSelect(p.id)}
									class="accent-primary size-4"
								/>
							</Table.Cell>
						{/if}
						<Table.Cell class="font-medium">{p.title}</Table.Cell>
						<Table.Cell class="text-muted-foreground font-mono text-xs">/{p.slug}</Table.Cell>
						<Table.Cell>
							<Badge variant="outline" class={statusColor(p.status)}>{p.status}</Badge>
						</Table.Cell>
						<Table.Cell class="text-muted-foreground capitalize">{p.template}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{p.authorName ?? copy.unknown}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{formatDate(p.updatedAt)}</Table.Cell>
						{#if data.canManageContent}
							<Table.Cell>
								<div class="flex items-center gap-1">
									<Button variant="ghost" size="icon" class="size-8" href="/content/{p.id}/edit">
										<PencilIcon class="size-4" />
									</Button>
									<Button variant="ghost" size="icon" class="size-8 text-destructive" onclick={() => openDelete(p.id)}>
										<TrashIcon class="size-4" />
									</Button>
								</div>
							</Table.Cell>
						{/if}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={data.canManageContent ? 8 : 6} class="h-24 text-center">
							{search ? copy.noSearchMatch : copy.noPages}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
		<DataTablePagination
			totalItems={filtered.length}
			locale={data.locale}
			bind:pageSize
			bind:currentPage
		/>
	</div>
</div>

<DeleteConfirmDialog
	bind:open={deleteOpen}
	action="?/delete"
	id={deleteId}
	itemName={copy.deletePage}
	locale={data.locale}
/>
