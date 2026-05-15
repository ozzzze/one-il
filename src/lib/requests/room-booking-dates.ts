const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function parseDateParts(dateValue: string) {
	const normalized = dateValue.length >= 10 ? dateValue.slice(0, 10) : dateValue;
	const [year, month, day] = normalized.split("-").map(Number);
	return { year, month, day };
}

function formatDateKey(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

/** Local weekday: 0 = Sunday … 6 = Saturday (matches calendar date pickers). */
function localDayOfWeek(dateValue: string): number {
	const { year, month, day } = parseDateParts(dateValue);
	return new Date(year, month - 1, day).getDay();
}

export function isValidIsoDateKey(value: string): boolean {
	if (!isoDatePattern.test(value)) return false;

	const { year, month, day } = parseDateParts(value);
	const date = new Date(Date.UTC(year, month - 1, day));

	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() + 1 === month &&
		date.getUTCDate() === day
	);
}

export function shiftIsoDate(dateValue: string, days: number): string {
	const { year, month, day } = parseDateParts(dateValue);
	return formatDateKey(new Date(Date.UTC(year, month - 1, day + days)));
}

/** Room bookings are allowed Monday–Friday only. */
export function isRoomBookingWeekday(dateValue: string): boolean {
	const day = localDayOfWeek(dateValue);
	return day >= 1 && day <= 5;
}

/** Move by `steps` weekdays, skipping Saturday and Sunday. */
export function shiftAcrossWeekdays(dateValue: string, steps: number): string {
	if (steps === 0) return dateValue;

	const direction = steps > 0 ? 1 : -1;
	let current = dateValue;
	let remaining = Math.abs(steps);

	while (remaining > 0) {
		current = shiftIsoDate(current, direction);
		if (isRoomBookingWeekday(current)) {
			remaining -= 1;
		}
	}

	return current;
}
