<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

	let { data, form } = $props();
const copy = $derived.by(() =>
	data.locale === "th"
		? {
				pageTitle: `แก้ไข: ${data.page.title} - ONE-IL`,
				title: "แก้ไขหน้า",
				editing: "กำลังแก้ไข:",
				titleLabel: "ชื่อเรื่อง",
				titlePlaceholder: "ชื่อหน้า",
				slug: "สลัก",
				content: "เนื้อหา",
				contentPlaceholder: "เขียนเนื้อหาหน้าของคุณที่นี่...",
				template: "เทมเพลต",
				status: "สถานะ",
				default: "ค่าเริ่มต้น",
				landing: "หน้า Landing",
				blog: "บล็อก",
				draft: "ฉบับร่าง",
				published: "เผยแพร่",
				archived: "เก็บถาวร",
				cancel: "ยกเลิก",
				saveChanges: "บันทึกการเปลี่ยนแปลง",
			}
		: {
				pageTitle: `Edit: ${data.page.title} - ONE-IL`,
				title: "Edit Page",
				editing: "Editing:",
				titleLabel: "Title",
				titlePlaceholder: "Page title",
				slug: "Slug",
				content: "Content",
				contentPlaceholder: "Write your page content here...",
				template: "Template",
				status: "Status",
				default: "Default",
				landing: "Landing",
				blog: "Blog",
				draft: "Draft",
				published: "Published",
				archived: "Archived",
				cancel: "Cancel",
				saveChanges: "Save Changes",
			}
);

	let title = $state("");
	let slug = $state("");

	$effect.pre(() => {
		title = data.page.title;
		slug = data.page.slug;
	});

	$effect(() => {
		if (form?.message) toast.error(form.message);
	});

	function handleTitleInput(e: Event) {
		title = (e.target as HTMLInputElement).value;
	}

	function handleSlugInput(e: Event) {
		slug = (e.target as HTMLInputElement).value;
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" href="/content">
			<ArrowLeftIcon class="size-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground">{copy.editing} {data.page.title}</p>
		</div>
	</div>

	<Card.Root>
		<Card.Content class="pt-6">
			<form method="POST" use:enhance class="space-y-6">
				<div class="grid gap-2">
					<Label for="title">{copy.titleLabel}</Label>
					<Input
						id="title"
						name="title"
						placeholder={copy.titlePlaceholder}
						value={title}
						oninput={handleTitleInput}
						required
					/>
				</div>

				<div class="grid gap-2">
					<Label for="slug">{copy.slug}</Label>
					<div class="flex items-center gap-2">
						<span class="text-muted-foreground text-sm">/</span>
						<Input
							id="slug"
							name="slug"
							placeholder="page-slug"
							value={slug}
							oninput={handleSlugInput}
							class="font-mono"
						/>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="content">{copy.content}</Label>
					<Textarea
						id="content"
						name="content"
						placeholder={copy.contentPlaceholder}
						rows={12}
						value={data.page.content}
					/>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="grid gap-2">
						<Label>{copy.template}</Label>
						<Select.Root name="template" type="single" value={data.page.template}>
							<Select.Trigger>
								<span class="capitalize">{data.page.template}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="default">{copy.default}</Select.Item>
								<Select.Item value="landing">{copy.landing}</Select.Item>
								<Select.Item value="blog">{copy.blog}</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="grid gap-2">
						<Label>{copy.status}</Label>
						<Select.Root name="status" type="single" value={data.page.status}>
							<Select.Trigger>
								<span class="capitalize">{data.page.status}</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="draft">{copy.draft}</Select.Item>
								<Select.Item value="published">{copy.published}</Select.Item>
								<Select.Item value="archived">{copy.archived}</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<Button variant="outline" href="/content">{copy.cancel}</Button>
					<Button type="submit">{copy.saveChanges}</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
