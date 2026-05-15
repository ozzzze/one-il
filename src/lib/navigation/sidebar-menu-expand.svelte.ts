const OFFICE_LEAVE_ID = "office-leave";

export const sidebarMenuExpand = $state({
	hrHubExpanded: false,
	menuBranchExpanded: {} as Record<string, boolean>,
});

export function isMenuBranchExpanded(itemId: string): boolean {
	return sidebarMenuExpand.menuBranchExpanded[itemId] === true;
}

export function toggleHrHub(): void {
	sidebarMenuExpand.hrHubExpanded = !sidebarMenuExpand.hrHubExpanded;
}

export function openHrHub(): void {
	sidebarMenuExpand.hrHubExpanded = true;
}

export function toggleMenuBranch(itemId: string): void {
	sidebarMenuExpand.menuBranchExpanded = {
		...sidebarMenuExpand.menuBranchExpanded,
		[itemId]: !isMenuBranchExpanded(itemId),
	};
}

export function expandMenuBranch(itemId: string): void {
	sidebarMenuExpand.menuBranchExpanded = {
		...sidebarMenuExpand.menuBranchExpanded,
		[itemId]: true,
	};
}

export { OFFICE_LEAVE_ID };
