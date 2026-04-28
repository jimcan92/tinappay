<script lang="ts">
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import PaginatedTable from '$lib/components/PaginatedTable.svelte';
	import { financeState, type FinancePeriod } from '$lib/states/finance.svelte';
	import { onMount } from 'svelte';

	let newExpense = $state({ amount: 0, description: '', category: 'others' });
	let processing = $state(false);

	onMount(() => financeState.load());

	async function handleAddExpense() {
		if (newExpense.amount <= 0 || !newExpense.description) return;
		processing = true;
		try {
			await financeState.addExpense(newExpense.amount, newExpense.description, newExpense.category);
			newExpense = { amount: 0, description: '', category: 'others' };
		} finally {
			processing = false;
		}
	}

	const categories = [
		{ id: 'supplies', label: 'Supplies/Ingredients', icon: 'shopping_basket' },
		{ id: 'utilities', label: 'Utilities (Elec/Water)', icon: 'bolt' },
		{ id: 'salary', label: 'Staff Salary', icon: 'payments' },
		{ id: 'maintenance', label: 'Maintenance', icon: 'build' },
		{ id: 'others', label: 'Others', icon: 'more_horiz' }
	];

	const periods: { id: FinancePeriod; label: string }[] = [
		{ id: 'today', label: 'Today' },
		{ id: 'week', label: 'This Week' },
		{ id: 'month', label: 'This Month' },
		{ id: 'all', label: 'All Time' }
	];

	function getCategoryIcon(cat: string) {
		return categories.find((c) => c.id === cat)?.icon || 'receipt';
	}

	function exportToCSV() {
		const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Branch', 'Reference ID'];
		const rows = financeState.records.map((f) => [
			new Date(f.date).toLocaleString().replace(',', ''),
			f.description.replace(',', ';'),
			f.category || 'others',
			f.type,
			f.amount,
			f.expand?.branch?.name || 'Central',
			f.reference_id || ''
		]);

		const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', `tinAPPay_Finance_${new Date().toISOString().split('T')[0]}.csv`);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function getCategoryPercentage(value: number) {
		const total = financeState.totalExpense || 1;
		return Math.min(100, Math.round((value / total) * 100));
	}
</script>

<svelte:head>
	<title>Finance Treasury | tinAPPay ERP</title>
</svelte:head>

