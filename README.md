# 🍞 tinAPPay ERP
**Modernizing the way you bake.**

🏷️ **Version:** 1.0.0  
🔗 **Live App:** [tinappay.store](https://tinappay.store)

tinAPPay is a comprehensive Enterprise Resource Planning (ERP) and Point of Sale (POS) system specifically designed for artisanal bakeries. It streamlines everything from flour procurement to the final sale, providing real-time financial and operational intelligence.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v20 or higher)
- **pnpm** (preferred) or npm
- **PocketBase** (backend)

### Setup & Installation
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tinappay
   ```

2. **Backend Setup:**
   - Navigate to the `data/` folder.
   - Run your PocketBase executable.
   - The system will automatically apply migrations found in `data/pb_migrations`.

3. **Frontend Setup:**
   - Navigate to the `ui/` folder.
   - Install dependencies:
     ```bash
     pnpm install
     ```
   - Create a `.env` file based on `.env.example` and set your `VITE_POCKETBASE_URL`.
   - Run the development server:
     ```bash
     pnpm dev
     ```

---

## ✨ Core Features

### 🔐 Intelligent Authentication
- **Google OAuth2 Integration:** Single-click secure login for staff.
- **Auto-Attendance:** Logging in automatically triggers a "Clock-In". Logging out (or system auto-close at midnight) triggers a "Clock-Out".
- **Gated Access:** New accounts are set to "Pending" until an admin confirms their role.

### 💰 Finance Treasury
- **Automatic Bookkeeping:** Revenue is automatically logged from POS sales, and expenses are logged from procurement receipts.
- **Categorized Ledger:** Tracks Salary, Utilities, Supplies, Maintenance, and more.
- **Audit Ready:** Every transaction is linked to a Reference ID (Order or Purchase Request).
- **Export Engine:** Export your entire financial ledger to CSV for accounting.

### 📊 Live Analytics
- **Fiscal Yields:** Real-time calculation of Net Profit (Revenue - Expenses).
- **Market Velocity:** Weekly trends showing Inflow vs. Outflow.
- **Inventory Health:** Real-time monitoring of total asset value and critical (low stock) items.
- **Labor Productivity:** "Sales per Labor Hour" metric integrated with attendance data.

### 🛒 Point of Sale (POS)
- **High-Velocity Terminal:** Designed for quick transactions.
- **Multi-Branch Support:** Stocks and sales are tracked per branch location.
- **Inventory Hook:** Sales automatically deduct product stock and log inventory movements.

### 📦 Procurement & Inventory
- **Supply Chain Tracking:** Manage raw materials (supplies) and finished goods (products).
- **Purchase Requests:** Streamlined restock workflow from request to receiving.
- **Automated Valuation:** Inventory value is computed based on current stock and unit prices.

---

## 🛠 Tech Stack

- **Frontend:** [SvelteKit](https://kit.svelte.dev/) (Svelte 5 with Runes)
- **State Management:** Reactive classes using Svelte 5 Runes.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **Backend/DB:** [PocketBase](https://pocketbase.io/) (Go-based)
- **Icons:** Google Material Symbols (Rounded)

---

## 🏗 Project Structure

- `data/`: PocketBase executable, migrations, and hooks.
- `ui/src/lib/states/`: Core business logic and global state (Finance, Inventory, etc.).
- `ui/src/lib/components/`: Reusable "Artisanal" UI components.
- `ui/src/routes/(app)/`: Authenticated ERP dashboard and modules.

---

## ⚖️ Legal
- **Privacy Policy:** Standard data handling for staff and operations.
- **Terms of Service:** Internal usage rules for bakery management.

Developed with ❤️ for **Lenie's Choice Bakery**.
