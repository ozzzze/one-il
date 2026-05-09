<script lang="ts">
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import BellIcon from "@lucide/svelte/icons/bell";
	import InfoIcon from "@lucide/svelte/icons/info";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";

	type Notification = {
		id: string;
		title: string;
		message: string;
		type: string;
		createdAt: Date | null;
	};

let {
	count = 0,
	notifications = [],
	locale = "en",
}: { count: number; notifications: Notification[]; locale?: "en" | "th" } = $props();

const copy = $derived.by(() =>
	locale === "th"
		? {
				notifications: "การแจ้งเตือน",
				unread: (n: number) => `ยังไม่อ่าน ${n}`,
				none: "ไม่มีการแจ้งเตือน",
				viewAll: "ดูการแจ้งเตือนทั้งหมด",
				justNow: "เมื่อสักครู่",
				minAgo: (m: number) => `${m} นาทีที่แล้ว`,
				hourAgo: (h: number) => `${h} ชม. ที่แล้ว`,
				dayAgo: (d: number) => `${d} วันที่แล้ว`,
			}
		: {
				notifications: "Notifications",
				unread: (n: number) => `${n} unread`,
				none: "No notifications",
				viewAll: "View all notifications",
				justNow: "just now",
				minAgo: (m: number) => `${m}m ago`,
				hourAgo: (h: number) => `${h}h ago`,
				dayAgo: (d: number) => `${d}d ago`,
			}
);

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

	function timeAgo(date: Date | null) {
		if (!date) return "";
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return copy.justNow;
	if (minutes < 60) return copy.minAgo(minutes);
		const hours = Math.floor(minutes / 60);
	if (hours < 24) return copy.hourAgo(hours);
		const days = Math.floor(hours / 24);
	return copy.dayAgo(days);
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<span class="relative">
					<BellIcon class="size-4" />
					{#if count > 0}
						<span class="bg-destructive text-destructive-foreground absolute -top-2.5 -right-2.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
							{count > 9 ? "9+" : count}
						</span>
					{/if}
				</span>
				<span class="sr-only">{copy.notifications}</span>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 overflow-hidden p-0" align="end">
		<div class="border-b px-4 py-3">
			<div class="flex items-center justify-between">
				<h4 class="text-sm font-semibold">{copy.notifications}</h4>
				{#if count > 0}
					<Badge variant="secondary" class="text-[10px]">{copy.unread(count)}</Badge>
				{/if}
			</div>
		</div>
		<div class="max-h-[300px] overflow-y-auto">
			{#if notifications.length === 0}
				<div class="flex flex-col items-center gap-2 py-8">
					<BellIcon class="text-muted-foreground size-8" />
					<p class="text-muted-foreground text-xs">{copy.none}</p>
				</div>
			{:else}
				<div class="divide-y">
					{#each notifications as notification (notification.id)}
						{@const Icon = typeIcon(notification.type)}
						<div class="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
							<div class={`mt-0.5 shrink-0 ${typeColor(notification.type)}`}>
								<Icon class="size-4" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{notification.title}</p>
								<p class="text-muted-foreground truncate text-xs">{notification.message}</p>
								<p class="text-muted-foreground mt-1 text-[10px]">{timeAgo(notification.createdAt)}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		<div class="border-t px-4 py-2">
			<a href="/notifications" class="text-primary block text-center text-xs font-medium hover:underline">
				{copy.viewAll}
			</a>
		</div>
	</Popover.Content>
</Popover.Root>
