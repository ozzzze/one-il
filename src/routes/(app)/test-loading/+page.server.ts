import type { PageServerLoad } from "./$types.js";

export const load: PageServerLoad = async ({ url }) => {
	// Parse a dynamic delay from the query parameter, defaulting to 1500ms
	const delayParam = url.searchParams.get("delay");
	const delay = delayParam ? parseInt(delayParam, 10) : 1500;

	// Simulate slow loading / data fetching using a Promise timeout
	await new Promise((resolve) => setTimeout(resolve, delay));

	return {
		delay,
		timestamp: new Date().toLocaleTimeString(),
	};
};
