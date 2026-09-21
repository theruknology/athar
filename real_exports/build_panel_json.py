"""Run the real AWS export through ATHAR's pipeline and emit the JSON the dashboard's
Real-export panel reads (frontend/public/real-export.json). Read-only: no DB, no ledger.

What this panel is for
----------------------
The synthetic estate is graded against ground truth its own generator wrote, so precision/recall
there is a pipeline-recovery check, not an accuracy claim. Real data has no ground truth, so this
panel reports *what the engine found and how much of the file it could read* — numbers that stand
up without a self-graded score behind them:

  * mapping coverage — the share of referenced actions the canonical model understood. This was
    31% before the service catalogue was derived from the published provider surface
    (scripts/build_service_catalog.py); it is the honest denominator for everything else.
  * privileged principals and control-plane grants — the shape of control in a real account.
  * blast radius — the same measured reach the product scores identities on, computed here on
    real ARNs rather than simulated ones.

Run from the repo root:

    PYTHONPATH=backend python real_exports/build_panel_json.py
"""

from __future__ import annotations

import collections
import datetime as dt
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "backend"))

from athar.detection.registry import get_rule, run_all
from athar.domain import Thresholds
from athar.normaliser.pipeline import (
    normalise_provider,
    provider_rows_to_month,
    to_estate_view,
)
from athar.scoring.graph import build_graph
from athar.services.queries import PRIVILEGE_VERBS, _PRIVILEGED_SCOPES
from athar.scoring.score import score_identity

SRC = REPO / "real_exports/aws-authorization-details.json"
OUT = REPO / "frontend/public/real-export.json"

# Mapping coverage before the derived service catalogue existed, measured on this same file with
# the hand-written 52-service table. Kept as a constant so the panel can show the delta honestly
# rather than claiming the coverage was always there.
GRANTS_BEFORE_CATALOGUE = 1124
UNMAPPED_BEFORE_CATALOGUE = 2512

data = SRC.read_bytes()
rows = normalise_provider("aws", 1, {"authorization-details.json": data}, hr=None)
month = provider_rows_to_month(rows)
estate = to_estate_view(month)
drafts = run_all(estate, Thresholds())

by_rule = collections.Counter(d.rule_id for d in drafts)
sev_of = {rid: get_rule(rid).severity for rid in by_rule}
by_sev = collections.Counter(sev_of[d.rule_id] for d in drafts)
idents_flagged = {d.identity_id for d in drafts}

# ---------------------------------------------------------------------------
# coverage
# ---------------------------------------------------------------------------
referenced = len(rows.grants) + len(rows.unmapped)
coverage_pct = round(100.0 * len(rows.grants) / referenced, 1) if referenced else 0.0
coverage_before_pct = round(
    100.0 * GRANTS_BEFORE_CATALOGUE / (GRANTS_BEFORE_CATALOGUE + UNMAPPED_BEFORE_CATALOGUE), 1
)

# ---------------------------------------------------------------------------
# the shape of control in the account
# ---------------------------------------------------------------------------
# Same definition the product uses on the live estate (services/queries.py): control-plane
# verbs at project scope or above, so the real-data number is directly comparable to the
# dashboard's own "privileged identities" tile rather than being a second, looser count.
def _is_privileged(g: object) -> bool:
    return (
        g.verb in PRIVILEGE_VERBS  # type: ignore[attr-defined]
        and g.scope_level in _PRIVILEGED_SCOPES  # type: ignore[attr-defined]
        and g.effect == "allow"  # type: ignore[attr-defined]
    )


privileged_principals = {g.identity_id for g in rows.grants if _is_privileged(g)}
privileged_grants = sum(1 for g in rows.grants if _is_privileged(g))
by_category = collections.Counter(g.service_category for g in rows.grants)
by_verb = collections.Counter(g.verb for g in rows.grants)

# ---------------------------------------------------------------------------
# blast radius, on real ARNs
# ---------------------------------------------------------------------------
graph = build_graph(estate)
scored: list[tuple[str, int, float]] = []
for identity_id in estate.identities:
    result = score_identity(estate, identity_id, drafts, graph)
    scored.append((identity_id, result.score, round(result.blast_radius * 100, 1)))
scored.sort(key=lambda r: (-r[1], -r[2]))

top_principals = [
    {
        "name": identity_id.split("/")[-1].split(":")[-1],
        "score": score,
        "blast_radius_pct": blast,
        "rules": sorted({d.rule_id for d in drafts if d.identity_id == identity_id}),
    }
    for identity_id, score, blast in scored[:10]
]
radii = sorted((b for _, _, b in scored), reverse=True)
max_blast = radii[0] if radii else 0.0


def rule_row(rid: str) -> dict:
    spec = get_rule(rid)
    return {"rule_id": rid, "name": spec.name, "severity": spec.severity, "count": by_rule[rid]}


rule_rows = sorted(
    (rule_row(r) for r in by_rule),
    key=lambda r: (int(r["rule_id"][1:]) if r["rule_id"][1:].isdigit() else 99),
)

# sample High/Critical principals, de-duplicated by leaf name, order preserved
samples: list[dict] = []
seen: set[str] = set()
for d in drafts:
    if get_rule(d.rule_id).severity not in ("High", "Critical"):
        continue
    leaf = d.identity_id.split("/")[-1].split(":")[-1]
    if leaf in seen:
        continue
    seen.add(leaf)
    samples.append({"rule_id": d.rule_id, "name": leaf})
    if len(samples) >= 14:
        break

payload = {
    "source": "Cloudsplaining example estate (Salesforce, BSD-3) — native aws "
    "get-account-authorization-details; account IDs sanitised to 012345678901",
    "generated_at": dt.datetime.now(dt.UTC).isoformat(timespec="seconds"),
    "file_bytes": len(data),
    "principals": len(rows.principals),
    "grants": len(rows.grants),
    "unmapped_actions": len(rows.unmapped),
    "actions_referenced": referenced,
    "coverage_pct": coverage_pct,
    "coverage_before_pct": coverage_before_pct,
    "privileged_principals": len(privileged_principals),
    "privileged_grants": privileged_grants,
    "max_blast_radius_pct": max_blast,
    "grants_by_category": dict(by_category.most_common()),
    "grants_by_verb": dict(by_verb.most_common()),
    "top_principals": top_principals,
    "findings_total": len(drafts),
    "identities_flagged": len(idents_flagged),
    "by_severity": {k: by_sev.get(k, 0) for k in ("Critical", "High", "Medium", "Low")},
    "rules": rule_rows,
    "samples": samples,
    # R7 counts on real data vs zero on the synthetic estate — the headline of this panel.
    "r7_real": by_rule.get("R7", 0),
    "r7_synthetic": 0,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
print(
    json.dumps(
        {
            k: payload[k]
            for k in (
                "principals",
                "grants",
                "unmapped_actions",
                "coverage_pct",
                "coverage_before_pct",
                "privileged_principals",
                "privileged_grants",
                "max_blast_radius_pct",
                "findings_total",
                "by_severity",
            )
        },
        indent=2,
    )
)
