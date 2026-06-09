import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { configDefaults } from "vitest/config";
import { rewriteLeaveProxyPath } from "./scripts/leave-proxy-rewrite.mjs";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const leaveDevPort = env.LEAVE_DEV_PORT ?? "5174";
	// localhost resolves IPv4+IPv6; 127.0.0.1 alone can ECONNREFUSED when Vite binds [::1] only (Windows)
	const leaveDevOrigin = `http://localhost:${leaveDevPort}`;

	return {
		plugins: [tailwindcss(), sveltekit()],
		server: {
			port: Number(env.VITE_PORT ?? 5173),
			strictPort: true,
			proxy: {
				// one-leave คนละพอร์ต — /leave/leave/new → /leave/new (ดู scripts/leave-proxy-rewrite.mjs)
				"/leave": {
					target: leaveDevOrigin,
					changeOrigin: true,
					rewrite: rewriteLeaveProxyPath,
				},
			},
		},
		ssr: {
			noExternal: ["layerchart", "svelte-ux"],
		},
		test: {
			...configDefaults,
			include: ["src/**/*.test.ts"],
			testTimeout: 30_000,
		},
	};
});
