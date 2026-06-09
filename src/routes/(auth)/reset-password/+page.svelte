<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import KeyRoundIcon from "@lucide/svelte/icons/key-round";

	let { data, form } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "รีเซ็ตรหัสผ่าน - ONE-IL",
					title: "รีเซ็ตรหัสผ่าน",
					desc: "กรอกรหัสผ่านใหม่ด้านล่าง",
					openEmailLink: "เปิดลิงก์จากอีเมลรีเซ็ต (ระบบจะลงชื่อเข้าใช้ชั่วคราว) หรือขอลิงก์ใหม่",
					requestNew: "ขอลิงก์ใหม่",
					newPassword: "รหัสผ่านใหม่",
					confirmPassword: "ยืนยันรหัสผ่าน",
					repeatPassword: "กรอกรหัสผ่านซ้ำ",
					resetPassword: "รีเซ็ตรหัสผ่าน",
					remember: "จำรหัสผ่านได้แล้ว?",
					signIn: "เข้าสู่ระบบ",
				}
			: {
					pageTitle: "Reset Password - ONE-IL",
					title: "Reset password",
					desc: "Enter your new password below",
					openEmailLink:
						"Open the link from your reset email (it signs you in briefly), or request a new reset link.",
					requestNew: "Request a new link",
					newPassword: "New Password",
					confirmPassword: "Confirm Password",
					repeatPassword: "Repeat your password",
					resetPassword: "Reset password",
					remember: "Remember your password?",
					signIn: "Sign in",
				}
	);
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="bg-background flex min-h-screen items-center justify-center p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="space-y-1 text-center">
			<div class="flex justify-center">
				<div
					class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl"
				>
					<KeyRoundIcon class="size-6" />
				</div>
			</div>
			<Card.Title class="text-2xl font-bold">{copy.title}</Card.Title>
			<Card.Description>{copy.desc}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.message}
				<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
					{form.message}
				</div>
			{/if}
			{#if !data.canReset}
				<div class="text-center">
					<p class="text-muted-foreground mb-4 text-sm">
						{copy.openEmailLink}
					</p>
					<Button href="/forgot-password" variant="outline">{copy.requestNew}</Button>
				</div>
			{:else}
				<form method="POST" use:enhance class="space-y-4">
					<div class="space-y-2">
						<Label for="password">{copy.newPassword}</Label>
						<Input
							id="password"
							name="password"
							type="password"
							placeholder="6+ characters"
							required
							autocomplete="new-password"
						/>
					</div>
					<div class="space-y-2">
						<Label for="confirmPassword">{copy.confirmPassword}</Label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							placeholder={copy.repeatPassword}
							required
							autocomplete="new-password"
						/>
					</div>
					<Button type="submit" class="w-full">{copy.resetPassword}</Button>
				</form>
			{/if}
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-muted-foreground text-sm">
				{copy.remember}
				<a href="/login" class="text-primary underline-offset-4 hover:underline">{copy.signIn}</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
