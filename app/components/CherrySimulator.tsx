"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { introReferences, reflectionTips, siteText } from "../data/editableText";
import { defaultAnswers, feedbackForAnswer, questions, references } from "../data/questions";
import { dateLabelFromDoy, forecastBloom, formatDate, shiftLabel, type Answers } from "../lib/model";
import { loadCommunityStats, newSubmissionId, shareSimulation } from "../lib/community";

type Phase = "start" | "intro" | "question" | "reflection" | "result";
type CommunityStats = {
  total: number;
  topType: null | { classification: string; count: number; averageDay: number; minimumDay: number; maximumDay: number };
  typeCounts: { classification: string; count: number }[];
};

// 画面遷移：表紙 → 解説 → 質問 → 各回答の考察 → 結果
export function CherrySimulator() {
  const [phase, setPhase] = useState<Phase>("start");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [reflectionIndex, setReflectionIndex] = useState(0);
  const [reflectionDuration, setReflectionDuration] = useState(6500);
  const [tipIndex, setTipIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ ...defaultAnswers });
  const forecast = useMemo(() => forecastBloom(answers), [answers]);
  const question = questions[questionIndex];

  useEffect(() => {
    if (phase !== "reflection") return;
    const chooseTip = () => setTipIndex((current) => {
      if (reflectionTips.length < 2) return 0;
      let next = Math.floor(Math.random() * reflectionTips.length);
      if (next === current) next = (next + 1) % reflectionTips.length;
      return next;
    });
    chooseTip();
    const tipTimer = window.setInterval(chooseTip, 1450);
    const finishTimer = window.setTimeout(() => {
      if (reflectionIndex === questions.length - 1) setPhase("result");
      else {
        setQuestionIndex(reflectionIndex + 1);
        setPhase("question");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, reflectionDuration);
    return () => {
      window.clearInterval(tipTimer);
      window.clearTimeout(finishTimer);
    };
  }, [phase, reflectionDuration, reflectionIndex]);

  function move(next: Phase) {
    setPhase(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function confirmAnswer() {
    setReflectionIndex(questionIndex);
    setReflectionDuration(5000 + Math.floor(Math.random() * 5001));
    move("reflection");
  }

  function previousQuestion() {
    if (questionIndex === 0) move("intro");
    else {
      setQuestionIndex((current) => current - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function restart() {
    setAnswers({ ...defaultAnswers });
    setQuestionIndex(0);
    move("start");
  }

  return <main className="site-shell">
    {phase === "start" && <StartScreen onStart={() => move("intro")} />}
    {phase === "intro" && <IntroScreen onBack={() => move("start")} onNext={() => move("question")} />}
    {phase === "question" && <QuestionScreen question={question} value={answers[question.id]} index={questionIndex} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} onBack={previousQuestion} onNext={confirmAnswer} />}
    {phase === "reflection" && <ReflectionScreen index={reflectionIndex} duration={reflectionDuration} tipIndex={tipIndex} />}
    {phase === "result" && <ResultScreen answers={answers} forecast={forecast} onBack={() => { setQuestionIndex(questions.length - 1); move("question"); }} onRestart={restart} />}
  </main>;
}

function Crest({ small = false }: { small?: boolean }) {
  return <span className={`crest ${small ? "small" : ""}`} aria-hidden="true"><i /><i /><i /><i /><i /></span>;
}

function Topbar({ status }: { status?: string }) {
  return <header className="topbar"><span className="brand">{siteText.siteName}</span>{status && <span className="page-status">{status}</span>}</header>;
}

function StartScreen({ onStart }: { onStart: () => void }) {
  return <section className="screen start-screen">
    <Topbar />
    <div className="hero">
      <figure className="hero-photo">
        <img src="/images/shinjuku-gyoen-real.jpg" alt="満開の桜と池が広がる新宿御苑の実景" width="1280" height="848" />
        <figcaption><a href="https://commons.wikimedia.org/wiki/File:Shinjuku_Gyoen(Shinjuku_Imperial_Garden)_-_%E6%96%B0%E5%AE%BF%E5%BE%A1%E8%8B%91_-_panoramio_(18).jpg" target="_blank" rel="noreferrer">{siteText.heroCredit}</a>／<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">利用条件</a></figcaption>
      </figure>
      <div className="hero-panel"><Crest /><h1>{siteText.heroTitle}</h1><p>{siteText.heroLead}</p><button className="primary-button" type="button" onClick={onStart}>{siteText.startButton}<span>→</span></button></div>
    </div>
  </section>;
}

function IntroScreen({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return <section className="screen intro-screen">
    <Topbar status="はじめに" />
    <div className="reading-page">
      <Crest /><p className="section-kicker">開花予測を読む前に</p><h1>{siteText.introTitle}</h1>
      <div className="intro-prose">{siteText.introParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="intro-citations"><span>主な参照資料</span>{introReferences.map((reference, index) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">[{index + 1}] {reference.label}</a>)}</div>
      <div className="concept-strip"><span><b>休眠解除</b>冬の低温量</span><i>→</i><span><b>花芽発育</b>春の加温量</span><i>→</i><span><b>局地補正</b>新宿御苑の環境</span><i>→</i><span><b>確率分布</b>開花日の幅</span></div>
    </div>
    <PageNav back="表紙へ" next="条件入力へ" onBack={onBack} onNext={onNext} />
  </section>;
}

function QuestionScreen({ question, value, index, onChange, onBack, onNext }: { question: (typeof questions)[number]; value: number; index: number; onChange: (value: number) => void; onBack: () => void; onNext: () => void }) {
  const selectedPreset = question.choices.some((choice) => choice.value === value);
  return <section className="screen question-screen" key={question.id}>
    <Topbar status={`${index + 1} / ${questions.length}`} />
    <div className="progress-track"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
    <div className="question-layout">
      <aside className="variable-index"><span>{question.symbol}</span><p>{question.category}</p><strong>{question.number}</strong></aside>
      <article className="question-card">
        <p className="section-kicker">入力項目 {question.number}</p><h1>{question.title}</h1><p className="question-prompt">{question.prompt}</p>
        <section className="expert-note"><div className="note-heading"><Crest small /><strong>選択前に読む入力ガイド</strong></div><p>{question.expertView}</p><a href={question.sourceUrl} target="_blank" rel="noreferrer">出典：{question.sourceLabel} ↗</a></section>
        <p className="recommendation"><span>迷った場合</span>{question.recommendation}</p>
        <div className="choice-list" role="radiogroup" aria-label={question.title}>{question.choices.map((choice) => {
          const checked = choice.value === value;
          return <button key={choice.label} className={`choice-button ${checked ? "selected" : ""}`} type="button" role="radio" aria-checked={checked} onClick={() => onChange(choice.value)}><span className="choice-dot" /><span className="choice-label">{choice.label}</span><span className="choice-note">{choice.note}</span></button>;
        })}</div>
        <details className="fine-tune" open={!selectedPreset}><summary>数値を直接入力する</summary><div className="number-control"><input type="range" min={question.min} max={question.max} step={question.step} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={`${question.title}の数値`} /><label><input type="number" min={question.min} max={question.max} step={question.step} value={value} onChange={(event) => onChange(Math.max(question.min, Math.min(question.max, Number(event.target.value))))} /><span>{question.unit}</span></label></div></details>
      </article>
    </div>
    <PageNav back="戻る" next={index === questions.length - 1 ? "推定へ進む" : "回答を確定"} onBack={onBack} onNext={onNext} />
  </section>;
}

function ReflectionScreen({ index, duration, tipIndex }: { index: number; duration: number; tipIndex: number }) {
  const last = index === questions.length - 1;
  return <section className="screen reflection-screen" aria-live="polite" style={{ "--wait-duration": `${duration}ms` } as CSSProperties}>
    <Topbar status={`${index + 1} / ${questions.length}`} />
    <div className="reflection-panel"><Crest /><p className="section-kicker">回答を照合しています</p><h1>{last ? "開花日の分布を組み立てています" : "次の条件との関係を整理しています"}</h1><p className="reflection-sub">{questions[index].category}の回答を4つの推定式へ反映しています。</p><div className="loading-bar"><span /></div><article className="tip-card" key={tipIndex}><span>桜の小話</span><p>{reflectionTips[tipIndex]}</p></article></div>
  </section>;
}

function ResultScreen({ answers, forecast, onBack, onRestart }: { answers: Answers; forecast: ReturnType<typeof forecastBloom>; onBack: () => void; onRestart: () => void }) {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [shareState, setShareState] = useState<"idle" | "sending" | "shared" | "error">("idle");
  const [submissionId] = useState(newSubmissionId);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => { loadCommunityStats().then(setStats).catch(() => setStatsError(true)); }, []);

  async function contribute() {
    if (shareState !== "idle" && shareState !== "error") return;
    setShareState("sending");
    try {
      await shareSimulation(submissionId, answers, forecast);
      setShareState("shared");
      loadCommunityStats().then((value) => { setStats(value); setStatsError(false); }).catch(() => setStatsError(true));
    } catch { setShareState("error"); }
  }

  const maxCount = Math.max(1, ...((stats?.typeCounts ?? []).map((item) => item.count)));
  const top = stats?.topType;
  return <section className="screen result-screen">
    <Topbar status="推定結果" />
    <div className="result-heading"><Crest /><p className="section-kicker">新宿御苑・ソメイヨシノ</p><h1>{forecast.targetYear}年<br /><em>{forecast.classification}</em></h1><p>{forecast.interpretation}</p></div>
    <div className="result-grid">
      <article className="date-card"><p className="card-label">中心推定日</p><h2>{formatDate(forecast.center)}</h2><div className="shift-label">{shiftLabel(forecast.shiftDays)}</div><div className="range-visual"><span className="range-wide"><i className="range-inner" /></span><b /></div><div className="range-labels"><span>{formatDate(forecast.outerStart)}</span><strong>80％推定区間</strong><span>{formatDate(forecast.outerEnd)}</span></div><p className="inner-range">中央50％区間 <strong>{formatDate(forecast.innerStart)}〜{formatDate(forecast.innerEnd)}</strong></p></article>
      <article className="diagnostic-card"><div><span>推定の安定度</span><strong>{forecast.confidence}</strong></div><div><span>最大の寄与要因</span><strong>{forecast.dominantFactor}</strong></div><section><span>推定式別の中心日</span>{forecast.modelDates.map((date, index) => <p key={index}>推定式 {index + 1}<b>{formatDate(date)}</b></p>)}</section></article>
    </div>

    <section className="feedback-section"><SectionHeading label="回答から組み立てた所見" title="今回の条件をどう読むか" /><ol>{questions.map((item) => <li key={item.id}><span>{item.symbol}</span><div><strong>{item.category}</strong><p>{feedbackForAnswer(item, answers[item.id])}</p></div></li>)}</ol></section>
    <section className="input-summary"><SectionHeading label="入力値" title="設定した6つの環境条件" /><div className="input-grid">{questions.map((item) => <article key={item.id}><span>{item.symbol}</span><p>{item.category}</p><strong>{answers[item.id]} {item.unit}</strong></article>)}</div></section>

    <section className="community-section"><SectionHeading label="匿名集計" title="みんなの推定結果" /><div className="community-grid">
      <article className="contribution-card"><h3>{siteText.contributionTitle}</h3><p>{siteText.contributionLead}</p><p className="caution"><strong>送信前のお願い</strong>{siteText.contributionCaution}</p><button className="primary-button share-button" type="button" onClick={contribute} disabled={shareState === "sending" || shareState === "shared"}>{shareState === "sending" ? "送信しています" : shareState === "shared" ? "匿名データを共有しました" : siteText.contributionButton}</button>{shareState === "error" && <p className="error-text">送信できませんでした。時間を置いてもう一度お試しください。</p>}</article>
      <article className="stats-card"><p className="card-label">現在の集計</p>{!stats ? <p className="stats-empty">{statsError ? "集計データを取得できませんでした。時間を置いて再度お試しください。" : "集計データを読み込んでいます。"}</p> : stats.total === 0 || !top ? <p className="stats-empty">まだ共有された結果はありません。最初の一件を慎重に入力して共有できます。</p> : <><p className="total-count">共有結果 <strong>{stats.total}</strong>件</p><h3>最多タイプ<br /><strong>{top.classification}</strong></h3><p className="type-window">中心日の平均 <b>{dateLabelFromDoy(top.averageDay, forecast.targetYear)}</b><br />記録された範囲 {dateLabelFromDoy(top.minimumDay, forecast.targetYear)}〜{dateLabelFromDoy(top.maximumDay, forecast.targetYear)}</p><p className="comparison">今回の中心日は最多タイプの平均より <strong>{Math.abs(forecast.centerDayOfYear - top.averageDay) < 1 ? "ほぼ同じ" : `${Math.abs(Math.round(forecast.centerDayOfYear - top.averageDay))}日${forecast.centerDayOfYear < top.averageDay ? "早い" : "遅い"}`}</strong>位置です。</p><div className="type-bars">{stats.typeCounts.map((item) => <div key={item.classification}><span>{item.classification}</span><i><b style={{ width: `${(item.count / maxCount) * 100}%` }} /></i><strong>{item.count}</strong></div>)}</div></>}</article>
    </div></section>

    <section className="method-section"><details open><summary>更新した推定方法</summary><p>東京の平年開花日3月24日を起点とし、温度変換日数型、線形温度積算型、休眠解除後に加温を積算する逐次型、都市域の加温促進と低温不足を同時に扱う交互作用型の4式を計算します。1,600回の反復計算の中央値を中心日とし、モデル間差と生物学的ばらつきを50％・80％区間へ残します。</p><code>低温充足度＝1−0.14×暖冬偏差−0.035×都市熱補正<br />開花日＝4式から得た推定分布の中央値</code></details><details><summary>対象と限界</summary><p>対象は新宿御苑の健康な成木のソメイヨシノです。入力は月平均偏差を使うため、日別気温を用いる原著モデルの厳密な再現ではありません。都市熱補正も感度分析値です。公式予報ではなく、条件の違いが結果をどう動かすかを検討するために使用してください。</p></details></section>
    <section className="references"><SectionHeading label="参考文献" title="根拠資料と先行研究" /><ol>{references.map((reference, index) => <li key={reference.url}><span>[{index + 1}]</span><div><a href={reference.url} target="_blank" rel="noreferrer">{reference.label} ↗</a><p>{reference.note}</p></div></li>)}</ol></section>
    <nav className="result-actions"><button className="text-button" type="button" onClick={onBack}>← 条件を修正</button><button className="primary-button compact" type="button" onClick={onRestart}>最初から再計算</button></nav><footer className="disclaimer">{siteText.disclaimer}</footer>
  </section>;
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return <div className="section-heading"><p className="section-kicker">{label}</p><h2>{title}</h2></div>;
}

function PageNav({ back, next, onBack, onNext }: { back: string; next: string; onBack: () => void; onNext: () => void }) {
  return <nav className="page-nav"><button className="text-button" type="button" onClick={onBack}>← {back}</button><button className="primary-button compact" type="button" onClick={onNext}>{next}<span>→</span></button></nav>;
}
