// Shared front-end engine inlined into every technique page.
// A page defines a global `TECHNIQUE` object before this script runs. Shape:
//   {
//     id, title, chapter, oneLine, covers,
//     teachSteps: [{ text, math }],            // interactive step-through (revealed one at a time)
//     makeProblem(),                            // returns a problem object the other hooks understand
//     promptHtml(problem),                      // the question shown to the solver
//     checkAnswer(problem, rawInput),           // -> { correct: bool, expected: string }
//     solutionSteps(problem),                   // -> [{ text, math }] full worked solution for a missed problem
//     inputMode,                                // "number" | "text" | "weekday" | "grid"
//     inputHint,                                // placeholder / helper text under the answer box
//   }

(function bootTechniquePage() {
  const technique = window.TECHNIQUE;
  const storageKey = "secrets-of-mental-math:" + technique.id;

  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function readSavedBests() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return { bestStreak: 0, solvedTotal: 0, fastestMilliseconds: null };
      const parsed = JSON.parse(raw);
      return {
        bestStreak: parsed.bestStreak || 0,
        solvedTotal: parsed.solvedTotal || 0,
        fastestMilliseconds: parsed.fastestMilliseconds == null ? null : parsed.fastestMilliseconds,
      };
    } catch (error) {
      return { bestStreak: 0, solvedTotal: 0, fastestMilliseconds: null };
    }
  }

  function writeSavedBests(bests) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(bests));
    } catch (error) {
      // localStorage may be unavailable (private mode); progress simply will not persist.
    }
  }

  // Solve-time history per digit-size, for the progress graph. Shape:
  //   { "<size>": [milliseconds, ...] }  ("all" when the drill has no digit selector).
  const historyKey = storageKey + ":history";
  function readHistory() {
    try { const raw = window.localStorage.getItem(historyKey); return raw ? JSON.parse(raw) : {}; }
    catch (error) { return {}; }
  }
  function appendHistory(sizeLabel, milliseconds) {
    const history = readHistory();
    if (!history[sizeLabel]) history[sizeLabel] = [];
    history[sizeLabel].push(Math.round(milliseconds));
    try { window.localStorage.setItem(historyKey, JSON.stringify(history)); } catch (error) {}
    return history;
  }

  // Color per digit-size series. Falls back through the palette for any extra labels.
  const seriesColors = { "2": "#ffd97a", "3": "#a98bff", "4": "#54d6c2", "5": "#ff6f8f", "6": "#5fd38a", "all": "#ffd97a" };
  function colorFor(label, index) {
    return seriesColors[label] || ["#ffd97a", "#a98bff", "#54d6c2", "#ff6f8f", "#5fd38a"][index % 5];
  }

  // Downsample a series to at most `cap` points by even striding (keeps first and last).
  function downsample(values, cap) {
    if (values.length <= cap) return values.map(function (v, i) { return { x: i, v: v }; });
    const step = (values.length - 1) / (cap - 1);
    const out = [];
    for (let i = 0; i < cap; i += 1) { const idx = Math.round(i * step); out.push({ x: idx, v: values[idx] }); }
    return out;
  }

  // Centered-ish moving average (trailing window) over the full series, in seconds.
  function trend(values, windowSize) {
    const out = [];
    let sum = 0;
    const queue = [];
    for (let i = 0; i < values.length; i += 1) {
      queue.push(values[i]); sum += values[i];
      if (queue.length > windowSize) sum -= queue.shift();
      out.push(sum / queue.length);
    }
    return out;
  }

  function renderProgressGraph() {
    const card = document.getElementById("progress-card");
    const graphHost = document.getElementById("progress-graph");
    const legendHost = document.getElementById("progress-legend");
    if (!card || !graphHost) return;
    const history = readHistory();
    const labels = Object.keys(history).filter(function (key) { return history[key] && history[key].length; });
    if (!labels.length) { card.style.display = "none"; return; }
    card.style.display = "block";

    // Order numeric size labels ascending; "all" stands alone.
    labels.sort(function (a, b) { return (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0); });

    const width = 680, height = 260, padL = 52, padR = 16, padT = 16, padB = 30;
    const plotW = width - padL - padR, plotH = height - padT - padB;

    let maxAttempts = 0, maxMs = 0;
    labels.forEach(function (label) {
      const series = history[label];
      if (series.length > maxAttempts) maxAttempts = series.length;
      series.forEach(function (ms) { if (ms > maxMs) maxMs = ms; });
    });
    const xMax = Math.max(maxAttempts - 1, 1);
    const yMax = Math.max(maxMs, 1000);

    function sx(attemptIndex) { return padL + (xMax === 0 ? 0 : (attemptIndex / xMax) * plotW); }
    function sy(ms) { return padT + plotH - (ms / yMax) * plotH; }

    const svgParts = [];
    svgParts.push('<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="xMidYMid meet" class="progress-svg">');

    // y gridlines + labels (4 ticks in seconds)
    for (let t = 0; t <= 4; t += 1) {
      const ms = (yMax / 4) * t;
      const y = sy(ms);
      svgParts.push('<line x1="' + padL + '" y1="' + y + '" x2="' + (width - padR) + '" y2="' + y + '" class="grid"/>');
      svgParts.push('<text x="' + (padL - 8) + '" y="' + (y + 4) + '" class="axis-label" text-anchor="end">' + (ms / 1000).toFixed(ms >= 10000 ? 0 : 1) + 's</text>');
    }
    // x axis label
    svgParts.push('<text x="' + (padL + plotW / 2) + '" y="' + (height - 6) + '" class="axis-label" text-anchor="middle">attempts &#8594;</text>');

    labels.forEach(function (label, seriesIndex) {
      const series = history[label];
      const color = colorFor(label, seriesIndex);
      // raw dots (downsampled for performance/legibility)
      const points = downsample(series, 120);
      points.forEach(function (p) {
        svgParts.push('<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.v).toFixed(1) + '" r="2.2" fill="' + color + '" opacity="0.32"/>');
      });
      // smoothed trend line over the full series
      if (series.length >= 2) {
        const smoothed = trend(series, Math.max(3, Math.round(series.length / 12)));
        const line = downsample(smoothed, 160);
        const d = line.map(function (p, i) { return (i === 0 ? "M" : "L") + sx(p.x).toFixed(1) + " " + sy(p.v).toFixed(1); }).join(" ");
        svgParts.push('<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>');
      }
    });

    svgParts.push('</svg>');
    graphHost.innerHTML = svgParts.join("");

    // legend
    if (legendHost) {
      const hasSizes = !(labels.length === 1 && labels[0] === "all");
      legendHost.innerHTML = labels.map(function (label, seriesIndex) {
        const color = colorFor(label, seriesIndex);
        const name = label === "all" ? "all attempts" : label + "-digit";
        const count = history[label].length;
        const best = Math.min.apply(null, history[label]);
        return '<span class="legend-item"><span class="legend-swatch" style="background:' + color + '"></span>' + (hasSizes ? name : "solve time") + ' <span class="legend-meta">(' + count + ', best ' + (best / 1000).toFixed(1) + 's)</span></span>';
      }).join("");
    }
  }

  function formatMilliseconds(milliseconds) {
    if (milliseconds == null) return "--";
    return (milliseconds / 1000).toFixed(1) + "s";
  }

  function renderMathFragments(container, fragments) {
    container.innerHTML = "";
    fragments.forEach(function appendFragment(fragment) {
      const block = document.createElement("div");
      block.className = "step-line";
      if (fragment.text) {
        const text = document.createElement("p");
        text.className = "step-text";
        text.innerHTML = fragment.text;
        block.appendChild(text);
      }
      if (fragment.math) {
        const math = document.createElement("div");
        math.className = "step-math";
        math.textContent = fragment.math;
        block.appendChild(math);
      }
      container.appendChild(block);
    });
  }

  // ---- Teach section: reveal one step at a time -------------------------------
  let revealedStepCount = 0;
  const teachContainer = document.getElementById("teach-steps");
  const teachNextButton = document.getElementById("teach-next");
  const teachResetButton = document.getElementById("teach-reset");

  function renderTeachSteps() {
    const shown = technique.teachSteps.slice(0, revealedStepCount);
    renderMathFragments(teachContainer, shown);
    const allShown = revealedStepCount >= technique.teachSteps.length;
    teachNextButton.textContent = revealedStepCount === 0 ? "Show first step" : allShown ? "All steps shown" : "Next step";
    teachNextButton.disabled = allShown;
    teachResetButton.style.display = revealedStepCount === 0 ? "none" : "inline-flex";
  }

  teachNextButton.addEventListener("click", function advanceTeachStep() {
    if (revealedStepCount < technique.teachSteps.length) revealedStepCount += 1;
    renderTeachSteps();
  });
  teachResetButton.addEventListener("click", function resetTeachSteps() {
    revealedStepCount = 0;
    renderTeachSteps();
  });

  // ---- Test section: timed, scored drills -------------------------------------
  const promptContainer = document.getElementById("drill-prompt");
  const answerForm = document.getElementById("drill-form");
  const answerInput = document.getElementById("drill-input");
  const answerHint = document.getElementById("drill-hint");
  const feedbackContainer = document.getElementById("drill-feedback");
  const solutionContainer = document.getElementById("drill-solution");
  const nextProblemButton = document.getElementById("drill-next");
  const checkButton = document.getElementById("drill-check");
  const startButton = document.getElementById("drill-start");
  const drillPanel = document.getElementById("drill-panel");
  const questionsPerBatch = 10;

  // Auto-advance everywhere except drills that opt out (the tolerance-based estimation screens).
  const autoAdvance = technique.autoAdvance !== false;
  if (autoAdvance && checkButton) checkButton.style.display = "none";

  const streakValue = document.getElementById("stat-streak");
  const solvedValue = document.getElementById("stat-solved");
  const batchProgressValue = document.getElementById("stat-batch-progress");
  const timerValue = document.getElementById("stat-timer");
  const bestStreakValue = document.getElementById("stat-best-streak");
  const bestSolvedValue = document.getElementById("stat-best-solved");
  const bestTimeValue = document.getElementById("stat-best-time");

  let currentProblem = null;
  let currentStreak = 0;
  let sessionSolved = 0;
  let currentBatchAnswered = 0;
  let currentBatchCorrect = 0;
  let tickHandle = null;
  let bests = readSavedBests();

  // Configure the on-screen keyboard ONCE. Re-setting type/inputmode on a focused input
  // each problem is what makes iOS flash and dismiss the keyboard. Integer drills get the
  // bare numpad (type=tel); drills whose answers can hold a decimal point get the decimal
  // pad; text drills (division "84 r 3", yes/no, code words) get the full keyboard.
  const decimalAnswerIds = ["estimate-square-root", "tips", "sales-tax", "fraction-to-decimal"];
  if (technique.inputMode === "number") {
    if (decimalAnswerIds.indexOf(technique.id) !== -1) {
      answerInput.setAttribute("type", "text");
      answerInput.setAttribute("inputmode", "decimal");
    } else {
      answerInput.setAttribute("type", "tel");
      answerInput.setAttribute("inputmode", "numeric");
    }
  } else if (technique.inputMode === "text") {
    answerInput.setAttribute("type", "text");
    answerInput.setAttribute("inputmode", "text");
  }

  // Timer counts only foreground time. `accumulatedMs` banks time from past visible
  // segments; `segmentStartedAt` marks the current visible segment (null while hidden).
  // This keeps a backgrounded tab / locked phone from inflating a problem's solve time.
  let accumulatedMs = 0;
  let segmentStartedAt = null;
  function elapsedNow() {
    return accumulatedMs + (segmentStartedAt == null ? 0 : performance.now() - segmentStartedAt);
  }

  function paintBests() {
    bestStreakValue.textContent = String(bests.bestStreak);
    bestSolvedValue.textContent = String(bests.solvedTotal);
    bestTimeValue.textContent = formatMilliseconds(bests.fastestMilliseconds);
  }

  function paintSessionStats() {
    streakValue.textContent = String(currentStreak);
    solvedValue.textContent = String(sessionSolved);
    batchProgressValue.textContent = currentBatchAnswered + " / " + questionsPerBatch;
  }

  function stopTickInterval() {
    if (tickHandle != null) {
      window.clearInterval(tickHandle);
      tickHandle = null;
    }
  }

  // Fully stop and reset the timer for a problem (also used when a problem ends).
  function stopTimer() {
    stopTickInterval();
    segmentStartedAt = null;
  }

  function startTimer() {
    stopTickInterval();
    accumulatedMs = 0;
    segmentStartedAt = document.hidden ? null : performance.now();
    timerValue.textContent = "0.0s";
    tickHandle = window.setInterval(function tick() {
      timerValue.textContent = formatMilliseconds(elapsedNow());
    }, 100);
  }

  // Pause foreground accounting when the page is hidden (tab switch, app backgrounded,
  // screen lock) and resume on return, so only on-screen time counts toward the timer.
  document.addEventListener("visibilitychange", function onVisibilityChange() {
    if (document.hidden) {
      if (segmentStartedAt != null) {
        accumulatedMs += performance.now() - segmentStartedAt;
        segmentStartedAt = null;
      }
    } else if (tickHandle != null && segmentStartedAt == null) {
      // Resume only if a problem's timer is actively running.
      segmentStartedAt = performance.now();
    }
  });

  function buildWeekdayInput() {
    const wrap = document.createElement("div");
    wrap.className = "weekday-grid";
    weekdayNames.forEach(function addButton(name) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "weekday-button";
      button.textContent = name;
      button.addEventListener("click", function pickWeekday() {
        submitAnswer(name);
      });
      wrap.appendChild(button);
    });
    return wrap;
  }

  // Optional digit-count selector. A technique opts in via `digitOptions` (e.g. [2,3,4]);
  // the chosen size is passed to makeProblem and remembered per technique.
  const digitOptions = Array.isArray(technique.digitOptions) ? technique.digitOptions : null;
  const digitStorageKey = storageKey + ":digits";
  let selectedDigits = null;
  if (digitOptions) {
    let saved = null;
    try { saved = parseInt(window.localStorage.getItem(digitStorageKey), 10); } catch (e) {}
    selectedDigits = digitOptions.indexOf(saved) !== -1 ? saved : digitOptions[0];
  }

  function buildDigitSelector() {
    const host = document.getElementById("digit-selector");
    if (!host || !digitOptions) return;
    host.innerHTML = "";
    const label = document.createElement("span");
    label.className = "digit-label";
    label.textContent = "Digits:";
    host.appendChild(label);
    digitOptions.forEach(function (count) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "digit-button" + (count === selectedDigits ? " is-selected" : "");
      button.textContent = String(count);
      button.addEventListener("click", function pickDigits() {
        if (count === selectedDigits) return;
        selectedDigits = count;
        try { window.localStorage.setItem(digitStorageKey, String(count)); } catch (e) {}
        host.querySelectorAll(".digit-button").forEach(function (b) { b.classList.toggle("is-selected", b.textContent === String(count)); });
        if (currentBatchAnswered >= questionsPerBatch) startBatch();
        else presentProblem();
      });
      host.appendChild(button);
    });
  }

  function presentProblem() {
    if (currentBatchAnswered >= questionsPerBatch) return;
    currentProblem = technique.makeProblem(selectedDigits);
    promptContainer.innerHTML = technique.promptHtml(currentProblem);
    feedbackContainer.textContent = "";
    feedbackContainer.className = "drill-feedback";
    solutionContainer.innerHTML = "";
    solutionContainer.style.display = "none";
    nextProblemButton.style.display = "none";

    const existingWeekday = document.getElementById("weekday-input");
    if (existingWeekday) existingWeekday.remove();

    if (technique.inputMode === "weekday") {
      answerForm.style.display = "none";
      const grid = buildWeekdayInput();
      grid.id = "weekday-input";
      promptContainer.insertAdjacentElement("afterend", grid);
    } else {
      answerForm.style.display = "flex";
      answerInput.value = "";
      // Only touch `disabled` if it is actually set, so an auto-advance does not blur the
      // input (re-enabling an already-enabled field can dismiss the mobile keyboard).
      // type/inputmode are set once at boot, never here, to avoid an iOS keyboard flash.
      if (answerInput.disabled) answerInput.disabled = false;
      answerHint.textContent = technique.inputHint || "";
      if (document.activeElement !== answerInput) answerInput.focus();
    }
    startTimer();
  }

  function finishBatch() {
    currentProblem = null;
    const existingWeekday = document.getElementById("weekday-input");
    if (existingWeekday) existingWeekday.remove();
    answerForm.style.display = "none";
    answerHint.textContent = "";
    solutionContainer.innerHTML = "";
    solutionContainer.style.display = "none";
    promptContainer.innerHTML = "<div>Batch complete</div>";
    feedbackContainer.textContent = "You got " + currentBatchCorrect + " / " + questionsPerBatch + " correct. Start another batch when you are ready.";
    feedbackContainer.className = "drill-feedback" + (currentBatchCorrect === questionsPerBatch ? " is-correct" : "");
    nextProblemButton.textContent = "Start next batch";
    nextProblemButton.style.display = "inline-flex";
    nextProblemButton.focus();
  }

  function startBatch() {
    currentBatchAnswered = 0;
    currentBatchCorrect = 0;
    drillPanel.classList.add("is-active");
    startButton.style.display = "none";
    nextProblemButton.textContent = "Next problem \u2192";
    buildDigitSelector();
    paintSessionStats();
    presentProblem();
  }

  function lockProblemInputs() {
    answerInput.disabled = true;
    const weekday = document.getElementById("weekday-input");
    if (weekday) weekday.querySelectorAll("button").forEach(function disable(button) { button.disabled = true; });
  }

  function celebrate() {
    const layer = document.getElementById("spark-layer");
    for (let index = 0; index < 14; index += 1) {
      const spark = document.createElement("span");
      spark.className = "spark";
      spark.style.left = (10 + Math.random() * 80) + "%";
      spark.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
      spark.style.animationDelay = (Math.random() * 0.12) + "s";
      layer.appendChild(spark);
      window.setTimeout(function removeSpark() { spark.remove(); }, 900);
    }
  }

  function submitAnswer(rawInput) {
    if (currentProblem == null) return;
    const elapsed = elapsedNow();
    stopTimer();
    const verdict = technique.checkAnswer(currentProblem, rawInput);
    currentBatchAnswered += 1;

    if (verdict.correct) {
      currentStreak += 1;
      sessionSolved += 1;
      currentBatchCorrect += 1;
      bests.solvedTotal += 1;
      if (currentStreak > bests.bestStreak) bests.bestStreak = currentStreak;
      if (bests.fastestMilliseconds == null || elapsed < bests.fastestMilliseconds) bests.fastestMilliseconds = elapsed;
      writeSavedBests(bests);
      const sizeLabel = selectedDigits == null ? "all" : String(selectedDigits);
      appendHistory(sizeLabel, elapsed);
      renderProgressGraph();
      feedbackContainer.textContent = "Correct  -  " + formatMilliseconds(elapsed) + (verdict.detail ? "  -  " + verdict.detail : "");
      feedbackContainer.className = "drill-feedback is-correct";
      celebrate();
      paintSessionStats();
      paintBests();
      if (currentBatchAnswered >= questionsPerBatch) {
        finishBatch();
        return;
      }
      if (autoAdvance) {
        // Advance SYNCHRONOUSLY, inside the same input gesture, and never blur/disable the
        // field. On iOS the soft keyboard collapses the moment focus work happens outside a
        // user gesture (e.g. a setTimeout) -- so we load the next problem immediately and let
        // the next keystroke clear the "Correct" flash. The keyboard stays up; no re-tap.
        presentProblem();
        return;
      }
      lockProblemInputs();
    } else {
      lockProblemInputs();
      currentStreak = 0;
      feedbackContainer.textContent = verdict.detail ? "Not quite.  " + verdict.detail : "Not quite. The answer is " + verdict.expected + ".";
      feedbackContainer.className = "drill-feedback is-wrong";
      const heading = document.createElement("h4");
      heading.textContent = "How to get it";
      solutionContainer.appendChild(heading);
      const stepsHost = document.createElement("div");
      renderMathFragments(stepsHost, technique.solutionSteps(currentProblem));
      solutionContainer.appendChild(stepsHost);
      solutionContainer.style.display = "block";
    }

    paintSessionStats();
    paintBests();
    if (currentBatchAnswered >= questionsPerBatch) {
      finishBatch();
      return;
    }
    nextProblemButton.style.display = "inline-flex";
    nextProblemButton.focus();
  }

  // Auto-advance drills check on every keystroke and jump ahead the instant the answer is right.
  // Estimation drills (autoAdvance === false) keep the Check button and explicit submit.
  answerInput.addEventListener("input", function onInput() {
    if (!autoAdvance || answerInput.disabled) return;
    if (currentProblem == null) return;
    if (answerInput.value.trim() === "") return;
    const verdict = technique.checkAnswer(currentProblem, answerInput.value);
    if (verdict.correct) submitAnswer(answerInput.value);
  });

  answerForm.addEventListener("submit", function onSubmit(event) {
    event.preventDefault();
    if (answerInput.disabled) return;
    if (answerInput.value.trim() === "") return;
    submitAnswer(answerInput.value);
  });
  nextProblemButton.addEventListener("click", function handleNextProblemClick() {
    if (currentBatchAnswered >= questionsPerBatch) startBatch();
    else presentProblem();
  });
  startButton.addEventListener("click", startBatch);

  paintSessionStats();
  paintBests();
  renderTeachSteps();
  renderProgressGraph();
})();
