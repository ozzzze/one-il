import AnalyticsIcon from "@lucide/svelte/icons/bar-chart-3";
import AcademicIcon from "@lucide/svelte/icons/graduation-cap";
import ContentIcon from "@lucide/svelte/icons/file-text";
import DashboardIcon from "@lucide/svelte/icons/layout-dashboard";
import DatabaseIcon from "@lucide/svelte/icons/database";
import DocsIcon from "@lucide/svelte/icons/book-open";
import GatewayIcon from "@lucide/svelte/icons/door-open";
import NotificationsIcon from "@lucide/svelte/icons/bell";
import OfficeIcon from "@lucide/svelte/icons/building-2";
import RequestsIcon from "@lucide/svelte/icons/clipboard-list";
import RoomIcon from "@lucide/svelte/icons/calendar-days";
import RolesIcon from "@lucide/svelte/icons/shield";
import ServicesIcon from "@lucide/svelte/icons/handshake";
import SettingsIcon from "@lucide/svelte/icons/settings";
import UsersIcon from "@lucide/svelte/icons/users";
import EmployeesIcon from "@lucide/svelte/icons/network";
import type { IconKey } from "./menu.js";
import type { Component } from "svelte";

export const menuIcons = {
	academic: AcademicIcon,
	analytics: AnalyticsIcon,
	content: ContentIcon,
	dashboard: DashboardIcon,
	database: DatabaseIcon,
	docs: DocsIcon,
	gateway: GatewayIcon,
	notifications: NotificationsIcon,
	office: OfficeIcon,
	requests: RequestsIcon,
	room: RoomIcon,
	roles: RolesIcon,
	services: ServicesIcon,
	settings: SettingsIcon,
	users: UsersIcon,
	employees: EmployeesIcon,
} satisfies Record<IconKey, Component>;
