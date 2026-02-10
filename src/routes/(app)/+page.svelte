<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { AreaChart, PieChart } from "layerchart";
	import { scaleUtc } from "d3-scale";
	import { mode } from "mode-watcher";
	import UsersIcon from "@lucide/svelte/icons/users";
	import ActivityIcon from "@lucide/svelte/icons/activity";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import BellIcon from "@lucide/svelte/icons/bell";
	import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
	import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import PenToolIcon from "@lucide/svelte/icons/pen-tool";
	import InfoIcon from "@lucide/svelte/icons/info";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";

	let { data } = $props();

	const signupChartConfig = {
		signups: { label: "Signups", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	const chartData = $derived(
		data.monthlySignups.map((d) => ({
			date: new Date(d.month),
			signups: d.count,
		}))
	);

	const roleChartConfig = {
		admin: { label: "Admin", color: "var(--chart-1)" },
		editor: { label: "Editor", color: "var(--chart-3)" },
		viewer: { label: "Viewer", color: "var(--chart-5)" },
	} satisfies Chart.ChartConfig;

	const roleData = $derived(
		data.roleDistribution.map((d) => ({
			key: d.role,
			label: d.role.charAt(0).toUpperCase() + d.role.slice(1),
			value: d.count,
		}))
	);

	const roleColors = $derived(
		data.roleDistribution.map((d) => {
			switch (d.role) {
				case "admin": return roleChartConfig.admin.color;
				case "editor": return roleChartConfig.editor.color;
				default: return roleChartConfig.viewer.color;
			}
		})
	);

	const stats = $derived([
		{
			title: "Total Users",
			value: data.stats.totalUsers.toLocaleString(),
			icon: UsersIcon,
			trend: data.trends.users,
		},
		{
			title: "Active Sessions",
			value: data.stats.activeSessions.toLocaleString(),
			icon: ActivityIcon,
			trend: null,
		},
		{
			title: "Total Pages",
			value: data.stats.totalPages.toLocaleString(),
			icon: FileTextIcon,
			trend: data.trends.pages,
		},
		{
			title: "Unread Notifications",
			value: data.stats.unreadNotifications.toLocaleString(),
			icon: BellIcon,
			trend: null,
		},
	]);

	function timeAgo(isoString: string) {
		const diff = Date.now() - new Date(isoString).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return "just now";
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	function getInitials(name: string) {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	function notifIcon(type: string) {
		switch (type) {
			case "warning": return AlertTriangleIcon;
			case "error": return CircleAlertIcon;
			case "success": return CheckCircleIcon;
			default: return InfoIcon;
		}
	}

	function notifColor(type: string) {
		switch (type) {
			case "warning": return "text-yellow-600 dark:text-yellow-400";
			case "error": return "text-red-600 dark:text-red-400";
			case "success": return "text-green-600 dark:text-green-400";
			default: return "text-blue-600 dark:text-blue-400";
		}
	}
</script>

<svelte:head>
	<title>Dashboard - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
		<p class="text-muted-foreground">Welcome back. Here's what's happening today.</p>
	</div>

	<!-- KPI Cards with Trend Arrows -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat (stat.title)}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">{stat.title}</Card.Title>
					<stat.icon class="text-muted-foreground size-4" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stat.value}</div>
					{#if stat.trend !== null}
						<div class="mt-1 flex items-center gap-1 text-xs">
							{#if stat.trend > 0}
								<TrendingUpIcon class="size-3 text-green-600" />
								<span class="text-green-600">+{stat.trend}%</span>
							{:else if stat.trend < 0}
								<TrendingDownIcon class="size-3 text-red-600" />
								<span class="text-red-600">{stat.trend}%</span>
							{:else}
								<span class="text-muted-foreground">No change</span>
							{/if}
							<span class="text-muted-foreground">vs last month</span>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<!-- Quick Stats Row -->
	<div class="grid gap-4 md:grid-cols-2">
		<Card.Root>
			<Card.Content class="flex items-center gap-4 pt-6">
				<div class="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
					<BookOpenIcon class="size-5 text-green-600 dark:text-green-400" />
				</div>
				<div>
					<p class="text-2xl font-bold">{data.quickStats.publishedPages}</p>
					<p class="text-muted-foreground text-sm">Published Pages</p>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="flex items-center gap-4 pt-6">
				<div class="flex size-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
					<PenToolIcon class="size-5 text-purple-600 dark:text-purple-400" />
				</div>
				<div>
					<p class="text-2xl font-bold">{data.quickStats.activeEditors}</p>
					<p class="text-muted-foreground text-sm">Active Editors</p>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Charts Row: Signups + Role Distribution -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="lg:col-span-4">
			<Card.Header>
				<Card.Title>User Signups</Card.Title>
				<Card.Description>New user registrations over time</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if chartData.length > 0}
						<Chart.Container config={signupChartConfig} class="h-[300px] w-full">
							<AreaChart
								data={chartData}
								x="date"
								xScale={scaleUtc()}
								series={[
									{
										key: "signups",
										label: signupChartConfig.signups.label,
										color: signupChartConfig.signups.color,
									},
								]}
								props={{
									xAxis: {
										format: (d: Date) =>
											d.toLocaleDateString("en-US", { month: "short" }),
									},
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</AreaChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">No signup data yet</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-3">
			<Card.Header>
				<Card.Title>User Roles</Card.Title>
				<Card.Description>Distribution of user roles</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if roleData.length > 0}
						<Chart.Container config={roleChartConfig} class="h-[300px] w-full">
							<PieChart
								data={roleData}
								value="value"
								c="key"
								cRange={roleColors}
								innerRadius={0.6}
								legend
							>
								{#snippet tooltip()}
									<Chart.Tooltip nameKey="label" />
								{/snippet}
							</PieChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">No user data yet</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Activity + Notifications Row -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="lg:col-span-4">
			<Card.Header>
				<Card.Title>Recent Activity</Card.Title>
				<Card.Description>Latest actions across the platform</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.recentActivity.length > 0}
					<div class="space-y-4">
						{#each data.recentActivity as activity (activity.time)}
							<div class="flex items-center gap-3">
								<div class="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium">
									{getInitials(activity.label)}
								</div>
								<div class="flex-1 space-y-0.5">
									<p class="text-sm font-medium">{activity.label}</p>
									<p class="text-muted-foreground text-xs">{activity.description}</p>
								</div>
								<span class="text-muted-foreground shrink-0 text-xs">{timeAgo(activity.time)}</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">No recent activity</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-3">
			<Card.Header class="flex flex-row items-center justify-between">
				<div>
					<Card.Title>Notifications</Card.Title>
					<Card.Description>Recent alerts and updates</Card.Description>
				</div>
				<a href="/notifications" class="text-primary text-xs font-medium hover:underline">View all</a>
			</Card.Header>
			<Card.Content>
				{#if data.recentNotifications.length > 0}
					<ScrollArea class="max-h-[250px]">
						<div class="space-y-3">
							{#each data.recentNotifications as notif (notif.id)}
								{@const Icon = notifIcon(notif.type)}
								<div class="flex items-start gap-3">
									<div class={`mt-0.5 shrink-0 ${notifColor(notif.type)}`}>
										<Icon class="size-4" />
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<p class="truncate text-sm font-medium">{notif.title}</p>
											{#if !notif.read}
												<Badge variant="default" class="shrink-0 text-[9px]">New</Badge>
											{/if}
										</div>
										<p class="text-muted-foreground truncate text-xs">{notif.message}</p>
									</div>
								</div>
							{/each}
						</div>
					</ScrollArea>
				{:else}
					<div class="flex h-[100px] items-center justify-center">
						<p class="text-muted-foreground text-sm">No notifications</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
