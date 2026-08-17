# Operational UI/UX Upgrade Plan

Revamping the core operational interfaces (Sales, Purchases, Customers, Reports) to be more intuitive, mobile-friendly, and professional, using Western digits (0-9) consistently.

## Phase 1: Global Utilities & Dashboards (Completed)
- [x] Standardized `formatCurrency` and `formatNumber` in `src/lib/utils.ts`.
- [x] Updated Main Dashboard and all existing reports to use English digits.

## Phase 2: Reports Stabilization
- [ ] Add date filters and professional printing to all report pages.
- [ ] Fix profit calculation logic (Gross/Net) to use unit costs and expenses correctly.
- [ ] Implement `ReportFilters` component across all report routes.

## Phase 3: Sales & POS Integration
- [ ] Redesign `/sales` to open a new POS invoice by default.
- [ ] Move Sales Ledger to a "History" tab within the sales page.
- [ ] Optimize POS UI for fast scanning and touch interaction.

## Phase 4: Purchase Workflow
- [ ] Redesign `/purchases` to default to new invoice creation.
- [ ] Implement supplier statement integration directly in the purchase flow.

## Phase 5: Customer & Supplier Management
- [ ] Differentiate Customers (Green) and Suppliers (Red) visually.
- [ ] Add professional "Statement of Account" printing for all parties.
- [ ] Modernize profiles with activity history cards.

## Phase 6: Treasury & Cash Control
- [ ] Redesign Treasury movements view with clear In/Out indicators.
- [ ] Add daily closing summary.

## Technical Notes
- **Digits:** Strictly use `formatCurrency` from `utils.ts` to avoid mixed digit formats.
- **Loading:** Use Skeleton loaders for all async operations.
- **Printing:** All print actions call `/api/print/*` server routes.
- **Audit:** Every major update must be visible in the Audit Center.