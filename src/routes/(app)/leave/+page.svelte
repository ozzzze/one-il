<script lang="ts">
	import type { PageData } from "./$types.js";

	let { data }: { data: PageData } = $props();

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "การลา - ONE-IL",
					heading: "คำขอลา",
					body: "หน้านี้จะรวมการยื่นคำขอลา สถานะการอนุมัติ และยอดวันลาคงเหลือ — กำลังพัฒนาต่อจาก workflow ในเอกสารบุคลากร",
					linkRequests: "ไปที่คำขอ (Requests)",
				}
			: {
					pageTitle: "Leave - ONE-IL",
					heading: "Leave requests",
					body: "This page will host leave submission, approval status, and balances — extending the personnel workflow documented for ONE-IL.",
					linkRequests: "Go to Requests",
				},
	);
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
	<h2 class="text-lg font-semibold">{copy.heading}</h2>
	<p class="text-muted-foreground mt-2 text-sm leading-relaxed">{copy.body}</p>
	<p class="mt-4">
		<a href="/requests" class="text-primary text-sm font-medium hover:underline">{copy.linkRequests}</a>
	</p>
</div>
