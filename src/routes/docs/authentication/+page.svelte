<svelte:head>
	<title>Authentication - SvelteForge Admin Documentation</title>
	<meta name="description" content="Authentication with Supabase SSR in SvelteForge Admin." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Authentication</h1>

	<p class="lead">
		ระบบยืนยันตัวตนใช้ <strong>Supabase Auth</strong> และจัดการ session แบบ SSR ผ่าน <code>@supabase/ssr</code> ใน <code>src/hooks.server.ts</code>.
	</p>

	<h2>How it works</h2>
	<ul>
		<li>ทุก request จะเรียก <code>supabase.auth.getUser()</code> เพื่อยืนยันผู้ใช้</li>
		<li>โหลดโปรไฟล์แอปจาก <code>public.users</code> ผ่าน service role (ดู <code>src/lib/server/auth.ts</code>)</li>
		<li>route ที่ต้องล็อกอินจะถูก guard และ redirect ไป <code>/login</code> ถ้าไม่มี session</li>
	</ul>

	<h2>OAuth (optional)</h2>
	<p>
		ถ้าตั้งค่า <code>GOOGLE_CLIENT_ID</code> / <code>GITHUB_CLIENT_ID</code> ระบบจะเปิด social login ผ่าน Arctic.
	</p>
</div>
