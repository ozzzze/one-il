<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import MailIcon from "@lucide/svelte/icons/mail";

	let { form, data } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ลืมรหัสผ่าน - ONE-IL",
					title: "ลืมรหัสผ่าน?",
					desc: "กรอกอีเมล แล้วเราจะส่งลิงก์รีเซ็ตรหัสผ่านให้",
					success:
						"หากมีบัญชีที่ใช้อีเมลนี้ ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว (ในโหมดพัฒนาให้ตรวจสอบ console logs)",
					email: "อีเมล",
					sendLink: "ส่งลิงก์รีเซ็ต",
					remember: "จำรหัสผ่านได้แล้ว?",
					signIn: "เข้าสู่ระบบ",
				}
			: {
					pageTitle: "Forgot Password - ONE-IL",
					title: "Forgot password?",
					desc: "Enter your email and we'll send you a reset link",
					success:
						"If an account exists with that email, a reset link has been sent. Check your console logs in development.",
					email: "Email",
					sendLink: "Send reset link",
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
				<div class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
					<MailIcon class="size-6" />
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
			{#if form?.success}
				<div class="bg-green-500/10 text-green-700 dark:text-green-400 mb-4 rounded-md p-3 text-sm">
					{copy.success}
				</div>
			{:else}
				<form method="POST" use:enhance class="space-y-4">
					<div class="space-y-2">
						<Label for="email">{copy.email}</Label>
						<Input
							id="email"
							name="email"
							type="email"
							placeholder={data.locale === "th" ? "you@example.com" : "you@example.com"}
							required
							autocomplete="email"
						/>
					</div>
					<Button type="submit" class="w-full">{copy.sendLink}</Button>
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
