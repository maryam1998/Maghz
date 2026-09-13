// App.jsx
// نسخه 13.0 — با پرسش‌های چند انتخابی در چرخه
// بدون AI — کاملاً Rule-Based

import React, { useState, useEffect, useMemo } from "react";

import { SCHEMAS, DOMAINS, resolveExercise, getReplacementResponse } from "./SCHEMAS";
import { ExerciseRenderer, resolveExerciseFromRule } from "./EXERCISES";
import { YSQ_QUESTIONS, LIKERT_SCALE, analyzeYSQ, validateAnswers, buildResultPayload } from "./YSQ_QUESTIONS";
import {
  recordCycle, buildProgressSummary, registerIdLabels, toFa,
  saveProfile, loadProfile, getWins, describeWin, addCheckIn,
  hasCheckedInToday, getTodayCheckIn, getCalendarData
} from "./PROGRESS";
import { getMicroMissions, getCompassionatePhrases, getTodayPrompt } from "./EXTRAS";
import { SITUATIONS, SITUATION_CATEGORIES, getSituationsByCategory, getSituation } from "./SITUATIONS";
import { ATTRACTION_PATTERNS, HOW_TO_RESPOND, BREAK_CYCLE_GUIDE, getResponseGuide } from "./RELATIONSHIPS";
import { getOrigin } from "./ORIGINS";
import { PLAIN_NAMES, NEXT_STEPS, getPlainName, getOneLiner, getNextSteps } from "./SIMPLE_LANGUAGE";
import {
  LIFE_CYCLES,
  LIFE_CYCLE_CATEGORIES,
  getLifeCycle,
  getLifeCyclesByCategory
} from "./LIFE_CYCLES";
import { mergeAdditions } from "./SCHEMAS_ADDITIONS";
import { mergeTriggers } from "./TRIGGERS_EXTRA";
import { getTodayReminders } from "./DAILY_REMINDERS";

/* =========================================================
 * ۰. ثبت برچسب‌ها + اسم ساده
 * ========================================================= */

const LABELS = {};
for (const s of SCHEMAS) {
  LABELS[s.id] = s.name_fa;
  const plain = PLAIN_NAMES[s.id];
  if (plain) {
    s.name_plain = plain.plain;
    s.one_liner = plain.oneLiner;
  }
  for (const t of s.triggers) LABELS[t.id] = t.text;
  for (const th of s.automatic_thoughts) LABELS[th.id] = th.text;
  for (const e of s.emotional_signals) LABELS[e.id] = e.text;
  for (const b of s.behavioral_patterns) LABELS[b.id] = b.text;
}
registerIdLabels(LABELS);
mergeAdditions(SCHEMAS);
mergeTriggers(SCHEMAS);

for (const s of SCHEMAS) {
  for (const t of s.triggers) LABELS[t.id] = t.text;
  for (const th of s.automatic_thoughts) LABELS[th.id] = th.text;
  for (const e of s.emotional_signals) LABELS[e.id] = e.text;
  for (const b of s.behavioral_patterns) LABELS[b.id] = b.text;
}
registerIdLabels(LABELS);

/* =========================================================
 * ۱. کامپوننت‌های پایه
 * ========================================================= */

function Shell({ children, title, onBack, showQuickButton, onQuick, showSOS, onSOS }) {
  return (
    <div dir="rtl" style={styles.app}>
      <header style={styles.header}>
        {onBack ? (
          <button onClick={onBack} style={styles.backBtn}>→</button>
        ) : (
          <div style={{ width: 32 }} />
        )}
        <div style={styles.headerTitle}>{title}</div>
        {showSOS ? (
          <button onClick={onSOS} style={styles.sosHeaderBtn}>SOS</button>
        ) : (
          <div style={{ width: 32 }} />
        )}
      </header>
      <main style={styles.main}>{children}</main>
      {showQuickButton && (
        <button onClick={onQuick} style={styles.quickBtn}>⚡ همین الان فعال شد</button>
      )}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled }) {
  const v = { primary: styles.btnPrimary, ghost: styles.btnGhost, danger: styles.btnDanger }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles.btn, ...v, opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

function ProgressBar({ value, max = 100, color = "#1a3d2c", height = 8 }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ height, background: "#eee", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ height: "100%", width: pct + "%", background: color, transition: "width .4s ease" }} />
    </div>
  );
}

