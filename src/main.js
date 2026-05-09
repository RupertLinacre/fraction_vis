import katex from "katex";
import "katex/dist/katex.min.css";
import "./styles.css";

const defaultFraction = {
  numerator: 3,
  denominator: 4,
};

const state = {
  numerator: defaultFraction.numerator,
  denominator: defaultFraction.denominator,
  gridMultiple: 4,
  equivalenceMultiple: 2,
  moneyGrouped: false,
  settingsOpen: false,
  revealed: {
    numberline: false,
    decimalNumberline: false,
    pie: false,
    equivalence: false,
    money: false,
    hundredGrid: false,
    customGrid: false,
    pictogram: false,
    percentage: false,
  },
  enabledPanels: {
    numberline: true,
    decimalNumberline: true,
    pie: true,
    equivalence: true,
    money: true,
    hundredGrid: true,
    customGrid: true,
    pictogram: true,
    percentage: true,
  },
  panelOrder: [
    "numberline",
    "decimalNumberline",
    "pie",
    "money",
    "hundredGrid",
    "customGrid",
    "pictogram",
    "equivalence",
    "percentage",
  ],
};

const panelIds = Object.keys(state.revealed);
const panelLabels = {
  numberline: "Fraction numberline",
  decimalNumberline: "Decimal numberline",
  pie: "Pie",
  money: "Money",
  hundredGrid: "100 square",
  customGrid: "Equivalent fractions grid",
  pictogram: "Apples",
  equivalence: "Equivalent fractions",
  percentage: "Percentage",
};

const coinValues = [100, 50, 20, 10, 5, 2, 1];
const coinLabels = {
  100: "£1",
  50: "50p",
  20: "20p",
  10: "10p",
  5: "5p",
  2: "2p",
  1: "1p",
};

const coinImageFiles = {
  100: "1-pound.png",
  50: "50p.png",
  20: "20p.png",
  10: "10p.png",
  5: "5p.png",
  2: "2p.png",
  1: "1p.png",
};

