"""The derived service catalogue must extend coverage without eating the R0 bait.

``backend/athar/normaliser/mappings/service_catalog.yaml`` is generated from the public IAM
corpora (see ``scripts/build_service_catalog.py``) and layered *underneath* the hand-written
``services:`` blocks. Two properties have to hold for that to be safe, and both were violated at
least once while the catalogue was being introduced:

1. A curated entry always wins, so hand-tuning a service is never silently overridden.
2. The generator's R0 bait stays unmappable. The bait used to be a real-but-unmapped service
   (``wellarchitected:``), which stopped baiting the moment coverage reached it — R0 then fired on
   nothing and the round-trip test failed. The bait is now a fictional vendor namespace, and this
   test pins that: if someone maps it, R0 loses its only fixture.
"""

from __future__ import annotations

import pytest
from athar.normaliser.mappings import CATEGORIES, load_mapping

# The fictional namespaces the generator seeds as R0 bait (generator/catalogue.py).
BAIT = (
    ("aws", "nahartelemetry"),
    ("azure", "nahar.telemetry"),
)


@pytest.mark.parametrize(("cloud", "prefix"), BAIT)
def test_r0_bait_is_never_mapped_by_the_catalogue(cloud: str, prefix: str) -> None:
    """R0 models 'an action no catalogue can know'. A mapped bait is a silently dead rule."""
    assert load_mapping(cloud).services.get(prefix) is None, (
        f"{prefix!r} is now mapped for {cloud}: R0 has lost its fixture. Pick a different "
        f"fictional namespace in generator/catalogue.py rather than deleting this test."
    )


@pytest.mark.parametrize("cloud", ["aws", "azure", "gcp"])
def test_every_catalogue_category_is_canonical(cloud: str) -> None:
    for prefix, category in load_mapping(cloud).services.items():
        assert category in CATEGORIES, f"{cloud}:{prefix} -> {category!r}"


def test_curated_entries_beat_derived_ones() -> None:
    """`ce` is hand-mapped to billing in aws.yaml; the catalogue must not be able to move it."""
    assert load_mapping("aws").services["ce"] == "billing"
    assert load_mapping("aws").services["iam"] == "identity"


def test_catalogue_actually_widened_coverage() -> None:
    """Guards the regression the catalogue exists to fix: a bare provider surface.

    Before the catalogue, AWS carried 52 service prefixes and a real authorization-details export
    left 2,436 distinct actions unmapped. This asserts the table is still substantially wider than
    that hand-written baseline, so a failed generation step cannot quietly ship thin coverage.
    """
    assert len(load_mapping("aws").services) > 250
    assert len(load_mapping("azure").services) > 150
    assert len(load_mapping("gcp").services) > 150
