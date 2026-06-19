// The single source of truth for every technique page.
// Each entry is emitted (with the shared engine + theme) as one standalone HTML file.
// Per-page functions (makeProblem/promptHtml/checkAnswer/solutionSteps) are serialized verbatim
// via Function.prototype.toString and reference a page-global `H` injected by the helpers source.
// Static data (teachSteps, strings) is serialized as JSON; a few teachSteps call H.* eagerly at
// build time, so `H` is bound here to the Node-evaluated helpers.

const { helpers } = require("./techniques-helpers.js");
const H = helpers; // used by eager teachSteps (e.g. the divisibility factory)

// ---------------------------------------------------------------------------
// Techniques. Order here defines order in the dashboard within each chapter.
// ---------------------------------------------------------------------------
const techniques = [
  // ===================== CHAPTER 1 =====================
  {
    id: "left-to-right-addition",
    title: "Left-to-Right Addition",
    chapter: 1,
    chapterTitle: "Mental Addition & Subtraction",
    oneLine: "Add big numbers the natural way — hundreds first, then tens, then ones.",
    covers: "2-and-3-digit addition, done left to right instead of the schoolbook right-to-left way.",
    inputMode: "number",
    inputHint: "Type the total and press Enter.",
    teachSteps: [
      { text: "Take <b>538 + 327</b>. Forget the right-to-left method. Start at the <i>left</i> and break the second number into its parts." },
      { text: "Add the hundreds first:", math: "538 + 300 = 838" },
      { text: "Add the tens to that running total:", math: "838 + 20 = 858" },
      { text: "Add the ones last:", math: "858 + 7 = 865" },
      { text: "Done — <b>865</b>. You always hold just one running number in your head, and you hear the answer from the big end first, the way you say it out loud." },
      { text: "Shortcut for a number near a round one: to add 496, add 500 and take back 4.", math: "759 + 496 = 759 + 500 - 4 = 1255" },
    ],
    makeProblem: function () {
      const threeDigit = H.randInt(0, 1) === 1;
      const a = threeDigit ? H.randInt(120, 899) : H.randInt(15, 89);
      const b = threeDigit ? H.randInt(110, 880) : H.randInt(15, 89);
      return { a: a, b: b };
    },
    promptHtml: function (p) { return p.a + " <span class='op'>+</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a + p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const steps = [];
      let running = p.a;
      const parts = [];
      const bDigits = String(p.b).split("");
      const places = bDigits.length;
      for (let i = 0; i < places; i += 1) {
        const placeValue = Number(bDigits[i]) * Math.pow(10, places - 1 - i);
        if (placeValue === 0) continue;
        parts.push(placeValue);
      }
      steps.push({ text: "Start from " + p.a + " and add " + p.b + " piece by piece, biggest place first." });
      parts.forEach(function (placeValue) {
        const next = running + placeValue;
        steps.push({ math: running + " + " + placeValue + " = " + next });
        running = next;
      });
      steps.push({ text: "Answer:", math: String(p.a + p.b) });
      return steps;
    },
  },
  {
    id: "left-to-right-subtraction",
    title: "Left-to-Right Subtraction",
    chapter: 1,
    chapterTitle: "Mental Addition & Subtraction",
    oneLine: "Subtract from the left; when it gets awkward, over-subtract a round number and give some back.",
    covers: "2-and-3-digit subtraction, including the borrow-dodging trick of rounding the number being subtracted.",
    inputMode: "number",
    inputHint: "Type the difference and press Enter.",
    teachSteps: [
      { text: "Easy case first: <b>86 - 25</b>. Subtract the tens, then the ones." },
      { math: "86 - 20 = 66\n66 - 5 = 61" },
      { text: "Now the awkward case: <b>86 - 29</b>. The ones would force a borrow. Instead, subtract a round 30..." },
      { math: "86 - 30 = 56" },
      { text: "...then give back the 1 you over-subtracted (30 instead of 29):", math: "56 + 1 = 57" },
      { text: "Same idea for 3 digits: <b>747 - 598</b> becomes subtract 600, give back 2.", math: "747 - 600 = 147\n147 + 2 = 149" },
    ],
    makeProblem: function () {
      const threeDigit = H.randInt(0, 1) === 1;
      if (threeDigit) {
        const a = H.randInt(400, 980);
        const b = H.randInt(110, a - 40);
        return { a: a, b: b };
      }
      const a = H.randInt(40, 98);
      const b = H.randInt(12, a - 5);
      return { a: a, b: b };
    },
    promptHtml: function (p) { return p.a + " <span class='op'>-</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a - p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const place = p.b >= 100 ? 100 : 10;
      const rounded = Math.ceil(p.b / place) * place;
      const giveBack = rounded - p.b;
      const afterRound = p.a - rounded;
      if (giveBack === 0) {
        return [
          { text: "No borrow needed — subtract directly." },
          { math: p.a + " - " + p.b + " = " + (p.a - p.b) },
        ];
      }
      return [
        { text: "Round " + p.b + " up to " + rounded + " (a friendlier number to subtract)." },
        { math: p.a + " - " + rounded + " = " + afterRound },
        { text: "You took away " + giveBack + " too much, so add it back:" },
        { math: afterRound + " + " + giveBack + " = " + (p.a - p.b) },
      ];
    },
  },
  {
    id: "complements",
    title: "Complements",
    chapter: 1,
    chapterTitle: "Mental Addition & Subtraction",
    oneLine: "Find what a 2-digit number needs to reach 100: tens make 9, ones make 10.",
    covers: "The complement-to-100 of any 2-digit number — the engine behind the rounding subtraction trick.",
    inputMode: "number",
    inputHint: "Type the number that adds up to 100.",
    teachSteps: [
      { text: "The <b>complement</b> of a number is how far it is from 100. They power the subtraction shortcut, so they are worth making automatic." },
      { text: "Rule: the two tens digits add to <b>9</b>, the two ones digits add to <b>10</b>." },
      { text: "Complement of <b>37</b>: tens digit 3 needs 6 (to make 9), ones digit 7 needs 3 (to make 10)." },
      { math: "37  ->  63        (37 + 63 = 100)" },
      { text: "One catch: if the number ends in 0, the ones are already done. Complement of 80 is 20, not 2-and-something.", math: "80  ->  20" },
    ],
    makeProblem: function () { return { n: H.randInt(2, 99) }; },
    promptHtml: function (p) { return "100 <span class='op'>-</span> " + p.n; },
    checkAnswer: function (p, raw) { const expected = 100 - p.n; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const tens = Math.floor(p.n / 10);
      const ones = p.n % 10;
      if (ones === 0) {
        return [
          { text: p.n + " ends in 0, so the complement is just " + (100 - p.n) + "." },
          { math: "100 - " + p.n + " = " + (100 - p.n) },
        ];
      }
      return [
        { text: "Tens digit " + tens + " plus " + (9 - tens) + " makes 9. Ones digit " + ones + " plus " + (10 - ones) + " makes 10." },
        { math: (9 - tens) + "" + (10 - ones) + "  =  " + (100 - p.n) },
        { text: "Check:", math: p.n + " + " + (100 - p.n) + " = 100" },
      ];
    },
  },

  // ===================== CHAPTER 2 =====================
  {
    id: "multiply-by-11",
    title: "Multiplying by 11",
    chapter: 2,
    chapterTitle: "Basic Multiplication",
    oneLine: "Split the two digits apart and drop their sum in the middle.",
    covers: "Any 2-digit number times 11.",
    inputMode: "number",
    inputHint: "Type the product of the number and 11.",
    teachSteps: [
      { text: "To multiply a 2-digit number by 11, pull its digits apart and put their sum in the gap." },
      { text: "<b>53 × 11</b>: the digits are 5 and 3. Their sum is 8. Slot it between them." },
      { math: "5 _ 3  ->  5 (5+3) 3  =  583" },
      { text: "When the digit sum is 10 or more, carry the 1 into the left digit. <b>85 × 11</b>: 8 + 5 = 13." },
      { math: "8 (13) 5  ->  carry the 1:  9 3 5  =  935" },
    ],
    makeProblem: function () { return { n: H.randInt(10, 99) }; },
    promptHtml: function (p) { return p.n + " <span class='op'>×</span> 11"; },
    checkAnswer: function (p, raw) { const expected = p.n * 11; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const a = Math.floor(p.n / 10);
      const b = p.n % 10;
      const sum = a + b;
      if (sum < 10) {
        return [
          { text: "Digits " + a + " and " + b + " sum to " + sum + ". Drop it in the middle." },
          { math: a + " " + sum + " " + b + "  =  " + (p.n * 11) },
        ];
      }
      return [
        { text: "Digits " + a + " and " + b + " sum to " + sum + " (two digits), so carry the 1." },
        { math: a + " (" + sum + ") " + b + "  ->  " + (a + 1) + " " + (sum - 10) + " " + b + "  =  " + (p.n * 11) },
      ];
    },
  },
  {
    id: "squaring-ending-in-5",
    title: "Squaring Numbers Ending in 5",
    chapter: 2,
    chapterTitle: "Basic Multiplication",
    oneLine: "Multiply the lead digit by the next one up, then tack on 25.",
    covers: "Squaring any 2-digit number ending in 5 (15, 25, ... 95).",
    inputMode: "number",
    inputHint: "Type the square.",
    teachSteps: [
      { text: "Squares ending in 5 are the easiest squares there are. The answer always ends in <b>25</b>." },
      { text: "For the front of the answer, take the first digit and multiply it by the <i>next</i> digit up." },
      { text: "<b>35²</b>: first digit 3, next digit up is 4." },
      { math: "3 × 4 = 12   ->   write 12, then 25   ->   1225" },
      { text: "<b>85²</b>: 8 × 9 = 72, then 25.", math: "8 × 9 = 72  ->  7225" },
    ],
    makeProblem: function () { const tens = H.randInt(1, 9); return { n: tens * 10 + 5 }; },
    promptHtml: function (p) { return p.n + "<span class='op'>²</span>"; },
    checkAnswer: function (p, raw) { const expected = p.n * p.n; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const d = Math.floor(p.n / 10);
      return [
        { text: "First digit is " + d + ". Multiply by the next number up, " + (d + 1) + "." },
        { math: d + " × " + (d + 1) + " = " + (d * (d + 1)) },
        { text: "Append 25:", math: (d * (d + 1)) + " | 25  =  " + (p.n * p.n) },
      ];
    },
  },
  {
    id: "squaring-two-digit",
    title: "Squaring Any 2-Digit Number",
    chapter: 2,
    chapterTitle: "Basic Multiplication",
    oneLine: "Round to the nearest 10, multiply the pair, then add the square of how far you moved.",
    covers: "Squaring any 2-digit number using the difference-of-squares shortcut.",
    inputMode: "number",
    inputHint: "Type the square.",
    teachSteps: [
      { text: "To square a number, round it to the nearest 10. Whatever you add to one side, subtract from the other, so you multiply an easy pair." },
      { text: "<b>41²</b>: round down to 40. You went down 1, so go up 1 to 42. Multiply that easy pair." },
      { math: "40 × 42 = 1680" },
      { text: "That pair is always short by the square of the distance you moved. Here the distance was 1, so add 1²." },
      { math: "1680 + 1² = 1680 + 1 = 1681" },
      { text: "<b>77²</b>: round up to 80, down to 74, distance 3.", math: "80 × 74 = 5920\n5920 + 3² = 5920 + 9 = 5929" },
      { text: "Why it works: (A−d)(A+d) = A² − d², so A² = (A−d)(A+d) + d²." },
    ],
    makeProblem: function () { let n = H.randInt(11, 99); if (n % 10 === 5) n += 1; return { n: n }; },
    promptHtml: function (p) { return p.n + "<span class='op'>²</span>"; },
    checkAnswer: function (p, raw) { const expected = p.n * p.n; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const ones = p.n % 10;
      const d = ones <= 5 ? ones : 10 - ones;
      const low = p.n - d;
      const high = p.n + d;
      return [
        { text: "Round to " + (ones <= 5 ? "down" : "up") + " to " + (ones <= 5 ? low : high) + "; the partner is " + (ones <= 5 ? high : low) + " (distance " + d + ")." },
        { math: low + " × " + high + " = " + (low * high) },
        { text: "Add the square of the distance, " + d + "² = " + (d * d) + ":" },
        { math: (low * high) + " + " + (d * d) + " = " + (p.n * p.n) },
      ];
    },
  },
  {
    id: "two-by-one",
    title: "2-by-1 Multiplication",
    chapter: 2,
    chapterTitle: "Basic Multiplication",
    oneLine: "Multiply the tens, multiply the ones, add the two left to right.",
    covers: "Any 2-digit number times a 1-digit number.",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "Break the 2-digit number into tens and ones, multiply each by the single digit, and add." },
      { text: "<b>42 × 7</b>: split 42 into 40 and 2." },
      { math: "40 × 7 = 280\n 2 × 7 = 14" },
      { text: "Add them (left to right):", math: "280 + 14 = 294" },
      { text: "If the number ends in 8 or 9, round up instead. <b>69 × 6</b>: do 70 × 6, then subtract 1 × 6.", math: "70 × 6 = 420\n420 - 6 = 414" },
    ],
    makeProblem: function () { return { a: H.randInt(13, 99), b: H.randInt(3, 9) }; },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const tens = Math.floor(p.a / 10) * 10;
      const ones = p.a % 10;
      return [
        { text: "Split " + p.a + " into " + tens + " and " + ones + "." },
        { math: tens + " × " + p.b + " = " + (tens * p.b) + "\n" + ones + " × " + p.b + " = " + (ones * p.b) },
        { text: "Add:", math: (tens * p.b) + " + " + (ones * p.b) + " = " + (p.a * p.b) },
      ];
    },
  },
  {
    id: "three-by-one",
    title: "3-by-1 Multiplication",
    chapter: 2,
    chapterTitle: "Basic Multiplication",
    oneLine: "Hundreds, tens, ones — multiply each by the digit and add as you go.",
    covers: "Any 3-digit number times a 1-digit number.",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "Same idea as 2-by-1, with one more place. Break into hundreds, tens, ones." },
      { text: "<b>326 × 7</b>:" },
      { math: "300 × 7 = 2100\n 20 × 7 =  140   ->  2100 + 140 = 2240" },
      { text: "Hold 2240, then add the ones product:", math: "6 × 7 = 42\n2240 + 42 = 2282" },
      { text: "Adding left to right means you can start saying the answer (“twenty-two hundred...”) before you finish." },
    ],
    makeProblem: function () { return { a: H.randInt(110, 989), b: H.randInt(3, 9) }; },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const h = Math.floor(p.a / 100) * 100;
      const t = Math.floor((p.a % 100) / 10) * 10;
      const o = p.a % 10;
      const afterH = h * p.b;
      const afterT = afterH + t * p.b;
      return [
        { text: "Break " + p.a + " into " + h + " + " + t + " + " + o + "." },
        { math: h + " × " + p.b + " = " + afterH },
        { math: "+ " + t + " × " + p.b + " = " + (t * p.b) + "   ->   " + afterT },
        { math: "+ " + o + " × " + p.b + " = " + (o * p.b) + "   ->   " + (p.a * p.b) },
      ];
    },
  },

  // ===================== CHAPTER 3 =====================
  {
    id: "two-by-two-addition",
    title: "2-by-2: Addition Method",
    chapter: 3,
    chapterTitle: "Intermediate Multiplication",
    oneLine: "Split one number into tens and ones, multiply each by the whole other number, add.",
    covers: "Any 2-digit by 2-digit product — the workhorse method.",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "Break <i>one</i> of the numbers into tens and ones — pick the one with the smaller ones digit. Keep the other number whole." },
      { text: "<b>46 × 42</b>: split 42 into 40 + 2, keep 46 whole." },
      { math: "40 × 46 = 1840\n 2 × 46 =   92" },
      { text: "Add the two products:", math: "1840 + 92 = 1932" },
      { text: "That is the whole method: two easy 2-by-1 multiplications and one addition." },
    ],
    makeProblem: function () { return { a: H.randInt(11, 99), b: H.randInt(11, 99) }; },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const split = (p.a % 10) <= (p.b % 10) ? p.a : p.b;
      const whole = split === p.a ? p.b : p.a;
      const tens = Math.floor(split / 10) * 10;
      const ones = split % 10;
      return [
        { text: "Split " + split + " into " + tens + " + " + ones + "; keep " + whole + " whole." },
        { math: tens + " × " + whole + " = " + (tens * whole) + "\n" + ones + " × " + whole + " = " + (ones * whole) },
        { text: "Add:", math: (tens * whole) + " + " + (ones * whole) + " = " + (p.a * p.b) },
      ];
    },
  },
  {
    id: "two-by-two-subtraction",
    title: "2-by-2: Subtraction Method",
    chapter: 3,
    chapterTitle: "Intermediate Multiplication",
    oneLine: "When a number ends in 8 or 9, round it up, multiply, then subtract the overshoot.",
    covers: "2-by-2 products where one number ends in 8 or 9 (or is in the high 90s).",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "When one number ends in 8 or 9, rounding it up turns the problem into something much easier." },
      { text: "<b>89 × 72</b>: round 89 up to 90." },
      { math: "90 × 72 = 6480" },
      { text: "You used 90 instead of 89, i.e. one extra 72. Subtract it back:" },
      { math: "6480 - 72 = 6408" },
      { text: "<b>98 × 47</b>: round to 100, subtract two 47s.", math: "100 × 47 = 4700\n4700 - 94 = 4606" },
    ],
    makeProblem: function () {
      const endIn89 = H.pick([8, 9]);
      const tens = H.randInt(1, 9);
      const a = tens * 10 + endIn89;
      const b = H.randInt(12, 99);
      return { a: a, b: b };
    },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const rounded = Math.ceil(p.a / 10) * 10;
      const over = rounded - p.a;
      return [
        { text: "Round " + p.a + " up to " + rounded + "." },
        { math: rounded + " × " + p.b + " = " + (rounded * p.b) },
        { text: "You added " + over + " extra " + (over === 1 ? "copy" : "copies") + " of " + p.b + ". Subtract " + over + " × " + p.b + " = " + (over * p.b) + ":" },
        { math: (rounded * p.b) + " - " + (over * p.b) + " = " + (p.a * p.b) },
      ];
    },
  },
  {
    id: "two-by-two-factoring",
    title: "2-by-2: Factoring Method",
    chapter: 3,
    chapterTitle: "Intermediate Multiplication",
    oneLine: "Break one number into single-digit factors, then multiply in a chain.",
    covers: "2-by-2 products where one number factors into small pieces (e.g. 42 = 7×6).",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "If one number splits into single-digit factors, you can avoid adding anything — just multiply in a chain." },
      { text: "<b>46 × 42</b>: factor 42 = 7 × 6." },
      { math: "46 × 7 = 322" },
      { text: "Now multiply that by the other factor:", math: "322 × 6 = 1932" },
      { text: "No partial products to add. Pick the factoring that gives a round-ish middle number when you can." },
    ],
    makeProblem: function () {
      // pick a factorable 2-digit number with two single-digit factors
      const factorables = [12, 14, 15, 16, 18, 21, 24, 27, 28, 32, 35, 36, 42, 45, 48, 49, 54, 56, 63, 64, 72, 81];
      const a = H.pick(factorables);
      const b = H.randInt(12, 99);
      return { a: a, b: b };
    },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      let f1 = 1;
      for (let d = 9; d >= 2; d -= 1) { if (p.a % d === 0 && p.a / d <= 9 && p.a / d >= 2) { f1 = d; break; } }
      const f2 = p.a / f1;
      return [
        { text: "Factor " + p.a + " = " + f1 + " × " + f2 + "." },
        { math: p.b + " × " + f1 + " = " + (p.b * f1) },
        { math: (p.b * f1) + " × " + f2 + " = " + (p.a * p.b) },
      ];
    },
  },
  {
    id: "two-digit-cubing",
    title: "Cubing a 2-Digit Number",
    chapter: 3,
    chapterTitle: "Intermediate Multiplication",
    oneLine: "Use A³ = (A−d)·A·(A+d) + d²·A, rounding to the nearest 10.",
    covers: "Cubing any 2-digit number.",
    inputMode: "number",
    inputHint: "Type the cube.",
    teachSteps: [
      { text: "Cubing reuses the squaring trick. Round to the nearest 10 to get a distance d, then use a tidy formula." },
      { text: "<b>13³</b>: round to 10 and 16 (distance d = 3). The formula is (A−d) × A × (A+d) + d² × A." },
      { math: "10 × 13 × 16  +  3² × 13" },
      { text: "Work the first part:", math: "13 × 16 = 208,  then 10 × 208 = 2080" },
      { text: "Then the correction:", math: "9 × 13 = 117\n2080 + 117 = 2197" },
    ],
    makeProblem: function () { return { n: H.randInt(11, 39) }; },
    promptHtml: function (p) { return p.n + "<span class='op'>³</span>"; },
    checkAnswer: function (p, raw) { const expected = p.n * p.n * p.n; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const ones = p.n % 10;
      const d = ones <= 5 ? ones : 10 - ones;
      const low = p.n - d;
      const high = p.n + d;
      const triple = low * p.n * high;
      const corr = d * d * p.n;
      return [
        { text: "Round to " + low + " and " + high + " (distance " + d + "). Use (A−d)·A·(A+d) + d²·A." },
        { math: low + " × " + p.n + " × " + high + " = " + triple },
        { math: d + "² × " + p.n + " = " + corr },
        { math: triple + " + " + corr + " = " + (p.n * p.n * p.n) },
      ];
    },
  },

  // ===================== CHAPTER 4 =====================
  {
    id: "one-digit-division",
    title: "Division by One Digit",
    chapter: 4,
    chapterTitle: "Mental Division",
    oneLine: "Long division done left to right, taking the biggest easy chunk each time.",
    covers: "Dividing a 2-to-4-digit number by a single digit, with a remainder.",
    inputMode: "text",
    inputHint: "Type as  quotient r remainder  (e.g.  84 r 3).",
    teachSteps: [
      { text: "Mental division goes left to right, grabbing the biggest round chunk you can at each step." },
      { text: "<b>675 ÷ 8</b>. The answer is in the 80s, since 8×80 = 640 fits but 8×100 = 800 is too big." },
      { math: "8 × 80 = 640    ->    say “80”\n675 - 640 = 35" },
      { text: "Now divide the leftover 35 by 8:", math: "8 × 4 = 32    ->    “4”, remainder 35 - 32 = 3" },
      { text: "Put it together:", math: "675 ÷ 8 = 84 remainder 3" },
    ],
    makeProblem: function () { const b = H.randInt(3, 9); const q = H.randInt(12, 320); const r = H.randInt(0, b - 1); return { b: b, a: q * b + r, q: q, r: r }; },
    promptHtml: function (p) { return p.a + " <span class='op'>÷</span> " + p.b; },
    checkAnswer: function (p, raw) {
      const expected = p.q + " r " + p.r;
      const normalized = String(raw).toLowerCase().replace(/remainder|rem|,/g, "r").replace(/\s+/g, " ").trim();
      const match = normalized.match(/^(\d+)\s*(?:r\s*(\d+))?$/);
      let ok = false;
      if (match) { const q = parseInt(match[1], 10); const r = match[2] === undefined ? 0 : parseInt(match[2], 10); ok = q === p.q && r === p.r; }
      return { correct: ok, expected: expected };
    },
    solutionSteps: function (p) {
      const steps = [{ text: "Find the biggest chunk of " + p.b + "×(round number) under " + p.a + "." }];
      let remaining = p.a;
      let quotient = 0;
      let place = 1;
      while (p.b * place * 10 <= remaining) place *= 10;
      while (place >= 1) {
        const digit = Math.floor(remaining / (p.b * place));
        if (digit > 0) {
          const chunk = digit * place * p.b;
          steps.push({ math: p.b + " × " + (digit * place) + " = " + chunk + "   ->   " + remaining + " - " + chunk + " = " + (remaining - chunk) });
          remaining -= chunk;
          quotient += digit * place;
        }
        place = Math.floor(place / 10);
      }
      steps.push({ text: "Answer:", math: p.q + " r " + p.r });
      return steps;
    },
  },
  {
    id: "two-digit-division",
    title: "Division by Two Digits",
    chapter: 4,
    chapterTitle: "Mental Division",
    oneLine: "Guess the lead digit from the divisor times tens, subtract, repeat.",
    covers: "Dividing by a 2-digit divisor, with a remainder.",
    inputMode: "text",
    inputHint: "Type as  quotient r remainder  (e.g.  42 r 9).",
    teachSteps: [
      { text: "With a 2-digit divisor, estimate the lead digit, multiply, subtract, then handle the leftover." },
      { text: "<b>597 ÷ 14</b>. Answer is two digits (14×10 = 140 fits, 14×100 too big). Try the tens: 14×40 = 560." },
      { math: "14 × 40 = 560    ->    “40”\n597 - 560 = 37" },
      { text: "Now 37 ÷ 14:", math: "14 × 2 = 28    ->    “2”, remainder 37 - 28 = 9" },
      { text: "Answer:", math: "597 ÷ 14 = 42 remainder 9" },
    ],
    makeProblem: function () { const b = H.randInt(12, 49); const q = H.randInt(11, 99); const r = H.randInt(0, b - 1); return { b: b, a: q * b + r, q: q, r: r }; },
    promptHtml: function (p) { return p.a + " <span class='op'>÷</span> " + p.b; },
    checkAnswer: function (p, raw) {
      const expected = p.q + " r " + p.r;
      const normalized = String(raw).toLowerCase().replace(/remainder|rem|,/g, "r").replace(/\s+/g, " ").trim();
      const match = normalized.match(/^(\d+)\s*(?:r\s*(\d+))?$/);
      let ok = false;
      if (match) { const q = parseInt(match[1], 10); const r = match[2] === undefined ? 0 : parseInt(match[2], 10); ok = q === p.q && r === p.r; }
      return { correct: ok, expected: expected };
    },
    solutionSteps: function (p) {
      const tensDigit = Math.floor(p.q / 10);
      const onesDigit = p.q % 10;
      const steps = [{ text: "Estimate the tens of the quotient first." }];
      if (tensDigit > 0) {
        const chunk = p.b * tensDigit * 10;
        steps.push({ math: p.b + " × " + (tensDigit * 10) + " = " + chunk + "   ->   " + p.a + " - " + chunk + " = " + (p.a - chunk) });
      }
      const afterTens = p.a - p.b * tensDigit * 10;
      steps.push({ math: p.b + " × " + onesDigit + " = " + (p.b * onesDigit) + "   ->   " + afterTens + " - " + (p.b * onesDigit) + " = " + p.r });
      steps.push({ text: "Answer:", math: p.q + " r " + p.r });
      return steps;
    },
  },
  {
    id: "fraction-to-decimal",
    title: "Fractions to Decimals",
    chapter: 4,
    chapterTitle: "Mental Division",
    oneLine: "Memorize the one-digit denominators — especially the 1/7 cycle 142857.",
    covers: "Converting a fraction with a small denominator to its decimal form.",
    inputMode: "text",
    inputHint: "Type the decimal (e.g. 0.625). Repeating decimals: give the first 6 digits.",
    teachSteps: [
      { text: "Common fractions are worth knowing cold. Halves, fourths, fifths, eighths terminate; thirds, sixths, ninths repeat one digit." },
      { math: "1/8 = 0.125     3/8 = 0.375     5/8 = 0.625\n1/9 = 0.1111...  4/9 = 0.4444..." },
      { text: "The star is sevenths. 1/7 = 0.<b>142857</b> repeating — and every other seventh is the same six digits rotated." },
      { math: "1/7 = .142857   2/7 = .285714   3/7 = .428571 ..." },
      { text: "To find which rotation, multiply 0.14 by the numerator and start the cycle near that value. 3/7: 0.14×3 ≈ .42, so start at 4: .428571." },
    ],
    makeProblem: function () {
      const choices = [
        { n: 1, d: 8 }, { n: 3, d: 8 }, { n: 5, d: 8 }, { n: 7, d: 8 },
        { n: 1, d: 4 }, { n: 3, d: 4 }, { n: 1, d: 5 }, { n: 2, d: 5 }, { n: 3, d: 5 }, { n: 4, d: 5 },
        { n: 1, d: 2 }, { n: 1, d: 7 }, { n: 2, d: 7 }, { n: 3, d: 7 }, { n: 4, d: 7 }, { n: 5, d: 7 }, { n: 6, d: 7 },
        { n: 1, d: 3 }, { n: 2, d: 3 }, { n: 1, d: 9 }, { n: 2, d: 9 }, { n: 4, d: 9 }, { n: 5, d: 9 },
      ];
      return H.pick(choices);
    },
    promptHtml: function (p) { return p.n + " <span class='op'>/</span> " + p.d + "<small>as a decimal</small>"; },
    checkAnswer: function (p, raw) {
      const value = p.n / p.d;
      const expectedExact = (function () {
        if (p.d === 7) { const cyc = "142857"; const start = (p.n * 142857 / 7) % 1000000; return "0." + String(Math.round(start)).padStart(6, "0").slice(0, 6) + "..."; }
        if (p.d === 3 || p.d === 9) { return "0." + String(value).slice(2, 8) + "..."; }
        return String(value);
      })();
      const cleaned = String(raw).replace(/\s|\.\.\.|repeating|rep/gi, "").replace(/^\./, "0.");
      const numeric = parseFloat(cleaned);
      let ok;
      if (p.d === 7 || p.d === 3 || p.d === 9) {
        const digitsTyped = cleaned.replace(/^0?\./, "").slice(0, 4);
        const trueDigits = value.toFixed(10).replace(/^0\./, "").slice(0, 4);
        ok = digitsTyped === trueDigits;
      } else {
        ok = Math.abs(numeric - value) < 0.0005;
      }
      return { correct: ok, expected: expectedExact };
    },
    solutionSteps: function (p) {
      if (p.d === 7) {
        const value = p.n / p.d;
        return [
          { text: "Sevenths cycle through 142857. Multiply 0.14 by " + p.n + " to find where to start." },
          { math: "0.14 × " + p.n + " ≈ 0." + String(Math.round(0.14 * p.n * 100)).padStart(2, "0") },
          { text: p.n + "/7 =", math: "0." + value.toFixed(8).replace(/^0\./, "").slice(0, 6) + "..." },
        ];
      }
      if (p.d === 3 || p.d === 9) {
        const value = p.n / p.d;
        return [
          { text: (p.d === 9 ? "Ninths repeat the numerator digit." : "Thirds repeat 3's and 6's.") },
          { math: p.n + "/" + p.d + " = 0." + value.toFixed(8).replace(/^0\./, "").slice(0, 6) + "..." },
        ];
      }
      return [
        { text: "This is a terminating decimal worth memorizing." },
        { math: p.n + "/" + p.d + " = " + (p.n / p.d) },
      ];
    },
  },

  // ----- Divisibility tests (Chapter 4) -----
  divisibilityTechnique({
    id: "divisible-by-3",
    title: "Divisibility by 3",
    oneLine: "A number divides by 3 exactly when its digit sum does.",
    divisor: 3,
    rule: "Add up all the digits. If that sum is a multiple of 3, so is the number.",
    example: { n: 57852, note: "5+7+8+5+2 = 27, and 27 is 3×9." },
  }),
  divisibilityTechnique({
    id: "divisible-by-9",
    title: "Divisibility by 9",
    oneLine: "A number divides by 9 exactly when its digit sum does.",
    divisor: 9,
    rule: "Add up all the digits. If that sum is a multiple of 9, so is the number. (Keep summing if needed.)",
    example: { n: 57852, note: "5+7+8+5+2 = 27, and 27 is 9×3." },
  }),
  divisibilityTechnique({
    id: "divisible-by-2",
    title: "Divisibility by 2",
    oneLine: "Even last digit, even number.",
    divisor: 2,
    rule: "Look only at the last digit. If it is 0, 2, 4, 6, or 8, the number is even.",
    example: { n: 53428, note: "Ends in 8, so it is divisible by 2." },
  }),
  divisibilityTechnique({
    id: "divisible-by-4",
    title: "Divisibility by 4",
    oneLine: "Check just the last two digits.",
    divisor: 4,
    rule: "If the last two digits form a number divisible by 4, the whole number is. (100 is a multiple of 4, so everything above the last two digits is automatically fine.)",
    example: { n: 57852, note: "Last two digits 52 = 4×13, so yes." },
  }),
  divisibilityTechnique({
    id: "divisible-by-8",
    title: "Divisibility by 8",
    oneLine: "Check just the last three digits.",
    divisor: 8,
    rule: "If the last three digits form a number divisible by 8, the whole number is. (1000 is a multiple of 8.)",
    example: { n: 14916, note: "Last three digits 916 = 8×114.5, not whole — so no." },
  }),
  divisibilityTechnique({
    id: "divisible-by-5",
    title: "Divisibility by 5",
    oneLine: "Last digit 0 or 5.",
    divisor: 5,
    rule: "Look only at the last digit. If it is 0 or 5, the number is divisible by 5.",
    example: { n: 47830, note: "Ends in 0, so yes." },
  }),
  divisibilityTechnique({
    id: "divisible-by-6",
    title: "Divisibility by 6",
    oneLine: "Must pass both the 2 test and the 3 test.",
    divisor: 6,
    rule: "6 = 2 × 3. The number must be even AND have a digit sum divisible by 3.",
    example: { n: 5334, note: "Even, and 5+3+3+4 = 15 is divisible by 3 — so yes." },
  }),
  divisibilityTechnique({
    id: "divisible-by-11",
    title: "Divisibility by 11",
    oneLine: "Alternately add and subtract the digits; check the result.",
    divisor: 11,
    rule: "From the right, alternately subtract and add digits. If the result is 0 or a multiple of 11, so is the number.",
    example: { n: 8492, note: "8 - 4 + 9 - 2 = 11, which is divisible by 11 — so yes." },
  }),

  // ===================== CHAPTER 5 =====================
  {
    id: "estimate-multiplication",
    title: "Guesstimating Products",
    chapter: 5,
    chapterTitle: "The Art of Guesstimation",
    oneLine: "Round one number up and the other down, multiply the easy pair.",
    covers: "Quick approximate products — answers judged by how close, not exact.",
    inputMode: "number",
    inputHint: "Type your estimate — within 5% counts.",
    teachSteps: [
      { text: "For a fast product estimate, round the numbers in <i>opposite</i> directions — round one up and the other down, so the two errors partly cancel." },
      { text: "<b>88 × 54</b>: round 88 up to 90, and round 54 down to 50." },
      { math: "90 × 50 = 4500   (true answer 4752, about 5% low)" },
      { text: "Rounding one up and one down stays closer than rounding both the same way. Within a few percent is the goal." },
      { text: "For huge numbers, drop the zeros, multiply, then put the magnitude back: 29 million × 14 thousand ≈ 406 billion." },
    ],
    makeProblem: function () { return { a: H.randInt(31, 98), b: H.randInt(31, 98), exact: 0 }; },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b + "<small>estimate — within 5%</small>"; },
    checkAnswer: function (p, raw) {
      const exact = p.a * p.b;
      const guess = parseFloat(String(raw).replace(/[, ]/g, ""));
      const ok = isFinite(guess) && Math.abs(guess - exact) <= exact * 0.05;
      const pctOff = isFinite(guess) ? (Math.abs(guess - exact) / exact * 100).toFixed(1) : "?";
      return { correct: ok, expected: H.commas(exact), detail: "exact " + H.commas(exact) + "  -  you were " + pctOff + "% off" };
    },
    solutionSteps: function (p) {
      const aUp = Math.round(p.a / 10) * 10;
      const bDown = Math.round(p.b / 10) * 10;
      return [
        { text: "Round to easy tens in opposite directions, e.g. " + aUp + " and " + bDown + "." },
        { math: aUp + " × " + bDown + " = " + H.commas(aUp * bDown) },
        { text: "True answer:", math: H.commas(p.a * p.b) },
      ];
    },
  },
  {
    id: "estimate-square-root",
    title: "Estimating Square Roots",
    chapter: 5,
    chapterTitle: "The Art of Guesstimation",
    oneLine: "Guess from a nearby perfect square, divide, and average the two.",
    covers: "Approximating the square root of a number that is not a perfect square.",
    inputMode: "number",
    inputHint: "Type your estimate — within 2% counts.",
    teachSteps: [
      { text: "To estimate a square root, start from a perfect square you know, then refine by divide-and-average." },
      { text: "<b>√19</b>: 4² = 16 is close, so guess 4. Divide 19 by the guess." },
      { math: "19 ÷ 4 = 4.75" },
      { text: "Average the guess and the quotient — the true root is between them:" },
      { math: "(4 + 4.75) / 2 = 4.375    (true ≈ 4.359)" },
      { text: "One round of divide-and-average is usually within a percent. Do it again for more accuracy." },
    ],
    makeProblem: function () { let n = H.randInt(10, 990); const r = Math.sqrt(n); if (Number.isInteger(r)) n += 1; return { n: n }; },
    promptHtml: function (p) { return "√" + p.n + "<small>estimate — within 2%</small>"; },
    checkAnswer: function (p, raw) {
      const exact = Math.sqrt(p.n);
      const guess = parseFloat(String(raw).replace(/[, ]/g, ""));
      const ok = isFinite(guess) && Math.abs(guess - exact) <= exact * 0.02;
      const pctOff = isFinite(guess) ? (Math.abs(guess - exact) / exact * 100).toFixed(1) : "?";
      return { correct: ok, expected: exact.toFixed(3), detail: "exact " + exact.toFixed(3) + "  -  you were " + pctOff + "% off" };
    },
    solutionSteps: function (p) {
      const base = Math.floor(Math.sqrt(p.n));
      const quotient = p.n / base;
      const avg = (base + quotient) / 2;
      return [
        { text: "Nearest perfect square below is " + (base * base) + " = " + base + "². Guess " + base + "." },
        { math: p.n + " ÷ " + base + " = " + quotient.toFixed(3) },
        { math: "(" + base + " + " + quotient.toFixed(3) + ") / 2 = " + avg.toFixed(3) },
        { text: "True value:", math: Math.sqrt(p.n).toFixed(4) },
      ];
    },
  },
  {
    id: "tips",
    title: "Tips in Your Head",
    chapter: 5,
    chapterTitle: "The Art of Guesstimation",
    oneLine: "10% is a decimal shift; build 15%, 20%, 25% from it.",
    covers: "Restaurant tips at common percentages.",
    inputMode: "number",
    inputHint: "Type the tip in dollars (e.g. 6.30).",
    teachSteps: [
      { text: "Everything starts from <b>10%</b>: just move the decimal one place left. 10% of $42 is $4.20." },
      { text: "<b>20%</b> = double the 10%.", math: "$4.20 × 2 = $8.40" },
      { text: "<b>15%</b> = 10% plus half of it.", math: "$4.20 + $2.10 = $6.30" },
      { text: "<b>25%</b> = a quarter of the bill (halve it twice).", math: "$42 / 2 = $21,  $21 / 2 = $10.50" },
    ],
    makeProblem: function () { const bill = H.randInt(12, 240) + H.pick([0, 0.5, 0.25, 0.75]); const pct = H.pick([10, 15, 20, 25]); return { bill: Math.round(bill * 100) / 100, pct: pct }; },
    promptHtml: function (p) { return p.pct + "% <span class='op'>tip on</span> $" + p.bill.toFixed(2); },
    checkAnswer: function (p, raw) {
      const exact = Math.round(p.bill * p.pct) / 100;
      const guess = parseFloat(String(raw).replace(/[$, ]/g, ""));
      const ok = isFinite(guess) && Math.abs(guess - exact) <= 0.06;
      const off = isFinite(guess) ? "$" + Math.abs(guess - exact).toFixed(2) + " off" : "";
      return { correct: ok, expected: "$" + exact.toFixed(2), detail: "exact $" + exact.toFixed(2) + (off ? "  -  " + off : "") };
    },
    solutionSteps: function (p) {
      const ten = p.bill / 10;
      const steps = [{ text: "10% of $" + p.bill.toFixed(2) + " is $" + ten.toFixed(2) + "." }];
      if (p.pct === 10) steps.push({ math: "Tip = $" + ten.toFixed(2) });
      if (p.pct === 20) steps.push({ math: "Double it: $" + (ten * 2).toFixed(2) });
      if (p.pct === 15) steps.push({ math: "$" + ten.toFixed(2) + " + $" + (ten / 2).toFixed(2) + " = $" + (ten * 1.5).toFixed(2) });
      if (p.pct === 25) steps.push({ math: "Quarter of the bill: $" + (p.bill / 4).toFixed(2) });
      return steps;
    },
  },
  {
    id: "sales-tax",
    title: "Sales Tax in Your Head",
    chapter: 5,
    chapterTitle: "The Art of Guesstimation",
    oneLine: "Do the whole-percent part, then add the half/quarter-percent as cents.",
    covers: "Computing a sales-tax amount, including fractional rates like 6.5% or 7.25%.",
    inputMode: "number",
    inputHint: "Type the tax in dollars (e.g. 3.77).",
    teachSteps: [
      { text: "Split the rate. For <b>6.5% of $58</b>, do the 6% first." },
      { math: "58 × 6 = 348   ->   $3.48" },
      { text: "The extra 0.5% is half the dollar amount, read as cents:", math: "$58 / 2 = $29   ->   add 29¢" },
      { text: "Total:", math: "$3.48 + $0.29 = $3.77" },
      { text: "A 0.25% piece is a quarter of the amount in cents; 0.75% is three times that." },
    ],
    makeProblem: function () { const amount = H.randInt(20, 240); const rate = H.pick([5, 6, 6.5, 7, 7.25, 7.5, 8]); return { amount: amount, rate: rate }; },
    promptHtml: function (p) { return p.rate + "% <span class='op'>tax on</span> $" + p.amount; },
    checkAnswer: function (p, raw) {
      const exact = Math.round(p.amount * p.rate) / 100;
      const guess = parseFloat(String(raw).replace(/[$, ]/g, ""));
      const ok = isFinite(guess) && Math.abs(guess - exact) <= 0.02;
      const off = isFinite(guess) ? "$" + Math.abs(guess - exact).toFixed(2) + " off" : "";
      return { correct: ok, expected: "$" + exact.toFixed(2), detail: "exact $" + exact.toFixed(2) + (off ? "  -  " + off : "") };
    },
    solutionSteps: function (p) {
      const whole = Math.floor(p.rate);
      const frac = p.rate - whole;
      const wholeTax = p.amount * whole / 100;
      const steps = [{ text: whole + "% of $" + p.amount + ":" }, { math: p.amount + " × " + whole + " = " + (p.amount * whole) + "   ->   $" + wholeTax.toFixed(2) }];
      if (frac === 0.5) steps.push({ text: "Add 0.5% (half the amount, as cents):", math: "$" + (p.amount / 2).toFixed(2) + "  ->  +" + Math.round(p.amount / 2) + "¢" });
      if (frac === 0.25) steps.push({ text: "Add 0.25% (quarter of the amount, as cents):", math: "$" + (p.amount / 4).toFixed(2) + "  ->  +" + Math.round(p.amount / 4) + "¢" });
      steps.push({ text: "Total:", math: "$" + (Math.round(p.amount * p.rate) / 100).toFixed(2) });
      return steps;
    },
  },
  {
    id: "rule-of-70",
    title: "Rule of 70 (and 110)",
    chapter: 5,
    chapterTitle: "The Art of Guesstimation",
    oneLine: "Divide 70 by the interest rate for doubling time; 110 for tripling.",
    covers: "Estimating how long money takes to double or triple at a compound interest rate.",
    inputMode: "number",
    inputHint: "Type the number of years.",
    teachSteps: [
      { text: "Money growing at a steady percent doubles in about <b>70 ÷ rate</b> years." },
      { text: "At 5% a year:", math: "70 / 5 = 14 years to double" },
      { text: "To triple, use 110 instead of 70.", math: "110 / 5 = 22 years to triple" },
      { text: "These are close approximations to the real compound-interest answer, accurate enough for back-of-envelope planning." },
    ],
    makeProblem: function () { const rate = H.pick([2, 3, 4, 5, 6, 7, 8, 10]); const triple = H.randInt(0, 1) === 1; return { rate: rate, triple: triple }; },
    promptHtml: function (p) { return "Years to <span class='op'>" + (p.triple ? "triple" : "double") + "</span> at " + p.rate + "%<small>nearest whole year</small>"; },
    checkAnswer: function (p, raw) {
      const expected = Math.round((p.triple ? 110 : 70) / p.rate);
      const guess = parseFloat(String(raw).replace(/[, ]/g, ""));
      const ok = isFinite(guess) && Math.abs(guess - expected) <= 1;
      return { correct: ok, expected: String(expected) + " years" };
    },
    solutionSteps: function (p) {
      const base = p.triple ? 110 : 70;
      return [
        { text: "Divide " + base + " by the rate." },
        { math: base + " / " + p.rate + " = " + (base / p.rate).toFixed(1) + " years" },
      ];
    },
  },

  // ===================== CHAPTER 6 =====================
  {
    id: "casting-out-nines",
    title: "Casting Out Nines",
    chapter: 6,
    chapterTitle: "Pencil-and-Paper Math",
    oneLine: "Reduce each number to its digit-sum and check the arithmetic survives.",
    covers: "Checking an addition or multiplication by comparing single-digit “mod sums.”",
    inputMode: "number",
    inputHint: "Type the mod sum (a single digit 1–9).",
    teachSteps: [
      { text: "Casting out nines catches most arithmetic slips. The <b>mod sum</b> of a number is its digits added up, repeatedly, to one digit." },
      { math: "4328  ->  4+3+2+8 = 17  ->  1+7 = 8" },
      { text: "To check a sum: take the mod sum of each part, add those, reduce again. It should match the mod sum of the answer." },
      { math: "mod sums 8 + 2 + 8 + 1 = 19 -> 1   should equal mod sum of the total" },
      { text: "For multiplication, multiply the mod sums instead of adding. A mismatch means a definite error (a match is an 8-in-9 confidence)." },
      { text: "Drill: just compute the mod sum of the number shown — the core skill." },
    ],
    makeProblem: function () { return { n: H.randInt(1000, 999999) }; },
    promptHtml: function (p) { return "mod sum of<br>" + H.commas(p.n); },
    checkAnswer: function (p, raw) { const expected = H.modSum(p.n); return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const first = H.digitSum(p.n);
      const steps = [{ text: "Add the digits of " + H.commas(p.n) + ":" }, { math: String(p.n).split("").join(" + ") + " = " + first }];
      if (first > 9) steps.push({ math: String(first).split("").join(" + ") + " = " + H.modSum(p.n) });
      steps.push({ text: "Mod sum:", math: String(H.modSum(p.n)) });
      return steps;
    },
  },
  {
    id: "casting-out-elevens",
    title: "Casting Out Elevens",
    chapter: 6,
    chapterTitle: "Pencil-and-Paper Math",
    oneLine: "Alternately subtract and add digits from the right, reduce mod 11.",
    covers: "A sharper arithmetic check than nines — catches 10 errors in 11.",
    inputMode: "number",
    inputHint: "Type the result (0–10).",
    teachSteps: [
      { text: "Casting out elevens is a stronger check. From the <b>right</b>, alternately subtract and add the digits." },
      { math: "234.87  ->  7 - 8 + 4 - 3 + 2 = 2" },
      { text: "If the result is negative, add 11 to land in 0–10." },
      { text: "Use it just like nines: the parts' values combine the same way the numbers do, and should match the answer's value (mod 11)." },
      { text: "Drill: compute the elevens-value of the number shown." },
    ],
    makeProblem: function () { return { n: H.randInt(1000, 999999) }; },
    promptHtml: function (p) { return "elevens-value of<br>" + H.commas(p.n); },
    checkAnswer: function (p, raw) {
      const ds = H.digits(p.n).reverse();
      let acc = 0;
      for (let i = 0; i < ds.length; i += 1) acc += (i % 2 === 0 ? 1 : -1) * ds[i];
      const expected = ((acc % 11) + 11) % 11;
      return { correct: parseInt(raw, 10) === expected, expected: String(expected) };
    },
    solutionSteps: function (p) {
      const ds = H.digits(p.n).reverse();
      const terms = ds.map(function (d, i) { return (i % 2 === 0 ? "+" : "-") + d; }).join(" ");
      let acc = 0;
      for (let i = 0; i < ds.length; i += 1) acc += (i % 2 === 0 ? 1 : -1) * ds[i];
      const reduced = ((acc % 11) + 11) % 11;
      return [
        { text: "From the right, alternately add and subtract:" },
        { math: terms.replace(/^\+/, "") + " = " + acc },
        { text: acc < 0 ? "Negative — add 11s to reach 0–10:" : "Reduce mod 11:", math: String(reduced) },
      ];
    },
  },
  {
    id: "criss-cross-multiplication",
    title: "Criss-Cross Multiplication",
    chapter: 6,
    chapterTitle: "Pencil-and-Paper Math",
    oneLine: "Write a big product on one line by summing digit cross-products diagonally.",
    covers: "Multiplying multi-digit numbers on paper in a single line (shown here for 2-by-2).",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "The criss-cross writes the answer right-to-left in one line, no stacked partial products." },
      { text: "<b>47 × 34</b>. Step 1 — multiply the ones: 7×4 = 28. Write 8, carry 2." },
      { math: "7 × 4 = 28   ->   8, carry 2" },
      { text: "Step 2 — the cross: (7×3) + (4×4), plus the carry." },
      { math: "2 + 21 + 16 = 39   ->   9, carry 3" },
      { text: "Step 3 — the tens: 4×3, plus the carry.", math: "3 + 12 = 15   ->   write 15" },
      { text: "Read it off:", math: "1598" },
    ],
    makeProblem: function () { return { a: H.randInt(21, 99), b: H.randInt(21, 99) }; },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw, 10) === expected, expected: String(expected) }; },
    solutionSteps: function (p) {
      const a1 = Math.floor(p.a / 10), a0 = p.a % 10, b1 = Math.floor(p.b / 10), b0 = p.b % 10;
      const s1 = a0 * b0;
      const s2 = a0 * b1 + a1 * b0;
      const s3 = a1 * b1;
      return [
        { text: "Ones product:", math: a0 + " × " + b0 + " = " + s1 },
        { text: "Cross-product:", math: a0 + "×" + b1 + " + " + a1 + "×" + b0 + " = " + s2 },
        { text: "Tens product:", math: a1 + " × " + b1 + " = " + s3 },
        { text: "Combine with carries:", math: String(p.a * p.b) },
      ];
    },
  },
  {
    id: "pencil-square-root",
    title: "Square Roots on Paper",
    chapter: 6,
    chapterTitle: "Pencil-and-Paper Math",
    oneLine: "Extract a root digit by digit with a long-division-style doubling routine.",
    covers: "Computing an exact (or many-decimal) square root by hand.",
    inputMode: "number",
    inputHint: "Type the exact square root.",
    teachSteps: [
      { text: "The paper square-root method finds one digit at a time. Here we drill the clean case: a perfect square, so the root comes out exact." },
      { text: "<b>√1089</b>: pair the digits from the right → (10)(89). Biggest square ≤ 10 is 3²=9, so the first digit is 3." },
      { math: "10 - 9 = 1,  bring down 89  ->  189" },
      { text: "Double the root-so-far (3→6), and find a digit d with (6d)×d ≤ 189." },
      { math: "63 × 3 = 189   ->   next digit 3, remainder 0" },
      { text: "Root:", math: "√1089 = 33" },
    ],
    makeProblem: function () { const r = H.randInt(12, 98); return { n: r * r, r: r }; },
    promptHtml: function (p) { return "√" + H.commas(p.n) + "<small>exact — it is a perfect square</small>"; },
    checkAnswer: function (p, raw) { return { correct: parseInt(raw, 10) === p.r, expected: String(p.r) }; },
    solutionSteps: function (p) {
      const tens = Math.floor(p.r / 10);
      const ones = p.r % 10;
      const hundreds = Math.floor(p.n / 100);
      return [
        { text: "Pair the digits from the right. Biggest square under the front group " + hundreds + " is " + (tens * tens) + " = " + tens + "²." },
        { math: "first digit " + tens },
        { text: "Double it to " + (2 * tens) + " and find d with (" + (2 * tens) + "d)×d fitting the rest:" },
        { math: "next digit " + ones + "   ->   √" + H.commas(p.n) + " = " + p.r },
      ];
    },
  },

  // ===================== CHAPTER 7 =====================
  {
    id: "phonetic-code",
    title: "The Phonetic Code",
    chapter: 7,
    chapterTitle: "Memorizing Numbers",
    oneLine: "Turn each digit into a consonant sound so numbers become words you can picture.",
    covers: "The digit-to-sound code, and turning a short number into a valid word.",
    inputMode: "text",
    inputHint: "Type a real word whose consonant sounds spell the number.",
    teachSteps: [
      { text: "Each digit maps to a <b>consonant sound</b>. Vowels and h, w, y are free filler. Memorize this:" },
      { math: "1 = t,d    2 = n    3 = m    4 = r    5 = l\n6 = j,ch,sh   7 = k,hard g   8 = f,v   9 = p,b   0 = z,s" },
      { text: "Build a word by stringing the right consonant sounds and pouring vowels around them." },
      { text: "<b>32</b> = m, n → “moon,” “man,” “money,” “mini.” (“minnie” works — the n-sound is used once.)" },
      { text: "Not allowed for 32: “mint” (that t-sound is a 1, giving 321). Only the sounds matter, not the spelling." },
      { text: "Drill: a short number appears — type any real word whose consonant sounds match it in order." },
    ],
    makeProblem: function () {
      const len = H.randInt(2, 3);
      let n = "";
      for (let i = 0; i < len; i += 1) n += String(H.randInt(0, 9));
      // avoid leading-zero confusion in display but it's fine as a sequence
      return { sequence: n };
    },
    promptHtml: function (p) { return "make a word for<br><span class='op'>" + p.sequence.split("").join(" ") + "</span><small>consonant sounds must match these digits</small>"; },
    checkAnswer: function (p, raw) {
      const want = p.sequence.split("").map(Number);
      const got = H.phoneticDigitsOfWord(String(raw));
      const ok = got.length === want.length && got.every(function (d, i) { return d === want[i]; });
      const sample = want.map(function (d) { return ["s", "t", "n", "m", "r", "l", "sh", "k", "f", "b"][d]; }).join("");
      return { correct: ok, expected: "any word coding " + p.sequence + " (e.g. its sounds are " + want.map(function (d) { return ["z/s", "t/d", "n", "m", "r", "l", "j/ch/sh", "k/g", "f/v", "p/b"][d]; }).join(" - ") + ")" };
    },
    solutionSteps: function (p) {
      const sounds = p.sequence.split("").map(function (d) { return ["z or s", "t or d", "n", "m", "r", "l", "j/ch/sh", "k or hard g", "f or v", "p or b"][Number(d)]; });
      return [
        { text: "Each digit needs its sound, in order:" },
        { math: p.sequence.split("").map(function (d, i) { return d + " = " + sounds[i]; }).join("\n") },
        { text: "Any word with exactly those consonant sounds (vowels/h/w/y free) is correct." },
      ];
    },
  },
  {
    id: "phonetic-decode",
    title: "Decoding Words to Numbers",
    chapter: 7,
    chapterTitle: "Memorizing Numbers",
    oneLine: "Read a word's consonant sounds back as digits — the reverse of the code.",
    covers: "Translating a code-word back into the number it stores.",
    inputMode: "number",
    inputHint: "Type the digits the word's sounds spell.",
    teachSteps: [
      { text: "Recall works backward: strip the vowels (and h, w, y) from a word and read its consonant sounds as digits." },
      { text: "<b>“neck”</b>: n = 2, ck = one k-sound = 7. So neck → 27." },
      { text: "<b>“lion”</b>: l = 5, n = 2 (the i and o are free). So lion → 52." },
      { text: "Doubled letters with one sound count once: “mummy” = m, m → just 3, 3 = 33." },
      { text: "Drill: a code-word appears — type the number it stores." },
    ],
    makeProblem: function () {
      const words = [
        { w: "tie", n: "1" }, { w: "knee", n: "2" }, { w: "emu", n: "3" }, { w: "ear", n: "4" }, { w: "law", n: "5" },
        { w: "shoe", n: "6" }, { w: "cow", n: "7" }, { w: "ivy", n: "8" }, { w: "bee", n: "9" }, { w: "dice", n: "10" },
        { w: "tin", n: "12" }, { w: "tomb", n: "13" }, { w: "tire", n: "14" }, { w: "dish", n: "16" }, { w: "duck", n: "17" },
        { w: "nose", n: "20" }, { w: "name", n: "23" }, { w: "nail", n: "25" }, { w: "neck", n: "27" }, { w: "knife", n: "28" },
        { w: "mouse", n: "30" }, { w: "moon", n: "32" }, { w: "mower", n: "34" }, { w: "match", n: "36" }, { w: "movie", n: "38" },
        { w: "rose", n: "40" }, { w: "rain", n: "42" }, { w: "roll", n: "45" }, { w: "rope", n: "49" }, { w: "lion", n: "52" },
        { w: "lamb", n: "53" },
      ];
      return H.pick(words);
    },
    promptHtml: function (p) { return "“<span class='op'>" + p.w + "</span>”<small>what number do its sounds spell?</small>"; },
    checkAnswer: function (p, raw) {
      const expected = p.n;
      const cleaned = String(raw).replace(/[^0-9]/g, "");
      return { correct: cleaned === expected, expected: expected };
    },
    solutionSteps: function (p) {
      const got = H.phoneticDigitsOfWord(p.w);
      return [
        { text: "Strip vowels and free letters; read the consonant sounds:" },
        { math: "“" + p.w + "”  ->  " + got.join(", ") },
        { text: "Number:", math: p.n },
      ];
    },
  },

  // ===================== CHAPTER 8 =====================
  {
    id: "three-digit-squaring",
    title: "Squaring a 3-Digit Number",
    chapter: 8,
    chapterTitle: "Advanced Multiplication",
    oneLine: "Round to the nearest 100, multiply the pair, add the square of the distance.",
    covers: "Squaring any 3-digit number.",
    inputMode: "number",
    inputHint: "Type the square.",
    teachSteps: [
      { text: "Same difference-of-squares idea as 2-digit squaring, scaled up: round to the nearest 100." },
      { text: "<b>193²</b>: round up to 200, down to 186 (distance 7)." },
      { math: "200 × 186 = 37,200" },
      { text: "Add the square of the distance:", math: "37,200 + 7² = 37,200 + 49 = 37,249" },
      { text: "<b>314²</b>: round to 300 and 328 (distance 14).", math: "300 × 328 = 98,400\n98,400 + 196 = 98,596" },
    ],
    makeProblem: function () { return { n: H.randInt(106, 994) }; },
    promptHtml: function (p) { return p.n + "<span class='op'>²</span>"; },
    checkAnswer: function (p, raw) { const expected = p.n * p.n; return { correct: parseInt(raw.replace(/[, ]/g, ""), 10) === expected, expected: H.commas(expected) }; },
    solutionSteps: function (p) {
      const nearest = Math.round(p.n / 100) * 100;
      const d = Math.abs(p.n - nearest);
      const low = p.n - d;
      const high = p.n + d;
      return [
        { text: "Round to " + nearest + "; the pair is " + low + " and " + high + " (distance " + d + ")." },
        { math: low + " × " + high + " = " + H.commas(low * high) },
        { text: "Add " + d + "² = " + (d * d) + ":" },
        { math: H.commas(low * high) + " + " + (d * d) + " = " + H.commas(p.n * p.n) },
      ];
    },
  },
  {
    id: "three-by-two",
    title: "3-by-2 Multiplication",
    chapter: 8,
    chapterTitle: "Advanced Multiplication",
    oneLine: "Factor the 2-digit number and chain, or round it and adjust.",
    covers: "A 3-digit number times a 2-digit number.",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "Best case: the 2-digit number factors. <b>637 × 56</b>, and 56 = 8 × 7." },
      { math: "637 × 8 = 5096\n5096 × 7 = 35,672" },
      { text: "If it does not factor nicely, round it. <b>758 × 43</b>: 758 ≈ 760." },
      { math: "760 × 43 = 32,680\n32,680 - (2 × 43) = 32,594" },
      { text: "Or split the small number: 721 × 37 = 720×37 + 1×37. Choose whichever path is cleanest." },
    ],
    makeProblem: function () { return { a: H.randInt(110, 989), b: H.randInt(12, 99) }; },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw.replace(/[, ]/g, ""), 10) === expected, expected: H.commas(expected) }; },
    solutionSteps: function (p) {
      // prefer factoring if b factors into single digits
      let f1 = 0;
      for (let d = 9; d >= 2; d -= 1) { if (p.b % d === 0 && p.b / d <= 11 && p.b / d >= 2) { f1 = d; break; } }
      if (f1) {
        const f2 = p.b / f1;
        return [
          { text: "Factor " + p.b + " = " + f1 + " × " + f2 + ", then chain." },
          { math: p.a + " × " + f1 + " = " + H.commas(p.a * f1) },
          { math: H.commas(p.a * f1) + " × " + f2 + " = " + H.commas(p.a * p.b) },
        ];
      }
      const tens = Math.floor(p.a / 10) * 10;
      const ones = p.a % 10;
      return [
        { text: "Split " + p.a + " into " + tens + " + " + ones + "." },
        { math: tens + " × " + p.b + " = " + H.commas(tens * p.b) },
        { math: ones + " × " + p.b + " = " + H.commas(ones * p.b) },
        { math: H.commas(tens * p.b) + " + " + H.commas(ones * p.b) + " = " + H.commas(p.a * p.b) },
      ];
    },
  },
  {
    id: "three-by-three",
    title: "3-by-3 Multiplication",
    chapter: 8,
    chapterTitle: "Advanced Multiplication",
    oneLine: "Break one number into hundreds/tens/ones (or use a close-together base) and sum.",
    covers: "A 3-digit number times a 3-digit number.",
    inputMode: "number",
    inputHint: "Type the product.",
    teachSteps: [
      { text: "When numbers are close to a round base, use (z+a)(z+b) = z(z+a+b) + ab. <b>107 × 111</b>, base 100." },
      { math: "a = 7, b = 11\n100 × (100+18) = 11,800\n7 × 11 = 77   ->   11,877" },
      { text: "Otherwise, the universal fallback: split one number into hundreds, tens, ones." },
      { text: "<b>851 × 527</b>:", math: "800 × 527 = 421,600\n 50 × 527 =  26,350\n  1 × 527 =     527" },
      { text: "Add them up:", math: "421,600 + 26,350 + 527 = 448,477" },
    ],
    makeProblem: function () { return { a: H.randInt(110, 989), b: H.randInt(110, 989) }; },
    promptHtml: function (p) { return p.a + " <span class='op'>×</span> " + p.b; },
    checkAnswer: function (p, raw) { const expected = p.a * p.b; return { correct: parseInt(raw.replace(/[, ]/g, ""), 10) === expected, expected: H.commas(expected) }; },
    solutionSteps: function (p) {
      const h = Math.floor(p.a / 100) * 100;
      const t = Math.floor((p.a % 100) / 10) * 10;
      const o = p.a % 10;
      return [
        { text: "Split " + p.a + " into " + h + " + " + t + " + " + o + "; multiply each by " + p.b + "." },
        { math: h + " × " + p.b + " = " + H.commas(h * p.b) },
        { math: t + " × " + p.b + " = " + H.commas(t * p.b) },
        { math: o + " × " + p.b + " = " + H.commas(o * p.b) },
        { text: "Add:", math: H.commas(p.a * p.b) },
      ];
    },
  },

  // ===================== CHAPTER 9 =====================
  {
    id: "day-of-week",
    title: "Day of the Week for Any Date",
    chapter: 9,
    chapterTitle: "The Art of Mathematical Magic",
    oneLine: "Add a month code, the date, and a year code; reduce mod 7 to a weekday.",
    covers: "Naming the weekday of any date (drilled here for the 2000s).",
    inputMode: "weekday",
    inputHint: "Tap the weekday.",
    teachSteps: [
      { text: "The weekday is <b>(month code + date + year code) mod 7</b>, where 1=Mon ... 0=Sun." },
      { text: "Month codes:", math: "Jan 6  Feb 2  Mar 2  Apr 5  May 0  Jun 3\nJul 5  Aug 1  Sep 4  Oct 6  Nov 2  Dec 4" },
      { text: "Year code (2000s): take the last two digits y, add floor(y/4), reduce mod 7. For 2061: 61 + 15 = 76 → mod 7 = 6." },
      { text: "<b>Dec 3, 2006</b>: month 4 + date 3 + year code 0 = 7 → mod 7 = 0 → Sunday." },
      { text: "Leap-year tweak: in a leap year use Jan = 5 and Feb = 1 instead of 6 and 2." },
    ],
    makeProblem: function () {
      const year = H.randInt(2000, 2099);
      const month = H.randInt(1, 12);
      const maxDay = [31, H.isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
      const day = H.randInt(1, maxDay);
      return { year: year, month: month, day: day };
    },
    promptHtml: function (p) { return H.monthNames[p.month - 1] + " " + p.day + ", " + p.year; },
    checkAnswer: function (p, raw) {
      const expectedIndex = H.trueWeekday(p.year, p.month, p.day);
      const expected = H.weekdayNames[expectedIndex];
      return { correct: String(raw) === expected, expected: expected };
    },
    solutionSteps: function (p) {
      const y = p.year - 2000;
      const yearCode = (y + Math.floor(y / 4)) % 7;
      const leap = H.isLeap(p.year);
      let monthCode = H.monthCodes[p.month - 1];
      let leapNote = "";
      if (leap && p.month === 1) { monthCode = 5; leapNote = " (leap-year January)"; }
      if (leap && p.month === 2) { monthCode = 1; leapNote = " (leap-year February)"; }
      const total = monthCode + p.day + yearCode;
      return [
        { text: "Year code for " + p.year + ": " + y + " + floor(" + y + "/4)=" + Math.floor(y / 4) + " = " + (y + Math.floor(y / 4)) + ", mod 7 = " + yearCode + "." },
        { text: H.monthNames[p.month - 1] + " month code is " + monthCode + leapNote + "." },
        { math: monthCode + " + " + p.day + " + " + yearCode + " = " + total + "   ->   mod 7 = " + (total % 7) },
        { text: "Weekday:", math: H.weekdayNames[total % 7] },
      ];
    },
  },
  {
    id: "quick-cube-roots",
    title: "Instant Cube Roots",
    chapter: 9,
    chapterTitle: "The Art of Mathematical Magic",
    oneLine: "Get the tens digit from the magnitude, the ones digit from the last digit.",
    covers: "The cube root of a perfect cube of a 2-digit number.",
    inputMode: "number",
    inputHint: "Type the cube root.",
    teachSteps: [
      { text: "Memorize the cubes 1–10. Their last digits are all different, which gives away the ones digit instantly." },
      { math: "1->1  2->8  3->27  4->64  5->125\n6->216  7->343  8->512  9->729  10->1000" },
      { text: "<b>∛314,432</b>. Tens digit: ignore the last 3 digits → 314 sits between 6³=216 and 7³=343, so it is 6." },
      { text: "Ones digit: the cube ends in 2, and only 8³ ends in 2. So the ones digit is 8." },
      { text: "Answer:", math: "∛314,432 = 68" },
    ],
    makeProblem: function () { const r = H.randInt(11, 99); return { n: r * r * r, r: r }; },
    promptHtml: function (p) { return "∛" + H.commas(p.n) + "<small>it is a perfect cube</small>"; },
    checkAnswer: function (p, raw) { return { correct: parseInt(raw, 10) === p.r, expected: String(p.r) }; },
    solutionSteps: function (p) {
      const lastDigitMap = { 0: 0, 1: 1, 2: 8, 3: 7, 4: 4, 5: 5, 6: 6, 7: 3, 8: 2, 9: 9 };
      const cubes = [0, 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000];
      const front = Math.floor(p.n / 1000);
      const tens = Math.floor(p.r / 10);
      const ones = p.r % 10;
      const lastDigit = p.n % 10;
      return [
        { text: "Drop the last 3 digits: " + front + ". It sits between " + cubes[tens] + " (" + tens + "³) and " + cubes[tens + 1] + " (" + (tens + 1) + "³), so the tens digit is " + tens + "." },
        { text: "The cube ends in " + lastDigit + ", and only " + ones + "³ ends in " + lastDigit + " — so the ones digit is " + ones + "." },
        { text: "Cube root:", math: String(p.r) },
      ];
    },
  },
  {
    id: "quick-square-roots",
    title: "Instant Square Roots",
    chapter: 9,
    chapterTitle: "The Art of Mathematical Magic",
    oneLine: "Tens digit from magnitude, two ones-digit candidates, then a midpoint test.",
    covers: "The square root of a perfect square of a 2-digit number.",
    inputMode: "number",
    inputHint: "Type the square root.",
    teachSteps: [
      { text: "<b>√7569</b>. Tens digit: drop the last two digits → 75 is between 8²=64 and 9²=81, so it is 8 (80s)." },
      { text: "Ones digit: the square ends in 9, and squares end in 9 only for 3 and 7. So the root is 83 or 87." },
      { text: "Break the tie with the midpoint, 85²:", math: "85² = 7225" },
      { text: "7569 > 7225, so take the larger candidate.", math: "√7569 = 87" },
      { text: "Last-digit candidates: 0->0, 1->1 or 9, 4->2 or 8, 5->5, 6->4 or 6, 9->3 or 7." },
    ],
    makeProblem: function () { const r = H.randInt(11, 99); return { n: r * r, r: r }; },
    promptHtml: function (p) { return "√" + H.commas(p.n) + "<small>it is a perfect square</small>"; },
    checkAnswer: function (p, raw) { return { correct: parseInt(raw, 10) === p.r, expected: String(p.r) }; },
    solutionSteps: function (p) {
      const squares = [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
      const front = Math.floor(p.n / 100);
      const tens = Math.floor(p.r / 10);
      const mid = tens * 10 + 5;
      const candPairs = { 0: [0], 1: [1, 9], 4: [2, 8], 5: [5], 6: [4, 6], 9: [3, 7] };
      const lastDigit = p.n % 10;
      const cands = candPairs[lastDigit].map(function (o) { return tens * 10 + o; });
      return [
        { text: "Front group " + front + " is between " + squares[tens] + " and " + squares[tens + 1] + ", so the tens digit is " + tens + "." },
        { text: "Ends in " + lastDigit + ", so the root ends in " + candPairs[lastDigit].join(" or ") + " → candidate(s): " + cands.join(", ") + "." },
        cands.length > 1 ? { text: "Compare with midpoint " + mid + "² = " + (mid * mid) + ": " + H.commas(p.n) + (p.n > mid * mid ? " is larger, take the bigger one." : " is smaller, take the smaller one.") } : { text: "Only one candidate." },
        { text: "Square root:", math: String(p.r) },
      ];
    },
  },
  {
    id: "missing-digit",
    title: "The Missing-Digit Trick",
    chapter: 9,
    chapterTitle: "The Art of Mathematical Magic",
    oneLine: "From a multiple of 9, the digits called out reveal the one held back.",
    covers: "Finding a hidden digit of a multiple of 9 from the others.",
    inputMode: "number",
    inputHint: "Type the missing digit (0–9).",
    teachSteps: [
      { text: "Any multiple of 9 has a digit sum that is also a multiple of 9. Multiplying by 1089 (= 9×121) guarantees a multiple of 9." },
      { text: "Someone hides one digit and reads the rest. Add what they read." },
      { text: "<b>278,784</b>, digit 7 hidden → they read 2,4,8,7,8 summing to 29." },
      { text: "Round up to the next multiple of 9 — that is 36 — and subtract:", math: "36 - 29 = 7   ->   missing digit is 7" },
      { text: "If the called digits already sum to a multiple of 9, the missing digit is 0 or 9." },
    ],
    makeProblem: function () {
      const multiplier = H.randInt(100, 999);
      const product = 1089 * multiplier;
      const productDigits = String(product).split("");
      // hide a non-zero digit when possible to avoid the 0/9 ambiguity in drills
      let hideIndex = H.randInt(0, productDigits.length - 1);
      let guard = 0;
      while (productDigits[hideIndex] === "0" && guard < 12) { hideIndex = H.randInt(0, productDigits.length - 1); guard += 1; }
      const missing = Number(productDigits[hideIndex]);
      const shown = productDigits.slice();
      shown[hideIndex] = "?";
      return { product: product, shownDigits: shown, missing: missing, called: productDigits.filter(function (d, i) { return i !== hideIndex; }).map(Number) };
    },
    promptHtml: function (p) { return "digits called:<br><span class='op'>" + p.shownDigits.join(" ") + "</span><small>find the ? (the number is a multiple of 9)</small>"; },
    checkAnswer: function (p, raw) { return { correct: parseInt(raw, 10) === p.missing, expected: String(p.missing) }; },
    solutionSteps: function (p) {
      const sum = p.called.reduce(function (a, b) { return a + b; }, 0);
      const nextMultiple = Math.ceil(sum / 9) * 9 === sum ? sum + 9 : Math.ceil(sum / 9) * 9;
      const target = p.missing === 0 ? sum : (sum % 9 === 0 ? sum : Math.ceil(sum / 9) * 9);
      return [
        { text: "Add the called digits:" },
        { math: p.called.join(" + ") + " = " + sum },
        { text: "Next multiple of 9 at or above " + sum + " is " + (sum % 9 === 0 ? sum + " (already a multiple; missing is 0 or 9)" : Math.ceil(sum / 9) * 9) + "." },
        { text: "Missing digit:", math: String(p.missing) },
      ];
    },
  },
  {
    id: "magic-1089",
    title: "The Magic 1089",
    chapter: 9,
    chapterTitle: "The Art of Mathematical Magic",
    oneLine: "Reverse-subtract a descending 3-digit number, reverse-add the result: always 1089.",
    covers: "The 1089 forcing trick — here you compute the forced steps.",
    inputMode: "number",
    inputHint: "Type the result of this step.",
    teachSteps: [
      { text: "Pick a 3-digit number with strictly decreasing digits, e.g. <b>851</b>. Reverse it and subtract the smaller from the larger." },
      { math: "851 - 158 = 693" },
      { text: "Now reverse <i>that</i> and add:", math: "693 + 396 = 1089" },
      { text: "It is always 1089. The subtraction always yields a multiple of 99 (99×(first−last)), and each of those plus its reverse is 1089." },
      { text: "Drill: you will be given a starting number and asked for each forced result." },
    ],
    makeProblem: function () {
      // pick strictly descending digits
      let a, b, c;
      do { a = H.randInt(3, 9); b = H.randInt(1, a - 1); c = H.randInt(0, b - 1); } while (!(a > b && b > c));
      const start = a * 100 + b * 10 + c;
      const reversed = c * 100 + b * 10 + a;
      const diff = start - reversed;
      return { start: start, diff: diff };
    },
    promptHtml: function (p) { return "start " + p.start + ":<br><span class='op'>" + p.start + " - " + reverseNumberDisplay(p.start) + "</span><small>then we reverse-add to reach 1089</small>"; },
    checkAnswer: function (p, raw) {
      return { correct: parseInt(raw, 10) === p.diff, expected: String(p.diff) + " (then " + p.diff + " + its reverse = 1089)" };
    },
    solutionSteps: function (p) {
      const rev = Number(String(p.start).padStart(3, "0").split("").reverse().join(""));
      const diffRev = Number(String(p.diff).padStart(3, "0").split("").reverse().join(""));
      return [
        { text: "Reverse and subtract:" },
        { math: p.start + " - " + rev + " = " + p.diff },
        { text: "Reverse that and add — always 1089:" },
        { math: p.diff + " + " + diffRev + " = 1089" },
      ];
    },
  },
];

// Helper used inside a technique's promptHtml; must be available on the page too.
function reverseNumberDisplay(value) { return Number(String(value).padStart(3, "0").split("").reverse().join("")); }

// Factory for the eight near-identical divisibility pages.
function divisibilityTechnique(spec) {
  return {
    id: spec.id,
    title: spec.title,
    chapter: 4,
    chapterTitle: "Mental Division",
    oneLine: spec.oneLine,
    covers: "Deciding whether a number is divisible by " + spec.divisor + ".",
    inputMode: "text",
    inputHint: "Type  yes  or  no.",
    _divisor: spec.divisor,
    _rule: spec.rule,
    _example: spec.example,
    teachSteps: [
      { text: "<b>Test for " + spec.divisor + ":</b> " + spec.rule },
      { text: "Example — is " + H.commas(spec.example.n) + " divisible by " + spec.divisor + "? " + spec.example.note },
      { text: "Drill: you will see a number; answer yes or no." },
    ],
    makeProblem: function () {
      const divisor = spec._divisor;
      const wantDivisible = H.randInt(0, 1) === 1;
      let n;
      if (wantDivisible) { n = divisor * H.randInt(20, 9000); }
      else { do { n = H.randInt(100, 999999); } while (n % divisor === 0); }
      return { n: n };
    },
    promptHtml: function (p) { return "is <span class='op'>" + H.commas(p.n) + "</span><br>divisible by " + this._divisor + "?"; },
    checkAnswer: function (p, raw) {
      const divisor = this._divisor;
      const truth = p.n % divisor === 0;
      const said = /^y/i.test(String(raw).trim());
      const saidNo = /^n/i.test(String(raw).trim());
      const answered = said || saidNo;
      return { correct: answered && said === truth, expected: truth ? "yes" : "no" };
    },
    solutionSteps: function (p) {
      const divisor = this._divisor;
      const truth = p.n % divisor === 0;
      const steps = [{ text: this._rule }];
      if (divisor === 3 || divisor === 9) {
        steps.push({ math: "digit sum of " + H.commas(p.n) + " = " + H.digitSum(p.n) + (H.digitSum(p.n) % divisor === 0 ? "  (a multiple of " + divisor + ")" : "  (not a multiple of " + divisor + ")") });
      } else if (divisor === 2 || divisor === 5) {
        steps.push({ math: "last digit is " + (p.n % 10) });
      } else if (divisor === 4) {
        steps.push({ math: "last two digits = " + (p.n % 100) + (p.n % 100 % 4 === 0 ? ", divisible by 4" : ", not divisible by 4") });
      } else if (divisor === 8) {
        steps.push({ math: "last three digits = " + (p.n % 1000) + (p.n % 1000 % 8 === 0 ? ", divisible by 8" : ", not divisible by 8") });
      } else if (divisor === 6) {
        steps.push({ math: "even? " + (p.n % 2 === 0 ? "yes" : "no") + "   digit sum " + H.digitSum(p.n) + " div by 3? " + (H.digitSum(p.n) % 3 === 0 ? "yes" : "no") });
      } else if (divisor === 11) {
        const ds = H.digits(p.n).reverse();
        let acc = 0; const terms = ds.map(function (d, i) { return (i % 2 === 0 ? "+" : "-") + d; });
        for (let i = 0; i < ds.length; i += 1) acc += (i % 2 === 0 ? 1 : -1) * ds[i];
        steps.push({ math: terms.join(" ").replace(/^\+/, "") + " = " + acc + (acc % 11 === 0 ? "  (multiple of 11)" : "  (not a multiple of 11)") });
      }
      steps.push({ text: "Answer:", math: truth ? "yes" : "no" });
      return steps;
    },
  };
}

module.exports = { helpers: helpers, techniques: techniques, divisibilityTechniqueSource: divisibilityTechnique.toString(), reverseNumberDisplaySource: reverseNumberDisplay.toString() };
