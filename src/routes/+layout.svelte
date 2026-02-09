<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { ModeWatcher } from "mode-watcher";
	import "../app.css";

	let { children } = $props();
</script>

<ModeWatcher />

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SvelteForge Admin</title>
</svelte:head>

{@render children()}
