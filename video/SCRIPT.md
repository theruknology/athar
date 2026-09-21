# ATHAR — demo narration

**1:51 · plays after slide 3 · GISEC, Dubai**

---

## Before you read the words

The words matter less than four habits. Get these and almost any script works.

**Talk to one person.** Not "the judges" — pick one face in the third row and explain it to him. The
whole room leans in when you're talking to someone instead of presenting at everyone.

**Say the number. Then shut up.** The screen is already showing it. Every second you keep talking
over your own evidence, you're competing with it. Jobs used to say a thing, then stand there. The
silence is what makes people believe you meant it.

**Short sentences. One idea each.** If you need a comma to hold a sentence together, it's two
sentences.

**Volunteer the weakness before they find it.** This is the whole game with a security audience.
They are *paid* to be suspicious. The moment you say "here's what this doesn't prove," you stop
being a vendor and start being a colleague. Nothing else you say will buy as much trust.

Pace: slower than feels right. Roughly 130 words a minute.
`[ ]` means stop talking and let the picture work.

---

## The narration

### Cold open · 0:00
> ATHAR.
> `[ ]`
> It's Arabic for *trace*.

---

### The estate · 0:03
> This is one government organisation. They run on three clouds — AWS, Azure, Google.
> Three different consoles. Three different vocabularies.
> Ask all three the same question — *who can do what?* — and you get three different answers.

### One list · 0:08
> ATHAR gives one answer.
> `[ ]`
> Five hundred and seven people and machines. Pulled out of seven hundred and thirty-five separate
> accounts across the three clouds, and matched up into one list.
> That matching is the hard part. That's the product.

### The real problem · 0:14
> And here's the first thing it found.
> Look at the bottom of every one of these departments. *Never.*
> `[ ]`
> That's how long it takes for someone's access to be removed after they stop needing it.
> Access gets granted. It doesn't get taken back.

---

### Posture · 0:21
> So we stopped counting alerts. Alerts don't tell you anything.
> We measure **power**. How much of this organisation can each account actually touch?

### Three clouds, one page · 0:27
> Every provider, side by side. And notice — the status here isn't something we typed in.
> It's worked out from the exports we were actually handed.
> If nobody sends us a cloud, this page says so. It doesn't show you a comforting row of zeros.

---

### The list · 0:33
> Everyone who holds access, ranked.

### Why it's ranked · 0:37
> Not by a label somebody chose. By how much of the organisation the account can genuinely reach.

### The one that matters · 0:41
> Full administrator. In all three clouds. At the same time.
> `[ ]`
> No single cloud console can show you that. You'd have to already know to go looking.

---

### Open it up · 0:45
> Click any account, and the score opens with it.

### Show your working · 0:49
> Every number shows its working. Each line here links to the exact permission underneath it.
> And each permission carries the original file it came from, untouched.
> `[ ]`
> No AI wrote any of this. It's arithmetic you can check.

### Since when · 0:55
> And it shows you exactly which permissions caused it, month by month.
> Not just *what*. **Why**, and **since when**.

---

### A year, replayed · 1:00
> We replay a full year. Watch it build.

### The reframe · 1:05
> This is the slide I'd want if I ran this organisation.
> It's not twelve careless people. It's **one broken process**.
> `[ ]`
> And a broken process is something you can actually fix.

---

### Real data · 1:09
> Now — everything you've seen so far is our own test environment. So let's be honest about that.
> Here's the same system, pointed at a real AWS account. One we didn't build.

### What it found · 1:13
> Two hundred and eighty-three findings. On data we did not write.

### The number I'm proud of · 1:18
*(Full-frame. Let it land before you speak.)*
> `[ ]`
> A hundred percent.
> That's how much of that real account we could actually read and understand.
> `[ ]`
> Our first attempt managed thirty-one percent. We rebuilt the whole permission dictionary from
> what the three cloud providers publish. Now nothing in that file is a mystery to us.

### Where it landed · 1:24
> And it landed on the genuinely dangerous accounts. The administrators. The ones that can promote
> themselves.

---

### The honest bit · 1:28
*(Slow right down. This is the part that wins the room.)*
> Our accuracy score is a hundred percent.
> `[ ]`
> You shouldn't just accept that. So we don't ask you to.
> The page prints the margin of error next to it — ninety-three to a hundred, on forty-eight cases.
> It tells you ten of our eleven checks were actually tested, and names the one that wasn't.
> `[ ]`
> And it says the quiet part out loud: we built the test data ourselves. So that score proves our
> plumbing works. It does not prove we'd be right about your organisation.
> We put that on the screen. In the product.

### What to judge us on · 1:38
> So here's what we'd rather be judged on.
> `[ ]`
> A hundred percent of a real account, understood.
> Two hundred and eighty-three findings, with no answer key to mark ourselves against.
> `[ ]`
> And thirty-five catches from a check that finds absolutely nothing in our own test data.
> That one used to be on our list of weaknesses. Real data turned it into a result.

---

### Proof · 1:45
> Every scan is sealed cryptographically. Change one finding after the fact and this turns red.
> `[ ]`
> So an auditor can verify us without trusting us. That's the point.

### AI, fenced · 1:49
> And any AI can ask ATHAR questions. Claude. ChatGPT. Gemini — same connection, no extra work.
> It can look. It can suggest.
> `[ ]`
> It cannot decide. And it cannot touch anything.

---

### Close · 1:55
> ATHAR. Every permission leaves a trace.
> `[ hold — let the screen sit ]`
> Give us the exports. We'll give you the record.

---

## Numbers — so you never fumble one

| | |
|---|---|
| Identities | **507**, from **735** accounts |
| Privileged | **41** — 8% of the organisation |
| MFA on those | **87.9%** — **4** people exposed |
| Admin in 2+ clouds | **8** |
| Risk concentration | **52%** sits in the top 5% of accounts |
| Real AWS account | **283** findings on **122** accounts |
| Understood | **100%**, up from **31%** |
| The rule that finds nothing in test | **35** real catches |
| Accuracy | **100%**, margin **92.6–100%**, on **48** cases |
| Checks actually tested | **10 of 11** |

---

## If you run long

Drop **0:41** (cross-cloud admin), **1:24** (where it landed) and **1:45** (the ledger) — all three
come back on slide 4 anyway.

Never drop **0:49**, **1:18**, **1:28** or **1:38**. Show-your-working, the coverage number, the
honest bit, and the real-data proof are the entire reason anyone should believe you.

## When they push back

**"A hundred percent looks made up."**
> It would be, on its own. That's why the margin of error and the sample size are printed next to
> it. And on real data we publish no accuracy score at all — there's nothing to score against.

**"You wrote your own test data."**
> We did, and we say so on the page. That score only proves our plumbing works. The real evidence
> is the other file — someone else's account, a hundred percent understood, and thirty-five catches
> from a check that finds nothing in our own data.

**"Why should I trust that risk score?"**
> Don't. Open any account. Every number links to the permission underneath it, and every permission
> shows the original file. Check one yourself.

**"Where does the AI make decisions?"**
> Nowhere. It explains and it suggests. Every decision is a fixed rule, and every action needs a
> human approval from a second account.

---

*Rebuild after any UI or data change — the film renders the dashboard's real components, so it
follows the product automatically:*
```bash
cd video && npm run render
```
