// App.jsx
// نسخه 16.0 — کامل با تمام صفحات حرفه‌ای
// OriginView حرفه‌ای + همه صفحات قبلی

import React, { useState, useEffect, useMemo, useContext, createContext } from "react";

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
  LIFE_CYCLES, LIFE_CYCLE_CATEGORIES, getLifeCycle, getLifeCyclesByCategory
} from "./LIFE_CYCLES";
import { getLifeCycleDetail } from "./LIFE_CYCLES_DETAIL";
import { mergeAdditions } from "./SCHEMAS_ADDITIONS";
import { mergeTriggers } from "./TRIGGERS_EXTRA";
import { getTodayReminders } from "./DAILY_REMINDERS";
import { CHECKIN_GROUPS, SHORT_CHECKIN_NAMES } from "./CHECKIN_OPTIONS";
// بالای فایل، بعد از import های موجود
import AcceptanceView from "./AcceptanceView";

/* =========================================================
 * ۰. ثبت برچسب‌ها
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
 * کامپوننت‌های پایه
 * ========================================================= */

const SearchContext = createContext(null);

function Shell({ children, title, onBack, showQuickButton, onQuick, showSOS, onSOS, hideSearch }) {
  const openSearch = useContext(SearchContext);
  const canSearch = !hideSearch && typeof openSearch === "function";
  return (
    <div dir="rtl" style={styles.app}>
      <header style={styles.header}>
        {onBack ? (
          <button onClick={onBack} style={styles.backBtn}>→</button>
        ) : (
          <div style={{ width: 32 }} />
        )}
        <div style={styles.headerTitle}>{title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {canSearch && (
            <button onClick={openSearch} style={styles.searchHeaderBtn} aria-label="جستجو">🔎</button>
          )}
          {showSOS ? (
            <button onClick={onSOS} style={styles.sosHeaderBtn}>SOS</button>
          ) : (
            !canSearch && <div style={{ width: 32 }} />
          )}
        </div>
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

function SectionTitle({ icon, title, color = "#000" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{title}</div>
    </div>
  );
}

const STAGE_COLORS = { 1: "#3b82f6", 2: "#8b5cf6", 3: "#f59e0b", 4: "#10b981" };

/* =========================================================
 * جستجوی سراسری
 * ========================================================= */

function normalizeFa(str) {
  return (str || "")
    .toString()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670\u200c]/g, " ")
    .toLowerCase()
    .trim();
}

function tokenizeFa(str) {
  return normalizeFa(str).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

// هر کلمه‌ی سرچ باید ابتدای حداقل یکی از کلمات متن باشد (جستجوی پیشوندی)
function matchesQuery(text, queryTokens) {
  if (!queryTokens.length) return false;
  const words = tokenizeFa(text);
  if (!words.length) return false;
  return queryTokens.every((qt) => words.some((w) => w.startsWith(qt)));
}

function useSearchIndex() {
  return useMemo(() => {
    const items = [];

    for (const s of SCHEMAS) {
      items.push({
        type: "schema",
        id: s.id,
        icon: "🧩",
        title: s.name_plain || s.name_fa,
        subtitle: s.name_fa,
        text: [s.name_fa, s.name_en, s.name_plain, s.one_liner, s.short_description, s.core_need]
          .filter(Boolean).join(" ")
      });
    }

    for (const st of SITUATIONS) {
      items.push({
        type: "situation",
        id: st.id,
        icon: "🔍",
        title: st.title,
        subtitle: st.categoryLabel,
        text: [st.title, st.categoryLabel, ...(st.examples || [])].filter(Boolean).join(" ")
      });
    }

    for (const lc of LIFE_CYCLES) {
      items.push({
        type: "life_cycle",
        id: lc.id,
        icon: "🔄",
        title: lc.title,
        subtitle: lc.categoryLabel,
        text: [lc.title, lc.categoryLabel, lc.shortDescription, ...(lc.examples || [])]
          .filter(Boolean).join(" ")
      });
    }

    for (const p of ATTRACTION_PATTERNS) {
      items.push({
        type: "relationship",
        id: p.id,
        icon: "💞",
        title: p.shortName || p.title,
        subtitle: p.title,
        text: [p.title, p.shortName, p.boxTitle, p.boxDescription].filter(Boolean).join(" ")
      });
    }

    return items;
  }, []);
}

function SearchView({ onBack, onPickSchema, onPickSituation, onPickCycle, onPickPattern }) {
  const [query, setQuery] = useState("");
  const index = useSearchIndex();

  const results = useMemo(() => {
    const tokens = tokenizeFa(query);
    if (!tokens.length) return [];
    return index.filter((item) => matchesQuery(item.text, tokens)).slice(0, 50);
  }, [query, index]);

  const handlePick = (item) => {
    if (item.type === "schema") onPickSchema(item.id);
    else if (item.type === "situation") onPickSituation(item.id);
    else if (item.type === "life_cycle") onPickCycle(item.id);
    else if (item.type === "relationship") onPickPattern(item.id);
  };

  return (
    <Shell title="جستجو" onBack={onBack} hideSearch>
      <input
        autoFocus
        dir="rtl"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="جستجو در طرحواره‌ها، موقعیت‌ها، چرخه‌ها و روابط…"
        style={styles.searchInput}
      />

      {query.trim() === "" && (
        <p style={{ fontSize: 13, color: "#999", textAlign: "center", padding: "30px 10px" }}>
          چند حرف تایپ کن تا نتایج نشون داده بشه.
        </p>
      )}

      {query.trim() !== "" && results.length === 0 && (
        <p style={{ fontSize: 13, color: "#999", textAlign: "center", padding: "30px 10px" }}>
          چیزی پیدا نشد. یک عبارت دیگه رو امتحان کن.
        </p>
      )}

      {results.map((item) => (
        <button key={item.type + "-" + item.id} onClick={() => handlePick(item)} style={styles.searchResultBtn}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
          <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#000" }}>{item.title}</div>
            {item.subtitle && (
              <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{item.subtitle}</div>
            )}
          </div>
        </button>
      ))}
    </Shell>
  );
}

/* =========================================================
 * Origin — ریشه (نسخه حرفه‌ای)
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

  const stages = (nextSteps || []).map((step, idx) => ({
    n: idx + 1,
    fullText: step,
    color: STAGE_COLORS[((idx) % 4) + 1] || "#1a3d2c"
  }));

  return (
    <Shell title={plainName || "ریشه‌ی این الگو"} onBack={onBack} showSOS onSOS={onSOS}>

      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 24, marginBottom: 14,
        position: "relative", overflow: "hidden"
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
              borderRadius: 10, marginBottom: 14
            }}>{oneLiner}</div>
          )}

          {schema?.name_fa && schema.name_fa !== plainName && (
            <div style={{ fontSize: 11, opacity: 0.6, paddingRight: 4 }}>
              نام علمی: {schema.name_fa}
            </div>
          )}
        </div>
      </Card>

      <Card style={{
        marginBottom: 12, background: "#eef4ff",
        border: "1px solid #bfdbfe", padding: 16
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

      {childhood.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🌱" title="در کودکی چه اتفاقی افتاد؟" color="#065f46" />
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12, fontStyle: "italic" }}>
            این‌ها تجربه‌هایی هستند که ذهنت از آن‌ها این الگو را ساخت:
          </div>

          {childhood.map((c, i) => (
            <div key={i} style={{
              display: "flex", gap: 12,
              padding: "12px 14px", marginBottom: 8,
              background: "#f0f7f4", borderRadius: 10,
              borderRight: "3px solid #10b981"
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "#10b981", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1
              }}>{toFa(i + 1)}</div>
              <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.9, color: "#000" }}>
                {c}
              </div>
            </div>
          ))}
        </Card>
      )}

      {familyPatterns.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#faf5ff", border: "1px solid #e9d5ff" }}>
          <SectionTitle icon="👨‍👩‍👧" title="الگوی خانوادگی" color="#6b21a8" />
          <div style={{ fontSize: 12, color: "#7c3aed", marginBottom: 12, fontStyle: "italic" }}>
            الگوهایی که نسل به نسل منتقل شده:
          </div>
          {familyPatterns.map((p, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 10, padding: "10px 14px",
              background: "#fff", borderRadius: 10,
              borderRight: "3px solid #8e44ad"
            }}>{p}</div>
          ))}
        </Card>
      )}

      {origin.whatChildLearned && (
        <Card style={{
          marginBottom: 12,
          background: "linear-gradient(135deg, #fff8e1 0%, #fef3c7 100%)",
          border: "2px solid #f59e0b",
          padding: 20, position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: -20, left: -20,
            fontSize: 80, opacity: 0.06
          }}>💡</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 14, position: "relative"
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
            fontSize: 15, lineHeight: 2, color: "#000",
            fontStyle: "italic", fontWeight: 500,
            padding: "12px 14px",
            background: "rgba(255,255,255,.7)",
            borderRadius: 10, position: "relative"
          }}>
            {origin.whatChildLearned}
          </div>
        </Card>
      )}

      {innerVoice.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔊" title="این صداها برایت آشناست؟" color="#7c3aed" />
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12, fontStyle: "italic" }}>
            صدای منتقد درونی که در سرت تکرار می‌شود:
          </div>
          {innerVoice.map((v, i) => (
            <div key={i} style={{
              position: "relative", fontSize: 14, lineHeight: 1.9,
              color: "#000", marginBottom: 10,
              padding: "14px 18px 14px 46px",
              background: "#f3e8ff", borderRadius: 10,
              fontStyle: "italic"
            }}>
              <span style={{
                position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)",
                fontSize: 20, color: "#8b5cf6", fontWeight: 700
              }}>“</span>
              {v}
            </div>
          ))}
        </Card>
      )}

      {whatMissing.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <SectionTitle icon="🕊️" title="کودکی که بودی، این‌ها را لازم داشت" color="#065f46" />
          <div style={{ fontSize: 12, color: "#047857", marginBottom: 12, fontStyle: "italic" }}>
            چیزهایی که اگر بود، این الگو شکل نمی‌گرفت:
          </div>
          {whatMissing.map((w, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 10
            }}>
              <span style={{
                color: "#10b981", fontWeight: 900,
                fontSize: 14, flexShrink: 0, marginTop: 2
              }}>✓</span>
              <span style={{ flex: 1 }}>{w}</span>
            </div>
          ))}
        </Card>
      )}

      {origin.gentleReminder && (
        <Card style={{
          marginBottom: 12,
          background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
          color: "#fff", padding: 22, textAlign: "center"
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💙</div>
          <div style={{ fontSize: 14, lineHeight: 2, opacity: 0.95 }}>
            {origin.gentleReminder}
          </div>
        </Card>
      )}

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
                <div style={{ flex: 1, fontSize: 14, lineHeight: 1.9, color: "#000" }}>
                  {stage.fullText}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card style={{
        marginTop: 12, background: "#f6f6f6",
        padding: 16, textAlign: "center"
      }}>
        <div style={{ fontSize: 12, color: "#000", lineHeight: 1.9 }}>
          این کارها رو یک‌جا نمی‌شه انجام داد.
          <br />
          هر روز یک قدم کوچیک — همین کافیه.
        </div>
      </Card>

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
 * Life Cycles List
 * ========================================================= */

function LifeCyclesView({ onBack, onPickCycle, onSOS }) {
  const [category, setCategory] = useState("all");
  const cycles = getLifeCyclesByCategory(category);

  const catColors = {
    work: "#3b82f6", relationship: "#ec4899", family: "#f59e0b",
    social: "#8b5cf6", self: "#10b981", health: "#ef4444"
  };

  return (
    <Shell title="چرخه‌های زندگی" onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 14
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔄</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, lineHeight: 1.5 }}>
          الگوهایی که در زندگی تکرار می‌شن
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
          این‌ها از ترکیب چند طرحواره ساخته می‌شن و در موقعیت‌های واقعی زندگی خودشون رو نشون می‌دن.
        </div>
      </Card>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
        {LIFE_CYCLE_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)} style={{
            flexShrink: 0, padding: "8px 14px", borderRadius: 20,
            border: category === c.id ? "none" : "1px solid #e5e5e5",
            background: category === c.id ? "#1a3d2c" : "#fff",
            color: category === c.id ? "#fff" : "#000",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6
          }}>
            <span>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {cycles.map((cycle) => {
        const color = catColors[cycle.category] || "#1a3d2c";
        return (
          <button key={cycle.id} onClick={() => onPickCycle(cycle.id)} style={{
            display: "block", width: "100%", textAlign: "right",
            padding: 18, marginBottom: 10, borderRadius: 14,
            border: "1px solid #f0f0f0", background: "#fff",
            cursor: "pointer", fontFamily: "inherit",
            position: "relative", overflow: "hidden"
          }}>
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 4, height: "100%", background: color
            }} />
            <div style={{ marginBottom: 10 }}>
              <span style={{
                fontSize: 10, padding: "3px 10px", borderRadius: 20,
                background: color + "15", color: color, fontWeight: 700
              }}>{cycle.categoryLabel}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.6, color: "#000", marginBottom: 8 }}>
              {cycle.title}
            </div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.8 }}>
              {cycle.shortDescription}
            </div>
            <div style={{
              marginTop: 12, fontSize: 11, color: color,
              fontWeight: 700, display: "flex", alignItems: "center", gap: 4
            }}>
              <span>مشاهده کامل</span>
              <span>←</span>
            </div>
          </button>
        );
      })}
    </Shell>
  );
}