const equivalenceFillClasses = [
  "equivalence-fill-blue",
  "equivalence-fill-green",
  "equivalence-fill-red",
  "equivalence-fill-yellow",
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const plural = (count, singular, pluralForm = `${singular}s`) =>
  count === 1 ? singular : pluralForm;
const assetPath = (path) => `${import.meta.env.BASE_URL}${path}`;
const numberWords0To19 = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const tensWords = {
  20: "twenty",
  30: "thirty",
  40: "forty",
  50: "fifty",
  60: "sixty",
  70: "seventy",
  80: "eighty",
  90: "ninety",
};
const denominatorWords = {
  1: ["whole", "wholes"],
  2: ["half", "halves"],
  3: ["third", "thirds"],
  4: ["quarter", "quarters"],
  5: ["fifth", "fifths"],
  6: ["sixth", "sixths"],
  7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"],
  9: ["ninth", "ninths"],
  10: ["tenth", "tenths"],
  11: ["eleventh", "elevenths"],
  12: ["twelfth", "twelfths"],
  13: ["thirteenth", "thirteenths"],
  14: ["fourteenth", "fourteenths"],
  15: ["fifteenth", "fifteenths"],
  16: ["sixteenth", "sixteenths"],
  17: ["seventeenth", "seventeenths"],
  18: ["eighteenth", "eighteenths"],
  19: ["nineteenth", "nineteenths"],
  20: ["twentieth", "twentieths"],
  21: ["twenty-first", "twenty-firsts"],
  22: ["twenty-second", "twenty-seconds"],
  23: ["twenty-third", "twenty-thirds"],
  24: ["twenty-fourth", "twenty-fourths"],
};

function normalizeState() {
  state.denominator = clamp(Math.trunc(state.denominator) || 1, 1, 24);
  state.numerator = Math.max(Math.trunc(state.numerator) || 0, 0);
  state.gridMultiple = clamp(Math.trunc(state.gridMultiple) || 1, 1, 12);
  state.equivalenceMultiple = clamp(Math.trunc(state.equivalenceMultiple) || 2, 2, 8);
  state.moneyGrouped = Boolean(state.moneyGrouped);
  panelIds.forEach((panelId) => {
    state.enabledPanels[panelId] = state.enabledPanels[panelId] !== false;
  });
  state.panelOrder = [
    ...state.panelOrder.filter((panelId) => panelIds.includes(panelId)),
    ...panelIds.filter((panelId) => !state.panelOrder.includes(panelId)),
  ];
}

function mathMarkup(tex) {
  return katex.renderToString(tex, {
    throwOnError: false,
  });
}

function mathFraction(numerator, denominator, displayStyle = false) {
  return mathMarkup(`${displayStyle ? "\\dfrac" : "\\frac"}{${numerator}}{${denominator}}`);
}

function mathEquivalence(numerator, denominator, multiple) {
  return mathMarkup(
    `\\frac{${numerator}}{${denominator}} = \\frac{${numerator * multiple}}{${denominator * multiple}}`,
  );
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function fractionValue(numerator, denominator) {
  return numerator / denominator;
}

function wholeScaleFor(numerator, denominator) {
  return Math.max(1, Math.ceil(fractionValue(numerator, denominator)));
}

function numberWord(value) {
  if (value < 20) {
    return numberWords0To19[value];
  }
  if (value < 100) {
    const tens = Math.floor(value / 10) * 10;
    const ones = value % 10;
    return ones === 0 ? tensWords[tens] : `${tensWords[tens]}-${numberWords0To19[ones]}`;
  }
  return String(value);
}

function sentenceStart(text) {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

function fractionWords(numerator, denominator) {
  if (numerator === 0) {
    return "zero";
  }
  if (denominator === 1) {
    return `${numberWord(numerator)} ${plural(numerator, "whole")}`;
  }
  const [singular, pluralForm] = denominatorWords[denominator] ?? [
    `${denominator}th`,
    `${denominator}ths`,
  ];
  return `${numberWord(numerator)} ${numerator === 1 ? singular : pluralForm}`;
}

function mixedNumberWords(numerator, denominator) {
  const whole = Math.floor(numerator / denominator);
  const remainder = numerator % denominator;
  if (remainder === 0) {
    return numberWord(whole);
  }
  return `${numberWord(whole)} and ${fractionWords(remainder, denominator)}`;
}

function terminatingDecimalPlaces(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  let reducedDenominator = denominator / divisor;
  let twos = 0;
  let fives = 0;
  while (reducedDenominator % 2 === 0) {
    reducedDenominator /= 2;
    twos += 1;
  }
  while (reducedDenominator % 5 === 0) {
    reducedDenominator /= 5;
    fives += 1;
  }
  return reducedDenominator === 1 ? Math.max(twos, fives) : null;
}

function exactRationalText(numerator, denominator) {
  const places = terminatingDecimalPlaces(numerator, denominator);
  if (places === null) {
    return null;
  }
  const text = (numerator / denominator).toFixed(places);
  return text.includes(".") ? text.replace(/0+$/, "").replace(/\.$/, "") : text;
}

function decimalInfo(numerator, denominator, approximateDigits = 3) {
  const exactText = exactRationalText(numerator, denominator);
  return exactText === null
    ? { exact: false, text: (numerator / denominator).toFixed(approximateDigits) }
    : { exact: true, text: exactText };
}

function exactPenceFor(numerator, denominator) {
  return (numerator * 100) % denominator === 0 ? (numerator * 100) / denominator : null;
}

function fractionalPennyParts(numerator, denominator) {
  const remainder = (numerator * 100) % denominator;
  if (remainder === 0) {
    return null;
  }
  const divisor = gcd(remainder, denominator);
  return {
    numerator: remainder / divisor,
    denominator: denominator / divisor,
  };
}

function moneyTextFromPence(pence) {
  return `£${(pence / 100).toFixed(2)}`;
}

function formatPence(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function moneyAmountWords(pence) {
  const pounds = Math.floor(pence / 100);
  const penceRemainder = pence % 100;
  const poundText = `${pounds} ${plural(pounds, "pound")}`;
  const penceText = `${penceRemainder} ${plural(penceRemainder, "penny", "pence")}`;
  if (pounds === 0) {
    return penceText;
  }
  if (penceRemainder === 0) {
    return poundText;
  }
  return `${poundText} and ${penceText}`;
}

function renderFractionalPenny(fractionalPenny, fractionalPennyLabel) {
  const label = `${fractionalPennyLabel} of a 1p coin`;
  return `
    <span class="coin coin-image coin-fraction" style="--coin-fill:${fractionalPenny * 100}%" aria-label="${label}">
      <img class="coin-fraction-ghost" src="${assetPath("coin_images/1p.png")}" alt="" aria-hidden="true" />
      <img class="coin-fraction-fill" src="${assetPath("coin_images/1p.png")}" alt="" aria-hidden="true" />
    </span>
  `;
}

function fractionalPennyPartsForGroup(denominator) {
  const remainder = 100 % denominator;
  if (remainder === 0) {
    return null;
  }
  const divisor = gcd(remainder, denominator);
  return {
    numerator: remainder / divisor,
    denominator: denominator / divisor,
  };
}

function hideAnswers() {
  panelIds.forEach((id) => {
    state.revealed[id] = false;
  });
}

function availablePanelIds(numerator, denominator) {
  const visible = ["numberline", "decimalNumberline", "pie", "money"];
  if (numerator <= denominator) {
    visible.push("hundredGrid", "customGrid");
  }
  visible.push("pictogram", "equivalence", "percentage");
  return visible;
}

function visiblePanelIds(numerator, denominator) {
  const available = new Set(availablePanelIds(numerator, denominator));
  return state.panelOrder.filter((panelId) => available.has(panelId) && state.enabledPanels[panelId]);
}

function applyUrlSettings() {
  const params = new URLSearchParams(window.location.search);
  const numeratorParam = params.get("n");
  const denominatorParam = params.get("d");
  const gridMultipleParam = params.get("gm");
  const equivalenceMultipleParam = params.get("em");
  const moneyGroupedParam = params.get("mg");
  const numerator = Number(numeratorParam);
  const denominator = Number(denominatorParam);
  const gridMultiple = Number(gridMultipleParam);
  const equivalenceMultiple = Number(equivalenceMultipleParam);
  const panels = params.get("panels");
  const order = params.get("order");

  if (numeratorParam !== null && Number.isFinite(numerator)) {
    state.numerator = numerator;
  }
  if (denominatorParam !== null && Number.isFinite(denominator)) {
    state.denominator = denominator;
  }
  if (gridMultipleParam !== null && Number.isFinite(gridMultiple)) {
    state.gridMultiple = gridMultiple;
  }
  if (equivalenceMultipleParam !== null && Number.isFinite(equivalenceMultiple)) {
    state.equivalenceMultiple = equivalenceMultiple;
  }
  if (moneyGroupedParam !== null) {
    state.moneyGrouped = moneyGroupedParam === "1";
  }
  if (panels !== null) {
    const enabled = new Set(
      panels
        .split(",")
        .map((panelId) => panelId.trim())
        .filter((panelId) => panelIds.includes(panelId)),
    );
    panelIds.forEach((panelId) => {
      state.enabledPanels[panelId] = enabled.has(panelId);
    });
  }
  if (order !== null) {
    const orderedPanels = order
      .split(",")
      .map((panelId) => panelId.trim())
      .filter((panelId, index, all) => panelIds.includes(panelId) && all.indexOf(panelId) === index);
    if (orderedPanels.length > 0) {
      state.panelOrder = [
        ...orderedPanels,
        ...panelIds.filter((panelId) => !orderedPanels.includes(panelId)),
      ];
    }
  } else if (panels !== null) {
    const orderedPanels = panels
      .split(",")
      .map((panelId) => panelId.trim())
      .filter((panelId, index, all) => panelIds.includes(panelId) && all.indexOf(panelId) === index);
    state.panelOrder = [
      ...orderedPanels,
      ...panelIds.filter((panelId) => !orderedPanels.includes(panelId)),
    ];
  }

  normalizeState();
}

function syncUrlSettings() {
  const params = new URLSearchParams();
  params.set("n", String(state.numerator));
  params.set("d", String(state.denominator));
  params.set("gm", String(state.gridMultiple));
  params.set("em", String(state.equivalenceMultiple));
  params.set("mg", state.moneyGrouped ? "1" : "0");
  params.set(
    "panels",
    state.panelOrder.filter((panelId) => state.enabledPanels[panelId]).join(","),
  );
  params.set("order", state.panelOrder.join(","));
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}

function renderPanelTitle(panelId, title, revealedText, hiddenText = "Work it out, then reveal it.") {
  const revealed = state.revealed[panelId];
  const titleText = revealed ? revealedText : hiddenText;
  return `
    <div class="panel-title">
      <div>
        <h2 id="${panelId}-title">${title}</h2>
        ${titleText ? `<p>${titleText}</p>` : ""}
      </div>
      <button
        class="reveal-toggle"
        type="button"
        data-toggle-panel="${panelId}"
        aria-pressed="${revealed}"
        aria-label="${revealed ? `Hide ${title} answer` : `Show ${title} answer`}"
      >
        ${revealed ? "Hide" : "Show"}
      </button>
    </div>
  `;
}

function renderSettingsPanel() {
  const toggles = state.panelOrder
    .map((panelId, index) => {
      const isFirst = index === 0;
      const isLast = index === state.panelOrder.length - 1;
      return `
        <div class="settings-row">
          <label class="settings-toggle">
            <input
              type="checkbox"
              data-panel-setting="${panelId}"
              ${state.enabledPanels[panelId] ? "checked" : ""}
            />
            <span>${panelLabels[panelId]}</span>
          </label>
          <div class="settings-order-controls" aria-label="Move ${panelLabels[panelId]}">
            <button
              type="button"
              data-panel-move="${panelId}"
              data-direction="-1"
              aria-label="Move ${panelLabels[panelId]} up"
              ${isFirst ? "disabled" : ""}
            >↑</button>
            <button
              type="button"
              data-panel-move="${panelId}"
              data-direction="1"
              aria-label="Move ${panelLabels[panelId]} down"
              ${isLast ? "disabled" : ""}
            >↓</button>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="settings-wrap">
      <button
        class="settings-button"
        type="button"
        data-settings-toggle
        aria-expanded="${state.settingsOpen}"
      >
        Settings
      </button>
      ${
        state.settingsOpen
          ? `<div class="settings-panel" role="group" aria-label="Panel settings">${toggles}</div>`
          : ""
      }
    </div>
  `;
}

function moneyCoins(pence) {
  const coins = [];
  let remaining = pence;
  for (const value of coinValues) {
    while (remaining >= value) {
      coins.push(value);
      remaining -= value;
    }
  }
  return coins;
}

function renderCoinImage(coin) {
  return `
    <span class="coin coin-image" aria-label="${coinLabels[coin]} coin">
      <img src="${assetPath(`coin_images/${coinImageFiles[coin]}`)}" alt="" aria-hidden="true" />
    </span>
  `;
}

function renderMoneyGroup(groupIndex, groupPenceValue, denominator, revealed) {
  if (!revealed) {
    return `
      <div class="money-group money-group-hidden" aria-label="hidden money group ${groupIndex + 1}">
        <span>?</span>
      </div>
    `;
  }

  const wholePence = Math.floor(groupPenceValue);
  const fractionalPenny = groupPenceValue - wholePence;
  const fractionalPennyFraction = fractionalPennyPartsForGroup(denominator);
  const fractionalPennyLabel = fractionalPennyFraction
    ? `${fractionalPennyFraction.numerator}/${fractionalPennyFraction.denominator}`
    : "";
  const coins = moneyCoins(wholePence);
  const coinHtml = coins.map((coin) => renderCoinImage(coin)).join("");
  const fractionalCoinHtml = fractionalPennyFraction
    ? renderFractionalPenny(fractionalPenny, fractionalPennyLabel)
    : "";
  const groupLabel = `${formatPence(groupPenceValue)}p`;

  return `
    <div class="money-group" aria-label="group ${groupIndex + 1}: ${groupLabel}">
      <span class="money-group-label">${groupLabel}</span>
      <div class="money-group-coins">
        ${coinHtml}${fractionalCoinHtml || (coinHtml ? "" : `<span class="zero-money">0p</span>`)}
      </div>
    </div>
  `;
}

function polarToCartesian(cx, cy, r, angleDegrees) {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRadians),
    y: cy + r * Math.sin(angleRadians),
  };
}

function wedgePath(index, total, radius = 92, cx = 100, cy = 100) {
  const startAngle = (index / total) * 360;
  const endAngle = ((index + 1) / total) * 360;
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function radialLine(angleDegrees, radius = 92, cx = 100, cy = 100) {
  const end = polarToCartesian(cx, cy, radius, angleDegrees);
  return `<line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}"></line>`;
}

function setFraction(numerator, denominator) {
  state.numerator = numerator;
  state.denominator = denominator;
  normalizeState();
  hideAnswers();
  syncUrlSettings();
  render();
}

function numberlineX(value, maxValue = 1) {
  const start = 56;
  const end = 944;
  return start + (value / maxValue) * (end - start);
}

function renderSvgFractionLabel(x, y, label, width = 102, height = 72, extraClass = "") {
  return `
    <foreignObject x="${x - width / 2}" y="${y}" width="${width}" height="${height}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="svg-math-label ${extraClass}">${label}</div>
    </foreignObject>
  `;
}

function renderStaticNumberline({
  numerator,
  denominator,
  revealed,
  mode,
  markerLabel,
}) {
  const axisY = 126;
  const rodY = 48;
  const rodH = 42;
  const markerValue = fractionValue(numerator, denominator);
  const maxValue = wholeScaleFor(numerator, denominator);
  const totalChunks = denominator * maxValue;
  const minWidth = Math.max(680, totalChunks * 78);
  const markerX = numberlineX(markerValue, maxValue);
  const chunkColor = mode === "decimal" ? "decimal" : "fraction";
  const rods = Array.from({ length: totalChunks }, (_, index) => {
    const x1 = numberlineX(index / denominator, maxValue);
    const x2 = numberlineX((index + 1) / denominator, maxValue);
    const width = Math.max(0, x2 - x1 - 1);
    const selected = revealed && index < numerator;
    return `
      <g>
        <rect class="svg-rod ${chunkColor}-rod ${selected ? `${chunkColor}-rod-selected` : ""}" x="${x1}" y="${rodY}" width="${width}" height="${rodH}" rx="0"></rect>
        ${
          revealed
            ? `<text class="svg-rod-text ${selected ? "svg-rod-text-selected" : ""}" x="${x1 + width / 2}" y="${rodY + rodH / 2 + 1}">${index + 1}</text>`
            : ""
        }
      </g>
    `;
  }).join("");
  const fractionTicks = Array.from({ length: totalChunks + 1 }, (_, index) => {
    const x = numberlineX(index / denominator, maxValue);
    const label =
      index === 0
        ? mathMarkup("0")
        : index % denominator === 0
          ? mathMarkup(String(index / denominator))
          : mathFraction(index, denominator);
    const isAnswerTick = index === numerator;
    const showLabel = revealed || index % denominator === 0;
    return `
      <g>
        <line class="svg-grid-line" x1="${x}" x2="${x}" y1="${mode === "decimal" ? rodY + rodH : rodY}" y2="${axisY + 8}"></line>
        <line class="svg-tick-line" x1="${x}" x2="${x}" y1="${axisY}" y2="${axisY + 8}"></line>
        ${showLabel ? renderSvgFractionLabel(x, axisY + 14, label, 102, 72, revealed && isAnswerTick ? "svg-math-label-active" : "") : ""}
      </g>
    `;
  }).join("");
  const decimalTickStep = denominator % 10 === 0 ? 0.1 : 0.05;
  const decimalTickCount = Math.round(maxValue / decimalTickStep);
  const decimalTicks = Array.from({ length: decimalTickCount + 1 }, (_, index) => {
    const value = index * decimalTickStep;
    const x = numberlineX(value, maxValue);
    const isLabelledTick = Number.isInteger(Math.round(value * 100) / 10);
    const label = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return `
      <g>
        <line class="svg-grid-line ${isLabelledTick ? "" : "svg-grid-line-minor"}" x1="${x}" x2="${x}" y1="${rodY + rodH}" y2="${axisY + 8}"></line>
        <line class="svg-tick-line" x1="${x}" x2="${x}" y1="${axisY}" y2="${axisY + 8}"></line>
        ${isLabelledTick ? renderSvgFractionLabel(x, axisY + 14, mathMarkup(label), 76, 72, "svg-decimal-math-label") : ""}
      </g>
    `;
  }).join("");
  const ticks = mode === "decimal" ? decimalTicks : fractionTicks;

  return `
    <svg class="static-numberline ${mode}-static-numberline" style="min-width:${minWidth}px" viewBox="0 0 1000 230" role="img">
      <g>
        ${rods}
        <line class="svg-axis-line" x1="${numberlineX(0, maxValue)}" x2="${numberlineX(maxValue, maxValue)}" y1="${axisY}" y2="${axisY}"></line>
        ${ticks}
        ${
          revealed
            ? mode === "decimal"
              ? `
                <rect class="svg-answer-fill decimal-answer-fill" x="${numberlineX(0, maxValue)}" y="${axisY - 12}" width="${markerX - numberlineX(0, maxValue)}" height="24"></rect>
                <line class="svg-answer-marker" x1="${markerX}" x2="${markerX}" y1="${rodY - 12}" y2="${axisY + 12}"></line>
                <foreignObject x="${markerX - 58}" y="${rodY - 44}" width="116" height="38">
                  <div xmlns="http://www.w3.org/1999/xhtml" class="svg-answer-label">${markerLabel}</div>
                </foreignObject>
              `
              : `<line class="svg-answer-marker" x1="${markerX}" x2="${markerX}" y1="${rodY - 12}" y2="${axisY + 12}"></line>`
            : ""
        }
      </g>
    </svg>
  `;
}

function renderNumberLine(numerator, denominator) {
  const revealed = state.revealed.numberline;
  const maxValue = wholeScaleFor(numerator, denominator);
  const revealedText = fractionValue(numerator, denominator) > 1
    ? `Each whole is divided into ${denominator} equal ${plural(denominator, "part")}. The point is at ${numerator}/${denominator}, which is ${mixedNumberWords(numerator, denominator)}.`
    : `The interval from 0 to 1 is divided into ${denominator} equal ${plural(denominator, "part")}. The point is at ${fractionWords(numerator, denominator)}.`;

  return `
    <section class="panel wide" aria-labelledby="numberline-title">
      ${renderPanelTitle(
        "numberline",
        "Fraction numberline",
        revealedText,
        `Where is ${fractionWords(numerator, denominator)} on the number line?`,
      )}
      <div class="numberline-shell" aria-label="Number line from 0 to ${maxValue} split into ${denominator} ${plural(denominator, "section")} per whole${revealed ? ` with ${numerator} highlighted` : ""}">
        ${renderStaticNumberline({
          numerator,
          denominator,
          revealed,
          mode: "fraction",
          markerLabel: mathFraction(numerator, denominator),
        })}
      </div>
    </section>
  `;
}

function renderDecimalNumberLine(numerator, denominator) {
  const revealed = state.revealed.decimalNumberline;
  const maxValue = wholeScaleFor(numerator, denominator);
  const decimal = decimalInfo(numerator, denominator);
  const revealedText = decimal.exact
    ? `${numerator}/${denominator} is equal to ${decimal.text}.`
    : `As a decimal, ${numerator}/${denominator} is approximately ${decimal.text}.`;

  return `
    <section class="panel wide" aria-labelledby="decimalNumberline-title">
      ${renderPanelTitle(
        "decimalNumberline",
        "Decimal numberline",
        revealedText,
        `What decimal is equivalent to ${fractionWords(numerator, denominator)}?`,
      )}
      <div class="numberline-shell" aria-label="Decimal numberline from 0 to ${maxValue} split into ${denominator} parts per whole${revealed ? ` and filled to ${decimal.text}` : ""}">
        ${renderStaticNumberline({
          numerator,
          denominator,
          revealed,
          mode: "decimal",
          markerLabel: decimal.text,
        })}
      </div>
    </section>
  `;
}

function renderPieSliceLabel(index, denominator, selected, partOffset = 0) {
  const position = denominator === 1
    ? { x: 100, y: 100 }
    : polarToCartesian(100, 100, 54, ((index + 0.5) / denominator) * 360);
  return `
    <text
      class="pie-slice-label ${selected ? "pie-slice-label-selected" : ""}"
      x="${position.x}"
      y="${position.y}"
    >${partOffset + index + 1}</text>
  `;
}

function renderPieSvg(denominator, selectedSlices, revealed, partOffset = 0) {
  const slices =
    denominator === 1
      ? `<circle cx="100" cy="100" r="92" class="${revealed && selectedSlices > 0 ? "pie-selected" : "pie-empty"}"></circle>`
      : Array.from({ length: denominator }, (_, index) => {
          const selected = revealed && index < selectedSlices;
          return `<path d="${wedgePath(index, denominator)}" class="${selected ? "pie-selected" : "pie-empty"}"></path>`;
        }).join("");
  const labels = Array.from({ length: denominator }, (_, index) => {
    const selected = revealed && index < selectedSlices;
    return renderPieSliceLabel(index, denominator, selected, partOffset);
  }).join("");

  return `
    <svg class="pie" viewBox="0 0 200 200" role="img">
      ${slices}
      ${labels}
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--ink)" stroke-width="2"></circle>
    </svg>
  `;
}

function renderPie(numerator, denominator) {
  const revealed = state.revealed.pie;
  const pieCount = wholeScaleFor(numerator, denominator);
  const pies = Array.from({ length: pieCount }, (_, index) => {
    const selectedSlices = clamp(numerator - index * denominator, 0, denominator);
    return renderPieSvg(denominator, selectedSlices, revealed, index * denominator);
  }).join("");
  const revealedText = fractionValue(numerator, denominator) > 1
    ? `${numerator}/${denominator} is equal to ${mixedNumberWords(numerator, denominator)}. That amount is shaded across the wholes.`
    : `${numerator} of the ${denominator} equal ${plural(denominator, "part")} ${numerator === 1 ? "is" : "are"} shaded. The fraction is ${fractionWords(numerator, denominator)}.`;

  return `
    <section class="panel" aria-labelledby="pie-title">
      ${renderPanelTitle(
        "pie",
        "Pie",
        revealedText,
        `Each whole is divided into ${denominator} equal ${plural(denominator, "part")}. How many parts should be shaded?`,
      )}
      <div class="pie-set" role="img" aria-label="${pieCount} ${plural(pieCount, "pie")} split into ${denominator} equal ${plural(denominator, "part")}${revealed ? ` with ${numerator} shaded parts` : ""}">
        ${pies}
      </div>
    </section>
  `;
}

function renderEquivalencePie(numerator, denominator, multiple, revealed, split = false) {
  const total = split ? denominator * multiple : denominator;
  const selected = split ? numerator * multiple : numerator;
  const slices =
    total === 1
      ? `<circle cx="100" cy="100" r="92" class="${revealed && selected === 1 ? "equivalence-fill-blue" : "pie-empty"}"></circle>`
      : Array.from({ length: total }, (_, index) => {
          const group = split ? Math.floor(index / multiple) : index;
          const isSelected = revealed && index < selected;
          const fillClass = isSelected
            ? equivalenceFillClasses[group % equivalenceFillClasses.length]
            : "pie-empty";
          return `<path d="${wedgePath(index, total)}" class="${fillClass}"></path>`;
        }).join("");
  const groupLines =
    split && denominator > 1
      ? Array.from({ length: denominator }, (_, index) =>
          radialLine((index / denominator) * 360),
        ).join("")
      : "";

  return `
    <svg class="pie equivalence-pie" viewBox="0 0 200 200" role="img">
      ${slices}
      <g class="equivalence-group-lines">${groupLines}</g>
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--ink)" stroke-width="2"></circle>
    </svg>
  `;
}

function renderEquivalence(numerator, denominator) {
  const revealed = state.revealed.equivalence;
  const multiple = state.equivalenceMultiple;
  const equivalentNumerator = numerator * multiple;
  const equivalentDenominator = denominator * multiple;
  const groupCount = wholeScaleFor(numerator, denominator);
  const originalPies = Array.from({ length: groupCount }, (_, index) => {
    const selectedParts = clamp(numerator - index * denominator, 0, denominator);
    return renderEquivalencePie(selectedParts, denominator, multiple, revealed);
  }).join("");
  const equivalentPies = Array.from({ length: groupCount }, (_, index) => {
    const selectedParts = clamp(numerator - index * denominator, 0, denominator);
    return renderEquivalencePie(selectedParts, denominator, multiple, revealed, true);
  }).join("");

  return `
    <section class="panel wide" aria-labelledby="equivalence-title">
      ${renderPanelTitle(
        "equivalence",
        "Equivalent fractions",
        `${numerator}/${denominator} = ${equivalentNumerator}/${equivalentDenominator}. The same whole is shaded.`,
        `Each equal part is split into ${multiple} smaller equal ${plural(multiple, "part")}. What equivalent fraction does this make?`,
      )}
      <label class="inline-control equivalence-control">
        <span>Split each part into</span>
        <input id="equivalenceMultiple" type="range" min="2" max="8" value="${multiple}" />
        <strong>${multiple}</strong>
      </label>
      <div class="equivalence-view" role="img" aria-label="${revealed ? `${numerator} over ${denominator} equals ${equivalentNumerator} over ${equivalentDenominator}` : `Original pie and split pie hidden answer`}">
        <div class="equivalence-part">
          <div class="equivalence-pie-set">${originalPies}</div>
          <div class="equivalence-label">${mathFraction(numerator, denominator)}</div>
        </div>
        <div class="equivalence-symbol" aria-hidden="true">=</div>
        <div class="equivalence-part">
          <div class="equivalence-pie-set">${equivalentPies}</div>
          <div class="equivalence-label">
            ${revealed ? mathFraction(equivalentNumerator, equivalentDenominator) : "?"}
          </div>
        </div>
      </div>
      <div class="equivalence-equation" aria-hidden="${revealed ? "false" : "true"}">
        ${revealed ? mathEquivalence(numerator, denominator, multiple) : ""}
      </div>
    </section>
  `;
}

function renderMoney(numerator, denominator) {
  const revealed = state.revealed.money;
  const grouped = state.moneyGrouped;
  const penceValue = (numerator / denominator) * 100;
  const groupPenceValue = 100 / denominator;
  const wholePence = Math.floor(penceValue);
  const fractionalPenny = penceValue - wholePence;
  const hasFractionalPenny = fractionalPenny > 0.0001;
  const fractionalPennyFraction = fractionalPennyParts(numerator, denominator);
  const fractionalPennyLabel = fractionalPennyFraction
    ? `${fractionalPennyFraction.numerator}/${fractionalPennyFraction.denominator}`
    : "";
  const displayMoney = moneyTextFromPence(penceValue);
  const penceText = formatPence(penceValue);
  const groupPenceText = formatPence(groupPenceValue);
  const groupFractionalPennyFraction = fractionalPennyPartsForGroup(denominator);
  const groupFractionalPennyLabel = groupFractionalPennyFraction
    ? `${groupFractionalPennyFraction.numerator}/${groupFractionalPennyFraction.denominator}`
    : "";
  const fractionWordsText = sentenceStart(fractionWords(numerator, denominator));
  const exactPence = exactPenceFor(numerator, denominator);
  const amountText = fractionValue(numerator, denominator) > 1
    ? exactPence === null
      ? `${fractionWordsText} of £1 is about ${displayMoney}. That is ${penceText}p.`
      : `${fractionWordsText} of £1 is ${displayMoney}. That is ${moneyAmountWords(exactPence)}, which is ${exactPence}p.`
    : exactPence === null
      ? `${fractionWordsText} of £1 is about ${displayMoney}. That is ${penceText}p.`
      : `${fractionWordsText} of £1 is ${displayMoney}. That is ${exactPence}p.`;
  const revealedText = grouped
    ? `${amountText} It is shown as ${numerator} ${plural(numerator, "group")} of ${groupPenceText}p.`
    : amountText;
  const coins = moneyCoins(wholePence);
  const ungroupedCoinCount = coins.length + (hasFractionalPenny ? 1 : 0);
  const wholeCoinHtml = coins.length
    ? coins
        .map(
          (coin) => renderCoinImage(coin),
        )
        .join("")
    : "";
  const fractionalCoinHtml = hasFractionalPenny
    ? renderFractionalPenny(fractionalPenny, fractionalPennyLabel)
    : "";
  const coinHtml = wholeCoinHtml || fractionalCoinHtml
    ? `${wholeCoinHtml}${fractionalCoinHtml}`
    : `<span class="zero-money">0p</span>`;
  const hiddenCoins = ungroupedCoinCount
    ? Array.from({ length: ungroupedCoinCount })
        .map(
          (_, index) =>
            `<span class="coin coin-hidden" aria-label="hidden coin ${index + 1}">?</span>`,
        )
        .join("")
    : `<span class="zero-money">0 coins</span>`;
  const groupedCoinHtml = numerator
    ? Array.from({ length: numerator })
        .map((_, index) => renderMoneyGroup(index, groupPenceValue, denominator, revealed))
        .join("")
    : `<span class="zero-money">0p</span>`;
  const moneyHtml = grouped
    ? groupedCoinHtml
    : revealed
      ? coinHtml
      : hiddenCoins;
  const moneyAriaLabel = grouped
    ? revealed
      ? `${penceText} pence shown as ${numerator} ${plural(numerator, "group")} of ${groupPenceText} pence`
      : `${numerator} hidden money ${plural(numerator, "group")}`
    : revealed
      ? `${penceText} pence shown using UK coins`
      : `${ungroupedCoinCount} hidden UK ${plural(ungroupedCoinCount, "coin")}`;

  return `
    <section class="panel" aria-labelledby="money-title">
      ${renderPanelTitle(
        "money",
        "Money",
        revealedText,
        `If £1 is one whole, what amount is ${fractionWords(numerator, denominator)}?`,
      )}
      <label class="money-group-toggle">
        <input type="checkbox" data-money-group ${grouped ? "checked" : ""} />
        <span>Group</span>
      </label>
      <div class="coins ${grouped ? "money-groups" : ""}" role="img" aria-label="${moneyAriaLabel}">
        ${moneyHtml}
      </div>
      ${
        revealed && grouped && groupFractionalPennyFraction
          ? `<p class="hint">Each group includes ${groupFractionalPennyLabel} of a penny.</p>`
          : revealed && hasFractionalPenny
            ? `<p class="hint">The last coin shows ${fractionalPennyLabel} of a penny.</p>`
            : ""
      }
    </section>
  `;
}

function renderHundredGrid(numerator, denominator) {
  const revealed = state.revealed.hundredGrid;
  const shadedHundredthsNumerator = numerator * 100;
  const wholeSquares = Math.floor(shadedHundredthsNumerator / denominator);
  const partialSquareNumerator = shadedHundredthsNumerator % denominator;
  const hasPartialSquare = partialSquareNumerator > 0;
  const totalSquaresText = formatPence(shadedHundredthsNumerator / denominator);
  const partialSquareDivisor = gcd(partialSquareNumerator, denominator);
  const partialSquareFraction = hasPartialSquare
    ? `${partialSquareNumerator / partialSquareDivisor}/${denominator / partialSquareDivisor}`
    : "";
  const partialSquareText = hasPartialSquare
    ? ` plus ${partialSquareFraction} of one more square`
    : "";
  const hundredthParts = Array.from({ length: numerator }, (_, index) => ({
    start: (index * 100) / denominator,
    end: ((index + 1) * 100) / denominator,
    color: index % 2 === 0 ? "var(--hundred-shade-a)" : "var(--hundred-shade-b)",
    className: index % 2 === 0 ? "shade-a" : "shade-b",
  }));
  const cells = Array.from({ length: 100 }, (_, index) => {
    const segments = revealed
      ? hundredthParts
          .map((part) => ({
            start: Math.max(index, part.start),
            end: Math.min(index + 1, part.end),
            color: part.color,
            className: part.className,
          }))
          .filter((segment) => segment.end - segment.start > 0.0001)
      : [];

    if (segments.length === 0) {
      return `<span>${index + 1}</span>`;
    }

    const isFullSingleSegment =
      segments.length === 1 &&
      segments[0].start <= index + 0.0001 &&
      segments[0].end >= index + 1 - 0.0001;

    if (isFullSingleSegment) {
      return `<span class="selected ${segments[0].className}">${index + 1}</span>`;
    }

    const gradientStops = [];
    let cursor = 0;
    segments.forEach((segment) => {
      const start = (segment.start - index) * 100;
      const end = (segment.end - index) * 100;
      if (start > cursor) {
        gradientStops.push(`white ${cursor}% ${start}%`);
      }
      gradientStops.push(`${segment.color} ${start}% ${end}%`);
      cursor = end;
    });
    if (cursor < 100) {
      gradientStops.push(`white ${cursor}% 100%`);
    }

    return `<span class="partial" style="background:linear-gradient(90deg, ${gradientStops.join(", ")})">${index + 1}</span>`;
  }).join("");

  return `
    <section class="panel" aria-labelledby="hundredGrid-title">
      ${renderPanelTitle(
        "hundredGrid",
        "100 square",
        `${numerator}/${denominator} is equal to ${totalSquaresText}/100, so ${wholeSquares} whole ${plural(wholeSquares, "square")}${partialSquareText} ${wholeSquares === 1 && !hasPartialSquare ? "is" : "are"} shaded.`,
        `If the whole is 100 squares, how many squares represent ${fractionWords(numerator, denominator)}?`,
      )}
      <div class="grid hundred-grid" role="img" aria-label="10 by 10 numbered grid${revealed ? ` with ${totalSquaresText} of 100 squares shaded` : " with no squares shaded"}">
        ${cells}
      </div>
    </section>
  `;
}

function renderCustomGrid(numerator, denominator) {
  const revealed = state.revealed.customGrid;
  const total = denominator * state.gridMultiple;
  const shaded = numerator * state.gridMultiple;
  const columns = denominator;
  const gridMaxWidth = columns * 48 + (columns - 1) * 4;
  const cells = Array.from({ length: total }, (_, index) => {
    const column = index % denominator;
    const selected = revealed && column < numerator;
    return `<span class="${selected ? "selected" : ""}"></span>`;
  }).join("");

  return `
    <section class="panel" aria-labelledby="customGrid-title">
      ${renderPanelTitle(
        "customGrid",
        "Equivalent fractions grid",
        `${numerator}/${denominator} = ${shaded}/${total}. The same whole is shaded.`,
        `If each equal part is split into ${state.gridMultiple} smaller equal ${plural(state.gridMultiple, "part")}, what equivalent fraction will be shown?`,
      )}
      <label class="inline-control">
        <span>Rows of ${denominator}</span>
        <input id="gridMultiple" type="range" min="1" max="12" value="${state.gridMultiple}" />
        <strong>${state.gridMultiple}</strong>
      </label>
      <div class="grid custom-grid" style="--columns:${columns}; --grid-max-width:${gridMaxWidth}px" role="img" aria-label="Grid with ${total} squares${revealed ? ` and ${shaded} shaded` : " and none shaded"}">
        ${cells}
      </div>
    </section>
  `;
}

function renderPictogram(numerator, denominator) {
  const revealed = state.revealed.pictogram;
  const groupCount = wholeScaleFor(numerator, denominator);
  const groups = Array.from({ length: groupCount }, (_, groupIndex) => {
    const apples = Array.from({ length: denominator }, (_, appleIndex) => {
      const globalIndex = groupIndex * denominator + appleIndex;
      const selected = revealed && globalIndex < numerator;
      return `<span class="apple ${selected ? "selected" : ""}" aria-label="${selected ? "shaded apple" : "unshaded apple"}">🍎</span>`;
    }).join("");
    return `
      <div class="apple-group-wrap">
        <div class="apple-group-label">1 whole</div>
        <div class="apple-group" style="--apple-columns:${denominator}">${apples}</div>
      </div>
    `;
  }).join("");
  const totalApples = groupCount * denominator;
  const revealedText = fractionValue(numerator, denominator) <= 1
    ? `${numerator} of the ${denominator} ${plural(denominator, "apple")} ${numerator === 1 ? "is" : "are"} selected. The fraction is ${fractionWords(numerator, denominator)}.`
    : `${numerator} ${plural(numerator, "apple")} ${numerator === 1 ? "is" : "are"} selected. Since ${denominator} ${plural(denominator, "apple")} make 1 whole group, this is ${mixedNumberWords(numerator, denominator)}.`;

  return `
    <section class="panel wide" aria-labelledby="pictogram-title">
      ${renderPanelTitle(
        "pictogram",
        "Apples",
        revealedText,
        `If 1 whole is ${denominator} ${plural(denominator, "apple")}, how many apples show ${fractionWords(numerator, denominator)}?`,
      )}
      <div class="apple-groups" role="img" aria-label="${totalApples} ${plural(totalApples, "apple")} in ${groupCount} ${plural(groupCount, "group")}${revealed ? ` with ${numerator} shaded` : " with none shaded"}">
        ${groups}
      </div>
    </section>
  `;
}

function renderPercentage(numerator, denominator) {
  const revealed = state.revealed.percentage;
  const percent = decimalInfo(numerator * 100, denominator, 1);
  const exactPercent = (numerator / denominator) * 100;
  const maxPercent = wholeScaleFor(numerator, denominator) * 100;
  const roundedPercent = Math.round(exactPercent);
  const revealedText = fractionValue(numerator, denominator) > 1
    ? `${numerator}/${denominator} is ${percent.exact ? "equal to" : "approximately"} ${percent.text}%, so it is more than one whole.`
    : `${numerator}/${denominator} is ${percent.exact ? "equal to" : "approximately"} ${percent.text}%.`;
  const markerStep = maxPercent <= 100 ? 25 : maxPercent <= 200 ? 50 : 100;
  const markerValues = Array.from(
    { length: Math.floor(maxPercent / markerStep) + 1 },
    (_, index) => index * markerStep,
  );
  if (markerValues[markerValues.length - 1] !== maxPercent) {
    markerValues.push(maxPercent);
  }
  const markers = markerValues
    .map((value) => `<span style="left:${(value / maxPercent) * 100}%">${value}%</span>`)
    .join("");
  const fillWidth = clamp((exactPercent / maxPercent) * 100, 0, 100);
  const markerPosition = clamp(fillWidth, 0, 100);
  const markerClass =
    markerPosition === 0 ? " at-start" : markerPosition === 100 ? " at-end" : "";

  return `
    <section class="panel wide" aria-labelledby="percentage-title">
      ${renderPanelTitle(
        "percentage",
        "Percentage",
        revealedText,
        "If the whole bar is 100%, what percentage is shaded?",
      )}
      <div class="percentage-vis" role="img" aria-label="${revealed ? `${percent.text} percent shaded on a 0 to ${maxPercent} percent bar` : `Percentage bar from 0 to ${maxPercent} percent with no answer shaded`}">
        <div class="percentage-track">
          <div class="percentage-fill" style="width:${revealed ? fillWidth : 0}%"></div>
          <div class="percentage-markers">${markers}</div>
          ${
            revealed
              ? `<div class="percentage-current${markerClass}" style="left:${markerPosition}%"><span>${percent.text}%</span></div>`
              : ""
          }
        </div>
        <div class="percentage-answer">${revealed ? `${percent.text}%` : "?"}</div>
      </div>
      ${revealed && percent.exact && Number.isInteger(exactPercent) ? `<p class="hint">${percent.text}% means ${percent.text} parts per hundred.</p>` : ""}
      ${
        revealed && !percent.exact
          ? `<p class="hint">Rounded to the nearest whole percent, this is ${roundedPercent}%.</p>`
          : ""
      }
    </section>
  `;
}

function renderPanel(panelId, numerator, denominator) {
  const panelRenderers = {
    numberline: renderNumberLine,
    decimalNumberline: renderDecimalNumberLine,
    pie: renderPie,
    money: renderMoney,
    hundredGrid: renderHundredGrid,
    customGrid: renderCustomGrid,
    pictogram: renderPictogram,
    equivalence: renderEquivalence,
    percentage: renderPercentage,
  };
  return panelRenderers[panelId](numerator, denominator);
}

function render() {
  normalizeState();
  syncUrlSettings();
  const { numerator, denominator } = state;
  const visiblePanels = visiblePanelIds(numerator, denominator);
  const allVisiblePanelsRevealed =
    visiblePanels.length > 0 && visiblePanels.every((panelId) => state.revealed[panelId]);
  const app = document.querySelector("#app");

  app.innerHTML = `
    <main>
      <section class="workspace" aria-labelledby="app-title">
        <header class="app-header">
          <h1 id="app-title">Fraction Explorer</h1>
        </header>

        <div class="intro">
          <form class="fraction-card" aria-label="Choose a fraction" aria-describedby="fraction-help">
            <p class="fraction-card-help" id="fraction-help">
              Type a numerator and denominator to choose the fraction. The diagrams update as you type.
            </p>
            <div class="fraction-editor-row">
              <label for="numerator">Numerator</label>
              <input id="numerator" type="number" min="0" value="${numerator}" inputmode="numeric" aria-describedby="fraction-help" />
            </div>
            <span class="fraction-bar" aria-hidden="true"></span>
            <div class="fraction-editor-row">
              <label for="denominator">Denominator</label>
              <input id="denominator" type="number" min="1" max="24" value="${denominator}" inputmode="numeric" aria-describedby="fraction-help" />
            </div>
          </form>

          <div class="hero-wrap">
            <div class="hero-fraction-wrap" aria-label="${numerator} over ${denominator}">
              <span class="hero-fraction">${mathFraction(numerator, denominator, true)}</span>
            </div>
          </div>
        </div>

        <div class="practice-bar">
          <div class="quick-picks" aria-label="Example fractions">
            <button type="button" data-fraction="1/2" aria-label="one half">${mathFraction(1, 2)}</button>
            <button type="button" data-fraction="1/3" aria-label="one third">${mathFraction(1, 3)}</button>
            <button type="button" data-fraction="1/4" aria-label="one quarter">${mathFraction(1, 4)}</button>
            <button type="button" data-fraction="3/7" aria-label="three sevenths">${mathFraction(3, 7)}</button>
            <button type="button" data-fraction="2/5" aria-label="two fifths">${mathFraction(2, 5)}</button>
            <button type="button" data-fraction="5/4" aria-label="five quarters">${mathFraction(5, 4)}</button>
          </div>
          <button
            class="reveal-all-toggle"
            type="button"
            data-toggle-all
            aria-pressed="${allVisiblePanelsRevealed}"
          >
            ${allVisiblePanelsRevealed ? "Hide all" : "Reveal all"}
          </button>
          ${renderSettingsPanel()}
        </div>

        <div class="panels">
          ${visiblePanels.map((panelId) => renderPanel(panelId, numerator, denominator)).join("")}
        </div>
      </section>
    </main>
  `;

  const updateFractionInput = (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value) || event.target.value === "") {
      return;
    }
    state[event.target.id] = value;
    normalizeState();
    hideAnswers();
    syncUrlSettings();
    render();
    const input = document.querySelector(`#${event.target.id}`);
    input?.focus();
    try {
      input?.setSelectionRange(input.value.length, input.value.length);
    } catch {
      // Number inputs do not support selection ranges in every browser.
    }
  };

  document.querySelector("#numerator").addEventListener("input", updateFractionInput);
  document.querySelector("#denominator").addEventListener("input", updateFractionInput);

  document.querySelector("#gridMultiple")?.addEventListener("input", (event) => {
    state.gridMultiple = Number(event.target.value);
    normalizeState();
    state.revealed.customGrid = false;
    syncUrlSettings();
    render();
  });

  document.querySelector("#equivalenceMultiple")?.addEventListener("input", (event) => {
    state.equivalenceMultiple = Number(event.target.value);
    normalizeState();
    state.revealed.equivalence = false;
    syncUrlSettings();
    render();
  });

  document.querySelector("[data-money-group]")?.addEventListener("change", (event) => {
    state.moneyGrouped = event.target.checked;
    normalizeState();
    syncUrlSettings();
    render();
  });

  document.querySelectorAll("[data-toggle-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.dataset.togglePanel;
      state.revealed[panelId] = !state.revealed[panelId];
      render();
    });
  });

  document.querySelector("[data-toggle-all]").addEventListener("click", () => {
    const nextRevealed = !visiblePanelIds(state.numerator, state.denominator).every(
      (panelId) => state.revealed[panelId],
    );
    panelIds.forEach((panelId) => {
      state.revealed[panelId] = false;
    });
    visiblePanelIds(state.numerator, state.denominator).forEach((panelId) => {
      state.revealed[panelId] = nextRevealed;
    });
    render();
  });

  document.querySelector("[data-settings-toggle]").addEventListener("click", () => {
    state.settingsOpen = !state.settingsOpen;
    render();
  });

  document.querySelectorAll("[data-panel-setting]").forEach((input) => {
    input.addEventListener("change", () => {
      const panelId = input.dataset.panelSetting;
      state.enabledPanels[panelId] = input.checked;
      state.revealed[panelId] = false;
      syncUrlSettings();
      render();
    });
  });

  document.querySelectorAll("[data-panel-move]").forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.dataset.panelMove;
      const direction = Number(button.dataset.direction);
      const currentIndex = state.panelOrder.indexOf(panelId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.panelOrder.length) {
        return;
      }
      const nextOrder = [...state.panelOrder];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [
        nextOrder[nextIndex],
        nextOrder[currentIndex],
      ];
      state.panelOrder = nextOrder;
      syncUrlSettings();
      render();
    });
  });

  document.querySelectorAll("[data-fraction]").forEach((button) => {
    button.addEventListener("click", () => {
      const [n, d] = button.dataset.fraction.split("/").map(Number);
      setFraction(n, d);
    });
  });
}

applyUrlSettings();
render();
