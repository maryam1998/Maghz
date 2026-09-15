/* =====================================================================
   beliefs-patch.js — با موج‌های سینوسی و غبار برای هیچ شدن
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

  /* =====================================================================
     مقداردهی state
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
          id: 'v_' + Date.now(), text: String(state.futureText),
          startDate: state.futureStartDate || dpTodayKey(), endDate: null,
          readDays: (state.futureReadDays || []).slice()
        });
        state.activeFutureVersionId = state.futureTextVersions[0].id;
      }
    }
    if (!state.activeFutureVersionId) {
      var active = state.futureTextVersions.filter(function(v){ return !v.endDate; })[0];
      state.activeFutureVersionId = active ? active.id : null;
    }
    if (!Array.isArray(state.dpSeedArchive)) state.dpSeedArchive = [];
    if (typeof defaultCurrentBelief === 'function'){
      if (!state.currentBelief) state.currentBelief = defaultCurrentBelief();
      if (!Array.isArray(state.currentBelief.visualImages)) state.currentBelief.visualImages = [];
      if (typeof state.currentBelief.visualNote !== 'string') state.currentBelief.visualNote = '';
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
        '<ul><li>اهدافت را روی نقشه می‌بینی و مسیر رسیدن به آن‌ها را ترسیم می‌کنی.</li>' +
        '<li>هر روز شکرگذاری می‌کنی تا ذهنت یاد بگیرد چیزهای خوب زندگی‌ات را ببیند.</li>' +
        '<li>با یک تمرین روزانه بر اساس آموزه‌های جو دیسپنزا، زندگی‌ات را از درون تغییر می‌دهی.</li></ul>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🌌 قلمرو ممکن‌ها چیست؟</h3>' +
        '<p>جو دیسپنزا می‌گوید فراتر از دنیای فیزیکی، میدانی نامرئی از انرژی، اطلاعات و آگاهی وجود دارد که فراتر از مکان و زمان عمل می‌کند. به این میدان، <b>قلمرو ممکن‌ها</b> یا <b>میدان کوانتومی</b> می‌گویند.</p>' +
        '<p>در این قلمرو، همه‌ی احتمالات از قبل به‌صورت «موج» وجود دارند. واقعیت فیزیکی فعلی تو، فقط یکی از بی‌نهایت احتمالی است که در این میدان وجود دارد.</p>' +
        '<p style="background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;"><b>نکته‌ی کلیدی:</b> تو چیز جدیدی «خلق» نمی‌کنی — فقط خودت را با یکی از احتمالاتی که از قبل در میدان وجود دارد، هم‌راستا می‌کنی.</p>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🕳️ «هیچ شدن» یعنی چه؟</h3>' +
        '<p>عبارت «No body, no one, no thing, no where, in no time» یعنی: <b>بدون بدن، بدون شخص، بدون چیز، بدون مکان، در هیچ زمانی</b>. این‌ها نه به معنای فیزیکی، بلکه به معنای <b>رها کردن هویت‌های شرطی‌شده</b> است.</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin:10px 0;">' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">🫀 No body / بی‌بدن</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">من بدنم نیستم. توجه از بدن، دردها و حواس جسمی جدا می‌شود.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">👤 No one / هیچ‌کس</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">من آن شخصیت، اسم، نقش، گذشته و داستان‌هایم نیستم.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">📦 No thing / هیچ‌چیز</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">وابستگی به اشیاء، دارایی‌ها و شرایط بیرونی رها می‌شود.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">📍 No where / هیچ‌جا</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">آگاهی به اینجا و آنجا گره نخورده است.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">⏳ In no time / در هیچ زمانی</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">گذشته و آینده رها می‌شوند و فقط حالِ بی‌زمان می‌ماند.</div></div>' +
        '</div>' +
        '<p style="background:rgba(244,197,66,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #f4c542;"><b>نکته:</b> این «هیچ» منفی نیست؛ مثل صفحه‌ی سفید یا فضاست که همه‌چیز را در خودش جا می‌دهد. این یک تمرین مدیتیشن است، نه باور دائمی.</p>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🔗 پیوند «هیچ شدن» و «درخواست از قلمرو ممکن‌ها»</h3>' +
        '<p>درخواست به معنای التماس از نیروی بیرونی نیست. درخواست واقعی، فرستادن سیگنال مشخص به میدان است — اما فقط وقتی تو «هیچ» شده باشی.</p>' +
        '<p>وقتی «هیچ» می‌شوی، از جای <b>کلیت</b> و <b>فراوانی</b> خلق می‌کنی — خودت را با فرکانس آن واقعیتِ ممکن در میدان هم‌راستا می‌کنی.</p>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🧘 پنج مرحله‌ی عملی</h3>' +
        '<ol style="padding-inline-start:20px;line-height:2;font-size:12.5px;color:var(--text-dim);">' +
          '<li><b>رهاسازی:</b> بدن را عمیقاً آرام می‌کنی تا از حالت «بقا» خارج شوی.</li>' +
          '<li><b>هیچ شدن:</b> توجه را از بدن، محیط و هویت «من» برمی‌داری.</li>' +
          '<li><b>اتصال:</b> در این حالت خالی، آگاهی‌ات را به قلمرو ممکن‌ها وصل می‌کنی.</li>' +
          '<li><b>کاشتن بذر:</b> تصویر واضحی از واقعیت دلخواهت را در ذهن می‌کاری.</li>' +
          '<li><b>احساس فراوانی:</b> احساس آن واقعیت را در بدن ایجاد می‌کنی تا فرکانست هماهنگ شود.</li>' +
        '</ol>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>⚕️ یک نکته‌ی مهم</h3>' +
        '<p>این تمرین‌ها یک «باشگاه ذهن» هستند، نه جایگزین درمان پزشکی.</p>' +
      '</div>';
    modalActions.parentNode.insertBefore(wrap, modalActions);
  }

  /* =====================================================================
     ساخت موج سینوسی نامنظم و منظم
     ===================================================================== */
  var LAYER_WAVE = {
    body:  { baseR: 105, amp: 5.5, freq: 3, phase: 0.0 },
    one:   { baseR: 88,  amp: 4.8, freq: 4, phase: 0.8 },
    thing: { baseR: 72,  amp: 4.0, freq: 5, phase: 1.6 },
    where: { baseR: 56,  amp: 3.2, freq: 6, phase: 2.4 },
    time:  { baseR: 40,  amp: 2.5, freq: 7, phase: 3.2 }
  };
  var PURE_WAVE = { baseR: 24, amp: 1.5, freq: 8, phase: 0 };

  function buildSinePath(baseR, amp, freq, phase){
    var cx = 150, cy = 150, pts = 160, d = '';
    for (var i = 0; i <= pts; i++){
      var theta = (i / pts) * Math.PI * 2;
      var r = baseR + amp * Math.sin(freq * theta + phase);
      var x = cx + r * Math.cos(theta);
      var y = cy + r * Math.sin(theta);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
      if (i < pts) d += ' ';
    }
    return d + ' Z';
  }

  function getDoneNothingLayers(){
    var done = [];
    document.querySelectorAll('.nothing-layer.is-gone').forEach(function(el){
      if (el.dataset.nothing) done.push(el.dataset.nothing);
    });
    return done;
  }

  function rebuildNothingWaves(){
    var done = getDoneNothingLayers();
    Object.keys(LAYER_WAVE).forEach(function(k){
      var p = LAYER_WAVE[k];
      var isDone = done.indexOf(k) !== -1;
      var path = document.getElementById('nw-' + k);
      if (!path) return;
      var amp = isDone ? p.amp * 0.15 : p.amp;
      var freq = isDone ? PURE_WAVE.freq : p.freq;
      var phase = isDone ? PURE_WAVE.phase : p.phase;
      path.setAttribute('d', buildSinePath(p.baseR, amp, freq, phase));
      path.style.opacity = isDone ? 0.25 : 0.75;
    });
    var pure = document.getElementById('nw-pure');
    if (pure){
      pure.setAttribute('d', buildSinePath(PURE_WAVE.baseR, PURE_WAVE.amp, PURE_WAVE.freq, PURE_WAVE.phase));
    }
  }

  /* =====================================================================
     ساخت غبار برای هر لایه
     ===================================================================== */
  function buildNothingDust(){
    Object.keys(LAYER_WAVE).forEach(function(k){
      var group = document.getElementById('dust-' + k);
      if (!group) return;
      var r = LAYER_WAVE[k].baseR;
      var html = '';
      var count = 16;
      for (var i = 0; i < count; i++){
        var theta = Math.random() * Math.PI * 2;
        var dr = (Math.random() - 0.5) * 16;
        var x = 150 + (r + dr) * Math.cos(theta);
        var y = 150 + (r + dr) * Math.sin(theta);
        var size = 0.6 + Math.random() * 1.6;
        var dur = 2.5 + Math.random() * 3.5;
        var delay = Math.random() * 3;
        var baseOp = 0.15 + Math.random() * 0.35;
        html += '<circle class="dust-p" cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + size.toFixed(2) + '" fill="#8b8fa8">' +
          '<animate attributeName="opacity" values="' + (baseOp*0.3).toFixed(2) + ';' + baseOp.toFixed(2) + ';' + (baseOp*0.3).toFixed(2) + '" dur="' + dur.toFixed(2) + 's" repeatCount="indefinite" begin="-' + delay.toFixed(2) + 's"/>' +
          '<animate attributeName="r" values="' + size.toFixed(2) + ';' + (size*1.7).toFixed(2) + ';' + size.toFixed(2) + '" dur="' + (dur*1.2).toFixed(2) + 's" repeatCount="indefinite" begin="-' + delay.toFixed(2) + 's"/>' +
          '</circle>';
      }
      group.innerHTML = html;
    });
  }

  function updateNothingDustVisibility(){
    var done = getDoneNothingLayers();
    Object.keys(LAYER_WAVE).forEach(function(k){
      var group = document.getElementById('dust-' + k);
      if (!group) return;
      var isDone = done.indexOf(k) !== -1;
      group.style.transition = 'opacity 1.2s ease';
      group.style.opacity = isDone ? '0' : '1';
    });
  }

  function refreshNothingVisual(){
    try { rebuildNothingWaves(); } catch(e){}
    try { updateNothingDustVisibility(); } catch(e){}
    var done = getDoneNothingLayers();
    var finalEl = document.getElementById('nothing-final');
    if (finalEl) finalEl.classList.toggle('is-visible', done.length >= 5);
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
      /* یادداشت مفهومی */
      '<div class="belief-flow-card" data-new-card="1" style="background:linear-gradient(135deg,rgba(43,191,171,.08),rgba(94,200,240,.05));border-color:rgba(43,191,171,.3);">' +
        '<div class="bf-head" style="font-size:13.5px;margin-bottom:8px;">🌌 قلمرو ممکن‌ها</div>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">فراتر از دنیای فیزیکی، میدانی نامرئی از انرژی، اطلاعات و آگاهی وجود دارد که فراتر از مکان و زمان عمل می‌کند. به این میدان، <b>قلمرو ممکن‌ها</b> یا <b>میدان کوانتومی</b> می‌گویند.</p>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">در این قلمرو، همه‌ی احتمالات از قبل به‌صورت «موج» وجود دارند. واقعیت فیزیکی فعلی تو، فقط یکی از بی‌نهایت احتمالی است که در این میدان وجود دارد.</p>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0;background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;"><b>نکته‌ی کلیدی:</b> تو در این تمرین‌ها چیز جدیدی «خلق» نمی‌کنی — فقط خودت را با یکی از احتمالاتی که از قبل در میدان وجود دارد، هم‌راستا می‌کنی.</p>' +
      '</div>' +

      '<div class="belief-flow-card" data-new-card="1" style="margin-top:14px;">' +
        '<div class="bf-head" style="font-size:13.5px;margin-bottom:8px;">🕳️ چرا باید «هیچ» شوی؟</div>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">اول باید این‌طور «هیچ» شوی تا از «منِ قدیمی» و از جای «کمبود» به میدان کوانتومی سیگنال نفرستی. در آن سکوت و خالی بودن، به قلمرو ممکن‌ها وصل می‌شوی.</p>' +
        '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0;">وقتی «هیچ» می‌شوی، از جای <b>کلیت</b> و <b>فراوانی</b> خلق می‌کنی — خودت را با فرکانس آن واقعیتِ ممکن در میدان هم‌راستا می‌کنی.</p>' +
      '</div>' +

      '<div class="belief-flow-card" id="dispenza-protocol-card" data-new-card="1" style="margin-top:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div class="bf-head" style="margin:0;">🌌 تمرین روزانه</div>' +
          '<span id="dp-session-count" style="font-size:10.5px;color:var(--muted);">۰ جلسه</span>' +
        '</div>' +
        '<p style="font-size:11px;color:var(--muted);line-height:1.7;margin:0 0 14px;">شش مرحله. هر کدام را جدا تیک بزن.</p>' +

        /* موسیقی */
        '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px dashed var(--line);">' +
          '<div style="font-size:11px;font-weight:700;margin-bottom:8px;">🎵 موسیقی مدیتیشن (اختیاری)</div>' +
          '<label class="visual-upload-btn" for="meditation-audio-input" style="font-size:11px;padding:6px 12px;">+ افزودن موسیقی</label>' +
          '<input type="file" id="meditation-audio-input" accept="audio/*" style="display:none" onchange="handleMeditationAudio(this.files)">' +
          '<div id="meditation-audio-wrap"></div>' +
        '</div>' +

        /* تایمر */
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:12px;padding:8px 12px;margin-bottom:16px;">' +
          '<span style="font-size:11.5px;font-weight:700;">⏱️ زمان تمرین</span>' +
          '<span id="dp-timer-display" style="font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;">۱۵:۰۰</span>' +
          '<button type="button" id="dp-timer-btn" class="btn tiny" style="padding:4px 12px;font-size:11px;">شروع</button>' +
        '</div>' +

        /* مرحله ۱ — رهاسازی */
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

        /* ============ مرحله ۲ — هیچ شدن (با موج + غبار) ============ */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="2">○</button>' +
            '<span class="dp-step-num">۲</span>' +
            '<span class="dp-step-title">هیچ شدن</span>' +
            '<button type="button" id="nothing-sound-toggle" class="nothing-sound-btn" onclick="toggleNothingSound()" style="margin-inline-start:auto;" title="قطع/وصل صدا">🔔</button>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>هیچ شدن (Becoming Nothing):</b> توجه را از بدن، محیط و هویت «من» برمی‌داری و به آگاهی محض اجازه می‌دهی گسترش یابد.</span>' +
            'وقتی خودت را با نام، شغل، بدن، داستان‌های گذشته و نگرانی‌های آینده تعریف می‌کنی، سیگنالی از «گذشته» به میدان می‌فرستی. «هیچ شدن» یعنی رها کردن این هویت‌های شرطی‌شده.' +
          '</div>' +

          '<div class="dp-step-content" style="margin-top:12px;">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--ink);">پنج لایه را یکی‌یکی رها کن — با هر تیک، غبار کمتر و موج‌ها هم‌راستاتر می‌شوند:</div>' +
          '</div>' +

          /* ===== صحنه‌ی هیچ شدن ===== */
          '<div class="nothing-stage" id="nothing-stage">' +
            /* موج‌های سینوسی */
            '<svg class="nothing-waves-svg" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">' +
              '<path class="nw-wave nw-body"  id="nw-body"  data-layer="body"  fill="none" stroke="#8b8fa8" stroke-width="1.1"/>' +
              '<path class="nw-wave nw-one"   id="nw-one"   data-layer="one"   fill="none" stroke="#a0a4b8" stroke-width="1.1"/>' +
              '<path class="nw-wave nw-thing" id="nw-thing" data-layer="thing" fill="none" stroke="#b0b4c8" stroke-width="1.1"/>' +
              '<path class="nw-wave nw-where" id="nw-where" data-layer="where" fill="none" stroke="#c0c4d8" stroke-width="1.1"/>' +
              '<path class="nw-wave nw-time"  id="nw-time"  data-layer="time"  fill="none" stroke="#d0d4e8" stroke-width="1.1"/>' +
              '<path class="nw-pure" id="nw-pure" fill="none" stroke="#f4c542" stroke-width="1.5" opacity="0.85"/>' +
            '</svg>' +

            /* غبار هر لایه */
            '<svg class="nothing-dust-svg" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">' +
              '<g class="dust-group" data-layer="body"  id="dust-body"></g>' +
              '<g class="dust-group" data-layer="one"   id="dust-one"></g>' +
              '<g class="dust-group" data-layer="thing" id="dust-thing"></g>' +
              '<g class="dust-group" data-layer="where" id="dust-where"></g>' +
              '<g class="dust-group" data-layer="time"  id="dust-time"></g>' +
            '</svg>' +

            /* آگاهی خالص — مرکز */
            '<div class="nothing-core" id="nothing-core">' +
              '<div class="nothing-core-ring"></div>' +
              '<div class="nothing-core-dot"></div>' +
              '<span class="nothing-core-label">آگاهی خالص</span>' +
            '</div>' +

            /* برچسب‌های لایه */
            '<div class="nothing-layer" data-nothing="body">بدن</div>' +
            '<div class="nothing-layer" data-nothing="one">هویت</div>' +
            '<div class="nothing-layer" data-nothing="thing">اشیا</div>' +
            '<div class="nothing-layer" data-nothing="where">مکان</div>' +
            '<div class="nothing-layer" data-nothing="time">زمان</div>' +
          '</div>' +

          /* پنج مرحله */
          '<div class="nothing-steps" id="nothing-steps" style="margin:14px auto 0;max-width:340px;">' +
            '<button type="button" class="nothing-step" data-nothing-step="body">' +
              '<span class="nothing-step-num">۱</span>' +
              '<span class="nothing-step-txt"><b>No body</b><br><span style="font-size:10.5px;color:var(--muted);">من بدنم نیستم. توجه از بدن، دردها و حواس جسمی جدا می‌شود.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="one">' +
              '<span class="nothing-step-num">۲</span>' +
              '<span class="nothing-step-txt"><b>No one</b><br><span style="font-size:10.5px;color:var(--muted);">من آن شخصیت، اسم، نقش، گذشته و داستان‌هایم نیستم.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="thing">' +
              '<span class="nothing-step-num">۳</span>' +
              '<span class="nothing-step-txt"><b>No thing</b><br><span style="font-size:10.5px;color:var(--muted);">وابستگی به اشیاء، دارایی‌ها و شرایط بیرونی رها می‌شود.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="where">' +
              '<span class="nothing-step-num">۴</span>' +
              '<span class="nothing-step-txt"><b>No where</b><br><span style="font-size:10.5px;color:var(--muted);">آگاهی به اینجا و آنجا گره نخورده است.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
            '<button type="button" class="nothing-step" data-nothing-step="time">' +
              '<span class="nothing-step-num">۵</span>' +
              '<span class="nothing-step-txt"><b>In no time</b><br><span style="font-size:10.5px;color:var(--muted);">گذشته و آینده رها می‌شوند و فقط حالِ بی‌زمان می‌ماند.</span></span>' +
              '<span class="nothing-step-check">○</span>' +
            '</button>' +
          '</div>' +

          '<div class="nothing-final" id="nothing-final" style="text-align:center;margin-top:12px;"><span class="nothing-final-pulse"></span>Pure consciousness — آگاهی خالص</div>' +

          '<div class="dp-step-content" style="margin-top:14px;padding:10px 12px;background:rgba(244,197,66,.08);border-right:3px solid var(--gold-500);border-radius:8px;">' +
            '<div style="font-size:11px;color:var(--ink-soft);line-height:1.75;">این «هیچ» منفی نیست — مثل صفحه‌ی سفید یا فضاست که همه‌چیز را در خودش جا می‌دهد.</div>' +
          '</div>' +
          '<div style="text-align:center;margin-top:8px;">' +
            '<button type="button" class="nothing-reset" onclick="resetNothingPractice()">↺ شروع دوباره</button>' +
          '</div>' +
        '</div>' +

        /* ============ مرحله ۳ — اتصال به قلمرو ممکن‌ها (با رعد و برق) ============ */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="3">○</button>' +
            '<span class="dp-step-num">۳</span>' +
            '<span class="dp-step-title">اتصال به قلمرو ممکن‌ها</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>اتصال (Connection):</b> در این حالت خالی، آگاهی‌ات را به قلمرو ممکن‌ها وصل می‌کنی.</span>' +
            'درخواست واقعی، فرستادن یک سیگنال مشخص به میدان است — اما این سیگنال فقط وقتی فرستاده می‌شود که تو «هیچ» شده باشی.' +
          '</div>' +

          '<div class="quantum-connect-wrap">' +
            '<svg class="quantum-connect-svg" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">' +
              '<defs>' +
                '<radialGradient id="qcore-grad" cx="50%" cy="50%" r="50%">' +
                  '<stop offset="0%" stop-color="#f4c542" stop-opacity="0.9"/>' +
                  '<stop offset="60%" stop-color="#2bbfab" stop-opacity="0.4"/>' +
                  '<stop offset="100%" stop-color="#2bbfab" stop-opacity="0"/>' +
                '</radialGradient>' +
                '<radialGradient id="qfield-grad" cx="50%" cy="50%" r="50%">' +
                  '<stop offset="0%" stop-color="#5ec8f0" stop-opacity="0"/>' +
                  '<stop offset="70%" stop-color="#5ec8f0" stop-opacity="0.15"/>' +
                  '<stop offset="100%" stop-color="#8f7bf0" stop-opacity="0.35"/>' +
                '</radialGradient>' +
              '</defs>' +

              /* قلمرو ممکن‌ها — سمت چپ */
              '<circle cx="70" cy="100" r="55" fill="url(#qfield-grad)" class="qfield-glow"/>' +
              '<circle cx="70" cy="100" r="38" fill="none" stroke="#8f7bf0" stroke-width="0.8" class="qfield-ring qfield-ring-1"/>' +
              '<circle cx="70" cy="100" r="28" fill="none" stroke="#8f7bf0" stroke-width="0.6" class="qfield-ring qfield-ring-2"/>' +
              '<circle cx="70" cy="100" r="18" fill="none" stroke="#8f7bf0" stroke-width="0.6" class="qfield-ring qfield-ring-3"/>' +

              /* جرقه‌ها */
              '<g class="qsparks">' +
                '<circle class="qspark" cx="40" cy="75" r="1.4" fill="#5ec8f0"/>' +
                '<circle class="qspark" cx="95" cy="80" r="1.2" fill="#a29bff"/>' +
                '<circle class="qspark" cx="55" cy="130" r="1.3" fill="#5ec8f0"/>' +
                '<circle class="qspark" cx="100" cy="125" r="1.1" fill="#a29bff"/>' +
                '<circle class="qspark" cx="35" cy="105" r="1.0" fill="#5ec8f0"/>' +
                '<circle class="qspark" cx="105" cy="100" r="1.5" fill="#8f7bf0"/>' +
                '<circle class="qspark" cx="70" cy="65" r="1.2" fill="#a29bff"/>' +
                '<circle class="qspark" cx="70" cy="140" r="1.3" fill="#5ec8f0"/>' +
              '</g>' +

              /* رعد و برق — خطوط شکسته */
              '<g class="qlightning-group">' +
                '<path class="qbolt qbolt-1" d="M 55 70 L 62 85 L 58 87 L 68 102 L 63 104 L 72 118" fill="none" stroke="#a29bff" stroke-width="1.2" stroke-linejoin="round"/>' +
                '<path class="qbolt qbolt-2" d="M 88 65 L 82 82 L 87 84 L 80 100 L 85 102 L 78 118" fill="none" stroke="#5ec8f0" stroke-width="1.2" stroke-linejoin="round"/>' +
                '<path class="qbolt qbolt-3" d="M 45 95 L 55 100 L 52 104 L 62 110" fill="none" stroke="#8f7bf0" stroke-width="1.0" stroke-linejoin="round"/>' +
                '<path class="qbolt qbolt-4" d="M 92 90 L 84 96 L 88 100 L 78 108" fill="none" stroke="#a29bff" stroke-width="1.0" stroke-linejoin="round"/>' +
                '<path class="qbolt qbolt-5" d="M 65 55 L 70 68 L 66 70 L 74 82" fill="none" stroke="#5ec8f0" stroke-width="1.1" stroke-linejoin="round"/>' +
              '</g>' +

              /* امواج هم‌فرکانس */
              '<path class="qwave qwave-left" d="M 105 100 Q 115 80, 125 100 T 145 100" fill="none" stroke="#8f7bf0" stroke-width="1.4" stroke-linecap="round"/>' +
              '<path class="qwave qwave-right" d="M 195 100 Q 185 120, 175 100 T 155 100" fill="none" stroke="#f4c542" stroke-width="1.4" stroke-linecap="round"/>' +

              /* کاربر — مرکز */
              '<circle cx="150" cy="100" r="26" fill="url(#qcore-grad)" class="qcore-glow"/>' +
              '<circle cx="150" cy="100" r="14" fill="none" stroke="#f4c542" stroke-width="1.5" class="qcore-ring qcore-ring-1"/>' +
              '<circle cx="150" cy="100" r="9" fill="none" stroke="#f4c542" stroke-width="1.2" class="qcore-ring qcore-ring-2"/>' +
              '<circle cx="150" cy="100" r="4" fill="#f4c542" class="qcore-dot"/>' +

              /* پیوند */
              '<path class="qlink" d="M 70 100 Q 110 70, 150 100 Q 190 130, 230 100" fill="none" stroke="url(#qcore-grad)" stroke-width="1.2" stroke-dasharray="4 3"/>' +

              /* پیوند رعد و برق — روی qlink */
              '<path class="qlink-bolt" d="M 100 88 L 108 92 L 105 95 L 115 100" fill="none" stroke="#a29bff" stroke-width="1.1" stroke-linejoin="round"/>' +
              '<path class="qlink-bolt" d="M 175 108 L 185 105 L 182 100 L 192 96" fill="none" stroke="#f4c542" stroke-width="1.1" stroke-linejoin="round"/>' +

              /* قلمرو — سمت راست (آینه) */
              '<circle cx="230" cy="100" r="55" fill="url(#qfield-grad)" class="qfield-glow qfield-glow-right"/>' +
              '<circle cx="230" cy="100" r="38" fill="none" stroke="#f4c542" stroke-width="0.8" class="qfield-ring qfield-ring-r1"/>' +
              '<circle cx="230" cy="100" r="28" fill="none" stroke="#f4c542" stroke-width="0.6" class="qfield-ring qfield-ring-r2"/>' +
              '<circle cx="230" cy="100" r="18" fill="none" stroke="#f4c542" stroke-width="0.6" class="qfield-ring qfield-ring-r3"/>' +

              /* رعد و برق سمت راست */
              '<g class="qlightning-group-right">' +
                '<path class="qbolt qbolt-r1" d="M 245 70 L 238 85 L 242 87 L 232 102 L 237 104 L 228 118" fill="none" stroke="#f4c542" stroke-width="1.2" stroke-linejoin="round"/>' +
                '<path class="qbolt qbolt-r2" d="M 212 65 L 218 82 L 213 84 L 220 100 L 215 102 L 222 118" fill="none" stroke="#5ec8f0" stroke-width="1.2" stroke-linejoin="round"/>' +
                '<path class="qbolt qbolt-r3" d="M 255 95 L 245 100 L 248 104 L 238 110" fill="none" stroke="#f4c542" stroke-width="1.0" stroke-linejoin="round"/>' +
              '</g>' +
            '</svg>' +
            '<div class="quantum-connect-caption">' +
              '<div class="qc-labels">' +
                '<span class="qc-side qc-left">🕳️ آگاهی خالص</span>' +
                '<span class="qc-center">هم‌فرکانسی</span>' +
                '<span class="qc-side qc-right">🌌 قلمرو ممکن‌ها</span>' +
              '</div>' +
              '<div class="qc-desc">وقتی آگاهی‌ات با فرکانس قلمرو ممکن‌ها یکی می‌شود، سیگنالت به میدان می‌رسد — و واقعیت دلخواهت شروع می‌کند به شکل گرفتن.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* مرحله ۴ — انتخاب واقعیت */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="4">○</button>' +
            '<span class="dp-step-num">۴</span>' +
            '<span class="dp-step-title">انتخاب واقعیت</span>' +
            '<button type="button" class="dp-expand-icon" data-toggle-box="dp-possibilities" title="یادداشت بذر امروز">▾</button>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>انتخاب واقعیت:</b> با خواسته‌ات هم‌فرکانس شو و از میان امکان‌های پیش‌رو، آینده‌ای را که می‌خواهی انتخاب کن.</span>' +
            'با جمله‌ی «بسیار خوشحال و سپاسگزارم، حالا که...» شروع کن. طوری بنویس که انگار همین حالا به آن رسیده‌ای.' +
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
            '<button type="button" id="future-register-btn" style="width:100%;padding:12px;font-size:13px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:12px;cursor:pointer;box-shadow:0 6px 16px rgba(15,91,83,.18);margin-bottom:12px;">✅ امروز خواندم — ثبت کن</button>' +
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
            '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">بذری که امروز می‌کاری رو این‌جا بنویس. با «همین حالا...» شروع کن.</div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;">' +
              '<div><label style="font-size:11.5px;display:block;margin-bottom:4px;">بذر اصلی امروز:</label><textarea id="dp-possibility-fear" rows="3" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="همین حالا من..."></textarea></div>' +
              '<div><label style="font-size:11.5px;display:block;margin-bottom:4px;">چطور حسش می‌کنم اگر همین حالا حقیقت داشت؟</label><textarea id="dp-possibility-money" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="حس می‌کنم که..."></textarea></div>' +
              '<div><label style="font-size:11.5px;display:block;margin-bottom:4px;">چه چیزی را رها می‌کنم؟</label><textarea id="dp-possibility-approval" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="رها می‌کنم..."></textarea></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* مرحله ۵ — تصویرسازی */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="5">○</button>' +
            '<span class="dp-step-num">۵</span>' +
            '<span class="dp-step-title">تصویرسازی</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>کاشتن بذر (Seeding):</b> تصویر واضحی از واقعیت دلخواهت را در ذهن می‌کاری — بدون احساس نیاز یا کمبود.</span>' +
            'خودت را در صحنه‌ای ببین که به خواسته‌ات رسیده‌ای؛ هر تعداد عکس که دوست داری اضافه کن.' +
          '</div>' +
          '<div class="dp-step-content">' +
            '<textarea id="seed-text-input" rows="3" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;margin-bottom:10px;" placeholder="توضیح این تصویرسازی (اختیاری)..."></textarea>' +
            '<label class="visual-upload-btn" for="visual-image-input">+ افزودن عکس</label>' +
            '<input type="file" id="visual-image-input" accept="image/*" multiple style="display:none" onchange="handleVisualImages(this.files)">' +
            '<div class="visual-gallery" id="visual-gallery" style="margin-top:10px;"></div>' +
            '<div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line);">' +
              '<button type="button" id="archive-seed-btn" class="btn tiny" style="flex:1;min-width:80px;">📚 آرشیو (<span id="seed-archive-count">۰</span>)</button>' +
            '</div>' +
            '<div id="seed-archive-box" style="display:none;margin-top:10px;padding:10px;background:var(--surface-2);border-radius:12px;max-height:260px;overflow-y:auto;"></div>' +
          '</div>' +
        '</div>' +

        /* مرحله ۶ — احساس فراوانی */
        '<div class="dp-step">' +
          '<div class="dp-step-head">' +
            '<button type="button" class="dp-check-btn" data-dp-check="6">○</button>' +
            '<span class="dp-step-num">۶</span>' +
            '<span class="dp-step-title">احساس فراوانی</span>' +
          '</div>' +
          '<div class="dp-why-box">' +
            '<span class="dp-def-chip">📖 <b>احساس فراوانی (Embodying):</b> احساس آن واقعیت را در بدن خودت ایجاد کن — شادی، سلامتی، آرامش — تا فرکانست هماهنگ شود.</span>' +
            'وقتی خودت رو «کسی که رسیده» می‌بینی، رفتارهایت خودبه‌خود با اون هویت هم‌راستا می‌شن.' +
          '</div>' +
          '<div class="dp-step-content">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">💗 حسِ حالا</div>' +
            '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">حس رسیدن را در بدنت فراخوانی کن. کدام احساس را داری؟</div>' +
            '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
              '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'تمرین روزانه\')">💗 ثبت حس</button>' +
              '<span id="dp-emotion-feedback" style="font-size:11px;color:var(--muted);"></span>' +
            '</div>' +
          '</div>' +
          '<div class="dp-step-content" style="margin-top:14px;">' +
            '<div style="padding:16px;background:linear-gradient(135deg,rgba(43,191,171,.12),rgba(94,200,240,.06));border-radius:14px;text-align:center;">' +
              '<div style="font-size:11px;color:var(--emerald-700);font-weight:700;margin-bottom:6px;letter-spacing:.5px;">تأییدیه‌ی نهایی</div>' +
              '<div style="font-size:15px;font-weight:800;color:var(--emerald-700);line-height:1.8;">«من همین حالا همان کسی هستم که می‌خواستم باشم.<br>همه‌چیز در وجود من کامل است.»</div>' +
            '</div>' +
            '<div style="font-size:11px;color:var(--muted);text-align:center;margin-top:8px;line-height:1.7;">این جمله را در دلت سه بار تکرار کن و چند لحظه در همان حس بمان.</div>' +
          '</div>' +
        '</div>' +

        /* مدار عصبی */
        '<div style="margin-top:18px;padding-top:16px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">🧠 مدار عصبی این تمرین</div>' +
          '<div class="neural-card" id="np-dispenza-mount"></div>' +
        '</div>' +

        /* دکمه نهایی */
        '<button type="button" id="dp-complete-btn" style="width:100%;margin-top:16px;padding:14px;font-size:13.5px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:14px;cursor:pointer;box-shadow:0 8px 20px rgba(15,91,83,.2);">✨ ثبت جلسه‌ی امروز</button>' +
        '<div id="dp-progress-hint" style="font-size:10.5px;color:var(--muted);text-align:center;margin-top:8px;">۰ از ۶ مرحله</div>' +

        /* ماموریت به ذهن */
        '<div class="dp-step dp-bonus-step" style="margin-top:18px;">' +
          '<div class="dp-step-head">' +
            '<span style="font-size:16px;">🎯</span>' +
            '<span class="dp-step-title">ماموریت به ذهن <span style="font-size:10px;font-weight:600;color:var(--muted);">(تمرین اضافه)</span></span>' +
          '</div>' +
          '<div class="dp-why-box">ذهنت هر لحظه هزاران چیز رو فیلتر می‌کنه. وقتی بهش ماموریت بدی، در طول روز خودبه‌خود دنبال نشانه‌های اون ماموریت می‌گرده.</div>' +
          '<div class="dp-step-content">' +
            '<div style="font-size:12px;font-weight:700;margin-bottom:10px;">دو ماموریت برای ۲۴ ساعت آینده:</div>' +
            '<div style="padding:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;margin-bottom:10px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span style="font-size:18px;">👁️</span><span style="font-size:12.5px;font-weight:800;">ماموریت چشم</span></div>' +
              '<div style="font-size:11.5px;color:var(--muted);line-height:1.75;margin-bottom:10px;">به‌جای غرق شدن در فکرها، حواست به نشانه‌ها باشد.</div>' +
              '<label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;padding:6px 0;"><input type="checkbox" data-ras="see" style="width:16px;height:16px;accent-color:var(--emerald-500);"><span>نشانه دیدم</span></label>' +
            '</div>' +
            '<div style="padding:12px;background:var(--card);border:1px solid var(--line);border-radius:12px;">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span style="font-size:18px;">💗</span><span style="font-size:12.5px;font-weight:800;">ماموریت حس</span></div>' +
              '<div style="font-size:11.5px;color:var(--muted);line-height:1.75;margin-bottom:10px;">وقتی نشانه را دیدی، چند لحظه حسش کن.</div>' +
              '<label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;padding:6px 0;"><input type="checkbox" data-ras="feel" style="width:16px;height:16px;accent-color:var(--emerald-500);"><span>حسش کردم</span></label>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<textarea id="b-future-text" style="display:none;"></textarea>' +
      '<textarea id="b-visual-note" style="display:none;"></textarea>' +
      '<textarea id="b-tracking" style="display:none;"></textarea>' +
      '<div id="tracking-list" style="display:none;"></div>' +
      '<div id="future-progress-wrap" style="display:none;"></div>';

    topbar.insertAdjacentHTML('afterend', html);

    if (!document.getElementById('beliefs-patch-style')){
      var st = document.createElement('style');
      st.id = 'beliefs-patch-style';
      st.textContent = getStyles();
      document.head.appendChild(st);
    }

    try { buildNothingDust(); } catch(e){}
    try { rebuildNothingWaves(); } catch(e){}
  }

  /* =====================================================================
     استایل‌ها
     ===================================================================== */
  function getStyles(){
    return '' +
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

      /* دایره تنفس */
      '.breath-wrap{display:flex;flex-direction:column;align-items:center;margin-top:16px;gap:14px;}' +
      '.breath-circle{position:relative;width:172px;height:172px;border-radius:50%;background:radial-gradient(circle, rgba(43,191,171,.10), transparent 72%);display:flex;align-items:center;justify-content:center;transition:transform 4s ease-in-out;will-change:transform;}' +
      '.breath-circle.inhale{transform:scale(1.14);transition-timing-function:ease-out;}' +
      '.breath-circle.exhale{transform:scale(0.90);transition-timing-function:ease-in;}' +
      '.breath-inner{position:relative;text-align:center;z-index:2;}' +
      '.breath-phase{font-size:16px;font-weight:800;color:var(--emerald-700);margin-bottom:4px;}' +
      '.breath-hint{font-size:11px;color:var(--muted);}' +
      '.breath-progress{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);}' +
      '.breath-progress circle{transition:stroke-dashoffset 4s linear;}' +
      '.breath-controls{display:flex;flex-direction:column;align-items:center;gap:6px;}' +

      /* ============== صحنه‌ی هیچ شدن ============== */
      '.nothing-stage{position:relative;width:100%;max-width:300px;height:300px;margin:16px auto 0;}' +
      '.nothing-waves-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;transition:opacity 1.2s ease;}' +
      '.nw-wave{transition:opacity 1.2s ease, stroke-width 1.2s ease;}' +
      '.nw-pure{animation:pureWavePulse 3s ease-in-out infinite;}' +
      '@keyframes pureWavePulse{0%,100%{opacity:0.6;stroke-width:1.3;}50%{opacity:1;stroke-width:1.8;}}' +
      '.nothing-dust-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}' +
      '.dust-p{opacity:0.5;}' +

      /* آگاهی خالص — مرکز */
      '.nothing-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:112px;height:112px;display:flex;align-items:center;justify-content:center;z-index:5;}' +
      '.nothing-core-ring{position:absolute;inset:14px;border-radius:50%;border:1.5px solid var(--emerald-500,#2bbfab);opacity:.55;animation:coreBreathe 4s ease-in-out infinite;}' +
      '.nothing-core-ring::after{content:"";position:absolute;inset:8px;border-radius:50%;border:1px solid var(--emerald-300,#54c9b8);opacity:.55;}' +
      '@keyframes coreBreathe{0%,100%{transform:scale(1);opacity:.55;}50%{transform:scale(1.08);opacity:.9;}}' +
      '.nothing-core-dot{width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #ffffff, var(--emerald-500,#2bbfab));box-shadow:0 0 20px rgba(43,191,171,.7);position:relative;z-index:2;}' +
      '.nothing-core-label{position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);font-size:10.5px;font-weight:700;color:var(--emerald-700,#0f5b53);letter-spacing:.4px;white-space:nowrap;}' +

      /* برچسب‌های لایه */
      '.nothing-layer{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:10.5px;font-weight:700;color:var(--muted);background:rgba(94,200,240,.04);border:1px dashed rgba(94,200,240,.28);pointer-events:none;transition:opacity .9s ease, transform 1.2s cubic-bezier(.5,0,.85,1), filter .9s ease;z-index:3;}' +
      '.nothing-layer[data-nothing="body"]{width:210px;height:210px;}' +
      '.nothing-layer[data-nothing="one"]{width:176px;height:176px;}' +
      '.nothing-layer[data-nothing="thing"]{width:144px;height:144px;}' +
      '.nothing-layer[data-nothing="where"]{width:112px;height:112px;opacity:0.55;}' +
      '.nothing-layer[data-nothing="time"]{width:80px;height:80px;opacity:0.35;}' +
      '.nothing-layer.is-gone{opacity:0;transform:translate(-50%,-50%) scale(1.5);filter:blur(6px);}' +

      /* مراحل پایین */
      '.nothing-steps{display:flex;flex-direction:column;gap:6px;}' +
      '.nothing-step{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid var(--line);background:var(--surface,#f7f6f1);color:var(--ink);font-family:inherit;font-size:12.5px;text-align:right;cursor:pointer;transition:.2s;}' +
      '.nothing-step:active{transform:scale(.99);}' +
      '.nothing-step-num{flex:none;width:22px;height:22px;border-radius:50%;background:var(--emerald-100,#dcf3ee);color:var(--emerald-700,#0f5b53);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;margin-top:2px;}' +
      '.nothing-step-txt{flex:1;line-height:1.5;}' +
      '.nothing-step-txt b{font-weight:800;color:var(--emerald-700,#0f5b53);}' +
      '.nothing-step-check{flex:none;font-size:14px;color:var(--muted);transition:.3s;}' +
      '.nothing-step.is-done{background:var(--emerald-100,#dcf3ee);border-color:var(--emerald-300,#54c9b8);}' +
      '.nothing-step.is-done .nothing-step-num{background:var(--emerald-500,#2bbfab);color:#fff;}' +
      '.nothing-step.is-done .nothing-step-check{color:var(--emerald-700,#0f5b53);font-size:0;}' +
      '.nothing-step.is-done .nothing-step-check::before{content:"✓";font-size:14px;}' +
      '.nothing-final{text-align:center;font-size:13px;font-weight:800;color:var(--emerald-700,#0f5b53);padding:12px 0;opacity:0;transform:scale(.9);transition:opacity .8s ease, transform .8s ease;letter-spacing:.5px;}' +
      '.nothing-final.is-visible{opacity:1;transform:scale(1);}' +
      '.nothing-final-pulse{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--emerald-500,#2bbfab);margin-left:8px;vertical-align:middle;box-shadow:0 0 12px var(--emerald-500,#2bbfab);animation:coreBreathe 2.4s ease-in-out infinite;}' +
      '.nothing-reset{background:none;border:none;cursor:pointer;font-family:inherit;font-size:11.5px;color:var(--muted);text-decoration:underline;}' +
      '.nothing-sound-btn{flex:none;width:32px;height:32px;border-radius:50%;background:var(--surface,#f7f6f1);border:1px solid var(--line);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;}' +

      /* ============== قلمرو ممکن‌ها — بصری با رعد و برق ============== */
      '.quantum-connect-wrap{margin:16px 0 0;padding:14px;background:radial-gradient(ellipse at 50% 50%, rgba(143,123,240,.08), rgba(94,200,240,.02) 70%, transparent);border-radius:16px;border:1px solid rgba(143,123,240,.18);}' +
      '.quantum-connect-svg{width:100%;height:auto;display:block;max-height:220px;}' +

      '.qfield-glow{animation:qfieldPulse 4s ease-in-out infinite;}' +
      '.qfield-glow-right{animation-delay:0.5s;}' +
      '@keyframes qfieldPulse{0%,100%{opacity:0.5;transform:scale(0.98);transform-origin:center;}50%{opacity:0.9;transform:scale(1.03);}}' +

      '.qfield-ring{transform-origin:center;opacity:0.5;}' +
      '.qfield-ring-1{animation:qringPulse 3s ease-in-out infinite;}' +
      '.qfield-ring-2{animation:qringPulse 3s ease-in-out infinite;animation-delay:0.4s;}' +
      '.qfield-ring-3{animation:qringPulse 3s ease-in-out infinite;animation-delay:0.8s;}' +
      '.qfield-ring-r1{animation:qringPulse 3s ease-in-out infinite 0.15s;}' +
      '.qfield-ring-r2{animation:qringPulse 3s ease-in-out infinite 0.55s;}' +
      '.qfield-ring-r3{animation:qringPulse 3s ease-in-out infinite 0.95s;}' +
      '@keyframes qringPulse{0%,100%{opacity:0.3;transform:scale(0.97);}50%{opacity:0.9;transform:scale(1.04);}}' +

      /* جرقه‌های الکتریکی */
      '.qspark{animation:qsparkFlash 2.4s ease-in-out infinite;}' +
      '.qspark:nth-child(1){animation-delay:0s;}' +
      '.qspark:nth-child(2){animation-delay:0.3s;}' +
      '.qspark:nth-child(3){animation-delay:0.6s;}' +
      '.qspark:nth-child(4){animation-delay:0.9s;}' +
      '.qspark:nth-child(5){animation-delay:1.2s;}' +
      '.qspark:nth-child(6){animation-delay:1.5s;}' +
      '.qspark:nth-child(7){animation-delay:1.8s;}' +
      '.qspark:nth-child(8){animation-delay:2.1s;}' +
      '@keyframes qsparkFlash{0%,100%{opacity:0.1;transform:scale(1);}50%{opacity:1;transform:scale(1.5);}}' +

      /* رعد و برق — خطوط شکسته */
      '.qbolt{opacity:0;animation:qboltFlash 2.6s ease-in-out infinite;}' +
      '.qbolt-1{animation-delay:0s;}' +
      '.qbolt-2{animation-delay:0.9s;}' +
      '.qbolt-3{animation-delay:1.6s;}' +
      '.qbolt-4{animation-delay:0.5s;}' +
      '.qbolt-5{animation-delay:2.1s;}' +
      '.qbolt-r1{animation-delay:0.3s;}' +
      '.qbolt-r2{animation-delay:1.3s;}' +
      '.qbolt-r3{animation-delay:2s;}' +
      '@keyframes qboltFlash{0%,100%{opacity:0;}8%{opacity:1;}12%{opacity:0.3;}16%{opacity:1;}24%{opacity:0;}}' +

      /* رعد و برق روی پیوند */
      '.qlink-bolt{opacity:0;animation:qlinkBoltFlash 3s ease-in-out infinite;}' +
      '.qlink-bolt:nth-of-type(1){animation-delay:0.6s;}' +
      '.qlink-bolt:nth-of-type(2){animation-delay:1.8s;}' +
      '@keyframes qlinkBoltFlash{0%,100%{opacity:0;}10%{opacity:1;}15%{opacity:0.2;}20%{opacity:0.9;}30%{opacity:0;}}' +

      /* موج‌های هم‌فرکانس */
      '.qwave{opacity:0.85;animation:qwaveTravel 2.8s ease-in-out infinite;}' +
      '.qwave-left{animation-delay:0s;}' +
      '.qwave-right{animation-delay:1.4s;}' +
      '@keyframes qwaveTravel{0%,100%{opacity:0.3;transform:translateX(0);}50%{opacity:1;transform:translateX(6px);}}' +

      /* کاربر — مرکز */
      '.qcore-glow{animation:qcoreBreathe 2.6s ease-in-out infinite;}' +
      '@keyframes qcoreBreathe{0%,100%{opacity:0.7;transform:scale(0.96);transform-origin:150px 100px;}50%{opacity:1;transform:scale(1.06);}}' +
      '.qcore-ring{transform-origin:150px 100px;}' +
      '.qcore-ring-1{animation:qcoreRing 2.4s ease-in-out infinite;}' +
      '.qcore-ring-2{animation:qcoreRing 2.4s ease-in-out infinite;animation-delay:0.4s;}' +
      '@keyframes qcoreRing{0%,100%{opacity:0.4;transform:scale(0.95);}50%{opacity:1;transform:scale(1.08);}}' +
      '.qcore-dot{animation:qcoreDot 1.8s ease-in-out infinite;}' +
      '@keyframes qcoreDot{0%,100%{r:4;opacity:0.9;}50%{r:5.5;opacity:1;}}' +

      /* پیوند */
      '.qlink{opacity:0.6;animation:qlinkDash 3s linear infinite;}' +
      '@keyframes qlinkDash{to{stroke-dashoffset:-14;}}' +

      /* زیرنویس */
      '.quantum-connect-caption{margin-top:12px;padding-top:10px;border-top:1px dashed rgba(143,123,240,.25);}' +
      '.qc-labels{display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:8px;}' +
      '.qc-side{color:var(--ink);}' +
      '.qc-center{font-size:10.5px;color:var(--emerald-700);background:rgba(43,191,171,.12);padding:3px 10px;border-radius:12px;letter-spacing:.3px;}' +
      '.qc-desc{font-size:11.5px;color:var(--ink-soft);line-height:1.8;text-align:center;}';
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
        '<div style="font-size:11px;color:var(--ink-soft);line-height:1.6;padding:6px 8px;background:var(--surface-2);border-radius:8px;font-style:italic;margin-bottom:6px;">«' + escapeHtml(v.text.length > 100 ? v.text.slice(0, 100) + '...' : v.text) + '»</div>' +
        (isActive ? '' : '<button type="button" class="btn tiny" data-activate-version="' + v.id + '" style="width:100%;font-size:10.5px;padding:6px;">فعال کردن</button>') +
      '</div>';
    });
    box.innerHTML = html;
  }

  /* =====================================================================
     کاشتن بذر — آرشیو
     ===================================================================== */
  var SEED_ARCHIVE_OPEN = false;

  function renderSeedSection(){
    if (!state.currentBelief) return;
    var textInput = document.getElementById('seed-text-input');
    if (textInput && document.activeElement !== textInput){
      textInput.value = state.currentBelief.visualNote || '';
    }
    var archiveCount = document.getElementById('seed-archive-count');
    if (archiveCount) archiveCount.textContent = toFa((state.dpSeedArchive || []).length);
    renderSeedArchiveBox();
  }

  function onSeedTextInput(value){
    if (typeof updateBeliefField === 'function'){
      updateBeliefField('visualNote', value);
    } else if (state.currentBelief) {
      state.currentBelief.visualNote = value;
      try { saveState(); } catch(e){}
    }
  }

  function archiveSeedVersion(){
    var cb = state.currentBelief;
    if (!cb) return;
    var text = (cb.visualNote || '').trim();
    var images = (cb.visualImages || []).slice();
    if (!text && !images.length){
      if (typeof toast === 'function') toast('اول متن یا عکسی اضافه کن');
      return;
    }
    if (!Array.isArray(state.dpSeedArchive)) state.dpSeedArchive = [];
    state.dpSeedArchive.push({ id: 'seed_' + Date.now(), text: text, images: images, date: dpTodayKey() });
    cb.visualNote = '';
    cb.visualImages = [];
    try { saveState(); } catch(e){}
    var textInput = document.getElementById('seed-text-input');
    if (textInput) textInput.value = '';
    if (typeof renderVisualGallery === 'function'){ try { renderVisualGallery(); } catch(e){} }
    renderSeedSection();
    if (typeof toast === 'function') toast('بذر قبلی آرشیو شد — بذر تازه شروع کن 🌱');
  }

  function toggleSeedArchive(){ SEED_ARCHIVE_OPEN = !SEED_ARCHIVE_OPEN; renderSeedArchiveBox(); }

  function restoreSeedFromArchive(id){
    var items = state.dpSeedArchive || [];
    var item = items.filter(function(v){ return v.id === id; })[0];
    var cb = state.currentBelief;
    if (!item || !cb) return;
    cb.visualNote = item.text || '';
    if (!Array.isArray(cb.visualImages)) cb.visualImages = [];
    (item.images || []).forEach(function(img){
      cb.visualImages.push({ id: Date.now() + Math.random(), src: img.src });
    });
    try { saveState(); } catch(e){}
    var textInput = document.getElementById('seed-text-input');
    if (textInput) textInput.value = cb.visualNote;
    if (typeof renderVisualGallery === 'function'){ try { renderVisualGallery(); } catch(e){} }
    renderSeedSection();
    if (typeof toast === 'function') toast('بذر بازگردانی شد ✓');
  }

  function renderSeedArchiveBox(){
    var box = document.getElementById('seed-archive-box');
    if (!box) return;
    if (!SEED_ARCHIVE_OPEN){ box.style.display = 'none'; return; }
    box.style.display = 'block';
    var items = state.dpSeedArchive || [];
    if (!items.length){
      box.innerHTML = '<div style="text-align:center;font-size:11.5px;color:var(--muted);padding:10px;">هنوز بذری آرشیو نشده.</div>';
      return;
    }
    var html = '<div style="font-size:11px;font-weight:800;margin-bottom:8px;color:var(--ink);">📚 بذرهای آرشیو شده</div>';
    items.slice().reverse().forEach(function(v, idx){
      var realIdx = items.length - 1 - idx;
      var imgs = v.images || [];
      html += '<div style="padding:9px;border-radius:10px;margin-bottom:6px;border:1px solid var(--line);background:var(--card);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span style="font-size:11px;font-weight:800;color:var(--ink);">بذر ' + toFa(realIdx + 1) + '</span>' +
          '<span style="font-size:9.5px;color:var(--muted);">' + v.date + ' • ' + toFa(imgs.length) + ' عکس</span>' +
        '</div>' +
        (v.text ? '<div style="font-size:11px;color:var(--ink-soft);line-height:1.6;padding:6px 8px;background:var(--surface-2);border-radius:8px;font-style:italic;margin-bottom:6px;">«' + escapeHtml(v.text.length > 100 ? v.text.slice(0, 100) + '...' : v.text) + '»</div>' : '') +
        (imgs.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' + imgs.slice(0, 6).map(function(img){ return '<img src="' + img.src + '" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--line);">'; }).join('') + '</div>' : '') +
        '<button type="button" class="btn tiny" data-restore-seed="' + v.id + '" style="width:100%;font-size:10.5px;padding:6px;">بازگردانی</button>' +
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
    if (hint) hint.textContent = toFa(done.length) + ' از ۶ مرحله';

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
    document.querySelectorAll('input[data
