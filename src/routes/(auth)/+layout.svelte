<script lang="ts">
	import { page } from "$app/state";
	import LanguageSwitcher from "$lib/components/language-switcher.svelte";

	let { children } = $props();
</script>

<div class="flex justify-end px-4 pt-4">
	<LanguageSwitcher locale={page.data.locale ?? "en"} compact />
</div>

{@render children()}
