<svelte:head>
	<title>User Management - SvelteForge Admin Documentation</title>
	<meta name="description" content="User management backed by Supabase (auth.users + public.users)." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>User Management</h1>

	<p class="lead">
		ผู้ใช้ถูกจัดการโดย <strong>Supabase Auth</strong> (บัญชี) และตาราง <code>public.users</code> (โปรไฟล์/role สำหรับแอป).
	</p>

	<h2>Data model</h2>
	<ul>
		<li><code>auth.users</code> — บัญชีและข้อมูล auth</li>
		<li><code>public.users</code> — โปรไฟล์ในแอป (role, username, name, avatar)</li>
	</ul>

	<p>
		การเพิ่ม/แก้ไข/ลบผู้ใช้ฝั่ง admin ใช้ service role client ใน <code>src/lib/server/supabase-admin.ts</code>.
	</p>
</div>
