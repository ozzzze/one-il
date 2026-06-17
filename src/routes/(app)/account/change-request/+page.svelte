<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import NativeSelect from "$lib/components/native-select.svelte";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SearchIcon from "@lucide/svelte/icons/search";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";

	let { data, form } = $props();

	const t = $derived(
		data.locale === "th"
			? {
					title: "คำขอแก้ไขข้อมูลผู้ใช้",
					subtitle: "ส่งคำขอแก้ไขข้อมูลบัญชี/บทบาทของคุณ เพื่อให้ผู้ดูแลตรวจสอบ",
					createRequest: "สร้างใบขอแก้ไข",
					newRequest: "สร้างคำขอใหม่",
					field: "ข้อมูลที่ต้องการแก้",
					currentValue: "ค่าปัจจุบัน",
					requestedValue: "ค่าที่ต้องการ",
					reason: "เหตุผล (ไม่บังคับ)",
					submit: "ส่งคำขอ",
					listTitle: "รายการคำขอ",
					noRequests: "ยังไม่มีคำขอ",
					noResults: "ไม่พบรายการที่ตรงกับตัวกรอง",
					withdraw: "ถอนคำขอ",
					requester: "ผู้ขอ",
					self: "ฉัน",
					approve: "อนุมัติ",
					reject: "ปฏิเสธ",
					note: "หมายเหตุการตรวจสอบ (ไม่บังคับ)",
					submitted: "ส่งคำขอแล้ว",
					withdrawn: "ถอนคำขอแล้ว",
					reviewed: "บันทึกผลการตรวจสอบแล้ว",
					statusCol: "สถานะ",
					filterStatus: "สถานะ",
					allStatuses: "ทุกสถานะ",
					search: "ค้นหา",
					searchPlaceholder: "ผู้ขอ ข้อมูล ค่า เหตุผล หมายเหตุ",
					actions: "การกระทำ",
					submittedAt: "วันที่ส่ง",
					reviewNote: "หมายเหตุ",
					fields: {
						name: "ชื่อ",
						email: "อีเมล",
						username: "ชื่อผู้ใช้",
						role: "บทบาท",
						other: "อื่น ๆ",
					},
					status: { pending: "รอตรวจสอบ", approved: "อนุมัติ", rejected: "ปฏิเสธ" },
				}
			: {
					title: "User change request",
					subtitle: "Submit a request to change your account/role data for an admin to review.",
					createRequest: "Create change request",
					newRequest: "New request",
					field: "Field to change",
					currentValue: "Current value",
					requestedValue: "Requested value",
					reason: "Reason (optional)",
					submit: "Submit request",
					listTitle: "Requests",
					noRequests: "No requests yet",
					noResults: "No requests match your filters",
					withdraw: "Withdraw",
					requester: "Requester",
					self: "Me",
					approve: "Approve",
					reject: "Reject",
					note: "Review note (optional)",
					submitted: "Request submitted",
					withdrawn: "Request withdrawn",
					reviewed: "Review saved",
					statusCol: "Status",
					filterStatus: "Status",
					allStatuses: "All statuses",
					search: "Search",
					searchPlaceholder: "Requester, field, values, reason, note",
					actions: "Actions",
					submittedAt: "Submitted",
					reviewNote: "Note",
					fields: {
						name: "Name",
						email: "Email",
						username: "Username",
						role: "Role",
						other: "Other",
					},
					status: { pending: "Pending", approved: "Approved", rejected: "Rejected" },
				}
	);

	type FieldKey = "name" | "email" | "username" | "role" | "other";
	type RequestStatus = "pending" | "approved" | "rejected";

	type TableRow = {
		id: string;
		field: string;
		current_value: string | null;
		requested_value: string;
		reason: string | null;
		status: string;
		review_note: string | null;
		created_at: string;
		requesterName: string;
		requesterEmail: string;
		isOwn: boolean;
	};

	const STATUS_ORDER: RequestStatus[] = ["pending", "approved", "rejected"];

	let selectedField = $state<FieldKey>("name");
	let createOpen = $state(false);
	let searchQuery = $state("");
	let statusFilter = $state("");


	const tableColspan = $derived(data.canReview ? 9 : 8);

	const allRows = $derived.by((): TableRow[] => {
		const byId = new Map<string, TableRow>();

		for (const req of data.myRequests) {
			byId.set(req.id, {
				id: req.id,
				field: req.field,
				current_value: req.current_value,
				requested_value: req.requested_value,
				reason: req.reason,
				status: req.status,
				review_note: req.review_note,
				created_at: req.created_at,
				requesterName: t.self,
				requesterEmail: "",
				isOwn: true,
			});
		}

		if (data.canReview) {
			for (const req of data.pendingReviews) {
				if (byId.has(req.id)) continue;
				byId.set(req.id, {
					id: req.id,
					field: req.field,
					current_value: req.current_value,
					requested_value: req.requested_value,
					reason: req.reason,
					status: "pending",
					review_note: null,
					created_at: req.created_at,
					requesterName: req.requesterName,
					requesterEmail: req.requesterEmail,
					isOwn: false,
				});
			}
		}

		return [...byId.values()].sort(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);
	});

	const filteredRows = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return allRows.filter((row) => {
			if (statusFilter && row.status !== statusFilter) return false;
			if (!q) return true;
			const haystack = [
				fieldLabel(row.field),
				row.field,
				row.current_value,
				row.requested_value,
				row.reason,
				row.review_note,
				row.requesterName,
				row.requesterEmail,
				statusLabel(row.status),
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return haystack.includes(q);
		});
	});

	const statusSections = $derived.by(() => {
		const statuses = statusFilter
			? STATUS_ORDER.filter((status) => status === statusFilter)
			: STATUS_ORDER;

		return statuses
			.map((status) => ({
				status,
				rows: filteredRows.filter((row) => row.status === status),
			}))
			.filter((section) => section.rows.length > 0);
	});

	function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
		if (status === "approved") return "default";
		if (status === "rejected") return "destructive";
		return "secondary";
	}

	function statusLabel(status: string): string {
		return t.status[status as keyof typeof t.status] ?? status;
	}

	function fieldLabel(field: string): string {
		return t.fields[field as keyof typeof t.fields] ?? field;
	}

	function formatDate(date: string | null): string {
		if (!date) return "—";
		return new Intl.DateTimeFormat(data.locale === "th" ? "th-TH" : "en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		}).format(new Date(date));
	}

	function canReviewRow(row: TableRow): boolean {
		return data.canReview && !row.isOwn && row.status === "pending";
	}

	$effect(() => {
		if (!form) return;
		if (form.success) {
			if (form.action === "submit") toast.success(t.submitted);
			else if (form.action === "withdraw") toast.success(t.withdrawn);
			else if (form.action === "review") toast.success(t.reviewed);
		} else if ("message" in form && form.message) {
			toast.error(form.message);
		}
	});
</script>

<svelte:head>
	<title>{t.title}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{t.title}</h1>
			<p class="text-muted-foreground">{t.subtitle}</p>
		</div>
		<Button class="shrink-0 self-end sm:self-auto" onclick={() => (createOpen = true)}>
			<PlusIcon class="mr-2 size-4" />
			{t.createRequest}
		</Button>
	</div>

	<Dialog.Root bind:open={createOpen}>
		<Dialog.Content class="sm:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>{t.newRequest}</Dialog.Title>
				<Dialog.Description>{t.subtitle}</Dialog.Description>
			</Dialog.Header>
			<form
				method="POST"
				action="?/submit"
				use:enhance={() =>
					async ({ result, update }) => {
						if (result.type === "success") {
							createOpen = false;
						}
						await update({ reset: result.type === "success", invalidateAll: true });
					}}
				class="grid gap-4 md:grid-cols-2"
			>
				<div class="space-y-1 md:col-span-2">
					<Label for="field">{t.field}</Label>
					<select
						id="field"
						name="field"
						bind:value={selectedField}
						class="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
					>
						<option value="name">{t.fields.name}</option>
						<option value="email">{t.fields.email}</option>
						<option value="username">{t.fields.username}</option>
						<option value="role">{t.fields.role}</option>
						<option value="other">{t.fields.other}</option>
					</select>
				</div>
				<div class="space-y-1 md:col-span-2">
					<Label for="requested_value">{t.requestedValue}</Label>
					<Input id="requested_value" name="requested_value" required />
				</div>
				<div class="space-y-1 md:col-span-2">
					<Label for="reason">{t.reason}</Label>
					<textarea
						id="reason"
						name="reason"
						rows="3"
						class="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
					></textarea>
				</div>
				<div class="flex justify-end md:col-span-2">
					<Button type="submit">{t.submit}</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<div class="space-y-4">
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
			<div class="relative min-w-0 flex-1 sm:max-w-sm">
				<SearchIcon
					class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
				/>
				<Input
					id="search"
					type="search"
					placeholder={t.searchPlaceholder}
					class="pl-9"
					bind:value={searchQuery}
				/>
			</div>
			<div class="w-full sm:w-56">
				<NativeSelect
					id="statusFilter"
					bind:value={statusFilter}
					selectSize="default"
					class="py-1 leading-normal"
				>
					<option value="">{t.allStatuses}</option>
					{#each STATUS_ORDER as status (status)}
						<option value={status}>{statusLabel(status)}</option>
					{/each}
				</NativeSelect>
			</div>
		</div>

		<div class="bg-card overflow-hidden rounded-lg border shadow-sm">
			<Table.Root class="min-w-[960px]">
				<Table.Header>
					<Table.Row>
						{#if data.canReview}
							<Table.Head>{t.requester}</Table.Head>
						{/if}
						<Table.Head>{t.field}</Table.Head>
						<Table.Head>{t.currentValue}</Table.Head>
						<Table.Head>{t.requestedValue}</Table.Head>
						<Table.Head>{t.reason}</Table.Head>
						<Table.Head>{t.statusCol}</Table.Head>
						<Table.Head>{t.reviewNote}</Table.Head>
						<Table.Head>{t.submittedAt}</Table.Head>
						<Table.Head class="text-right">{t.actions}</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if allRows.length === 0}
						<Table.Row>
							<Table.Cell colspan={tableColspan} class="text-muted-foreground py-8 text-center">
								{t.noRequests}
							</Table.Cell>
						</Table.Row>
					{:else if statusSections.length === 0}
						<Table.Row>
							<Table.Cell colspan={tableColspan} class="text-muted-foreground py-8 text-center">
								{t.noResults}
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each statusSections as section (section.status)}
							<Table.Row class="bg-muted/40 hover:bg-muted/40">
								<Table.Cell colspan={tableColspan} class="py-2">
									<div class="flex items-center gap-2">
										<Badge variant={statusVariant(section.status)}>
											{statusLabel(section.status)}
										</Badge>
										<span class="text-muted-foreground text-sm">
											{section.rows.length}
										</span>
									</div>
								</Table.Cell>
							</Table.Row>
							{#each section.rows as row (row.id)}
								<Table.Row>
									{#if data.canReview}
										<Table.Cell>
											<div class="font-medium">{row.requesterName}</div>
											{#if row.requesterEmail}
												<div class="text-muted-foreground text-xs">{row.requesterEmail}</div>
											{/if}
										</Table.Cell>
									{/if}
									<Table.Cell class="font-medium">{fieldLabel(row.field)}</Table.Cell>
									<Table.Cell class="text-muted-foreground line-through">
										{row.current_value ?? "—"}
									</Table.Cell>
									<Table.Cell>{row.requested_value}</Table.Cell>
									<Table.Cell
										class="text-muted-foreground max-w-48 truncate"
										title={row.reason ?? ""}
									>
										{row.reason ?? "—"}
									</Table.Cell>
									<Table.Cell>
										<Badge variant={statusVariant(row.status)}>{statusLabel(row.status)}</Badge>
									</Table.Cell>
									<Table.Cell
										class="text-muted-foreground max-w-48 truncate italic"
										title={row.review_note ?? ""}
									>
										{row.review_note ?? "—"}
									</Table.Cell>
									<Table.Cell class="text-muted-foreground whitespace-nowrap">
										{formatDate(row.created_at)}
									</Table.Cell>
									<Table.Cell class="text-right">
										{#if row.isOwn && row.status === "pending"}
											<form method="POST" action="?/withdraw" use:enhance>
												<input type="hidden" name="id" value={row.id} />
												<Button type="submit" variant="outline" size="sm">{t.withdraw}</Button>
											</form>
										{:else if canReviewRow(row)}
											<form
												method="POST"
												action="?/review"
												use:enhance
												class="flex min-w-64 flex-col gap-2 sm:items-end"
											>
												<input type="hidden" name="id" value={row.id} />
												<Input
													id={`note-${row.id}`}
													name="review_note"
													placeholder={t.note}
													class="w-full"
												/>
												<div class="flex gap-2">
													<Button type="submit" name="decision" value="approved" size="sm">
														{t.approve}
													</Button>
													<Button
														type="submit"
														name="decision"
														value="rejected"
														variant="destructive"
														size="sm"
													>
														{t.reject}
													</Button>
												</div>
											</form>
										{:else}
											<span class="text-muted-foreground text-sm">—</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
</div>
