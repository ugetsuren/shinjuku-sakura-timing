import type { Question } from "../data/questions";

export type Answers = Record<Question["id"], number>;

export type Forecast = {
  targetYear: number;
  center: Date;
  innerStart: Date;
  innerEnd: Date;
  outerStart: Date;
  outerEnd: Date;
  centerDayOfYear: number;
  innerStartDayOfYear: number;
  innerEndDayOfYear: number;
  confidence: "比較的高い" | "標準" | "低い";
  classification: string;
  interpretation: string;
  dominantFactor: string;
  modelDates: Date[];
  shiftDays: number;
};

// ─────────────────────────────────────────────────────────────
// 推定ロジック
// 1. 青野らの温度変換日数、2. 線形温度積算、3. Chuineの逐次型低温–加温、
// 4. Mengらの都市域での低温不足と加温促進、の4モデルを近似します。
// 入力が月偏差のため、論文式の厳密な再現ではなく感度分析用の縮約モデルです。
// ─────────────────────────────────────────────────────────────
function getTargetYear() {
  const now = new Date();
  return now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
}

function dateFromDoy(year: number, dayOfYear: number) {
  return new Date(year, 0, Math.round(dayOfYear));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function quantile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normal(random: () => number) {
  const u = Math.max(random(), 1e-9);
  const v = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function describe(shift: number, answers: Answers, spread: number) {
  if (answers.winter >= 1 && answers.february + answers.march >= 1) {
    return {
      classification: "休眠・加温競合型",
      interpretation: "冬の低温不足と春の高温が反対方向に作用しました。早期化だけを断定せず、幅を持った結果として読む必要があります。",
    };
  }
  if (answers.coldSnap >= 7 || spread >= 12) {
    return {
      classification: "寒暖変動型",
      interpretation: "寒の戻りとモデル間差が大きく、中心日より推定区間を重視すべき条件です。直前の気温実況で更新してください。",
    };
  }
  if (shift <= -4) {
    return {
      classification: "早期開花型",
      interpretation: "春季の加温効果が低温不足や寒の戻りを上回り、分布が平年より早い側へ移動しました。",
    };
  }
  if (shift >= 4) {
    return {
      classification: "晩期開花型",
      interpretation: "春季低温または寒の戻りの影響が強く、分布が平年より遅い側へ移動しました。",
    };
  }
  return {
    classification: "平年近傍型",
    interpretation: "各条件の作用がおおむね相殺され、東京の平年開花日の近くに分布しました。",
  };
}

export function forecastBloom(a: Answers): Forecast {
  const targetYear = getTargetYear();
  const baselineDoy = 83;

  // 低温充足度：1が平年相当。暖冬と都市熱で低下し、寒冬で増加します。
  const chillCompletion = clamp(
    1 - Math.max(0, a.winter) * 0.14 - a.urbanHeat * 0.035 + Math.max(0, -a.winter) * 0.055,
    0.55,
    1.12,
  );
  const chillPenalty = Math.max(0, 1 - chillCompletion);
  const coldSnapShift = (a.coldSnap - 4) * 0.55;
  const siteShift = -a.microclimate * 1.65;
  const urbanForcing = a.urbanHeat * (0.9 + 0.35 * chillCompletion);
  const effectiveFebruary = a.february + urbanForcing * 0.55;
  const effectiveMarch = a.march + urbanForcing;

  const contributions = {
    "冬季の低温量": chillPenalty * 10.5 + Math.min(0, a.winter) * 0.35,
    "2月の気温": -effectiveFebruary * 1.45,
    "3月の気温": -effectiveMarch * 2.55,
    "寒の戻り": coldSnapShift,
    "園内の局地環境": siteShift,
  };

  // A：温度変換日数法を月偏差へ縮約した非線形加温モデル。
  const dtsModel = baselineDoy
    + chillPenalty * 8.5
    - 1.3 * effectiveFebruary
    - 2.75 * effectiveMarch
    + coldSnapShift
    + siteShift;

  // B：観測研究の概ね2.5日/℃を基準にした線形温度積算モデル。
  const thermalModel = baselineDoy
    + chillPenalty * 6.5
    - 1.55 * effectiveFebruary
    - 2.45 * effectiveMarch
    + coldSnapShift * 0.85
    + siteShift * 0.85;

  // C：低温充足後に加温要求が下がる逐次型モデル。
  const forcingRequirementFactor = 1 + chillPenalty * 0.8;
  const sequentialModel = baselineDoy
    + chillPenalty * 12
    - (1.4 * effectiveFebruary + 2.35 * effectiveMarch) / forcingRequirementFactor
    + coldSnapShift * 1.15
    + siteShift;

  // D：都市域の加温促進と低温不足を同時に扱う交互作用モデル。
  const urbanModel = baselineDoy
    + chillPenalty * 10
    - 1.2 * effectiveFebruary
    - 2.25 * effectiveMarch
    + a.urbanHeat * chillPenalty * 3.5
    + coldSnapShift
    + siteShift * 1.15;

  const models = [dtsModel, thermalModel, sequentialModel, urbanModel];
  const disagreement = Math.max(...models) - Math.min(...models);
  const sigma = 2.5
    + Math.min(2.2, disagreement * 0.45)
    + chillPenalty * 2.1
    + Math.max(0, a.coldSnap - 6) * 0.14;
  const seed = Object.values(a).reduce(
    (total, value, index) => total + Math.round((value + 10) * (index + 7) * 997),
    42,
  );
  const random = seededRandom(seed);
  const samples = Array.from(
    { length: 1600 },
    (_, index) => models[index % models.length] + normal(random) * sigma,
  );

  const centerDoy = quantile(samples, 0.5);
  const innerLow = quantile(samples, 0.25);
  const innerHigh = quantile(samples, 0.75);
  const outerLow = quantile(samples, 0.1);
  const outerHigh = quantile(samples, 0.9);
  const spread = outerHigh - outerLow;
  const shiftDays = Math.round(centerDoy - baselineDoy);
  const description = describe(shiftDays, a, spread);
  const dominantFactor = Object.entries(contributions)
    .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))[0][0];

  return {
    targetYear,
    center: dateFromDoy(targetYear, centerDoy),
    innerStart: dateFromDoy(targetYear, innerLow),
    innerEnd: dateFromDoy(targetYear, innerHigh),
    outerStart: dateFromDoy(targetYear, outerLow),
    outerEnd: dateFromDoy(targetYear, outerHigh),
    centerDayOfYear: Math.round(centerDoy),
    innerStartDayOfYear: Math.round(innerLow),
    innerEndDayOfYear: Math.round(innerHigh),
    confidence: spread <= 8 ? "比較的高い" : spread <= 12 ? "標準" : "低い",
    classification: description.classification,
    interpretation: description.interpretation,
    dominantFactor,
    modelDates: models.map((day) => dateFromDoy(targetYear, day)),
    shiftDays,
  };
}

export function formatDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function dateLabelFromDoy(day: number, year = getTargetYear()) {
  return formatDate(dateFromDoy(year, day));
}

export function shiftLabel(days: number) {
  if (days === 0) return "平年とほぼ同じ";
  return `平年より約${Math.abs(days)}日${days < 0 ? "早い" : "遅い"}`;
}
