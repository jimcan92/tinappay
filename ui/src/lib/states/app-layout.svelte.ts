import { page } from "$app/state"

export type UserRole = 'admin' | 'staff' | 'cashier' | 'baker';

class AppLayout {
    // Presentation Mode settings
    isDemoModeActive = $state(false);
    simulatedRole = $state<UserRole | null>(null);

    navGroups = [
        {
            label: 'Operations',
            items: [
                { label: 'Dashboard', href: '/', icon: 'dashboard', roles: ['admin', 'staff', 'cashier', 'baker'] },
                { label: 'POS', href: '/pos', icon: 'point_of_sale', roles: ['admin', 'staff', 'cashier'] },
                { label: 'Production', href: '/baker', icon: 'bakery_dining', roles: ['baker'] }
            ]
        },
        {
            label: 'Management',
            items: [
                { label: 'Inventory', href: '/inventory', icon: 'inventory_2', roles: ['admin', 'staff'] },
                { label: 'Procurement', href: '/restock', icon: 'local_shipping', roles: ['admin', 'staff'] },
                { label: 'Finance', href: '/finance', icon: 'account_balance', roles: ['admin'] },
                { label: 'Analytics', href: '/reports', icon: 'query_stats', roles: ['admin'] }
            ]
        },
        {
            label: 'System',
            items: [
                { label: 'Bakery Management', href: '/management', icon: 'admin_panel_settings', roles: ['admin'] }
            ]
        }
    ]

    currentPath = $derived(page.url.pathname)

    // Helper to determine what role to use for UI filtering
    getEffectiveRole(actualRole: UserRole): UserRole {
        if (actualRole === 'admin' && this.isDemoModeActive && this.simulatedRole) {
            return this.simulatedRole;
        }
        return actualRole;
    }

    // Filtered navigation based on role
    getFilteredNav(role: UserRole) {
        const effectiveRole = this.getEffectiveRole(role);
        return this.navGroups.map(group => ({
            ...group,
            items: group.items.filter(item => item.roles.includes(effectiveRole))
        })).filter(group => group.items.length > 0);
    }

    setSimulatedRole(role: UserRole | null) {
        this.simulatedRole = role;
    }

    toggleDemoMode() {
        this.isDemoModeActive = !this.isDemoModeActive;
        if (!this.isDemoModeActive) this.simulatedRole = null;
    }
}

export const appLayout = new AppLayout()
