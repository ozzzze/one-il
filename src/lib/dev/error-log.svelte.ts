export type DevErrorEntry = {
	id: string;
	at: string;
	message: string;
	stack?: string;
	source: "error" | "rejection" | "console";
};

const MAX_ENTRIES = 40;

export const devErrorLog = $state<{ entries: DevErrorEntry[]; installed: boolean }>({
	entries: [],
	installed: false,
});

function nextId(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatArg(value: unknown): string {
	if (value instanceof Error) {
		return value.stack ?? value.message;
	}
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function pushEntry(source: DevErrorEntry["source"], message: string, stack?: string) {
	const trimmed = message.trim();
	if (!trimmed) return;

	devErrorLog.entries = [
		{
			id: nextId(),
			at: new Date().toISOString(),
			message: trimmed,
			stack,
			source,
		},
		...devErrorLog.entries,
	].slice(0, MAX_ENTRIES);
}

function pushFromConsoleArgs(args: unknown[]) {
	const message = args.map(formatArg).join("\n");
	const err = args.find((a): a is Error => a instanceof Error);
	pushEntry("console", message, err?.stack);
}

export function installDevErrorCapture() {
	if (!import.meta.env.DEV || devErrorLog.installed || typeof window === "undefined") return;

	devErrorLog.installed = true;

	const onError = (event: ErrorEvent) => {
		const message = event.message || "Unknown error";
		const stack = event.error instanceof Error ? event.error.stack : undefined;
		const loc = event.filename ? `\n@ ${event.filename}:${event.lineno}:${event.colno}` : "";
		pushEntry("error", `${message}${loc}`, stack);
	};

	const onRejection = (event: PromiseRejectionEvent) => {
		const reason = event.reason;
		if (reason instanceof Error) {
			pushEntry("rejection", reason.message, reason.stack);
			return;
		}
		pushEntry("rejection", formatArg(reason));
	};

	const originalConsoleError = console.error.bind(console);
	console.error = (...args: unknown[]) => {
		pushFromConsoleArgs(args);
		originalConsoleError(...args);
	};

	window.addEventListener("error", onError);
	window.addEventListener("unhandledrejection", onRejection);

	return () => {
		window.removeEventListener("error", onError);
		window.removeEventListener("unhandledrejection", onRejection);
		console.error = originalConsoleError;
		devErrorLog.installed = false;
	};
}

export function formatDevErrorLog(entries: DevErrorEntry[]): string {
	return entries
		.map((e, i) => {
			const header = `[${i + 1}] ${e.at} (${e.source})\n${e.message}`;
			return e.stack ? `${header}\n${e.stack}` : header;
		})
		.join("\n\n---\n\n");
}

export async function copyDevErrorLog(entries: DevErrorEntry[]): Promise<boolean> {
	const text = formatDevErrorLog(entries);
	if (!text) return false;
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

export function clearDevErrorLog() {
	devErrorLog.entries = [];
}
