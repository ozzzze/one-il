<svelte:head>
	<title>Deployment - SvelteForge Admin Documentation</title>
	<meta
		name="description"
		content="Deploy SvelteForge Admin (SvelteKit + Supabase) with Docker or any Node.js host."
	/>
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Deployment</h1>

	<p class="lead">
		SvelteForge Admin ใช้ <strong>SvelteKit</strong> (adapter-node) และ <strong>Supabase</strong> (Postgres + Auth).
		ดังนั้นการ deploy จะเหมือนเว็บ Node.js ปกติ โดยต้องตั้งค่า environment variables สำหรับ Supabase ให้ครบ.
	</p>

	<h2>Requirements</h2>
	<ul>
		<li><strong>Node.js runtime</strong> ที่รัน SvelteKit server ได้</li>
		<li><strong>Supabase Project</strong> ที่สร้างตารางของแอปแล้ว (ดู <code>scratch/supabase_schema.sql</code>)</li>
		<li><strong>Secrets/Env</strong>: <code>PUBLIC_SUPABASE_URL</code>, <code>PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>ORIGIN</code></li>
	</ul>

	<h2>Docker</h2>
	<pre><code class="language-bash">docker build -t svelteforge-admin .
docker run -p 3000:3000 --env-file .env svelteforge-admin</code></pre>

	<p>
		แนะนำให้จัดการ secrets ผ่าน orchestrator (Render/Fly/Railway/Kubernetes) แทนการ commit ไฟล์ <code>.env</code>.
	</p>
</div>
