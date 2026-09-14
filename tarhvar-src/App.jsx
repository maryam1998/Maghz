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
import { getLifeCycleDetail } from "./LIFE_CYCLES_DETAIL";
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

function OriginView({ schemaId, onBack, onSOS, onPickSchema }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const origin = getOrigin(schemaId);
  const nextSteps = getNextSteps(schemaId);
  const plainName = getPlainName(schemaId);
  const oneLiner = getOneLiner(schemaId);

  if (!origin) {
    return (
      <Shell title="ریشه" onBack={onBack} showSOS onSOS={onSOS}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9 }}>
            اطلاعاتی برای این الگو موجود نیست.
          </p>
        </Card>
      </Shell>
    );
  }

  const innerVoice = origin.innerVoice || [];
  const whatMissing = origin.whatWasMissing || [];
  const familyPatterns = origin.familyPatterns || [];
  const childhood = origin.childhood || [];

  // مراحل «چکار کنی» — از nextSteps
  const stages = (nextSteps || []).map((step, idx) => ({
    n: idx + 1,
    fullText: step,
    color: STAGE_COLORS[((idx) % 4) + 1] || "#1a3d2c"
  }));

  return (
    <Shell title={plainName || "ریشه‌ی این الگو"} onBack={onBack} showSOS onSOS={onSOS}>

      {/* ═══ Hero ═══ */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        padding: 24,
        marginBottom: 14,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(255,255,255,.05)"
        }} />
        <div style={{
          position: "absolute", bottom: -50, left: -30,
          width: 100, height: 100, borderRadius: "50%",
          background: "rgba(255,255,255,.04)"
        }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(255,255,255,.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26
            }}>🧸</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
                الگوی تو
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>
                {plainName || schema?.name_fa}
              </div>
            </div>
          </div>

          {oneLiner && (
            <div style={{
              fontSize: 13, lineHeight: 1.9, opacity: 0.9,
              padding: "12px 14px",
              background: "rgba(255,255,255,.08)",
              borderRadius: 10,
              marginBottom: 14
            }}>{oneLiner}</div>
          )}

          {schema?.name_fa && schema.name_fa !== plainName && (
            <div style={{
              fontSize: 11, opacity: 0.6,
              paddingRight: 4
            }}>
              نام علمی: {schema.name_fa}
            </div>
          )}
        </div>
      </Card>

      {/* ═══ توضیح ═══ */}
      <Card style={{
        marginBottom: 12,
        background: "#eef4ff",
        border: "1px solid #bfdbfe",
        padding: 16
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 20, flexShrink: 0 }}>💙</div>
          <div style={{ fontSize: 13, lineHeight: 1.9, color: "#1e40af" }}>
            این توضیح برای سرزنش کسی نیست.
            فقط می‌خواهیم ببینیم این الگو <strong>از کجا</strong> آمده —
            چون فهمیدن ریشه، اولین قدم شکستنش است.
          </div>
        </div>
      </Card>

      {/* ═══ در کودکی چه اتفاقی افتاد ═══ */}
      {childhood.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🌱" title="در کودکی چه اتفاقی افتاد؟" color="#065f46" />
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12, fontStyle: "italic" }}>
            این‌ها تجربه‌هایی هستند که ذهنت از آن‌ها این الگو را ساخت:
          </div>

          {childhood.map((c, i) => (
            <div key={i} style={{
              display: "flex",
              gap: 12,
              padding: "12px 14px",
              marginBottom: 8,
              background: "#f0f7f4",
              borderRadius: 10,
              borderRight: "3px solid #10b981"
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "#10b981", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                marginTop: 1
              }}>{toFa(i + 1)}</div>
              <div style={{
                flex: 1,
                fontSize: 13.5,
                lineHeight: 1.9,
                color: "#000"
              }}>{c}</div>
            </div>
          ))}
        </Card>
      )}

      {/* ═══ الگوی خانوادگی ═══ */}
      {familyPatterns.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#faf5ff", border: "1px solid #e9d5ff" }}>
          <SectionTitle icon="👨‍👩‍👧" title="الگوی خانوادگی" color="#6b21a8" />
          <div style={{ fontSize: 12, color: "#7c3aed", marginBottom: 12, fontStyle: "italic" }}>
            الگوهایی که نسل به نسل منتقل شده:
          </div>
          {familyPatterns.map((p, i) => (
            <div key={i} style={{
              fontSize: 13.5,
              lineHeight: 1.9,
              color: "#000",
              marginBottom: 10,
              padding: "10px 14px",
              background: "#fff",
              borderRadius: 10,
              borderRight: "3px solid #8e44ad"
            }}>{p}</div>
          ))}
        </Card>
      )}

      {/* ═══ کودکی‌ات این را یاد گرفت ═══ */}
      {origin.whatChildLearned && (
        <Card style={{
          marginBottom: 12,
          background: "linear-gradient(135deg, #fff8e1 0%, #fef3c7 100%)",
          border: "2px solid #f59e0b",
          padding: 20,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: -20, left: -20,
            fontSize: 80, opacity: 0.06
          }}>💡</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
            position: "relative"
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "#f59e0b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20
            }}>💡</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>
              کودکی که بودی، این را یاد گرفت
            </div>
          </div>
          <div style={{
            fontSize: 15,
            lineHeight: 2,
            color: "#000",
            fontStyle: "italic",
            fontWeight: 500,
            padding: "12px 14px",
            background: "rgba(255,255,255,.7)",
            borderRadius: 10,
            position: "relative"
          }}>
            {origin.whatChildLearned}
          </div>
        </Card>
      )}

      {/* ═══ این صداها برایت آشناست ═══ */}
      {innerVoice.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔊" title="این صداها برایت آشناست؟" color="#7c3aed" />
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12, fontStyle: "italic" }}>
            صدای منتقد درونی که در سرت تکرار می‌شود:
          </div>
          {innerVoice.map((v, i) => (
            <div key={i} style={{
              position: "relative",
              fontSize: 14,
              lineHeight: 1.9,
              color: "#000",
              marginBottom: 10,
              padding: "14px 18px 14px 46px",
              background: "#f3e8ff",
              borderRadius: 10,
              fontStyle: "italic"
            }}>
              <span style={{
                position: "absolute",
                right: 12, top: "50%",
                transform: "translateY(-50%)",
                fontSize: 20, color: "#8b5cf6",
                fontWeight: 700
              }}>“</span>
              {v}
            </div>
          ))}
        </Card>
      )}

      {/* ═══ کودکی‌ات این را لازم داشت ═══ */}
      {whatMissing.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <SectionTitle icon="🕊️" title="کودکی که بودی، این‌ها را لازم داشت" color="#065f46" />
          <div style={{ fontSize: 12, color: "#047857", marginBottom: 12, fontStyle: "italic" }}>
            چیزهایی که اگر بود، این الگو شکل نمی‌گرفت:
          </div>
          {whatMissing.map((w, i) => (
            <div key={i} style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              fontSize: 13.5,
              lineHeight: 1.9,
              color: "#000",
              marginBottom: 10
            }}>
              <span style={{
                color: "#10b981",
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
                marginTop: 2
              }}>✓</span>
              <span style={{ flex: 1 }}>{w}</span>
            </div>
          ))}
        </Card>
      )}

      {/* ═══ یادداشت همدلانه ═══ */}
      {origin.gentleReminder && (
        <Card style={{
          marginBottom: 12,
          background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
          color: "#fff",
          padding: 22,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💙</div>
          <div style={{ fontSize: 14, lineHeight: 2, opacity: 0.95 }}>
            {origin.gentleReminder}
          </div>
        </Card>
      )}

      {/* ═══ حالا باید چکار کنی ═══ */}
      {stages.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 12, paddingRight: 4
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, #0a3d38, #178a7c)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18
            }}>🚀</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>
                حالا باید چکار کنی؟
              </div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                {toFa(stages.length)} قدم — یکی‌یکی، نه یک‌جا
              </div>
            </div>
          </div>

          {stages.map((stage) => (
            <Card key={stage.n} style={{
              marginBottom: 8, padding: 14,
              borderRight: `4px solid ${stage.color}`,
              background: "#fff"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: stage.color, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, flexShrink: 0
                }}>{toFa(stage.n)}</div>
                <div style={{
                  flex: 1,
                  fontSize: 14,
                  lineHeight: 1.9,
                  color: "#000"
                }}>{stage.fullText}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ پیام پایانی ═══ */}
      <Card style={{
        marginTop: 12,
        background: "#f6f6f6",
        padding: 16,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 12, color: "#000", lineHeight: 1.9 }}>
          این کارها رو یک‌جا نمی‌شه انجام داد.
          <br />
          هر روز یک قدم کوچیک — همین کافیه.
        </div>
      </Card>

      {/* ═══ CTA ═══ */}
      {onPickSchema && (
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => onPickSchema(schemaId)}>
            ▶ شروع کار روی این الگو
          </Btn>
        </div>
      )}
    </Shell>
  );
}

