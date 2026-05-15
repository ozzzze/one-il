import type { Locale } from "$lib/i18n/locales.js";

const LABELS = {
	en: {
		app: {
			shortName: "ONE-IL",
			fullName: "Innovative Learning",
		},
		menuGroups: {
			overview: "Overview",
			workflows: "Workflows",
			management: "Management",
			office: "Office",
			academic: "Academic",
			sharedServices: "Shared Services",
			governanceAccess: "Governance & Access",
			system: "System",
		},
		menuItems: {
			dashboard: "Dashboard",
			analytics: "Analytics",
			requests: "Requests",
			modules: "Modules",
			users: "Users",
			employees: "Employees",
			organization: "Organization",
			supply: "Supply",
			assets: "Assets",
			roomBooking: "Room Booking",
			leave: "Leave",
			holidays: "Holidays",
			content: "Content",
			roles: "Roles",
			notifications: "Notifications",
			database: "Database",
			settings: "Settings",
			documentation: "Documentation",
			officeModules: "Office Modules",
			academicModules: "Academic Modules",
			sharedServices: "Shared Services",
		},
		ui: {
			appsMenu: "Apps menu",
			goPro: "Go Pro",
			myAccount: "My Account",
			profile: "Profile",
			notifications: "Notifications",
			settings: "Settings",
			lockScreen: "Lock Screen",
			keyboardShortcuts: "Keyboard Shortcuts",
			helpSupport: "Help & Support",
			logOut: "Log out",
			search: "Search...",
			commandPaletteLabel: "Command palette",
			commandPalettePlaceholder: "Type a command or search...",
			noResultsFound: "No results found.",
			navigation: "Navigation",
			searchResults: "Search Results",
			quickActions: "Quick Actions",
			newRequest: "New Request",
			newPage: "New Page",
			newContentPage: "New Content Page",
			toggleTheme: "Toggle Theme",
			employeeFallback: "Employee",
			language: "Language",
			switchLanguage: "Switch language",
			english: "English",
			thai: "Thai",
			formSaving: "Saving...",
			menuNoAccessHint: "No access",
			menuComingSoonHint: "Coming soon",
		},
	},
	th: {
		app: {
			shortName: "ONE-IL",
			fullName: "นวัตกรรมการเรียนรู้",
		},
		menuGroups: {
			overview: "ภาพรวม",
			workflows: "เวิร์กโฟลว์",
			management: "การจัดการ",
			office: "สำนักงาน",
			academic: "วิชาการ",
			sharedServices: "บริการส่วนกลาง",
			governanceAccess: "กำกับดูแลและสิทธิ์",
			system: "ระบบ",
		},
		menuItems: {
			dashboard: "แดชบอร์ด",
			analytics: "วิเคราะห์ข้อมูล",
			requests: "คำขอ",
			modules: "โมดูล",
			users: "ผู้ใช้งาน",
			employees: "บุคลากร",
			organization: "องค์กร",
			supply: "พัสดุ",
			assets: "ครุภัณฑ์",
			roomBooking: "จองห้อง",
			leave: "การลา",
			holidays: "วันหยุด",
			content: "เนื้อหา",
			roles: "บทบาท",
			notifications: "การแจ้งเตือน",
			database: "ฐานข้อมูล",
			settings: "ตั้งค่า",
			documentation: "เอกสาร",
			officeModules: "โมดูลสำนักงาน",
			academicModules: "โมดูลวิชาการ",
			sharedServices: "บริการส่วนกลาง",
		},
		ui: {
			appsMenu: "เมนูแอป",
			goPro: "Go Pro",
			myAccount: "บัญชีของฉัน",
			profile: "โปรไฟล์",
			notifications: "การแจ้งเตือน",
			settings: "ตั้งค่า",
			lockScreen: "ล็อกหน้าจอ",
			keyboardShortcuts: "คีย์ลัด",
			helpSupport: "ช่วยเหลือและสนับสนุน",
			logOut: "ออกจากระบบ",
			search: "ค้นหา...",
			commandPaletteLabel: "พาเลตคำสั่ง",
			commandPalettePlaceholder: "พิมพ์คำสั่งหรือค้นหา...",
			noResultsFound: "ไม่พบผลลัพธ์",
			navigation: "การนำทาง",
			searchResults: "ผลการค้นหา",
			quickActions: "คำสั่งด่วน",
			newRequest: "สร้างคำขอใหม่",
			newPage: "สร้างหน้าใหม่",
			newContentPage: "สร้างหน้าเนื้อหาใหม่",
			toggleTheme: "สลับธีม",
			employeeFallback: "บุคลากร",
			language: "ภาษา",
			switchLanguage: "สลับภาษา",
			english: "อังกฤษ",
			thai: "ไทย",
			formSaving: "กำลังบันทึก...",
			menuNoAccessHint: "ไม่มีสิทธิ์ใช้งาน",
			menuComingSoonHint: "เร็วๆ นี้",
		},
	},
} as const;

export function getAppLabels(locale: Locale) {
	return LABELS[locale].app;
}

export function getMenuGroupLabels(locale: Locale) {
	return LABELS[locale].menuGroups;
}

export function getMenuItemLabels(locale: Locale) {
	return LABELS[locale].menuItems;
}

export function getUiLabels(locale: Locale) {
	return LABELS[locale].ui;
}

export const REQUEST_KIND_LABELS = {
	leave: "Leave Request",
	roomBooking: "Room booking",
	equipmentBorrowing: "Equipment Borrowing",
	academicService: "Academic service",
} as const;
