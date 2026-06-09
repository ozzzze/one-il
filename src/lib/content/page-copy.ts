import { getAppLabels, getMenuItemLabels } from "$lib/content/labels.js";
import type { Locale } from "$lib/i18n/locales.js";

export function getDashboardPageCopy(locale: Locale) {
	const app = getAppLabels(locale);
	const menu = getMenuItemLabels(locale);

	return locale === "th"
		? {
				title: `${menu.dashboard} - ${app.shortName}`,
				heading: menu.dashboard,
				description: "ยินดีต้อนรับกลับ นี่คือภาพรวมที่เกิดขึ้นวันนี้",
				stats: {
					totalUsers: "ผู้ใช้ทั้งหมด",
					activeSessions: "เซสชันที่ใช้งาน",
					totalPages: "หน้าทั้งหมด",
					unreadNotifications: "การแจ้งเตือนที่ยังไม่อ่าน",
					noChange: "ไม่เปลี่ยนแปลง",
					vsLastMonth: "เทียบเดือนที่แล้ว",
				},
				charts: {
					signups: "สมัครใช้งาน",
					admin: "ผู้ดูแลระบบ",
					editor: "บรรณาธิการ",
					viewer: "ผู้ชม",
					published: "เผยแพร่",
					draft: "ฉบับร่าง",
					archived: "เก็บถาวร",
					userSignups: "ผู้ใช้ใหม่",
					userSignupsDesc: "แนวโน้มการสมัครผู้ใช้ใหม่ตามช่วงเวลา",
					contentProduction: "การผลิตเนื้อหา",
					contentProductionDesc: "จำนวนหน้าตามเดือนและสถานะ",
					userRoles: "บทบาทผู้ใช้",
					userRolesDesc: "สัดส่วนบทบาทผู้ใช้",
					pageStatus: "สถานะหน้า",
					pageStatusDesc: "เนื้อหาตามสถานะ",
				},
				system: {
					overview: "ภาพรวมระบบ",
					published: "เผยแพร่แล้ว",
					activeEditors: "บรรณาธิการที่ใช้งาน",
					system: "ระบบ",
					maintenance: "อยู่ระหว่างบำรุงรักษา",
					operational: "พร้อมใช้งาน",
				},
				activity: {
					title: "กิจกรรมล่าสุด",
					description: "การดำเนินการล่าสุดในระบบ",
					none: "ยังไม่มีกิจกรรมล่าสุด",
					joinedPlatform: "เข้าร่วมแพลตฟอร์ม",
					createdByTitle: (title: string) => `สร้าง "${title}"`,
					unknown: "ไม่ทราบชื่อ",
				},
				notifications: {
					title: "การแจ้งเตือน",
					description: "การแจ้งเตือนและอัปเดตล่าสุด",
					viewAll: "ดูทั้งหมด",
					new: "ใหม่",
					none: "ไม่มีการแจ้งเตือน",
				},
				navShortcuts: {
					sectionTitle: "เมนูและทางลัด",
					searchPlaceholder: "ค้นหาเมนู...",
					yourShortcuts: "ทางลัดของคุณ",
					allModules: "โมดูลทั้งหมด",
					showAllLink: "แสดงเมนูทั้งหมด",
					showShortcutsOnly: "แสดงเฉพาะทางลัด",
					addShortcut: "เพิ่มทางลัด",
					removeShortcut: "เอาออก",
					clearShortcuts: "ล้างทางลัด",
					noAccessHint: "ไม่มีสิทธิ์ใช้งาน",
					comingSoonHint: "เร็วๆ นี้",
				},
				time: {
					justNow: "เมื่อสักครู่",
					minAgo: (minutes: number) => `${minutes} นาทีที่แล้ว`,
					hourAgo: (hours: number) => `${hours} ชม. ที่แล้ว`,
					dayAgo: (days: number) => `${days} วันที่แล้ว`,
				},
			}
		: {
				title: `${menu.dashboard} - ${app.shortName}`,
				heading: menu.dashboard,
				description: "Welcome back. Here's what's happening today.",
				stats: {
					totalUsers: "Total Users",
					activeSessions: "Active Sessions",
					totalPages: "Total Pages",
					unreadNotifications: "Unread Notifications",
					noChange: "No change",
					vsLastMonth: "vs last month",
				},
				charts: {
					signups: "Signups",
					admin: "Admin",
					editor: "Editor",
					viewer: "Viewer",
					published: "Published",
					draft: "Draft",
					archived: "Archived",
					userSignups: "User Signups",
					userSignupsDesc: "New user registrations over time",
					contentProduction: "Content Production",
					contentProductionDesc: "Pages created by month and status",
					userRoles: "User Roles",
					userRolesDesc: "Distribution of user roles",
					pageStatus: "Page Status",
					pageStatusDesc: "Content by status",
				},
				system: {
					overview: "System Overview",
					published: "Published",
					activeEditors: "Active Editors",
					system: "System",
					maintenance: "Maintenance",
					operational: "Operational",
				},
				activity: {
					title: "Recent Activity",
					description: "Latest actions across the platform",
					none: "No recent activity",
					joinedPlatform: "Joined the platform",
					createdByTitle: (title: string) => `Created "${title}"`,
					unknown: "Unknown",
				},
				notifications: {
					title: "Notifications",
					description: "Recent alerts and updates",
					viewAll: "View all",
					new: "New",
					none: "No notifications",
				},
				navShortcuts: {
					sectionTitle: "Menu & shortcuts",
					searchPlaceholder: "Search menu...",
					yourShortcuts: "Your shortcuts",
					allModules: "All modules",
					showAllLink: "Show full menu",
					showShortcutsOnly: "Show shortcuts only",
					addShortcut: "Pin to home",
					removeShortcut: "Remove",
					clearShortcuts: "Clear all pins",
					noAccessHint: "No access",
					comingSoonHint: "Coming soon",
				},
				time: {
					justNow: "just now",
					minAgo: (minutes: number) => `${minutes}m ago`,
					hourAgo: (hours: number) => `${hours}h ago`,
					dayAgo: (days: number) => `${days}d ago`,
				},
			};
}

