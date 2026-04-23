import { pb } from '$lib/pocketbase';
import type { RecordModel } from 'pocketbase';

export interface RecordStateOptions {
    expand?: string;
    sort?: string;
    filter?: string;
}

export type RecordEvent<T extends RecordModel> = {
    id: string;                              // unique event id (record.id + timestamp)
    action: 'create' | 'update' | 'delete';
    record: T;
    collectionName: string;
    timestamp: string;                       // ISO string — when the event was received
};

const MAX_EVENTS = 50;

export class RecordState<T extends RecordModel> {
    isInitialized = false;
    items = $state<T[]>([]);
    collectionName: string;
    options: RecordStateOptions;

    /** Last MAX_EVENTS create/update/delete events received via real-time subscription */
    recentEvents = $state<RecordEvent<T>[]>([]);

    #selectedItem = $state<T | undefined>();

    constructor(collectionName: string, options: RecordStateOptions = {}) {
        this.collectionName = collectionName;
        this.options = options;
    }

    get selectedItem() {
        return this.#selectedItem;
    }

    set selectedItem(item: T | undefined) {
        this.#selectedItem = item;
    }

    async init() {
        if (this.isInitialized) return;
        await this.fetchAll();
        await this.subscribe();
        this.isInitialized = true;
    }

    private async fetchAll() {
        try {
            this.items = await pb.collection(this.collectionName).getFullList<T>({
                sort: this.options.sort || '-created',
                expand: this.options.expand,
                filter: this.options.filter,
                requestKey: null // Disable auto-cancellation for initial fetch
            });
        } catch (err) {
            console.error(`Fetch failed for ${this.collectionName}:`, err);
        }
    }

    private pushEvent(action: 'create' | 'update' | 'delete', record: T) {
        const event: RecordEvent<T> = {
            id: `${record.id}-${action}-${Date.now()}`,
            action,
            record,
            collectionName: this.collectionName,
            timestamp: new Date().toISOString()
        };
        this.recentEvents = [event, ...this.recentEvents].slice(0, MAX_EVENTS);
    }

    async subscribe() {
        await pb.collection(this.collectionName).subscribe<T>('*', async (e) => {
            if (e.action === 'create') {
                if (this.options.expand) {
                    const record = await pb.collection(this.collectionName).getOne<T>(e.record.id, {
                        expand: this.options.expand
                    });
                    this.items = [...this.items, record];
                    this.pushEvent('create', record);
                } else {
                    this.items = [...this.items, e.record];
                    this.pushEvent('create', e.record);
                }
            } else if (e.action === 'update') {
                if (this.options.expand) {
                    const record = await pb.collection(this.collectionName).getOne<T>(e.record.id, {
                        expand: this.options.expand
                    });
                    this.items = this.items.map(i => i.id === e.record.id ? record : i);
                    this.pushEvent('update', record);
                } else {
                    this.items = this.items.map(i => i.id === e.record.id ? e.record : i);
                    this.pushEvent('update', e.record);
                }
            } else if (e.action === 'delete') {
                this.items = this.items.filter(i => i.id !== e.record.id);
                this.pushEvent('delete', e.record);
            }
        }, {
            expand: this.options.expand
        });
    }

    async create(data: Partial<T> | FormData) {
        try {
            return await pb.collection(this.collectionName).create<T>(data, {
                expand: this.options.expand
            });
        } catch (err: any) {
            console.error(`Failed to create in ${this.collectionName}:`, err.data || err);
            throw err;
        }
    }

    async update(id: string, data: Partial<T> | FormData) {
        try {
            return await pb.collection(this.collectionName).update<T>(id, data, {
                expand: this.options.expand
            });
        } catch (err: any) {
            console.error(`Failed to update in ${this.collectionName}:`, err.data || err);
            throw err;
        }
    }

    async delete(id: string) {
        try {
            await pb.collection(this.collectionName).delete(id);
        } catch (err) {
            console.error(`Failed to delete in ${this.collectionName}:`, err);
            throw err;
        }
    }

    unsubscribe() {
        pb.collection(this.collectionName).unsubscribe('*');
        this.isInitialized = false;
        this.recentEvents = [];
    }

    async setFilter(filter: string) {
        this.options.filter = filter;
        await this.fetchAll();
    }
}
