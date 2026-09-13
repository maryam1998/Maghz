// PROGRESS.js
// نسخه 3.0 — با قابلیت‌های جدید: لحظه‌های برد، چک‌این روزانه، تقویم
// بدون AI، بدون API

/* =========================================================
 * ۱. لایه ذخیره‌سازی
 * ========================================================= */

let _storage = null;

function defaultStorage() {
  return {
    async get(key) {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    },
    async set(key, value) {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(key, value);
    },
    async remove(key) {
      if (typeof localStorage === "undefined") return;
      localStorage.removeItem(key);
    }
  };
}

export function setStorage(adapter) {
  _storage = adapter;
}

function storage() {
  if (!_storage) _storage = defaultStorage();
  return _storage;
}

const STORAGE_KEY = "ysq_progress_v3";
const CHECKIN_KEY = "ysq_checkins_v1";
const PROFILE_KEY = "ysq_profile_v2";

/* =========================================================
 * ۲. ساختار هر ثبت
 * ========================================================= */

function uid() {
  return "e_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function createEntry(input) {
  return {
    id: uid(),
    schemaId: input.schemaId || null,
    triggerId: input.triggerId || null,
    thoughtId: input.thoughtId || null,
    emotionId: input.emotionId || null,
    behaviorId: input.behaviorId || null,
    reactionType: input.reactionType || null,
    pauseDurationMs: input.pauseDurationMs ?? null,
    exerciseId: input.exerciseId || null,
    exerciseResult: input.exerciseResult || null,
    missionId: input.missionId || null,
    missionDone: !!input.missionDone,
    isWin: !!input.isWin,
    notes: input.notes || "",
    createdAt: new Date().toISOString()
  };
}

/* =========================================================
 * ۳. خواندن / نوشتن
 * ========================================================= */

let _cache = null;

async function load() {
  if (_cache) return _cache;
  const raw = await storage().get(STORAGE_KEY);
  if (!raw) {
    _cache = [];
    return _cache;
  }
  try {
    _cache = JSON.parse(raw);
  } catch {
    _cache = [];
  }
  return _cache;
}

async function save() {
  await storage().set(STORAGE_KEY, JSON.stringify(_cache || []));
}

export async function addEntry(entry) {
  const entries = await load();
  entries.push(entry);
  await save();
  return entry;
}

export async function getEntries(filter = {}) {
  const entries = await load();
  return entries.filter((e) => {
    if (filter.schemaId && e.schemaId !== filter.schemaId) return false;
    if (filter.since && new Date(e.createdAt) < new Date(filter.since)) return false;
    if (filter.until && new Date(e.createdAt) > new Date(filter.until)) return false;
    return true;
  });
}

export async function clearAll() {
  _cache = [];
  await storage().remove(STORAGE_KEY);
}

export async function deleteEntry(id) {
  const entries = await load();
  _cache = entries.filter((e) => e.id !== id);
  await save();
}

/* =========================================================
 * ۴. ابزارهای زمانی
 * ========================================================= */

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day + 1) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function dateKey(d) {
  return startOfDay(d).toISOString().slice(0, 10);
}

/* =========================================================
 * ۵. شمارش‌های پایه
 * ========================================================= */

export function countByReaction(entries) {
  const out = { old: 0, paused: 0, new: 0, unknown: 0 };
  for (const e of entries) {
    if (e.reactionType === "old") out.old++;
    else if (e.reactionType === "paused") out.paused++;
    else if (e.reactionType === "new") out.new++;
    else out.unknown++;
  }
  return out;
}

export function countMissions(entries) {
  const done = entries.filter((e) => e.missionDone).length;
  return { done, total: entries.length };
}

export function activationsByDay(entries, days = 14) {
  const today = startOfDay();
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets[dateKey(d)] = 0;
  }
  for (const e of entries) {
    const k = dateKey(new Date(e.createdAt));
    if (k in buckets) buckets[k]++;
  }
  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export function topByFrequency(entries, key, limit = 3) {
  const counts = {};
  for (const e of entries) {
    const v = e[key];
    if (!v) continue;
    counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/* =========================================================
 * ۶. streak
 * ========================================================= */

export function currentStreak(entries, today = new Date()) {
  if (!entries.length) return 0;
  const days = new Set(entries.map((e) => dateKey(new Date(e.createdAt))));

  let streak = 0;
  const cursor = startOfDay(today);
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* =========================================================
 * ۷. آمار به تفکیک طرحواره
 * ========================================================= */

export function summarizeBySchema(entries, schemaId) {
  const filtered = entries.filter((e) => e.schemaId === schemaId);
  const reactions = countByReaction(filtered);
  const missions = countMissions(filtered);

  const total = filtered.length;
  const progressRate = total === 0
    ? 0
    : Math.round(((reactions.paused + reactions.new) / total) * 100);

  return {
    schemaId,
    totalActivations: total,
    oldReactions: reactions.old,
    pauses: reactions.paused,
    newResponses: reactions.new,
    unknown: reactions.unknown,
    missionsDone: missions.done,
    progressRate,
    topTriggers: topByFrequency(filtered, "triggerId", 3),
    topBehaviors: topByFrequency(filtered, "behaviorId", 3)
  };
}

/* =========================================================
 * ۸. مقایسه هفتگی
 * ========================================================= */

export function weeklyComparison(entries) {
  const thisWeekStart = startOfWeek();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeek = entries.filter((e) => new Date(e.createdAt) >= thisWeekStart);
  const lastWeek = entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d >= lastWeekStart && d < thisWeekStart;
  });

  const r1 = countByReaction(thisWeek);
  const r0 = countByReaction(lastWeek);

  return {
    thisWeek: {
      total: thisWeek.length,
      old: r1.old,
      paused: r1.paused,
      new: r1.new,
      missions: thisWeek.filter((e) => e.missionDone).length
    },
    lastWeek: {
      total: lastWeek.length,
      old: r0.old,
      paused: r0.paused,
      new: r0.new,
      missions: lastWeek.filter((e) => e.missionDone).length
    }
  };
}

/* =========================================================
 * ۹. اعداد فارسی
 * ========================================================= */

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
export function toFa(n) {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[+d]);
}

