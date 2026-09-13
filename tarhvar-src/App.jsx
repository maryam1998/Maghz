// App.jsx
// نسخه 11.0 — با یادآوری‌های مخصوص هر طرحواره
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
 * ۲. صفحه ریشه + حالا باید چکار کنی
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
  // استخراج طرحواره‌های فعال کاربر (بالای ۴۰٪)
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
        <p style={{ color: "#000", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
          اینجا قرار نیست برچسبی به تو بزنیم.
          قرار است با هم ببینیم چه الگویی در تو تکرار می‌شود، کجا فعال می‌شود،
          و چطور می‌توانی این بار جور دیگری پاسخ بدهی.
        </p>
      </Card>

      {reminders && reminders.length > 0 && (
        <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
            {activeSchemaIds ? "یادآوری‌های امروز — مخصوص تو" : "یادآوری‌های امروز"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reminders.map((rem, i) => (
              <div
                key={i}
                style={{
                  fontSize: 14,
                  lineHeight: 1.9,
                  padding: "8px 12px",
                  background: "rgba(255,255,255,.05)",
                  borderRadius: 8
                }}
              >
                • {rem}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {hasProfile ? (
          <Btn onClick={onSkipToProfile}>پروفایل من</Btn>
        ) : (
          <Btn onClick={onStart}>شروع ارزیابی</Btn>
        )}
        <Btn variant="ghost" onClick={onLifeCycles}>🔄 چرخه‌های زندگی</Btn>
        <Btn variant="ghost" onClick={onSituations}>🔍 من الان این حس را دارم</Btn>
        <Btn variant="ghost" onClick={onRelationships}>💞 چطور با دیگران برخورد کنم</Btn>
      </div>

      <Card style={{ marginTop: 24, background: "#f6f6f6" }}>
        <div style={{ fontSize: 13, color: "#000", lineHeight: 1.9 }}>
          <strong style={{ color: "#000" }}>این اپ چه چیزی نیست:</strong>
          <div>• تشخیص پزشکی نمی‌دهد</div>
          <div>• از AI برای قضاوت درباره تو استفاده نمی‌کند</div>
          <div>• جایگزین درمانگر نیست</div>
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * ۸. صفحه تست YSQ
 * ========================================================= */

function YSQView({ onDone, onBack }) {
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const q = YSQ_QUESTIONS[index];
  const check = validateAnswers(answers);
  const isLast = index === YSQ_QUESTIONS.length - 1;

  const select = (v) => {
    const next = { ...answers, [q.id]: v };
    setAnswers(next);
    if (!isLast) setTimeout(() => setIndex(index + 1), 200);
  };

  return (
    <Shell title="ارزیابی" onBack={onBack}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#000" }}>
          <span>سؤال {toFa(index + 1)} از {toFa(YSQ_QUESTIONS.length)}</span>
          <span>{toFa(check.progress)}%</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <ProgressBar value={check.progress} />
        </div>
      </div>

      <Card>
        <p style={{ fontSize: 17, lineHeight: 1.9, margin: "0 0 20px", minHeight: 80 }}>
          {q.text}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {LIKERT_SCALE.map((l) => {
            const active = answers[q.id] === l.value;
            return (
              <button key={l.value} onClick={() => select(l.value)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: active ? "2px solid #1a3d2c" : "1px solid #e5e5e5",
                background: active ? "#1a3d2c" : "#fff",
                color: active ? "#fff" : "#000",
                fontSize: 14, textAlign: "right",
                cursor: "pointer", fontFamily: "inherit"
              }}>{l.label}</button>
            );
          })}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Btn variant="ghost" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
          قبلی
        </Btn>
        <Btn variant="ghost" onClick={() => setIndex(Math.min(YSQ_QUESTIONS.length - 1, index + 1))} disabled={isLast}>
          بعدی
        </Btn>
      </div>

      {check.valid && (
        <div style={{ marginTop: 12 }}>
          <Btn onClick={() => onDone(answers, analyzeYSQ(answers))}>دیدن پروفایل من</Btn>
        </div>
      )}
    </Shell>
  );
}

/* =========================================================
 * ۹. صفحه پروفایل
 * ========================================================= */

function ProfileView({ analysis, onPickSchema, onPickOrigin, onRetake, onBack, onWins, onCalendar, onSOS, onSituations, onRelationships, onLifeCycles }) {
  if (!analysis) {
    return (
      <Shell title="پروفایل" onBack={onBack}>
        <Card><p>هنوز ارزیابی‌ای انجام نشده.</p></Card>
      </Shell>
    );
  }

  const { high, medium, low, recommended } = analysis;
  const recSchema = SCHEMAS.find((s) => s.id === recommended?.schemaId);
  const recPlain = recSchema?.name_plain || recommended?.name;

  return (
    <Shell title="پروفایل الگوهای من" onBack={onBack}
      showQuickButton onQuick={() => onPickSchema(recommended?.schemaId)}
      showSOS onSOS={onSOS}>

      <Card style={{ background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>پیشنهاد شروع</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
          {recPlain}
        </div>
        {recSchema && (
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            {recSchema.name_fa}
          </div>
        )}
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
          {toFa(recommended?.percentage || 0)}% — اولویت {recommended?.priority?.label}
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onWins} style={styles.dashBtn}>⭐ لحظه‌های من</button>
        <button onClick={onCalendar} style={styles.dashBtn}>📅 تقویم</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={onSituations} style={styles.dashBtn}>🔍 موقعیت‌ها</button>
        <button onClick={onLifeCycles} style={styles.dashBtn}>🔄 چرخه‌های زندگی</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={onRelationships} style={styles.dashBtn}>💞 روابط</button>
      </div>

      <h3 style={{ margin: "22px 0 10px", fontSize: 15 }}>الگوهای فعال</h3>
      {[...high, ...medium].map((r) => {
        const schema = SCHEMAS.find((s) => s.id === r.schemaId);
        const plain = schema?.name_plain || r.name;
        return (
          <Card key={r.schemaId} style={{ marginBottom: 8, padding: 14 }}>
            <button onClick={() => onPickSchema(r.schemaId)} style={{
              display: "block", width: "100%", textAlign: "right",
              padding: 0, border: "none", background: "transparent",
              cursor: "pointer", fontFamily: "inherit"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {plain}
                  </div>
                  <div style={{ fontSize: 11, color: "#000" }}>
                    {schema?.name_fa || ""}
                  </div>
                </div>
                <span style={{ color: "#000", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
                  {r.priority.emoji} {toFa(r.percentage)}%
                </span>
              </div>
              <div style={{ marginTop: 10 }}>
                <ProgressBar value={r.percentage} color={r.priority.color} />
              </div>
              {schema?.one_liner && (
                <div style={{ fontSize: 13, color: "#000", marginTop: 10, lineHeight: 1.7 }}>
                  {schema.one_liner}
                </div>
              )}
            </button>

            <button onClick={() => onPickOrigin(r.schemaId)} style={{
              marginTop: 12, padding: "10px 12px", borderRadius: 8,
              border: "1px solid #e5e5e5", background: "#fafafa",
              cursor: "pointer", fontSize: 13, fontFamily: "inherit",
              color: "#000", width: "100%", textAlign: "right"
            }}>
              🧸 این الگو از کجا آمده؟ + حالا چکار کنم؟
            </button>
          </Card>
        );
      })}

      {low.length > 0 && (
        <>
          <h3 style={{ margin: "22px 0 10px", fontSize: 15, color: "#000" }}>سایر الگوها</h3>
          {low.map((r) => {
            const schema = SCHEMAS.find((s) => s.id === r.schemaId);
            const plain = schema?.name_plain || r.name;
            return (
              <Card key={r.schemaId} style={{ marginBottom: 6, padding: 12, background: "#fafafa" }}>
                <button onClick={() => onPickSchema(r.schemaId)} style={{
                  display: "block", width: "100%", textAlign: "right",
                  padding: 0, border: "none", background: "transparent",
                  cursor: "pointer", fontSize: 14, color: "#000", fontFamily: "inherit"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{plain}</span>
                    <span>{toFa(r.percentage)}%</span>
                  </div>
                </button>
              </Card>
            );
          })}
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <Btn variant="ghost" onClick={onRetake}>ارزیابی مجدد</Btn>
      </div>

      <p style={{ fontSize: 11, color: "#000", marginTop: 20, lineHeight: 1.8 }}>
        این نتایج یک ارزیابی خودگزارشی است و تشخیص بالینی نیست.
      </p>
    </Shell>
  );
}

/* =========================================================
 * ۱۰. صفحه چرخه
 * ========================================================= */

function CycleView({ schemaId, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState({ triggerId: null, thoughtId: null, emotionId: null, behaviorId: null });

  if (!schema) {
    return (
      <Shell title="خطا" onBack={onBack}>
        <Card><p>طرحواره پیدا نشد.</p></Card>
      </Shell>
    );
  }

  const steps = [
    { key: "trigger", title: "چه چیزی معمولاً این حالت را فعال می‌کند؟", items: schema.triggers, idKey: "triggerId" },
    { key: "thought", title: "معمولاً چه فکری از ذهنت می‌گذرد؟", items: schema.automatic_thoughts, idKey: "thoughtId" },
    { key: "emotion", title: "چه احساسی بالا می‌آید؟", items: schema.emotional_signals, idKey: "emotionId" },
    { key: "behavior", title: "معمولاً چه کار می‌کنی؟", items: schema.behavioral_patterns, idKey: "behaviorId" }
  ];

  const current = steps[step];
  const selected = choice[current.idKey];

  const pick = (id) => {
    const next = { ...choice, [current.idKey]: id };
    setChoice(next);
    if (step < steps.length - 1) setTimeout(() => setStep(step + 1), 220);
    else setTimeout(() => onDone(next), 300);
  };

  return (
    <Shell title={schema.name_plain || schema.name_fa}
      onBack={step === 0 ? onBack : () => setStep(step - 1)}>
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= step ? "#1a3d2c" : "#eee"
          }} />
        ))}
      </div>
      <Card>
        <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px" }}>{current.title}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {current.items.map((it) => {
            const active = selected === it.id;
            return (
              <button key={it.id} onClick={() => pick(it.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: active ? "2px solid #1a3d2c" : "1px solid #e5e5e5",
                background: active ? "#1a3d2c" : "#fff",
                color: active ? "#fff" : "#000",
                fontSize: 14, textAlign: "right",
                cursor: "pointer", fontFamily: "inherit"
              }}>{it.text}</button>
            );
          })}
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * ۱۱. خلاصه چرخه
 * ========================================================= */

function CycleSummaryView({ schemaId, selection, onContinue, onViewOrigin, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const find = (list, id) => (list || []).find((x) => x.id === id);

  const items = [
    { label: "محرک", value: find(schema.triggers, selection.triggerId)?.text },
    { label: "فکر خودکار", value: find(schema.automatic_thoughts, selection.thoughtId)?.text },
    { label: "احساس", value: find(schema.emotional_signals, selection.emotionId)?.text },
    { label: "واکنش قدیمی", value: find(schema.behavioral_patterns, selection.behaviorId)?.text }
  ];

  const phrases = getCompassionatePhrases(schemaId);
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];

  return (
    <Shell title="الگوی تو" onBack={onBack}>
      <Card>
        <p style={{ margin: "0 0 16px", color: "#000", fontSize: 14 }}>
          این چرخه توست. جایی برای قضاوت نیست — فقط شناخت.
        </p>
        {items.map((it, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "10px 0",
            borderBottom: i < items.length - 1 ? "1px dashed #eee" : "none"
          }}>
            <div style={{ width: 90, color: "#000", fontSize: 13 }}>{it.label}</div>
            <div style={{ flex: 1, fontWeight: 500 }}>{it.value}</div>
          </div>
        ))}
      </Card>

      {phrase && (
        <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
          <div style={{ fontSize: 14, lineHeight: 1.9 }}>{phrase}</div>
        </Card>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <Btn onClick={onContinue}>بعدی — بیایید این چرخه را بشکنیم</Btn>
        <Btn variant="ghost" onClick={onViewOrigin}>🧸 این الگو از کجا آمده؟</Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * ۱۲. صفحه تمرین
 * ========================================================= */

function ExerciseView({ schemaId, selection, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const rule = resolveExercise(schemaId, selection.triggerId, selection.behaviorId);
  const exercise = resolveExerciseFromRule(schema, rule);

  if (!exercise) {
    return (
      <Shell title="تمرین" onBack={onBack}>
        <Card><p>برای این ترکیب، تمرینی تعریف نشده.</p></Card>
        <div style={{ marginTop: 12 }}>
          <Btn onClick={onDone}>ادامه</Btn>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="تمرین" onBack={onBack}>
      <ExerciseRenderer exercise={exercise} onComplete={(record) => onDone(record)} onSkip={onDone} />
    </Shell>
  );
}

/* =========================================================
 * ۱۳. صفحه مأموریت
 * ========================================================= */

function MissionView({ schemaId, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const microMissions = getMicroMissions(schemaId);
  const missions = microMissions.length > 0 ? microMissions : (schema?.real_life_missions || []);
  const [selectedId, setSelectedId] = useState(missions[0]?.id || null);

  if (missions.length === 0) {
    return (
      <Shell title="مأموریت امروز" onBack={onBack}>
        <Card><p>مأموریتی تعریف نشده.</p></Card>
        <div style={{ marginTop: 12 }}>
          <Btn onClick={() => onDone(null)}>ادامه</Btn>
        </div>
      </Shell>
    );
  }

  const selected = missions.find((m) => m.id === selectedId) || missions[0];
  const typeLabels = {
    observe: { icon: "🔍", label: "مشاهده" },
    action: { icon: "✋", label: "اقدام" },
    write: { icon: "✍️", label: "نوشتن" },
    "self-talk": { icon: "💬", label: "خودگویی" },
    experiment: { icon: "🧪", label: "آزمایش" }
  };

  return (
    <Shell title="مأموریت امروز" onBack={onBack}>
      <Card>
        <p style={{ margin: "0 0 6px", fontSize: 14, color: "#000" }}>
          یکی را انتخاب کن. هر کدام کمتر از ۱ دقیقه طول می‌کشد.
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#000" }}>
          کوچک‌ترین که می‌توانی.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {missions.map((m) => {
            const active = selectedId === m.id;
            const type = typeLabels[m.type] || { icon: "•", label: "" };
            return (
              <button key={m.id} onClick={() => setSelectedId(m.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: active ? "2px solid #1a3d2c" : "1px solid #e5e5e5",
                background: active ? "#1a3d2c" : "#fff",
                color: active ? "#fff" : "#000",
                fontSize: 14, textAlign: "right",
                cursor: "pointer", fontFamily: "inherit", lineHeight: 1.7
              }}>
                <div style={{ fontSize: 10, opacity: 0.7, marginBottom: 4 }}>
                  {type.icon} {type.label}
                </div>
                {m.text}
              </button>
            );
          })}
        </div>
      </Card>

      <Card style={{ marginTop: 12, background: "#f6f6f6" }}>
        <div style={{ fontSize: 13, color: "#000", lineHeight: 1.9 }}>
          لازم نیست کامل انجامش بدهی.
          <br />
          حتی اگر فقط به آن فکر کنی، همین هم یک قدم است.
        </div>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Btn onClick={() => onDone(selected)}>انتخاب کردم</Btn>
        <div style={{ marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => onDone(null)}>الان نمی‌توانم — رد کن</Btn>
        </div>
      </div>
    </Shell>
  );
}

/* =========================================================
 * ۱۴. ثبت نتیجه
 * ========================================================= */

function LogResultView({ schemaId, selection, onDone, onBack }) {
  const [reaction, setReaction] = useState(null);
  const [missionDone, setMissionDone] = useState(false);
  const [notes, setNotes] = useState("");
  const replacement = getReplacementResponse(schemaId, selection.behaviorId);

  const options = [
    { id: "old", label: "واکنش قدیمی را انجام دادم", color: "#000", emoji: "🔴" },
    { id: "paused", label: "مکث کردم", color: "#000", emoji: "🟡" },
    { id: "new", label: "پاسخ جدید را امتحان کردم", color: "#000", emoji: "🟢" }
  ];

  return (
    <Shell title="چطور پیش رفت؟" onBack={onBack}>
      <Card>
        <p style={{ margin: "0 0 8px", fontSize: 14, color: "#000" }}>
          وقتی این الگو فعال شد، چه اتفاقی افتاد؟
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map((o) => {
            const active = reaction === o.id;
            return (
              <button key={o.id} onClick={() => setReaction(o.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: active ? `2px solid ${o.color}` : "1px solid #e5e5e5",
                background: active ? o.color : "#fff",
                color: active ? "#fff" : "#000",
                fontSize: 14, textAlign: "right",
                cursor: "pointer", fontFamily: "inherit"
              }}>{o.emoji} {o.label}</button>
            );
          })}
        </div>
      </Card>

      {reaction === "new" && (
        <Card style={{ marginTop: 12, background: "#eef7ee" }}>
          <div style={{ fontSize: 14, color: "#000", lineHeight: 1.9 }}>
            ⭐ این یک لحظه‌ی برد است. در «لحظه‌های من» ذخیره می‌شود.
          </div>
        </Card>
      )}
      {reaction === "paused" && (
        <Card style={{ marginTop: 12, background: "#fff8e1" }}>
          <div style={{ fontSize: 14, color: "#000", lineHeight: 1.9 }}>
            ⭐ همین مکث کردن، خودش یک برد است. ثبت می‌شود.
          </div>
        </Card>
      )}
      {replacement && selection.behaviorId && (
        <Card style={{ marginTop: 12, background: "#f6f6f6" }}>
          <div style={{ fontSize: 12, color: "#000", marginBottom: 4 }}>
            پاسخ جایگزینی که تمرین کردی:
          </div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{replacement}</div>
        </Card>
      )}

      <Card style={{ marginTop: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={missionDone}
            onChange={(e) => setMissionDone(e.target.checked)}
            style={{ width: 18, height: 18 }} />
          <span style={{ fontSize: 14 }}>مأموریت امروز را انجام دادم</span>
        </label>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, color: "#000", marginBottom: 6 }}>
          یادداشت (اختیاری)
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2} placeholder="چه چیزی کمک کرد؟" style={styles.textarea} />
      </Card>

      <div style={{ marginTop: 16 }}>
        <Btn disabled={!reaction}
          onClick={() => onDone({ reactionType: reaction, missionDone, notes })}>
          ثبت
        </Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * ۱۵. صفحه لحظه‌های من
 * ========================================================= */

function WinsView({ onBack, onSOS }) {
  const [wins, setWins] = useState(null);
  useEffect(() => { getWins().then(setWins); }, []);

  if (!wins) {
    return (
      <Shell title="لحظه‌های من" onBack={onBack} showSOS onSOS={onSOS}>
        <p style={{ color: "#000" }}>در حال بارگذاری...</p>
      </Shell>
    );
  }

  const formatDate = (iso) => {
    const d = new Date(iso);
    const months = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${toFa(d.getDate())} ${months[d.getMonth()]} — ${toFa(h)}:${toFa(m)}`;
  };

  if (wins.length === 0) {
    return (
      <Shell title="لحظه‌های من" onBack={onBack} showSOS onSOS={onSOS}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <p style={{ fontSize: 15, lineHeight: 1.9, margin: 0 }}>
            هنوز لحظه‌ای ثبت نشده.
            <br />
            هر بار که مکث کنی یا پاسخ جدیدی امتحان کنی، اینجا ذخیره می‌شود.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell title="لحظه‌های من" onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{ background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff", marginBottom: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>مجموع لحظه‌های برد</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>
          {toFa(wins.length)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
          این‌ها لحظه‌هایی هستند که تو انتخاب کردی.
        </div>
      </Card>

      {wins.map((w) => {
        const schema = SCHEMAS.find((s) => s.id === w.schemaId);
        return (
          <Card key={w.id} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ fontSize: 20 }}>⭐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                  {describeWin(w)}
                </div>
                <div style={{ fontSize: 12, color: "#000" }}>
                  {schema?.name_plain || schema?.name_fa || "—"} • {formatDate(w.createdAt)}
                </div>
                {w.notes && (
                  <div style={{ fontSize: 13, color: "#000", marginTop: 6, lineHeight: 1.7 }}>
                    {w.notes}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </Shell>
  );
}

/* =========================================================
 * ۱۶. صفحه تقویم
 * ========================================================= */

function CalendarView({ onBack, onSOS }) {
  const [data, setData] = useState(null);
  useEffect(() => { getCalendarData(30).then(setData); }, []);

  if (!data) {
    return (
      <Shell title="تقویم" onBack={onBack} showSOS onSOS={onSOS}>
        <p style={{ color: "#000" }}>در حال بارگذاری...</p>
      </Shell>
    );
  }

  const moodColors = { good: "#27ae60", meh: "#f39c12", hard: "#e74c3c", none: "#f0f0f0" };
  const moodLabels = { good: "روز خوب", meh: "روز متوسط", hard: "روز سخت", none: "بدون ثبت" };

  return (
    <Shell title="تقویم ۳۰ روز اخیر" onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <div style={{ fontSize: 13, color: "#000", marginBottom: 14, lineHeight: 1.9 }}>
          هر خانه یک روز است. رنگ نشان می‌دهد حالت چطور بود.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {data.map((d, i) => (
            <div key={i} style={{
              aspectRatio: "1", borderRadius: 8,
              background: moodColors[d.mood],
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              position: "relative",
              color: d.mood === "none" ? "#000" : "#fff",
              fontSize: 11, fontWeight: 600
            }}>
              <div>{toFa(d.dayNumber)}</div>
              {d.activations > 0 && (
                <div style={{ fontSize: 9, opacity: 0.85, marginTop: 2 }}>
                  {toFa(d.activations)}
                </div>
              )}
              {d.hasWin && (
                <div style={{ position: "absolute", top: 2, left: 2, fontSize: 8 }}>⭐</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#000" }}>
          {Object.entries(moodLabels).map(([k, label]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                width: 12, height: 12, borderRadius: 3,
                background: moodColors[k], display: "inline-block"
              }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * ۱۷. صفحه موقعیت‌ها
 * ========================================================= */

function SituationsView({ onBack, onPickSituation, onSOS }) {
  const [category, setCategory] = useState("all");
  const situations = getSituationsByCategory(category);

  return (
    <Shell title="موقعیت‌های من" onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <p style={{ margin: 0, fontSize: 14, color: "#000", lineHeight: 1.9 }}>
          این حسی که الان داری، مربوط به کدام موقعیت است؟
        </p>
      </Card>

      <div style={{
        display: "flex", gap: 6, marginTop: 12, marginBottom: 12,
        overflowX: "auto", paddingBottom: 4
      }}>
        {SITUATION_CATEGORIES.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.emoji} {c.label}
          </Chip>
        ))}
      </div>

      {situations.map((s) => (
        <button key={s.id} onClick={() => onPickSituation(s.id)} style={{
          display: "block", width: "100%", textAlign: "right",
          padding: 14, marginBottom: 8, borderRadius: 12,
          border: "1px solid #eee", background: "#fff",
          cursor: "pointer", fontFamily: "inherit"
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6 }}>{s.title}</div>
          <div style={{ fontSize: 12, color: "#000", marginTop: 4 }}>{s.categoryLabel}</div>
        </button>
      ))}

      {situations.length === 0 && (
        <Card><p style={{ color: "#000", fontSize: 14 }}>موقعیتی در این دسته پیدا نشد.</p></Card>
      )}
    </Shell>
  );
}

/* =========================================================
 * ۱۸. جزئیات موقعیت
 * ========================================================= */

function SituationDetailView({ situationId, onBack, onPickSchema, onSOS }) {
  const situation = getSituation(situationId);

  if (!situation) {
    return (
      <Shell title="خطا" onBack={onBack} showSOS onSOS={onSOS}>
        <Card><p>موقعیت پیدا نشد.</p></Card>
      </Shell>
    );
  }

  const relatedSchemas = situation.schemas
    .map((id) => SCHEMAS.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <Shell title="موقعیت" onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, lineHeight: 1.7 }}>{situation.title}</h2>
        <div style={{ fontSize: 12, color: "#000" }}>{situation.categoryLabel}</div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
          آیا این جمله‌ها برای تو آشناست؟
        </div>
        {situation.examples.map((ex, i) => (
          <div key={i} style={{
            fontSize: 14, lineHeight: 1.9, padding: "8px 0",
            borderBottom: i < situation.examples.length - 1 ? "1px dashed #eee" : "none",
            color: "#000"
          }}>«{ex}»</div>
        ))}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
          چرخه‌ی پشت این موقعیت
        </div>
        {situation.cycle.map((step, i) => (
          <div key={i} style={{
            padding: "10px 12px", background: "#f6f6f6",
            borderRadius: 8, fontSize: 13, lineHeight: 1.7,
            marginBottom: 6, color: "#000"
          }}>{step}</div>
        ))}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
          این موقعیت به این الگوها مربوط است
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

      <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>چه کار کنی؟</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {situation.whatToDo.map((tip, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.95 }}>
              • {tip}
            </div>
          ))}
        </div>
      </Card>

      {situation.selfTalk && situation.selfTalk.length > 0 && (
        <Card style={{ marginTop: 12, background: "#eef4ff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            🗣️ به خودت این‌ها را بگو
          </div>
          {situation.selfTalk.map((phrase, i) => (
            <div
              key={i}
              style={{
                fontSize: 14,
                lineHeight: 1.9,
                color: "#000",
                marginBottom: 8,
                padding: "10px 14px",
                background: "#fff",
                borderRadius: 8,
                borderRight: "3px solid #3b82f6"
              }}
            >
              «{phrase}»
            </div>
          ))}
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <Btn variant="ghost" onClick={() => onPickSchema(relatedSchemas[0]?.id)}>
          کار روی {relatedSchemas[0]?.name_plain || relatedSchemas[0]?.name_fa || "این الگو"}
        </Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * ۱۹. صفحه روابط
 * ========================================================= */

function RelationshipsView({ analysis, onBack, onPickPattern, onPickResponseGuide, onSOS }) {
  const userSchemas = useMemo(() => {
    if (!analysis?.all) return [];
    return analysis.all.filter((r) => r.percentage >= 40);
  }, [analysis]);

  const relevantPatterns = useMemo(() => {
    if (userSchemas.length === 0) return ATTRACTION_PATTERNS;
    const userSchemaIds = userSchemas.map((s) => s.schemaId);
    return ATTRACTION_PATTERNS
      .filter((p) => p.schemas.some((sid) => userSchemaIds.includes(sid)))
      .concat(
        ATTRACTION_PATTERNS.filter((p) => !p.schemas.some((sid) => userSchemaIds.includes(sid)))
      );
  }, [userSchemas]);

  return (
    <Shell title="روابط من" onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <p style={{ margin: 0, fontSize: 14, color: "#000", lineHeight: 1.9 }}>
          چطور با دیگران برخورد کنم؟ چرا بعضی روابط تکرار می‌شوند؟
        </p>
      </Card>

      <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          💬 چطور با طرف مقابل برخورد کنم؟
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.85, marginBottom: 4 }}>
          اگر طرف مقابلت این الگو را دارد، روی اسمش بزن تا ببینی چطور رفتار کنی.
        </div>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {SCHEMAS.map((s) => {
            const guide = HOW_TO_RESPOND[s.id];
            const plain = s.name_plain || guide?.plainName;
            return (
              <button key={s.id} onClick={() => onPickResponseGuide(s.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,.2)",
                background: "transparent", color: "#fff",
                cursor: "pointer", textAlign: "right", fontFamily: "inherit"
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {plain || s.name_fa}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{s.name_fa}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <h3 style={{ margin: "22px 0 8px", fontSize: 15 }}>
        🔁 چرا بعضی روابط تکرار می‌شوند؟
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#000", lineHeight: 1.8 }}>
        این‌ها ترکیب‌های رایج‌اند. روی هر کدام بزن تا بفهمی چرا همیشه شبیه هم‌اند.
      </p>

      {relevantPatterns.map((p) => (
        <button key={p.id} onClick={() => onPickPattern(p.id)} style={{
          display: "block", width: "100%", textAlign: "right",
          padding: 16, marginBottom: 10, borderRadius: 12,
          border: "1px solid #eee", background: "#fff",
          cursor: "pointer", fontFamily: "inherit"
        }}>
          <div style={{ fontSize: 11, color: "#000", marginBottom: 6 }}>{p.shortName}</div>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.6, marginBottom: 8 }}>
            {p.boxTitle || p.title}
          </div>
          <div style={{ fontSize: 13, color: "#000", lineHeight: 1.7 }}>
            {p.boxDescription}
          </div>
        </button>
      ))}
    </Shell>
  );
}

/* =========================================================
 * ۲۰. جزئیات الگوی جذب
 * ========================================================= */

function RelationshipDetailView({ patternId, onBack, onSOS }) {
  const pattern = ATTRACTION_PATTERNS.find((p) => p.id === patternId);

  if (!pattern) {
    return (
      <Shell title="خطا" onBack={onBack} showSOS onSOS={onSOS}>
        <Card><p>الگو پیدا نشد.</p></Card>
      </Shell>
    );
  }

  const schemas = pattern.schemas
    .map((id) => SCHEMAS.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <Shell title={pattern.shortName} onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, lineHeight: 1.7 }}>{pattern.title}</h2>
        <div style={{ fontSize: 12, color: "#000", marginBottom: 12 }}>
          {schemas.map((s) => s.name_plain || s.name_fa).join(" + ")}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>
          {pattern.boxDescription}
        </div>
      </Card>

      {pattern.childhood && (
        <Card style={{ marginTop: 12, background: "#eef4ff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            🧸 احتمالاً در کودکی این‌ها را تجربه کرده
          </div>
          {Array.isArray(pattern.childhood) ? pattern.childhood.map((c, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 8 }}>
              • {c}
            </div>
          )) : (
            <div style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>
              {pattern.childhood}
            </div>
          )}
        </Card>
      )}

      {pattern.realLife && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
            📖 در زندگی واقعی چطور است؟
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>{pattern.realLife}</div>
        </Card>
      )}

      <Card style={{ marginTop: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
          🔁 معمولاً چطور پیش می‌رود؟
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>{pattern.typical}</div>
      </Card>

      <Card style={{ marginTop: 12, background: "#fef3f2" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#000" }}>
          ⚠️ چالش‌های این رابطه
        </div>
        {pattern.challenges.map((c, i) => (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 6 }}>
            • {c}
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 12, background: "#eef7ee" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#000" }}>
          ✅ چه چیزی کمک می‌کند
        </div>
        {pattern.whatHelps.map((h, i) => (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 6 }}>
            ✓ {h}
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 12, background: "#fff8e1" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#000" }}>
          ❌ چه چیزی اوضاع را بدتر می‌کند
        </div>
        {pattern.whatHurts.map((h, i) => (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 6 }}>
            ✕ {h}
          </div>
        ))}
      </Card>

      {pattern.whatToDoNow && (
        <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            🕊️ حالا باید چکار کرد
          </div>
          {pattern.whatToDoNow.map((w, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.9, marginBottom: 8, opacity: 0.95 }}>
              • {w}
            </div>
          ))}
        </Card>
      )}
    </Shell>
  );
}

/* =========================================================
 * ۲۱. راهنمای برخورد
 * ========================================================= */

function ResponseGuideView({ schemaId, onBack, onSOS }) {
  const guide = getResponseGuide(schemaId);
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const plain = schema?.name_plain || guide?.plainName;

  if (!guide) {
    return (
      <Shell title="خطا" onBack={onBack} showSOS onSOS={onSOS}>
        <Card><p>راهنمایی پیدا نشد.</p></Card>
      </Shell>
    );
  }

  return (
    <Shell title={plain || guide.name} onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>{plain || guide.name}</h2>
        <div style={{ fontSize: 12, color: "#000", marginBottom: 12 }}>{guide.name}</div>
        <div style={{ fontSize: 14, color: "#000", lineHeight: 1.9 }}>
          {guide.plainDescription}
        </div>
      </Card>

      {guide.example && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            📖 در زندگی واقعی
          </div>
          <div style={{ fontSize: 14, color: "#000", lineHeight: 1.9 }}>
            {guide.example}
          </div>
        </Card>
      )}

      {guide.childhood && (
        <Card style={{ marginTop: 12, background: "#eef4ff" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            🧸 احتمالاً در کودکی این‌ها را تجربه کرده
          </div>
          {guide.childhood.map((c, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 8 }}>
              • {c}
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>🌟 قاعده طلایی</div>
        <div style={{ fontSize: 16, lineHeight: 1.9, fontWeight: 600 }}>{guide.goldenRule}</div>
      </Card>

      <Card style={{ marginTop: 12, background: "#eef7ee" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#000" }}>
          ✅ این کارها را بکن
        </div>
        {guide.doThis.map((d, i) => (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 8 }}>
            • {d}
          </div>
        ))}
      </Card>

      <Card style={{ marginTop: 12, background: "#fef3f2" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: "#000" }}>
          ❌ این کارها را نکن
        </div>
        {guide.dontDoThis.map((d, i) => (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 8 }}>
            • {d}
          </div>
        ))}
      </Card>

      {guide.whatToDoNow && (
        <Card style={{ marginTop: 12, background: "#fff8e1" }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#000" }}>
            🕊️ حالا باید چکار کرد
          </div>
          {guide.whatToDoNow.map((w, i) => (
            <div key={i} style={{ fontSize: 14, lineHeight: 1.9, color: "#000", marginBottom: 8 }}>
              • {w}
            </div>
          ))}
        </Card>
      )}
    </Shell>
  );
}

/* =========================================================
 * ۲۲. صفحه شکستن چرخه
 * ========================================================= */

function BreakCycleView({ onBack, onSOS }) {
  return (
    <Shell title="چطور چرخه را بشکنم" onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <p style={{ margin: 0, fontSize: 14, color: "#000", lineHeight: 1.9 }}>
          هر بار که این ۶ قدم را طی کنی، مغزت یاد می‌گیرد که لازم نیست همیشه
          واکنش قدیمی را اجرا کند.
        </p>
      </Card>

      {BREAK_CYCLE_GUIDE.steps.map((s) => (
        <Card key={s.num} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#1a3d2c", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 16, flexShrink: 0
            }}>{toFa(s.num)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "#000", lineHeight: 1.8 }}>{s.desc}</div>
            </div>
          </div>
        </Card>
      ))}

      <Card style={{ marginTop: 16, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
        <div style={{ fontSize: 14, lineHeight: 1.9, textAlign: "center" }}>
          تغییر با ۱۰۰ بار تکرار می‌آید، نه با یک بار موفقیت.
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * ۲۳. صفحه پیشرفت
 * ========================================================= */

function ProgressView({ schemaId, onBack, onQuick, onWins, onCalendar, onSOS }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => { buildProgressSummary(schemaId).then(setSummary); }, [schemaId]);

  if (!summary) {
    return (
      <Shell title="پیشرفت" onBack={onBack} showQuickButton onQuick={onQuick} showSOS onSOS={onSOS}>
        <p style={{ color: "#000" }}>در حال بارگذاری...</p>
      </Shell>
    );
  }

  const { reactions, total, streak, insights, weekly, winsCount } = summary;

  return (
    <Shell title="پیشرفت" onBack={onBack} showQuickButton onQuick={onQuick} showSOS onSOS={onSOS}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 12, color: "#000" }}>فعال شدن الگو</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {toFa(total)}
            </div>
          </div>
          {streak > 0 && (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#000" }}>روز پیوسته</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>
                {toFa(streak)}
              </div>
            </div>
          )}
        </div>

        {winsCount > 0 && (
          <button onClick={onWins} style={{
            marginTop: 14, width: "100%", padding: 12,
            borderRadius: 10, border: "1px solid #ffe0b2",
            background: "#fff8e1", cursor: "pointer",
            textAlign: "right", fontFamily: "inherit"
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#000" }}>
              ⭐ {toFa(winsCount)} لحظه‌ی برد
            </span>
            <div style={{ fontSize: 12, color: "#000", marginTop: 2 }}>
              ببین چه کردی →
            </div>
          </button>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>واکنش قدیمی</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{toFa(reactions.old)}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <ProgressBar value={reactions.old} max={Math.max(10, total)} color="#e74c3c" />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>مکث</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{toFa(reactions.paused)}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <ProgressBar value={reactions.paused} max={Math.max(10, total)} color="#f39c12" />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>پاسخ جدید</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{toFa(reactions.new)}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <ProgressBar value={reactions.new} max={Math.max(10, total)} color="#27ae60" />
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onCalendar} style={styles.dashBtn}>📅 تقویم</button>
        <button onClick={onWins} style={styles.dashBtn}>⭐ لحظه‌های من</button>
      </div>

      {(weekly.lastWeek.total > 0 || weekly.thisWeek.total > 0) && (
        <Card style={{ marginTop: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            این هفته در مقایسه با هفته قبل
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
            <div style={{ color: "#000" }}></div>
            <div style={{ textAlign: "center", color: "#000", fontSize: 12 }}>هفته قبل</div>
            <div style={{ textAlign: "center", color: "#000", fontSize: 12 }}>این هفته</div>

            <div>فعال شدن</div>
            <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
              {toFa(weekly.lastWeek.total)}
            </div>
            <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
              {toFa(weekly.thisWeek.total)}
            </div>

            <div>واکنش قدیمی</div>
            <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#000" }}>
              {toFa(weekly.lastWeek.old)}
            </div>
            <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#000", fontWeight: 600 }}>
              {toFa(weekly.thisWeek.old)}
            </div>

            <div>پاسخ جدید</div>
            <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#000" }}>
              {toFa(weekly.lastWeek.new)}
            </div>
            <div style={{ textAlign: "center", fontVariantNumeric: "tabular-nums", color: "#000", fontWeight: 600 }}>
              {toFa(weekly.thisWeek.new)}
            </div>
          </div>
        </Card>
      )}

      {insights.length > 0 && (
        <Card style={{ marginTop: 12, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            چه چیزی در حال تغییر است؟
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ fontSize: 14, lineHeight: 1.8, opacity: 0.95 }}>
                • {ins.text}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <Btn onClick={onQuick}>⚡ همین الان فعال شد</Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * ۲۴. جریان سریع
 * ========================================================= */

function QuickCheckView({ profiles, onDone, onBack }) {
  const [phase, setPhase] = useState("choose");
  const [pickedSchema, setPickedSchema] = useState(profiles[0]?.schemaId || null);

  const save = async (reaction) => {
    await recordCycle({ schemaId: pickedSchema, reactionType: reaction, notes: "ثبت سریع" });
    setPhase("saved");
  };

  if (phase === "choose") {
    return (
      <Shell title="همین الان فعال شد" onBack={onBack}>
        <Card>
          <p style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 600 }}>
            کدام الگو فعال شد؟
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {profiles.map((p) => (
              <button key={p.schemaId} onClick={() => {
                setPickedSchema(p.schemaId);
                setPhase("breathe");
              }} style={styles.quickOptBtn}>
                {p.name}
              </button>
            ))}
          </div>
        </Card>
      </Shell>
    );
  }

  if (phase === "breathe") {
    return (
      <Shell title="مکث" onBack={onBack}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏸️</div>
          <p style={{ fontSize: 16, lineHeight: 1.9, margin: "0 0 20px" }}>
            ۱۰ ثانیه هیچ کاری نکن.<br />نفس بکش.
          </p>
          <p style={{ fontSize: 14, color: "#000", lineHeight: 1.9 }}>
            الان چه چیزی را واقعاً می‌دانم؟<br />
            و چه چیزی را فقط حدس می‌زنم؟
          </p>
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => setPhase("action")}>ادامه</Btn>
        </div>
      </Shell>
    );
  }

  if (phase === "action") {
    return (
      <Shell title="انتخاب" onBack={onBack}>
        <Card>
          <p style={{ margin: "0 0 14px", fontSize: 15 }}>
            این بار می‌خواهی همان واکنش قبلی را تکرار کنی یا امتحان جدیدی داشته باشی؟
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => save("old")} style={{ ...styles.quickOptBtn, borderColor: "#e74c3c", color: "#000" }}>
              واکنش قدیمی
            </button>
            <button onClick={() => save("new")} style={{ ...styles.quickOptBtn, background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)", color: "#fff", borderColor: "#178a7c" }}>
              امتحان جدید
            </button>
            <button onClick={() => save("paused")} style={{ ...styles.quickOptBtn, borderColor: "#f39c12", color: "#000" }}>
              فقط مکث می‌کنم
            </button>
          </div>
        </Card>
      </Shell>
    );
  }

  if (phase === "saved") {
    return (
      <Shell title="ثبت شد" onBack={onDone}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <p style={{ fontSize: 16, lineHeight: 1.9 }}>ثبت شد. این خودش یک قدم است.</p>
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={onDone}>بازگشت</Btn>
        </div>
      </Shell>
    );
  }

  return null;
}

/* =========================================================
 * ۲۵. اپ اصلی
 * ========================================================= */

export default function App() {
  const [view, setView] = useState("loading");
  const [analysis, setAnalysis] = useState(null);
  const [activeSchemaId, setActiveSchemaId] = useState(null);
  const [activeSituationId, setActiveSituationId] = useState(null);
  const [activePatternId, setActivePatternId] = useState(null);
  const [activeGuideSchemaId, setActiveGuideSchemaId] = useState(null);
  const [activeLifeCycleId, setActiveLifeCycleId] = useState(null);
  const [originSchemaId, setOriginSchemaId] = useState(null);
  const [returnFromOrigin, setReturnFromOrigin] = useState("profile");
  const [selection, setSelection] = useState(null);
  const [exerciseRecord, setExerciseRecord] = useState(null);
  const [missionRecord, setMissionRecord] = useState(null);
  const [returnTo, setReturnTo] = useState("welcome");

  useEffect(() => {
    Promise.all([loadProfile(), hasCheckedInToday()]).then(([p, checkedIn]) => {
      if (p) setAnalysis(p);
      if (!checkedIn) setView("checkin");
      else setView(p ? "profile" : "welcome");
    });
  }, []);

  const profiles = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.high, ...analysis.medium].map((r) => {
      const schema = SCHEMAS.find((s) => s.id === r.schemaId);
      return {
        schemaId: r.schemaId,
        name: schema?.name_plain || r.name
      };
    });
  }, [analysis]);

  const go = (v) => setView(v);

  const openSOS = () => {
    setReturnTo(view);
    go("sos");
  };

  const openOrigin = (schemaId, from) => {
    setOriginSchemaId(schemaId);
    setReturnFromOrigin(from);
    go("origin");
  };

  const todayPhrase = useMemo(() => {
    const all = [];
    for (const s of SCHEMAS) {
      const p = getCompassionatePhrases(s.id);
      for (const ph of p) all.push(ph);
    }
    if (all.length === 0) return null;
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return all[day % all.length];
  }, []);

  if (view === "loading") {
    return (
      <div style={styles.app}>
        <p style={{ textAlign: "center", padding: 40 }}>در حال بارگذاری...</p>
      </div>
    );
  }

  if (view === "checkin") {
    return (
      <CheckInView analysis={analysis}
        onDone={() => go(analysis ? "profile" : "welcome")}
        onSkip={() => go(analysis ? "profile" : "welcome")} />
    );
  }

  if (view === "sos") {
    return <SOSView onBack={() => go(returnTo)} onBetter={() => go(returnTo)} />;
  }

  if (view === "welcome") {
    return (
      <WelcomeView
        analysis={analysis}
        hasProfile={!!analysis}
        onStart={() => go("ysq")} onSkipToProfile={() => go("profile")}
        phrase={todayPhrase} onSOS={openSOS}
        onSituations={() => go("situations")}
        onRelationships={() => go("relationships")}
        onLifeCycles={() => go("life_cycles")} />
    );
  }

  if (view === "ysq") {
    return (
      <YSQView onBack={() => go("welcome")}
        onDone={async (answers, result) => {
          const payload = buildResultPayload(answers);
          console.log("YSQ payload:", payload);
          await saveProfile(result);
          setAnalysis(result);
          go("profile");
        }} />
    );
  }

  if (view === "profile") {
    return (
      <ProfileView analysis={analysis}
        onBack={() => go("welcome")} onRetake={() => go("ysq")}
        onWins={() => go("wins")} onCalendar={() => go("calendar")}
        onSOS={openSOS} onSituations={() => go("situations")}
        onRelationships={() => go("relationships")}
        onLifeCycles={() => go("life_cycles")}
        onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }}
        onPickOrigin={(id) => openOrigin(id, "profile")} />
    );
  }

  if (view === "origin" && originSchemaId) {
    return <OriginView schemaId={originSchemaId}
      onBack={() => go(returnFromOrigin)} onSOS={openSOS} />;
  }

  if (view === "life_cycles") {
    return (
      <LifeCyclesView
        onBack={() => go(analysis ? "profile" : "welcome")}
        onSOS={openSOS}
        onPickCycle={(id) => { setActiveLifeCycleId(id); go("life_cycle_detail"); }} />
    );
  }

  if (view === "life_cycle_detail" && activeLifeCycleId) {
    return (
      <LifeCycleDetailView
        cycleId={activeLifeCycleId}
        onBack={() => go("life_cycles")}
        onSOS={openSOS}
        onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }} />
    );
  }

  if (view === "cycle" && activeSchemaId) {
    return (
      <CycleView schemaId={activeSchemaId}
        onBack={() => go("profile")}
        onDone={(sel) => { setSelection(sel); go("cycle_summary"); }} />
    );
  }

  if (view === "cycle_summary" && selection) {
    return (
      <CycleSummaryView schemaId={activeSchemaId} selection={selection}
        onBack={() => go("cycle")} onContinue={() => go("exercise")}
        onViewOrigin={() => openOrigin(activeSchemaId, "cycle_summary")} />
    );
  }

  if (view === "exercise") {
    return (
      <ExerciseView schemaId={activeSchemaId} selection={selection}
        onBack={() => go("cycle_summary")}
        onDone={(record) => { setExerciseRecord(record || null); go("mission"); }} />
    );
  }

  if (view === "mission") {
    return (
      <MissionView schemaId={activeSchemaId}
        onBack={() => go("exercise")}
        onDone={(mission) => { setMissionRecord(mission); go("log"); }} />
    );
  }

  if (view === "log") {
    return (
      <LogResultView schemaId={activeSchemaId} selection={selection}
        onBack={() => go("mission")}
        onDone={async (log) => {
          await recordCycle({
            schemaId: activeSchemaId, ...selection, ...log,
            exerciseId: exerciseRecord?.exerciseId || null,
            exerciseResult: exerciseRecord?.result || null,
            missionId: missionRecord?.id || null
          });
          go("progress");
        }} />
    );
  }

  if (view === "progress") {
    return (
      <ProgressView schemaId={activeSchemaId}
        onBack={() => go("profile")} onQuick={() => go("quick")}
        onWins={() => go("wins")} onCalendar={() => go("calendar")}
        onSOS={openSOS} />
    );
  }

  if (view === "wins") {
    return <WinsView onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS} />;
  }

  if (view === "calendar") {
    return <CalendarView onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS} />;
  }

  if (view === "situations") {
    return (
      <SituationsView onBack={() => go(analysis ? "profile" : "welcome")}
        onSOS={openSOS}
        onPickSituation={(id) => { setActiveSituationId(id); go("situation_detail"); }} />
    );
  }

  if (view === "situation_detail" && activeSituationId) {
    return (
      <SituationDetailView situationId={activeSituationId}
        onBack={() => go("situations")} onSOS={openSOS}
        onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }} />
    );
  }

  if (view === "relationships") {
    return (
      <RelationshipsView analysis={analysis}
        onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS}
        onPickPattern={(id) => { setActivePatternId(id); go("relationship_detail"); }}
        onPickResponseGuide={(id) => { setActiveGuideSchemaId(id); go("response_guide"); }} />
    );
  }

  if (view === "relationship_detail" && activePatternId) {
    return (
      <RelationshipDetailView patternId={activePatternId}
        onBack={() => go("relationships")} onSOS={openSOS} />
    );
  }

  if (view === "response_guide" && activeGuideSchemaId) {
    return (
      <ResponseGuideView schemaId={activeGuideSchemaId}
        onBack={() => go("relationships")} onSOS={openSOS} />
    );
  }

  if (view === "break_cycle") {
    return <BreakCycleView onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS} />;
  }

  if (view === "quick") {
    return (
      <QuickCheckView
        profiles={profiles.length ? profiles : SCHEMAS.slice(0, 5).map((s) => ({
          schemaId: s.id, name: s.name_plain || s.name_fa
        }))}
        onBack={() => go("welcome")}
        onDone={() => go("progress")} />
    );
  }

  return <p style={{ padding: 20 }}>وضعیت ناشناخته: {view}</p>;
}

/* =========================================================
 * ۲۶. استایل‌ها
 * ========================================================= */

const styles = {
  app: {
    minHeight: "100vh", background: "#fafafa",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
    color: "#000", paddingBottom: 80, position: "relative"
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 16px", background: "#fff",
    borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10
  },
  headerTitle: { fontWeight: 700, fontSize: 15 },
  backBtn: {
    width: 32, height: 32, borderRadius: "50%",
    border: "1px solid #eee", background: "#fff",
    fontSize: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit"
  },
  sosHeaderBtn: {
    width: 40, height: 32, borderRadius: 8,
    border: "1px solid #e74c3c", background: "#fff",
    color: "#000", fontSize: 12, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit"
  },
  main: { maxWidth: 520, margin: "0 auto", padding: 16 },
  card: {
    padding: 16, borderRadius: 14,
    background: "#fff", border: "1px solid #f0f0f0"
  },
  btn: {
    width: "100%", padding: "14px 20px", borderRadius: 12,
    border: "none", fontSize: 15, fontWeight: 600, fontFamily: "inherit"
  },
  btnPrimary: { background: "#1a3d2c", color: "#fff" },
  btnGhost: { background: "#fff", color: "#000", border: "1px solid #e5e5e5" },
  btnDanger: { background: "#e74c3c", color: "#fff" },
  quickBtn: {
    position: "fixed", bottom: 20, left: "50%",
    transform: "translateX(-50%)",
    padding: "14px 24px", borderRadius: 999,
    background: "#1a3d2c", color: "#fff", border: "none",
    fontSize: 14, fontWeight: 600, cursor: "pointer",
    boxShadow: "0 6px 20px rgba(0,0,0,.2)", fontFamily: "inherit"
  },
  textarea: {
    width: "100%", padding: 10, borderRadius: 8,
    border: "1px solid #ddd", fontFamily: "inherit",
    fontSize: 13, resize: "vertical", boxSizing: "border-box"
  },
  moodBtn: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 18px", borderRadius: 12,
    border: "1px solid #e5e5e5", background: "#fff",
    cursor: "pointer", fontFamily: "inherit", fontSize: 15
  },
  dashBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    border: "1px solid #e5e5e5", background: "#fff",
    fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 600
  },
  quickOptBtn: {
    padding: "12px 14px", borderRadius: 10,
    border: "1px solid #e5e5e5", background: "#fff",
    fontSize: 14, textAlign: "right", cursor: "pointer", fontFamily: "inherit"
  },
  sosFull: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0a3d38 0%, #0f5b53 55%, #178a7c 100%)",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif"
  },
  breathCircle: {
    width: 200, height: 200, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.2)",
    margin: "0 auto",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(255,255,255,.05)", transition: "all 1s ease"
  },
  breathInner: { textAlign: "center" }
};
