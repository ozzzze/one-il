/** ISO date `YYYY-MM-DD` for institutional (faculty-wide) non-working days. */
export function isInstitutionalHolidayDate(
	dateIso: string,
	holidayDates: ReadonlySet<string> | readonly string[],
): boolean {
	const set = holidayDates instanceof Set ? holidayDates : new Set(holidayDates);
	return set.has(dateIso);
}
