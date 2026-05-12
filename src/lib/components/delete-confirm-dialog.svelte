<script lang="ts">
	import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
	import { enhance } from "$app/forms";

	type Props = {
		open: boolean;
		action: string;
		id: string;
		itemName?: string;
	locale?: "en" | "th";
	};

let { open = $bindable(false), action, id, itemName = "item", locale = "en" }: Props = $props();
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
		<AlertDialog.Footer>
			<AlertDialog.Cancel>{copy.cancel}</AlertDialog.Cancel>
			<form
				method="POST"
				action={action}
				use:enhance={() => {
					return async ({ result, update }) => {
						await update({ reset: false, invalidateAll: true });
						if (result.type === "success" || result.type === "redirect") {
							open = false;
						}
					};
				}}
			>
				<input type="hidden" name="id" value={id} />
				<AlertDialog.Action type="submit" class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
					{copy.delete}
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
