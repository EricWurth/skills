# Output templates

Two documents. The brief is written for someone who may be new to AI: one
page tells the whole story; the reference material sits behind it. Their
own words wherever a quote will do.

## Format: HTML by default

The brief ships as a single self-contained HTML page built from
`brief-template.html` -- fill the `{{...}}` slots, repeat the step block
three times, drop the reference sections behind the dashed break. No
external assets; it opens from a file, an artifact, or an email
attachment. Where the surface can render it (Claude Code file, claude.ai
artifact, Cowork), render it; also keep the markdown version below when
the person wants plain text or the surface can't show HTML.

## Writing rules for the brief

- **Open with a pitch, not a summary.** Three beats, four to six
  sentences total: (1) the pain -- characterise it in natural language
  from what they said, don't restate the task list; (2) the shift -- what
  changes for them if this works, and what it makes room for; something
  they'd want to be true; (3) the solution -- plain, short, one bolded
  idea to remember. You are selling them on trying it. If the pitch would
  work for anyone in their role, it isn't theirs; rewrite it.
- **No overclaims.** "Runs itself", "handles it for you", "saves hours"
  are out. Say what actually goes away: the typing, the re-keying, the
  hunting. A reader new to AI trusts the doc less for every promise it
  makes.
- **"Before you start" is always there**, three lines, right under the
  pitch: it can be confidently wrong, read everything before you use it;
  only share what you'd be comfortable having remembered forever (plus
  one tailored clause saying what that means here); what rule to check
  first (tailored -- moving files, outside tools).
  Then one sentence naming the tools: which AI is which.
- **Ideas, not orders.** The heading is collaborative -- "Some initial
  ideas -- worth discussing?" -- with a lede that says none of it is
  decided and asks which fit. The person is choosing, not being told.
- **Every idea has a "watch out for"** -- the one way it goes wrong and
  the check. A page with no downsides reads as advertising.
- **Say the mechanics.** Where they type, how the result gets into the
  file they actually use (copy, paste, save), where an instruction is
  saved. Small gaps here are the difference between tonight and never.
- **Unverified means say so.** If an idea depends on a capability or
  permission you haven't confirmed (what their work AI can see, whether
  it saves instructions), the card says so, gives the two-minute check,
  and names the fallback. Never recommend on an assumption you've marked
  unknown elsewhere.
- **"To keep going" closes page one** -- how they reply, what to say
  (which fit, which don't), and where the conversation lives.
- **Page one is the brief.** If they read nothing else, they know what
  the idea is, what to do first, and what they keep. Everything after
  page one is reference.
- **Plain words.** No "information model", "source of truth",
  "design-time", "prompt card", "pipeline". Say what the thing does:
  "one place the facts live", "instructions you save and reuse", "a
  short list of what's current". If a term is unavoidable, translate it
  in the same sentence, once.
- **Outcomes get a gloss every time they appear:** *AI helps, you
  decide* (Assist) · *fix the process first* (Redesign) · *AI does it,
  you check* (Automate) · *keep doing it yourself* (Leave alone).
- **Every option starts in 30 minutes** with what is on the desk. If it
  can't, it isn't an option yet; it's part of the idea.
- **Show, once.** One worked example -- what they would actually type,
  and roughly what comes back -- for the first option only. Concrete
  beats another paragraph.
- **Three options on page one, five at most overall.**
- **Length:** page one holds the pitch, before-you-start, three cards,
  try it now, keep doing yourself, makes room for, to keep going -- and
  nothing else. It is short, not literally one printed page. Reference
  folds below. A long inventory lives in a separate file.
- **Name only tools they named.** Otherwise "whatever you write documents
  in", or mark the guess.
- **A stated time budget is a design constraint.** Fewer questions,
  say-back and inventory in one turn, ratings inside the brief.

## 1. Opportunity Brief

```
# Where AI fits -- <name or role>, <date>

<The pitch. Three short paragraphs, no heading:
 1. The pain, characterised in natural language from what they said.
 2. The shift -- what changes for them, what it makes room for.
 3. The solution in two or three plain sentences, one idea in bold.
 Written so they could repeat it to a colleague and want to.>

## Before you start
- It can be confidently wrong -- read everything before you use it.
- Only share what you'd be comfortable having remembered forever.
  <one tailored clause: what that means here>
- Check the rules first: <tailored>
<One sentence naming which AI is which.>

## Some initial ideas -- worth discussing?
<Lede: none of this is decided; tell me which sound useful and which
don't fit. Then three, in order:>

**1. <Plain name>** -- *<outcome gloss>*
What it does: <one sentence>
You still own: <the decision or judgment that stays theirs>
First 30 minutes: <exactly what to do, with what they have -- including
where they type and how the result gets into their file>
Watch out for: <the one way it goes wrong, and the check>
How you'll know it worked: <one observable sign>
<If it depends on something unverified: say so, the two-minute check,
the fallback.>

**2. ...**

**3. ...**

## Try it now
<One example for idea 1: the words they'd type, roughly what comes back,
how to get it into their file, what to check before trusting it, and one
line for "if it can't do that" when the example leans on a capability you
haven't verified. Uses their real document names.>

## Keep doing yourself
<Two to four bullets. The things that are the job. One reason each.>

## What this makes room for
<One or two lines, from the inverse. Their words.>

## To keep going
<How to reply, what to say, where the conversation lives.>

------------------------------------------------------------ page break

## Reference

### More ideas for later
<Options 4 and 5, same format as above, shorter.>

### Worth raising with your team
<Only if present. A pattern that isn't theirs to fix alone. Suggest the
conversation, not a tool.>

### Everything I looked at
<Table: what you do · how often · what I'd suggest (outcome gloss) · why,
one line. Every inventory item appears. This is where the classification
lives; the person doesn't have to read it to act.>

### What you told me
<Their words, the quotes the options trace back to. Last, because they
already know it -- it's here so the reasoning is checkable, not to be
read first.>

### Words I used
<Only if any term slipped through. Term -> plain meaning.>
```

## 2. Work Inventory

Reference document, kept separately when long. Same content as before;
formatted for scanning.

```
# Work Inventory -- <name or role>, <date>

## Context
<One paragraph: role, what the work supports, what a good day looks like.
Their phrasing.>

## Tools you already have
<Names only.>

## Limits
<Data that can't be shared, systems that can't be connected, approvals
needed. "None stated" if none.>

## What you do
<Table or short blocks: item · how often / how long · starts when · tools
· what goes in -> what comes out · mostly thinking or mostly steps · where
the real decision is · what hurts (their words) · what you'd rather be
doing.>

## What you'd rather be doing
<Required. Their words. Mark "assumed" if you inferred it.>

## Friction that didn't fit one item
<Waiting, redoing, hunting, autopilot.>
```

Rules for both:

- No product or vendor names.
- No framework names or coined terms.
- Nothing appears that the person did not say or show; anything inferred
  is marked "assumed".
