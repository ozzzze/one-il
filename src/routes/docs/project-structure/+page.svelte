<svelte:head>
	<title>Project Structure - SvelteForge Admin Documentation</title>
	<meta name="description" content="Project structure for SvelteForge Admin (SvelteKit + Supabase)." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Project Structure</h1>

	<p>
		โปรเจกต์นี้เป็น <strong>SvelteKit</strong> ที่ใช้ <strong>Supabase</strong> แบบ SSR.
		โค้ดฝั่ง server ที่คุยกับ Supabase อยู่ใน <code>src/lib/server/</code> และ data fetching ควรทำใน <code>+page.server.ts</code> เป็นหลัก.
	</p>

	<h2>Key paths</h2>
	<ul>
		<li><code>src/hooks.server.ts</code> — สร้าง Supabase SSR client และตั้งค่า auth guard</li>
		<li><code>src/lib/server/supabase-admin.ts</code> — service-role client (server-only)</li>
		<li><code>src/lib/server/auth.ts</code> — โหลด app profile จากตาราง <code>public.users</code></li>
		<li><code>src/routes/(app)/</code> — หน้าในระบบ (ต้องล็อกอิน)</li>
		<li><code>src/routes/(auth)/</code> — login/register/reset</li>
		<li><code>src/routes/docs/</code> — เอกสารประกอบ</li>
	</ul>
</div>
