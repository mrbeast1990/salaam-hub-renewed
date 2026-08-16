# Simplified Interface and Legacy Data Infrastructure Plan

Refactor the application to provide a simplified end-user interface while preserving and formalizing the full database schema and migration infrastructure for a complete legacy system import.

## User Interface Refinement
- Update `AppLayout` navigation to reflect the requested simplified categories:
  - **Sales**: (مبيعات)
  - **Purchases**: (مشتريات)
  - **Inventory**: (مخزون)
  - **Customers**: (حسابات الزبائن)
  - **Reports**: (التقارير)
  - **Audit**: (التدقيق)
  - **Settings**: (الإعدادات)
- Consolidate advanced back-office links (Suppliers, Treasury, Expenses) under the "Audit" or "Settings" sections to keep them accessible but out of the primary workflow.

## Migration & Data Mapping Infrastructure
- **Schema Preservation**: Ensure all `legacy_id`, `legacy_table`, and `migration_batch_id` fields remain in all primary tables.
- **Table Mapping**: Define a formal mapping for the import process:
  - `legacy products` -> `products`
  - `legacy customers` -> `customers`
  - `legacy suppliers` -> `suppliers`
  - `legacy sales` -> `sales`
  - `legacy sale_items` -> `sale_items`
  - `legacy purchases` -> `purchases`
  - `legacy purchase_items` -> `purchase_items`
  - `legacy payments` -> `payments`
  - `legacy expenses` -> `expenses`
  - `legacy treasury` -> `treasury_movements`
- **Balance Calculation**: Import historical documents (Sales, Payments, etc.) and let the ledger-based system calculate balances. Retain `legacy_stored_balance` and `legacy_stored_quantity` for comparison in the Audit Center.

## Implementation Details

### Database & Backend
- Verify `Unique Constraints` on `(legacy_table, legacy_id)` to prevent duplicate imports.
- Update migration tracking tables to support detailed status classification: `Valid`, `Needs Review`, `Duplicate`, `Orphan`, `Invalid`.
- Ensure `workspace_id = NULL` or other "dirty" legacy states are handled by mapping them to safe defaults or flagging them for review instead of discarding.

### Frontend
- Update `src/components/app-layout.tsx` with the new navigation items.
- Enhance `src/routes/_authenticated/migration-review.tsx` to display the detailed mapping and comparison between legacy balances and newly calculated ledger balances.
- Ensure all back-office modules (Suppliers, Payments, Treasury) remain functional as routes, even if hidden from the main menu.

## Verification Plan
- **UI Check**: Confirm the new navigation menu matches the simplified request.
- **Migration Mapping**: Verify the `migration_review` page correctly displays the data mapping and discrepancy reports.
- **Audit Center**: Confirm that `Health Score` still correctly identifies legacy data issues.
