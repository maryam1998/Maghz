// CURATED_OPTIONS.js
// گزینه‌های نهایی و یکدست چهار مرحلهٔ «شناخت»:
// محرک‌ها ← افکار ← احساسات ← رفتارها
//
// این فایل جایگزین محتوای ادغام‌شدهٔ SCHEMAS + SCHEMAS_ADDITIONS + TRIGGERS_EXTRA می‌شود.
// - هر مفهوم فقط یک بار آمده (نسخه‌های تکراری و هم‌معنا در هم ادغام شده‌اند).
// - لحن یکدست: محرک‌ها = موقعیت کوتاه، افکار = حرف درونی اول‌شخص،
//   احساسات = یک کلمه، رفتارها = فعل اول‌شخص.
// - idهایی که در قوانین تمرین (rules) و پاسخ‌های جایگزین (replacement_responses) استفاده
//   می‌شوند حفظ شده‌اند.
// - idهای حذف‌شده همچنان در تاریخچهٔ قبلیِ کاربر با متن قدیمی‌شان نمایش داده می‌شوند.

export const CURATED_OPTIONS = {
  /* ───────────── ۱. رهاشدگی ───────────── */
  abandonment: {
    triggers: [
      ["late_reply", "کسی که برام مهمه دیر جواب داد"],
      ["seen_not_replied", "پیامم دیده شد ولی جوابی نیومد"],
      ["less_attention", "کمتر زنگ می‌زنه و کمتر پیام می‌ده"],
      ["distance_ab", "حس کردم رفتارش عوض شده و داره فاصله می‌گیره"],
      ["conflict", "بحث یا دلخوری پیش اومد"],
      ["unclear_future", "نمی‌دونستم این رابطه قراره به کجا برسه"],
      ["friend_busy_add", "کسی که بهش نزدیکم سرش شلوغ بود و وقت نذاشت"],
      ["weekend_alone_add", "آخر هفته تنها موندم"],
      ["photos_group_add", "عکس جمعی دیدم که توش نبودم"]
    ],
    thoughts: [
      ["moving_away", "داره ازم دور می‌شه"],
      ["not_important", "دیگه براش مهم نیستم"],
      ["will_leave", "آخرش منو ول می‌کنه"],
      ["tired_of_me_add", "از من خسته شده"],
      ["busy_with_other_add", "حتماً یکی دیگه جای منو گرفته"],
      ["something_bad", "حتماً اتفاقی افتاده یا از دستم ناراحته"],
      ["not_worth_add", "من ارزش وقت گذاشتن ندارم"],
      ["must_act", "باید کاری کنم که نره"]
    ],
    emotions: [
      ["anxiety", "اضطراب"],
      ["fear_ab", "ترس از دست دادن"],
      ["anger", "خشم"],
      ["longing", "دلتنگی"],
      ["emptiness_add", "پوچی"],
      ["jealousy_add", "حسادت"],
      ["betrayal_add", "احساس خیانت"]
    ],
    behaviors: [
      ["repeated_messaging", "پشت‌سرهم پیام می‌دم"],
      ["checking_ab", "مدام آنلاین بودنش و صفحه‌هاش رو چک می‌کنم"],
      ["clinging", "بیش از حد بهش می‌چسبم"],
      ["testing_ab", "امتحانش می‌کنم ببینم واقعاً دوستم داره یا نه"],
      ["preemptive_exit", "قبل از اینکه منو ترک کنه، خودم رابطه رو تموم می‌کنم"],
      ["ask_friends_add", "از دوستای مشترک درباره‌ش می‌پرسم"],
      ["silent_treatment_add", "قهر می‌کنم"],
      ["pretend_busy_add", "وانمود می‌کنم سرم شلوغه"]
    ]
  },

  /* ───────────── ۲. بی‌اعتمادی / بدرفتاری ───────────── */
  mistrust_abuse: {
    triggers: [
      ["ambiguous_behavior", "رفتار یا جوابش مبهم بود"],
      ["broken_promise", "قولی که داده بود عمل نشد"],
      ["lie", "فهمیدم دروغ گفته"],
      ["criticism", "کسی از من انتقاد کرد یا ایراد گرفت"],
      ["dependence", "مجبور شدم به کسی تکیه کنم"],
      ["phone_hidden_add", "گوشی‌ش رو ازم پنهان کرد"],
      ["late_night_add", "دیروقت بیرون بود و توضیحی نداد"],
      ["password_changed_add", "رمزهاش رو عوض کرد"],
      ["secret_call_add", "مخفیانه تلفنی حرف زد یا با کسی پچ‌پچ کرد"],
      ["unexpected_gift_add", "بی‌دلیل بهم هدیه یا محبت کرد"]
    ],
    thoughts: [
      ["hidden_motive", "حتماً یه قصدی پشتشه"],
      ["no_trust", "نباید به کسی اعتماد کنم"],
      ["will_get_hurt", "اگه اعتماد کنم، آسیب می‌بینم"],
      ["will_be_used", "می‌خواد ازم سوءاستفاده کنه"],
      ["hiding_something_add", "داره چیزی رو ازم پنهان می‌کنه یا دروغ می‌گه"],
      ["cheating_add", "داره بهم خیانت می‌کنه"]
    ],
    emotions: [
      ["fear", "ترس"],
      ["anger", "خشم"],
      ["pessimism", "بدبینی"],
      ["hyper_vigil", "گوش‌به‌زنگی دائم"],
      ["distrust_add", "بی‌اعتمادی"],
      ["vulnerability_add", "آسیب‌پذیری"]
    ],
    behaviors: [
      ["interrogation", "سؤال‌پیچش می‌کنم"],
      ["testing", "پنهانی امتحانش می‌کنم ببینم راست می‌گه یا نه"],
      ["controlling", "رفت‌وآمد و کارهاش رو کنترل می‌کنم"],
      ["hiding", "چیزی از خودم بروز نمی‌دم"],
      ["distance", "ازش فاصله می‌گیرم"],
      ["check_phone_add", "گوشی‌ش رو چک می‌کنم"],
      ["search_online_add", "دنبال ردی ازش توی اینترنت می‌گردم"],
      ["confront_accuse_add", "رودررو متهمش می‌کنم"]
    ]
  },

  /* ───────────── ۳. محرومیت هیجانی ───────────── */
  emotional_deprivation: {
    triggers: [
      ["ignored", "حالم بد بود و کسی نپرسید چی شده"],
      ["talked_ignored_add", "حرف زدم ولی کسی واقعاً گوش نداد"],
      ["no_empathy", "درددلم رو با سردی یا نصیحت جواب دادن"],
      ["no_talk", "کنار هم بودیم ولی از احساسمون حرفی نزدیم"],
      ["no_hug_add", "مدتیه کسی بغلم نکرده"],
      ["alone_weekend_add", "آخر هفته کسی سراغم رو نگرفت"],
      ["asked_others_add", "دیدم از بقیه احوال‌پرسی شد و از من نه"],
      ["busy_all_add", "همه سرشون شلوغ بود و جایی برای من نبود"]
    ],
    thoughts: [
      ["not_understood", "کسی منو نمی‌فهمه"],
      ["needs_ignored", "برای هیچ‌کس مهم نیستم"],
      ["expect_nothing", "نباید انتظار چیزی داشته باشم"],
      ["always_alone_add", "همیشه تنهام"],
      ["waste_add", "نباید وقت کسی رو بگیرم"],
      ["why_try_add", "چرا اصلاً بگم؟ فایده‌ای نداره"]
    ],
    emotions: [
      ["loneliness", "تنهایی"],
      ["sadness", "غم"],
      ["emptiness", "خلأ"],
      ["hopeless", "ناامیدی"],
      ["longing_add", "دلتنگی"]
    ],
    behaviors: [
      ["silent_needs", "نیازهام رو نمی‌گم"],
      ["mind_reading", "منتظرم خودشون بفهمن"],
      ["unavailable_pick", "سراغ آدم‌هایی می‌رم که از نظر عاطفی در دسترس نیستن"],
      ["withdrawal_add", "کنار می‌کشم و خودم رو جدا می‌کنم"],
      ["passive_sad_add", "توی خودم غصه می‌خورم"]
    ]
  },

  /* ───────────── ۴. نقص / شرم ───────────── */
  defectiveness_shame: {
    triggers: [
      ["mistake", "جلوی دیگران اشتباه کردم"],
      ["criticism", "کسی از من انتقاد کرد یا ایراد گرفت"],
      ["compared_ds", "خودم رو با یکی مقایسه کردم یا مقایسه‌م کردن"],
      ["rejection", "ردم کردن"],
      ["showing_weak", "مجبور شدم ضعفم رو نشون بدم"],
      ["mirror_add", "خودم رو توی آینه دیدم"],
      ["old_photo_add", "خودم رو توی یه عکس دیدم"],
      ["praised_add", "کسی ازم تعریف کرد و باورم نشد"]
    ],
    thoughts: [
      ["i_am_broken", "یه چیزی توی من اشتباهه"],
      ["if_known", "اگه واقعاً منو بشناسن، قبولم نمی‌کنن"],
      ["not_good_enough", "به اندازهٔ کافی خوب نیستم"],
      ["not_deserve_add", "لیاقت این چیزها رو ندارم"],
      ["fake_person_add", "دارم نقش بازی می‌کنم"]
    ],
    emotions: [
      ["shame", "شرم"],
      ["humiliation_add", "تحقیر شدن"],
      ["anxiety", "اضطراب"],
      ["sadness", "غم"],
      ["self_hate_add", "تنفر از خودم"]
    ],
    behaviors: [
      ["hide_weakness", "ضعف‌هام رو پنهان می‌کنم"],
      ["over_apology", "زیاد عذرخواهی می‌کنم"],
      ["perfectionism_ds", "برای جبران، همه‌چیز رو بی‌نقص و زیاد انجام می‌دم"],
      ["comparison", "خودم رو با بقیه مقایسه می‌کنم"],
      ["reject_praise_add", "تعریف رو رد می‌کنم"],
      ["avoid_mirror_add", "از آینه و عکس فرار می‌کنم"],
      ["self_criticism_add", "خودم رو سرزنش می‌کنم"]
    ]
  },

  /* ───────────── ۵. انزوای اجتماعی ───────────── */
  social_isolation: {
    triggers: [
      ["social_gather", "به یه مهمونی یا دورهمی دعوت شدم"],
      ["peer_ease_si", "دیدم بقیه چقدر راحت با هم گرم می‌گیرن"],
      ["feeling_diff", "حس کردم با بقیه فرق دارم"],
      ["group_rejection", "از یه گروه کنار گذاشته شدم"],
      ["group_photo_si", "عکس جمعی دیدم که توش نبودم"],
      ["couple_invite_si", "به جمعی دعوت شدم که همه زوج بودن"],
      ["old_friends_meet_si", "دوستای قدیمی دور هم جمع شدن و من نبودم"],
      ["new_group_si", "وارد یه جمع جدید شدم"],
      ["weekend_silent_si", "آخر هفته بدون هیچ تماسی گذشت"]
    ],
    thoughts: [
      ["not_like_others", "من مثل بقیه نیستم"],
      ["no_belonging", "اینجا به من تعلق نداره؛ من غریبه‌ام"],
      ["nobody_gets_me", "هیچ‌کس منو نمی‌فهمه"],
      ["left_out_si", "منو کنار می‌ذارن"]
    ],
    emotions: [
      ["loneliness", "تنهایی"],
      ["alienation_si", "بیگانگی"],
      ["anxiety", "اضطراب"],
      ["embarrass", "خجالت و معذب بودن"]
    ],
    behaviors: [
      ["withdrawal", "وسط جمع خودم رو کنار می‌کشم"],
      ["silence_si", "توی جمع ساکت می‌مونم"],
      ["skip_gather", "دعوت‌ها رو رد می‌کنم و از جمع دوری می‌کنم"],
      ["leave_early_si", "زودتر از بقیه می‌رم"],
      ["fake_smile_si", "الکی لبخند می‌زنم و وانمود می‌کنم راحتم"],
      ["scroll_phone_si", "خودم رو با گوشی مشغول می‌کنم"]
    ]
  },

  /* ───────────── ۶. وابستگی / بی‌کفایتی ───────────── */
  dependence_incompetence: {
    triggers: [
      ["decision", "باید تصمیم مهمی می‌گرفتم"],
      ["new_task", "کار جدیدی بهم سپرده شد"],
      ["responsibility", "مسئولیت یه کار افتاد رو دوشم"],
      ["possible_mistake", "ترسیدم اشتباه کنم"],
      ["left_alone_dp", "تنها موندم"],
      ["no_advisor_dp", "کسی نبود که مشورت یا کمک بگیرم"],
      ["cook_alone_dp", "باید خودم از پس یه کار روزمره برمی‌اومدم"],
      ["technical_problem_dp", "مشکل فنی پیش اومد"]
    ],
    thoughts: [
      ["cant_handle", "از پسش برنمیام"],
      ["need_help", "بدون کمک نمی‌تونم؛ یکی باید کمکم کنه"],
      ["will_ruin", "خرابش می‌کنم"],
      ["not_capable_dp", "من اصلاً توانمند نیستم"]
    ],
    emotions: [
      ["anxiety", "اضطراب"],
      ["fear", "ترس"],
      ["doubt", "تردید"],
      ["helplessness_dp", "درماندگی"]
    ],
    behaviors: [
      ["early_help", "قبل از اینکه خودم تلاش کنم، سریع کمک می‌خوام"],
      ["delegate", "تصمیم رو می‌سپرم به یکی دیگه"],
      ["reassurance_dp", "از چند نفر می‌پرسم تا مطمئن بشم"],
      ["wait_help_dp", "منتظر می‌مونم یکی کمک کنه"],
      ["postpone_dp", "کار رو عقب می‌ندازم"]
    ]
  },

  /* ───────────── ۷. آسیب‌پذیری نسبت به خطر ───────────── */
  vulnerability: {
    triggers: [
      ["bad_news", "خبر بدی شنیدم؛ مثل بیماری یا حادثه"],
      ["body_signals", "یه درد یا علامت جسمی حس کردم"],
      ["travel", "قرار بود سفر برم"],
      ["unknown", "وارد یه موقعیت ناشناخته شدم"],
      ["possible_danger", "حس کردم ممکنه خطری در کار باشه"],
      ["alone_at_night_vu", "شب بود و تنها بودم"],
      ["spouse_late_vu", "یکی از عزیزانم دیر به خونه رسید"],
      ["money_worry_vu", "نگرانی مالی پیش اومد"],
      ["unexpected_call_vu", "تماس غیرمنتظره‌ای گرفتم"]
    ],
    thoughts: [
      ["disaster", "نکنه اتفاق بدی بیفته"],
      ["dangerous", "ممکنه خطرناک باشه"],
      ["must_check", "باید مطمئن بشم"],
      ["cant_cope_vu", "اگه اتفاق بیفته، نمی‌تونم تحملش کنم"],
      ["unsafe_vu", "من در امان نیستم"]
    ],
    emotions: [
      ["fear", "ترس"],
      ["anxiety", "اضطراب"],
      ["hyper", "گوش‌به‌زنگی"],
      ["tension_vu", "تنش بدنی"]
    ],
    behaviors: [
      ["checking", "مدام چک می‌کنم که همه‌چیز امنه"],
      ["reassurance", "از بقیه اطمینان می‌گیرم"],
      ["avoid", "از موقعیت‌های نامطمئن دوری می‌کنم"],
      ["google_search_vu", "توی اینترنت دنبال علائم و خبرها می‌گردم"],
      ["control_vu", "برای احتیاط، همه‌چیز رو تا آخر کنترل می‌کنم"]
    ]
  },

  /* ───────────── ۸. درهم‌تنیدگی ───────────── */
  enmeshment: {
    triggers: [
      ["independent_decision", "خواستم مستقل تصمیم بگیرم"],
      ["disagreement_en", "با خانواده یا نزدیکانم اختلاف نظر پیدا کردم"],
      ["their_displeasure", "یکی از نزدیکانم از من ناراحت یا ناراضی بود"],
      ["different_path", "مسیری متفاوت از اونا انتخاب کردم"],
      ["partner_mood_en", "حال همسرم یا یکی از نزدیکانم بد بود"],
      ["friend_need_en", "دوستی به کمکم نیاز داشت"],
      ["expected_same_en", "ازم انتظار داشتن مثل اونا باشم"]
    ],
    thoughts: [
      ["they_upset", "اگه مخالفت کنم، ناراحت می‌شن و تقصیر منه"],
      ["must_agree", "باید مثل اونا فکر کنم و موافق باشم"],
      ["dont_know_self", "نمی‌دونم خودم واقعاً چی می‌خوام"],
      ["responsible_en", "من مسئول حال اونام"],
      ["no_self_en", "من بدون اونا گم می‌شم"]
    ],
    emotions: [
      ["guilt", "گناه"],
      ["anxiety", "اضطراب"],
      ["confusion", "سردرگمی"],
      ["emptiness_en", "پوچی"]
    ],
    behaviors: [
      ["over_adapt", "همیشه موافقت می‌کنم و خودم رو باهاشون وفق می‌دم"],
      ["their_choice", "تصمیم‌های مهمم رو بر اساس خواستهٔ اونا می‌گیرم"],
      ["ask_first_en", "قبل از هر کاری از اونا می‌پرسم"],
      ["abandon_self_en", "خواسته‌های خودم رو فراموش می‌کنم"],
      ["avoid_different_en", "از متفاوت بودن با اونا فرار می‌کنم"]
    ]
  },

  /* ───────────── ۹. شکست ───────────── */
  failure: {
    triggers: [
      ["new_start", "قرار شد کار جدیدی شروع کنم"],
      ["peer_success_fa", "دیدم یکی هم‌سن یا هم‌رشتهٔ من موفق شده"],
      ["negative_feedback", "بازخورد منفی گرفتم"],
      ["past_failure", "یاد شکستی که قبلاً داشتم افتادم"],
      ["deadline_fa", "مهلت کار نزدیک بود"],
      ["exam_fa", "باید امتحان می‌دادم"],
      ["unfinished_task_fa", "کارهای نیمه‌تمومم یادم اومد"],
      ["birthday_fa", "تولدم بود یا به گذشته و پیشرفتم فکر کردم"]
    ],
    thoughts: [
      ["cant", "از پسش برنمیام"],
      ["will_fail", "آخرش شکست می‌خورم"],
      ["others_better", "بقیه از من بهترن و جلوترن"],
      ["waste_fa", "زندگیم داره هدر می‌ره"]
    ],
    emotions: [
      ["shame", "شرم"],
      ["hopeless", "ناامیدی"],
      ["fear_fa", "ترس از شکست"],
      ["envy_fa", "حسادت"]
    ],
    behaviors: [
      ["procrastinate", "کار رو مدام عقب می‌ندازم"],
      ["not_start", "از ترس اینکه خوب از آب درنیاد، اصلاً شروعش نمی‌کنم"],
      ["comparison", "خودم رو با بقیه مقایسه می‌کنم"],
      ["give_up_fa", "زود ولش می‌کنم"],
      ["self_doubt_fa", "به توانایی خودم شک می‌کنم"],
      ["overcompensate_fa", "برای جبران، بیش از حد خودم رو تحت فشار می‌ذارم"]
    ]
  },

  /* ───────────── ۱۰. استحقاق ───────────── */
  entitlement: {
    triggers: [
      ["hearing_no", "کسی بهم نه گفت"],
      ["limitation", "با یه محدودیت روبه‌رو شدم"],
      ["waiting", "توی صف، ترافیک یا انتظار سفارش معطل شدم"],
      ["not_getting", "چیزی که می‌خواستم رو نگرفتم"],
      ["delayed_response_et", "دیر جواب گرفتم"],
      ["customer_service_et", "باهام بد برخورد شد"],
      ["not_first_et", "نوبتم عقب افتاد و اول نبودم"]
    ],
    thoughts: [
      ["my_right", "این حق منه"],
      ["why_wait", "چرا باید صبر کنم؟"],
      ["special", "برای من باید فرق داشته باشه"],
      ["disrespect_et", "بهم بی‌احترامی شد"],
      ["not_fair_et", "این عادلانه نیست"]
    ],
    emotions: [
      ["anger", "خشم"],
      ["low_tolerance_em", "کم‌تحملی"],
      ["frustration", "ناکامی"],
      ["offense_et", "رنجش"]
    ],
    behaviors: [
      ["insist", "اصرار و مطالبه می‌کنم تا حرفم پیش بره"],
      ["ignore_others", "نیاز و شرایط طرف مقابل رو نادیده می‌گیرم"],
      ["low_tolerance", "محدودیت‌ها رو تحمل نمی‌کنم"],
      ["complain_et", "شکایت می‌کنم"],
      ["loud_voice_et", "صدام رو بالا می‌برم"],
      ["rage_quit_et", "با عصبانیت ترک می‌کنم"],
      ["blame_others_et", "دیگران رو مقصر می‌دونم"]
    ]
  },

  /* ───────────── ۱۱. خویشتن‌داری ناکافی ───────────── */
  insufficient_self_control: {
    triggers: [
      ["fatigue_sc", "خسته بودم"],
      ["boredom_sc", "حوصله‌م سر رفته بود"],
      ["hard_task", "کار سختی جلوم بود"],
      ["tempting_thing_sc", "یه چیز وسوسه‌کننده در دسترس بود"],
      ["notification_sc", "نوتیفیکیشن گوشی اومد"],
      ["late_night_sc", "شب بود و باید می‌خوابیدم"],
      ["sale_sc", "حراج یا تخفیف آنلاین دیدم"]
    ],
    thoughts: [
      ["later", "بعداً انجامش می‌دم"],
      ["no_energy", "الان حوصله‌ش رو ندارم"],
      ["just_once", "فقط همین یه بار"],
      ["cant_resist_sc", "نمی‌تونم جلوی خودم رو بگیرم"],
      ["deserve_sc", "الان حقمه"]
    ],
    emotions: [
      ["boredom", "بی‌حوصلگی"],
      ["restless", "کلافگی"],
      ["craving", "وسوسه"]
    ],
    behaviors: [
      ["procrastinate", "کار رو مدام عقب می‌ندازم"],
      ["quit", "کار رو نیمه‌کاره ول می‌کنم"],
      ["instant_reward", "فوری خودم رو راضی می‌کنم"],
      ["scroll_sc", "به‌جای کار، بی‌هدف اسکرول می‌کنم"],
      ["eat_impulse_sc", "بی‌فکر می‌خورم"],
      ["spend_sc", "بی‌فکر خرج می‌کنم"]
    ]
  },

  /* ───────────── ۱۲. اطاعت / تسلیم ───────────── */
  subjugation: {
    triggers: [
      ["request", "رئیس، دوست یا همکار ازم کاری خواست"],
      ["their_upset", "احتمال دادم طرف مقابل ناراحت بشه"],
      ["disagreement_su", "نظرم با کسی فرق داشت"],
      ["family_wants_su", "خانواده ازم انتظاری داشتن"],
      ["guilt_pressure_su", "کسی با القای احساس گناه تحت فشارم گذاشت"],
      ["authority_figure_su", "کسی با لحن آمرانه حرف زد"]
    ],
    thoughts: [
      ["must_accept", "چاره‌ای ندارم، باید قبول کنم"],
      ["they_upset_if_no", "اگه نه بگم، ناراحت می‌شه"],
      ["trouble", "دردسر درست می‌شه"],
      ["no_right_su", "من حق ندارم نظرم رو بگم"],
      ["peace_more_su", "آرامش رابطه مهم‌تر از نظر منه"],
      ["self_blame_su", "اگه اتفاقی بیفته، تقصیر منه"]
    ],
    emotions: [
      ["guilt", "گناه"],
      ["fear_su", "ترس از مخالفت"],
      ["suppressed_anger", "خشم فروخورده"],
      ["helplessness_su", "درماندگی"]
    ],
    behaviors: [
      ["forced_yes", "بله می‌گم، حتی وقتی نمی‌خوام"],
      ["silence", "نظر و احساسم رو نمی‌گم"],
      ["put_others_first", "همیشه خواستهٔ دیگران رو اول می‌ذارم"],
      ["passive_aggressive_su", "به‌جای گفتنش، غیرمستقیم نشون می‌دم"],
      ["avoid_conflict_su", "از هر تعارضی دوری می‌کنم"],
      ["apologize_first_su", "اول خودم عذرخواهی می‌کنم"]
    ]
  },

  /* ───────────── ۱۳. ایثار ───────────── */
  self_sacrifice: {
    triggers: [
      ["others_need", "یکی از نزدیکانم به کمک نیاز داشت"],
      ["guilt_feeling", "احساس گناه کردم که کمک نکردم"],
      ["others_suffer", "دیدم کسی داره رنج می‌کشه"],
      ["help_request", "کسی ازم کمک خواست"],
      ["friend_crisis_ss", "دوستی توی بحران بود"],
      ["no_one_else_ss", "فکر کردم اگه من نکنم، هیچ‌کس نمی‌کنه"],
      ["sick_relative_ss", "یکی از عزیزانم بیمار بود"]
    ],
    thoughts: [
      ["must_help", "باید کمک کنم"],
      ["my_needs_last", "نیازهای من اولویت نداره"],
      ["bad_person", "اگه کمک نکنم، آدم بدی‌ام"],
      ["selfish_ss", "اگه خودم رو اول بذارم، خودخواهم"],
      ["no_choice_ss", "چاره‌ای ندارم"]
    ],
    emotions: [
      ["guilt", "گناه"],
      ["fatigue", "خستگی"],
      ["hidden_resentment", "رنجش پنهان"]
    ],
    behaviors: [
      ["over_help", "بیش از توانم کمک می‌کنم"],
      ["neglect_self", "نیازهای خودم رو نادیده می‌گیرم"],
      ["over_responsible", "مسئولیت کارهای بقیه رو هم به عهده می‌گیرم"],
      ["yes_always_ss", "به هر درخواستی بله می‌گم"],
      ["silent_burnout_ss", "در سکوت فرسوده می‌شم"]
    ]
  },

  /* ───────────── ۱۴. تأییدطلبی ───────────── */
  approval_seeking: {
    triggers: [
      ["criticism", "کسی از من انتقاد کرد یا ایراد گرفت"],
      ["ignored_ap", "پیامم بی‌جواب موند یا حس کردم نادیده گرفته می‌شم"],
      ["compared_ap", "با یکی مقایسه شدم"],
      ["others_opinion", "به نظر دیگران دربارهٔ خودم فکر کردم"],
      ["posted_ap", "چیزی پست کردم و منتظر لایک و واکنش موندم"],
      ["no_compliment_ap", "کسی ازم تعریف نکرد"],
      ["social_gathering_ap", "توی یه جمع حاضر شدم"],
      ["disapproval_ap", "توی نگاه یا لحن کسی نارضایتی دیدم"]
    ],
    thoughts: [
      ["must_approve", "باید تأییدم کنن"],
      ["not_good", "اگه خوششون نیاد، یعنی خوب نیستم"],
      ["must_be_seen", "اگه دیده نشم، ارزشی ندارم"],
      ["what_think_ap", "دربارهٔ من چی فکر می‌کنن؟"],
      ["be_liked_ap", "همه باید دوستم داشته باشن"]
    ],
    emotions: [
      ["anxiety", "اضطراب"],
      ["shame", "شرم"],
      ["insecurity", "ناامنی"],
      ["rejection_fear_ap", "ترس از طرد شدن"]
    ],
    behaviors: [
      ["change_behavior", "برای رضایت بقیه خودم رو تغییر می‌دم و با همه موافق می‌شم"],
      ["comparison", "خودم رو با بقیه مقایسه می‌کنم"],
      ["feedback_hunt", "مدام از بقیه بازخورد می‌گیرم"],
      ["social_media_check_ap", "لایک‌ها رو چک می‌کنم"],
      ["show_off_ap", "خودنمایی می‌کنم"],
      ["avoid_judgment_ap", "از قضاوت شدن فرار می‌کنم"]
    ]
  },

  /* ───────────── ۱۵. منفی‌گرایی ───────────── */
  negativity: {
    triggers: [
      ["unknown_future", "به آیندهٔ نامعلوم فکر کردم"],
      ["bad_news_ne", "خبر بد شنیدم یا خوندم"],
      ["risk", "باید ریسک می‌کردم"],
      ["big_decision", "تصمیم مهمی جلوم بود"],
      ["weekend_over_ne", "آخر هفته تموم شد"],
      ["bad_weather_ne", "هوا بد بود"],
      ["mistake_me_ne", "اشتباه کردم"],
      ["good_thing_ne", "چیز خوبی پیش اومد و نگران شدم"]
    ],
    thoughts: [
      ["will_break", "حتماً خراب می‌شه"],
      ["bad_will_happen", "آخرش اتفاق بدی می‌افته"],
      ["useless", "فایده‌ای نداره؛ چرا تلاش کنم؟"],
      ["always_bad_ne", "همیشه اوضاع من بد بوده"]
    ],
    emotions: [
      ["anxiety", "اضطراب"],
      ["fear", "ترس"],
      ["hopeless", "ناامیدی"]
    ],
    behaviors: [
      ["focus_problem", "فقط روی مشکل و بدی‌ها تمرکز می‌کنم"],
      ["predict_disaster", "بدترین اتفاق رو پیش‌بینی می‌کنم و نگران می‌مونم"],
      ["reject_opportunity", "فرصت‌ها رو رد می‌کنم"],
      ["complain_ne", "شکایت می‌کنم"]
    ]
  },

  /* ───────────── ۱۶. بازداری هیجانی ───────────── */
  emotional_inhibition: {
    triggers: [
      ["expressing_anger", "عصبانی شدم و چیزی نگفتم"],
      ["crying", "دلم می‌خواست گریه کنم ولی خودم رو کنترل کردم"],
      ["affection", "خواستم محبتم رو بگم ولی نگفتم"],
      ["vulnerability", "دلم شکست ولی ساکت موندم"],
      ["disagreement_ei", "با کسی اختلاف نظر داشتم و نظرم رو نگفتم"],
      ["tired_said_ei", "خسته بودم ولی گفتم خوبم"],
      ["compliment_ei", "تعریفی شنیدم و بی‌تفاوت موندم"]
    ],
    thoughts: [
      ["dont_show", "بهتره احساساتم رو نشون ندم"],
      ["weakness", "نشون دادن احساس یعنی ضعف"],
      ["control_self", "باید خودم رو کنترل کنم"],
      ["burden_ei", "برای دیگران سربار می‌شم"],
      ["handle_alone_ei", "باید خودم تنهایی تحملش کنم"]
    ],
    emotions: [
      ["inner_pressure", "فشار درونی"],
      ["numb", "بی‌حسی"],
      ["tension", "تنش بدنی"]
    ],
    behaviors: [
      ["silence_ei", "ساکت می‌مونم"],
      ["hide_feeling", "احساسم رو پنهان می‌کنم و می‌گم خوبم"],
      ["over_logic", "احساسم رو با منطق توضیح می‌دم"],
      ["change_subject_ei", "بحث رو عوض می‌کنم"],
      ["isolate_ei", "تنها می‌شم تا کسی نبینه"]
    ]
  },

  /* ───────────── ۱۷. معیارهای سختگیرانه ───────────── */
  unrelenting_standards: {
    triggers: [
      ["mistake_us", "اشتباه کوچیکی کردم"],
      ["others_perf", "دیدم کار بقیه چقدر خوب پیش رفته"],
      ["unfinished", "کارم نیمه‌تموم موند"],
      ["rest", "وقت استراحت یا آخر هفتهٔ بی‌کار داشتم"],
      ["work_done_us", "کارم رو تموم کردم ولی راضی نیستم"],
      ["checked_details_us", "جزئیات کارم رو دوباره بازبینی کردم"],
      ["compliment_work_us", "از کارم تعریف شد و باور نکردم"]
    ],
    thoughts: [
      ["must_be_better", "باید بهتر باشم"],
      ["not_enough", "این کافی نیست"],
      ["no_mistake", "نباید اشتباه کنم"],
      ["no_rest_us", "استراحت یعنی تنبلی"],
      ["flaw_us", "هنوز یه ایراد داره"],
      ["others_better_us", "بقیه بهتر از من انجامش می‌دن"]
    ],
    emotions: [
      ["pressure", "فشار"],
      ["anxiety", "اضطراب"],
      ["guilt", "گناه"],
      ["exhaustion_us", "فرسودگی"]
    ],
    behaviors: [
      ["perfectionism", "همه‌چیز رو بی‌نقص می‌خوام"],
      ["overwork", "بیش از حد کار می‌کنم و استراحت نمی‌کنم"],
      ["revision", "چند بار بازبینی و دوباره‌کاری می‌کنم"],
      ["cant_finish_us", "نمی‌تونم کار رو تموم‌شده اعلام کنم"],
      ["critical_self_us", "از خودم انتقاد می‌کنم"]
    ]
  },

  /* ───────────── ۱۸. تنبیه‌گری ───────────── */
  punitiveness: {
    triggers: [
      ["own_mistake", "خودم اشتباهی کردم"],
      ["others_mistake", "دیدم کسی اشتباه کرد"],
      ["rule_broken", "کسی قانون یا قراری رو زیر پا گذاشت"],
      ["plans_failed_pu", "کارها طبق برنامه پیش نرفت"],
      ["late_pu", "دیر رسیدم یا چیزی رو فراموش کردم"],
      ["own_imperfection_pu", "توی خودم نقصی دیدم"]
    ],
    thoughts: [
      ["must_pay", "اون باید تاوانش رو پس بده"],
      ["unacceptable", "این اشتباه بخشیدنی نیست"],
      ["cant_forgive_self", "نباید خودمو ببخشم"],
      ["self_blame_pu", "من مقصرم"],
      ["deserve_punish_pu", "سزاوار تنبیهم"]
    ],
    emotions: [
      ["anger", "خشم"],
      ["shame", "شرم"],
      ["guilt", "گناه"],
      ["self_hate_pu", "تنفر از خودم"]
    ],
    behaviors: [
      ["self_blame", "خودم رو سرزنش می‌کنم"],
      ["strictness", "با خودم و بقیه سختگیری می‌کنم"],
      ["harsh_criticism", "تند و بی‌رحمانه انتقاد می‌کنم"],
      ["punish_self_pu", "خودم رو از چیزهایی که دوست دارم محروم می‌کنم"],
      ["cold_treatment_pu", "سرد برخورد می‌کنم"],
      ["grudge_pu", "نمی‌بخشم و کینه نگه می‌دارم"]
    ]
  }
};

/* =========================================================
 * اعمال گزینه‌ها روی طرحواره‌ها
 * ========================================================= */

const FIELD_MAP = {
  triggers: "triggers",
  thoughts: "automatic_thoughts",
  emotions: "emotional_signals",
  behaviors: "behavioral_patterns"
};

const _applied = new WeakSet();

/**
 * فهرست‌های هر طرحواره را با نسخهٔ منتخب جایگزین می‌کند.
 * خروجی: نگاشت id → متن قدیمی برای همهٔ گزینه‌های قبلی،
 * تا رکوردهای ذخیره‌شدهٔ قبلی همچنان برچسب داشته باشند.
 */
export function applyCuratedOptions(schemas) {
  const legacy = {};
  for (const schema of schemas) {
    if (_applied.has(schema)) continue;
    const cur = CURATED_OPTIONS[schema.id];
    if (!cur) continue;

    for (const [key, field] of Object.entries(FIELD_MAP)) {
      for (const item of schema[field] || []) {
        if (item && item.id) legacy[item.id] = item.text;
      }
      schema[field] = (cur[key] || []).map(([id, text]) => ({ id, text }));
    }
    _applied.add(schema);
  }
  return legacy;
}
