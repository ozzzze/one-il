<svelte:head>
	<title>Content Management - SvelteForge Admin Documentation</title>
	<meta name="description" content="Content management (pages) backed by Supabase." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Content Management</h1>

	<p class="lead">
		ระบบ CMS เก็บข้อมูลหน้า (pages) ใน <strong>Supabase Postgres</strong> ตาราง <code>public.pages</code> และจัดการผ่าน SvelteKit server actions.
	</p>

	<h2>Patterns</h2>
	<ul>
		<li>โหลดข้อมูลใน <code>+page.server.ts</code> ด้วย <code>locals.supabase</code> หรือ service role เมื่อจำเป็น</li>
		<li>บันทึก/อัปเดตผ่าน form actions และ validate ฝั่ง server ก่อนเสมอ</li>
		<li>สิทธิ์การเข้าถึงควรคุมด้วย RLS policy ที่ Supabase</li>
	</ul>
</div>
