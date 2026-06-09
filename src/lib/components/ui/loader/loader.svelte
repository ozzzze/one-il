<script lang="ts">
	import { cn } from "$lib/utils.js";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";

	let {
		variant = "classic",
		size = "md",
		class: className = "",
		...restProps
	} = $props<{
		variant?: "classic" | "clock";
		size?: "sm" | "md" | "lg";
		class?: string;
		[key: string]: any;
	}>();

	// Sizes mappings
	const clockSizes: Record<string, string> = {
		sm: "size-6 border-[1.5px]",
		md: "size-10 border-2",
		lg: "size-16 border-[3px]",
	};

	const spinnerSizes: Record<string, string> = {
		sm: "size-4",
		md: "size-8",
		lg: "size-12",
	};
</script>

{#if variant === "clock"}
	<!-- Time Keeper Loader (Clock Variant) -->
	<div
		class={cn(
			"border-primary bg-background/50 relative flex items-center justify-center rounded-full",
			clockSizes[size],
			className
		)}
		{...restProps}
	>
		<!-- Clock center pin -->
		<div class="bg-primary absolute z-10 size-1.5 rounded-full"></div>

		<!-- Hour hand -->
		<div
			class="hand hand-hour bg-primary absolute top-1/2 left-1/2 w-[1.5px] origin-bottom rounded-full"
		></div>

		<!-- Minute hand -->
		<div
			class="hand hand-minute bg-primary/80 absolute top-1/2 left-1/2 w-[1.5px] origin-bottom rounded-full"
		></div>
	</div>
{:else}
	<!-- Classic Spinner Loader -->
	<Loader2Icon
		class={cn("text-primary shrink-0 animate-spin", spinnerSizes[size], className)}
		{...restProps}
	/>
{/if}

<style>
	@keyframes tick {
		from {
			transform: translate(-50%, -100%) rotate(0deg);
		}
		to {
			transform: translate(-50%, -100%) rotate(360deg);
		}
	}

	.hand {
		transform: translate(-50%, -100%);
	}

	.hand-hour {
		height: 25%;
		animation: tick 8s linear infinite;
	}

	.hand-minute {
		height: 38%;
		animation: tick 1.5s linear infinite;
	}
</style>
