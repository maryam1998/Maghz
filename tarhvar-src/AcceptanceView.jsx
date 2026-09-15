// AcceptanceView.jsx
// نسخه 1.0 — کامپوننت پذیرش آنچه انتخاب نکردم
import React, { useState } from "react";
import {
  ACCEPTANCE_INTRO,
  ACCEPTANCE_DISTINCTIONS,
  ACCEPTANCE_WHY_ME,
  ACCEPTANCE_COMPARISON,
  ACCEPTANCE_DETERMINISM,
  ACCEPTANCE_WITH_FAMILY,
  ACCEPTANCE_STAGES,
  ACCEPTANCE_METAPHOR,
  ACCEPTANCE_SELF_TALK
} from "./ACCEPTANCE";

const C = { primary: "#1a3d2c", grad: "linear-gradient(135deg, #0a3d38 0%, #0f5b53 52%, #178a7c 100%)" };

function Shell({ children, title, onBack, onSOS }) {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Vazirmatn', Tahoma, sans-serif", paddingBottom: 80 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#fff", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 10 }}>
        {onBack ? <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #eee", background: "#fff", fontSize: 16, cursor: "pointer" }}>→</button> : <div style={{ width: 32 }} />}
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        {onSOS ? <button onClick={onSOS} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e74c3c", background: "#fff", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>SOS</button> : <div style={{ width: 32 }} />}
      </header>
      <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>{children}</main>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ padding: 16, borderRadius: 14, background: "#fff", border: "1px solid #f0f0f0", marginBottom: 12, ...style }}>{children}</div>;
}

function SectionTitle({ icon, title, color = "#000" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color }}>{title}</div>
    </div>
  );
}

const STAGE_COLORS = { 1: "#3b82f6", 2: "#8b5cf6", 3: "#f59e0b", 4: "#10b981", 5: "#ec4899", 6: "#0891b2" };
const faNum = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

