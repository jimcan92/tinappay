import { pb } from '$lib/pocketbase';

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
				image: product.image ? pb.getFileUrl(product, product.image) : undefined,
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

	clear() {
		this.items = [];
	}

	async checkout() {
		if (this.items.length === 0) return;

		try {
			const orderData = {
				total: this.totalPrice,
				status: 'completed',
				cashier: pb.authStore.model?.id
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
				const product = await pb.collection('products').getOne(item.productId);
				await pb.collection('products').update(item.productId, {
					stock: (product.stock || 0) - item.quantity
				});

				// Log inventory
				await pb.collection('inventory_logs').create({
					product: item.productId,
					quantity: -item.quantity,
					reason: 'sale',
					user: pb.authStore.model?.id
				});
			}

			this.clear();
			return order;
		} catch (error) {
			console.error('Checkout failed:', error);
			throw error;
		}
	}
}

export const cartState = new CartState();
