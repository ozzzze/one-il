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

	const trackHeight = $derived(compact ? "h-8" : "h-9");
	const segmentHeight = $derived(compact ? "h-7" : "h-8");
	const segmentMinWidth = $derived(compact ? "min-w-8" : "min-w-9");
</script>

<div
	role="group"
	aria-label={labels.switchLanguage}
	class="border-border bg-muted/40 inline-flex items-center rounded-md border p-0.5 shadow-xs {trackHeight}"
>
	<span class="sr-only">{labels.language}</span>
	<a
		href={links.en}
		data-sveltekit-reload
		aria-label={`${labels.switchLanguage}: ${labels.english}`}
		aria-current={locale === "en" ? "page" : undefined}
		class={`focus-visible:ring-ring flex shrink-0 items-center justify-center rounded-sm px-2 text-xs font-medium transition-colors focus-visible:z-10 focus-visible:ring-[3px] focus-visible:outline-none ${segmentHeight} ${segmentMinWidth} ${
			locale === "en"
				? "bg-background text-foreground dark:bg-accent dark:text-accent-foreground shadow-sm"
				: "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
		}`}
	>
		EN
	</a>
	<a
		href={links.th}
		data-sveltekit-reload
		aria-label={`${labels.switchLanguage}: ${labels.thai}`}
		aria-current={locale === "th" ? "page" : undefined}
		class={`focus-visible:ring-ring flex shrink-0 items-center justify-center rounded-sm px-2 text-xs font-medium transition-colors focus-visible:z-10 focus-visible:ring-[3px] focus-visible:outline-none ${segmentHeight} ${segmentMinWidth} ${
			locale === "th"
				? "bg-background text-foreground dark:bg-accent dark:text-accent-foreground shadow-sm"
				: "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
		}`}
	>
		TH
	</a>
</div>
