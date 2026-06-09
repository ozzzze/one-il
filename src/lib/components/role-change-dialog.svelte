<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { Label } from "$lib/components/ui/label/index.js";
	import { enhance } from "$app/forms";
	import type { Role } from "$lib/auth/roles.js";
	import { getRoleLabel, getRoleOptions } from "$lib/auth/roles.js";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";

	type Props = {
		open: boolean;
		userId: string;
		userName: string;
		currentRole: Role;
		locale?: "en" | "th";
	};

	let { open = $bindable(false), userId, userName, currentRole, locale = "en" }: Props = $props();
	const copy = $derived.by(() =>
		locale === "th"
			? {
					title: "เปลี่ยนบทบาท",
					description: (name: string, roleLabel: string) =>
						`เปลี่ยนบทบาทของ ${name} บทบาทปัจจุบัน: ${roleLabel}`,
					newRole: "บทบาทใหม่",
					updateRole: "อัปเดตบทบาท",
				}
			: {
					title: "Change Role",
					description: (name: string, roleLabel: string) =>
						`Change role for ${name}. Current role: ${roleLabel}.`,
					newRole: "New Role",
					updateRole: "Update Role",
				}
	);

	const uiLabels = $derived(getUiLabels(locale));
	let savePending = $state(false);

	let newRole = $derived<Role>(currentRole);

	const roleOptions = $derived(getRoleOptions(locale));
	const currentRoleLabel = $derived(getRoleLabel(currentRole, locale));
	const newRoleText = $derived(roleOptions.find((option) => option.value === newRole)?.label ?? "");
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-87.5">
		<Dialog.Header>
			<Dialog.Title>{copy.title}</Dialog.Title>
			<Dialog.Description>
				{copy.description(userName, currentRoleLabel)}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/changeRole"
			use:enhance={pendingEnhance(
				(v) => (savePending = v),
				() =>
					async ({ result, update }) => {
						if (result.type === "success" || result.type === "redirect") {
							open = false;
						}
						await update();
					}
			)}
		>
			<input type="hidden" name="userId" value={userId} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="newRole">{copy.newRole}</Label>
					<Select.Root name="newRole" type="single" bind:value={newRole}>
						<Select.Trigger>
							<span>{newRoleText}</span>
						</Select.Trigger>
						<Select.Content>
							{#each roleOptions as option, i (option.value)}
								<Select.Item value={option.value}>{option.label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
			<Dialog.Footer>
				<SaveSubmitButton
					pending={savePending}
					idleLabel={copy.updateRole}
					savingLabel={uiLabels.formSaving}
				/>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
