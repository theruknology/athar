# ATHAR, explained in plain language

For anyone presenting or defending this project. No prior cloud-security knowledge assumed.
Read top to bottom once; after that use it as a lookup.

---

## 1. The problem, in one paragraph

A large organisation does not run on one computer system any more. It runs on several — typically
Amazon's cloud (**AWS**), Microsoft's (**Azure**) and Google's (**GCP**). Each of those keeps its
own list of who is allowed to do what. The three lists use different words for the same ideas, and
none of them knows the other two exist.

So a simple question — *who in this organisation can delete our citizens' data?* — has no single
place to ask it. You have to ask three systems separately, translate the three answers into a
common language yourself, and hope you didn't miss anyone.

**ATHAR answers that question in one place.** The name is Arabic for *trace* — the mark something
leaves behind.

---

## 2. The vocabulary

You need about eight words. Everything else is built from these.

**Identity** — a person or a machine that can do things. "Fatima from Finance" is an identity. So
is an automated backup script. Machines outnumber people in most organisations, and they are
usually the ones nobody reviews.

**Principal** — one cloud's *account object* for an identity. Fatima has an AWS principal, an
Azure principal and a Google principal. Three principals, one human being. This is the confusion
ATHAR removes: it took **735 principals** and worked out they are **507 actual identities**.

**Grant** — one permission. "Fatima may delete files in the citizen-records store." An
organisation has tens of thousands of these.

**Scope** — *how widely* a permission applies. Four levels, narrow to wide:

| Scope | Means |
|---|---|
| Resource | one specific thing — this database |
| Project | one whole project or subscription |
| Org | the entire organisation |
| Global | everything, everywhere |

A permission at *resource* scope is routine. The same permission at *org* scope is a different
animal entirely. Scope is most of the story.

**Verb** — *what* the permission lets you do. ATHAR reduces every cloud's thousands of permission
names to seven plain verbs: **read, write, delete, admin, grant, impersonate, billing**.

The last three matter most, and they are the ones people miss:

- **admin** — full control.
- **grant** — can *give permissions to other people*. Someone with `grant` can make themselves an
  administrator tomorrow. They are already an administrator, just not on paper.
- **impersonate** — can *become* another account. Same problem, different route.

**Privileged** — ATHAR's definition: holds **admin, grant or impersonate**, at **project scope or
wider**. In other words: can change who is allowed to do what, across something bigger than a
single object. Not a job title — a property of the permissions themselves.

**Blast radius** — if this one account were taken over tomorrow, what share of the organisation
could the attacker reach? Measured, not estimated. Our worst account reaches **69.9%**.

**Finding** — one problem ATHAR has detected, attached to one identity, with the evidence behind
it.

---

## 3. What ATHAR does, in five steps

**① Ingest.** You export the access lists from each cloud. These are files the clouds already
produce — nothing is installed, and ATHAR never gets a key to your systems. Optionally you add an
HR feed so it knows who has left.

**② Normalise.** The three clouds' vocabularies get translated into the one shared vocabulary
above — seven verbs, four scopes, seven service categories. This is the part that makes the
question answerable at all, and it is where most of the engineering went.

**③ Detect.** Eleven checks run over the translated data (listed in §5). Every check is a fixed
rule. No AI, no machine learning, no probability — the same input always produces the same output.

**④ Score.** Each identity gets a 0–100 risk score, and the score shows its own arithmetic (§4).

**⑤ Prove.** Every scan is sealed cryptographically so it can be shown, later, to have not been
edited (§7).

---

## 4. The risk score, and why you can trust it

```
score = 100 × reach × exploitability × controls
```

Three plain ideas:

**Reach** — how much of the organisation this account can touch. Reaching a quarter of the estate
counts as maximum reach; past that it hardly matters how much worse it gets.

**Exploitability** — how easy it would be to abuse. Starts at 1.0 and goes up: the person has left
(+0.5), the account is unused (+0.3), no second password factor (+0.3), it's a contractor (+0.2),
it's an old unrotated key (+0.2), it has admin in more than one cloud (+0.2).

**Controls** — what reduces it. Registered emergency "break-glass" account with MFA (−0.35), a
contract with an end date already recorded (−0.20), a pre-approved privileged role (−0.15).

**Floors.** If a Critical check fired, the score cannot be below 75, whatever the arithmetic says.
A Critical problem must never present as a small number.

The important part: **every one of those terms is shown on screen as a line item**. Each line links
to the permissions it came from, and each permission shows the original untouched file it was read
out of. Nothing is a black box, and none of it is model-generated.

---

## 5. The eleven checks

| | Check | Severity | Plain meaning |
|---|---|---|---|
| R0 | Unmapped permission | Low | A permission we could not translate. Honesty flag, not a risk. |
| R1 | Wildcard / admin | High | "Can do anything" permissions. |
| R2 | Dormant access | Medium | Powerful access nobody has used. |
| R3 | Orphaned identity | **Critical** | The person left. The access didn't. |
| R4 | Cross-cloud superuser | **Critical** | Admin in all three clouds at once. |
| R5 | Toxic combination | High | Separately fine, together a route to full control. |
| R6 | Stale credential | Medium | A password or key far too old. |
| R7 | Peer outlier | Low | Far more access than colleagues doing the same job. |
| R8 | Data-residency drift | High | Data sitting outside its permitted country. |
| R9 | Privileged human without MFA | High | Powerful account, one password away. |
| R10 | Unowned principal | Medium | An account nobody is responsible for. |

