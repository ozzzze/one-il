<script lang="ts">
	import { enhance } from "$app/forms";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import logo from "$lib/assets/layout/il-logo.png";
	import LogInIcon from "@lucide/svelte/icons/log-in";
	import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";

	let { data, form } = $props();

	let submitting = $state(false);

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "เข้าสู่ระบบ — ONE-IL",
					brand: "ONE-IL",
					heroTitle: "ศูนย์กลางระบบสารสนเทศ IL",
					heroSubtitle: "สถาบันนวัตกรรมการเรียนรู้ มหาวิทยาลัยมหิดล",
					quote:
						'"ONE-IL เป็นศูนย์กลางการเข้าถึงระบบงานของสถาบันนวัตกรรมการเรียนรู้ มหาวิทยาลัยมหิดล ด้วยบัญชีเดียว ครอบคลุมระบบลา การบริหาร และโมดูลอื่นๆ อย่างปลอดภัย"',
					copyright:
						"© ซอฟต์แวร์นี้มีลิขสิทธิ์ของสถาบันนวัตกรรมการเรียนรู้ มหาวิทยาลัยมหิดล · IL Mahidol",
					title: "เข้าสู่ระบบ",
					desc: "สถาบันนวัตกรรมการเรียนรู้ มหาวิทยาลัยมหิดล",
					username: "อีเมลชื่อผู้ใช้",
					usernamePlaceholder: "yourname.sur@mahidol.ac.th",
					password: "รหัสผ่าน",
					signIn: "เข้าสู่ระบบ",
					signingIn: "กำลังเข้าสู่ระบบ..",
					forgot: "ลืมรหัสผ่าน?",
					requiredNote: "ช่องที่มีเครื่องหมายดอกจันสีแดง ต้องกรอกครบก่อนบันทึก",
					or: "หรือ",
					google: "ดำเนินการต่อด้วย Google",
					loginFailed: "เข้าสู่ระบบไม่สำเร็จ",
					mockTitle: "โหมดจำลอง (Mock Mode)",
					mockDesc: "ไม่มี DATABASE_URL — ใช้บัญชี demo ใน memory (รหัสผ่าน Demo@2569)",
					demoTitle: "บัญชีทดสอบในระบบ (Demo Accounts):",
					demoPassword: "รหัสผ่านเริ่มต้น:",
				}
			: {
					pageTitle: "Sign in — ONE-IL",
					brand: "ONE-IL",
					heroTitle: "IL Information Systems Gateway",
					heroSubtitle: "Institute for Innovative Learning, Mahidol University",
					quote:
						'"ONE-IL is the unified gateway for IL systems at Mahidol University — one account for leave, administration, and other modules."',
					copyright:
						"© Institute for Innovative Learning, Mahidol University · IL Mahidol",
					title: "Sign in",
					desc: "Institute for Innovative Learning, Mahidol University",
					username: "Email / username",
					usernamePlaceholder: "yourname.sur@mahidol.ac.th",
					password: "Password",
					signIn: "Sign in",
					signingIn: "Signing in…",
					forgot: "Forgot password?",
					requiredNote: "Fields marked with a red asterisk are required before saving.",
					or: "or",
					google: "Continue with Google",
					loginFailed: "Sign-in failed",
					mockTitle: "Mock mode",
					mockDesc: "No DATABASE_URL — in-memory demo accounts (password Demo@2569)",
					demoTitle: "Demo accounts:",
					demoPassword: "Default password:",
				},
	);
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div
	class="bg-background relative grid min-h-screen items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0"
