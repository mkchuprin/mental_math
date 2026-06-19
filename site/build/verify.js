#!/usr/bin/env node
// Correctness sweep: for every technique, generate many problems and assert that
//  (1) the true answer passes checkAnswer,
//  (2) an obviously wrong answer fails checkAnswer,
//  (3) promptHtml and solutionSteps run without throwing.
// The "true answer" is derived independently from the problem object, NOT from the technique.

const { helpers: H } = require("./techniques-helpers.js");
const { techniques } = require("./techniques.js");

const weekdayNames = H.weekdayNames;

// Independent ground-truth answer for each technique id, from the problem object.
const truthFor = {
  "left-to-right-addition": function (p) { return String(p.a + p.b); },
  "left-to-right-subtraction": function (p) { return String(p.a - p.b); },
  "complements": function (p) { return String(100 - p.n); },
  "multiply-by-11": function (p) { return String(p.n * 11); },
  "squaring-ending-in-5": function (p) { return String(p.n * p.n); },
  "squaring-two-digit": function (p) { return String(p.n * p.n); },
  "two-by-one": function (p) { return String(p.a * p.b); },
  "three-by-one": function (p) { return String(p.a * p.b); },
  "two-by-two-addition": function (p) { return String(p.a * p.b); },
  "two-by-two-subtraction": function (p) { return String(p.a * p.b); },
  "two-by-two-factoring": function (p) { return String(p.a * p.b); },
  "two-digit-cubing": function (p) { return String(p.n * p.n * p.n); },
  "one-digit-division": function (p) { return p.q + " r " + p.r; },
  "two-digit-division": function (p) { return p.q + " r " + p.r; },
  "fraction-to-decimal": function (p) { return p.n / p.d; },
  "estimate-multiplication": function (p) { return p.a * p.b; },
  "estimate-square-root": function (p) { return Math.sqrt(p.n); },
  "tips": function (p) { return Math.round(p.bill * p.pct) / 100; },
  "sales-tax": function (p) { return Math.round(p.amount * p.rate) / 100; },
  "rule-of-70": function (p) { return Math.round((p.triple ? 110 : 70) / p.rate); },
  "casting-out-nines": function (p) { return String(H.modSum(p.n)); },
  "casting-out-elevens": function (p) { var ds = H.digits(p.n).reverse(), a = 0; for (var i = 0; i < ds.length; i += 1) a += (i % 2 === 0 ? 1 : -1) * ds[i]; return String(((a % 11) + 11) % 11); },
  "criss-cross-multiplication": function (p) { return String(p.a * p.b); },
  "pencil-square-root": function (p) { return String(p.r); },
  "phonetic-code": function (p) { return p; }, // handled specially
  "phonetic-decode": function (p) { return p.n; },
  "three-digit-squaring": function (p) { return String(p.n * p.n); },
  "three-by-two": function (p) { return String(p.a * p.b); },
  "three-by-three": function (p) { return String(p.a * p.b); },
  "day-of-week": function (p) { return weekdayNames[H.trueWeekday(p.year, p.month, p.day)]; },
  "quick-cube-roots": function (p) { return String(p.r); },
  "quick-square-roots": function (p) { return String(p.r); },
  "missing-digit": function (p) { return String(p.missing); },
  "magic-1089": function (p) { return String(p.diff); },
};

// A canonical correct word for phonetic-code, built from the digit->sound table.
const phoneticSampleSound = ["s", "t", "n", "m", "r", "l", "sh", "k", "f", "b"];
function phoneticWordFor(sequence) {
  // interleave a vowel between each consonant sound to make a pronounceable string
  return sequence.split("").map(function (d, i) { return phoneticSampleSound[Number(d)] + (i < sequence.length - 1 ? "a" : ""); }).join("");
}

const ITER = 400;
let failures = [];

