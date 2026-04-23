import { pb } from '$lib/pocketbase';
import { type UsersResponse, Collections } from "$lib/pocketbase-types";
import { RecordState } from "./pb-states.svelte";

class UsersState {
    #state = new RecordState<UsersResponse<{}>>(Collections.Users, { sort: 'name' });

    get allUsers() {
        return this.#state.items;
    }

    get recentEvents() {
        return this.#state.recentEvents;
    }

    async init() {
        await this.#state.init();
    }

    async create(data: Partial<UsersResponse<{}>> | FormData) {
        return await this.#state.create(data);
    }

    async update(id: string, data: Partial<UsersResponse<{}>> | FormData) {
        return await this.#state.update(id, data);
    }

    async delete(id: string) {
        await this.#state.delete(id);
    }

    async updateSelf(id: string, data: FormData) {
        return await pb.collection('users').update(id, data);
    }

    unsubscribe() {
        this.#state.unsubscribe();
    }
}

export const usersState = new UsersState();