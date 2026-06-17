<script lang="ts">
	import { page } from "$app/state";
	import ModuleSubnav from "$lib/components/module-subnav.svelte";
	import UsersIcon from "@lucide/svelte/icons/users";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import HistoryIcon from "@lucide/svelte/icons/history";

	const links = [
		{ href: "/admin/users", label: "จัดการผู้ใช้", icon: UsersIcon },
		{ href: "/admin/employees", label: "จัดการพนักงาน", icon: UsersIcon },
		{ href: "/admin/roles", label: "กำหนดบทบาท", icon: ShieldIcon },
		{ href: "/admin/audit-logs", label: "ประวัติการทำรายการ", icon: HistoryIcon },
	] as const;

	function activeHrefForPath(path: string): string {
		const matches = links.filter(
			(link) => path === link.href || path.startsWith(`${link.href}/`),
		);
		if (matches.length === 0) return "";
		return matches.reduce((best, link) => (link.href.length > best.href.length ? link : best))
			.href;
	}

	function isActive(href: string): boolean {
		return activeHrefForPath(page.url.pathname) === href;
	}
</script>

<ModuleSubnav
	ariaLabel="เมนูผู้ดูแลระบบ"
	selectId="gateway-admin-subnav"
	selectLabel="เมนูผู้ดูแลระบบ"
	{links}
	{isActive}
/>
