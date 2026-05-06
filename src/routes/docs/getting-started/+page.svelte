<svelte:head>
	<title>Getting Started - SvelteForge Admin Documentation</title>
	<meta name="description" content="Quick start for SvelteForge Admin with Supabase." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Getting Started</h1>

	<p class="lead">
		เริ่มต้นใช้งาน SvelteForge Admin ด้วย <strong>Supabase</strong> เป็นฐานข้อมูลและระบบ Auth.
	</p>

	<h2>Prerequisites</h2>
	<ul>
		<li><strong>Node.js</strong> + <strong>pnpm</strong></li>
		<li><strong>Supabase Project</strong> (สร้าง Project และเอา keys จาก Dashboard)</li>
	</ul>

	<h2>Setup</h2>
	<ol>
		<li>ติดตั้ง dependencies: <code>pnpm install</code></li>
		<li>คัดลอก <code>.env.example</code> ไปเป็น <code>.env</code> แล้วใส่ค่า Supabase ให้ครบ</li>
		<li>รัน SQL schema ใน Supabase SQL Editor (ดู <code>scratch/supabase_schema.sql</code>)</li>
		<li>เริ่ม dev server: <code>pnpm dev</code></li>
	</ol>

	<p>
		จากนั้นไปที่ <code>/register</code> เพื่อสร้างบัญชีแรก (ระบบจะให้ role <code>admin</code> อัตโนมัติเมื่อเป็น user แรก)
	</p>
</div>
