export function formatEmployeeName(title: string | null, first: string, last: string): string {
	return [title, first, last].filter(Boolean).join(' ');
}
