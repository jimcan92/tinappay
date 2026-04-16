import {
    Collections,
    type InventoryLogsResponse,
    type ProductsResponse,
    type SuppliesResponse
} from '$lib/pocketbase-types';
import { RecordState } from './pb-states.svelte';
import { categoriesState } from './categories.svelte';

type ProductRecord = ProductsResponse<any>;
type SupplyRecord = SuppliesResponse<any>;
type LogRecord = InventoryLogsResponse<{
    product?: { id: string; name: string };
    supply?: { id: string; name: string };
    user?: { id: string; name: string };
}>;

class InventoryState {
    products = new RecordState<ProductRecord>(Collections.Products, { expand: 'category', sort: 'name' });
    supplies = new RecordState<SupplyRecord>(Collections.Supplies, { expand: 'category', sort: 'name' });
    logs = new RecordState<LogRecord>(Collections.InventoryLogs, {
        expand: 'product,supply,user',
        sort: '-created'
    });

    async init() {
        await Promise.all([this.products.init(), this.supplies.init(), this.logs.init()]);
    }

    unsubscribe() {
        this.products.unsubscribe();
        this.supplies.unsubscribe();
        this.logs.unsubscribe();
    }

    async createProduct(data: Partial<ProductRecord> | FormData) {
        return await this.products.create(data);
    }

    async updateProduct(id: string, data: Partial<ProductRecord> | FormData) {
        return await this.products.update(id, data);
    }

    async deleteProduct(id: string) {
        await this.products.delete(id);
    }

    async createSupply(data: Partial<SupplyRecord> | FormData) {
        return await this.supplies.create(data);
    }

    async updateSupply(id: string, data: Partial<SupplyRecord> | FormData) {
        return await this.supplies.update(id, data);
    }

    async deleteSupply(id: string) {
        await this.supplies.delete(id);
    }
}

export const inventoryState = new InventoryState();
