<script lang="ts">
	import { enhance } from "$app/forms";
	import ChangeRequestForm from "$lib/components/change-request-form.svelte";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import type { PageData } from "./$types";
	import { toast } from "svelte-sonner";

	let { data, form }: { data: PageData; form: import("./$types").ActionData } = $props();
</script>

<svelte:head>
	<title>{data.pageTitle} — ONE-IL</title>
</svelte:head>

<div class="flex flex-col gap-6 p-6">
	{#if data.authMock}
		<Alert.Root>
			<Alert.Title>โหมด mock</Alert.Title>
			<Alert.Description>
				ดูฟอร์มได้ แต่บันทึกต้องตั้ง DATABASE_URL และปิด AUTH_MOCK
			</Alert.Description>
		</Alert.Root>
	{/if}
	<div>
		<h1 class="text-3xl font-bold tracking-tight">{data.pageTitle}</h1>
	</div>
	<form
		method="POST"
		enctype="multipart/form-data"
		class="flex flex-col gap-4"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === "redirect") {
					const path = result.location.split("?")[0];
					if (path === "/change-requests") toast.success("ส่งเรื่องแล้ว");
					else toast.success("บันทึกร่างแล้ว");
					await update();
					return;
				}
				await update();
				if (result.type === "failure" && result.data?.error) {
					toast.error(String(result.data.error), {
						description: data.authMock ? "โหมด mock ไม่บันทึก DB" : undefined,
					});
				}
			};
		}}
	>
		<ChangeRequestForm itSystems={data.itSystems} exceptionTypes={data.exceptionTypes} />
		{#if form && "error" in form && form.error}
			<p class="text-destructive text-sm">{form.error}</p>
		{/if}
	</form>
</div>
