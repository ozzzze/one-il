<script lang="ts">
	import ilLogo from "$lib/assets/layout/il-logo.png";
	import { ModeWatcher } from "mode-watcher";
	import { MetaTags } from "svelte-meta-tags";
	import { onNavigate } from "$app/navigation";
	import DevErrorPanel from "$lib/components/dev-error-panel.svelte";
	import "../app.css";

	let { children } = $props();

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<MetaTags
	title="ONE-IL"
	titleTemplate="%s | ONE-IL"
	description="A full-featured admin dashboard built with SvelteKit 2, Svelte 5, Tailwind CSS 4, Supabase, and session-based auth."
	openGraph={{
		type: "website",
		url: "https://one-il.dev",
		title: "ONE-IL",
		description:
			"A full-featured admin dashboard built with SvelteKit 2, Svelte 5, Tailwind CSS 4, Supabase, and session-based auth.",
		siteName: "ONE-IL",
	}}
	twitter={{
		cardType: "summary",
		title: "ONE-IL",
		description:
			"A full-featured admin dashboard built with SvelteKit 2, Svelte 5, Tailwind CSS 4, Supabase, and session-based auth.",
	}}
/>

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={ilLogo} />
</svelte:head>

{@render children()}

<DevErrorPanel />
