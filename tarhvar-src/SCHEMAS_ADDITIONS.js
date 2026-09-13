// SCHEMAS_ADDITIONS.js
// نسخه 1.0 — محتوای اضافی برای گسترش ۱۸ طرحواره
// بعد از SCHEMAS ادغام می‌شود

export const SCHEMAS_ADDITIONS = {
  abandonment: {
    triggers: [
      { id: "seen_not_replied", text: "کسی آنلاین است ولی جواب نمی‌دهد" },
      { id: "no_goodnight", text: "پیام شب‌بخیر نیامد" },
      { id: "friend_busy", text: "دوستی سرش شلوغ است" },
      { id: "partner_tired", text: "طرف مقابلم خسته و سرد است" },
      { id: "family_late", text: "خانواده دیر جواب می‌دهند" },
      { id: "weekend_alone", text: "آخر هفته را تنها ماندم" },
      { id: "no_call", text: "امروز زنگ نزد" },
      { id: "photos_group", text: "عکس گروهی دیدم که در آن نبودم" }
    ],
    thoughts: [
      { id: "he_forgot", text: "حتماً من رو فراموش کرده" },
      { id: "busy_with_other", text: "داره با یکی دیگه وقت می‌گذرونه" },
      { id: "tired_of_me", text: "از من خسته شده" },
      { id: "will_leave", text: "به‌زودی می‌ره" },
      { id: "not_worth", text: "من ارزش وقتش رو ندارم" }
    ],
    emotions: [
      { id: "emptiness", text: "پوچی" },
      { id: "betrayal", text: "احساس خیانت" },
      { id: "jealousy", text: "حسادت" },
      { id: "longing", text: "دلتنگی شدید" }
    ],
    behaviors: [
      { id: "text_multiple", text: "چند پیام پشت سر هم می‌فرستم" },
      { id: "check_last_seen", text: "آخرین آنلاین بودنش رو چک می‌کنم" },
      { id: "ask_friends", text: "از دوستای مشترک می‌پرسم" },
      { id: "silent_treatment", text: "قهر می‌کنم" },
      { id: "pretend_busy", text: "وانمود می‌کنم سرم شلوغه" },
      { id: "social_media", text: "صفحه‌هاش رو چک می‌کنم" }
    ]
  },

  mistrust_abuse: {
    triggers: [
      { id: "phone_hidden", text: "گوشی‌اش را از من پنهان می‌کند" },
      { id: "late_night", text: "دیر وقت بیرون است" },
      { id: "new_friend", text: "دوست جدید پیدا کرده" },
      { id: "vague_answer", text: "جواب‌های مبهم می‌شنوم" },
      { id: "password_changed", text: "رمزها را عوض کرده" },
      { id: "secret_call", text: "تماس تلفنی مخفیانه" },
      { id: "whisper", text: "پچ‌پچ با دیگران" },
      { id: "unexpected_gift", text: "هدیه غیرمنتظره" }
    ],
    thoughts: [
      { id: "hiding_something", text: "داره چیزی رو پنهان می‌کنه" },
      { id: "cheating", text: "داره خیانت می‌کنه" },
      { id: "lying", text: "داره دروغ می‌گه" },
      { id: "using_me", text: "داره از من سوءاستفاده می‌کنه" },
      { id: "will_hurt", text: "به‌زودی به من ضربه می‌زنه" }
    ],
    emotions: [
      { id: "distrust", text: "بی‌اعتمادی شدید" },
      { id: "anger", text: "خشم" },
      { id: "fear", text: "ترس" },
      { id: "vulnerability", text: "احساس آسیب‌پذیری" }
    ],
    behaviors: [
      { id: "check_phone", text: "گوشی‌اش رو چک می‌کنم" },
      { id: "follow", text: "پشت سرش می‌رم" },
      { id: "interrogate", text: "سؤال‌های بازجویی می‌پرسم" },
      { id: "search_online", text: "دنبال اطلاعات آنلاین می‌گردم" },
      { id: "silent_test", text: "با سکوت امتحانش می‌کنم" },
      { id: "confront_accuse", text: "رو در رو متهمش می‌کنم" }
    ]
  },

  emotional_deprivation: {
    triggers: [
      { id: "no_question", text: "کسی از حالم نمی‌پرسد" },
      { id: "talked_ignored", text: "حرف زدم ولی کسی گوش نداد" },
      { id: "silent_dinner", text: "با هم شام خوردیم ولی حرفی نزدیم" },
      { id: "alone_weekend", text: "آخر هفته را تنها ماندم" },
      { id: "no_hug", text: "هفته‌هاست کسی من را بغل نکرده" },
      { id: "asked_others", text: "شنیدم کسی از حال دیگران پرسیده، نه من" },
      { id: "no_empathy", text: "کسی احساس من را نفهمید" },
      { id: "busy_all", text: "همه مشغول هستند" }
    ],
    thoughts: [
      { id: "nobody_cares", text: "هیچ‌کس به من اهمیت نمی‌ده" },
      { id: "always_alone", text: "همیشه تنهام" },
      { id: "not_important", text: "برای کسی مهم نیستم" },
      { id: "waste", text: "وقت کسی رو نمی‌گیرم" },
      { id: "why_try", text: "چرا اصلاً تلاش کنم؟" }
    ],
    emotions: [
      { id: "loneliness", text: "تنهایی عمیق" },
      { id: "emptiness", text: "پوچی" },
      { id: "sadness", text: "غم" },
      { id: "longing", text: "دلتنگی" }
    ],
    behaviors: [
      { id: "withdrawal", text: "کنار می‌کشم" },
      { id: "silence", text: "ساکت می‌مونم" },
      { id: "no_request", text: "نیاز نمی‌گم" },
      { id: "isolate", text: "خودم رو جدا می‌کنم" },
      { id: "expect_mind_reading", text: "منتظرم دیگران خودشون بفهمن" },
      { id: "passive_sad", text: "غصه می‌خورم" }
    ]
  },

  defectiveness_shame: {
    triggers: [
      { id: "mirror", text: "خودم را در آینه دیدم" },
      { id: "old_photo", text: "عکس قدیمی دیدم" },
      { id: "praised", text: "کسی از من تعریف کرد و باور نکردم" },
      { id: "public_mistake", text: "در جمع اشتباه کردم" },
      { id: "compared", text: "کسی من را با دیگری مقایسه کرد" },
      { id: "criticism", text: "انتقاد شنیدم" },
      { id: "silent_disapproval", text: "دیدم کسی از کارم راضی نبود" },
      { id: "group_photo", text: "خودم را در عکس جمعی دیدم" }
    ],
    thoughts: [
      { id: "i_am_broken", text: "من معیوبم" },
      { id: "if_they_knew", text: "اگه واقعی من رو بشناسن، فرار می‌کنن" },
      { id: "not_deserve", text: "لایق این چیزها نیستم" },
      { id: "always_wrong", text: "همیشه یه چیزی در من اشتباهه" },
      { id: "fake_person", text: "من دارم نقش بازی می‌کنم" }
    ],
    emotions: [
      { id: "shame", text: "شرم عمیق" },
      { id: "humiliation", text: "تحقیر شدن" },
      { id: "disgust", text: "حس چندش‌آور از خودم" },
      { id: "self_hate", text: "خشم از خود" }
    ],
    behaviors: [
      { id: "hide_self", text: "خودم رو پنهان می‌کنم" },
      { id: "over_apologize", text: "زیاد عذرخواهی می‌کنم" },
      { id: "reject_praise", text: "تعریف رو رد می‌کنم" },
      { id: "avoid_mirror", text: "از آینه فرار می‌کنم" },
      { id: "self_criticism", text: "خودم رو سرزنش می‌کنم" },
      { id: "overwork", text: "برای جبران، زیاد کار می‌کنم" }
    ]
  },

  social_isolation: {
    triggers: [
      { id: "group_photo", text: "عکس گروهی دیدم که در آن نبودم" },
      { id: "couple_invite", text: "دعوت به جمع زوجی خوردم" },
      { id: "quiet_cafe", text: "در کافه تنها نشسته‌ام" },
      { id: "wedding_invite", text: "به عروسی دعوت شدم" },
      { id: "old_friends_meet", text: "دوستای قدیمی دور هم جمع شدند" },
      { id: "class_reunion", text: "دعوت به دورهمی همکلاسی‌ها" },
      { id: "new_group", text: "وارد گروه جدیدی شدم" },
      { id: "weekend_silent", text: "آخر هفته بدون هیچ تماسی گذشت" }
    ],
    thoughts: [
      { id: "different", text: "با بقیه فرق دارم" },
      { id: "dont_belong", text: "به این جمع تعلق ندارم" },
      { id: "no_one_gets_me", text: "هیچ‌کس من رو نمی‌فهمه" },
      { id: "outsider", text: "من یه غریبه‌ام" },
      { id: "left_out", text: "من رو کنار گذاشتن" }
    ],
    emotions: [
      { id: "alienation", text: "بیگانگی" },
      { id: "loneliness", text: "تنهایی" },
      { id: "awkwardness", text: "معذب بودن" },
      { id: "sadness", text: "غم" }
    ],
    behaviors: [
      { id: "withdraw", text: "کنار می‌کشم" },
      { id: "silence", text: "ساکت می‌مونم" },
      { id: "leave_early", text: "زودتر می‌رم" },
      { id: "avoid_gatherings", text: "از جمع دوری می‌کنم" },
      { id: "fake_smile", text: "الکی لبخند می‌زنم" },
      { id: "scroll_phone", text: "گوشی رو نگاه می‌کنم" }
    ]
  },

  dependence_incompetence: {
    triggers: [
      { id: "left_alone", text: "تنها ماندم" },
      { id: "big_decision", text: "باید تصمیم مهمی بگیرم" },
      { id: "new_task", text: "کار جدید به من سپرده شد" },
      { id: "no_advisor", text: "کسی نیست که مشورت کنم" },
      { id: "cook_alone", text: "باید خودم غذا درست کنم" },
      { id: "alone_at_home", text: "تنها در خانه ماندم" },
      { id: "technical_problem", text: "مشکل فنی پیش آمد" },
      { id: "no_help_available", text: "کسی نیست کمکم کنه" }
    ],
    thoughts: [
      { id: "cant_handle", text: "از پسش برنمیام" },
      { id: "need_help", text: "باید یکی کمکم کنه" },
      { id: "will_fail", text: "خرابش می‌کنم" },
      { id: "not_capable", text: "من توانمند نیستم" },
      { id: "hopeless", text: "بدون کمک، بی‌فایده‌ست" }
    ],
    emotions: [
      { id: "anxiety", text: "اضطراب" },
      { id: "fear", text: "ترس" },
      { id: "helplessness", text: "درماندگی" },
      { id: "panic", text: "وحشت" }
    ],
    behaviors: [
      { id: "call_immediately", text: "فوراً زنگ می‌زنم" },
      { id: "ask_multiple", text: "از چند نفر می‌پرسم" },
      { id: "wait_help", text: "منتظر می‌مونم کسی کمک کنه" },
      { id: "postpone", text: "به تعویق می‌اندازم" },
      { id: "have_others_do", text: "به دیگران واگذار می‌کنم" },
      { id: "check_reassurance", text: "اطمینان می‌گیرم" }
    ]
  },

  vulnerability: {
    triggers: [
      { id: "bad_news", text: "خبر بدی شنیدم" },
      { id: "body_pain", text: "درد یا علامت جسمی حس کردم" },
      { id: "travel", text: "قرار است سفر بروم" },
      { id: "alone_at_night", text: "شب است و تنها هستم" },
      { id: "spouse_late", text: "عزیزی دیر به خانه می‌آید" },
      { id: "pandemic_news", text: "خبر بیماری واگیردار" },
      { id: "money_worry", text: "نگرانی مالی" },
      { id: "unexpected_call", text: "تماس غیرمنتظره" }
    ],
    thoughts: [
      { id: "disaster", text: "فاجعه‌ای در راهه" },
      { id: "worst_case", text: "بدترین حالت اتفاق می‌افته" },
      { id: "cant_cope", text: "نمی‌تونم مقابله کنم" },
      { id: "dangerous", text: "این خطرناکه" },
      { id: "unsafe", text: "من در امان نیستم" }
    ],
    emotions: [
      { id: "terror", text: "وحشت" },
      { id: "anxiety", text: "اضطراب شدید" },
      { id: "tension", text: "تنش بدنی" },
      { id: "helplessness", text: "درماندگی" }
    ],
    behaviors: [
      { id: "checking", text: "مدام چک می‌کنم" },
      { id: "reassurance", text: "اطمینان می‌گیرم" },
      { id: "avoid", text: "از موقعیت دوری می‌کنم" },
      { id: "google_search", text: "در اینترنت جستجو می‌کنم" },
      { id: "control", text: "سعی می‌کنم کنترل کنم" },
      { id: "safety_behaviors", text: "رفتارهای امنیتی افراطی" }
    ]
  },

  enmeshment: {
    triggers: [
      { id: "family_upset", text: "مادرم یا پدرم ناراحت است" },
      { id: "disagreement", text: "با خانواده اختلاف نظر داشتم" },
      { id: "their_opinion", text: "خانواده نظر متفاوتی دادند" },
      { id: "partner_mood", text: "حال همسرم بد است" },
      { id: "friend_need", text: "دوستی به کمک نیاز دارد" },
      { id: "their_disapproval", text: "از تصمیم من راضی نبودن" },
      { id: "expected_same", text: "انتظار داشتن مثل اونا باشم" },
      { id: "sibling_choice", text: "خواهر یا برادرم مسیر متفاوتی رفت" }
    ],
    thoughts: [
      { id: "responsible", text: "من مسئول حال اون‌هام" },
      { id: "must_agree", text: "باید موافق باشم" },
      { id: "no_self", text: "من بدون اونا گم می‌شم" },
      { id: "guilt_choice", text: "اگر مخالفت کنم، مقصرم" },
      { id: "cant_decide", text: "نمی‌تونم خودم تصمیم بگیرم" }
    ],
    emotions: [
      { id: "guilt", text: "احساس گناه" },
      { id: "anxiety", text: "اضطراب" },
      { id: "emptiness", text: "پوچی" },
      { id: "fear", text: "ترس از طرد شدن" }
    ],
    behaviors: [
      { id: "comply", text: "تسلیم می‌شم" },
      { id: "ask_first", text: "اول از اونا می‌پرسم" },
      { id: "abandon_self", text: "خودم رو فراموش می‌کنم" },
      { id: "agree_always", text: "همیشه موافقت می‌کنم" },
      { id: "avoid_different", text: "از متفاوت بودن فرار می‌کنم" },
      { id: "over_consult", text: "زیاد مشورت می‌گیرم" }
    ]
  },

  failure: {
    triggers: [
      { id: "colleague_success", text: "موفقیت همکارم را دیدم" },
      { id: "linkedin_post", text: "پست موفقیت کسی را دیدم" },
      { id: "deadline", text: "مهلت نزدیک است" },
      { id: "exam", text: "باید امتحان بدهم" },
      { id: "unfinished_task", text: "کار نیمه‌تمام در لیستم مانده" },
      { id: "someone_succeeded", text: "کسی در کار مشابه موفق شد" },
      { id: "birthday", text: "تولد و مرور گذشته" },
      { id: "class_reunion", text: "دورهمی همکلاسی‌ها" }
    ],
    thoughts: [
      { id: "cant_do", text: "نمی‌تونم" },
      { id: "will_fail", text: "شکست می‌خورم" },
      { id: "others_better", text: "بقیه بهترن" },
      { id: "behind", text: "از همه عقب‌ترم" },
      { id: "waste", text: "زندگیم هدر رفته" }
    ],
    emotions: [
      { id: "shame", text: "شرم" },
      { id: "hopelessness", text: "ناامیدی" },
      { id: "frustration", text: "سرخوردگی" },
      { id: "envy", text: "حسادت" }
    ],
    behaviors: [
      { id: "procrastinate", text: "به تعویق می‌اندازم" },
      { id: "avoid_start", text: "شروع نمی‌کنم" },
      { id: "compare", text: "مقایسه می‌کنم" },
      { id: "give_up", text: "زود رها می‌کنم" },
      { id: "self_doubt", text: "به خودم شک می‌کنم" },
      { id: "overcompensate", text: "برای جبران، افراط می‌کنم" }
    ]
  },

  entitlement: {
    triggers: [
      { id: "queue", text: "در صف ایستادم" },
      { id: "delayed_response", text: "دیر جواب گرفتم" },
      { id: "hearing_no", text: "کسی نه گفت" },
      { id: "waiting_food", text: "غذا دیر رسید" },
      { id: "traffic", text: "در ترافیک ماندم" },
      { id: "customer_service", text: "برخورد بدی با من شد" },
      { id: "not_first", text: "من اول نبودم" },
      { id: "delayed_reply", text: "کسی دیر جواب داد" }
    ],
    thoughts: [
      { id: "my_right", text: "این حق منه" },
      { id: "why_wait", text: "چرا باید صبر کنم؟" },
      { id: "should_special", text: "باید برای من فرق داشته باشه" },
      { id: "disrespect", text: "به من بی‌احترامی شد" },
      { id: "not_fair", text: "این عادلانه نیست" }
    ],
    emotions: [
      { id: "anger", text: "خشم" },
      { id: "frustration", text: "سرخوردگی" },
      { id: "impatience", text: "بی‌حوصلگی" },
      { id: "offense", text: "رنجش" }
    ],
    behaviors: [
      { id: "complain", text: "شکایت می‌کنم" },
      { id: "demand", text: "مطالبه می‌کنم" },
      { id: "insist", text: "اصرار می‌کنم" },
      { id: "loud_voice", text: "صدایم را بالا می‌برم" },
      { id: "rage_quit", text: "با عصبانیت رد می‌کنم" },
      { id: "blame_others", text: "دیگران را مقصر می‌دانم" }
    ]
  },

  insufficient_self_control: {
    triggers: [
      { id: "notification", text: "نوتیفیکیشن گوشی" },
      { id: "fridge", text: "به یخچال سر زدم" },
      { id: "bored", text: "حوصله‌ام سر رفت" },
      { id: "hard_task", text: "کار سخت باید شروع کنم" },
      { id: "late_night", text: "شب است و باید بخوابم" },
      { id: "sweet_available", text: "شیرینی در دسترس است" },
      { id: "sale", text: "حراج آنلاین" },
      { id: "tired", text: "خسته‌ام" }
    ],
    thoughts: [
      { id: "later", text: "بعداً انجامش می‌دم" },
      { id: "just_once", text: "فقط این یک بار" },
      { id: "cant_resist", text: "نمی‌تونم مقاومت کنم" },
      { id: "deserve", text: "حق دارم الان" },
      { id: "one_more", text: "فقط یکی دیگه" }
    ],
    emotions: [
      { id: "impulse", text: "فشار تکانه" },
      { id: "boredom", text: "بی‌حوصلگی" },
      { id: "tension", text: "تنش" },
      { id: "craving", text: "میل شدید" }
    ],
    behaviors: [
      { id: "instant_gratification", text: "فوری ارضا می‌کنم" },
      { id: "scroll", text: "اسکرول می‌کنم" },
      { id: "eat_impulse", text: "بی‌فکر می‌خورم" },
      { id: "spend", text: "بی‌فکر خرج می‌کنم" },
      { id: "quit_task", text: "کار را نیمه‌کاره رها می‌کنم" },
      { id: "distract", text: "خودم رو مشغول می‌کنم" }
    ]
  },

  subjugation: {
    triggers: [
      { id: "boss_request", text: "رئیس درخواست کرد" },
      { id: "family_wants", text: "خانواده خواسته‌ای داشتند" },
      { id: "friend_favor", text: "دوستی از من کاری خواست" },
      { id: "spouse_wants", text: "همسرم نظری داد" },
      { id: "guilt_pressure", text: "با احساس گناه تحت فشارم گذاشت" },
      { id: "authority_figure", text: "کسی با اقتدار حرف زد" },
      { id: "disagreement", text: "موقعیت اختلاف" },
      { id: "someone_upset", text: "کسی ناراحت شد" }
    ],
    thoughts: [
      { id: "must_agree", text: "باید موافقت کنم" },
      { id: "he_will_upset", text: "ناراحت می‌شه" },
      { id: "no_right", text: "حق ندارم مخالفت کنم" },
      { id: "peace_more", text: "صلح مهم‌تر از نظرمه" },
      { id: "self_blame", text: "تقصیر منه" }
    ],
    emotions: [
      { id: "guilt", text: "گناه" },
      { id: "fear", text: "ترس" },
      { id: "anger_suppressed", text: "خشم فروخورده" },
      { id: "helplessness", text: "درماندگی" }
    ],
    behaviors: [
      { id: "comply", text: "تسلیم می‌شم" },
      { id: "hide_feelings", text: "احساساتم رو پنهان می‌کنم" },
      { id: "passive_aggressive", text: "غیرمستقیم نشان می‌دم" },
      { id: "avoid_conflict", text: "از تعارض دوری می‌کنم" },
      { id: "apologize_first", text: "اول عذرخواهی می‌کنم" },
      { id: "silence", text: "ساکت می‌مونم" }
    ]
  },

  self_sacrifice: {
    triggers: [
      { id: "friend_crisis", text: "دوستی در بحران است" },
      { id: "family_need", text: "خانواده به کمک نیاز دارد" },
      { id: "colleague_help", text: "همکار کمک خواست" },
      { id: "guilt", text: "احساس گناه کردم" },
      { id: "no_one_else", text: "فکر کردم اگه من نکنم، کسی نمی‌کنه" },
      { id: "sick_relative", text: "بیماری عزیزان" },
      { id: "kids_need", text: "بچه‌ها به چیزی نیاز دارن" },
      { id: "stranger_help", text: "کسی درخواست کمک کرد" }
    ],
    thoughts: [
      { id: "must_help", text: "باید کمک کنم" },
      { id: "my_needs_last", text: "نیاز خودم آخرین" },
      { id: "selfish", text: "اگه خودم رو بذارم اول، خودخواهم" },
      { id: "bad_person", text: "آدم بدی می‌شم" },
      { id: "no_choice", text: "چاره‌ای ندارم" }
    ],
    emotions: [
      { id: "guilt", text: "گناه" },
      { id: "exhaustion", text: "خستگی" },
      { id: "resentment", text: "دلخوری پنهان" },
      { id: "emptiness", text: "پوچی" }
    ],
    behaviors: [
      { id: "yes_always", text: "همیشه بله می‌گم" },
      { id: "neglect_self", text: "خودم رو نادیده می‌گیرم" },
      { id: "over_help", text: "بیش از حد کمک می‌کنم" },
      { id: "run_errands", text: "کارهای دیگران رو انجام می‌دم" },
      { id: "lose_self", text: "خودم رو گم می‌کنم" },
      { id: "silent_burnout", text: "در سکوت فرسوده می‌شم" }
    ]
  },

  approval_seeking: {
    triggers: [
      { id: "posted", text: "چیزی پست کردم و منتظر لایک هستم" },
      { id: "criticism", text: "کسی انتقاد کرد" },
      { id: "no_compliment", text: "کسی تعریف نکرد" },
      { id: "silent_friend", text: "دوستم جواب پیامم را نداد" },
      { id: "social_gathering", text: "در جمعی حاضر شدم" },
      { id: "feedback", text: "بازخورد منفی شنیدم" },
      { id: "disapproval", text: "از نگاه کسی ناراحتی دیدم" },
      { id: "compared", text: "با کسی مقایسه شدم" }
    ],
    thoughts: [
      { id: "need_approval", text: "باید تأیید بگیرم" },
      { id: "what_think", text: "چی درباره‌ام فکر می‌کنن؟" },
      { id: "not_good", text: "به‌اندازه کافی خوب نیستم" },
      { id: "be_liked", text: "باید همه دوستم داشته باشن" },
      { id: "invisible", text: "اگه دیده نشم، هیچ‌ام" }
    ],
    emotions: [
      { id: "anxiety", text: "اضطراب" },
      { id: "shame", text: "شرم" },
      { id: "insecurity", text: "ناامنی" },
      { id: "rejection_fear", text: "ترس از طرد" }
    ],
    behaviors: [
      { id: "change_self", text: "خودم رو تغییر می‌دم" },
      { id: "show_off", text: "خودنمایی می‌کنم" },
      { id: "seek_feedback", text: "بازخورد می‌گیرم" },
      { id: "agree_others", text: "با همه موافق می‌شم" },
      { id: "avoid_judgment", text: "از قضاوت فرار می‌کنم" },
      { id: "social_media_check", text: "لایک‌ها رو چک می‌کنم" }
    ]
  },

  negativity: {
    triggers: [
      { id: "morning_news", text: "صبح خبرهای بد خواندم" },
      { id: "future_plan", text: "به آینده فکر کردم" },
      { id: "weekend_over", text: "آخر هفته تمام شد" },
      { id: "tired", text: "خسته بودم" },
      { id: "bad_weather", text: "هوا بد بود" },
      { id: "mistake_me", text: "اشتباه کردم" },
      { id: "bad_thought", text: "فکر بد آمد" },
      { id: "good_thing", text: "چیز خوبی پیش آمد و نگران شدم" }
    ],
    thoughts: [
      { id: "will_fail", text: "حتماً خراب می‌شه" },
      { id: "bad_happen", text: "اتفاق بدی می‌افته" },
      { id: "no_hope", text: "امیدی نیست" },
      { id: "why_try", text: "چرا تلاش کنم؟" },
      { id: "always_bad", text: "همیشه زندگی‌ام بد بوده" }
    ],
    emotions: [
      { id: "hopelessness", text: "ناامیدی" },
      { id: "anxiety", text: "اضطراب" },
      { id: "sadness", text: "غم" },
      { id: "despair", text: "یأس" }
    ],
    behaviors: [
      { id: "complain", text: "شکایت می‌کنم" },
      { id: "worry", text: "نگران می‌مونم" },
      { id: "reject_opportunity", text: "فرصت‌ها رو رد می‌کنم" },
      { id: "focus_bad", text: "فقط بدی‌ها رو می‌بینم" },
      { id: "avoid_try", text: "از تلاش دوری می‌کنم" },
      { id: "pessimism", text: "بدبینی می‌کنم" }
    ]
  },

  emotional_inhibition: {
    triggers: [
      { id: "cried", text: "خواستم گریه کنم ولی نکردم" },
      { id: "angry", text: "عصبانی شدم و نگفتم" },
      { id: "love_said", text: "خواستم بگم دوستت دارم ولی نگفتم" },
      { id: "hurt", text: "دلم شکست ولی ساکت ماندم" },
      { id: "tired_said", text: "خسته بودم ولی گفتم خوبم" },
      { id: "disagreement", text: "مخالف بودم ولی نگفتم" },
      { id: "crying_movie", text: "فیلم احساسی دیدم و خودم رو کنترل کردم" },
      { id: "compliment", text: "تعریفی شنیدم و بی‌تفاوت موندم" }
    ],
    thoughts: [
      { id: "weakness", text: "این ضعفه" },
      { id: "must_control", text: "باید خودم رو کنترل کنم" },
      { id: "not_show", text: "نشون ندم بهتره" },
      { id: "burden", text: "برای دیگران سربارم" },
      { id: "handle_alone", text: "خودم تنهایی تحمل می‌کنم" }
    ],
    emotions: [
      { id: "numbness", text: "بی‌حسی" },
      { id: "tension", text: "تنش" },
      { id: "pressure", text: "فشار درونی" },
      { id: "emptiness", text: "پوچی" }
    ],
    behaviors: [
      { id: "hide_feelings", text: "احساساتم رو پنهان می‌کنم" },
      { id: "change_subject", text: "موضوع رو عوض می‌کنم" },
      { id: "rationalize", text: "با منطق توضیح می‌دم" },
      { id: "silence", text: "ساکت می‌مونم" },
      { id: "fake_okay", text: "می‌گم خوبم" },
      { id: "isolate", text: "خودم رو جدا می‌کنم" }
    ]
  },

  unrelenting_standards: {
    triggers: [
      { id: "work_done", text: "کارم را تمام کردم ولی راضی نیستم" },
      { id: "colleague_delivery", text: "همکارم کارش را تحویل داد" },
      { id: "rest", text: "استراحت کردم" },
      { id: "checked_details", text: "جزئیات را چک کردم" },
      { id: "self_review", text: "کار خودم رو بازبینی کردم" },
      { id: "mistake_small", text: "اشتباه کوچیک کردم" },
      { id: "compliment_work", text: "از کارم تعریف شد و باور نکردم" },
      { id: "weekend_free", text: "آخر هفته بدون کار" }
    ],
    thoughts: [
      { id: "not_enough", text: "کافی نیست" },
      { id: "must_better", text: "باید بهتر باشم" },
      { id: "no_rest", text: "استراحت یعنی تنبلی" },
      { id: "flaw", text: "یه ایراد داره" },
      { id: "others_better", text: "بقیه بهتر انجام دادن" }
    ],
    emotions: [
      { id: "pressure", text: "فشار" },
      { id: "anxiety", text: "اضطراب" },
      { id: "guilt", text: "گناه" },
      { id: "exhaustion", text: "فرسودگی" }
    ],
    behaviors: [
      { id: "overwork", text: "بیش از حد کار می‌کنم" },
      { id: "recheck", text: "چند بار چک می‌کنم" },
      { id: "cant_finish", text: "نمی‌تونم تمام کنم" },
      { id: "no_rest", text: "استراحت نمی‌کنم" },
      { id: "critical_self", text: "از خودم انتقاد می‌کنم" },
      { id: "redo", text: "دوباره انجام می‌دم" }
    ]
  },

  punitiveness: {
    triggers: [
      { id: "mistake_mine", text: "اشتباه کردم" },
      { id: "mistake_other", text: "کسی اشتباه کرد" },
      { id: "late", text: "دیر رسیدم" },
      { id: "forgot", text: "چیزی رو فراموش کردم" },
      { id: "broken_promise", text: "قولی که داده بودم رو نشکستم ولی حس کردم کم گذاشتم" },
      { id: "rule_broken", text: "قانونی نقض شد" },
      { id: "own_imperfection", text: "خودم رو ناقص دیدم" },
      { id: "others_wrong", text: "دیدم کسی کار اشتباهی می‌کنه" }
    ],
    thoughts: [
      { id: "must_pay", text: "باید تاوان بده" },
      { id: "unforgivable", text: "بخشیدنی نیست" },
      { id: "self_blame", text: "من مقصرم" },
      { id: "deserve_punish", text: "سزاوار تنبیهم" },
      { id: "must_suffer", text: "باید رنج بکشم" }
    ],
    emotions: [
      { id: "anger", text: "خشم" },
      { id: "shame", text: "شرم" },
      { id: "guilt", text: "گناه" },
      { id: "self_hate", text: "خشم از خود" }
    ],
    behaviors: [
      { id: "self_blame", text: "خودم رو سرزنش می‌کنم" },
      { id: "harsh_criticism", text: "سخت انتقاد می‌کنم" },
      { id: "punish_self", text: "خودم رو تنبیه می‌کنم" },
      { id: "cold_treatment", text: "سرد برخورد می‌کنم" },
      { id: "grudge", text: "کینه نگه می‌دارم" },
      { id: "reject_forgiveness", text: "نمی‌بخشم" }
    ]
  }
};

// ادغام با SCHEMAS
export function mergeAdditions(schemas) {
  for (const schema of schemas) {
    const add = SCHEMAS_ADDITIONS[schema.id];
    if (!add) continue;
    schema.triggers = [...schema.triggers, ...(add.triggers || [])];
    schema.automatic_thoughts = [...schema.automatic_thoughts, ...(add.thoughts || [])];
    schema.emotional_signals = [...schema.emotional_signals, ...(add.emotions || [])];
    schema.behavioral_patterns = [...schema.behavioral_patterns, ...(add.behaviors || [])];
  }
  return schemas;
}
