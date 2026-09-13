// TRIGGERS_EXTRA.js
// نسخه 2.0 — با Dedup و Idempotent
// نکته: idها با پسوند _xtr از SCHEMAS_ADDITIONS جدا شده‌اند

export const TRIGGERS_EXTRA = {
  abandonment: [
    { id: "busy_friend_xtr", text: "دوستم سرش شلوغ است و وقت نمی‌دهد" },
    { id: "partner_tired_xtr", text: "طرف مقابلم خسته است و سرد به نظر می‌رسد" }
  ],
  mistrust_abuse: [
    { id: "phone_hidden_xtr", text: "کسی گوشی‌اش را پنهان می‌کند" },
    { id: "late_at_night_xtr", text: "کسی دیر وقت بیرون است" }
  ],
  emotional_deprivation: [
    { id: "talked_but_ignored_xtr", text: "حرف زدم ولی کسی گوش نداد" },
    { id: "silent_dinner_xtr", text: "شام خوردیم ولی حرفی نزدیم" }
  ],
  defectiveness_shame: [
    { id: "photo_old_xtr", text: "عکس قدیمی دیدم" },
    { id: "someone_praised_xtr", text: "کسی از من تعریف کرد و باور نکردم" },
    { id: "mistake_public_xtr", text: "در جمع اشتباه کردم" }
  ],
  social_isolation: [
    { id: "invite_only_couple_xtr", text: "دعوت به جمع زوجی خوردم" },
    { id: "old_friends_xtr", text: "دوستای قدیمی دور هم جمع شدند و من نبودم" }
  ],
  dependence_incompetence: [
    { id: "no_advice_xtr", text: "کسی نیست که مشورت کنم" }
  ],
  vulnerability: [
    { id: "night_dark_xtr", text: "شب است و تنها هستم" }
  ],
  enmeshment: [
    { id: "partner_mood_xtr", text: "حال همسرم بد است" }
  ],
  failure: [
    { id: "linkedin_xtr", text: "پست موفقیت کسی را دیدم" }
  ],
  entitlement: [
    { id: "no_response_xtr", text: "دیر جواب گرفتم" },
    { id: "hearing_no_xtr", text: "کسی نه گفت" }
  ],
  insufficient_self_control: [
    { id: "phone_notification_xtr", text: "نوتیفیکیشن گوشی آمد" }
  ],
  subjugation: [
    { id: "guilt_trip_xtr", text: "کسی با احساس گناه تحت فشارم گذاشت" }
  ],
  self_sacrifice: [
    { id: "no_one_else_xtr", text: "فکر کردم اگر من نکنم، کسی نمی‌کند" }
  ],
  approval_seeking: [
    { id: "no_compliment_xtr", text: "کسی تعریف نکرد" }
  ],
  negativity: [
    { id: "bad_weather_xtr", text: "هوا بد بود" }
  ],
  emotional_inhibition: [
    { id: "love_said_xtr", text: "خواستم بگم دوستت دارم ولی نگفتم" }
  ],
  unrelenting_standards: [
    { id: "colleague_praise_xtr", text: "همکارم کارش را تحویل داد" }
  ],
  punitiveness: [
    { id: "late_xtr", text: "دیر رسیدم" }
  ]
};

/* =========================================================
 * ابزار کمکی
 * ========================================================= */

function dedupeBy(items) {
  const seenId = new Set();
  const seenText = new Set();
  const result = [];
  for (const item of items) {
    if (!item) continue;
    const idKey = String(item.id || "").trim();
    const textKey = String(item.text || "").trim();
    if (idKey && seenId.has(idKey)) continue;
    if (textKey && seenText.has(textKey)) continue;
    if (idKey) seenId.add(idKey);
    if (textKey) seenText.add(textKey);
    result.push(item);
  }
  return result;
}

const _extendedSchemas = new WeakSet();

export function mergeTriggers(schemas) {
  for (const schema of schemas) {
    if (_extendedSchemas.has(schema)) continue;
    const extra = TRIGGERS_EXTRA[schema.id] || [];
    schema.triggers = dedupeBy([...(schema.triggers || []), ...extra]);
    _extendedSchemas.add(schema);
  }
  return schemas;
}
