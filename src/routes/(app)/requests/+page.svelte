<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import CalendarCheckIcon from "@lucide/svelte/icons/calendar-check";
	import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
	import GraduationCapIcon from "@lucide/svelte/icons/graduation-cap";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import PackageIcon from "@lucide/svelte/icons/package";
	import roomCardImage from "$lib/assets/room-booking/card-room.jpg";
	import equipmentCardImage from "$lib/assets/equipment-borrowing/card-borrow.jpg";
	import type { Component } from "svelte";
	import type { FacultyRequestKind } from "$lib/requests/request-schema.js";
	import { requestCenterKinds, getRequestKindMeta } from "$lib/requests/request-meta.js";
	import { getRequestsPageCopy } from "$lib/content/page-copy.js";

	let { data } = $props();
	const copy = $derived(getRequestsPageCopy(data.locale));
	const requestKindMeta = $derived(getRequestKindMeta(data.locale));

	const kindIcons: Record<FacultyRequestKind, Component> = {
		leave: CalendarDaysIcon,
		room_booking: CalendarCheckIcon,
		equipment_borrow: PackageIcon,
		academic_service: GraduationCapIcon,
	};

	const requestCardBackgroundImages: Partial<Record<FacultyRequestKind, string>> = {
		room_booking: roomCardImage,
		equipment_borrow: equipmentCardImage,
	};
</script>

<svelte:head>
	<title>{copy.title}</title>
</svelte:head>

<div class="space-y-8">
	<section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight">{copy.heading}</h1>
			<p class="text-muted-foreground max-w-2xl text-base">{copy.description}</p>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
		{#each requestCenterKinds as kind (kind)}
			{@const Icon = kindIcons[kind]}
			{@const meta = requestKindMeta[kind]}
			{@const backgroundImage = requestCardBackgroundImages[kind]}
			<Card.Root class="relative overflow-hidden transition-colors hover:bg-muted/40">
				{#if backgroundImage}
					<div class="absolute inset-0">
						<img
							src={backgroundImage}
							alt={`${meta.label} background`}
							class="size-full scale-110 object-cover blur-[1px]"
						/>
						<div class="bg-background/75 absolute inset-0 backdrop-blur-xs"></div>
					</div>
				{/if}
				<Card.Header class="relative z-10 space-y-3">
					<div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
						<Icon class="size-5" />
					</div>
					<div>
						<Card.Title class="text-lg">{meta.label}</Card.Title>
						<Card.Description>{meta.description}</Card.Description>
					</div>
				</Card.Header>
				<Card.Content class="relative z-10">
					<Button href={`/requests/new?kind=${kind}`} class="w-full sm:w-auto">
						{copy.startRequestCta}
						<ArrowRightIcon class="size-4" />
					</Button>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section>
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-lg">
					<InboxIcon class="text-muted-foreground size-5" />
					{copy.yourRequestsHeading}
				</Card.Title>
				<Card.Description>
					{copy.yourRequestsDescription}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.items.length === 0}
					<div class="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center text-sm">
						<InboxIcon class="size-8 opacity-50" />
						<p>{copy.noSavedRequests}</p>
						<p class="max-w-md">
							{copy.noSavedRequestsHint}
						</p>
					</div>
				{:else}
					<ul class="divide-y rounded-xl border">
						{#each data.items as item (item.id)}
							<li class="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
								<span class="font-medium">{item.title}</span>
								<Badge variant="outline">{item.status}</Badge>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>
	</section>
</div>
