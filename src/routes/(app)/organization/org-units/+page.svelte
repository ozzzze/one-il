<script lang="ts">
	import { enhance } from "$app/forms";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import DeleteConfirmDialog from "$lib/components/delete-confirm-dialog.svelte";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import TrashIcon from "@lucide/svelte/icons/trash-2";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { toast } from "svelte-sonner";
	import type { ActionData, PageData } from "./$types.js";

	type OrgUnit = PageData["orgUnits"][number];
	type UnitType = PageData["unitTypes"][number];

	type FlatOrgRow = OrgUnit & { depth: number };

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const uiLabels = $derived(getUiLabels(data.locale));

	let dialogOpen = $state(false);
	let mode = $state<"create" | "edit">("create");
	let selectedUnit = $state<OrgUnit | null>(null);
	let deleteOpen = $state(false);
	let deleteId = $state("");
	let savePending = $state(false);

	let search = $state("");

	function flattenOrgUnits(units: OrgUnit[]): FlatOrgRow[] {
		const byParent = new Map<string | null, OrgUnit[]>();
		for (const u of units) {
			const p = u.parent_unit_id;
			const list = byParent.get(p) ?? [];
			list.push(u);
			byParent.set(p, list);
		}
		for (const [, list] of byParent) {
			list.sort((a, b) => {
				if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
				return a.code.localeCompare(b.code);
			});
		}
		const result: FlatOrgRow[] = [];
		function walk(parentId: string | null, depth: number) {
			const children = byParent.get(parentId) ?? [];
			for (const c of children) {
				result.push({ ...c, depth });
				walk(c.id, depth + 1);
			}
		}
		walk(null, 0);
		return result;
	}

	function depthIndentClass(depth: number): string {
		switch (Math.min(depth, 8)) {
			case 0:
				return "";
			case 1:
				return "ps-4";
			case 2:
				return "ps-8";
			case 3:
				return "ps-12";
			case 4:
				return "ps-16";
			case 5:
				return "ps-20";
			case 6:
				return "ps-24";
			case 7:
				return "ps-28";
			case 8:
				return "ps-32";
			default:
				return "";
		}
	}

	const UNIT_TYPE_LABELS: Record<UnitType, { th: string; en: string }> = {
		DIRECTOR_OFFICE: { th: "สำนักผู้บริหาร", en: "Director office" },
		SCI_TECH_GROUP: { th: "กลุ่มวิทยาศาสตร์และเทคโนโลยี", en: "Science & technology group" },
		SUPPORT_SECTION: { th: "ฝ่ายสนับสนุน", en: "Support section" },
		ACADEMIC_SECTION: { th: "ฝ่ายวิชาการ", en: "Academic section" },
	};

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "หน่วยงาน - ONE-IL",
					loadError: "โหลดหน่วยงานไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่",
					searchPlaceholder: "ค้นหารหัส ชื่อ ประเภท หรือ parent",
					create: "สร้างหน่วยงาน",
					edit: "แก้ไขหน่วยงาน",
					noMatch: "ไม่พบหน่วยงานตามเงื่อนไข",
					orgUnit: "หน่วยงาน",
					columns: {
						code: "code",
						displayName: "ชื่อที่แสดง",
						unitType: "ประเภท",
						parent: "สังกัด",
						sortOrder: "ลำดับ",
						isActive: "สถานะ",
						actions: "การกระทำ",
					},
					dialogCreateDesc: "เพิ่มหน่วยงานในโครงสร้าง",
					dialogEditDesc: "อัปเดตหน่วยงานและความสัมพันธ์ parent",
					code: "รหัส",
					name: "ชื่อ (ไทย)",
					nameEn: "ชื่อ (อังกฤษ)",
					unitType: "ประเภทหน่วย",
					parentNone: "ไม่มี parent (ระดับบนสุด)",
					parentUnit: "หน่วยงาน parent",
					sortOrder: "ลำดับการเรียง",
					isActive: "ใช้งานอยู่",
					active: "ใช้งาน",
					inactive: "ไม่ใช้งาน",
					save: "บันทึก",
					root: "—",
				}
			: {
					pageTitle: "Org units - ONE-IL",
					loadError: "Failed to load org units. Please refresh and try again.",
					searchPlaceholder: "Search code, name, type, or parent",
					create: "Create org unit",
					edit: "Edit org unit",
					noMatch: "No org units match your search.",
					orgUnit: "org unit",
					columns: {
						code: "code",
						displayName: "display name",
						unitType: "Unit type",
						parent: "Parent",
						sortOrder: "Sort order",
						isActive: "Active",
						actions: "Actions",
					},
					dialogCreateDesc: "Add an org unit to the hierarchy.",
					dialogEditDesc: "Update org unit fields and parent relationship.",
					code: "Code",
					name: "Name (TH)",
					nameEn: "Name (EN)",
					unitType: "Unit type",
					parentNone: "No parent (top level)",
					parentUnit: "Parent unit",
					sortOrder: "Sort order",
					isActive: "Active",
					active: "Active",
					inactive: "Inactive",
					save: "Save",
					root: "—",
				}
	);

	const successMessageByAction = $derived.by<Record<string, string>>(() => ({
		createOrgUnit: data.locale === "th" ? "สร้างหน่วยงานสำเร็จ" : "Org unit created successfully",
		updateOrgUnit: data.locale === "th" ? "อัปเดตหน่วยงานสำเร็จ" : "Org unit updated successfully",
		deleteOrgUnit: data.locale === "th" ? "ลบหน่วยงานสำเร็จ" : "Org unit deleted successfully",
	}));

	const flatRows = $derived.by(() => flattenOrgUnits(data.orgUnits));

	const unitById = $derived.by(() => {
		const m = new Map<string, OrgUnit>();
		for (const u of data.orgUnits) {
			m.set(u.id, u);
		}
		return m;
	});

	function localizedDisplayName(name: string, nameEn: string | null | undefined): string {
		if (data.locale === "th") return name;
		const en = nameEn?.trim();
		return en && en.length > 0 ? en : name;
	}

	function unitTypeLabel(t: string): string {
		const key = t as UnitType;
		if (key in UNIT_TYPE_LABELS) {
			return data.locale === "th" ? UNIT_TYPE_LABELS[key].th : UNIT_TYPE_LABELS[key].en;
		}
		return t;
	}

	function parentLabel(parentId: string | null): string {
		if (!parentId) return copy.root;
		const p = unitById.get(parentId);
		if (!p) return parentId;
		return `${p.code} · ${localizedDisplayName(p.name, p.name_en)}`;
	}

	const filteredRows = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (q.length === 0) return flatRows;
		return flatRows.filter((row) => {
			const haystack = [
				row.code,
				row.name,
				row.name_en ?? "",
				row.unit_type,
				parentLabel(row.parent_unit_id),
			]
				.join(" ")
				.toLowerCase();
			return haystack.includes(q);
		});
	});

	function openCreate() {
		mode = "create";
		selectedUnit = null;
		dialogOpen = true;
	}

	function openEdit(u: OrgUnit) {
		mode = "edit";
		selectedUnit = u;
		dialogOpen = true;
	}

	function openDelete(id: string) {
		deleteId = id;
		deleteOpen = true;
	}

	const formAction = $derived(mode === "create" ? "?/createOrgUnit" : "?/updateOrgUnit");

	const dialogTitle = $derived(mode === "create" ? copy.create : copy.edit);

	const parentOptions = $derived.by(() => {
		const excludeId = mode === "edit" && selectedUnit ? selectedUnit.id : null;
		return data.orgUnits.filter((u) => u.id !== excludeId);
	});

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success && form.action) {
			const msg = successMessageByAction[form.action];
			toast.success(msg ?? (data.locale === "th" ? "บันทึกสำเร็จ" : "Saved successfully"));
		}
	});

	function selectClass(): string {
		return "border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 w-full rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-4">
	{#if data.error}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs">
			{copy.loadError}
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-2">
		<div class="relative max-w-md flex-1 min-w-[200px]">
			<SearchIcon class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
			<Input
				placeholder={copy.searchPlaceholder}
				class="ps-11! pl-11!"
				bind:value={search}
			/>
		</div>
		<Button onclick={openCreate}>
			<PlusIcon class="mr-2 size-4" />
			{copy.create}
		</Button>
		<p class="text-muted-foreground text-sm">
			{filteredRows.length}
			{copy.orgUnit}{filteredRows.length !== 1 && data.locale !== "th" ? "s" : ""}
		</p>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{copy.columns.code}</Table.Head>
					<Table.Head>{copy.columns.displayName}</Table.Head>
					<Table.Head>{copy.columns.unitType}</Table.Head>
					<Table.Head>{copy.columns.parent}</Table.Head>
					<Table.Head>{copy.columns.sortOrder}</Table.Head>
					<Table.Head>{copy.columns.isActive}</Table.Head>
					<Table.Head class="w-[100px]">{copy.columns.actions}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredRows as row, i (row.id)}
					<Table.Row>
						<Table.Cell class="font-mono">
							<span class={depthIndentClass(row.depth)}>{row.code}</span>
						</Table.Cell>
						<Table.Cell class="font-medium">
							<span class={depthIndentClass(row.depth)}>
								{localizedDisplayName(row.name, row.name_en)}
							</span>
						</Table.Cell>
						<Table.Cell>{unitTypeLabel(row.unit_type)}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{parentLabel(row.parent_unit_id)}</Table.Cell>
						<Table.Cell>{row.sort_order}</Table.Cell>
						<Table.Cell>
							<Badge variant={row.is_active ? "default" : "secondary"}>
								{row.is_active ? copy.active : copy.inactive}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-1">
								<Button variant="ghost" size="icon" class="size-8" type="button" onclick={() => openEdit(row)}>
									<PencilIcon class="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="text-destructive size-8"
									type="button"
									onclick={() => openDelete(row.id)}
								>
									<TrashIcon class="size-4" />
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center">
							{copy.noMatch}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>{dialogTitle}</Dialog.Title>
			<Dialog.Description>
				{mode === "create" ? copy.dialogCreateDesc : copy.dialogEditDesc}
			</Dialog.Description>
		</Dialog.Header>
		{#key selectedUnit?.id ?? "create"}
			<form
				method="POST"
				action={formAction}
				use:enhance={pendingEnhance((v) => (savePending = v), () => async ({ result, update }) => {
					if (result.type === "success" || result.type === "redirect") {
						dialogOpen = false;
					}
					await update();
				})}
				class="grid gap-4"
			>
				{#if mode === "edit" && selectedUnit}
					<input type="hidden" name="id" value={selectedUnit.id} />
				{/if}
				<div class="grid gap-2">
					<Label for="org-code">{copy.code}</Label>
					<Input id="org-code" name="code" required autocomplete="off" value={selectedUnit?.code ?? ""} />
				</div>
				<div class="grid gap-2">
					<Label for="org-name">{copy.name}</Label>
					<Input id="org-name" name="name" required value={selectedUnit?.name ?? ""} />
				</div>
				<div class="grid gap-2">
					<Label for="org-name-en">{copy.nameEn}</Label>
					<Input id="org-name-en" name="nameEn" value={selectedUnit?.name_en ?? ""} />
				</div>
				<div class="grid gap-2">
					<Label for="org-unit-type">{copy.unitType}</Label>
					<select id="org-unit-type" name="unitType" required class={selectClass()} value={selectedUnit?.unit_type ?? data.unitTypes[0]}>
						{#each data.unitTypes as ut, k (ut)}
							<option value={ut}>{unitTypeLabel(ut)}</option>
						{/each}
					</select>
				</div>
				<div class="grid gap-2">
					<Label for="org-parent">{copy.parentUnit}</Label>
					<select
						id="org-parent"
						name="parentUnitId"
						class={selectClass()}
						value={selectedUnit?.parent_unit_id ?? ""}
					>
						<option value="">{copy.parentNone}</option>
						{#each parentOptions as opt, m (opt.id)}
							<option value={opt.id}>
								{opt.code} · {localizedDisplayName(opt.name, opt.name_en)}
							</option>
						{/each}
					</select>
				</div>
				<div class="grid gap-2">
					<Label for="org-sort">{copy.sortOrder}</Label>
					<Input
						id="org-sort"
						name="sortOrder"
						type="number"
						min={0}
						max={9999}
						required
						value={selectedUnit ? String(selectedUnit.sort_order) : "0"}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="org-active">{copy.isActive}</Label>
					<select
						id="org-active"
						name="isActive"
						class={selectClass()}
						value={selectedUnit ? (selectedUnit.is_active ? "true" : "false") : "true"}
					>
						<option value="true">{copy.active}</option>
						<option value="false">{copy.inactive}</option>
					</select>
				</div>
				<Dialog.Footer>
					<SaveSubmitButton pending={savePending} idleLabel={copy.save} savingLabel={uiLabels.formSaving} />
				</Dialog.Footer>
			</form>
		{/key}
	</Dialog.Content>
</Dialog.Root>

<DeleteConfirmDialog
	bind:open={deleteOpen}
	action="?/deleteOrgUnit"
	id={deleteId}
	itemName={copy.orgUnit}
	locale={data.locale}
/>
