import type { SubmitFunction } from "@sveltejs/kit";

/**
 * Tracks request lifecycle for progressive forms: sets pending when submit starts,
 * clears after `update()` finishes (success or failure response).
 */
export function pendingEnhance(
	setPending: (pending: boolean) => void,
	inner?: SubmitFunction
): SubmitFunction {
	return (input) => {
		setPending(true);
		const innerNext = inner?.(input);
		return async (opts) => {
			try {
				if (typeof innerNext === "function") {
					await innerNext(opts);
				} else {
					await opts.update();
				}
			} finally {
				setPending(false);
			}
		};
	};
}
