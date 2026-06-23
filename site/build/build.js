#!/usr/bin/env node
// Emits one standalone HTML file per technique plus glossary.html (the dashboard).
// Run from anywhere: node site/build/build.js

const fs = require("fs");
const path = require("path");

const helpersModule = require("./techniques-helpers.js");
const { techniques } = require("./techniques.js");
const engineSource = fs.readFileSync(path.join(__dirname, "engine.js"), "utf8");
const themeCss = fs.readFileSync(path.join(__dirname, "theme.css"), "utf8");

const outDir = path.join(__dirname, "..");

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Serialize a technique into a `window.TECHNIQUE = {...}` literal: data as JSON, behaviour as function source.
function serializeTechnique(technique) {
  const dataKeys = ["id", "title", "chapter", "chapterTitle", "oneLine", "covers", "inputMode", "inputHint", "teachSteps", "autoAdvance", "digitOptions", "_divisor", "_rule", "_example"];
  const fnKeys = ["makeProblem", "promptHtml", "checkAnswer", "solutionSteps"];
  const parts = [];
  dataKeys.forEach(function (key) {
    if (technique[key] === undefined) return;
    parts.push(JSON.stringify(key) + ": " + JSON.stringify(technique[key]));
  });
  fnKeys.forEach(function (key) {
    parts.push(JSON.stringify(key) + ": " + technique[key].toString());
  });
  return "{\n  " + parts.join(",\n  ") + "\n}";
}

