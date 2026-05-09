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
					"สร้างคำขอลาและคำขอบริการภายในคณะได้จากที่เดียว โดยเริ่มจากคำขอลาสำหรับเวิร์กโฟลว์หลัก",
				startRequestCta: "เริ่มคำขอ",
				yourRequestsHeading: "คำขอของคุณ",
				yourRequestsDescription: "ติดตามฉบับร่างและรายการที่ส่งแล้วได้ที่นี่หลังเชื่อมตารางคำขอกลาง",
				noSavedRequests: "ยังไม่มีคำขอที่บันทึกไว้",
				noSavedRequestsHint:
					"ใช้การ์ดด้านบนเพื่อทดสอบการรับคำขอ การบันทึกและขั้นตอนอนุมัติจะมาพร้อม migration Supabase รอบถัดไป",
			}
		: {
				title: `${menu.requests} - ${app.shortName}`,
				heading: menu.requests,
				description:
					"Create leave requests and other faculty service requests from one place. Start with Leave for the main workflow.",
				startRequestCta: "Start request",
				yourRequestsHeading: "Your requests",
				yourRequestsDescription: "Track drafts and submitted items here after the shared requests table is wired.",
				noSavedRequests: "No saved requests yet.",
				noSavedRequestsHint:
					"Use the cards above to validate intake. Saving and approvals arrive with the next Supabase migration.",
			};
}

export function getGatewayPageCopy(locale: Locale) {
	const app = getAppLabels(locale);
	const menu = getMenuItemLabels(locale);

	return locale === "th"
		? {
				title: `${menu.modules} - ${app.shortName}`,
				heroBadge: "แผนที่โมดูล",
				heroHeading: "ทุกโมดูลในพอร์ทัลคณะเดียว",
				heroDescription:
					"ใช้หน้านี้เพื่อสำรวจโมดูล ONE-IL ทั้งด้านสำนักงาน วิชาการ บริการ รายงาน และแอดมิน หากต้องการยื่นคำขอลา ให้ไปที่ คำขอ -> ลา โดยตรง",
				createLeaveRequestCta: "สร้างคำขอลา",
				manageAccessCta: "จัดการสิทธิ์",
				navigationRuleHeading: "แนวทางการนำทาง",
				navigationRuleDescription:
					"คงเวิร์กโฟลว์การดำเนินการไว้ในหน้า คำขอ และใช้หน้า โมดูล เพื่อภาพรวม การค้นหา และการมองเห็นตามบทบาท",
				moduleMapHeading: "แผนที่โมดูล",
				moduleMapDescription:
					"แนวทางเริ่มต้นที่ใช้งานได้จริงสำหรับทีมเล็ก: ให้ Requests เป็นเวิร์กโฟลว์หลัก แล้วค่อยเปิดแต่ละโดเมนทีละส่วน",
				openAction: "เปิดรายการ",
				viewModulePath: "ดูเส้นทางโมดูล",
				smallTeamFriendly: "เหมาะกับทีมขนาดเล็ก",
				recommendedBuildOrder: "ลำดับการพัฒนาที่แนะนำ",
				recommendedBuildOrderDesc: "เริ่มจากโครงพื้นฐานร่วมก่อนเพิ่มหน้าของแต่ละโมดูลจำนวนมาก",
				steps: [
					"ทำส่วนจัดการผู้ใช้ บทบาท และการตรวจสอบสิทธิ์ให้สมบูรณ์",
					"สร้างศูนย์คำขอกลางสำหรับลา จองห้อง ยืมอุปกรณ์ และบริการวิชาการ",
					"เพิ่มบันทึกตรวจสอบและรายงาน หลังเวิร์กโฟลว์หลักนิ่งแล้ว",
				],
				ssoTitle: "ทิศทาง SSO / ticket",
				ssoDescription:
					"ใช้ Supabase session เดียวเป็นตั๋วผ่านโมดูลทั้งหมด และเพิ่ม OAuth จาก Google หรือ Microsoft ภายหลังได้หากคณะมี identity provider อยู่แล้ว",
				session: "เซสชัน",
				sessionDesc: "ล็อกอินครั้งเดียวและใช้เซสชันเดิมในทั้งแอป",
				roles: "บทบาท",
				rolesDesc: "บุคลากร อาจารย์ นักศึกษา แอดมิน ผู้บริหาร",
				permissions: "สิทธิ์",
				permissionsDesc: "ควบคุมแต่ละโมดูลด้วย permission claims ที่ชัดเจน",
			}
		: {
				title: `${menu.modules} - ${app.shortName}`,
				heroBadge: "Module map",
				heroHeading: "All modules in one faculty portal.",
				heroDescription:
					"Use this page to browse ONE-IL modules across Office, Academic, Services, Reports, and Admin. For leave requests, go directly to Requests -> Leave.",
				createLeaveRequestCta: "Create Leave Request",
				manageAccessCta: "Manage access",
				navigationRuleHeading: "Navigation rule",
				navigationRuleDescription:
					"Keep action workflows in Requests. Use Modules for overview, discovery, and role-based module visibility.",
				moduleMapHeading: "Module Map",
				moduleMapDescription:
					"A practical first cut for building alone: keep Requests as the main workflow, then turn each domain on gradually.",
				openAction: "Open action",
				viewModulePath: "View module path",
				smallTeamFriendly: "Small-team friendly",
				recommendedBuildOrder: "Recommended build order",
				recommendedBuildOrderDesc: "Start with the shared foundation before adding many module screens.",
				steps: [
					"Finish user management, roles, and permission checks.",
					"Create a shared request center for leave, booking, equipment borrowing, and academic service.",
					"Add audit logs and reports after the core workflows are stable.",
				],
				ssoTitle: "SSO / ticket direction",
				ssoDescription:
					"Use one Supabase session as the access ticket across modules. Add Google or Microsoft OAuth later if the faculty already has an identity provider.",
				session: "Session",
				sessionDesc: "Login once, reuse the same app session.",
				roles: "Roles",
				rolesDesc: "Staff, lecturer, student, admin, executive.",
				permissions: "Permissions",
				permissionsDesc: "Gate each module by explicit permission claims.",
			};
}
