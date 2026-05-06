<svelte:head>
	<title>Analytics & Charts - SvelteForge Admin Documentation</title>
	<meta name="description" content="Analytics patterns with LayerChart + Supabase server-side aggregation." />
</svelte:head>

<div class="prose dark:prose-invert max-w-none">
	<h1>Analytics &amp; Charts</h1>

	<p>
		หน้า Analytics ดึงข้อมูลแบบ <strong>server-side</strong> ใน <code>+page.server.ts</code> จาก <strong>Supabase</strong> เพื่อให้ SSR ได้ข้อมูลทันที
		แล้วค่อยส่งให้ component ฝั่ง client render ด้วย LayerChart.
	</p>

	<h2>Best practices</h2>
	<ul>
		<li>Aggregate/query ใน server (ลด client fetch)</li>
		<li>เพิ่ม index และใช้ RLS policy ให้เหมาะสม</li>
	</ul>
</div>
