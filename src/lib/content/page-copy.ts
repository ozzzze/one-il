import { APP_LABELS, MENU_ITEM_LABELS } from "$lib/content/labels.js";

export const dashboardPageCopy = {
	title: `${MENU_ITEM_LABELS.dashboard} - ${APP_LABELS.shortName}`,
	heading: MENU_ITEM_LABELS.dashboard,
	description: "Welcome back. Here's what's happening today.",
} as const;

export const requestsPageCopy = {
	title: `${MENU_ITEM_LABELS.requests} - ${APP_LABELS.shortName}`,
	heading: MENU_ITEM_LABELS.requests,
	description:
		"Create leave requests and other faculty service requests from one place. Start with Leave for the main workflow.",
	startRequestCta: "Start request",
	yourRequestsHeading: "Your requests",
} as const;

export const gatewayPageCopy = {
	title: `${MENU_ITEM_LABELS.modules} - ${APP_LABELS.shortName}`,
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
} as const;
