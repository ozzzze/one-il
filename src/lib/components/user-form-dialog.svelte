<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { enhance } from "$app/forms";
	import type { Role } from "$lib/auth/roles.js";
	import { getRoleOptions } from "$lib/auth/roles.js";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";

	type UserData = {
		id: string;
		name: string;
		email: string;
		username: string;
		role: Role;
	};

	type Props = {
		open: boolean;
		mode: "create" | "edit";
		user?: UserData | null;
	locale?: "en" | "th";
	};

let { open = $bindable(false), mode, user = null, locale = "en" }: Props = $props();

const copy = $derived.by(() =>
	locale === "th"
		? {
				addUser: "เพิ่มผู้ใช้",
				editUser: "แก้ไขผู้ใช้",
				createDesc: "สร้างบัญชีผู้ใช้ใหม่",
				editDesc: "อัปเดตรายละเอียดผู้ใช้",
				name: "ชื่อ",
				email: "อีเมล",
				username: "ชื่อผู้ใช้",
				usernamePlaceholder: "ตัวพิมพ์เล็ก, 3-31 ตัวอักษร",
				password: "รหัสผ่าน",
				passwordPlaceholder: "อย่างน้อย 6 ตัวอักษร",
				role: "บทบาท",
				create: "สร้าง",
				saveChanges: "บันทึกการเปลี่ยนแปลง",
			}
		: {
				addUser: "Add User",
				editUser: "Edit User",
				createDesc: "Create a new user account.",
				editDesc: "Update user details.",
				name: "Name",
				email: "Email",
				username: "Username",
				usernamePlaceholder: "lowercase, 3-31 chars",
				password: "Password",
				passwordPlaceholder: "6+ characters",
				role: "Role",
				create: "Create",
				saveChanges: "Save Changes",
			}
);

const title = $derived(mode === "create" ? copy.addUser : copy.editUser);
	const action = $derived(mode === "create" ? "?/create" : "?/update");

	const uiLabels = $derived(getUiLabels(locale));
	let savePending = $state(false);

	let role = $state<Role>("user");

	$effect.pre(() => {
		role = user?.role ?? "user";
	});

	const roleOptions = $derived(getRoleOptions(locale));
	const roleText = $derived(roleOptions.find((option) => option.value === role)?.label ?? "");
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>{title}</Dialog.Title>
			<Dialog.Description>
				{mode === "create" ? copy.createDesc : copy.editDesc}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			{action}
			use:enhance={pendingEnhance((v) => (savePending = v), () => async ({ result, update }) => {
				if (result.type === "success" || result.type === "redirect") {
					open = false;
				}
				await update();
			})}
		>
			{#if mode === "edit" && user}
				<input type="hidden" name="id" value={user.id} />
			{/if}
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="name">{copy.name}</Label>
					<Input id="name" name="name" value={user?.name ?? ""} required />
				</div>
				<div class="grid gap-2">
					<Label for="email">{copy.email}</Label>
					<Input id="email" name="email" type="email" value={user?.email ?? ""} required />
				</div>
				{#if mode === "create"}
					<div class="grid gap-2">
						<Label for="username">{copy.username}</Label>
						<Input id="username" name="username" placeholder={copy.usernamePlaceholder} required />
					</div>
					<div class="grid gap-2">
						<Label for="password">{copy.password}</Label>
						<Input id="password" name="password" type="password" placeholder={copy.passwordPlaceholder} required />
					</div>
				{/if}
				<div class="grid gap-2">
					<Label for="role">{copy.role}</Label>
					<Select.Root name="role" type="single" bind:value={role}>
						<Select.Trigger>
							<span>{roleText}</span>
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
					idleLabel={mode === "create" ? copy.create : copy.saveChanges}
					savingLabel={uiLabels.formSaving}
				/>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
