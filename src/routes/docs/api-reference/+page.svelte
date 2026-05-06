<svelte:head>
	<title>API Reference - SvelteForge Admin Documentation</title>
	<meta name="description" content="Server-side API reference (Supabase helpers)." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>API Reference</h1>

	<h2>Supabase SSR client</h2>
	<ul>
		<li><code>src/hooks.server.ts</code> สร้าง <code>event.locals.supabase</code> ด้วย <code>createServerClient</code></li>
		<li>ใช้ <code>locals.supabase</code> ใน load/actions สำหรับ query ที่อยู่ภายใต้สิทธิ์ของ user</li>
	</ul>

	<h2>Service role client</h2>
	<ul>
		<li><code>src/lib/server/supabase-admin.ts</code> สำหรับงาน privileged (เช่นจัดการผู้ใช้, งาน admin)</li>
	</ul>

	<h2>App profile</h2>
	<ul>
		<li><code>src/lib/server/auth.ts</code> โหลดข้อมูลจาก <code>public.users</code> แล้ว map เป็น <code>SessionUser</code></li>
	</ul>
</div>
