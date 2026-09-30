# Topics 5.6 / 5.7 / 5.8 — shared build contract (Unit 5 tail, round 1)

Nine agents write nine NEW mode files in `extensions/school/ap-calc/visualizers/unit5/`.
The main agent writes the three shells (`concavity-explorer.js`, `second-derivative-test.js`,
`graph-sketch-studio.js`), registers 5.6/5.7/5.8 in `js/curriculum.js`, bumps `?v=` and runs
the live-browser probe. This file is binding, same role as `.qoder/specs/unit53-54/contract.md`
(read that one too — file shape, copy rules and the geometric traps are identical) and
`.qoder/specs/unit55/contract.md`.

Spec attachment (each agent reads the section for its own topic, lines in parentheses):
`C:\Users\moss\.qoder\tmp\C--Users-moss-Desktop-CHSchat\attachments\1ffa65df-e83e-42e0-b8bf-070116a68c5d\c5bb74f9-cd9c-49fb-aa69-e3356bbaacad.txt`

## Files and ownership

| agent | the ONLY file it may write | named export | tab `label` | spec lines |
|---|---|---|---|---|
| `u56-a-slope` | `concavity-slope.js` | `concavitySlopeMode` | `Slope trend and concavity` | 5.6 Main + Stage flow (30–406) |
| `u56-b-no-change` | `concavity-no-change.js` | `concavityNoChangeMode` | `When f″ = 0 is not enough` | 5.6 Mode 2 (408–484) |
| `u56-c-transfer` | `concavity-transfer.js` | `concavityTransferMode` | `Read concavity from the derivatives` | 5.6 Transfer (486–530) |
| `u57-a-classify` | `second-derivative-main.js` | `secondDerivativeMainMode` | `Classify a critical point` | 5.7 Main flow (611–866) |
| `u57-b-inconclusive` | `second-derivative-inconclusive.js` | `inconclusiveMode` | `When the test is inconclusive` | 5.7 Mode 2 + 5.7-vs-5.4 compare (868–1012) |
| `u57-c-global` | `second-derivative-global.js` | `globalMode` | `One critical point on an interval` | 5.7 Mode 3 (1015–1078) |
| `u58-a-build-f` | `sketch-function.js` | `buildFunctionMode` | `Build f from derivative clues` | 5.8 Mode 1 + vertical shift (1168–1400, 1286–1664) |
| `u58-b-sketch-fp` | `sketch-derivative.js` | `sketchDerivativeMode` | `Sketch f′ from f` | 5.8 Mode 2 (1401–1538) |
| `u58-c-challenge` | `sketch-transfer.js` | `sketchChallengeMode` | `Mixed sketch challenge` | 5.8 Mode 3 (1541–1603) |

Each file ends with BOTH:

```js
export const <name>Mode = { label, intro, params, controls, fns, compute, panes, steps, summary };
export default <name>Mode;      // the mode object itself, so dev/stepcheck.mjs can mount it
```

Do NOT create the shells. Do not import another lesson file; copy the shared arithmetic
(`dsp`, the sign-chart patterns) verbatim from the exemplars below.

Exemplars to READ (read-only, no conflict): `monotonicity-main.js` (sign chart, bands,
probe discipline), `first-derivative-main.js` (point-by-point classification, card exits),
`abs-candidates-challenge.js` (candidate-board / multiple-choice mechanics).

## Hard no-touch list

`js/calc-runtime.js`, `js/calc-components.js`, `js/curriculum.js`, `css/calc-workspace.css`,
`AP Calculus Visual Lab.html`, everything under `visualizers/unit1..unit4`, ALL existing
`visualizers/unit5/*.js` files, and `dev/` (scratch goes to /tmp only, and a scratch file
name there must contain your agent name). A second AI works in this repo; any harness FAIL
in a file that is not yours is ignored and never fixed. No git write commands. No `?v=` edits.
Import only `../../js/calc-math.js?v=20260925-calc-15` if you need `fmt`/`compileFn` (keep that
exact string).

## Verify-first rule

Before writing, check the current tree: if part of your assignment already exists, do not
duplicate it. All nine files above do not exist as of 2026-09-27 21:00; your mode file is new.

## Verified math (fixed, do not rederive differently)

`dsp` helper (same as 5.3–5.5): rounds to 2 dp, trims, ASCII `-` becomes real minus `−`.