/* =========================================================
 * Life Cycle Detail
 * ========================================================= */

function LifeCycleDetailView({ cycleId, onBack, onPickSchema, onSOS }) {
  const cycle = getLifeCycle(cycleId);
  const detail = getLifeCycleDetail(cycleId);

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
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 14
      }}>
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{cycle.categoryLabel}</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 19, lineHeight: 1.6, fontWeight: 700 }}>
          {cycle.title}
        </h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
          {cycle.shortDescription}
        </p>
      </Card>

      {cycle.examples?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="💭" title="آیا این جمله‌ها برایت آشناست؟" />
          {cycle.examples.map((ex, i) => (
            <div key={i} style={{
              fontSize: 14, lineHeight: 1.9, padding: "10px 12px",
              marginBottom: 6, background: "#fafafa", borderRadius: 8,
              color: "#000", borderRight: "3px solid #e5e5e5"
            }}>«{ex}»</div>
          ))}
        </Card>
      )}

      {detail?.rootWound && (
        <Card style={{ marginBottom: 12, background: "#eef4ff", border: "1px solid #bfdbfe" }}>
          <SectionTitle icon="🧸" title="این الگو از کجا آمد؟" color="#1e40af" />
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.95, color: "#000" }}>
            {detail.rootWound}
          </p>
        </Card>
      )}

      {cycle.childhood?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🌱" title="در کودکی چه اتفاقی افتاد؟" />
          {cycle.childhood.map((c, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 8, paddingRight: 10, borderRight: "2px solid #a7f3d0"
            }}>{c}</div>
          ))}
        </Card>
      )}

      {cycle.cycle?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔁" title="چرخه‌ی این الگو" />
          {cycle.cycle.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "#1a3d2c", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0
              }}>{toFa(i + 1)}</div>
              <div style={{
                flex: 1, padding: "10px 12px", background: "#f6f6f6",
                borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#000"
              }}>{step}</div>
            </div>
          ))}
        </Card>
      )}

      {detail?.hiddenPayoff?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <SectionTitle icon="🎭" title="چرا ذهنت ولش نمی‌کنه؟" color="#92400e" />
          <div style={{ fontSize: 12, color: "#78350f", marginBottom: 10, fontStyle: "italic" }}>
            هر الگویی که ادامه داره، یک نفع پنهان داره — وگرنه تا حالا ترکش کرده بودی:
          </div>
          {detail.hiddenPayoff.map((p, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 8, paddingRight: 10, borderRight: "3px solid #f59e0b"
            }}>• {p}</div>
          ))}
        </Card>
      )}

      {detail?.hiddenCost?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <SectionTitle icon="💔" title="چه چیزی داری از دست می‌دی؟" color="#991b1b" />
          {detail.hiddenCost.map((c, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 8, paddingRight: 10, borderRight: "3px solid #ef4444"
            }}>• {c}</div>
          ))}
        </Card>
      )}

      {detail?.thinkingTraps?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🧠" title="دام‌های فکری" />
          <div style={{ fontSize: 12, color: "#666", marginBottom: 10, fontStyle: "italic" }}>
            این‌ها جملاتی هستند که ذهنت بهت می‌گه تا این چرخه ادامه پیدا کنه:
          </div>
          {detail.thinkingTraps.map((t, i) => (
            <div key={i} style={{
              fontSize: 13, lineHeight: 1.9, color: "#000",
              marginBottom: 8, padding: "10px 12px",
              background: "#f3e8ff", borderRadius: 8,
              borderRight: "3px solid #8b5cf6"
            }}>{t}</div>
          ))}
        </Card>
      )}

      {detail?.bodySignals?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🫀" title="بدنت کِی خبر می‌ده؟" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {detail.bodySignals.map((s, i) => (
              <div key={i} style={{
                fontSize: 12, padding: "7px 12px",
                background: "#fce7f3", color: "#831843",
                borderRadius: 20, fontWeight: 500
              }}>{s}</div>
            ))}
          </div>
        </Card>
      )}

      {cycle.whyItRepeats?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#fef3c7" }}>
          <SectionTitle icon="🤔" title="چرا این چرخه تکرار می‌شود؟" />
          {cycle.whyItRepeats.map((w, i) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.9, color: "#000", marginBottom: 6 }}>
              • {w}
            </div>
          ))}
        </Card>
      )}

      {detail?.breakingStages?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, #0a3d38, #178a7c)",
              color: "#fff", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 18
            }}>🚀</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>
                مراحل شکستن این چرخه
              </div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                {toFa(detail.breakingStages.length)} مرحله — مرحله‌به‌مرحله، نه یک‌جا
              </div>
            </div>
          </div>

          {detail.breakingStages.map((stage) => (
            <Card key={stage.n} style={{
              marginBottom: 10, padding: 16,
              borderRight: `4px solid ${STAGE_COLORS[stage.n] || "#1a3d2c"}`,
              background: "#fff"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: STAGE_COLORS[stage.n] || "#1a3d2c",
                  color: "#fff", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, flexShrink: 0
                }}>{toFa(stage.n)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#000", marginBottom: 2 }}>
                    {stage.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#666" }}>⏱ {stage.duration}</div>
                </div>
              </div>

              <div style={{
                padding: 10, background: "#f0f7f4", borderRadius: 8,
                marginBottom: 10, fontSize: 12.5, color: "#000",
                lineHeight: 1.7, borderRight: "3px solid #10b981"
              }}>
                <strong>🎯 هدف:</strong> {stage.goal}
              </div>

              <div style={{ fontSize: 12, color: "#666", marginBottom: 6, fontWeight: 600 }}>
                اقدام‌ها:
              </div>
              {stage.actions.map((a, i) => (
                <div key={i} style={{
                  fontSize: 13, lineHeight: 1.85, color: "#000",
                  marginBottom: 6, paddingRight: 14, position: "relative"
                }}>
                  <span style={{
                    position: "absolute", right: 0, top: 6,
                    width: 6, height: 6, borderRadius: "50%",
                    background: STAGE_COLORS[stage.n] || "#1a3d2c"
                  }} />
                  {a}
                </div>
              ))}

              <div style={{
                marginTop: 10, padding: 10,
                background: "#fef3c7", borderRadius: 8,
                fontSize: 12, color: "#78350f", lineHeight: 1.7,
                display: "flex", alignItems: "flex-start", gap: 6
              }}>
                <span>✓</span>
                <span><strong>نشانه موفقیت:</strong> {stage.marker}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail?.relapseSigns?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <SectionTitle icon="⚠️" title="نشانه‌های بازگشت — مواظب باش!" color="#991b1b" />
          <div style={{ fontSize: 12, color: "#78350f", marginBottom: 10, fontStyle: "italic" }}>
            اگه این‌ها رو دیدی، یعنی داری عقب می‌ری — ولی هنوز وقت داری برگردی:
          </div>
          {detail.relapseSigns.map((s, i) => (
            <div key={i} style={{
              fontSize: 13, lineHeight: 1.85, color: "#000",
              marginBottom: 6, paddingRight: 10, borderRight: "3px solid #ef4444"
            }}>• {s}</div>
          ))}
        </Card>
      )}

      {cycle.smallExperiments?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#ecfeff", border: "1px solid #a5f3fc" }}>
          <SectionTitle icon="🧪" title="آزمایش‌های کوچک امروز" color="#155e75" />
          {cycle.smallExperiments.map((exp, i) => (
            <div key={i} style={{
              fontSize: 13, lineHeight: 1.85, color: "#000",
              marginBottom: 8, padding: "10px 12px",
              background: "#fff", borderRadius: 8,
              borderRight: "3px solid #06b6d4"
            }}>{exp}</div>
          ))}
        </Card>
      )}

      {cycle.selfTalk?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#f3e8ff" }}>
          <SectionTitle icon="🗣️" title="به خودت این‌ها رو بگو" color="#6b21a8" />
          {cycle.selfTalk.map((phrase, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 8, padding: "10px 14px",
              background: "#fff", borderRadius: 8,
              borderRight: "3px solid #8b5cf6", fontStyle: "italic"
            }}>«{phrase}»</div>
          ))}
        </Card>
      )}

      {detail?.compassionNote && (
        <Card style={{
          marginBottom: 12,
          background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
          color: "#fff", padding: 20
        }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>💙</div>
          <div style={{ fontSize: 14, lineHeight: 2, opacity: 0.95 }}>
            {detail.compassionNote}
          </div>
        </Card>
      )}

      {relatedSchemas.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔗" title="این چرخه به این الگوها مربوط است" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {relatedSchemas.map((s) => (
              <button key={s.id} onClick={() => onPickSchema(s.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: "1px solid #e5e5e5", background: "#fafafa",
                cursor: "pointer", textAlign: "right",
                fontFamily: "inherit", fontSize: 14
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: "#000" }}>
                  {s.name_plain || s.name_fa}
                </div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                  {s.one_liner || s.short_description}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div style={{ marginTop: 16 }}>
        <Btn onClick={() => onPickSchema(relatedSchemas[0]?.id)}>
          کار روی {relatedSchemas[0]?.name_plain || "این الگو"}
        </Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * CheckIn
 * ========================================================= */

function CheckInView({ analysis, onDone, onSkip }) {
  const [phase, setPhase] = useState("mood");
  const [mood, setMood] = useState(null);
  const [schemaId, setSchemaId] = useState(null);
  const [note, setNote] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});

  const prompt = getTodayPrompt();

  const activeSchemaIds = useMemo(() => {
    if (!analysis?.all) return null;
    const ids = analysis.all.filter((r) => r.percentage >= 40).map((r) => r.schemaId);
    return ids.length > 0 ? ids : null;
  }, [analysis]);

  const activeGroups = useMemo(() => {
    if (!activeSchemaIds) {
      return CHECKIN_GROUPS.map((g) => ({
        ...g,
        activeSchemas: g.schemas.map((id) => SCHEMAS.find((s) => s.id === id)).filter(Boolean)
      })).filter((g) => g.activeSchemas.length > 0);
    }
    return CHECKIN_GROUPS.map((g) => {
      const activeSchemas = g.schemas
        .filter((id) => activeSchemaIds.includes(id))
        .map((id) => SCHEMAS.find((s) => s.id === id))
        .filter(Boolean);
      return { ...g, activeSchemas };
    }).filter((g) => g.activeSchemas.length > 0);
  }, [activeSchemaIds]);

  const MOOD_INFO = {
    good: { emoji: "😊", label: "خوب", color: "#27ae60", sub: "امروز حالت خوبه — بریم سراغ الگوها" },
    meh:  { emoji: "😐", label: "متوسط", color: "#f39c12", sub: "امروز متوسطه — با هم ببینیم چی می‌شه" },
    hard: { emoji: "😔", label: "سخت", color: "#e74c3c", sub: "امروز سخته — با هم آروم می‌ریم جلو" }
  };

  const getPercentage = (sid) => {
    const r = analysis?.all?.find((x) => x.schemaId === sid);
    return r ? Math.round(r.percentage) : 0;
  };
  const getPriorityColor = (sid) => {
    const r = analysis?.all?.find((x) => x.schemaId === sid);
    return r?.priority?.color || "#1a3d2c";
  };
  const getPriorityEmoji = (sid) => {
    const r = analysis?.all?.find((x) => x.schemaId === sid);
    return r?.priority?.emoji || "🟢";
  };
  const toggleGroup = (gid) => {
    setExpandedGroups((prev) => ({ ...prev, [gid]: !prev[gid] }));
  };

  if (phase === "mood") {
    return (
      <Shell title="صبح بخیر">
        <div style={{
          background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
          color: "#fff", borderRadius: 14, padding: 24,
          marginBottom: 14, position: "relative", overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: -30, left: -30,
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(255,255,255,.05)"
          }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
              {new Date().toLocaleDateString("fa-IR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
              امروز چه حالی داری؟
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.9 }}>{prompt}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: n === 1 ? "#1a3d2c" : "#eee"
            }} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(MOOD_INFO).map(([key, info]) => (
            <button key={key} onClick={() => { setMood(key); setTimeout(() => setPhase("schema"), 150); }}
              style={{
                padding: 18, borderRadius: 14, border: "1px solid #f0f0f0",
                background: "#fff", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 16, textAlign: "right"
              }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: info.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, flexShrink: 0
              }}>{info.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#000", marginBottom: 3 }}>
                  {info.label}
                </div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{info.sub}</div>
              </div>
              <span style={{ fontSize: 18, color: "#ccc" }}>←</span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <Btn variant="ghost" onClick={onSkip}>رد کن، بعداً</Btn>
        </div>
      </Shell>
    );
  }

  if (phase === "schema") {
    const moodInfo = MOOD_INFO[mood];
    return (
      <Shell title="صبح بخیر" onBack={() => setPhase("mood")}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: n <= 2 ? "#1a3d2c" : "#eee"
            }} />
          ))}
        </div>

        {moodInfo && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            background: moodInfo.color + "10",
            border: `1px solid ${moodInfo.color}30`,
            marginBottom: 14
          }}>
            <span style={{ fontSize: 20 }}>{moodInfo.emoji}</span>
            <div style={{ fontSize: 12, color: "#000" }}>
              حالت امروز: <strong>{moodInfo.label}</strong>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#000", marginBottom: 6 }}>
            کدام الگو امروز فعال‌تره؟
          </div>
          <div style={{ fontSize: 12, color: "#666", lineHeight: 1.8 }}>
            الگوها بر اساس دسته‌بندی نشون داده شدن — روی یکی بزن.
          </div>
        </div>

        {activeGroups.map((group) => {
          const isExpanded = expandedGroups[group.id] !== false;
          const hasSelected = group.activeSchemas.some((s) => s.id === schemaId);
          return (
            <div key={group.id} style={{ marginBottom: 12 }}>
              <button onClick={() => toggleGroup(group.id)} style={{
                width: "100%", padding: "12px 14px", borderRadius: 12,
                border: hasSelected ? "2px solid #1a3d2c" : "1px solid #f0f0f0",
                background: hasSelected ? "#f0f7f4" : "#fff",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 12,
                textAlign: "right", marginBottom: isExpanded ? 8 : 0
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#f0f7f4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0
                }}>{group.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 2 }}>
                    {group.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#666" }}>{toFa(group.activeSchemas.length)} الگو</div>
                </div>
                <span style={{
                  fontSize: 14, color: "#999",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform .2s ease"
                }}>◀</span>
              </button>

              {isExpanded && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {group.activeSchemas.map((schema) => {
                    const isSelected = schemaId === schema.id;
                    const pct = getPercentage(schema.id);
                    const color = getPriorityColor(schema.id);
                    const emoji = getPriorityEmoji(schema.id);
                    const shortName = SHORT_CHECKIN_NAMES[schema.id] || schema.name_plain || schema.name_fa;
                    return (
                      <button key={schema.id} onClick={() => setSchemaId(schema.id)} style={{
                        padding: 14, borderRadius: 12,
                        border: isSelected ? "2px solid #1a3d2c" : "1px solid #f0f0f0",
                        background: isSelected ? "#f0f7f4" : "#fff",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "right",
                        display: "flex", alignItems: "flex-start", gap: 12, marginRight: 8
                      }}>
                        <div style={{ width: 4, height: 44, borderRadius: 2, background: color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start", gap: 8, marginBottom: 6
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 3 }}>
                                {shortName}
                              </div>
                              {schema.name_fa !== shortName && (
                                <div style={{ fontSize: 10, color: "#999" }}>{schema.name_fa}</div>
                              )}
                            </div>
                            {pct > 0 && (
                              <div style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "3px 8px", background: color + "15",
                                color: color, borderRadius: 20, fontSize: 11, fontWeight: 700
                              }}>
                                <span>{emoji}</span>
                                <span>{toFa(pct)}%</span>
                              </div>
                            )}
                          </div>
                          {schema.one_liner && (
                            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.7 }}>
                              {schema.one_liner}
                            </div>
                          )}
                        </div>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          border: isSelected ? "none" : "2px solid #ddd",
                          background: isSelected ? "#1a3d2c" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 11, fontWeight: 900, flexShrink: 0, marginTop: 2
                        }}>{isSelected ? "✓" : ""}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn disabled={!schemaId} onClick={() => setPhase("note")}>
            {schemaId ? "بعدی" : "یک الگو انتخاب کن"}
          </Btn>
          <Btn variant="ghost" onClick={() => { setSchemaId(null); setPhase("note"); }}>
            مطمئن نیستم — بپر بعدی
          </Btn>
        </div>
      </Shell>
    );
  }

  if (phase === "note") {
    const moodInfo = MOOD_INFO[mood];
    const selectedSchema = schemaId ? SCHEMAS.find((s) => s.id === schemaId) : null;
    const selectedShortName = selectedSchema
      ? (SHORT_CHECKIN_NAMES[selectedSchema.id] || selectedSchema.name_plain || selectedSchema.name_fa)
      : null;

    return (
      <Shell title="صبح بخیر" onBack={() => setPhase("schema")}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, background: "#1a3d2c" }} />
          ))}
        </div>

        <div style={{
          background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
          color: "#fff", borderRadius: 14, padding: 20, marginBottom: 14
        }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 10 }}>خلاصه‌ی امروز</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 24 }}>{moodInfo?.emoji}</span>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>حالت</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{moodInfo?.label || "ثبت نشده"}</div>
            </div>
          </div>
          {selectedSchema && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.15)"
            }}>
              <span style={{ fontSize: 24 }}>🧩</span>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>الگوی فعال</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedShortName}</div>
              </div>
            </div>
          )}
        </div>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 10 }}>
            چیز دیگه‌ای هست که بخوای بنویسی؟
          </div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12, lineHeight: 1.7 }}>
            اختیاری — می‌تونی خالی بذاری
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
            rows={4} placeholder="مثلاً: امروز صبح یه پیام دیدم که حالم رو بد کرد..."
            style={styles.textarea} />
        </Card>

        <div style={{ marginTop: 16 }}>
          <Btn onClick={async () => {
            await addCheckIn({ mood, schemaId, note });
            onDone();
          }}>✓ ثبت کن و ادامه</Btn>
        </div>
      </Shell>
    );
  }

  return null;
}

