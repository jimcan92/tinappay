<script lang="ts">
	import { onMount } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import { toastState } from '$lib/states/toast.svelte';
	import { procurementState } from '$lib/states/procurement.svelte';
	import { branchesState } from '$lib/states/branches.svelte';
	import SignatureButton from '$lib/components/artisanal/SignatureButton.svelte';
	import ArtisanalCard from '$lib/components/artisanal/ArtisanalCard.svelte';
	import BakingLoader from '$lib/components/BakingLoader.svelte';
	import PaginatedTable from '$lib/components/PaginatedTable.svelte';
	import Select from '$lib/components/Select.svelte';

	let selectedSupplyId = $state('');
	let restockAmount = $state(0);
	let showHistory = $state(false);

	let selectedSupply = $derived(
		procurementState.supplies.find((s) => s.id === selectedSupplyId) ?? null
	);

	let isAdmin = $derived(pb.authStore.record?.role === 'admin');
	let branchName = $derived(
		branchesState.items.find((b) => b.id === branchesState.selectedBranchId)?.name ?? ''
	);

	// Sort watchlist: critical → low → ok
	let sortedSupplies = $derived(
		[...procurementState.supplies].sort((a, b) => {
			const rank = { critical: 0, low: 1, ok: 2 };
			return rank[procurementState.getStockStatus(a)] - rank[procurementState.getStockStatus(b)];
		})
	);

	let supplyOptions = $derived(
		procurementState.supplies.map((s) => ({
			value: s.id,
			label: `${s.name} — ${procurementState.getBranchStock(s)}${s.unit || ''} left`
		}))
	);

	onMount(() => procurementState.load());

	function prefillReorder(supply: any) {
		selectedSupplyId = supply.id;
		restockAmount = procurementState.getSuggestedReorder(supply);
		document.getElementById('pr-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	async function handleSubmit() {
		if (!selectedSupply || restockAmount <= 0) return;
		try {
			await procurementState.submitRequest(selectedSupply.id, restockAmount);
			restockAmount = 0;
			selectedSupplyId = '';
			toastState.success('Purchase request submitted.');
		} catch {
			toastState.error('Failed to submit purchase request.');
		}
	}

	async function handleApprove(pr: any) {
		try {
			await procurementState.approveRequest(pr);
			toastState.success('Request approved.');
		} catch {
			toastState.error('Failed to approve request.');
		}
	}

	async function handleReceive(pr: any) {
		try {
			await procurementState.receivePR(pr);
			toastState.success('Supplies received.');
		} catch (e: any) {
			toastState.error('Failed to receive supplies: ' + (e?.message || 'Unknown error'));
		}
	}
</script>

<svelte:head>
	<title>Procurement | tinAPPay ERP</title>
</svelte:head>

<div class="no-scrollbar h-full overflow-y-auto px-6 py-8 md:px-10">
	<div class="mx-auto max-w-7xl">
		<!-- Header -->
		<header class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div>
				<h1 class="font-serif text-3xl font-black tracking-tight text-on-surface md:text-4xl">Procurement</h1>
				<p class="mt-2 text-sm font-medium text-on-surface-variant">
					Replenish supplies and track purchase requests
					{#if branchName}
						at <span class="font-bold text-primary">{branchName}</span>
					{/if}
				</p>
			</div>
			{#if !procurementState.loading}
				<div class="flex flex-wrap items-center gap-2">
					{#if procurementState.stats.critical > 0}
						<span class="inline-flex items-center gap-1.5 rounded-full border border-error/15 bg-error/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-error">
							<span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">warning</span>
							{procurementState.stats.critical} Critical
						</span>
					{/if}
					{#if procurementState.stats.low > 0}
						<span class="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
							<span class="material-symbols-outlined text-sm">trending_down</span>
							{procurementState.stats.low} Low
						</span>
					{/if}
					{#if procurementState.stats.pending > 0}
						<span class="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/15 bg-surface-container px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
							<span class="material-symbols-outlined text-sm">hourglass_top</span>
							{procurementState.stats.pending} Pending
						</span>
					{/if}
					{#if procurementState.stats.inTransit > 0}
						<span class="inline-flex items-center gap-1.5 rounded-full border border-tertiary/15 bg-tertiary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-tertiary">
							<span class="material-symbols-outlined text-sm">local_shipping</span>
							{procurementState.stats.inTransit} In Transit
						</span>
					{/if}
				</div>
			{/if}
		</header>

		{#if procurementState.loading}
			<div class="flex h-64 items-center justify-center"><BakingLoader /></div>
		{:else}
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
				<!-- Main column: watchlist + in-flight -->
				<div class="space-y-8 lg:col-span-8">
					<!-- Reorder watchlist -->
					<section>
						<div class="mb-4 flex items-center justify-between px-1">
							<h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Reorder Watchlist</h3>
							<p class="text-[10px] font-medium text-on-surface-variant/50">{procurementState.supplies.length} items</p>
						</div>
						<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm">
							<PaginatedTable
								items={sortedSupplies}
								pageSize={10}
								tableClass="w-full min-w-[760px] border-collapse text-left"
								emptyMessage="No supplies registered yet."
							>
								{#snippet header()}
									<tr class="bg-surface-container text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
										<th class="px-6 py-4">Supply</th>
										<th class="px-4 py-4">Supplier</th>
										<th class="px-4 py-4">Stock</th>
										<th class="px-4 py-4 text-center">Status</th>
										<th class="px-4 py-4 text-right">Suggested</th>
										<th class="px-6 py-4 text-right">Action</th>
									</tr>
								{/snippet}
								{#snippet row(ing)}
									{@const status = procurementState.getStockStatus(ing)}
									{@const suggested = procurementState.getSuggestedReorder(ing)}
									<tr class="group transition-colors hover:bg-surface-container-low/40">
										<td class="px-6 py-4">
											<p class="text-sm font-bold text-on-surface">{ing.name}</p>
											<p class="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">{ing.expand?.category?.name || 'Raw'}</p>
										</td>
										<td class="px-4 py-4">
											{#if ing.expand?.supplier}
												<p class="text-xs font-bold text-on-surface">{ing.expand.supplier.name}</p>
												{#if ing.expand.supplier.phone}
													<p class="text-[10px] font-medium text-on-surface-variant/60">{ing.expand.supplier.phone}</p>
												{/if}
											{:else}
												<span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30">— Not set —</span>
											{/if}
										</td>
										<td class="px-4 py-4">
											<div class="mb-1.5 flex items-baseline gap-1.5">
												<span class="font-serif text-base font-black leading-none {status === 'critical' ? 'text-error' : status === 'low' ? 'text-primary' : 'text-tertiary'}">{procurementState.getBranchStock(ing)}</span>
												<span class="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{ing.unit} / {ing.max_stock || 0}</span>
											</div>
											<div class="h-1 w-24 overflow-hidden rounded-full bg-surface-container">
												<div class="h-full transition-all duration-700 {status === 'critical' ? 'bg-error' : status === 'low' ? 'bg-primary' : 'bg-tertiary'}" style="width: {procurementState.getStockPercentage(ing)}%"></div>
											</div>
										</td>
										<td class="px-4 py-4 text-center">
											{#if status === 'critical'}
												<span class="rounded border border-error/10 bg-error/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-error">Critical</span>
											{:else if status === 'low'}
												<span class="rounded border border-primary/10 bg-primary/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-primary">Low</span>
											{:else}
												<span class="rounded border border-tertiary/10 bg-tertiary/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-tertiary">OK</span>
											{/if}
										</td>
										<td class="px-4 py-4 text-right">
											{#if suggested > 0}
												<span class="font-serif text-sm font-black text-on-surface">+{suggested}</span>
												<span class="ml-1 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">{ing.unit}</span>
											{:else}
												<span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/30">—</span>
											{/if}
										</td>
										<td class="px-6 py-4 text-right">
											<button
												onclick={() => prefillReorder(ing)}
												disabled={suggested <= 0}
												class="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-on-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
											>
												<span class="material-symbols-outlined text-sm">add_shopping_cart</span>
												Reorder
											</button>
										</td>
									</tr>
								{/snippet}
							</PaginatedTable>
						</ArtisanalCard>
					</section>

					<!-- In-flight requests -->
					<section>
						<h3 class="mb-4 px-1 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">In-flight Requests</h3>
						<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm">
							{#if procurementState.inFlightRequests.length === 0}
								<div class="py-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
									No requests in flight
								</div>
							{:else}
								<div class="divide-y divide-outline-variant/5">
									{#each procurementState.inFlightRequests as pr}
										<div class="flex items-center gap-4 px-6 py-4">
											<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full {pr.status === 'approved' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}">
												<span class="material-symbols-outlined text-sm" style="font-variation-settings:'FILL' 1">
													{pr.status === 'approved' ? 'local_shipping' : 'hourglass_top'}
												</span>
											</div>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm font-bold text-on-surface">
													{pr.expand?.supplies?.name || 'Item'}
													<span class="ml-1 font-black text-on-surface-variant/50">×{pr.quantity}</span>
												</p>
												<div class="mt-0.5 flex flex-wrap items-center gap-2 text-[10px]">
													<span class="font-black uppercase tracking-widest {pr.status === 'approved' ? 'text-tertiary' : 'text-primary'}">
														{pr.status}
													</span>
													{#if pr.expand?.supplies?.expand?.supplier}
														<span class="text-on-surface-variant/60">· from {pr.expand.supplies.expand.supplier.name}</span>
													{/if}
													{#if pr.expand?.requested_by}
														<span class="text-on-surface-variant/50">· by {pr.expand.requested_by.name}</span>
													{/if}
												</div>
											</div>
											<div class="flex shrink-0 gap-2">
												{#if pr.status === 'pending' && isAdmin}
													<button
														onclick={() => handleApprove(pr)}
														disabled={procurementState.processing}
														class="rounded-xl bg-tertiary/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-tertiary transition-all hover:bg-tertiary hover:text-on-tertiary active:scale-95 disabled:opacity-40"
													>
														Approve
													</button>
												{/if}
												{#if pr.status === 'pending' || pr.status === 'approved'}
													<button
														onclick={() => handleReceive(pr)}
														disabled={procurementState.processing}
														class="rounded-xl bg-primary/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-on-primary active:scale-95 disabled:opacity-40"
													>
														Receive
													</button>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</ArtisanalCard>
					</section>

					<!-- History (collapsible) -->
					{#if procurementState.historyRequests.length > 0}
						<section>
							<button
								onclick={() => (showHistory = !showHistory)}
								class="mb-4 flex w-full items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-lowest px-5 py-3 transition-colors hover:bg-surface-container-low"
							>
								<span class="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">
									History · {procurementState.historyRequests.length} received
								</span>
								<span class="material-symbols-outlined text-sm text-on-surface-variant transition-transform {showHistory ? 'rotate-180' : ''}">expand_more</span>
							</button>
							{#if showHistory}
								<ArtisanalCard level="lowest" class="overflow-hidden border border-outline-variant/10 p-0 shadow-sm">
									<div class="divide-y divide-outline-variant/5">
										{#each procurementState.historyRequests as pr}
											<div class="flex items-center gap-4 px-6 py-3">
												<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tertiary/10">
													<span class="material-symbols-outlined text-sm text-tertiary" style="font-variation-settings:'FILL' 1">check_circle</span>
												</div>
												<div class="min-w-0 flex-1">
													<p class="truncate text-sm font-bold text-on-surface">
														{pr.expand?.supplies?.name || 'Item'}
														<span class="ml-1 font-black text-on-surface-variant/50">×{pr.quantity}</span>
													</p>
													<p class="mt-0.5 text-[10px] font-medium text-on-surface-variant/50">
														{new Date(pr.updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
													</p>
												</div>
											</div>
										{/each}
									</div>
								</ArtisanalCard>
							{/if}
						</section>
					{/if}
				</div>

				<!-- Sidebar: New Purchase Request -->
				<aside class="lg:col-span-4">
					<div id="pr-form" class="sticky top-0">
						<ArtisanalCard level="lowest" class="border border-outline-variant/10 p-8 shadow-sm">
							<h3 class="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">New Purchase Request</h3>

							<div class="space-y-4">
								<!-- Supply selector -->
								<div class="space-y-2">
									<p class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Supply</p>
									<Select
										bind:value={selectedSupplyId}
										options={supplyOptions}
										placeholder={supplyOptions.length === 0 ? 'No supplies available' : 'Select a supply'}
										onchange={(id) => {
											const s = procurementState.supplies.find((i) => i.id === id);
											restockAmount = s ? procurementState.getSuggestedReorder(s) : 0;
										}}
									/>
									{#if selectedSupply?.expand?.supplier}
										<p class="px-1 text-[10px] font-medium text-on-surface-variant/70">
											Usual supplier: <span class="font-bold text-on-surface">{selectedSupply.expand.supplier.name}</span>
										</p>
									{/if}
								</div>

								<!-- Amount -->
								<div class="space-y-2">
									<label for="restock-amt" class="px-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
										Quantity {selectedSupply ? `(${selectedSupply.unit})` : ''}
									</label>
									<input
										id="restock-amt"
										bind:value={restockAmount}
										type="number"
										min="0"
										class="h-14 w-full rounded-2xl bg-surface-container-low px-5 text-lg font-black text-primary shadow-inner outline-none transition-all focus:ring-2 focus:ring-primary/20"
										placeholder="0"
									/>
									{#if selectedSupply}
										{@const suggested = procurementState.getSuggestedReorder(selectedSupply)}
										{#if suggested > 0 && restockAmount !== suggested}
											<button
												type="button"
												onclick={() => (restockAmount = suggested)}
												class="px-1 text-[10px] font-bold uppercase tracking-widest text-primary/70 transition-colors hover:text-primary"
											>
												Use suggested: {suggested} {selectedSupply.unit} →
											</button>
										{/if}
									{/if}
								</div>

								<SignatureButton
									disabled={procurementState.processing || !selectedSupply || restockAmount <= 0}
									onclick={handleSubmit}
									class="h-14 w-full"
									size="lg"
								>
									{#if procurementState.processing}
										<span class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
										Submitting...
									{:else}
										<span class="material-symbols-outlined text-sm">add_shopping_cart</span>
										Submit Request
									{/if}
								</SignatureButton>
							</div>
						</ArtisanalCard>
					</div>
				</aside>
			</div>
		{/if}
	</div>
</div>
