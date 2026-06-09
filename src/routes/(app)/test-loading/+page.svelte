<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { page } from "$app/state";
	import { Loader } from "$lib/components/ui/loader";
	import HelpCircleIcon from "@lucide/svelte/icons/help-circle";
	import { globalLoading } from "$lib/utils/loading.svelte.js";

	let { data } = $props();

	// Current loading style from query param
	const currentStyle = $derived(page.url.searchParams.get("loading_style") || "overlay");

	function testManualLoading() {
		globalLoading.show();
		setTimeout(() => {
			globalLoading.hide();
		}, 2000);
	}
</script>

<svelte:head>
	<title>ทดสอบ Loading Screen Fading</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-col gap-1">
		<h1 class="text-3xl font-bold tracking-tight">ทดสอบ Loading Screen Fading</h1>
		<p class="text-muted-foreground">
			หน้านี้ใช้สำหรับการจำลองการโหลดข้อมูลช้า (Simulated Load Latency) เพื่อทดสอบและเปรียบเทียบทั้ง
			2 ดีไซน์
		</p>
	</div>

	<!-- Status Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title>สถานะการโหลดล่าสุด (Last Load Status)</Card.Title>
			<Card.Description>แสดงข้อมูลที่ดึงมาจากเซิร์ฟเวอร์หลังจากการหน่วงเวลา</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-2">
			<div class="flex justify-between border-b pb-2 text-sm">
				<span class="text-muted-foreground">เวลาที่โหลดสำเร็จล่าสุด:</span>
				<span class="font-mono font-semibold">{data.timestamp}</span>
			</div>
			<div class="flex justify-between border-b pb-2 text-sm">
				<span class="text-muted-foreground">เวลาที่จำลองการดีเลย์:</span>
				<span class="text-primary font-mono font-semibold"
					>{data.delay} ms ({data.delay / 1000} วินาที)</span
				>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-muted-foreground">ดีไซน์ที่ใช้อยู่:</span>
				<span class="text-primary font-semibold capitalize">{currentStyle}</span>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Controls Grid -->
	<div class="grid gap-6 md:grid-cols-2">
		<!-- Option 1 Card -->
		<Card.Root class={currentStyle === "bar" ? "border-primary/50 bg-primary/5" : ""}>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<div class="from-primary to-accent h-2 w-16 rounded-full bg-linear-to-r"></div>
					แบบที่ 1: Slim Progress Bar
				</Card.Title>
				<Card.Description>แถบสีวิ่งที่ขอบบนสุดของหน้าจอเมื่อกำลังโหลดหน้าเว็บ</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<p class="text-muted-foreground text-sm">
					ดีไซน์คล้ายกับ YouTube หรือ GitHub เหมาะสำหรับการย้ายหน้าทั่วไป ไม่รบกวนสายตาของผู้ใช้
					และยังอ่านหน้าจอเดิมต่อไปได้ขณะโหลด
				</p>
				<div class="flex flex-wrap gap-2">
					<Button href="/test-loading?loading_style=bar&delay=800" variant="outline" size="sm">
						โหลดแบบปกติ (800ms)
					</Button>
					<Button href="/test-loading?loading_style=bar&delay=2000" variant="default" size="sm">
						โหลดแบบช้า (2000ms)
					</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Option 2 Card -->
		<Card.Root class={currentStyle === "overlay" ? "border-primary/50 bg-primary/5" : ""}>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Loader variant="clock" size="sm" />
					แบบที่ 2: Full-screen Blur Overlay
				</Card.Title>
				<Card.Description>
					หน้าต่างกึ่งโปร่งใสเบลอฉากหลังพร้อมมีไอคอนหมุนโหลดเต็มหน้าจอ
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<p class="text-muted-foreground text-sm">
					เฟดเข้าและออกอย่างนุ่มนวลพร้อมบล็อคการคลิกหน้าจอเดิม
					เหมาะสำหรับการป้องกันไม่ให้ผู้ใช้กดซ้ำซ้อนในหน้ารายงานหรือแบบฟอร์มที่โหลดช้า
				</p>
				<div class="flex flex-wrap gap-2">
					<Button href="/test-loading?loading_style=overlay&delay=800" variant="outline" size="sm">
						โหลดแบบปกติ (800ms)
					</Button>
					<Button href="/test-loading?loading_style=overlay&delay=2000" variant="default" size="sm">
						โหลดแบบช้า (2000ms)
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Anti-Flicker Explanation -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-base">
				<HelpCircleIcon class="text-muted-foreground size-5" />
				ระบบป้องกันการกระพริบหน้าจอ (Anti-Flicker Protection)
			</Card.Title>
		</Card.Header>
		<Card.Content class="text-muted-foreground space-y-2 text-sm">
			<p>
				ในการใช้งานทั่วไป หากการย้ายหน้าหรือดาวน์โหลดข้อมูลทำได้อย่างรวดเร็วมาก (น้อยกว่า 150ms)
				ระบบจะ<strong>ไม่แสดง</strong> Loading Screen เลย เพื่อไม่ให้เกิดภาพหน้าจอกระพริบ (Flickering)
				แยงสายตาผู้ใช้งาน
			</p>
			<p class="pt-2">
				คุณสามารถทดลองประสิทธิภาพนี้ได้โดยการกดลิงก์ด้านล่างเพื่อโหลดแบบเร็วสุดๆ (ดีเลย์ 50ms):
			</p>
			<div class="flex gap-2 pt-1">
				<Button
					href="/test-loading?loading_style={currentStyle}&delay=50"
					variant="secondary"
					size="sm"
				>
					ทดสอบโหลดแบบเร็วมาก (50ms - จะไม่เห็นตัวโหลดขึ้นมา)
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Manual Loading Card -->
	<Card.Root>
		<Card.Header>
			<Card.Title>ทดสอบการโหลดแบบกำหนดเอง (Client-side Manual Loading / Supabase)</Card.Title>
			<Card.Description>
				จำลองการดึงข้อมูล Supabase จากฝั่ง Client โดยไม่ได้กดเปลี่ยนหน้า
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<p class="text-muted-foreground text-sm">
				ใช้ฟังก์ชัน <code>globalLoading.show()</code> และ <code>globalLoading.hide()</code> สำหรับปุ่มกด
				หรืออีเวนต์ที่ต้องการเปิด loading screen ระหว่างกำลังเชื่อมต่อ/ดึงข้อมูล Supabase
			</p>
			<div class="flex gap-2">
				<Button onclick={testManualLoading} variant="default" size="sm">
					จำลองโหลดข้อมูล Supabase (ดีเลย์ 2 วินาที)
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
</div>
