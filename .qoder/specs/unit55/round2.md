# Topic 5.5 round 2 — reviewer audit, binding fix contract

The reviewer re-read the four shipped 5.5 files and produced an audit. Its priority table is
approved work. Four agents each own ONE file. The main agent keeps the shell, the curriculum
registration, the `?v=` bump, the 5.2 copy fix, and the live-browser audit.

Read first: `C:\Users\moss\.qoder\tmp\C--Users-moss-Desktop-CHSchat\attachments\709125da-e6c7-4fc2-bcdc-5e522d66d3e0\19f8c210-425b-451b-a33c-2ddbf5d059fb.txt`
(the audit) and `C:\Users\moss\Desktop\CHSchat\.qoder\specs\unit55\contract.md` (round-1
contract: file shape, runtime off-by-one, legal renderers and their field limits, copy rules,
verification commands). Both stay in force. Nothing here reopens a design question: each item
below states the target.

## Ownership

| agent | the ONLY file it may write |
|---|---|
| `u55-r2-main` | `visualizers/unit5/abs-candidates-main.js` |
| `u55-r2-dne` | `visualizers/unit5/abs-candidates-dne.js` |
| `u55-r2-transfer` | `visualizers/unit5/abs-candidates-transfer.js` |
| `u55-r2-challenge` | `visualizers/unit5/abs-candidates-challenge.js` (NEW) |

Do not touch the shell, `js/curriculum.js`, `js/calc-runtime.js`, `js/calc-components.js`,
`css/`, the HTML, `visualizers/unit5/extrema-critical-points.js`, `mvt-secant-finder.js`, the
five `monotonicity-*` / `first-derivative-*` files that six other agents are writing right now,
or `dev/`. No git write commands, no `?v=` edits. A harness FAIL in a file that is not yours is
the other writer's: ignore it, never fix it.

## Fixed values (recompute with node before use, do not trust my rounding)

`f(x) = x^5/5 + x^4/4 − (2/3)x^3`, `f′(x) = x²(x + 2)(x − 1)`, interval `[−2.8, 1.8]`:
`f(−2.8) = −4.419669…`, `f(−2) = 44/15 = 2.933333…`, `f(0) = 0` exactly,
`f(1) = −13/60 = −0.216666…`, `f(1.8) = 2.515536…`.
Greatest candidate value `2.933` at `x = −2`; least `−4.420` at the left endpoint `x = −2.8`.

`g(x) = |x| + 0.2x` on `[−2, 1]`: `g(−2) = 1.6`, `g(0) = 0`, `g(1) = 1.2`, `g′ = −0.8` left of 0
and `1.2` right of 0, `g′(0)` does not exist. Absolute maximum `1.6` at the left endpoint,
absolute minimum `0` at the corner.

New challenge case, `h(x) = x³ − 3x` on `[−2, 3]`: `h′(x) = 3x² − 3`, interior critical numbers
`x = −1` and `x = 1`, candidate list `−2, −1, 1, 3`, values `h(−2) = −2`, `h(−1) = 2`,
`h(1) = −2`, `h(3) = 18`. So the absolute maximum value is `18` at the endpoint `x = 3`, and the
absolute minimum value `−2` is attained TWICE, at `x = −2` and at `x = 1`. These are exact
integers, so this file needs no approximate notation.

## Notation rule (audit: "rounded values are written as exact values")

Add one helper to each file you touch and use it for every displayed function value:

```js
const dsp3 = (v) => {                       // three decimals, trailing zeros trimmed
    let s = (Math.round(v * 1000) / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};
const near = (v) => (Number.isInteger(v) ? '≈ ' + dsp3(v) : '≈ ' + dsp3(v));
```

Anything that comes from a rounded computation is written `≈ 2.933`, never `= 2.93`. The
candidate board column header becomes `f(x), approx.` (or `g(x), approx.`). Exact values may be
named exactly where the fraction is simple: `f(−2) = 44/15 ≈ 2.933` and `f(1) = −13/60 ≈ −0.217`,
and `f(0) = 0` keeps the plain equals sign. In prose and in the answer-writing card, keep the
value and the location paired: `f(−2) ≈ 2.933`, not a bare list of numbers.

## Language rule (audit: gamified and internal wording)

Replace `winner` / `wins` / `the winner here is an endpoint` with teacher language:
`the candidate with the greatest function value`, `the candidate with the least function value`,
`this value is taken at an endpoint`. Keep at most one informal use in the whole file.
Remove every mention of `rail`, and every `the question in the rail` → `the question beside the
board` or simply `Answer the question before the board labels the result.` Do not name internal
layout words (`rail`, `pane`, `card` unless the pane title says it).

## Screen-level changes the audit requires

**Main (`abs-candidates-main.js`).**
1. Predict 1 must make the student BUILD this problem's list, not recite the rule. Question:
   "For f′(x) = x²(x + 2)(x − 1) on [−2.8, 1.8], which is the complete candidate list?" with the
   three sets as choices: `{−2.8, −2, 0, 1, 1.8}` correct, `{−2, 0, 1}` (drops both endpoints),
   `{−2.8, −2, 1, 1.8}` (drops x = 0 because it is not a local extremum). Each `whyBy` names
   which kind of candidate the wrong list loses. Only after this does the board appear.
2. Keep the "the test compares function values, not slopes" Predict.
3. Add a Predict for the MINIMUM, symmetrical with the maximum one. The endpoint lesson becomes a
   follow-up line after that reveal: "Notice that this candidate is an endpoint. Endpoints stay in
   the comparison even though they are not interior critical points." Do not ask the old yes/no
   endpoint question instead of the minimum question.
