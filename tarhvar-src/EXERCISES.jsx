// EXERCISES.jsx
// نسخه 2.0 — هم‌راستا با SCHEMAS.js v2.0
// ۷ نوع تمرین: two_column, three_column, timer, single_choice, single_input, reflection, list
// React (web) — بدون کتابخانه خارجی

import React, { useState, useEffect } from "react";

/* =========================================================
 * ۱. متادیتای انواع تمرین — منطق مستقل از UI
 * ========================================================= */

export const EXERCISE_TYPES = {
  two_column: {
    id: "two_column",
    label: "دو ستونه",
    initState: (ex) => ({
      columns: (ex.columns || []).map((c) => ({ key: c.key, items: [""] })),
      answer: null,
      note: ""
    }),
    isComplete: (s) => {
      const hasAny = s.columns.some((c) => c.items.some((t) => t.trim().length > 0));
      return hasAny && s.answer !== null;
    },
    serialize: (s) => ({ columns: s.columns, answer: s.answer, note: s.note })
  },

  three_column: {
    id: "three_column",
    label: "سه ستونه",
    initState: (ex) => ({
      columns: (ex.columns || []).map((c) => ({ key: c.key, items: [""] })),
      note: ""
    }),
    isComplete: (s) =>
      s.columns.every((c) => c.items.some((t) => t.trim().length > 0)),
    serialize: (s) => ({ columns: s.columns, note: s.note })
  },

  timer: {
    id: "timer",
    label: "مکث زمان‌دار",
    initState: (ex) => ({
      remaining: ex.durationSeconds || 600,
      running: false,
      finished: false
    }),
    isComplete: (s) => s.finished,
    serialize: (s) => ({
      finished: true,
      finishedAt: new Date().toISOString()
    })
  },

  single_choice: {
    id: "single_choice",
    label: "انتخاب تک",
    initState: () => ({ choice: null, note: "" }),
    isComplete: (s) => s.choice !== null,
    serialize: (s) => ({ choice: s.choice, note: s.note })
  },

  single_input: {
    id: "single_input",
    label: "پاسخ کوتاه",
    initState: () => ({ text: "", note: "" }),
    isComplete: (s) => s.text.trim().length >= 2,
    serialize: (s) => ({ text: s.text.trim(), note: s.note })
  },

  reflection: {
    id: "reflection",
    label: "تأمل",
    initState: (ex) => ({
      answers: (ex.prompts || []).map(() => ""),
      note: ""
    }),
    isComplete: (s) => s.answers.every((a) => a.trim().length >= 2),
    serialize: (s) => ({ answers: s.answers.map((a) => a.trim()), note: s.note })
  },

  list: {
    id: "list",
    label: "فهرست",
    initState: () => ({ items: ["", "", ""], note: "" }),
    isComplete: (s) => s.items.filter((i) => i.trim().length >= 2).length >= 2,
    serialize: (s) => ({
      items: s.items.map((i) => i.trim()).filter(Boolean),
      note: s.note
    })
  }
};

/* =========================================================
 * ۲. کمک‌کننده‌ها
 * ========================================================= */

export function findExercise(schema, exerciseId) {
  if (!schema) return null;
  return (schema.exercises || []).find((e) => e.id === exerciseId) || null;
}

// ruleText مثل: "showExercise:reality_vs_assumption"
export function resolveExerciseFromRule(schema, ruleText) {
  if (!ruleText || !ruleText.startsWith("showExercise:")) return null;
  const id = ruleText.split(":")[1];
  return findExercise(schema, id);
}

/* =========================================================
 * ۳. کامپوننت‌های پایه
 * ========================================================= */

function ExerciseShell({ title, subtitle, children, footer, dir = "rtl" }) {
  return (
    <div
      dir={dir}
      style={{
        fontFamily: "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
        maxWidth: 520,
        margin: "0 auto",
        padding: 20,
        background: "#fafafa",
        borderRadius: 16,
        color: "#222"
      }}
    >
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>{title}</h2>
      {subtitle && (
        <p style={{ margin: "0 0 16px", color: "#666", fontSize: 14 }}>{subtitle}</p>
      )}
      {children}
      {footer && <div style={{ marginTop: 20 }}>{footer}</div>}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "14px 20px",
        borderRadius: 12,
        border: "none",
        background: disabled ? "#ccc" : "#111",
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit"
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px 20px",
        borderRadius: 12,
        border: "1px solid #ddd",
        background: "#fff",
        color: "#333",
        fontSize: 14,
        cursor: "pointer",
        marginTop: 8,
        fontFamily: "inherit"
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>{label}</div>
      )}
      {children}
    </div>
  );
}

const textareaStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  fontFamily: "inherit",
  fontSize: 13,
  resize: "vertical",
  boxSizing: "border-box"
};

