<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { AreaChart, LineChart, PieChart, BarChart } from "layerchart";
	import { scaleUtc, scaleBand } from "d3-scale";
	import { mode } from "mode-watcher";

	let { data } = $props();
const copy = $derived.by(() =>
	data.locale === "th"
		? {
				pageTitle: "วิเคราะห์ข้อมูล - ONE-IL",
				title: "วิเคราะห์ข้อมูล",
				description: "ติดตามตัวชี้วัดและประสิทธิภาพของแพลตฟอร์ม",
				signupsLabel: "ผู้ใช้ใหม่",
				pagesLabel: "หน้าที่สร้าง",
				published: "เผยแพร่",
				draft: "ฉบับร่าง",
				archived: "เก็บถาวร",
				topPages: "หน้า",
				signupsOverTime: "แนวโน้มผู้ใช้ใหม่",
				signupsOverTimeDesc: "จำนวนการสมัครใหม่รายเดือน",
				contentOverTime: "แนวโน้มการสร้างเนื้อหา",
				contentOverTimeDesc: "จำนวนหน้าที่สร้างรายเดือน",
				pagesByStatus: "หน้าแยกตามสถานะ",
				pagesByStatusDesc: "สัดส่วนสถานะของเนื้อหา",
				topAuthors: "ผู้เขียนสูงสุด",
				topAuthorsDesc: "ผู้ใช้ที่มีจำนวนหน้าเนื้อหามากที่สุด",
				noData: "ยังไม่มีข้อมูล",
			}
		: {
				pageTitle: "Analytics - ONE-IL",
				title: "Analytics",
				description: "Monitor your platform metrics and performance.",
				signupsLabel: "User Signups",
				pagesLabel: "Pages Created",
				published: "Published",
				draft: "Draft",
				archived: "Archived",
				topPages: "Pages",
				signupsOverTime: "User Signups Over Time",
				signupsOverTimeDesc: "New registrations by month",
				contentOverTime: "Content Creation Over Time",
				contentOverTimeDesc: "Pages created by month",
				pagesByStatus: "Pages by Status",
				pagesByStatusDesc: "Distribution of content statuses",
				topAuthors: "Top Authors",
				topAuthorsDesc: "Users with the most content pages",
				noData: "No data yet",
			}
);
const localeTag = $derived(data.locale === "th" ? "th-TH" : "en-US");

const signupConfig = $derived.by(
	() =>
		({
			signups: { label: copy.signupsLabel, color: "var(--chart-1)" },
		}) satisfies Chart.ChartConfig
);

const contentConfig = $derived.by(
	() =>
		({
			pages: { label: copy.pagesLabel, color: "var(--chart-3)" },
		}) satisfies Chart.ChartConfig
);

const statusConfig = $derived.by(
	() =>
		({
			published: { label: copy.published, color: "var(--chart-1)" },
			draft: { label: copy.draft, color: "var(--chart-2)" },
			archived: { label: copy.archived, color: "var(--chart-4)" },
		}) satisfies Chart.ChartConfig
);

const authorsConfig = $derived.by(
	() =>
		({
			pageCount: { label: copy.topPages, color: "var(--chart-5)" },
		}) satisfies Chart.ChartConfig
);

	const signupData = $derived(
		data.signupsPerMonth.map((d) => ({
			date: new Date(d.month),
			signups: d.count,
		}))
	);

	const contentData = $derived(
		data.pagesPerMonth.map((d) => ({
			date: new Date(d.month),
			pages: d.count,
		}))
	);

	const statusData = $derived(
		data.pagesByStatus.map((d) => ({
			key: d.status,
			label: d.status.charAt(0).toUpperCase() + d.status.slice(1),
			value: d.count,
		}))
	);

	const statusColors = $derived(
		data.pagesByStatus.map((d) => {
			switch (d.status) {
				case "published": return statusConfig.published.color;
				case "draft": return statusConfig.draft.color;
				default: return statusConfig.archived.color;
			}
		})
	);
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">{copy.title}</h1>
		<p class="text-muted-foreground">{copy.description}</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="col-span-4">
			<Card.Header>
				<Card.Title>{copy.signupsOverTime}</Card.Title>
				<Card.Description>{copy.signupsOverTimeDesc}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if signupData.length > 0}
						<Chart.Container config={signupConfig} class="h-[300px] w-full">
							<AreaChart
								data={signupData}
								x="date"
								xScale={scaleUtc()}
								series={[
									{
										key: "signups",
										label: signupConfig.signups.label,
										color: signupConfig.signups.color,
									},
								]}
								props={{
									xAxis: {
										format: (d: Date) =>
											d.toLocaleDateString(localeTag, { month: "short" }),
									},
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</AreaChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">{copy.noData}</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="col-span-3">
			<Card.Header>
				<Card.Title>{copy.contentOverTime}</Card.Title>
				<Card.Description>{copy.contentOverTimeDesc}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if contentData.length > 0}
						<Chart.Container config={contentConfig} class="h-[300px] w-full">
							<LineChart
								data={contentData}
								x="date"
								xScale={scaleUtc()}
								series={[
									{
										key: "pages",
										label: contentConfig.pages.label,
										color: contentConfig.pages.color,
									},
								]}
								props={{
									xAxis: {
										format: (d: Date) =>
											d.toLocaleDateString(localeTag, { month: "short" }),
									},
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</LineChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">{copy.noData}</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
		<Card.Root class="col-span-3">
			<Card.Header>
				<Card.Title>{copy.pagesByStatus}</Card.Title>
				<Card.Description>{copy.pagesByStatusDesc}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if statusData.length > 0}
						<Chart.Container config={statusConfig} class="h-[300px] w-full">
							<PieChart
								data={statusData}
								value="value"
								c="key"
								cRange={statusColors}
								innerRadius={0.6}
								legend
							>
								{#snippet tooltip()}
									<Chart.Tooltip nameKey="label" />
								{/snippet}
							</PieChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">{copy.noData}</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>

		<Card.Root class="col-span-4">
			<Card.Header>
				<Card.Title>{copy.topAuthors}</Card.Title>
				<Card.Description>{copy.topAuthorsDesc}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#key mode.current}
					{#if data.topAuthors.length > 0}
						<Chart.Container config={authorsConfig} class="h-[300px] w-full">
							<BarChart
								data={data.topAuthors}
								x="name"
								xScale={scaleBand().padding(0.3)}
								series={[
									{
										key: "pageCount",
										label: authorsConfig.pageCount.label,
										color: authorsConfig.pageCount.color,
									},
								]}
							>
								{#snippet tooltip()}
									<Chart.Tooltip />
								{/snippet}
							</BarChart>
						</Chart.Container>
					{:else}
						<div class="flex h-[300px] items-center justify-center">
							<p class="text-muted-foreground text-sm">{copy.noData}</p>
						</div>
					{/if}
				{/key}
			</Card.Content>
		</Card.Root>
	</div>
</div>
