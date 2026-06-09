<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		class: className,
		details,
	}: {
		class?: string;
		details?: string;
	} = $props();
</script>

<p class={cn("text-muted-foreground text-xs leading-relaxed", className)}>
	<span class="text-destructive text-[10px] font-normal" aria-hidden="true">*</span>
	<span class="text-destructive font-medium">หมายเหตุ:</span>
	ช่องที่มีเครื่องหมายดอกจันสีแดง ต้องกรอกครบก่อนบันทึก
	{#if details}
		{" "}· {details}
	{/if}
</p>
