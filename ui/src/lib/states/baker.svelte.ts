import { pb } from '$lib/pocketbase';
import { branchesState } from './branches.svelte';
import { inventoryState } from './inventory.svelte';

export type SectionItem = {
    productId: string;
    productName: string;
    unit: string;
    yield_qty: number;
};

export type SectionSupply = {
    supplyId: string;
    supplyName: string;
    unit: string;
    quantity: number;
    categoryId: string;
};

export type ProductionLog = {
    id: string;
    date: string;
    shift: 'day' | 'night';
    created: string;
    itemCount: number;
    supplyCount: number;
    expand?: any;
};

class BakerState {
    history = $state<ProductionLog[]>([]);
    loading = $state(false);
    submitting = $state(false);

    async loadHistory(bakerId: string) {
        this.loading = true;
        try {
            const branchId = branchesState.selectedBranchId;
            const filter = branchId
                ? `baker = "${bakerId}" && branch = "${branchId}"`
                : `baker = "${bakerId}"`;
            const logs = await pb.collection('production_logs').getFullList({
                filter,
                sort: '-date,-created',
                requestKey: 'baker-history'
            });

            const enriched = await Promise.all(
                logs.map(async (log) => {
                    const [items, supplies] = await Promise.all([
                        pb.collection('production_log_items').getFullList({
                            filter: `log = "${log.id}"`,
                            expand: 'product',
                            requestKey: `baker-items-${log.id}`
                        }),
                        pb.collection('production_log_supplies').getFullList({
                            filter: `log = "${log.id}"`,
                            expand: 'supply,category',
                            requestKey: `baker-supplies-${log.id}`
                        })
                    ]);
                    return { ...log, itemCount: items.length, supplyCount: supplies.length, _items: items, _supplies: supplies };
                })
            );

            this.history = enriched as unknown as ProductionLog[];
        } finally {
            this.loading = false;
        }
    }

    async submitReport(params: {
        bakerId: string;
        shift: 'day' | 'night';
        date: string;
        sectionItems: SectionItem[];
        sectionSupplies: SectionSupply[];
    }) {
        const branchId = branchesState.selectedBranchId;
        if (!branchId) throw new Error('No branch selected.');

        this.submitting = true;
        try {
            // 1. Create the production log
            const log = await pb.collection('production_logs').create({
                baker: params.bakerId,
                branch: branchId,
                date: params.date,
                shift: params.shift
            });

            // 2. Create production_log_items
            await Promise.all(
                params.sectionItems
                    .filter(i => i.yield_qty > 0)
                    .map(item =>
                        pb.collection('production_log_items').create({
                            log: log.id,
                            product: item.productId,
                            yield_qty: item.yield_qty,
                            flour_kg: 0,
                            margarine_kg: 0,
                            lard_kg: 0
                        })
                    )
            );

            // 3. Create production_log_supplies
            await Promise.all(
                params.sectionSupplies
                    .filter(s => s.quantity > 0)
                    .map(s =>
                        pb.collection('production_log_supplies').create({
                            log: log.id,
                            supply: s.supplyId,
                            quantity: s.quantity,
                            category: s.categoryId || null
                        })
                    )
            );

            // 4. Inventory updates
            await this.#updateInventory(params, branchId);

            await this.loadHistory(params.bakerId);
        } finally {
            this.submitting = false;
        }
    }

    async #updateInventory(
        params: { sectionItems: SectionItem[]; sectionSupplies: SectionSupply[]; bakerId: string },
        branchId: string
    ) {
        const userId = params.bakerId;

        // Add product yield to branch_stocks
        for (const item of params.sectionItems.filter(i => i.yield_qty > 0)) {
            await this.#adjustStock('product', item.productId, item.yield_qty, branchId, userId);
        }

        // Aggregate supply totals (same supply may appear multiple times from different product rows)
        const supplyTotals = new Map<string, number>();
        for (const s of params.sectionSupplies) {
            if (s.quantity > 0) supplyTotals.set(s.supplyId, (supplyTotals.get(s.supplyId) ?? 0) + s.quantity);
        }
        for (const [supplyId, total] of supplyTotals) {
            await this.#adjustStock('supply', supplyId, -total, branchId, userId);
        }
    }

    async #adjustStock(
        type: 'product' | 'supply',
        itemId: string,
        qty: number,
        branchId: string,
        userId: string
    ) {
        // Log the inventory change
        await pb.collection('inventory_logs').create({
            reason: 'production',
            quantity: qty,
            user: userId,
            ...(type === 'product' ? { product: itemId } : { supply: itemId })
        });

        // Update branch_stocks
        const existing = inventoryState.getBranchStock(type, itemId, branchId);
        if (existing) {
            await pb.collection('branch_stocks').update(existing.id, {
                quantity: (existing.quantity || 0) + qty
            });
        } else {
            await pb.collection('branch_stocks').create({
                branch: branchId,
                [type === 'product' ? 'product' : 'supply']: itemId,
                quantity: qty
            });
        }
    }
}

export const bakerState = new BakerState();
