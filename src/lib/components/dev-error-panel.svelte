<script lang="ts">
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

	let open = $state(false);
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
	<div class="fixed bottom-4 right-4 z-[100] flex max-w-md flex-col items-end gap-2">
		{#if open}
			<div
				class="border-border bg-background flex max-h-[min(24rem,70vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border shadow-lg"
				role="dialog"
				aria-label="Dev error log"
			>
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
				<div class="overflow-y-auto p-2">
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
										class="max-h-28 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-snug"
									>{entry.message}{#if entry.stack}

{entry.stack}{/if}</pre>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
		{/if}

		<Button
			type="button"
			variant={count > 0 ? "destructive" : "secondary"}
			size="sm"
			class="shadow-md"
			onclick={() => (open = !open)}
			aria-expanded={open}
			aria-label="Toggle dev error log"
		>
			<BugIcon class="size-4" />
			{count > 0 ? `Errors (${count})` : "Dev errors"}
		</Button>
	</div>
{/if}
