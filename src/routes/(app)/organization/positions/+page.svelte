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

	const DEPUTY_CATEGORIES = ["ADMIN", "RESEARCH", "EDU_NETWORK"] as const;

	type DeputyCategory = (typeof DEPUTY_CATEGORIES)[number];

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const uiLabels = $derived(getUiLabels(data.locale));

	let dialogOpen = $state(false);
	let mode = $state<"create" | "edit">("create");
	let selectedPosition = $state<PageData["positions"][number] | null>(null);
	let deleteOpen = $state(false);
	let deleteId = $state("");
	let savePending = $state(false);

	let search = $state("");

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ตำแหน่ง - ONE-IL",
					loadError: "โหลดรายการตำแหน่งไม่สำเร็จ กรุณารีเฟรชแล้วลองใหม่",
					searchPlaceholder: "ค้นหารหัส ชื่อ หรือชื่อภาษาอังกฤษ",
					create: "สร้างตำแหน่ง",
					edit: "แก้ไขตำแหน่ง",
					noMatch: "ไม่พบตำแหน่งตามเงื่อนไข",
					position: "ตำแหน่ง",
					columns: {
						code: "code",
						displayName: "ชื่อภาษาไทย",
						nameEn: "ชื่อภาษาอังกฤษ",
						roleLevel: "ลำดับชั้น",
						canCommand: "ผู้บังคับบัญชา",
						deputyCategory: "ส่วนงาน",
						actions: "การกระทำ",
					},
					dialogCreateDesc: "เพิ่มตำแหน่งใหม่ในระบบ",
					dialogEditDesc: "อัปเดตรายละเอียดตำแหน่ง",
					code: "รหัส",
					name: "ชื่อ (ไทย)",
					nameEn: "ชื่อ (อังกฤษ)",
					roleLevel: "ระดับบทบาท (1–4)",
					canCommandStaff: "บังคับบัญชาบุคลากร",
					deputyCategory: "ประเภทงานรองผู้อำนวยการ",
					deputyNone: "ไม่ระบุ / ไม่ใช้",
					yes: "ใช่",
					no: "ไม่",
					save: "บันทึก",
					deputyLabels: {
						ADMIN: "บริหาร",
						RESEARCH: "วิจัย",
						EDU_NETWORK: "เครือข่ายการศึกษา",
					} satisfies Record<DeputyCategory, string>,
				}
			: {
					pageTitle: "Positions - ONE-IL",
					loadError: "Failed to load positions. Please refresh and try again.",
					searchPlaceholder: "Search code, name, or English name",
					create: "Create position",
					edit: "Edit position",
					noMatch: "No positions match your search.",
					position: "position",
					columns: {
						code: "code",
						displayName: "Thai name",
						nameEn: "English name",
						roleLevel: "Role level",
						canCommand: "Can command staff",
						deputyCategory: "Deputy category",
						actions: "Actions",
					},
					dialogCreateDesc: "Add a new position record.",
					dialogEditDesc: "Update position details.",
					code: "Code",
					name: "Name (TH)",
					nameEn: "Name (EN)",
					roleLevel: "Role level (1–4)",
					canCommandStaff: "Can command staff",
					deputyCategory: "Deputy category",
					deputyNone: "None / not applicable",
					yes: "Yes",
					no: "No",
					save: "Save",
					deputyLabels: {
						ADMIN: "Administration",
						RESEARCH: "Research",
						EDU_NETWORK: "Education network",
					} satisfies Record<DeputyCategory, string>,
				}
	);

	const successMessageByAction = $derived.by<Record<string, string>>(() => ({
		createPosition: data.locale === "th" ? "สร้างตำแหน่งสำเร็จ" : "Position created successfully",
		updatePosition: data.locale === "th" ? "อัปเดตตำแหน่งสำเร็จ" : "Position updated successfully",
		deletePosition: data.locale === "th" ? "ลบตำแหน่งสำเร็จ" : "Position deleted successfully",
	}));

	const filteredPositions = $derived.by(() => {
		const q = search.trim().toLowerCase();
		if (q.length === 0) return data.positions;
		return data.positions.filter((p) => {
			const nameEn = (p.name_en ?? "").toLowerCase();
			return (
				p.code.toLowerCase().includes(q) ||
				p.name.toLowerCase().includes(q) ||
				nameEn.includes(q)
			);
		});
	});

	function localizedDisplayName(name: string, nameEn: string | null | undefined): string {
		if (data.locale === "th") return name;
		const en = nameEn?.trim();
		return en && en.length > 0 ? en : name;
	}

	function deputyCategoryLabel(cat: string | null | undefined): string {
		if (!cat) return "—";
		if (cat === "ADMIN" || cat === "RESEARCH" || cat === "EDU_NETWORK") return copy.deputyLabels[cat];
		return cat;
	}

	function openCreate() {
		mode = "create";
		selectedPosition = null;
		dialogOpen = true;
	}

	function openEdit(p: PageData["positions"][number]) {
		mode = "edit";
		selectedPosition = p;
		dialogOpen = true;
	}

	function openDelete(id: string) {
		deleteId = id;
		deleteOpen = true;
	}

	const formAction = $derived(mode === "create" ? "?/createPosition" : "?/updatePosition");

	const dialogTitle = $derived(mode === "create" ? copy.create : copy.edit);

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
			{filteredPositions.length}
			{copy.position}{filteredPositions.length !== 1 && data.locale !== "th" ? "s" : ""}
		</p>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{copy.columns.code}</Table.Head>
					<Table.Head>{copy.columns.displayName}</Table.Head>
					<Table.Head>{copy.columns.nameEn}</Table.Head>
					<Table.Head>{copy.columns.roleLevel}</Table.Head>
					<Table.Head>{copy.columns.canCommand}</Table.Head>
					<Table.Head>{copy.columns.deputyCategory}</Table.Head>
					<Table.Head class="w-[100px]">{copy.columns.actions}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredPositions as pos, i (pos.id)}
					<Table.Row>
						<Table.Cell class="font-mono">{pos.code}</Table.Cell>
						<Table.Cell class="font-medium">
							{localizedDisplayName(pos.name, pos.name_en)}
						</Table.Cell>
						<Table.Cell class="text-muted-foreground">{pos.name_en ?? "—"}</Table.Cell>
						<Table.Cell>{pos.role_level}</Table.Cell>
						<Table.Cell>
							<Badge variant={pos.can_command_staff ? "default" : "secondary"}>
								{pos.can_command_staff ? copy.yes : copy.no}
							</Badge>
						</Table.Cell>
						<Table.Cell>{deputyCategoryLabel(pos.deputy_category)}</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-1">
								<Button variant="ghost" size="icon" class="size-8" type="button" onclick={() => openEdit(pos)}>
									<PencilIcon class="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="text-destructive size-8"
									type="button"
									onclick={() => openDelete(pos.id)}
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
		{#key selectedPosition?.id ?? "create"}
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
				{#if mode === "edit" && selectedPosition}
					<input type="hidden" name="id" value={selectedPosition.id} />
				{/if}
				<div class="grid gap-2">
					<Label for="position-code">{copy.code}</Label>
					<Input
						id="position-code"
						name="code"
						required
						autocomplete="off"
						value={selectedPosition?.code ?? ""}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="position-name">{copy.name}</Label>
					<Input id="position-name" name="name" required value={selectedPosition?.name ?? ""} />
				</div>
				<div class="grid gap-2">
					<Label for="position-name-en">{copy.nameEn}</Label>
					<Input id="position-name-en" name="nameEn" value={selectedPosition?.name_en ?? ""} />
				</div>
				<div class="grid gap-2">
					<Label for="position-role-level">{copy.roleLevel}</Label>
					<Input
						id="position-role-level"
						name="roleLevel"
						type="number"
						min={1}
						max={4}
						required
						value={selectedPosition ? String(selectedPosition.role_level) : "1"}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="position-can-command">{copy.canCommandStaff}</Label>
					<select
						id="position-can-command"
						name="canCommandStaff"
						class={selectClass()}
						value={selectedPosition?.can_command_staff ? "true" : "false"}
					>
						<option value="true">{copy.yes}</option>
						<option value="false">{copy.no}</option>
					</select>
				</div>
				<div class="grid gap-2">
					<Label for="position-deputy">{copy.deputyCategory}</Label>
					<select
						id="position-deputy"
						name="deputyCategory"
						class={selectClass()}
						value={selectedPosition?.deputy_category ?? ""}
					>
						<option value="">{copy.deputyNone}</option>
						{#each DEPUTY_CATEGORIES as dc, j (dc)}
							<option value={dc}>{copy.deputyLabels[dc]}</option>
						{/each}
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
	action="?/deletePosition"
	id={deleteId}
	itemName={copy.position}
	locale={data.locale}
/>
