# Operational UI/UX Upgrade Plan

Revamp the operational interfaces of the Arabic POS system to be professional, mobile-first, and highly functional while preserving financial integrity and database structure.

## UI/UX Redesign Focus
- **Arabic RTL Support:** Maintain full RTL support with Cairo font.
- **English Digits:** Uniform use of Western digits (0-123) for all financial values.
- **Mobile First:** Optimized layouts for smartphone usage (cards instead of horizontal tables).
- **Navigation:** Dashboard as the central hub, removing crowded bottom navigation.

## Proposed Changes

### 1. Dashboard (`/`)
- Centralized navigation hub with a 2-column grid on mobile.
- KPI cards: Daily Sales, Treasury Balance, Active Invoices, Product Count, Customer/Supplier Receivables.
- Large colorful action cards: Sales, Purchases, Inventory, Customers/Suppliers, Reports, Audit, Settings, Treasury.

### 2. Sales Page (`/sales`)
- **Default View:** New Invoice (POS-style) instead of just the ledger.
- **POS Interface:**
  - Product grid with images, prices, stock, and barcode search.
  - Cart management: Quick quantity adjustments (+/-), direct entry, and removal.
  - Customer selection: Search/Select, default to "Cash Customer", quick "Add New Customer" button.
  - Checkout: Total, Discount, Paid, Remaining, Payment Method, Back-dated transaction support.
  - Validation: Loading states, double-click prevention.
- **Sales Ledger:** Accessible via Tab or button, using Card List on mobile.

### 3. Purchases Page (`/purchases`)
- Similar philosophy to Sales: New Purchase invoice by default.
- Product search with current stock and last purchase price.
- Supplier selection and quick creation.
- Mobile-first entry for quantities, prices, and discounts.
- Purchase ledger with Card List view.

### 4. Customers & Suppliers (`/customers`, `/suppliers`)
- Distinct identity colors: Green for Customers, Red for Suppliers.
- **List View:** Name, phone, current balance, and status.
- **Profile View (Account Statement):**
  - KPI headers: Opening balance, total sales/purchases, total payments, invoice count.
  - Transaction tabs: All, Sales/Purchases, Payments.
  - Actions: New Payment, Statement Print, PDF Export.
- **Payment Creation:** Clear balance preview (Before -> Payment -> After).
- **Receipt Print:** Professional RTL receipt with full balance details.

### 5. Reports Hub (`/reports`)
- Verified and corrected logic for all reports.
- Support for dynamic date ranges (Today, Yesterday, Custom Range, Prev/Next).
- **Sales Report:** Total, count, cash vs credit, returns, net sales, and profit (using `unit_cost` at time of sale).
- Print/PDF support for all major reports.

### 6. Inventory & Products (`/inventory`)
- Professional product list with card-based details.
- **Product Card:** Image, details (SKU, barcode, category), pricing, stock levels (with min threshold).
- **Movement History:** Chronological log of buys/sells/returns/adjustments with running balance.

### 7. Treasury (`/treasury`)
- Clear dashboard for cash flow.
- KPI: Balance, In-flow, Out-flow, Expenses.
- Categorized movement log: Green (In), Red (Out) with source types (Sale, Purchase, Expense).

## Technical Details
- **Formatter:** Centralized `formatCurrency` utility for English digits and consistent RTL alignment.
- **RPC Usage:** Bind UI to existing `post_sale`, `post_purchase`, `post_payment` RPCs.
- **Components:** Re-use `SaleDetails`, `PurchaseDetails`, `PartyForm`, etc., with enhanced UI wrappers.
- **Navigation:** Add `Home` and `Back` buttons to headers; remove `BottomNav` from `AppLayout`.

## Verification Steps
- Cross-check counts and totals against actual data after UI changes.
- Test POS flow: Add item -> Select customer -> Partial payment -> Confirm -> Check ledger.
- Verify date filters in Reports and Account Statements.
- Confirm all numeric outputs use English digits.
