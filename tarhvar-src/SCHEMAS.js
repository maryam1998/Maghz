// SCHEMAS.js
// نسخه 2.0 — کامل، ادغام‌شده، بدون AI
// ۱۸ طرحواره — تمام محتوای روان‌شناختی + موتور قوانین

export const SCHEMAS = [
/* ============================================================
 * ۱. رهاشدگی
 * ============================================================ */
{
  id: "abandonment",
  name_fa: "رهاشدگی / بی‌ثباتی",
  name_en: "Abandonment / Instability",
  domain: "disconnection_rejection",
  color: "#e74c3c",

  short_description: "ترس از اینکه افراد مهم زندگی ناگهان بروند، تغییر کنند یا دیگر در دسترس نباشند.",
  core_need: "امنیت عاطفی و احساس ثبات در رابطه",

  triggers: [
    { id: "late_reply",       text: "دیر جواب دادن" },
    { id: "less_attention",   text: "کم شدن توجه" },
    { id: "behavior_change",  text: "تغییر رفتار فرد مقابل" },
    { id: "distance",         text: "فاصله گرفتن" },
    { id: "conflict",         text: "بحث یا اختلاف" },
    { id: "unclear_future",   text: "نامشخص بودن آینده رابطه" }
  ],

  automatic_thoughts: [
    { id: "moving_away",    text: "داره از من دور میشه" },
    { id: "will_leave",     text: "آخرش منو ترک می‌کنه" },
    { id: "not_important",  text: "دیگه براش مهم نیستم" },
    { id: "something_bad",  text: "حتماً اتفاق بدی افتاده" },
    { id: "must_act",       text: "باید کاری کنم که نره" }
  ],

  emotional_signals: [
    { id: "anxiety",    text: "اضطراب" },
    { id: "fear",       text: "ترس" },
    { id: "insecurity", text: "ناامنی" },
    { id: "anger",      text: "خشم" },
    { id: "longing",    text: "دلتنگی" }
  ],

  behavioral_patterns: [
    { id: "repeated_messaging", text: "پیام دادن مکرر" },
    { id: "checking",           text: "چک کردن" },
    { id: "clinging",           text: "چسبیدن" },
    { id: "testing",            text: "آزمودن محبت طرف مقابل" },
    { id: "preemptive_exit",    text: "قطع رابطه پیشگیرانه" }
  ],

  avoidance_patterns: ["وارد نشدن به رابطه", "فاصله گرفتن", "بی‌تفاوت نشان دادن خود"],
  overcompensation_patterns: ["کنترل کردن رابطه", "نیاز شدید به اطمینان گرفتن", "وابستگی شدید"],
  consequences: ["افزایش اضطراب", "فشار روی رابطه", "تفسیر اشتباه رفتار دیگران"],

  pause_questions: [
    "الان چه چیزی را واقعاً می‌دانم؟",
    "چه چیزی فقط برداشت من است؟",
    "آیا این اتفاق حتماً به معنی ترک شدن است؟",
    "اگر الان واکنش نشان ندهم چه می‌شود؟"
  ],

  healthy_response: "تحمل مقدار کمی از عدم قطعیت و بررسی واقعیت قبل از واکنش.",

  replacement_responses: [
    { behaviorId: "repeated_messaging", text: "قبل از ارسال پیام دوم، ۳۰ دقیقه صبر می‌کنم." },
    { behaviorId: "checking",           text: "قبل از چک کردن، از خودم می‌پرسم دنبال چه شواهدی هستم." },
    { behaviorId: "clinging",           text: "فعلاً پیام دیگری نمی‌فرستم و به کار خودم برمی‌گردم." },
    { behaviorId: "testing",            text: "به جای آزمودن، نیازم را مستقیم و آرام بیان می‌کنم." },
    { behaviorId: "preemptive_exit",    text: "قبل از قطع رابطه، سه شاهد واقعی می‌نویسم." }
  ],

  exercises: [
    {
      id: "reality_vs_assumption",
      title: "واقعیت یا برداشت؟",
      type: "two_column",
      columns: [
        { key: "fact",       label: "چیزی که می‌دانم" },
        { key: "assumption", label: "چیزی که حدس می‌زنم" }
      ],
      question: "آیا برای واکنش فوری شواهد کافی دارم؟",
      answers: ["بله", "خیر"],
      ifNo: "فعلاً هیچ اقدامی نمی‌کنم."
    },
    {
      id: "pause_30min",
      title: "مکث ۳۰ دقیقه‌ای",
      type: "timer",
      durationSeconds: 1800,
      description: "قبل از هر واکنشی، ۳۰ دقیقه مکث کن. فقط باش."
    },
    {
      id: "need_expression",
      title: "بیان مستقیم نیاز",
      type: "single_input",
      question: "به جای درخواست اطمینان، جمله‌ای بنویس که نیاز واقعی‌ات را بیان کند."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "قبل از ارسال پیام دوم ۳۰ دقیقه صبر کن." },
    { id: "m2", text: "یک موقعیت مبهم را بدون نتیجه‌گیری ثبت کن." },
    { id: "m3", text: "به جای درخواست اطمینان، یک بار احساس خودت را بیان کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش واکنش فوری" },
    { id: "p2", label: "افزایش تحمل عدم قطعیت" },
    { id: "p3", label: "افزایش استفاده از پاسخ جایگزین" }
  ],

  rules: [
    { when: { trigger: "late_reply",     behavior: "checking" },          then: "showExercise:reality_vs_assumption" },
    { when: { trigger: "distance",       behavior: "clinging" },          then: "showExercise:pause_30min" },
    { when: { trigger: "unclear_future", behavior: "testing" },           then: "showExercise:need_expression" },
    { when: { behavior: "preemptive_exit" },                              then: "showExercise:reality_vs_assumption" },
    { when: { trigger: "late_reply",     behavior: "repeated_messaging" },then: "showExercise:pause_30min" }
  ]
},

/* ============================================================
 * ۲. بی‌اعتمادی / بدرفتاری
 * ============================================================ */
{
  id: "mistrust_abuse",
  name_fa: "بی‌اعتمادی / بدرفتاری",
  name_en: "Mistrust / Abuse",
  domain: "disconnection_rejection",
  color: "#c0392b",

  short_description: "انتظار اینکه دیگران ممکن است آسیب بزنند، سوءاستفاده کنند، فریب دهند یا از اعتماد فرد استفاده کنند.",
  core_need: "امنیت و اعتماد سالم",

  triggers: [
    { id: "ambiguous_behavior", text: "رفتار مبهم" },
    { id: "broken_promise",     text: "قولی که انجام نشده" },
    { id: "lie",                text: "دروغ" },
    { id: "criticism",          text: "انتقاد" },
    { id: "dependence",         text: "وابستگی به دیگران" }
  ],

  automatic_thoughts: [
    { id: "hidden_motive",   text: "حتماً یه چیزی پشتشه" },
    { id: "no_trust",        text: "نباید به کسی اعتماد کنم" },
    { id: "will_get_hurt",   text: "اگر اعتماد کنم ضرر می‌کنم" },
    { id: "will_be_used",    text: "می‌خواد ازم سوءاستفاده کنه" }
  ],

  emotional_signals: [
    { id: "fear",        text: "ترس" },
    { id: "pessimism",   text: "بدبینی" },
    { id: "anger",       text: "خشم" },
    { id: "hyper_vigil", text: "احتیاط شدید" }
  ],

  behavioral_patterns: [
    { id: "interrogation", text: "بازجویی" },
    { id: "testing",       text: "آزمودن دیگران" },
    { id: "controlling",   text: "کنترل" },
    { id: "hiding",        text: "پنهان‌کاری" },
    { id: "distance",      text: "فاصله گرفتن" }
  ],

  avoidance_patterns: ["اعتماد نکردن", "صمیمی نشدن"],
  overcompensation_patterns: ["کنترل دیگران", "حمله قبل از آسیب دیدن", "مشکوک بودن دائمی"],
  consequences: ["کاهش صمیمیت", "تنهایی", "تفسیر تهدیدآمیز رفتارهای خنثی"],

  pause_questions: [
    "چه شواهدی برای خطر دارم؟",
    "آیا این فرد واقعاً همین رفتار را انجام داده؟",
    "آیا تجربه گذشته را روی موقعیت فعلی قرار داده‌ام؟"
  ],

  healthy_response: "اعتماد تدریجی بر اساس رفتار واقعی، نه اعتماد کور یا بی‌اعتمادی مطلق.",

  replacement_responses: [
    { behaviorId: "interrogation", text: "به جای بازجویی، یک سؤال مستقیم و آرام می‌پرسم." },
    { behaviorId: "testing",       text: "به جای آزمودن، انتظار واقعی‌ام را واضح می‌گویم." },
    { behaviorId: "controlling",   text: "یک بار رها می‌کنم و فقط مشاهده می‌کنم." },
    { behaviorId: "hiding",        text: "یک چیز کوچک واقعی از خودم نشان می‌دهم." },
    { behaviorId: "distance",      text: "قبل از فاصله گرفتن، یک گفت‌وگوی مستقیم امتحان می‌کنم." }
  ],

  exercises: [
    {
      id: "evidence_check",
      title: "بررسی شواهد",
      type: "three_column",
      columns: [
        { key: "evidence_for",     label: "شواهد به نفع بدگمانی" },
        { key: "evidence_against", label: "شواهد مخالف" },
        { key: "neutral",          label: "توضیح بی‌طرفانه" }
      ]
    },
    {
      id: "gradual_trust",
      title: "اعتماد تدریجی",
      type: "list",
      prompt: "سه رفتار قابل اعتماد که این فرد در گذشته نشان داده را بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "در یک موقعیت کم‌خطر، بدون کنترل کردن طرف مقابل عمل کن." },
    { id: "m2", text: "یک برداشت مشکوک را قبل از واکنش بررسی کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش کنترل" },
    { id: "p2", label: "افزایش ارزیابی واقع‌بینانه" },
    { id: "p3", label: "افزایش اعتماد تدریجی" }
  ],

  rules: [
    { when: { behavior: "interrogation" }, then: "showExercise:evidence_check" },
    { when: { behavior: "testing" },       then: "showExercise:evidence_check" },
    { when: { behavior: "controlling" },   then: "showExercise:gradual_trust" },
    { when: { trigger: "ambiguous_behavior" }, then: "showExercise:evidence_check" }
  ]
},

/* ============================================================
 * ۳. محرومیت هیجانی
 * ============================================================ */
{
  id: "emotional_deprivation",
  name_fa: "محرومیت هیجانی",
  name_en: "Emotional Deprivation",
  domain: "disconnection_rejection",
  color: "#9b59b6",

  short_description: "انتظار اینکه نیازهای عاطفی مهم مانند توجه، همدلی، حمایت یا درک شدن به اندازه کافی دریافت نشوند.",
  core_need: "دیده شدن، درک شدن و حمایت عاطفی",

  triggers: [
    { id: "ignored",        text: "نادیده گرفته شدن" },
    { id: "low_attention",  text: "کمبود توجه" },
    { id: "no_empathy",     text: "نبود همدلی" },
    { id: "no_talk",        text: "صحبت نکردن درباره احساسات" }
  ],

  automatic_thoughts: [
    { id: "not_understood", text: "کسی منو نمی‌فهمه" },
    { id: "needs_ignored",  text: "نیازهام برای کسی مهم نیست" },
    { id: "expect_nothing", text: "نباید انتظار چیزی داشته باشم" }
  ],

  emotional_signals: [
    { id: "loneliness",  text: "تنهایی" },
    { id: "sadness",     text: "غم" },
    { id: "emptiness",   text: "خلأ" },
    { id: "hopeless",    text: "ناامیدی" }
  ],

  behavioral_patterns: [
    { id: "silent_needs",   text: "ساکت ماندن درباره نیازها" },
    { id: "mind_reading",   text: "انتظار اینکه دیگران خودشان بفهمند" },
    { id: "unavailable_pick", text: "انتخاب افراد عاطفاً در دسترس نبودن" }
  ],

  avoidance_patterns: ["درخواست نکردن حمایت"],
  overcompensation_patterns: ["نیاز شدید به توجه", "گلایه مداوم"],
  consequences: ["احساس تنهایی", "روابط یک‌طرفه"],

  pause_questions: [
    "نیاز من دقیقاً چیست؟",
    "آیا آن را واضح بیان کرده‌ام؟",
    "آیا دارم انتظار دارم دیگری ذهنم را بخواند؟"
  ],

  healthy_response: "شناخت نیاز و بیان مستقیم و محترمانه آن.",

  replacement_responses: [
    { behaviorId: "silent_needs",   text: "به جای سکوت، یک درخواست مشخص و کوچک می‌کنم." },
    { behaviorId: "mind_reading",   text: "نیازم را واضح می‌گویم، نه با اشاره." },
    { behaviorId: "unavailable_pick", text: "به رابطه‌ای که در آن پاسخ می‌گیرم، وقت بیشتری می‌دهم." }
  ],

  exercises: [
    {
      id: "need_naming",
      title: "نام‌گذاری نیاز",
      type: "single_choice",
      question: "الان دقیقاً چه نیازی داری؟",
      options: ["دیده شدن", "درک شدن", "حمایت", "همدلی", "نزدیکی"]
    },
    {
      id: "direct_request",
      title: "درخواست مستقیم",
      type: "single_input",
      question: "یک درخواست مستقیم و کوچک بنویس که می‌توانی همین امروز مطرح کنی."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک نیاز کوچک را واضح بیان کن." },
    { id: "m2", text: "به جای سکوت، درخواست مشخصی مطرح کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "توانایی بیان نیاز" },
    { id: "p2", label: "کاهش انتظار ذهن‌خوانی" },
    { id: "p3", label: "انتخاب روابط متقابل" }
  ],

  rules: [
    { when: { behavior: "silent_needs" }, then: "showExercise:need_naming" },
    { when: { behavior: "mind_reading" }, then: "showExercise:direct_request" },
    { when: { trigger: "ignored" },       then: "showExercise:need_naming" }
  ]
},

/* ============================================================
 * ۴. نقص / شرم
 * ============================================================ */
{
  id: "defectiveness_shame",
  name_fa: "نقص / شرم",
  name_en: "Defectiveness / Shame",
  domain: "disconnection_rejection",
  color: "#8e44ad",

  short_description: "احساس عمیق اینکه در خود فرد چیزی اساساً اشتباه، ناقص یا غیرقابل‌قبول وجود دارد.",
  core_need: "پذیرش و ارزشمندی بدون نیاز به کامل بودن",

  triggers: [
    { id: "mistake",      text: "اشتباه" },
    { id: "criticism",    text: "انتقاد" },
    { id: "comparison",   text: "مقایسه" },
    { id: "rejection",    text: "رد شدن" },
    { id: "showing_weak", text: "نشان دادن ضعف" }
  ],

  automatic_thoughts: [
    { id: "i_am_broken",   text: "من مشکل دارم" },
    { id: "if_known",      text: "اگر واقعاً منو بشناسن قبولم نمی‌کنن" },
    { id: "not_good_enough", text: "به اندازه کافی خوب نیستم" }
  ],

  emotional_signals: [
    { id: "shame",      text: "شرم" },
    { id: "embarrass",  text: "خجالت" },
    { id: "anxiety",    text: "اضطراب" },
    { id: "sadness",    text: "غم" }
  ],

  behavioral_patterns: [
    { id: "hide_weakness", text: "پنهان کردن ضعف" },
    { id: "over_apology",  text: "عذرخواهی بیش از حد" },
    { id: "perfectionism", text: "کمال‌گرایی" },
    { id: "comparison",    text: "مقایسه" }
  ],

  avoidance_patterns: ["دیده نشدن", "نزدیک نشدن به دیگران"],
  overcompensation_patterns: ["اثبات برتری", "کامل بودن"],
  consequences: ["خودانتقادی", "اجتناب", "فرسودگی"],

  pause_questions: [
    "آیا یک اشتباه را با ارزش کل خودم یکی کرده‌ام؟",
    "اگر دوستم این اشتباه را می‌کرد چه می‌گفتم؟",
    "چه چیزی درباره من واقعاً قابل مشاهده است؟"
  ],

  healthy_response: "تفکیک رفتار یا اشتباه از ارزش کلی خود.",

  replacement_responses: [
    { behaviorId: "hide_weakness", text: "یک نقص کوچک را بدون پنهان کردن تحمل می‌کنم." },
    { behaviorId: "over_apology",  text: "قبل از عذرخواهی، از خودم می‌پرسم آیا واقعاً لازم است." },
    { behaviorId: "perfectionism", text: "امروز یک کار را در سطح «کافی» رها می‌کنم." },
    { behaviorId: "comparison",    text: "به جای مقایسه، یک چیز قابل مشاهده در خودم می‌نویسم." }
  ],

  exercises: [
    {
      id: "inner_voice",
      title: "صدای منتقد درونی",
      type: "reflection",
      prompts: [
        "منتقد درونی‌ام دقیقاً چه می‌گوید؟",
        "این صدا بیشتر شبیه چه کسی است؟",
        "به یک دوست در این وضعیت چه می‌گفتم؟"
      ]
    },
    {
      id: "real_strengths",
      title: "توانمندی‌های واقعی",
      type: "list",
      prompt: "سه چیز واقعی که درباره خودت می‌دانی و مثبت است را بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک نقص کوچک را بدون پنهان کردن تحمل کن." },
    { id: "m2", text: "بعد از یک اشتباه، به جای حمله به خود فقط رفتار را اصلاح کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش خودانتقادی" },
    { id: "p2", label: "تحمل دیده شدن" },
    { id: "p3", label: "کاهش شرم" }
  ],

  rules: [
    { when: { behavior: "hide_weakness" }, then: "showExercise:inner_voice" },
    { when: { behavior: "comparison" },    then: "showExercise:real_strengths" },
    { when: { trigger: "mistake" },        then: "showExercise:inner_voice" },
    { when: { trigger: "criticism" },      then: "showExercise:inner_voice" }
  ]
},

/* ============================================================
 * ۵. انزوای اجتماعی
 * ============================================================ */
{
  id: "social_isolation",
  name_fa: "انزوای اجتماعی / بیگانگی",
  name_en: "Social Isolation / Alienation",
  domain: "disconnection_rejection",
  color: "#3498db",

  short_description: "احساس متفاوت بودن، تعلق نداشتن یا بیرون بودن از گروه.",
  core_need: "تعلق و ارتباط",

  triggers: [
    { id: "social_gather",   text: "جمع‌های اجتماعی" },
    { id: "comparison",      text: "مقایسه" },
    { id: "feeling_diff",    text: "احساس متفاوت بودن" },
    { id: "group_rejection", text: "رد شدن از گروه" }
  ],

  automatic_thoughts: [
    { id: "not_like_others", text: "من مثل بقیه نیستم" },
    { id: "no_belonging",    text: "اینجا به من تعلق ندارد" },
    { id: "nobody_gets_me",  text: "هیچ‌کس منو نمی‌فهمه" }
  ],

  emotional_signals: [
    { id: "loneliness",  text: "تنهایی" },
    { id: "embarrass",   text: "خجالت" },
    { id: "anxiety",     text: "اضطراب" }
  ],

  behavioral_patterns: [
    { id: "withdrawal",  text: "کناره‌گیری" },
    { id: "silence",     text: "ساکت ماندن" },
    { id: "skip_gather", text: "نرفتن به جمع" }
  ],

  avoidance_patterns: ["اجتناب از موقعیت اجتماعی"],
  overcompensation_patterns: ["تلاش افراطی برای پذیرفته شدن"],
  consequences: ["تنهایی بیشتر", "تقویت احساس متفاوت بودن"],

  pause_questions: [
    "واقعاً چه چیزی من را متفاوت می‌کند؟",
    "آیا این تفاوت به معنی تعلق نداشتن است؟"
  ],

  healthy_response: "پیدا کردن ارتباط‌های واقعی به جای تلاش برای شبیه شدن به همه.",

  replacement_responses: [
    { behaviorId: "withdrawal",  text: "امروز فقط ۱۰ دقیقه در جمع می‌مانم." },
    { behaviorId: "silence",     text: "یک سؤال کوچک از یک نفر می‌پرسم." },
    { behaviorId: "skip_gather", text: "به یک موقعیت اجتماعی کوتاه می‌روم، بدون انتظار." }
  ],

  exercises: [
    {
      id: "belonging_map",
      title: "نقشه تعلق",
      type: "list",
      prompt: "سه نفر یا سه فضا که در آن‌ها احساس امنیت می‌کنی را بنویس."
    },
    {
      id: "common_ground",
      title: "نقطه مشترک",
      type: "single_input",
      question: "یک نقطه مشترک با کسی که می‌شناسی بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک تعامل کوتاه را آغاز کن." },
    { id: "m2", text: "در یک جمع، یک نفر را پیدا کن که نقطه مشترکی با تو دارد." }
  ],

  progress_metrics: [
    { id: "p1", label: "تعداد تعامل‌های داوطلبانه" },
    { id: "p2", label: "کاهش اجتناب" }
  ],

  rules: [
    { when: { behavior: "withdrawal" },  then: "showExercise:belonging_map" },
    { when: { behavior: "skip_gather" }, then: "showExercise:common_ground" }
  ]
},

/* ============================================================
 * ۶. وابستگی / بی‌کفایتی
 * ============================================================ */
{
  id: "dependence_incompetence",
  name_fa: "وابستگی / بی‌کفایتی",
  name_en: "Dependence / Incompetence",
  domain: "impaired_autonomy",
  color: "#16a085",

  short_description: "باور اینکه فرد به تنهایی از عهده تصمیم‌ها یا مسئولیت‌های مهم برنمی‌آید.",
  core_need: "استقلال و اعتماد به توانایی خود",

  triggers: [
    { id: "decision",      text: "تصمیم‌گیری" },
    { id: "new_task",      text: "کار جدید" },
    { id: "responsibility",text: "مسئولیت" },
    { id: "possible_mistake", text: "اشتباه احتمالی" }
  ],

  automatic_thoughts: [
    { id: "cant_handle",  text: "از پسش برنمیام" },
    { id: "need_help",    text: "باید یکی کمکم کنه" },
    { id: "will_ruin",    text: "ممکنه خرابش کنم" }
  ],

  emotional_signals: [
    { id: "anxiety",   text: "اضطراب" },
    { id: "fear",      text: "ترس" },
    { id: "doubt",     text: "تردید" }
  ],

  behavioral_patterns: [
    { id: "early_help",   text: "کمک خواستن زودهنگام" },
    { id: "delegate",     text: "واگذار کردن تصمیم" },
    { id: "reassurance",  text: "اطمینان گرفتن" }
  ],

  avoidance_patterns: ["شروع نکردن"],
  overcompensation_patterns: ["اثبات استقلال افراطی"],
  consequences: ["کاهش اعتمادبه‌نفس", "وابستگی بیشتر"],

  pause_questions: [
    "کدام بخش این کار را خودم می‌توانم انجام دهم؟",
    "آیا نیاز به کمک دارم یا فقط از اشتباه می‌ترسم؟"
  ],

  healthy_response: "انجام مستقل کارهای کوچک و درخواست کمک فقط در بخش لازم.",

  replacement_responses: [
    { behaviorId: "early_help",  text: "اول خودم ۱۰ دقیقه تلاش می‌کنم، بعد کمک می‌خواهم." },
    { behaviorId: "delegate",    text: "یک تصمیم کوچک را خودم می‌گیرم." },
    { behaviorId: "reassurance", text: "به جای پرسیدن، یک بار خودم اقدام می‌کنم." }
  ],

  exercises: [
    {
      id: "small_step",
      title: "قدم کوچک بعدی",
      type: "single_input",
      question: "کوچک‌ترین قدم عملی که امروز می‌توانم بردارم چیست؟"
    },
    {
      id: "small_wins",
      title: "موفقیت‌های مستقل",
      type: "list",
      prompt: "سه کار که قبلاً خودت از عهده‌شان برآمدی را بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک تصمیم کوچک را بدون گرفتن تأیید دیگران بگیر." },
    { id: "m2", text: "یک کار که معمولاً واگذار می‌کنی، خودت انجام بده." }
  ],

  progress_metrics: [
    { id: "p1", label: "تعداد تصمیم‌های مستقل" },
    { id: "p2", label: "کاهش اطمینان‌گیری" }
  ],

  rules: [
    { when: { behavior: "delegate" },    then: "showExercise:small_step" },
    { when: { behavior: "early_help" },  then: "showExercise:small_wins" },
    { when: { behavior: "reassurance" }, then: "showExercise:small_step" }
  ]
},

/* ============================================================
 * ۷. آسیب‌پذیری
 * ============================================================ */
{
  id: "vulnerability",
  name_fa: "آسیب‌پذیری نسبت به خطر",
  name_en: "Vulnerability to Harm or Illness",
  domain: "impaired_autonomy",
  color: "#e67e22",

  short_description: "انتظار اینکه هر لحظه ممکن است فاجعه، بیماری، حادثه یا اتفاق جدی رخ دهد.",
  core_need: "امنیت همراه با تحمل عدم قطعیت",

  triggers: [
    { id: "bad_news",      text: "خبر بد" },
    { id: "body_signals",  text: "علائم جسمی" },
    { id: "travel",        text: "سفر" },
    { id: "unknown",       text: "موقعیت ناشناخته" },
    { id: "possible_danger", text: "احتمال خطر" }
  ],

  automatic_thoughts: [
    { id: "disaster",      text: "نکنه اتفاق بدی بیفته" },
    { id: "dangerous",     text: "ممکنه خطرناک باشه" },
    { id: "must_check",    text: "باید مطمئن بشم" }
  ],

  emotional_signals: [
    { id: "fear",     text: "ترس" },
    { id: "anxiety",  text: "اضطراب" },
    { id: "hyper",    text: "هشیاری زیاد" }
  ],

  behavioral_patterns: [
    { id: "checking",     text: "چک کردن" },
    { id: "reassurance",  text: "اطمینان گرفتن" },
    { id: "avoid",        text: "اجتناب" }
  ],

  avoidance_patterns: ["دوری از موقعیت‌های نامطمئن"],
  overcompensation_patterns: ["کنترل افراطی"],
  consequences: ["افزایش اضطراب", "محدود شدن زندگی"],

  pause_questions: [
    "احتمال واقعی خطر چقدر است؟",
    "آیا الان خطری فوری وجود دارد؟",
    "آیا دارم برای کاهش اضطراب چک می‌کنم؟"
  ],

  healthy_response: "اقدام منطقی برای ایمنی، بدون تلاش برای حذف کامل عدم قطعیت.",

  replacement_responses: [
    { behaviorId: "checking",    text: "یک بار چک می‌کنم، بعد به کار خودم برمی‌گردم." },
    { behaviorId: "reassurance", text: "به جای پرسیدن، یک نگرانی را می‌نویسم و رها می‌کنم." },
    { behaviorId: "avoid",       text: "امروز یک موقعیت نامطمئن کوچک را تجربه می‌کنم." }
  ],

  exercises: [
    {
      id: "probability",
      title: "احتمال واقعی",
      type: "reflection",
      prompts: [
        "بدترین حالتی که ذهنم می‌سازد چیست؟",
        "واقعاً چقدر احتمال دارد؟",
        "اگر رخ دهد، چه منابعی برای مقابله دارم؟"
      ]
    },
    {
      id: "one_check",
      title: "قانون یک بار",
      type: "timer",
      durationSeconds: 1800,
      description: "۳۰ دقیقه مکث قبل از چک کردن بعدی."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک چک کردن غیرضروری را حذف کن." },
    { id: "m2", text: "یک نگرانی را بدون اطمینان گرفتن برای مدتی تحمل کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش چک کردن" },
    { id: "p2", label: "کاهش اجتناب" },
    { id: "p3", label: "تحمل عدم قطعیت" }
  ],

  rules: [
    { when: { behavior: "checking" },    then: "showExercise:one_check" },
    { when: { behavior: "reassurance" }, then: "showExercise:probability" },
    { when: { behavior: "avoid" },       then: "showExercise:probability" }
  ]
},

/* ============================================================
 * ۸. درهم‌تنیدگی
 * ============================================================ */
{
  id: "enmeshment",
  name_fa: "درهم‌تنیدگی / خود تحول‌نیافته",
  name_en: "Enmeshment / Undeveloped Self",
  domain: "impaired_autonomy",
  color: "#2ecc71",

  short_description: "مرزهای روانی ضعیف با افراد مهم و دشواری در تشخیص خواسته‌ها و هویت مستقل خود.",
  core_need: "هویت مستقل و مرز سالم",

  triggers: [
    { id: "independent_decision", text: "تصمیم مستقل" },
    { id: "disagreement",         text: "اختلاف نظر" },
    { id: "their_displeasure",    text: "نارضایتی فرد نزدیک" },
    { id: "different_path",       text: "انتخاب مسیر متفاوت" }
  ],

  automatic_thoughts: [
    { id: "they_upset",     text: "اگر مخالف باشم ناراحت میشه" },
    { id: "must_agree",     text: "باید مثل اون فکر کنم" },
    { id: "dont_know_self", text: "نمی‌دونم خودم واقعاً چی می‌خوام" }
  ],

  emotional_signals: [
    { id: "guilt",      text: "گناه" },
    { id: "anxiety",    text: "اضطراب" },
    { id: "confusion",  text: "سردرگمی" }
  ],

  behavioral_patterns: [
    { id: "over_adapt",   text: "تطبیق بیش از حد" },
    { id: "their_choice", text: "تصمیم‌گیری بر اساس خواسته دیگران" }
  ],

  avoidance_patterns: ["اجتناب از استقلال"],
  overcompensation_patterns: ["قطع ناگهانی رابطه یا استقلال افراطی"],
  consequences: ["ضعف هویت شخصی", "نارضایتی"],

  pause_questions: [
    "اگر هیچ‌کس ناراحت نمی‌شد، من چه می‌خواستم؟",
    "نظر خودم چیست؟",
    "آیا مخالفت کردن به معنی بی‌محبتی است؟"
  ],

  healthy_response: "شناخت ترجیحات شخصی همراه با حفظ ارتباط.",

  replacement_responses: [
    { behaviorId: "over_adapt",   text: "قبل از موافقت، ۵ ثانیه از خودم می‌پرسم: نظر خودم چیست؟" },
    { behaviorId: "their_choice", text: "یک تصمیم کوچک را بر اساس ترجیح خودم می‌گیرم." }
  ],

  exercises: [
    {
      id: "self_check",
      title: "خودم چه می‌خواهم؟",
      type: "single_input",
      question: "در این لحظه، مستقل از دیگران، خودم چه می‌خواهم؟"
    },
    {
      id: "my_preferences",
      title: "ترجیحات شخصی",
      type: "list",
      prompt: "سه ترجیح شخصی که اخیراً نادیده گرفته‌ای را بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک انتخاب کوچک را صرفاً بر اساس ترجیح خودت انجام بده." },
    { id: "m2", text: "یک نظر متفاوت را محترمانه بیان کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "وضوح ترجیحات" },
    { id: "p2", label: "تصمیم‌های مستقل" },
    { id: "p3", label: "تحمل اختلاف" }
  ],

  rules: [
    { when: { behavior: "over_adapt" },   then: "showExercise:self_check" },
    { when: { behavior: "their_choice" }, then: "showExercise:my_preferences" }
  ]
},

/* ============================================================
 * ۹. شکست
 * ============================================================ */
{
  id: "failure",
  name_fa: "شکست",
  name_en: "Failure to Achieve",
  domain: "impaired_autonomy",
  color: "#e74c3c",

  short_description: "انتظار یا باور اینکه فرد در حوزه‌های مهم زندگی نسبت به دیگران شکست‌خورده یا اساساً کم‌توان است.",
  core_need: "احساس شایستگی و فرصت رشد",

  triggers: [
    { id: "new_start",      text: "شروع کار جدید" },
    { id: "comparison",     text: "مقایسه" },
    { id: "negative_feedback", text: "بازخورد منفی" },
    { id: "past_failure",   text: "شکست قبلی" }
  ],

  automatic_thoughts: [
    { id: "cant",        text: "من نمی‌تونم" },
    { id: "will_fail",   text: "آخرش خراب می‌کنم" },
    { id: "others_better", text: "بقیه از من بهترن" }
  ],

  emotional_signals: [
    { id: "shame",       text: "شرم" },
    { id: "hopeless",    text: "ناامیدی" },
    { id: "fear",        text: "ترس" }
  ],

  behavioral_patterns: [
    { id: "procrastinate", text: "تعویق" },
    { id: "not_start",     text: "شروع نکردن" },
    { id: "comparison",    text: "مقایسه" }
  ],

  avoidance_patterns: ["فرار از چالش"],
  overcompensation_patterns: ["کار بیش از حد برای اثبات خود"],
  consequences: ["از دست رفتن فرصت", "تقویت باور شکست"],

  pause_questions: [
    "چه شواهدی نشان می‌دهد نمی‌توانم؟",
    "کدام مهارت را هنوز یاد نگرفته‌ام؟",
    "قدم بعدی قابل انجام چیست؟"
  ],

  healthy_response: "تعریف موفقیت به شکل رشد و اقدام، نه نتیجه کامل.",

  replacement_responses: [
    { behaviorId: "procrastinate", text: "فقط ۱۰ دقیقه شروع می‌کنم، بدون انتظار کیفیت." },
    { behaviorId: "not_start",     text: "قدم اول را آن‌قدر کوچک می‌کنم که قابل شروع باشد." },
    { behaviorId: "comparison",    text: "به جای مقایسه، یک پیشرفت کوچک خودم را می‌نویسم." }
  ],

  exercises: [
    {
      id: "small_wins",
      title: "پیروزی‌های کوچک",
      type: "list",
      prompt: "سه چیز که در ۳۰ روز گذشته انجام دادی و واقعی بودند را بنویس."
    },
    {
      id: "ten_min_start",
      title: "شروع ۱۰ دقیقه‌ای",
      type: "timer",
      durationSeconds: 600,
      description: "فقط ۱۰ دقیقه شروع کن. کافی است."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "کار را با یک قدم ۱۰ دقیقه‌ای شروع کن." },
    { id: "m2", text: "یک اشتباه را به یک درس مشخص تبدیل کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "تعداد اقدام‌ها" },
    { id: "p2", label: "کاهش تعویق" },
    { id: "p3", label: "افزایش تحمل اشتباه" }
  ],

  rules: [
    { when: { behavior: "procrastinate" }, then: "showExercise:ten_min_start" },
    { when: { behavior: "not_start" },     then: "showExercise:small_wins" },
    { when: { behavior: "comparison" },    then: "showExercise:small_wins" }
  ]
},

/* ============================================================
 * ۱۰. استحقاق / بزرگ‌منشی
 * ============================================================ */
{
  id: "entitlement",
  name_fa: "استحقاق / بزرگ‌منشی",
  name_en: "Entitlement / Grandiosity",
  domain: "impaired_limits",
  color: "#f39c12",

  short_description: "احساس اینکه فرد باید امتیازات ویژه داشته باشد یا محدودیت‌های معمول دیگران درباره او صدق نمی‌کند.",
  core_need: "احترام همراه با درک مرزها و نیازهای دیگران",

  triggers: [
    { id: "hearing_no",   text: "نه شنیدن" },
    { id: "limitation",   text: "محدودیت" },
    { id: "waiting",      text: "انتظار کشیدن" },
    { id: "not_getting",  text: "عدم دریافت چیزی که می‌خواهد" }
  ],

  automatic_thoughts: [
    { id: "my_right",     text: "حقمه" },
    { id: "why_wait",     text: "چرا باید صبر کنم؟" },
    { id: "special",      text: "باید برای من فرق داشته باشه" }
  ],

  emotional_signals: [
    { id: "anger",       text: "خشم" },
    { id: "low_tolerance", text: "تحمل پایین" },
    { id: "frustration", text: "ناکامی" }
  ],

  behavioral_patterns: [
    { id: "insist",       text: "اصرار" },
    { id: "ignore_others", text: "نادیده گرفتن نیاز دیگران" },
    { id: "low_tolerance", text: "تحمل پایین محدودیت" }
  ],

  avoidance_patterns: ["فرار از موقعیت‌هایی که نیازمند سازگاری هستند"],
  overcompensation_patterns: ["کنترل", "برتری‌طلبی"],
  consequences: ["تعارض", "آسیب به روابط"],

  pause_questions: [
    "آیا خواسته من حق است یا ترجیح؟",
    "طرف مقابل چه نیازی دارد؟",
    "اگر جای او بودم چه انتظاری داشتم؟"
  ],

  healthy_response: "حفظ نیازها و خواسته‌های شخصی همراه با احترام به مرز دیگران.",

  replacement_responses: [
    { behaviorId: "insist",        text: "به جای اصرار، یک بار درخواست مؤدبانه می‌کنم." },
    { behaviorId: "ignore_others", text: "قبل از تصمیم، نیاز طرف مقابل را هم می‌پرسم." },
    { behaviorId: "low_tolerance", text: "۵ دقیقه انتظار را تحمل می‌کنم، بعد تصمیم می‌گیرم." }
  ],

  exercises: [
    {
      id: "perspective_swap",
      title: "از دید او",
      type: "reflection",
      prompts: [
        "طرف مقابل الان چه احساسی دارد؟",
        "اگر جای او بودم، از من چه می‌خواستم؟",
        "چه چیزی در این موقعیت واقعاً عادلانه است؟"
      ]
    },
    {
      id: "right_vs_want",
      title: "حق یا خواسته؟",
      type: "single_choice",
      question: "این چیزی که می‌خواهم، حق من است یا ترجیح من؟",
      options: ["حق من است", "ترجیح من است", "نمی‌دانم"]
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک بار بدون اصرار «نه» را بپذیر." },
    { id: "m2", text: "در یک تصمیم، نیاز طرف مقابل را نیز وارد کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش تعارض" },
    { id: "p2", label: "افزایش تحمل ناکامی" },
    { id: "p3", label: "توجه به نیاز دیگران" }
  ],

  rules: [
    { when: { behavior: "insist" },        then: "showExercise:perspective_swap" },
    { when: { behavior: "ignore_others" }, then: "showExercise:right_vs_want" },
    { when: { trigger: "hearing_no" },     then: "showExercise:perspective_swap" }
  ]
},

/* ============================================================
 * ۱۱. خویشتن‌داری ناکافی
 * ============================================================ */
{
  id: "insufficient_self_control",
  name_fa: "خویشتن‌داری ناکافی",
  name_en: "Insufficient Self-Control / Self-Discipline",
  domain: "impaired_limits",
  color: "#d35400",

  short_description: "دشواری در تحمل ناراحتی، تأخیر در پاداش و حفظ نظم برای رسیدن به هدف.",
  core_need: "خودتنظیمی و تحمل ناراحتی",

  triggers: [
    { id: "fatigue",   text: "خستگی" },
    { id: "boredom",   text: "بی‌حوصلگی" },
    { id: "hard_task", text: "کار سخت" },
    { id: "instant_reward", text: "پاداش فوری" }
  ],

  automatic_thoughts: [
    { id: "later",       text: "بعداً انجامش می‌دم" },
    { id: "no_energy",   text: "الان حوصله ندارم" },
    { id: "just_once",   text: "فقط این یک بار" }
  ],

  emotional_signals: [
    { id: "boredom",    text: "بی‌حوصلگی" },
    { id: "restless",   text: "کلافگی" },
    { id: "craving",    text: "میل شدید" }
  ],

  behavioral_patterns: [
    { id: "procrastinate", text: "تعویق" },
    { id: "quit",          text: "رها کردن کار" },
    { id: "instant_reward", text: "پاداش فوری" }
  ],

  avoidance_patterns: ["فرار از ناراحتی"],
  overcompensation_patterns: ["برنامه‌ریزی افراطی و سپس رها کردن"],
  consequences: ["احساس گناه", "اهداف نیمه‌تمام"],

  pause_questions: [
    "آیا واقعاً نمی‌توانم یا فقط ناراحتم؟",
    "اگر فقط ۵ دقیقه انجامش دهم چه؟"
  ],

  healthy_response: "شروع کوچک و تحمل مقدار محدودی از ناراحتی.",

  replacement_responses: [
    { behaviorId: "procrastinate", text: "فقط ۵ دقیقه انجامش می‌دهم." },
    { behaviorId: "quit",          text: "قبل از رها کردن، ۵ دقیقه دیگر ادامه می‌دهم." },
    { behaviorId: "instant_reward", text: "پاداش را ۱۰ دقیقه به تأخیر می‌اندازم." }
  ],

  exercises: [
    {
      id: "five_min_rule",
      title: "قانون ۵ دقیقه",
      type: "timer",
      durationSeconds: 300,
      description: "فقط ۵ دقیقه کار کن، بعد تصمیم بگیر."
    },
    {
      id: "delay_reward",
      title: "تأخیر پاداش",
      type: "timer",
      durationSeconds: 600,
      description: "قبل از پاداش، ۱۰ دقیقه صبر کن."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "قبل از پاداش مورد علاقه، ۵ دقیقه کار هدف را انجام بده." },
    { id: "m2", text: "یک کار نیمه‌تمام را کامل کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "تعداد شروع‌ها" },
    { id: "p2", label: "تعداد تکمیل‌ها" },
    { id: "p3", label: "کاهش تعویق" }
  ],

  rules: [
    { when: { behavior: "procrastinate" },  then: "showExercise:five_min_rule" },
    { when: { behavior: "instant_reward" }, then: "showExercise:delay_reward" },
    { when: { behavior: "quit" },           then: "showExercise:five_min_rule" }
  ]
},

/* ============================================================
 * ۱۲. اطاعت / تسلیم
 * ============================================================ */
{
  id: "subjugation",
  name_fa: "اطاعت / تسلیم",
  name_en: "Subjugation",
  domain: "other_directedness",
  color: "#27ae60",

  short_description: "کنار گذاشتن خواسته‌ها و احساسات شخصی برای جلوگیری از خشم، طرد یا ناراحتی دیگران.",
  core_need: "حق انتخاب و بیان خود",

  triggers: [
    { id: "request",     text: "درخواست دیگران" },
    { id: "their_upset", text: "احتمال ناراحت شدن طرف مقابل" },
    { id: "disagreement", text: "اختلاف نظر" }
  ],

  automatic_thoughts: [
    { id: "must_accept", text: "باید قبول کنم" },
    { id: "they_upset_if_no", text: "اگر نه بگم ناراحت میشه" },
    { id: "trouble",     text: "دردسر درست میشه" }
  ],

  emotional_signals: [
    { id: "guilt",       text: "گناه" },
    { id: "fear",        text: "ترس" },
    { id: "suppressed_anger", text: "خشم فروخورده" }
  ],

  behavioral_patterns: [
    { id: "forced_yes",   text: "بله گفتن اجباری" },
    { id: "silence",      text: "سکوت" },
    { id: "put_others_first", text: "اولویت دادن دائمی به دیگران" }
  ],

  avoidance_patterns: ["اجتناب از تعارض"],
  overcompensation_patterns: ["انفجار ناگهانی", "رفتار منفعل-پرخاشگرانه"],
  consequences: ["رنجش", "فرسودگی", "از دست دادن مرزها"],

  pause_questions: [
    "من واقعاً چه می‌خواهم؟",
    "اگر نه بگویم چه اتفاقی احتمالاً می‌افتد؟",
    "آیا مسئول احساس طرف مقابلم هستم؟"
  ],

  healthy_response: "بیان محترمانه خواسته و توانایی نه گفتن.",

  replacement_responses: [
    { behaviorId: "forced_yes",       text: "قبل از پاسخ، ۵ ثانیه مکث می‌کنم و بعد تصمیم می‌گیرم." },
    { behaviorId: "silence",          text: "نظرم را با یک جمله محترمانه بیان می‌کنم." },
    { behaviorId: "put_others_first", text: "امروز یک بار اولویت خودم را اول می‌گذارم." }
  ],

  exercises: [
    {
      id: "assert_script",
      title: "جمله محترمانه",
      type: "single_input",
      question: "یک جمله محترمانه بنویس که در آن نظر خودت را بیان می‌کنی."
    },
    {
      id: "five_sec_pause",
      title: "مکث ۵ ثانیه‌ای",
      type: "timer",
      durationSeconds: 5,
      description: "قبل از پاسخ، ۵ ثانیه مکث کن."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "در یک درخواست کم‌خطر، پاسخ را فوراً قبول نکن." },
    { id: "m2", text: "یک ترجیح شخصی را واضح بیان کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "تعداد مرزبندی‌ها" },
    { id: "p2", label: "کاهش بله‌های ناخواسته" }
  ],

  rules: [
    { when: { behavior: "forced_yes" },       then: "showExercise:assert_script" },
    { when: { behavior: "put_others_first" }, then: "showExercise:assert_script" },
    { when: { behavior: "silence" },          then: "showExercise:five_sec_pause" }
  ]
},

/* ============================================================
 * ۱۳. ایثار
 * ============================================================ */
{
  id: "self_sacrifice",
  name_fa: "ایثار",
  name_en: "Self-Sacrifice",
  domain: "other_directedness",
  color: "#2980b9",

  short_description: "اولویت دادن مداوم به نیازهای دیگران و نادیده گرفتن نیازهای خود.",
  core_need: "تعادل میان مراقبت از دیگران و خود",

  triggers: [
    { id: "others_need",   text: "نیاز دیگران" },
    { id: "guilt_feeling", text: "احساس گناه" },
    { id: "others_suffer", text: "رنج دیگران" },
    { id: "help_request",  text: "درخواست کمک" }
  ],

  automatic_thoughts: [
    { id: "must_help",     text: "من باید کمک کنم" },
    { id: "my_needs_last", text: "نیاز من مهم نیست" },
    { id: "bad_person",    text: "اگر کمک نکنم آدم بدی هستم" }
  ],

  emotional_signals: [
    { id: "guilt",      text: "گناه" },
    { id: "fatigue",    text: "خستگی" },
    { id: "hidden_resentment", text: "رنجش پنهان" }
  ],

  behavioral_patterns: [
    { id: "over_help",      text: "کمک بیش از حد" },
    { id: "neglect_self",   text: "نادیده گرفتن نیاز خود" },
    { id: "over_responsible", text: "مسئولیت‌پذیری افراطی" }
  ],

  avoidance_patterns: ["اجتناب از درخواست کمک"],
  overcompensation_patterns: ["فداکاری نمایشی یا انتظار قدردانی"],
  consequences: ["فرسودگی", "رنجش", "رابطه نامتعادل"],

  pause_questions: [
    "من الان چه نیازی دارم؟",
    "آیا واقعاً مسئول حل این مشکل هستم؟",
    "اگر کمک نکنم چه احساسی دارم؟"
  ],

  healthy_response: "کمک کردن بدون حذف خود.",

  replacement_responses: [
    { behaviorId: "over_help",        text: "قبل از کمک، از خودم می‌پرسم آیا واقعاً توان دارم." },
    { behaviorId: "neglect_self",     text: "امروز اول یک نیاز شخصی‌ام را برآورده می‌کنم." },
    { behaviorId: "over_responsible", text: "به جای حل کردن، فقط گوش می‌دهم." }
  ],

  exercises: [
    {
      id: "my_needs",
      title: "نیازهای من",
      type: "list",
      prompt: "سه نیاز شخصی که این هفته نادیده گرفته‌ای را بنویس."
    },
    {
      id: "ask_help",
      title: "درخواست کمک",
      type: "single_input",
      question: "یک چیز کوچک که می‌توانی از کسی بخواهی را بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "امروز یک نیاز شخصی را قبل از کمک به دیگران انجام بده." },
    { id: "m2", text: "یک درخواست غیرضروری را نپذیر." }
  ],

  progress_metrics: [
    { id: "p1", label: "تعادل زمان" },
    { id: "p2", label: "کاهش فرسودگی" },
    { id: "p3", label: "افزایش مراقبت از خود" }
  ],

  rules: [
    { when: { behavior: "over_help" },        then: "showExercise:my_needs" },
    { when: { behavior: "neglect_self" },     then: "showExercise:my_needs" },
    { when: { behavior: "over_responsible" }, then: "showExercise:ask_help" }
  ]
},

/* ============================================================
 * ۱۴. تأییدطلبی / جلب توجه
 * ============================================================ */
{
  id: "approval_seeking",
  name_fa: "تأییدطلبی / جلب توجه",
  name_en: "Approval Seeking / Recognition Seeking",
  domain: "other_directedness",
  color: "#8e44ad",

  short_description: "وابستگی ارزشمندی شخصی به تأیید، توجه یا نظر دیگران.",
  core_need: "ارزشمندی مستقل از تأیید دیگران",

  triggers: [
    { id: "criticism",   text: "انتقاد" },
    { id: "ignored",     text: "نادیده گرفته شدن" },
    { id: "comparison",  text: "مقایسه" },
    { id: "others_opinion", text: "نظر دیگران" }
  ],

  automatic_thoughts: [
    { id: "must_approve", text: "باید تأییدم کنن" },
    { id: "not_good",     text: "اگر خوششون نیاد یعنی خوب نیستم" },
    { id: "must_be_seen", text: "باید بهتر دیده بشم" }
  ],

  emotional_signals: [
    { id: "anxiety",  text: "اضطراب" },
    { id: "shame",    text: "شرم" },
    { id: "insecurity", text: "ناامنی" }
  ],

  behavioral_patterns: [
    { id: "change_behavior", text: "تغییر رفتار برای جلب رضایت" },
    { id: "comparison",      text: "مقایسه" },
    { id: "feedback_hunt",   text: "دریافت مداوم بازخورد" }
  ],

  avoidance_patterns: ["انجام ندادن کاری که احتمال قضاوت دارد"],
  overcompensation_patterns: ["نمایش موفقیت", "رقابت", "جلب توجه"],
  consequences: ["وابستگی به نظر دیگران", "بی‌ثباتی عزت‌نفس"],

  pause_questions: [
    "اگر هیچ‌کس این کار را نمی‌دید، باز هم می‌خواستم انجامش دهم؟",
    "نظر چه کسی واقعاً برای من مهم است؟"
  ],

  healthy_response: "انتخاب بر اساس ارزش‌ها و خواسته‌های خود.",

  replacement_responses: [
    { behaviorId: "change_behavior", text: "امروز یک بار نظر واقعی‌ام را می‌گویم." },
    { behaviorId: "comparison",      text: "به جای مقایسه، یک ارزش شخصی خودم را می‌نویسم." },
    { behaviorId: "feedback_hunt",   text: "امروز بازخورد نمی‌گیرم." }
  ],

  exercises: [
    {
      id: "self_approval",
      title: "تأیید از خودم",
      type: "single_input",
      question: "اگر کسی تأییدم نمی‌کرد، من خودم چه چیزی را در خودم ارزشمند می‌دانستم؟"
    },
    {
      id: "private_action",
      title: "اقدام خصوصی",
      type: "single_input",
      question: "یک کار که فقط برای خودت انجام می‌دهی و به کسی نشان نمی‌دهی بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک کار را بدون گفتن یا نشان دادن به دیگران انجام بده." },
    { id: "m2", text: "یک انتخاب را بدون گرفتن تأیید انجام بده." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش اطمینان‌گیری" },
    { id: "p2", label: "اقدام مستقل" }
  ],

  rules: [
    { when: { behavior: "change_behavior" }, then: "showExercise:self_approval" },
    { when: { behavior: "feedback_hunt" },   then: "showExercise:private_action" },
    { when: { trigger: "criticism" },        then: "showExercise:self_approval" }
  ]
},

/* ============================================================
 * ۱۵. منفی‌گرایی / بدبینی
 * ============================================================ */
{
  id: "negativity",
  name_fa: "منفی‌گرایی / بدبینی",
  name_en: "Negativity / Pessimism",
  domain: "overvigilance_inhibition",
  color: "#34495e",

  short_description: "تمرکز مداوم بر خطرها، مشکلات، شکست‌ها و جنبه‌های منفی آینده.",
  core_need: "نگاه واقع‌بینانه و تحمل عدم قطعیت",

  triggers: [
    { id: "unknown_future", text: "آینده نامعلوم" },
    { id: "bad_news",       text: "خبر بد" },
    { id: "risk",           text: "ریسک" },
    { id: "big_decision",   text: "تصمیم مهم" }
  ],

  automatic_thoughts: [
    { id: "will_break", text: "حتماً خراب میشه" },
    { id: "bad_will_happen", text: "آخرش اتفاق بدی میفته" },
    { id: "useless",    text: "فایده نداره" }
  ],

  emotional_signals: [
    { id: "anxiety",   text: "اضطراب" },
    { id: "hopeless",  text: "ناامیدی" },
    { id: "fear",      text: "ترس" }
  ],

  behavioral_patterns: [
    { id: "focus_problem", text: "تمرکز روی مشکل" },
    { id: "predict_disaster", text: "پیش‌بینی فاجعه" },
    { id: "reject_opportunity", text: "رد کردن فرصت‌ها" }
  ],

  avoidance_patterns: ["شروع نکردن"],
  overcompensation_patterns: ["آماده‌سازی افراطی برای بدترین حالت"],
  consequences: ["کاهش انگیزه", "افزایش اضطراب"],

  pause_questions: [
    "بدترین حالت چیست؟",
    "محتمل‌ترین حالت چیست؟",
    "آیا امکان مثبت هم وجود دارد؟",
    "چه چیزی تحت کنترل من است؟"
  ],

  healthy_response: "دیدن همزمان ریسک، احتمال موفقیت و عوامل قابل کنترل.",

  replacement_responses: [
    { behaviorId: "focus_problem",    text: "به جای تمرکز روی مشکل، یک قدم قابل کنترل می‌نویسم." },
    { behaviorId: "predict_disaster", text: "سه سناریو می‌نویسم: بدترین، محتمل‌ترین، بهترین." },
    { behaviorId: "reject_opportunity", text: "یک اقدام کوچک را بدون تضمین نتیجه امتحان می‌کنم." }
  ],

  exercises: [
    {
      id: "three_scenarios",
      title: "سه سناریو",
      type: "reflection",
      prompts: [
        "بدترین حالتی که ممکن است پیش بیاید چیست؟",
        "محتمل‌ترین حالت چیست؟",
        "بهترین حالتی که ممکن است پیش بیاید چیست؟"
      ]
    },
    {
      id: "three_good",
      title: "سه چیز خوب",
      type: "list",
      prompt: "سه چیز خوب که امروز اتفاق افتاد را بنویس، حتی کوچک."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "برای یک نگرانی سه نتیجه ممکن بنویس." },
    { id: "m2", text: "یک اقدام کوچک را بدون تضمین نتیجه انجام بده." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش پیش‌بینی فاجعه" },
    { id: "p2", label: "افزایش اقدام" }
  ],

  rules: [
    { when: { behavior: "predict_disaster" },   then: "showExercise:three_scenarios" },
    { when: { behavior: "focus_problem" },      then: "showExercise:three_good" },
    { when: { behavior: "reject_opportunity" }, then: "showExercise:three_scenarios" }
  ]
},

/* ============================================================
 * ۱۶. بازداری هیجانی
 * ============================================================ */
{
  id: "emotional_inhibition",
  name_fa: "بازداری هیجانی",
  name_en: "Emotional Inhibition",
  domain: "overvigilance_inhibition",
  color: "#7f8c8d",

  short_description: "مهار بیش از حد احساسات، خواسته‌ها یا واکنش‌های طبیعی برای کنترل خود یا جلوگیری از پیامدهای منفی.",
  core_need: "بیان امن و انعطاف‌پذیر هیجان",

  triggers: [
    { id: "expressing_anger", text: "ابراز خشم" },
    { id: "crying",           text: "گریه" },
    { id: "affection",        text: "محبت" },
    { id: "vulnerability",    text: "آسیب‌پذیری" },
    { id: "disagreement",     text: "اختلاف" }
  ],

  automatic_thoughts: [
    { id: "dont_show",   text: "نباید احساساتم را نشان بدهم" },
    { id: "weakness",    text: "ضعف نشان می‌ده" },
    { id: "control_self", text: "باید خودم را کنترل کنم" }
  ],

  emotional_signals: [
    { id: "inner_pressure", text: "فشار درونی" },
    { id: "numb",           text: "بی‌حسی" },
    { id: "tension",        text: "تنش" }
  ],

  behavioral_patterns: [
    { id: "silence",       text: "سکوت" },
    { id: "hide_feeling",  text: "پنهان کردن احساس" },
    { id: "over_logic",    text: "منطقی‌سازی افراطی" }
  ],

  avoidance_patterns: ["دوری از گفت‌وگوهای عاطفی"],
  overcompensation_patterns: ["انفجار ناگهانی"],
  consequences: ["فاصله عاطفی", "فشار روانی", "رنجش"],

  pause_questions: [
    "الان چه احساسی دارم؟",
    "اگر احساس من حرف می‌زد چه می‌گفت؟",
    "آیا بیان این احساس در این موقعیت امن است؟"
  ],

  healthy_response: "شناخت و بیان متناسب هیجان بدون انفجار یا سرکوب.",

  replacement_responses: [
    { behaviorId: "silence",      text: "یک جمله کوتاه درباره احساسم می‌گویم." },
    { behaviorId: "hide_feeling", text: "احساس واقعی‌ام را با کلمات ساده بیان می‌کنم." },
    { behaviorId: "over_logic",   text: "به جای توضیح دادن، فقط نام احساس را می‌گویم." }
  ],

  exercises: [
    {
      id: "name_feeling",
      title: "نام‌گذاری احساس",
      type: "single_choice",
      question: "الان در بدنت و ذهنت چه احساسی داری؟",
      options: ["غم", "خشم", "ترس", "شرم", "تنهایی", "بی‌حسی"]
    },
    {
      id: "i_feel",
      title: "جمله «من احساس ... می‌کنم»",
      type: "single_input",
      question: "یک جمله که با «من احساس ... می‌کنم» شروع شود بنویس."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک احساس را با جمله «من احساس ... می‌کنم» بیان کن." },
    { id: "m2", text: "به جای پنهان کردن ناراحتی، آن را محترمانه بیان کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "توانایی نام‌گذاری احساس" },
    { id: "p2", label: "بیان مستقیم" }
  ],

  rules: [
    { when: { behavior: "silence" },      then: "showExercise:name_feeling" },
    { when: { behavior: "hide_feeling" }, then: "showExercise:i_feel" },
    { when: { behavior: "over_logic" },   then: "showExercise:name_feeling" }
  ]
},

/* ============================================================
 * ۱۷. معیارهای سختگیرانه / بیش‌انتظاری
 * ============================================================ */
{
  id: "unrelenting_standards",
  name_fa: "معیارهای سختگیرانه / بیش‌انتظاری",
  name_en: "Unrelenting Standards / Hypercriticalness",
  domain: "overvigilance_inhibition",
  color: "#2c3e50",

  short_description: "فشار مداوم برای عملکرد بسیار بالا و احساس اینکه هرگز کافی نیست.",
  core_need: "تعادل میان پیشرفت، استراحت و پذیرش محدودیت",

  triggers: [
    { id: "mistake",       text: "اشتباه" },
    { id: "others_perf",   text: "عملکرد دیگران" },
    { id: "unfinished",    text: "کار نیمه‌تمام" },
    { id: "rest",          text: "استراحت" }
  ],

  automatic_thoughts: [
    { id: "must_be_better", text: "باید بهتر باشم" },
    { id: "not_enough",     text: "این کافی نیست" },
    { id: "no_mistake",     text: "نباید اشتباه کنم" }
  ],

  emotional_signals: [
    { id: "pressure",    text: "فشار" },
    { id: "anxiety",     text: "اضطراب" },
    { id: "guilt",       text: "احساس گناه" },
    { id: "fatigue",     text: "خستگی" }
  ],

  behavioral_patterns: [
    { id: "perfectionism", text: "کمال‌گرایی" },
    { id: "overwork",      text: "کار زیاد" },
    { id: "revision",      text: "بازبینی مکرر" }
  ],

  avoidance_patterns: ["شروع نکردن به دلیل ترس از کامل نبودن"],
  overcompensation_patterns: ["کار افراطی"],
  consequences: ["فرسودگی", "کاهش رضایت", "کاهش انعطاف"],

  pause_questions: [
    "آیا این واقعاً باید کامل باشد؟",
    "نسخه کافی این کار چیست؟",
    "اگر ۸۰٪ کافی باشد چه؟"
  ],

  healthy_response: "تعریف استاندارد متناسب با اهمیت واقعی کار.",

  replacement_responses: [
    { behaviorId: "perfectionism", text: "این کار را در سطح «کافی» تمام می‌کنم." },
    { behaviorId: "overwork",      text: "امروز در ساعت مشخصی کار را متوقف می‌کنم." },
    { behaviorId: "revision",      text: "یک بازبینی غیرضروری را حذف می‌کنم." }
  ],

  exercises: [
    {
      id: "enough_definition",
      title: "تعریف «کافی»",
      type: "single_input",
      question: "برای این کار، «کافی بودن» دقیقاً یعنی چه؟"
    },
    {
      id: "rest_without_guilt",
      title: "استراحت بدون گناه",
      type: "timer",
      durationSeconds: 900,
      description: "۱۵ دقیقه استراحت کن، بدون هیچ کاری."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "یک کار کم‌اهمیت را عمداً در سطح «کافی» تمام کن." },
    { id: "m2", text: "یک بازبینی غیرضروری را حذف کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش بازبینی" },
    { id: "p2", label: "کاهش زمان اضافی" },
    { id: "p3", label: "افزایش رضایت" }
  ],

  rules: [
    { when: { behavior: "revision" },      then: "showExercise:enough_definition" },
    { when: { behavior: "perfectionism" }, then: "showExercise:enough_definition" },
    { when: { behavior: "overwork" },      then: "showExercise:rest_without_guilt" },
    { when: { trigger: "rest" },           then: "showExercise:rest_without_guilt" }
  ]
},

/* ============================================================
 * ۱۸. تنبیه‌گری
 * ============================================================ */
{
  id: "punitiveness",
  name_fa: "تنبیه‌گری",
  name_en: "Punitiveness",
  domain: "overvigilance_inhibition",
  color: "#7b241c",

  short_description: "باور اینکه اشتباهات باید با مجازات سخت پاسخ داده شوند و خطا نباید به آسانی بخشیده شود.",
  core_need: "مسئولیت‌پذیری همراه با انعطاف و بخشش",

  triggers: [
    { id: "own_mistake",   text: "اشتباه خود" },
    { id: "others_mistake", text: "اشتباه دیگران" },
    { id: "rule_broken",   text: "نقض قانون" },
    { id: "frustration",   text: "ناکامی" }
  ],

  automatic_thoughts: [
    { id: "must_pay",    text: "باید تاوانش رو بده" },
    { id: "unacceptable", text: "اشتباه قابل قبول نیست" },
    { id: "cant_forgive_self", text: "نباید خودمو ببخشم" }
  ],

  emotional_signals: [
    { id: "anger",  text: "خشم" },
    { id: "shame",  text: "شرم" },
    { id: "guilt",  text: "گناه" }
  ],

  behavioral_patterns: [
    { id: "self_blame",   text: "خودسرزنشی" },
    { id: "strictness",   text: "سختگیری" },
    { id: "harsh_criticism", text: "انتقاد شدید از دیگران" }
  ],

  avoidance_patterns: ["پرهیز از موقعیت‌هایی که احتمال اشتباه دارند"],
  overcompensation_patterns: ["تنبیه خود", "مجازات دیگران"],
  consequences: ["شرم", "تعارض", "کاهش یادگیری از اشتباه"],

  pause_questions: [
    "هدف من اصلاح است یا تنبیه؟",
    "چه مجازاتی واقعاً چیزی را بهتر می‌کند؟",
    "اگر یک انسان قابل احترام این اشتباه را می‌کرد چه می‌گفتم؟"
  ],

  healthy_response: "پذیرش مسئولیت، جبران و یادگیری بدون مجازات غیرضروری.",

  replacement_responses: [
    { behaviorId: "self_blame",       text: "به جای سرزنش، فقط یک اقدام اصلاحی مشخص می‌کنم." },
    { behaviorId: "strictness",       text: "به جای سختگیری، یک جمله مهربان به خودم می‌گویم." },
    { behaviorId: "harsh_criticism",  text: "به جای انتقاد شدید، فقط رفتار را توصیف می‌کنم." }
  ],

  exercises: [
    {
      id: "compassion",
      title: "همدلی با خود",
      type: "reflection",
      prompts: [
        "اگر بهترین دوستم همین اشتباه را می‌کرد، به او چه می‌گفتم؟",
        "در آن لحظه، واقعاً چه نیازی داشتم؟",
        "چه چیزی می‌توانم یاد بگیرم بدون اینکه خودم را خرد کنم؟"
      ]
    },
    {
      id: "corrective_action",
      title: "اقدام اصلاحی",
      type: "single_input",
      question: "برای این اشتباه، یک اقدام اصلاحی مشخص بنویس (نه تنبیه)."
    }
  ],

  real_life_missions: [
    { id: "m1", text: "بعد از یک اشتباه، فقط یک اقدام اصلاحی تعیین کن." },
    { id: "m2", text: "یک اشتباه قدیمی را بدون سرزنش دوباره بررسی کن." }
  ],

  progress_metrics: [
    { id: "p1", label: "کاهش خودسرزنشی" },
    { id: "p2", label: "افزایش اصلاح عملی" },
    { id: "p3", label: "کاهش واکنش تنبیهی" }
  ],

  rules: [
    { when: { behavior: "self_blame" },      then: "showExercise:compassion" },
    { when: { behavior: "harsh_criticism" }, then: "showExercise:compassion" },
    { when: { behavior: "strictness" },      then: "showExercise:corrective_action" }
  ]
}
];

/* ============================================================
 * دسته‌بندی دامنه‌ها
 * ============================================================ */
export const DOMAINS = {
  disconnection_rejection: {
    id: "disconnection_rejection",
    name: "قطع ارتباط و طردشدگی",
    schemas: ["abandonment", "mistrust_abuse", "emotional_deprivation", "defectiveness_shame", "social_isolation"]
  },
  impaired_autonomy: {
    id: "impaired_autonomy",
    name: "خودمختاری مختل",
    schemas: ["dependence_incompetence", "vulnerability", "enmeshment", "failure"]
  },
  impaired_limits: {
    id: "impaired_limits",
    name: "محدودیت‌های مختل",
    schemas: ["entitlement", "insufficient_self_control"]
  },
  other_directedness: {
    id: "other_directedness",
    name: "دیگرجهت‌یابی",
    schemas: ["subjugation", "self_sacrifice", "approval_seeking"]
  },
  overvigilance_inhibition: {
    id: "overvigilance_inhibition",
    name: "گوش‌به‌زنگی افراطی و بازداری",
    schemas: ["negativity", "emotional_inhibition", "unrelenting_standards", "punitiveness"]
  }
};

/* ============================================================
 * آستانه‌های امتیازدهی
 * ============================================================ */
export const PRIORITY_LEVELS = [
  { min: 70, level: "high",   label: "بالا",   emoji: "🔴", color: "#e74c3c" },
  { min: 40, level: "medium", label: "متوسط", emoji: "🟠", color: "#f39c12" },
  { min: 0,  level: "low",    label: "پایین", emoji: "🟢", color: "#27ae60" }
];

export function getPriority(percentage) {
  for (const p of PRIORITY_LEVELS) if (percentage >= p.min) return p;
  return PRIORITY_LEVELS[PRIORITY_LEVELS.length - 1];
}

/* ============================================================
 * موتور قوانین — Rule Engine
 * ============================================================ */
export function resolveExercise(schemaId, triggerId, behaviorId) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  if (!schema) return null;

  for (const rule of schema.rules || []) {
    const w = rule.when || {};
    const matches =
      (!w.trigger  || w.trigger === triggerId) &&
      (!w.behavior || w.behavior === behaviorId);
    if (matches) return rule.then;
  }
  return schema.exercises?.[0] ? `showExercise:${schema.exercises[0].id}` : null;
}

export function getReplacementResponse(schemaId, behaviorId) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  if (!schema) return null;
  const r = (schema.replacement_responses || []).find((x) => x.behaviorId === behaviorId);
  return r ? r.text : null;
}

export function buildUserPath(schemaId, { triggerId, thoughtId, emotionId, behaviorId }) {
  const schema = SCHEMAS.find((s) => s.id === schemaId);
  if (!schema) return null;
  const find = (list, id) => (list || []).find((x) => x.id === id) || null;

  return {
    schema:     { id: schema.id, name: schema.name_fa },
    trigger:    find(schema.triggers, triggerId),
    thought:    find(schema.automatic_thoughts, thoughtId),
    emotion:    find(schema.emotional_signals, emotionId),
    behavior:   find(schema.behavioral_patterns, behaviorId),
    pauseQuestions: schema.pause_questions,
    replacement: getReplacementResponse(schemaId, behaviorId),
    nextExercise: resolveExercise(schemaId, triggerId, behaviorId),
    mission: schema.real_life_missions?.[0]?.text || null
  };
}
