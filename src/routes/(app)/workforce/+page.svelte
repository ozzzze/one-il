<script lang="ts">
	import { enhance } from "$app/forms";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { toast } from "svelte-sonner";
	import type { ActionData, PageData } from "./$types.js";

	let { data, form }: { data: PageData; form?: ActionData } = $props();

	type Employee = PageData["employees"][number];

	type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

	let search = $state("");
	let statusFilter = $state<StatusFilter>("ALL");

	const filteredEmployees = $derived.by(() => {
		const normalizedSearch = search.trim().toLowerCase();

		return data.employees.filter((employee) => {
			const fullName = employee.fullName.toLowerCase();
			const employeeNo = (employee.employeeNo ?? "").toLowerCase();
			const email = (employee.email ?? "").toLowerCase();
			const status = employee.status.toUpperCase();
			const matchesSearch =
				normalizedSearch.length === 0 ||
				fullName.includes(normalizedSearch) ||
				employeeNo.includes(normalizedSearch) ||
				email.includes(normalizedSearch);
			const matchesStatus = statusFilter === "ALL" || status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	});

	const successMessageByAction: Record<string, string> = {
		createEmployee: "Employee created successfully",
		assignPrimary: "Primary position assigned successfully",
		setSupervisor: "Supervisor updated successfully",
		assignProgramChair: "Program chair assigned successfully"
	};

	$effect(() => {
		if (form?.message) {
			toast.error(form.message);
		}

		if (form?.success) {
			const message = form.action ? successMessageByAction[form.action] : "Workforce updated successfully";
			toast.success(message ?? "Workforce updated successfully");
		}
	});

	function statusBadgeVariant(status: string) {
		return status.toUpperCase() === "ACTIVE" ? "default" : "secondary";
	}

	function supervisorName(employee: Employee): string {
		const supervisor = employee.activeSupervisor?.supervisor;
		if (!supervisor) return "—";
		return `${supervisor.first_name} ${supervisor.last_name}`;
	}

	function positionLabel(assignment: Employee["primaryAssignment"]): string {
		if (!assignment?.positions) return "—";
		return `${assignment.positions.code} - ${assignment.positions.name}`;
	}

	function orgUnitLabel(assignment: Employee["primaryAssignment"]): string {
		if (!assignment?.org_units) return "—";
		return `${assignment.org_units.code} - ${assignment.org_units.name}`;
	}
</script>

<svelte:head>
	<title>Workforce Management - ONE-IL</title>
</svelte:head>

<div class="space-y-4">
	<div class="space-y-1">
		<h1 class="text-2xl font-semibold tracking-tight">Workforce Management</h1>
		<p class="text-muted-foreground text-sm">
			Manage employees, primary positions, supervisor hierarchy, and program chairs.
		</p>
	</div>

	{#if data.errors.employees || data.errors.positions || data.errors.orgUnits || data.errors.programs}
		<div class="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-3 py-2 text-xs">
			Some workforce reference data failed to load. Please refresh and try again.
		</div>
	{/if}

	<div class="flex flex-wrap items-center gap-2">
		<div class="min-w-[240px] flex-1">
			<Input placeholder="Search employee no, name, or email" bind:value={search} />
		</div>
		<select
			class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring inline-flex h-9 min-w-[160px] rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={statusFilter}
		>
			<option value="ALL">All Statuses</option>
			<option value="ACTIVE">ACTIVE</option>
			<option value="INACTIVE">INACTIVE</option>
		</select>
		<p class="text-muted-foreground text-xs">{filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""}</p>
	</div>

	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row class="h-9">
					<Table.Head class="h-9 px-3 text-xs">employee_no</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">full name</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">email</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">status</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">primary position</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">org unit</Table.Head>
					<Table.Head class="h-9 px-3 text-xs">supervisor</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredEmployees as employee, i (employee.id)}
					<Table.Row class="h-9">
						<Table.Cell class="px-3 py-1.5 text-xs">{employee.employeeNo ?? "—"}</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs font-medium">{employee.fullName}</Table.Cell>
						<Table.Cell class="text-muted-foreground px-3 py-1.5 text-xs">{employee.email ?? "—"}</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">
							<Badge variant={statusBadgeVariant(employee.status)}>{employee.status.toUpperCase()}</Badge>
						</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">{positionLabel(employee.primaryAssignment)}</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">{orgUnitLabel(employee.primaryAssignment)}</Table.Cell>
						<Table.Cell class="px-3 py-1.5 text-xs">{supervisorName(employee)}</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="h-16 text-center text-sm">
							No workforce records match current filters.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="grid gap-3 lg:grid-cols-2">
		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">Create Employee</Card.Title>
				<Card.Description class="text-xs">Create a new employee profile.</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form method="POST" action="?/createEmployee" use:enhance class="grid gap-2">
					<div class="grid gap-2 sm:grid-cols-2">
						<Input name="firstName" placeholder="First name" required />
						<Input name="lastName" placeholder="Last name" required />
					</div>
					<div class="grid gap-2 sm:grid-cols-2">
						<Input type="email" name="email" placeholder="Email" />
						<Input name="employeeNo" placeholder="Employee No" />
					</div>
					<div class="flex justify-end">
						<Button type="submit" size="sm">Create Employee</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">Assign Primary Position</Card.Title>
				<Card.Description class="text-xs">Assign employee primary role and org unit.</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form method="POST" action="?/assignPrimary" use:enhance class="grid gap-2">
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="employeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">Select employee</option>
							{#each data.employees as employee, i (employee.id)}
								<option value={employee.id}>{employee.fullName}</option>
							{/each}
						</select>
						<select
							name="positionId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">Select position</option>
							{#each data.positions as position, i (position.id)}
								<option value={position.id}>{position.code} - {position.name}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="orgUnitId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">Select org unit</option>
							{#each data.orgUnits as orgUnit, i (orgUnit.id)}
								<option value={orgUnit.id}>{orgUnit.code} - {orgUnit.name}</option>
							{/each}
						</select>
						<Input type="date" name="startsAt" required />
					</div>
					<input type="hidden" name="isPrimary" value="true" />
					<div class="flex justify-end">
						<Button type="submit" size="sm">Assign Primary</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">Set Supervisor</Card.Title>
				<Card.Description class="text-xs">Set line supervisor for an employee.</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form method="POST" action="?/setSupervisor" use:enhance class="grid gap-2">
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="employeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">Select employee</option>
							{#each data.employees as employee, i (employee.id)}
								<option value={employee.id}>{employee.fullName}</option>
							{/each}
						</select>
						<select
							name="supervisorEmployeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">Select supervisor</option>
							{#each data.employees as supervisor, i (supervisor.id)}
								<option value={supervisor.id}>{supervisor.fullName}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Input type="date" name="startsAt" required />
					</div>
					<div class="flex justify-end">
						<Button type="submit" size="sm">Set Supervisor</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="space-y-1 py-3">
				<Card.Title class="text-sm">Assign Program Chair</Card.Title>
				<Card.Description class="text-xs">Assign program chair by start date.</Card.Description>
			</Card.Header>
			<Card.Content class="pt-0">
				<form method="POST" action="?/assignProgramChair" use:enhance class="grid gap-2">
					<div class="grid gap-2 sm:grid-cols-2">
						<select
							name="programId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">Select program</option>
							{#each data.programs as program, i (program.id)}
								<option value={program.id}>{program.code} - {program.name}</option>
							{/each}
						</select>
						<select
							name="employeeId"
							required
							class="border-input bg-background ring-offset-background focus-visible:ring-ring inline-flex h-9 rounded-md border px-3 py-1 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							<option value="">Select employee</option>
							{#each data.employees as employee, i (employee.id)}
								<option value={employee.id}>{employee.fullName}</option>
							{/each}
						</select>
					</div>
					<div class="grid gap-2">
						<Input type="date" name="startsAt" required />
					</div>
					<div class="flex justify-end">
						<Button type="submit" size="sm">Assign Program Chair</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
