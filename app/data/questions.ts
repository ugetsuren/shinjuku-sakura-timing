export type Choice = {
  label: string;
  value: number;
  note: string;
  feedback: string;
};

export type Question = {
  id: "winter" | "february" | "march" | "coldSnap" | "urbanHeat" | "microclimate";
  number: string;
  category: string;
  title: string;
  prompt: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  recommendation: string;
  expertView: string;
  sourceLabel: string;
  sourceUrl: string;
  choices: Choice[];
};

// ─────────────────────────────────────────────────────────────
// 文章編集ファイル 1：質問、入力ガイド、選択肢、回答別定型文
// 表示文を直すときは、この配列内の文章だけを変更してください。
// value・min・max・stepは計算に使うため、文言修正時は変更不要です。
// ─────────────────────────────────────────────────────────────
export const questions: Question[] = [
  {
    id: "winter",
    number: "01",
    category: "冬季休眠",
    title: "12〜1月の平均気温偏差",
    prompt: "東京の平年値と比べた冬の気温差を選んでください。",
    symbol: "冬",
    unit: "℃",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    recommendation: "判断材料がなければ「平年並み」を選択してください。",
    expertView:
      "ソメイヨシノの花芽は、前年の夏に形成された後、冬の低温を受けて休眠から目覚めます。暖冬側を選ぶと、春の暖かさによる促進とは反対に、休眠解除の遅れを大きく見積もります。寒冬側では休眠が十分進んだ状態を想定します。実際の12〜1月平均が平年より約1℃高ければ「やや高温」、差が小さい、または予報を確認していない場合は「平年並み」を選んでください。",
    sourceLabel: "青野・村上（2017）；Fuほか（2015）",
    sourceUrl: "https://doi.org/10.2480/cib.J-17-033",
    choices: [
      { label: "顕著な低温", value: -2, note: "平年差 −2.0℃", feedback: "冬の低温が十分に蓄積し、休眠解除は円滑に進む条件として扱いました。" },
      { label: "やや低温", value: -1, note: "平年差 −1.0℃", feedback: "平年より低温の冬として、休眠解除がやや進みやすい条件を反映しました。" },
      { label: "平年並み", value: 0, note: "平年差 ±0.0℃", feedback: "冬季休眠は平年相当とし、春の気温条件を主に評価しました。" },
      { label: "やや高温", value: 1, note: "平年差 ＋1.0℃", feedback: "暖冬による低温不足を加え、春の昇温効果の一部を相殺しました。" },
      { label: "顕著な高温", value: 2, note: "平年差 ＋2.0℃", feedback: "強い暖冬を想定し、休眠解除時期の遅れと不確実性を大きくしました。" },
    ],
  },
  {
    id: "february",
    number: "02",
    category: "発育初期",
    title: "2月の平均気温偏差",
    prompt: "新宿御苑周辺の2月の気温差を選んでください。",
    symbol: "二",
    unit: "℃",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    recommendation: "季節予報が平年並みなら「平年並み」を選択してください。",
    expertView:
      "休眠解除後の花芽は、日々の温度効果を積み上げて発育します。2月は積算の開始を左右する時期で、暖かいほど原則として開花を早めます。ただし前問で暖冬を選んだ場合は、低温不足のため同じ暖かさでも促進効果を弱めて計算します。2月の月平均予報が平年より約1℃高い場合は「やや高温」、平年差が不明な場合は無理に推測せず「平年並み」を選んでください。",
    sourceLabel: "青野・小元（1990）；Chuine（2000）",
    sourceUrl: "https://doi.org/10.2480/agrmet.46.147",
    choices: [
      { label: "顕著な低温", value: -2, note: "平年差 −2.0℃", feedback: "2月の発育積算が大きく停滞する条件として、開花を遅い側へ補正しました。" },
      { label: "やや低温", value: -1, note: "平年差 −1.0℃", feedback: "2月の発育開始が緩やかな条件として、軽い遅延を加えました。" },
      { label: "平年並み", value: 0, note: "平年差 ±0.0℃", feedback: "2月の発育速度は平年相当として計算しました。" },
      { label: "やや高温", value: 1, note: "平年差 ＋1.0℃", feedback: "2月から温度効果が積み上がる条件として、開花を早い側へ補正しました。" },
      { label: "顕著な高温", value: 2, note: "平年差 ＋2.0℃", feedback: "2月の強い加温を反映しましたが、暖冬時は低温不足との競合も残しています。" },
    ],
  },
  {
    id: "march",
    number: "03",
    category: "発育加速期",
    title: "3月の平均気温偏差",
    prompt: "開花直前に当たる3月の気温差を選んでください。",
    symbol: "三",
    unit: "℃",
    min: -3,
    max: 3,
    step: 0.1,
    defaultValue: 0,
    recommendation: "月予報が「高い」なら、まず「やや高温」を選択してください。",
    expertView:
      "3月の気温は、休眠解除後の花芽発育を直接加速するため、6項目の中でも開花日を大きく動かします。長期観測では、春の生物季節は気温1℃の上昇に対して数日早まる傾向がありますが、年や樹木によって反応は一定ではありません。月予報の確率だけで極端な値を選ばず、平年より明瞭に高い見込みなら「やや高温」、記録的高温を想定するときだけ「顕著な高温」を選んでください。",
    sourceLabel: "Menzelほか（2006）；Miller-Rushingほか（2007）",
    sourceUrl: "https://doi.org/10.1111/j.1466-822X.2006.00247.x",
    choices: [
      { label: "顕著な低温", value: -2, note: "平年差 −2.0℃", feedback: "開花直前の発育が強く抑えられる条件として、大きな遅延を加えました。" },
      { label: "やや低温", value: -1, note: "平年差 −1.0℃", feedback: "3月の発育速度を平年より低くし、開花を遅い側へ補正しました。" },
      { label: "平年並み", value: 0, note: "平年差 ±0.0℃", feedback: "3月の発育積算は平年相当として扱いました。" },
      { label: "やや高温", value: 1, note: "平年差 ＋1.0℃", feedback: "開花直前の加温が進む条件として、中心日を早い側へ動かしました。" },
      { label: "顕著な高温", value: 2, note: "平年差 ＋2.0℃", feedback: "強い春季加温を反映し、各モデルで早期開花への寄与を大きくしました。" },
    ],
  },
  {
    id: "coldSnap",
    number: "04",
    category: "寒の戻り",
    title: "強い低温日の日数",
    prompt: "2月後半〜3月に発育を止める低温日が何日あるか選んでください。",
    symbol: "寒",
    unit: "日",
    min: 0,
    max: 14,
    step: 1,
    defaultValue: 4,
    recommendation: "具体的な日数を見積もれない場合は「平年程度」を選択してください。",
    expertView:
      "月平均気温が同じでも、暖かい日が連続する年と、途中に低温日が挟まる年では花芽の発育履歴が異なります。この項目は冬の休眠に必要な低温ではなく、発育開始後の停滞を表します。週間予報などから、最高・最低気温が平年を大きく下回る期間を数えてください。明確な低温期間が一度なら「少ない」、複数回続く想定なら「多い」、判断できなければ基準の「平年程度」を選びます。",
    sourceLabel: "Chuine（2000）；Castèdeほか（2014）",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/11082304/",
    choices: [
      { label: "ほぼない", value: 0, note: "0日", feedback: "寒の戻りによる停滞を加えず、連続的に発育する条件としました。" },
      { label: "少ない", value: 2, note: "2日", feedback: "短い低温期間による小さな発育停滞を反映しました。" },
      { label: "平年程度", value: 4, note: "4日", feedback: "寒の戻りは基準的な4日間として計算しました。" },
      { label: "多い", value: 7, note: "7日", feedback: "低温の反復で積算が途切れる条件として、遅延と予測幅を増やしました。" },
      { label: "非常に多い", value: 10, note: "10日", feedback: "長い発育停滞を想定し、中心日の遅れと不確実性を大きくしました。" },
    ],
  },
  {
    id: "urbanHeat",
    number: "05",
    category: "都市熱",
    title: "周辺市街地からの温度補正",
    prompt: "新宿の市街地が園内へ及ぼす温度上昇を選んでください。",
    symbol: "都",
    unit: "℃相当",
    min: 0,
    max: 1.5,
    step: 0.1,
    defaultValue: 0.3,
    recommendation: "初回は「標準補正」を選び、補正なしとの比較を推奨します。",
    expertView:
      "都市温暖化は春の加温を早める一方、冬の低温蓄積を減らし、温度感応度を弱める可能性があります。新宿御苑では周辺市街地との温度差や冷気の流出が観測されていますが、桜への直接的な補正値は確定していません。このため選択肢は実測値ではなく比較用です。園の冷却効果を重く見るなら「弱い補正」、標準的な感度分析では「標準補正」、強い都市熱を仮定するときだけ上位を選んでください。",
    sourceLabel: "成田ほか（2004）；Mengほか（2020）",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/32041872/",
    choices: [
      { label: "補正なし", value: 0, note: "＋0.0℃相当", feedback: "周辺市街地の都市熱を加えず、園内気候だけを想定しました。" },
      { label: "弱い補正", value: 0.15, note: "＋0.15℃相当", feedback: "新宿御苑の冷却効果を重く見て、都市熱の寄与を小さくしました。" },
      { label: "標準補正", value: 0.3, note: "＋0.3℃相当", feedback: "市街地から受ける都市熱を比較用の標準値として反映しました。" },
      { label: "強い補正", value: 0.6, note: "＋0.6℃相当", feedback: "都市熱による春季加温を強くしましたが、冬季低温の減少も同時に加えました。" },
      { label: "非常に強い補正", value: 1, note: "＋1.0℃相当", feedback: "強い都市温暖化を仮定し、加温促進と休眠不足が競合する条件にしました。" },
    ],
  },
  {
    id: "microclimate",
    number: "06",
    category: "園内環境",
    title: "対象木の局地温度補正",
    prompt: "日当たり、風、舗装との距離から対象木の環境を選んでください。",
    symbol: "苑",
    unit: "℃相当",
    min: -2,
    max: 2,
    step: 0.1,
    defaultValue: 0,
    recommendation: "具体的な木を決めていない場合は「園内平均」を選択してください。",
    expertView:
      "東京都心では、約2kmの範囲内でもソメイヨシノの開花日に10日を超える差が確認されています。単純な気温や日射だけでは説明できないため、この項目では枝の向き、風通し、地表面、樹体差をまとめて残差補正します。園の外縁や冷気が通る場所なら冷涼側、南向きで終日日射を受けるなら日当たり良好、舗装面や建物の近くで夜間も冷えにくい木だけ「舗装・建物近傍」を選んでください。",
    sourceLabel: "多田ほか（2020）",
    sourceUrl: "https://doi.org/10.11361/journalcpij.55.791",
    choices: [
      { label: "外縁・冷風条件", value: -1, note: "−1.0℃相当", feedback: "冷気の通り道にある木を想定し、園内平均より遅い側へ補正しました。" },
      { label: "やや冷涼", value: -0.5, note: "−0.5℃相当", feedback: "日陰や風通しによる小さな冷却を反映しました。" },
      { label: "園内平均", value: 0, note: "±0.0℃相当", feedback: "特定の立地差を置かず、新宿御苑内の平均的な木として扱いました。" },
      { label: "日当たり良好", value: 0.5, note: "＋0.5℃相当", feedback: "日射を受けやすい枝先を想定し、発育を早い側へ補正しました。" },
      { label: "舗装・建物近傍", value: 1, note: "＋1.0℃相当", feedback: "蓄熱しやすい周辺被覆を想定し、夜間を含む局地的な加温を反映しました。" },
    ],
  },
];

