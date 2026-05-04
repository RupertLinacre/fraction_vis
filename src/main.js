import katex from "katex";
import "katex/dist/katex.min.css";
import "./styles.css";

const state = {
  numerator: 3,
  denominator: 7,
  gridMultiple: 4,
  equivalenceMultiple: 2,
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
};

const panelIds = Object.keys(state.revealed);
const panelLabels = {
  numberline: "Fraction numberline",
  decimalNumberline: "Decimal numberline",
  pie: "Pie",
  money: "Money",
  hundredGrid: "100 square",
  customGrid: "Denominator grid",
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
const formatDecimal = (value, maxDigits = 1) =>
  Number.isInteger(value) ? String(value) : value.toFixed(maxDigits);
const assetPath = (path) => `${import.meta.env.BASE_URL}${path}`;

function normalizeState() {
  state.denominator = clamp(Math.trunc(state.denominator) || 1, 1, 24);
  state.numerator = Math.max(Math.trunc(state.numerator) || 0, 0);
  state.gridMultiple = clamp(Math.trunc(state.gridMultiple) || 1, 1, 12);
  state.equivalenceMultiple = clamp(Math.trunc(state.equivalenceMultiple) || 2, 2, 8);
  panelIds.forEach((panelId) => {
    state.enabledPanels[panelId] = state.enabledPanels[panelId] !== false;
  });
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

function fractionValue(numerator, denominator) {
  return numerator / denominator;
}

function wholeScaleFor(numerator, denominator) {
  return Math.max(1, Math.ceil(fractionValue(numerator, denominator)));
}

function moneyText(pence) {
  const pounds = pence / 100;
  return pounds >= 1 ? `£${formatDecimal(pounds, 2)}` : `${formatDecimal(pence, 2)}p`;
}

function hideAnswers() {
  panelIds.forEach((id) => {
    state.revealed[id] = false;
  });
}

function availablePanelIds(numerator, denominator) {
  const visible = ["numberline", "decimalNumberline", "pie", "money", "pictogram", "percentage"];
  if (numerator <= denominator) {
    visible.splice(4, 0, "hundredGrid", "customGrid");
    visible.splice(7, 0, "equivalence");
  }
  return visible;
}

function visiblePanelIds(numerator, denominator) {
  return availablePanelIds(numerator, denominator).filter((panelId) => state.enabledPanels[panelId]);
}

function applyUrlSettings() {
  const params = new URLSearchParams(window.location.search);
  const numerator = Number(params.get("n"));
  const denominator = Number(params.get("d"));
  const gridMultiple = Number(params.get("gm"));
  const equivalenceMultiple = Number(params.get("em"));
  const panels = params.get("panels");

  if (Number.isFinite(numerator)) {
    state.numerator = numerator;
  }
  if (Number.isFinite(denominator)) {
    state.denominator = denominator;
  }
  if (Number.isFinite(gridMultiple)) {
    state.gridMultiple = gridMultiple;
  }
  if (Number.isFinite(equivalenceMultiple)) {
    state.equivalenceMultiple = equivalenceMultiple;
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

  normalizeState();
}

function syncUrlSettings() {
  const params = new URLSearchParams();
  params.set("n", String(state.numerator));
  params.set("d", String(state.denominator));
  params.set("gm", String(state.gridMultiple));
  params.set("em", String(state.equivalenceMultiple));
  params.set(
    "panels",
    panelIds.filter((panelId) => state.enabledPanels[panelId]).join(","),
  );
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
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

function renderSettingsPanel() {
  const toggles = panelIds
    .map(
      (panelId) => `
        <label class="settings-toggle">
          <input
            type="checkbox"
            data-panel-setting="${panelId}"
            ${state.enabledPanels[panelId] ? "checked" : ""}
          />
          <span>${panelLabels[panelId]}</span>
        </label>
      `,
    )
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

function renderFractionalPenny(fractionalPenny) {
  const label = `${formatDecimal(fractionalPenny, 2)} of a 1p coin`;
  return `
    <span class="coin coin-image coin-fraction" style="--coin-fill:${fractionalPenny * 100}%" aria-label="${label}">
      <img class="coin-fraction-ghost" src="${assetPath("coin_images/1p.png")}" alt="" aria-hidden="true" />
      <img class="coin-fraction-fill" src="${assetPath("coin_images/1p.png")}" alt="" aria-hidden="true" />
    </span>
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
    return `
      <g>
        <line class="svg-grid-line" x1="${x}" x2="${x}" y1="${mode === "decimal" ? rodY + rodH : rodY}" y2="${axisY + 8}"></line>
        <line class="svg-tick-line" x1="${x}" x2="${x}" y1="${axisY}" y2="${axisY + 8}"></line>
        ${revealed ? renderSvgFractionLabel(x, axisY + 14, label, 102, 72, isAnswerTick ? "svg-math-label-active" : "") : ""}
      </g>
    `;
  }).join("");
  const decimalTickCount = maxValue * 10;
  const decimalTicks = Array.from({ length: decimalTickCount + 1 }, (_, index) => {
    const value = index / 10;
    const x = numberlineX(value, maxValue);
    const label = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return `
      <g>
        <line class="svg-grid-line" x1="${x}" x2="${x}" y1="${rodY + rodH}" y2="${axisY + 8}"></line>
        <line class="svg-tick-line" x1="${x}" x2="${x}" y1="${axisY}" y2="${axisY + 8}"></line>
        ${renderSvgFractionLabel(x, axisY + 14, mathMarkup(label), 76, 72, "svg-decimal-math-label")}
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
  const colouredVerb = numerator === 1 ? "is" : "are";
  const maxValue = wholeScaleFor(numerator, denominator);

  return `
    <section class="panel wide" aria-labelledby="numberline-title">
      ${renderPanelTitle(
        "numberline",
        "Fraction numberline",
        `${numerator} of ${denominator} equal ${plural(denominator, "step")} ${colouredVerb} coloured.`,
        `Split each whole into ${denominator} equal ${plural(denominator, "step")}.`,
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
  const value = fractionValue(numerator, denominator);
  const maxValue = wholeScaleFor(numerator, denominator);
  const decimalText = formatDecimal(value, 3);

  return `
    <section class="panel wide" aria-labelledby="decimalNumberline-title">
      ${renderPanelTitle(
        "decimalNumberline",
        "Decimal numberline",
        `${numerator}/${denominator} is ${decimalText} as a decimal.`,
        `Where does this fraction sit between 0 and ${maxValue} as a decimal?`,
      )}
      <div class="numberline-shell" aria-label="Decimal numberline from 0 to ${maxValue} split into ${denominator} chunks per whole${revealed ? ` and filled to ${decimalText}` : ""}">
        ${renderStaticNumberline({
          numerator,
          denominator,
          revealed,
          mode: "decimal",
          markerLabel: decimalText,
        })}
      </div>
    </section>
  `;
}

function renderPieSvg(denominator, selectedSlices, revealed) {
  const slices =
    denominator === 1
      ? `<circle cx="100" cy="100" r="92" class="${revealed && selectedSlices > 0 ? "pie-selected" : "pie-empty"}"></circle>`
      : Array.from({ length: denominator }, (_, index) => {
          const selected = revealed && index < selectedSlices;
          return `<path d="${wedgePath(index, denominator)}" class="${selected ? "pie-selected" : "pie-empty"}"></path>`;
        }).join("");

  return `
    <svg class="pie" viewBox="0 0 200 200" role="img">
      ${slices}
      <circle cx="100" cy="100" r="92" fill="none" stroke="var(--ink)" stroke-width="2"></circle>
    </svg>
  `;
}

function renderPie(numerator, denominator) {
  const revealed = state.revealed.pie;
  const pieCount = wholeScaleFor(numerator, denominator);
  const pies = Array.from({ length: pieCount }, (_, index) => {
    const selectedSlices = clamp(numerator - index * denominator, 0, denominator);
    return renderPieSvg(denominator, selectedSlices, revealed);
  }).join("");

  return `
    <section class="panel" aria-labelledby="pie-title">
      ${renderPanelTitle(
        "pie",
        "Pie",
        `${numerator} out of ${denominator} ${plural(denominator, "slice")} shown across ${pieCount} ${plural(pieCount, "pie")}.`,
        `${pieCount} ${plural(pieCount, "pie")} split into ${denominator} equal ${plural(denominator, "slice")}.`,
      )}
      <div class="pie-set" role="img" aria-label="${pieCount} ${plural(pieCount, "pie")} split into ${denominator} ${plural(denominator, "slice")}${revealed ? ` with ${numerator} shaded slices` : ""}">
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
  const exactPence = fractionValue(numerator, denominator) * 100;
  const wholePence = Math.floor(exactPence);
  const fractionalPenny = exactPence - wholePence;
  const hasFractionalPenny = fractionalPenny > 0.0001;
  const displayPence = formatDecimal(exactPence, 2);
  const displayMoney = moneyText(exactPence);
  const exact = Number.isInteger(exactPence);
  const coins = moneyCoins(wholePence);
  const coinCount = coins.length + (hasFractionalPenny ? 1 : 0);
  const wholeCoinHtml = coins.length
    ? coins
        .map(
          (coin) => renderCoinImage(coin),
        )
        .join("")
    : "";
  const fractionalCoinHtml = hasFractionalPenny
    ? renderFractionalPenny(fractionalPenny)
    : "";
  const coinHtml = wholeCoinHtml || fractionalCoinHtml
    ? `${wholeCoinHtml}${fractionalCoinHtml}`
    : `<span class="zero-money">0p</span>`;
  const hiddenCoins = coinCount
    ? Array.from({ length: coinCount })
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
        `${displayMoney}, or ${displayPence}p, out of £1.`,
        `What is this fraction of £1?`,
      )}
      <div class="coins" role="img" aria-label="${revealed ? `${displayPence} pence shown using UK coins` : `${coinCount} hidden UK ${plural(coinCount, "coin")}`}">
        ${revealed ? coinHtml : hiddenCoins}
      </div>
      ${revealed && !exact ? `<p class="hint">The last coin shows ${formatDecimal(fractionalPenny, 2)} of a penny.</p>` : ""}
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
  const groupCount = wholeScaleFor(numerator, denominator);
  const groups = Array.from({ length: groupCount }, (_, groupIndex) => {
    const apples = Array.from({ length: denominator }, (_, appleIndex) => {
      const globalIndex = groupIndex * denominator + appleIndex;
      const selected = revealed && globalIndex < numerator;
      return `<span class="apple ${selected ? "selected" : ""}" aria-label="${selected ? "shaded apple" : "unshaded apple"}">🍎</span>`;
    }).join("");
    return `<div class="apple-group" style="--apple-columns:${denominator}">${apples}</div>`;
  }).join("");
  const totalApples = groupCount * denominator;

  return `
    <section class="panel wide" aria-labelledby="pictogram-title">
      ${renderPanelTitle(
        "pictogram",
        "Apples",
        `${numerator} red ${plural(numerator, "apple")} from ${groupCount} ${plural(groupCount, "group")} of ${denominator}.`,
        `${groupCount} ${plural(groupCount, "group")} of ${denominator} ${plural(denominator, "apple")} ready to shade.`,
      )}
      <div class="apple-groups" role="img" aria-label="${totalApples} ${plural(totalApples, "apple")} in ${groupCount} ${plural(groupCount, "group")}${revealed ? ` with ${numerator} shaded` : " with none shaded"}">
        ${groups}
      </div>
    </section>
  `;
}

function renderPercentage(numerator, denominator) {
  const revealed = state.revealed.percentage;
  const exactPercent = fractionValue(numerator, denominator) * 100;
  const maxPercent = wholeScaleFor(numerator, denominator) * 100;
  const roundedPercent = Math.round(exactPercent);
  const exact = Number.isInteger(exactPercent);
  const displayPercent = formatDecimal(exactPercent);
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
        `${displayPercent}% means ${displayPercent} out of 100.`,
        "What percentage of the bar should be shaded?",
      )}
      <div class="percentage-vis" role="img" aria-label="${revealed ? `${displayPercent} percent shaded on a 0 to ${maxPercent} percent bar` : `Percentage bar from 0 to ${maxPercent} percent with no answer shaded`}">
        <div class="percentage-track">
          <div class="percentage-fill" style="width:${revealed ? fillWidth : 0}%"></div>
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
  syncUrlSettings();
  const { numerator, denominator } = state;
  const visiblePanels = visiblePanelIds(numerator, denominator);
  const allVisiblePanelsRevealed =
    visiblePanels.length > 0 && visiblePanels.every((panelId) => state.revealed[panelId]);
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
            <div class="fraction-editor-row">
              <label for="numerator">Numerator</label>
              <input id="numerator" type="number" min="0" value="${numerator}" inputmode="numeric" />
            </div>
            <span class="fraction-bar" aria-hidden="true"></span>
            <div class="fraction-editor-row">
              <label for="denominator">Denominator</label>
              <input id="denominator" type="number" min="1" max="24" value="${denominator}" inputmode="numeric" />
            </div>
          </form>
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
          ${visiblePanels.includes("numberline") ? renderNumberLine(numerator, denominator) : ""}
          ${visiblePanels.includes("decimalNumberline") ? renderDecimalNumberLine(numerator, denominator) : ""}
          ${visiblePanels.includes("pie") ? renderPie(numerator, denominator) : ""}
          ${visiblePanels.includes("money") ? renderMoney(numerator, denominator) : ""}
          ${visiblePanels.includes("hundredGrid") ? renderHundredGrid(numerator, denominator) : ""}
          ${visiblePanels.includes("customGrid") ? renderCustomGrid(numerator, denominator) : ""}
          ${visiblePanels.includes("pictogram") ? renderPictogram(numerator, denominator) : ""}
          ${visiblePanels.includes("equivalence") ? renderEquivalence(numerator, denominator) : ""}
          ${visiblePanels.includes("percentage") ? renderPercentage(numerator, denominator) : ""}
        </div>
      </section>
    </main>
  `;

  document.querySelector("#numerator").addEventListener("change", (event) => {
    state.numerator = Number(event.target.value);
    normalizeState();
    hideAnswers();
    syncUrlSettings();
    render();
  });

  document.querySelector("#denominator").addEventListener("change", (event) => {
    state.denominator = Number(event.target.value);
    normalizeState();
    hideAnswers();
    syncUrlSettings();
    render();
  });

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

  document.querySelectorAll("[data-fraction]").forEach((button) => {
    button.addEventListener("click", () => {
      const [n, d] = button.dataset.fraction.split("/").map(Number);
      setFraction(n, d);
    });
  });
}

applyUrlSettings();
render();