4. The graph stays secondary and must not hand the answer over: until the maximum Predict has been
   answered-to-the-reveal-screen, show only the interval band, the curve and the two endpoints,
   with no candidate dots and no classification. Put the candidate dots in when the values appear,
   without colour or labels, and give the winner callouts (dot emphasis, horizontal line, readout)
   only on the screens that follow each comparison Predict. Fade the curve (`color: 'auxInk'` or a
   `color-mix` stroke) while it carries no information yet.
5. Panels must retire instead of accumulating. Keep only the four-step procedure card persistent
   from its reveal onward; the other teaching cards each appear on their own screen and disappear
   on the next one, exactly as the audit's stage map says: procedure + candidate-does-not-mean-
   extremum, then procedure + how to write the answer, then procedure + EVT against the Candidates
   Test, then procedure + the Unit 5 chain. Use windowed `when` gates (`stage >= 6 && stage < 7`)
   rather than open-ended `stage >= n`.
6. Tighten the continuity warning: with EVT unavailable, comparing candidate values alone does not
   guarantee that one of them is an absolute maximum or minimum, because a discontinuous function
   can approach a higher value without ever taking it. Additional information about the function
   is needed.
7. `How to write the answer` pairs every candidate with its value on its own line and then states
   the greatest and the least with both value and location.

**DNE (`abs-candidates-dne.js`).**
1. Add the missing minimum Predict, so the maximum and the minimum are both the student's work.
2. Replace the reason for the missing tangent: the left-hand slope is −0.8 and the right-hand slope
   is 1.2, they are different, so there is no single derivative at x = 0, and the graph draws no
   tangent there. Delete the sentence "one point cannot carry two tangent lines".
3. The maximum Predict's weak distractor (the corner being the top of a V) must be replaced by a
   real misconception, for example: "x = 0, because a point where the derivative fails to exist is
   automatically an extremum" or "x = 1, because it is the largest x-value among the candidates".
   Keep both explanations diagnostic.
4. Same notation and language rules as main, and the same no-spoilers graph discipline: the V graph
   shows no classification before its reveal.

**Transfer (`abs-candidates-transfer.js`).**
The ladder in this mode is now four rungs, and the user settled it: Problems 1 and 2 keep their
present purpose and structure, and Problem 3 is ADDED at the end. Do not replace or reshape
Problem 1 — a graph-free, completed-candidate-table comparison is its own required skill from the
original 5.5 spec, and adding an `f′(x)` column to it would wreck that clean skill check.

| item | what the student is handed | what the student does |
|---|---|---|
| Problem 1 | finished candidate board | compare the values, and keep value apart from location |
| Problem 2 | finished candidate board | one extreme value taken at more than one x |
| Problem 3 (NEW) | raw `x / f(x) / f′(x)` table | select the candidate rows first, then compare |
| Final Challenge | `h(x) = x³ − 3x` on `[−2, 3]` in its own tab | run all four steps from scratch |

Problem 3 content, exactly:

| x | f(x) | f′(x) |
|---|---:|---:|
| −3 | 4 | endpoint |
| −1 | 9 | 0 |
| 0 | 3 | 2 |
| 2 | −2 | DNE |
| 5 | 6 | endpoint |

State plainly that the table has more rows than the Candidates Test needs, and that the student
must decide which rows belong before any comparison. The candidate rows are `x = −3`, `−1`, `2`,
`5` (two endpoints, one place where `f′ = 0`, one critical point where `f′` does not exist), and
`x = 0` is excluded because `f′(0) = 2` makes it neither an endpoint nor a critical point. Only
after that identification do the values get compared: `4, 9, −2, 6`, so the absolute maximum value
is `9` at `x = −1` and the absolute minimum value is `−2` at `x = 2`. The row for `x = 0` must
never enter that comparison, and one `whyBy` should say so in those words. Sequence the reveals so
the selection question is answered on its own screen, then the comparison question, then the
result panel. Use the `practice` renderer for both questions and `table` for the raw data, with a
stage-gated column or row emphasis rather than a rebuilt table.

Also apply to this whole file: the `≈` notation rule for any rounded value (every number here is
an exact integer, so the equals sign stays correct and nothing in Problems 1 and 2 needs `≈`), and
cut the `winner` vocabulary.


**Challenge (NEW `abs-candidates-challenge.js`).**
`export const challengeMode` and `export default challengeMode`, `label: 'Full procedure challenge'`.
One fresh problem, `h(x) = x³ − 3x` on `[−2, 3]`, where the student performs all four steps without
the board being filled in for them. Three Predicts, in this order, each revealing on the next
screen: (1) which is the complete candidate list, (2) which table holds the correct function values
(the wrong options evaluate at the wrong x or forget an endpoint), (3) state the absolute maximum
and absolute minimum with value and location. The last screen shows that the minimum value −2 is
taken at both x = −2 and x = 1, teaching the multiple-attainment case, and that the maximum value
18 belongs to the endpoint x = 3. The persistent four-step procedure card must be present, and the
graph of h stays secondary confirmation revealed only after the comparison. `summary` should be
this mode's own Idea/Mistake/Transfer, pointing back to the board in tab 1.

## Verification

Per-file, as in round 1: `node -e` for every number, `node --check` on a /tmp `.mjs` copy,
`node dev/stepcheck.mjs unit5/<file>.js` read screen by screen, and confirm each reveal lands on
the screen AFTER its question. Then `node dev/harness.mjs` once, ignoring other writers' FAILs.
Report: `stat -c '%y %s %n'`, the Predict list with the reveal screen, every `≈` site, the
`when` windows you used for panel retirement, and anything the renderers cannot express.