<div class="@container animate-in px-6 py-10 duration-700 fade-in md:px-10">
	<header class="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
		<div>
			<h1 class="mb-3 font-serif text-4xl font-black tracking-tight text-on-surface md:text-5xl">
				Finance Treasury
			</h1>
			<p class="max-w-2xl text-lg leading-relaxed font-medium text-on-surface-variant">
				Detailed ledger of bakery revenues, operating expenses, and net yields.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button
				onclick={exportToCSV}
				class="flex items-center gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container-high px-6 py-2.5 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all hover:bg-surface-container-highest"
			>
				<span class="material-symbols-outlined text-sm">download</span>
				Export CSV
			</button>
			<div class="flex rounded-2xl bg-surface-container p-1 shadow-inner">
				{#each periods as p}
					<button
						onclick={() => financeState.setPeriod(p.id)}
						class="rounded-xl px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all {financeState.period ===
						p.id
							? 'bg-primary text-white shadow-lg'
							: 'text-on-surface-variant hover:bg-surface-container-high'}"
					>
						{p.label}
					</button>
				{/each}
			</div>
		</div>
	</header>

	{#if financeState.loading}
		<div class="flex h-64 items-center justify-center">
			<BakingLoader />
		</div>
	{:else}
		<!-- Stats Bento -->
		<div class="mb-12 grid grid-cols-1 gap-6 @3xl:grid-cols-3">
			<ArtisanalCard
				level="lowest"
				class="group relative overflow-hidden border border-outline-variant/10 shadow-sm"
			>
				<div
					class="absolute -top-6 -right-6 rotate-12 opacity-5 transition-transform group-hover:scale-110"
				>
					<span class="material-symbols-outlined text-[100px] text-tertiary">trending_up</span>
				</div>
				<div class="mb-6 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-container/20 text-tertiary shadow-inner"
					>
						<span class="material-symbols-outlined">payments</span>
					</div>
					<span class="text-[9px] font-black tracking-widest text-tertiary uppercase">Inflow</span>
				</div>
				<p class="mb-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
					Total Revenue
				</p>
				<h3 class="font-serif text-4xl font-black tracking-tighter text-on-surface">
					₱{financeState.totalRevenue.toLocaleString(undefined, {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					})}
				</h3>
			</ArtisanalCard>

			<ArtisanalCard
				level="lowest"
				class="group relative overflow-hidden border border-outline-variant/10 shadow-sm"
			>
				<div
					class="absolute -top-6 -right-6 rotate-12 opacity-5 transition-transform group-hover:scale-110"
				>
					<span class="material-symbols-outlined text-[100px] text-error">trending_down</span>
				</div>
				<div class="mb-6 flex items-center justify-between">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-error-container/10 text-error shadow-inner"
					>
						<span class="material-symbols-outlined">receipt_long</span>
					</div>
					<span class="text-[9px] font-black tracking-widest text-error uppercase">Outflow</span>
				</div>
				<p class="mb-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase">
					Total Expenses
				</p>
				<h3 class="font-serif text-4xl font-black tracking-tighter text-on-surface">
					₱{financeState.totalExpense.toLocaleString(undefined, {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2
					})}
				</h3>
			</ArtisanalCard>

			<div
				class="group relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary to-primary-container p-8 text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
			>
				<div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
				<div class="relative z-10">
					<div class="mb-6 flex items-center justify-between">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner"
						>
							<span class="material-symbols-outlined text-white">account_balance_wallet</span>
						</div>
						<span class="text-[9px] font-black tracking-widest text-white/70 uppercase"
							>Net Yield</span
						>
					</div>
					<p class="mb-1 text-[10px] font-black tracking-widest text-white/70 uppercase">
						Fiscal Balance
					</p>
					<h3 class="font-serif text-4xl font-black tracking-tighter text-white">
						₱{financeState.netProfit.toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2
						})}
					</h3>
				</div>
				<div
					class="absolute right-4 bottom-4 transform opacity-20 transition-transform duration-700 group-hover:rotate-12"
				>
					<span class="material-symbols-outlined text-7xl">account_balance</span>
				</div>
			</div>
		</div>

		<!-- Main Layout -->
		<div class="grid grid-cols-1 items-start gap-10 @3xl:grid-cols-5 @7xl:grid-cols-12">
			<!-- Left Column: Controls & Analytics -->
			<div class="space-y-8 @3xl:col-span-2 @7xl:col-span-3">
				<div class="space-y-6">
					<h3
						class="px-1 text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase"
					>
						Record Expenditure
					</h3>
					<ArtisanalCard
						level="high"
						class="relative overflow-hidden border border-outline-variant/10 p-8 shadow-2xl"
					>
						<div class="absolute -top-8 -right-8 opacity-5">
							<span class="material-symbols-outlined text-[150px]">attach_money</span>
						</div>
						<div class="relative z-10 space-y-8">
							<div class="space-y-3">
								<label
									for="amount"
									class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
									>Expense Amount (₱)</label
								>
								<input
									id="amount"
									bind:value={newExpense.amount}
									type="number"
									step="0.01"
									class="h-16 w-full rounded-2xl border-none bg-primary-container/20 px-6 text-2xl font-black text-on-primary-container shadow-inner transition-all outline-none focus:ring-4 focus:ring-primary/50"
									placeholder="0.00"
								/>
							</div>
							<div class="space-y-3">
								<label
									for="category"
									class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
									>Category</label
								>
								<div class="flex flex-col gap-2">
									{#each categories as cat}
										<button
											onclick={() => (newExpense.category = cat.id)}
											class="flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all {newExpense.category ===
											cat.id
												? 'border-primary bg-primary/5 text-primary'
												: 'border-outline-variant/10 bg-surface-container text-on-surface-variant hover:border-primary/50'}"
										>
											<span class="material-symbols-outlined text-sm">{cat.icon}</span>
											<span class="text-[9px] font-black tracking-tighter uppercase"
												>{cat.label}</span
											>
										</button>
									{/each}
								</div>
							</div>
							<div class="space-y-3">
								<label
									for="desc"
									class="px-1 text-[10px] font-black tracking-widest text-on-surface-variant uppercase"
									>Description / Purpose</label
								>
								<textarea
									id="desc"
									bind:value={newExpense.description}
									class="h-32 w-full resize-none rounded-2xl border-none bg-primary-container/20 p-6 text-sm font-medium shadow-inner transition-all outline-none focus:ring-4 focus:ring-primary/50"
									placeholder="E.g. Electricity Bill, Weekly Payroll..."
								></textarea>
							</div>
							<SignatureButton
								disabled={processing || newExpense.amount <= 0 || !newExpense.description}
								onclick={handleAddExpense}
								class="h-16 w-full"
								size="lg"
							>
								{processing ? 'Synchronizing...' : 'Finalize Entry'}
							</SignatureButton>
						</div>
					</ArtisanalCard>
				</div>

				<!-- Category Breakdown -->
				<div class="space-y-6">
					<h3
						class="px-1 text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase"
					>
						Expense Distribution
					</h3>
					<div class="space-y-4">
						{#each financeState.expenseByCategory as cat}
							<div class="space-y-2">
								<div class="flex items-center justify-between text-on-surface-variant">
									<div class="flex items-center gap-2">
										<span class="material-symbols-outlined text-xs"
											>{getCategoryIcon(cat.name)}</span
										>
										<span class="text-[9px] font-black tracking-widest uppercase">{cat.name}</span>
									</div>
									<span class="text-[9px] font-black"
										>₱{cat.value.toLocaleString()} ({getCategoryPercentage(cat.value)}%)</span
									>
								</div>
								<div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
									<div
										class="h-full rounded-full bg-error transition-all duration-1000"
										style="width: {getCategoryPercentage(cat.value)}%"
									></div>
								</div>
							</div>
						{/each}
						{#if financeState.expenseByCategory.length === 0}
							<div
								class="rounded-[2rem] border border-dashed border-outline-variant/20 bg-surface-container p-8 text-center"
							>
								<span
									class="material-symbols-outlined mb-2 text-4xl text-on-surface-variant opacity-20"
									>analytics</span
								>
								<p class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase">
									No expenses recorded yet.
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right Column: Ledger -->
			<div class="space-y-6 @3xl:col-span-3 @7xl:col-span-9">
				<div class="mb-6 flex items-center justify-between px-1">
					<h3 class="text-[10px] font-black tracking-[0.3em] text-on-surface-variant uppercase">
						General Ledger Register
					</h3>
					<div class="flex items-center gap-4">
						<span class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase"
							>{financeState.records.length} Transactions Found</span
						>
					</div>
				</div>
				<ArtisanalCard
					level="lowest"
					class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm"
				>
					<PaginatedTable
						items={financeState.records}
						pageSize={15}
						tableClass="w-full text-left border-collapse"
						emptyMessage="The ledger is currently clear."
					>
						{#snippet header()}
							<tr
								class="bg-surface-container text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase"
							>
								<th class="px-8 py-5">Date & Time</th>
								<th class="px-6 py-5">Voucher Activity</th>
								<th class="px-6 py-5 text-center">Reference</th>
								<th class="px-8 py-5 text-right">Value</th>
							</tr>
						{/snippet}
						{#snippet row(f)}
							<tr
								class="group cursor-pointer border-b border-outline-variant/5 transition-colors hover:bg-surface-container-low/40"
							>
								<td class="px-8 py-6">
									<div class="flex flex-col">
										<span class="text-sm font-bold text-on-surface"
											>{new Date(f.date).toLocaleDateString()}</span
										>
										<span
											class="text-[9px] font-black tracking-widest text-on-surface-variant uppercase opacity-60"
											>{new Date(f.date).toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit'
											})}</span
										>
									</div>
								</td>
								<td class="px-6 py-6">
									<div class="flex items-center gap-4">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-xl {f.type ===
											'revenue'
												? 'bg-tertiary/10 text-tertiary'
												: 'bg-error/10 text-error'}"
										>
											<span class="material-symbols-outlined text-lg"
												>{getCategoryIcon(f.category)}</span
											>
										</div>
										<div class="flex flex-col">
											<span class="text-sm font-bold text-on-surface">{f.description}</span>
											<span
												class="text-[9px] font-black tracking-tighter text-on-surface-variant uppercase opacity-60"
											>
												{f.category || 'uncategorized'} • {f.expand?.branch?.name ||
													'Central Office'}
											</span>
										</div>
									</div>
								</td>
								<td class="px-6 py-6 text-center">
									{#if f.reference_id}
										<span
											class="rounded bg-surface-container-high px-2 py-1 text-[8px] font-black tracking-tighter text-on-surface-variant uppercase"
										>
											ID: {f.reference_id.slice(-8)}
										</span>
									{:else}
										<span
											class="text-[8px] font-black tracking-tighter text-on-surface-variant uppercase opacity-30"
											>—</span
										>
									{/if}
								</td>
								<td class="px-8 py-6 text-right">
									<span
										class="font-serif text-lg font-black {f.type === 'revenue'
											? 'text-tertiary'
											: 'text-error'} tracking-tighter"
									>
										{f.type === 'revenue' ? '+' : '-'}₱{f.amount.toFixed(2)}
									</span>
								</td>
							</tr>
						{/snippet}
					</PaginatedTable>
				</ArtisanalCard>
			</div>
		</div>
	{/if}
</div>
