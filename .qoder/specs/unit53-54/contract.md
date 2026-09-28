# Topics 5.3 and 5.4 — shared build contract

Six agents write six NEW mode files in `extensions/school/ap-calc/visualizers/unit5/`.
The main agent writes the two shells, registers 5.3 and 5.4 in `js/curriculum.js`, bumps
the `?v=` strings and runs the live-browser audit. This file is binding, same role as
`.qoder/specs/unit55/contract.md` (read that one too for the board/table mechanics — the
candidate board of 5.5 is not rebuilt here, but the file shape and the copy rules are identical).

## Files and ownership

| agent | the ONLY file it may write | named export | `label` |
|---|---|---|---|
| `u53-a-sign-main` | `monotonicity-main.js` | `monotonicityMainMode` | `Read the sign of f′` |
| `u53-b-stationary` | `monotonicity-stationary.js` | `monotonicityStationaryMode` | `A zero without a behavior change` |
| `u53-c-transfer` | `monotonicity-transfer.js` | `monotonicityTransferMode` | `Practice from f′ only` |
| `u54-a-three-cps` | `first-derivative-main.js` | `firstDerivativeMainMode` | `Three critical points` |
| `u54-b-dne` | `first-derivative-dne.js` | `firstDerivativeDneMode` | `When f′ does not exist` |
| `u54-c-transfer` | `first-derivative-transfer.js` | `firstDerivativeTransferMode` | `Classify from f′ only` |

Each file ends with BOTH:

```js
export const <name>Mode = { label, intro, params, controls, fns, compute, panes, steps, summary };
export default <name>Mode;      // the mode object itself, so dev/stepcheck.mjs can mount it
```

The shells (`monotonicity-sign-chart.js`, `first-derivative-test.js`) are the main agent's files.
Do not create them. Do not import another lesson file; the shared arithmetic below is copied
verbatim on purpose.

## Hard no-touch list

`js/calc-runtime.js`, `js/calc-components.js`, `js/curriculum.js`, `css/calc-workspace.css`,
`AP Calculus Visual Lab.html`, everything under `visualizers/unit1..unit4`, the five existing
`visualizers/unit5/*.js` files (5.1, 5.2, and the 5.5 set), and `dev/` (scratch scripts go to
/tmp only). A second AI works in this repo; any harness FAIL in a file that is not yours is
ignored and never fixed. No git write commands. No `?v=` edits.

## Verified math (fixed, do not rederive differently)

```js
const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};
```

5.3 mode 1: `f(x) = x^3/3 − x`, `f′(x) = x² − 1 = (x + 1)(x − 1)`, zeros at −1 and 1,
x-window `[-3, 3]`. `f′(−2) = 3`, `f′(0) = −1`, `f′(2) = 3`. Signs: `+ / − / +`, so f rises on
(−∞,−1), falls on (−1,1), rises on (1,∞). `f(−1) = 2/3 ≈ 0.67`, `f(1) = −2/3 ≈ −0.67` — those
two numbers must NOT appear as classification labels in 5.3 (no max/min language, that is 5.4).
The misconception window is −2 < x < −1, where f′ is positive while falling.

5.3 mode 2: `f(x) = x³`, `f′(x) = 3x²`. `f′(−1) = 3`, `f′(0) = 0`, `f′(1) = 3`. Positive on both
sides of the zero.

5.3 mode 3: problem 1 shows the graph of `y = f′(x)` where `f′(x) = (x + 2)(x − 1) = x² + x − 2`,
zeros −2 and 1, `f′(−3) = 4`, `f′(0) = −2`, `f′(2) = 4`; f increases on `(−∞, −2) ∪ (1, ∞)` and
decreases on `(−2, 1)`. Problem 2 is the sign table `(-5,-1) + / (-1,3) − / (3,7) +`.

5.4 mode 1: the 5.2 and 5.5 curve, reused so the student meets it a third time:
`f(x) = x^5/5 + x^4/4 − (2/3)x^3`, `f′(x) = x²(x + 2)(x − 1)`, critical numbers −2, 0, 1,
interval signs `+ / − / − / +`, so x = −2 is a local maximum (positive to negative), x = 0 gets
no local extremum (negative to negative), x = 1 is a local minimum (negative to positive).
Values `f(−2) ≈ 2.93`, `f(0) = 0`, `f(1) ≈ −0.22` may be shown as heights, but 5.4 never calls
anything absolute; the 5.2 interval is `[-2.8, 1.8]` and you may keep that window.

5.4 mode 2: `g(x) = |x|`, `g′ = −1` left of 0 and `+1` right of 0, `g′(0)` does not exist, so
`− → +` gives a local minimum at the corner. Optional second case as a question only:
`h(x) = −|x|` gives `+ → −`, a local maximum.