/* =========================================================
 * ۳. صفحه چرخه‌های زندگی (لیست)
 * ========================================================= */

function LifeCyclesView({ onBack, onPickCycle, onSOS }) {
  const [category, setCategory] = useState("all");
  const cycles = getLifeCyclesByCategory(category);

  const catColors = {
    work: "#3b82f6",
    relationship: "#ec4899",
    family: "#f59e0b",
    social: "#8b5cf6",
    self: "#10b981",
    health: "#ef4444"
  };

  const featured = cycles.slice(0, 2);

  return (
    <Shell title="چرخه‌های زندگی" onBack={onBack} showSOS onSOS={onSOS}>

      {/* ─── Hero ─── */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        padding: 22,
        marginBottom: 14
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔄</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.5 }}>
          الگوهایی که در زندگی تکرار می‌شن
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
          این‌ها از ترکیب چند طرحواره ساخته می‌شن و
          در موقعیت‌های واقعی زندگی خودشون رو نشون می‌دن.
        </div>
      </Card>

      {/* ─── دسته‌بندی ─── */}
      <div style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        paddingBottom: 8,
        marginBottom: 12
      }}>
        {LIFE_CYCLE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              borderRadius: 20,
              border: "none",
              background: category === c.id ? "#1a3d2c" : "#fff",
              color: category === c.id ? "#fff" : "#000",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              border: category === c.id ? "none" : "1px solid #e5e5e5",
              transition: "all .15s ease",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* ─── لیست ─── */}
      {cycles.length === 0 && (
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
            چرخه‌ای در این دسته پیدا نشد.
          </p>
        </Card>
      )}

      {cycles.map((cycle) => {
        const color = catColors[cycle.category] || "#1a3d2c";
        return (
          <button key={cycle.id} onClick={() => onPickCycle(cycle.id)} style={{
            display: "block",
            width: "100%",
            textAlign: "right",
            padding: 18,
            marginBottom: 10,
            borderRadius: 14,
            border: "1px solid #f0f0f0",
            background: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
            position: "relative",
            overflow: "hidden",
            transition: "all .15s ease"
          }}>
            {/* نوار رنگی کنار */}
            <div style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 4,
              height: "100%",
              background: color
            }} />

            {/* دسته */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10
            }}>
              <span style={{
                fontSize: 10,
                padding: "3px 10px",
                borderRadius: 20,
                background: color + "15",
                color: color,
                fontWeight: 700
              }}>
                {cycle.categoryLabel}
              </span>
            </div>

            {/* عنوان */}
            <div style={{
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.6,
              color: "#000",
              marginBottom: 8
            }}>
              {cycle.title}
            </div>

            {/* توضیح */}
            <div style={{
              fontSize: 12,
              color: "#666",
              lineHeight: 1.8
            }}>
              {cycle.shortDescription}
            </div>

            {/* نمایش فلش */}
            <div style={{
              marginTop: 12,
              fontSize: 11,
              color: color,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <span>مشاهده کامل</span>
              <span>←</span>
            </div>
          </button>
        );
      })}

      {/* ─── پیام پایانی ─── */}
      {cycles.length > 0 && (
        <Card style={{
          marginTop: 12,
          background: "#f6f6f6",
          padding: 16,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 12, color: "#000", lineHeight: 1.9 }}>
            هر بار که چرخه‌ای رو ببینی،
            <br />
            یک قدم ازش فاصله گرفتی.
          </div>
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
  const activeCount = activeSchemaIds ? activeSchemaIds.length : 0;

  const actions = [
    { id: "life", icon: "🔄", title: "چرخه‌های زندگی", desc: "الگوهای عمیق‌تر", onClick: onLifeCycles, color: "#8b5cf6" },
    { id: "sit",  icon: "🔍", title: "حس الان من",     desc: "موقعیت‌های واقعی", onClick: onSituations, color: "#0ea5e9" },
    { id: "rel",  icon: "💞", title: "روابط من",       desc: "چطور برخورد کنم؟", onClick: onRelationships, color: "#ec4899" }
  ];

  return (
    <Shell title="الگوهای من" showSOS onSOS={onSOS}>

      {/* ─── Hero ─── */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        padding: 24,
        marginBottom: 12,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: -40, left: -40,
          width: 140, height: 140,
          borderRadius: "50%",
          background: "rgba(255,255,255,.05)"
        }} />
        <div style={{
          position: "absolute",
          bottom: -60, right: -20,
          width: 100, height: 100,
          borderRadius: "50%",
          background: "rgba(255,255,255,.04)"
        }} />

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8, letterSpacing: 1 }}>
            شناخت الگوهای تکرارشونده
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: 24, lineHeight: 1.5, fontWeight: 700 }}>
            چه چیزی در من
            <br />
            تکرار می‌شود؟
          </h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
            اینجا قرار نیست برچسبی به تو بزنیم. با هم می‌بینیم کجا فعال می‌شوی و چطور می‌توانی این بار جور دیگری پاسخ بدهی.
          </p>
        </div>
      </Card>

      {/* ─── یادآوری‌های امروز ─── */}
      {reminders && reminders.length > 0 && (
        <Card style={{
          marginBottom: 12,
          background: "#fff8e1",
          border: "1px solid #fde68a",
          padding: 16
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "#f59e0b",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14
            }}>💡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>
                یادآوری‌های امروز
              </div>
              {activeCount > 0 && (
                <div style={{ fontSize: 11, color: "#92400e" }}>
                  بر اساس {toFa(activeCount)} الگوی فعال تو
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reminders.slice(0, 3).map((rem, i) => (
              <div key={i} style={{
                fontSize: 13,
                lineHeight: 1.9,
                color: "#000",
                padding: "10px 12px",
                background: "rgba(255,255,255,.6)",
                borderRadius: 8,
                borderRight: "3px solid #f59e0b"
              }}>
                {rem}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── دکمه اصلی ─── */}
      <div style={{ marginBottom: 16 }}>
        {hasProfile ? (
          <button onClick={onSkipToProfile} style={{
            width: "100%",
            padding: "18px 20px",
            borderRadius: 14,
            border: "none",
            background: "#1a3d2c",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(26,61,44,.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>🧭</span>
              <span>پروفایل الگوهای من</span>
            </div>
            <span style={{ opacity: 0.6 }}>←</span>
          </button>
        ) : (
          <button onClick={onStart} style={{
            width: "100%",
            padding: "18px 20px",
            borderRadius: 14,
            border: "none",
            background: "#1a3d2c",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(26,61,44,.2)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>✨</span>
              <span>شروع ارزیابی</span>
            </div>
            <span style={{ opacity: 0.6 }}>←</span>
          </button>
        )}
      </div>

      {/* ─── اکشن‌های سریع ─── */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 8, paddingRight: 4 }}>
        کاوش کن
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginBottom: 20
      }}>
        {actions.map((a) => (
          <button key={a.id} onClick={a.onClick} style={{
            padding: 16,
            borderRadius: 14,
            border: "1px solid #e5e5e5",
            background: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "right",
            transition: "all .15s ease"
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: a.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, marginBottom: 12
            }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginBottom: 3 }}>
              {a.title}
            </div>
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>
              {a.desc}
            </div>
          </button>
        ))}
      </div>

      {/* ─── فوت‌نوت ─── */}
      <Card style={{ background: "#f6f6f6", padding: 14 }}>
        <div style={{ fontSize: 11, color: "#000", lineHeight: 1.9 }}>
          <strong style={{ display: "block", marginBottom: 6 }}>این اپ چه چیزی نیست:</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, opacity: 0.75 }}>
            <span>• تشخیص پزشکی نمی‌دهد</span>
            <span>• از AI برای قضاوت استفاده نمی‌کند</span>
            <span>• جایگزین درمانگر نیست</span>
          </div>
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
 * ۹. صفحه پروفایل (تک انتخابی)
 * ========================================================= */

function ProfileView({
  analysis, onPickSchema, onPickOrigin, onRetake, onBack,
  onWins, onCalendar, onSOS, onSituations, onRelationships, onLifeCycles
}) {
  if (!analysis) {
    return (
      <Shell title="پروفایل" onBack={onBack}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9 }}>
            هنوز ارزیابی‌ای انجام نشده.
          </p>
        </Card>
      </Shell>
    );
  }

  const { high, medium, low, recommended } = analysis;
  const recSchema = SCHEMAS.find((s) => s.id === recommended?.schemaId);
  const recPlain = recSchema?.name_plain || recommended?.name;
  const allActive = [...high, ...medium];

  const quickActions = [
    { id: "wins",     icon: "⭐", title: "لحظه‌های من",  onClick: onWins,       color: "#f59e0b" },
    { id: "cal",      icon: "📅", title: "تقویم",         onClick: onCalendar,   color: "#3b82f6" },
    { id: "sit",      icon: "🔍", title: "موقعیت‌ها",    onClick: onSituations, color: "#0ea5e9" },
    { id: "life",     icon: "🔄", title: "چرخه‌ها",       onClick: onLifeCycles, color: "#8b5cf6" },
    { id: "rel",      icon: "💞", title: "روابط",        onClick: onRelationships, color: "#ec4899" }
  ];

  return (
    <Shell title="پروفایل الگوهای من" onBack={onBack}
      showQuickButton onQuick={() => onPickSchema(recommended?.schemaId)}
      showSOS onSOS={onSOS}>

      {/* ─── Hero با پیشنهاد ─── */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        padding: 22,
        marginBottom: 12,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: -30, left: -30,
          width: 120, height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,.06)"
        }} />

        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            padding: "4px 10px",
            background: "rgba(255,255,255,.15)",
            borderRadius: 20,
            marginBottom: 12
          }}>
            <span>{recommended?.priority?.emoji}</span>
            <span>پیشنهاد شروع</span>
          </div>

          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>
            {recPlain}
          </div>

          {recSchema && (
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>
              {recSchema.name_fa}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                height: 6,
                background: "rgba(255,255,255,.2)",
                borderRadius: 3,
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: (recommended?.percentage || 0) + "%",
                  background: "#fff",
                  borderRadius: 3,
                  transition: "width .6s ease"
                }} />
              </div>
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums"
            }}>
              {toFa(recommended?.percentage || 0)}%
            </span>
          </div>

          <button
            onClick={() => onPickSchema(recommended?.schemaId)}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.3)",
              background: "rgba(255,255,255,.1)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <span>شروع کار روی این الگو</span>
            <span style={{ opacity: 0.7 }}>←</span>
          </button>
        </div>
      </Card>

      {/* ─── آمار کلی ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        marginBottom: 16
      }}>
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>
            {toFa(high.length)}
          </div>
          <div style={{ fontSize: 11, color: "#991b1b", marginTop: 4 }}>بالا</div>
        </div>
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: "#fffbeb",
          border: "1px solid #fde68a",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#d97706", fontVariantNumeric: "tabular-nums" }}>
            {toFa(medium.length)}
          </div>
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>متوسط</div>
        </div>
        <div style={{
          padding: 14,
          borderRadius: 12,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#059669", fontVariantNumeric: "tabular-nums" }}>
            {toFa(low.length)}
          </div>
          <div style={{ fontSize: 11, color: "#065f46", marginTop: 4 }}>پایین</div>
        </div>
      </div>

      {/* ─── اکشن‌های سریع ─── */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 8, paddingRight: 4 }}>
        دسترسی سریع
      </div>
      <div style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        paddingBottom: 4,
        marginBottom: 20
      }}>
        {quickActions.map((a) => (
          <button key={a.id} onClick={a.onClick} style={{
            flexShrink: 0,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            background: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#000"
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: a.color + "15",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14
            }}>{a.icon}</span>
            <span style={{ whiteSpace: "nowrap" }}>{a.title}</span>
          </button>
        ))}
      </div>

      {/* ─── الگوهای فعال ─── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>
          الگوهای فعال
        </div>
        <span style={{ fontSize: 11, color: "#666" }}>
          {toFa(allActive.length)} الگو
        </span>
      </div>

      {allActive.length === 0 && (
        <Card style={{ textAlign: "center", padding: 24, marginBottom: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, color: "#000" }}>
            در حال حاضر الگوی فعالی نداری.
          </p>
        </Card>
      )}

      {allActive.map((r) => {
        const schema = SCHEMAS.find((s) => s.id === r.schemaId);
        const plain = schema?.name_plain || r.name;

        return (
          <div key={r.schemaId} style={{
            marginBottom: 10,
            borderRadius: 14,
            background: "#fff",
            border: "1px solid #f0f0f0",
            overflow: "hidden",
            transition: "all .15s ease"
          }}>
            <button onClick={() => onPickSchema(r.schemaId)} style={{
              display: "block", width: "100%", textAlign: "right",
              padding: 16, border: "none", background: "transparent",
              cursor: "pointer", fontFamily: "inherit"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 4,
                  height: 44,
                  borderRadius: 2,
                  background: r.priority.color,
                  flexShrink: 0
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#000", marginBottom: 3 }}>
                        {plain}
                      </div>
                      <div style={{ fontSize: 10, color: "#999" }}>
                        {schema?.name_fa || ""}
                      </div>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: r.priority.color + "15",
                      fontSize: 12,
                      fontWeight: 700,
                      color: r.priority.color,
                      fontVariantNumeric: "tabular-nums"
                    }}>
                      <span>{r.priority.emoji}</span>
                      <span>{toFa(r.percentage)}%</span>
                    </div>
                  </div>

                  <div style={{
                    height: 4,
                    background: "#f0f0f0",
                    borderRadius: 2,
                    overflow: "hidden",
                    marginBottom: 10
                  }}>
                    <div style={{
                      height: "100%",
                      width: r.percentage + "%",
                      background: r.priority.color,
                      transition: "width .4s ease"
                    }} />
                  </div>

                  {schema?.one_liner && (
                    <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
                      {schema.one_liner}
                    </div>
                  )}
                </div>
              </div>
            </button>

            <div style={{
              display: "flex",
              borderTop: "1px solid #f0f0f0"
            }}>
              <button onClick={() => onPickOrigin(r.schemaId)} style={{
                flex: 1,
                padding: "12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                color: "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}>
                🧸 ریشه و راهنما
              </button>
              <div style={{ width: 1, background: "#f0f0f0" }} />
              <button onClick={() => onPickSchema(r.schemaId)} style={{
                flex: 1,
                padding: "12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                color: "#1a3d2c",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}>
                ▶ شروع کار
              </button>
            </div>
          </div>
        );
      })}

      {/* ─── سایر الگوها ─── */}
      {low.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#666", margin: "22px 0 10px", paddingRight: 4 }}>
            سایر الگوها
          </div>
          {low.map((r) => {
            const schema = SCHEMAS.find((s) => s.id === r.schemaId);
            const plain = schema?.name_plain || r.name;
            return (
              <button key={r.schemaId} onClick={() => onPickSchema(r.schemaId)} style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                marginBottom: 6,
                borderRadius: 10,
                border: "1px solid #f0f0f0",
                background: "#fafafa",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "right"
              }}>
                <span style={{ fontSize: 13, color: "#000" }}>{plain}</span>
                <span style={{
                  fontSize: 11,
                  color: "#999",
                  fontVariantNumeric: "tabular-nums"
                }}>
                  {toFa(r.percentage)}%
                </span>
              </button>
            );
          })}
        </>
      )}

      <div style={{ marginTop: 20 }}>
        <Btn variant="ghost" onClick={onRetake}>ارزیابی مجدد</Btn>
      </div>

      <p style={{ fontSize: 10, color: "#999", marginTop: 20, lineHeight: 1.8, textAlign: "center" }}>
        این نتایج یک ارزیابی خودگزارشی است و تشخیص بالینی نیست.
      </p>
    </Shell>
  );
}

