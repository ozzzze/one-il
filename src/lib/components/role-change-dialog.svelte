<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { enhance } from "$app/forms";
	import type { Role } from "$lib/auth/roles.js";
	import { roleOptions } from "$lib/auth/roles.js";

	type Props = {
		open: boolean;
		userId: string;
		userName: string;
		currentRole: Role;
	};

	let { open = $bindable(false), userId, userName, currentRole }: Props = $props();

	let newRole: Role = $derived(currentRole);

	const newRoleText = $derived(roleOptions.find((option) => option.value === newRole)?.label ?? "");
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[350px]">
		<Dialog.Header>
			<Dialog.Title>Change Role</Dialog.Title>
			<Dialog.Description>
				Change role for {userName}. Current role: {currentRole}.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/changeRole" use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === "success" || result.type === "redirect") {
					open = false;
				}
				await update();
			};
		}}>
			<input type="hidden" name="userId" value={userId} />
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="newRole">New Role</Label>
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
				<Button type="submit">Update Role</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
