// YSQ_QUESTIONS.js
// نسخه 2.0 — هم‌راستا با SCHEMAS.js v2.0
// ۹۰ سؤال — ۱۸ طرحواره × ۵ سؤال
// مقیاس ۶ نقطه‌ای — بدون تشخیص بالینی

/* =========================================================
 * ۱. مقیاس پاسخ
 * ========================================================= */

export const LIKERT_SCALE = [
  { value: 1, label: "کاملاً مخالفم" },
  { value: 2, label: "مخالفم" },
  { value: 3, label: "تا حدی مخالفم" },
  { value: 4, label: "تا حدی موافقم" },
  { value: 5, label: "موافقم" },
  { value: 6, label: "کاملاً موافقم" }
];

/* =========================================================
 * ۲. بانک سؤالات — ۹۰ سؤال
 * ========================================================= */

export const YSQ_QUESTIONS = [
  // ---------------- 1. رهاشدگی ----------------
  { id: "ab_1", schemaId: "abandonment", text: "نگرانم که افراد مهم زندگی‌ام به‌زودی ترکم کنند." },
  { id: "ab_2", schemaId: "abandonment", text: "وقتی کسی دیر جواب می‌دهد، فوراً به این فکر می‌کنم که دیگر نمی‌خواهد من را." },
  { id: "ab_3", schemaId: "abandonment", text: "احساس می‌کنم روابطم شکننده‌اند و ممکن است هر لحظه تمام شوند." },
  { id: "ab_4", schemaId: "abandonment", text: "برای اینکه کسی را از دست ندهم، بیش از حد به او وابسته می‌شوم." },
  { id: "ab_5", schemaId: "abandonment", text: "وقتی کسی از من فاصله می‌گیرد، احساس می‌کنم در حال از دست دادن او هستم." },

  // ---------------- 2. بی‌اعتمادی / بدرفتاری ----------------
  { id: "mi_1", schemaId: "mistrust_abuse", text: "به نیت دیگران اعتماد نمی‌کنم، حتی وقتی مهربان هستند." },
  { id: "mi_2", schemaId: "mistrust_abuse", text: "احساس می‌کنم اگر خودم را نشان دهم، ممکن است از من سوءاستفاده شود." },
  { id: "mi_3", schemaId: "mistrust_abuse", text: "معمولاً نیت دیگران را زیر سؤال می‌برم." },
  { id: "mi_4", schemaId: "mistrust_abuse", text: "حتی وقتی کسی خوبی می‌کند، به دنبال دلیل پنهانی می‌گردم." },
  { id: "mi_5", schemaId: "mistrust_abuse", text: "احساس می‌کنم اگر حواسم نباشد، دیگران به من ضربه می‌زنند." },

  // ---------------- 3. محرومیت هیجانی ----------------
  { id: "ed_1", schemaId: "emotional_deprivation", text: "احساس می‌کنم هیچ‌کس واقعاً نیازهای هیجانی من را نمی‌فهمد." },
  { id: "ed_2", schemaId: "emotional_deprivation", text: "در روابط نزدیک، باز هم احساس تنهایی می‌کنم." },
  { id: "ed_3", schemaId: "emotional_deprivation", text: "احساس می‌کنم کسی نیست که واقعاً به من اهمیت بدهد." },
  { id: "ed_4", schemaId: "emotional_deprivation", text: "دوست دارم کسی مرا عمیقاً درک کند، ولی فکر نمی‌کنم این اتفاق بیفتد." },
  { id: "ed_5", schemaId: "emotional_deprivation", text: "معمولاً احساس پوچی و کمبود عاطفی دارم." },

  // ---------------- 4. نقص / شرم ----------------
  { id: "de_1", schemaId: "defectiveness_shame", text: "احساس می‌کنم در من چیزی معیوب یا ناقص وجود دارد." },
  { id: "de_2", schemaId: "defectiveness_shame", text: "اگر دیگران واقعی من را ببینند، من را ترک می‌کنند." },
  { id: "de_3", schemaId: "defectiveness_shame", text: "بیشتر وقت‌ها احساس شرم از خودم دارم." },
  { id: "de_4", schemaId: "defectiveness_shame", text: "احساس می‌کنم ارزش دوست داشته شدن را ندارم." },
  { id: "de_5", schemaId: "defectiveness_shame", text: "خودم را درونی معیوب و ناکافی می‌دانم." },

  // ---------------- 5. انزوای اجتماعی ----------------
  { id: "si_1", schemaId: "social_isolation", text: "احساس می‌کنم با اطرافیانم متفاوت هستم و به آن‌ها تعلق ندارم." },
  { id: "si_2", schemaId: "social_isolation", text: "در جمع‌ها احساس بیگانگی می‌کنم." },
  { id: "si_3", schemaId: "social_isolation", text: "احساس می‌کنم هیچ‌جا جای من نیست." },
  { id: "si_4", schemaId: "social_isolation", text: "احساس می‌کنم دیگران چیزی دارند که من ندارم." },
  { id: "si_5", schemaId: "social_isolation", text: "معمولاً خودم را از گروه‌ها کنار می‌کشم." },

  // ---------------- 6. وابستگی / بی‌کفایتی ----------------
  { id: "dp_1", schemaId: "dependence_incompetence", text: "در تصمیم‌گیری‌های روزمره به کمک دیگران نیاز دارم." },
  { id: "dp_2", schemaId: "dependence_incompetence", text: "احساس می‌کنم بدون کمک دیگران نمی‌توانم از عهده کارها بربیایم." },
  { id: "dp_3", schemaId: "dependence_incompetence", text: "وقتی باید کاری را تنها انجام دهم، مضطرب می‌شوم." },
  { id: "dp_4", schemaId: "dependence_incompetence", text: "تصمیم‌های مهم زندگی‌ام را به دیگران می‌سپارم." },
  { id: "dp_5", schemaId: "dependence_incompetence", text: "احساس می‌کنم به‌تنهایی توانمند نیستم." },

  // ---------------- 7. آسیب‌پذیری ----------------
  { id: "vu_1", schemaId: "vulnerability", text: "نگرانم که فاجعه‌ای (جسمی، مالی، روانی) در راه باشد." },
  { id: "vu_2", schemaId: "vulnerability", text: "مدام نگران سلامتی خودم یا عزیزانم هستم." },
  { id: "vu_3", schemaId: "vulnerability", text: "احساس می‌کنم اتفاقات بد غیرقابل پیش‌بینی ممکن است هر لحظه بیفتد." },
  { id: "vu_4", schemaId: "vulnerability", text: "وقتی شرایط نامطمئن است، به بدترین حالت فکر می‌کنم." },
  { id: "vu_5", schemaId: "vulnerability", text: "احساس می‌کنم در برابر حوادث آینده بی‌دفاع هستم." },

  // ---------------- 8. درهم‌تنیدگی ----------------
  { id: "en_1", schemaId: "enmeshment", text: "حال من خیلی وابسته به حال افراد نزدیکم است." },
  { id: "en_2", schemaId: "enmeshment", text: "بدون افراد مهم زندگی‌ام احساس گم‌شدگی می‌کنم." },
  { id: "en_3", schemaId: "enmeshment", text: "نمی‌توانم از نظر هیجانی از دیگران جدا باشم." },
  { id: "en_4", schemaId: "enmeshment", text: "نظر دیگران مهم‌تر از نظر خودم برای من است." },
  { id: "en_5", schemaId: "enmeshment", text: "خودم را بیشتر از طریق دیگران می‌شناسم تا مستقل." },

  // ---------------- 9. شکست ----------------
  { id: "fa_1", schemaId: "failure", text: "احساس می‌کنم در مقایسه با دیگران شکست خورده‌ام." },
  { id: "fa_2", schemaId: "failure", text: "وقتی چالشی پیش می‌آید، پیش‌بینی می‌کنم شکست بخورم." },
  { id: "fa_3", schemaId: "failure", text: "احساس می‌کنم به‌اندازه کافی توانمند نیستم." },
  { id: "fa_4", schemaId: "failure", text: "خودم را عقب‌تر از هم‌سن و سال‌هایم می‌بینم." },
  { id: "fa_5", schemaId: "failure", text: "کارها را به‌خاطر ترس از شکست، عقب می‌اندازم." },

  // ---------------- 10. استحقاق ----------------
  { id: "et_1", schemaId: "entitlement", text: "احساس می‌کنم قوانین برای من متفاوت است." },
  { id: "et_2", schemaId: "entitlement", text: "وقتی چیزی طبق میل من پیش نمی‌رود، عصبانی می‌شوم." },
  { id: "et_3", schemaId: "entitlement", text: "احساس می‌کنم لایق چیزهای بیشتری هستم." },
  { id: "et_4", schemaId: "entitlement", text: "وقتی کسی من را اولویت اول قرار نمی‌دهد، برمی‌آشوبم." },
  { id: "et_5", schemaId: "entitlement", text: "به‌سختی می‌توانم محدودیت‌ها را بپذیرم." },

  // ---------------- 11. خویشتن‌داری ناکافی ----------------
  { id: "sc_1", schemaId: "insufficient_self_control", text: "در کنترل تکانه‌هایم ضعیف هستم." },
  { id: "sc_2", schemaId: "insufficient_self_control", text: "کارها را همیشه به بعد موکول می‌کنم." },
  { id: "sc_3", schemaId: "insufficient_self_control", text: "وقتی ناراحت یا حوصله‌ام سر می‌رود، نمی‌توانم تحمل کنم." },
  { id: "sc_4", schemaId: "insufficient_self_control", text: "به‌سختی می‌توانم به برنامه یا تعهد پایبند بمانم." },
  { id: "sc_5", schemaId: "insufficient_self_control", text: "احساساتم سریع به رفتار تبدیل می‌شوند." },

  // ---------------- 12. اطاعت / تسلیم ----------------
  { id: "su_1", schemaId: "subjugation", text: "احساساتم را پنهان می‌کنم تا کسی ناراحت نشود." },
  { id: "su_2", schemaId: "subjugation", text: "معمولاً به خواسته دیگران تسلیم می‌شوم." },
  { id: "su_3", schemaId: "subjugation", text: "احساس می‌کنم حق ندارم مخالفت کنم." },
  { id: "su_4", schemaId: "subjugation", text: "از ترس عواقب، نظر خودم را نمی‌گویم." },
  { id: "su_5", schemaId: "subjugation", text: "بعد از تسلیم شدن، درونم دلخور و پر از خشم می‌شوم." },

  // ---------------- 13. ایثار ----------------
  { id: "ss_1", schemaId: "self_sacrifice", text: "نیازهای دیگران را همیشه بر نیازهای خودم مقدم می‌کنم." },
  { id: "ss_2", schemaId: "self_sacrifice", text: "اگر کمک نکنم، احساس گناه می‌کنم." },
  { id: "ss_3", schemaId: "self_sacrifice", text: "به‌سختی می‌توانم به کسی «نه» بگویم." },
  { id: "ss_4", schemaId: "self_sacrifice", text: "خودم را برای خوشحالی دیگران فدا می‌کنم." },
  { id: "ss_5", schemaId: "self_sacrifice", text: "احساس می‌کنم مسئول حال خوب دیگران هستم." },

  // ---------------- 14. تأییدطلبی ----------------
  { id: "ap_1", schemaId: "approval_seeking", text: "نظر دیگران درباره من برایم بسیار مهم است." },
  { id: "ap_2", schemaId: "approval_seeking", text: "برای جلب توجه یا تحسین، کارهایی می‌کنم که واقعاً نمی‌خواهم." },
  { id: "ap_3", schemaId: "approval_seeking", text: "اگر کسی از من تعریف نکند، احساس بی‌ارزشی می‌کنم." },
  { id: "ap_4", schemaId: "approval_seeking", text: "بیشتر وقت‌ها نگرانم که دیگران درباره من چه فکری می‌کنند." },
  { id: "ap_5", schemaId: "approval_seeking", text: "خودم را با معیار تأیید دیگران می‌سنجم." },

  // ---------------- 15. منفی‌گرایی ----------------
  { id: "ne_1", schemaId: "negativity", text: "معمولاً به جنبه‌های منفی هر موقعیت تمرکز می‌کنم." },
  { id: "ne_2", schemaId: "negativity", text: "وقتی اتفاق خوبی می‌افتد، نگرانم که دوام نیاورد." },
  { id: "ne_3", schemaId: "negativity", text: "انتظار بدترین نتیجه را دارم." },
  { id: "ne_4", schemaId: "negativity", text: "احساس می‌کنم چیزهای خوب در زندگی‌ام زودگذر هستند." },
  { id: "ne_5", schemaId: "negativity", text: "معمولاً بیشتر بر اشتباهات و مشکلات تمرکز می‌کنم تا موفقیت‌ها." },

  // ---------------- 16. بازداری هیجانی ----------------
  { id: "ei_1", schemaId: "emotional_inhibition", text: "احساساتم را نشان نمی‌دهم چون فکر می‌کنم ضعف است." },
  { id: "ei_2", schemaId: "emotional_inhibition", text: "به‌سختی می‌توانم از احساساتم حرف بزنم." },
  { id: "ei_3", schemaId: "emotional_inhibition", text: "خشم یا ناراحتی‌ام را سرکوب می‌کنم." },
  { id: "ei_4", schemaId: "emotional_inhibition", text: "وقتی احساساتم بالا می‌آید، سرد و منطقی می‌شوم." },
  { id: "ei_5", schemaId: "emotional_inhibition", text: "احساس می‌کنم احساساتم برای دیگران سربار است." },

  // ---------------- 17. معیارهای سختگیرانه ----------------
  { id: "us_1", schemaId: "unrelenting_standards", text: "هیچ‌وقت از کار خودم راضی نیستم، حتی وقتی خوب انجام شده." },
  { id: "us_2", schemaId: "unrelenting_standards", text: "احساس می‌کنم همیشه باید سخت‌تر تلاش کنم." },
  { id: "us_3", schemaId: "unrelenting_standards", text: "استراحت کردن را اتلاف وقت می‌دانم." },
  { id: "us_4", schemaId: "unrelenting_standards", text: "استانداردهای من از توان واقعی‌ام بالاتر است." },
  { id: "us_5", schemaId: "unrelenting_standards", text: "کار را تا وقتی کامل نباشد، تحویل نمی‌دهم." },

  // ---------------- 18. تنبیه‌گری ----------------
  { id: "pu_1", schemaId: "punitiveness", text: "وقتی اشتباه می‌کنم، خودم را شدیداً سرزنش می‌کنم." },
  { id: "pu_2", schemaId: "punitiveness", text: "احساس می‌کنم اشتباهاتم بخشیدنی نیستند." },
  { id: "pu_3", schemaId: "punitiveness", text: "با کسانی که اشتباه می‌کنند، سرد و سختگیر می‌شوم." },
  { id: "pu_4", schemaId: "punitiveness", text: "احساس می‌کنم افراد باید به‌خاطر اشتباهاتشان عواقب سختی ببینند." },
  { id: "pu_5", schemaId: "punitiveness", text: "به‌سختی می‌توانم خودم یا دیگران را ببخشم." }
];