R3, R4 and R9 are the three a security audience will care about most.

---

## 6. The numbers on screen

**507 identities, from 735 principals** — the join working.

**41 privileged (8% of the organisation)** — hold admin, grant or impersonate at project scope or
wider.

**87.9% MFA coverage — 4 people exposed.** Counted over privileged *humans* only. A machine
account cannot present a second factor, so including machines would dilute the one number an
auditor actually asks for.

**8 cross-cloud privileged** — powerful in two or more clouds simultaneously. The finding no single
cloud console can produce.

**52.1% risk concentration** — the worst 5% of accounts hold half of all the measured risk. This is
**good news**: it means fixing this is an afternoon, not a programme.

**Blast radius: 11.6% at the 90th percentile, 69.9% worst case.** Nine in ten accounts can reach
under 12% of the organisation. One can reach 70%.

**Offboarding half-life: Never.** How long before a departed person's access is actually removed.
"Never" means it does not converge — it effectively never happens. This is the line that reframes
everything: not twelve careless people, **one broken process**.

---

## 7. The cryptographic seal (the "blockchain" part)

Kept deliberately small, because overclaiming here is the fastest way to lose a security audience.

Every finding is hashed. The hashes are combined into a tree (a **Merkle tree**) that reduces to
one short fingerprint. That fingerprint is written to a blockchain, where it cannot be altered
afterwards.

**What that proves:** a specific finding existed at a specific time and has not been edited since.
Change one stored finding and the fingerprint no longer matches — the badge on screen turns red,
live, in the demo.

**What it does not prove:** that the finding is *correct*. It is tamper-evidence, not truth. We say
this on the page, in those words.

**Why it matters here:** an auditor or a regulator can verify the record **without trusting us**.
They recompute the fingerprint from the exported findings and compare. No access to our systems
required.

---

## 8. Where AI sits — and where it does not

ATHAR ships an **MCP** connection. MCP is a standard way for AI assistants to talk to a tool, so
Claude, ChatGPT or Gemini can all connect to the same server with no integration work.

An AI can: ask questions, explain a finding in plain English, draft a proposed fix.

An AI cannot: decide a severity, set a score, approve anything, or change anything.

Every decision is a fixed rule. Every change needs a human approval from a **second** account
(separation of duties). This is enforced by the API's own permissions, not by instructions in a
prompt — a prompt can be talked around; a role check cannot. In the demo a viewer account tries to
apply a fix and is refused with a **403**.

Turn the AI off entirely (`LLM_PROVIDER=none`) and everything still works — the explanations fall
back to fixed templates. **The demo never depends on a network call.**

---

## 9. Two kinds of testing, and why we separate them

This distinction is the most important thing in the whole presentation.

**Our own test environment.** We built a simulated organisation so we could check our own plumbing.
Because we generated it, we know the right answers in advance, so we can measure precision and
recall. Score: **100%**, margin of error **92.6–100%**, on **48** cases.

That number proves our pipeline does not lose or distort anything between the export file and the
finding. **It does not prove we would be right about a real organisation** — we wrote both the
question and the answer key. The Evaluation page says exactly that, in the product.

**Someone else's real data.** We then pointed the same unmodified system at a genuine AWS export —
a public test fixture from Cloudsplaining, a well-known Salesforce security tool. There is no
answer key, so we report no accuracy score at all. We report what it found:

- **283 findings** across **122** real accounts
- **100%** of the permissions understood — up from 31% on our first attempt
- **35 catches** from R7, a check that finds *nothing* in our own test data

That last one is the honest highlight. R7 was on our list of weaknesses. Real data turned it into a
working result — because real organisations are uneven, and ours was too tidy.

---

## 10. How it was built

**Backend:** Python 3.12, FastAPI, PostgreSQL, networkx (the access graph).
**Frontend:** React 18 + TypeScript.
**Seal:** Solidity 0.8.24, Foundry, web3.py.
**Everything:** Docker Compose. Clean machine to working dashboard in **2 minutes 27 seconds**.

**1,887 automated tests** on the backend, **172** on the frontend, plus contract fuzzing. All green.

The demo runs entirely offline.

---

## 11. What we are honest about

Stated on the pages themselves, not buried:

- Our accuracy score comes from data we generated. It proves plumbing, not real-world accuracy.
- The seal proves a finding wasn't edited — not that it was right.
- The signing key currently lives on one host. Production would use a hardware security module and
  a separate wallet per approver.
- Applying a fix is currently simulated. Production would open a change request for a human to
  approve.
- Permission coverage is 100% for AWS, roughly 85% for Azure and 80% for Google. Anything not
  covered is deliberately left visible as an R0 flag rather than quietly assumed safe.

Volunteering these is not a weakness in the pitch. For a security audience it is the pitch.
