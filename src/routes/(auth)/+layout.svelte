<script lang="ts">
	import { page } from "$app/state";
	import LanguageSwitcher from "$lib/components/language-switcher.svelte";

	let { children } = $props();
</script>

<div class="pointer-events-none fixed top-4 right-4 z-50">
	<div class="pointer-events-auto">
		<LanguageSwitcher locale={page.data.locale ?? "en"} compact />
	</div>
</div>

{@render children()}
