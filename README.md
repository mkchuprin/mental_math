# Mental Math practice deck

### ▶ [Open the app](https://mkchuprin.github.io/mental_math/)

&nbsp;&nbsp;&nbsp;&nbsp;**https://mkchuprin.github.io/mental_math/**

Interactive practice pages for the lightning-calculation techniques in
*Secrets of Mental Math* (Arthur Benjamin & Michael Shermer). Each technique gets
its own self-contained page that teaches the method step by step, then drills it
with 5-question batches of randomly-generated problems, a timer, a streak counter, and a
worked solution on any miss. Progress is saved per-browser in `localStorage`.

## Use it

Tap **[Open the app](https://mkchuprin.github.io/mental_math/)** above — it loads
the live dashboard (the index of all 42 techniques). On a phone you can then
add it to your home screen for a one-tap, full-screen launch.

Every page is a standalone `.html` file with no server or build step, so you can
also open [`site/glossary.html`](site/glossary.html) directly from a local clone.
The `mm` shell alias opens the live app.

## Develop

Pages are generated from data, not edited by hand:

- [`site/build/techniques.js`](site/build/techniques.js) — the technique specs (teach steps, drill generators, answer checkers, worked solutions). The single source of truth.
- [`site/build/engine.js`](site/build/engine.js) — the shared front-end engine (step-through, timed drills, scoring, persistence) inlined into every page.
- [`site/build/theme.css`](site/build/theme.css) — the shared look.
- [`site/build/build.js`](site/build/build.js) — emits one `.html` per technique plus `glossary.html`.
- [`site/build/verify.js`](site/build/verify.js) — correctness sweep: generates hundreds of problems per technique and asserts the true answer passes, a wrong answer fails, and nothing throws.

```sh
node site/build/build.js     # regenerate all pages
node site/build/verify.js    # check every drill's logic
```
