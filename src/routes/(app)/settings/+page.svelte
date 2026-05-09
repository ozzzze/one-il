<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { enhance } from "$app/forms";
	import { toast } from "svelte-sonner";
	import { parseUserAgent } from "$lib/utils/user-agent.js";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import SmartphoneIcon from "@lucide/svelte/icons/smartphone";
	import TabletIcon from "@lucide/svelte/icons/tablet";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import BellIcon from "@lucide/svelte/icons/bell";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import WrenchIcon from "@lucide/svelte/icons/wrench";
	import { getRoleLabel, getRoleOptions, isRole } from "$lib/auth/roles.js";
	import SaveSubmitButton from "$lib/components/save-submit-button.svelte";
	import { getUiLabels } from "$lib/content/labels.js";
	import { pendingEnhance } from "$lib/forms/pending-enhance.js";

	let { data, form } = $props();

	const uiLabels = $derived(getUiLabels(data.locale));
	let savePendingProfile = $state(false);
	let savePendingPassword = $state(false);
	let savePendingNotifications = $state(false);
	let savePendingSettings = $state(false);

	let timezoneValue = $state("");
	let defaultRoleValue = $state("");

	$effect.pre(() => {
		timezoneValue = data.settings.timezone;
		defaultRoleValue = data.settings.defaultRole;
	});

	const defaultRoleLabel = $derived(
		isRole(defaultRoleValue) ? getRoleLabel(defaultRoleValue, data.locale) : defaultRoleValue
	);
	const copy = $derived.by(() =>
		data.locale === "th"
			? {
					pageTitle: "ตั้งค่า - ONE-IL",
					title: "ตั้งค่า",
					description: "จัดการโปรไฟล์และค่ากำหนดของแอปพลิเคชัน",
					tabs: { profile: "โปรไฟล์", sessions: "เซสชัน", notifications: "การแจ้งเตือน", application: "แอปพลิเคชัน" },
					toast: {
						profile: "อัปเดตโปรไฟล์แล้ว",
						password: "เปลี่ยนรหัสผ่านแล้ว",
						settings: "บันทึกการตั้งค่าแล้ว",
						session: "ยกเลิกเซสชันแล้ว",
						sessions: "ยกเลิกเซสชันอื่นทั้งหมดแล้ว",
						notifications: "บันทึกค่าการแจ้งเตือนแล้ว",
						saved: "บันทึกแล้ว",
					},
					unknown: "ไม่ทราบ",
					justNow: "เมื่อสักครู่",
					profileInfo: "ข้อมูลโปรไฟล์",
					updateProfileDesc: "อัปเดตชื่อและอีเมลของคุณ",
					name: "ชื่อ",
					email: "อีเมล",
					username: "ชื่อผู้ใช้",
					usernameImmutable: "ไม่สามารถเปลี่ยนชื่อผู้ใช้ได้",
					saveProfile: "บันทึกโปรไฟล์",
					changePassword: "เปลี่ยนรหัสผ่าน",
					changePasswordDesc: "อัปเดตรหัสผ่านของคุณ โดยต้องใช้รหัสผ่านปัจจุบัน",
					currentPassword: "รหัสผ่านปัจจุบัน",
					newPassword: "รหัสผ่านใหม่",
					confirmNewPassword: "ยืนยันรหัสผ่านใหม่",
					passwordPlaceholder: "อย่างน้อย 6 ตัวอักษร",
					changePasswordCta: "เปลี่ยนรหัสผ่าน",
					activeSessions: "เซสชันที่ใช้งาน",
					activeSessionsDesc: "จัดการเซสชันที่กำลังใช้งานบนอุปกรณ์ต่าง ๆ",
					revokeAllOthers: "ยกเลิกทั้งหมด (ยกเว้นเครื่องนี้)",
					current: "ปัจจุบัน",
					unknownIp: "IP ไม่ทราบ",
					revoke: "ยกเลิก",
					noSessions: "ไม่พบเซสชันที่ใช้งาน",
					notifPrefs: "ค่ากำหนดการแจ้งเตือน",
					notifPrefsDesc: "เลือกประเภทการแจ้งเตือนที่คุณต้องการรับ",
					savePreferences: "บันทึกค่ากำหนด",
					appSettings: "การตั้งค่าแอปพลิเคชัน",
					appSettingsDesc: "กำหนดค่าการตั้งค่าระดับแอป (สำหรับผู้ดูแลระบบเท่านั้น)",
					siteName: "ชื่อระบบ",
					timezone: "เขตเวลา",
					defaultRole: "บทบาทผู้ใช้เริ่มต้น",
					defaultRoleDesc: "บทบาทที่จะกำหนดให้ผู้ใช้ใหม่โดยอัตโนมัติ",
					maintenanceMode: "โหมดบำรุงรักษา",
					maintenanceModeDesc: "เมื่อเปิดใช้งาน ผู้ใช้ที่ไม่ใช่แอดมินจะเห็นหน้าบำรุงรักษา",
					saveSettings: "บันทึกการตั้งค่า",
					notifLabel: {
						notif_new_user: "การสมัครผู้ใช้ใหม่",
						notif_content_published: "เผยแพร่เนื้อหา",
						notif_security_alert: "การแจ้งเตือนความปลอดภัย",
						notif_system_warning: "คำเตือนระบบ",
						notif_weekly_digest: "สรุปรายสัปดาห์",
						notif_maintenance: "ประกาศบำรุงรักษา",
					},
					notifDesc: {
						notif_new_user: "แจ้งเตือนเมื่อมีผู้ใช้ใหม่สมัครเข้าใช้งาน",
						notif_content_published: "แจ้งเตือนเมื่อมีการเผยแพร่เนื้อหา",
						notif_security_alert: "การแจ้งเตือนด้านความปลอดภัยที่สำคัญ",
						notif_system_warning: "แจ้งเตือนสุขภาพและประสิทธิภาพระบบ",
						notif_weekly_digest: "สรุปกิจกรรมและสถิติรายสัปดาห์",
						notif_maintenance: "แจ้งเตือนการบำรุงรักษาตามกำหนด",
					},
				}
			: {
					pageTitle: "Settings - ONE-IL",
					title: "Settings",
					description: "Manage your profile and application preferences.",
					tabs: { profile: "Profile", sessions: "Sessions", notifications: "Notifications", application: "Application" },
					toast: {
						profile: "Profile updated",
						password: "Password changed",
						settings: "Settings saved",
						session: "Session revoked",
						sessions: "All other sessions revoked",
						notifications: "Notification preferences saved",
						saved: "Saved",
					},
					unknown: "Unknown",
					justNow: "Just now",
					profileInfo: "Profile Information",
					updateProfileDesc: "Update your name and email address.",
					name: "Name",
					email: "Email",
					username: "Username",
					usernameImmutable: "Username cannot be changed.",
					saveProfile: "Save Profile",
					changePassword: "Change Password",
					changePasswordDesc: "Update your password. You'll need your current password.",
					currentPassword: "Current Password",
					newPassword: "New Password",
					confirmNewPassword: "Confirm New Password",
					passwordPlaceholder: "6+ characters",
					changePasswordCta: "Change Password",
					activeSessions: "Active Sessions",
					activeSessionsDesc: "Manage your active sessions across devices.",
					revokeAllOthers: "Revoke All Others",
					current: "Current",
					unknownIp: "Unknown IP",
					revoke: "Revoke",
					noSessions: "No active sessions found.",
					notifPrefs: "Notification Preferences",
					notifPrefsDesc: "Choose which notifications you want to receive.",
					savePreferences: "Save Preferences",
					appSettings: "Application Settings",
					appSettingsDesc: "Configure global application settings. Admin only.",
					siteName: "Site Name",
					timezone: "Timezone",
					defaultRole: "Default User Role",
					defaultRoleDesc: "Role assigned to new users by default.",
					maintenanceMode: "Maintenance Mode",
					maintenanceModeDesc: "When enabled, non-admin users will see a maintenance page.",
					saveSettings: "Save Settings",
					notifLabel: {
						notif_new_user: "New user registrations",
						notif_content_published: "Content published",
						notif_security_alert: "Security alerts",
						notif_system_warning: "System warnings",
						notif_weekly_digest: "Weekly digest",
						notif_maintenance: "Maintenance notices",
					},
					notifDesc: {
						notif_new_user: "Get notified when a new user signs up",
						notif_content_published: "Get notified when content is published",
						notif_security_alert: "Important security notifications",
						notif_system_warning: "System health and performance alerts",
						notif_weekly_digest: "Weekly summary of activity and stats",
						notif_maintenance: "Scheduled maintenance notifications",
					},
				}
	);

	$effect(() => {
		if (form?.message) toast.error(form.message);
		if (form?.success) {
			const messages: Record<string, string> = {
				profile: copy.toast.profile,
				password: copy.toast.password,
				settings: copy.toast.settings,
				session: copy.toast.session,
				sessions: copy.toast.sessions,
				notifications: copy.toast.notifications,
			};
			toast.success(messages[form.action as string] ?? copy.toast.saved);
		}
	});

	function getDeviceIcon(device: string) {
		if (device === "Mobile") return SmartphoneIcon;
		if (device === "Tablet") return TabletIcon;
		return MonitorIcon;
	}

	function timeAgo(date: Date | null): string {
		if (!date) return copy.unknown;
		const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
		if (seconds < 60) return copy.justNow;
		if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
		if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
		return `${Math.floor(seconds / 86400)}d ago`;
	}

	const roleOptions = $derived(getRoleOptions(data.locale));

	const notifLabels = $derived.by(
		() =>
			({
			notif_new_user: {
				label: copy.notifLabel.notif_new_user,
				description: copy.notifDesc.notif_new_user,
				icon: UserPlusIcon,
			},
			notif_content_published: {
				label: copy.notifLabel.notif_content_published,
				description: copy.notifDesc.notif_content_published,
				icon: FileTextIcon,
			},
			notif_security_alert: {
				label: copy.notifLabel.notif_security_alert,
				description: copy.notifDesc.notif_security_alert,
				icon: ShieldAlertIcon,
			},
			notif_system_warning: {
				label: copy.notifLabel.notif_system_warning,
				description: copy.notifDesc.notif_system_warning,
				icon: AlertTriangleIcon,
			},
			notif_weekly_digest: {
				label: copy.notifLabel.notif_weekly_digest,
				description: copy.notifDesc.notif_weekly_digest,
				icon: CalendarIcon,
			},
			notif_maintenance: {
				label: copy.notifLabel.notif_maintenance,
				description: copy.notifDesc.notif_maintenance,
				icon: WrenchIcon,
			},
			}) satisfies Record<string, { label: string; description: string; icon: typeof BellIcon }>
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

	<Tabs.Root value="profile">
		<Tabs.List>
			<Tabs.Trigger value="profile">{copy.tabs.profile}</Tabs.Trigger>
			<Tabs.Trigger value="sessions">{copy.tabs.sessions}</Tabs.Trigger>
			<Tabs.Trigger value="notifications">{copy.tabs.notifications}</Tabs.Trigger>
			{#if data.isAdmin}
				<Tabs.Trigger value="application">{copy.tabs.application}</Tabs.Trigger>
			{/if}
		</Tabs.List>

		<Tabs.Content value="profile" class="space-y-6 pt-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.profileInfo}</Card.Title>
					<Card.Description>{copy.updateProfileDesc}</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/updateProfile"
						use:enhance={pendingEnhance((v) => (savePendingProfile = v))}
						class="space-y-4"
					>
						<div class="grid gap-2">
							<Label for="name">{copy.name}</Label>
							<Input id="name" name="name" value={data.profile.name} required />
						</div>
						<div class="grid gap-2">
							<Label for="email">{copy.email}</Label>
							<Input id="email" name="email" type="email" value={data.profile.email} required />
						</div>
						<div class="grid gap-2">
							<Label>{copy.username}</Label>
							<Input value={data.profile.username} disabled />
							<p class="text-muted-foreground text-xs">{copy.usernameImmutable}</p>
						</div>
						<SaveSubmitButton
							pending={savePendingProfile}
							idleLabel={copy.saveProfile}
							savingLabel={uiLabels.formSaving}
						/>
					</form>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.changePassword}</Card.Title>
					<Card.Description>{copy.changePasswordDesc}</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/changePassword"
						use:enhance={pendingEnhance((v) => (savePendingPassword = v))}
						class="space-y-4"
					>
						<div class="grid gap-2">
							<Label for="currentPassword">{copy.currentPassword}</Label>
							<Input id="currentPassword" name="currentPassword" type="password" required />
						</div>
						<Separator />
						<div class="grid gap-2">
							<Label for="newPassword">{copy.newPassword}</Label>
							<Input id="newPassword" name="newPassword" type="password" placeholder={copy.passwordPlaceholder} required />
						</div>
						<div class="grid gap-2">
							<Label for="confirmPassword">{copy.confirmNewPassword}</Label>
							<Input id="confirmPassword" name="confirmPassword" type="password" required />
						</div>
						<SaveSubmitButton
							pending={savePendingPassword}
							idleLabel={copy.changePasswordCta}
							savingLabel={uiLabels.formSaving}
						/>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="sessions" class="space-y-6 pt-4">
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<div>
							<Card.Title>{copy.activeSessions}</Card.Title>
							<Card.Description>{copy.activeSessionsDesc}</Card.Description>
						</div>
						{#if data.sessions.length > 1}
							<form method="POST" action="?/revokeAllOtherSessions" use:enhance>
								<Button type="submit" variant="destructive" size="sm">{copy.revokeAllOthers}</Button>
							</form>
						{/if}
					</div>
				</Card.Header>
				<Card.Content>
					<div class="space-y-4">
						{#each data.sessions as session, i (session.id)}
							{@const ua = parseUserAgent(session.userAgent)}
							{@const isCurrent = session.id === data.currentSessionId}
							{@const DeviceIcon = getDeviceIcon(ua.device)}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-4">
									<div class="bg-muted flex size-10 items-center justify-center rounded-lg">
										<DeviceIcon class="text-muted-foreground size-5" />
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-medium">{ua.browser} on {ua.os}</span>
											{#if isCurrent}
												<Badge variant="secondary">{copy.current}</Badge>
											{/if}
										</div>
										<div class="text-muted-foreground flex items-center gap-2 text-sm">
											<GlobeIcon class="size-3" />
											<span>{session.ipAddress ?? copy.unknownIp}</span>
											<span>·</span>
											<span>{timeAgo(session.createdAt)}</span>
										</div>
									</div>
								</div>
								{#if !isCurrent}
									<form method="POST" action="?/revokeSession" use:enhance>
										<input type="hidden" name="sessionId" value={session.id} />
										<Button type="submit" variant="outline" size="sm">{copy.revoke}</Button>
									</form>
								{/if}
							</div>
						{:else}
							<p class="text-muted-foreground text-center text-sm">{copy.noSessions}</p>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="notifications" class="space-y-6 pt-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>{copy.notifPrefs}</Card.Title>
					<Card.Description>{copy.notifPrefsDesc}</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/updateNotificationPrefs"
						use:enhance={pendingEnhance((v) => (savePendingNotifications = v))}
						class="space-y-4"
					>
						{#each Object.entries(notifLabels) as [key, { label, description, icon: Icon }], i (key)}
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Icon class="text-muted-foreground size-5" />
									<div>
										<Label>{label}</Label>
										<p class="text-muted-foreground text-xs">{description}</p>
									</div>
								</div>
								<Switch name={key} checked={data.notificationPrefs[key]} />
							</div>
						{/each}
						<SaveSubmitButton
							pending={savePendingNotifications}
							idleLabel={copy.savePreferences}
							savingLabel={uiLabels.formSaving}
						/>
					</form>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		{#if data.isAdmin}
			<Tabs.Content value="application" class="space-y-6 pt-4">
				<Card.Root>
					<Card.Header>
						<Card.Title>{copy.appSettings}</Card.Title>
						<Card.Description>{copy.appSettingsDesc}</Card.Description>
					</Card.Header>
					<Card.Content>
						<form
							method="POST"
							action="?/updateSettings"
							use:enhance={pendingEnhance((v) => (savePendingSettings = v))}
							class="space-y-6"
						>
							<div class="grid gap-2">
								<Label for="siteName">{copy.siteName}</Label>
								<Input id="siteName" name="siteName" value={data.settings.siteName} />
							</div>

							<div class="grid gap-2">
								<Label>{copy.timezone}</Label>
								<Select.Root name="timezone" type="single" bind:value={timezoneValue}>
									<Select.Trigger>
										<span>{timezoneValue}</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="UTC">UTC</Select.Item>
										<Select.Item value="America/New_York">America/New_York</Select.Item>
										<Select.Item value="America/Chicago">America/Chicago</Select.Item>
										<Select.Item value="America/Denver">America/Denver</Select.Item>
										<Select.Item value="America/Los_Angeles">America/Los_Angeles</Select.Item>
										<Select.Item value="Europe/London">Europe/London</Select.Item>
										<Select.Item value="Europe/Berlin">Europe/Berlin</Select.Item>
										<Select.Item value="Asia/Tokyo">Asia/Tokyo</Select.Item>
									</Select.Content>
								</Select.Root>
							</div>

							<div class="grid gap-2">
								<Label>{copy.defaultRole}</Label>
								<Select.Root name="defaultRole" type="single" bind:value={defaultRoleValue}>
									<Select.Trigger>
										<span>{defaultRoleLabel}</span>
									</Select.Trigger>
									<Select.Content>
										{#each roleOptions as option, i (option.value)}
											<Select.Item value={option.value}>{option.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<p class="text-muted-foreground text-xs">{copy.defaultRoleDesc}</p>
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="space-y-0.5">
									<Label>{copy.maintenanceMode}</Label>
									<p class="text-muted-foreground text-xs">
										{copy.maintenanceModeDesc}
									</p>
								</div>
								<Switch
									name="maintenanceMode"
									checked={data.settings.maintenanceMode === "true"}
								/>
							</div>

							<SaveSubmitButton
								pending={savePendingSettings}
								idleLabel={copy.saveSettings}
								savingLabel={uiLabels.formSaving}
							/>
						</form>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		{/if}
	</Tabs.Root>
</div>