const _idLabelCache = {};
export function registerIdLabels(map) {
  Object.assign(_idLabelCache, map);
}
function humanizeId(id) {
  return _idLabelCache[id] || id;
}

/* =========================================================
 * ۱۰. موتور بینش
 * ========================================================= */

export function generateInsights(entries, { schemaId = null } = {}) {
  const scoped = schemaId ? entries.filter((e) => e.schemaId === schemaId) : entries;
  const insights = [];

  if (scoped.length === 0) {
    insights.push({ kind: "empty", text: "هنوز چیزی ثبت نشده. اولین قدم را بردار." });
    return insights;
  }

  const reactions = countByReaction(scoped);
  const streak = currentStreak(scoped);
  const comp = weeklyComparison(entries);

  if (comp.thisWeek.total > 0) {
    insights.push({
      kind: "count",
      text: `این هفته ${toFa(comp.thisWeek.total)} بار متوجه الگوی خودت شدی.`
    });
  }

  if (reactions.paused > 0) {
    insights.push({
      kind: "pause",
      text: `تا حالا ${toFa(reactions.paused)} بار قبل از واکنش مکث کردی.`
    });
  }

  if (reactions.new > 0) {
    insights.push({
      kind: "new",
      text: `${toFa(reactions.new)} بار پاسخ جدید را امتحان کردی. این یعنی تغییر واقعی.`
    });
  }

  if (comp.lastWeek.total > 0) {
    const delta = comp.thisWeek.total - comp.lastWeek.total;
    if (delta > 0) {
      insights.push({
        kind: "trend_up",
        text: `این هفته ${toFa(delta)} بار بیشتر از هفته قبل متوجه الگو شدی.`
      });
    } else if (delta < 0) {
      insights.push({
        kind: "trend_down",
        text: `این هفته ${toFa(Math.abs(delta))} بار کمتر از هفته قبل الگو فعال شد.`
      });
    }
  }

  if (comp.lastWeek.old > 0 && comp.thisWeek.old < comp.lastWeek.old) {
    const diff = comp.lastWeek.old - comp.thisWeek.old;
    insights.push({
      kind: "old_reduced",
      text: `رفتار قدیمی ${toFa(diff)} بار کمتر از هفته قبل ظاهر شد.`
    });
  }

  if (streak >= 3) {
    insights.push({
      kind: "streak",
      text: `${toFa(streak)} روز پیوسته است که روی این الگو کار می‌کنی.`
    });
  }

  const triggers = topByFrequency(scoped, "triggerId", 1);
  if (triggers[0] && triggers[0].count >= 3) {
    insights.push({
      kind: "top_trigger",
      text: `پرتکرارترین فعال‌کننده تو تا حالا «${humanizeId(triggers[0].id)}» بوده.`
    });
  }

  const behaviors = topByFrequency(scoped, "behaviorId", 1);
  if (behaviors[0] && behaviors[0].count >= 3) {
    insights.push({
      kind: "top_behavior",
      text: `بیشترین واکنش قدیمی تو «${humanizeId(behaviors[0].id)}» بوده.`
    });
  }

  if (reactions.old > 0 && reactions.new + reactions.paused > reactions.old) {
    insights.push({
      kind: "winning",
      text: "بیشتر از نیمی از مواقع، قبل از واکنش قدیمی توقف کردی."
    });
  }

  return insights;
}

/* =========================================================
 * ۱۱. لحظه‌های برد (WINS)
 * ========================================================= */

/**
 * یک لحظه برد یعنی:
 * - کاربر مکث کرد
 * - یا پاسخ جدید را امتحان کرد
 * - یا مأموریت را انجام داد
 */
