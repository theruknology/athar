# Pitch script — Solution Validation & Results

**Written against the uploaded deck (`ATHAR_GISEC_Hackathon_woVideoSS`), pages 4 and 5.**
Picks up the instant the demo video ends. **~2 min 35 s** for both slides.

---

## How to deliver these two

The video did the persuading. These two slides do a different job — they make you **credible**.
Different job, different energy. Slow down.

Four things carry it:

1. **Never read a list aloud.** Both slides are dense. The audience reads faster than you talk.
   Your job is to give them the *one sentence* that makes the list mean something, then be quiet
   while they read it.
2. **Attack table = four fast hits.** Short, punchy, past tense. This is the only place you speed
   up.
3. **Limitations, flat and unhurried.** No apology in your voice. You are not confessing; you are
   demonstrating that you know where the edges are. In a security room this buys more than any
   result on the slide.
4. **Callbacks to the demo.** They just watched it. "The real account you saw a minute ago" is
   worth more than repeating a number.

`[ ]` = stop talking. Actually stop. Count one.

---

# SLIDE 4 — SOLUTION VALIDATION

### Bridge from the video — 0:00

*(Let the final frame hold a beat. Then, quieter than you finished the demo.)*

> Everything you just watched runs. Right now. On this laptop, with no internet.
>
> `[ ]`
>
> But a demo only ever proves that something works when *we're* driving it.
> So the last thing we did before coming here was spend our time trying to break it ourselves.

### How we tested — 0:14

*(One gesture at the left column. Then hands down. Do not read the six items.)*

> Two thousand automated tests, across the backend, the interface, and the smart contract.
> Sixty-one deliberately broken files — wrong encoding, wrong cloud, permissions that don't exist.
> Two full rounds where we attacked our own design on paper before we wrote the code to defend it.
>
> `[ ]`
>
> And eleven decoys.
>
> Those are the interesting ones. Eleven accounts we planted to *look* dangerous but be completely
> legitimate — an emergency break-glass account, a contractor with a signed end date already on
> file.
> A naive tool flags all eleven, and burns a week of your analyst's life chasing them.
>
> We flagged none of them.

### The attacks — 0:42

*(Now point at the table. Pace up. Four quick hits — verdict first, detail second.)*

> Then we went after it properly.
>
> We edited a finding in the database after it had been sealed. **Caught.** Verification fails, the
> badge turns red — you saw that happen in the demo.
>
> We let the AI propose permissions that didn't exist anywhere in the source data. **Rejected.**
> Four violations, each one named.
>
> We fed it broken files. **Handled.** A structured error — not a stack trace, not a crash.
>
> And we ran the entire pipeline twice, end to end. **Identical.** Twelve scans already anchored,
> nothing duplicated, nothing double-counted.
>
> `[ ]`
>
> Two minutes and twenty-seven seconds, from a clean machine to the dashboard you just saw.
> That's the whole system. One command.

### Limitations — 1:12

*(Slow right down. Flat delivery. This is the most important block on the slide.)*

> And then there's this box.
>
> `[ ]`
>
> Four things this does **not** do, and we'd rather you heard them from us.
>
> The ledger proves a finding wasn't edited. It does **not** prove the finding was right.
> Tamper-evidence isn't truth, and we don't dress it up as truth.
>
> The signing key sits on one machine today. If you own that machine, you can rewrite history.
> We know. It's the first thing on our roadmap.
>
> Applying a fix is still simulated — we draft the change, a human approves it, but we don't yet
> push it into your cloud.
>
> `[ ]`
>
> And the honest one: **the visibility boundary.**
> We only see what's in the exports you hand us. If a cloud isn't exported, ATHAR doesn't guess and
> it doesn't assume it's clean — it says *no data*, on the page, in plain language.
>
> `[ ]`
>
> We put those four on the slide because you'd have found them anyway.
> And because a team that can't tell you where its own edges are hasn't looked hard enough.

---

# SLIDE 5 — RESULTS & CONCLUSION

### Open — 0:00

> So — results.

### The four numbers — 0:03