5.4 mode 3: problem 1 is the sign table `(-∞,-2) + / (-2,0) − / (0,3) − / (3,∞) +` with critical
points −2, 0, 3 → local max, neither, local min. Problem 2 shows only the graph of
`y = f′(x) = (x + 2)x²(x − 2) = x⁴ − 4x²`, which crosses at −2 and 2 and touches zero at 0;
same verdict as problem 1. Its range: `f′(±2) = 0`, `f′(0) = 0`, minimum `−4` at `x = ±√2`,
`f′(±2.6) ≈ 4.9`, so a window like `[-3, 3, -6, 6]` is right.

## Renderer facts you must build against

- Off-by-one: on screen *i* the narration is `steps[i-1].message`, the question is
  `steps[i].predict`, and `env` merges `steps[0..i-1].params`. Put a reveal flag in the step
  that carries the Predict whose answer it reveals.
- Legal pane kinds: `graph`, `numberline`, `table`, `equation`/`eq`, `readout`, `checklist`,
  `machine`, `chain`, `tree`, `rectarea`, `compare`, `practice`, `note`. Never invent a field:
  an unknown field renders nothing and the harness will not complain.
- `numberline` accepts `window`, `step`, `bands:[{from,to,color,label}]`, `probes:[{x,label,color}]`.
  Band labels and probe labels are the text you must use — colour alone is not allowed to carry
  the meaning.
- `table` cells are `{v, color, bold}` and **`v` must be a function** when you want a formatted
  string (`v: () => '−1'`), otherwise the renderer re-parses it and the real minus sign `−`
  turns back into an ASCII hyphen. `hlRow` is read raw and cannot be stage-gated.
- Graph labels: `hlines[].label` is end-anchored at the right edge, so long text runs into the
  y-axis tick column. Point labels default to `labelDx: 8, labelDy: -8`; negative `labelDy`
  clips a label off the top edge for a high point, and the x-axis tick numbers sit on a row
  near the bottom, so a long label under a low point can run through them.
- **Alignment requirement (both specs demand it) — CORRECTED after u54-c caught my error:** the two
  renderers do NOT share a pixel map. `graph` uses `px = (x - x0)/(x1 - x0) * W` with **no inset**
  (calc-components.js:71), while `numberline` uses `px = 20 + (x - x0)/(x1 - x0) * (W - 40)`
  (:398). Same window + same `width` therefore lines up only at the centre and drifts up to 20px
  at both ends. To make them agree everywhere, keep the teaching window on the `numberline` and
  inflate the graph's x-window by 27/26 around its centre: for a numberline window `[a, b]` give
  the graph `[a − (b−a)/26, a + 27(b−a)/26]` (so `[−3, 3]` on the numberline ⇒ `±3.2308` on the
  graph). Use `width: 560` on the numberline. If you cannot line them up, say so in your report
  rather than inventing a field.
- Also corrected: my note said `f′(±2.6) ≈ 4.9` for `(x+2)x²(x−2)`. Wrong, it is `18.66` (the curve
  passes `y = 6` at `|x| ≈ 2.28`). Recompute any number from this contract yourself.
- Colour vocabulary, one meaning per token across the whole unit:
  sign/direction uses `up` (positive f′, f increasing) and `down` (negative f′, f decreasing);
  a named conclusion uses `accent` for a local maximum, `aux` (orange) for a local minimum and
  `auxInk` for neither — that matches what 5.5 already does with max/min. Zero markers and
  boundary probes use `accent`.
- `compare` `tone: 'right'/'wrong'` is allowed only on a genuine grading card (the misconception
  cards in both specs are exactly that), never to mean positive/negative.

## Copy rules (identical to the 5.5 round)

English, American spelling. No em-dash `—` and no standalone `;` in student-visible strings.
No ALL-CAPS emphasis (the specs' `LOCAL MAXIMUM` scaffolding becomes `a local maximum` in
prose). Choices are a full answer sentence plus its reason sentence. Anything a sentence names
must be on screen with that name, so refer to panes by the `title` you actually set.
**Nothing before a Predict may state its answer** — not a step message, an eq line, a readout
value, a graph label, a table cell, or the choice text itself. Manual Next without answering
must always work: gate every reveal on a monotone `params.stage`, never on an answer.

Boundary rules the specs set, do not cross: 5.3 never says maximum/minimum for −1 or 1 and never
uses concavity words; 5.4 never uses absolute-extremum language and never mentions f″, the
Second Derivative Test or endpoint candidates; 5.3 mode 3 and 5.4 mode 3 contain NO graph of f.

## Verification before you report

1. Recompute every number you print with `node -e`.
2. `cp <file> /tmp/check.mjs && node --check /tmp/check.mjs`.
3. `node dev/stepcheck.mjs unit5/<file>.js` from `extensions/school/ap-calc/` and read the
   per-screen dump: confirm each reveal lands on the screen AFTER its question.
4. `node dev/harness.mjs` last; ignore FAILs outside your file.
5. Write the skeleton first and fill it in, so the mtime moves within ~10 minutes.

Report: `stat -c '%y %s %n'` of your file, the question list with the stage each reveal lands
on, the pane kinds and fields used, and every spec item you could not express.
