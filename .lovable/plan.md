# Plan: Real Data Import (M8 Final Execution)

Implement the actual data migration from the provided ZIP export, ensuring financial integrity and full history retention.

## Steps

1. **Infrastructure & Verification**
    - Unzip `legacy-system-full-export.zip` and verify row counts against `manifest.json`.
    - Update `migration_batches` status to `REAL_FILE_IMPORT`.
    - Add unique constraints to tables (`products`, `customers`, etc.) on `(legacy_table, legacy_id)` to ensure idempotency.

2. **Core Entity Import**
    - **Products (102)**: Import basic info. Handle 8 missing products (3 from sales, 5 from purchases) by creating `LEGACY_PLACEHOLDER` products to maintain document integrity.
    - **Customers (36)**: Import profiles. Record `legacy_stored_balance` for reconciliation.
    - **Suppliers (10)**: Import profiles. Record `legacy_stored_balance`.
    - **Opening Balances**: Import from `opening_balance` fields in legacy CSVs as initial ledger movements.

3. **Transaction Import & Reconstruction**
    - **Sales (98) & Items (444)**: Import headers and items.
    - **Purchases (67) & Items (230)**: Import headers and items.
    - **Payments (60)**: Import and link to corresponding parties.
    - **Treasury Reconstruction**: Rebuild `treasury_movements`, `party_ledger`, and `inventory_movements` by calling system RPCs/functions during import.
    - **Expense Extraction**: Identify standalone movements in `treasury_movements.csv` that represent expenses and import them to the `expenses` table.

4. **Reconciliation & Audit**
    - Perform post-import matching: Calculated Balance vs. Legacy Stored Balance.
    - Check "Madina Pharmacy" payment (20,000, 2026-05-08) for double-posting.
    - Run the Audit Center to verify health score and document integrity.
    - Perform an idempotency test (re-running the import should result in 0 new records).

## Technical Details

- **Database**: Use `supabaseAdmin` for high-privilege imports.
- **Atomic Operations**: Process each document (e.g., Sale + Items + Movements) in a single transaction context where possible.
- **Placeholder Policy**: Products not found in `products.csv` but referenced in items will be created as `[Legacy Placeholder] Name (ID)`.
- **Status**: System remains in `PRE-CUTOVER`.

---
**Verdict Goal**: `REAL FILE IMPORT PASSED` or `REAL FILE IMPORT FAILED`.