*(One number, one beat. The screen is doing half the work. Don't crowd it.)*

> Five hundred and seven identities. People and machines, across three clouds, resolved into one
> list.
>
> Ninety-nine open findings — that's today.
>
> `[ ]`
>
> But this is the number I'd want if this were my ministry.
>
> *(Point at 47 → 99.)*
>
> Forty-seven findings in month one. Ninety-nine by month twelve.
> Nobody did anything wrong. Nobody was careless. It just **accumulated**.
>
> And here's why —
>
> *(Point at 500 / 27.)*
>
> In a single department, over that year: five hundred permissions granted.
> Twenty-seven taken back.
>
> `[ ]`
>
> That's not a security problem. That's a **process** problem. And a process problem is something
> you can actually fix.

### Against the objectives — 0:45

*(Gesture at the table once. Then stop. Take them down it in four short lines.)*

> We set four objectives at the start, and we measured ourselves against each one.
>
> **One — one view across the clouds.** Every human and every service account from AWS, Azure and
> Google, mapped into a single model. You saw it: one page, one answer.
>
> **Two — intelligence you can act on.** Findings ranked by *measured blast radius* — how much of
> the organisation an account can genuinely reach — not by a label somebody picked.
>
> **Three — an audit trail that survives us.** Every scan and every decision sealed. Tamper with a
> finding and it's caught.
>
> **Four — robust and repeatable.** Broken inputs handled. Run it twice and you get the same
> answer, not two answers.

### What a team actually gets — 1:22

*(Turn to the right-hand box. Slow down — this is the "so what". Talk to one person.)*

> So if you run cloud security for a government entity, this is what's on your desk Monday morning.
>
> One view of who can do what — **and since when**. That second half is the part nobody else gives
> you.
>
> Root causes, not symptoms. In this organisation the root cause was one broken offboarding
> process — not twelve careless people.
>
> Fixes drafted for you, approved by a human, and never by the same person who proposed them.
>
> And evidence your auditor can re-verify themselves — without your permission, and without
> trusting us.

### Where it goes next — 1:48

*(Quick. Don't dwell — this is a roadmap, not an achievement.)*

> Three things next. The signing key into hardware. A separate wallet for every approver. And a
> permissioned chain the government controls, rather than ours.
>
> All three remove us from the trust equation entirely. That's the direction — **less** reliance on
> the vendor, not more.

### Close — 2:00

*(Stop moving. Drop your voice. Do not rush the last four lines.)*

> We've shown you a system that finds the problem, explains the number, and proves it wasn't edited.
>
> `[ ]`
>
> But the thing we're actually proud of is the box on the previous slide. The one listing what we
> can't do yet.
>
> `[ ]`
>
> Because any team can show you a dashboard.
> We'd rather show you a dashboard **and** tell you exactly where not to trust it.
>
> `[ ]`
>
> ATHAR. Every permission leaves a trace.
>
> `[ hold two full seconds ]`
>
> Thank you — we'd love your questions.

---

## If you get cut to ninety seconds

Skip the "how we tested" column and the objectives table entirely. Say these five things:

> We attacked our own system before we brought it here. We edited a sealed finding — caught. We
> let the AI invent permissions — rejected. We fed it broken files — handled cleanly.
>
> We planted eleven accounts designed to look dangerous but be legitimate. We flagged none of them.
>
> In one department, over one year: five hundred permissions granted, twenty-seven taken back.
> That's not carelessness. That's a broken process — and that's fixable.
>
> Four things we can't do yet are on that slide, including the fact that our signing key lives on
> one machine.
>
> **Any team can show you a dashboard. We'd rather show you one and tell you where not to trust it.**

---

## Numbers on these two slides

| Slide 4 | |
|---|---|
| Automated tests | **1,859** backend · **167** frontend · **21** contract |
| Robustness fixtures | **61** |
| Adversarial decoys | **11** planted, **11** correctly ignored |
| Adversarial review rounds | **2** |
| Cold start | **2 min 27 s** |
| Idempotency | **12×** "already anchored", zero duplicates |
| Named violations on rejected AI plan | **4** |

| Slide 5 | |
|---|---|
| Identities | **507** |
| Open findings | **99** |
| Drift | **47 → 99**, month 1 → 12 |
| Granted / revoked | **500 / 27** in one department |

---

## Three things to check before you go on

**The test counts.** The slide says 1,859 · 167 · 21. The repository currently runs **1,887**
backend tests — the number grew after this deck was exported. Either refresh the slide or say "just
over two thousand across all three suites", which is true of both. **Don't** say 1,859 if a judge
might run the suite.

**"Visibility Boundary" needs one sentence.** It's the only limitation on the slide that isn't
self-explanatory. Use the line in the script: *we only see what's in the exports you give us, and
if a cloud is missing we say so rather than assuming it's clean.*

**This deck doesn't carry the real-data results.** The 100% permission coverage, the 283 findings
on a real AWS account — those are in the demo video but not on these two slides. If a judge asks
"has this touched real data?", answer from the video:

> Yes — in the demo. We pointed the same unmodified system at a real AWS account we didn't build,
> understood a hundred percent of its permissions, and found two hundred and eighty-three problems
> with no answer key to grade ourselves against. Happy to pull that page up.
