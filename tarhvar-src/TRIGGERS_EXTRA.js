// TRIGGERS_EXTRA.js
// نسخه 1.0 — تریگرهای اضافی برای گسترش بخش «چه چیزی این الگو را فعال می‌کند؟»

export const TRIGGERS_EXTRA = {
  abandonment: [
    { id: "seen_online", text: "کسی آنلاین است ولی جواب نمی‌دهد" },
    { id: "no_goodnight", text: "پیام شب‌بخیر نیامد" },
    { id: "busy_friend", text: "دوستم سرش شلوغ است و وقت نمی‌دهد" },
    { id: "partner_tired", text: "طرف مقابلم خسته است و سرد به نظر می‌رسد" },
    { id: "family_late", text: "خانواده دیر جواب می‌دهند" }
  ],
  mistrust_abuse: [
    { id: "phone_hidden", text: "کسی گوشی‌اش را پنهان می‌کند" },
    { id: "late_at_night", text: "کسی دیر وقت بیرون است" },
    { id: "new_friend", text: "طرف مقابل دوست جدید پیدا کرده" },
    { id: "vague_answer", text: "جواب‌های مبهم می‌شنوم" },
    { id: "changed_password", text: "پسورد عوض شده" }
  ],
  emotional_deprivation: [
    { id: "no_question", text: "کسی از حالم نمی‌پرسد" },
    { id: "talked_but_ignored", text: "حرف زدم ولی کسی گوش نداد" },
    { id: "silent_dinner", text: "شام خوردیم ولی حرفی نزدیم" },
    { id: "alone_weekend", text: "آخر هفته را تنها گذراندم" },
    { id: "no_hug", text: "هفته‌هاست کسی من را بغل نکرده" }
  ],
  defectiveness_shame: [
    { id: "mirror", text: "خودم را در آینه دیدم" },
    { id: "photo_old", text: "عکس قدیمی دیدم" },
    { id: "someone_praised", text: "کسی از من تعریف کرد و باور نکردم" },
    { id: "mistake_public", text: "در جمع اشتباه کردم" },
    { id: "compared", text: "کسی من را با دیگری مقایسه کرد" }
  ],
  social_isolation: [
    { id: "group_photo", text: "عکس گروهی دیدم که در آن نبودم" },
    { id: "invite_only_couple", text: "دعوت به جمع زوجی خوردم" },
    { id: "quiet_cafe", text: "در کافه تنها نشسته‌ام" },
    { id: "wedding_invite", text: "به عروسی دعوت شدم" },
    { id: "old_friends", text: "دوستای قدیمی دور هم جمع شدند و من نبودم" }
  ],
  dependence_incompetence: [
    { id: "left_alone", text: "تنها موندم" },
    { id: "big_decision", text: "باید تصمیم مهمی بگیرم" },
    { id: "new_task", text: "کار جدید به من سپرده شد" },
    { id: "no_advice", text: "کسی نیست که مشورت کنم" },
    { id: "cook_alone", text: "باید خودم غذا درست کنم" }
  ],
  vulnerability: [
    { id: "news_bad", text: "خبر بدی شنیدم" },
    { id: "body_pain", text: "درد یا علامت جسمی حس کردم" },
    { id: "travel_plan", text: "قرار است سفر بروم" },
    { id: "night_dark", text: "شب است و تنها هستم" },
    { id: "spouse_late", text: "عزیزی دیر به خانه می‌آید" }
  ],
  enmeshment: [
    { id: "family_upset", text: "مادرم یا پدرم ناراحت است" },
    { id: "disagreement", text: "با خانواده اختلاف نظر داشتم" },
    { id: "their_opinion", text: "خانواده نظر متفاوتی دادند" },
    { id: "partner_mood", text: "حال همسرم بد است" },
    { id: "friend_need", text: "دوستی به کمک نیاز دارد" }
  ],
  failure: [
    { id: "colleague_success", text: "موفقیت همکارم را دیدم" },
    { id: "linkedin", text: "پست موفقیت کسی را دیدم" },
    { id: "deadline", text: "مهلت نزدیک است" },
    { id: "exam", text: "باید امتحان بدهم" },
    { id: "task_pending", text: "کار نیمه‌تمام در لیستم مونده" }
  ],
  entitlement: [
    { id: "queue", text: "در صف ایستادم" },
    { id: "no_response", text: "دیر جواب گرفتم" },
    { id: "hearing_no", text: "کسی نه گفت" },
    { id: "waiting_food", text: "غذا دیر رسید" },
    { id: "traffic", text: "در ترافیک موندم" }
  ],
  insufficient_self_control: [
    { id: "phone_notification", text: "نوتیفیکیشن گوشی آمد" },
    { id: "fridge", text: "به یخچال سر زدم" },
    { id: "bored", text: "حوصله‌ام سر رفت" },
    { id: "hard_task", text: "کار سخت باید شروع کنم" },
    { id: "late_night", text: "شب است و باید بخوابم" }
  ],
  subjugation: [
    { id: "boss_request", text: "رئیس درخواست کرد" },
    { id: "family_wants", text: "خانواده خواسته‌ای داشتند" },
    { id: "friend_favor", text: "دوستی از من کاری خواست" },
    { id: "spouse_wants", text: "همسرم نظری داد" },
    { id: "guilt_trip", text: "کسی با احساس گناه تحت فشارم گذاشت" }
  ],
  self_sacrifice: [
    { id: "friend_crisis", text: "دوستی در بحران است" },
    { id: "family_need", text: "خانواده به کمک نیاز دارد" },
    { id: "colleague_help", text: "همکار کمک خواست" },
    { id: "guilt", text: "احساس گناه کردم" },
    { id: "no_one_else", text: "فکر کردم اگر من نکنم، کسی نمی‌کند" }
  ],
  approval_seeking: [
    { id: "posted", text: "چیزی پست کردم و منتظر لایک هستم" },
    { id: "criticism", text: "کسی انتقاد کرد" },
    { id: "no_compliment", text: "کسی تعریف نکرد" },
    { id: "silent_friend", text: "دوستم جواب پیامم را نداد" },
    { id: "social_gathering", text: "در جمعی حاضر شدم" }
  ],
  negativity: [
    { id: "morning_news", text: "صبح خبرهای بد خواندم" },
    { id: "future_plan", text: "به آینده فکر کردم" },
    { id: "weekend_over", text: "آخر هفته تمام شد" },
    { id: "tired", text: "خسته بودم" },
    { id: "bad_weather", text: "هوا بد بود" }
  ],
  emotional_inhibition: [
    { id: "cried", text: "خواستم گریه کنم ولی نکردم" },
    { id: "angry", text: "عصبانی شدم و نگفتم" },
    { id: "love_said", text: "خواستم بگم دوستت دارم ولی نگفتم" },
    { id: "hurt", text: "دلم شکست ولی ساکت موندم" },
    { id: "tired_said", text: "خسته بودم ولی گفتم خوبم" }
  ],
  unrelenting_standards: [
    { id: "work_done", text: "کارم را تمام کردم ولی از خودم راضی نیستم" },
    { id: "colleague_praise", text: "همکارم کارش را تحویل داد" },
    { id: "rest", text: "استراحت کردم" },
    { id: "checked_details", text: "جزئیات را چک کردم" },
    { id: "self_review", text: "کار خودم را بازبینی کردم" }
  ],
  punitiveness: [
    { id: "mistake_mine", text: "اشتباه کردم" },
    { id: "mistake_other", text: "کسی اشتباه کرد" },
    { id: "late", text: "دیر رسیدم" },
    { id: "forgot", text: "چیزی را فراموش کردم" },
    { id: "broken_promise", text: "قولی که داده بودم را نشکستم ولی حس کردم کم گذاشتم" }
  ]
};

// ادغام با SCHEMAS اصلی
export function mergeTriggers(schemas) {
  for (const schema of schemas) {
    const extra = TRIGGERS_EXTRA[schema.id] || [];
    schema.triggers = [...schema.triggers, ...extra];
  }
  return schemas;
}
