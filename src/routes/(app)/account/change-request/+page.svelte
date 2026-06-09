<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";

	let { data, form } = $props();

	const t = $derived(
		data.locale === "th"
			? {
					title: "คำขอแก้ไขข้อมูลผู้ใช้",
					subtitle: "ส่งคำขอแก้ไขข้อมูลบัญชี/บทบาทของคุณ เพื่อให้ผู้ดูแลตรวจสอบ",
					newRequest: "สร้างคำขอใหม่",
					field: "ข้อมูลที่ต้องการแก้",
					currentValue: "ค่าปัจจุบัน",
					requestedValue: "ค่าที่ต้องการ",
					reason: "เหตุผล (ไม่บังคับ)",
					submit: "ส่งคำขอ",
					myRequests: "คำขอของฉัน",
					noRequests: "ยังไม่มีคำขอ",
					withdraw: "ถอนคำขอ",
					reviewTitle: "คำขอรอตรวจสอบ",
					noPending: "ไม่มีคำขอรอตรวจสอบ",
					requester: "ผู้ขอ",
					approve: "อนุมัติ",
					reject: "ปฏิเสธ",
					note: "หมายเหตุการตรวจสอบ (ไม่บังคับ)",
					submitted: "ส่งคำขอแล้ว",
					withdrawn: "ถอนคำขอแล้ว",
					reviewed: "บันทึกผลการตรวจสอบแล้ว",
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
					newRequest: "New request",
					field: "Field to change",
					currentValue: "Current value",
					requestedValue: "Requested value",
					reason: "Reason (optional)",
					submit: "Submit request",
					myRequests: "My requests",
					noRequests: "No requests yet",
					withdraw: "Withdraw",
					reviewTitle: "Requests to review",
					noPending: "No requests awaiting review",
					requester: "Requester",
					approve: "Approve",
					reject: "Reject",
					note: "Review note (optional)",
					submitted: "Request submitted",
					withdrawn: "Request withdrawn",
					reviewed: "Review saved",
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
	let selectedField = $state<FieldKey>("name");
	const currentValue = $derived(
		selectedField === "other"
			? ""
			: (data.currentValues[selectedField as keyof typeof data.currentValues] ?? "")
	);

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
	<div>
		<h1 class="text-3xl font-bold tracking-tight">{t.title}</h1>
		<p class="text-muted-foreground">{t.subtitle}</p>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>{t.newRequest}</Card.Title>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/submit" use:enhance class="grid gap-4 md:grid-cols-2">
				<div class="space-y-1">
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
				<div class="space-y-1">
					<Label for="current">{t.currentValue}</Label>
					<Input id="current" value={currentValue} disabled />
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
				<div class="md:col-span-2">
					<Button type="submit">{t.submit}</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>{t.myRequests}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if data.myRequests.length === 0}
				<p class="text-muted-foreground text-sm">{t.noRequests}</p>
			{:else}
				<div class="space-y-3">
					{#each data.myRequests as req (req.id)}
						<div
							class="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<div class="min-w-0 space-y-1">
								<div class="flex flex-wrap items-center gap-2">
									<span class="font-medium">{fieldLabel(req.field)}</span>
									<Badge variant={statusVariant(req.status)}>{statusLabel(req.status)}</Badge>
								</div>
								<p class="text-muted-foreground text-sm">
									<span class="line-through">{req.current_value ?? "—"}</span>
									<span class="px-1">→</span>
									<span class="text-foreground">{req.requested_value}</span>
								</p>
								{#if req.reason}
									<p class="text-muted-foreground text-xs">{req.reason}</p>
								{/if}
								{#if req.review_note}
									<p class="text-muted-foreground text-xs italic">{req.review_note}</p>
								{/if}
							</div>
							{#if req.status === "pending"}
								<form method="POST" action="?/withdraw" use:enhance>
									<input type="hidden" name="id" value={req.id} />
									<Button type="submit" variant="outline" size="sm">{t.withdraw}</Button>
								</form>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.canReview}
		<Card.Root>
			<Card.Header>
				<Card.Title>{t.reviewTitle}</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if data.pendingReviews.length === 0}
					<p class="text-muted-foreground text-sm">{t.noPending}</p>
				{:else}
					<div class="space-y-3">
						{#each data.pendingReviews as req (req.id)}
							<div class="border-border space-y-3 rounded-lg border p-3">
								<div class="space-y-1">
									<div class="flex flex-wrap items-center gap-2">
										<span class="font-medium">{fieldLabel(req.field)}</span>
										<span class="text-muted-foreground text-xs">
											{t.requester}: {req.requesterName} ({req.requesterEmail})
										</span>
									</div>
									<p class="text-muted-foreground text-sm">
										<span class="line-through">{req.current_value ?? "—"}</span>
										<span class="px-1">→</span>
										<span class="text-foreground">{req.requested_value}</span>
									</p>
									{#if req.reason}
										<p class="text-muted-foreground text-xs">{req.reason}</p>
									{/if}
								</div>
								<form
									method="POST"
									action="?/review"
									use:enhance
									class="flex flex-col gap-2 sm:flex-row sm:items-end"
								>
									<input type="hidden" name="id" value={req.id} />
									<div class="flex-1 space-y-1">
										<Label for={`note-${req.id}`}>{t.note}</Label>
										<Input id={`note-${req.id}`} name="review_note" />
									</div>
									<div class="flex gap-2">
										<Button type="submit" name="decision" value="approved" size="sm"
											>{t.approve}</Button
										>
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
							</div>
						{/each}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
