<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import LogInIcon from "@lucide/svelte/icons/log-in";
	import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";

	let { data, form } = $props();

	let submitting = $state(false);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "เข้าสู่ระบบ — ONE-IL",
					title: "เข้าสู่ระบบ",
					desc: "ใช้บัญชีเดียวกับระบบลา (one-leave)",
					username: "ชื่อผู้ใช้",
					usernamePlaceholder: "username หรืออีเมล @mahidol",
					password: "รหัสผ่าน",
					signIn: "เข้าสู่ระบบ",
					forgot: "ลืมรหัสผ่าน?",
					fullLogin: "หน้า login แบบเต็ม (one-leave)",
				}
			: {
					pageTitle: "Sign in — ONE-IL",
					title: "Sign in",
					desc: "Same account as one-leave",
					username: "Username",
					usernamePlaceholder: "username or @mahidol email",
					password: "Password",
					signIn: "Sign in",
					forgot: "Forgot password?",
					fullLogin: "Full login page (one-leave)",
				},
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
					<LogInIcon class="size-6" />
				</div>
			</div>
			<Card.Title class="text-2xl font-bold">{copy.title}</Card.Title>
			<Card.Description>{copy.desc}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if form?.message}
				<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm" role="alert">
					{form.message}
				</div>
			{/if}
			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update({ reset: false });
						submitting = false;
					};
				}}
			>
				<input type="hidden" name="redirectTo" value={data.redirectTo} />
				<div class="space-y-2">
					<Label for="username">{copy.username}</Label>
					<Input
						id="username"
						name="username"
						type="text"
						autocomplete="username"
						required
						placeholder={copy.usernamePlaceholder}
						value={form?.username ?? ""}
					/>
				</div>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<Label for="password">{copy.password}</Label>
						<a href="/leave/forgot-password" class="text-primary text-sm underline-offset-4 hover:underline">
							{copy.forgot}
						</a>
					</div>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<Button type="submit" class="w-full" disabled={submitting}>
					{#if submitting}
						<LoaderCircleIcon class="mr-2 size-4 animate-spin" />
					{:else}
						<LogInIcon class="mr-2 size-4" />
					{/if}
					{copy.signIn}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="flex flex-col gap-2 text-center">
			<a href="/leave/login" class="text-muted-foreground text-sm underline-offset-4 hover:underline">
				{copy.fullLogin}
			</a>
		</Card.Footer>
	</Card.Root>
</div>
