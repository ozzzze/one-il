<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { enhance } from "$app/forms";
	import InfoIcon from "@lucide/svelte/icons/info";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	import CheckIcon from "@lucide/svelte/icons/check";
	import TrashIcon from "@lucide/svelte/icons/trash-2";
	import BellIcon from "@lucide/svelte/icons/bell";
	import { toast } from "svelte-sonner";

	let { data, form } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					done: "เสร็จสิ้น",
					title: "การแจ้งเตือน",
					pageTitle: "การแจ้งเตือน - ONE-IL",
					unread: (count: number) => `คุณมีการแจ้งเตือนที่ยังไม่อ่าน ${count} รายการ`,
					allRead: "อ่านครบแล้ว ไม่มีการแจ้งเตือนที่ยังไม่อ่าน",
					markAllRead: "ทำเครื่องหมายว่าอ่านทั้งหมด",
					noneYet: "ยังไม่มีการแจ้งเตือน",
					new: "ใหม่",
					markAsRead: "ทำเครื่องหมายว่าอ่านแล้ว",
					delete: "ลบ",
				}
			: {
					done: "Done",
					title: "Notifications",
					pageTitle: "Notifications - ONE-IL",
					unread: (count: number) =>
						`You have ${count} unread notification${count !== 1 ? "s" : ""}.`,
					allRead: "All caught up. No unread notifications.",
					markAllRead: "Mark All Read",
					noneYet: "No notifications yet",
					new: "New",
					markAsRead: "Mark as read",
					delete: "Delete",
				}
	);

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) toast.success(copy.done);
	});

	const unreadCount = $derived(data.notifications.filter((n) => !n.read).length);

	function typeIcon(type: string) {
		switch (type) {
			case "warning":
				return AlertTriangleIcon;
			case "error":
				return CircleAlertIcon;
			case "success":
				return CheckCircleIcon;
			default:
				return InfoIcon;
		}
	}

	function typeColor(type: string) {
		switch (type) {
			case "warning":
				return "text-yellow-600 dark:text-yellow-400";
			case "error":
				return "text-red-600 dark:text-red-400";
			case "success":
				return "text-green-600 dark:text-green-400";
			default:
				return "text-blue-600 dark:text-blue-400";
		}
	}

	function formatDate(date: Date | string | null) {
		if (!date) return "";
		return new Intl.DateTimeFormat(data.locale === "th" ? "th-TH" : "en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		}).format(new Date(date));
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
			<p class="text-muted-foreground">
				{#if unreadCount > 0}
					{copy.unread(unreadCount)}
				{:else}
					{copy.allRead}
				{/if}
			</p>
		</div>
		{#if unreadCount > 0}
			<form method="POST" action="?/markAllRead" use:enhance>
				<Button variant="outline" type="submit">
					<CheckIcon class="mr-2 size-4" />
					{copy.markAllRead}
				</Button>
			</form>
		{/if}
	</div>

	{#if data.notifications.length === 0}
		<div class="bg-muted/50 flex h-75 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
			<BellIcon class="text-muted-foreground size-10" />
			<p class="text-muted-foreground text-sm">{copy.noneYet}</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.notifications as notification (notification.id)}
				{@const Icon = typeIcon(notification.type)}
				<Card.Root class={!notification.read ? "border-primary/30 bg-primary/5" : ""}>
					<Card.Content class="flex items-start gap-4 pt-6">
						<div class={`mt-0.5 ${typeColor(notification.type)}`}>
							<Icon class="size-5" />
						</div>
						<div class="flex-1 space-y-1">
							<div class="flex items-start justify-between gap-2">
								<div>
									<p class="text-sm font-medium leading-none">
										{notification.title}
										{#if !notification.read}
											<Badge variant="default" class="ml-2 text-[10px]">{copy.new}</Badge>
										{/if}
									</p>
									<p class="text-muted-foreground mt-1 text-sm">{notification.message}</p>
								</div>
								<span class="text-muted-foreground shrink-0 text-xs">{formatDate(notification.created_at)}</span>
							</div>
						</div>
						<div class="flex shrink-0 gap-1">
							{#if !notification.read}
								<form method="POST" action="?/markRead" use:enhance>
									<input type="hidden" name="id" value={notification.id} />
									<Button variant="ghost" size="icon" class="size-8" type="submit" title={copy.markAsRead}>
										<CheckIcon class="size-4" />
									</Button>
								</form>
							{/if}
							<form method="POST" action="?/delete" use:enhance>
								<input type="hidden" name="id" value={notification.id} />
								<Button variant="ghost" size="icon" class="text-destructive size-8" type="submit" title={copy.delete}>
									<TrashIcon class="size-4" />
								</Button>
							</form>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
