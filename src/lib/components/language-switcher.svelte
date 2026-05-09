<script lang="ts">
	import { page } from "$app/state";
	import { getUiLabels } from "$lib/content/labels.js";
	import type { Locale } from "$lib/i18n/locales.js";

	let { locale, compact = false }: { locale: Locale; compact?: boolean } = $props();

	const labels = $derived(getUiLabels(locale));

	const links = $derived.by(() => {
		const pathname = page.url.pathname;
		const baseParams = new URLSearchParams(page.url.searchParams);
		baseParams.delete("lang");

		const buildHref = (target: Locale) => {
			const params = new URLSearchParams(baseParams);
			params.set("lang", target);
			const query = params.toString();
			return query ? `${pathname}?${query}` : pathname;
		};

		return {
			en: buildHref("en"),
			th: buildHref("th"),
		};
	});
</script>

<nav aria-label={labels.switchLanguage} class="inline-flex items-center gap-1">
	<span class="sr-only">{labels.language}</span>
	<a
		href={links.en}
		data-sveltekit-reload
		aria-label={`${labels.switchLanguage}: ${labels.english}`}
		aria-current={locale === "en" ? "page" : undefined}
		class={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
			locale === "en"
				? "bg-primary text-primary-foreground border-primary"
				: "hover:bg-muted text-muted-foreground border-border"
		} ${compact ? "h-7 min-w-8" : "h-8 min-w-9"}`}
	>
		EN
	</a>
	<a
		href={links.th}
		data-sveltekit-reload
		aria-label={`${labels.switchLanguage}: ${labels.thai}`}
		aria-current={locale === "th" ? "page" : undefined}
		class={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
			locale === "th"
				? "bg-primary text-primary-foreground border-primary"
				: "hover:bg-muted text-muted-foreground border-border"
		} ${compact ? "h-7 min-w-8" : "h-8 min-w-9"}`}
	>
		TH
	</a>
</nav>