>
	<!-- Left: brand column (desktop) -->
	<div
		class="relative hidden h-full flex-col overflow-hidden border-r border-zinc-900 bg-zinc-950 p-10 text-white lg:flex"
	>
		<div class="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-900 to-zinc-950"></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.15),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
		></div>

		<div class="relative z-20 flex items-center gap-3 text-lg font-bold tracking-tight">
			<img src={logo} alt="{copy.brand} Logo" class="size-9 object-contain brightness-110" />
			<span
				class="bg-linear-to-r from-sky-400 to-indigo-400 bg-clip-text font-extrabold tracking-wide text-transparent"
			>
				{copy.brand}
			</span>
		</div>

		<div
			class="relative z-20 my-auto flex flex-col items-center justify-center text-center opacity-90"
		>
			<div class="relative mb-6">
				<div class="absolute -inset-4 rounded-full bg-sky-500/10 blur-xl"></div>
				<img src={logo} alt="" class="relative z-10 size-48 object-contain" />
			</div>
			<h2
				class="bg-linear-to-r from-zinc-100 to-zinc-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent"
			>
				{copy.heroTitle}
			</h2>
			<p class="mt-2 max-w-sm text-sm font-light text-zinc-400">{copy.heroSubtitle}</p>
		</div>

		<div class="relative z-20 mt-auto">
			<blockquote class="space-y-3">
				<p
					class="border-l-2 border-sky-500/50 pl-4 text-base leading-relaxed font-light text-zinc-300"
				>
					{copy.quote}
				</p>
				<footer class="pl-4 text-sm font-medium tracking-wide text-zinc-500">
					{copy.copyright}
				</footer>
			</blockquote>
		</div>
	</div>

	<!-- Right: login form -->
	<div class="relative flex min-h-screen items-center justify-center overflow-hidden p-6 lg:p-8">
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.04),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(99,102,241,0.03),transparent_50%)]"
		></div>

		<div class="relative z-10 mx-auto w-full sm:max-w-md">
			<Card.Root class="border-0 bg-background shadow-none">
				<Card.Header class="space-y-1 text-center">
					<div class="mb-2 flex justify-center lg:hidden">
						<img src={logo} alt={copy.brand} class="size-14 object-contain" />
					</div>
					<div class="flex justify-center">
						<div
							class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl"
						>
							<LogInIcon class="size-6" />
						</div>
					</div>
					<Card.Title class="text-2xl font-bold">{copy.title}</Card.Title>
					<Card.Description>{copy.desc}</Card.Description>
				</Card.Header>

				<Card.Content class="space-y-4">
					{#if form?.message}
						<div
							class="border-destructive/20 bg-destructive/5 text-destructive rounded-xl border p-4 text-sm"
							role="alert"
						>
							<p class="font-semibold">{copy.loginFailed}</p>
							<p class="mt-1">{form.message}</p>
						</div>
					{/if}

					<form
						method="POST"
						class="flex flex-col gap-4"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update({ reset: false });
								submitting = false;
							};
						}}
					>
						<input type="hidden" name="redirectTo" value={data.redirectTo} />

						<div class="flex flex-col gap-1.5">
							<Label for="username" class="text-sm font-semibold">
								{copy.username}
								<span class="text-destructive ms-0.5 text-[10px] leading-none" aria-hidden="true"
									>*</span
								>
							</Label>
							<Input
								id="username"
								name="username"
								type="text"
								autocomplete="username"
								required
								placeholder={copy.usernamePlaceholder}
								class="h-10 rounded-xl px-3 text-sm"
								value={form?.username ?? ""}
								disabled={submitting}
							/>
						</div>

						<div class="flex flex-col gap-1.5">
							<div class="flex items-center justify-between">
								<Label for="password" class="text-sm font-semibold">
									{copy.password}
									<span
										class="text-destructive ms-0.5 text-[10px] leading-none"
										aria-hidden="true">*</span
									>
								</Label>
								<a
									href="/leave/forgot-password"
									class="text-sm text-sky-500 transition-colors hover:text-sky-600"
								>
									{copy.forgot}
								</a>
							</div>
							<Input
								id="password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								class="h-10 rounded-xl px-3 text-sm"
								disabled={submitting}
							/>
						</div>

						<p class="text-muted-foreground text-xs leading-relaxed">
							<span class="text-destructive text-[10px] font-normal" aria-hidden="true">*</span>
							<span class="text-destructive font-medium">
								{data.locale === "th" ? "หมายเหตุ:" : "Note:"}
							</span>
							{copy.requiredNote}
						</p>

						<Button
							type="submit"
							class="h-10 w-full rounded-xl font-medium transition-transform active:scale-[0.98]"
							disabled={submitting}
						>
							{#if submitting}
								<LoaderCircleIcon class="mr-2 size-4 animate-spin" />
								{copy.signingIn}
							{:else}
								<LogInIcon class="mr-2 size-4" />
								{copy.signIn}
							{/if}
						</Button>
					</form>

					{#if data.googleEnabled}
						<div class="text-muted-foreground my-1 flex items-center gap-3 text-sm">
							<div class="bg-border h-px flex-1"></div>
							<span class="text-muted-foreground/60 text-xs font-bold tracking-wider uppercase"
								>{copy.or}</span
							>
							<div class="bg-border h-px flex-1"></div>
						</div>

						<Button
							href="/login/google"
							rel="external"
							variant="outline"
							class="h-10 w-full gap-2.5 rounded-xl border-zinc-200 bg-white text-zinc-700 shadow-sm transition-transform hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								class="size-4 shrink-0"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									fill="#4285F4"
								/>
								<path
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									fill="#34A853"
								/>
								<path
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
									fill="#FBBC05"
								/>
								<path
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
									fill="#EA4335"
								/>
							</svg>
							{copy.google}
						</Button>
					{/if}

					{#if data.authMock}
						<div
							class="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-600 dark:text-amber-400"
						>
							<p class="text-sm font-semibold">{copy.mockTitle}</p>
							<p class="text-sm">{copy.mockDesc}</p>
						</div>
					{/if}

					<div
						class="text-muted-foreground flex flex-col gap-1.5 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 text-sm leading-relaxed dark:border-zinc-800 dark:bg-zinc-900/30"
					>
						<p class="text-foreground flex items-center gap-1.5 font-semibold">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="size-3.5 text-sky-500"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<path d="M12 16v-4"></path>
								<path d="M12 8h.01"></path>
							</svg>
							{copy.demoTitle}
						</p>
						<div class="grid grid-cols-2 gap-x-2 gap-y-1 pl-5 font-mono text-xs">
							<span>• admin</span>
							<span>• hr.demo</span>
							<span>• staff.demo</span>
							<span>• head.demo</span>
							<span>• director.demo</span>
						</div>
						<p class="pl-5 text-xs">
							{copy.demoPassword}
							<code
								class="text-foreground rounded bg-zinc-100 px-1 py-0.5 font-mono font-semibold dark:bg-zinc-800"
								>Demo@2569</code
							>
						</p>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
