/* =====================================================================
   beliefs-patch.js — نسخه‌ی نهایی، ساده و حرفه‌ای
   ===================================================================== */
(function(){
  'use strict';

  var ARCHIVE_OPEN = false;

  /* =====================================================================
     ابزارها
     ===================================================================== */
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function toFa(n){
    try { return Number(n).toLocaleString('fa-IR'); } catch(e){ return String(n); }
  }
  function dpTodayKey(){
    if (typeof dayKeyFromDate === 'function') return dayKeyFromDate(new Date());
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  }
  function ndKeyToDate(key){
    if (typeof window.ndKeyToDate === 'function') return window.ndKeyToDate(key);
    var p = String(key).split('-').map(Number);
    return new Date(p[0], p[1]-1, p[2]);
  }

  /* =====================================================================
     مقداردهی اولیه state
     ===================================================================== */
  function ensureState(){
    if (typeof state === 'undefined' || !state) return false;
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (!state.dispenzaPossibilities) state.dispenzaPossibilities = {};
    if (!state.practiceEmotions) state.practiceEmotions = {};

    if (!Array.isArray(state.futureTextVersions)) {
      state.futureTextVersions = [];
      if (state.futureText && String(state.futureText).trim()) {
        state.futureTextVersions.push({
          id: 'v_' + Date.now(),
          text: String(state.futureText),
          startDate: state.futureStartDate || dpTodayKey(),
          endDate: null,
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
     توابع کار با متن آینده
     ===================================================================== */
  function getActiveVersion(){
    if (!state.activeFutureVersionId) return null;
    return state.futureTextVersions.filter(function(v){
      return v.id === state.activeFutureVersionId;
    })[0] || null;
  }

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

  /* =====================================================================
     بخش ۱ — راهنما (کامل بازنویسی‌شده، ساده و روشن)
     ===================================================================== */
  function injectHelpSection(){
    var helpOverlay = document.getElementById('help-modal-overlay');
    if (!helpOverlay) return;
    if (helpOverlay.querySelector('[data-our-help]')) return;
    var modalActions = helpOverlay.querySelector('.modal-actions');
    if (!modalActions) return;

    var wrap = document.createElement('div');
    wrap.setAttribute('data-our-help', '1');
    wrap.innerHTML = '' +
      '<div class="help-section">' +
        '<h3>🌱 این اپ چطور بهت کمک می‌کند؟</h3>' +
        '<p>ذهن آدم مثل یک مزرعه است. هر فکری که تکرار کنی، مثل یک بذر کاشته می‌شود. بعد از مدتی این بذرها به «باور» تبدیل می‌شوند و باورهایت زندگی‌ات را می‌سازند.</p>' +
        '<p>این اپ سه کار برایت می‌کند:</p>' +
        '<ul>' +
          '<li>اهدافت را روی نقشه می‌بینی و مسیر رسیدن به آن‌ها را ترسیم می‌کنی.</li>' +
          '<li>هر روز شکرگذاری می‌کنی تا ذهنت یاد بگیرد چیزهای خوب زندگی‌ات را ببیند.</li>' +
          '<li>با یک تمرین روزانه‌ی ۱۵ دقیقه‌ای، باورهای محدودکننده را با باورهای جدید عوض می‌کنی.</li>' +
        '</ul>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>🧠 سه اصلی که باید بدانی</h3>' +
        '<p><b>۱. مغزت قابل تغییر است.</b> تا آخر عمر می‌تواند خودش را بازسازی کند. هر رفتاری را که تکرار کنی، در مغزت مثل یک راه جدید ساخته می‌شود. این راه هر بار که تکرار شود، پهن‌تر می‌شود — تا یک روز بدون تلاش، خودکار می‌شود.</p>' +
        '<p><b>۲. احساس، چسبِ راه است.</b> اگر کاری را با احساس قوی انجام دهی، راهش سریع‌تر ساخته می‌شود. برای همین در تمرین‌ها فقط فکر نمی‌کنیم — <b>حس</b> رسیدن را هم تجربه می‌کنیم.</p>' +
        '<p><b>۳. ۹۰ روز، زمان تغییر است.</b> پژوهش‌ها نشان می‌دهد برای اینکه یک عادت یا باور جدید در مغز جا بیفتد، به‌طور میانگین ۶۶ تا ۹۰ روز تمرین روزانه لازم است.</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>💡 «خواستن» یا «باور داشتن»؟</h3>' +
        '<p>این مهم‌ترین نکته‌ی این اپ است.</p>' +
        '<ul>' +
          '<li><b>وقتی «می‌خواهی»:</b> دلت می‌گوید «این را ندارم، کاش داشتم». این حالت، بدنت را مضطرب می‌کند و مغزت را می‌بندد. چون مدام به «نداشتن» فکر می‌کنی.</li>' +
          '<li><b>وقتی «باور داری»:</b> دلت می‌گوید «من این هستم، حالا چه چیزهای خوبی ممکن است؟». این حالت، بدنت را آرام می‌کند و مغزت را باز می‌کند تا فرصت‌های تازه را ببیند.</li>' +
        '</ul>' +
        '<p>به همین دلیل در تمرین‌ها به‌جای «آرزو کردن»، از تو یک <b>سوال</b> می‌پرسیم: «اگر ترس نبود، چه می‌کردم؟» این سوال، جواب‌های تازه به ذهنت می‌آورد.</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>🌑 «هیچ» چیست؟</h3>' +
        '<p>قبل از اینکه ذهن بتواند چیز جدیدی بسازد، باید از فکرهای قدیمی خالی شود. در تمرین دیسپنزا، مرحله‌ی «هیچ» همین است: توجهت را از بدن، از خودت، از اشیا، از مکان و از زمان برمی‌داری. وقتی همه‌ی این‌ها را رها کردی، یک فضای خالی می‌ماند — و در این فضای خالی، می‌توانی چیز جدیدی بسازی.</p>' +
        '<p>این کار ترسناک نیست — فقط چند دقیقه سکوت است. مهم‌ترین اثرش این است که <b>فکرهای تکراری و مزاحم</b> را برای مدتی خاموش می‌کند.</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>📅 چطور هر روز تمرین کنم؟</h3>' +
        '<ol style="padding-inline-start:20px;line-height:2;font-size:12.5px;color:var(--text-dim);">' +
          '<li><b>صبح:</b> بعد از بیدار شدن و نوشیدن آب، برو تب «باورها».</li>' +
          '<li>متن آینده‌ات را یک بار با صدای بلند بخوان.</li>' +
          '<li>پروتکل ۶ مرحله‌ای را انجام بده — حدود ۱۵ دقیقه.</li>' +
          '<li><b>شب:</b> قبل از خواب، دوباره همین را تکرار کن.</li>' +
          '<li>هر روز، حداقل یک خط شکرگذاری بنویس.</li>' +
        '</ol>' +
        '<p style="margin-top:10px;background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;">' +
          '<b>یادت باشه:</b> اگر یک روز نتوانستی، خودت را سرزنش نکن. روز بعد ادامه بده. ' +
          'تداوم مهم‌تر از کامل بودن است.' +
        '</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>⚕️ یک نکته‌ی مهم</h3>' +
        '<p>این تمرین‌ها یک «باشگاه ذهن» هستند، نه جایگزین درمان پزشکی. اگر افسردگی، اضطراب شدید یا هر مسئله‌ی سلامت روانی داری، در کنار این تمرین‌ها با یک متخصص هم صحبت کن — این دو با هم بهترین نتیجه را می‌دهند.</p>' +
      '</div>';

    modalActions.parentNode.insertBefore(wrap, modalActions);
  }

  /* =====================================================================
     بخش ۲ — بازسازی کامل تب باورها
     ===================================================================== */
  function rebuildBeliefsView(){
    var beliefView = document.getElementById('view-beliefs');
    if (!beliefView) return;

    // حذف همه‌ی کارت‌های قدیمی
    var cards = beliefView.querySelectorAll('.belief-flow-card');
    for (var i = 0; i < cards.length; i++){
      cards[i].parentNode.removeChild(cards[i]);
    }
    // حذف بخش‌های قدیمی
    ['streak-box','streak-history','help-open-btn'].forEach(function(cls){
      var els = beliefView.querySelectorAll('.' + cls);
      for (var j = 0; j < els.length; j++) els[j].parentNode.removeChild(els[j]);
    });

    var topbar = beliefView.querySelector('.topbar');
    if (!topbar) return;

    var html = '' +
      /* ============ کارت ۱ — متن آینده ============ */
      '<div class="belief-flow-card" data-new-card="1">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
          '<div class="bf-head" style="margin:0;">📜 متن آینده‌ی من</div>' +
          '<span id="future-active-badge" style="font-size:10px;color:var(--muted);background:var(--surface-2);padding:3px 8px;border-radius:20px;">—</span>' +
        '</div>' +

        // نمایش متن
        '<div id="future-display" style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:10px;min-height:90px;font-size:13.5px;line-height:2;color:var(--ink);white-space:pre-wrap;font-style:italic;"></div>' +

        // ویرایشگر درون‌خطی (مخفی تا کلیک)
        '<div id="future-editor" style="display:none;margin-bottom:10px;">' +
          '<textarea id="future-editor-input" rows="5" style="width:100%;font-family:inherit;font-size:13.5px;line-height:1.9;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--card);color:var(--ink);resize:vertical;outline:none;" placeholder="بسیار خوشحال و سپاسگزارم حالا که..."></textarea>' +
          '<div style="display:flex;gap:6px;margin-top:8px;">' +
            '<button type="button" id="future-save-btn" class="btn gold" style="flex:1;font-size:12.5px;padding:10px;">💾 ذخیره</button>' +
            '<button type="button" id="future-cancel-btn" class="btn" style="flex:1;font-size:12.5px;padding:10px;">لغو</button>' +
          '</div>' +
        '</div>' +

        // دکمه‌ها
        '<div id="future-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
          '<button type="button" id="edit-future-btn" class="btn tiny" style="flex:1;min-width:100px;">✏️ ویرایش متن</button>' +
          '<button type="button" id="archive-future-btn" class="btn tiny" style="flex:1;min-width:100px;">📚 آرشیو (<span id="archive-count">۰</span>)</button>' +
        '</div>' +

        // آرشیو درون‌خطی (مخفی)
        '<div id="future-archive-box" style="display:none;margin-bottom:10px;padding:10px;background:var(--surface-2);border-radius:12px;max-height:280px;overflow-y:auto;"></div>' +

        // تقویم و پیشرفت
        '<div style="padding-top:12px;border-top:1px dashed var(--line);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<span style="font-size:12px;font-weight:700;">📅 پیشرفت روزانه</span>' +
            '<button type="button" id="future-calendar-btn" class="btn tiny" style="font-size:11px;padding:4px 10px;">تقویم کامل</button>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px;">' +
            '<span>روز <b id="future-day-num" style="color:var(--ink);">۰</b> از ۹۰</span>' +
            '<span id="future-days-left" style="color:var(--ink);">۹۰ روز مانده</span>' +
          '</div>' +
          '<div class="tb-bar" style="margin:0 0 10px;"><div class="tb-bar-fill" id="future-progress-bar" style="width:0%;"></div></div>' +
          '<div id="future-mini-cal" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:10px;text-align:center;"></div>' +
        '</div>' +
      '</div>' +

      /* ============ کارت ۲ — پروتکل ۶ مرحله‌ای ============ */
      '<div class="belief-flow-card" id="dispenza-protocol-card" data-new-card="1" style="margin-top:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div class="bf-head" style="margin:0;">🌌 تمرین روزانه</div>' +
          '<span id="dp-session-count" style="font-size:10.5px;color:var(--muted);">۰ جلسه</span>' +
        '</div>' +
        '<p style="font-size:11.5px;color:var(--muted);line-height:1.7;margin:0 0 14px;">' +
          'شش مرحله. هر کدام را جدا انجام بده. لازم نیست همه را با هم انجام دهی — ' +
          'ولی اگر همه را انجام دهی، مغزت مسیر تازه‌ای می‌سازد.' +
        '</p>' +

        // تایمر
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:12px;padding:10px 14px;margin-bottom:16px;">' +
          '<span style="font-size:12px;font-weight:700;">⏱️ زمان تمرین</span>' +
          '<span id="dp-timer-display" style="font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;">۱۵:۰۰</span>' +
          '<button type="button" id="dp-timer-btn" class="btn tiny" style="padding:5px 14px;">شروع</button>' +
        '</div>' +

        /* مرحله ۱ */
        stepBlock(1, 'آماده‌سازی — آرام شدن', 
          'چرا؟ قبل از هر چیز، بدنت باید آرام شود. اگر مضطرب باشی، مغزت نمی‌تواند چیز جدیدی بسازد.',
          'سه نفس ۴-۷-۸ بکش (۴ ثانیه دم، ۷ نگه‌دار، ۸ بازدم). بعد یک شکرگذاری کوچک بگو — چیزی که همین حالا برایش سپاسگزاری.'
        ) +

        /* مرحله ۲ — Nothing */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۲</span>' +
            '<span class="dp-step-title" style="flex:1;">خالی شدن (Nothing)</span>' +
            '<span class="dp-check" data-dp-check="2" style="font-size:18px;color:var(--muted);">○</span>' +
            '<button type="button" id="nothing-sound-toggle" class="nothing-sound-btn" onclick="toggleNothingSound()" title="قطع/وصل صدا">🔔</button>' +
          '</div>' +
          '<div style="margin-right:36px;padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;margin-top:6px;">' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.7;">' +
              '<b>چرا؟</b> فکرهای تکراری، جلوی ساخت مسیر جدید را می‌گیرند. با خالی شدن، برای چند لحظه سکوت می‌سازی — و در آن سکوت، ذهنت آماده‌ی چیز تازه می‌شود.' +
            '</div>' +
          '</div>' +
          '<p class="bf-desc" style="margin-right:36px;margin-top:10px;">' +
            'توجهت را یکی‌یکی از این پنج لایه برمی‌داری. لازم نیست همه را کامل انجام دهی — ' +
            'هر کدام که برایت آسان‌تر است، همان را شروع کن.' +
          '</p>' +

          '<div class="nothing-stage" id="nothing-stage" style="margin:8px 36px 0 0;max-width:200px;height:200px;">' +
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
          '<button type="button" class="btn tiny dp-mark" data-dp-step="2" style="margin-right:36px;margin-top:10px;">✓ این مرحله را انجام دادم</button>' +
        '</div>' +

        /* مرحله ۳ — سوال */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۳</span>' +
            '<span class="dp-step-title" style="flex:1;">سوال پرسیدن</span>' +
            '<span class="dp-check" data-dp-check="3" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<div style="margin-right:36px;padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;margin-top:6px;">' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.7;">' +
              '<b>چرا؟</b> بعد از اینکه از فکرهای قدیمی خالی شدی، حالا وقتِ کاشتن است. ' +
              'به‌جای «آرزو کردن»، یک <b>سوال</b> می‌پرسی. سوال، مغزت را باز می‌کند تا فرصت‌های تازه ببیند.' +
            '</div>' +
          '</div>' +
          '<div style="margin:10px 36px 0 0;">' +
            '<div class="b-field" style="margin-bottom:8px;">' +
              '<label style="font-size:12px;">اگر ترس نبود، چه می‌کردم؟</label>' +
              '<textarea id="dp-possibility-fear" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="مثلاً: اولین قدم را همین امروز برمی‌داشتم..."></textarea>' +
            '</div>' +
            '<div class="b-field" style="margin-bottom:8px;">' +
              '<label style="font-size:12px;">اگر پول نبود، چه می‌کردم؟</label>' +
              '<textarea id="dp-possibility-money" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="مثلاً: با همان چیزی که دارم شروع می‌کردم..."></textarea>' +
            '</div>' +
            '<div class="b-field" style="margin-bottom:8px;">' +
              '<label style="font-size:12px;">اگر تأیید دیگران نبود، چه می‌کردم؟</label>' +
              '<textarea id="dp-possibility-approval" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="مثلاً: همان کاری را می‌کردم که قلبم می‌گفت..."></textarea>' +
            '</div>' +
            '<button type="button" class="btn tiny dp-mark" data-dp-step="3" style="margin-top:6px;">✓ این مرحله را انجام دادم</button>' +
          '</div>' +
        '</div>' +

        /* مرحله ۴ — خواندن متن آینده */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۴</span>' +
            '<span class="dp-step-title" style="flex:1;">متن آینده‌ات را بخوان</span>' +
            '<span class="dp-check" data-dp-check="4" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<div style="margin-right:36px;padding:10px 12px;background:rgba(244,197,66,.08);border-right:3px solid var(--gold-500);border-radius:8px;margin-top:6px;">' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.7;">' +
              '<b>چرا؟</b> مغز، چیزهایی را که تکرار می‌کنی باور می‌کند. ' +
              'وقتی متن آینده‌ات را هر روز با صدای بلند می‌خوانی، ذهنت کم‌کم باور می‌کند که آن آدم جدید <b>تو هستی</b>.' +
            '</div>' +
          '</div>' +
          '<div style="margin:10px 36px 0 0;">' +
            '<div style="font-size:11.5px;color:var(--muted);margin-bottom:6px;">متن فعال تو:</div>' +
            '<div id="dp-seeit-text" style="padding:12px 14px;background:var(--card);border:1px dashed var(--gold-300);border-radius:10px;font-size:12.5px;line-height:1.9;font-style:italic;color:var(--ink);max-height:130px;overflow-y:auto;white-space:pre-wrap;"></div>' +
            '<div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.6;">با صدای بلند بخوان. اگر دوست داری، چشم‌هایت را ببند و خودت را داخل صحنه ببین.</div>' +
            '<button type="button" class="btn tiny dp-mark" data-dp-step="4" style="margin-top:10px;">✓ خواندم</button>' +
          '</div>' +
        '</div>' +

        /* مرحله ۵ — حس کردن */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۵</span>' +
            '<span class="dp-step-title" style="flex:1;">حسش کن</span>' +
            '<span class="dp-check" data-dp-check="5" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<div style="margin-right:36px;padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;margin-top:6px;">' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.7;">' +
              '<b>چرا؟</b> این مهم‌ترین مرحله است. اگر فقط فکر کنی ولی حس نکنی، مسیر جدید ساخته نمی‌شود. ' +
              '<b>حس، چسبِ مسیر عصبی است.</b>' +
            '</div>' +
          '</div>' +
          '<div style="margin:10px 36px 0 0;">' +
            '<p class="bf-desc" style="margin:0 0 10px;">' +
              'حسِ «همین حالا رسیده‌ام» را در بدنت فراخوانی کن. کدام احساس را داری؟ ' +
              'هرچه حس قوی‌تر باشد، مسیر ضخیم‌تر می‌شود.' +
            '</p>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
              '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'تمرین روزانه\')">💗 ثبت حس</button>' +
              '<span id="dp-emotion-feedback" style="font-size:11px;color:var(--muted);"></span>' +
            '</div>' +
            '<button type="button" class="btn tiny dp-mark" data-dp-step="5" style="margin-top:10px;">✓ حسش کردم</button>' +
          '</div>' +
        '</div>' +

        /* مرحله ۶ — تبدیل شدن */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<span class="dp-step-num">۶</span>' +
            '<span class="dp-step-title" style="flex:1;">تبدیل شو</span>' +
            '<span class="dp-check" data-dp-check="6" style="font-size:18px;color:var(--muted);">○</span>' +
          '</div>' +
          '<div style="margin-right:36px;padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;margin-top:6px;">' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.7;">' +
              '<b>چرا؟</b> هویت، بالاترین سطح تغییر است. وقتی خودت را «کسی که به هدفش رسیده» می‌بینی، ' +
              'رفتارهایت خودبه‌خود با آن هویت هم‌راستا می‌شوند.' +
            '</div>' +
          '</div>' +
          '<div style="margin:10px 36px 0 0;">' +
            '<p class="bf-desc" style="margin:0 0 10px;">' +
              'چند لحظه در همان حال بمان. یک جمله‌ی ساده بگو:' +
            '</p>' +
            '<div style="padding:14px;background:linear-gradient(135deg,rgba(43,191,171,.12),rgba(94,200,240,.06));border-radius:12px;text-align:center;font-size:14px;font-weight:800;color:var(--emerald-700);">' +
              '«من همین حالا همینم.»' +
            '</div>' +
            '<button type="button" class="btn tiny dp-mark" data-dp-step="6" style="margin-top:10px;">✓ تأیید می‌کنم</button>' +
          '</div>' +
        '</div>' +

        /* موسیقی */
        '<div style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:11.5px;font-weight:700;margin-bottom:8px;">🎵 موسیقی مدیتیشن (اختیاری)</div>' +
          '<label class="visual-upload-btn" for="meditation-audio-input" style="font-size:11px;padding:7px 12px;">+ افزودن موسیقی</label>' +
          '<input type="file" id="meditation-audio-input" accept="audio/*" style="display:none" onchange="handleMeditationAudio(this.files)">' +
          '<div id="meditation-audio-wrap"></div>' +
        '</div>' +

        /* دکمه نهایی — همیشه فعال */
        '<button type="button" id="dp-complete-btn" style="width:100%;margin-top:18px;padding:15px;font-size:14px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:16px;cursor:pointer;box-shadow:0 10px 24px rgba(15,91,83,.25);">' +
          '✨ ثبت جلسه‌ی امروز' +
        '</button>' +
        '<div id="dp-progress-hint" style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;">' +
          '۰ از ۶ مرحله انجام شده' +
        '</div>' +

        /* مدار عصبی */
        '<div style="margin-top:20px;padding-top:16px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:12.5px;font-weight:800;margin-bottom:8px;">🧠 مدار عصبی این تمرین</div>' +
          '<div class="neural-card" id="np-dispenza-mount"></div>' +
        '</div>' +
      '</div>' +

      /* نگه‌داشتن عناصر مخفی برای سازگاری با کد قدیمی */
      '<textarea id="b-future-text" style="display:none;"></textarea>' +
      '<textarea id="b-visual-note" style="display:none;"></textarea>' +
      '<textarea id="b-tracking" style="display:none;"></textarea>' +
      '<div id="tracking-list" style="display:none;"></div>' +
      '<div id="future-progress-wrap" style="display:none;"></div>';

    topbar.insertAdjacentHTML('afterend', html);

    // استایل مینی‌کالندر
    if (!document.getElementById('mini-cal-style')){
      var st = document.createElement('style');
      st.id = 'mini-cal-style';
      st.textContent =
        '.mini-cal-day{aspect-ratio:1;border-radius:5px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--muted);}' +
        '.mini-cal-day.done{background:var(--emerald-500);color:#fff;font-weight:700;}' +
        '.mini-cal-day.today{outline:2px solid var(--gold-500);outline-offset:1px;}' +
        '.mini-cal-day.future{opacity:.35;}' +
        '.mini-cal-day.empty{background:transparent;}';
      document.head.appendChild(st);
    }
  }

  function stepBlock(num, title, why, what){
    return '' +
      '<div class="dp-step">' +
        '<div class="dp-step-head">' +
          '<span class="dp-step-num">' + num + '</span>' +
          '<span class="dp-step-title" style="flex:1;">' + title + '</span>' +
          '<span class="dp-check" data-dp-check="' + num + '" style="font-size:18px;color:var(--muted);">○</span>' +
        '</div>' +
        '<div style="margin-right:36px;padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;margin-top:6px;">' +
          '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.7;">' + why + '</div>' +
        '</div>' +
        '<p class="bf-desc" style="margin-right:36px;margin-top:10px;">' + what + '</p>' +
        '<button type="button" class="btn tiny dp-mark" data-dp-step="' + num + '" style="margin-right:36px;margin-top:8px;">✓ این مرحله را انجام دادم</button>' +
      '</div>';
  }

  /* =====================================================================
     بخش ۳ — رندر متن آینده + آرشیو + مینی‌کالندر
     ===================================================================== */
  function renderFutureText(){
    var v = getActiveVersion();
    var display = document.getElementById('future-display');
    var activeBadge = document.getElementById('future-active-badge');
    var archiveCount = document.getElementById('archive-count');
    var seeitText = document.getElementById('dp-seeit-text');

    if (display){
      if (v && v.text && v.text.trim()){
        display.innerHTML = '«' + escapeHtml(v.text) + '»';
      } else {
        display.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12.5px;padding:16px 0;font-style:normal;">هنوز متن آینده‌ای ننوشتی.<br><span style="font-size:11px;">روی «✏️ ویرایش متن» بزن تا شروع کنی.</span></div>';
      }
    }

    if (activeBadge){
      var versions = state.futureTextVersions || [];
      var activeIdx = versions.findIndex(function(x){ return x.id === state.activeFutureVersionId; });
      if (activeIdx === -1) activeBadge.textContent = '—';
      else activeBadge.textContent = 'نسخه ' + toFa(activeIdx + 1) + ' از ' + toFa(versions.length);
    }

    if (seeitText){
      if (v && v.text){
        seeitText.innerHTML = '«' + escapeHtml(v.text) + '»';
      } else {
        seeitText.innerHTML = '<span style="color:var(--muted);font-style:normal;font-size:12px;">اول متن آینده‌ات را در کارت بالا بنویس.</span>';
      }
    }

    if (archiveCount){
      archiveCount.textContent = toFa((state.futureTextVersions || []).length);
    }

    renderMiniCal();
    renderArchiveBox();
  }

  function renderMiniCal(){
    var wrap = document.getElementById('future-mini-cal');
    if (!wrap) return;

    var v = getActiveVersion();
    var readDays = (v && v.readDays) ? v.readDays : [];
    var readSet = {};
    readDays.forEach(function(k){ readSet[k] = true; });

    // ۹۰ روز از شروع دوره
    var startKey = v ? v.startDate : dpTodayKey();
    var startDate = ndKeyToDate(startKey);
    var today = new Date();
    today.setHours(0,0,0,0);

    var html = '';
    // سرستون‌ها
    ['ش','ی','د','س','چ','پ','ج'].forEach(function(d){
      html += '<div style="font-size:9px;color:var(--muted);padding:3px 0;font-weight:700;">' + d + '</div>';
    });

    // محاسبه روز اول هفته برای شروع
    var firstDayWd = (startDate.getDay() + 1) % 7; // شنبه=0
    for (var i = 0; i < firstDayWd; i++){
      html += '<div class="mini-cal-day empty"></div>';
    }

    var todayKeyStr = dpTodayKey();
    for (var d = 0; d < 90; d++){
      var date = new Date(startDate);
      date.setDate(date.getDate() + d);
      var y = date.getFullYear();
      var m = date.getMonth() + 1;
      var day = date.getDate();
      var key = y + '-' + m + '-' + day;
      var done = !!readSet[key];
      var isToday = key === todayKeyStr;
      var isFuture = date > today;
      var cls = 'mini-cal-day';
      if (done) cls += ' done';
      if (isToday) cls += ' today';
      if (isFuture) cls += ' future';
      html += '<div class="' + cls + '" title="' + key + '">' + (done ? '✓' : '') + '</div>';
    }
    wrap.innerHTML = html;
  }

  function renderArchiveBox(){
    var box = document.getElementById('future-archive-box');
    if (!box) return;
    if (!ARCHIVE_OPEN){ box.style.display = 'none'; return; }
    box.style.display = 'block';

    var versions = state.futureTextVersions || [];
    if (!versions.length){
      box.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--muted);padding:10px;">هنوز نسخه‌ای ذخیره نشده.</div>';
      return;
    }

    var html = '<div style="font-size:11.5px;font-weight:800;margin-bottom:8px;color:var(--ink);">📚 همه‌ی نسخه‌های تو</div>';
    versions.slice().reverse().forEach(function(v, idx){
      var realIdx = versions.length - 1 - idx;
      var isActive = v.id === state.activeFutureVersionId;
      var end = v.endDate || 'اکنون';
      var startStr = v.startDate;
      var readCount = (v.readDays || []).length;

      html += '<div style="padding:10px;border-radius:10px;margin-bottom:6px;border:1px solid ' + (isActive ? 'var(--emerald-500)' : 'var(--line)') + ';background:' + (isActive ? 'rgba(43,191,171,.06)' : 'var(--card)') + ';">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
          '<span style="font-size:11.5px;font-weight:800;color:var(--ink);">نسخه ' + toFa(realIdx + 1) + (isActive ? ' • فعال' : '') + '</span>' +
          '<span style="font-size:10px;color:var(--muted);">' + toFa(readCount) + ' روز خوانده</span>' +
        '</div>' +
        '<div style="font-size:10.5px;color:var(--muted);margin-bottom:6px;">' +
          startStr + ' تا ' + end +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.7;padding:8px;background:var(--surface-2);border-radius:8px;font-style:italic;margin-bottom:8px;">' +
          '«' + escapeHtml(v.text.length > 120 ? v.text.slice(0, 120) + '...' : v.text) + '»' +
        '</div>' +
        (isActive ? '' : '<button type="button" class="btn tiny" data-activate-version="' + v.id + '" style="width:100%;font-size:11px;">فعال کردن این نسخه</button>') +
      '</div>';
    });
    box.innerHTML = html;
  }

  /* =====================================================================
     بخش ۴ — رندر پیشرفت پروتکل
     ===================================================================== */
  function dpGetTodaySteps(){
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    var k = dpTodayKey();
    if (!Array.isArray(state.dispenzaDailyProgress[k])) state.dispenzaDailyProgress[k] = [];
    return state.dispenzaDailyProgress[k];
  }

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
      btn.style.opacity = isDone ? '0.5' : '1';
      btn.textContent = isDone ? '✓ انجام شد' : '✓ این مرحله را انجام دادم';
    });

    var hint = document.getElementById('dp-progress-hint');
    if (hint){
      hint.textContent = toFa(done.length) + ' از ۶ مرحله انجام شده';
    }

    var totalDays = Math.min((state.dispenzaReadDays || []).length, 90);
    var sessionCount = totalDays * 2;
    var countEl = document.getElementById('dp-session-count');
    if (countEl) countEl.textContent = toFa(sessionCount) + ' جلسه';

    // متن آینده — پیشرفت
    var v = getActiveVersion();
    var readDays = v && v.readDays ? v.readDays.length : 0;
    var numEl = document.getElementById('future-day-num');
    var leftEl = document.getElementById('future-days-left');
    var pbar = document.getElementById('future-progress-bar');
    var doneCount = Math.min(readDays, 90);
    var left = Math.max(0, 90 - doneCount);
    if (numEl) numEl.textContent = toFa(doneCount);
    if (leftEl) leftEl.textContent = left > 0 ? toFa(left) + ' روز مانده' : '🎉 تکمیل شد';
    if (pbar) pbar.style.width = (doneCount / 90 * 100) + '%';

    var em = document.getElementById('dp-emotion-feedback');
    if (em){
      var q = getTodayEmotionQualityFor('dispenza');
      if (q === null) em.textContent = '';
      else if (q >= 500) em.textContent = '🔥 حس پرقدرت';
      else if (q < 200) em.textContent = '⚠️ حس ضعیف';
      else em.textContent = '✓ ثبت شد';
    }
  }

  /* =====================================================================
     بخش ۵ — تایمر
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
     بخش ۶ — ویرایش و آرشیو (درون‌خطی)
     ===================================================================== */
  function openFutureEditor(){
    var v = getActiveVersion();
    var editorBox = document.getElementById('future-editor');
    var input = document.getElementById('future-editor-input');
    var display = document.getElementById('future-display');
    var actions = document.getElementById('future-actions');
    if (!editorBox || !input) return;
    input.value = v ? v.text : '';
    editorBox.style.display = 'block';
    if (display) display.style.display = 'none';
    if (actions) actions.style.display = 'none';
    setTimeout(function(){ input.focus(); }, 50);
  }

  function closeFutureEditor(){
    var editorBox = document.getElementById('future-editor');
    var display = document.getElementById('future-display');
    var actions = document.getElementById('future-actions');
    if (editorBox) editorBox.style.display = 'none';
    if (display) display.style.display = 'block';
    if (actions) actions.style.display = 'flex';
  }

  function saveFutureText(){
    var input = document.getElementById('future-editor-input');
    if (!input) return;
    var newText = (input.value || '').trim();
    if (!newText){
      if (typeof toast === 'function') toast('متن نمی‌تونه خالی باشه');
      return;
    }
    var v = getActiveVersion();

    if (v && newText === v.text){
      closeFutureEditor();
      return;
    }

    if (v){
      // نسخه‌ی قبلی بسته بشه
      v.endDate = dpTodayKey();
    }

    var newV = {
      id: 'v_' + Date.now(),
      text: newText,
      startDate: dpTodayKey(),
      endDate: null,
      readDays: []
    };
    if (!Array.isArray(state.futureTextVersions)) state.futureTextVersions = [];
    state.futureTextVersions.push(newV);
    state.activeFutureVersionId = newV.id;
    state.futureText = newText;
    state.futureStartDate = newV.startDate;
    state.futureReadDays = newV.readDays;

    try { saveState(); } catch(e){}
    closeFutureEditor();
    renderFutureText();
    dpRenderProgress();
    if (typeof toast === 'function'){
      toast(v ? 'نسخه‌ی جدید ثبت شد — قبلی رفت به آرشیو 📚' : 'متن آینده‌ات ثبت شد ✨');
    }
  }

  function toggleArchive(){
    ARCHIVE_OPEN = !ARCHIVE_OPEN;
    renderArchiveBox();
  }

  function activateVersion(id){
    var versions = state.futureTextVersions || [];
    var chosen = versions.filter(function(v){ return v.id === id; })[0];
    if (!chosen) return;
    // بستن نسخه‌های فعال دیگر
    versions.forEach(function(v){
      if (v.id !== id && !v.endDate) v.endDate = dpTodayKey();
    });
    chosen.endDate = null;
    state.activeFutureVersionId = chosen.id;
    state.futureText = chosen.text;
    state.futureStartDate = chosen.startDate;
    state.futureReadDays = chosen.readDays || [];
    try { saveState(); } catch(e){}
    renderFutureText();
    dpRenderProgress();
    if (typeof toast === 'function') toast('نسخه فعال شد ✓');
  }

  /* =====================================================================
     بخش ۷ — تقویم کامل
     ===================================================================== */
  function openFullCalendar(){
    if (typeof openBankCalendar === 'function'){
      openBankCalendar('beliefs');
    } else if (typeof toast === 'function'){
      toast('تقویم در دسترس نیست');
    }
  }

  /* =====================================================================
     بخش ۸ — رندر مسیر عصبی
     ===================================================================== */
  function renderOurNeuralPathways(){
    if (typeof renderNeuralPathway !== 'function') return;
    if (!document.getElementById('np-dispenza-mount')) return;
    try {
      var dn = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
      if (!dn) return;
      renderNeuralPathway('np-dispenza-mount', dn, {
        label: 'تمرین روزانه',
        practiceKey: 'dispenza',
        onChange: saveState
      });
    } catch(e){ console.warn('[np-dispenza]', e); }
  }

  function overrideRenderAll(){
    window.renderAllNeuralPathways = function(){
      renderOurNeuralPathways();
    };
  }

  /* =====================================================================
     بخش ۹ — wrap renderBeliefsView
     ===================================================================== */
  function wrapRenderBeliefsView(){
    if (typeof window.renderBeliefsView !== 'function') return;
    if (window.renderBeliefsView.__patchedV3) return;
    var original = window.renderBeliefsView;
    window.renderBeliefsView = function(){
      try { original.apply(this, arguments); } catch(e){}
      try { renderFutureText(); } catch(e){}
      try { dpRenderProgress(); } catch(e){}
      try { renderOurNeuralPathways(); } catch(e){}
      // سوئیچ یادآوری در توپ‌بار
      var sw = document.getElementById('alarm-switch');
      if (sw) sw.classList.toggle('on', !!state.alarmEnabled);
      var at = document.getElementById('alarm-time');
      if (at) at.value = state.alarmTime || '20:00';
    };
    window.renderBeliefsView.__patchedV3 = true;
  }

  /* =====================================================================
     بخش ۱۰ — رویدادها
     ===================================================================== */
  function wireEvents(){
    document.addEventListener('click', function(e){
      var t = e.target;

      // مرحله‌ی پروتکل
      var markBtn = t.closest && t.closest('.dp-mark');
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
      if (t.id === 'dp-timer-btn'){ dpStartTimer(); return; }

      // ویرایش متن
      if (t.id === 'edit-future-btn'){ openFutureEditor(); return; }
      if (t.id === 'future-save-btn'){ saveFutureText(); return; }
      if (t.id === 'future-cancel-btn'){ closeFutureEditor(); return; }

      // آرشیو
      if (t.id === 'archive-future-btn'){ toggleArchive(); return; }

      // فعال‌کردن نسخه‌ی آرشیو
      var actBtn = t.closest && t.closest('[data-activate-version]');
      if (actBtn){
        activateVersion(actBtn.dataset.activateVersion);
        return;
      }

      // تقویم کامل
      if (t.id === 'future-calendar-btn'){ openFullCalendar(); return; }

      // دکمه‌ی نهایی — همیشه فعال
      if (t.id === 'dp-complete-btn'){
        var quality = getTodayEmotionQualityFor('dispenza');
        var done = dpGetTodaySteps();
        var count = done.length;
        var fibers = 1;
        var msg = 'ثبت شد — یک مسیر جدید 🧠';

        if (count === 6 && quality !== null){
          if (quality >= 500){ fibers = 2; msg = '🔥 همه‌ی مراحل + حس پرقدرت — دو مسیر ساخته شد!'; }
          else if (quality < 200){ fibers = 0; msg = '⚠️ حس ضعیف بود — دفعه‌ی بعد عمیق‌تر حسش کن'; }
          else msg = 'ثبت شد — یک مسیر جدید 🧠';
        } else if (count === 0){
          fibers = 0;
          msg = 'اول حداقل یک مرحله را انجام بده';
        }

        var dn = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
        if (dn){
          if (fibers > 0){
            for (var i = 0; i < fibers; i++){
              if (typeof neuralAddFiber === 'function') neuralAddFiber(dn, {calendarLinked:false});
            }
          }
        }

        var dk = dpTodayKey();
        if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
        if (state.dispenzaReadDays.indexOf(dk) === -1) state.dispenzaReadDays.push(dk);

        var v = getActiveVersion();
        if (v){
          if (!Array.isArray(v.readDays)) v.readDays = [];
          if (v.readDays.indexOf(dk) === -1) v.readDays.push(dk);
        }

        // ریست مراحل فردا
        if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
        state.dispenzaDailyProgress[dk] = [];

        try { saveState(); } catch(e2){}
        dpRenderProgress();
        renderFutureText();
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
  }

  /* =====================================================================
     بخش ۱۱ — بازگرداندن امکان‌ها
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
     بخش ۱۲ — اجرا
     ===================================================================== */
  function boot(){
    if (!ensureState()){ setTimeout(boot, 100); return; }
    injectHelpSection();
    rebuildBeliefsView();
    overrideRenderAll();
    wrapRenderBeliefsView();
    wireEvents();
    dpRestorePossibilities();
    try { renderFutureText(); } catch(e){}
    try { dpRenderProgress(); } catch(e){}
    try { renderOurNeuralPathways(); } catch(e){}
    var bv = document.getElementById('view-beliefs');
    if (bv && bv.classList.contains('active') && typeof window.renderBeliefsView === 'function'){
      try { window.renderBeliefsView(); } catch(e){}
    }
  }

  if (document.readyState === 'complete') setTimeout(boot, 300);
  else window.addEventListener('load', function(){ setTimeout(boot, 300); });
})();
