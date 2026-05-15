<script lang="ts">
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { applyAction } from "$app/forms";
	import { enhance } from "$app/forms";
	import { invalidate } from "$app/navigation";

	type Props = {
		open: boolean;
		action: string;
		id: string;
		itemName?: string;
		locale?: "en" | "th";
		/** When set, re-runs matching `depends()` loaders instead of only `invalidateAll`. */
		reloadKey?: string;
	};

	let {
		open = $bindable(false),
		action,
		id,
		itemName = "item",
		locale = "en",
		reloadKey,
	}: Props = $props();

	const copy = $derived.by(() =>
		locale === "th"
			? {
					areYouSure: "ยืนยันการดำเนินการ?",
					description: (name: string) =>
						`การดำเนินการนี้จะลบ ${name} อย่างถาวร และไม่สามารถย้อนกลับได้`,
					cancel: "ยกเลิก",
					delete: "ลบ",
				}
			: {
					areYouSure: "Are you sure?",
					description: (name: string) =>
						`This will permanently delete this ${name}. This action cannot be undone.`,
					cancel: "Cancel",
					delete: "Delete",
				}
	);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{copy.areYouSure}</AlertDialog.Title>
			<AlertDialog.Description>
				{copy.description(itemName)}
			</AlertDialog.Description>
		</AlertDialog.Header>
		{#key id}
			<form
				method="POST"
				{action}
				use:enhance={() => {
					return async ({ result, update }) => {
						await applyAction(result);

						if (result.type === "success" || result.type === "redirect") {
							open = false;
							if (reloadKey) {
								await invalidate(reloadKey);
							}
							await update({ reset: false, invalidateAll: !reloadKey });
							return;
						}

						await update({ reset: false });
					};
				}}
			>
				<input type="hidden" name="id" value={id} />
				<AlertDialog.Footer>
					<AlertDialog.Cancel type="button">{copy.cancel}</AlertDialog.Cancel>
					<Button type="submit" variant="destructive">{copy.delete}</Button>
				</AlertDialog.Footer>
			</form>
		{/key}
	</AlertDialog.Content>
</AlertDialog.Root>
