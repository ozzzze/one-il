import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const leaveDevPort = env.LEAVE_DEV_PORT ?? '5174';
	const leaveDevOrigin = `http://127.0.0.1:${leaveDevPort}`;

	return {
	plugins: [tailwindcss(), sveltekit()],
	server: {
		port: Number(env.VITE_PORT ?? 5173),
		strictPort: false,
		proxy: {
			// one-leave รันคนละพอร์ต — /leave/login → http://127.0.0.1:5174/login
			'/leave': {
				target: leaveDevOrigin,
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/leave/, '') || '/'
			}
		}
	},
	ssr: {
		noExternal: ['layerchart', 'svelte-ux']
	},
	test: {
		...configDefaults,
		include: ['src/**/*.test.ts'],
		testTimeout: 30_000,
	},
	};
});