/* =========================================================
 * ۴. دو ستونه — «واقعیت یا برداشت؟»
 * ========================================================= */

function TwoColumnExercise({ exercise, state, setState }) {
  const updateItem = (colIdx, itemIdx, value) => {
    const next = {
      ...state,
      columns: state.columns.map((c) => ({ ...c, items: [...c.items] }))
    };
    next.columns[colIdx].items[itemIdx] = value;
    setState(next);
  };

  const addItem = (colIdx) => {
    const next = {
      ...state,
      columns: state.columns.map((c) => ({ ...c, items: [...c.items] }))
    };
    next.columns[colIdx].items.push("");
    setState(next);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {state.columns.map((col, ci) => {
          const meta = (exercise.columns || []).find((c) => c.key === col.key);
          return (
            <div key={col.key}>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>
                {meta?.label}
              </div>
              {col.items.map((item, ii) => (
                <textarea
                  key={ii}
                  value={item}
                  onChange={(e) => updateItem(ci, ii, e.target.value)}
                  rows={2}
                  style={{ ...textareaStyle, marginBottom: 6 }}
                />
              ))}
              <button
                onClick={() => addItem(ci)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#666",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit"
                }}
              >
                + افزودن
              </button>
            </div>
          );
        })}
      </div>

      {exercise.question && (
        <Field label={exercise.question}>
          <div style={{ display: "flex", gap: 8 }}>
            {(exercise.answers || []).map((ans) => (
              <button
                key={ans}
                onClick={() => setState({ ...state, answer: ans })}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: state.answer === ans ? "2px solid #111" : "1px solid #ddd",
                  background: state.answer === ans ? "#111" : "#fff",
                  color: state.answer === ans ? "#fff" : "#333",
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit"
                }}
              >
                {ans}
              </button>
            ))}
          </div>
        </Field>
      )}

      {exercise.ifNo && state.answer === "خیر" && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            background: "#eef7ee",
            borderRadius: 10,
            color: "#1b5e20",
            fontSize: 14
          }}
        >
          {exercise.ifNo}
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * ۵. سه ستونه — «بررسی شواهد»
 * ========================================================= */

function ThreeColumnExercise({ exercise, state, setState }) {
  const updateItem = (colIdx, itemIdx, value) => {
    const next = {
      ...state,
      columns: state.columns.map((c) => ({ ...c, items: [...c.items] }))
    };
    next.columns[colIdx].items[itemIdx] = value;
    setState(next);
  };

  const addItem = (colIdx) => {
    const next = {
      ...state,
      columns: state.columns.map((c) => ({ ...c, items: [...c.items] }))
    };
    next.columns[colIdx].items.push("");
    setState(next);
  };

  return (
    <div>
      {state.columns.map((col, ci) => {
        const meta = (exercise.columns || []).find((c) => c.key === col.key);
        return (
          <Field key={col.key} label={meta?.label}>
            {col.items.map((item, ii) => (
              <textarea
                key={ii}
                value={item}
                onChange={(e) => updateItem(ci, ii, e.target.value)}
                rows={2}
                style={{ ...textareaStyle, marginBottom: 6 }}
              />
            ))}
            <button
              onClick={() => addItem(ci)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit"
              }}
            >
              + افزودن
            </button>
          </Field>
        );
      })}
    </div>
  );
}

/* =========================================================
 * ۶. تایمر — «مکث»
 * ========================================================= */

function TimerExercise({ exercise, state, setState }) {
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.remaining <= 1) {
          clearInterval(id);
          return { ...prev, remaining: 0, running: false, finished: true };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.running, setState]);

  const mm = String(Math.floor(state.remaining / 60)).padStart(2, "0");
  const ss = String(state.remaining % 60).padStart(2, "0");
  const total = exercise.durationSeconds || 600;
  const progress = 1 - state.remaining / total;
  const circumference = 2 * Math.PI * 52;

  return (
    <div style={{ textAlign: "center" }}>
      {exercise.description && (
        <p style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>
          {exercise.description}
        </p>
      )}

      <div
        style={{
          position: "relative",
          margin: "10px auto 20px",
          width: 220,
          height: 220
        }}
      >
        <svg viewBox="0 0 120 120" width={220} height={220}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="#eee" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#111"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 34,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums"
          }}
        >
          {mm}:{ss}
        </div>
      </div>

      {!state.finished ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setState({ ...state, running: !state.running })}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #111",
              background: state.running ? "#fff" : "#111",
              color: state.running ? "#111" : "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit"
            }}
          >
            {state.running ? "توقف" : "شروع"}
          </button>
          <button
            onClick={() =>
              setState({
                ...state,
                remaining: total,
                running: false,
                finished: false
              })
            }
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit"
            }}
          >
            بازنشانی
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: 14,
            background: "#eef7ee",
            borderRadius: 10,
            color: "#1b5e20",
            fontSize: 14
          }}
        >
          ✓ زمان مکث تمام شد. حالا می‌توانی ادامه دهی.
        </div>
      )}
    </div>
  );
}

