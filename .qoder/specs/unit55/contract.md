# Topic 5.5 Candidates Test — shared build contract

Three agents write three NEW sibling files. The main agent assembles the shell and
registers the topic. Every agent must follow this file exactly so the three modes
look and behave like one lesson.

## Files and ownership

| owner (agent) | the ONLY file it may write | named export | mode `label` |
|---|---|---|---|
| `u55-a-main-board` | `extensions/school/ap-calc/visualizers/unit5/abs-candidates-main.js` | `candidatesMode` | `The candidates test` |
| `u55-b-dne-case` | `extensions/school/ap-calc/visualizers/unit5/abs-candidates-dne.js` | `dneMode` | `Where f′ does not exist` |
| `u55-c-transfer` | `extensions/school/ap-calc/visualizers/unit5/abs-candidates-transfer.js` | `transferMode` | `Practice without a graph` |

Each file ends with:

```js
export const <name>Mode = { label: '<label from the table>', intro, params, controls, fns, compute, panes, steps, summary };
export default <name>Mode;
```

The `export default` of the mode object itself is what `dev/stepcheck.mjs` mounts, so the
file is verifiable before the shell exists. The shell (main agent) imports the **named**
export and puts it in `modes: []`. Do not create, open or edit the shell file
`absolute-extrema-candidates.js` — it is the main agent's.

Never import from another lesson file. The shared math below is copied verbatim into each
file, which is deliberate: importing from `extrema-critical-points.js` would mean editing
another writer's live file.

## Hard no-touch list

`js/calc-runtime.js`, `js/calc-components.js`, `js/curriculum.js`, `css/calc-workspace.css`,
`AP Calculus Visual Lab.html`, `visualizers/unit5/extrema-critical-points.js`,
`visualizers/unit5/mvt-secant-finder.js`, every other unit folder, and `dev/` (scratch
scripts go in /tmp, never in dev/).

A second AI is writing in this repo right now (unit3 + the two existing unit5 files). If
`node dev/harness.mjs` reports a FAIL in a file that is not yours, ignore it and do not fix
it. Never run a git command that changes state. Do not touch any `?v=` string.

## The math (verified, fixed — do not recompute differently)

```js
const A = -2.8, B = 1.8;                                  // the closed interval [A, B]
const fQ = (x) => Math.pow(x, 5) / 5 + Math.pow(x, 4) / 4 - (2 / 3) * Math.pow(x, 3);
const dQ = (x) => x * x * (x + 2) * (x - 1);              // f′, and f′ = 0 at −2, 0, 1
const IV = '[−2.8, 1.8]';
const dsp = (v) => {
    let s = (Math.round(v * 100) / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', '−');
};
```

Exact values (rounded for display): `f(−2.8) = −4.42`, `f(−2) = 2.93`, `f(0) = 0`,
`f(1) = −0.22`, `f(1.8) = 2.52`.
Absolute maximum VALUE `2.93` at `x = −2` (an interior critical point).
Absolute minimum VALUE `−4.42` at `x = −2.8` (the LEFT ENDPOINT wins an absolute extremum —
required by spec §6 and §17).
x = 0 is a critical point (`f′(0) = 0`, double root) that holds no local extremum and is
still a candidate (spec §5).

Mode B: `g(x) = |x| + 0.2x` on `[−2, 1]`. `g(−2) = 1.6`, `g(0) = 0`, `g(1) = 1.2`.
`g′` = `−0.8` left of 0 and `1.2` right of 0, DNE at `x = 0`. Absolute minimum `0` at `x = 0`
(the DNE critical point), absolute maximum `1.6` at `x = −2` (an endpoint).

## Runtime facts you must build against

- `js/calc-runtime.js` reads one plain data object. Panes and every pane field may be
  `function(env)`.