export default function AcceptanceView({ onBack, onSOS }) {
  const [phase, setPhase] = useState("intro");
  const [stageIdx, setStageIdx] = useState(null);
  const [talkCategory, setTalkCategory] = useState("when_angry");

  /* -------------------- INTRO -------------------- */
  if (phase === "intro") {
    return (
      <Shell title="پذیرش" onBack={onBack} onSOS={onSOS}>
        <Card style={{ background: C.grad, color: "#fff", padding: 22 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🕊️</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, lineHeight: 1.5 }}>{ACCEPTANCE_INTRO.title}</div>
          <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.9, marginBottom: 12 }}>{ACCEPTANCE_INTRO.subtitle}</div>
          <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.95, padding: 12, background: "rgba(255,255,255,.08)", borderRadius: 10 }}>{ACCEPTANCE_INTRO.shortDescription}</div>
        </Card>

        <Card style={{ background: "#eef4ff", border: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.9, fontWeight: 600 }}>💙 {ACCEPTANCE_INTRO.coreTruth}</div>
        </Card>

        <Card>
          <SectionTitle icon="🔍" title="آیا این جمله‌ها برایت آشناست؟" />
          {ACCEPTANCE_INTRO.isThisYou.map((line, i) => (
            <div key={i} style={{ fontSize: 13.5, lineHeight: 1.9, color: "#000", padding: "8px 12px", marginBottom: 6, background: "#fafafa", borderRadius: 8, borderRight: "3px solid #e5e5e5" }}>«{line}»</div>
          ))}
        </Card>

        <Card>
          <button onClick={() => setPhase("metaphor")} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>🪢 استعاره‌ی طناب — ببین پذیرش چیه</button>
          <button onClick={() => setPhase("distinctions")} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #e5e5e5", background: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🧭 پذیرش چیست و چه چیزی نیست</button>
        </Card>
      </Shell>
    );
  }

  /* -------------------- METAPHOR -------------------- */
  if (phase === "metaphor") {
    return (
      <Shell title="استعاره‌ی طناب" onBack={() => setPhase("intro")} onSOS={onSOS}>
        <Card style={{ background: C.grad, color: "#fff", padding: 22 }}>
          <div style={{ fontSize: 40, marginBottom: 10, textAlign: "center" }}>🪢</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, textAlign: "center" }}>{ACCEPTANCE_METAPHOR.title}</div>
          <div style={{ fontSize: 14, lineHeight: 2.1, whiteSpace: "pre-line", opacity: 0.95 }}>{ACCEPTANCE_METAPHOR.body}</div>
        </Card>

        <Card style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
          <div style={{ fontSize: 14, lineHeight: 1.95, color: "#065f46", fontWeight: 600 }}>💡 {ACCEPTANCE_METAPHOR.takeaway}</div>
        </Card>

        <button onClick={() => setPhase("distinctions")} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>بعدی →</button>
      </Shell>
    );
  }

  /* -------------------- DISTINCTIONS -------------------- */
  if (phase === "distinctions") {
    return (
      <Shell title="پذیرش چیست و چه چیزی نیست" onBack={() => setPhase("intro")} onSOS={onSOS}>
        <Card style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.9 }}>💡 خیلی‌ها نمی‌توانند بپذیرند چون فکر می‌کنند «پذیرش = تسلیم = تأیید». این‌ها کاملاً متفاوتند.</div>
        </Card>

        {ACCEPTANCE_DISTINCTIONS.map((d) => (
          <Card key={d.id}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#000", marginBottom: 12 }}>{d.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.9, color: "#065f46", marginBottom: 8, padding: "10px 12px", background: "#ecfdf5", borderRadius: 8, borderRight: "3px solid #10b981" }}>
              <strong>هست:</strong> {d.whatItIs}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.9, color: "#991b1b", marginBottom: 8, padding: "10px 12px", background: "#fef2f2", borderRadius: 8, borderRight: "3px solid #ef4444" }}>
              <strong>نیست:</strong> {d.whatItIsNot}
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "#000", padding: "10px 12px", background: "#fafafa", borderRadius: 8 }}>
              <strong>مثال:</strong> {d.example}
            </div>
          </Card>
        ))}

        <button onClick={() => setPhase("whyMe")} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>بعدی — سؤال «چرا من؟» →</button>
      </Shell>
    );
  }

  /* -------------------- WHY ME -------------------- */
  if (phase === "whyMe") {
    const w = ACCEPTANCE_WHY_ME;
    return (
      <Shell title="چرا من؟" onBack={() => setPhase("distinctions")} onSOS={onSOS}>
        <Card style={{ background: C.grad, color: "#fff", padding: 22 }}>
          <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>❓</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>{w.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 2, opacity: 0.95 }}>{w.explanation}</div>
        </Card>

        {w.threeTruths.map((t, i) => (
          <Card key={i}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 8 }}>{faNum(i + 1)}. {t.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.95, color: "#000" }}>{t.body}</div>
          </Card>
        ))}

        <Card style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
          <SectionTitle icon="🔄" title="جابه‌جایی سؤال" color="#6b21a8" />
          <div style={{ fontSize: 13, lineHeight: 1.9, color: "#991b1b", padding: "10px 12px", background: "#fef2f2", borderRadius: 8, marginBottom: 8 }}>
            <strong>از:</strong> {w.replacementQuestion.from}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.9, color: "#065f46", padding: "10px 12px", background: "#ecfdf5", borderRadius: 8, marginBottom: 10 }}>
            <strong>به:</strong> {w.replacementQuestion.to}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.9, color: "#000", fontStyle: "italic" }}>{w.replacementQuestion.note}</div>
        </Card>

        <button onClick={() => setPhase("comparison")} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>بعدی — مقایسه با دیگران →</button>
      </Shell>
    );
  }

  /* -------------------- COMPARISON -------------------- */
  if (phase === "comparison") {
    const c = ACCEPTANCE_COMPARISON;
    return (
      <Shell title="مقایسه با دیگران" onBack={() => setPhase("whyMe")} onSOS={onSOS}>
        <Card style={{ background: C.grad, color: "#fff", padding: 22 }}>
          <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>⚖️</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>{c.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 2, opacity: 0.95 }}>{c.explanation}</div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <Card style={{ background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 8 }}>می‌بینی</div>
            {c.whatYouSee.map((x, i) => (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.7, color: "#000", marginBottom: 4 }}>• {x}</div>
            ))}
          </Card>
          <Card style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", marginBottom: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46", marginBottom: 8 }}>نمی‌بینی</div>
            {c.whatYouDontSee.map((x, i) => (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.7, color: "#000", marginBottom: 4 }}>• {x}</div>
            ))}
          </Card>
        </div>

        <Card style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
          <SectionTitle icon="🔑" title="سه یادآوری" color="#92400e" />
          {c.threeReminders.map((r, i) => (
            <div key={i} style={{ fontSize: 13.5, lineHeight: 1.9, color: "#000", marginBottom: 8, paddingRight: 10, borderRight: "3px solid #f59e0b" }}>• {r}</div>
          ))}
        </Card>

        <Card style={{ background: "#ecfeff", border: "1px solid #a5f3fc" }}>
          <SectionTitle icon="🔧" title={c.replacementMove.title} color="#155e75" />
          {c.replacementMove.steps.map((s, i) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.9, color: "#000", marginBottom: 6 }}>{faNum(i + 1)}. {s}</div>
          ))}
        </Card>

        <button onClick={() => setPhase("determinism")} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>بعدی — جبر و اختیار →</button>
      </Shell>
    );
  }

  /* -------------------- DETERMINISM -------------------- */
  if (phase === "determinism") {
    const d = ACCEPTANCE_DETERMINISM;
    return (
      <Shell title="جبر و اختیار" onBack={() => setPhase("comparison")} onSOS={onSOS}>
        <Card style={{ background: C.grad, color: "#fff", padding: 22 }}>
          <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>⚙️</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>{d.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 2, opacity: 0.95 }}>{d.explanation}</div>
        </Card>

        {d.layers.map((l, i) => (
          <Card key={i}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 10 }}>{l.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {l.items.map((it, j) => (
                <div key={j} style={{ fontSize: 12, padding: "6px 12px", background: "#f0f7f4", color: "#1a3d2c", borderRadius: 20, fontWeight: 500 }}>{it}</div>
              ))}
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.9, color: "#000", padding: "10px 12px", background: "#fafafa", borderRadius: 8, borderRight: "3px solid #1a3d2c", fontStyle: "italic" }}>{l.truth}</div>
          </Card>
        ))}

        <Card style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
          <SectionTitle icon="🏠" title="اگر هنوز با پدرت زندگی می‌کنی" color="#92400e" />
          <div style={{ fontSize: 13.5, lineHeight: 1.95, color: "#000" }}>{d.aboutLivingWithFather}</div>
        </Card>

        <Card style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
          <div style={{ fontSize: 14, lineHeight: 1.95, color: "#6b21a8", fontWeight: 700, textAlign: "center" }}>❓ {d.keyQuestion}</div>
        </Card>

        <button onClick={() => setPhase("withFamily")} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>بعدی — زندگی با خانواده‌ای که درک نمی‌کند →</button>
      </Shell>
    );
  }

  /* -------------------- WITH FAMILY -------------------- */
  if (phase === "withFamily") {
    const w = ACCEPTANCE_WITH_FAMILY;
    return (
      <Shell title="زندگی با خانواده‌ای که درک نمی‌کند" onBack={() => setPhase("determinism")} onSOS={onSOS}>
        <Card style={{ background: C.grad, color: "#fff", padding: 22 }}>
          <div style={{ fontSize: 36, marginBottom: 10, textAlign: "center" }}>🏠</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>{w.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: 2, opacity: 0.95 }}>{w.coreTruth}</div>
        </Card>

        {w.strategies.map((s, i) => (
          <Card key={s.id}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#000", marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.95, color: "#000" }}>{s.body}</div>
          </Card>
        ))}

        <Card style={{ background: "#f3e8ff" }}>
          <SectionTitle icon="🗣️" title="جمله‌هایی که می‌توانی به خودت بگویی" color="#6b21a8" />
          {w.keyPhrases.map((p, i) => (
            <div key={i} style={{ fontSize: 13.5, lineHeight: 1.9, color: "#000", padding: "10px 14px", marginBottom: 8, background: "#fff", borderRadius: 8, borderRight: "3px solid #8b5cf6", fontStyle: "italic" }}>«{p}»</div>
          ))}
        </Card>

        <button onClick={() => setPhase("stages")} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>بعدی — ۶ مرحله‌ی پذیرش →</button>
      </Shell>
    );
  }

  /* -------------------- STAGES LIST -------------------- */
  if (phase === "stages" && stageIdx === null) {
    return (
      <Shell title="۶ مرحله‌ی پذیرش" onBack={() => setPhase("withFamily")} onSOS={onSOS}>
        <Card style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.9 }}>💡 نمی‌شود از مرحله‌ی ۱ پرید به مرحله‌ی ۶. هر مرحله زمان می‌خواهد. سوگ، مرحله‌ی حیاتی است که اکثر آدم‌ها ردش می‌کنند — چون فکر می‌کنند ضعف است.</div>
        </Card>

        {ACCEPTANCE_STAGES.map((st) => (
          <button key={st.id} onClick={() => setStageIdx(st.num - 1)} style={{ display: "block", width: "100%", textAlign: "right", padding: 18, marginBottom: 10, borderRadius: 14, border: "1px solid #f0f0f0", background: "#fff", cursor: "pointer", fontFamily: "inherit", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 4, height: "100%", background: STAGE_COLORS[st.num] }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: STAGE_COLORS[st.num], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{faNum(st.num)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#000", marginBottom: 4 }}>{st.title}</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.7 }}>{st.purpose}</div>
              </div>
              <span style={{ fontSize: 16, color: "#ccc" }}>←</span>
            </div>
          </button>
        ))}

        <button onClick={() => setPhase("selfTalk")} style={{ width: "100%", padding: 14, borderRadius: 12, border: "1px solid #e5e5e5", background: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>🗣️ جمله‌های تسکین‌دهنده</button>
      </Shell>
    );
  }

  /* -------------------- STAGE DETAIL -------------------- */
  if (phase === "stages" && stageIdx !== null) {
    const st = ACCEPTANCE_STAGES[stageIdx];
    const color = STAGE_COLORS[st.num];
    return (
      <Shell title={`مرحله ${faNum(st.num)}`} onBack={() => setStageIdx(null)} onSOS={onSOS}>
        <Card style={{ background: C.grad, color: "#fff", padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}>{faNum(st.num)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4 }}>{st.title}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.9, opacity: 0.95, padding: 12, background: "rgba(255,255,255,.08)", borderRadius: 10 }}>{st.purpose}</div>
        </Card>

        <Card style={{ background: "#eef4ff", border: "1px solid #bfdbfe" }}>
          <SectionTitle icon="💡" title="چرا این مرحله مهمه؟" color="#1e40af" />
          <div style={{ fontSize: 13.5, lineHeight: 1.95, color: "#000" }}>{st.why}</div>
        </Card>

        <Card>
          <SectionTitle icon="👣" title="قدم‌های عملی" />
          {st.steps.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{faNum(i + 1)}</div>
              <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.9, color: "#000" }}>{s}</div>
            </div>
          ))}
        </Card>

        <Card style={{ background: "#f3e8ff" }}>
          <SectionTitle icon="🗣️" title="به خودت بگو" color="#6b21a8" />
          {st.selfTalk.map((p, i) => (
            <div key={i} style={{ fontSize: 13.5, lineHeight: 1.9, color: "#000", padding: "10px 14px", marginBottom: 6, background: "#fff", borderRadius: 8, borderRight: "3px solid #8b5cf6", fontStyle: "italic" }}>«{p}»</div>
          ))}
        </Card>

        {st.example && (
          <Card style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
            <SectionTitle icon="📌" title="مثال" color="#065f46" />
            <div style={{ fontSize: 13.5, lineHeight: 1.9, color: "#000" }}>{st.example}</div>
          </Card>
        )}

        {st.warning && (
          <Card style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <div style={{ fontSize: 13, lineHeight: 1.9, color: "#991b1b", fontWeight: 600 }}>{st.warning}</div>
          </Card>
        )}

        {st.honestNote && (
          <Card style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 13, lineHeight: 1.9, color: "#92400e", fontWeight: 600 }}>💛 {st.honestNote}</div>
          </Card>
        )}

        {st.reference && (
          <Card style={{ background: "#f6f6f6" }}>
            <div style={{ fontSize: 11, lineHeight: 1.8, color: "#666", fontStyle: "italic" }}>📚 {st.reference}</div>
          </Card>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {stageIdx > 0 && (
            <button onClick={() => setStageIdx(stageIdx - 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid #e5e5e5", background: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>→ مرحله قبل</button>
          )}
          {stageIdx < ACCEPTANCE_STAGES.length - 1 ? (
            <button onClick={() => setStageIdx(stageIdx + 1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>مرحله بعد ←</button>
          ) : (
            <button onClick={() => { setStageIdx(null); setPhase("selfTalk"); }} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>جمله‌های تسکین ←</button>
          )}
        </div>
      </Shell>
    );
  }

  /* -------------------- SELF TALK -------------------- */
  if (phase === "selfTalk") {
    const categories = [
      { id: "when_angry", label: "وقتی عصبانی‌ام", icon: "🔥" },
      { id: "when_grieving", label: "وقتی در سوگم", icon: "💧" },
      { id: "when_stuck_in_why_me", label: "وقتی در «چرا من؟» گیرم", icon: "❓" },
      { id: "when_facing_family", label: "وقتی روبه‌روی خانواده‌ام", icon: "🏠" },
      { id: "when_comparing", label: "وقتی مقایسه می‌کنم", icon: "⚖️" },
      { id: "when_stuck_in_determinism", label: "وقتی در جبر گیرم", icon: "⚙️" },
      { id: "when_feeling_misunderstood", label: "وقتی فهمیده نمی‌شم", icon: "💔" }
    ];
    const phrases = ACCEPTANCE_SELF_TALK[talkCategory] || [];

    return (
      <Shell title="جمله‌های تسکین" onBack={() => setPhase("stages")} onSOS={onSOS}>
        <Card style={{ background: "#fff8e1", border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.9 }}>💡 این جمله‌ها را در لحظه‌های سخت به خودت بگو. با تکرار، مغزت یاد می‌گیرد.</div>
        </Card>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setTalkCategory(c.id)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 20, border: talkCategory === c.id ? "none" : "1px solid #e5e5e5", background: talkCategory === c.id ? C.primary : "#fff", color: talkCategory === c.id ? "#fff" : "#000", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {phrases.map((p, i) => (
          <Card key={i} style={{ background: "#f3e8ff" }}>
            <div style={{ fontSize: 14, lineHeight: 1.95, color: "#000", fontStyle: "italic" }}>«{p}»</div>
          </Card>
        ))}

        <button onClick={onBack} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: C.primary, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}>✓ پایان</button>
      </Shell>
    );
  }

  return null;
}
