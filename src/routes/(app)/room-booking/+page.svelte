<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";

	type RoomBookingModule = {
		title: string;
		description: string;
		status: string;
	};

	let { data } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "จองห้อง - ONE-IL",
					title: "จองห้อง (ตัวอย่าง)",
					description: "หน้าโมดูลตัวอย่างสำหรับทดสอบสิทธิ์การเข้าถึง",
					modules: [
						{
							title: "แบบฟอร์มคำขอ",
							description: "ส่งคำขอใช้ห้องพร้อมวันที่ เวลา และวัตถุประสงค์",
							status: "ตัวอย่าง: UI ฟอร์มยังไม่เสร็จ",
						},
						{
							title: "คิวอนุมัติ",
							description: "ตรวจสอบคำขอที่เข้ามาและการตัดสินใจอนุมัติ",
							status: "ตัวอย่าง: ตรรกะคิวยังไม่เสร็จ",
						},
						{
							title: "ปฏิทินการจอง",
							description: "ติดตามความพร้อมใช้งานของห้องและการมองเห็นตารางเวลา",
							status: "ตัวอย่าง: การซิงก์ปฏิทินยังไม่เสร็จ",
						},
					] as RoomBookingModule[],
				}
			: {
					pageTitle: "Room Booking - ONE-IL",
					title: "Room Booking (Mockup)",
					description: "Simple module mockup page for permission testing.",
					modules: [
						{
							title: "Request Form",
							description: "Submit room requests with date, time, and purpose.",
							status: "Placeholder: Form UI pending",
						},
						{
							title: "Approval Queue",
							description: "Review incoming requests and approval decisions.",
							status: "Placeholder: Queue logic pending",
						},
						{
							title: "Booking Calendar",
							description: "Track room availability and schedule visibility.",
							status: "Placeholder: Calendar sync pending",
						},
					] as RoomBookingModule[],
				}
	);
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<section class="space-y-4">
	<header class="space-y-1">
		<h1 class="text-2xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground text-sm">
			{copy.description}
		</p>
	</header>

	<div class="grid gap-3 md:grid-cols-3">
		{#each copy.modules as module, i (module.title)}
			<Card.Root>
				<Card.Header class="space-y-1 pb-3">
					<Card.Title class="text-base">{module.title}</Card.Title>
					<Card.Description class="text-xs">{module.description}</Card.Description>
				</Card.Header>
				<Card.Content>
					<p class="text-muted-foreground text-xs">{module.status}</p>
					<p class="mt-2 text-xs font-medium">Card #{i + 1}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</section>