export async function getWins(filter = {}) {
  const entries = await getEntries(filter);
  return entries
    .filter((e) => {
      if (e.reactionType === "paused") return true;
      if (e.reactionType === "new") return true;
      if (e.missionDone) return true;
      if (e.isWin) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function describeWin(entry) {
  if (entry.reactionType === "new") {
    return "پاسخ جدید را امتحان کردی.";
  }
  if (entry.reactionType === "paused") {
    return "قبل از واکنش، مکث کردی.";
  }
  if (entry.missionDone) {
    return "مأموریت را انجام دادی.";
  }
  return "یک قدم کوچک برداشتی.";
}

/* =========================================================
 * ۱۲. چک‌این روزانه
 * ========================================================= */

/**
 * CheckIn {
 *   id: string,
 *   mood: "good" | "meh" | "hard",
 *   schemaId: string|null,
 *   note: string,
 *   createdAt: ISO
 * }
 */

let _checkinCache = null;

async function loadCheckIns() {
  if (_checkinCache) return _checkinCache;
  const raw = await storage().get(CHECKIN_KEY);
  if (!raw) {
    _checkinCache = [];
    return _checkinCache;
  }
  try {
    _checkinCache = JSON.parse(raw);
  } catch {
    _checkinCache = [];
  }
  return _checkinCache;
}

async function saveCheckIns() {
  await storage().set(CHECKIN_KEY, JSON.stringify(_checkinCache || []));
}

export async function addCheckIn(input) {
  const list = await loadCheckIns();
  const entry = {
    id: uid(),
    mood: input.mood || "meh",
    schemaId: input.schemaId || null,
    note: input.note || "",
    createdAt: new Date().toISOString()
  };
  list.push(entry);
  await saveCheckIns();
  return entry;
}

export async function getCheckIns(filter = {}) {
  const list = await loadCheckIns();
  return list.filter((c) => {
    if (filter.since && new Date(c.createdAt) < new Date(filter.since)) return false;
    return true;
  });
}

export async function hasCheckedInToday() {
  const list = await loadCheckIns();
  const today = dateKey(new Date());
  return list.some((c) => dateKey(new Date(c.createdAt)) === today);
}

export async function getTodayCheckIn() {
  const list = await loadCheckIns();
  const today = dateKey(new Date());
  return list.find((c) => dateKey(new Date(c.createdAt)) === today) || null;
}

/* =========================================================
 * ۱۳. داده تقویم
 * ========================================================= */

/**
 * برای هر روز از N روز اخیر:
 * - وضعیت: "good" | "meh" | "hard" | "none"
 * - تعداد فعال شدن الگو
 */
export async function getCalendarData(days = 30) {
  const entries = await getEntries();
  const checkins = await getCheckIns();

  const today = startOfDay();
  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);

    const dayEntries = entries.filter((e) => dateKey(new Date(e.createdAt)) === key);
    const dayCheckin = checkins.find((c) => dateKey(new Date(c.createdAt)) === key);

    result.push({
      date: key,
      dayNumber: d.getDate(),
      activations: dayEntries.length,
      mood: dayCheckin?.mood || "none",
      hasWin: dayEntries.some(
        (e) => e.reactionType === "paused" || e.reactionType === "new" || e.missionDone
      )
    });
  }

  return result;
}

/* =========================================================
 * ۱۴. خلاصه کامل پیشرفت
 * ========================================================= */

export async function buildProgressSummary(schemaId = null) {
  const entries = await getEntries(schemaId ? { schemaId } : {});

  const reactions = countByReaction(entries);
  const streak = currentStreak(entries);
  const activity = activationsByDay(entries, 14);
  const insights = generateInsights(entries, { schemaId });
  const weekly = weeklyComparison(entries);

  const wins = await getWins(schemaId ? { schemaId } : {});

  return {
    total: entries.length,
    reactions,
    streak,
    activity,
    insights,
    weekly,
    wins: wins.slice(0, 20),
    winsCount: wins.length,
    bySchema: schemaId ? summarizeBySchema(entries, schemaId) : null
  };
}

/* =========================================================
 * ۱۵. Export / Import
 * ========================================================= */

export async function exportJSON() {
  const entries = await load();
  const checkins = await loadCheckIns();
  return JSON.stringify(
    {
      version: 3,
      exportedAt: new Date().toISOString(),
      entries,
      checkins
    },
    null,
    2
  );
}

export async function importJSON(json) {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.entries)) throw new Error("bad format");
    _cache = parsed.entries;
    await save();
    if (Array.isArray(parsed.checkins)) {
      _checkinCache = parsed.checkins;
      await saveCheckIns();
    }
    return { ok: true, count: parsed.entries.length };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/* =========================================================
 * ۱۶. ثبت چرخه
 * ========================================================= */

export async function recordCycle(input) {
  const entry = createEntry(input);
  await addEntry(entry);
  return entry;
}

/* =========================================================
 * ۱۷. ذخیره پروفایل YSQ
 * ========================================================= */

export async function saveProfile(analysis) {
  await storage().set(PROFILE_KEY, JSON.stringify(analysis));
}

export async function loadProfile() {
  const raw = await storage().get(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function clearProfile() {
  await storage().remove(PROFILE_KEY);
}
