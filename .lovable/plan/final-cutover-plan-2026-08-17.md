# Final Cutover Plan

This plan handles the final verification of the imported data, secures the legacy placeholders, and executes the final transition of the system to production (Final Cutover).

## Phase 1: Legacy Placeholders Management
We will identify and secure the 8 products created as placeholders during the migration. These products will be flagged as legacy data and deactivated for new transactions.

- **Tasks**:
    - Identify the 8 placeholder products (SKU `LEGACY_MISSING_*`).
    - Create a new migration to add a boolean flag `is_legacy_placeholder` to the `products` table.
    - Update the 8 products: set `is_legacy_placeholder = true`, `active = false`, and add legacy details to their notes.
    - Ensure these products are excluded from POS, new purchases, and stock alerts.

## Phase 2: Final Cutover Execution
Transition the system from `PRE-CUTOVER` to `PRODUCTION`.

- **Tasks**:
    - **Data Verification**: Perform a final count of all entities (Products, Customers, Suppliers, Sales, etc.).
    - **Audit Check**: Run a final health check (Health Score, Critical/High issues).
    - **Document Counters**: Adjust the `doc_counters` table based on the maximum document numbers found in the imported data.
    - **Go-Live**: Update the system status to `PRODUCTION`.
    - **Production State**: Ensure the dashboard displays the production view without "System under update" warnings.

## Phase 3: Post-Cutover Verification
Confirm the system state after the transition.

- **Tasks**:
    - Verify counts match the pre-cutover verification.
    - Verify the "Madina Pharmacy" payment of 20,000 exists exactly once.
    - Confirm the old system is marked as "Read Only Archive" in the documentation.

## Technical Details
- **SQL Migration**: Add `is_legacy_placeholder` column to `products`.
- **Server Function Update**: Modify `src/lib/migration/cutover.functions.ts` to implement the actual cutover logic (counters adjustment and status update).
- **Audit Update**: Ensure the 8 placeholders are reported as "Legacy Migration Warnings" rather than operational errors.
- **UI Update**: Update the dashboard metadata text as requested.