**5.6** `f(x) = x³ + x`, `f′(x) = 3x² + 1 > 0` for all x (f always increasing),
`f″(x) = 6x`. Slope samples: `f′(−2) = 13`, `f′(−1) = 4`, `f′(0) = 1`, `f′(1) = 4`, `f′(2) = 13`.
Left of 0: concave down; right of 0: concave up; inflection point `(0, 0)` because concavity
changes; `f′(0) = 1` (NOT a horizontal tangent — inflection needs no flat tangent).
Mode 2: `f(x) = x⁴`, `f′(x) = 4x³`, `f″(x) = 12x² ≥ 0`, `f″(0) = 0` but concave up on BOTH
sides → x = 0 is NOT an inflection point.
Transfer p1: graph of `f′(x) = −(x − 2)² + 4` (down-opening parabola, vertex (2, 4));
f′ increasing on (−∞, 2), decreasing on (2, ∞) → f concave UP on (−∞, 2), concave DOWN on
(2, ∞), concavity changes at x = 2. Zeros of f′ (x = 0, 4) are NOT the point of the question.
Transfer p2: `f″` sign table `(-∞,-3) + / (-3,1) − / (1,∞) +` → concave up / down / up,
inflection at x = −3 and x = 1 (sign changes on both sides at each).

**5.7** `f(x) = x⁴ − 2x²`, `f′(x) = 4x(x² − 1)`, critical numbers −1, 0, 1;
`f″(x) = 12x² − 4`; `f″(−1) = 8 > 0` → local min (f(−1) = −1); `f″(0) = −4 < 0` → local max
(f(0) = 0); `f″(1) = 8 > 0` → local min (f(1) = −1).
Gate screen: `f″(2) > 0` but `f′(2) ≠ 0` → the test says NOTHING; the precondition is
`f′(c) = 0` first.
Inconclusive trio: `x⁴`, `−x⁴`, `x³` all have `f′(0) = 0` AND `f″(0) = 0` → test is
**inconclusive** for all three, yet actual outcomes are local min / local max / no extremum.
NEVER write "inconclusive" as "no extremum". Note line only (no 4th figure): if `f″(c)` does
not exist, the Second Derivative Test cannot classify either.
5.7-vs-5.4 compare: First Derivative Test reads f′ on BOTH sides of c and also works when
`f′(c)` does not exist; Second Derivative Test reads only `f″(c)` at c, needs `f′(c) = 0`, and
can come back inconclusive. Wording: "sometimes faster, but with stricter conditions" —
never "better/more advanced".
Global mode: `g(x) = x² + 2x + 5` on `[-4, 3]`, `g′(x) = 2x + 2` → only critical point x = −1
(interior), `g″ = 2 > 0` → local min, g(−1) = 4. g is continuous + exactly one critical point
in the interval + it is a local min → it is the ABSOLUTE minimum (value 4). One explicit line:
this says nothing about the absolute maximum — endpoints hold it (g(3) = 20 > g(−4) = 13, so
the absolute max is at x = 3; do NOT run the full candidates test, one sentence only).

**5.8** Mode 1: only `f′(x) = 3x² − 3` and `f″(x) = 6x` are given; `f(x) = x³ − 3x` is
revealed ONLY at the end as "one exact example". `f′ = 0` at x = −1, 1; sign of f′:
`+ / − / +`; f′′: negative on x < 0, positive on x > 0 → concave down left, up right,
inflection at x = 0; anchor `f(0) = 0`. From signs alone: x = −1 is local max, x = 1 is
local min. Vertical-shift screen: `x³ − 3x − 2`, `x³ − 3x`, `x³ − 3x + 2` share the SAME f′;
only the middle one passes (0, 0).
Mode 2: graph of f = `x³ − 3x` shown WITHOUT the formula. Horizontal tangents at x = −1, 1 →
f′ passes through (−1, 0), (1, 0); f rises for x < −1 and x > 1 → f′ above axis; f falls on
(−1, 1) → f′ below axis. Draggable probe samples: slope at x = 0 is −3 → point (0, −3) on the
derivative graph; at x = 2 slope is 9. Qualitative answer: "upward-opening curve crossing zero
at −1 and 1, below the axis between them" — do NOT demand the coefficient 3 unless the probe
numerically shows it. STOP there: no f″ correspondence (that is 5.9).
Mode 3 (no formulas anywhere, verbal/table only):
p1: increasing on (−∞, −2), decreasing on (−2, 1), increasing on (1, ∞); concave down on
(−∞, 0), concave up on (0, ∞); f(0) = 1 → x = −2 local max, x = 1 local min, x = 0 inflection
(f(−2) and f(1) are NOT determined by the clues — candidate sketches must not be judged on
their heights there; only the anchor (0, 1) is fixed).
p2 table: `(-4,-1) + −` / `(-1,2) − −` / `(2,5) + +` → rise concave down / fall concave down /
rise concave up; local MAX at x = −1 (+ → −), local MIN at x = 2 (− → +); x = −1 is NOT an
inflection (f″ is − on both sides), the inflection is at x = 2 (− → +).

## Red lines (from the spec, these are graded)

1. 5.6: never auto-mark `f″(c) = 0` as an inflection point. Wording: `f″(c) = 0 identifies a
   place worth checking. The change in concavity is the evidence.`
