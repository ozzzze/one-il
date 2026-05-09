<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import LockIcon from "@lucide/svelte/icons/lock";

	let { data, form } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ล็อกอยู่ - ONE-IL",
					password: "รหัสผ่าน",
					passwordPlaceholder: "กรอกรหัสผ่านเพื่อปลดล็อก",
					unlock: "ปลดล็อก",
					notYou: "ไม่ใช่คุณ?",
					signOut: "ออกจากระบบ",
				}
			: {
					pageTitle: "Locked - ONE-IL",
					password: "Password",
					passwordPlaceholder: "Enter your password to unlock",
					unlock: "Unlock",
					notYou: "Not you?",
					signOut: "Sign out",
				}
	);

	function getInitials(name: string) {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-4 text-center">
			<div class="flex justify-center">
				<Avatar.Root class="size-20">
					<Avatar.Fallback class="text-2xl">{getInitials(data.user.name)}</Avatar.Fallback>
				</Avatar.Root>
			</div>
			<div>
				<Card.Title class="text-2xl font-bold">{data.user.name}</Card.Title>
				<Card.Description>{data.user.email}</Card.Description>
			</div>
		</Card.Header>
		<Card.Content>
			{#if form?.message}
				<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
					{form.message}
				</div>
			{/if}
			<form method="POST" use:enhance class="space-y-4">
				<div class="space-y-2">
					<Label for="password">{copy.password}</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder={copy.passwordPlaceholder}
						required
						autocomplete="current-password"
					/>
				</div>
				<Button type="submit" class="w-full">
					<LockIcon class="mr-2 size-4" />
					{copy.unlock}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-muted-foreground text-sm">
				{copy.notYou}
				<a href="/logout" class="text-primary underline-offset-4 hover:underline">{copy.signOut}</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