export function getRequestsPageCopy(locale: Locale) {
	const app = getAppLabels(locale);
	const menu = getMenuItemLabels(locale);

	return locale === "th"
		? {
				title: `${menu.requests} - ${app.shortName}`,
				heading: menu.requests,
				description:
					"สร้างและติดตามคำขอภายในคณะจากที่เดียว โดยเริ่มจากคำขอจองห้องและเวิร์กโฟลว์อนุมัติสำหรับผู้ใช้และผู้ดูแล",
				startRequestCta: "เริ่มคำขอ",
				yourRequestsHeading: "คำขอของคุณ",
				yourRequestsDescription:
					"ติดตามคำขอที่ส่งแล้ว เปิดดูรายละเอียด และยกเลิกการจองที่ยังอยู่ในช่วงเวลาที่อนุญาตได้จากหน้านี้",
				noSavedRequests: "ยังไม่มีคำขอที่บันทึกไว้",
				noSavedRequestsHint:
					"เริ่มสร้างคำขอใหม่จากการ์ดด้านบน เมื่อส่งสำเร็จแล้วประวัติจะมาแสดงที่นี่ทันที",
			}
		: {
				title: `${menu.requests} - ${app.shortName}`,
				heading: menu.requests,
				description:
					"Create and track faculty requests from one place, starting with room reservations and the approval workflow for requesters and approvers.",
				startRequestCta: "Start request",
				yourRequestsHeading: "Your requests",
				yourRequestsDescription:
					"Review submitted requests, open detail pages, and cancel reservations while they are still inside the allowed cancellation window.",
				noSavedRequests: "No saved requests yet.",
				noSavedRequestsHint:
					"Start a new request from the cards above. Submitted history will appear here immediately.",
			};
}

export function getGatewayPageCopy(locale: Locale) {
	const app = getAppLabels(locale);
	const menu = getMenuItemLabels(locale);

	return locale === "th"
		? {
				title: `${menu.modules} - ${app.shortName}`,
				moduleMapHeading: "แผนที่โมดูล",
				moduleMapDescription:
					"จัดกลุ่มตามเจตนาการใช้งาน เพื่อให้สแกนภาพรวมเร็วและเริ่มจากกลุ่มหลักก่อน",
				coreModulesHeading: "Core modules",
				coreModulesDescription:
					"กลุ่มที่พร้อมใช้งานหรืออยู่ลำดับถัดไป แสดงก่อนเพื่อให้ทีมเริ่มทำงานได้ทันที",
				futureModulesHeading: "Future modules",
				futureModulesDescription:
					"กลุ่มที่วางแผนไว้ล่วงหน้า แสดงถัดจากกลุ่มหลักเพื่อให้เห็นภาพรวมได้ทันที",
				viewModulePath: "ดูเส้นทางโมดูล",
				smallTeamFriendly: "เหมาะกับทีมขนาดเล็ก",
			}
		: {
				title: `${menu.modules} - ${app.shortName}`,
				moduleMapHeading: "Module Map",
				moduleMapDescription:
					"Group modules by user intent so people can scan fast and start from the core domains first.",
				coreModulesHeading: "Core modules",
				coreModulesDescription:
					"Ready and Next groups are shown first so teams can focus on near-term execution.",
				futureModulesHeading: "Future modules",
				futureModulesDescription:
					"Planned groups are shown alongside core groups so teams can see the full roadmap at a glance.",
				viewModulePath: "View module path",
				smallTeamFriendly: "Small-team friendly",
			};
}