/* =========================================================
 * SOS
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
          <h2 style={{ color: "#fff", fontSize: 20, margin: "0 0 30px" }}>این هم می‌گذرد</h2>
          <div style={styles.breathCircle}>
            <div style={styles.breathInner}>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>{toFa(countdown)}</div>
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
        <div style={{
          padding: 30, textAlign: "center", display: "flex",
          flexDirection: "column", justifyContent: "center", minHeight: "100vh"
        }}>
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
 * Welcome
 * ========================================================= */

function WelcomeView({ analysis, onStart, onSkipToProfile, hasProfile, onSOS, onSituations, onRelationships, onLifeCycles, onAcceptance }) {
  const activeSchemaIds = useMemo(() => {
    if (!analysis?.all) return null;
    const list = analysis.all.filter((r) => r.percentage >= 40).map((r) => r.schemaId);
    return list.length > 0 ? list : null;
  }, [analysis]);

  const reminders = getTodayReminders(activeSchemaIds);
  const activeCount = activeSchemaIds ? activeSchemaIds.length : 0;

  const actions = [
  { id: "life", icon: "🔄", title: "چرخه‌های زندگی", desc: "الگوهای عمیق‌تر", onClick: onLifeCycles, color: "#8b5cf6" },
  { id: "sit",  icon: "🔍", title: "حس الان من",     desc: "موقعیت‌های واقعی", onClick: onSituations, color: "#0ea5e9" },
  { id: "rel",  icon: "💞", title: "روابط من",       desc: "چطور برخورد کنم؟", onClick: onRelationships, color: "#ec4899" },
  { id: "acc",  icon: "🕊️", title: "پذیرش",          desc: "آنچه انتخاب نکردم", onClick: onAcceptance, color: "#14b8a6" }
];

  return (
    <Shell title="الگوهای من" showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 24, marginBottom: 12,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -40, left: -40,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(255,255,255,.05)"
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8, letterSpacing: 1 }}>
            شناخت الگوهای تکرارشونده
          </div>
          <h2 style={{ margin: "0 0 12px", fontSize: 24, lineHeight: 1.5, fontWeight: 700 }}>
            چه چیزی در من<br />تکرار می‌شود؟
          </h2>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
            اینجا قرار نیست برچسبی به تو بزنیم. با هم می‌بینیم کجا فعال می‌شوی و چطور می‌توانی این بار جور دیگری پاسخ بدهی.
          </p>
        </div>
      </Card>

      {reminders && reminders.length > 0 && (
        <Card style={{
          marginBottom: 12, background: "#fff8e1",
          border: "1px solid #fde68a", padding: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
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
                fontSize: 13, lineHeight: 1.9, color: "#000",
                padding: "10px 12px", background: "rgba(255,255,255,.6)",
                borderRadius: 8, borderRight: "3px solid #f59e0b"
              }}>{rem}</div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ marginBottom: 16 }}>
        <button onClick={hasProfile ? onSkipToProfile : onStart} style={{
          width: "100%", padding: "18px 20px", borderRadius: 14,
          border: "none", background: "#1a3d2c", color: "#fff",
          fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(26,61,44,.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>{hasProfile ? "🧭" : "✨"}</span>
            <span>{hasProfile ? "پروفایل الگوهای من" : "شروع ارزیابی"}</span>
          </div>
          <span style={{ opacity: 0.6 }}>←</span>
        </button>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 8, paddingRight: 4 }}>
        کاوش کن
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
        {actions.map((a) => (
          <button key={a.id} onClick={a.onClick} style={{
            padding: 16, borderRadius: 14,
            border: "1px solid #e5e5e5", background: "#fff",
            cursor: "pointer", fontFamily: "inherit", textAlign: "right"
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
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{a.desc}</div>
          </button>
        ))}
      </div>

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
 * YSQ
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
        <Btn variant="ghost" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>قبلی</Btn>
        <Btn variant="ghost" onClick={() => setIndex(Math.min(YSQ_QUESTIONS.length - 1, index + 1))} disabled={isLast}>بعدی</Btn>
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
 * Profile
 * ========================================================= */

function ProfileView({ analysis, onPickSchema, onPickOrigin, onRetake, onBack, onWins, onCalendar, onSOS, onSituations, onRelationships, onLifeCycles, onAcceptance }) {
  if (!analysis) {
    return (
      <Shell title="پروفایل" onBack={onBack}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.9 }}>هنوز ارزیابی‌ای انجام نشده.</p>
        </Card>
      </Shell>
    );
  }

  const { high, medium, low, recommended } = analysis;
  const recSchema = SCHEMAS.find((s) => s.id === recommended?.schemaId);
  const recPlain = recSchema?.name_plain || recommended?.name;
  const allActive = [...high, ...medium];

  const quickActions = [
  { id: "wins", icon: "⭐", title: "لحظه‌های من", onClick: onWins, color: "#f59e0b" },
  { id: "cal",  icon: "📅", title: "تقویم",         onClick: onCalendar, color: "#3b82f6" },
  { id: "sit",  icon: "🔍", title: "موقعیت‌ها",    onClick: onSituations, color: "#0ea5e9" },
  { id: "life", icon: "🔄", title: "چرخه‌ها",       onClick: onLifeCycles, color: "#8b5cf6" },
  { id: "rel",  icon: "💞", title: "روابط",        onClick: onRelationships, color: "#ec4899" },
  { id: "acc",  icon: "🕊️", title: "پذیرش",         onClick: onAcceptance, color: "#14b8a6" }
];

  return (
    <Shell title="پروفایل الگوهای من" onBack={onBack}
      showQuickButton onQuick={() => onPickSchema(recommended?.schemaId)}
      showSOS onSOS={onSOS}>

      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 12,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -30, left: -30,
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(255,255,255,.06)"
        }} />
        <div style={{ position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, padding: "4px 10px",
            background: "rgba(255,255,255,.15)", borderRadius: 20, marginBottom: 12
          }}>
            <span>{recommended?.priority?.emoji}</span>
            <span>پیشنهاد شروع</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>
            {recPlain}
          </div>
          {recSchema && (
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>{recSchema.name_fa}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                height: 6, background: "rgba(255,255,255,.2)",
                borderRadius: 3, overflow: "hidden"
              }}>
                <div style={{
                  height: "100%", width: (recommended?.percentage || 0) + "%",
                  background: "#fff", borderRadius: 3
                }} />
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {toFa(recommended?.percentage || 0)}%
            </span>
          </div>
          <button onClick={() => onPickSchema(recommended?.schemaId)} style={{
            marginTop: 16, width: "100%", padding: "12px 16px",
            borderRadius: 10, border: "1px solid rgba(255,255,255,.3)",
            background: "rgba(255,255,255,.1)", color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <span>شروع کار روی این الگو</span>
            <span style={{ opacity: 0.7 }}>←</span>
          </button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        <div style={{
          padding: 14, borderRadius: 12, background: "#fef2f2",
          border: "1px solid #fecaca", textAlign: "center"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#dc2626" }}>{toFa(high.length)}</div>
          <div style={{ fontSize: 11, color: "#991b1b", marginTop: 4 }}>بالا</div>
        </div>
        <div style={{
          padding: 14, borderRadius: 12, background: "#fffbeb",
          border: "1px solid #fde68a", textAlign: "center"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#d97706" }}>{toFa(medium.length)}</div>
          <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>متوسط</div>
        </div>
        <div style={{
          padding: 14, borderRadius: 12, background: "#ecfdf5",
          border: "1px solid #a7f3d0", textAlign: "center"
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#059669" }}>{toFa(low.length)}</div>
          <div style={{ fontSize: 11, color: "#065f46", marginTop: 4 }}>پایین</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "#000", marginBottom: 8, paddingRight: 4 }}>
        دسترسی سریع
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
        {quickActions.map((a) => (
          <button key={a.id} onClick={a.onClick} style={{
            flexShrink: 0, padding: "12px 16px", borderRadius: 12,
            border: "1px solid #e5e5e5", background: "#fff",
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 13, fontWeight: 600, color: "#000"
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

      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "baseline", marginBottom: 10
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>الگوهای فعال</div>
        <span style={{ fontSize: 11, color: "#666" }}>{toFa(allActive.length)} الگو</span>
      </div>

      {allActive.map((r) => {
        const schema = SCHEMAS.find((s) => s.id === r.schemaId);
        const plain = schema?.name_plain || r.name;
        return (
          <div key={r.schemaId} style={{
            marginBottom: 10, borderRadius: 14, background: "#fff",
            border: "1px solid #f0f0f0", overflow: "hidden"
          }}>
            <button onClick={() => onPickSchema(r.schemaId)} style={{
              display: "block", width: "100%", textAlign: "right",
              padding: 16, border: "none", background: "transparent",
              cursor: "pointer", fontFamily: "inherit"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 4, height: 44, borderRadius: 2, background: r.priority.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 6
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#000", marginBottom: 3 }}>
                        {plain}
                      </div>
                      <div style={{ fontSize: 10, color: "#999" }}>{schema?.name_fa || ""}</div>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 10px", borderRadius: 20,
                      background: r.priority.color + "15",
                      fontSize: 12, fontWeight: 700, color: r.priority.color
                    }}>
                      <span>{r.priority.emoji}</span>
                      <span>{toFa(r.percentage)}%</span>
                    </div>
                  </div>
                  <div style={{
                    height: 4, background: "#f0f0f0",
                    borderRadius: 2, overflow: "hidden", marginBottom: 10
                  }}>
                    <div style={{ height: "100%", width: r.percentage + "%", background: r.priority.color }} />
                  </div>
                  {schema?.one_liner && (
                    <div style={{ fontSize: 12, color: "#555", lineHeight: 1.7 }}>
                      {schema.one_liner}
                    </div>
                  )}
                </div>
              </div>
            </button>
            <div style={{ display: "flex", borderTop: "1px solid #f0f0f0" }}>
              <button onClick={() => onPickOrigin(r.schemaId)} style={{
                flex: 1, padding: "12px", border: "none", background: "transparent",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: "#666",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>🧸 ریشه و راهنما</button>
              <div style={{ width: 1, background: "#f0f0f0" }} />
              <button onClick={() => onPickSchema(r.schemaId)} style={{
                flex: 1, padding: "12px", border: "none", background: "transparent",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12, color: "#1a3d2c",
                fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}>▶ شروع کار</button>
            </div>
          </div>
        );
      })}

      {low.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#666", margin: "22px 0 10px" }}>
            سایر الگوها
          </div>
          {low.map((r) => {
            const schema = SCHEMAS.find((s) => s.id === r.schemaId);
            const plain = schema?.name_plain || r.name;
            return (
              <button key={r.schemaId} onClick={() => onPickSchema(r.schemaId)} style={{
                display: "flex", width: "100%", alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px", marginBottom: 6, borderRadius: 10,
                border: "1px solid #f0f0f0", background: "#fafafa",
                cursor: "pointer", fontFamily: "inherit", textAlign: "right"
              }}>
                <span style={{ fontSize: 13, color: "#000" }}>{plain}</span>
                <span style={{ fontSize: 11, color: "#999" }}>{toFa(r.percentage)}%</span>
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
 * Cycle (multi-select)
 * ========================================================= */

function CycleView({ schemaId, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState({
    triggerIds: [], thoughtIds: [], emotionIds: [], behaviorIds: []
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
    const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    setChoice({ ...choice, [current.idKey]: next });
  };

  const goNext = () => {
    if (step < steps.length - 1) setTimeout(() => setStep(step + 1), 200);
    else setTimeout(() => onDone(choice), 250);
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
        <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 6px" }}>{current.title}</p>
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
                }}>{active ? "✓" : ""}</div>
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
        <Btn onClick={goNext} disabled={selected.length === 0}>
          {step < steps.length - 1 ? "بعدی" : "دیدن خلاصه"}
        </Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * Cycle Summary
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
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 16, textAlign: "center"
      }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>🧩</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>چرخه‌ی تو</div>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
          {toFa(totalItems)} بخش از این الگو رو شناختی
          <br />
          این شناخت، اولین قدم شکستنه
        </div>
      </Card>

      {sections.map((sec, idx) => {
        if (sec.values.length === 0) return null;
        return (
          <div key={sec.key} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, paddingRight: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: sec.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16
              }}>{sec.icon}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#000" }}>
                {sec.label}
              </div>
              <div style={{
                fontSize: 11, color: sec.color, fontWeight: 700,
                background: sec.color + "15", padding: "3px 10px", borderRadius: 20
              }}>{toFa(sec.values.length)}</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sec.values.map((v) => (
                <div key={v.id} style={{
                  fontSize: 12, padding: "8px 14px", background: "#fff",
                  border: `1px solid ${sec.color}30`, borderRadius: 20,
                  color: "#000", lineHeight: 1.6, fontWeight: 500
                }}>{v.text}</div>
              ))}
            </div>
            {idx < sections.length - 1 && (
              <div style={{
                marginTop: 16, height: 1,
                background: "linear-gradient(to left, transparent, #e5e5e5, transparent)"
              }} />
            )}
          </div>
        );
      })}

      {phrase && (
        <Card style={{
          marginTop: 20, background: "#eef4ff",
          border: "1px solid #bfdbfe", padding: 18, textAlign: "center"
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💙</div>
          <div style={{ fontSize: 14, lineHeight: 2, color: "#000", fontStyle: "italic" }}>
            {phrase}
          </div>
        </Card>
      )}

      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={onContinue} style={{
          width: "100%", padding: "16px 20px", borderRadius: 12,
          border: "none", background: "#1a3d2c", color: "#fff",
          fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 6px 20px rgba(26,61,44,.2)"
        }}>
          <span>بعدی — بیا این چرخه رو بشکنیم</span>
          <span style={{ opacity: 0.6 }}>←</span>
        </button>
        <Btn variant="ghost" onClick={onViewOrigin}>🧸 این الگو از کجا آمده؟</Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * Exercise
 * ========================================================= */

function pickRule(schema, triggerIds, behaviorIds) {
  const triggers = triggerIds || [];
  const behaviors = behaviorIds || [];
  for (const t of triggers) for (const b of behaviors) {
    const rule = resolveExercise(schema.id, t, b);
    if (rule) return rule;
  }
  for (const b of behaviors) {
    const rule = resolveExercise(schema.id, null, b);
    if (rule) return rule;
  }
  for (const t of triggers) {
    const rule = resolveExercise(schema.id, t, null);
    if (rule) return rule;
  }
  return resolveExercise(schema.id, null, null);
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

  const typeLabel = EXERCISE_TYPE_LABELS[exercise.type] || { icon: "🎯", label: "تمرین" };

  return (
    <Shell title="تمرین" onBack={onBack}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 18, marginBottom: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(255,255,255,.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22
          }}>{typeLabel.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>{typeLabel.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>یک تمرین کوچیک</div>
          </div>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.9, opacity: 0.85 }}>
          این تمرین به تو کمک می‌کنه این بار جور دیگه‌ای پاسخ بدی.
        </div>
      </Card>
      <ExerciseRenderer exercise={exercise} onComplete={(record) => onDone(record)} onSkip={onDone} />
    </Shell>
  );
}

/* =========================================================
 * Mission
 * ========================================================= */

const MISSION_TYPE_META = {
  observe:    { icon: "🔍", label: "مشاهده",  color: "#3b82f6", bgColor: "#eff6ff", time: "۱ دقیقه",   difficulty: 1, why: "فقط می‌خوای ببینی چه اتفاقی می‌افته — بدون قضاوت، بدون واکنش." },
  action:     { icon: "✋", label: "اقدام",   color: "#f59e0b", bgColor: "#fffbeb", time: "۲-۳ دقیقه", difficulty: 2, why: "این کار کوچیک، به ذهنت یاد می‌ده که این بار می‌تونه جور دیگه‌ای هم عمل کنه." },
  write:      { icon: "✍️", label: "نوشتن",   color: "#a855f7", bgColor: "#faf5ff", time: "۳-۵ دقیقه", difficulty: 2, why: "نوشتن، فکر رو از ذهنت بیرون میاره — تا بتونی ببینیش، نه اینکه توش غرق بشی." },
  "self-talk":{ icon: "💬", label: "خودگویی", color: "#10b981", bgColor: "#ecfdf5", time: "۳۰ ثانیه",  difficulty: 1, why: "جمله‌ای که به خودت می‌گی، صدای قدیمی رو کم‌رنگ‌تر می‌کنه." },
  experiment: { icon: "🧪", label: "آزمایش",  color: "#0891b2", bgColor: "#ecfeff", time: "۱۰-۳۰ دقیقه", difficulty: 3, why: "مغز با تجربه یاد می‌گیره، نه با فکر کردن. این یک آزمایش کوچیکه." }
};

const DEFAULT_MISSION_META = {
  icon: "🎯", label: "مأموریت", color: "#1a3d2c", bgColor: "#f0f7f4",
  time: "۱-۲ دقیقه", difficulty: 1, why: "یک قدم کوچیک، خودش یک پیروزیه."
};

function getMissionMeta(mission) {
  return MISSION_TYPE_META[mission?.type] || DEFAULT_MISSION_META;
}

function MissionView({ schemaId, onDone, onBack }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  const microMissions = getMicroMissions(schemaId);
  const missions = microMissions.length > 0 ? microMissions : (schema?.real_life_missions || []);
  const [selectedId, setSelectedId] = useState(missions[0]?.id || null);
  const [doneIds, setDoneIds] = useState([]);

  if (missions.length === 0) {
    return (
      <Shell title="مأموریت امروز" onBack={onBack}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.9, color: "#000" }}>
            برای این الگو، مأموریتی تعریف نشده.<br />
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
    setDoneIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const shuffle = () => {
    const remaining = missions.filter((m) => !doneIds.includes(m.id));
    const pool = remaining.length > 0 ? remaining : missions;
    setSelectedId(pool[Math.floor(Math.random() * pool.length)].id);
  };

  return (
    <Shell title="مأموریت امروز" onBack={onBack}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", marginBottom: 12, padding: 18
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
              height: 6, background: "rgba(255,255,255,.2)",
              borderRadius: 3, overflow: "hidden"
            }}>
              <div style={{
                height: "100%", width: progressPct + "%",
                background: "#fff", borderRadius: 3
              }} />
            </div>
          </div>
          <div style={{ fontSize: 12, opacity: 0.95, whiteSpace: "nowrap", fontWeight: 600 }}>
            {toFa(doneIds.length)} از {toFa(missions.length)}
          </div>
        </div>
      </Card>

      <Card style={{
        marginBottom: 16,
        border: `2px solid ${selectedMeta.color}`,
        background: selectedMeta.bgColor,
        padding: 18
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: selectedMeta.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0
          }}>{selectedMeta.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 4 }}>
              {selectedMeta.label}
            </div>
            <div style={{
              fontSize: 11, color: "#555",
              display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"
            }}>
              <span>⏱ {selectedMeta.time}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>{"★".repeat(selectedMeta.difficulty)}<span style={{ opacity: 0.3 }}>{"★".repeat(3 - selectedMeta.difficulty)}</span></span>
            </div>
          </div>
          <button onClick={() => toggleDone(selected.id)} style={{
            width: 36, height: 36, borderRadius: "50%",
            border: isSelectedDone ? "none" : "2px solid #bbb",
            background: isSelectedDone ? selectedMeta.color : "#fff",
            color: "#fff", fontSize: 16, fontWeight: 900,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "inherit", flexShrink: 0
          }}>{isSelectedDone ? "✓" : ""}</button>
        </div>
        <div style={{
          fontSize: 15, lineHeight: 1.9, color: "#000", fontWeight: 500,
          marginBottom: 14, paddingBottom: 14,
          borderBottom: "1px dashed rgba(0,0,0,.12)"
        }}>{selected.text}</div>
        <div style={{
          fontSize: 12, color: "#000", lineHeight: 1.9,
          opacity: 0.75, display: "flex", gap: 8
        }}>
          <span style={{ flexShrink: 0 }}>💡</span>
          <span style={{ fontStyle: "italic" }}>{selectedMeta.why}</span>
        </div>
      </Card>

      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 10
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>همه مأموریت‌ها</div>
        <button onClick={shuffle} style={{
          background: "#fff", border: "1px solid #e5e5e5",
          color: "#1a3d2c", fontSize: 12, fontWeight: 600,
          cursor: "pointer", padding: "6px 12px", borderRadius: 20,
          fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5
        }}>🔄 یکی دیگه</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {missions.map((m, idx) => {
          const meta = getMissionMeta(m);
          const isSelected = selectedId === m.id;
          const isDone = doneIds.includes(m.id);
          return (
            <button key={`${m.id}_${idx}`} onClick={() => setSelectedId(m.id)} style={{
              padding: "12px 14px", borderRadius: 10,
              border: isSelected ? `2px solid ${meta.color}` : "1px solid #e5e5e5",
              background: isSelected ? meta.bgColor : "#fff",
              cursor: "pointer", textAlign: "right", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 12
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: meta.color, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, flexShrink: 0, opacity: isDone ? 0.5 : 1
              }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: "#000", lineHeight: 1.7, marginBottom: 3,
                  textDecoration: isDone ? "line-through" : "none",
                  opacity: isDone ? 0.55 : 1
                }}>{m.text}</div>
                <div style={{
                  fontSize: 10, color: "#777",
                  display: "flex", alignItems: "center", gap: 6
                }}>
                  <span>{meta.label}</span>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span>⏱ {meta.time}</span>
                </div>
              </div>
              {isDone && (
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: meta.color, color: "#fff",
                  fontSize: 12, fontWeight: 900,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0
                }}>✓</div>
              )}
            </button>
          );
        })}
      </div>

      <Card style={{
        marginTop: 16, background: "#fff8e1",
        padding: 14, border: "1px solid #ffe0b2"
      }}>
        <div style={{ fontSize: 12, color: "#000", lineHeight: 1.9, textAlign: "center" }}>
          🌱 حتی اگر فقط به این مأموریت فکر کنی،<br />باز هم یک قدم برداشتی.
        </div>
      </Card>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <Btn onClick={() => onDone(selected)}>
          {isSelectedDone ? "✓ این را انجام دادم — ادامه" : "این یکی رو انتخاب می‌کنم"}
        </Btn>
        <Btn variant="ghost" onClick={() => onDone(null)}>الان نمی‌تونم — رد کن</Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * LogResult
 * ========================================================= */

function LogResultView({ schemaId, selection, onDone, onBack }) {
  const [reaction, setReaction] = useState(null);
  const [missionDone, setMissionDone] = useState(false);
  const [notes, setNotes] = useState("");

  const primaryBehaviorId = (selection.behaviorIds || [])[0] || null;
  const replacement = getReplacementResponse(schemaId, primaryBehaviorId);

  const options = [
    { id: "old",    emoji: "🔴", label: "واکنش قدیمی",  desc: "همون کار قبلی رو کردم", color: "#ef4444", bgColor: "#fef2f2" },
    { id: "paused", emoji: "🟡", label: "مکث کردم",     desc: "قبل از واکنش، صبر کردم", color: "#f59e0b", bgColor: "#fffbeb" },
    { id: "new",    emoji: "🟢", label: "پاسخ جدید",    desc: "این بار جور دیگه‌ای عمل کردم", color: "#10b981", bgColor: "#ecfdf5" }
  ];

  const selectedOption = options.find((o) => o.id === reaction);

  return (
    <Shell title="چطور پیش رفت؟" onBack={onBack}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 16,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(255,255,255,.05)"
        }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>
            {selectedOption ? selectedOption.emoji : "🎯"}
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
            {selectedOption ? selectedOption.label : "این بار چه اتفاقی افتاد؟"}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.8, opacity: 0.85 }}>
            {selectedOption ? selectedOption.desc : "صادقانه انتخاب کن — این برای شناخت خودته"}
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {options.map((o) => {
          const isActive = reaction === o.id;
          return (
            <button key={o.id} onClick={() => setReaction(o.id)} style={{
              padding: 16, borderRadius: 14,
              border: isActive ? `2px solid ${o.color}` : "1px solid #f0f0f0",
              background: isActive ? o.bgColor : "#fff",
              cursor: "pointer", fontFamily: "inherit",
              textAlign: "right", display: "flex",
              alignItems: "center", gap: 14
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: o.color + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0
              }}>{o.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#000", marginBottom: 3 }}>
                  {o.label}
                </div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>{o.desc}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                border: isActive ? "none" : "2px solid #ddd",
                background: isActive ? o.color : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 900, flexShrink: 0
              }}>{isActive ? "✓" : ""}</div>
            </button>
          );
        })}
      </div>

      {reaction === "new" && (
        <Card style={{ marginBottom: 12, background: "#ecfdf5", border: "1px solid #a7f3d0", padding: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>⭐</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#065f46", marginBottom: 4 }}>
                این یک لحظه‌ی برد است
              </div>
              <div style={{ fontSize: 13, color: "#047857", lineHeight: 1.8 }}>
                تو این بار جور دیگه‌ای پاسخ دادی. در «لحظه‌های من» ذخیره می‌شه.
              </div>
            </div>
          </div>
        </Card>
      )}

      {reaction === "paused" && (
        <Card style={{ marginBottom: 12, background: "#fffbeb", border: "1px solid #fde68a", padding: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>⏸</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                همین مکث کردن، خودش یک قدمه
              </div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.8 }}>
                تو بین محرک و واکنش، فاصله انداختی. این مهارت با تمرین قوی‌تر می‌شه.
              </div>
            </div>
          </div>
        </Card>
      )}

      {reaction === "old" && (
        <Card style={{ marginBottom: 12, background: "#f6f6f6", border: "1px solid #e5e5e5", padding: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>💙</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 4 }}>
                مهم نیست — این هم بخشی از مسیره
              </div>
              <div style={{ fontSize: 13, color: "#666", lineHeight: 1.8 }}>
                هر بار که ببینی، یاد می‌گیری. پس فردا یه فرصت دیگه داری.
              </div>
            </div>
          </div>
        </Card>
      )}

      {replacement && primaryBehaviorId && (
        <Card style={{ marginBottom: 12, background: "#eef4ff", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, marginBottom: 8 }}>
            💡 پاسخ جایگزینی که می‌تونی امتحان کنی
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.9, color: "#000", fontWeight: 500 }}>
            {replacement}
          </div>
        </Card>
      )}

      <button onClick={() => setMissionDone(!missionDone)} style={{
        width: "100%", padding: 16, borderRadius: 14,
        border: missionDone ? "2px solid #10b981" : "1px solid #f0f0f0",
        background: missionDone ? "#ecfdf5" : "#fff",
        cursor: "pointer", fontFamily: "inherit", textAlign: "right",
        display: "flex", alignItems: "center", gap: 12,
        marginBottom: 12
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          border: missionDone ? "none" : "2px solid #ddd",
          background: missionDone ? "#10b981" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 14, fontWeight: 900, flexShrink: 0
        }}>{missionDone ? "✓" : ""}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 2 }}>
            مأموریت امروز را انجام دادم
          </div>
          <div style={{ fontSize: 11, color: "#666" }}>اگه انجامش دادی، این رو تیک بزن</div>
        </div>
      </button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 16 }}>✍️</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>یادداشت (اختیاری)</div>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 10, lineHeight: 1.7 }}>
          چه چیزی کمک کرد؟ چه چیزی سخت بود؟
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={3} placeholder="مثلاً: وقتی خواستم پیام بفرستم، ۳۰ ثانیه صبر کردم..."
          style={styles.textarea} />
      </Card>

      <Btn disabled={!reaction} onClick={() => onDone({ reactionType: reaction, missionDone, notes })}>
        {reaction ? "✓ ثبت کن" : "یک گزینه را انتخاب کن"}
      </Btn>
    </Shell>
  );
}

/* =========================================================
 * Wins
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
    const months = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
    return `${toFa(d.getDate())} ${months[d.getMonth()]} — ${toFa(d.getHours())}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  if (wins.length === 0) {
    return (
      <Shell title="لحظه‌های من" onBack={onBack} showSOS onSOS={onSOS}>
        <Card style={{ textAlign: "center", padding: 30 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <p style={{ fontSize: 15, lineHeight: 1.9, margin: 0 }}>
            هنوز لحظه‌ای ثبت نشده.<br />
            هر بار که مکث کنی یا پاسخ جدیدی امتحان کنی، اینجا ذخیره می‌شود.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell title="لحظه‌های من" onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", marginBottom: 12
      }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>مجموع لحظه‌های برد</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}>{toFa(wins.length)}</div>
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
 * Calendar
 * ========================================================= */

function CalendarView({ onBack, onSOS }) {
  const [data, setData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => { getCalendarData(30).then(setData); }, []);

  if (!data) {
    return (
      <Shell title="تقویم" onBack={onBack} showSOS onSOS={onSOS}>
        <p style={{ color: "#000" }}>در حال بارگذاری...</p>
      </Shell>
    );
  }

  const moodColors = { good: "#27ae60", meh: "#f39c12", hard: "#e74c3c", none: "#f0f0f0" };
  const moodLabels = { good: "خوب", meh: "متوسط", hard: "سخت", none: "بدون ثبت" };

  const totalActivations = data.reduce((sum, d) => sum + d.activations, 0);
  const winDays = data.filter((d) => d.hasWin).length;
  const goodDays = data.filter((d) => d.mood === "good").length;
  const hardDays = data.filter((d) => d.mood === "hard").length;
  const mehDays = data.filter((d) => d.mood === "meh").length;
  const recordedDays = data.filter((d) => d.mood !== "none").length;

  const weeks = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <Shell title="تقویم" onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 14
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>📅</div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>۳۰ روز اخیر</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>سفر تو</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <div style={{
            padding: 10, borderRadius: 10,
            background: "rgba(255,255,255,.08)", textAlign: "center"
          }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{toFa(totalActivations)}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>فعال شدن</div>
          </div>
          <div style={{
            padding: 10, borderRadius: 10,
            background: "rgba(255,255,255,.08)", textAlign: "center"
          }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{toFa(recordedDays)}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>روز ثبت</div>
          </div>
          <div style={{
            padding: 10, borderRadius: 10,
            background: "rgba(255,255,255,.08)", textAlign: "center"
          }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{toFa(winDays)}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>⭐ برد</div>
          </div>
        </div>
      </Card>

      {recordedDays > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginBottom: 12 }}>
            توزیع حال کلی
          </div>
          <div style={{ display: "flex", gap: 4, height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
            {goodDays > 0 && <div style={{ flex: goodDays, background: moodColors.good }} />}
            {mehDays > 0 && <div style={{ flex: mehDays, background: moodColors.meh }} />}
            {hardDays > 0 && <div style={{ flex: hardDays, background: moodColors.hard }} />}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11 }}>
            {[
              { c: moodColors.good, l: "خوب", v: goodDays },
              { c: moodColors.meh, l: "متوسط", v: mehDays },
              { c: moodColors.hard, l: "سخت", v: hardDays }
            ].map((x, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: x.c, display: "inline-block" }} />
                <span style={{ color: "#000" }}>{x.l}</span>
                <span style={{ color: "#999", fontWeight: 600 }}>({toFa(x.v)})</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#000", marginBottom: 12 }}>
          نمای روزانه
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4, marginBottom: 4
          }}>
            {week.map((d, di) => {
              const isSelected = selectedDay === d.date;
              return (
                <button key={di} onClick={() => setSelectedDay(isSelected ? null : d.date)} style={{
                  aspectRatio: "1", borderRadius: 8,
                  border: isSelected ? "2px solid #1a3d2c" : "none",
                  background: moodColors[d.mood],
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  position: "relative",
                  color: d.mood === "none" ? "#999" : "#fff",
                  fontSize: 11, fontWeight: 700
                }}>
                  <div>{toFa(d.dayNumber)}</div>
                  {d.activations > 0 && (
                    <div style={{ fontSize: 8, opacity: 0.9, marginTop: 1 }}>
                      {toFa(d.activations)}
                    </div>
                  )}
                  {d.hasWin && (
                    <div style={{ position: "absolute", top: 2, left: 2, fontSize: 8 }}>⭐</div>
                  )}
                </button>
              );
            })}
            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
              <div key={`e_${i}`} style={{ aspectRatio: "1" }} />
            ))}
          </div>
        ))}
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: "1px dashed #eee",
          display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11
        }}>
          {Object.entries(moodLabels).map(([k, label]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                width: 10, height: 10, borderRadius: 3,
                background: moodColors[k], display: "inline-block"
              }} />
              <span style={{ color: "#666" }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {selectedDay && (() => {
        const day = data.find((d) => d.date === selectedDay);
        if (!day) return null;
        const jd = new Date(day.date);
        const dayNames = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
        return (
          <Card style={{ marginBottom: 14, background: "#f0f7f4", border: "1px solid #a7f3d0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: "#065f46", marginBottom: 3 }}>
                  {dayNames[jd.getDay()]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>
                  {toFa(jd.getDate())} / {toFa(jd.getMonth() + 1)}
                </div>
              </div>
              <div style={{
                fontSize: 24, padding: "6px 12px", borderRadius: 10,
                background: moodColors[day.mood] + "20"
              }}>
                {day.mood === "good" ? "😊" : day.mood === "hard" ? "😔" : day.mood === "meh" ? "😐" : "—"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                flex: 1, padding: 10, background: "#fff",
                borderRadius: 8, textAlign: "center"
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#000" }}>
                  {toFa(day.activations)}
                </div>
                <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>فعال شدن الگو</div>
              </div>
              {day.hasWin && (
                <div style={{
                  flex: 1, padding: 10, background: "#fff8e1",
                  borderRadius: 8, textAlign: "center"
                }}>
                  <div style={{ fontSize: 16 }}>⭐</div>
                  <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>لحظه‌ی برد</div>
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 18, textAlign: "center"
      }}>
        <div style={{ fontSize: 12, lineHeight: 1.9, opacity: 0.95 }}>
          هر روزی که ثبت کردی،<br />یه قدم به شناخت خودت نزدیک‌تر شدی
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * Situations List
 * ========================================================= */

function SituationsView({ onBack, onPickSituation, onSOS }) {
  const [category, setCategory] = useState("all");
  const situations = getSituationsByCategory(category);

  const catColors = {
    work: "#3b82f6", relationship: "#ec4899", family: "#f59e0b",
    social: "#8b5cf6", self: "#10b981", health: "#ef4444", online: "#0891b2"
  };
  const catIcons = {
    work: "💼", relationship: "💞", family: "🏠",
    social: "👥", self: "🧠", health: "💪", online: "📱"
  };

  const currentCat = SITUATION_CATEGORIES.find((c) => c.id === category);

  return (
    <Shell title="موقعیت‌های من" onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 14
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 36 }}>🔍</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>
              الان چه حسی داری؟
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}>
              موقعیتت رو انتخاب کن — بعد با هم می‌بینیم چیکار می‌شه کرد
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
        {SITUATION_CATEGORIES.map((c) => {
          const isActive = category === c.id;
          const color = catColors[c.id] || "#1a3d2c";
          return (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              flexShrink: 0, padding: "10px 14px", borderRadius: 22,
              border: isActive ? "none" : "1px solid #e5e5e5",
              background: isActive ? color : "#fff",
              color: isActive ? "#fff" : "#000",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6
            }}>
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {currentCat && category !== "all" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: (catColors[category] || "#1a3d2c") + "15",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18
          }}>{catIcons[category]}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>{currentCat.label}</div>
            <div style={{ fontSize: 11, color: "#666" }}>{toFa(situations.length)} موقعیت</div>
          </div>
        </div>
      )}

      {situations.map((s) => {
        const color = catColors[s.category] || "#1a3d2c";
        const icon = catIcons[s.category] || "📍";
        return (
          <button key={s.id} onClick={() => onPickSituation(s.id)} style={{
            display: "block", width: "100%", textAlign: "right",
            padding: 16, marginBottom: 10, borderRadius: 14,
            border: "1px solid #f0f0f0", background: "#fff",
            cursor: "pointer", fontFamily: "inherit",
            position: "relative", overflow: "hidden"
          }}>
            <div style={{
              position: "absolute", top: 0, right: 0,
              width: 4, height: "100%", background: color
            }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: color + "15",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0
              }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: "#000",
                  lineHeight: 1.6, marginBottom: 6
                }}>{s.title}</div>
                <div style={{
                  fontSize: 9, padding: "2px 8px", borderRadius: 20,
                  background: color + "15", color: color,
                  fontWeight: 700, display: "inline-block"
                }}>{s.categoryLabel}</div>
              </div>
              <span style={{ fontSize: 16, color: "#ccc", marginTop: 10 }}>←</span>
            </div>
          </button>
        );
      })}
    </Shell>
  );
}

/* =========================================================
 * Situation Detail
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

  const mainSchema = relatedSchemas[0];
  const mainOrigin = mainSchema ? getOrigin(mainSchema.id) : null;
  const compassionatePhrases = mainSchema ? getCompassionatePhrases(mainSchema.id) : [];
  const compassionNote = compassionatePhrases[0] || "این حس، از جای واقعی اومده — تو تنها نیستی.";

  const allThoughts = [];
  const allEmotions = [];
  for (const s of relatedSchemas) {
    for (const t of s.automatic_thoughts || []) {
      if (!allThoughts.find((x) => x.id === t.id)) allThoughts.push(t);
    }
    for (const e of s.emotional_signals || []) {
      if (!allEmotions.find((x) => x.id === e.id)) allEmotions.push(e);
    }
  }

  const stages = (situation.whatToDo || []).map((step, idx) => ({
    n: idx + 1,
    fullText: step,
    color: STAGE_COLORS[((idx) % 4) + 1] || "#1a3d2c"
  }));

  return (
    <Shell title={situation.categoryLabel} onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 14
      }}>
        <div style={{
          fontSize: 10, padding: "4px 10px", borderRadius: 20,
          background: "rgba(255,255,255,.15)",
          display: "inline-block", marginBottom: 10
        }}>{situation.categoryLabel}</div>
        <h2 style={{ margin: "0 0 10px", fontSize: 19, lineHeight: 1.6, fontWeight: 700 }}>
          {situation.title}
        </h2>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.9 }}>
          این موقعیت رو با هم می‌شناسیم — تا بتونی این بار جور دیگه‌ای عمل کنی.
        </div>
      </Card>

      {situation.examples?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="💭" title="آیا این جمله‌ها برایت آشناست؟" />
          {situation.examples.map((ex, i) => (
            <div key={i} style={{
              fontSize: 14, lineHeight: 1.9, padding: "10px 12px",
              marginBottom: 6, background: "#fafafa", borderRadius: 8,
              color: "#000", borderRight: "3px solid #e5e5e5"
            }}>«{ex}»</div>
          ))}
        </Card>
      )}

      {situation.cycle?.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔁" title="چرخه‌ی پنهان این موقعیت" />
          {situation.cycle.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "#1a3d2c", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0
              }}>{toFa(i + 1)}</div>
              <div style={{
                flex: 1, padding: "10px 12px", background: "#f6f6f6",
                borderRadius: 8, fontSize: 13, lineHeight: 1.7, color: "#000"
              }}>{step}</div>
            </div>
          ))}
        </Card>
      )}

      {mainOrigin?.whatChildLearned && (
        <Card style={{ marginBottom: 12, background: "#eef4ff", border: "1px solid #bfdbfe" }}>
          <SectionTitle icon="🧸" title="این الگو از کجا آمد؟" color="#1e40af" />
          <div style={{
            fontSize: 14, lineHeight: 1.95, color: "#000",
            fontStyle: "italic", padding: "10px 12px",
            background: "#fff", borderRadius: 8,
            borderRight: "3px solid #3b82f6"
          }}>{mainOrigin.whatChildLearned}</div>
        </Card>
      )}

      {relatedSchemas.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔗" title="این موقعیت با این الگوها گره خورده" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {relatedSchemas.map((s, idx) => (
              <button key={s.id} onClick={() => onPickSchema(s.id)} style={{
                padding: "12px 14px", borderRadius: 10,
                border: idx === 0 ? "2px solid #1a3d2c" : "1px solid #e5e5e5",
                background: idx === 0 ? "#f0f7f4" : "#fafafa",
                cursor: "pointer", textAlign: "right",
                fontFamily: "inherit", fontSize: 14
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, color: "#000" }}>
                    {s.name_plain || s.name_fa}
                  </div>
                  {idx === 0 && (
                    <span style={{
                      fontSize: 9, padding: "2px 6px", borderRadius: 20,
                      background: "#1a3d2c", color: "#fff", fontWeight: 700
                    }}>اصلی</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>
                  {s.one_liner || s.short_description}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {allThoughts.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🧠" title="چه فکرهایی از ذهنت می‌گذرد؟" />
          <div style={{ fontSize: 12, color: "#666", marginBottom: 10, fontStyle: "italic" }}>
            این‌ها جملاتی هستند که در این موقعیت، ذهنت بهت می‌گه:
          </div>
          {allThoughts.slice(0, 5).map((t, i) => (
            <div key={i} style={{
              fontSize: 13, lineHeight: 1.9, color: "#000",
              marginBottom: 8, padding: "10px 12px",
              background: "#f3e8ff", borderRadius: 8,
              borderRight: "3px solid #8b5cf6"
            }}>«{t.text}»</div>
          ))}
        </Card>
      )}

      {allEmotions.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="💧" title="چه احساسی بالا میاد؟" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allEmotions.slice(0, 10).map((e, i) => (
              <div key={i} style={{
                fontSize: 12, padding: "7px 12px",
                background: "#fce7f3", color: "#831843",
                borderRadius: 20, fontWeight: 500
              }}>{e.text}</div>
            ))}
          </div>
        </Card>
      )}

      {stages.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, #0a3d38, #178a7c)",
              color: "#fff", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 18
            }}>🚀</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>
                مراحل مواجهه با این موقعیت
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
                <div style={{ flex: 1, fontSize: 14, lineHeight: 1.9, color: "#000" }}>
                  {stage.fullText}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {situation.selfTalk?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#f3e8ff" }}>
          <SectionTitle icon="🗣️" title="به خودت این‌ها را بگو" color="#6b21a8" />
          {situation.selfTalk.map((phrase, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 8, padding: "10px 14px",
              background: "#fff", borderRadius: 8,
              borderRight: "3px solid #8b5cf6", fontStyle: "italic"
            }}>«{phrase}»</div>
          ))}
        </Card>
      )}

      <Card style={{
        marginBottom: 12,
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 20
      }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>💙</div>
        <div style={{ fontSize: 14, lineHeight: 2, opacity: 0.95 }}>{compassionNote}</div>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Btn onClick={() => onPickSchema(relatedSchemas[0]?.id)}>
          کار روی {relatedSchemas[0]?.name_plain || "این الگو"}
        </Btn>
      </div>
    </Shell>
  );
}

/* =========================================================
 * Relationships List
 * ========================================================= */

function RelationshipsView({ analysis, onBack, onPickPattern, onPickResponseGuide, onSOS }) {
  const [tab, setTab] = useState("respond");

  const userSchemas = useMemo(() => {
    if (!analysis?.all) return [];
    return analysis.all.filter((r) => r.percentage >= 40);
  }, [analysis]);

  const relevantPatterns = useMemo(() => {
    if (userSchemas.length === 0) return ATTRACTION_PATTERNS;
    const ids = userSchemas.map((s) => s.schemaId);
    return ATTRACTION_PATTERNS
      .filter((p) => p.schemas.some((sid) => ids.includes(sid)))
      .concat(ATTRACTION_PATTERNS.filter((p) => !p.schemas.some((sid) => ids.includes(sid))));
  }, [userSchemas]);

  const prioritySchemas = useMemo(() => {
    if (!analysis?.all) return SCHEMAS;
    const activeIds = new Set(userSchemas.map((s) => s.schemaId));
    return [...SCHEMAS.filter((s) => activeIds.has(s.id)), ...SCHEMAS.filter((s) => !activeIds.has(s.id))];
  }, [analysis, userSchemas]);

  return (
    <Shell title="روابط من" onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 24, marginBottom: 14, textAlign: "center"
      }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>💞</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>روابط من</div>
        <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.85 }}>
          چرا بعضی روابط تکرار می‌شن؟<br />چطور بهتر برخورد کنم؟
        </div>
      </Card>

      <div style={{
        display: "flex", gap: 6, padding: 4,
        background: "#f0f0f0", borderRadius: 14, marginBottom: 16
      }}>
        {[
          { id: "respond", label: "💬 چطور برخورد کنم؟" },
          { id: "why", label: "🔁 چرا تکرار می‌شوند؟" }
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "12px 12px", borderRadius: 10, border: "none",
            background: tab === t.id ? "#fff" : "transparent",
            color: tab === t.id ? "#1a3d2c" : "#666",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,.08)" : "none"
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "respond" && (
        <>
          <Card style={{ marginBottom: 14, background: "#eef4ff", border: "1px solid #bfdbfe", padding: 14 }}>
            <div style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.9 }}>
              💡 اگر کسی که تو زندگیت هست، این الگو را دارد — روی اسمش بزن تا ببینی چطور رفتار کنی.
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prioritySchemas.map((s) => {
              const guide = HOW_TO_RESPOND[s.id];
              const plain = s.name_plain || guide?.plainName || s.name_fa;
              const isActive = userSchemas.some((u) => u.schemaId === s.id);
              return (
                <button key={s.id} onClick={() => onPickResponseGuide(s.id)} style={{
                  padding: "14px 16px", borderRadius: 12,
                  border: isActive ? "2px solid #1a3d2c" : "1px solid #f0f0f0",
                  background: isActive ? "#f0f7f4" : "#fff",
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", gap: 12, textAlign: "right"
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11,
                    background: isActive ? "#1a3d2c" : "#f0f7f4",
                    color: isActive ? "#fff" : "#1a3d2c",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0
                  }}>💡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#000" }}>{plain}</div>
                      {isActive && (
                        <span style={{
                          fontSize: 9, padding: "2px 6px", borderRadius: 20,
                          background: "#1a3d2c", color: "#fff", fontWeight: 700
                        }}>فعال</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "#999" }}>{s.name_fa}</div>
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
          <Card style={{ marginBottom: 14, background: "#fef3c7", border: "1px solid #fde68a", padding: 14 }}>
            <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.9 }}>
              🔁 این‌ها ترکیب‌های رایج روابط‌اند. روی هرکدوم بزن تا بفهمی چرا همیشه شبیه هم‌اند.
            </div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {relevantPatterns.map((p, idx) => {
              const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#0ea5e9", "#10b981"];
              const color = colors[idx % colors.length];
              return (
                <button key={p.id} onClick={() => onPickPattern(p.id)} style={{
                  padding: 18, borderRadius: 14,
                  border: "1px solid #f0f0f0", background: "#fff",
                  cursor: "pointer", fontFamily: "inherit",
                  textAlign: "right", position: "relative", overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute", top: 0, right: 0,
                    width: 4, height: "100%", background: color
                  }} />
                  <div style={{
                    display: "inline-block", fontSize: 10, padding: "4px 10px",
                    borderRadius: 20, background: color + "15",
                    color: color, fontWeight: 700, marginBottom: 10
                  }}>{p.shortName}</div>
                  <div style={{
                    fontSize: 15, fontWeight: 700, lineHeight: 1.6,
                    color: "#000", marginBottom: 8
                  }}>{p.boxTitle || p.title}</div>
                  <div style={{ fontSize: 12, color: "#666", lineHeight: 1.8, marginBottom: 12 }}>
                    {p.boxDescription}
                  </div>
                  <div style={{
                    fontSize: 11, color: color, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 4
                  }}>
                    <span>مشاهده کامل</span>
                    <span>←</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}

/* =========================================================
 * Relationship Detail
 * ========================================================= */

function RelationshipDetailView({ patternId, onBack, onPickSchema, onSOS }) {
  const pattern = ATTRACTION_PATTERNS.find((p) => p.id === patternId);

  if (!pattern) {
    return (
      <Shell title="خطا" onBack={onBack} showSOS onSOS={onSOS}>
        <Card><p>الگو پیدا نشد.</p></Card>
      </Shell>
    );
  }

  const schemas = pattern.schemas.map((id) => SCHEMAS.find((s) => s.id === id)).filter(Boolean);

  const allThoughts = [];
  const allEmotions = [];
  for (const s of schemas) {
    for (const t of s.automatic_thoughts || []) {
      if (!allThoughts.find((x) => x.id === t.id)) allThoughts.push(t);
    }
    for (const e of s.emotional_signals || []) {
      if (!allEmotions.find((x) => x.id === e.id)) allEmotions.push(e);
    }
  }

  const compassionatePhrases = schemas[0] ? getCompassionatePhrases(schemas[0].id) : [];
  const compassionNote = compassionatePhrases[0] || "این الگو، گناه تو نیست — بخشی از یادگیری قدیمیه.";

  const stages = (pattern.whatToDoNow || []).map((step, idx) => ({
    n: idx + 1,
    fullText: step,
    color: STAGE_COLORS[((idx) % 4) + 1] || "#1a3d2c"
  }));

  return (
    <Shell title={pattern.shortName || "الگوی رابطه"} onBack={onBack} showSOS onSOS={onSOS}>
      <Card style={{
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 22, marginBottom: 14
      }}>
        <div style={{
          fontSize: 10, padding: "4px 10px", borderRadius: 20,
          background: "rgba(255,255,255,.15)",
          display: "inline-block", marginBottom: 10
        }}>{pattern.shortName}</div>
        <h2 style={{ margin: "0 0 12px", fontSize: 19, lineHeight: 1.6, fontWeight: 700 }}>
          {pattern.title}
        </h2>
        <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.9 }}>
          {pattern.boxDescription}
        </div>
      </Card>

      {schemas.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔗" title="این الگو از ترکیب این طرحواره‌ها ساخته شده" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {schemas.map((s) => (
              <button key={s.id} onClick={() => onPickSchema(s.id)} style={{
                fontSize: 12, padding: "8px 14px",
                background: "#f0f7f4", color: "#1a3d2c",
                borderRadius: 20, fontWeight: 600,
                border: "1px solid #a7f3d0", cursor: "pointer",
                fontFamily: "inherit"
              }}>{s.name_plain || s.name_fa} ←</button>
            ))}
          </div>
        </Card>
      )}

      {pattern.childhood && (
        <Card style={{ marginBottom: 12, background: "#eef4ff", border: "1px solid #bfdbfe" }}>
          <SectionTitle icon="🧸" title="این الگو از کجا آمد؟" color="#1e40af" />
          {Array.isArray(pattern.childhood) ? pattern.childhood.map((c, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 8, paddingRight: 10, borderRight: "3px solid #3b82f6"
            }}>• {c}</div>
          )) : (
            <div style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>{pattern.childhood}</div>
          )}
        </Card>
      )}

      {pattern.realLife && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="📖" title="در زندگی واقعی چطور دیده می‌شه؟" />
          <div style={{
            fontSize: 14, lineHeight: 1.95, color: "#000",
            padding: "12px 14px", background: "#fafafa",
            borderRadius: 8, borderRight: "3px solid #e5e5e5"
          }}>{pattern.realLife}</div>
        </Card>
      )}

      {pattern.typical && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🔄" title="معمولاً چطور پیش می‌ره؟" />
          <div style={{ fontSize: 14, lineHeight: 1.9, color: "#000" }}>{pattern.typical}</div>
        </Card>
      )}

      {allThoughts.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="🧠" title="چه فکرهایی رد و بدل می‌شه؟" />
          {allThoughts.slice(0, 4).map((t, i) => (
            <div key={i} style={{
              fontSize: 13, lineHeight: 1.9, color: "#000",
              marginBottom: 8, padding: "10px 12px",
              background: "#f3e8ff", borderRadius: 8,
              borderRight: "3px solid #8b5cf6"
            }}>«{t.text}»</div>
          ))}
        </Card>
      )}

      {allEmotions.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          <SectionTitle icon="💧" title="چه احساساتی شکل می‌گیره؟" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allEmotions.slice(0, 10).map((e, i) => (
              <div key={i} style={{
                fontSize: 12, padding: "7px 12px",
                background: "#fce7f3", color: "#831843",
                borderRadius: 20, fontWeight: 500
              }}>{e.text}</div>
            ))}
          </div>
        </Card>
      )}

      {pattern.challenges?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#fef2f2", border: "1px solid #fecaca" }}>
          <SectionTitle icon="⚠️" title="چالش‌های این رابطه" color="#991b1b" />
          {pattern.challenges.map((c, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 6, paddingRight: 10, borderRight: "3px solid #ef4444"
            }}>• {c}</div>
          ))}
        </Card>
      )}

      {pattern.whatHelps?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <SectionTitle icon="✅" title="چه چیزی کمک می‌کند" color="#065f46" />
          {pattern.whatHelps.map((h, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 6, paddingRight: 10, borderRight: "3px solid #10b981"
            }}>✓ {h}</div>
          ))}
        </Card>
      )}

      {pattern.whatHurts?.length > 0 && (
        <Card style={{ marginBottom: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
          <SectionTitle icon="❌" title="چه چیزی اوضاع را بدتر می‌کند" color="#92400e" />
          {pattern.whatHurts.map((h, i) => (
            <div key={i} style={{
              fontSize: 13.5, lineHeight: 1.9, color: "#000",
              marginBottom: 6, paddingRight: 10, borderRight: "3px solid #f59e0b"
            }}>✕ {h}</div>
          ))}
        </Card>
      )}

      {stages.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, #0a3d38, #178a7c)",
              color: "#fff", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 18
            }}>🚀</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>
                مراحل شکستن این چرخه
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
                <div style={{ flex: 1, fontSize: 14, lineHeight: 1.9, color: "#000" }}>
                  {stage.fullText}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card style={{
        marginBottom: 12,
        background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
        color: "#fff", padding: 20
      }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>💙</div>
        <div style={{ fontSize: 14, lineHeight: 2, opacity: 0.95 }}>{compassionNote}</div>
      </Card>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {schemas[0] && (
          <Btn onClick={() => onPickSchema(schemas[0].id)}>
            کار روی {schemas[0].name_plain || schemas[0].name_fa}
          </Btn>
        )}
      </div>
    </Shell>
  );
}

