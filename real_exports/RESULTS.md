# Real-export validation

The jury's one open question (case score 100/100): *"how the scoring constants and joins would
behave on real enterprise IAM data"* — the validation so far is on the synthetic estate. This
directory answers it by running a **real** `aws iam get-account-authorization-details` export
through ATHAR's own normaliser, rule engine and scorer — the exact `normalise_provider(...)` the
`/ingest/upload` endpoint calls, with no database, ledger, LLM or HR feed.

## Source

`aws-authorization-details.json` is the public example estate shipped by **Cloudsplaining**
(Salesforce, BSD-3), a widely used AWS IAM assessment tool. It is native
`get-account-authorization-details` output built to contain genuinely over-privileged and
privilege-escalating principals. Account IDs have been rewritten to the reserved `012345678901`;
policy documents, actions, ARNs and structure are unmodified. Nothing here is a real account.
See `SOURCE.md`.

## Reproduce

```bash
PYTHONPATH=backend python real_exports/run_real.py real_exports/aws-authorization-details.json
PYTHONPATH=backend python real_exports/build_panel_json.py   # refreshes the dashboard panel
```

## Result

```
principals parsed : 122
canonical grants  : 1149
unmapped actions  : 0          (was 2,512 before the derived service catalogue)
action coverage   : 100.0%     (was 30.9%)

privileged principals : 107 of 122     (control verb at org or global scope)
org-wide grants       : 313
max blast radius      : 100.0%

FINDINGS: 283 across 122 real principals
  R0   Low        11  Unmapped permission
  R1   High       17  Wildcard / admin privilege
  R2   Medium     25  Dormant access
  R5   High       73  Toxic combination
  R7   Low        35  Peer outlier
  R10  Medium    122  Unowned principal
```

The 17 R1 (admin) hits land on principals that are genuinely administrative —
`OrganizationAccountAccessRole`, `AWSReservedSSO_AdministratorAccess_*`,
`AWS-QuickSetup-StackSet-Local-ExecutionRole` — plus Cloudsplaining's own over-privileged
fixtures (`userwithlotsofpermissions`, `OverprivilegedEC2`, `MyRole`). R5 (toxic combination /
privilege escalation) fires 73 times on the escalation-capable roles the fixture was built to
carry.

## Why this matters for the pitch

1. **Mapping coverage is no longer the asterisk.** The first pass over this file left 2,436
   distinct actions unmapped, because the provider tables only ever listed the ~50 services the
   synthetic generator emits. `scripts/build_service_catalog.py` now derives a service→category
   catalogue for all three clouds from the published permission surfaces (AWS Service
   Authorization Reference, Azure provider operations, GCP IAM permissions), taking AWS from 52
   to 358 service prefixes. Coverage on this export went **30.9% → 100%**, and the R0 count fell
   from 45 to 11 — the 11 that remain are actions that map to no canonical verb, which is R0
   doing its job rather than R0 reporting a gap in our table.

2. **R7 fires on real data.** On the synthetic estate R7 (peer outlier) fires on *nobody* — the
   generator gives almost every identity grants in every service category, so no one is an
   outlier (documented as a known limitation in the README). On the real export R7 fires **35
   times**. Real estates are lumpy; the synthetic one was too uniform. A known-limitation becomes
   a validated rule.

3. **The perfect precision/recall does not — and should not — appear here.** On synthetic data
   ATHAR reports F1 ≈ 1.00 because ground truth is derived from the same simulator the exports
   come from; it is a *pipeline-recovery* check, not an accuracy claim (see README "Known
   limitations"). Real data has no ground truth, so there is no self-graded 1.00 to distrust —
   instead the findings are checkable against a known third-party tool's own risky fixtures.
   This is the honest number to show a regulator.

4. **What is still missing is still stated plainly.** R10 fires on all 122 principals because no
   HR/ownership feed was supplied (`hr=None`); a real deployment supplies one. 107 of 122
   principals are privileged at org or global scope, which is a property of this deliberately
   vulnerable fixture, not a typical account — it is the reason the file is useful for testing
   detection and the reason its absolute counts should not be read as a benchmark.
