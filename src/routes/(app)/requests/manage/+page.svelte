<script lang="ts">
	import { base } from "$app/paths";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { localizedDualField } from "$lib/i18n/display.js";
	import {
		formatReservationDateTime,
		formatReservationWindow,
		getFacultyRequestStatusLabel,
		type FacultyRequestStatus,
	} from "$lib/requests/faculty-request.js";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import InboxIcon from "@lucide/svelte/icons/inbox";

	let { data } = $props();

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					title: "คิวอนุมัติคำขอ",
					description: "ติดตามคำขอที่กำลังรอผู้อนุมัติพิจารณา",
					requestNo: "เลขที่คำขอ",
					requester: "ผู้ขอ",
					roomSchedule: "ห้องและช่วงเวลา",
					step: "ลำดับอนุมัติ",
					status: "สถานะ",
					open: "เปิดคำขอ",
					empty: "ไม่มีคำขอที่รอการพิจารณา",
					emptyHint: "เมื่อมีคำขอจองห้องเข้ามาในคิว จะแสดงรายการที่หน้านี้",
					notAvailable: "ไม่มีข้อมูล",
				}
			: {
					title: "Approval queue",
					description: "Review requests currently waiting for an approver.",
					requestNo: "Request no.",
					requester: "Requester",
					roomSchedule: "Room and schedule",
					step: "Approval step",
					status: "Status",
					open: "Open request",
					empty: "No pending approvals",
					emptyHint: "Incoming room booking approvals will appear here.",
					notAvailable: "Not available",
				},
	);

	function withBase(path: string) {
		return `${base}${path}`;
	}

	function statusLabel(status: string) {
		return getFacultyRequestStatusLabel(data.locale, status as FacultyRequestStatus);
	}

	function roomSchedule(item: {
		roomName: string | null;
		roomNameEn: string | null;
		roomCode: string | null;
		startAt: string | null;
		endAt: string | null;
	}) {
		const roomName = item.roomName
			? localizedDualField(data.locale, item.roomName, item.roomNameEn)
			: copy.notAvailable;
		const roomPart = item.roomCode ? `${item.roomCode} - ${roomName}` : roomName;
		if (item.startAt && item.endAt) {
			return `${roomPart} · ${formatReservationWindow(data.locale, item.startAt, item.endAt)}`;
		}
		if (item.startAt) {
			return `${roomPart} · ${formatReservationDateTime(data.locale, item.startAt)}`;
		}
		return roomPart;
	}

	function statusClass(status: string) {
		switch (status) {
			case "approved":
				return "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300";
			case "rejected":
			case "cancelled":
				return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
			case "pending_approval":
				return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
			default:
				return "";
		}
	}
</script>

<svelte:head>
	<title>{copy.title} - ONE-IL</title>
</svelte:head>

<div class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground max-w-2xl">{copy.description}</p>
	</div>

	<Card.Root>
		<Card.Content class="pt-6">
			{#if data.queue.length === 0}
				<div class="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center text-sm">
					<InboxIcon class="size-8 opacity-50" />
					<p>{copy.empty}</p>
					<p class="max-w-md">{copy.emptyHint}</p>
				</div>
			{:else}
				<div class="rounded-md border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>{copy.requestNo}</Table.Head>
								<Table.Head>{copy.requester}</Table.Head>
								<Table.Head>{copy.roomSchedule}</Table.Head>
								<Table.Head>{copy.step}</Table.Head>
								<Table.Head>{copy.status}</Table.Head>
								<Table.Head class="w-[120px]"></Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.queue as item, i (item.stepId)}
								<Table.Row>
									<Table.Cell>
										<div class="space-y-1">
											<p class="font-medium">{item.title}</p>
											<p class="text-muted-foreground font-mono text-xs">{item.requestNo}</p>
										</div>
									</Table.Cell>
									<Table.Cell>{item.requesterName ?? copy.notAvailable}</Table.Cell>
									<Table.Cell class="text-muted-foreground max-w-sm text-sm">
										{roomSchedule(item)}
									</Table.Cell>
									<Table.Cell>#{item.stepOrder}</Table.Cell>
									<Table.Cell>
										<Badge variant="outline" class={statusClass(item.status)}>
											{statusLabel(item.status)}
										</Badge>
									</Table.Cell>
									<Table.Cell>
										<Button variant="outline" size="sm" href={withBase(`/requests/${item.requestId}`)}>
											{copy.open}
											<ArrowRightIcon class="size-4" />
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
