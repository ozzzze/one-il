<svelte:head>
	<title>Notifications - SvelteForge Admin Documentation</title>
	<meta name="description" content="Notifications backed by Supabase." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Notifications</h1>

	<p class="lead">
		ระบบแจ้งเตือนเก็บในตาราง <code>public.notifications</code> บน <strong>Supabase Postgres</strong> และแสดงผลผ่าน SvelteKit load/action.
	</p>

	<h2>Notes</h2>
	<ul>
		<li>การมาร์ค read/unread ทำผ่าน server action</li>
		<li>ควรใช้ RLS เพื่อจำกัดการอ่าน/แก้ไขเฉพาะเจ้าของ</li>
	</ul>
</div>
