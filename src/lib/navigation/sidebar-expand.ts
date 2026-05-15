const OFFICE_LEAVE_ID = "office-leave";

export function isEmployeesPath(pathname: string): boolean {
	return pathname === "/employees" || pathname.startsWith("/employees/");
}

export function isOrgPath(pathname: string): boolean {
	return pathname.startsWith("/organization");
}

export function isLeavePath(pathname: string): boolean {
	return pathname === "/leave" || pathname.startsWith("/leave/");
}

export function isPathActive(pathname: string, href: string): boolean {
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sub-menu link: inactive when a sibling has a longer href that matches the current path. */
export function isNavSubItemActive(
	pathname: string,
	href: string,
	siblingHrefs: readonly string[],
): boolean {
	if (!isPathActive(pathname, href)) return false;
	const hasMoreSpecificSibling = siblingHrefs.some(
		(siblingHref) =>
			siblingHref !== href &&
			siblingHref.startsWith(`${href}/`) &&
			isPathActive(pathname, siblingHref),
	);
	return !hasMoreSpecificSibling;
}

/** Apply route-based auto-expand (pathname change only — must not read current expanded flags). */
export function applySidebarAutoExpand(
	pathname: string,
	menuBranchExpanded: Readonly<Record<string, boolean>>,
): { hrHubExpanded: boolean; menuBranchExpanded: Record<string, boolean> } {
	let hrHubExpanded = false;
	let nextBranches = { ...menuBranchExpanded };

	if (isEmployeesPath(pathname) || isOrgPath(pathname)) {
		hrHubExpanded = true;
	}
	if (isLeavePath(pathname)) {
		nextBranches = { ...nextBranches, [OFFICE_LEAVE_ID]: true };
	}

	return { hrHubExpanded, menuBranchExpanded: nextBranches };
}
