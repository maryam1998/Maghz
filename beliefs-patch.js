/* =====================================================================
   beliefs-patch.js — نسخه‌ی نهایی با توضیحات کامل پنج لایه
   ===================================================================== */
(function(){
  'use strict';

  var ARCHIVE_OPEN = false;

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

    if (!Array.isArray(state.dpSeedVersions)) state.dpSeedVersions = [];
    if (!state.dpSeedVersions.length) {
      state.dpSeedVersions.push({
        id: 'seed_' + Date.now(),
        text: '',
        images: [],
        startDate: dpTodayKey(),
        endDate: null
      });
    }
    if (!state.activeSeedVersionId) {
      var activeSeed = state.dpSeedVersions.filter(function(v){ return !v.endDate; })[0];
      state.activeSeedVersionId = activeSeed ? activeSeed.id : state.dpSeedVersions[0].id;
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

  function getActiveSeedVersion(){
    if (!state.activeSeedVersionId) return null;
    return state.dpSeedVersions.filter(function(v){
      return v.id === state.activeSeedVersionId;
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
     راهنما — با توضیحات دقیق پنج لایه
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
          '<li>با یک تمرین روزانه بر اساس آموزه‌های جو دیسپنزا، زندگی‌ات را از درون تغییر می‌دهی.</li>' +
        '</ul>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>🌌 قلمرو ممکن‌ها چیست؟</h3>' +
        '<p>' +
          'جو دیسپنزا می‌گوید فراتر از دنیای فیزیکی، میدانی نامرئی از انرژی، اطلاعات و آگاهی وجود دارد ' +
          'که فراتر از مکان و زمان عمل می‌کند. به این میدان، <b>قلمرو ممکن‌ها</b> یا <b>میدان کوانتومی</b> می‌گویند.' +
        '</p>' +
        '<p>' +
          'در این قلمرو، همه‌ی احتمالات از قبل به‌صورت «موج» وجود دارند — از سلامتی و ثروت تا هر تجربه‌ای که بتوانی تصور کنی. ' +
          'واقعیت فیزیکی فعلی تو، فقط یکی از بی‌نهایت احتمالی است که در این میدان وجود دارد.' +
        '</p>' +
        '<p style="background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;">' +
          '<b>نکته‌ی کلیدی:</b> تو در این تمرین‌ها چیز جدیدی «خلق» نمی‌کنی — فقط خودت را با یکی از احتمالاتی که از قبل در میدان وجود دارد، هم‌راستا می‌کنی.' +
        '</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>🕳️ «هیچ شدن» یعنی چه؟</h3>' +
        '<p>' +
          'عبارت «No body, no one, no thing, no where, in no time» در مدیتیشن‌های جو دیسپنزا یعنی: ' +
          '<b>بدون بدن، بدون شخص، بدون چیز، بدون مکان، در هیچ زمانی</b>.' +
        '</p>' +
        '<p>' +
          'اما این‌ها نه به معنای فیزیکی، بلکه به معنای <b>رها کردن هویت‌های شرطی‌شده</b> است. ' +
          'یعنی تو دیگر خودت را با این چیزها تعریف نمی‌کنی:' +
        '</p>' +

        '<div style="display:flex;flex-direction:column;gap:8px;margin:10px 0;">' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;">' +
            '<div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">🫀 No body / بی‌بدن</div>' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">من بدنم نیستم. توجه از بدن، دردها و حواس جسمی جدا می‌شود.</div>' +
          '</div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;">' +
            '<div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">👤 No one / هیچ‌کس</div>' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">من آن شخصیت، اسم، نقش، گذشته و داستان‌هایم نیستم. «هیچ‌کس» بودن یعنی رها شدن از «منِ» ساخته‌شده.</div>' +
          '</div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;">' +
            '<div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">📦 No thing / هیچ‌چیز</div>' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">من هیچ‌چیز نیستم. وابستگی به اشیاء، دارایی‌ها و شرایط بیرونی رها می‌شود.</div>' +
          '</div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;">' +
            '<div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">📍 No where / هیچ‌جا</div>' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">من در مکان خاصی نیستم. آگاهی به اینجا و آنجا گره نخورده است.</div>' +
          '</div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;">' +
            '<div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">⏳ In no time / در هیچ زمانی</div>' +
            '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">من در زمان نیستم. گذشته و آینده رها می‌شوند و فقط حالِ بی‌زمان می‌ماند.</div>' +
          '</div>' +
        '</div>' +

        '<p style="background:rgba(244,197,66,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #f4c542;margin-top:12px;">' +
          '<b>نکته‌ی مهم:</b> نتیجه‌ی این حالت، تبدیل شدن به <b>آگاهی محض</b> است — یک فضای خالی و بی‌تعریف. ' +
          'این «هیچ» منفی نیست؛ مثل صفحه‌ی سفید یا فضاست که همه‌چیز را در خودش جا می‌دهد.' +
        '</p>' +

        '<p style="margin-top:12px;">' +
          'دیسپنزا می‌گوید اول باید این‌طور «هیچ» شوی تا از «منِ قدیمی» و از جای «کمبود» به میدان کوانتومی سیگنال نفرستی. ' +
          'در آن سکوت و خالی بودن، به قلمرو ممکن‌ها وصل می‌شوی و از جای «کلیت» و «فراوانی» می‌توانی واقعیت دلخواهت را خلق کنی.' +
        '</p>' +

        '<p style="font-size:11.5px;color:var(--muted);margin-top:10px;line-height:1.8;">' +
          '⚡ این یک تمرین مدیتیشن است، نه یک باور دائمی. ' +
          'بعد از تمرین به بدن، هویت و زندگی برمی‌گردی — اما با آگاهی تازه.' +
        '</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>🔗 پیوند «هیچ شدن» و «درخواست از قلمرو ممکن‌ها»</h3>' +
        '<p>' +
          'در این چارچوب، «درخواست» به معنای التماس از یک نیروی بیرونی یا انتظار معجزه نیست. ' +
          'درخواست واقعی، فرستادن یک سیگنال مشخص به میدان است — اما این سیگنال فقط وقتی فرستاده می‌شود ' +
          'که تو «هیچ» شده باشی.' +
        '</p>' +
        '<p>' +
          'وقتی «هیچ» می‌شوی، دیگر از جای «کمبود» یا «نیاز» درخواست نمی‌کنی — ' +
          'از جای <b>کلیت</b> و <b>فراوانی</b> خلق می‌کنی. ' +
          'در واقع، درخواست نمی‌کنی که چیزی به تو داده شود؛ ' +
          'خودت را با فرکانس آن واقعیتِ ممکن در میدان هم‌راستا می‌کنی.' +
        '</p>' +
      '</div>' +

      '<div class="help-section">' +
        '<h3>🧘 پنج مرحله‌ی عملی این فرآیند</h3>' +
        '<ol style="padding-inline-start:20px;line-height:2;font-size:12.5px;color:var(--text-dim);">' +
          '<li><b>رهاسازی (Relaxation):</b> بدن را عمیقاً آرام می‌کنی تا از حالت «بقا» خارج شوی.</li>' +
          '<li><b>هیچ شدن (Becoming Nothing):</b> توجه را از بدن، محیط و هویت «من» برمی‌داری و به آگاهی محض اجازه می‌دهی گسترش یابد.</li>' +
          '<li><b>اتصال (Connection):</b> در این حالت خالی، آگاهی‌ات را به قلمرو ممکن‌ها وصل می‌کنی.</li>' +
          '<li><b>کاشتن بذر (Seeding):</b> در همان حالت هیچ‌بودن، تصویر واضحی از واقعیت دلخواهت را در ذهن می‌کاری — بدون احساس نیاز یا کمبود.</li>' +
          '<li><b>احساس فراوانی (Embodying):</b> احساس آن واقعیت را در بدن خودت ایجاد می‌کنی — شادی، سلامتی، آرامش — تا فرکانست با آن هماهنگ شود.</li>' +
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

    var cards = beliefView.querySelectorAll('.belief-flow-card');
    for (var i = 0; i < cards.length; i++){
      if (cards[i].parentNode) cards[i].parentNode.removeChild(cards[i]);
    }
    ['streak-box','streak-history','help-open-btn'].forEach(function(cls){
      var els = beliefView.querySelectorAll('.' + cls);
      for (var j = 0; j < els.length; j++) els[j].parentNode.removeChild(els[j]);
    });

    var topbar = beliefView.querySelector('.topbar');
    if (!topbar) return;

    var html = '' +
      /* ---------- یادداشت مفهومی ---------- */
      '<div class="belief-flow-card" data-new-card="1" style="background:linear-gradient(135deg,rgba(43,191,171,.08),rgba(94,200,240,.05));border-color:rgba(43,191,171,.3);">' +
        '<div class="bf-head" style="font-size:13.5px;margin-bottom:8px;">🌌 قلمرو ممکن‌ها</div>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">' +
          'جو دیسپنزا می‌گوید فراتر از دنیای فیزیکی، میدانی نامرئی از انرژی، اطلاعات و آگاهی وجود دارد ' +
          'که فراتر از مکان و زمان عمل می‌کند. به این میدان، <b>قلمرو ممکن‌ها</b> یا <b>میدان کوانتومی</b> می‌گویند.' +
        '</p>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">' +
          'در این قلمرو، همه‌ی احتمالات از قبل به‌صورت «موج» وجود دارند — از سلامتی و ثروت تا هر تجربه‌ای که بتوانی تصور کنی. ' +
          'واقعیت فیزیکی فعلی تو، فقط یکی از بی‌نهایت احتمالی است که در این میدان وجود دارد.' +
        '</p>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0;background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;">' +
          '<b>نکته‌ی کلیدی:</b> تو در این تمرین‌ها چیز جدیدی «خلق» نمی‌کنی — فقط خودت را با یکی از احتمالاتی که از قبل در میدان وجود دارد، هم‌راستا می‌کنی.' +
        '</p>' +
      '</div>' +

      /* ---------- چرا باید هیچ شد ---------- */
      '<div class="belief-flow-card" data-new-card="1" style="margin-top:14px;">' +
        '<div class="bf-head" style="font-size:13.5px;margin-bottom:8px;">🕳️ چرا باید «هیچ» شوی؟</div>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">' +
          'اول باید این‌طور «هیچ» شوی تا از «منِ قدیمی» و از جای «کمبود» به میدان کوانتومی سیگنال نفرستی. ' +
          'در آن سکوت و خالی بودن، به قلمرو ممکن‌ها وصل می‌شوی و از جای «کلیت» و «فراوانی» می‌توانی واقعیت دلخواهت را خلق کنی.' +
        '</p>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0;">' +
          'وقتی «هیچ» می‌شوی، دیگر از جای «کمبود» یا «نیاز» درخواست نمی‌کنی — از جای <b>کلیت</b> و <b>فراوانی</b> خلق می‌کنی. ' +
          'در واقع، درخواست نمی‌کنی که چیزی به تو داده شود؛ خودت را با فرکانس آن واقعیتِ ممکن در میدان هم‌راستا می‌کنی.' +
        '</p>' +
      '</div>' +

      '<div class="belief-flow-card" id="dispenza-protocol-card" data-new-card="1" style="margin-top:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div class="bf-head" style="margin:0;">🌌 تمرین روزانه</div>' +
          '<span id="dp-session-count" style="font-size:10.5px;color:var(--muted);">۰ جلسه</span>' +
        '</div>' +
        '<p style="font-size:11px;color:var(--muted);line-height:1.7;margin:0 0 14px;">' +
          'هفت مرحله. هر کدام را جدا تیک بزن.' +
        '</p>' +

        // تایمر
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:12px;padding:8px 12px;margin-bottom:16px;">' +
          '<span style="font-size:11.5px;font-weight:700;">⏱️ زمان تمرین</span>' +
          '<span id="dp-timer-display" style="font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;">۱۵:۰۰</span>' +
          '<button type="button" id="dp-timer-btn" class="btn tiny" style="padding:4px 12px;font-size:11px;">شروع</button>' +
        '</div>' +

        /* ---------- مرحله ۱ — رهاسازی ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="1">○</button>' +
            '<span class="dp-step-num">۱</span>' +
            '<span class="dp-step-title">رهاسازی — آرام شدن</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>رهاسازی (Relaxation):</b> بدنت را عمیقاً آرام کن تا از حالت آماده‌باش و تنش فاصله بگیری.</span>' +
            'وقتی بدن آرام می‌شود، توجه از فشارها و افکار روزمره فاصله می‌گیرد و ذهن برای تمرکز، تجسم و تجربه‌ی درونی آماده‌تر می‌شود.' +
          '</div>' +

          '<div class="breath-wrap">' +
            '<div class="breath-circle" id="breath-circle">' +
              '<div class="breath-inner">' +
                '<div class="breath-phase" id="breath-phase-text">آماده</div>' +
                '<div class="breath-hint" id="breath-hint-text">برای شروع دکمه را بزن</div>' +
              '</div>' +
              '<svg class="breath-progress" viewBox="0 0 100 100">' +
                '<circle cx="50" cy="50" r="46" stroke="rgba(255,255,255,0.1)" stroke-width="3" fill="none"/>' +
                '<circle id="breath-progress-circle" cx="50" cy="50" r="46" stroke="var(--emerald-500)" stroke-width="3" fill="none" stroke-dasharray="289" stroke-dashoffset="289" stroke-linecap="round" transform="rotate(-90 50 50)"/>' +
              '</svg>' +
            '</div>' +
            '<div class="breath-controls">' +
              '<button type="button" id="breath-start-btn" class="btn tiny" style="padding:6px 14px;font-size:11.5px;">▶ شروع تنفس</button>' +
              '<span style="font-size:11px;color:var(--muted);">۴ ثانیه دم • ۷ نگه‌دار • ۸ بازدم</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۲ — هیچ شدن ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="2">○</button>' +
            '<span class="dp-step-num">۲</span>' +
            '<span class="dp-step-title">هیچ شدن</span>' +
            '<button type="button" id="nothing-sound-toggle" class="nothing-sound-btn" onclick="toggleNothingSound()" style="margin-inline-start:auto;" title="قطع/وصل صدا">🔔</button>' +
          '</div>' +

          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>هیچ شدن (Becoming Nothing):</b> توجه را از بدن، محیط و هویت «من» برمی‌داری و به آگاهی محض اجازه می‌دهی گسترش یابد.</span>' +
            'وقتی خودت را با نام، شغل، بدن، داستان‌های گذشته و نگرانی‌های آینده تعریف می‌کنی، ' +
            'سیگنالی از «گذشته» به میدان می‌فرستی — و همان الگوهای تکراری را دریافت می‌کنی. ' +
            '«هیچ شدن» یعنی رها کردن این هویت‌های شرطی‌شده، تا به آگاهی محض تبدیل شوی.' +
          '</div>' +

          // پنج لایه — به صورت تمیز و خیلی خلاصه روی صفحه
          '<div class="dp-step-content" style="margin-top:12px;">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--ink);">پنج لایه را یکی‌یکی رها کن:</div>' +
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

          // پنج مرحله با توضیح کوتاه
          '<div class="nothing-steps" id="nothing-steps" style="margin:14px auto 0;max-width:340px;">' +
            '<button type="button" class="nothing-step" data-nothing-step="body">' +
              '<span class="nothing-step-num">۱</span>' +
              '<span class="nothing-step-txt"><b>No body</b><br><span style="font-size:10.5px;color:var(--muted);">من بدنم نیستم. توجه از بدن، دردها و حواس جسمی جدا می‌شود.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="one">' +
              '<span class="nothing-step-num">۲</span>' +
              '<span class="nothing-step-txt"><b>No one</b><br><span style="font-size:10.5px;color:var(--muted);">من آن شخصیت، اسم، نقش، گذشته و داستان‌هایم نیستم. «هیچ‌کس» بودن یعنی رها شدن از «منِ» ساخته‌شده.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="thing">' +
              '<span class="nothing-step-num">۳</span>' +
              '<span class="nothing-step-txt"><b>No thing</b><br><span style="font-size:10.5px;color:var(--muted);">من هیچ‌چیز نیستم. وابستگی به اشیاء، دارایی‌ها و شرایط بیرونی رها می‌شود.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="where">' +
              '<span class="nothing-step-num">۴</span>' +
              '<span class="nothing-step-txt"><b>No where</b><br><span style="font-size:10.5px;color:var(--muted);">من در مکان خاصی نیستم. آگاهی به اینجا و آنجا گره نخورده است.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="time">' +
              '<span class="nothing-step-num">۵</span>' +
              '<span class="nothing-step-txt"><b>In no time</b><br><span style="font-size:10.5px;color:var(--muted);">من در زمان نیستم. گذشته و آینده رها می‌شوند و فقط حالِ بی‌زمان می‌ماند.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
          '</div>' +

          '<div class="nothing-final" id="nothing-final" style="text-align:center;margin-top:12px;"><span class="nothing-final-pulse"></span>Pure consciousness — آگاهی خالص</div>' +

          '<div class="dp-step-content" style="margin-top:14px;padding:10px 12px;background:rgba(244,197,66,.08);border-right:3px solid var(--gold-500);border-radius:8px;">' +
            '<div style="font-size:11px;color:var(--ink-soft);line-height:1.75;">' +
              'این «هیچ» منفی نیست — مثل صفحه‌ی سفید یا فضاست که همه‌چیز را در خودش جا می‌دهد. ' +
              'این یک تمرین مدیتیشن است، نه یک باور دائمی. بعد از تمرین به بدن، هویت و زندگی برمی‌گردی — اما با آگاهی تازه.' +
            '</div>' +
          '</div>' +

          '<div style="text-align:center;margin-top:8px;">' +
            '<button type="button" class="nothing-reset" onclick="resetNothingPractice()">↺ شروع دوباره</button>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۳ — اتصال به قلمرو ممکن‌ها ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="3">○</button>' +
            '<span class="dp-step-num">۳</span>' +
            '<span class="dp-step-title">اتصال به قلمرو ممکن‌ها (به خداوند معجزه‌ها متصل شو)</span>' +
          '</div>' +

          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>اتصال (Connection):</b> در این حالت خالی، آگاهی‌ات را به قلمرو ممکن‌ها وصل می‌کنی.</span>' +
            'در این چارچوب، «درخواست» به معنای التماس از یک نیروی بیرونی یا انتظار معجزه نیست. ' +
            'درخواست واقعی، فرستادن یک سیگنال مشخص به میدان است — اما این سیگنال فقط وقتی فرستاده می‌شود ' +
            'که تو «هیچ» شده باشی.' +
          '</div>' +

          '<div class="dp-step-content" style="margin-top:12px;">' +
            '<div style="display:flex;flex-direction:column;gap:10px;">' +
              '<div style="padding:10px 12px;background:rgba(94,200,240,.06);border-right:3px solid var(--emerald-300);border-radius:8px;">' +
                '<div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:4px;">۱. پل زدن</div>' +
                '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">' +
                  'در این خالی بودن، آگاهی‌ات را به میدانِ بی‌نهایت امکانات وصل کن. ' +
                  'حس کن که این میدان همه‌جا هست — و تو هم بخشی از آنی.' +
                '</div>' +
              '</div>' +
              '<div style="padding:10px 12px;background:rgba(94,200,240,.06);border-right:3px solid var(--emerald-300);border-radius:8px;">' +
                '<div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:4px;">۲. دیدن از جای کلیت</div>' +
                '<div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">' +
                  'نه از جای «نداشتن» — از جای «کامل بودن». ' +
                  'آن واقعیتی که می‌خواهی، از قبل در این میدان وجود دارد. ' +
                  'خودت را با فرکانس آن هم‌راستا کن.' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۴ — انتخاب واقعیت ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="4">○</button>' +
            '<span class="dp-step-num">۴</span>' +
            '<span class="dp-step-title">انتخاب واقعیت</span>' +
            '<button type="button" class="dp-expand-icon" data-toggle-box="dp-possibilities" title="یادداشت بذر امروز">▾</button>' +
          '</div>' +

          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>انتخاب واقعیت:</b> با خواسته‌ات هم‌فرکانس شو و از میان امکان‌های پیش‌رو، آینده‌ای را که می‌خواهی انتخاب کن.</span>' +
            'با جمله‌ی «بسیار خوشحال و سپاسگزارم، حالا که...» شروع کن. ' +
            'خواسته‌ات را بنویس؛ اما طوری بنویس که انگار همین حالا به آن رسیده‌ای و در حال تجربه کردنش هستی. ' +
            'وقتی هر روز این متن را می‌خوانی، توجهت را به آن آینده و احساسی که می‌خواهی تجربه کنی برمی‌گردانی.' +
          '</div>' +

          '<div class="dp-step-content" style="margin-top:12px;">' +

            '<div id="future-display" style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:10px;min-height:60px;font-size:13px;line-height:1.9;color:var(--ink);white-space:pre-wrap;font-style:italic;"></div>' +

            '<div id="future-editor" style="display:none;margin-bottom:10px;">' +
              '<textarea id="future-editor-input" rows="5" style="width:100%;font-family:inherit;font-size:13px;line-height:1.8;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--card);color:var(--ink);resize:vertical;outline:none;" placeholder="بسیار خوشحال و سپاسگزارم حالا که..."></textarea>' +
              '<div style="display:flex;gap:6px;margin-top:8px;">' +
                '<button type="button" id="future-save-btn" class="btn gold" style="flex:1;font-size:12.5px;padding:10px;">💾 ذخیره</button>' +
                '<button type="button" id="future-cancel-btn" class="btn" style="flex:1;font-size:12.5px;padding:10px;">لغو</button>' +
              '</div>' +
            '</div>' +

            '<div id="future-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
              '<button type="button" id="edit-future-btn" class="btn tiny" style="flex:1;min-width:80px;">✏️ ویرایش</button>' +
              '<button type="button" id="archive-future-btn" class="btn tiny" style="flex:1;min-width:80px;">📚 آرشیو (<span id="archive-count">۰</span>)</button>' +
            '</div>' +

            '<button type="button" id="future-register-btn" style="width:100%;padding:12px;font-size:13px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:12px;cursor:pointer;box-shadow:0 6px 16px rgba(15,91,83,.18);margin-bottom:12px;">' +
              '✅ امروز خواندم — ثبت کن' +
            '</button>' +

            '<div id="future-archive-box" style="display:none;margin-bottom:10px;padding:10px;background:var(--surface-2);border-radius:12px;max-height:260px;overflow-y:auto;"></div>' +

            '<div style="padding-top:12px;border-top:1px dashed var(--line);">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                '<span style="font-size:11.5px;font-weight:700;">📅 پیشرفت روزانه</span>' +
                '<span style="font-size:10.5px;color:var(--muted);"><b id="future-day-num" style="color:var(--ink);">۰</b> از ۹۰</span>' +
              '</div>' +
              '<div class="tb-bar" style="margin:0 0 10px;height:4px;"><div class="tb-bar-fill" id="future-progress-bar" style="width:0%;"></div></div>' +
              '<div id="future-mini-cal" class="mini-cal-grid"></div>' +
            '</div>' +
          '</div>' +

          '<div id="dp-possibilities" class="dp-toggle-body" style="display:none;margin-top:12px;">' +
            '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">' +
              'بذری که امروز می‌کاری رو این‌جا بنویس. با «همین حالا...» شروع کن — نه با «آرزو می‌کنم» یا «کاش».' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;">' +
              '<div>' +
                '<label style="font-size:11.5px;display:block;margin-bottom:4px;">بذر اصلی امروز:</label>' +
                '<textarea id="dp-possibility-fear" rows="3" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="همین حالا من..."></textarea>' +
              '</div>' +
              '<div>' +
                '<label style="font-size:11.5px;display:block;margin-bottom:4px;">چطور حسش می‌کنم اگر همین حالا حقیقت داشت؟</label>' +
                '<textarea id="dp-possibility-money" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="حس می‌کنم که..."></textarea>' +
              '</div>' +
              '<div>' +
                '<label style="font-size:11.5px;display:block;margin-bottom:4px;">چه چیزی را رها می‌کنم؟</label>' +
                '<textarea id="dp-possibility-approval" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="رها می‌کنم..."></textarea>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۵ — کاشتن بذر ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="5">○</button>' +
            '<span class="dp-step-num">۵</span>' +
            '<span class="dp-step-title">کاشتن بذر</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>کاشتن بذر (Seeding):</b> در همان حالت هیچ‌بودن، تصویر واضحی از واقعیت دلخواهت را در ذهن می‌کاری — بدون احساس نیاز یا کمبود.</span>' +
            'فقط فکر کردن کافی نیست — باید حسِ رسیدن رو تجربه کنی. ' +
            'وقتی خودت رو در حالتی که خواستی می‌بینی و حسش می‌کنی، باورت قوی‌تر می‌شه.' +
          '</div>' +

          '<div class="dp-step-content">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">🖼️ تصویرسازی</div>' +
            '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">' +
              'خودت را در صحنه‌ای ببین که به خواسته‌ات رسیده‌ای؛ هر تعداد عکس که دوست داری از آن صحنه اضافه کن — محدودیتی نیست.' +
            '</div>' +
            '<textarea id="seed-text-input" rows="3" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;margin-bottom:10px;" placeholder="توضیح این تصویرسازی (اختیاری)..."></textarea>' +
            '<label class="visual-upload-btn" for="visual-image-input">+ افزودن عکس</label>' +
            '<input type="file" id="visual-image-input" accept="image/*" multiple style="display:none" onchange="handleVisualImages(this.files)">' +
            '<div class="visual-gallery" id="visual-gallery" style="margin-top:10px;"></div>' +
            '<div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line);">' +
              '<button type="button" id="new-seed-btn" class="btn tiny" style="flex:1;min-width:80px;">🌱 بذر جدید (آرشیو کن)</button>' +
              '<button type="button" id="archive-seed-btn" class="btn tiny" style="flex:1;min-width:80px;">📚 آرشیو (<span id="seed-archive-count">۰</span>)</button>' +
            '</div>' +
            '<div id="seed-archive-box" style="display:none;margin-top:10px;padding:10px;background:var(--surface-2);border-radius:12px;max-height:260px;overflow-y:auto;"></div>' +
          '</div>' +
        '</div>' +

        /* ---------- مرحله ۶ — احساس فراوانی ---------- */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="6">○</button>' +
            '<span class="dp-step-num">۶</span>' +
            '<span class="dp-step-title">احساس فراوانی</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>احساس فراوانی (Embodying):</b> احساس آن واقعیت را در بدن خودت ایجاد کن — شادی، سلامتی، آرامش — تا فرکانست با آن هماهنگ شود.</span>' +
            'و وقتی خودت رو «کسی که رسیده» می‌بینی، رفتارهایت خودبه‌خود با اون هویت هم‌راستا می‌شن.' +
          '</div>' +

          '<div class="dp-step-content">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">💗 حسِ حالا</div>' +
            '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">' +
              'حس رسیدن را در بدنت فراخوانی کن. کدام احساس را داری؟' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
              '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'تمرین روزانه\')">💗 ثبت حس</button>' +
              '<span id="dp-emotion-feedback" style="font-size:11px;color:var(--muted);"></span>' +
            '</div>' +
          '</div>' +

          '<div class="dp-step-content" style="margin-top:14px;">' +
            '<div style="padding:16px;background:linear-gradient(135deg,rgba(43,191,171,.12),rgba(94,200,240,.06));border-radius:14px;text-align:center;">' +
              '<div style="font-size:11px;color:var(--emerald-700);font-weight:700;margin-bottom:6px;letter-spacing:.5px;">تأییدیه‌ی نهایی</div>' +
              '<div style="font-size:15px;font-weight:800;color:var(--emerald-700);line-height:1.8;">' +
                '«من همین حالا همان کسی هستم که می‌خواستم باشم.<br>' +
                'همه‌چیز در وجود من کامل است.»' +
              '</div>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7;">' +
              'این جمله را در دلت سه بار تکرار کن و چند لحظه در همان حس بمان.' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* ---------- مدار عصبی ---------- */
        '<div style="margin-top:18px;padding-top:16px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">🧠 مدار عصبی این تمرین</div>' +
          '<div class="neural-card" id="np-dispenza-mount"></div>' +
        '</div>' +

        /* ---------- مرحله ۷ — ماموریت به ذهن ---------- */
        '<div class="dp-step" style="margin-top:18px;">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="7">○</button>' +
            '<span class="dp-step-num">۷</span>' +
            '<span class="dp-step-title">ماموریت به ذهن</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            'ذهنت هر لحظه هزاران چیز رو فیلتر می‌کنه. ' +
            'وقتی بهش ماموریت بدی، در طول روز خودبه‌خود دنبال نشانه‌های اون ماموریت می‌گرده — ' +
            'حتی وقتی آگاهانه بهش فکر نمی‌کنی.' +
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
                'نشانه می‌تواند یک جمله در یک کتاب باشد، یک آدم جدید، یک فرصت کوچک، یا حتی یک ایده‌ی ناگهانی.' +
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
                'وقتی نشانه را دیدی، چند لحظه حسش کن — همون حسی که داری وقتی به هدفت رسیدی.' +
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
          '۰ از ۷ مرحله' +
        '</div>' +
      '</div>' +

      /* عناصر مخفی */
      '<textarea id="b-future-text" style="display:none;"></textarea>' +
      '<textarea id="b-visual-note" style="display:none;"></textarea>' +
      '<textarea id="b-tracking" style="display:none;"></textarea>' +
      '<div id="tracking-list" style="display:none;"></div>' +
      '<div id="future-progress-wrap" style="display:none;"></div>';

    topbar.insertAdjacentHTML('afterend', html);

    if (!document.getElementById('beliefs-patch-style')){
      var st = document.createElement('style');
      st.id = 'beliefs-patch-style';
      st.textContent =
        '.mini-cal-grid{display:grid;grid-template-columns:repeat(15,1fr);gap:3px;max-width:100%;}' +
        '.mini-cal-day{aspect-ratio:1;border-radius:4px;background:var(--surface-2);}' +
        '.mini-cal-day.done{background:var(--emerald-500);}' +
        '.mini-cal-day.today{outline:1.5px solid var(--gold-500);outline-offset:0;}' +
        '.mini-cal-day.future{opacity:.25;}' +
        '.dp-step{margin-bottom:12px;padding:14px;background:var(--surface);border:1px solid var(--line);border-radius:14px;}' +
        '.dp-step-head{display:flex;align-items:center;gap:10px;}' +
        '.dp-step-num{width:26px;height:26px;border-radius:50%;background:var(--surface-2);color:var(--ink-soft);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none;}' +
        '.dp-step-title{font-size:13px;font-weight:700;color:var(--ink);flex:1;}' +
        '.dp-check-btn{width:28px;height:28px;border-radius:50%;border:2px solid var(--line);background:var(--card);color:var(--muted);font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;padding:0;transition:.15s;}' +
        '.dp-check-btn.done{background:var(--emerald-500);border-color:var(--emerald-500);color:#fff;}' +
        '.dp-why-box{margin-top:12px;padding:11px 13px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;font-size:11.5px;color:var(--ink-soft);line-height:1.8;}' +
        '.dp-def-chip{display:block;font-size:11px;font-weight:700;color:var(--emerald-700,#0f5b53);background:rgba(244,197,66,.14);border:1px solid rgba(244,197,66,.4);border-radius:8px;padding:6px 9px;margin-bottom:8px;line-height:1.75;}' +
        '.dp-step-content{margin-top:12px;font-size:12.5px;color:var(--ink-soft);line-height:1.8;}' +
        '.dp-expand-icon{width:28px;height:28px;border-radius:50%;border:1.5px solid var(--line);background:var(--card);color:var(--muted);font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;padding:0;transition:.2s;}' +
        '.dp-expand-icon.open{transform:rotate(180deg);background:var(--emerald-100);color:var(--emerald-700);border-color:var(--emerald-500);}' +
        '.breath-wrap{display:flex;flex-direction:column;align-items:center;margin-top:16px;gap:14px;}' +
        '.breath-circle{position:relative;width:172px;height:172px;border-radius:50%;background:radial-gradient(circle, rgba(43,191,171,.10), transparent 72%);display:flex;align-items:center;justify-content:center;transition:transform 4s ease-in-out;will-change:transform;}' +
        '.breath-circle.inhale{transform:scale(1.14);transition-timing-function:ease-out;}' +
        '.breath-circle.exhale{transform:scale(0.90);transition-timing-function:ease-in;}' +
        '.breath-inner{position:relative;text-align:center;z-index:2;}' +
        '.breath-phase{font-size:16px;font-weight:800;color:var(--emerald-700);margin-bottom:4px;letter-spacing:.3px;transition:opacity .5s ease;}' +
        '.breath-hint{font-size:11px;color:var(--muted);transition:opacity .5s ease;}' +
        '.breath-progress{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);}' +
        '.breath-progress circle{transition:stroke-dashoffset 4s linear;}' +
        '.breath-controls{display:flex;flex-direction:column;align-items:center;gap:6px;}' +
        /* Nothing steps با توضیح دو خطی */
        '.nothing-step{padding:10px 12px;text-align:right;align-items:flex-start;}' +
        '.nothing-step-txt{line-height:1.5;}' +
        '.nothing-step-num{margin-top:2px;}';
      document.head.appendChild(st);
    }
  }

  /* =====================================================================
     رندر متن آینده
     ===================================================================== */
  function renderFutureText(){
    var v = getActiveVersion();
    var display = document.getElementById('future-display');
    var archiveCount = document.getElementById('archive-count');
    if (display){
      if (v && v.text && v.text.trim()){
        display.innerHTML = '«' + escapeHtml(v.text) + '»';
      } else {
        display.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:14px 0;font-style:normal;">هنوز متن خواسته‌ای ننوشتی.<br><span style="font-size:11px;">روی «✏️ ویرایش» بزن تا شروع کنی.</span></div>';
      }
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
     کاشتن بذر — آرشیو متن و تصاویر
     ===================================================================== */
  var SEED_ARCHIVE_OPEN = false;

  function fileToDataURL(file){
    return new Promise(function(resolve, reject){
      var reader = new FileReader();
      reader.onload = function(){ resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderSeedSection(){
    var v = getActiveSeedVersion();
    var textInput = document.getElementById('seed-text-input');
    if (textInput && document.activeElement !== textInput) textInput.value = v ? (v.text || '') : '';
    renderSeedGallery();
    var archiveCount = document.getElementById('seed-archive-count');
    if (archiveCount) archiveCount.textContent = toFa((state.dpSeedVersions || []).length);
    renderSeedArchiveBox();
  }

  function renderSeedGallery(){
    var gallery = document.getElementById('visual-gallery');
    if (!gallery) return;
    var v = getActiveSeedVersion();
    var images = (v && v.images) ? v.images : [];
    if (!images.length){
      gallery.innerHTML = '<div style="font-size:11px;color:var(--muted);text-align:center;padding:8px 0;">هنوز عکسی اضافه نکردی.</div>';
      return;
    }
    var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    images.forEach(function(src, idx){
      html += '<div style="position:relative;width:72px;height:72px;">' +
        '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px;border:1px solid var(--line);">' +
        '<button type="button" data-remove-image="' + idx + '" style="position:absolute;top:-6px;left:-6px;width:20px;height:20px;border-radius:50%;background:#c0392b;color:#fff;border:none;font-size:11px;cursor:pointer;line-height:1;">×</button>' +
      '</div>';
    });
    html += '</div>';
    gallery.innerHTML = html;
  }

  function handleVisualImages(fileList){
    var v = getActiveSeedVersion();
    if (!v) return;
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;
    Promise.all(files.map(fileToDataURL)).then(function(dataUrls){
      if (!Array.isArray(v.images)) v.images = [];
      dataUrls.forEach(function(u){ v.images.push(u); });
      try { saveState(); } catch(e){}
      renderSeedGallery();
      if (typeof toast === 'function') toast('عکس اضافه شد ✓');
    }).catch(function(){
      if (typeof toast === 'function') toast('مشکلی در بارگذاری عکس پیش اومد');
    });
  }
  window.handleVisualImages = handleVisualImages;

  function removeSeedImage(idx){
    var v = getActiveSeedVersion();
    if (!v || !Array.isArray(v.images)) return;
    v.images.splice(idx, 1);
    try { saveState(); } catch(e){}
    renderSeedGallery();
  }

  function saveSeedText(text){
    var v = getActiveSeedVersion();
    if (!v) return;
    v.text = text;
    try { saveState(); } catch(e){}
  }

  function archiveSeedVersion(){
    var v = getActiveSeedVersion();
    if (v && !((v.text || '').trim()) && !(v.images || []).length){
      if (typeof toast === 'function') toast('اول متن یا عکسی اضافه کن');
      return;
    }
    if (v) v.endDate = dpTodayKey();
    var newV = { id: 'seed_' + Date.now(), text: '', images: [], startDate: dpTodayKey(), endDate: null };
    if (!Array.isArray(state.dpSeedVersions)) state.dpSeedVersions = [];
    state.dpSeedVersions.push(newV);
    state.activeSeedVersionId = newV.id;
    try { saveState(); } catch(e){}
    renderSeedSection();
    if (typeof toast === 'function') toast('بذر قبلی آرشیو شد — بذر تازه شروع کن 🌱');
  }

  function toggleSeedArchive(){ SEED_ARCHIVE_OPEN = !SEED_ARCHIVE_OPEN; renderSeedArchiveBox(); }

  function activateSeedVersion(id){
    var versions = state.dpSeedVersions || [];
    var chosen = versions.filter(function(v){ return v.id === id; })[0];
    if (!chosen) return;
    versions.forEach(function(v){ if (v.id !== id && !v.endDate) v.endDate = dpTodayKey(); });
    chosen.endDate = null;
    state.activeSeedVersionId = chosen.id;
    try { saveState(); } catch(e){}
    renderSeedSection();
    if (typeof toast === 'function') toast('این بذر فعال شد ✓');
  }

  function renderSeedArchiveBox(){
    var box = document.getElementById('seed-archive-box');
    if (!box) return;
    if (!SEED_ARCHIVE_OPEN){ box.style.display = 'none'; return; }
    box.style.display = 'block';
    var versions = state.dpSeedVersions || [];
    if (!versions.length){
      box.innerHTML = '<div style="text-align:center;font-size:11.5px;color:var(--muted);padding:10px;">هنوز بذری ذخیره نشده.</div>';
      return;
    }
    var html = '<div style="font-size:11px;font-weight:800;margin-bottom:8px;color:var(--ink);">📚 همه‌ی بذرهای تو</div>';
    versions.slice().reverse().forEach(function(v, idx){
      var realIdx = versions.length - 1 - idx;
      var isActive = v.id === state.activeSeedVersionId;
      var end = v.endDate || 'اکنون';
      var imgs = v.images || [];
      html += '<div style="padding:9px;border-radius:10px;margin-bottom:6px;border:1px solid ' + (isActive ? 'var(--emerald-500)' : 'var(--line)') + ';background:' + (isActive ? 'rgba(43,191,171,.06)' : 'var(--card)') + ';">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span style="font-size:11px;font-weight:800;color:var(--ink);">بذر ' + toFa(realIdx + 1) + (isActive ? ' • فعال' : '') + '</span>' +
          '<span style="font-size:9.5px;color:var(--muted);">' + toFa(imgs.length) + ' عکس</span>' +
        '</div>' +
        '<div style="font-size:10px;color:var(--muted);margin-bottom:6px;">' + v.startDate + ' تا ' + end + '</div>' +
        (v.text ? '<div style="font-size:11px;color:var(--ink-soft);line-height:1.6;padding:6px 8px;background:var(--surface-2);border-radius:8px;font-style:italic;margin-bottom:6px;">«' + escapeHtml(v.text.length > 100 ? v.text.slice(0, 100) + '...' : v.text) + '»</div>' : '') +
        (imgs.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' + imgs.slice(0, 6).map(function(src){ return '<img src="' + src + '" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--line);">'; }).join('') + '</div>' : '') +
        (isActive ? '' : '<button type="button" class="btn tiny" data-activate-seed="' + v.id + '" style="width:100%;font-size:10.5px;padding:6px;">فعال کردن</button>') +
      '</div>';
    });
    box.innerHTML = html;
  }
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
    if (hint) hint.textContent = toFa(done.length) + ' از ۷ مرحله';

    var totalDays = Math.min((state.dispenzaReadDays || []).length, 90);
    var countEl = document.getElementById('dp-session-count');
    if (countEl) countEl.textContent = toFa(totalDays * 2) + ' جلسه';

    var v = getActiveVersion();
    var readDays = v && v.readDays ? v.readDays.length : 0;
    var doneCount = Math.min(readDays, 90);
    var numEl = document.getElementById('future-day-num');
    var pbar = document.getElementById('future-progress-bar');
    if (numEl) numEl.textContent = toFa(doneCount);
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
     دایره تنفس
     ===================================================================== */
  var breathTimer = null;
  var breathPhase = 'idle';

  // به‌جای شمارش معکوس عددی، هر فاز فقط یک‌بار در ابتدایش UI را تنظیم می‌کند
  // و انیمیشن (اندازه‌ی دایره + حلقه‌ی پیشرفت) به آرامی و پیوسته در طول کل مدت آن فاز اجرا می‌شود.
  function setBreathUI(phase, seconds){
    var circle = document.getElementById('breath-circle');
    var phaseEl = document.getElementById('breath-phase-text');
    var hintEl = document.getElementById('breath-hint-text');
    var prog = document.getElementById('breath-progress-circle');
    if (!circle || !phaseEl || !hintEl || !prog) return;
    circle.classList.remove('inhale', 'exhale');

    var labels = { idle:'آماده', inhale:'دم', hold:'نگه‌دار', exhale:'بازدم' };
    var hints  = { idle:'برای شروع دکمه را بزن', inhale:'به‌آرامی نفس بکش', hold:'نفس را نگه‌ دار', exhale:'به‌آرامی رها کن' };
    phaseEl.textContent = labels[phase] || '';
    hintEl.textContent = hints[phase] || '';

    var dur = (phase === 'idle') ? .6 : seconds;
    circle.style.transitionDuration = dur + 's';
    prog.style.transitionDuration = dur + 's';

    if (phase === 'idle'){
      prog.style.strokeDashoffset = 289;
      return;
    }
    if (phase === 'inhale'){
      circle.classList.add('inhale');
      prog.style.strokeDashoffset = 0;       // حلقه در طول ۴ ثانیه‌ی دم، به‌آرامی کامل می‌شود
    } else if (phase === 'hold'){
      prog.style.strokeDashoffset = 0;       // حلقه کامل و دایره در همان اندازه‌ی دم می‌ماند
    } else if (phase === 'exhale'){
      circle.classList.add('exhale');
      prog.style.strokeDashoffset = 289;     // حلقه در طول ۸ ثانیه‌ی بازدم، به‌آرامی خالی می‌شود
    }
  }

  function runBreathCycle(){
    breathPhase = 'inhale';
    setBreathUI('inhale', 4);
    breathTimer = setTimeout(function(){
      breathPhase = 'hold';
      setBreathUI('hold', 7);
      breathTimer = setTimeout(function(){
        breathPhase = 'exhale';
        setBreathUI('exhale', 8);
        breathTimer = setTimeout(function(){
          runBreathCycle();
        }, 8000);
      }, 7000);
    }, 4000);
  }

  function startBreathing(){
    var btn = document.getElementById('breath-start-btn');
    if (breathTimer){
      clearTimeout(breathTimer); breathTimer = null;
      breathPhase = 'idle'; setBreathUI('idle', 0);
      if (btn) btn.textContent = '▶ شروع تنفس';
      return;
    }
    if (btn) btn.textContent = '⏸ توقف تنفس';
    runBreathCycle();
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
    if (typeof toast === 'function') toast(v ? 'نسخه‌ی جدید ثبت شد 📚' : 'متن خواسته‌ات ثبت شد ✨');
  }
  function toggleArchive(){ ARCHIVE_OPEN = !ARCHIVE_OPEN; renderArchiveBox(); }
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
    renderFutureText(); dpRenderProgress();
    if (typeof toast === 'function') toast('نسخه فعال شد ✓');
  }

  function registerTodayRead(){
    var dk = dpTodayKey();
    var v = getActiveVersion();
    if (!v || !v.text){ if (typeof toast === 'function') toast('اول متن خواسته‌ات را بنویس'); return; }
    if (!Array.isArray(v.readDays)) v.readDays = [];
    if (v.readDays.indexOf(dk) === -1) v.readDays.push(dk);
    if (!state.futureReadDays) state.futureReadDays = [];
    if (state.futureReadDays.indexOf(dk) === -1) state.futureReadDays.push(dk);
    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (state.dispenzaReadDays.indexOf(dk) === -1) state.dispenzaReadDays.push(dk);
    var dn = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
    if (dn && typeof neuralAddFiber === 'function') neuralAddFiber(dn, {calendarLinked:false});
    try { saveState(); } catch(e){}
    renderFutureText(); dpRenderProgress(); renderOurNeuralPathways();
    if (typeof toast === 'function') toast('✓ امروز ثبت شد — یک مسیر عصبی تازه ساخت شد');
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
    if (window.renderBeliefsView.__patchedV9) return;
    var original = window.renderBeliefsView;
    window.renderBeliefsView = function(){
      try { original.apply(this, arguments); } catch(e){}
      try { renderFutureText(); } catch(e){}
      try { renderSeedSection(); } catch(e){}
      try { dpRenderProgress(); } catch(e){}
      try { renderOurNeuralPathways(); } catch(e){}
    };
    window.renderBeliefsView.__patchedV9 = true;
  }

  /* =====================================================================
     رویدادها
     ===================================================================== */
  function wireEvents(){
    document.addEventListener('click', function(e){
      var t = e.target;
      if (!t || !t.closest) return;

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

      var expandIcon = t.closest('.dp-expand-icon');
      if (expandIcon){
        var bodyId = expandIcon.dataset.toggleBox;
        var body = document.getElementById(bodyId);
        if (body){
          var isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          expandIcon.classList.toggle('open', !isOpen);
        }
        return;
      }

      if (t.id === 'breath-start-btn'){ startBreathing(); return; }
      if (t.id === 'dp-timer-btn'){ dpStartTimer(); return; }
      if (t.id === 'edit-future-btn'){ openFutureEditor(); return; }
      if (t.id === 'future-save-btn'){ saveFutureText(); return; }
      if (t.id === 'future-cancel-btn'){ closeFutureEditor(); return; }
      if (t.id === 'archive-future-btn'){ toggleArchive(); return; }
      if (t.id === 'future-register-btn'){ registerTodayRead(); return; }
      var actBtn = t.closest('[data-activate-version]');
      if (actBtn){ activateVersion(actBtn.dataset.activateVersion); return; }

      if (t.id === 'new-seed-btn'){ archiveSeedVersion(); return; }
      if (t.id === 'archive-seed-btn'){ toggleSeedArchive(); return; }
      var actSeedBtn = t.closest('[data-activate-seed]');
      if (actSeedBtn){ activateSeedVersion(actSeedBtn.dataset.activateSeed); return; }
      var removeImgBtn = t.closest('[data-remove-image]');
      if (removeImgBtn){ removeSeedImage(parseInt(removeImgBtn.dataset.removeImage, 10)); return; }

      if (t.id === 'dp-complete-btn'){
        var quality = getTodayEmotionQualityFor('dispenza');
        var done = dpGetTodaySteps();
        var count = done.length;
        var fibers = 1;
        var msg = 'ثبت شد — یک مسیر تازه 🧠';
        if (count === 0){ fibers = 0; msg = 'اول حداقل یک مرحله را تیک بزن'; }
        else if (count === 7 && quality !== null){
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
        dpRenderProgress(); renderFutureText(); renderOurNeuralPathways();
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
      if (id === 'seed-text-input'){
        saveSeedText(e.target.value);
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
    try { renderSeedSection(); } catch(e){}
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
