# <Repo name>

<One line under 120 characters, on its own, no leading "> ".>

<Then, if the repository holds more than one kind of thing, say which is
which immediately. A reader who does not know whether they are about to
copy a folder or run an install command cannot use anything below.>

## Install <the installable kind>

<The common path, complete, in a code block. First, because a reader
arriving from a link wants to use the thing before understanding it.>

## Use <the other kind>

<If the repository holds two kinds of artifact, they get two sections. One
"Install" section covering both is where skill and plugin get conflated.>

<details>
<summary>Less common paths</summary>

<Local checkout, uploading elsewhere, development setup. Folded away so the
common path stays one screen.>

</details>

## What's here

<!-- catalog:start -->
<!-- catalog:end -->

<Generated. Never hand-written: a catalogue restates what the manifests
already say, so a typed one drifts the first time something is added and
nothing notices. `scripts/catalog.py --check` fails the build when the
block and the manifests disagree.>

## How this is laid out

<Explanation, and deliberately after the reference. Directory shapes, the
distinction between artifact types, any convention a contributor must
follow. A reader who only wanted to install something has already left.>

## Working on this repository

<The commands that gate a change, each with what it checks. Then the rule
that decides what ships. Then a pointer to CONTEXT.md for vocabulary.>

## License

<Full name or SPDX identifier, and a link. Last section, always.>

---

**Why this order.** Documentation serves four separate needs (learning a
thing, doing a task, looking something up, and understanding why), and
mixing them in one document degrades all four. Install is a task, the
catalogue is reference, and layout is explanation. Interleaving them is
what makes a README feel long when the real problem is that it is four
documents braided together.

The section order and the checkable rules below come from the Standard
Readme spec:

- title matches the directory or package name
- short description is one line, under 120 characters, no `> ` prefix
- no broken links
- sections keep a fixed order; optional ones may be omitted, not reordered
- License is last