/* =========================================================
 * ۳. متادیتای طرحواره — هم‌راستا با SCHEMAS.js
 * ========================================================= */

export const SCHEMA_META = {
  abandonment:               { name: "رهاشدگی / بی‌ثباتی",         domain: "disconnection_rejection" },
  mistrust_abuse:            { name: "بی‌اعتمادی / بدرفتاری",       domain: "disconnection_rejection" },
  emotional_deprivation:     { name: "محرومیت هیجانی",              domain: "disconnection_rejection" },
  defectiveness_shame:       { name: "نقص / شرم",                  domain: "disconnection_rejection" },
  social_isolation:          { name: "انزوای اجتماعی / بیگانگی",    domain: "disconnection_rejection" },
  dependence_incompetence:   { name: "وابستگی / بی‌کفایتی",         domain: "impaired_autonomy" },
  vulnerability:             { name: "آسیب‌پذیری نسبت به خطر",      domain: "impaired_autonomy" },
  enmeshment:                { name: "درهم‌تنیدگی / خود تحول‌نیافته", domain: "impaired_autonomy" },
  failure:                   { name: "شکست",                        domain: "impaired_autonomy" },
  entitlement:               { name: "استحقاق / بزرگ‌منشی",         domain: "impaired_limits" },
  insufficient_self_control: { name: "خویشتن‌داری ناکافی",          domain: "impaired_limits" },
  subjugation:               { name: "اطاعت / تسلیم",              domain: "other_directedness" },
  self_sacrifice:            { name: "ایثار",                       domain: "other_directedness" },
  approval_seeking:          { name: "تأییدطلبی / جلب توجه",        domain: "other_directedness" },
  negativity:                { name: "منفی‌گرایی / بدبینی",         domain: "overvigilance_inhibition" },
  emotional_inhibition:      { name: "بازداری هیجانی",              domain: "overvigilance_inhibition" },
  unrelenting_standards:     { name: "معیارهای سختگیرانه / بیش‌انتظاری", domain: "overvigilance_inhibition" },
  punitiveness:              { name: "تنبیه‌گری",                   domain: "overvigilance_inhibition" }
};

