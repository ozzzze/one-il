<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { enhance } from "$app/forms";
	import { base } from "$app/paths";
	import { toast } from "svelte-sonner";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

	let { data, form } = $props();
const copy = $derived.by(() =>
	data.locale === "th"
		? {
				newEquipmentRequest: "สร้างคำขอยืมอุปกรณ์ใหม่",
				newRequest: (label: string) => `สร้างคำขอ${label}ใหม่`,
				requestEquipment: "ส่งคำขอยืมอุปกรณ์",
				validateRequest: "ตรวจสอบคำขอ",
				backToRequests: "กลับไปหน้าคำขอ",
				details: "รายละเอียด",
				title: "หัวข้อ",
				titlePlaceholder: "สรุปสั้น ๆ เพื่อใช้ในการส่งต่อ",
				detailsOptional: "รายละเอียด (ไม่บังคับ)",
				detailsPlaceholder: "วันที่ สถานที่ รหัสอุปกรณ์ หรือบันทึกจากอาจารย์ที่ปรึกษา",
				validationPrefix:
					"การส่งฟอร์มนี้จะตรวจสอบข้อมูลบนเซิร์ฟเวอร์ด้วย Zod การบันทึกลงฐานข้อมูลจะใช้งานหลังมีโมเดล",
				validationSuffix: "กลาง",
				validated: (summary: string) => `ตรวจสอบ “${summary}” เรียบร้อย ขั้นตอนบันทึกฐานข้อมูลจะมาในลำดับถัดไป`,
			}
		: {
				newEquipmentRequest: "New Equipment Borrowing Request",
				newRequest: (label: string) => `New ${label} request`,
				requestEquipment: "Request Equipment",
				validateRequest: "Validate request",
				backToRequests: "Back to Requests",
				details: "Details",
				title: "Title",
				titlePlaceholder: "Short summary for routing",
				detailsOptional: "Details (optional)",
				detailsPlaceholder: "Dates, location, equipment tags, or advisor notes.",
				validationPrefix: "Submit validates on the server with Zod. Rows will be inserted after the shared",
				validationSuffix: "model exists.",
				validated: (summary: string) => `Validated “${summary}”. Database persistence comes next.`,
			}
);

	function withBase(path: string) {
		return `${base}${path}`;
	}

const pageTitle = $derived(
	data.kind === "equipment_borrow" ? copy.newEquipmentRequest : copy.newRequest(data.label)
);
const submitLabel = $derived(
	data.kind === "equipment_borrow" ? copy.requestEquipment : copy.validateRequest
);

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success && form?.preview) {
		toast.success(copy.validated(form.summary));
		}
	});
</script>

<svelte:head>
	<title>{pageTitle} - ONE-IL</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href={withBase("/requests")}>
			<ArrowLeftIcon class="size-4" />
			<span class="sr-only">{copy.backToRequests}</span>
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{pageTitle}</h1>
			<p class="text-muted-foreground">{data.label}</p>
		</div>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>{copy.details}</Card.Title>
			<Card.Description>{data.description}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" class="space-y-6" use:enhance>
				<input type="hidden" name="kind" value={data.kind} />

				<div class="space-y-2">
					<Label for="title">{copy.title}</Label>
					<Input
						id="title"
						name="title"
						required
						minlength={3}
						maxlength={200}
						placeholder={copy.titlePlaceholder}
						aria-invalid={Boolean(form?.fieldErrors?.title)}
					/>
					{#if form?.fieldErrors?.title}
						<p class="text-destructive text-sm">{form.fieldErrors.title[0]}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="details">{copy.detailsOptional}</Label>
					<Textarea
						id="details"
						name="details"
						maxlength={4000}
						placeholder={copy.detailsPlaceholder}
						rows={6}
						aria-invalid={Boolean(form?.fieldErrors?.details)}
					/>
					{#if form?.fieldErrors?.details}
						<p class="text-destructive text-sm">{form.fieldErrors.details[0]}</p>
					{/if}
				</div>

				<div class="rounded-lg border bg-muted/30 p-4 text-sm">
					{copy.validationPrefix}
					<code class="bg-muted mx-1 rounded px-1 py-0.5 text-xs">faculty_requests</code>
					{copy.validationSuffix}
				</div>

				<Button type="submit">{submitLabel}</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
