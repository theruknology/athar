"""Governance metrics and multi-cloud posture (SPEC §14 Overview).

These are the numbers the landing page leads with, so each one is pinned against a purpose-built
estate whose expected answer can be worked out by hand from the fixture below — not asserted as
"whatever the code returned today".

The estate is deliberately small and lopsided:

  emp-priv-aws     human, MFA off, privileged in AWS only        <- the MFA gap
  emp-priv-multi   human, MFA on,  privileged in AWS + Azure     <- cross-cloud
  emp-priv-gone    human, MFA on,  privileged in AWS, departed   <- dormant privilege
  emp-plain        human, MFA on,  read-only in AWS              <- not privileged
  svc-priv         service account, privileged in AWS            <- privileged, never an MFA gap

GCP carries only svc-priv's read grant from an earlier month, which is what `status: stale` is for.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import pytest
from athar.db import models as m
from athar.services.queries import cloud_posture, governance_metrics
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

SCHEMA = "test_governance_metrics"
MONTH = 2
SCAN = 2


def _identity(identity_id: str, **kw: Any) -> m.Identity:
    base: dict[str, Any] = dict(
        identity_id=identity_id,
        display_name=identity_id,
        identity_type="human",
        department="Finance",
        employment_type="staff",
        employment_status="active",
        hire_month=1,
        departure_month=None,
        external=False,
        mfa_enforced=True,
        tags={},
        contract_end_month=None,
        first_seen_month=1,
        last_seen_month=MONTH,
    )
    base.update(kw)
    return m.Identity(**base)


def _principal(ref: str, cloud: str, identity_id: str) -> m.Principal:
    return m.Principal(
        principal_ref=ref,
        cloud=cloud,
        principal_type="user",
        identity_id=identity_id,
        raw={},
        link_method="hr_email",
        link_confidence="exact",
    )


def _grant(grant_id: str, identity_id: str, cloud: str, month: int = MONTH, **kw: Any) -> m.Grant:
    base: dict[str, Any] = dict(
        grant_id=grant_id,
        identity_id=identity_id,
        principal_ref=f"{cloud}:{identity_id}",
        cloud=cloud,
        service_category="identity",
        verb="admin",  # a control-plane PRIVILEGE_VERB
        scope_level="org",  # project scope or above => privileged
        scope_ref="root",
        region=None,
        effect="allow",
        granted_via="managed_policy:AdministratorAccess",
        snapshot_month=month,
        raw_snippet={},
        source_file="f.json",
        source_pointer="/0",
        active=True,
    )
    base.update(kw)
    return m.Grant(**base)


def _score(identity_id: str, blast: float, escalations: list[Any] | None = None) -> m.IdentityScore:
    return m.IdentityScore(
        identity_id=identity_id,
        scan_id=SCAN,
        blast_radius=blast,
        reach=blast,
        exploitability=1.0,
        compensating=0.0,
        score=int(blast * 100),
        severity="High",
        line_items=[],
        escalation_paths=escalations or [],
    )


@pytest.fixture(scope="module")
def session(db_url: str) -> Any:
    admin = create_engine(db_url, future=True)
    with admin.begin() as conn:
        conn.execute(text(f"DROP SCHEMA IF EXISTS {SCHEMA} CASCADE"))
        conn.execute(text(f"CREATE SCHEMA {SCHEMA}"))
    admin.dispose()
    engine = create_engine(db_url, future=True, connect_args={"options": f"-csearch_path={SCHEMA}"})
    m.Base.metadata.create_all(engine)

    s = Session(engine)
    s.add(
        m.Scan(
            scan_id=SCAN,
            snapshot_month=MONTH,
            ruleset_hash="0x" + "0" * 64,
            started_at=datetime(2026, 1, 1, tzinfo=UTC),
            finished_at=datetime(2026, 1, 1, tzinfo=UTC),
        )
    )
    s.add_all(
        [
            _identity("emp-priv-aws", mfa_enforced=False),
            _identity("emp-priv-multi"),
            _identity("emp-priv-gone", employment_status="departed", departure_month=MONTH),
            _identity("emp-plain"),
            _identity("svc-priv", identity_type="service", employment_type="service"),
        ]
    )
    s.flush()
    s.add_all(
        [
            _principal("aws:emp-priv-aws", "aws", "emp-priv-aws"),
            _principal("aws:emp-priv-multi", "aws", "emp-priv-multi"),
            _principal("azure:emp-priv-multi", "azure", "emp-priv-multi"),
            _principal("aws:emp-priv-gone", "aws", "emp-priv-gone"),
            _principal("aws:emp-plain", "aws", "emp-plain"),
            _principal("aws:svc-priv", "aws", "svc-priv"),
            _principal("gcp:svc-priv", "gcp", "svc-priv"),
        ]
    )
    s.flush()
    s.add_all(
        [
            _grant("g1", "emp-priv-aws", "aws"),
            _grant("g2", "emp-priv-multi", "aws"),
            _grant("g3", "emp-priv-multi", "azure", principal_ref="azure:emp-priv-multi"),
            _grant("g4", "emp-priv-gone", "aws"),
            # read at resource scope: present in AWS, but neither a privilege verb nor broad scope
            _grant("g5", "emp-plain", "aws", verb="read", scope_level="resource"),
            # a privileged service account: counts as privileged, never as an MFA gap
            _grant("g6", "svc-priv", "aws", principal_ref="aws:svc-priv"),
            # GCP's newest grant is a month behind the snapshot => stale
            _grant("g7", "svc-priv", "gcp", month=MONTH - 1, verb="read", scope_level="project"),
        ]
    )
    s.add_all(
        [
            _score("emp-priv-aws", 0.80, escalations=[{"to": "admin"}]),
            _score("emp-priv-multi", 0.60),
            _score("emp-priv-gone", 0.40),
            _score("emp-plain", 0.10),
            _score("svc-priv", 0.10),
        ]
    )
    s.commit()
    yield s
    s.close()
    engine.dispose()
    admin = create_engine(db_url, future=True)
    with admin.begin() as conn:
        conn.execute(text(f"DROP SCHEMA IF EXISTS {SCHEMA} CASCADE"))
    admin.dispose()


def test_privileged_is_a_property_of_the_grant_not_the_job_title(session: Session) -> None:
    g = governance_metrics(session, SCAN, MONTH)
    # four org-scope control grants across four identities; emp-plain's read/resource is not one
    assert g.privileged_identities == 4
    assert g.privileged_pct == 80.0


def test_mfa_gap_counts_privileged_humans_only(session: Session) -> None:
    g = governance_metrics(session, SCAN, MONTH)
    # emp-priv-aws is the only privileged human without MFA; svc-priv is a service account and
    # can never present a second factor, so it must not be counted as a gap.
    assert g.privileged_without_mfa == 1
    # three privileged humans, two with MFA
    assert g.mfa_coverage_pct == pytest.approx(66.7, abs=0.1)


def test_cross_cloud_privilege_needs_two_clouds(session: Session) -> None:
    assert governance_metrics(session, SCAN, MONTH).cross_cloud_privileged == 1


def test_dormant_and_external_privilege(session: Session) -> None:
    g = governance_metrics(session, SCAN, MONTH)
    assert g.dormant_privileged == 1  # emp-priv-gone
    assert g.external_privileged == 0


def test_blast_radius_reports_the_tail_not_the_middle(session: Session) -> None:
    g = governance_metrics(session, SCAN, MONTH)
    assert g.blast_radius_max_pct == pytest.approx(80.0)
    # nearest-rank p90 over [0.1, 0.1, 0.4, 0.6, 0.8] -> ceil(4.5)=5 -> 0.8
    assert g.blast_radius_p90_pct == pytest.approx(80.0)


def test_risk_concentration_is_the_top_5_percent_share(session: Session) -> None:
    g = governance_metrics(session, SCAN, MONTH)
    # top 5% of 5 identities rounds to 1; 0.8 of a 2.0 total
    assert g.risk_concentration_pct == pytest.approx(40.0)


def test_escalation_paths_count_identities_with_a_path(session: Session) -> None:
    assert governance_metrics(session, SCAN, MONTH).escalation_paths == 1


def test_cloud_posture_lists_every_cloud_including_empty_ones(session: Session) -> None:
    rows = {r.cloud: r for r in cloud_posture(session, SCAN, MONTH)}
    assert set(rows) == {"aws", "azure", "gcp"}


def test_cloud_status_is_derived_from_the_data_not_configured(session: Session) -> None:
    rows = {r.cloud: r for r in cloud_posture(session, SCAN, MONTH)}
    assert rows["aws"].status == "current"
    assert rows["azure"].status == "current"
    # GCP's newest grant predates the snapshot month
    assert rows["gcp"].status == "stale"


def test_cloud_posture_counts_are_per_cloud(session: Session) -> None:
    rows = {r.cloud: r for r in cloud_posture(session, SCAN, MONTH)}
    assert rows["aws"].privileged == 4  # priv-aws, priv-multi, priv-gone, svc-priv
    assert rows["azure"].privileged == 1  # priv-multi
    assert rows["gcp"].privileged == 0  # svc-priv's GCP grant is a read, last month
    assert rows["aws"].privileged_without_mfa == 1
    assert rows["azure"].privileged_without_mfa == 0
    assert rows["aws"].privileged_grants == 4
