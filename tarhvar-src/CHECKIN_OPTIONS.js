// CHECKIN_OPTIONS.js
// نسخه 1.0 — گزینه‌های گسترده برای چک‌این روزانه

export const CHECKIN_GROUPS = [
  {
    id: "connection",
    label: "روابط و ارتباط",
    emoji: "💞",
    schemas: ["abandonment", "mistrust_abuse", "emotional_deprivation", "social_isolation"]
  },
  {
    id: "self_worth",
    label: "ارزش و خود",
    emoji: "🪞",
    schemas: ["defectiveness_shame", "failure", "approval_seeking"]
  },
  {
    id: "control",
    label: "کنترل و امنیت",
    emoji: "🛡️",
    schemas: ["vulnerability", "dependence_incompetence", "enmeshment"]
  },
  {
    id: "boundaries",
    label: "مرزها و تعادل",
    emoji: "⚖️",
    schemas: ["subjugation", "self_sacrifice", "entitlement", "insufficient_self_control"]
  },
  {
    id: "standards",
    label: "انتظارات و سختی",
    emoji: "🎯",
    schemas: ["unrelenting_standards", "punitiveness", "negativity", "emotional_inhibition"]
  }
];

// گزینه‌های اضافی (اگر الگو در گروه‌ها نبود)
export const EXTRA_CHECKIN_OPTIONS = [
  { id: "none", text: "هیچ‌کدام / مطمئن نیستم" },
  { id: "mixed", text: "چند الگو با هم" }
];

// متن کوتاه‌تر و ساده‌تر برای چک‌این
export const SHORT_CHECKIN_NAMES = {
  abandonment: "ترس از ترک شدن",
  mistrust_abuse: "اعتماد نکردن",
  emotional_deprivation: "دیده نشدن",
  defectiveness_shame: "احساس بی‌ارزشی",
  social_isolation: "احساس تنهایی",
  dependence_incompetence: "نمی‌تونم تنها",
  vulnerability: "ترس از بدبختی",
  enmeshment: "قاطی شدن با دیگران",
  failure: "احساس ناتوانی",
  entitlement: "من حق دارم!",
  insufficient_self_control: "نمی‌تونم صبر کنم",
  subjugation: "همیشه بله می‌گم",
  self_sacrifice: "خودم را فراموش می‌کنم",
  approval_seeking: "نیاز به تأیید",
  negativity: "بدبینی",
  emotional_inhibition: "پنهان کردن احساس",
  unrelenting_standards: "کمال‌گرایی",
  punitiveness: "سرزنش خود و دیگران"
};
