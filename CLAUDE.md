# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All frontend commands run from the `ui/` directory using **pnpm** (never npm).

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm check        # Type-check (svelte-check + tsc)
pnpm check:watch  # Type-check in watch mode
pnpm lint         # Check formatting (prettier)
pnpm format       # Fix formatting (prettier)
```

There are no tests in this project.

The **backend** is PocketBase. Run the `pocketbase` executable from `data/` — it auto-applies migrations from `data/pb_migrations/` on startup.

## Architecture

### Stack
- **SvelteKit** (adapter-node) with **Svelte 5 Runes** (`$state`, `$derived`, `$effect`)
- **Tailwind CSS v4 + DaisyUI** for styling. Uses **container queries** (`@container`, `@3xl:`, `@7xl:`) for responsive layouts inside the main content area — not `lg:`/`xl:` viewport breakpoints.
- **PocketBase** (Go backend) for database, auth, real-time subscriptions, file storage, and server hooks.
- **Google Material Symbols Rounded** for icons — use `<span class="material-symbols-rounded">icon_name</span>`, not SVG icon components.

### Route Layout
```
src/routes/
  +layout.svelte          # Root: applies theme, background texture
  (app)/                  # Authenticated group — guarded by +layout.server.ts
    +layout.svelte        # App shell: Sidebar + TopBar + main scroll area
    +layout.server.ts     # Redirects unauthenticated → /login, roleless → /pending
    +page.svelte          # Dashboard
    finance/ pos/ inventory/ reports/ restock/ management/ users/ settings/ profile/
  login/  pending/  help/  privacy/  terms/   # Public routes
```

The app shell layout (`(app)/+layout.svelte`) is fixed: **Sidebar** (w-80, desktop always visible, mobile drawer) + **TopBar** (fixed top, h-16) + `<main>` (scrolls). Do not modify layout, TopBar, or Sidebar files — the user has customized them.

### State Management
Global state lives in `src/lib/states/` as **singleton Svelte 5 rune classes**, one per domain:

| File | Domain |
|---|---|
| `branches.svelte.ts` | Branch list + global `selectedBranchId` filter |
| `finance.svelte.ts` | Finance ledger records + period filter |
| `procurement.svelte.ts` | Supplies, suppliers, purchase requests, branch stocks |
| `attendance.svelte.ts` | Clock-in/out + `performLogout()` |
| `orders.svelte.ts` | Orders |
| `inventory.svelte.ts` | Products + supplies inventory |
| `reports.svelte.ts` | Analytics aggregation across collections |
| `pos.svelte.ts` | POS session state |
| `cart.svelte.ts` | Cart for POS |
| `toast.svelte.ts` | `toastState.success/error/info(msg)` — use for all user feedback |
| `theme.svelte.ts` | DaisyUI theme selection |
| `settings.svelte.ts` | Bakery-level settings |
| `users.svelte.ts` | Staff/user management |
| `app-layout.svelte.ts` | Nav items + active route derived from `page.url.pathname` |

**`RecordState<T>`** in `pb-states.svelte.ts` is a reusable base class for collections that need CRUD + real-time sync + recent event history. It stores up to 50 recent `create/update/delete` events in `recentEvents`.

### The Branch Filter Pattern
`branchesState.selectedBranchId` is the global branch scope. Every state module that loads branch-scoped data reads this before building PocketBase filters. Module-level `$effect.root` blocks re-trigger `load()` reactively when the branch changes:

```ts
$effect.root(() => {
    $effect(() => {
        someState.load(); // reads branchesState.selectedBranchId synchronously → tracked
    });
});
```

### PocketBase Real-Time
State constructors subscribe to collections via `pb.collection('x').subscribe('*', callback)`. Use `requestKey` on all `getFullList` calls to prevent auto-cancellation collisions. Use `err?.isAbort` checks to silently ignore intentional cancellations.

### PocketBase Hooks & Migrations
- `data/pb_hooks/` — PocketBase JS hooks (`cronAdd`, `$app.findRecordsByFilter`, etc.)
- `data/pb_migrations/` — Numbered migration files applied automatically. Archived old migrations live in `data/pb_migrations/.archive/`.

### Auth Flow
1. Login → PocketBase sets `pb_auth` cookie
2. SvelteKit `hooks.server.ts` loads auth from cookie into `locals.user`
3. `(app)/+layout.server.ts` guards: no user → `/login`, no role → `/pending`
4. Logout calls `performLogout()` (from `attendance.svelte.ts`) — auto-clocks-out open attendance, clears auth store and cookie

### UI Components
Custom reusable components in `src/lib/components/`:
- `artisanal/ArtisanalCard.svelte` — primary card surface with depth levels (`level="lowest|low|mid"`)
- `artisanal/SignatureButton.svelte` — primary action button
- `Dialog.svelte` — modal wrapper
- `Toast.svelte` / `toastState` — notification toasts
- `PaginatedTable.svelte` — table with pagination
- `Select.svelte` — custom select input
- `PageHeader.svelte` — page title + subtitle
- `BranchDropdown.svelte` — global branch switcher (in TopBar)

### Environment
Set `VITE_POCKETBASE_URL` in `ui/.env` (defaults to `http://127.0.0.1:8091`). On the server side, `POCKETBASE_URL` env var is used for direct loopback calls (see `pocketbase.ts`).