/* =========================================================
 * ۷. انتخاب تک
 * ========================================================= */

function SingleChoiceExercise({ exercise, state, setState }) {
  return (
    <div>
      {exercise.question && (
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
          {exercise.question}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {(exercise.options || []).map((opt) => (
          <button
            key={opt}
            onClick={() => setState({ ...state, choice: opt })}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: state.choice === opt ? "2px solid #111" : "1px solid #ddd",
              background: state.choice === opt ? "#111" : "#fff",
              color: state.choice === opt ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: 14,
              textAlign: "right",
              fontFamily: "inherit"
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
 * ۸. پاسخ کوتاه
 * ========================================================= */

function SingleInputExercise({ exercise, state, setState }) {
  return (
    <Field label={exercise.question}>
      <textarea
        value={state.text}
        onChange={(e) => setState({ ...state, text: e.target.value })}
        rows={3}
        placeholder="اینجا بنویس..."
        style={textareaStyle}
      />
    </Field>
  );
}

/* =========================================================
 * ۹. تأمل
 * ========================================================= */

function ReflectionExercise({ exercise, state, setState }) {
  const update = (idx, value) => {
    const next = [...state.answers];
    next[idx] = value;
    setState({ ...state, answers: next });
  };

  return (
    <div>
      {(exercise.prompts || []).map((p, i) => (
        <Field key={i} label={`${i + 1}. ${p}`}>
          <textarea
            value={state.answers[i] || ""}
            onChange={(e) => update(i, e.target.value)}
            rows={2}
            style={textareaStyle}
          />
        </Field>
      ))}
    </div>
  );
}

/* =========================================================
 * ۱۰. فهرست
 * ========================================================= */

function ListExercise({ exercise, state, setState }) {
  const update = (idx, value) => {
    const next = [...state.items];
    next[idx] = value;
    setState({ ...state, items: next });
  };

  const addItem = () => setState({ ...state, items: [...state.items, ""] });

  return (
    <div>
      {exercise.prompt && (
        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
          {exercise.prompt}
        </div>
      )}
      {state.items.map((item, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
        >
          <span style={{ color: "#888", fontSize: 13, minWidth: 18 }}>{i + 1}.</span>
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ddd",
              fontFamily: "inherit",
              fontSize: 14
            }}
          />
        </div>
      ))}
      <button
        onClick={addItem}
        style={{
          background: "none",
          border: "none",
          color: "#666",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginTop: 4,
          fontFamily: "inherit"
        }}
      >
        + افزودن مورد
      </button>
    </div>
  );
}

/* =========================================================
 * ۱۱. نگاشت نوع → کامپوننت
 * ========================================================= */

const COMPONENTS = {
  two_column: TwoColumnExercise,
  three_column: ThreeColumnExercise,
  timer: TimerExercise,
  single_choice: SingleChoiceExercise,
  single_input: SingleInputExercise,
  reflection: ReflectionExercise,
  list: ListExercise
};

/* =========================================================
 * ۱۲. رندرر اصلی
 * ========================================================= */

function ExerciseRendererInner({ exercise, onComplete, onSkip }) {
  const typeMeta = EXERCISE_TYPES[exercise?.type];

  if (!typeMeta) {
    return (
      <ExerciseShell title="تمرین ناشناخته">
        <p style={{ color: "#c00" }}>
          نوع تمرین پشتیبانی نمی‌شود: {exercise?.type}
        </p>
      </ExerciseShell>
    );
  }

  const [state, setState] = useState(() => typeMeta.initState(exercise));
  const Component = COMPONENTS[exercise.type];
  const complete = typeMeta.isComplete(state);

  const handleComplete = () => {
    if (!complete) return;
    onComplete?.({
      exerciseId: exercise.id,
      type: exercise.type,
      completedAt: new Date().toISOString(),
      result: typeMeta.serialize(state)
    });
  };

  return (
    <ExerciseShell
      title={exercise.title}
      subtitle={exercise.description}
      footer={
        <>
          <PrimaryButton onClick={handleComplete} disabled={!complete}>
            ✓ انجام دادم
          </PrimaryButton>
          {onSkip && <GhostButton onClick={onSkip}>فعلاً رد کن</GhostButton>}
        </>
      }
    >
      {Component && (
        <Component exercise={exercise} state={state} setState={setState} />
      )}
    </ExerciseShell>
  );
}

export function ExerciseRenderer(props) {
  return <ExerciseRendererInner key={props.exercise?.id} {...props} />;
}
