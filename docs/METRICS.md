# Every number ATHAR shows, and what it actually means

A presenter's reference. For each metric: what it is, where it comes from in the code, why it was
chosen over the obvious alternative, and the honest answer if a judge pushes back.

Rule of thumb for the whole product: **numbers describing the estate are measurements; numbers
describing ATHAR's own accuracy are pipeline-recovery checks.** Never mix the two in one breath.

---

## 1. Overview — the four headline tiles

| Tile | Meaning |
|---|---|
| **Identities** | Distinct people and service accounts after the linker has joined principals across clouds. 507 identities from 735 raw principals — the join is the product. |
| **Open findings** | Findings from the current scan, all rules, all severities. |
| **Critical** | Findings at Critical severity. "Act this week" — the queue, not the backlog. |
| **Median risk score** | Median of the 0–100 identity scores. Deliberately the *median*, not the mean: one score-100 superuser must not drag the middle of the estate upwards. |

> If asked "why is median risk only 2?" — because most of the estate is fine. That is the correct
> shape for a governance estate, and it is why the **p90 and max** are reported separately below.
> A dashboard whose central-tendency number is alarming is a dashboard nobody trusts.

---

## 2. Privilege posture — the governance KPIs

These replaced an accuracy-flavoured headline. Computed in
`backend/athar/services/queries.py::governance_metrics`.

### The definition everything rests on

> **Privileged** = holds a **control verb** (`write`, `delete`, `admin`, `grant`, `billing`) at
> **org or global scope**, in any cloud.

It is a property of the **grant**, never of a job title, a group name or a cloud tag. It is the
same vocabulary `athar.scoring.graph` uses to compute reach, so the Overview tiles and an
identity's own score can never drift apart.

### Row 1 — posture

**Privileged identities** · `12 (30%)`
How many identities hold org/global control, and what share of the estate that is. The single
best one-line answer to "how much control has this organisation handed out?"

**MFA on privileged** · `54.5%`
Share of *privileged humans* with MFA enforced. Service accounts are excluded — a service account
cannot present a second factor, and folding them in would dilute the one number an auditor
actually asks for. The hint names the gap in people, not percent, because you remediate people.

**Blast radius p90** · `41.6%`
The 90th-percentile share of the estate an identity can reach with control verbs. Nearest-rank
(`ceil(0.9 × n)`), never interpolated — interpolation would invent a blast radius no identity
actually has, on a page whose job is to name real accounts.
*Why p90 and not the mean:* the mean hides the tail, and the tail is the risk.

**Risk concentration** · `38.2%`
Share of all measured blast radius held by the worst 5% of identities. This is the number that
decides whether remediation is a project or an afternoon. High concentration is **good news** —
it means a handful of fixes moves most of the risk.

### Row 2 — the populations you write a plan against

| Tile | Meaning | Why it matters |
|---|---|---|
| **Cross-cloud privileged** | Org-scope control in ≥2 clouds | Invisible to any single cloud console. This is the finding no incumbent tool produces. |
| **Dormant privilege** | Privileged **and** departed or on leave | Access that outlived its purpose — the offboarding failure, counted. |
| **Escalation paths** | Identities that can reach admin through a *chain*, not directly | Requires the access graph; a permissions list alone cannot find these. |
| **Org-wide grants** | Count of control verbs at org/global scope | The raw volume behind "privileged identities". |

---

## 3. Clouds — the multi-cloud posture panel

One card per provider. Same five numbers each, so they are comparable at a glance.

**`status` is derived, never configured** — this is the honest bit:

| Status | Meaning |
|---|---|
| `current` | This cloud has grants from the snapshot month being viewed |
| `stale` | Its newest grant **predates** the snapshot — the cloud was not re-exported |
| `absent` | No export ingested at all |

An absent cloud renders "No data" and a sentence saying so. It does **not** render a row of zeros,
because zeros read as a clean bill of health, and "we have no idea" is a different claim from
"there is nothing wrong".

Per-card: Identities · Grants · Findings · Critical · Privileged · No MFA, plus org-wide grants
and the newest export month. Findings are attributed to **every** cloud the identity is present
in, which is the same convention the header badges already use — so per-cloud findings sum to
more than the estate total, by design.

---

## 4. Real export — proof on data nobody wrote for us

Source: the **Cloudsplaining** public example estate (Salesforce, BSD-3) — native
`aws iam get-account-authorization-details` output, deliberately built to contain over-privileged
and privilege-escalating principals. Account IDs sanitised. Nothing here is a real account.

| Metric | Value | Meaning |
|---|---|---|
| **Action coverage** | **100.0%** (was 30.9%) | Share of referenced IAM actions the canonical model understood. 0 of 1,149 unmapped. |
| **Findings** | 283 across 122 real principals | What fired. No ground truth exists, so there is no self-graded score here — deliberately. |
| **Privileged principals** | 107 of 122 | A property of this vulnerable-by-design fixture, not a typical account. |
| **Org-wide grants** | 313 | |
| **Max blast radius** | 100.0% | Computed by the same scorer the product uses — on real ARNs. |
| **R7 on real data** | **35 vs 0** | The headline. See below. |

### The coverage story (the strongest technical result)

The provider tables originally hand-listed only the ~50 services the synthetic generator emits.
Pointed at a real export, that left **2,436 distinct actions unmapped** — the pipeline could read
under a third of the file.

`scripts/build_service_catalog.py` now derives a service→category catalogue for all three clouds
from the **published permission surfaces**: AWS's Service Authorization Reference, Azure's
provider-operations API, GCP's IAM permissions list.

- AWS: **52 → 358** service prefixes, **100%** coverage on the real export
- Azure: 85% of 323 published provider namespaces
- GCP: 80% of 277 published services

