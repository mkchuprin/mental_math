// Pure, dependency-free helpers shared by every technique page.
// `helpersSource` is the exact text inlined into each page (defining a global `H`).

const helpersSource = `
var H = {
  randInt: function randInt(low, high) { return low + Math.floor(Math.random() * (high - low + 1)); },
  pick: function pick(list) { return list[Math.floor(Math.random() * list.length)]; },
  digits: function digits(value) { return String(value).split("").map(Number); },
  digitSum: function digitSum(value) { return H.digits(Math.abs(value)).reduce(function (a, b) { return a + b; }, 0); },
  modSum: function modSum(value) { var n = Math.abs(value); while (n > 9) n = H.digitSum(n); return n; },
  commas: function commas(value) { return value.toLocaleString("en-US"); },
  complement100: function complement100(value) { return (100 - value) % 100; },
  weekdayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  trueWeekday: function trueWeekday(year, month, day) {
    var t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    var y = year;
    if (month < 3) y -= 1;
    return ((y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7 + 7) % 7;
  },
  isLeap: function isLeap(year) { return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0; },
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  monthCodes: [6, 2, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4],
  phoneticDigitsOfWord: function phoneticDigitsOfWord(word) {
    var lowered = word.toLowerCase().replace(/[^a-z]/g, "");
    var out = [];
    var index = 0;
    while (index < lowered.length) {
      var two = lowered.slice(index, index + 2);
      var one = lowered[index];
      if (two === "ch" || two === "sh") { out.push(6); index += 2; continue; }
      if (two === "ck") { out.push(7); index += 2; continue; }
      var map = { t: 1, d: 1, n: 2, m: 3, r: 4, l: 5, j: 6, g: 7, k: 7, c: 7, q: 7, f: 8, v: 8, p: 9, b: 9, z: 0, s: 0, x: 0 };
      if ("aeiouhwy".indexOf(one) !== -1) { index += 1; continue; }
      if (map[one] !== undefined) {
        if (out.length && map[one] === out[out.length - 1] && lowered[index - 1] === one) { index += 1; continue; }
        out.push(map[one]);
      }
      index += 1;
    }
    return out;
  }
};
`;

// Evaluate the same source in Node so the build can construct techniques that call H.* eagerly.
const helpers = (function () {
  const sandbox = {};
  // eslint-disable-next-line no-new-func
  new Function("exports", helpersSource + "\nexports.H = H;")(sandbox);
  return sandbox.H;
})();

module.exports = { helpers: helpers, helpersSource: helpersSource };
