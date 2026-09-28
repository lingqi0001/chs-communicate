# Unit 5 round 3 — shared contract (reviewer audit = spec + approval)

Repo: `extensions/school/ap-calc/`. You edit **only the file(s) named in your brief**.

## What a lesson file is

Pure data. A mode object: `{ label, intro, params, controls, fns, compute, panes: { main, side, afterRail }, steps: [...], summary }`.
Modes are mounted by a shell file with `Object.assign({}, mode, { meta })`, so **each mode carries its own `summary`**.

**Off-by-one timing (the #1 source of bugs here).** On screen *i*:
- narration shown = `steps[i-1].message`
- question shown = `steps[i].predict`
- `env` = merge of `steps[0..i-1].params`

So a reveal flag must be set in the step whose *next* screen should show it. `env.stage` comes from `params.stage` of already-passed steps; `compute(env)` derives booleans from it.

## Invariants you must not break

1. **No answer may be visible before its own Predict question** — including inside option text, card titles, notes, board cells, colours that encode the verdict.
2. **Next must work without answering.** Reveal gating is monotone `params.stage` only; never gate on an answer.
3. **Retiring a pane is allowed; deleting its content is not.** The reviewer asked for progressive disclosure: give a pane an upper stage bound so it leaves when its lesson is over. Keep one persistent anchor pane per mode where the brief says so.
4. `pane.when` and every spec field read **only `env`**. There is no other reveal mechanism.

## Renderer field limits (verified against `js/calc-components.js` — do not invent fields, invented fields fail silently)

Legal pane kinds: `graph, numberline, table, equation/eq, readout, checklist, machine, chain, tree, rectarea, compare, practice, note, predictionBox, playbar, particleTrail`.

- `graph`: `window:[x0,x1,y0,y1]`, `width` (default 560), `height`, `gridX/gridY`, `curves[{fn,from,to,samples,color,label,labelAt}]`, `points[{x,y|r,fn,color,r,open,label,labelDx,labelDy,drag}]`, `vlines[{x,color,label}]`, `hlines[{y,color,label}]`, `vband/hband`, `areas`, `tangents`, `notes[{x,y,t,color}]`, `ticks:false`.
- `numberline`: only `window:[x0,x1]`, `width`, `step`, `bands[{from,to,color,label}]` (**one short label string each**), `probes[{x,color,label}]`.
- `table`: cell = plain value or `{v, color, bold}`; **`v` must be a function** (`v: () => '−4.42'`) or the renderer re-parses strings and the real minus sign is lost. `hlRow` is read raw (not env-resolved).
- `checklist`: item `{t, state}`; `state` true/'pass' → ✓, 'na' → —, else ✗. It is a **three-state row list only** — no sub-line, no "therefore" row. If a conclusion must not read as a condition, move it out of the checklist into a separate pane.
- `practice`: items `{q, choices, a, whyBy}`; no per-item reveal gating.
- `vband`/`hband` take raw fill strings → use `color-mix(in srgb, #2FB86A 9%, transparent)` style, never a bare token. `numberline` bands are thick stroked axis segments → bare tokens (`'up'`, `'down'`, `'accent'`) are correct there.

## Geometry rules (all measured in a real browser this session)

- `graph` maps x with **zero inset**: `px=(x−x0)/(x1−x0)*W`. `numberline` insets 20px each side: `px=20+(x−x0)/(x1−x0)*(W−40)`. For two stacked panes to share one pixel map: `nlWindow = [g0 + span/28, g1 − span/28]`.
- A window edge that lands exactly on a tick value clips that tick label outside the viewBox. Leave non-tick margin.
- The top y-tick label lands in the `vlines` label row (y=14) → keep ≥1 tick-gap of headroom above the highest y tick.
- `hlines[].label` is right-anchored at `W−8` on row `py(y)−5`; the x-axis tick row is `py(0)+14`. A horizontal line closer than ~2 units to the axis collides with the tick numbers → drop that hline label and label the points instead.
- `placeLabels` estimates width as `len*fs*0.64` (overestimates ~40%) and places by priority: points/probes 0, notes 1, numberline bands 2, vlines/hlines 4, hband 5. **Lower wins; a loser escapes one row down**, which is exactly how a long band label lands on the tick row. Keep numberline band labels to one short word, and never put a label on a numberline probe that also carries band text.
- `numberline` tick labels are `text-anchor:start`, graph tick labels are `middle`. When checking alignment compare numberline `bbox.left` against graph `bbox centre`.
- A numberline probe label is clamped to `cy=2` → `getBBox().y ≈ −1`. That is empty font-box space, not visible clipping.

## Copy rules

- Rounded values are written with `≈`, never `=`. Exact fractions stay exact (`44/15 ≈ 2.93`).
- Banned in student-visible text: `winner`/`wins`, `rail`, `gate`, em-dash `—`, semicolon `;`.
- A corner has no derivative because **the one-sided slopes differ**, never "one point cannot carry two tangent lines".
- Copy may only name things actually on screen (a card's real title, a label that really exists).
- Colour semantics across Unit 5: `up`/`down` = sign of f′ (positive/negative, increasing/decreasing); `accent` = maximum/greatest, `aux` = minimum/least, `auxInk` = neither.
- Retirement wording: when a pane leaves the screen, any narration that says "the X card/panel now/above …" must stop referring to it on later screens. Grep your message strings for the pane titles you retire.

## Verify before you report

```
cp <file> /tmp/r3-<name>.base                       # before you edit
node --check <copy-as-.mjs>
node dev/stepcheck.mjs unit5/<file>.js              # per-screen params / narration / pane titles
node dev/harness.mjs 2>&1 | grep -E "LESSONS_HARNESS|FAIL"
node dev/copydump.mjs <topic-id> > /tmp/r3-<name>.txt   # rendered visible strings only
```
Harness FAILs in files you do not own: ignore and mention in the report, never fix.
Do not touch: `js/calc-runtime.js`, `js/calc-components.js`, `css/`, `js/curriculum.js`, the shell HTML, any shell file, any `?v=` string, and never run a git command that changes state.

Report: per screen you changed, before → after, plus the `stat` line proving the file moved, plus anything you found but did not fix.
