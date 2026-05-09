<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";
	import ilLogo from "$lib/assets/layout/il-logo.png";

	let { form, data } = $props();
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "เข้าสู่ระบบ - ONE-IL",
					welcome: "ยินดีต้อนรับกลับ",
					subtitle: "กรอกข้อมูลเข้าสู่ระบบเพื่อเข้าใช้งานแดชบอร์ด",
					demoAccess: "บัญชีทดลอง",
					demoDesc:
						"ระบบกรอกข้อมูลไว้แล้ว: demo / SvelteDemo2026! — กด เข้าสู่ระบบ เพื่อทดลองใช้งาน (อ่านอย่างเดียว)",
					username: "ชื่อผู้ใช้",
					usernamePlaceholder: "กรอกชื่อผู้ใช้",
					password: "รหัสผ่าน",
					passwordPlaceholder: "กรอกรหัสผ่าน",
					redirecting: "กำลังเปลี่ยนเส้นทาง…",
					authenticating: "กำลังยืนยันตัวตน…",
					signIn: "เข้าสู่ระบบ",
					orContinueWith: "หรือดำเนินการต่อด้วย",
					continueGoogle: "ดำเนินการต่อด้วย Google",
					continueGithub: "ดำเนินการต่อด้วย GitHub",
					forgotPassword: "ลืมรหัสผ่านใช่ไหม?",
					noAccount: "ยังไม่มีบัญชีใช่ไหม?",
					register: "สมัครสมาชิก",
				}
			: {
					pageTitle: "Login - ONE-IL",
					welcome: "Welcome back",
					subtitle: "Enter your credentials to access the dashboard",
					demoAccess: "Demo Access",
					demoDesc:
						"Credentials are pre-filled: demo / SvelteDemo2026! — just click Sign in to explore (read-only).",
					username: "Username",
					usernamePlaceholder: "Enter your username",
					password: "Password",
					passwordPlaceholder: "Enter your password",
					redirecting: "Redirecting…",
					authenticating: "Authenticating…",
					signIn: "Sign in",
					orContinueWith: "Or continue with",
					continueGoogle: "Continue with Google",
					continueGithub: "Continue with GitHub",
					forgotPassword: "Forgot your password?",
					noAccount: "Don't have an account?",
					register: "Register",
				}
	);

	const providers = $derived(data.enabledProviders ?? []);

	let authenticating = $state(false);
	let redirecting = $state(false);

	const authEnhance = () => {
		authenticating = true;
		redirecting = false;

		return async ({
			result,
			update
		}: {
			result: { type: "success" | "failure" | "redirect" | "error" };
			update: () => Promise<void>;
		}) => {
			if (result.type === "redirect") {
				redirecting = true;
				await update();
				return;
			}

			try {
				await update();
			} finally {
				authenticating = false;
				redirecting = false;
			}
		};
	};
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
					<img src={ilLogo} alt="Innovative Learning logo" class="size-6 object-contain" />
				</div>
			</div>
			<Card.Title class="text-2xl font-bold">{copy.welcome}</Card.Title>
			<Card.Description>{copy.subtitle}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="bg-muted mb-4 rounded-md p-3 text-sm">
				<p class="font-medium">{copy.demoAccess}</p>
				<p class="text-muted-foreground mt-1">
					{copy.demoDesc}
				</p>
			</div>
			{#if form?.message}
				<div class="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
					{form.message}
				</div>
			{/if}
			<form method="POST" use:enhance={authEnhance} class="space-y-4">
				<div class="space-y-2">
					<Label for="username">{copy.username}</Label>
					<Input
						id="username"
						name="username"
						type="text"
						placeholder={copy.usernamePlaceholder}
						required
						autocomplete="username"
						value="demo"
					/>
				</div>
				<div class="space-y-2">
					<Label for="password">{copy.password}</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder={copy.passwordPlaceholder}
						required
						autocomplete="current-password"
						value="SvelteDemo2026!"
					/>
				</div>
				<Button type="submit" class="w-full" disabled={authenticating || redirecting}>
					{#if redirecting}
						<Loader2Icon class="mr-2 size-4 animate-spin" />
						{copy.redirecting}
					{:else if authenticating}
						<Loader2Icon class="mr-2 size-4 animate-spin" />
						{copy.authenticating}
					{:else}
						{copy.signIn}
					{/if}
				</Button>
			</form>
			{#if providers.length > 0}
				<div class="relative my-4">
					<div class="absolute inset-0 flex items-center">
						<Separator class="w-full" />
					</div>
					<div class="relative flex justify-center text-xs uppercase">
						<span class="bg-card text-muted-foreground px-2">{copy.orContinueWith}</span>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					{#if providers.includes("google")}
						<Button variant="outline" class="w-full" href="/login/google">
							<svg class="mr-2 size-4" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							{copy.continueGoogle}
						</Button>
					{/if}
					{#if providers.includes("github")}
						<Button variant="outline" class="w-full" href="/login/github">
							<svg class="mr-2 size-4" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
								/>
							</svg>
							{copy.continueGithub}
						</Button>
					{/if}
				</div>
			{/if}
			<div class="mt-2 text-center">
				<a href="/forgot-password" class="text-muted-foreground text-sm underline-offset-4 hover:underline">{copy.forgotPassword}</a>
			</div>
		</Card.Content>
		<Card.Footer class="justify-center">
			<p class="text-muted-foreground text-sm">
				{copy.noAccount}
				<a href="/register" class="text-primary underline-offset-4 hover:underline">{copy.register}</a>
			</p>
		</Card.Footer>
	</Card.Root>
</div>