- **Off-by-one**: on screen *i* the visible narration is `steps[i-1].message`, the visible
  question is `steps[i].predict`, and `env` merges `params` of `steps[0..i-1]`. So a reveal
  flag set in step *j* first shows on screen *j+1*. To ask a question without spoiling it,
  put the reveal flag in the **same step object that carries that predict**.
- Reveal gating uses a monotone `params.stage` counter (`when: env => env.stage >= n`).
  Nothing may be gated on whether the student answered; manual Next without answering must
  keep working (this is a standing user rule).
- Legal pane `kind` values, and nothing else:
  `graph`, `numberline`, `table`, `equation`/`eq`, `readout`, `checklist`, `machine`, `chain`,
  `tree`, `rectarea`, `compare`, `practice`, `note`, `predictionBox`, `playbar`, `particleTrail`.
  Do not invent pane fields — an unknown field renders nothing at all, silently.

## The candidate board (the hero visual)

`kind: 'table'`, title `Candidate board`. The board is the dominant pane and goes first in
`panes.main`; the function graph is SECONDARY, sits below it, and gets a shorter `height`.
Do not make "which point looks highest on the curve" the method anywhere.

Columns grow with `stage`, and rows grow with `stage`, so nothing shows up empty:

| stage | cols | row content |
|---|---|---|
| `< 1` | pane hidden (`when`) | — |
| `1` | `Candidate x`, `Why it is a candidate` | 5 rows, x value + reason |
| `2` | + `f(x)` | same rows, value appears |
| `3` | + `How it compares` | the winning maximum row is called out |
| `4` | same | the winning minimum row is called out too |

Reason wording (never call an endpoint a critical point): `left endpoint`, `right endpoint`,
`critical point, f′ = 0`, `critical point, f′ does not exist`.
Comparison wording: `absolute maximum value`, `absolute minimum value`, `not an absolute extremum`.

Table cells: a plain value or `{v, color, bold}`. `color` and `bold` are the only per-cell
emphasis and `hlRow` highlights a single row index only. There is no per-cell background.
Pass the numeric cells as **strings from `dsp()`** so negative numbers print with the real
minus sign `−` and not the ASCII hyphen. Colour the winner cells only at stage 3/4.
Colour tokens: `curveA`, `curveC`, `accent`, `up`, `down`, `ink`, `aux`, `auxInk`, `fillA`.
Do not use `compare` pane `tone: 'right'/'wrong'` to mean high/low — those tones are grading.

## Copy rules

- English, American spelling. No em-dash `—` and no `;` in any student-visible string.
- No ALL-CAPS emphasis words.
- Every choice is a full answer sentence plus the reason sentence, no `X, because Y` fragments.
- Any object a sentence names must be on screen with that exact name (a pane title, a column
  header, a graph label). Never name internal code words (`stage`, `env`, `pane`, `card`,
  `board` only if the pane title says Board).
- **Leakage rule (the class of bug every prior audit round caught)**: before a Predict, no
  answer may appear anywhere — not in a step message, a pane line, a readout value, a graph
  point label, an `eq` line, a table cell, or the wording of the choices themselves.
- Numbers quoted in prose must match the functions above. Recompute each one with `node -e`.

## Verification each agent runs before reporting

1. `node -e "console.log(...)"` — recompute every number you print.
2. `cp <your file> /tmp/u55-check.mjs && node --check /tmp/u55-check.mjs`
3. `node dev/stepcheck.mjs unit5/<your file>.js` from `extensions/school/ap-calc/` — read the
   per-screen dump: the params, the narration and the visible pane titles. Confirm each
   reveal lands on the screen AFTER its question, and that no pre-question screen contains
   its answer.
4. `grep -n "—\|;" <your file>` — must be 0 hits inside student-visible strings.
5. Write the file early (skeleton first, then fill in), so the mtime moves within ~10 minutes.
6. `node dev/harness.mjs` last, and only to confirm you did not break the registered lessons.
7. Report: `stat -c '%y %s %n'` of your file, the list of Predict questions with their stage
   gates, and the exact renderer `kind`s and fields you used.