function Chip({ children, active, onClick, color = "#1a3d2c" }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 999,
      border: active ? `2px solid ${color}` : "1px solid #e5e5e5",
      background: active ? color : "#fff", color: active ? "#fff" : "#000",
      fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap"
    }}>{children}</button>
  );
}

/* =========================================================
 * ۲. صفحه ریشه
 * ========================================================= */

function OriginView({ schemaId, onBack, onSOS }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const origin = getOrigin(schemaId);
  const nextSteps = getNextSteps(schemaId);
  const plainName = getPlainName(schemaId);

  if (!origin) {
    return (
      <Shell title="ریشه" onBack={onBack} showSOS onSOS={onSOS}>
        <Card><p>اطلاعاتی برای این الگو موجود نیست.</p></Card>
      </Shell>
    );
  }

  return (
    <Shell title={plainName || "ریشه‌ی این الگو"} onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{ background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>الگو</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {plainName || schema?.name_fa}
        </div>
        {plainName && schema && (
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{schema.name_fa}</div>
        )}
      </Card>

      <Card style={{ marginTop: 12, background: "#eef4ff" }}>
        <div style={{ fontSize: 13, lineHeight: 1.9, color: "#000" }}>
          این توضیح، برای سرزنش کسی نیست.
          <br />
          فقط می‌خواهیم ببینیم این الگو <strong>از کجا</strong> آمده —
          چون فهمیدن ریشه، اولین قدم شکستنش است.
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          🧸 در کودکی چه اتفاقی افتاد؟
        </div>
        {origin.childhood.map((c, i) => (
          <div key={i} style={{
            fontSize: 14, lineHeight: 1.9, color: "#000",
            marginBottom: 10, paddingRight: 12, borderRight: "3px solid #eee"
          }}>{c}</div>
        ))}
      </Card>

      {origin.familyPatterns && origin.familyPatterns.length > 0 && (
        <Card style={{ marginTop: 12, background: "#f3e8ff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            👨‍👩‍👧 الگوی خانوادگی
          </div>
          {origin.familyPatterns.map((p, i) => (
            <div key={i} style={{
              fontSize: 14, lineHeight: 1.9, color: "#000",
              marginBottom: 8, paddingRight: 12,
              borderRight: "3px solid #8e44ad"
            }}>• {p}</div>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: 12, background: "#fff8e1" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#000" }}>
          💡 کودکی که بودی، این را یاد گرفت
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.9, color: "#000", fontStyle: "italic" }}>
          {origin.whatChildLearned}
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          🔊 این صداها برایت آشناست؟
        </div>
        {origin.innerVoice.map((v, i) => (
          <div key={i} style={{
            fontSize: 14, lineHeight: 1.9, color: "#000",
            marginBottom: 8, padding: "8px 12px", background: "#f6f6f6", borderRadius: 8
          }}>«{v}»</div>
        ))}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          🕊️ کودکی که بودی، این‌ها را لازم داشت
        </div>
        {origin.whatWasMissing.map((w, i) => (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 8 }}>
            • {w}
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
        <div style={{ fontSize: 14, lineHeight: 2 }}>{origin.gentleReminder}</div>
      </Card>

      {nextSteps.length > 0 && (
        <Card style={{ marginTop: 12, background: "#eef7ee" }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "#000" }}>
            🕊️ حالا باید چکار کنی؟
          </div>
          {nextSteps.map((step, i) => (
            <div key={i} style={{
              fontSize: 14, lineHeight: 1.9, color: "#000",
              marginBottom: 10, paddingRight: 12,
              borderRight: "3px solid #27ae60"
            }}>
              {step}
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: 12, background: "#f6f6f6" }}>
        <div style={{ fontSize: 13, color: "#000", lineHeight: 1.9, textAlign: "center" }}>
          این کارها رو یک‌جا نمی‌شه انجام داد.
          <br />
          هر روز یک قدم کوچیک — همین کافیه.
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * ۳. صفحه چرخه‌های زندگی (لیست)
 * ========================================================= */

function LifeCyclesView({ onBack, onPickCycle, onSOS }) {
  const [category, setCategory] = useState("all");
  const cycles = getLifeCyclesByCategory(category);

  return (
    <Shell title="چرخه‌های زندگی" onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <p style={{ margin: 0, fontSize: 14, color: "#000", lineHeight: 1.9 }}>
          این‌ها الگوهای عمیق‌تری هستند که از ترکیب چند طرحواره ساخته می‌شوند.
          <br />
          شاید یکی از این‌ها را در زندگی‌ات دیده باشی.
        </p>
      </Card>

      <div style={{
        display: "flex", gap: 6, marginTop: 12, marginBottom: 12,
        overflowX: "auto", paddingBottom: 4
      }}>
        {LIFE_CYCLE_CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>

      {cycles.map((cycle) => (
        <button key={cycle.id} onClick={() => onPickCycle(cycle.id)} style={{
          display: "block", width: "100%", textAlign: "right",
          padding: 16, marginBottom: 10, borderRadius: 12,
          border: "1px solid #eee", background: "#fff",
          cursor: "pointer", fontFamily: "inherit"
        }}>
          <div style={{ fontSize: 11, color: "#000", marginBottom: 6 }}>
            {cycle.categoryLabel}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6, marginBottom: 8 }}>
            {cycle.title}
          </div>
          <div style={{ fontSize: 13, color: "#000", lineHeight: 1.7 }}>
            {cycle.shortDescription}
          </div>
        </button>
      ))}

      {cycles.length === 0 && (
        <Card>
          <p style={{ color: "#000", fontSize: 14 }}>چرخه‌ای در این دسته پیدا نشد.</p>
        </Card>
      )}
    </Shell>
  );
}

/* =========================================================
 * ۴. جزئیات چرخه زندگی
 * ========================================================= */

function LifeCycleDetailView({ cycleId, onBack, onPickSchema, onSOS }) {
  const cycle = getLifeCycle(cycleId);

  if (!cycle) {
    return (
      <Shell title="خطا" onBack={onBack} showSOS onSOS={onSOS}>
        <Card><p>چرخه پیدا نشد.</p></Card>
      </Shell>
    );
  }

  const relatedSchemas = (cycle.schemas || [])
    .map((id) => SCHEMAS.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <Shell title={cycle.categoryLabel} onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <h2 style={{ margin: "0 0 10px", fontSize: 18, lineHeight: 1.7 }}>
          {cycle.title}
        </h2>
        <div style={{ fontSize: 14, color: "#000", lineHeight: 1.9 }}>
          {cycle.shortDescription}
        </div>
      </Card>

      {cycle.examples && cycle.examples.length > 0 && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            آیا این جمله‌ها برای تو آشناست؟
          </div>
          {cycle.examples.map((ex, i) => (
            <div key={i} style={{
              fontSize: 14, lineHeight: 1.9, padding: "8px 0",
              borderBottom: i < cycle.examples.length - 1 ? "1px dashed #eee" : "none",
              color: "#000"
            }}>«{ex}»</div>
          ))}
        </Card>
      )}

      {cycle.childhood && cycle.childhood.length > 0 && (
        <Card style={{ marginTop: 12, background: "#eef4ff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            🧸 احتمالاً در کودکی این‌ها را تجربه کرده
          </div>
          {cycle.childhood.map((c, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 8 }}>
              • {c}
            </div>
          ))}
        </Card>
      )}

      {cycle.cycle && cycle.cycle.length > 0 && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
            🔁 چرخه‌ی این الگو
          </div>
          {cycle.cycle.map((step, i) => (
            <div key={i} style={{
              padding: "10px 12px", background: "#f6f6f6",
              borderRadius: 8, fontSize: 13, lineHeight: 1.7,
              marginBottom: 6, color: "#000"
            }}>{step}</div>
          ))}
        </Card>
      )}

      {cycle.whyItRepeats && cycle.whyItRepeats.length > 0 && (
        <Card style={{ marginTop: 12, background: "#fef3f2" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#000" }}>
            🤔 چرا این چرخه تکرار می‌شود؟
          </div>
          {cycle.whyItRepeats.map((w, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 6 }}>
              • {w}
            </div>
          ))}
        </Card>
      )}

      {relatedSchemas.length > 0 && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
            این چرخه به این الگوها مربوط است
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {relatedSchemas.map((s) => (
              <button key={s.id} onClick={() => onPickSchema(s.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: "1px solid #e5e5e5", background: "#fff",
                cursor: "pointer", textAlign: "right",
                fontFamily: "inherit", fontSize: 14
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {s.name_plain || s.name_fa}
                </div>
                <div style={{ fontSize: 12, color: "#000", lineHeight: 1.5 }}>
                  {s.one_liner || s.short_description}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {cycle.whatToDo && cycle.whatToDo.length > 0 && (
        <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            🕊️ حالا باید چکار کنی؟
          </div>
          {cycle.whatToDo.map((w, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 10, opacity: 0.95 }}>
              • {w}
            </div>
          ))}
        </Card>
      )}

      {cycle.selfTalk && cycle.selfTalk.length > 0 && (
        <Card style={{ marginTop: 12, background: "#eef4ff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            🗣️ به خودت این‌ها را بگو
          </div>
          {cycle.selfTalk.map((phrase, i) => (
            <div key={i} style={{
              fontSize: 14, lineHeight: 1.9, color: "#000",
              marginBottom: 8, padding: "10px 14px", background: "#fff",
              borderRadius: 8, borderRight: "3px solid #3b82f6"
            }}>«{phrase}»</div>
          ))}
        </Card>
      )}

      {cycle.smallExperiments && cycle.smallExperiments.length > 0 && (
        <Card style={{ marginTop: 12, background: "#fff8e1" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            🧪 آزمایش‌های کوچک
          </div>
          {cycle.smallExperiments.map((exp, i) => (
            <div key={i} style={{
              fontSize: 14, lineHeight: 1.9, color: "#000",
              marginBottom: 10, paddingRight: 12,
              borderRight: "3px solid #f39c12"
            }}>
              {exp}
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: 12, background: "#f6f6f6" }}>
        <div style={{ fontSize: 13, color: "#000", lineHeight: 1.9, textAlign: "center" }}>
          این چرخه یک‌شبه درست نمی‌شه.
          <br />
          ولی هر بار که ببینی‌اش، یک قدم جلوتری.
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * ۵. چک‌این روزانه
 * ========================================================= */

function CheckInView({ analysis, onDone, onSkip }) {
  const [phase, setPhase] = useState("mood");
  const [mood, setMood] = useState(null);
  const [schemaId, setSchemaId] = useState(null);
  const [note, setNote] = useState("");

  const prompt = getTodayPrompt();

  const activeSchemas = useMemo(() => {
    if (!analysis?.all) return SCHEMAS.slice(0, 5);
    const list = [];
    for (const r of analysis.all) {
      if (r.percentage >= 40) {
        const s = SCHEMAS.find((x) => x.id === r.schemaId);
        if (s) list.push(s);
      }
    }
    return list.length > 0 ? list : SCHEMAS.slice(0, 5);
  }, [analysis]);

  if (phase === "mood") {
    return (
      <Shell title="صبح بخیر">
        <Card>
          <p style={{ margin: "0 0 6px", fontSize: 14, color: "#000" }}>{prompt}</p>
          <p style={{ margin: "20px 0 16px", fontSize: 16, fontWeight: 600 }}>
            امروز چه احساسی داری؟
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setMood("good"); setPhase("schema"); }} style={styles.moodBtn}>
              <span style={{ fontSize: 28 }}>😊</span>
              <span style={{ fontSize: 15 }}>خوب</span>
            </button>
            <button onClick={() => { setMood("meh"); setPhase("schema"); }} style={styles.moodBtn}>
              <span style={{ fontSize: 28 }}>😐</span>
              <span style={{ fontSize: 15 }}>متوسط</span>
            </button>
            <button onClick={() => { setMood("hard"); setPhase("schema"); }} style={styles.moodBtn}>
              <span style={{ fontSize: 28 }}>😔</span>
              <span style={{ fontSize: 15 }}>سخت</span>
            </button>
          </div>
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn variant="ghost" onClick={onSkip}>رد کن</Btn>
        </div>
      </Shell>
    );
  }

  if (phase === "schema") {
    return (
      <Shell title="صبح بخیر" onBack={() => setPhase("mood")}>
        <Card>
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600 }}>
            کدام الگو امروز فعال‌تر است؟
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#000" }}>
            فقط الگوهای خودت نشان داده می‌شوند.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeSchemas.map((s) => (
              <button key={s.id} onClick={() => setSchemaId(s.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: schemaId === s.id ? "2px solid #1a3d2c" : "1px solid #e5e5e5",
                background: schemaId === s.id ? "#1a3d2c" : "#fff",
                color: schemaId === s.id ? "#fff" : "#000",
                fontSize: 14, textAlign: "right", cursor: "pointer",
                fontFamily: "inherit", lineHeight: 1.6
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {s.name_plain || s.name_fa}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                  {s.one_liner || s.short_description}
                </div>
              </button>
            ))}
          </div>
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => setPhase("note")}>بعدی</Btn>
          <div style={{ marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => { setSchemaId(null); setPhase("note"); }}>
              مطمئن نیستم
            </Btn>
          </div>
        </div>
      </Shell>
    );
  }

  if (phase === "note") {
    return (
      <Shell title="صبح بخیر" onBack={() => setPhase("schema")}>
        <Card>
          <div style={{ fontSize: 14, color: "#000", marginBottom: 8 }}>
            چیز دیگری می‌خواهی بگویی؟ (اختیاری)
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            rows={3} placeholder="هر چیزی که به ذهنت می‌آید..." style={styles.textarea} />
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={async () => { await addCheckIn({ mood, schemaId, note }); onDone(); }}>
            ثبت کن
          </Btn>
        </div>
      </Shell>
    );
  }
  return null;
}

/* =========================================================
 * ۶. حالت SOS
 * ========================================================= */

function SOSView({ onBack, onBetter }) {
  const [phase, setPhase] = useState("breathe");
  const BREATH_PHASES = [
    { name: "دم", dur: 4 },
    { name: "نگه‌دار", dur: 7 },
    { name: "بازدم", dur: 8 }
  ];
  const [breathIdx, setBreathIdx] = useState(0);
  const [countdown, setCountdown] = useState(BREATH_PHASES[0].dur);

  useEffect(() => {
    if (phase !== "breathe") return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setBreathIdx((prev) => (prev + 1) % BREATH_PHASES.length);
          return 1;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "breathe") return;
    setCountdown(BREATH_PHASES[breathIdx].dur);
  }, [breathIdx, phase]);

  const phrases = useMemo(() => {
    const all = [];
    for (const s of SCHEMAS) {
      const p = getCompassionatePhrases(s.id);
      for (const ph of p) all.push(ph);
    }
    return all;
  }, []);

  const [randomPhrase] = useState(() => phrases[Math.floor(Math.random() * phrases.length)]);

  if (phase === "breathe") {
    const current = BREATH_PHASES[breathIdx];
    return (
      <div dir="rtl" style={styles.sosFull}>
        <div style={{ padding: 20, textAlign: "center" }}>
          <h2 style={{ color: "#fff", fontSize: 20, margin: "0 0 30px" }}>
            این هم می‌گذرد
          </h2>
          <div style={styles.breathCircle}>
            <div style={styles.breathInner}>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>
                {toFa(countdown)}
              </div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)", marginTop: 4 }}>
                {current.name}
              </div>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,.8)", fontSize: 14, margin: "30px 0 20px", lineHeight: 1.9 }}>
            با من نفس بکش.<br />فقط همین لحظه کافی است.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, margin: "40px auto 0" }}>
            <button onClick={() => setPhase("phrase")} style={{
              padding: 14, borderRadius: 12,
              border: "1px solid rgba(255,255,255,.3)",
              background: "transparent", color: "#fff",
              fontSize: 15, cursor: "pointer", fontFamily: "inherit"
            }}>حالم کمی بهتره</button>
            <button onClick={onBack} style={{
              padding: 14, borderRadius: 12, border: "none",
              background: "transparent", color: "rgba(255,255,255,.5)",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit"
            }}>بازگشت</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "phrase") {
    return (
      <div dir="rtl" style={styles.sosFull}>
        <div style={{ padding: 30, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>💙</div>
          <p style={{ color: "#fff", fontSize: 18, lineHeight: 2, margin: "0 0 40px" }}>
            {randomPhrase}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320, margin: "0 auto" }}>
            <button onClick={onBetter} style={{
              padding: 14, borderRadius: 12, border: "none",
              background: "#fff", color: "#000",
              fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
            }}>ادامه</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/* =========================================================
 * ۷. صفحه خوش‌آمد
 * ========================================================= */

function WelcomeView({ analysis, onStart, onSkipToProfile, hasProfile, phrase, onSOS, onSituations, onRelationships, onLifeCycles }) {
  const activeSchemaIds = useMemo(() => {
    if (!analysis?.all) return null;
    const list = analysis.all
      .filter((r) => r.percentage >= 40)
      .map((r) => r.schemaId);
    return list.length > 0 ? list : null;
  }, [analysis]);

  const reminders = getTodayReminders(activeSchemaIds);

  return (
    <Shell title="الگوهای من" showSOS onSOS={onSOS}>
      <Card>
        <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>چه چیزی در من تکرار می‌شود؟</h2>
