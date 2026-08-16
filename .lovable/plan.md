# Phase 8: Real Migration Dry Run and Validation

Executing a full test migration and validation cycle to ensure data integrity before cutover.

## Baseline Extraction
- Connect to legacy database in READ ONLY mode.
- Extract counts for all entities (Products, Customers, Sales, etc.).
- Identify edge cases like `workspace_id IS NULL` records.

## Real Dry Run
- Classification of every source record: `Valid`, `Needs Review`, `Duplicate`, `Orphan`, `Invalid`.
- Identification of "صيدلية المدينة" payment (2026-05-08, 20,000) with legacy `NULL` workspace.

## Test Migration (Non-Production)
- Import document headers and items with `migration_batch_id`.
- Atomic reconstruction of Ledgers:
    - `inventory_movements`: From Sales, Purchases, and Returns.
    - `party_ledger`: From Sales, Purchases, Payments, and Returns.
    - `treasury_movements`: From Payments, Expenses, and Cash Sales.
- Idempotency verification to prevent double-posting.

## Reconciliation & Audit
- Match calculated balances against legacy stored values.
- Calculate Health Scores via Audit Center.
- Verify Idempotency via re-run of the same batch.

## Success Criteria
- Success/Failure counts matching source records.
- Diffs within acceptable limits or flagged for review.
- Final judgment: `READY FOR CUTOVER` or `NOT READY`.

## Technical Details
- Using RPCs (`post_sale`, etc.) for atomic ledger entry creation.
- Tracking via `legacy_id` and `migration_batch_id`.
- Read-only baseline from legacy source.
