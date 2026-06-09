<script lang="ts">
	import { navigating } from "$app/stores";
	import { page } from "$app/state";
	import { fade } from "svelte/transition";
	import { Loader } from "$lib/components/ui/loader";
	import { globalLoading } from "$lib/utils/loading.svelte.js";

	// Determine the variant dynamically from the URL parameter for testing, defaulting to 'overlay'
	const variant = $derived(
		(page.url.searchParams.get("loading_style") as "bar" | "overlay") || "overlay"
	);

	let isVisible = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;
	let progress = $state(0);
	let progressInterval: ReturnType<typeof setInterval> | null = null;

	const isAnyLoading = $derived(!!$navigating || globalLoading.active);

	$effect(() => {
		if (isAnyLoading) {
			// Clear any previous timers or intervals
			if (timer) clearTimeout(timer);
			if (progressInterval) clearInterval(progressInterval);

			progress = 0;

			// Introduce a small delay (150ms) to prevent flickering on ultra-fast loads
			timer = setTimeout(() => {
				isVisible = true;

				if (variant === "bar") {
					progress = 15;
					// Simulate a progressive loading bar
					progressInterval = setInterval(() => {
						if (progress < 90) {
							// Increments slow down as they approach 90%
							const diff = 90 - progress;
							const step = Math.max(diff * 0.15, 2);
							progress = Math.min(progress + step, 90);
						}
					}, 120);
				}
			}, 150);
		} else {
			// Navigation/Loading ended
			if (timer) clearTimeout(timer);

			if (isVisible) {
				if (variant === "bar") {
					// Complete the bar to 100%
					progress = 100;
					if (progressInterval) clearInterval(progressInterval);

					// Wait slightly for visual completion, then hide the bar
					setTimeout(() => {
						isVisible = false;
					}, 200);
				} else {
					isVisible = false;
				}
			}
		}

		return () => {
			if (timer) clearTimeout(timer);
			if (progressInterval) clearInterval(progressInterval);
		};
	});
</script>

{#if isVisible}
	{#if variant === "overlay"}
		<!-- Option 2: Full-screen Blur Overlay -->
		<div
			transition:fade={{ duration: 250 }}
			class="bg-background/80 fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]"
		>
			<!-- Spinner -->
			<Loader variant="clock" size="md" />
			<p class="text-muted-foreground text-sm font-medium tracking-wide">
				{page.data.locale === "th" ? "กำลังโหลดข้อมูล..." : "Loading content..."}
			</p>
		</div>
	{:else}
		<!-- Option 1: Global Slim Loading Bar -->
		<div
			transition:fade={{ duration: 200 }}
			class="bg-muted fixed top-0 right-0 left-0 z-50 h-[3px] w-full overflow-hidden"
		>
			<!-- Sliding active bar with brand gradient -->
			<div
				class="from-primary via-accent to-primary h-full bg-linear-to-r transition-all duration-150 ease-out"
				style="width: {progress}%"
			></div>
		</div>
	{/if}
{/if}
