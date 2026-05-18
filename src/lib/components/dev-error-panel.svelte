<script lang="ts">
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		clearDevErrorLog,
		copyDevErrorLog,
		devErrorLog,
		installDevErrorCapture,
	} from "$lib/dev/error-log.svelte.js";
	import { toast } from "svelte-sonner";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import BugIcon from "@lucide/svelte/icons/bug";

	let copyPending = $state(false);

	const count = $derived(devErrorLog.entries.length);

	$effect(() => {
		if (!import.meta.env.DEV) return;
		return installDevErrorCapture();
	});

	async function copyAll() {
		if (count === 0) return;
		copyPending = true;
		const ok = await copyDevErrorLog(devErrorLog.entries);
		copyPending = false;
		if (ok) toast.success("Copied console errors to clipboard");
		else toast.error("Could not copy — check browser clipboard permission");
	}

	async function copyOne(id: string) {
		const entry = devErrorLog.entries.find((e) => e.id === id);
		if (!entry) return;
		copyPending = true;
		const ok = await copyDevErrorLog([entry]);
		copyPending = false;
		if (ok) toast.success("Copied error to clipboard");
		else toast.error("Could not copy — check browser clipboard permission");
	}
</script>

{#if import.meta.env.DEV}
	<Popover.Root>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					variant="ghost"
					size="icon"
					{...props}
					aria-label={count > 0 ? `Dev error log (${count})` : "Dev error log"}
				>
					<span class="relative">
						<BugIcon class="size-4" />
						{#if count > 0}
							<span
								class="bg-destructive text-destructive-foreground absolute -top-2.5 -right-2.5 flex size-4 items-center justify-center rounded-full text-[10px] font-bold"
							>
								{count > 9 ? "9+" : count}
							</span>
						{/if}
					</span>
					<span class="sr-only">Dev error log</span>
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-96 overflow-hidden p-0" align="end">
			<div class="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
				<p class="text-sm font-medium">Dev error log</p>
				<div class="flex gap-1">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={count === 0 || copyPending}
						onclick={copyAll}
					>
						<CopyIcon class="size-3.5" />
						Copy all
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={count === 0}
						onclick={() => clearDevErrorLog()}
					>
						<Trash2Icon class="size-3.5" />
					</Button>
				</div>
			</div>
			<div class="max-h-[min(24rem,70vh)] overflow-y-auto p-2">
				{#if count === 0}
					<p class="text-muted-foreground px-1 py-4 text-center text-xs">
						No captured errors yet. Uncaught errors and console.error appear here.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each devErrorLog.entries as entry (entry.id)}
							<li class="border-border rounded-md border p-2 text-xs">
								<div class="mb-1 flex items-start justify-between gap-2">
									<span class="text-muted-foreground font-mono text-[10px]">{entry.at}</span>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										class="size-7 shrink-0"
										disabled={copyPending}
										aria-label="Copy error"
										onclick={() => copyOne(entry.id)}
									>
										<CopyIcon class="size-3.5" />
									</Button>
								</div>
								<pre
									class="max-h-28 overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-[11px] leading-snug"
								>{entry.message}{#if entry.stack}

{entry.stack}{/if}</pre>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</Popover.Content>
	</Popover.Root>
{/if}
