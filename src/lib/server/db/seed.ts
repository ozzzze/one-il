import { db } from "./index.js";
import { users, pages, notifications, appSettings, sessions } from "./schema.js";
import { hash } from "@node-rs/argon2";
import { generateId } from "../id.js";

const ARGON2_CONFIG = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1,
};

function daysAgo(n: number): Date {
	return new Date(Date.now() - n * 86400000);
}

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
	console.log("Clearing existing data...");
	db.delete(notifications).run();
	db.delete(pages).run();
	db.delete(sessions).run();
	db.delete(appSettings).run();
	db.delete(users).run();

	// --- USERS ---
	console.log("Creating users...");
	const passwordHash = await hash("password123", ARGON2_CONFIG);

	const userData = [
		{ name: "Admin User", email: "admin@svelteforge.dev", username: "admin", role: "admin" as const, daysAgo: 350 },
		{ name: "Sarah Chen", email: "sarah@svelteforge.dev", username: "sarah", role: "admin" as const, daysAgo: 320 },
		{ name: "Marcus Johnson", email: "marcus@svelteforge.dev", username: "marcus", role: "editor" as const, daysAgo: 280 },
		{ name: "Elena Rodriguez", email: "elena@svelteforge.dev", username: "elena", role: "editor" as const, daysAgo: 240 },
		{ name: "James Park", email: "james@svelteforge.dev", username: "james", role: "editor" as const, daysAgo: 200 },
		{ name: "Priya Sharma", email: "priya@svelteforge.dev", username: "priya", role: "editor" as const, daysAgo: 160 },
		{ name: "Alex Turner", email: "alex@svelteforge.dev", username: "alex", role: "viewer" as const, daysAgo: 140 },
		{ name: "Mei Lin", email: "mei@svelteforge.dev", username: "mei", role: "viewer" as const, daysAgo: 120 },
		{ name: "David Kim", email: "david@svelteforge.dev", username: "david", role: "viewer" as const, daysAgo: 90 },
		{ name: "Olivia Brown", email: "olivia@svelteforge.dev", username: "olivia", role: "viewer" as const, daysAgo: 60 },
		{ name: "Lucas Miller", email: "lucas@svelteforge.dev", username: "lucas", role: "viewer" as const, daysAgo: 40 },
		{ name: "Anya Petrov", email: "anya@svelteforge.dev", username: "anya", role: "viewer" as const, daysAgo: 20 },
		{ name: "Noah Williams", email: "noah@svelteforge.dev", username: "noah", role: "viewer" as const, daysAgo: 10 },
		{ name: "Zara Ahmed", email: "zara@svelteforge.dev", username: "zara", role: "viewer" as const, daysAgo: 3 },
	];

	const userIds: string[] = [];
	const editorIds: string[] = [];

	for (const u of userData) {
		const id = generateId(10);
		userIds.push(id);
		if (u.role === "editor" || u.role === "admin") {
			editorIds.push(id);
		}
		await db.insert(users).values({
			id,
			name: u.name,
			email: u.email,
			username: u.username,
			passwordHash,
			role: u.role,
			createdAt: daysAgo(u.daysAgo),
			updatedAt: daysAgo(u.daysAgo),
		});
	}
	console.log(`  Created ${userData.length} users (password: password123)`);

	// --- PAGES ---
	console.log("Creating pages...");
	const pageData = [
		{ title: "Getting Started Guide", slug: "getting-started", template: "default" as const, status: "published" as const, days: 300 },
		{ title: "About Our Platform", slug: "about", template: "landing" as const, status: "published" as const, days: 290 },
		{ title: "Privacy Policy", slug: "privacy-policy", template: "default" as const, status: "published" as const, days: 280 },
		{ title: "Terms of Service", slug: "terms-of-service", template: "default" as const, status: "published" as const, days: 275 },
		{ title: "Blog: Monthly Roundup January", slug: "blog-monthly-jan", template: "blog" as const, status: "published" as const, days: 250 },
		{ title: "Blog: Feature Spotlight", slug: "blog-feature-spotlight", template: "blog" as const, status: "published" as const, days: 220 },
		{ title: "Documentation: API Reference", slug: "docs-api-reference", template: "default" as const, status: "published" as const, days: 200 },
		{ title: "Landing: Product Launch", slug: "product-launch", template: "landing" as const, status: "published" as const, days: 180 },
		{ title: "Blog: Team Updates", slug: "blog-team-updates", template: "blog" as const, status: "published" as const, days: 150 },
		{ title: "Documentation: Quick Start", slug: "docs-quick-start", template: "default" as const, status: "published" as const, days: 120 },
		{ title: "Blog: February Roundup", slug: "blog-monthly-feb", template: "blog" as const, status: "draft" as const, days: 100 },
		{ title: "Pricing Page Redesign", slug: "pricing-redesign", template: "landing" as const, status: "draft" as const, days: 90 },
		{ title: "Blog: Performance Tips", slug: "blog-performance-tips", template: "blog" as const, status: "draft" as const, days: 80 },
		{ title: "Support Center", slug: "support-center", template: "default" as const, status: "draft" as const, days: 70 },
		{ title: "Blog: Community Highlights", slug: "blog-community", template: "blog" as const, status: "draft" as const, days: 60 },
		{ title: "Feature Comparison", slug: "feature-comparison", template: "default" as const, status: "draft" as const, days: 50 },
		{ title: "Landing: Summer Campaign", slug: "summer-campaign", template: "landing" as const, status: "draft" as const, days: 40 },
		{ title: "Blog: Tech Stack Deep Dive", slug: "blog-tech-stack", template: "blog" as const, status: "draft" as const, days: 30 },
		{ title: "Internal: Meeting Notes Q1", slug: "meeting-notes-q1", template: "default" as const, status: "draft" as const, days: 25 },
		{ title: "Blog: Year in Review", slug: "blog-year-review", template: "blog" as const, status: "draft" as const, days: 15 },
		{ title: "Old Landing Page", slug: "old-landing", template: "landing" as const, status: "archived" as const, days: 310 },
		{ title: "Deprecated: V1 Docs", slug: "v1-docs", template: "default" as const, status: "archived" as const, days: 300 },
		{ title: "Retired Blog Post", slug: "retired-blog-post", template: "blog" as const, status: "archived" as const, days: 260 },
		{ title: "Legacy Pricing Page", slug: "legacy-pricing", template: "landing" as const, status: "archived" as const, days: 240 },
		{ title: "Archived: Beta Features", slug: "beta-features", template: "default" as const, status: "archived" as const, days: 220 },
	];

	for (const p of pageData) {
		const createdAt = daysAgo(p.days);
		await db.insert(pages).values({
			id: generateId(10),
			title: p.title,
			slug: p.slug,
			content: `This is the content for "${p.title}". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
			template: p.template,
			status: p.status,
			authorId: randomItem(editorIds),
			createdAt,
			updatedAt: daysAgo(Math.max(0, p.days - Math.floor(Math.random() * 20))),
			publishedAt: p.status === "published" ? createdAt : null,
		});
	}
	console.log(`  Created ${pageData.length} pages`);

	// --- NOTIFICATIONS ---
	console.log("Creating notifications...");
	const notificationData = [
		{ title: "Welcome to SvelteForge", message: "Your admin dashboard is ready to use.", type: "success" as const, days: 85, read: true, global: true },
		{ title: "New user registered", message: "Alex Turner has joined as a viewer.", type: "info" as const, days: 80, read: true, global: false },
		{ title: "Server maintenance scheduled", message: "Planned downtime on Saturday 2AM-4AM UTC.", type: "warning" as const, days: 75, read: true, global: true },
		{ title: "Content published", message: '"Getting Started Guide" is now live.', type: "success" as const, days: 70, read: true, global: false },
		{ title: "Database backup completed", message: "Automatic backup ran successfully.", type: "success" as const, days: 65, read: true, global: true },
		{ title: "New user registered", message: "Mei Lin has joined as a viewer.", type: "info" as const, days: 60, read: true, global: false },
		{ title: "Security scan passed", message: "No vulnerabilities detected in latest scan.", type: "success" as const, days: 55, read: true, global: true },
		{ title: "Disk space warning", message: "Server disk usage at 78%. Consider cleanup.", type: "warning" as const, days: 50, read: true, global: true },
		{ title: "Failed login attempt", message: "3 failed login attempts from IP 192.168.1.42.", type: "error" as const, days: 45, read: true, global: false },
		{ title: "New user registered", message: "David Kim has joined as a viewer.", type: "info" as const, days: 40, read: true, global: false },
		{ title: "SSL certificate renewal", message: "Certificate expires in 30 days. Auto-renewal scheduled.", type: "warning" as const, days: 35, read: true, global: true },
		{ title: "Content updated", message: '"Privacy Policy" was updated by Sarah Chen.', type: "info" as const, days: 32, read: true, global: false },
		{ title: "System update available", message: "SvelteKit 2.51 is available. Review changelog.", type: "info" as const, days: 28, read: true, global: true },
		{ title: "Database backup completed", message: "Weekly backup completed successfully.", type: "success" as const, days: 25, read: true, global: true },
		{ title: "New user registered", message: "Olivia Brown has joined as a viewer.", type: "info" as const, days: 22, read: false, global: false },
		{ title: "Page archived", message: '"Old Landing Page" was archived by Marcus.', type: "info" as const, days: 20, read: false, global: false },
		{ title: "Role change", message: "James Park's role was changed to editor.", type: "info" as const, days: 18, read: false, global: false },
		{ title: "High memory usage", message: "Server memory at 92%. Monitor closely.", type: "error" as const, days: 15, read: false, global: true },
		{ title: "Content published", message: '"Product Launch" landing page is now live.', type: "success" as const, days: 12, read: false, global: false },
		{ title: "New user registered", message: "Lucas Miller has joined as a viewer.", type: "info" as const, days: 10, read: false, global: false },
		{ title: "Database optimization", message: "VACUUM completed. Reclaimed 12MB.", type: "success" as const, days: 8, read: false, global: true },
		{ title: "Failed API call", message: "External API timeout on analytics endpoint.", type: "error" as const, days: 7, read: false, global: true },
		{ title: "Backup storage full", message: "Backup volume at 95%. Rotate old backups.", type: "warning" as const, days: 6, read: false, global: true },
		{ title: "New user registered", message: "Anya Petrov has joined as a viewer.", type: "info" as const, days: 5, read: false, global: false },
		{ title: "Scheduled task failed", message: "Email digest cron job failed. Check logs.", type: "error" as const, days: 4, read: false, global: true },
		{ title: "Content update", message: '"Blog: Team Updates" was edited by Elena.', type: "info" as const, days: 3, read: false, global: false },
		{ title: "New user registered", message: "Noah Williams has joined as a viewer.", type: "info" as const, days: 2, read: false, global: false },
		{ title: "System health check", message: "All services operational. Uptime: 99.97%.", type: "success" as const, days: 1, read: false, global: true },
		{ title: "New user registered", message: "Zara Ahmed has joined as a viewer.", type: "info" as const, days: 0, read: false, global: false },
		{ title: "Security update available", message: "Critical patch for Node.js 22. Update recommended.", type: "warning" as const, days: 0, read: false, global: true },
	];

	for (const n of notificationData) {
		await db.insert(notifications).values({
			id: generateId(10),
			userId: n.global ? null : randomItem(userIds),
			title: n.title,
			message: n.message,
			type: n.type,
			read: n.read,
			createdAt: daysAgo(n.days),
		});
	}
	console.log(`  Created ${notificationData.length} notifications`);

	// --- APP SETTINGS ---
	console.log("Creating app settings...");
	const settingsData = [
		{ key: "siteName", value: "SvelteForge Admin" },
		{ key: "timezone", value: "America/New_York" },
		{ key: "defaultRole", value: "viewer" },
		{ key: "maintenanceMode", value: "false" },
	];

	for (const s of settingsData) {
		await db.insert(appSettings).values({
			key: s.key,
			value: s.value,
			updatedAt: new Date(),
		});
	}
	console.log(`  Created ${settingsData.length} app settings`);

	console.log("\nSeed complete!");
	console.log("Login: admin@svelteforge.dev / password123 (or any user with password123)");
}

seed().catch((err) => {
	console.error("Seed failed:", err);
	process.exit(1);
});
