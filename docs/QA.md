: Judges' questions — and how to answer them

GISEC · government track. Written to be read aloud almost verbatim.

**Three rules for every answer.**

1. **Answer first, explain second.** "Yes." / "No." / "It doesn't." Then the reason. Judges are
   time-boxed and they are testing whether you know, not whether you can talk.
2. **When the honest answer is a limitation, lead with it.** Every judge in this room has sat
   through vendors dodging. The moment you concede cleanly, the register changes and they start
   helping you.
3. **Never invent a number.** "I don't have that in front of me, but I can show you where it comes
   from" is a good answer. A made-up figure is the only unrecoverable mistake.

---

## A. The accuracy questions (expect these first)

### "You're claiming 100% accuracy. Nothing is 100%."
>
> You're right to push on that, and we agree — which is why the page never shows it on its own.
> Next to it we print the margin of error: 92.6 to 100 percent, on 48 cases. So the honest claim
> isn't "we're perfect", it's "we didn't miss anything in 48 tries, and here's how much that's
> worth."
>
> And more importantly — we wrote that test data ourselves. So that number proves our plumbing
> works end to end. It does not prove we'd be right about your organisation. We say that, in those
> words, in the product.

### "So the 100% is meaningless?"
>
> Not meaningless — just narrow. It proves that nothing gets lost or distorted between the raw
> export file and the finding on screen: not by the translator, not by the matching, not by the
> rules. That's a real engineering result and it's worth measuring.
>
> It's simply not an accuracy claim about the real world, and we don't present it as one.

### "Then what should we judge you on?"
>
> The real file. We pointed the same unmodified system at a genuine AWS export we didn't write — a
> public fixture from a well-known security tool. Three results:
>
> A hundred percent of the permissions understood, up from thirty-one on our first attempt.
> Two hundred and eighty-three findings, with no answer key to mark ourselves against.
> And thirty-five catches from a check that finds absolutely nothing in our own test data.
>
> That last one was on our list of weaknesses this morning. Real data turned it into a result.

### "Why did one of your rules find nothing in your own data?"
>
> Because we built our test organisation too evenly. That rule looks for someone holding far more
> access than colleagues doing the same job — and in our simulation, everyone had roughly the same
> spread, so nobody stood out.
>
> Real organisations are lumpy. On the real file that same rule fired thirty-five times. We left
> the rule alone rather than tuning it until a demo number appeared.

### "Isn't 92.6% a low floor?"
>
> It's the arithmetic of a small sample, not a weakness in the engine. Forty-eight cases can't
> support a tighter bound, and we'd rather show the real interval than a clean-looking number. More
> data narrows it; we'd rather widen the data than narrow the claim.

---

## B. The "is this real?" questions

### "Is this a live product or a prototype?"
>
> It's a working system, running now, not slideware. Clean machine to working dashboard in two
> minutes twenty-seven seconds, entirely offline. Eighteen hundred and eighty-seven automated
> tests on the backend, a hundred and seventy-two on the frontend, all passing.
>
> What it isn't yet: connected to a live production cloud account. Everything you've seen is real
> exports processed by real code.

### "Have you tested on actual enterprise data?"
>
> On a real AWS export, yes — a public fixture, deliberately built with over-privileged accounts,
> from Cloudsplaining, a Salesforce tool. Not a live customer estate.
>
> That was a deliberate choice: it's reproducible offline, it carries no risk of exposing anyone's
> real account, and it's independently checkable because the tool that publishes it documents
> what's wrong with it. A live pilot is the obvious next step.

### "What happens on an estate ten times this size?"
>
> The heavy work is the access graph, which is built once per scan and grows with the number of
> permissions, not with the square of it. We're processing about ten thousand permissions a month
> here in around a second.
>
> I'd want to measure before promising a number at a hundred thousand. What I can say is that
> nothing in the design needs rewriting to get there — it's a batch job, not an interactive query.

### "Could we run this on our own data tomorrow?"
>
> The ingest path is the same one you'd use: you export from each cloud with commands you already
> have, and upload the files. Nothing is installed in your environment and we never hold a key to
> your systems.
>
> The honest caveat is permission coverage — a hundred percent for AWS, around eighty-five for
> Azure, eighty for Google. Anything we can't translate is flagged on screen rather than quietly
> ignored, so you'd see exactly where the gaps were on day one.

---

## C. The AI questions (expect these in a government room)

### "Where does AI make decisions?"
>
> Nowhere. Every severity, every score, every recommended action is a fixed rule. Same input, same
> output, every time.
>
> The AI explains findings in plain language and drafts proposed fixes. It cannot set a score,
> cannot approve anything, and cannot change anything.

### "How do you stop the AI being manipulated into approving something?"
>
> By not giving it the ability to approve. It isn't a prompt instruction saying "please don't" —
> prompts can be talked around. It's the API's own permission system.
>
> In the demo we log in as a viewer, ask an AI to apply a fix, and the server refuses with a 403.
> The model never had that power to be tricked out of.

### "What if the AI hallucinates a permission that doesn't exist?"
>
> We tested exactly that. When the model proposed permissions that weren't in the source data, the
> system rejected the plan and named four specific violations. Proposals are checked against the
> real grants before a human ever sees them.