/* =========================================================
 * Response Guide
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

  const stages = (guide.whatToDoNow || []).map((step, idx) => ({
    n: idx + 1,
    fullText: step,
    color: STAGE_COLORS[((idx) % 4) + 1] || "#1a3d2c"
  }));

  return (
    <Shell title={plain || guide.name} onBack={onBack} showSOS onSOS={onSOS}>

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
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(255,255,255,.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26
            }}>💡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>
                چطور با این الگو برخورد کنم؟
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>
                {plain || guide.name}
              </div>
            </div>
          </div>

          {guide.name && guide.name !== plain && (
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12 }}>
              {guide.name}
            </div>
          )}

          {guide.plainDescription && (
            <div style={{
              fontSize: 13,
              lineHeight: 1.9,
              padding: "12px 14px",
              background: "rgba(255,255,255,.08)",
              borderRadius: 10,
              opacity: 0.95
            }}>{guide.plainDescription}</div>
          )}
        </div>
      </Card>

      {/* ═══ در زندگی واقعی ═══ */}
      {guide.example && (
        <Card style={{
          marginBottom: 12,
          background: "#eef4ff",
          border: "1px solid #bfdbfe"
        }}>
          <SectionTitle icon="📖" title="در زندگی واقعی چطور دیده می‌شه؟" color="#1e40af" />
          <div style={{
            fontSize: 14,
            lineHeight: 1.95,
            color: "#000",
            padding: "12px 14px",
            background: "#fff",
            borderRadius: 10,
            borderRight: "3px solid #3b82f6"
          }}>{guide.example}</div>
        </Card>
      )}

      {/* ═══ کودکی ═══ */}
      {guide.childhood && guide.childhood.length > 0 && (
        <Card style={{
          marginBottom: 12,
          background: "#faf5ff",
          border: "1px solid #e9d5ff"
        }}>
          <SectionTitle icon="🧸" title="این الگو از کجا آمد؟" color="#6b21a8" />
          <div style={{
            fontSize: 12,
            color: "#7c3aed",
            marginBottom: 12,
            fontStyle: "italic"
          }}>
            احتمالاً در کودکی این‌ها را تجربه کرده:
          </div>
          {guide.childhood.map((c, i) => (
            <div key={i} style={{
              display: "flex",
              gap: 12,
              padding: "12px 14px",
              marginBottom: 8,
              background: "#fff",
              borderRadius: 10,
              borderRight: "3px solid #8b5cf6"
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "#8b5cf6", color: "#fff",
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

      {/* ═══ قاعده طلایی ═══ */}
      {guide.goldenRule && (
        <Card style={{
          marginBottom: 12,
          background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
          color: "#fff",
          padding: 22,
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute", top: -20, left: -20,
            fontSize: 80, opacity: 0.06
          }}>⭐</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 14, position: "relative"
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: "rgba(255,255,255,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20
            }}>⭐</div>
            <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.95 }}>
              قاعده طلایی
            </div>
          </div>
          <div style={{
            fontSize: 16,
            lineHeight: 2,
            fontWeight: 600,
            position: "relative",
            padding: "12px 14px",
            background: "rgba(255,255,255,.08)",
            borderRadius: 10
          }}>{guide.goldenRule}</div>
        </Card>
      )}

      {/* ═══ این کارها را بکن ═══ */}
      {guide.doThis && guide.doThis.length > 0 && (
        <Card style={{
          marginBottom: 12,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0"
        }}>
          <SectionTitle icon="✅" title="این کارها را بکن" color="#065f46" />
          <div style={{ fontSize: 12, color: "#047857", marginBottom: 12, fontStyle: "italic" }}>
            چیزهایی که کمک می‌کنند رابطه سالم‌تر بشه:
          </div>
          {guide.doThis.map((d, i) => (
            <div key={i} style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "10px 14px",
              marginBottom: 8,
              background: "#fff",
              borderRadius: 10,
              borderRight: "3px solid #10b981"
            }}>
              <span style={{
                color: "#10b981",
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
                marginTop: 2
              }}>✓</span>
              <span style={{
                flex: 1,
                fontSize: 13.5,
                lineHeight: 1.9,
                color: "#000"
              }}>{d}</span>
            </div>
          ))}
        </Card>
      )}

      {/* ═══ این کارها را نکن ═══ */}
      {guide.dontDoThis && guide.dontDoThis.length > 0 && (
        <Card style={{
          marginBottom: 12,
          background: "#fef2f2",
          border: "1px solid #fecaca"
        }}>
          <SectionTitle icon="❌" title="این کارها را نکن" color="#991b1b" />
          <div style={{ fontSize: 12, color: "#b91c1c", marginBottom: 12, fontStyle: "italic" }}>
            چیزهایی که اوضاع را بدتر می‌کنند:
          </div>
          {guide.dontDoThis.map((d, i) => (
            <div key={i} style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              padding: "10px 14px",
              marginBottom: 8,
              background: "#fff",
              borderRadius: 10,
              borderRight: "3px solid #ef4444"
            }}>
              <span style={{
                color: "#ef4444",
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
                marginTop: 2
              }}>✕</span>
              <span style={{
                flex: 1,
                fontSize: 13.5,
                lineHeight: 1.9,
                color: "#000"
              }}>{d}</span>
            </div>
          ))}
        </Card>
      )}

      {/* ═══ حالا باید چکار کرد — مرحله‌ای ═══ */}
      {stages.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            paddingRight: 4
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
              marginBottom: 8,
              padding: 14,
              borderRight: `4px solid ${stage.color}`,
              background: "#fff"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: stage.color,
                  color: "#fff",
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
          تو نمی‌تونی دیگران رو تغییر بدی —
          <br />
          ولی می‌تونی خودت رو قوی‌تر کنی.
        </div>
      </Card>
    </Shell>
  );
}