export const defaultAnswers = Object.fromEntries(
  questions.map((question) => [question.id, question.defaultValue]),
) as Record<Question["id"], number>;

export function feedbackForAnswer(question: Question, value: number) {
  return [...question.choices].sort(
    (left, right) => Math.abs(left.value - value) - Math.abs(right.value - value),
  )[0].feedback;
}

export const references = [
  { label: "気象庁「生物季節観測の情報」", url: "https://www.data.jma.go.jp/sakura/data/index.html", note: "東京の平年開花日と観測基準" },
  { label: "青野・小元（1990）", url: "https://doi.org/10.2480/agrmet.46.147", note: "ソメイヨシノの温度変換日数法" },
  { label: "青野・村上（2017）", url: "https://doi.org/10.2480/cib.J-17-033", note: "休眠期の温度を含む開花モデル" },
  { label: "Chuine（2000）", url: "https://pubmed.ncbi.nlm.nih.gov/11082304/", note: "低温量と加温量を統合する生物季節モデル" },
  { label: "Fuほか（2015）", url: "https://doi.org/10.1038/nature15402", note: "低温不足による春季温度感応度の低下" },
  { label: "Menzelほか（2006）", url: "https://doi.org/10.1111/j.1466-822X.2006.00247.x", note: "長期観測に基づく春季生物季節の温度応答" },
  { label: "Mengほか（2020）", url: "https://pubmed.ncbi.nlm.nih.gov/32041872/", note: "都市温暖化、低温蓄積、春季加温の競合" },
  { label: "多田ほか（2020）", url: "https://doi.org/10.11361/journalcpij.55.791", note: "東京都心169本の近距離個体差" },
  { label: "成田ほか（2004）", url: "https://doi.org/10.4157/grj.77.403", note: "新宿御苑のクールアイランド" },
  { label: "環境省「新宿御苑 概要」", url: "https://policies.env.go.jp/national-garden/shinjukugyoen/intro/overview/", note: "園地と桜の基礎情報" },
];