Two tiers, and the catalogue records which produced each entry: `curated` (reviewed by hand) and
`keyword` (a documented substring rule). **Anything matching neither is deliberately left
unmapped** so it surfaces as R0, rather than being absorbed into a bucket nobody checked.

### R7 — a known limitation that became a validated rule

R7 (peer outlier) fires on **nobody** in the synthetic estate: the generator gives almost every
identity grants in all seven service categories, so the department median is already the maximum
and R7's "at least two categories more than peers" term can never be satisfied.

On the real export, the **same unmodified rule fires 35 times.** Real estates are lumpy; the
synthetic one was too uniform.

> The limitation was a property of the fixture, not of the rule — which is exactly why the rule
> was left alone rather than retuned until a demo number appeared.

---

## 5. Evaluation — and why it is not a victory lap

Computed in `backend/athar/eval/harness.py`. Constants are tuned on seed 42 and **reported on
held-out seed 7**, which the constants never saw.

### Headline

| Metric | Value | Read it as |
|---|---|---|
| Precision | 100% · **95% CI 92.6–100%** | "We did not raise a false alarm in 48 tries" |
| Recall | 100% · **95% CI 92.6–100%** | "We did not miss anything in 48 tries" |
| Rules exercised | **10 / 11** | R7 produced no ground-truth positive here |
| Decoys handled | 11 / 11 | Identities built to look risky but legitimate via the register |

### The confidence interval is the whole point

A bare "100%" invites the reasonable suspicion that the estate was built to produce it. The
**Wilson score interval** is used rather than the textbook normal interval for one specific
reason: at p = 1.0 the normal interval has **zero width**, so a perfect score on three samples
would print as "100% ± 0%". Wilson stays honest at the boundary.

> **48/48 → [92.6%, 100%].** The claim is not "we are perfect". The claim is "we did not miss
> anything in 48 tries", and the interval says precisely how much that is worth.

### Evaluation coverage — where it can improve

The page names its own weaknesses, from the harness, not from prose:

- **Not exercised — R7.** No ground-truth positive in this estate, so these numbers say nothing
  about it in either direction. (It fires 35× on real data.)
- **Under-powered — R0, R4, R8, R9, R10.** Fewer than 10 ground-truth positives each. Their
  per-rule ratios move by ten points or more on a single case, so they are anecdotes, not
  measurements. The per-rule table marks every row `Measured` / `Under-powered` / `Not exercised`
  and prints `—` rather than `0%` where a ratio is undefined.
- **R0 is the weakest measured rule:** precision 0.75, recall 0.75 on seed 42 — and it is shown,
  not buried.

### The construct limit — say this before a judge does

> Ground truth is written by the **simulator that produced the exports**, in the same canonical
> vocabulary the rules use. The two sides agree on definitions by construction and can only
> disagree where the pipeline loses or distorts something — a writer, a mapping, the linker, a
> rule. **It is a pipeline-recovery check, not evidence of accuracy on a real estate.**

That is why the real-export panel reports *what fired* and carries **no** precision/recall at all.
A self-graded 1.00 next to a real-data result would be the dishonest pairing.

---

## 6. Identity score — the 0–100 number

```
score = 100 × reach × exploitability × (1 − compensating),  then floored by the worst rule, capped at 100
```

- **reach** — measured blast radius: share of the estate reachable with control verbs, via the
  access graph (including impersonation chains), saturating at a reference share.
- **exploitability** — multipliers for departed, dormant, external, cross-cloud, no-MFA.
- **compensating** — controls that reduce it (MFA, monitoring, register exceptions).
- **floor** — a fired rule sets a minimum severity, so a Critical rule can never present as Low.

Every term is shown as a line item on the identity page, with the raw provider JSON behind it.
**Nothing about this score is model-generated.**

---

## 7. Half-life — the metric that names the root cause

**Offboarding half-life**: months for half of a departed person's grants to be revoked.
`Never` (rendered as `Broken`) means it does not converge — grants are effectively never removed.

This is the number that turns "we have 99 findings" into "**your offboarding process is broken**".
It reframes the finding from *twelve risky people* to *one broken process*, which is a
conversation a CISO can act on.

---

## 8. Ledger — what anchoring does and does not prove

Every scan and decision is Merkle-hashed; the root is committed on-chain.

**Proves:** a finding existed at a point in time and was not edited afterwards. Anyone can
recompute the root from the exported findings and verify against the chain, without trusting us.
Edit one stored finding and the verification badge turns red — demonstrated live.

**Does not prove:** that the finding is *correct*. It is tamper-evidence, not truth.

**Current limits, stated:** single-host writer key (production: HSM + per-approver wallets),
simulated apply (production: opens an IaC pull request).

---

## Quick answers to hostile questions

**"100% precision looks fake."**
Agreed — that is why it is shown with a 95% confidence interval of 92.6–100% on 48 samples, and
next to a count of how many rules the estate never exercised. On real data we report no accuracy
score at all, because there is no ground truth to score against.

**"Your ground truth is your own simulator."**
Correct, and the page says so in those words. It measures pipeline recovery, not accuracy. The
real-data evidence is separate: a third-party fixture, 100% action coverage, and 35 R7 hits on a
rule that fires on nothing synthetic.

**"Isn't 107 of 122 principals privileged absurd?"**
Yes — that fixture is deliberately vulnerable, which is why it is useful for testing detection and
why its absolute counts are not a benchmark. The number we stand behind there is *coverage*.

**"Why should I trust the blast radius?"**
You do not have to. Open any identity: every term of the formula is a line item, each line item
links to the grants behind it, and each grant carries the raw provider JSON it came from.