/* =========================================================
 * Progress
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

  const { reactions, total, streak, insights, winsCount } = summary;

  return (
    <Shell title="پیشرفت" onBack={onBack} showQuickButton onQuick={onQuick} showSOS onSOS={onSOS}>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 12, color: "#000" }}>فعال شدن الگو</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{toFa(total)}</div>
          </div>
          {streak > 0 && (
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "#000" }}>روز پیوسته</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>{toFa(streak)}</div>
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
            <div style={{ fontSize: 12, color: "#000", marginTop: 2 }}>ببین چه کردی →</div>
          </button>
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        {[
          { label: "واکنش قدیمی", value: reactions.old,    color: "#e74c3c" },
          { label: "مکث",          value: reactions.paused, color: "#f39c12" },
          { label: "پاسخ جدید",    value: reactions.new,    color: "#27ae60" }
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>{r.label}</span>
              <span>{toFa(r.value)}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              <ProgressBar value={r.value} max={Math.max(10, total)} color={r.color} />
            </div>
          </div>
        ))}
      </Card>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={onCalendar} style={styles.dashBtn}>📅 تقویم</button>
        <button onClick={onWins} style={styles.dashBtn}>⭐ لحظه‌های من</button>
      </div>

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
 * Quick
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
              }} style={styles.quickOptBtn}>{p.name}</button>
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
            الان چه چیزی را واقعاً می‌دانم؟<br />و چه چیزی را فقط حدس می‌زنم؟
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
            <button onClick={() => save("new")} style={{
              ...styles.quickOptBtn,
              background: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)",
              color: "#fff", borderColor: "#178a7c"
            }}>امتحان جدید</button>
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
 * Break Cycle
 * ========================================================= */

