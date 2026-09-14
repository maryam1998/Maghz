/* =====================================================================
   beliefs-patch.js — بازطراحی کامل تب باورها
   
   ساختار جدید:
     ┌─────────────────────────────────────────┐
     │  📜 متن آینده (کتاب مقدس ۹۰ روزه)      │
     │     + آرشیو نسخه‌ها + امضا              │
     ├─────────────────────────────────────────┤
     │  🌌 پروتکل ۹۰ روزه (۶ مرحله)            │
     │     + تایمر + RAS در مرحله ۳           │
     │     + مسیر عصبی مدار کلی                │
     ├─────────────────────────────────────────┤
     │  🔔 یادآوری هوشمند (پایین)              │
     └─────────────────────────────────────────┘
   
   نکته: فقط یک بار به index.html اضافه شود:
     <script src="beliefs-patch.js"></script>
   ===================================================================== */
(function(){
  'use strict';

  var PATCH_VERSION = 'v2-pro';
  var STORAGE_KEY_PREFIX = 'beliefsPatch_';

  /* =====================================================================
     بخش ۱ — مقداردهی اولیه‌ی state
     ===================================================================== */
  function ensureState(){
    if (typeof state === 'undefined' || !state) return false;

    // فیلدهای پروتکل ۹۰ روزه
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (!state.dispenzaPossibilities) state.dispenzaPossibilities = {};
    if (!state.practiceEmotions) state.practiceEmotions = {};
    if (!state.rasChecklist) state.rasChecklist = {};

    // سیستم نسخه‌های متن آینده
    if (!Array.isArray(state.futureTextVersions)) {
      state.futureTextVersions = [];
      // مهاجرت از futureText قدیمی
      if (state.futureText && String(state.futureText).trim()) {
        state.futureTextVersions.push({
          id: 'v_' + Date.now(),
          text: String(state.futureText),
          startDate: state.futureStartDate || dpTodayKey(),
          endDate: null,
          signed: false,
          readDays: (state.futureReadDays || []).slice()
        });
        state.activeFutureVersionId = state.futureTextVersions[0].id;
      }
    }
    if (!state.activeFutureVersionId) {
      var active = state.futureTextVersions.filter(function(v){ return !v.endDate; })[0];
      state.activeFutureVersionId = active ? active.id : null;
    }

    try { if (typeof saveState === 'function') saveState(); } catch(e){}
    return true;
  }

  /* =====================================================================
     بخش ۲ — توابع کمکی
     ===================================================================== */
  function dpTodayKey(){
    if (typeof dayKeyFromDate === 'function') return dayKeyFromDate(new Date());
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  }

  function toFaNum(n){
    try { return Number(n).toLocaleString('fa-IR'); } catch(e){ return String(n); }
  }

  function ensureDispenzaProgress(){
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    return state.dispenzaDailyProgress;
  }

  function dpGetTodaySteps(){
    var p = ensureDispenzaProgress();
    var k = dpTodayKey();
    if (!Array.isArray(p[k])) p[k] = [];
    return p[k];
  }

  function getActiveVersion(){
    if (!state.activeFutureVersionId) return null;
    return state.futureTextVersions.filter(function(v){
      return v.id === state.activeFutureVersionId;
    })[0] || null;
  }

  function getTodayEmotionQualityFor(practiceKey){
    var em = state.practiceEmotions || {};
    var dk = dpTodayKey();
    var rec = em[dk] && em[dk][practiceKey];
    if (!rec || !rec.after || !rec.after.length) return null;
    var maxFreq = 0;
    rec.after.forEach(function(id){
      var e = (typeof EMOTION_BY_ID !== 'undefined') ? EMOTION_BY_ID[id] : null;
      if (e && e.freq > maxFreq) maxFreq = e.freq;
    });
    return maxFreq;
  }
  window.getTodayEmotionQualityFor = getTodayEmotionQualityFor;

  function getStreakDays(){
    var days = (state.dispenzaReadDays || []).slice().sort();
    if (!days.length) return 0;
    var streak = 1;
    for (var i = days.length - 1; i > 0; i--){
      var a = ndKeyToDate(days[i]);
      var b = ndKeyToDate(days[i-1]);
      if ((a - b) / 86400000 === 1) streak++;
      else break;
    }
    return streak;
  }

  function ndKeyToDate(key){
    if (typeof window.ndKeyToDate === 'function') return window.ndKeyToDate(key);
    var p = String(key).split('-').map(Number);
    return new Date(p[0], p[1]-1, p[2]);
  }

  /* =====================================================================
     بخش ۳ — تزریق بخش راهنما (Help)
     ===================================================================== */
  function injectHelpSection(){
    var helpOverlay = document.getElementById('help-modal-overlay');
    if (!helpOverlay) return;
    if (helpOverlay.querySelector('[data-our-help="desire"]')) return;
    var modalActions = helpOverlay.querySelector('.modal-actions');
    if (!modalActions) return;
    var section = document.createElement('div');
    section.className = 'help-section';
    section.setAttribute('data-our-help', 'desire');
    section.innerHTML =
      '<h3>🌌 خواستن vs گشودن — یک تفاوت که همه‌چیز را عوض می‌کند</h3>' +
      '<p>در تجسم، اکثر ما اشتباه می‌کنیم: فکر می‌کنیم باید «آرزو» کنیم. اما آرزو از جای <b>کمبود</b> می‌آید و بدن را در حالت بقا نگه می‌دارد.</p>' +
      '<p>درست این است که از جای <b>کامل‌بودن</b> بپرسیم: <b>«چه امکانی ممکن است؟»</b></p>' +
      '<ul>' +
        '<li><b>خواستن:</b> «ندارم، می‌خواهم» — موج بتا، هورمون استرس، بدن در بقا.</li>' +
        '<li><b>گشودن:</b> «هستم، پس چه چیزی ممکن است؟» — موج آلفا/تتا، هورمون ترمیم، بدن در خلق.</li>' +
      '</ul>' +
      '<p>وقتی به <b>Nothing</b> می‌رسی — از بدن، هویت، اشیا، مکان و زمان خالی می‌شوی — از حالت کمبود خارج شده‌ای. آن‌وقت دیگر «خواسته» نداری؛ یک <b>سوال</b> داری. سوال، ذهن را باز می‌کند؛ آرزو، مغز را در همان مدار قدیمی نگه می‌دارد.</p>' +
      '<p style="background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;">' +
        '<b>سه قانون رشد:</b> تکرار + احساس + ۹۰ روز. ' +
        'خواستن فقط تکرارِ کمبود است. گشودن + تجسم + احساسِ قوی = پارادایم جدید.' +
      '</p>';
    modalActions.parentNode.insertBefore(section, modalActions);
  }

  /* =====================================================================
     بخش ۴ — بازسازی کامل تب باورها
     ===================================================================== */
  function rebuildBeliefsView(){
    var beliefView = document.getElementById('view-beliefs');
    if (!beliefView) return;

    // حذف تمام کارت‌های قدیمی
    var cards = beliefView.querySelectorAll('.belief-flow-card');
    for (var i = 0; i < cards.length; i++){
      var c = cards[i];
      if (!c.hasAttribute('data-new-card')){
        c.parentNode.removeChild(c);
      }
    }
    // حذف کارت‌های دیگر
    var oldSections = beliefView.querySelectorAll('.streak-box, .streak-history, .help-open-btn');
    for (var j = 0; j < oldSections.length; j++){
      oldSections[j].parentNode.removeChild(oldSections[j]);
    }

    var topbar = beliefView.querySelector('.topbar');
    if (!topbar) return;

    var html = '' +
      // ============ کارت ۱ — متن آینده ============
      '<div class="belief-flow-card" data-new-card="1" style="background:linear-gradient(135deg,rgba(244,197,66,.06),rgba(94,200,240,.04));border-color:rgba(244,197,66,.25);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<div class="bf-head" style="margin:0;">📜 متن آینده‌ی من</div>' +
          '<span style="font-size:10.5px;color:var(--muted);background:var(--surface-2);padding:3px 8px;border-radius:20px;">کتاب مقدس ۹۰ روزه</span>' +
        '</div>' +

        '<p style="font-size:11.5px;color:var(--muted);line-height:1.7;margin:0 0 10px;">' +
          'جمله‌ای بنویس که با «بسیار خوشحال و سپاسگزارم حالا که...» شروع می‌شود. ' +
          'هر روز صبح و شب می‌خوانی‌اش. این متن، پارادایم جدید توست.' +
        '</p>' +

        '<div id="future-text-display" style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;min-height:80px;font-size:13px;line-height:1.9;color:var(--ink);white-space:pre-wrap;font-style:italic;"></div>' +

        '<div id="future-signature" style="font-size:11px;color:var(--muted);text-align:left;padding:0 4px 10px;border-bottom:1px dashed var(--line);margin-bottom:10px;direction:ltr;font-variant-numeric:tabular-nums;"></div>' +

        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button type="button" id="edit-future-btn" class="btn tiny" style="flex:1;">✏️ ویرایش متن</button>' +
          '<button type="button" id="archive-future-btn" class="btn tiny" style="flex:1;">📚 آرشیو (<span id="archive-count">۰</span>)</button>' +
        '</div>' +

        '<div id="future-versions-progress" style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px;">' +
            '<span>روز <b id="future-day-num">۰</b> از ۹۰</span>' +
            '<span id="future-day-pct">۰٪</span>' +
          '</div>' +
          '<div class="tb-bar" style="margin:0;"><div class="tb-bar-fill" id="future-progress-bar" style="width:0%;"></div></div>' +
        '</div>' +

        '<div id="future-neural-wrap" style="margin-top:14px;">' +
          '<div class="neural-card" id="np-future-mount"></div>' +
        '</div>' +
      '</div>' +

      // ============ کارت ۲ — پروتکل ۹۰ روزه ============
      '<div class="belief-flow-card dispenza-card" id="dispenza-protocol-card" data-new-card="1" style="margin-top:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div class="bf-head" style="margin:0;">🌌 پروتکل ۹۰ روزه</div>' +
          '<span id="dp-phase-badge" style="font-size:10.5px;color:var(--emerald-700);background:rgba(43,191,171,.12);padding:3px 10px;border-radius:20px;font-weight:700;">فاز ۱ — تثبیت</span>' +
        '</div>' +

        '<p style="font-size:11.5px;color:var(--muted);line-height:1.7;margin:0 0 12px;">' +
          '۶ مرحله. هر روز. صبح و شب. اگر همه را کامل کنی، یک مدار عصبی جدید در مغزت می‌سازی.' +
        '</p>' +

        // نوار پیشرفت جلسات
        '<div style="margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px;">' +
            '<span>جلسه‌ی <b id="dp-session-count">۰</b> از ۱۸۰</span>' +
            '<span id="dp-days-count">۰ روز پیوسته</span>' +
          '</div>' +
          '<div class="tb-bar" style="margin:0;"><div class="tb-bar-fill" id="dp-90day-bar" style="width:0%;"></div></div>' +
        '</div>' +

        // تایمر
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:12px;padding:10px 14px;margin-bottom:16px;">' +
          '<span style="font-size:12.5px;font-weight:700;">⏱️ زمان این جلسه</span>' +
          '<span id="dp-timer-display" style="font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;">۱۵:۰۰</span>' +
          '<button type="button" id="dp-timer-btn" class="btn tiny" style="padding:5px 14px;">شروع</button>' +
        '</div>' +

        // مرحله ۱
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۱</span>' +
            '<span class="dp-step-title" style="flex:1;">آماده‌سازی — بدن و قلب</span>' +
            '<span class="dp-check" data-dp-check="1" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<p class="bf-desc" style="margin-right:36px;">' +
            'سه نفس ۴-۷-۸ (۴ ثانیه دم، ۷ نگه‌دار، ۸ بازدم). بعد یک شکرگذاری قلبی بگو — ' +
            'چیزی که همین حالا برایش سپاسگزاری. ذهنت از بتا به آلفا می‌آید.' +
          '</p>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="1" style="margin-right:36px;margin-top:8px;">✓ انجام دادم</button>' +
        '</div>' +

        // مرحله ۲ — Nothing
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۲</span>' +
            '<span class="dp-step-title" style="flex:1;">Nothing — پنج رهاسازی</span>' +
            '<span class="dp-check" data-dp-check="2" style="font-size:18px;color:var(--muted);">○</span>' +
            '<button type="button" id="nothing-sound-toggle" class="nothing-sound-btn" onclick="toggleNothingSound()" title="قطع/وصل صدا">🔔</button>' +
          '</div>' +
          '<p class="bf-desc" style="margin-right:36px;">' +
            'از بدن، هویت، اشیا، مکان و زمان خالی شو — یکی‌یکی. روی هر لایه ضربه بزن.' +
          '</p>' +

          '<div class="nothing-stage" id="nothing-stage" style="margin:8px 36px 0 0;max-width:220px;height:220px;">' +
            '<div class="nothing-core" id="nothing-core">' +
              '<div class="nothing-core-ring"></div>' +
              '<div class="nothing-core-dot"></div>' +
              '<span class="nothing-core-label">آگاهی خالص</span>' +
            '</div>' +
            '<div class="nothing-layer" data-nothing="body">بدن</div>' +
            '<div class="nothing-layer" data-nothing="one">هویت</div>' +
            '<div class="nothing-layer" data-nothing="thing">اشیا</div>' +
            '<div class="nothing-layer" data-nothing="where">مکان</div>' +
            '<div class="nothing-layer" data-nothing="time">زمان</div>' +
          '</div>' +

          '<div class="nothing-steps" id="nothing-steps" style="margin:12px 36px 0 0;">' +
            '<button type="button" class="nothing-step" data-nothing-step="body"><span class="nothing-step-num">۱</span><span class="nothing-step-txt"><b>No body</b> — از بدن</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="one"><span class="nothing-step-num">۲</span><span class="nothing-step-txt"><b>No one</b> — از هویت</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="thing"><span class="nothing-step-num">۳</span><span class="nothing-step-txt"><b>No thing</b> — از اشیا</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="where"><span class="nothing-step-num">۴</span><span class="nothing-step-txt"><b>No where</b> — از مکان</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="time"><span class="nothing-step-num">۵</span><span class="nothing-step-txt"><b>No time</b> — از زمان</span><span class="nothing-step-check">○</span></button>' +
          '</div>' +

          '<div class="nothing-final" id="nothing-final" style="margin-right:36px;"><span class="nothing-final-pulse"></span>Pure consciousness</div>' +

          '<button type="button" class="nothing-reset" onclick="resetNothingPractice()" style="margin-right:36px;">↺ شروع دوباره</button>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="2" style="margin-right:36px;margin-top:10px;">✓ هر پنج مرحله را رها کردم</button>' +
        '</div>' +

        // مرحله ۳ — امکان جدید + RAS
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۳</span>' +
            '<span class="dp-step-title" style="flex:1;">امکان جدید — سوال، نه آرزو</span>' +
            '<span class="dp-check" data-dp-check="3" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<p class="bf-desc" style="margin-right:36px;">' +
            'حالا که از کمبود خالی شدی، از جای کامل‌بودن بپرس. جواب هر سوال یک <b>امکان</b> است، نه یک خواسته.' +
          '</p>' +

          '<div class="b-field" style="margin:8px 36px 0 0;">' +
            '<label>۱. اگر ترس نبود، چه می‌کردم؟</label>' +
            '<textarea id="dp-possibility-fear" rows="2" placeholder="مثلاً: اولین قدم را همین امروز برمی‌داشتم..."></textarea>' +
          '</div>' +
          '<div class="b-field" style="margin:8px 36px 0 0;">' +
            '<label>۲. اگر پول نبود، چه می‌کردم؟</label>' +
            '<textarea id="dp-possibility-money" rows="2" placeholder="مثلاً: با همان چیزی که دارم شروع می‌کردم..."></textarea>' +
          '</div>' +
          '<div class="b-field" style="margin:8px 36px 0 0;">' +
            '<label>۳. اگر تأیید دیگران نبود، چه می‌کردم؟</label>' +
            '<textarea id="dp-possibility-approval" rows="2" placeholder="مثلاً: همان کاری را می‌کردم که قلبم می‌گفت..."></textarea>' +
          '</div>' +

          // RAS — چک‌لیست توجه
          '<div style="margin:14px 36px 0 0;padding:12px;background:var(--surface-2);border-radius:12px;">' +
            '<div style="font-size:12.5px;font-weight:800;margin-bottom:4px;">📡 حالا RAS را روشن کن</div>' +
            '<div style="font-size:11px;color:var(--muted);line-height:1.7;margin-bottom:10px;">' +
              'RAS فیلتر توجه مغزت است. وقتی به چیزی توجه کنی، مغزت یاد می‌گیرد همان را در شلوغی دنیا برایت علامت بزند. این سه چیز را در ۲۴ ساعت آینده ردیابی کن:' +
            '</div>' +
            '<div id="ras-checklist" style="display:flex;flex-direction:column;gap:6px;">' +
              '<label class="ras-check-item"><input type="checkbox" data-ras="sign" style="width:16px;height:16px;accent-color:var(--emerald-500);"><span>یک نشانه دیدم</span></label>' +
              '<label class="ras-check-item"><input type="checkbox" data-ras="chance" style="width:16px;height:16px;accent-color:var(--emerald-500);"><span>یک فرصت دیدم</span></label>' +
              '<label class="ras-check-item"><input type="checkbox" data-ras="resonance" style="width:16px;height:16px;accent-color:var(--emerald-500);"><span>یک هم‌فرکانس دیدم</span></label>' +
            '</div>' +
          '</div>' +

          '<button type="button" class="btn tiny dp-mark" data-dp-step="3" style="margin-right:36px;margin-top:12px;">✓ این مرحله را انجام دادم</button>' +
        '</div>' +

        // مرحله ۴ — See it
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۴</span>' +
            '<span class="dp-step-title" style="flex:1;">See it — متن آینده‌ات را بخوان</span>' +
            '<span class="dp-check" data-dp-check="4" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<p class="bf-desc" style="margin-right:36px;">' +
            'متن آینده‌ات را با صدای بلند بخوان. بعد چشم‌ها را ببند و همان را به تصویر تبدیل کن — خودت را داخل صحنه ببین.' +
          '</p>' +

          '<div id="dp-seeit-text" style="margin:8px 36px 0 0;padding:12px 14px;background:var(--card);border:1px dashed var(--gold-300);border-radius:12px;font-size:12.5px;line-height:1.9;font-style:italic;color:var(--ink-soft);max-height:120px;overflow-y:auto;white-space:pre-wrap;"></div>' +

          '<div style="margin:12px 36px 0 0;">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">🖼️ عکس‌های صحنه‌ات (اختیاری)</div>' +
            '<label class="visual-upload-btn" for="visual-image-input" style="font-size:11px;padding:7px 12px;">+ افزودن عکس</label>' +
            '<input type="file" id="visual-image-input" accept="image/*" multiple style="display:none" onchange="handleVisualImages(this.files)">' +
            '<div class="visual-gallery" id="visual-gallery" style="margin-top:8px;"></div>' +
          '</div>' +

          '<button type="button" class="btn tiny dp-mark" data-dp-step="4" style="margin-right:36px;margin-top:12px;">✓ خواندم و تجسم کردم</button>' +
        '</div>' +

        // مرحله ۵ — Feel it
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۵</span>' +
            '<span class="dp-step-title" style="flex:1;">Feel it NOW ❤️ — حسِ همین حالا</span>' +
            '<span class="dp-check" data-dp-check="5" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<p class="bf-desc" style="margin-right:36px;">' +
            'حسِ «همین حالا رسیده‌ام» را در بدنت فراخوانی کن. کدام احساس را داری؟ ' +
            'هرچه حس قوی‌تر باشد، رشته‌ی عصبی ضخیم‌تری ساخته می‌شود.' +
          '</p>' +
          '<div style="margin-right:36px;margin-top:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
            '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'پروتکل ۹۰ روزه\')">💗 ثبت حس</button>' +
            '<span id="dp-emotion-feedback" style="font-size:11.5px;color:var(--muted);"></span>' +
          '</div>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="5" style="margin-right:36px;margin-top:10px;">✓ حسش را حس کردم</button>' +
        '</div>' +

        // مرحله ۶ — Become
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۶</span>' +
            '<span class="dp-step-title" style="flex:1;">Become — تبدیل شو</span>' +
            '<span class="dp-check" data-dp-check="6" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<p class="bf-desc" style="margin-right:36px;">' +
            'در همان حال بمان. همان آدمی که می‌خواهی بشوی را با تمام وجود تجربه کن. یک تأییدیه‌ی ساده بگو:' +
          '</p>' +
          '<div style="margin-right:36px;padding:14px;background:linear-gradient(135deg,rgba(43,191,171,.10),rgba(94,200,240,.05));border-radius:12px;text-align:center;font-size:14px;font-weight:800;color:var(--emerald-700);">' +
            '«من همین حالا همینم.»' +
          '</div>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="6" style="margin-right:36px;margin-top:10px;">✓ تأیید می‌کنم</button>' +
        '</div>' +

        // موسیقی پس‌زمینه
        '<div style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:11.5px;font-weight:700;margin-bottom:8px;">🎵 موسیقی مدیتیشن (اختیاری)</div>' +
          '<label class="visual-upload-btn" for="meditation-audio-input" style="font-size:11px;padding:7px 12px;">+ افزودن موسیقی</label>' +
          '<input type="file" id="meditation-audio-input" accept="audio/*" style="display:none" onchange="handleMeditationAudio(this.files)">' +
          '<div id="meditation-audio-wrap"></div>' +
        '</div>' +

        // دکمه نهایی
        '<button type="button" class="today-btn2" id="dp-complete-btn" style="width:100%;margin-top:18px;padding:15px;font-size:14px;cursor:not-allowed;opacity:.55;" disabled>' +
          '🔒 امروز انجام دادم — اول ۶ مرحله را کامل کن' +
        '</button>' +

        // مدار کلی
        '<div style="margin-top:20px;padding-top:16px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">🧠 مدار کلی این پروتکل</div>' +
          '<div class="neural-card" id="np-dispenza-mount"></div>' +
        '</div>' +
      '</div>' +

      // ============ کارت ۳ — یادآوری روزانه ============
      '<div class="belief-flow-card" data-new-card="1" style="margin-top:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<div class="bf-head" style="margin:0;font-size:13.5px;">🔔 یادآوری روزانه</div>' +
          '<div class="switch" id="alarm-switch" onclick="toggleAlarm()"><div class="knob"></div></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;">' +
          '<span style="font-size:12px;color:var(--muted);">ساعت یادآوری</span>' +
          '<input type="time" class="time-input" id="alarm-time" value="20:00" onchange="setAlarmTime(this.value)" style="font-size:13px;padding:6px 10px;">' +
        '</div>' +
        '<p style="font-size:11px;color:var(--muted);line-height:1.7;margin:10px 0 0;">' +
          'حتی ۵ دقیقه کافیه. تداوم مهم‌تر از مدت است.' +
        '</p>' +
      '</div>' +

      // نگه‌داشتن عناصر مخفی برای سازگاری
      '<textarea id="b-future-text" style="display:none;"></textarea>' +
      '<textarea id="b-visual-note" style="display:none;"></textarea>' +
      '<textarea id="b-tracking" style="display:none;"></textarea>' +
      '<div id="tracking-list" style="display:none;"></div>' +
      '<button id="ras-activate-btn" style="display:none;"></button>' +
      '<div id="ras-radar" style="display:none;"></div>' +
      '<button id="future-start-btn" style="display:none;"></button>' +
      '<button id="future-read-btn" style="display:none;"></button>';

    topbar.insertAdjacentHTML('afterend', html);

    // استایل اضافی برای RAS checklist
    if (!document.getElementById('ras-checklist-style')){
      var st = document.createElement('style');
      st.id = 'ras-checklist-style';
      st.textContent =
        '.ras-check-item{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--card);border:1px solid var(--line);border-radius:9px;cursor:pointer;font-size:12px;color:var(--ink);transition:.15s;}' +
        '.ras-check-item:hover{background:var(--surface-2);}' +
        '.ras-check-item input:checked ~ span{text-decoration:line-through;opacity:.6;}' +
        '.ras-check-item:has(input:checked){border-color:var(--emerald-500);background:rgba(43,191,171,.08);}';
      document.head.appendChild(st);
    }
  }

  /* =====================================================================
     بخش ۵ — رندر متن آینده و آرشیو
     ===================================================================== */
  function renderFutureText(){
    var v = getActiveVersion();
    var display = document.getElementById('future-text-display');
    var signBox = document.getElementById('future-signature');
    var archiveCount = document.getElementById('archive-count');
    var seeitText = document.getElementById('dp-seeit-text');

    if (display){
      if (v && v.text && v.text.trim()){
        display.innerHTML = '<span style="color:var(--ink)">«' + escapeHtml(v.text) + '»</span>';
      } else {
        display.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:12px 0;">هنوز متن آینده‌ای ننوشتی.<br>روی ✏️ ویرایش بزن تا شروع کنی.</div>';
      }
    }

    if (signBox){
      if (v && v.signed && v.signatureDate){
        signBox.innerHTML = '✓ امضا شد — ' + v.signatureDate;
        signBox.style.color = 'var(--emerald-700)';
      } else if (v && v.text){
        signBox.innerHTML = '<span style="color:var(--muted);">با امضا، به این متن متعهد می‌شوی</span>';
      } else {
        signBox.innerHTML = '';
      }
    }

    if (seeitText){
      if (v && v.text){
        seeitText.innerHTML = '«' + escapeHtml(v.text) + '»';
      } else {
        seeitText.innerHTML = '<span style="color:var(--muted);font-style:normal;">اول متن آینده‌ات را در کارت بالا بنویس.</span>';
      }
    }

    if (archiveCount){
      archiveCount.textContent = toFaNum((state.futureTextVersions || []).length);
    }
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  /* =====================================================================
     بخش ۶ — رندر پیشرفت پروتکل
     ===================================================================== */
  function dpRenderProgress(){
    var done = dpGetTodaySteps();
    document.querySelectorAll('.dp-check[data-dp-check]').forEach(function(el){
      var step = el.dataset.dpCheck;
      var isDone = done.indexOf(step) !== -1;
      el.textContent = isDone ? '✓' : '○';
      el.style.color = isDone ? 'var(--emerald-500,#2bbfab)' : 'var(--muted)';
      el.style.fontWeight = isDone ? '900' : '400';
    });
    document.querySelectorAll('.dp-mark').forEach(function(btn){
      var step = btn.dataset.dpStep;
      var isDone = done.indexOf(step) !== -1;
      btn.style.opacity = isDone ? '0.55' : '1';
    });

    var completeBtn = document.getElementById('dp-complete-btn');
    if (completeBtn){
      var allDone = done.length === 6;
      completeBtn.disabled = !allDone;
      completeBtn.style.cursor = allDone ? 'pointer' : 'not-allowed';
      completeBtn.style.opacity = allDone ? '1' : '0.55';
      completeBtn.textContent = allDone
        ? '✨ امروز انجام دادم'
        : '🔒 امروز انجام دادم — اول ۶ مرحله را کامل کن';
    }

    var totalDays = Math.min((state.dispenzaReadDays || []).length, 90);
    var sessionCount = totalDays * 2;
    var countEl = document.getElementById('dp-session-count');
    if (countEl) countEl.textContent = toFaNum(sessionCount);

    var daysEl = document.getElementById('dp-days-count');
    if (daysEl){
      var streak = getStreakDays();
      daysEl.textContent = streak > 0 ? toFaNum(streak) + ' روز پیوسته' : 'شروع کن';
    }

    var bar = document.getElementById('dp-90day-bar');
    if (bar) bar.style.width = (totalDays / 90 * 100) + '%';

    var phaseBadge = document.getElementById('dp-phase-badge');
    if (phaseBadge){
      if (totalDays < 30) phaseBadge.textContent = 'فاز ۱ — تثبیت';
      else if (totalDays < 60) phaseBadge.textContent = 'فاز ۲ — یکپارچگی';
      else phaseBadge.textContent = 'فاز ۳ — قفل هویت';
    }

    // بازتاب روی کارت متن آینده
    var v = getActiveVersion();
    var readDays = v && v.readDays ? v.readDays.length : 0;
    var numEl = document.getElementById('future-day-num');
    var pctEl = document.getElementById('future-day-pct');
    var pbar = document.getElementById('future-progress-bar');
    if (numEl) numEl.textContent = toFaNum(Math.min(readDays, 90));
    if (pctEl) pctEl.textContent = toFaNum(Math.round(Math.min(readDays, 90) / 90 * 100)) + '٪';
    if (pbar) pbar.style.width = (Math.min(readDays, 90) / 90 * 100) + '%';

    // RAS checklist امروز
    renderRasChecklist();
  }

  function renderRasChecklist(){
    var today = dpTodayKey();
    var rec = (state.rasChecklist && state.rasChecklist[today]) || {};
    document.querySelectorAll('#ras-checklist input[data-ras]').forEach(function(cb){
      cb.checked = !!rec[cb.dataset.ras];
    });
  }

  /* =====================================================================
     بخش ۷ — تایمر
     ===================================================================== */
  var dpTimerInterval = null;
  var dpTimerSeconds = 15 * 60;

  function dpStartTimer(){
    var btn = document.getElementById('dp-timer-btn');
    var disp = document.getElementById('dp-timer-display');
    if (!btn || !disp) return;
    if (dpTimerInterval){
      clearInterval(dpTimerInterval);
      dpTimerInterval = null;
      btn.textContent = 'ادامه';
      return;
    }
    btn.textContent = 'توقف';
    dpTimerInterval = setInterval(function(){
      dpTimerSeconds--;
      if (dpTimerSeconds <= 0){
        clearInterval(dpTimerInterval);
        dpTimerInterval = null;
        disp.textContent = '۰۰:۰۰';
        btn.textContent = 'پایان';
        if (navigator.vibrate) try { navigator.vibrate([200,100,200]); } catch(e){}
        if (typeof playCompletionGong === 'function') playCompletionGong();
        return;
      }
      var m = Math.floor(dpTimerSeconds/60).toString().padStart(2,'0');
      var s = (dpTimerSeconds%60).toString().padStart(2,'0');
      disp.textContent = m + ':' + s;
    }, 1000);
  }

  /* =====================================================================
     بخش ۸ — ویرایش و آرشیو متن آینده
     ===================================================================== */
  function openFutureEditor(){
    var v = getActiveVersion();
    var currentText = v ? v.text : '';
    var newText = prompt(
      'متن آینده‌ات را بنویس (با «بسیار خوشحال و سپاسگزارم حالا که...» شروع کن):',
      currentText
    );
    if (newText === null) return;
    newText = String(newText).trim();
    if (!newText){
      if (typeof toast === 'function') toast('متن نمی‌تونه خالی باشه');
      return;
    }
    if (newText === currentText){
      if (typeof toast === 'function') toast('متنی تغییر نکرد');
      return;
    }

    if (!v){
      // نسخه‌ی جدید
      var newV = {
        id: 'v_' + Date.now(),
        text: newText,
        startDate: dpTodayKey(),
        endDate: null,
        signed: false,
        signatureDate: null,
        readDays: []
      };
      state.futureTextVersions.push(newV);
      state.activeFutureVersionId = newV.id;
      state.futureText = newText;
      state.futureStartDate = newV.startDate;
      state.futureReadDays = newV.readDays;
      if (typeof toast === 'function') toast('متن آینده‌ات ثبت شد ✨');
    } else {
      // نسخه قبلی را ببند، نسخه جدید بساز
      v.endDate = dpTodayKey();
      var newV2 = {
        id: 'v_' + Date.now(),
        text: newText,
        startDate: dpTodayKey(),
        endDate: null,
        signed: false,
        signatureDate: null,
        readDays: []
      };
      state.futureTextVersions.push(newV2);
      state.activeFutureVersionId = newV2.id;
      state.futureText = newText;
      state.futureStartDate = newV2.startDate;
      state.futureReadDays = newV2.readDays;
      if (typeof toast === 'function') toast('نسخه‌ی جدید ثبت شد — نسخه‌ی قبلی در آرشیو موند 📚');
    }
    try { saveState(); } catch(e){}
    renderFutureText();
    dpRenderProgress();
  }

  function openArchive(){
    var versions = state.futureTextVersions || [];
    if (!versions.length){
      if (typeof toast === 'function') toast('هنوز نسخه‌ای نداری');
      return;
    }
    var lines = ['📚 آرشیو نسخه‌های متن آینده:\n'];
    versions.forEach(function(v, i){
      var active = v.id === state.activeFutureVersionId ? ' ← (فعال)' : '';
      var end = v.endDate || 'اکنون';
      lines.push(
        'نسخه ' + (i + 1) + active + '\n' +
        '  دوره: ' + v.startDate + ' → ' + end + '\n' +
        '  متن: ' + (v.text.length > 60 ? v.text.slice(0, 60) + '...' : v.text) + '\n'
      );
    });
    lines.push('\nشماره‌ی نسخه‌ای که می‌خواهی فعال کنی را وارد کن (یا Cancel بزن):');
    var ans = prompt(lines.join('\n'), String(versions.length));
    if (ans === null) return;
    var idx = parseInt(ans, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= versions.length) return;

    // نسخه‌ی فعال قبلی را ببند
    versions.forEach(function(v){ if (!v.endDate && v.id !== versions[idx].id) v.endDate = dpTodayKey(); });
    // نسخه‌ی انتخابی را فعال کن
    var chosen = versions[idx];
    chosen.endDate = null;
    state.activeFutureVersionId = chosen.id;
    state.futureText = chosen.text;
    state.futureStartDate = chosen.startDate;
    state.futureReadDays = chosen.readDays || [];
    try { saveState(); } catch(e){}
    renderFutureText();
    dpRenderProgress();
    if (typeof toast === 'function') toast('نسخه ' + (idx + 1) + ' فعال شد ✓');
  }

  /* =====================================================================
     بخش ۹ — رندر مسیر عصبی (تنها یک mount)
     ===================================================================== */
  function renderOurNeuralPathways(){
    if (typeof renderNeuralPathway !== 'function') return;

    // متن آینده
    if (document.getElementById('np-future-mount')){
      try {
        if (!state.futureNeural) state.futureNeural = { logs:{}, lastSyncKey:null, habitFormed:false };
        // همگام‌سازی با روزهای خواندن نسخه‌ی فعال
        var v = getActiveVersion();
        if (v && Array.isArray(v.readDays)){
          Object.keys(state.futureNeural.logs || {}).forEach(function(k){
            delete state.futureNeural.logs[k];
          });
          v.readDays.forEach(function(dayKey){
            var d = ndKeyToDate(dayKey);
            var gkey = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
            state.futureNeural.logs[gkey] = true;
          });
        }
        renderNeuralPathway('np-future-mount', state.futureNeural, {
          label: 'خواندن متن آینده',
          practiceKey: 'belief',
          onChange: saveState
        });
      } catch(e){ console.warn('[np-future]', e); }
    }

    // مدار کلی پروتکل
    if (document.getElementById('np-dispenza-mount')){
      try {
        var dn = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
        if (dn){
          renderNeuralPathway('np-dispenza-mount', dn, {
            label: 'پروتکل ۹۰ روزه',
            practiceKey: 'dispenza',
            onChange: saveState
          });
        }
      } catch(e){ console.warn('[np-dispenza]', e); }
    }
  }

  // override
  function overrideRenderAll(){
    window.renderAllNeuralPathways = function(){
      renderOurNeuralPathways();
    };
  }

  /* =====================================================================
     بخش ۱۰ — wrap renderBeliefsView
     ===================================================================== */
  function wrapRenderBeliefsView(){
    if (typeof window.renderBeliefsView !== 'function') return;
    if (window.renderBeliefsView.__patchedV2) return;
    var original = window.renderBeliefsView;
    window.renderBeliefsView = function(){
      try { original.apply(this, arguments); } catch(e){ console.warn('[renderBeliefsView orig]', e); }
      try { renderFutureText(); } catch(e){}
      try { dpRenderProgress(); } catch(e){}
      try { renderOurNeuralPathways(); } catch(e){}
      // مقدار ساعت و سوئیچ
      var sw = document.getElementById('alarm-switch');
      if (sw) sw.classList.toggle('on', !!state.alarmEnabled);
      var at = document.getElementById('alarm-time');
      if (at) at.value = state.alarmTime || '20:00';
    };
    window.renderBeliefsView.__patchedV2 = true;
  }

  /* =====================================================================
     بخش ۱۱ — رویدادها
     ===================================================================== */
  function wireEvents(){
    document.addEventListener('click', function(e){

      // مرحله‌ها
      var markBtn = e.target.closest('.dp-mark');
      if (markBtn){
        var step = markBtn.dataset.dpStep;
        var done = dpGetTodaySteps();
        var idx = done.indexOf(step);
        if (idx === -1) done.push(step); else done.splice(idx, 1);
        try { saveState(); } catch(e2){}
        dpRenderProgress();
        return;
      }

      // تایمر
      if (e.target.id === 'dp-timer-btn'){ dpStartTimer(); return; }

      // ویرایش متن آینده
      if (e.target.id === 'edit-future-btn'){ openFutureEditor(); return; }

      // آرشیو
      if (e.target.id === 'archive-future-btn'){ openArchive(); return; }

      // دکمه‌ی نهایی
      if (e.target.id === 'dp-complete-btn' && !e.target.disabled){
        var quality = getTodayEmotionQualityFor('dispenza');
        var fibers = 1;
        var msg = 'ثبت شد — یک رشته‌ی جدید ساخته شد 🧠';
        if (quality !== null){
          if (quality >= 500){ fibers = 2; msg = '🔥 کیفیت حس بالا — دو رشته ساخته شد!'; }
          else if (quality < 200){ fibers = -1; msg = '⚠️ حس ضعیف — یک رشته کم شد. دفعه‌ی بعد عمیق‌تر.'; }
        }

        var dn = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
        if (dn){
          if (fibers > 0){
            for (var i = 0; i < fibers; i++){
              if (typeof neuralAddFiber === 'function') neuralAddFiber(dn, {calendarLinked:false});
            }
          } else if (fibers === -1){
            if (typeof neuralRemoveFiber === 'function') neuralRemoveFiber(dn);
          }
        }

        var dk = dpTodayKey();
        if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
        if (state.dispenzaReadDays.indexOf(dk) === -1) state.dispenzaReadDays.push(dk);

        // ثبت در نسخه‌ی فعال متن آینده
        var v = getActiveVersion();
        if (v){
          if (!Array.isArray(v.readDays)) v.readDays = [];
          if (v.readDays.indexOf(dk) === -1) v.readDays.push(dk);
        }
        if (!state.futureReadDays) state.futureReadDays = [];
        if (state.futureReadDays.indexOf(dk) === -1) state.futureReadDays.push(dk);
        if (!state.futureStartDate) state.futureStartDate = dk;

        ensureDispenzaProgress()[dk] = [];
        try { saveState(); } catch(e2){}

        dpRenderProgress();
        renderOurNeuralPathways();
        if (typeof toast === 'function') toast(msg);
      }
    });

    // ذخیره‌ی امکان‌ها
    document.addEventListener('input', function(e){
      if (!e.target) return;
      var id = e.target.id;
      if (id && id.indexOf('dp-possibility-') === 0){
        var key = id.replace('dp-possibility-','possibility_');
        if (!state.dispenzaPossibilities) state.dispenzaPossibilities = {};
        state.dispenzaPossibilities[key] = e.target.value;
        try { saveState(); } catch(e2){}
      }
    });

    // RAS checklist
    document.addEventListener('change', function(e){
      if (!e.target || !e.target.dataset || !e.target.dataset.ras) return;
      var today = dpTodayKey();
      if (!state.rasChecklist) state.rasChecklist = {};
      if (!state.rasChecklist[today]) state.rasChecklist[today] = {};
      state.rasChecklist[today][e.target.dataset.ras] = !!e.target.checked;
      try { saveState(); } catch(e2){}
      if (typeof toast === 'function'){
        var todayRec = state.rasChecklist[today];
        var all = ['sign','chance','resonance'].every(function(k){ return todayRec[k]; });
        if (all) toast('RAS فعال شد — حواست به نشانه‌هاست 🎯');
      }
    });
  }

  /* =====================================================================
     بخش ۱۲ — بازگرداندن مقادیر امکان‌ها
     ===================================================================== */
  function dpRestorePossibilities(){
    if (!state.dispenzaPossibilities) return;
    Object.keys(state.dispenzaPossibilities).forEach(function(k){
      var id = 'dp-possibility-' + k.replace('possibility_','');
      var el = document.getElementById(id);
      if (el) el.value = state.dispenzaPossibilities[k];
    });
  }

  /* =====================================================================
     بخش ۱۳ — اجرا
     ===================================================================== */
  function boot(){
    if (!ensureState()){
      setTimeout(boot, 100);
      return;
    }
    injectHelpSection();
    rebuildBeliefsView();
    overrideRenderAll();
    wrapRenderBeliefsView();
    wireEvents();
    dpRestorePossibilities();

    // رفرش اولیه
    try { renderFutureText(); } catch(e){}
    try { dpRenderProgress(); } catch(e){}
    try { renderOurNeuralPathways(); } catch(e){}

    var bv = document.getElementById('view-beliefs');
    if (bv && bv.classList.contains('active') && typeof window.renderBeliefsView === 'function'){
      try { window.renderBeliefsView(); } catch(e){}
    }
  }

  if (document.readyState === 'complete'){
    setTimeout(boot, 300);
  } else {
    window.addEventListener('load', function(){ setTimeout(boot, 300); });
  }
})();
