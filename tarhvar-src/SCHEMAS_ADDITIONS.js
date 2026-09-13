// SCHEMAS_ADDITIONS.js
// نسخه 2.0 — با Dedup و Idempotent

export const SCHEMAS_ADDITIONS = {
  abandonment: {
    triggers: [
      { id: "seen_not_replied", text: "کسی آنلاین است ولی جواب نمی‌دهد" },
      { id: "no_goodnight_add", text: "پیام شب‌بخیر نیامد" },
      { id: "friend_busy_add", text: "دوستی سرش شلوغ است" },
      { id: "partner_tired_add", text: "طرف مقابلم خسته و سرد است" },
      { id: "family_late_add", text: "خانواده دیر جواب می‌دهند" },
      { id: "weekend_alone_add", text: "آخر هفته را تنها ماندم" },
      { id: "no_call_add", text: "امروز زنگ نزد" },
      { id: "photos_group_add", text: "عکس گروهی دیدم که در آن نبودم" }
    ],
    thoughts: [
      { id: "he_forgot_add", text: "حتماً من رو فراموش کرده" },
      { id: "busy_with_other_add", text: "داره با یکی دیگه وقت می‌گذرونه" },
      { id: "tired_of_me_add", text: "از من خسته شده" },
      { id: "will_leave_add", text: "به‌زودی می‌ره" },
      { id: "not_worth_add", text: "من ارزش وقتش رو ندارم" }
    ],
    emotions: [
      { id: "emptiness_add", text: "پوچی" },
      { id: "betrayal_add", text: "احساس خیانت" },
      { id: "jealousy_add", text: "حسادت" }
    ],
    behaviors: [
      { id: "text_multiple_add", text: "چند پیام پشت سر هم می‌فرستم" },
      { id: "check_last_seen_add", text: "آخرین آنلاین بودنش رو چک می‌کنم" },
      { id: "ask_friends_add", text: "از دوستای مشترک می‌پرسم" },
      { id: "silent_treatment_add", text: "قهر می‌کنم" },
      { id: "pretend_busy_add", text: "وانمود می‌کنم سرم شلوغه" },
      { id: "social_media_add", text: "صفحه‌هاش رو چک می‌کنم" }
    ]
  },

  mistrust_abuse: {
    triggers: [
      { id: "phone_hidden_add", text: "گوشی‌اش را از من پنهان می‌کند" },
      { id: "late_night_add", text: "دیر وقت بیرون است" },
      { id: "new_friend_add", text: "دوست جدید پیدا کرده" },
      { id: "vague_answer_add", text: "جواب‌های مبهم می‌شنوم" },
      { id: "password_changed_add", text: "رمزها را عوض کرده" },
      { id: "secret_call_add", text: "تماس تلفنی مخفیانه" },
      { id: "whisper_add", text: "پچ‌پچ با دیگران" },
      { id: "unexpected_gift_add", text: "هدیه غیرمنتظره" }
    ],
    thoughts: [
      { id: "hiding_something_add", text: "داره چیزی رو پنهان می‌کنه" },
      { id: "cheating_add", text: "داره خیانت می‌کنه" },
      { id: "lying_add", text: "داره دروغ می‌گه" },
      { id: "using_me_add", text: "داره از من سوءاستفاده می‌کنه" },
      { id: "will_hurt_add", text: "به‌زودی به من ضربه می‌زنه" }
    ],
    emotions: [
      { id: "distrust_add", text: "بی‌اعتمادی شدید" },
      { id: "vulnerability_add", text: "احساس آسیب‌پذیری" }
    ],
    behaviors: [
      { id: "check_phone_add", text: "گوشی‌اش رو چک می‌کنم" },
      { id: "follow_add", text: "پشت سرش می‌رم" },
      { id: "interrogate_add", text: "سؤال‌های بازجویی می‌پرسم" },
      { id: "search_online_add", text: "دنبال اطلاعات آنلاین می‌گردم" },
      { id: "silent_test_add", text: "با سکوت امتحانش می‌کنم" },
      { id: "confront_accuse_add", text: "رو در رو متهمش می‌کنم" }
    ]
  },

  emotional_deprivation: {
    triggers: [
      { id: "no_question_add", text: "کسی از حالم نمی‌پرسد" },
      { id: "talked_ignored_add", text: "حرف زدم ولی کسی گوش نداد" },
      { id: "silent_dinner_add", text: "با هم شام خوردیم ولی حرفی نزدیم" },
      { id: "alone_weekend_add", text: "آخر هفته را تنها ماندم" },
      { id: "no_hug_add", text: "هفته‌هاست کسی من را بغل نکرده" },
      { id: "asked_others_add", text: "شنیدم کسی از حال دیگران پرسیده، نه من" },
      { id: "busy_all_add", text: "همه مشغول هستند" }
    ],
    thoughts: [
      { id: "nobody_cares_add", text: "هیچ‌کس به من اهمیت نمی‌ده" },
      { id: "always_alone_add", text: "همیشه تنهام" },
      { id: "not_important_add", text: "برای کسی مهم نیستم" },
      { id: "waste_add", text: "وقت کسی رو نمی‌گیرم" },
      { id: "why_try_add", text: "چرا اصلاً تلاش کنم؟" }
    ],
    emotions: [
      { id: "loneliness_deep_add", text: "تنهایی عمیق" },
      { id: "longing_add", text: "دلتنگی" }
    ],
    behaviors: [
      { id: "withdrawal_add", text: "کنار می‌کشم" },
      { id: "silence_add", text: "ساکت می‌مونم" },
      { id: "no_request_add", text: "نیاز نمی‌گم" },
      { id: "isolate_add", text: "خودم رو جدا می‌کنم" },
      { id: "expect_mind_reading_add", text: "منتظرم دیگران خودشون بفهمن" },
      { id: "passive_sad_add", text: "غصه می‌خورم" }
    ]
  },

  defectiveness_shame: {
    triggers: [
      { id: "mirror_add", text: "خودم را در آینه دیدم" },
      { id: "old_photo_add", text: "عکس قدیمی دیدم" },
      { id: "praised_add", text: "کسی از من تعریف کرد و باور نکردم" },
      { id: "public_mistake_add", text: "در جمع اشتباه کردم" },
      { id: "compared_add", text: "کسی من را با دیگری مقایسه کرد" },
      { id: "silent_disapproval_add", text: "دیدم کسی از کارم راضی نبود" },
      { id: "group_photo_add", text: "خودم را در عکس جمعی دیدم" }
    ],
    thoughts: [
      { id: "i_am_broken_add", text: "من معیوبم" },
      { id: "if_they_knew_add", text: "اگه واقعی من رو بشناسن، فرار می‌کنن" },
      { id: "not_deserve_add", text: "لایق این چیزها نیستم" },
      { id: "always_wrong_add", text: "همیشه یه چیزی در من اشتباهه" },
      { id: "fake_person_add", text: "من دارم نقش بازی می‌کنم" }
    ],
    emotions: [
      { id: "shame_deep_add", text: "شرم عمیق" },
      { id: "humiliation_add", text: "تحقیر شدن" },
      { id: "disgust_add", text: "حس چندش‌آور از خودم" },
      { id: "self_hate_add", text: "خشم از خود" }
    ],
    behaviors: [
      { id: "hide_self_add", text: "خودم رو پنهان می‌کنم" },
      { id: "over_apologize_add", text: "زیاد عذرخواهی می‌کنم" },
      { id: "reject_praise_add", text: "تعریف رو رد می‌کنم" },
      { id: "avoid_mirror_add", text: "از آینه فرار می‌کنم" },
      { id: "self_criticism_add", text: "خودم رو سرزنش می‌کنم" },
      { id: "overwork_add", text: "برای جبران، زیاد کار می‌کنم" }
    ]
  },

  social_isolation: {
    triggers: [
      { id: "group_photo_si", text: "عکس گروهی دیدم که در آن نبودم" },
      { id: "couple_invite_si", text: "دعوت به جمع زوجی خوردم" },
      { id: "quiet_cafe_si", text: "در کافه تنها نشسته‌ام" },
      { id: "wedding_invite_si", text: "به عروسی دعوت شدم" },
      { id: "old_friends_meet_si", text: "دوستای قدیمی دور هم جمع شدند" },
      { id: "class_reunion_si", text: "دعوت به دورهمی همکلاسی‌ها" },
      { id: "new_group_si", text: "وارد گروه جدیدی شدم" },
      { id: "weekend_silent_si", text: "آخر هفته بدون هیچ تماسی گذشت" }
    ],
    thoughts: [
      { id: "different_si", text: "با بقیه فرق دارم" },
      { id: "dont_belong_si", text: "به این جمع تعلق ندارم" },
      { id: "no_one_gets_me_si", text: "هیچ‌کس من رو نمی‌فهمه" },
      { id: "outsider_si", text: "من یه غریبه‌ام" },
      { id: "left_out_si", text: "من رو کنار گذاشتن" }
    ],
    emotions: [
      { id: "alienation_si", text: "بیگانگی" },
      { id: "awkwardness_si", text: "معذب بودن" }
    ],
    behaviors: [
      { id: "withdraw_si", text: "کنار می‌کشم" },
      { id: "silence_si", text: "ساکت می‌مونم" },
      { id: "leave_early_si", text: "زودتر می‌رم" },
      { id: "avoid_gatherings_si", text: "از جمع دوری می‌کنم" },
      { id: "fake_smile_si", text: "الکی لبخند می‌زنم" },
      { id: "scroll_phone_si", text: "گوشی رو نگاه می‌کنم" }
    ]
  },

  dependence_incompetence: {
    triggers: [
      { id: "left_alone_dp", text: "تنها ماندم" },
      { id: "big_decision_dp", text: "باید تصمیم مهمی بگیرم" },
      { id: "new_task_dp", text: "کار جدید به من سپرده شد" },
      { id: "no_advisor_dp", text: "کسی نیست که مشورت کنم" },
      { id: "cook_alone_dp", text: "باید خودم غذا درست کنم" },
      { id: "alone_at_home_dp", text: "تنها در خانه ماندم" },
      { id: "technical_problem_dp", text: "مشکل فنی پیش آمد" },
      { id: "no_help_available_dp", text: "کسی نیست کمکم کنه" }
    ],
    thoughts: [
      { id: "cant_handle_dp", text: "از پسش برنمیام" },
      { id: "need_help_dp", text: "باید یکی کمکم کنه" },
      { id: "will_fail_dp", text: "خرابش می‌کنم" },
      { id: "not_capable_dp", text: "من توانمند نیستم" },
      { id: "hopeless_dp", text: "بدون کمک، بی‌فایده‌ست" }
    ],
    emotions: [
      { id: "helplessness_dp", text: "درماندگی" },
      { id: "panic_dp", text: "وحشت" }
    ],
    behaviors: [
      { id: "call_immediately_dp", text: "فوراً زنگ می‌زنم" },
      { id: "ask_multiple_dp", text: "از چند نفر می‌پرسم" },
      { id: "wait_help_dp", text: "منتظر می‌مونم کسی کمک کنه" },
      { id: "postpone_dp", text: "به تعویق می‌اندازم" },
      { id: "have_others_do_dp", text: "به دیگران واگذار می‌کنم" },
      { id: "check_reassurance_dp", text: "اطمینان می‌گیرم" }
    ]
  },

  vulnerability: {
    triggers: [
      { id: "bad_news_vu", text: "خبر بدی شنیدم" },
      { id: "body_pain_vu", text: "درد یا علامت جسمی حس کردم" },
      { id: "travel_vu", text: "قرار است سفر بروم" },
      { id: "alone_at_night_vu", text: "شب است و تنها هستم" },
      { id: "spouse_late_vu", text: "عزیزی دیر به خانه می‌آید" },
      { id: "pandemic_news_vu", text: "خبر بیماری واگیردار" },
      { id: "money_worry_vu", text: "نگرانی مالی" },
      { id: "unexpected_call_vu", text: "تماس غیرمنتظره" }
    ],
    thoughts: [
      { id: "disaster_vu", text: "فاجعه‌ای در راهه" },
      { id: "worst_case_vu", text: "بدترین حالت اتفاق می‌افته" },
      { id: "cant_cope_vu", text: "نمی‌تونم مقابله کنم" },
      { id: "dangerous_vu", text: "این خطرناکه" },
      { id: "unsafe_vu", text: "من در امان نیستم" }
    ],
    emotions: [
      { id: "terror_vu", text: "وحشت" },
      { id: "tension_vu", text: "تنش بدنی" }
    ],
    behaviors: [
      { id: "checking_vu", text: "مدام چک می‌کنم" },
      { id: "reassurance_vu", text: "اطمینان می‌گیرم" },
      { id: "avoid_vu", text: "از موقعیت دوری می‌کنم" },
      { id: "google_search_vu", text: "در اینترنت جستجو می‌کنم" },
      { id: "control_vu", text: "سعی می‌کنم کنترل کنم" },
      { id: "safety_behaviors_vu", text: "رفتارهای امنیتی افراطی" }
    ]
  },

  enmeshment: {
    triggers: [
      { id: "family_upset_en", text: "مادرم یا پدرم ناراحت است" },
      { id: "disagreement_en", text: "با خانواده اختلاف نظر داشتم" },
      { id: "their_opinion_en", text: "خانواده نظر متفاوتی دادند" },
      { id: "partner_mood_en", text: "حال همسرم بد است" },
      { id: "friend_need_en", text: "دوستی به کمک نیاز دارد" },
      { id: "their_disapproval_en", text: "از تصمیم من راضی نبودن" },
      { id: "expected_same_en", text: "انتظار داشتن مثل اونا باشم" },
      { id: "sibling_choice_en", text: "خواهر یا برادرم مسیر متفاوتی رفت" }
    ],
    thoughts: [
      { id: "responsible_en", text: "من مسئول حال اون‌هام" },
      { id: "must_agree_en", text: "باید موافق باشم" },
      { id: "no_self_en", text: "من بدون اونا گم می‌شم" },
      { id: "guilt_choice_en", text: "اگر مخالفت کنم، مقصرم" },
      { id: "cant_decide_en", text: "نمی‌تونم خودم تصمیم بگیرم" }
    ],
    emotions: [
      { id: "guilt_en", text: "احساس گناه" },
      { id: "emptiness_en", text: "پوچی" }
    ],
    behaviors: [
      { id: "comply_en", text: "تسلیم می‌شم" },
      { id: "ask_first_en", text: "اول از اونا می‌پرسم" },
      { id: "abandon_self_en", text: "خودم رو فراموش می‌کنم" },
      { id: "agree_always_en", text: "همیشه موافقت می‌کنم" },
      { id: "avoid_different_en", text: "از متفاوت بودن فرار می‌کنم" },
      { id: "over_consult_en", text: "زیاد مشورت می‌گیرم" }
    ]
  },

  failure: {
    triggers: [
      { id: "colleague_success_fa", text: "موفقیت همکارم را دیدم" },
      { id: "linkedin_post_fa", text: "پست موفقیت کسی را دیدم" },
      { id: "deadline_fa", text: "مهلت نزدیک است" },
      { id: "exam_fa", text: "باید امتحان بدهم" },
      { id: "unfinished_task_fa", text: "کار نیمه‌تمام در لیستم مانده" },
      { id: "someone_succeeded_fa", text: "کسی در کار مشابه موفق شد" },
      { id: "birthday_fa", text: "تولد و مرور گذشته" },
      { id: "class_reunion_fa", text: "دورهمی همکلاسی‌ها" }
    ],
    thoughts: [
      { id: "cant_do_fa", text: "نمی‌تونم" },
      { id: "will_fail_fa", text: "شکست می‌خورم" },
      { id: "others_better_fa", text: "بقیه بهترن" },
      { id: "behind_fa", text: "از همه عقب‌ترم" },
      { id: "waste_fa", text: "زندگیم هدر رفته" }
    ],
    emotions: [
      { id: "hopelessness_fa", text: "ناامیدی" },
      { id: "frustration_fa", text: "سرخوردگی" },
      { id: "envy_fa", text: "حسادت" }
    ],
    behaviors: [
      { id: "procrastinate_fa", text: "به تعویق می‌اندازم" },
      { id: "avoid_start_fa", text: "شروع نمی‌کنم" },
      { id: "compare_fa", text: "مقایسه می‌کنم" },
      { id: "give_up_fa", text: "زود رها می‌کنم" },
      { id: "self_doubt_fa", text: "به خودم شک می‌کنم" },
      { id: "overcompensate_fa", text: "برای جبران، افراط می‌کنم" }
    ]
  },

  entitlement: {
    triggers: [
      { id: "queue_et", text: "در صف ایستادم" },
      { id: "delayed_response_et", text: "دیر جواب گرفتم" },
      { id: "waiting_food_et", text: "غذا دیر رسید" },
      { id: "traffic_et", text: "در ترافیک ماندم" },
      { id: "customer_service_et", text: "برخورد بدی با من شد" },
      { id: "not_first_et", text: "من اول نبودم" },
      { id: "delayed_reply_et", text: "کسی دیر جواب داد" }
    ],
    thoughts: [
      { id: "my_right_et", text: "این حق منه" },
      { id: "why_wait_et", text: "چرا باید صبر کنم؟" },
      { id: "should_special_et", text: "باید برای من فرق داشته باشه" },
      { id: "disrespect_et", text: "به من بی‌احترامی شد" },
      { id: "not_fair_et", text: "این عادلانه نیست" }
    ],
    emotions: [
      { id: "impatience_et", text: "بی‌حوصلگی" },
      { id: "offense_et", text: "رنجش" }
    ],
    behaviors: [
      { id: "complain_et", text: "شکایت می‌کنم" },
      { id: "demand_et", text: "مطالبه می‌کنم" },
      { id: "loud_voice_et", text: "صدایم را بالا می‌برم" },
      { id: "rage_quit_et", text: "با عصبانیت رد می‌کنم" },
      { id: "blame_others_et", text: "دیگران را مقصر می‌دانم" }
    ]
  },

  insufficient_self_control: {
    triggers: [
      { id: "notification_sc", text: "نوتیفیکیشن گوشی" },
      { id: "fridge_sc", text: "به یخچال سر زدم" },
      { id: "bored_sc", text: "حوصله‌ام سر رفت" },
      { id: "hard_task_sc", text: "کار سخت باید شروع کنم" },
      { id: "late_night_sc", text: "شب است و باید بخوابم" },
      { id: "sweet_available_sc", text: "شیرینی در دسترس است" },
      { id: "sale_sc", text: "حراج آنلاین" },
      { id: "tired_sc", text: "خسته‌ام" }
    ],
    thoughts: [
      { id: "later_sc", text: "بعداً انجامش می‌دم" },
      { id: "just_once_sc", text: "فقط این یک بار" },
      { id: "cant_resist_sc", text: "نمی‌تونم مقاومت کنم" },
      { id: "deserve_sc", text: "حق دارم الان" },
      { id: "one_more_sc", text: "فقط یکی دیگه" }
    ],
    emotions: [
      { id: "impulse_sc", text: "فشار تکانه" },
      { id: "craving_sc", text: "میل شدید" }
    ],
    behaviors: [
      { id: "instant_gratification_sc", text: "فوری ارضا می‌کنم" },
      { id: "scroll_sc", text: "اسکرول می‌کنم" },
      { id: "eat_impulse_sc", text: "بی‌فکر می‌خورم" },
      { id: "spend_sc", text: "بی‌فکر خرج می‌کنم" },
      { id: "quit_task_sc", text: "کار را نیمه‌کاره رها می‌کنم" },
      { id: "distract_sc", text: "خودم رو مشغول می‌کنم" }
    ]
  },

  subjugation: {
    triggers: [
      { id: "boss_request_su", text: "رئیس درخواست کرد" },
      { id: "family_wants_su", text: "خانواده خواسته‌ای داشتند" },
      { id: "friend_favor_su", text: "دوستی از من کاری خواست" },
      { id: "spouse_wants_su", text: "همسرم نظری داد" },
      { id: "guilt_pressure_su", text: "با احساس گناه تحت فشارم گذاشت" },
      { id: "authority_figure_su", text: "کسی با اقتدار حرف زد" },
      { id: "someone_upset_su", text: "کسی ناراحت شد" }
    ],
    thoughts: [
      { id: "must_agree_su", text: "باید موافقت کنم" },
      { id: "he_will_upset_su", text: "ناراحت می‌شه" },
      { id: "no_right_su", text: "حق ندارم مخالفت کنم" },
      { id: "peace_more_su", text: "صلح مهم‌تر از نظرمه" },
      { id: "self_blame_su", text: "تقصیر منه" }
    ],
    emotions: [
      { id: "anger_suppressed_su", text: "خشم فروخورده" },
      { id: "helplessness_su", text: "درماندگی" }
    ],
    behaviors: [
      { id: "comply_su", text: "تسلیم می‌شم" },
      { id: "hide_feelings_su", text: "احساساتم رو پنهان می‌کنم" },
      { id: "passive_aggressive_su", text: "غیرمستقیم نشان می‌دم" },
      { id: "avoid_conflict_su", text: "از تعارض دوری می‌کنم" },
      { id: "apologize_first_su", text: "اول عذرخواهی می‌کنم" }
    ]
  },

  self_sacrifice: {
    triggers: [
      { id: "friend_crisis_ss", text: "دوستی در بحران است" },
      { id: "family_need_ss", text: "خانواده به کمک نیاز دارد" },
      { id: "colleague_help_ss", text: "همکار کمک خواست" },
      { id: "guilt_ss", text: "احساس گناه کردم" },
      { id: "no_one_else_ss", text: "فکر کردم اگه من نکنم، کسی نمی‌کنه" },
      { id: "sick_relative_ss", text: "بیماری عزیزان" },
      { id: "kids_need_ss", text: "بچه‌ها به چیزی نیاز دارن" },
      { id: "stranger_help_ss", text: "کسی درخواست کمک کرد" }
    ],
    thoughts: [
      { id: "must_help_ss", text: "باید کمک کنم" },
      { id: "my_needs_last_ss", text: "نیاز خودم آخرین" },
      { id: "selfish_ss", text: "اگه خودم رو بذارم اول، خودخواهم" },
      { id: "bad_person_ss", text: "آدم بدی می‌شم" },
      { id: "no_choice_ss", text: "چاره‌ای ندارم" }
    ],
    emotions: [
      { id: "exhaustion_ss", text: "خستگی" },
      { id: "resentment_ss", text: "دلخوری پنهان" }
    ],
    behaviors: [
      { id: "yes_always_ss", text: "همیشه بله می‌گم" },
      { id: "neglect_self_ss", text: "خودم رو نادیده می‌گیرم" },
      { id: "over_help_ss", text: "بیش از حد کمک می‌کنم" },
      { id: "run_errands_ss", text: "کارهای دیگران رو انجام می‌دم" },
      { id: "lose_self_ss", text: "خودم رو گم می‌کنم" },
      { id: "silent_burnout_ss", text: "در سکوت فرسوده می‌شم" }
    ]
  },

  approval_seeking: {
    triggers: [
      { id: "posted_ap", text: "چیزی پست کردم و منتظر لایک هستم" },
      { id: "no_compliment_ap", text: "کسی تعریف نکرد" },
      { id: "silent_friend_ap", text: "دوستم جواب پیامم را نداد" },
      { id: "social_gathering_ap", text: "در جمعی حاضر شدم" },
      { id: "feedback_ap", text: "بازخورد منفی شنیدم" },
      { id: "disapproval_ap", text: "از نگاه کسی ناراحتی دیدم" },
      { id: "compared_ap", text: "با کسی مقایسه شدم" }
    ],
    thoughts: [
      { id: "need_approval_ap", text: "باید تأیید بگیرم" },
      { id: "what_think_ap", text: "چی درباره‌ام فکر می‌کنن؟" },
      { id: "not_good_ap", text: "به‌اندازه کافی خوب نیستم" },
      { id: "be_liked_ap", text: "باید همه دوستم داشته باشن" },
      { id: "invisible_ap", text: "اگه دیده نشم، هیچ‌ام" }
    ],
    emotions: [
      { id: "rejection_fear_ap", text: "ترس از طرد" }
    ],
    behaviors: [
      { id: "change_self_ap", text: "خودم رو تغییر می‌دم" },
      { id: "show_off_ap", text: "خودنمایی می‌کنم" },
      { id: "seek_feedback_ap", text: "بازخورد می‌گیرم" },
      { id: "agree_others_ap", text: "با همه موافق می‌شم" },
      { id: "avoid_judgment_ap", text: "از قضاوت فرار می‌کنم" },
      { id: "social_media_check_ap", text: "لایک‌ها رو چک می‌کنم" }
    ]
  },

  negativity: {
    triggers: [
      { id: "morning_news_ne", text: "صبح خبرهای بد خواندم" },
      { id: "future_plan_ne", text: "به آینده فکر کردم" },
      { id: "weekend_over_ne", text: "آخر هفته تمام شد" },
      { id: "bad_weather_ne", text: "هوا بد بود" },
      { id: "mistake_me_ne", text: "اشتباه کردم" },
      { id: "bad_thought_ne", text: "فکر بد آمد" },
      { id: "good_thing_ne", text: "چیز خوبی پیش آمد و نگران شدم" }
    ],
    thoughts: [
      { id: "will_fail_ne", text: "حتماً خراب می‌شه" },
      { id: "bad_happen_ne", text: "اتفاق بدی می‌افته" },
      { id: "no_hope_ne", text: "امیدی نیست" },
      { id: "why_try_ne", text: "چرا تلاش کنم؟" },
      { id: "always_bad_ne", text: "همیشه زندگی‌ام بد بوده" }
    ],
    emotions: [
      { id: "despair_ne", text: "یأس" }
    ],
    behaviors: [
      { id: "complain_ne", text: "شکایت می‌کنم" },
      { id: "worry_ne", text: "نگران می‌مونم" },
      { id: "focus_bad_ne", text: "فقط بدی‌ها رو می‌بینم" },
      { id: "avoid_try_ne", text: "از تلاش دوری می‌کنم" },
      { id: "pessimism_ne", text: "بدبینی می‌کنم" }
    ]
  },

  emotional_inhibition: {
    triggers: [
      { id: "cried_ei", text: "خواستم گریه کنم ولی نکردم" },
      { id: "angry_ei", text: "عصبانی شدم و نگفتم" },
      { id: "love_said_ei", text: "خواستم بگم دوستت دارم ولی نگفتم" },
      { id: "hurt_ei", text: "دلم شکست ولی ساکت ماندم" },
      { id: "tired_said_ei", text: "خسته بودم ولی گفتم خوبم" },
      { id: "crying_movie_ei", text: "فیلم احساسی دیدم و خودم رو کنترل کردم" },
      { id: "compliment_ei", text: "تعریفی شنیدم و بی‌تفاوت موندم" }
    ],
    thoughts: [
      { id: "weakness_ei", text: "این ضعفه" },
      { id: "must_control_ei", text: "باید خودم رو کنترل کنم" },
      { id: "not_show_ei", text: "نشون ندم بهتره" },
      { id: "burden_ei", text: "برای دیگران سربارم" },
      { id: "handle_alone_ei", text: "خودم تنهایی تحمل می‌کنم" }
    ],
    emotions: [
      { id: "numbness_ei", text: "بی‌حسی" }
    ],
    behaviors: [
      { id: "hide_feelings_ei", text: "احساساتم رو پنهان می‌کنم" },
      { id: "change_subject_ei", text: "موضوع رو عوض می‌کنم" },
      { id: "rationalize_ei", text: "با منطق توضیح می‌دم" },
      { id: "fake_okay_ei", text: "می‌گم خوبم" },
      { id: "isolate_ei", text: "خودم رو جدا می‌کنم" }
    ]
  },

  unrelenting_standards: {
    triggers: [
      { id: "work_done_us", text: "کارم را تمام کردم ولی راضی نیستم" },
      { id: "colleague_delivery_us", text: "همکارم کارش را تحویل داد" },
      { id: "checked_details_us", text: "جزئیات را چک کردم" },
      { id: "self_review_us", text: "کار خودم رو بازبینی کردم" },
      { id: "mistake_small_us", text: "اشتباه کوچیک کردم" },
      { id: "compliment_work_us", text: "از کارم تعریف شد و باور نکردم" },
      { id: "weekend_free_us", text: "آخر هفته بدون کار" }
    ],
    thoughts: [
      { id: "not_enough_us", text: "کافی نیست" },
      { id: "must_better_us", text: "باید بهتر باشم" },
      { id: "no_rest_us", text: "استراحت یعنی تنبلی" },
      { id: "flaw_us", text: "یه ایراد داره" },
      { id: "others_better_us", text: "بقیه بهتر انجام دادن" }
    ],
    emotions: [
      { id: "exhaustion_us", text: "فرسودگی" }
    ],
    behaviors: [
      { id: "overwork_us", text: "بیش از حد کار می‌کنم" },
      { id: "recheck_us", text: "چند بار چک می‌کنم" },
      { id: "cant_finish_us", text: "نمی‌تونم تمام کنم" },
      { id: "no_rest_us2", text: "استراحت نمی‌کنم" },
      { id: "critical_self_us", text: "از خودم انتقاد می‌کنم" },
      { id: "redo_us", text: "دوباره انجام می‌دم" }
    ]
  },

  punitiveness: {
    triggers: [
      { id: "mistake_mine_pu", text: "اشتباه کردم" },
      { id: "mistake_other_pu", text: "کسی اشتباه کرد" },
      { id: "late_pu", text: "دیر رسیدم" },
      { id: "forgot_pu", text: "چیزی رو فراموش کردم" },
      { id: "own_imperfection_pu", text: "خودم رو ناقص دیدم" },
      { id: "others_wrong_pu", text: "دیدم کسی کار اشتباهی می‌کنه" }
    ],
    thoughts: [
      { id: "must_pay_pu", text: "باید تاوان بده" },
      { id: "unforgivable_pu", text: "بخشیدنی نیست" },
      { id: "self_blame_pu", text: "من مقصرم" },
      { id: "deserve_punish_pu", text: "سزاوار تنبیهم" },
      { id: "must_suffer_pu", text: "باید رنج بکشم" }
    ],
    emotions: [
      { id: "self_hate_pu", text: "خشم از خود" }
    ],
    behaviors: [
      { id: "self_blame_behavior_pu", text: "خودم رو سرزنش می‌کنم" },
      { id: "harsh_criticism_pu", text: "سخت انتقاد می‌کنم" },
      { id: "punish_self_pu", text: "خودم رو تنبیه می‌کنم" },
      { id: "cold_treatment_pu", text: "سرد برخورد می‌کنم" },
      { id: "grudge_pu", text: "کینه نگه می‌دارم" },
      { id: "reject_forgiveness_pu", text: "نمی‌بخشم" }
    ]
  }
};

/* =========================================================
 * ابزارهای کمکی — Dedup + Idempotent
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

// علامت‌گذاری: هر schema فقط یک بار merge می‌شود
const _mergedSchemas = new WeakSet();

export function mergeAdditions(schemas) {
  for (const schema of schemas) {
    if (_mergedSchemas.has(schema)) continue;
    const add = SCHEMAS_ADDITIONS[schema.id];
    if (!add) continue;

    schema.triggers = dedupeBy([...(schema.triggers || []), ...(add.triggers || [])]);
    schema.automatic_thoughts = dedupeBy([...(schema.automatic_thoughts || []), ...(add.thoughts || [])]);
    schema.emotional_signals = dedupeBy([...(schema.emotional_signals || []), ...(add.emotions || [])]);
    schema.behavioral_patterns = dedupeBy([...(schema.behavioral_patterns || []), ...(add.behaviors || [])]);

    _mergedSchemas.add(schema);
  }
  return schemas;
}
