"""Update the 5-slide GISEC deck to the numbers the product now reports.

Text-only, surgical edits: the deck's layout is full and its design system is good, so nothing is
moved or restyled — only the wording of existing runs changes, which preserves every font, colour
and position. Each replacement is length-checked against its box in `check_fit()` so a longer
sentence cannot silently overflow.

Run from the repo root:

    python hack_files/update_deck.py
"""

from __future__ import annotations

import shutil
from pathlib import Path

from pptx import Presentation
from pptx.util import Emu

SRC = Path("hack_files/ATHAR_GISEC_Hackathon-2.pptx")
BAK = Path("hack_files/ATHAR_GISEC_Hackathon-2.original.pptx")
OUT = Path("hack_files/ATHAR_GISEC_Hackathon-final.pptx")

#: Rough characters-per-square-inch budget at a given point size. Used only to warn: PowerPoint
#: reflows text, so this catches "twice as long as it was" rather than predicting exact wrapping.
CHAR_W = 0.5  # average glyph width as a fraction of point size
LINE_H = 1.25  # line height as a multiple of point size


def para_runs(shape):
    return [r for p in shape.text_frame.paragraphs for r in p.runs]


def find(slide, name: str):
    for sh in slide.shapes:
        if sh.name == name:
            return sh
    raise KeyError(f"{name} not on slide")


def capacity(shape) -> int:
    """Approximate characters the box holds at its own font size."""
    sizes = [r.font.size.pt for r in para_runs(shape) if r.font.size]
    pt = sizes[0] if sizes else 12.0
    width_pt = Emu(shape.width).inches * 72
    height_pt = Emu(shape.height).inches * 72
    per_line = max(1, int(width_pt / (pt * CHAR_W)))
    lines = max(1, int(height_pt / (pt * LINE_H)))
    return per_line * lines


def check_fit(shape, name: str) -> None:
    text = "".join(r.text for r in para_runs(shape))
    cap = capacity(shape)
    if len(text) > cap:
        print(f"  !! {name}: {len(text)} chars vs ~{cap} capacity — may overflow")


def set_run(shape, index: int, text: str, *, label: str = "") -> None:
    """Replace one run's text, keeping its formatting."""
    runs = para_runs(shape)
    if index < len(runs):
        runs[index].text = text
    check_fit(shape, label or shape.name)


def collapse(shape, text: str, *, label: str = "") -> None:
    """Put all text in run 0 and blank the rest (for runs split mid-phrase)."""
    runs = para_runs(shape)
    if not runs:
        return
    runs[0].text = text
    for r in runs[1:]:
        r.text = ""
    check_fit(shape, label or shape.name)


def set_cell(table, row: int, col: int, text: str) -> None:
    """Replace a table cell's text in its first run, so the cell keeps its formatting."""
    cell = table.rows[row].cells[col]
    paras = cell.text_frame.paragraphs
    runs = [r for p in paras for r in p.runs]
    if not runs:
        paras[0].add_run().text = text
        return
    runs[0].text = text
    for r in runs[1:]:
        r.text = ""