### "Does it work without internet or a foreign AI provider?"
>
> Yes. Set the AI provider to "none" and everything still runs — explanations fall back to fixed
> templates. The entire demo is offline. For a sovereign deployment you'd run a local model or none
> at all, and lose no functionality that matters.

### "Which AI providers?"
>
> Any that speak MCP — an open standard. We demonstrate Claude, ChatGPT and Gemini connecting to
> the same server with no integration work. That's deliberate: you're not locked to a vendor, and
> you can swap to a locally hosted model.

---

## D. The blockchain question (be brief and precise)

### "Why blockchain? Isn't that unnecessary?"
>
> It's a small part and we use it for exactly one thing: proving a finding hasn't been edited after
> the fact.
>
> Every finding is hashed, the hashes reduce to a single fingerprint, and that fingerprint goes
> somewhere it can't be quietly changed. An auditor recomputes it from the exported findings and
> compares. They verify us **without trusting us** — that's the whole reason it's there.

### "Does that prove your findings are correct?"
>
> No. It proves they weren't changed. Tamper-evidence, not truth. We state that on the page.

### "What stops someone with access to your server just rewriting history?"
>
> Nothing, today — the signing key sits on one host, and that's a real limitation we publish.
> Production would put the key in a hardware security module and give each approver their own
> wallet, so no single machine can rewrite the record.

### "Which chain?"
>
> A local chain for the demo. In production this would be a permissioned chain the government
> controls — there's no requirement for a public network, and no token involved anywhere.

---

## E. The technical-depth questions

### "How do you know two accounts in different clouds are the same person?"
>
> A chain of matching methods, strongest first: HR email, then directory identity, then username,
> then service-account project, then owner tags. Every identity records which method matched it and
> how confident that match is.
>
> When nothing matches, we do not guess. It stays unlinked and gets flagged as an unowned account —
> which is itself a finding worth having.

### "What's 'blast radius' actually measuring?"
>
> If this one account were taken over tomorrow, what share of the organisation could the attacker
> reach — following not just direct permissions but chains, where account A can become account B
> who can reach further.
>
> Our worst account reaches just under 70% of the estate. Nine in ten reach under 12%.

### "Why 'project scope or above' for privileged?"
>
> Because the three clouds bind permissions at different levels. AWS policies typically land at
> global scope, Azure at subscription, Google almost entirely at project.
>
> We originally required org-scope or wider — and that reported **zero** privileged accounts in
> Google Cloud, which was a modelling error that read like a clean bill of health. "Project scope or
> wider" means "broader than a single object" in every provider's own vocabulary.

### "Why only three verbs count as privileged?"
>
> Admin, grant and impersonate are the three that let you change *who is allowed to do what*, or
> become somebody else. Write and delete are power over data — the blast radius already prices
> those in.
>
> If we counted write as privileged, "privileged" would just mean "has a job", and the number would
> stop being useful.

---

## F. The uncomfortable ones

### "What's the weakest part of this project?"

*(Answer this one immediately and specifically. Hesitating costs more than the admission.)*
> That we grade ourselves on data we wrote. That's why the real-file result exists, and why we
> publish no accuracy score on it.
>
> Second weakest: we only cover Azure and Google to about eighty-five and eighty percent of their
> published permissions. AWS is complete. Everything uncovered is visible as a flag, not silently
> assumed safe.

### "What would you do with another month?"
>
> A live pilot on a real government account — that's the only thing that moves this from credible
> to proven.
>
> Then the signing key into hardware, per-approver wallets, and Azure and Google to full coverage
> the same way we got AWS there.

### "What does this do that Microsoft Defender or AWS IAM Analyzer doesn't?"
>
> Those are excellent, and each one sees its own cloud. Neither can tell you that one person is an
> administrator in all three simultaneously — because neither can see the other two.
>
> We found eight accounts like that. Every one of them is invisible to any single console, by
> construction.
>
> The second difference is the record: our findings are sealed so an auditor can verify them
> without trusting the tool that produced them.

### "How is this relevant to the UAE specifically?"
>
> Two ways. Data residency is one of our eleven checks — we flag data sitting outside its permitted
> region, which for a sovereign estate is a compliance question, not just a security one.
>
> And the verification model fits regulated government work: a regulator can check the record
> independently, without being given access to the system or having to trust the vendor.

### "Who actually uses this day to day?"
>
> Three roles, and the separation is enforced. A viewer reads. An analyst investigates and proposes
> fixes. An approver signs off — and never the same person who proposed it.
>
> The landing page is built for the head of the function: it opens on the organisational finding,
> not on five hundred rows.

---

## G. Demo-failure fallbacks

**The live demo won't load.** Play the recorded video. Say once: "We'll use the recording — it's
the same build." Don't debug on stage.

**A number on screen differs from a number you said.** Trust the screen, say so plainly: "Screen's
right, I misspoke." Then move on. Do not explain.

**They ask something you don't know.** "I don't want to guess at that. It's in the repository and
I'll show you straight after." That answer costs you nothing. A wrong one costs the room.

---

## The one thing to leave them with

If you only land a single sentence:

> **We can tell you who can do what across all three clouds, show you the working for every number,
> and prove afterwards that nobody edited the answer.**
