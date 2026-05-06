<svelte:head>
	<title>Settings - SvelteForge Admin Documentation</title>
	<meta name="description" content="Settings patterns backed by Supabase." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Settings</h1>

	<p class="lead">
		Settings แยกเป็น 2 ส่วน: โปรไฟล์ผู้ใช้ (<code>public.users</code>) และค่าระบบ (<code>public.app_settings</code>) บน Supabase.
	</p>

	<h2>Implementation</h2>
	<ul>
		<li>โหลดข้อมูลใน <code>+page.server.ts</code></li>
		<li>บันทึกด้วย SvelteKit actions และตรวจสิทธิ์จาก <code>locals.user</code></li>
	</ul>
</div>