2. 5.7: `f″(c) = 0` → "Second Derivative Test is inconclusive", never "no extremum".
3. 5.7: `f′(c) = 0` must be established on-screen BEFORE any use of the sign of `f″(c)`.
4. 5.8: build the constraint skeleton first; the finished curve appears only as "one valid
   sketch" at the end. No first-screen answer graph to read backwards.
5. No freehand drawing. Constraint-based only: guides (vlines), interval arrows/bands,
   horizontal-tangent placeholders (segments + points), anchor point, then multiple-choice
   candidate panels rendered with existing kinds.
6. 5.6 must NOT preview the Second Derivative Test (that is 5.7); 5.8 mode 2 must NOT discuss
   f″ (that is 5.9). 5.8 mode 3 uses zero formulas.
7. Predict-before-reveal everywhere; the student can press Next without answering (never
   gate Next on a correct choice); when a sub-question is done its big panel exits — no
   stacking like early Unit 3.

## Renderer truth (binding — only fields that exist)

Legal pane kinds: `graph, numberline, table, equation/eq, readout, checklist, machine,
chain, tree, rectarea, compare, practice, note, playbar`. Inventing a field silently draws
nothing — the harness will NOT catch it; grep `js/calc-components.js` if unsure and report
any workaround.

- `pane.when` and every spec field read ONLY `env` (params/controls). Reveal is gated by
  `params.stage`, advanced by steps; the renderer cannot see "the student answered".
- graph: `curves / points (open: true = hole dot) / segments (arrow: 'end'|'start'|'both',
  width IGNORED) / vlines / hlines / vband / hband / areas / tangents / triangle / notes`.
  `vband`/`hband` are SOLID rectangles — always pass `color-mix(in srgb, #hex 9-12%, transparent)`,
  never a bare color token. Curves auto-lift the pen on NaN.
- graph px mapping has ZERO margin, numberline has 20px each side. To align graph with a
  numberline on window `[a,b]`, the graph x-window must be `[a−(b−a)/26, b+(b−a)/26]` (factor
  27/26 around the center). Do not write "same window = aligned".
- band/placeLabels: ONE short word each (`increasing`, `concave up` — keep bands short;
  pairs of sign+behavior go in an eq/readout pane instead). prio order: points/probes 0,
  notes 1, bands 2, vlines 4, hband 5. hlines labels sit at `py(y) − 5` and collide with x
  tick row if |y| < ~2 units from the axis — drop that label and let the point labels carry it.
  Leave non-tick slack at top/bottom window edges (a tick exactly on the edge is clipped).
- numberline: only `probes / bands / window`; a draggable probe gets NO label (bands win the
  row and drift into the tick line); report probe values in a readout pane.
- table: `hlRow` is NOT evaluated against env (static only); cell objects support
  `{v, color, bold}`; string cells get re-parsed by num() — to keep a real minus or a `′`,
  pass `v: () => '−4'` as a function.
- practice: no staged reveal of items; a verdict board after practice = a separate
  stage-gated eq/readout pane.
- eq: `t / rule / hl / color`, whole-line only; fractions stack via `MATH_OP` in runtime —
  `′ ² ³` work, `ⁿ` does not.
- Color semantics (unit 5 house): green `#2FB86A` = rising/increasing/concave up, red
  `#FF3B30` = falling/decreasing/concave down, `accent` = the concluded max / hero value,
  `aux` = concluded min. Sign of f′ vs sign of f″ may share up/down colors; a concavity
  conclusion word itself takes the same token.

## Copy rules (binding)

American English. No em-dash `—` and no `;` in student-visible text (use periods / commas /
new sentences). Choices = full answer sentence + reason sentence. Rounded values always write
`≈`. Terminology: `concave up`, `concave down`, `inflection point`, `local maximum`,
`local minimum`, `Second Derivative Test`, `critical point`, `absolute minimum` — do not
invent synonyms. Name only objects that exist on screen. `dev/copydump.mjs <filter>` must
show 0 hits for `;` and `—` in your file's strings.

## Validation (per agent, before reporting done)

1. `node --check <your file>`
2. `node dev/stepcheck.mjs unit5/<your file>.js` (default export = the mode object)
3. `node dev/copydump.mjs <your topic id filter>` — read every string, grep `;`, `—`,
   `undefined`
4. re-run 1–2 after the LAST edit
5. in your report: `stat -c '%s %y'` of your file (proof it landed), every spec requirement
   you changed wording on, every renderer workaround you used.

Write incrementally (skeleton first, then screens), not one giant final write. Expect
~10–16 minutes. The main agent owns: shells, curriculum registration, `?v=` bump
(currently `20260927-calc-57`), full harness run, live-browser `dev/probe.mjs` audit.
