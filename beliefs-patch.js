/* =====================================================================
   beliefs-patch.js — نسخه‌ی بازطراحی‌شده، تمیز و کامل
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
     state
     ===================================================================== */
  function ensureState(){
    if (typeof state === 'undefined' || !state) return false;
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (!state.dispenzaPossibilities) state.dispenzaPossibilities = {};
    if (!state.practiceEmotions) state.practiceEmotions = {};
    if (!state.rasMission) state.rasMission = {};

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

  /* =====================================================================
     راهنما
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
          '<li>با یک تمرین روزانه، باورهای محدودکننده را با باورهای تازه عوض می‌کنی.</li>' +
        '</ul>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>🧠 سه اصلی که باید بدانی</h3>' +
        '<p><b>۱. مغزت قابل تغییر است.</b> تا آخر عمر می‌تواند خودش را بازسازی کند. هر رفتاری را که تکرار کنی، در مغزت مثل یک راه جدید ساخته می‌شود. این راه هر بار که تکرار شود، پهن‌تر می‌شود — تا یک روز بدون تلاش، خودکار می‌شود.</p>' +
        '<p><b>۲. احساس، چسبِ راه است.</b> اگر کاری را با احساس قوی انجام دهی، راهش سریع‌تر ساخته می‌شود. برای همین در تمرین‌ها فقط فکر نمی‌کنیم — حس رسیدن را هم تجربه می‌کنیم.</p>' +
        '<p><b>۳. ۹۰ روز، زمان تغییر است.</b> پژوهش‌ها نشان می‌دهد برای اینکه یک عادت یا باور جدید در مغز جا بیفتد، به‌طور میانگین ۶۶ تا ۹۰ روز تمرین روزانه لازم است.</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>💡 «خواستن» یا «باور داشتن»؟</h3>' +
        '<p>این مهم‌ترین نکته‌ی این اپ است.</p>' +
        '<ul>' +
          '<li><b>وقتی «می‌خواهی»:</b> دلت می‌گوید «این را ندارم، کاش داشتم». این حالت، بدنت را مضطرب می‌کند و مغزت را می‌بندد.</li>' +
          '<li><b>وقتی «باور داری»:</b> دلت می‌گوید «من این هستم، حالا چه چیزهای خوبی ممکن است؟». این حالت بدنت را آرام می‌کند و مغزت را باز می‌کند.</li>' +
        '</ul>' +
        '<p>به همین دلیل در تمرین‌ها به‌جای «آرزو کردن»، از تو یک سوال می‌پرسیم: «اگر ترس نبود، چه می‌کردم؟» این سوال، جواب‌های تازه به ذهنت می‌آورد.</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>📅 چطور هر روز تمرین کنم؟</h3>' +
        '<ol style="padding-inline-start:20px;line-height:2;font-size:12.5px;color:var(--text-dim);">' +
          '<li><b>صبح:</b> بعد از بیدار شدن و نوشیدن آب، برو تب «باورها».</li>' +
          '<li>متن آینده‌ات را یک بار با صدای بلند بخوان.</li>' +
          '<li>تمرین ۶ مرحله‌ای را انجام بده — حدود ۱۵ دقیقه.</li>' +
          '<li><b>شب:</b> قبل از خواب، دوباره همین را تکرار کن.</li>' +
          '<li>هر روز، حداقل یک خط شکرگذاری بنویس.</li>' +
        '</ol>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>⚕️ یک نکته‌ی مهم</h3>' +
        '<p>این تمرین‌ها یک «باشگاه ذهن» هستند، نه جایگزین درمان پزشکی. اگر افسردگی، اضطراب شدید یا هر مسئله‌ی سلامت روانی داری، در کنار این تمرین‌ها با یک متخصص هم صحبت کن.</p>' +
      '</div>';

    modalActions.parentNode.insertBefore(wrap, modalActions);
  }

  /* =====================================================================
     بازسازی تب باورها
     ===================================================================== */
  function rebuildBeliefsView(){
    var beliefView = document.getElementById('view-beliefs');
    if (!beliefView) return;

    // حذف کارت‌های قدیمی
    var cards = beliefView.querySelectorAll('.belief-flow-card');
    for (var i = 0; i < cards.length; i++){
      if (cards[i].parentNode) cards[i].parentNode.removeChild(cards[i]);
    }
    ['streak-box','streak-history','help-open-btn'].forEach(function(cls){
      var els = beliefView.querySelectorAll('.' + cls);
      for (var j = 0; j < els.length; j++) if (els[j].parentNode) els[j].parentNode.removeChild(els[j]);
    });

    var topbar = beliefView.querySelector('.topbar');
    if (!topbar) return;

    var html = '' +
      /* ============ کارت ۱ — متن آینده ============ */
      '<div class="belief-flow-card" data-new-card="1">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<div class="bf-head" style="margin:0;">📜 متن آینده‌ی من</div>' +
          '<span id="future-active-badge" style="font-size:10px;color:var(--muted);background:var(--surface-2);padding:3px 8px;border-radius:20px;">—</span>' +
        '</div>' +

        '<div id="future-display" style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;min-height:70px;font-size:13px;line-height:1.9;color:var(--ink);white-space:pre-wrap;font-style:italic;"></div>' +

        '<div id="future-editor" style="display:none;margin-bottom:10px;">' +
          '<textarea id="future-editor-input" rows="4" style="width:100%;font-family:inherit;font-size:13px;line-height:1.8;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--card);color:var(--ink);resize:vertical;outline:none;" placeholder="بسیار خوشحال و سپاسگزارم حالا که..."></textarea>' +
          '<div style="display:flex;gap:6px;margin-top:8px;">' +
            '<button type="button" id="future-save-btn" class="btn gold" style="flex:1;font-size:12.5px;padding:10px;">💾 ذخیره</button>' +
            '<button type="button" id="future-cancel-btn" class="btn" style="flex:1;font-size:12.5px;padding:10px;">لغو</button>' +
          '</div>' +
        '</div>' +

        '<div id="future-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
          '<button type="button" id="edit-future-btn" class="btn tiny" style="flex:1;min-width:90px;">✏️ ویرایش</button>' +
          '<button type="button" id="archive-future-btn" class="btn tiny" style="flex:1;min-width:90px;">📚 آرشیو (<span id="archive-count">۰</span>)</button>' +
        '</div>' +

        '<div id="future-archive-box" style="display:none;margin-bottom:10px;padding:10px;background:var(--surface-2);border-radius:12px;max-height:260px;overflow-y:auto;"></div>' +

        '<div style="padding-top:12px;border-top:1px dashed var(--line);">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
            '<span style="font-size:12px;font-weight:700;">📅 پیشرفت روزانه</span>' +
            '<span style="font-size:11px;color:var(--muted);"><b id="future-day-num" style="color:var(--ink);">۰</b> از ۹۰ • <span id="future-days-left">۹۰ مانده</span></span>' +
          '</div>' +
          '<div class="tb-bar" style="margin:0 0 12px;height:5px;"><div class="tb-bar-fill" id="future-progress-bar" style="width:0%;"></div></div>' +
          '<div id="future-mini-cal" class="mini-cal-grid"></div>' +
        '</div>' +
      '</div>' +

      /* ============ کارت ۲ — تمرین روزانه ============ */
      '<div class="belief-flow-card" id="dispenza-protocol-card" data-new-card="1" style="margin-top:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div class="bf-head" style="margin:0;">🌌 تمرین روزانه</div>' +
          '<span id="dp-session-count" style="font-size:10.5px;color:var(--muted);">۰ جلسه</span>' +
        '</div>' +
        '<p style="font-size:11px;color:var(--muted);line-height:1.7;margin:0 0 14px;">' +
          'شش مرحله. هر کدام را جدا تیک بزن. دکمه‌ی ثبت پایین همیشه فعاله.' +
        '</p>' +

        // تایمر
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:12px;padding:8px 12px;margin-bottom:16px;">' +
          '<span style="font-size:11.5px;font-weight:700;">⏱️ زمان تمرین</span>' +
          '<span id="dp-timer-display" style="font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;">۱۵:۰۰</span>' +
          '<button type="button" id="dp-timer-btn" class="btn tiny" style="padding:4px 12px;font-size:11px;">شروع</button>' +
        '</div>' +

        /* ---------- مرحله ۱ — آرام شدن ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="1">○</button>' +
            '<span class="dp-step-num">۱</span>' +
            '<span class="dp-step-title">آرام شدن</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            'وقتی مضطربی یا ذهنت شلوغه، مغزت در حالت «مبارزه یا فرار» گیر می‌کنه و نمی‌تونه چیز تازه‌ای بسازه. ' +
            'با آرام کردن بدنت، یک موج آلفا در مغزت می‌سازی — این بهترین حالت مغز برای یادگیری و ساختن مسیرهای تازه‌ست.' +
          '</div>' +
          '<div class="dp-step-content">' +
            'سه نفس ۴-۷-۸ بکش: ۴ ثانیه دم، ۷ ثانیه نگه‌دار، ۸ ثانیه بازدم. ' +
            'بعد یک شکرگذاری کوچک بگو — چیزی که همین حالا برایش سپاسگزاری.' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۲ — خالی شدن ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="2">○</button>' +
            '<span class="dp-step-num">۲</span>' +
            '<span class="dp-step-title">خالی شدن</span>' +
            '<button type="button" id="nothing-sound-toggle" class="nothing-sound-btn" onclick="toggleNothingSound()" style="margin-inline-start:auto;" title="قطع/وصل صدا">🔔</button>' +
          '</div>' +
          '<div class="dp-why-box">' +
            'مغزت روزی هزاران فکر تکراری تولید می‌کنه که همه از یک مدار قدیمی میان. ' +
            'تا وقتی اون مدار فعاله، مسیر تازه نمی‌تونه ساخته بشه. ' +
            'با خالی شدن، اون مدار رو برای چند لحظه خاموش می‌کنی — و ذهنت آماده‌ی چیز تازه می‌شه.' +
          '</div>' +
          '<div class="dp-step-content" style="text-align:center;">' +
            'توجهت را از این پنج لایه برمی‌داری. لازم نیست همه را کامل انجام دهی — هر کدام که برایت آسان‌تر است، همان را شروع کن.' +
          '</div>' +

          '<div class="nothing-stage" id="nothing-stage" style="margin:16px auto 0;max-width:220px;height:220px;">' +
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

          '<div class="nothing-steps" id="nothing-steps" style="margin:14px auto 0;max-width:300px;">' +
            '<button type="button" class="nothing-step" data-nothing-step="body"><span class="nothing-step-num">۱</span><span class="nothing-step-txt"><b>No body</b> — از بدن</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="one"><span class="nothing-step-num">۲</span><span class="nothing-step-txt"><b>No one</b> — از هویت</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="thing"><span class="nothing-step-num">۳</span><span class="nothing-step-txt"><b>No thing</b> — از اشیا</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="where"><span class="nothing-step-num">۴</span><span class="nothing-step-txt"><b>No where</b> — از مکان</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="time"><span class="nothing-step-num">۵</span><span class="nothing-step-txt"><b>No time</b> — از زمان</span><span class="nothing-step-check">○</span></button>' +
          '</div>' +
          '<div class="nothing-final" id="nothing-final" style="text-align:center;margin-top:12px;"><span class="nothing-final-pulse"></span>Pure consciousness</div>' +
          '<div style="text-align:center;margin-top:8px;">' +
            '<button type="button" class="nothing-reset" onclick="resetNothingPractice()">↺ شروع دوباره</button>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۳ — سوال پرسیدن ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="3">○</button>' +
            '<span class="dp-step-num">۳</span>' +
            '<span class="dp-step-title">سوال پرسیدن</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            'این مرحله، جای «آرزو کردن» نیست — جای <b>سوال پرسیدن</b> است. ' +
            'فرقش چیه؟ «آرزو» مغزت رو در حالت کمبود نگه می‌داره و فقط به «نداشتن» فکر می‌کنه. ' +
            'اما «سوال»، یک مسیر جستجو در مغزت فعال می‌کنه. ' +
            'دقیقاً به همین دلیله که وقتی یک سوال از خودت می‌پرسی، بعداً در طول روز جواب‌هاش خودبه‌خود به ذهنت می‌آن. ' +
            'مغزت دنبال جواب می‌گرده — حتی وقتی آگاهانه بهش فکر نمی‌کنی.' +
          '</div>' +
          '<div class="dp-step-content">' +
            'این سه سوال را از خودت بپرس و جواب‌ها را بنویس. هر جواب، یک احتمال تازه است — نه یک آرزو.' +
          '</div>' +

          // جمع‌شونده برای کادرها
          '<div class="dp-toggle-wrap" style="margin-top:10px;">' +
            '<button type="button" class="dp-toggle-btn" data-toggle-box="dp-possibilities">' +
              '<span>✍️ نوشتن جواب‌ها</span>' +
              '<span class="dp-toggle-arrow">▾</span>' +
            '</button>' +
            '<div id="dp-possibilities" class="dp-toggle-body" style="display:none;">' +
              '<div style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">' +
                '<div>' +
                  '<label style="font-size:11.5px;display:block;margin-bottom:4px;">۱. اگر ترس نبود، چه می‌کردم؟</label>' +
                  '<textarea id="dp-possibility-fear" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="مثلاً: اولین قدم را همین امروز برمی‌داشتم..."></textarea>' +
                '</div>' +
                '<div>' +
                  '<label style="font-size:11.5px;display:block;margin-bottom:4px;">۲. اگر پول نبود، چه می‌کردم؟</label>' +
                  '<textarea id="dp-possibility-money" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="مثلاً: با همان چیزی که دارم شروع می‌کردم..."></textarea>' +
                '</div>' +
                '<div>' +
                  '<label style="font-size:11.5px;display:block;margin-bottom:4px;">۳. اگر تأیید دیگران نبود، چه می‌کردم؟</label>' +
                  '<textarea id="dp-possibility-approval" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="مثلاً: همان کاری را می‌کردم که قلبم می‌گفت..."></textarea>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۴ — متن آینده ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="4">○</button>' +
            '<span class="dp-step-num">۴</span>' +
            '<span class="dp-step-title">متن آینده‌ات را بخوان</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            'مغزت نمی‌تونه فرق بین «اتفاق واقعی» و «تجسم زنده» رو تشخیص بده. ' +
            'وقتی متن آینده‌ات رو با صدای بلند می‌خونی، مغزت مثل اینه که داری اون صحنه رو زندگی می‌کنی. ' +
            'هر بار که این کار رو بکنی، یک مسیر جدید در مغزت پررنگ‌تر می‌شه — انگار داری راهی رو که تا حالا نرفته‌ای، هموار می‌کنی.' +
          '</div>' +
          '<div class="dp-step-content">' +
            '<div style="font-size:11px;color:var(--muted);margin-bottom:6px;">متن فعال تو:</div>' +
            '<div id="dp-seeit-text" style="padding:12px 14px;background:var(--card);border:1px dashed var(--gold-300);border-radius:10px;font-size:12.5px;line-height:1.9;font-style:italic;color:var(--ink);max-height:160px;overflow-y:auto;white-space:pre-wrap;"></div>' +
            '<div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.6;">با صدای بلند بخوان. اگر دوست داری چشم‌هایت را ببند و خودت را داخل صحنه ببین.</div>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۵ — حسش کن و تبدیل شو ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="5">○</button>' +
            '<span class="dp-step-num">۵</span>' +
            '<span class="dp-step-title">حسش کن و تبدیل شو</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            'این مهم‌ترین مرحله‌ست. پژوهش‌ها نشون داده مغز، اطلاعاتی رو که با احساس قوی همراه باشه، چند برابر سریع‌تر ثبت می‌کنه. ' +
            'فقط فکر کردن کافی نیست — باید حسِ رسیدن رو تجربه کنی. ' +
            'وقتی خودت رو در حالتی که خواستی می‌بینی و حسش می‌کنی، مغزت باور جدید رو مثل یک واقعیت ثبت می‌کنه. ' +
            'و هویت، بالاترین سطح تغییره: وقتی خودت رو «کسی که رسیده» می‌بینی، رفتارهایت خودبه‌خود با اون هویت هم‌راستا می‌شن.' +
          '</div>' +

          // تصویرسازی
          '<div class="dp-step-content">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">🖼️ تصویرسازی</div>' +
            '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">' +
              'خودت را در صحنه‌ای ببین که به خواسته‌ات رسیده‌ای. اگر بخواهی، عکس‌هایی از آن صحنه اضافه کن تا ذهنت راحت‌تر ببیند.' +
            '</div>' +
            '<label class="visual-upload-btn" for="visual-image-input">+ افزودن عکس</label>' +
            '<input type="file" id="visual-image-input" accept="image/*" multiple style="display:none" onchange="handleVisualImages(this.files)">' +
            '<div class="visual-gallery" id="visual-gallery" style="margin-top:10px;"></div>' +
          '</div>' +

          // ثبت حس
          '<div class="dp-step-content" style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">💗 حسِ حالا</div>' +
            '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">' +
              'حس رسیدن را در بدنت فراخوانی کن. کدام احساس را داری؟ هرچه حس قوی‌تر باشد، مسیر تازه ضخیم‌تر می‌شود.' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
              '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'تمرین روزانه\')">💗 ثبت حس</button>' +
              '<span id="dp-emotion-feedback" style="font-size:11px;color:var(--muted);"></span>' +
            '</div>' +
          '</div>' +

          // تأییدیه
          '<div class="dp-step-content" style="margin-top:14px;">' +
            '<div style="padding:14px;background:linear-gradient(135deg,rgba(43,191,171,.12),rgba(94,200,240,.06));border-radius:12px;text-align:center;font-size:14px;font-weight:800;color:var(--emerald-700);">' +
              '«من همین حالا همینم.»' +
            '</div>' +
            '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:6px;">' +
              'این جمله را در دلت تکرار کن. و چند لحظه در همان حس بمان.' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۶ — ماموریت به مغز ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="6">○</button>' +
            '<span class="dp-step-num">۶</span>' +
            '<span class="dp-step-title">ماموریت به مغز</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            'مغزت یک فیلتر توجه داره به نام RAS (سیستم فعال‌سازی شبکه‌ای). ' +
            'این فیلتر هر لحظه میلیون‌ها اطلاعات رو غربال می‌کنه و فقط اون‌هایی رو به آگاهی تو می‌رسونه که با هدف‌های فعلی‌ات هم‌خونی داشته باشن. ' +
            'وقتی به مغزت ماموریت می‌دی، در طول روز خودبه‌خود دنبال نشانه‌های اون ماموریت می‌گرده — حتی وقتی آگاهانه بهش فکر نمی‌کنی.' +
          '</div>' +

          '<div class="dp-step-content">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:10px;">دو ماموریت برای ۲۴ ساعت آینده:</div>' +

            '<div style="padding:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;margin-bottom:10px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                '<span style="font-size:18px;">👁️</span>' +
                '<span style="font-size:12.5px;font-weight:800;">ماموریت چشم</span>' +
              '</div>' +
              '<div style="font-size:11.5px;color:var(--muted);line-height:1.75;margin-bottom:10px;">' +
                'به‌جای غرق شدن در فکرها، حواست به نشانه‌ها باشد. ' +
                'نشانه می‌تواند یک جمله در یک کتاب باشد، یک آدم جدید، یک فرصت کوچک، یا حتی یک ایده‌ی ناگهانی. ' +
                'وقتی یکی دیدی، همان‌جا نگه‌دار و نگاهش کن.' +
              '</div>' +
              '<label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;padding:6px 0;">' +
                '<input type="checkbox" data-ras="see" style="width:16px;height:16px;accent-color:var(--emerald-500);">' +
                '<span>نشانه دیدم</span>' +
              '</label>' +
            '</div>' +

            '<div style="padding:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                '<span style="font-size:18px;">💗</span>' +
                '<span style="font-size:12.5px;font-weight:800;">ماموریت حس</span>' +
              '</div>' +
              '<div style="font-size:11.5px;color:var(--muted);line-height:1.75;margin-bottom:10px;">' +
                'وقتی نشانه را دیدی، چند لحظه حسش کن — همون حسی که داری وقتی به هدفت رسیدی. ' +
                'این حس کوتاه، مسیر تازه را در مغزت قفل می‌کند.' +
              '</div>' +
              '<label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;padding:6px 0;">' +
                '<input type="checkbox" data-ras="feel" style="width:16px;height:16px;accent-color:var(--emerald-500);">' +
                '<span>حسش کردم</span>' +
              '</label>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* موسیقی */
        '<div style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:11px;font-weight:700;margin-bottom:8px;">🎵 موسیقی مدیتیشن (اختیاری)</div>' +
          '<label class="visual-upload-btn" for="meditation-audio-input" style="font-size:11px;padding:6px 12px;">+ افزودن موسیقی</label>' +
          '<input type="file" id="meditation-audio-input" accept="audio/*" style="display:none" onchange="handleMeditationAudio(this.files)">' +
          '<div id="meditation-audio-wrap"></div>' +
        '</div>' +

        /* دکمه نهایی */
        '<button type="button" id="dp-complete-btn" style="width:100%;margin-top:16px;padding:14px;font-size:13.5px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:14px;cursor:pointer;box-shadow:0 8px 20px rgba(15,91,83,.2);">' +
          '✨ ثبت جلسه‌ی امروز' +
        '</button>' +
        '<div id="dp-progress-hint" style="font-size:10.5px;color:var(--muted);text-align:center;margin-top:8px;">' +
          '۰ از ۶ مرحله' +
        '</div>' +

        /* مدار عصبی */
        '<div style="margin-top:18px;padding-top:14px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">🧠 مدار عصبی این تمرین</div>' +
          '<div class="neural-card" id="np-dispenza-mount"></div>' +
        '</div>' +
      '</div>' +

      /* عناصر مخفی برای سازگاری */
      '<textarea id="b-future-text" style="display:none;"></textarea>' +
      '<textarea id="b-visual-note" style="display:none;"></textarea>' +
      '<textarea id="b-tracking" style="display:none;"></textarea>' +
      '<div id="tracking-list" style="display:none;"></div>' +
      '<div id="future-progress-wrap" style="display:none;"></div>';

    topbar.insertAdjacentHTML('afterend', html);

    // استایل‌ها
    if (!document.getElementById('mini-cal-style')){
      var st = document.createElement('style');
      st.id = 'mini-cal-style';
      st.textContent =
        /* تقویم — ۱۰ ستون، سلول‌های بزرگ‌تر */
        '.mini-cal-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;width:100%;}' +
        '.mini-cal-day{aspect-ratio:1;border-radius:6px;background:var(--surface-2);border:1px solid transparent;transition:.15s;}' +
        '.mini-cal-day.done{background:var(--emerald-500);border-color:var(--emerald-700);}' +
        '.mini-cal-day.today{outline:2px solid var(--gold-500);outline-offset:1px;}' +
        '.mini-cal-day.future{opacity:.28;}' +
        '.mini-cal-day.empty{background:transparent;}' +
        /* مراحل */
        '.dp-step{margin-bottom:12px;padding:14px;background:var(--surface);border:1px solid var(--line);border-radius:14px;}' +
        '.dp-step-head{display:flex;align-items:center;gap:10px;}' +
        '.dp-step-num{width:26px;height:26px;border-radius:50%;background:var(--surface-2);color:var(--ink-soft);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none;}' +
        '.dp-step-title{font-size:13px;font-weight:700;color:var(--ink);flex:1;}' +
        '.dp-check-btn{width:28px;height:28px;border-radius:50%;border:2px solid var(--line);background:var(--card);color:var(--muted);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;padding:0;transition:.15s;}' +
        '.dp-check-btn.done{background:var(--emerald-500);border-color:var(--emerald-500);color:#fff;}' +
        '.dp-why-box{margin-top:12px;padding:11px 13px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;font-size:11.5px;color:var(--ink-soft);line-height:1.8;}' +
        '.dp-step-content{margin-top:12px;font-size:12.5px;color:var(--ink-soft);line-height:1.8;}' +
        /* دکمه‌ی جمع‌شونده */
        '.dp-toggle-wrap{margin-top:10px;}' +
        '.dp-toggle-btn{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--card);border:1px solid var(--line);border-radius:10px;color:var(--ink);font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:.15s;}' +
        '.dp-toggle-btn:hover{background:var(--surface-2);}' +
        '.dp-toggle-arrow{transition:transform .2s;font-size:11px;}' +
        '.dp-toggle-btn.open .dp-toggle-arrow{transform:rotate(180deg);}';
      document.head.appendChild(st);
    }
  }

  /* =====================================================================
     رندر متن آینده
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
        display.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:14px 0;font-style:normal;">هنوز متن آینده‌ای ننوشتی.<br><span style="font-size:11px;">روی «✏️ ویرایش» بزن تا شروع کنی.</span></div>';
      }
    }
    if (activeBadge){
      var versions = state.futureTextVersions || [];
      var activeIdx = versions.findIndex(function(x){ return x.id === state.activeFutureVersionId; });
      if (activeIdx === -1) activeBadge.textContent = '—';
      else activeBadge.textContent = 'نسخه ' + toFa(activeIdx + 1);
    }
    if (seeitText){
      if (v && v.text) seeitText.innerHTML = '«' + escapeHtml(v.text) + '»';
      else seeitText.innerHTML = '<span style="color:var(--muted);font-style:normal;font-size:11.5px;">اول متن آینده‌ات را در کارت بالا بنویس.</span>';
    }
    if (archiveCount) archiveCount.textContent = toFa((state.futureTextVersions || []).length);
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
    var startKey = v ? v.startDate : dpTodayKey();
    var startDate = ndKeyToDate(startKey);
    var today = new Date(); today.setHours(0,0,0,0);
    var todayKeyStr = dpTodayKey();
    var html = '';
    for (var d = 0; d < 90; d++){
      var date = new Date(startDate);
      date.setDate(date.getDate() + d);
      var key = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
      var done = !!readSet[key];
      var isToday = key === todayKeyStr;
      var isFuture = date > today;
      var cls = 'mini-cal-day';
      if (done) cls += ' done';
      if (isToday) cls += ' today';
      if (isFuture) cls += ' future';
      html += '<div class="' + cls + '" title="' + key + '"></div>';
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
      box.innerHTML = '<div style="text-align:center;font-size:11.5px;color:var(--muted);padding:10px;">هنوز نسخه‌ای ذخیره نشده.</div>';
      return;
    }
    var html = '<div style="font-size:11px;font-weight:800;margin-bottom:8px;color:var(--ink);">📚 همه‌ی نسخه‌های تو</div>';
    versions.slice().reverse().forEach(function(v, idx){
      var realIdx = versions.length - 1 - idx;
      var isActive = v.id === state.activeFutureVersionId;
      var end = v.endDate || 'اکنون';
      var readCount = (v.readDays || []).length;
      html += '<div style="padding:9px;border-radius:10px;margin-bottom:6px;border:1px solid ' + (isActive ? 'var(--emerald-500)' : 'var(--line)') + ';background:' + (isActive ? 'rgba(43,191,171,.06)' : 'var(--card)') + ';">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span style="font-size:11px;font-weight:800;color:var(--ink);">نسخه ' + toFa(realIdx + 1) + (isActive ? ' • فعال' : '') + '</span>' +
          '<span style="font-size:9.5px;color:var(--muted);">' + toFa(readCount) + ' روز</span>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--muted);margin-bottom:6px;">' + v.startDate + ' تا ' + end + '</div>' +
        '<div style="font-size:11px;color:var(--ink-soft);line-height:1.6;padding:6px 8px;background:var(--surface-2);border-radius:8px;font-style:italic;margin-bottom:6px;">' +
          '«' + escapeHtml(v.text.length > 100 ? v.text.slice(0, 100) + '...' : v.text) + '»' +
        '</div>' +
        (isActive ? '' : '<button type="button" class="btn tiny" data-activate-version="' + v.id + '" style="width:100%;font-size:10.5px;padding:6px;">فعال کردن</button>') +
      '</div>';
    });
    box.innerHTML = html;
  }

  /* =====================================================================
     پیشرفت
     ===================================================================== */
  function dpGetTodaySteps(){
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    var k = dpTodayKey();
    if (!Array.isArray(state.dispenzaDailyProgress[k])) state.dispenzaDailyProgress[k] = [];
    return state.dispenzaDailyProgress[k];
  }

  function dpRenderProgress(){
    var done = dpGetTodaySteps();
    document.querySelectorAll('.dp-check-btn[data-dp-check]').forEach(function(el){
      var step = el.dataset.dpCheck;
      var isDone = done.indexOf(step) !== -1;
      el.textContent = isDone ? '✓' : '○';
      el.classList.toggle('done', isDone);
    });
    var hint = document.getElementById('dp-progress-hint');
    if (hint) hint.textContent = toFa(done.length) + ' از ۶ مرحله';

    var totalDays = Math.min((state.dispenzaReadDays || []).length, 90);
    var countEl = document.getElementById('dp-session-count');
    if (countEl) countEl.textContent = toFa(totalDays * 2) + ' جلسه';

    var v = getActiveVersion();
    var readDays = v && v.readDays ? v.readDays.length : 0;
    var doneCount = Math.min(readDays, 90);
    var left = Math.max(0, 90 - doneCount);
    var numEl = document.getElementById('future-day-num');
    var leftEl = document.getElementById('future-days-left');
    var pbar = document.getElementById('future-progress-bar');
    if (numEl) numEl.textContent = toFa(doneCount);
    if (leftEl) leftEl.textContent = left > 0 ? toFa(left) + ' مانده' : '🎉 تکمیل';
    if (pbar) pbar.style.width = (doneCount / 90 * 100) + '%';

    var em = document.getElementById('dp-emotion-feedback');
    if (em){
      var q = getTodayEmotionQualityFor('dispenza');
      if (q === null) em.textContent = '';
      else if (q >= 500) em.textContent = '🔥 حس پرقدرت';
      else if (q < 200) em.textContent = '⚠️ حس ضعیف';
      else em.textContent = '✓ ثبت شد';
    }

    var todayRec = (state.rasMission && state.rasMission[dpTodayKey()]) || {};
    document.querySelectorAll('input[data-ras]').forEach(function(cb){
      cb.checked = !!todayRec[cb.dataset.ras];
    });
  }

  /* =====================================================================
     تایمر
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
     ویرایش و آرشیو
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
    if (!newText){ if (typeof toast === 'function') toast('متن نمی‌تونه خالی باشه'); return; }
    var v = getActiveVersion();
    if (v && newText === v.text){ closeFutureEditor(); return; }
    if (v) v.endDate = dpTodayKey();
    var newV = { id: 'v_' + Date.now(), text: newText, startDate: dpTodayKey(), endDate: null, readDays: [] };
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
    if (typeof toast === 'function') toast(v ? 'نسخه‌ی جدید ثبت شد 📚' : 'متن آینده‌ات ثبت شد ✨');
  }
  function toggleArchive(){
    ARCHIVE_OPEN = !ARCHIVE_OPEN;
    renderArchiveBox();
  }
  function activateVersion(id){
    var versions = state.futureTextVersions || [];
    var chosen = versions.filter(function(v){ return v.id === id; })[0];
    if (!chosen) return;
    versions.forEach(function(v){ if (v.id !== id && !v.endDate) v.endDate = dpTodayKey(); });
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
     مسیر عصبی
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
    window.renderAllNeuralPathways = function(){ renderOurNeuralPathways(); };
  }
  function wrapRenderBeliefsView(){
    if (typeof window.renderBeliefsView !== 'function') return;
    if (window.renderBeliefsView.__patchedV5) return;
    var original = window.renderBeliefsView;
    window.renderBeliefsView = function(){
      try { original.apply(this, arguments); } catch(e){}
      try { renderFutureText(); } catch(e){}
      try { dpRenderProgress(); } catch(e){}
      try { renderOurNeuralPathways(); } catch(e){}
    };
    window.renderBeliefsView.__patchedV5 = true;
  }

  /* =====================================================================
     رویدادها
     ===================================================================== */
  function wireEvents(){
    document.addEventListener('click', function(e){
      var t = e.target;
      if (!t || !t.closest) return;

      // تیک مرحله
      var checkBtn = t.closest('.dp-check-btn[data-dp-check]');
      if (checkBtn){
        e.stopPropagation();
        var step = checkBtn.dataset.dpCheck;
        var done = dpGetTodaySteps();
        var idx = done.indexOf(step);
        if (idx === -1) done.push(step); else done.splice(idx, 1);
        try { saveState(); } catch(e2){}
        dpRenderProgress();
        return;
      }

      // دکمه‌ی جمع‌شونده
      var toggleBtn = t.closest('.dp-toggle-btn');
      if (toggleBtn){
        var bodyId = toggleBtn.dataset.toggleBox;
        var body = document.getElementById(bodyId);
        if (body){
          var isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          toggleBtn.classList.toggle('open', !isOpen);
        }
        return;
      }

      // تایمر
      if (t.id === 'dp-timer-btn'){ dpStartTimer(); return; }
      if (t.id === 'edit-future-btn'){ openFutureEditor(); return; }
      if (t.id === 'future-save-btn'){ saveFutureText(); return; }
      if (t.id === 'future-cancel-btn'){ closeFutureEditor(); return; }
      if (t.id === 'archive-future-btn'){ toggleArchive(); return; }
      var actBtn = t.closest('[data-activate-version]');
      if (actBtn){ activateVersion(actBtn.dataset.activateVersion); return; }

      // دکمه نهایی
      if (t.id === 'dp-complete-btn'){
        var quality = getTodayEmotionQualityFor('dispenza');
        var done = dpGetTodaySteps();
        var count = done.length;
        var fibers = 1;
        var msg = 'ثبت شد — یک مسیر تازه 🧠';
        if (count === 0){
          fibers = 0;
          msg = 'اول حداقل یک مرحله را تیک بزن';
        } else if (count === 6 && quality !== null){
          if (quality >= 500){ fibers = 2; msg = '🔥 همه مراحل + حس پرقدرت — دو مسیر ساخته شد!'; }
          else if (quality < 200){ fibers = 0; msg = '⚠️ حس ضعیف — دفعه‌ی بعد عمیق‌تر'; }
        }
        var dn = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
        if (dn && fibers > 0){
          for (var i = 0; i < fibers; i++){
            if (typeof neuralAddFiber === 'function') neuralAddFiber(dn, {calendarLinked:false});
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
        if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
        state.dispenzaDailyProgress[dk] = [];
        try { saveState(); } catch(e2){}
        dpRenderProgress();
        renderFutureText();
        renderOurNeuralPathways();
        if (typeof toast === 'function') toast(msg);
      }
    });

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

    document.addEventListener('change', function(e){
      if (!e.target || !e.target.dataset || !e.target.dataset.ras) return;
      var dk = dpTodayKey();
      if (!state.rasMission) state.rasMission = {};
      if (!state.rasMission[dk]) state.rasMission[dk] = {};
      state.rasMission[dk][e.target.dataset.ras] = !!e.target.checked;
      try { saveState(); } catch(e2){}
    });
  }

  function dpRestorePossibilities(){
    if (!state.dispenzaPossibilities) return;
    Object.keys(state.dispenzaPossibilities).forEach(function(k){
      var id = 'dp-possibility-' + k.replace('possibility_','');
      var el = document.getElementById(id);
      if (el) el.value = state.dispenzaPossibilities[k];
    });
  }

  /* =====================================================================
     اجرا
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