function pageHtml(technique) {
  const helperSource = helpersModule.helpersSource;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b16">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Mental Math">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon.svg">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<title>${escapeHtml(technique.title)} - Secrets of Mental Math</title>
<style>
${themeCss}
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <a href="glossary.html">&#8592; All techniques</a>
    <span class="chapter-chip">Chapter ${technique.chapter} &middot; ${escapeHtml(technique.chapterTitle)}</span>
  </div>

  <header class="hero">
    <h1>${escapeHtml(technique.title)}</h1>
    <p class="one-line">${escapeHtml(technique.oneLine)}</p>
    <p class="covers">${escapeHtml(technique.covers)}</p>
  </header>

  <section class="card">
    <h2><span class="glyph">&#9788;</span> Learn the secret</h2>
    <div id="teach-steps"></div>
    <div class="btn-row">
      <button id="teach-next" class="btn">Show first step</button>
      <button id="teach-reset" class="btn ghost" style="display:none">Start over</button>
    </div>
  </section>

  <section class="card">
    <h2><span class="glyph">&#9876;</span> Test yourself</h2>
    <div class="bests">
      <div class="score"><div class="label">Best streak</div><div class="value" id="stat-best-streak">0</div></div>
      <div class="score"><div class="label">Total solved</div><div class="value" id="stat-best-solved">0</div></div>
      <div class="score"><div class="label">Fastest</div><div class="value" id="stat-best-time">--</div></div>
    </div>
    <div id="drill-panel">
      <button id="drill-start" class="btn">Start 10-question batch</button>
      <div class="drill-stage">
        <div id="spark-layer"></div>
        <div id="digit-selector" class="digit-selector"></div>
        <div class="scoreboard">
          <div class="score"><div class="label">Streak</div><div class="value" id="stat-streak">0</div></div>
          <div class="score"><div class="label">This session</div><div class="value" id="stat-solved">0</div></div>
          <div class="score"><div class="label">Batch</div><div class="value" id="stat-batch-progress">0 / 10</div></div>
          <div class="score is-timer"><div class="label">Timer</div><div class="value" id="stat-timer">0.0s</div></div>
        </div>
        <div id="drill-prompt"></div>
        <form id="drill-form" autocomplete="off">
          <input id="drill-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" />
          <button type="submit" class="btn" id="drill-check">Check</button>
        </form>
        <p id="drill-hint"></p>
        <div id="drill-feedback" class="drill-feedback"></div>
        <div id="drill-solution" style="display:none"></div>
        <div class="btn-row" style="justify-content:center">
          <button id="drill-next" class="btn ghost" style="display:none">Next problem &#8594;</button>
        </div>
      </div>
    </div>
  </section>

  <section class="card" id="progress-card" style="display:none">
    <h2><span class="glyph">&#9201;</span> Your progress</h2>
    <div id="progress-graph"></div>
    <div id="progress-legend" class="progress-legend"></div>
    <p class="progress-note">Solve time per correct answer. Dots are individual attempts; the line is a smoothed trend. Lower is faster.</p>
  </section>

  <p class="footnote">From <i>Secrets of Mental Math</i> by Arthur Benjamin &amp; Michael Shermer. Practice page &mdash; progress saved in this browser only.</p>
</div>

<script>
${helperSource}
window.TECHNIQUE = ${serializeTechnique(technique)};
</script>
<script>
${engineSource}
</script>
</body>
</html>
`;
}

function glossaryHtml(list) {
  const byChapter = {};
  list.forEach(function (technique) {
    if (!byChapter[technique.chapter]) byChapter[technique.chapter] = { title: technique.chapterTitle, items: [] };
    byChapter[technique.chapter].items.push(technique);
  });
  const chapterNumbers = Object.keys(byChapter).map(Number).sort(function (a, b) { return a - b; });

  let groups = "";
  chapterNumbers.forEach(function (number) {
    const group = byChapter[number];
    let cards = "";
    group.items.forEach(function (technique) {
      cards += `
      <a class="tech-card" href="${technique.id}.html" data-id="${technique.id}">
        <div class="tech-head">
          <span class="tech-title">${escapeHtml(technique.title)}</span>
          <span class="tech-stats" data-stats="${technique.id}"></span>
        </div>
        <p class="tech-one-line">${escapeHtml(technique.oneLine)}</p>
      </a>`;
    });
    groups += `
    <div class="chapter-group">
      <h3>Chapter ${number} &middot; ${escapeHtml(group.title)}</h3>
      ${cards}
    </div>`;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0b16">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Mental Math">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon.svg">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<title>Secrets of Mental Math - Practice Deck</title>
<style>
${themeCss}
</style>
</head>
<body>
<div class="wrap">
  <header class="glossary-hero">
    <h1>Secrets of Mental Math</h1>
    <p>Every lightning-calculation secret from the book, each with a lesson you step through and a timed 10-question quiz. Pick one and start.</p>
  </header>

  <div class="overall">
    <div class="score"><div class="label">Techniques tried</div><div class="value" id="overall-tried">0 / ${list.length}</div></div>
    <div class="score"><div class="label">Problems solved</div><div class="value" id="overall-solved">0</div></div>
    <div class="score"><div class="label">Best streak anywhere</div><div class="value" id="overall-streak">0</div></div>
  </div>

  ${groups}

  <div class="reset-row">
    <button id="update-app" class="btn ghost" type="button">Update to latest version</button>
    <button id="reset-progress" class="btn ghost reset-btn" type="button">Reset all progress</button>
  </div>

  <p class="footnote">From <i>Secrets of Mental Math</i> by Arthur Benjamin &amp; Michael Shermer. Progress is saved in this browser only.</p>
</div>

<script>
(function dashboard() {
  var ids = ${JSON.stringify(list.map(function (t) { return t.id; }))};
  var prefix = "secrets-of-mental-math:";

  function paint() {
    var tried = 0, solvedTotal = 0, bestStreak = 0;
    ids.forEach(function (id) {
      var raw = null;
      try { raw = window.localStorage.getItem(prefix + id); } catch (e) {}
      var stats = raw ? JSON.parse(raw) : null;
      var cell = document.querySelector('[data-stats="' + id + '"]');
      if (stats && (stats.solvedTotal || stats.bestStreak)) {
        tried += 1;
        solvedTotal += stats.solvedTotal || 0;
        if ((stats.bestStreak || 0) > bestStreak) bestStreak = stats.bestStreak;
        var fastest = stats.fastestMilliseconds == null ? "--" : (stats.fastestMilliseconds / 1000).toFixed(1) + "s";
        if (cell) cell.innerHTML = '<span class="done">' + (stats.solvedTotal || 0) + ' solved</span> &middot; streak ' + (stats.bestStreak || 0) + ' &middot; ' + fastest;
      } else if (cell) {
        cell.textContent = "not started";
      }
    });
    document.getElementById("overall-tried").textContent = tried + " / " + ids.length;
    document.getElementById("overall-solved").textContent = solvedTotal.toLocaleString("en-US");
    document.getElementById("overall-streak").textContent = String(bestStreak);
  }

  document.getElementById("reset-progress").addEventListener("click", function () {
    if (!window.confirm("Reset all saved progress on this device? Streaks, totals, fastest times, and the progress graphs for every technique will be erased. This cannot be undone.")) return;
    try {
      // Remove every key under our prefix: per-technique stats, :history, :digits.
      const toRemove = [];
      for (let i = 0; i < window.localStorage.length; i += 1) { const key = window.localStorage.key(i); if (key && key.indexOf(prefix) === 0) toRemove.push(key); }
      toRemove.forEach(function (key) { window.localStorage.removeItem(key); });
    } catch (e) {}
    paint();
  });

  // Force the freshest deployed version: drop any service worker + cached files, then
  // hard-reload past the browser/HTTP cache. Keeps localStorage progress intact.
  document.getElementById("update-app").addEventListener("click", function () {
    var done = function () { window.location.replace(window.location.pathname + "?v=" + Date.now()); };
    var jobs = [];
    try {
      if (window.caches && caches.keys) jobs.push(caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); }));
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) jobs.push(navigator.serviceWorker.getRegistrations().then(function (regs) { return Promise.all(regs.map(function (r) { return r.unregister(); })); }));
    } catch (e) {}
    if (jobs.length) { Promise.all(jobs).then(done, done); } else { done(); }
  });

  paint();
})();
</script>
</body>
</html>
`;
}

// ---- write everything ----
let count = 0;
techniques.forEach(function (technique) {
  const file = path.join(outDir, technique.id + ".html");
  fs.writeFileSync(file, pageHtml(technique), "utf8");
  count += 1;
});
fs.writeFileSync(path.join(outDir, "glossary.html"), glossaryHtml(techniques), "utf8");

console.log("Wrote " + count + " technique pages + glossary.html to " + outDir);
console.log("Techniques: " + techniques.map(function (t) { return t.id; }).join(", "));
