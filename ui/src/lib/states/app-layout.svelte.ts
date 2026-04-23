import { page } from "$app/state"


class AppLayout {
    navItems = [
        { label: 'Dashboard', href: '/', icon: 'dashboard' },
        { label: 'POS', href: '/pos', icon: 'point_of_sale' },
        { label: 'Inventory', href: '/inventory', icon: 'inventory_2' },
        { label: 'Procurement', href: '/restock', icon: 'local_shipping' },
        { label: 'Finance', href: '/finance', icon: 'account_balance' },
        { label: 'Analytics', href: '/reports', icon: 'query_stats' },
        { label: 'Users', href: '/users', icon: 'group' },
        { label: 'Settings', href: '/settings', icon: 'settings' }
    ]

    currentPath = $derived(page.url.pathname)
    currentNavItem = $derived(this.navItems.find(item => item.href === this.currentPath) ?? this.navItems[0])
}

export const appLayout = new AppLayout()