/* =========================================================
 * ۴. محاسبه امتیاز هر طرحواره
 * ========================================================= */

export function computeSchemaScores(answers) {
  const grouped = {};
  for (const q of YSQ_QUESTIONS) {
    if (!grouped[q.schemaId]) grouped[q.schemaId] = [];
    const val = answers[q.id];
    if (typeof val === "number" && val >= 1 && val <= 6) {
      grouped[q.schemaId].push(val);
    }
  }

  const results = [];
  for (const [schemaId, values] of Object.entries(grouped)) {
    if (values.length === 0) continue;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const percentage = Math.round(((mean - 1) / 5) * 100);
    const elevatedCount = values.filter((v) => v >= 4).length;

    results.push({
      schemaId,
      name: SCHEMA_META[schemaId]?.name || schemaId,
      domain: SCHEMA_META[schemaId]?.domain || "unknown",
      mean: Number(mean.toFixed(2)),
      percentage,
      answered: values.length,
      total: 5,
      elevatedCount
    });
  }

  results.sort((a, b) => b.percentage - a.percentage);
  return results;
}

/* =========================================================
 * ۵. آستانه‌ها و اولویت
 * ========================================================= */

export const PRIORITY_LEVELS = [
  { min: 70, level: "high",   label: "بالا",   emoji: "🔴", color: "#e74c3c" },
  { min: 40, level: "medium", label: "متوسط", emoji: "🟠", color: "#f39c12" },
  { min: 0,  level: "low",    label: "پایین", emoji: "🟢", color: "#27ae60" }
];