def main() -> None:
    if not BAK.exists():
        shutil.copy2(SRC, BAK)
        print(f"backed up original → {BAK.name}")

    prs = Presentation(str(SRC))
    s1, _s2, s3, s4, s5 = prs.slides

    # ------------------------------------------------------------------ slide 1
    set_run(
        find(s1, "Text 4"),
        0,
        "Unified AWS · Azure · GCP identity governance — blast-radius-ranked risk, "
        "proven on real cloud exports, with a verifiable on-chain audit trail.",
    )

    # ------------------------------------------------------------------ slide 3
    set_run(find(s3, "Text 53"), 0, "LLM agents · ATHAR-MCP")
    set_run(find(s3, "Text 54"), 0, "Investigate · plan fix · MCP tools any AI can call")
    set_run(
        find(s3, "Text 74"),
        0,
        "Severity, score and action are deterministic. Over ATHAR-MCP any AI can read and "
        "propose — never approve or apply. API roles enforce it.",
    )

    # ------------------------------------------------------------------ slide 4
    print("slide 4:")
    set_run(
        find(s4, "Text 2"),
        0,
        "Attacked before submission — then run on real data",
    )
    set_run(
        find(s4, "Text 3"),
        0,
        "Every claim was run, not asserted. Where the evidence is thin, the number says so.",
    )
    # Test counts moved on, and the real-export pass is now part of how we tested.
    set_run(find(s4, "Text 7"), 0, "1,887 automated tests, all green")
    set_run(find(s4, "Text 8"), 0, "Backend · frontend · smart-contract suites")
    set_run(find(s4, "Text 19"), 0, "Real AWS IAM export")
    set_run(find(s4, "Text 20"), 0, "Third-party fixture, no ground truth — 100% action coverage")

    # One more attack, and it is the one a judge is about to make.
    table = next(sh.table for sh in s4.shapes if sh.has_table)
    set_cell(table, 4, 0, "Asked whether 100% is real")
    set_cell(table, 4, 1, "Bounded.  95% CI 92.6–100% on n=48, printed on the page")

    # The limitations block is where the honesty lives; two of the four have moved on.
    lim = find(s4, "Text 35")
    runs = para_runs(lim)
    if len(runs) >= 2:
        runs[0].text = "R7 fires on real data  "
        runs[1].text = "35 hits on a real AWS export; 0 on synthetic."
    check_fit(lim, "Text 35")

    ground = find(s4, "Text 33")
    gr = para_runs(ground)
    if len(gr) >= 2:
        gr[0].text = "Ground truth is self-derived  "
        gr[1].text = "A pipeline-recovery check, not real-estate accuracy."
    check_fit(ground, "Text 33")

    # ------------------------------------------------------------------ slide 5
    print("slide 5:")
    set_run(
        find(s5, "Text 3"),
        0,
        "Synthetic demo estate at month 12 · plus a real AWS IAM export the engine had never seen",
    )

    # Stat 3: the growth story is told by the timeline; lead with coverage instead, which is the
    # strongest technical result and the one that makes every other real-data number readable.
    collapse(find(s5, "Text 13"), "100%")
    set_run(find(s5, "Text 14"), 0, "action coverage, real AWS")
    set_run(find(s5, "Text 15"), 0, "up from 30.9% · 0 unmapped")

    # Stat 4: R7 is the cleanest "known limitation became a result" line on the deck.
    collapse(find(s5, "Text 17"), "35 → 0")
    set_run(find(s5, "Text 18"), 0, "R7: real vs synthetic")
    set_run(find(s5, "Text 19"), 0, "a limitation became a result")

    # The results table carries the measured numbers behind each objective.
    table5 = next(sh.table for sh in s5.shapes if sh.has_table)
    set_cell(table5, 1, 1, "735 principals → 507 identities; 8 hold privilege in 2+ clouds")
    set_cell(table5, 2, 1, "Blast radius p90 11.6%, max 69.9%; top 5% hold 52% of all risk")
    set_cell(table5, 4, 0, "✓   Proven on data we didn’t write")
    set_cell(table5, 4, 1, "283 findings on 122 real principals; 100% action coverage")

    # What a governance team gets — name the posture numbers, not just the capability.
    set_run(find(s5, "Text 22"), 0, "Who can do what, since when — all 3 clouds")
    set_run(find(s5, "Text 23"), 0, "41 privileged · 87.9% MFA · 8 cross-cloud")

    limits = find(s5, "Text 27")
    lr = para_runs(limits)
    if len(lr) >= 2:
        lr[0].text = "LIMITS TODAY  "
        lr[1].text = "Self-derived ground truth · single-host key · simulated apply"
    check_fit(limits, "Text 27")

    collapse(find(s5, "Text 34"), "Azure/GCP coverage")
    collapse(find(s5, "Text 36"), "Live gov estate")

    prs.save(str(OUT))
    print(f"\nwrote {OUT}")


if __name__ == "__main__":
    main()
