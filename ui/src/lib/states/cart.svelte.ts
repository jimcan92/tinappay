import { pb, fileUrl } from '$lib/pocketbase';
import { branchesState } from './branches.svelte';

export interface CartItem {
	productId: string;
	name: string;
	price: number;
	quantity: number;
	image?: string;
	description?: string;
}

class CartState {
	items = $state<CartItem[]>([]);

	totalQuantity = $derived(this.items.reduce((acc, item) => acc + item.quantity, 0));
	totalPrice = $derived(this.items.reduce((acc, item) => acc + item.price * item.quantity, 0));

	addItem(product: any) {
		const existingItem = this.items.find((item) => item.productId === product.id);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			this.items.push({
				productId: product.id,
				name: product.name,
				price: product.price,
				quantity: 1,
				image: product.image ? fileUrl(product, product.image) : undefined,
				description: product.description
			});
		}
	}

	removeItem(productId: string) {
		const index = this.items.findIndex((item) => item.productId === productId);
		if (index !== -1) {
			if (this.items[index].quantity > 1) {
				this.items[index].quantity -= 1;
			} else {
				this.items.splice(index, 1);
			}
		}
	}

	removeAllItem(productId: string) {
		this.items = this.items.filter((item) => item.productId !== productId);
	}

	setQuantity(productId: string, qty: number) {
		if (qty <= 0) { this.removeAllItem(productId); return; }
		const item = this.items.find((i) => i.productId === productId);
		if (item) item.quantity = qty;
	}

	clear() {
		this.items = [];
	}

	async checkout() {
		if (this.items.length === 0) return;

		// Ensure we have a valid cashier ID from the authStore
		const currentUser = pb.authStore.record;
		const cashierId = currentUser?.id;
		if (!cashierId) {
			throw new Error('You must be logged in to process a checkout.');
		}

		try {
			const branchId = branchesState.selectedBranchId || currentUser?.branch;
			const orderData = {
				total: this.totalPrice,
				status: 'completed',
				cashier: cashierId,
				...(branchId && { branch: branchId })
			};
			const order = await pb.collection('orders').create(orderData);

			for (const item of this.items) {
				await pb.collection('order_items').create({
					order: order.id,
					product: item.productId,
					quantity: item.quantity,
					price: item.price,
					subtotal: item.price * item.quantity
				});

				// Update stock
				if (branchId) {
					try {
						const bsList = await pb.collection('branch_stocks').getFullList({
							filter: `branch="${branchId}" && product="${item.productId}"`
						});
						if (bsList.length > 0) {
							const existing = bsList[0];
							await pb.collection('branch_stocks').update(existing.id, {
								quantity: existing.quantity - item.quantity
							});
						} else {
							await pb.collection('branch_stocks').create({
								branch: branchId,
								product: item.productId,
								quantity: -item.quantity
							});
						}
					} catch (e) { console.error("Error updating branch stock:", e) }
				}

				// Log inventory
				await pb.collection('inventory_logs').create({
					product: item.productId,
					quantity: -item.quantity,
					reason: 'sale',
					user: cashierId
				});
			}

			// Add to finances collection
			try {
				await pb.collection('finances').create({
					branch: branchId || null,
					type: 'revenue',
					amount: this.totalPrice,
					category: 'sales',
					description: `Sale Order #${order.id.slice(0, 8)}`,
					reference_id: order.id,
					date: new Date().toISOString()
				});
			} catch(e) { console.error("Could not record finance", e); }

			this.clear();
			return order;
		} catch (error: any) {
			if (error.data) {
				console.error('Checkout validation failed:', JSON.stringify(error.data, null, 2));
			} else {
				console.error('Checkout failed:', error);
			}
			throw error;
		}
	}
}

export const cartState = new CartState();
