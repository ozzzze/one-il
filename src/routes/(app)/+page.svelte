<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import UsersIcon from "@lucide/svelte/icons/users";
	import ActivityIcon from "@lucide/svelte/icons/activity";
	import DollarSignIcon from "@lucide/svelte/icons/dollar-sign";
	import TrendingUpIcon from "@lucide/svelte/icons/trending-up";

	const stats = [
		{
			title: "Total Users",
			value: "2,420",
			change: "+12.5%",
			icon: UsersIcon,
		},
		{
			title: "Active Sessions",
			value: "573",
			change: "+8.2%",
			icon: ActivityIcon,
		},
		{
			title: "Revenue",
			value: "$48,352",
			change: "+24.1%",
			icon: DollarSignIcon,
		},
		{
			title: "Growth Rate",
			value: "14.2%",
			change: "+2.3%",
			icon: TrendingUpIcon,
		},
	];
</script>

<svelte:head>
	<title>Dashboard - SvelteForge Admin</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
		<p class="text-muted-foreground">Welcome back. Here's what's happening today.</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat (stat.title)}
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">{stat.title}</Card.Title>
					<stat.icon class="text-muted-foreground size-4" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">{stat.value}</div>
					<p class="text-muted-foreground text-xs">
						<span class="text-emerald-500">{stat.change}</span> from last month
					</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="col-span-4">
			<Card.Header>
				<Card.Title>Revenue Overview</Card.Title>
				<Card.Description>Monthly revenue for the current year</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="bg-muted/50 flex h-[300px] items-center justify-center rounded-md">
					<p class="text-muted-foreground text-sm">Chart placeholder - LayerChart integration coming in Phase 2</p>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="col-span-3">
			<Card.Header>
				<Card.Title>Recent Activity</Card.Title>
				<Card.Description>Latest actions across the platform</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					{#each [
						{ user: "Alex Johnson", action: "Created new post", time: "2 min ago" },
						{ user: "Sarah Chen", action: "Updated user role", time: "15 min ago" },
						{ user: "Mike Davis", action: "Deleted draft", time: "1 hour ago" },
						{ user: "Emma Wilson", action: "Exported report", time: "3 hours ago" },
						{ user: "James Lee", action: "Changed settings", time: "5 hours ago" },
					] as activity (activity.user)}
						<div class="flex items-center gap-3">
							<div class="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium">
								{activity.user.split(" ").map((n) => n[0]).join("")}
							</div>
							<div class="flex-1 space-y-0.5">
								<p class="text-sm font-medium">{activity.user}</p>
								<p class="text-muted-foreground text-xs">{activity.action}</p>
							</div>
							<span class="text-muted-foreground text-xs">{activity.time}</span>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>