function BreakCycleView({ onBack, onSOS }) {
  return (
    <Shell title="چطور چرخه را بشکنم" onBack={onBack} showSOS onSOS={onSOS}>
      <Card>
        <p style={{ margin: 0, fontSize: 14, color: "#000", lineHeight: 1.9 }}>
          هر بار که این ۶ قدم را طی کنی، مغزت یاد می‌گیرد که لازم نیست همیشه واکنش قدیمی را اجرا کند.
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
    </Shell>
  );
}

/* =========================================================
 * App
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
  const [searchReturnTo, setSearchReturnTo] = useState("welcome");
  let screen = null;

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
      return { schemaId: r.schemaId, name: schema?.name_plain || r.name };
    });
  }, [analysis]);

  const go = (v) => setView(v);
  const openSOS = () => { setReturnTo(view); go("sos"); };
  const openSearch = () => { setSearchReturnTo(view); go("search"); };
  const openOrigin = (schemaId, from) => {
    setOriginSchemaId(schemaId);
    setReturnFromOrigin(from);
    go("origin");
  };

  if (view === "loading") {
    screen = (
      <div style={styles.app}>
        <p style={{ textAlign: "center", padding: 40 }}>در حال بارگذاری...</p>
      </div>
    );
  }

  if (view === "checkin") {
    screen = (
      <CheckInView analysis={analysis}
        onDone={() => go(analysis ? "profile" : "welcome")}
        onSkip={() => go(analysis ? "profile" : "welcome")} />
    );
  }

  if (view === "sos") {
    screen = <SOSView onBack={() => go(returnTo)} onBetter={() => go(returnTo)} />;
  }

  if (view === "welcome") {
  screen = (
    <WelcomeView
      analysis={analysis}
      hasProfile={!!analysis}
      onStart={() => go("ysq")} onSkipToProfile={() => go("profile")}
      onSOS={openSOS}
      onSituations={() => go("situations")}
      onRelationships={() => go("relationships")}
      onLifeCycles={() => go("life_cycles")}
      onAcceptance={() => go("acceptance")} />
  );
}

  if (view === "ysq") {
    screen = (
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
  screen = (
    <ProfileView analysis={analysis}
      onBack={() => go("welcome")} onRetake={() => go("ysq")}
      onWins={() => go("wins")} onCalendar={() => go("calendar")}
      onSOS={openSOS} onSituations={() => go("situations")}
      onRelationships={() => go("relationships")}
      onLifeCycles={() => go("life_cycles")}
      onAcceptance={() => go("acceptance")}
      onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }}
      onPickOrigin={(id) => openOrigin(id, "profile")} />
  );
}

  if (view === "origin" && originSchemaId) {
    screen = <OriginView schemaId={originSchemaId}
      onBack={() => go(returnFromOrigin)}
      onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }}
      onSOS={openSOS} />;
  }

  if (view === "life_cycles") {
    screen = (
      <LifeCyclesView
        onBack={() => go(analysis ? "profile" : "welcome")}
        onSOS={openSOS}
        onPickCycle={(id) => { setActiveLifeCycleId(id); go("life_cycle_detail"); }} />
    );
  }

  if (view === "life_cycle_detail" && activeLifeCycleId) {
    screen = (
      <LifeCycleDetailView
        cycleId={activeLifeCycleId}
        onBack={() => go("life_cycles")}
        onSOS={openSOS}
        onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }} />
    );
  }

  if (view === "cycle" && activeSchemaId) {
    screen = (
      <CycleView schemaId={activeSchemaId}
        onBack={() => go("profile")}
        onDone={(sel) => { setSelection(sel); go("cycle_summary"); }} />
    );
  }

  if (view === "cycle_summary" && selection) {
    screen = (
      <CycleSummaryView schemaId={activeSchemaId} selection={selection}
        onBack={() => go("cycle")} onContinue={() => go("exercise")}
        onViewOrigin={() => openOrigin(activeSchemaId, "cycle_summary")} />
    );
  }

  if (view === "exercise") {
    screen = (
      <ExerciseView schemaId={activeSchemaId} selection={selection}
        onBack={() => go("cycle_summary")}
        onDone={(record) => { setExerciseRecord(record || null); go("mission"); }} />
    );
  }

  if (view === "mission") {
    screen = (
      <MissionView schemaId={activeSchemaId}
        onBack={() => go("exercise")}
        onDone={(mission) => { setMissionRecord(mission); go("log"); }} />
    );
  }

  if (view === "log") {
    screen = (
      <LogResultView schemaId={activeSchemaId} selection={selection}
        onBack={() => go("mission")}
        onDone={async (log) => {
          const primaryTriggerId  = (selection.triggerIds  || [])[0] || null;
          const primaryThoughtId  = (selection.thoughtIds  || [])[0] || null;
          const primaryEmotionId  = (selection.emotionIds  || [])[0] || null;
          const primaryBehaviorId = (selection.behaviorIds || [])[0] || null;
          await recordCycle({
            schemaId: activeSchemaId,
            triggerId: primaryTriggerId, thoughtId: primaryThoughtId,
            emotionId: primaryEmotionId, behaviorId: primaryBehaviorId,
            triggerIds: selection.triggerIds, thoughtIds: selection.thoughtIds,
            emotionIds: selection.emotionIds, behaviorIds: selection.behaviorIds,
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
    screen = (
      <ProgressView schemaId={activeSchemaId}
        onBack={() => go("profile")} onQuick={() => go("quick")}
        onWins={() => go("wins")} onCalendar={() => go("calendar")}
        onSOS={openSOS} />
    );
  }

  if (view === "wins") {
    screen = <WinsView onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS} />;
  }

  if (view === "calendar") {
    screen = <CalendarView onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS} />;
  }

  if (view === "situations") {
    screen = (
      <SituationsView onBack={() => go(analysis ? "profile" : "welcome")}
        onSOS={openSOS}
        onPickSituation={(id) => { setActiveSituationId(id); go("situation_detail"); }} />
    );
  }

  if (view === "situation_detail" && activeSituationId) {
    screen = (
      <SituationDetailView situationId={activeSituationId}
        onBack={() => go("situations")} onSOS={openSOS}
        onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }} />
    );
  }

  if (view === "relationships") {
    screen = (
      <RelationshipsView analysis={analysis}
        onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS}
        onPickPattern={(id) => { setActivePatternId(id); go("relationship_detail"); }}
        onPickResponseGuide={(id) => { setActiveGuideSchemaId(id); go("response_guide"); }} />
    );
  }

  if (view === "relationship_detail" && activePatternId) {
    screen = (
      <RelationshipDetailView patternId={activePatternId}
        onBack={() => go("relationships")}
        onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }}
        onSOS={openSOS} />
    );
  }

  if (view === "response_guide" && activeGuideSchemaId) {
    screen = (
      <ResponseGuideView schemaId={activeGuideSchemaId}
        onBack={() => go("relationships")} onSOS={openSOS} />
    );
  }

  if (view === "break_cycle") {
    screen = <BreakCycleView onBack={() => go(analysis ? "profile" : "welcome")} onSOS={openSOS} />;
  }
  if (view === "acceptance") {
  screen = (
    <AcceptanceView
      onBack={() => go(analysis ? "profile" : "welcome")}
      onSOS={openSOS} />
  );
}

  if (view === "quick") {
    screen = (
      <QuickCheckView
        profiles={profiles.length ? profiles : SCHEMAS.slice(0, 5).map((s) => ({
          schemaId: s.id, name: s.name_plain || s.name_fa
        }))}
        onBack={() => go("welcome")}
        onDone={() => go("progress")} />
    );
  }

  if (view === "search") {
    screen = (
      <SearchView
        onBack={() => go(searchReturnTo)}
        onPickSchema={(id) => { setActiveSchemaId(id); go("cycle"); }}
        onPickOrigin={(id) => openOrigin(id, "search")}
        onPickSituation={(id) => { setActiveSituationId(id); go("situation_detail"); }}
        onPickCycle={(id) => { setActiveLifeCycleId(id); go("life_cycle_detail"); }}
        onPickPattern={(id) => { setActivePatternId(id); go("relationship_detail"); }} />
    );
  }

  if (!screen) {
    screen = <p style={{ padding: 20 }}>وضعیت ناشناخته: {view}</p>;
  }

  return (
    <SearchContext.Provider value={openSearch}>
      {screen}
    </SearchContext.Provider>
  );
}

/* =========================================================
 * استایل‌ها
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
  searchHeaderBtn: {
    width: 32, height: 32, borderRadius: "50%",
    border: "1px solid #eee", background: "#fff",
    fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit"
  },
  searchInput: {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1px solid #e5e5e5", background: "#fff",
    fontSize: 14, fontFamily: "inherit", boxSizing: "border-box",
    marginBottom: 16
  },
  searchResultBtn: {
    display: "flex", alignItems: "center", gap: 10, width: "100%",
    padding: "14px 14px", marginBottom: 8, borderRadius: 12,
    border: "1px solid #f0f0f0", background: "#fff",
    cursor: "pointer", fontFamily: "inherit", textAlign: "right"
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
