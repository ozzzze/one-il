<script lang="ts">
	import { applyAction, enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { toast } from "svelte-sonner";
	import { getRoleOptions } from "$lib/auth/roles.js";
	import type { ActionData, PageData } from "./$types.js";

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	const uiLabels = $derived(getUiLabels(data.locale));
	const roleOptions = $derived(getRoleOptions(data.locale));

	let tab = $state("identity");
	let saveIdentity = $state(false);
	let saveEmployment = $state(false);
	let saveEmergency = $state(false);
	let saveDeductions = $state(false);
	let saveAssignPrimary = $state(false);
	let saveSupervisor = $state(false);
	let saveProgramChair = $state(false);
	let saveAccount = $state(false);
	let saveLink = $state(false);
	let savePhoto = $state(false);
	let saveClearPhoto = $state(false);

	const emp = $derived(data.employee);

	function deductionPickFromEmployee(d: PageData): Record<string, boolean> {
		const ids = new Set(d.employee.hrProfile.deductions.map((x) => x.deductionTypeId));
		const picks: Record<string, boolean> = {};
		for (const dt of d.hrLookups.deductionTypes) {
			picks[dt.id] = ids.has(dt.id);
		}
		return picks;
	}

	/** Local form state so clicks are not overwritten by `checked={...}` from props. */
	let teacherLicense = $derived(emp.hrProfile.professionalTeacherLicense);
	let deductionPick = $derived.by(() => deductionPickFromEmployee(data));

	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: `บุคลากร — ${emp.fullName}`,
					loadError: "ข้อมูลอ้างอิงบางส่วนโหลดไม่สำเร็จ",
					tabs: {
						identity: "ตัวตนและชื่อ",
						employment: "การจ้างงาน",
						emergency: "ผู้ติดต่อฉุกเฉิน",
						deductions: "รายการหัก",
						organization: "องค์กร",
						account: "บัญชีและระบบ",
					},
					firstName: "ชื่อ (ไทย)",
					lastName: "นามสกุล (ไทย)",
					employeeNo: "รหัสพนักงาน",
					personTitleTh: "คำนำหน้า (ไทย)",
					academicTitleTh: "วิทยฐานะ (ไทย)",
					personTitleEn: "คำนำหน้า (อังกฤษ)",
					academicTitleEn: "วิทยฐานะ (อังกฤษ)",
					firstNameEn: "ชื่อ (อังกฤษ)",
					lastNameEn: "นามสกุล (อังกฤษ)",
					nickname: "ชื่อเล่น",
					address: "ที่อยู่",
					gender: "เพศ",
					genderUnset: "—",
					genderMale: "ชาย",
					genderFemale: "หญิง",
					birthDate: "วันเกิด",
					photo: "รูปพนักงาน",
					uploadPhoto: "อัปโหลดรูป",
					clearPhoto: "ลบรูป",
					employmentContract: "ประเภทสัญญาจ้าง",
					personnelCategory: "ประเภทบุคลากร",
					hrStatus: "สถานะการจ้าง (HR)",
					employmentStart: "วันเริ่มงาน",
					employmentEnd: "วันสิ้นสุดงาน",
					dutyKind: "ประเภทภารกิจ",
					dutyUnset: "—",
					dutyTeacher: "ครู / อาจารย์",
					dutyStaff: "พนักงาน",
					teacherLicense: "มีใบอนุญาตประกอบวิชาชีพครู",
					recognition: "สถานะการรับรองวิชาชีพ",
					emergencySlot: (n: number) => `ผู้ติดต่อลำดับที่ ${n}`,
					contactName: "ชื่อ",
					relationship: "ความสัมพันธ์",
					phone: "โทรศัพท์",
					deductionsHint: "เลือกรายการหักที่ใช้กับพนักงานคนนี้",
					orgPrimary: "ตำแหน่งและหน่วยงานหลัก",
					orgSupervisor: "หัวหน้างาน (สายบังคับบัญชา)",
					orgPositionLabel: "ตำแหน่ง",
					orgUnitLabel: "หน่วยงาน",
					orgStartsAt: "เริ่ม",
					none: "—",
					assignPrimary: "กำหนดตำแหน่งหลัก",
					selectPosition: "เลือกตำแหน่ง",
					selectOrgUnit: "เลือกหน่วยงาน",
					startsAt: "วันเริ่มต้น",
					assignPrimaryBtn: "บันทึกตำแหน่งหลัก",
					setSupervisor: "กำหนดหัวหน้างาน",
					selectSupervisor: "เลือกหัวหน้างาน",
					setSupervisorBtn: "บันทึกหัวหน้า",
					assignProgramChair: "กำหนดหัวหน้าหลักสูตร",
					selectProgram: "เลือกหลักสูตร",
					assignProgramChairBtn: "บันทึก",
					appRoleLabel: "บทบาทในแอป",
					appRoleHint: "ว่าง = ลบบทบาทที่ตั้งล่วงหน้า",
					linkedAccount: "บัญชีที่ผูก",
					notLinked: "ยังไม่ผูก",
					updateAccount: "อัปเดตบัญชี (อีเมล / บทบาท)",
					linkAccount: "ผูกบัญชีผู้ใช้",
					selectUser: "เลือกผู้ใช้",
					save: "บันทึก",
				}
			: {
					pageTitle: `Employee — ${emp.fullName}`,
					loadError: "Some reference data failed to load",
					tabs: {
						identity: "Identity & names",
						employment: "Employment",
						emergency: "Emergency contacts",
						deductions: "Deductions",
						organization: "Organization",
						account: "Account & access",
					},
					firstName: "First name (Thai)",
					lastName: "Last name (Thai)",
					employeeNo: "Employee no.",
					personTitleTh: "Title (TH)",
					academicTitleTh: "Academic title (TH)",
					personTitleEn: "Title (EN)",
					academicTitleEn: "Academic title (EN)",
					firstNameEn: "First name (EN)",
					lastNameEn: "Last name (EN)",
					nickname: "Nickname",
					address: "Address",
					gender: "Gender",
					genderUnset: "—",
					genderMale: "Male",
					genderFemale: "Female",
					birthDate: "Birth date",
					photo: "Photo",
					uploadPhoto: "Upload photo",
					clearPhoto: "Remove photo",
					employmentContract: "Employment contract type",
					personnelCategory: "Personnel category",
					hrStatus: "HR employment status",
					employmentStart: "Employment start",
					employmentEnd: "Employment end",
					dutyKind: "Duty kind",
					dutyUnset: "—",
					dutyTeacher: "Teacher",
					dutyStaff: "Staff",
					teacherLicense: "Professional teacher license",
					recognition: "Professional recognition status",
					emergencySlot: (n: number) => `Emergency contact ${n}`,
					contactName: "Name",
					relationship: "Relationship",
					phone: "Phone",
					deductionsHint: "Select payroll deductions that apply.",
					orgPrimary: "Primary position & org unit",
					orgSupervisor: "Line supervisor",
					orgPositionLabel: "Position",
					orgUnitLabel: "Org unit",
					orgStartsAt: "Starts",
					none: "—",
					assignPrimary: "Assign primary position",
					selectPosition: "Position",
					selectOrgUnit: "Org unit",
					startsAt: "Start date",
					assignPrimaryBtn: "Save primary assignment",
					setSupervisor: "Set supervisor",
					selectSupervisor: "Supervisor",
					setSupervisorBtn: "Save supervisor",
					assignProgramChair: "Assign program chair",
					selectProgram: "Program",
					assignProgramChairBtn: "Save",
					appRoleLabel: "App role",
					appRoleHint: "Empty clears provisioned app role",
					linkedAccount: "Linked account",
					notLinked: "Not linked",
					updateAccount: "Update account (email / role)",
					linkAccount: "Link user account",
					selectUser: "Select user",
					save: "Save",
				},
	);

	const successByAction = $derived.by<Record<string, string>>(() => ({
		updateEmployeeIdentity: data.locale === "th" ? "บันทึกข้อมูลตัวตนแล้ว" : "Identity saved",
		updateEmployeeEmployment: data.locale === "th" ? "บันทึกการจ้างงานแล้ว" : "Employment saved",
		replaceEmergencyContacts: data.locale === "th" ? "บันทึกผู้ติดต่อฉุกเฉินแล้ว" : "Emergency contacts saved",
		replaceDeductions: data.locale === "th" ? "บันทึกรายการหักแล้ว" : "Deductions saved",
		assignPrimary: data.locale === "th" ? "กำหนดตำแหน่งหลักแล้ว" : "Primary assignment saved",
		setSupervisor: data.locale === "th" ? "บันทึกหัวหน้างานแล้ว" : "Supervisor saved",
		assignProgramChair: data.locale === "th" ? "บันทึกหัวหน้าหลักสูตรแล้ว" : "Program chair saved",
		updateEmployeeAccount: data.locale === "th" ? "อัปเดตบัญชีแล้ว" : "Account updated",
		linkEmployeeUser: data.locale === "th" ? "ผูกบัญชีแล้ว" : "Account linked",
		uploadEmployeePhoto: data.locale === "th" ? "อัปโหลดรูปแล้ว" : "Photo uploaded",
		clearEmployeePhoto: data.locale === "th" ? "ลบรูปแล้ว" : "Photo removed",
	}));

	function samePageEnhance(setter: (v: boolean) => void) {
		return pendingEnhance(setter, () => async ({ update }) => {
			await update({ reset: false, invalidateAll: true });
		});
	}

	function crossRouteEnhance(setter: (v: boolean) => void) {
		return pendingEnhance(setter, () => async ({ result }) => {
			await applyAction(result);
			if (result.type === "success") await invalidateAll();
		});
	}

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success && form.action) {
			const msg = successByAction[form.action];
			if (msg) toast.success(msg);
		}
	});

	function localizedDisplayName(name: string, nameEn: string | null | undefined): string {
		if (data.locale === "th") return name;
		const en = nameEn?.trim();
		return en && en.length > 0 ? en : name;
	}

	function nameInitials(fullName: string): string {
		return fullName
			.split(" ")
			.filter(Boolean)
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	function positionLabel(): string {
		const a = emp.primaryAssignment;
		if (!a?.positions) return copy.none;
		const p = a.positions;
		return `${p.code} — ${localizedDisplayName(p.name, p.name_en)}`;
	}

	function orgUnitLabel(): string {
		const a = emp.primaryAssignment;
		if (!a?.org_units) return copy.none;
		const u = a.org_units;
		return `${u.code} — ${localizedDisplayName(u.name, u.name_en)}`;
	}

	function supervisorName(): string {
		const sup = emp.activeSupervisor?.supervisor;
		if (!sup) return copy.none;
		return `${sup.first_name} ${sup.last_name}`;
	}

	const ec1 = $derived(emp.hrProfile.emergencyContacts.find((c) => c.slot === 1));
	const ec2 = $derived(emp.hrProfile.emergencyContacts.find((c) => c.slot === 2));
</script>

<svelte:head>
	<title>{copy.pageTitle}</title>
</svelte:head>

<div class="space-y-4">
	<div class="flex flex-wrap items-start gap-4">
		<Avatar.Root class="border-muted size-14 shrink-0 border">
			{#if data.photoSignedUrl}
				<Avatar.Image src={data.photoSignedUrl} alt="" />
			{/if}
			<Avatar.Fallback class="text-base font-medium">{nameInitials(emp.fullName)}</Avatar.Fallback>
		</Avatar.Root>
		<div class="min-w-0 flex-1 space-y-1">
			<h1 class="text-2xl font-semibold tracking-tight">{emp.fullName}</h1>
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant={emp.status.toUpperCase() === "ACTIVE" ? "default" : "secondary"}>{emp.status.toUpperCase()}</Badge>
				{#if emp.hrProfile.hrEmploymentStatus}
					<Badge variant="outline">{emp.hrProfile.hrEmploymentStatus.labelTh}</Badge>
				{/if}
				{#if emp.employeeNo}
					<span class="text-muted-foreground text-sm">{emp.employeeNo}</span>
				{/if}
			</div>
		</div>
	</div>

	{#if data.errors.employee || data.errors.positions || data.errors.orgUnits}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs">
			{copy.loadError}
		</div>
	{/if}

	<Tabs.Root bind:value={tab} class="w-full">
		<Tabs.List class="flex h-auto flex-wrap gap-1">
			<Tabs.Trigger value="identity" class="text-xs">{copy.tabs.identity}</Tabs.Trigger>
			<Tabs.Trigger value="employment" class="text-xs">{copy.tabs.employment}</Tabs.Trigger>
			<Tabs.Trigger value="emergency" class="text-xs">{copy.tabs.emergency}</Tabs.Trigger>
			<Tabs.Trigger value="deductions" class="text-xs">{copy.tabs.deductions}</Tabs.Trigger>
			<Tabs.Trigger value="organization" class="text-xs">{copy.tabs.organization}</Tabs.Trigger>
			<Tabs.Trigger value="account" class="text-xs">{copy.tabs.account}</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="identity" class="mt-3 space-y-4">
			<Card.Root>
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.tabs.identity}</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4 pt-0">
					{#if data.photoSignedUrl}
						<div class="flex flex-wrap items-end gap-4">
							<img
								src={data.photoSignedUrl}
								alt=""
								class="border-muted h-24 w-24 rounded-md border object-cover"
							/>
							<form
								method="POST"
								action="?/clearEmployeePhoto"
								use:enhance={pendingEnhance((v) => (saveClearPhoto = v), () => async ({ update }) => {
									await update();
									await invalidateAll();
								})}
							>
								<input type="hidden" name="employeeId" value={emp.id} />
								<SaveSubmitButton
									size="sm"
									variant="outline"
									pending={saveClearPhoto}
									idleLabel={copy.clearPhoto}
									savingLabel={uiLabels.formSaving}
								/>
							</form>
						</div>
					{/if}
					<form
						method="POST"
						action="?/uploadEmployeePhoto"
						enctype="multipart/form-data"
						use:enhance={pendingEnhance((v) => (savePhoto = v), () => async ({ update }) => {
							await update();
							await invalidateAll();
						})}
						class="flex flex-wrap items-end gap-2"
					>
						<input type="hidden" name="employeeId" value={emp.id} />
						<div class="grid gap-1">
							<Label class="text-muted-foreground text-xs">{copy.uploadPhoto}</Label>
							<Input type="file" name="photo" accept="image/jpeg,image/png,image/webp" class="max-w-xs" />
						</div>
						<SaveSubmitButton size="sm" pending={savePhoto} idleLabel={copy.uploadPhoto} savingLabel={uiLabels.formSaving} />
					</form>

					<form method="POST" action="?/updateEmployeeIdentity" use:enhance={samePageEnhance((v) => (saveIdentity = v))} class="grid gap-3">
						<input type="hidden" name="employeeId" value={emp.id} />
						<div class="grid gap-2 sm:grid-cols-2">
							<div class="grid gap-1">
								<Label class="text-xs" for="fn">{copy.firstName}</Label>
								<Input id="fn" name="firstName" value={emp.firstName} required />
							</div>
							<div class="grid gap-1">
								<Label class="text-xs" for="ln">{copy.lastName}</Label>
								<Input id="ln" name="lastName" value={emp.lastName} required />
							</div>
						</div>
						<div class="grid gap-1">
							<Label class="text-xs" for="eno">{copy.employeeNo}</Label>
							<Input id="eno" name="employeeNo" value={emp.employeeNo ?? ""} />
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							<div class="grid gap-1">
								<Label class="text-xs" for="ptth">{copy.personTitleTh}</Label>
								<select
									id="ptth"
									name="personTitleTh"
									class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									<option value="">—</option>
									<option value="นาย" selected={emp.hrProfile.personTitleTh === "นาย"}>นาย</option>
									<option value="นาง" selected={emp.hrProfile.personTitleTh === "นาง"}>นาง</option>
									<option value="นางสาว" selected={emp.hrProfile.personTitleTh === "นางสาว"}>นางสาว</option>
								</select>
							</div>
							<div class="grid gap-1">
								<Label class="text-xs" for="atth">{copy.academicTitleTh}</Label>
								<Input id="atth" name="academicTitleTh" value={emp.hrProfile.academicTitleTh ?? ""} />
							</div>
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							<div class="grid gap-1">
								<Label class="text-xs" for="pten">{copy.personTitleEn}</Label>
								<select
									id="pten"
									name="personTitleEn"
									class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									<option value="">—</option>
									<option value="Mr." selected={emp.hrProfile.personTitleEn === "Mr."}>Mr.</option>
									<option value="Mrs." selected={emp.hrProfile.personTitleEn === "Mrs."}>Mrs.</option>
									<option value="Miss" selected={emp.hrProfile.personTitleEn === "Miss"}>Miss</option>
								</select>
							</div>
							<div class="grid gap-1">
								<Label class="text-xs" for="aten">{copy.academicTitleEn}</Label>
								<Input id="aten" name="academicTitleEn" value={emp.hrProfile.academicTitleEn ?? ""} />
							</div>
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							<div class="grid gap-1">
								<Label class="text-xs" for="fnen">{copy.firstNameEn}</Label>
								<Input id="fnen" name="firstNameEn" value={emp.hrProfile.firstNameEn ?? ""} />
							</div>
							<div class="grid gap-1">
								<Label class="text-xs" for="lnen">{copy.lastNameEn}</Label>
								<Input id="lnen" name="lastNameEn" value={emp.hrProfile.lastNameEn ?? ""} />
							</div>
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							<div class="grid gap-1">
								<Label class="text-xs" for="nick">{copy.nickname}</Label>
								<Input id="nick" name="nickname" value={emp.hrProfile.nickname ?? ""} />
							</div>
							<div class="grid gap-1">
								<Label class="text-xs" for="gen">{copy.gender}</Label>
								<select
									id="gen"
									name="gender"
									class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
								>
									<option value="">{copy.genderUnset}</option>
									<option value="male" selected={emp.hrProfile.gender === "male"}>{copy.genderMale}</option>
									<option value="female" selected={emp.hrProfile.gender === "female"}>{copy.genderFemale}</option>
								</select>
							</div>
						</div>
						<div class="grid gap-1">
							<Label class="text-xs" for="bd">{copy.birthDate}</Label>
							<Input id="bd" type="date" name="birthDate" value={emp.hrProfile.birthDate ?? ""} />
						</div>
						<div class="grid gap-1">
							<Label class="text-xs" for="addr">{copy.address}</Label>
							<Textarea id="addr" name="address" rows={3} value={emp.hrProfile.address ?? ""} />
						</div>
						<div class="flex justify-end">
							<SaveSubmitButton size="sm" pending={saveIdentity} idleLabel={copy.save} savingLabel={uiLabels.formSaving} />
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="employment" class="mt-3">
			<Card.Root>
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.tabs.employment}</Card.Title>
				</Card.Header>
				<Card.Content class="pt-0">
					<form method="POST" action="?/updateEmployeeEmployment" use:enhance={samePageEnhance((v) => (saveEmployment = v))} class="grid gap-3">
						<input type="hidden" name="employeeId" value={emp.id} />
						<div class="grid gap-2 sm:grid-cols-2">
							<div class="grid gap-1">
								<Label class="text-xs">{copy.employmentContract}</Label>
								<select
									name="employmentContractTypeId"
									class="border-input bg-background h-9 rounded-md border px-3 text-sm"
								>
									<option value="">—</option>
									{#each data.hrLookups.employmentContractTypes as row, i (row.id)}
										<option value={row.id} selected={emp.hrProfile.employmentContractTypeId === row.id}>
											{row.label_th}
										</option>
									{/each}
								</select>
							</div>
							<div class="grid gap-1">
								<Label class="text-xs">{copy.personnelCategory}</Label>
								<select name="personnelCategoryId" class="border-input bg-background h-9 rounded-md border px-3 text-sm">
									<option value="">—</option>
									{#each data.hrLookups.personnelCategories as row, i (row.id)}
										<option value={row.id} selected={emp.hrProfile.personnelCategoryId === row.id}>{row.label_th}</option>
									{/each}
								</select>
							</div>
						</div>
						<div class="grid gap-1">
							<Label class="text-xs">{copy.hrStatus}</Label>
							<select name="hrEmploymentStatusId" class="border-input bg-background h-9 rounded-md border px-3 text-sm">
								<option value="">—</option>
								{#each data.hrLookups.hrEmploymentStatuses as row, i (row.id)}
									<option value={row.id} selected={emp.hrProfile.hrEmploymentStatusId === row.id}>{row.label_th}</option>
								{/each}
							</select>
						</div>
						<div class="grid gap-2 sm:grid-cols-2">
							<div class="grid gap-1">
								<Label class="text-xs">{copy.employmentStart}</Label>
								<Input type="date" name="employmentStartedAt" value={emp.hrProfile.employmentStartedAt ?? ""} />
							</div>
							<div class="grid gap-1">
								<Label class="text-xs">{copy.employmentEnd}</Label>
								<Input type="date" name="employmentEndedAt" value={emp.hrProfile.employmentEndedAt ?? ""} />
							</div>
						</div>
						<div class="grid gap-1">
							<Label class="text-xs">{copy.dutyKind}</Label>
							<select name="dutyKind" class="border-input bg-background h-9 rounded-md border px-3 text-sm">
								<option value="">{copy.dutyUnset}</option>
								<option value="teacher" selected={emp.hrProfile.dutyKind === "teacher"}>{copy.dutyTeacher}</option>
								<option value="staff" selected={emp.hrProfile.dutyKind === "staff"}>{copy.dutyStaff}</option>
							</select>
						</div>
						<label class="flex items-center gap-2 text-sm">
							<input type="hidden" name="professionalTeacherLicense" value="false" />
							<input
								type="checkbox"
								name="professionalTeacherLicense"
								value="true"
								bind:checked={teacherLicense}
								class="size-4 rounded border"
							/>
							{copy.teacherLicense}
						</label>
						<div class="grid gap-1">
							<Label class="text-xs" for="rec">{copy.recognition}</Label>
							<Input
								id="rec"
								name="professionalRecognitionStatus"
								value={emp.hrProfile.professionalRecognitionStatus ?? ""}
							/>
						</div>
						<div class="flex justify-end">
							<SaveSubmitButton size="sm" pending={saveEmployment} idleLabel={copy.save} savingLabel={uiLabels.formSaving} />
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="emergency" class="mt-3">
			<Card.Root>
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.tabs.emergency}</Card.Title>
				</Card.Header>
				<Card.Content class="pt-0">
					<form method="POST" action="?/replaceEmergencyContacts" use:enhance={samePageEnhance((v) => (saveEmergency = v))} class="grid gap-4">
						<input type="hidden" name="employeeId" value={emp.id} />
						{#each [1, 2] as slot, i (slot)}
							{@const c = slot === 1 ? ec1 : ec2}
							<div class="border-muted space-y-2 rounded-md border p-3">
								<p class="text-sm font-medium">{copy.emergencySlot(slot)}</p>
								<div class="grid gap-2 sm:grid-cols-3">
									<div class="grid gap-1">
										<Label class="text-xs">{copy.contactName}</Label>
										<Input name="slot{slot}Name" value={c?.contactName ?? ""} />
									</div>
									<div class="grid gap-1">
										<Label class="text-xs">{copy.relationship}</Label>
										<Input name="slot{slot}Relationship" value={c?.relationship ?? ""} />
									</div>
									<div class="grid gap-1">
										<Label class="text-xs">{copy.phone}</Label>
										<Input name="slot{slot}Phone" value={c?.phone ?? ""} />
									</div>
								</div>
							</div>
						{/each}
						<div class="flex justify-end">
							<SaveSubmitButton size="sm" pending={saveEmergency} idleLabel={copy.save} savingLabel={uiLabels.formSaving} />
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="deductions" class="mt-3">
			<Card.Root>
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.tabs.deductions}</Card.Title>
					<Card.Description class="text-xs">{copy.deductionsHint}</Card.Description>
				</Card.Header>
				<Card.Content class="pt-0">
					<form method="POST" action="?/replaceDeductions" use:enhance={samePageEnhance((v) => (saveDeductions = v))} class="grid gap-3">
						<input type="hidden" name="employeeId" value={emp.id} />
						<div class="flex flex-col gap-2">
							{#each data.hrLookups.deductionTypes as dt, i (dt.id)}
								<label class="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										name="deductionTypeIds"
										value={dt.id}
										checked={deductionPick[dt.id] ?? false}
										onchange={(e) => {
											const on = e.currentTarget.checked;
											deductionPick = { ...deductionPick, [dt.id]: on };
										}}
										class="size-4 rounded border"
									/>
									{dt.label_th}
									<span class="text-muted-foreground text-xs">({dt.code})</span>
								</label>
							{/each}
						</div>
						<div class="flex justify-end">
							<SaveSubmitButton size="sm" pending={saveDeductions} idleLabel={copy.save} savingLabel={uiLabels.formSaving} />
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="organization" class="mt-3 grid gap-4 lg:grid-cols-2 lg:items-start">
			<Card.Root class="min-w-0">
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.orgPrimary}</Card.Title>
				</Card.Header>
				<Card.Content class="text-muted-foreground space-y-1 text-sm">
					<p><span class="text-foreground font-medium">{copy.orgPositionLabel}:</span> {positionLabel()}</p>
					<p><span class="text-foreground font-medium">{copy.orgUnitLabel}:</span> {orgUnitLabel()}</p>
					{#if emp.primaryAssignment}
						<p class="text-xs">{copy.orgStartsAt}: {emp.primaryAssignment.starts_at}</p>
					{/if}
				</Card.Content>
			</Card.Root>
			<Card.Root class="min-w-0">
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.orgSupervisor}</Card.Title>
				</Card.Header>
				<Card.Content class="text-muted-foreground text-sm">
					<p class="text-foreground">{supervisorName()}</p>
				</Card.Content>
			</Card.Root>

			<Card.Root class="min-w-0">
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.assignPrimary}</Card.Title>
				</Card.Header>
				<Card.Content class="pt-0">
					<form
						method="POST"
						action="?/assignPrimary"
						use:enhance={samePageEnhance((v) => (saveAssignPrimary = v))}
						class="grid gap-2"
					>
						<input type="hidden" name="employeeId" value={emp.id} />
						<input type="hidden" name="isPrimary" value="true" />
						<div class="grid gap-2 sm:grid-cols-2">
							<select name="positionId" required class="border-input bg-background h-9 rounded-md border px-3 text-sm">
								<option value="">{copy.selectPosition}</option>
								{#each data.positions as position, i (position.id)}
									<option value={position.id}>{localizedDisplayName(position.name, position.name_en)}</option>
								{/each}
							</select>
							<select name="orgUnitId" required class="border-input bg-background h-9 rounded-md border px-3 text-sm">
								<option value="">{copy.selectOrgUnit}</option>
								{#each data.orgUnits as orgUnit, i (orgUnit.id)}
									<option value={orgUnit.id}>{localizedDisplayName(orgUnit.name, orgUnit.name_en)}</option>
								{/each}
							</select>
						</div>
						<Input type="date" name="startsAt" required />
						<div class="flex justify-end">
							<SaveSubmitButton
								size="sm"
								pending={saveAssignPrimary}
								idleLabel={copy.assignPrimaryBtn}
								savingLabel={uiLabels.formSaving}
							/>
						</div>
					</form>
				</Card.Content>
			</Card.Root>

			<Card.Root class="min-w-0">
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.setSupervisor}</Card.Title>
				</Card.Header>
				<Card.Content class="pt-0">
					<form
						method="POST"
						action="?/setSupervisor"
						use:enhance={samePageEnhance((v) => (saveSupervisor = v))}
						class="grid gap-2"
					>
						<input type="hidden" name="employeeId" value={emp.id} />
						<select name="supervisorEmployeeId" required class="border-input bg-background h-9 rounded-md border px-3 text-sm">
							<option value="">{copy.selectSupervisor}</option>
							{#each data.allEmployeesMinimal as row, i (row.id)}
								{#if row.id !== emp.id}
									<option value={row.id}>{row.fullName}</option>
								{/if}
							{/each}
						</select>
						<Input type="date" name="startsAt" required />
						<div class="flex justify-end">
							<SaveSubmitButton
								size="sm"
								pending={saveSupervisor}
								idleLabel={copy.setSupervisorBtn}
								savingLabel={uiLabels.formSaving}
							/>
						</div>
					</form>
				</Card.Content>
			</Card.Root>

			<Card.Root class="min-w-0">
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.assignProgramChair}</Card.Title>
				</Card.Header>
				<Card.Content class="pt-0">
					<form
						method="POST"
						action="?/assignProgramChair"
						use:enhance={samePageEnhance((v) => (saveProgramChair = v))}
						class="grid gap-2"
					>
						<input type="hidden" name="employeeId" value={emp.id} />
						<select name="programId" required class="border-input bg-background h-9 rounded-md border px-3 text-sm">
							<option value="">{copy.selectProgram}</option>
							{#each data.programs as program, i (program.id)}
								<option value={program.id}>{program.code} — {program.name}</option>
							{/each}
						</select>
						<Input type="date" name="startsAt" required />
						<div class="flex justify-end">
							<SaveSubmitButton
								size="sm"
								pending={saveProgramChair}
								idleLabel={copy.assignProgramChairBtn}
								savingLabel={uiLabels.formSaving}
							/>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="account" class="mt-3 space-y-4">
			<Card.Root>
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.linkedAccount}</Card.Title>
				</Card.Header>
				<Card.Content class="text-muted-foreground text-sm">
					{#if emp.linkedAccountEmail}
						<p class="text-foreground">{emp.linkedAccountEmail}</p>
						{#if emp.linkedAccountName}
							<p>{emp.linkedAccountName}</p>
						{/if}
					{:else}
						<p>{copy.notLinked}</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="py-3">
					<Card.Title class="text-sm">{copy.updateAccount}</Card.Title>
				</Card.Header>
				<Card.Content class="pt-0">
					<form
						method="POST"
						action="/employees?/updateEmployeeAccount"
						use:enhance={crossRouteEnhance((v) => (saveAccount = v))}
						class="grid gap-2"
					>
						<input type="hidden" name="employeeId" value={emp.id} />
						<Input type="email" name="email" placeholder={emp.email ?? ""} />
						<select name="appRole" required class="border-input bg-background h-9 rounded-md border px-3 text-sm">
							<option value="__keep__">{data.locale === "th" ? "ไม่เปลี่ยนบทบาท" : "No role change"}</option>
							<option value="">{data.locale === "th" ? "ลบบทบาทที่ตั้งไว้" : "Clear provisioned role"}</option>
							{#each roleOptions as opt, i (opt.value)}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<p class="text-muted-foreground text-[11px]">{copy.appRoleHint}</p>
						<div class="flex justify-end">
							<SaveSubmitButton size="sm" pending={saveAccount} idleLabel={copy.save} savingLabel={uiLabels.formSaving} />
						</div>
					</form>
				</Card.Content>
			</Card.Root>

			{#if !emp.userId}
				<Card.Root>
					<Card.Header class="py-3">
						<Card.Title class="text-sm">{copy.linkAccount}</Card.Title>
					</Card.Header>
					<Card.Content class="pt-0">
						<form
							method="POST"
							action="/employees?/linkEmployeeUser"
							use:enhance={crossRouteEnhance((v) => (saveLink = v))}
							class="grid gap-2"
						>
							<input type="hidden" name="employeeId" value={emp.id} />
							<select name="userId" required class="border-input bg-background h-9 rounded-md border px-3 text-sm">
								<option value="">{copy.selectUser}</option>
								{#each data.usersAvailableForLink as user, i (user.id)}
									<option value={user.id}>{user.email} ({user.name})</option>
								{/each}
							</select>
							<div class="flex justify-end">
								<SaveSubmitButton size="sm" pending={saveLink} idleLabel={copy.linkAccount} savingLabel={uiLabels.formSaving} />
							</div>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