techniques.forEach(function (technique) {
  for (let trial = 0; trial < ITER; trial += 1) {
    let problem;
    try { problem = technique.makeProblem(); } catch (e) { failures.push(technique.id + ": makeProblem threw: " + e.message); break; }

    // prompt + solution should never throw
    try { technique.promptHtml(problem); } catch (e) { failures.push(technique.id + ": promptHtml threw: " + e.message); break; }
    try { technique.solutionSteps(problem); } catch (e) { failures.push(technique.id + ": solutionSteps threw: " + e.message + " | problem=" + JSON.stringify(problem)); break; }

    // build the correct input string
    let correctInput;
    if (technique.id === "phonetic-code") {
      correctInput = phoneticWordFor(problem.sequence);
    } else if (technique.id.indexOf("divisible-by-") === 0) {
      correctInput = (problem.n % technique._divisor === 0) ? "yes" : "no";
    } else {
      const truth = truthFor[technique.id](problem);
      correctInput = String(truth);
    }

    // (1) correct answer must pass
    let verdict;
    try { verdict = technique.checkAnswer(problem, correctInput); } catch (e) { failures.push(technique.id + ": checkAnswer threw on correct input: " + e.message); break; }
    if (!verdict.correct) {
      failures.push(technique.id + ": REJECTED correct answer '" + correctInput + "' for problem " + JSON.stringify(problem) + " (expected shown: " + verdict.expected + ")");
      break;
    }

    // (2) a wrong answer must fail. Build a wrong input appropriate to the input mode.
    let wrongInput;
    if (technique.id === "day-of-week") {
      const idx = weekdayNames.indexOf(correctInput);
      wrongInput = weekdayNames[(idx + 1) % 7];
    } else if (technique.id.indexOf("divisible-by-") === 0) {
      wrongInput = correctInput === "yes" ? "no" : "yes";
    } else if (technique.id === "phonetic-code") {
      // append an extra DISTINCT consonant sound so the decoded sequence really differs.
      // last sound is phoneticSampleSound[last digit]; pick an extra letter that is not that sound.
      const lastDigit = Number(problem.sequence[problem.sequence.length - 1]);
      const extra = lastDigit === 3 ? "p" : "m"; // m=3, p=9 — distinct from most; avoid matching last sound
      wrongInput = phoneticWordFor(problem.sequence) + "a" + extra;
    } else if (technique.inputMode === "number" && technique.id !== "estimate-multiplication" && technique.id !== "estimate-square-root" && technique.id !== "tips" && technique.id !== "sales-tax" && technique.id !== "rule-of-70") {
      wrongInput = String(parseFloat(correctInput) + 1);
    } else if (technique.id === "estimate-multiplication" || technique.id === "estimate-square-root") {
      wrongInput = String(parseFloat(truthFor[technique.id](problem)) * 2 + 1000); // far outside tolerance
    } else if (technique.id === "tips" || technique.id === "sales-tax") {
      wrongInput = String(parseFloat(truthFor[technique.id](problem)) + 5);
    } else if (technique.id === "rule-of-70") {
      wrongInput = String(parseFloat(truthFor[technique.id](problem)) + 10);
    } else if (technique.id === "fraction-to-decimal") {
      wrongInput = "0.99999";
    } else if (technique.inputMode === "text") {
      wrongInput = "999999 r 999"; // for division-style text answers
    } else {
      wrongInput = correctInput + "0";
    }
    let wrongVerdict;
    try { wrongVerdict = technique.checkAnswer(problem, wrongInput); } catch (e) { failures.push(technique.id + ": checkAnswer threw on wrong input: " + e.message); break; }
    if (wrongVerdict.correct) {
      failures.push(technique.id + ": ACCEPTED wrong answer '" + wrongInput + "' for problem " + JSON.stringify(problem));
      break;
    }
  }
});

if (failures.length === 0) {
  console.log("PASS - all " + techniques.length + " techniques verified over " + ITER + " trials each.");
  process.exit(0);
} else {
  console.log("FAIL - " + failures.length + " issue(s):");
  failures.forEach(function (f) { console.log("  - " + f); });
  process.exit(1);
}
