<script lang="ts">
	import { enhance } from '$app/forms';
	import ChangeRequestForm from '$lib/components/change-request-form.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatEmployeeName } from '$lib/org/labels.js';
	import type { PageData } from './$types';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import { toast } from 'svelte-sonner';

	let { data, form }: { data: PageData; form: import('./$types').ActionData } = $props();
</script>

<svelte:head>
	<title>{data.pageTitle} — ONE-IL</title>
</svelte:head>

<div class="flex flex-col gap-6 p-6">
	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" size="sm" href="/change-requests">
			<ArrowLeftIcon class="size-4 mr-2" />
			กลับรายการ
		</Button>
	</div>

	{#if data.authMock}
		<Alert.Root>
			<Alert.Title>โหมด mock</Alert.Title>
			<Alert.Description>
				ดูฟอร์มได้ แต่บันทึกต้องตั้ง DATABASE_URL และปิด AUTH_MOCK
			</Alert.Description>
		</Alert.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title class="text-base">{data.pageTitle}</Card.Title>
			<Card.Description class="text-muted-foreground mt-1 flex flex-col gap-0.5 text-xs">
				<p class="text-foreground text-sm font-semibold">
					{formatEmployeeName(data.employee.titleTh, data.employee.firstNameTh, data.employee.lastNameTh)}
				</p>
				<p>หน่วยงาน: {data.employee.orgUnitName}</p>
				{#if data.employee.affiliationOrgUnitName}
					<p>สังกัด: {data.employee.affiliationOrgUnitName}</p>
				{/if}
				<p>วันที่ขอ: ยังไม่ส่ง (บันทึกเมื่อส่งเรื่อง)</p>
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				enctype="multipart/form-data"
				class="flex flex-col gap-4"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'redirect') {
							const path = result.location.split('?')[0];
							if (path === '/change-requests') toast.success('ส่งเรื่องแล้ว');
							else toast.success('บันทึกร่างแล้ว');
							await update();
							return;
						}
						await update();
						if (result.type === 'failure' && result.data?.error) {
							toast.error(String(result.data.error), {
								description: data.authMock ? 'โหมด mock ไม่บันทึก DB' : undefined
							});
						}
					};
				}}
			>
				<ChangeRequestForm
					itSystems={data.itSystems}
					exceptionTypes={data.exceptionTypes}
				/>
				{#if form && 'error' in form && form.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</div>
