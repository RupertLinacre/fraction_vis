import katex from "katex";
import "katex/dist/katex.min.css";
import "./styles.css";

const state = {
  numerator: 3,
  denominator: 7,
  gridMultiple: 4,
  equivalenceMultiple: 2,
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
};

const panelIds = Object.keys(state.revealed);

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

const coinClasses = {
  100: "coin-pound",
  50: "coin-silver",
  20: "coin-silver",
  10: "coin-silver",
  5: "coin-silver",
  2: "coin-copper",
  1: "coin-copper",
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
const formatDecimal = (value, maxDigits = 1) =>
  Number.isInteger(value) ? String(value) : value.toFixed(maxDigits);

function normalizeState() {
  state.denominator = clamp(Math.trunc(state.denominator) || 1, 1, 24);
  state.numerator = clamp(Math.trunc(state.numerator) || 0, 0, state.denominator);
  state.gridMultiple = clamp(Math.trunc(state.gridMultiple) || 1, 1, 12);
  state.equivalenceMultiple = clamp(Math.trunc(state.equivalenceMultiple) || 2, 2, 8);
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

function hideAnswers() {
  panelIds.forEach((id) => {
    state.revealed[id] = false;
  });
}

function renderPanelTitle(panelId, title, revealedText, hiddenText = "Work it out, then reveal it.") {
  const revealed = state.revealed[panelId];
  return `
    <div class="panel-title">
      <div>
        <h2 id="${panelId}-title">${title}</h2>
        <p>${revealed ? revealedText : hiddenText}</p>
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
  render();
}

function renderNumberLine(numerator, denominator) {
  const revealed = state.revealed.numberline;
  const segmentPercent = 100 / denominator;
  const markerPercent = (numerator / denominator) * 100;
  const colouredVerb = numerator === 1 ? "is" : "are";
  const ticks = Array.from({ length: denominator + 1 }, (_, index) => {
    const isEndpoint = index === 0 || index === denominator;
    const label = isEndpoint
      ? index === 0
        ? "0"
        : "1"
      : mathFraction(index, denominator);
    return `
      <div class="numberline-tick" style="left:${index * segmentPercent}%">
        <span></span>
        <em>${label}</em>
      </div>
    `;
  }).join("");

  return `
    <section class="panel wide" aria-labelledby="numberline-title">
      ${renderPanelTitle(
        "numberline",
        "Fraction numberline",
        `${numerator} of ${denominator} equal ${plural(denominator, "step")} ${colouredVerb} coloured.`,
        `Split into ${denominator} equal ${plural(denominator, "step")}.`,
      )}
      <div class="numberline" role="img" aria-label="Number line from 0 to 1 split into ${denominator} ${plural(denominator, "section")}${revealed ? ` with ${numerator} highlighted` : ""}">
        <div class="numberline-track">
          <div class="numberline-fill" style="width:${revealed ? markerPercent : 0}%"></div>
          ${ticks}
          ${
            revealed
              ? `<div class="numberline-marker" style="left:${markerPercent}%">${mathFraction(numerator, denominator)}</div>`
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

function renderDecimalNumberLine(numerator, denominator) {
  const revealed = state.revealed.decimalNumberline;
  const value = numerator / denominator;
  const markerPercent = value * 100;
  const decimalText = formatDecimal(value, 3);
  const ticks = Array.from({ length: 11 }, (_, index) => {
    const tickValue = index / 10;
    const label = index === 0 ? "0" : index === 10 ? "1" : tickValue.toFixed(1);
    return `
      <div class="numberline-tick decimal-tick" style="left:${index * 10}%">
        <span></span>
        <em>${label}</em>
      </div>
    `;
  }).join("");

  return `
    <section class="panel wide" aria-labelledby="decimalNumberline-title">
      ${renderPanelTitle(
        "decimalNumberline",
        "Decimal numberline",
        `${numerator}/${denominator} is ${decimalText} as a decimal.`,
        "Where does this fraction sit between 0 and 1 as a decimal?",
      )}
      <div class="numberline decimal-numberline" role="img" aria-label="Decimal numberline from 0 to 1${revealed ? ` filled to ${decimalText}` : ""}">
        <div class="numberline-track">
          <div class="numberline-fill decimal-fill" style="width:${revealed ? markerPercent : 0}%"></div>
          ${ticks}
          ${
            revealed
              ? `<div class="numberline-marker decimal-marker" style="left:${markerPercent}%">${decimalText}</div>`
              : ""
          }
        </div>
      </div>
    </section>
  `;
}

function renderPie(numerator, denominator) {
  const revealed = state.revealed.pie;
  const slices =
    denominator === 1
      ? `<circle cx="100" cy="100" r="92" class="${revealed && numerator === 1 ? "pie-selected" : "pie-empty"}"></circle>`
      : Array.from({ length: denominator }, (_, index) => {
          const selected = revealed && index < numerator;
          return `<path d="${wedgePath(index, denominator)}" class="${selected ? "pie-selected" : "pie-empty"}"></path>`;
        }).join("");

  return `
    <section class="panel" aria-labelledby="pie-title">
      ${renderPanelTitle(
        "pie",
        "Pie",
        `${numerator} out of ${denominator} ${plural(denominator, "slice")}.`,
        `${denominator} equal ${plural(denominator, "slice")}.`,
      )}
      <svg class="pie" viewBox="0 0 200 200" role="img" aria-label="Circle split into ${denominator} ${plural(denominator, "slice")}${revealed ? ` with ${numerator} shaded` : ""}">
        ${slices}
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--ink)" stroke-width="2"></circle>
      </svg>
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
  const splitText = `Each original slice is split into ${multiple}.`;

  return `
    <section class="panel wide" aria-labelledby="equivalence-title">
      ${renderPanelTitle(
        "equivalence",
        "Equivalent fractions",
        `${splitText} ${equivalentNumerator} of ${equivalentDenominator} smaller slices are coloured.`,
        splitText,
      )}
      <label class="inline-control equivalence-control">
        <span>Split each slice into</span>
        <input id="equivalenceMultiple" type="range" min="2" max="8" value="${multiple}" />
        <strong>${multiple}</strong>
      </label>
      <div class="equivalence-view" role="img" aria-label="${revealed ? `${numerator} over ${denominator} equals ${equivalentNumerator} over ${equivalentDenominator}` : `Original pie and split pie hidden answer`}">
        <div class="equivalence-part">
          ${renderEquivalencePie(numerator, denominator, multiple, revealed)}
          <div class="equivalence-label">${mathFraction(numerator, denominator)}</div>
        </div>
        <div class="equivalence-symbol" aria-hidden="true">=</div>
        <div class="equivalence-part">
          ${renderEquivalencePie(numerator, denominator, multiple, revealed, true)}
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
  const exactPence = (numerator / denominator) * 100;
  const roundedPence = Math.round(exactPence);
  const exact = Number.isInteger(exactPence);
  const coins = moneyCoins(roundedPence);
  const coinHtml = coins.length
    ? coins
        .map(
          (coin) =>
            `<span class="coin ${coinClasses[coin]}" aria-label="${coinLabels[coin]} coin">${coinLabels[coin]}</span>`,
        )
        .join("")
    : `<span class="zero-money">0p</span>`;
  const hiddenCoins = coins.length
    ? coins
        .map(
          (_, index) =>
            `<span class="coin coin-hidden" aria-label="hidden coin ${index + 1}">?</span>`,
        )
        .join("")
    : `<span class="zero-money">0 coins</span>`;

  return `
    <section class="panel" aria-labelledby="money-title">
      ${renderPanelTitle(
        "money",
        "Money",
        `${exact ? "" : "About "}${roundedPence}p out of £1.`,
        `What is this fraction of £1?`,
      )}
      <div class="coins" role="img" aria-label="${revealed ? `${roundedPence} pence shown using UK coins` : `${coins.length} hidden UK ${plural(coins.length, "coin")}`}">
        ${revealed ? coinHtml : hiddenCoins}
      </div>
      ${revealed && !exact ? `<p class="hint">The exact amount is ${exactPence.toFixed(1)}p, so the coins are rounded.</p>` : ""}
    </section>
  `;
}

function renderHundredGrid(numerator, denominator) {
  const revealed = state.revealed.hundredGrid;
  const exactSquares = (numerator / denominator) * 100;
  const fullSquares = Math.floor(exactSquares);
  const partialSquare = exactSquares - fullSquares;
  const hasPartialSquare = partialSquare > 0.0001;
  const squareText = `${formatDecimal(exactSquares)} of 100 squares`;
  const cells = Array.from({ length: 100 }, (_, index) => {
    const selected = revealed && index < fullSquares;
    const partial = revealed && hasPartialSquare && index === fullSquares;
    const style = partial ? ` style="--partial-fill:${partialSquare * 100}%"` : "";
    return `<span class="${selected ? "selected" : ""}${partial ? " partial" : ""}"${style}></span>`;
  }).join("");

  return `
    <section class="panel" aria-labelledby="hundredGrid-title">
      ${renderPanelTitle(
        "hundredGrid",
        "100 square",
        `${squareText}.`,
        "100 empty squares.",
      )}
      <div class="grid hundred-grid" role="img" aria-label="10 by 10 grid${revealed ? ` with ${squareText} shaded` : " with no squares shaded"}">
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
        "Denominator grid",
        `${shaded} of ${total} squares.`,
        `${total} empty squares.`,
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
  const apples = Array.from({ length: denominator }, (_, index) => {
    const selected = revealed && index < numerator;
    return `<span class="apple ${selected ? "selected" : ""}" aria-label="${selected ? "shaded apple" : "unshaded apple"}">🍎</span>`;
  }).join("");

  return `
    <section class="panel wide" aria-labelledby="pictogram-title">
      ${renderPanelTitle(
        "pictogram",
        "Apples",
        `${numerator} red ${plural(numerator, "apple")} from a group of ${denominator}.`,
        `${denominator} ${plural(denominator, "apple")} ready to shade.`,
      )}
      <div class="apples" role="img" aria-label="${denominator} ${plural(denominator, "apple")}${revealed ? ` with ${numerator} shaded` : " with none shaded"}">
        ${apples}
      </div>
    </section>
  `;
}

function renderPercentage(numerator, denominator) {
  const revealed = state.revealed.percentage;
  const exactPercent = (numerator / denominator) * 100;
  const roundedPercent = Math.round(exactPercent);
  const exact = Number.isInteger(exactPercent);
  const displayPercent = formatDecimal(exactPercent);
  const markers = [0, 25, 50, 75, 100]
    .map((value) => `<span style="left:${value}%">${value}%</span>`)
    .join("");
  const markerPosition = clamp(exactPercent, 0, 100);
  const markerClass =
    markerPosition === 0 ? " at-start" : markerPosition === 100 ? " at-end" : "";

  return `
    <section class="panel wide" aria-labelledby="percentage-title">
      ${renderPanelTitle(
        "percentage",
        "Percentage",
        `${displayPercent}% means ${displayPercent} out of 100.`,
        "What percentage of the bar should be shaded?",
      )}
      <div class="percentage-vis" role="img" aria-label="${revealed ? `${displayPercent} percent shaded` : "Percentage bar with no answer shaded"}">
        <div class="percentage-track">
          <div class="percentage-fill" style="width:${revealed ? exactPercent : 0}%"></div>
          <div class="percentage-markers">${markers}</div>
          ${
            revealed
              ? `<div class="percentage-current${markerClass}" style="left:${markerPosition}%"><span>${displayPercent}%</span></div>`
              : ""
          }
        </div>
        <div class="percentage-answer">${revealed ? `${displayPercent}%` : "?"}</div>
      </div>
      ${
        revealed && !exact
          ? `<p class="hint">That is about ${roundedPercent}% rounded to the nearest whole percent.</p>`
          : ""
      }
    </section>
  `;
}

function render() {
  normalizeState();
  const { numerator, denominator } = state;
  const app = document.querySelector("#app");

  app.innerHTML = `
    <main>
      <section class="workspace" aria-labelledby="app-title">
        <div class="intro">
          <div>
            <p class="eyebrow">Fraction Explorer</p>
            <h1 id="app-title" aria-label="${numerator} over ${denominator}">
              <span class="hero-fraction">${mathFraction(numerator, denominator, true)}</span>
            </h1>
          </div>

          <form class="fraction-card" aria-label="Choose a fraction">
            <label>
              <span>Numerator</span>
              <input id="numerator" type="number" min="0" max="${denominator}" value="${numerator}" inputmode="numeric" />
            </label>
            <span class="fraction-bar" aria-hidden="true"></span>
            <label>
              <span>Denominator</span>
              <input id="denominator" type="number" min="1" max="24" value="${denominator}" inputmode="numeric" />
            </label>
          </form>
        </div>

        <div class="quick-picks" aria-label="Example fractions">
          <button type="button" data-fraction="1/2" aria-label="one half">${mathFraction(1, 2)}</button>
          <button type="button" data-fraction="1/3" aria-label="one third">${mathFraction(1, 3)}</button>
          <button type="button" data-fraction="1/4" aria-label="one quarter">${mathFraction(1, 4)}</button>
          <button type="button" data-fraction="3/7" aria-label="three sevenths">${mathFraction(3, 7)}</button>
          <button type="button" data-fraction="2/5" aria-label="two fifths">${mathFraction(2, 5)}</button>
        </div>

        <div class="panels">
          ${renderNumberLine(numerator, denominator)}
          ${renderDecimalNumberLine(numerator, denominator)}
          ${renderPie(numerator, denominator)}
          ${renderMoney(numerator, denominator)}
          ${renderHundredGrid(numerator, denominator)}
          ${renderCustomGrid(numerator, denominator)}
          ${renderPictogram(numerator, denominator)}
          ${renderEquivalence(numerator, denominator)}
          ${renderPercentage(numerator, denominator)}
        </div>
      </section>
    </main>
  `;

  document.querySelector("#numerator").addEventListener("change", (event) => {
    state.numerator = Number(event.target.value);
    normalizeState();
    hideAnswers();
    render();
  });

  document.querySelector("#denominator").addEventListener("change", (event) => {
    state.denominator = Number(event.target.value);
    normalizeState();
    hideAnswers();
    render();
  });

  document.querySelector("#gridMultiple").addEventListener("input", (event) => {
    state.gridMultiple = Number(event.target.value);
    normalizeState();
    state.revealed.customGrid = false;
    render();
  });

  document.querySelector("#equivalenceMultiple").addEventListener("input", (event) => {
    state.equivalenceMultiple = Number(event.target.value);
    normalizeState();
    state.revealed.equivalence = false;
    render();
  });

  document.querySelectorAll("[data-toggle-panel]").forEach((button) => {
    button.addEventListener("click", () => {
      const panelId = button.dataset.togglePanel;
      state.revealed[panelId] = !state.revealed[panelId];
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

render();
