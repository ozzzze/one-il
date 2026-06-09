<script lang="ts">
	import type { ApprovalStepperItem } from "$lib/change-request/scr-stepper.js";
	import { cn } from "$lib/utils.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ClockIcon from "@lucide/svelte/icons/clock";

	interface Props {
		steps: ApprovalStepperItem[];
		class?: string;
		embedded?: boolean;
		moduleLabel?: string;
	}

	let {
		steps,
		class: className,
		embedded = false,
		moduleLabel = "คำขอเปลี่ยนแปลงระบบ",
	}: Props = $props();

	function boxClass(state: ApprovalStepperItem["state"]): string {
		if (state === "completed") return "bg-emerald-500 text-white";
		if (state === "current")
			return "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/50 animate-pulse";
		return "bg-muted text-muted-foreground border border-muted-foreground/20";
	}
</script>

<div
	class={cn(
		"flex flex-col rounded-xl border p-5 text-sm shadow-sm transition-all",
		embedded ? "bg-muted/30 dark:bg-muted/10" : "bg-card",
		className
	)}
>
	<div
		class="mb-5 flex items-center justify-between border-b border-neutral-300 pb-3 dark:border-neutral-700/50"
	>
		<p class="text-foreground text-sm font-semibold">เส้นทางการอนุมัติ & ประวัติการตรวจสอบ</p>
		<span class="bg-muted text-muted-foreground rounded px-2 py-0.5 text-[10px]">{moduleLabel}</span
		>
	</div>

	<div class="relative flex flex-col gap-6 pl-1">
		{#each steps as step, i (step.order)}
			<div class="relative flex items-start gap-4">
				{#if i < steps.length - 1}
					<div
						class="absolute top-8 -bottom-6 left-3.5 w-0.5 transition-colors duration-300 sm:left-4 {step.state ===
						'completed'
							? 'bg-emerald-500'
							: 'bg-muted-foreground/20 dark:bg-muted/30'}"
						aria-hidden="true"
					></div>
				{/if}

				<div
					class="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-all sm:size-8 sm:rounded-lg sm:text-sm {boxClass(
						step.state
					)}"
					aria-current={step.state === "current" ? "step" : undefined}
				>
					{#if step.state === "completed"}
						<CheckIcon class="size-4" />
					{:else if step.state === "current"}
						<ClockIcon class="size-4" />
					{:else}
						{step.order}
					{/if}
				</div>

				<div class="flex min-w-0 flex-1 flex-col pt-0.5 sm:pt-1">
					<div class="flex flex-wrap items-center justify-between gap-1">
						<p class="text-foreground flex items-center gap-1.5 text-sm leading-none font-semibold">
							{step.label}
							{#if step.state === "current"}
								<span
									class="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-500/20"
								>
									กำลังดำเนินการ
								</span>
							{/if}
						</p>
						{#if step.dateLabel}
							<span
								class="text-muted-foreground bg-background/50 border-muted/30 rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none"
							>
								{step.dateLabel}
								{#if step.timeLabel}· {step.timeLabel}{/if}
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
