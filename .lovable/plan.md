# Plan: Real Migration Import (M8 Final)

Implement the actual data migration from the legacy system to the new database, ensuring full history retention, idempotency, and auditability without manual fixes or visual changes.

## Steps

1. **Infrastructure Setup**
    - Create `src/lib/migration/real-import.functions.ts` to handle the `REAL_IMPORT` batch execution.
    - Implement `runRealImport` server function to orchestrate the migration flow.

2. **Core Migration Logic**
    - **Source**: Use `LEGACY_POSTGRES_READ_ONLY` as the source.
    - **Entity Mapping**: Map legacy tables to new tables (`categories`, `products`, `customers`, `suppliers`, `opening_balances`, `purchases`, `sales`, `payments`, `expenses`, `returns`).
    - **Validation Policy**: Automatically import `VALID` records. Move `NEEDS_REVIEW`, `DUPLICATE`, `ORPHAN`, and `INVALID` to `migration_issues`.
    - **Idempotency**: Enforce `legacy_id` + `legacy_table` unique constraints to prevent duplicates.
    - **Double Posting Prevention**: Import original documents and rebuild ledgers/movements using new system rules (no legacy ledger import).

3. **Financial and Inventory Integrity**
    - Retain original `invoice_number`, `transaction_date`, and `created_at`.
    - Special Handling: Ensure "Madina Pharmacy" payment (20k, 2026-05-08) is imported once with its full effect.
    - Rebuild balances from scratch using movements (Ledgers, Inventory, Treasury).
    - Compare calculated balances with `legacy_stored_balance` and log differences.

4. **Audit and Reconciliation**
    - Run full Audit Center after import.
    - Generate a detailed reconciliation report including Health Score and entity counts.
    - Perform a "Re-import Test" to verify zero new records are created on duplicate runs.

## Technical Details

- **Database RPCs**: Utilize existing `post_sale`, `post_purchase`, and `post_payment` logic inside the migration loop to ensure consistent financial rules.
- **Migration Issues Table**: All skipped records will be stored in `migration_issues` with clear reasoning.
- **Audit Center**: Leverage `check_audit_*` RPCs to calculate the final Health Score.
- **Constraints**: Use `ON CONFLICT (legacy_id, legacy_table) DO NOTHING` or equivalent logic to maintain idempotency.

---
**Final Verdict Goal**: `REAL IMPORT SUCCESSFUL` or `REAL IMPORT FAILED`.
**Status**: System remains in `PRE-CUTOVER` mode.
