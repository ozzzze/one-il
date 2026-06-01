<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { base } from "$app/paths";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import type { RawMenuItemRow } from "$lib/navigation/catalog.js";

	let { data, form } = $props();

	const t = $derived(
		data.locale === "th"
			? {
					title: "แคตตาล็อกเมนู",
					subtitle: "กำหนดว่าแต่ละบทบาทเห็นแอป/เมนูใด และให้ลิงก์ชี้ไปที่แอปใด (เช่น /leave)",
					backToRoles: "กลับไปหน้าบทบาท",
					group: "กลุ่ม",
					active: "เปิดใช้งาน",
					inactive: "ปิด",
					enable: "เปิด",
					disable: "ปิด",
					labelTh: "ป้ายชื่อ (ไทย)",
					labelEn: "ป้ายชื่อ (อังกฤษ)",
					href: "ลิงก์ปลายทาง (path)",
					iconKey: "ไอคอน",
					visibility: "การมองเห็น",
					status: "สถานะ",
					sortOrder: "ลำดับ",
					permissions: "สิทธิ์ที่ต้องมี (คั่นด้วยจุลภาค)",
					permissionsHint: "เว้นว่าง = ทุกบทบาทที่เห็นกลุ่มนี้เข้าถึงได้",
					save: "บันทึก",
					saved: "บันทึกแล้ว",
					standard: "ทั่วไป",
					adminOnly: "แอดมินเท่านั้น",
					live: "พร้อมใช้",
					planned: "วางแผน",
					availableKeys: "คีย์สิทธิ์ที่ใช้ได้",
				}
			: {
					title: "Menu catalog",
					subtitle: "Control which role sees which app/menu, and where each link points (e.g. /leave).",
					backToRoles: "Back to roles",
					group: "Group",
					active: "Active",
					inactive: "Inactive",
					enable: "Enable",
					disable: "Disable",
					labelTh: "Label (Thai)",
					labelEn: "Label (English)",
					href: "Target link (path)",
					iconKey: "Icon",
					visibility: "Visibility",
					status: "Status",
					sortOrder: "Order",
					permissions: "Required permissions (comma-separated)",
					permissionsHint: "Empty = anyone who can see this group can access it.",
					save: "Save",
					saved: "Saved",
					standard: "Standard",
					adminOnly: "Admin only",
					live: "Live",
					planned: "Planned",
					availableKeys: "Available permission keys",
				},
	);

	const groupsSorted = $derived([...data.groups].sort((a, b) => a.sort_order - b.sort_order));

	function itemsForGroup(code: string): RawMenuItemRow[] {
		return [...data.items].filter((item) => item.group_id === code).sort((a, b) => a.sort_order - b.sort_order);
	}

	function groupLabel(code: string): string {
		const g = data.groups.find((x) => x.code === code);
		if (!g) return code;
		return data.locale === "th" ? g.label_th : g.label_en;
	}

	$effect(() => {
		if (form?.success) {
			toast.success(t.saved);
		} else if (form && "message" in form && form.message) {
			toast.error(form.message);
		}
	});
</script>

<svelte:head>
	<title>{t.title}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{t.title}</h1>
			<p class="text-muted-foreground text-sm">{t.subtitle}</p>
		</div>
		<Button href={`${base}/roles`} variant="outline" size="sm">{t.backToRoles}</Button>
	</div>

	<Card.Root>
		<Card.Content class="text-muted-foreground space-y-1 py-4 text-xs">
			<p class="font-medium">{t.availableKeys}</p>
			<div class="flex flex-wrap gap-1">
				{#each data.permissionKeys as key (key)}
					<Badge variant="outline" class="font-mono text-[10px]">{key}</Badge>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>

	{#each groupsSorted as group (group.code)}
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<Card.Title class="text-lg">{groupLabel(group.code)}</Card.Title>
					<Badge variant={group.is_active ? "default" : "outline"}>
						{group.is_active ? t.active : t.inactive}
					</Badge>
					<span class="text-muted-foreground font-mono text-xs">{group.code}</span>
				</div>
				<form method="POST" action="?/toggleGroupActive" use:enhance>
					<input type="hidden" name="code" value={group.code} />
					<input type="hidden" name="is_active" value={group.is_active ? "false" : "true"} />
					<Button type="submit" variant={group.is_active ? "ghost" : "secondary"} size="sm">
						{group.is_active ? t.disable : t.enable}
					</Button>
				</form>
			</Card.Header>
			<Card.Content class="space-y-4">
				{#each itemsForGroup(group.code) as item (item.id)}
					<form
						method="POST"
						action="?/updateItem"
						use:enhance
						class="border-border grid gap-3 rounded-lg border p-3 md:grid-cols-2"
					>
						<input type="hidden" name="id" value={item.id} />
						<div class="space-y-1">
							<Label for={`label_th-${item.id}`}>{t.labelTh}</Label>
							<Input id={`label_th-${item.id}`} name="label_th" value={item.label_th} />
						</div>
						<div class="space-y-1">
							<Label for={`label_en-${item.id}`}>{t.labelEn}</Label>
							<Input id={`label_en-${item.id}`} name="label_en" value={item.label_en} />
						</div>
						<div class="space-y-1">
							<Label for={`href-${item.id}`}>{t.href}</Label>
							<Input id={`href-${item.id}`} name="href" value={item.href ?? ""} placeholder="/leave" />
						</div>
						<div class="space-y-1">
							<Label for={`icon_key-${item.id}`}>{t.iconKey}</Label>
							<Input id={`icon_key-${item.id}`} name="icon_key" value={item.icon_key ?? ""} />
						</div>
						<div class="space-y-1">
							<Label for={`visibility-${item.id}`}>{t.visibility}</Label>
							<select
								id={`visibility-${item.id}`}
								name="visibility"
								value={item.visibility}
								class="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
							>
								<option value="standard">{t.standard}</option>
								<option value="admin_only">{t.adminOnly}</option>
							</select>
						</div>
						<div class="space-y-1">
							<Label for={`status-${item.id}`}>{t.status}</Label>
							<select
								id={`status-${item.id}`}
								name="implementation_status"
								value={item.implementation_status}
								class="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
							>
								<option value="live">{t.live}</option>
								<option value="planned">{t.planned}</option>
							</select>
						</div>
						<div class="space-y-1 md:col-span-2">
							<Label for={`perms-${item.id}`}>{t.permissions}</Label>
							<Input
								id={`perms-${item.id}`}
								name="required_permission_keys"
								value={item.required_permission_keys.join(", ")}
								placeholder="leave:view, leave:manage"
								class="font-mono text-xs"
							/>
							<p class="text-muted-foreground text-[11px]">{t.permissionsHint}</p>
						</div>
						<div class="flex items-end gap-3">
							<div class="w-24 space-y-1">
								<Label for={`sort-${item.id}`}>{t.sortOrder}</Label>
								<Input id={`sort-${item.id}`} name="sort_order" type="number" value={item.sort_order} />
							</div>
							<Button type="submit" size="sm">{t.save}</Button>
						</div>
					</form>
				{/each}
			</Card.Content>
		</Card.Root>
	{/each}
</div>
