<script lang="ts">
	import { browser, dev } from "$app/environment";
	import ilLogo from "$lib/assets/layout/il-logo.png";
	import { ModeWatcher } from "mode-watcher";
	import { MetaTags } from "svelte-meta-tags";
	import { onNavigate } from "$app/navigation";
	import "../app.css";

	import LoadingIndicator from "$lib/components/loading-indicator.svelte";

	let { children } = $props();

	onNavigate((navigation) => {
		if (!browser || !document.startViewTransition) return;

		const fromPath = navigation.from?.url.pathname ?? "";
		const toPath = navigation.to?.url.pathname ?? "";
		if (fromPath === toPath) return;

		if (dev) {
			console.debug("[view-transition]", fromPath, "→", toPath);
		}

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
<LoadingIndicator />

<svelte:head>
	<link rel="icon" href={ilLogo} />
</svelte:head>

{@render children()}
