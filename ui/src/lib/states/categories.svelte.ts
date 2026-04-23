import { type CategoriesResponse, Collections } from "$lib/pocketbase-types";
import { RecordState } from "./pb-states.svelte";

class CategoriesState {
    #state = new RecordState<CategoriesResponse<{}>>(Collections.Categories, { sort: 'name' });
    #categoriesToShow = $state<'all' | 'product' | 'supply'>('all');

    get allCategories() {
        return this.#state.items;
    }

    get recentEvents() {
        return this.#state.recentEvents;
    }

    get productCategories() {
        return this.#state.items.filter(c => c.type === 'product');
    }

    get supplyCategories() {
        return this.#state.items.filter(c => c.type === 'supply');
    }

    get categoriesToShow() {
        if (this.#categoriesToShow === 'product') return this.productCategories;
        if (this.#categoriesToShow === 'supply') return this.supplyCategories;
        return this.allCategories;
    }

    setFilter(filter: 'all' | 'product' | 'supply') {
        this.#categoriesToShow = filter;
    }

    async init() {
        await this.#state.init();
    }

    async create(data: Partial<CategoriesResponse<{}>> | FormData) {
        return await this.#state.create(data);
    }

    async update(id: string, data: Partial<CategoriesResponse<{}>>) {
        return await this.#state.update(id, data);
    }

    async delete(id: string) {
        await this.#state.delete(id);
    }

    unsubscribe() {
        this.#state.unsubscribe();
    }
}

export const categoriesState = new CategoriesState();
