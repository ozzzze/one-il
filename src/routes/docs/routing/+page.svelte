<svelte:head>
	<title>Routing - SvelteForge Admin Documentation</title>
	<meta name="description" content="SvelteKit routing patterns used in SvelteForge Admin." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Routing &amp; Navigation</h1>

	<p>
		SvelteForge Admin ใช้ route groups ของ SvelteKit เพื่อแยก layout และ auth boundary:
	</p>

	<ul>
		<li><code>src/routes/(app)/</code> — protected routes (ต้องมีผู้ใช้)</li>
		<li><code>src/routes/(auth)/</code> — login/register/reset</li>
		<li><code>src/routes/(public)/</code> — public pages</li>
		<li><code>src/routes/docs/</code> — docs</li>
	</ul>

	<p>
		สำหรับ data fetching และ form submit ให้ทำใน <code>+page.server.ts</code> และใช้ Supabase ผ่าน <code>locals.supabase</code>.
	</p>
</div>