/* =========================================================
 * ۱۰. صفحه چرخه — با انتخاب چندگانه
 * ========================================================= */

function CycleView({ schemaId, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState({
    triggerIds: [],
    thoughtIds: [],
    emotionIds: [],
    behaviorIds: []
  });

  if (!schema) {
    return (
      <Shell title="خطا" onBack={onBack}>
        <Card><p>طرحواره پیدا نشد.</p></Card>
      </Shell>
    );
  }

  const steps = [
    { key: "trigger",  title: "چه چیزی معمولاً این حالت را فعال می‌کند؟", items: schema.triggers,            idKey: "triggerIds" },
    { key: "thought",  title: "معمولاً چه فکری از ذهنت می‌گذرد؟",          items: schema.automatic_thoughts, idKey: "thoughtIds" },
    { key: "emotion",  title: "چه احساسی بالا می‌آید؟",                    items: schema.emotional_signals,  idKey: "emotionIds" },
    { key: "behavior", title: "معمولاً چه کار می‌کنی؟",                    items: schema.behavioral_patterns, idKey: "behaviorIds" }
  ];

  const current = steps[step];
  const selected = choice[current.idKey] || [];

  const toggle = (id) => {
    const arr = choice[current.idKey] || [];
    const next = arr.includes(id)
      ? arr.filter((x) => x !== id)
      : [...arr, id];
    setChoice({ ...choice, [current.idKey]: next });
  };

  const goNext = () => {
    if (step < steps.length - 1) {
      setTimeout(() => setStep(step + 1), 200);
    } else {
      setTimeout(() => onDone(choice), 250);
    }
  };

  const canContinue = selected.length > 0;

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
        <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>
          {current.title}
        </p>
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 16px" }}>
          می‌توانی چند مورد را انتخاب کنی — محدودیتی نیست.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {current.items.map((it) => {
            const active = selected.includes(it.id);
            return (
              <button key={it.id} onClick={() => toggle(it.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: active ? "2px solid #1a3d2c" : "1px solid #e5e5e5",
                background: active ? "#1a3d2c" : "#fff",
                color: active ? "#fff" : "#000",
                fontSize: 14, textAlign: "right",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 10
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: active ? "none" : "2px solid #ccc",
                  background: active ? "#fff" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: active ? "#1a3d2c" : "transparent",
                  fontSize: 12, fontWeight: 900, flexShrink: 0
                }}>
                  {active ? "✓" : ""}
                </div>
                <span style={{ flex: 1 }}>{it.text}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {selected.length > 0 && (
        <Card style={{ marginTop: 12, background: "#eef7ee" }}>
          <div style={{ fontSize: 13, color: "#000", lineHeight: 1.8 }}>
            {toFa(selected.length)} مورد انتخاب کردی
          </div>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <Btn onClick={goNext} disabled={!canContinue}>
          {step < steps.length - 1 ? "بعدی" : "دیدن خلاصه"}
        </Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * ۱۱. خلاصه چرخه
 * ========================================================= */

function CycleSummaryView({ schemaId, selection, onContinue, onViewOrigin, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const findMany = (list, ids) =>
    (ids || []).map((id) => (list || []).find((x) => x.id === id)).filter(Boolean);

  const sections = [
    { key: "trigger",  label: "محرک‌ها",        icon: "⚡",  color: "#f59e0b", values: findMany(schema.triggers,            selection.triggerIds) },
    { key: "thought",  label: "فکرهای خودکار", icon: "💭",  color: "#8b5cf6", values: findMany(schema.automatic_thoughts, selection.thoughtIds) },
    { key: "emotion",  label: "احساس‌ها",       icon: "💧",  color: "#3b82f6", values: findMany(schema.emotional_signals,  selection.emotionIds) },
    { key: "behavior", label: "واکنش‌های قدیمی", icon: "🔁", color: "#ef4444", values: findMany(schema.behavioral_patterns, selection.behaviorIds) }
  ];

  const phrases = getCompassionatePhrases(schemaId);
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  const totalItems = sections.reduce((s, sec) => s + sec.values.length, 0);

  return (
    <Shell title="الگوی تو" onBack={onBack}>

      {/* ─── Hero ─── */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        padding: 22,
        marginBottom: 16,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🧩</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          چرخه‌ی تو
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
          {toFa(totalItems)} بخش از این الگو رو شناختی
          <br />
          این شناخت، اولین قدم شکستنه
        </div>
      </Card>

      {/* ─── بخش‌ها ─── */}
      {sections.map((sec, idx) => {
        if (sec.values.length === 0) return null;

        return (
          <div key={sec.key} style={{ marginBottom: 12 }}>
            {/* هدر بخش */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
              paddingRight: 4
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: sec.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16
              }}>
                {sec.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>
                  {sec.label}
                </div>
              </div>
              <div style={{
                fontSize: 11,
                color: sec.color,
                fontWeight: 700,
                background: sec.color + "15",
                padding: "3px 10px",
                borderRadius: 20,
                fontVariantNumeric: "tabular-nums"
              }}>
                {toFa(sec.values.length)}
              </div>
            </div>

            {/* آیتم‌ها */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sec.values.map((v) => (
                <div key={v.id} style={{
                  fontSize: 12,
                  padding: "8px 14px",
                  background: "#fff",
                  border: `1px solid ${sec.color}30`,
                  borderRadius: 20,
                  color: "#000",
                  lineHeight: 1.6,
                  fontWeight: 500
                }}>
                  {v.text}
                </div>
              ))}
            </div>

            {/* خط جداکننده */}
            {idx < sections.length - 1 && (
              <div style={{
                marginTop: 16,
                height: 1,
                background: "linear-gradient(to left, transparent, #e5e5e5, transparent)"
              }} />
            )}
          </div>
        );
      })}

      {/* ─── جمله همدلانه ─── */}
      {phrase && (
        <Card style={{
          marginTop: 20,
          background: "#eef4ff",
          border: "1px solid #bfdbfe",
          padding: 18,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💙</div>
          <div style={{ fontSize: 14, lineHeight: 2, color: "#000", fontStyle: "italic" }}>
            {phrase}
          </div>
        </Card>
      )}

      {/* ─── CTA ─── */}
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onContinue} style={{
          width: "100%",
          padding: "16px 20px",
          borderRadius: 12,
          border: "none",
          background: "#1a3d2c",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(26,61,44,.2)"
        }}>
          <span>بعدی — بیا این چرخه رو بشکنیم</span>
          <span style={{ opacity: 0.6 }}>←</span>
        </button>
        <Btn variant="ghost" onClick={onViewOrigin}>
          🧸 این الگو از کجا آمده؟
        </Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * ۱۲. صفحه تمرین — انتخاب اولین trigger+behavior برای قاعده
 * ========================================================= */

function pickRule(schema, triggerIds, behaviorIds) {
  const triggers = triggerIds || [];
  const behaviors = behaviorIds || [];

  // ۱) هر ترکیب trigger + behavior
  for (const t of triggers) {
    for (const b of behaviors) {
      const rule = resolveExercise(schema.id, t, b);
      if (rule) return rule;
    }
  }
  // ۲) فقط behavior
  for (const b of behaviors) {
    const rule = resolveExercise(schema.id, null, b);
    if (rule) return rule;
  }
  // ۳) فقط trigger
  for (const t of triggers) {
    const rule = resolveExercise(schema.id, t, null);
    if (rule) return rule;
  }
  // ۴) پیش‌فرض
  return resolveExercise(schema.id, null, null);
}

function ExerciseView({ schemaId, selection, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const rule = pickRule(schema, selection.triggerIds, selection.behaviorIds);
  const exercise = resolveExerciseFromRule(schema, rule);

  if (!exercise) {
    return (
      <Shell title="تمرین" onBack={onBack}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600 }}>
            برای این ترکیب، تمرین اختصاصی تعریف نشده.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "#666", lineHeight: 1.8 }}>
            ولی همین که چرخه رو شناختی، خودش یک قدمه.
          </p>
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => onDone(null)}>ادامه</Btn>
        </div>
      </Shell>
    );
  }

  const typeLabel = EXERCISE_TYPE_LABELS[exercise.type] || { icon: "🎯", label: "تمرین", color: "#1a3d2c" };

  return (
    <Shell title="تمرین" onBack={onBack}>

      {/* ─── هدر تمرین ─── */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        padding: 18,
        marginBottom: 16
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 10
        }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 12,
            background: "rgba(255,255,255,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22
          }}>
            {typeLabel.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>
              {typeLabel.label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>
              یک تمرین کوچیک
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.9, opacity: 0.85 }}>
          این تمرین به تو کمک می‌کنه این بار جور دیگه‌ای پاسخ بدی.
        </div>
      </Card>

      {/* ─── رندرر تمرین ─── */}
      <ExerciseRenderer exercise={exercise} onComplete={(record) => onDone(record)} onSkip={onDone} />
    </Shell>
  );
}

const EXERCISE_TYPE_LABELS = {
  two_column:    { icon: "⚖️", label: "تحلیل دو ستونه" },
  three_column:  { icon: "🔬", label: "بررسی شواهد" },
  timer:         { icon: "⏱️", label: "مکث زمان‌دار" },
  single_choice: { icon: "🎯", label: "انتخاب" },
  single_input:  { icon: "✍️", label: "نوشتن" },
  reflection:    { icon: "💭", label: "تأمل" },
  list:          { icon: "📝", label: "فهرست" }
};

/* =========================================================
 * متادیتای انواع مأموریت
 * ========================================================= */

const MISSION_TYPE_META = {
  observe: {
    icon: "🔍",
    label: "مشاهده",
    color: "#3b82f6",
    bgColor: "#eff6ff",
    time: "۱ دقیقه",
    difficulty: 1,
    why: "فقط می‌خوای ببینی چه اتفاقی می‌افته — بدون قضاوت، بدون واکنش."
  },
  action: {
    icon: "✋",
    label: "اقدام",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    time: "۲-۳ دقیقه",
    difficulty: 2,
    why: "این کار کوچیک، به ذهنت یاد می‌ده که این بار می‌تونه جور دیگه‌ای هم عمل کنه."
  },
  write: {
    icon: "✍️",
    label: "نوشتن",
    color: "#a855f7",
    bgColor: "#faf5ff",
    time: "۳-۵ دقیقه",
    difficulty: 2,
    why: "نوشتن، فکر رو از ذهنت بیرون میاره — تا بتونی ببینیش، نه اینکه توش غرق بشی."
  },
  "self-talk": {
    icon: "💬",
    label: "خودگویی",
    color: "#10b981",
    bgColor: "#ecfdf5",
    time: "۳۰ ثانیه",
    difficulty: 1,
    why: "جمله‌ای که به خودت می‌گی، صدای قدیمی رو کم‌رنگ‌تر می‌کنه."
  },
  experiment: {
    icon: "🧪",
    label: "آزمایش",
    color: "#0891b2",
    bgColor: "#ecfeff",
    time: "۱۰-۳۰ دقیقه",
    difficulty: 3,
    why: "مغز با تجربه یاد می‌گیره، نه با فکر کردن. این یک آزمایش کوچیکه."
  }
};

const DEFAULT_MISSION_META = {
  icon: "🎯",
  label: "مأموریت",
  color: "#1a3d2c",
  bgColor: "#f0f7f4",
  time: "۱-۲ دقیقه",
  difficulty: 1,
  why: "یک قدم کوچیک، خودش یک پیروزیه."
};

function getMissionMeta(mission) {
  return MISSION_TYPE_META[mission?.type] || DEFAULT_MISSION_META;
}

/* =========================================================
 * ۱۳. صفحه مأموریت — نسخه حرفه‌ای
 * ========================================================= */

function MissionView({ schemaId, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const microMissions = getMicroMissions(schemaId);
  const missions = microMissions.length > 0 ? microMissions : (schema?.real_life_missions || []);

  const [selectedId, setSelectedId] = useState(missions[0]?.id || null);
  const [doneIds, setDoneIds] = useState([]);

  // حالت خالی
  if (missions.length === 0) {
    return (
      <Shell title="مأموریت امروز" onBack={onBack}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "#000" }}>
            برای این الگو، مأموریتی تعریف نشده.
            <br />
            ولی همین که داری کار می‌کنی، خودش یک قدمه.
          </p>
        </Card>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => onDone(null)}>ادامه</Btn>
        </div>
      </Shell>
    );
  }

  const selected = missions.find((m) => m.id === selectedId) || missions[0];
  const selectedMeta = getMissionMeta(selected);
  const progressPct = Math.round((doneIds.length / missions.length) * 100);
  const isSelectedDone = doneIds.includes(selected.id);

  const toggleDone = (id) => {
    setDoneIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const shuffle = () => {
    const remaining = missions.filter((m) => !doneIds.includes(m.id));
    const pool = remaining.length > 0 ? remaining : missions;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setSelectedId(next.id);
  };

  return (
    <Shell title="مأموریت امروز" onBack={onBack}>

      {/* ─── کارت هدر با پیشرفت ─── */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        marginBottom: 12,
        padding: 18
      }}>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>
          {schema?.name_plain || schema?.name_fa}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, lineHeight: 1.5 }}>
          یک قدم کوچیک برای امروز
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              height: 6,
              background: "rgba(255,255,255,.2)",
              borderRadius: 3,
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: progressPct + "%",
                background: "#fff",
                transition: "width .4s ease",
                borderRadius: 3
              }} />
            </div>
          </div>
          <div style={{
            fontSize: 12,
            opacity: 0.95,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 600
          }}>
            {toFa(doneIds.length)} از {toFa(missions.length)}
          </div>
        </div>
      </Card>

      {/* ─── راهنما ─── */}
      {doneIds.length === 0 && (
        <Card style={{ marginBottom: 12, background: "#f6f6f6", padding: 12 }}>
          <div style={{ fontSize: 12, color: "#000", lineHeight: 1.8 }}>
            ✨ یکی رو انتخاب کن — هر کدوم کمتر از ۵ دقیقه وقت می‌گیره.
            <br />
            لازم نیست کامل انجامش بدی.
          </div>
        </Card>
      )}

      {/* ─── کارت مأموریت انتخاب‌شده ─── */}
      <Card style={{
        marginBottom: 16,
        border: `2px solid ${selectedMeta.color}`,
        background: selectedMeta.bgColor,
        padding: 18,
        transition: "all .25s ease"
      }}>
        {/* هدر کارت */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: selectedMeta.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
            boxShadow: `0 4px 12px ${selectedMeta.color}33`
          }}>
            {selectedMeta.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#000",
              marginBottom: 4
            }}>
              {selectedMeta.label}
            </div>
            <div style={{
              fontSize: 11,
              color: "#555",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap"
            }}>
              <span>⏱ {selectedMeta.time}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>
                {"★".repeat(selectedMeta.difficulty)}
                <span style={{ opacity: 0.3 }}>
                  {"★".repeat(3 - selectedMeta.difficulty)}
                </span>
              </span>
            </div>
          </div>

          {/* دکمه انجام شد */}
          <button
            onClick={() => toggleDone(selected.id)}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: isSelectedDone ? "none" : "2px solid #bbb",
              background: isSelectedDone ? selectedMeta.color : "#fff",
              color: "#fff",
              fontSize: 16,
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "inherit",
              transition: "all .2s ease",
              flexShrink: 0
            }}
            title={isSelectedDone ? "لغو انجام" : "علامت‌گذاری به‌عنوان انجام شده"}
          >
            {isSelectedDone ? "✓" : ""}
          </button>
        </div>

        {/* متن مأموریت */}
        <div style={{
          fontSize: 15,
          lineHeight: 1.9,
          color: "#000",
          fontWeight: 500,
          marginBottom: 14,
          paddingBottom: 14,
          borderBottom: "1px dashed rgba(0,0,0,.12)"
        }}>
          {selected.text}
        </div>

        {/* چرا این مهم است */}
        <div style={{
          fontSize: 12,
          color: "#000",
          lineHeight: 1.9,
          opacity: 0.75,
          display: "flex",
          gap: 8
        }}>
          <span style={{ flexShrink: 0 }}>💡</span>
          <span style={{ fontStyle: "italic" }}>{selectedMeta.why}</span>
        </div>
      </Card>

      {/* ─── لیست همه مأموریت‌ها ─── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>
          همه مأموریت‌ها
        </div>
        <button
          onClick={shuffle}
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            color: "#1a3d2c",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: 20,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 5
          }}
        >
          🔄 یکی دیگه
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {missions.map((m, idx) => {
          const meta = getMissionMeta(m);
          const isSelected = selectedId === m.id;
          const isDone = doneIds.includes(m.id);

          return (
            <button
              key={`${m.id}_${idx}`}
              onClick={() => setSelectedId(m.id)}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: isSelected
                  ? `2px solid ${meta.color}`
                  : "1px solid #e5e5e5",
                background: isSelected ? meta.bgColor : "#fff",
                cursor: "pointer",
                textAlign: "right",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "all .15s ease"
              }}
            >
              {/* آیکن */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: meta.color,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                flexShrink: 0,
                opacity: isDone ? 0.5 : 1
              }}>
                {meta.icon}
              </div>

              {/* متن و متادیتا */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  color: "#000",
                  lineHeight: 1.7,
                  marginBottom: 3,
                  textDecoration: isDone ? "line-through" : "none",
                  opacity: isDone ? 0.55 : 1
                }}>
                  {m.text}
                </div>
                <div style={{
                  fontSize: 10,
                  color: "#777",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <span>{meta.label}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>⏱ {meta.time}</span>
                </div>
              </div>

              {/* تیک */}
              {isDone && (
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: meta.color,
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>✓</div>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── یادآوری ─── */}
      <Card style={{
        marginTop: 16,
        background: "#fff8e1",
        padding: 14,
        border: "1px solid #ffe0b2"
      }}>
        <div style={{
          fontSize: 12,
          color: "#000",
          lineHeight: 1.9,
          textAlign: "center"
        }}>
          🌱 حتی اگر فقط به این مأموریت فکر کنی،
          <br />
          باز هم یک قدم برداشتی.
        </div>
      </Card>

      {/* ─── دکمه‌های پایین ─── */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <Btn onClick={() => onDone(selected)}>
          {isSelectedDone
            ? "✓ این را انجام دادم — ادامه"
            : "این یکی رو انتخاب می‌کنم"}
        </Btn>
        <Btn variant="ghost" onClick={() => onDone(null)}>
          الان نمی‌تونم — رد کن
        </Btn>
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

  const primaryBehaviorId = (selection.behaviorIds || [])[0] || null;
  const replacement = getReplacementResponse(schemaId, primaryBehaviorId);

  const options = [
    { id: "old",    label: "واکنش قدیمی را انجام دادم",   color: "#000", emoji: "🔴" },
    { id: "paused", label: "مکث کردم",                    color: "#000", emoji: "🟡" },
    { id: "new",    label: "پاسخ جدید را امتحان کردم",     color: "#000", emoji: "🟢" }
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
      {replacement && primaryBehaviorId && (
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
  const [tab, setTab] = useState("respond");

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

      {/* ─── Hero ─── */}
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff",
        padding: 22,
        marginBottom: 14,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>💞</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          چطور با دیگران برخورد کنم؟
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
          چرا بعضی روابط تکرار می‌شن؟
          <br />
          چطور می‌تونم بهتر عمل کنم؟
        </div>
      </Card>

      {/* ─── تب‌ها ─── */}
      <div style={{
        display: "flex",
        gap: 6,
        padding: 4,
        background: "#f0f0f0",
        borderRadius: 12,
        marginBottom: 16
      }}>
        <button
          onClick={() => setTab("respond")}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 9,
            border: "none",
            background: tab === "respond" ? "#fff" : "transparent",
            color: tab === "respond" ? "#1a3d2c" : "#666",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all .15s ease",
            boxShadow: tab === "respond" ? "0 2px 6px rgba(0,0,0,.06)" : "none"
          }}
        >
          💬 چطور برخورد کنم؟
        </button>
        <button
          onClick={() => setTab("why")}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 9,
            border: "none",
            background: tab === "why" ? "#fff" : "transparent",
            color: tab === "why" ? "#1a3d2c" : "#666",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all .15s ease",
            boxShadow: tab === "why" ? "0 2px 6px rgba(0,0,0,.06)" : "none"
          }}
        >
          🔁 چرا تکرار می‌شوند؟
        </button>
      </div>

      {/* ─── محتوای تب ─── */}
      {tab === "respond" && (
        <>
          <div style={{
            fontSize: 12,
            color: "#666",
            lineHeight: 1.9,
            marginBottom: 12,
            padding: "0 4px"
          }}>
            اگر کسی که تو زندگیت هست، این الگو را دارد — روی اسمش بزن تا ببینی چطور رفتار کنی.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SCHEMAS.map((s) => {
              const guide = HOW_TO_RESPOND[s.id];
              const plain = s.name_plain || guide?.plainName || s.name_fa;
              return (
                <button key={s.id} onClick={() => onPickResponseGuide(s.id)} style={{
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #f0f0f0",
                  background: "#fff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "right",
                  transition: "all .15s ease"
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "#f0f7f4",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0
                  }}>💡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginBottom: 2 }}>
                      {plain}
                    </div>
                    <div style={{ fontSize: 10, color: "#999" }}>
                      {s.name_fa}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, color: "#ccc" }}>←</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "why" && (
        <>
          <div style={{
            fontSize: 12,
            color: "#666",
            lineHeight: 1.9,
            marginBottom: 12,
            padding: "0 4px"
          }}>
            این‌ها ترکیب‌های رایج‌اند. روی هر کدام بزن تا بفهمی چرا همیشه شبیه هم‌اند.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {relevantPatterns.map((p, idx) => (
              <button key={p.id} onClick={() => onPickPattern(p.id)} style={{
                padding: 18,
                borderRadius: 14,
                border: "1px solid #f0f0f0",
                background: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "right",
                position: "relative",
                overflow: "hidden",
                transition: "all .15s ease"
              }}>
                <div style={{
                  position: "absolute",
                  top: 0, right: 0,
                  width: 4,
                  height: "100%",
                  background: idx % 2 === 0 ? "#8b5cf6" : "#ec4899"
                }} />

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: "#f0f0f0",
                    color: "#666",
                    fontWeight: 600
                  }}>
                    {p.shortName}
                  </span>
                </div>

                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.6,
                  color: "#000",
                  marginBottom: 8
                }}>
                  {p.boxTitle || p.title}
                </div>

                <div style={{
                  fontSize: 12,
                  color: "#666",
                  lineHeight: 1.8
                }}>
                  {p.boxDescription}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
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
      onBack={() => go(returnFromOrigin)}
      onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }}
      onSOS={openSOS} />;
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
          // برای PROGRESS از اولین آیتم هر آرایه استفاده می‌کنیم (سازگاری با ذخیره‌سازی)
          const primaryTriggerId  = (selection.triggerIds  || [])[0] || null;
          const primaryThoughtId  = (selection.thoughtIds  || [])[0] || null;
          const primaryEmotionId  = (selection.emotionIds  || [])[0] || null;
          const primaryBehaviorId = (selection.behaviorIds || [])[0] || null;

          await recordCycle({
            schemaId: activeSchemaId,
            triggerId:  primaryTriggerId,
            thoughtId:  primaryThoughtId,
            emotionId:  primaryEmotionId,
            behaviorId: primaryBehaviorId,
            // ذخیره‌ی کامل آرایه‌ها برای استفاده‌های بعدی
            triggerIds:  selection.triggerIds,
            thoughtIds:  selection.thoughtIds,
            emotionIds:  selection.emotionIds,
            behaviorIds: selection.behaviorIds,
            ...log,
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
 * کامپوننت کمکی + ثابت‌ها
 * ========================================================= */

function SectionTitle({ icon, title, color = "#000" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 14
      }}
    >
      <div style={{ fontSize: 18 }}>{icon}</div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color
        }}
      >
        {title}
      </div>
    </div>
  );
}

const STAGE_COLORS = {
  1: "#3b82f6",
  2: "#8b5cf6",
  3: "#f59e0b",
  4: "#10b981"
};

/* =========================================================
 * ۲۶. استایل‌ها
 * ========================================================= */

const styles = {
  app: {
    minHeight: "100vh", background: "#fafafa",
    fontFamily: "'Vazirmatn', Tahoma, sans-serif",
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
    position: "fixed", bottom: 84, left: "50%",
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
    fontFamily: "'Vazirmatn', Tahoma, sans-serif"
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