export function getPriority(percentage) {
  for (const p of PRIORITY_LEVELS) if (percentage >= p.min) return p;
  return PRIORITY_LEVELS[PRIORITY_LEVELS.length - 1];
}

export function enrichWithPriority(results) {
  return results.map((r) => ({ ...r, priority: getPriority(r.percentage) }));
}

/* =========================================================
 * ۶. تحلیل کامل پاسخ‌ها
 * ========================================================= */

export function analyzeYSQ(answers) {
  const raw = computeSchemaScores(answers);
  const enriched = enrichWithPriority(raw);

  const top = enriched.filter((r) => r.priority.level === "high");
  const medium = enriched.filter((r) => r.priority.level === "medium");
  const low = enriched.filter((r) => r.priority.level === "low");

  return {
    all: enriched,
    high: top,
    medium,
    low,
    active: [...top, ...medium],
    recommended: top[0] || medium[0] || enriched[0] || null,
    answeredCount: Object.keys(answers).length,
    totalCount: YSQ_QUESTIONS.length
  };
}

/* =========================================================
 * ۷. اعتبارسنجی
 * ========================================================= */

export function validateAnswers(answers) {
  const missing = [];
  for (const q of YSQ_QUESTIONS) {
    const v = answers[q.id];
    if (typeof v !== "number" || v < 1 || v > 6) missing.push(q.id);
  }
  return {
    valid: missing.length === 0,
    missing,
    progress: Math.round(((YSQ_QUESTIONS.length - missing.length) / YSQ_QUESTIONS.length) * 100)
  };
}

export function isComplete(answers) {
  return validateAnswers(answers).valid;
}

/* =========================================================
 * ۸. خروجی قابل ذخیره
 * ========================================================= */

export function buildResultPayload(answers, { userId = null } = {}) {
  const analysis = analyzeYSQ(answers);
  return {
    version: "2.0",
    completedAt: new Date().toISOString(),
    userId,
    answers: { ...answers },
    scores: analysis.all.map((r) => ({
      schemaId: r.schemaId,
      percentage: r.percentage,
      mean: r.mean,
      priority: r.priority.level,
      elevatedCount: r.elevatedCount
    })),
    recommendedSchemaId: analysis.recommended?.schemaId || null
  };
}
