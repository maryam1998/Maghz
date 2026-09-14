/* =====================================================================
   beliefs-patch.js
   تمام تغییرات تب باورها + پروتکل ۹۰ روزه‌ی دیسپنزا
   فقط یک بار به index.html اضافه می‌شود:
     <script src="beliefs-patch.js"></script>
   ===================================================================== */
(function(){
  'use strict';

  // ============ ۱. مقداردهی اولیه state ============
  function initState(){
    if (typeof state === 'undefined' || !state) return false;
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (!state.dispenzaPossibilities) state.dispenzaPossibilities = {};
    if (!state.practiceEmotions) state.practiceEmotions = {};
    if (typeof saveState === 'function') { try { saveState(); } catch(e){} }
    return true;
  }

  // ============ ۲. توابع پروتکل ============
  function dpTodayKey(){
    if (typeof dayKeyFromDate === 'function') return dayKeyFromDate(new Date());
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
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
        : '🔒 امروز انجام دادم (اول ۶ مرحله را کامل کن)';
    }
    var totalDays = Math.min((state.dispenzaReadDays || []).length, 90);
    var dayNum = document.getElementById('dp-day-num');
    if (dayNum) dayNum.textContent = (totalDays * 2).toLocaleString('fa-IR');
    var bar = document.getElementById('dp-90day-bar');
    if (bar) bar.style.width = (totalDays/90*100) + '%';
    var phaseLbl = document.getElementById('dp-phase-label');
    if (phaseLbl){
      if (totalDays < 30) phaseLbl.textContent = 'فاز ۱ — تثبیت';
      else if (totalDays < 60) phaseLbl.textContent = 'فاز ۲ — یکپارچگی';
      else phaseLbl.textContent = 'فاز ۳ — قفل هویت';
    }
  }

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

  function dpRestorePossibilities(){
    if (!state.dispenzaPossibilities) return;
    Object.keys(state.dispenzaPossibilities).forEach(function(k){
      var id = 'dp-possibility-' + k.replace('possibility_','');
      var el = document.getElementById(id);
      if (el) el.value = state.dispenzaPossibilities[k];
    });
  }

  // ============ ۳. تزریق بخش راهنما ============
  function injectHelpSection(){
    var helpOverlay = document.getElementById('help-modal-overlay');
    if (!helpOverlay) return;
    if (helpOverlay.querySelector('[data-our-help="desire"]')) return; // یک بار بس
    var modalActions = helpOverlay.querySelector('.modal-actions');
    if (!modalActions) return;
    var section = document.createElement('div');
    section.className = 'help-section';
    section.setAttribute('data-our-help', 'desire');
    section.innerHTML =
      '<h3>🌌 خواستن (Desire) vs گشودن (Openness)</h3>' +
      '<p>یک اشتباه رایج در تمرین تجسم این است که فکر می‌کنیم باید «آرزو» کنیم. اما آرزو از جای <b>کمبود</b> می‌آید و بدن را در حالت بقا نگه می‌دارد. درست این است که از جای <b>کامل‌بودن</b> بپرسیم: «چه امکانی ممکن است؟»</p>' +
      '<ul>' +
      '<li><b>خواستن:</b> «من این را ندارم، می‌خواهمش» — موج بتا، هورمون استرس، بدن در بقا.</li>' +
      '<li><b>گشودن:</b> «من این هستم، پس چه چیزی ممکن است؟» — موج آلفا/تتا، هورمون ترمیم، بدن در خلق.</li>' +
      '</ul>' +
      '<p>وقتی به <b>Nothing</b> می‌رسی — یعنی از بدن، هویت، اشیا، مکان و زمان خالی می‌شوی — از حالت کمبود خارج شده‌ای. در آن حالت دیگر نمی‌توانی «خواسته» داشته باشی، چون خواستن یعنی هنوز به آن نرسیده‌ای. به‌جایش یک <b>سوال</b> می‌پرسی. سوال، ذهن را باز می‌کند؛ آرزو، مغز را در همان مدار قدیمی نگه می‌دارد.</p>' +
      '<p style="background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;"><b>نکته‌ی کلیدی:</b> در مرحله‌ی «امکان جدید»، از جای خلأ سوال می‌کنی، نه از جای آرزو. جواب‌ها یک امکان‌اند، نه یک خواسته.</p>';
    modalActions.parentNode.insertBefore(section, modalActions);
  }

  // ============ ۴. بازسازی تب باورها ============
  function rebuildBeliefsView(){
    var beliefView = document.getElementById('view-beliefs');
    if (!beliefView) return;
    if (beliefView.querySelector('#dispenza-protocol-card')) return; // یک بار بس

    // حذف سه کارت قدیمی
    var futureCard = document.getElementById('b-future-text')
      ? document.getElementById('b-future-text').closest('.belief-flow-card') : null;
    var dispenzaCard = beliefView.querySelector('.dispenza-card');
    var visualCard = document.getElementById('b-visual-note')
      ? document.getElementById('b-visual-note').closest('.belief-flow-card') : null;
    [futureCard, dispenzaCard, visualCard].forEach(function(c){
      if (c && c.parentNode) c.parentNode.removeChild(c);
    });

    var topbar = beliefView.querySelector('.topbar');
    if (!topbar) return;

    var html = '' +
      // یادداشت کوتاه
      '<div class="belief-flow-card" style="background:linear-gradient(135deg,rgba(43,191,171,.08),rgba(94,200,240,.05));border-color:rgba(43,191,171,.3);">' +
        '<div class="bf-head" style="font-size:13.5px;">💡 یک نکته که همه‌چیز را عوض می‌کند</div>' +
        '<p class="bf-desc" style="margin:0;font-size:12.5px;line-height:1.9;">از جای <b>کمبود</b> نخواه. از جای <b>کامل‌بودن</b> بپرس: <b>«چه امکانی ممکن است؟»</b> خواستن یعنی «ندارم»؛ گشودن یعنی «هستم». بدن تو این تفاوت را حس می‌کند — و روی همون پاسخ می‌سازد.</p>' +
      '</div>' +

      // کارت پروتکل
      '<div class="belief-flow-card dispenza-card" id="dispenza-protocol-card">' +
        '<div class="bf-head" style="font-size:15px;">🌌 پروتکل ۹۰ روزه‌ی دیسپنزا</div>' +

        // نوار پیشرفت
        '<div style="margin-bottom:14px;">' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px;">' +
            '<span>جلسه‌ی <b id="dp-day-num">۰</b> از ۱۸۰</span>' +
            '<span id="dp-phase-label">فاز ۱ — تثبیت</span>' +
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
          '<div class="dp-step-head"><span class="dp-step-num">۱</span><span class="dp-step-title" style="flex:1;">آماده‌سازی — بدن و قلب</span><span class="dp-check" data-dp-check="1" style="font-size:18px;color:var(--muted);">○</span></div>' +
          '<p class="bf-desc" style="margin-right:36px;">سه نفس ۴-۷-۸ بکش (۴ ثانیه دم، ۷ ثانیه نگه‌دار، ۸ ثانیه بازدم). سپس یک شکرگذاری قلبی بگو — چیزی که همین حالا برایش سپاسگزاری. این ذهن را از بتا به آلفا می‌آورد.</p>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="1" style="margin-right:36px;margin-top:8px;">✓ این مرحله را انجام دادم</button>' +
        '</div>' +

        // مرحله ۲ — Nothing
        '<div class="dp-step">' +
          '<div class="dp-step-head"><span class="dp-step-num">۲</span><span class="dp-step-title" style="flex:1;">Nothing — پنج رهاسازی</span><span class="dp-check" data-dp-check="2" style="font-size:18px;color:var(--muted);">○</span><button type="button" id="nothing-sound-toggle" class="nothing-sound-btn" onclick="toggleNothingSound()" title="قطع/وصل صدای تمرین">🔔</button></div>' +
          '<p class="bf-desc" style="margin-right:36px;">توجه را از بدن، هویت، اشیا، مکان و زمان بردار — یکی‌یکی، نه یک‌جا. روی هر لایه ضربه بزن.</p>' +
          '<div class="nothing-stage" id="nothing-stage">' +
            '<div class="nothing-core" id="nothing-core"><div class="nothing-core-ring"></div><div class="nothing-core-dot"></div><span class="nothing-core-label">آگاهی خالص</span></div>' +
            '<div class="nothing-layer" data-nothing="body">بدن</div>' +
            '<div class="nothing-layer" data-nothing="one">هویت</div>' +
            '<div class="nothing-layer" data-nothing="thing">اشیا</div>' +
            '<div class="nothing-layer" data-nothing="where">مکان</div>' +
            '<div class="nothing-layer" data-nothing="time">زمان</div>' +
          '</div>' +
          '<div class="nothing-steps" id="nothing-steps">' +
            '<button type="button" class="nothing-step" data-nothing-step="body"><span class="nothing-step-num">۱</span><span class="nothing-step-txt"><b>No body</b> — از توجه به بدن فاصله بگیر</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="one"><span class="nothing-step-num">۲</span><span class="nothing-step-txt"><b>No one</b> — از هویت و نقش‌ها فاصله بگیر</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="thing"><span class="nothing-step-num">۳</span><span class="nothing-step-txt"><b>No thing</b> — از اشیا و دنیای مادی فاصله بگیر</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="where"><span class="nothing-step-num">۴</span><span class="nothing-step-txt"><b>No where</b> — از مکان فاصله بگیر</span><span class="nothing-step-check">○</span></button>' +
            '<button type="button" class="nothing-step" data-nothing-step="time"><span class="nothing-step-num">۵</span><span class="nothing-step-txt"><b>No time</b> — از گذشته و آینده‌ی خطی فاصله بگیر</span><span class="nothing-step-check">○</span></button>' +
          '</div>' +
          '<div class="nothing-final" id="nothing-final"><span class="nothing-final-pulse"></span>Pure consciousness / awareness</div>' +
          '<p class="nothing-sound-hint">🎧 هر رهاسازی یک زنگ صعودی دارد — از ۳۹۶ تا ۸۵۲ هرتز. پایان با گانگ ۱۳۶ هرتز (اُم).</p>' +
          '<button type="button" class="nothing-reset" onclick="resetNothingPractice()">↺ شروع دوباره‌ی این تمرین</button>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="2" style="margin-right:36px;margin-top:10px;">✓ هر پنج مرحله را رها کردم</button>' +
        '</div>' +

        // مرحله ۳ — امکان جدید
        '<div class="dp-step">' +
          '<div class="dp-step-head"><span class="dp-step-num">۳</span><span class="dp-step-title" style="flex:1;">امکان جدید — سوال، نه آرزو</span><span class="dp-check" data-dp-check="3" style="font-size:18px;color:var(--muted);">○</span></div>' +
          '<p class="bf-desc" style="margin-right:36px;">حالا که از کمبود خالی شدی، از جای کامل‌بودن بپرس. جواب هر سوال یک <b>امکان</b> است، نه یک خواسته.</p>' +
          '<div class="b-field" style="margin:8px 36px 0 0;"><label>۱. اگر ترس نبود، چه می‌کردم؟</label><textarea id="dp-possibility-fear" rows="2" placeholder="مثلاً: اولین قدم را همین امروز برمی‌داشتم..."></textarea></div>' +
          '<div class="b-field" style="margin:8px 36px 0 0;"><label>۲. اگر پول نبود، چه می‌کردم؟</label><textarea id="dp-possibility-money" rows="2" placeholder="مثلاً: با همان چیزی که دارم شروع می‌کردم..."></textarea></div>' +
          '<div class="b-field" style="margin:8px 36px 0 0;"><label>۳. اگر تأیید دیگران نبود، چه می‌کردم؟</label><textarea id="dp-possibility-approval" rows="2" placeholder="مثلاً: همان کاری را می‌کردم که قلبم می‌گفت..."></textarea></div>' +
          '<div style="margin:14px 36px 0 0;">' +
            '<div style="font-size:12.5px;font-weight:800;margin-bottom:6px;">📡 حالا این امکان‌ها را ردیابی کن</div>' +
            '<div class="ras-input-row"><textarea id="b-tracking" rows="1" placeholder="مثلاً: هر بار که کسی از کارم تعریف می‌کند..."></textarea><button class="ras-add-btn" onclick="addTrackingItem()">+</button></div>' +
            '<div class="tracking-list" id="tracking-list"></div>' +
            '<div class="ras-btn-row"><button class="ras-activate-btn" id="ras-activate-btn" onclick="toggleTracking()">فعال کردن ردیابی</button>' +
              '<div class="ras-radar" id="ras-radar"><span class="radar-blip green" style="top:22%;left:32%;"></span><span class="radar-blip red" style="top:58%;left:70%;"></span><span class="radar-blip green" style="top:72%;left:24%;"></span><span class="radar-blip green" style="top:32%;left:75%;"></span></div>' +
            '</div>' +
            '<div style="margin:12px 0 6px;"><h2 style="font-size:13px;margin:0;">🧬 انجام این تمرین</h2></div>' +
            '<div class="neural-card" id="np-tracking-mount"></div>' +
          '</div>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="3" style="margin-right:36px;margin-top:10px;">✓ این مرحله را انجام دادم</button>' +
        '</div>' +

        // مرحله ۴ — See it
        '<div class="dp-step">' +
          '<div class="dp-step-head"><span class="dp-step-num">۴</span><span class="dp-step-title" style="flex:1;">See it — متن آینده‌ات را بخوان</span><span class="dp-check" data-dp-check="4" style="font-size:18px;color:var(--muted);">○</span></div>' +
          '<p class="bf-desc" style="margin-right:36px;">متن آینده‌ات را با صدای بلند بخوان. بعد چشم‌ها را ببند و همان را به تصویر تبدیل کن — خودت را داخل صحنه ببین.</p>' +
          '<textarea id="b-future-text" rows="5" placeholder="بسیار خوشحال و سپاسگزارم حالا که..." oninput="updateFutureText(this.value)" style="margin-right:36px;width:calc(100% - 36px);"></textarea>' +
          '<div style="margin:10px 36px 0 0;"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px;"><span>روز <b id="future-day-num">۰</b> از ۹۰</span><span id="future-day-pct">۰٪</span></div><div class="tb-bar" style="margin:0;"><div class="tb-bar-fill" id="future-progress-bar" style="width:0%;"></div></div></div>' +
          '<div style="margin:14px 36px 0 0;">' +
            '<div style="font-size:12.5px;font-weight:800;margin-bottom:6px;">🖼️ عکس‌های صحنه‌ات</div>' +
            '<div class="visual-upload-row"><label class="visual-upload-btn" for="visual-image-input">+ افزودن عکس</label><input type="file" id="visual-image-input" accept="image/*" multiple style="display:none" onchange="handleVisualImages(this.files)"></div>' +
            '<div class="visual-gallery" id="visual-gallery"></div>' +
            '<div style="margin:12px 0 6px;"><h2 style="font-size:13px;margin:0;">🧬 انجام این تمرین</h2></div>' +
            '<div class="neural-card" id="np-visual-mount"></div>' +
          '</div>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="4" style="margin-right:36px;margin-top:10px;">✓ خواندم و تجسم کردم</button>' +
        '</div>' +

        // مرحله ۵ — Feel it
        '<div class="dp-step">' +
          '<div class="dp-step-head"><span class="dp-step-num">۵</span><span class="dp-step-title" style="flex:1;">Feel it NOW ❤️ — حسِ همین حالا</span><span class="dp-check" data-dp-check="5" style="font-size:18px;color:var(--muted);">○</span></div>' +
          '<p class="bf-desc" style="margin-right:36px;">حسِ «همین حالا رسیده‌ام» را در بدنت فراخوانی کن. کدام احساس را داری؟ (این انتخاب روی شمارش رشته‌های عصبی‌ات اثر می‌گذارد.)</p>' +
          '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'پروتکل دیسپنزا — حسِ حالا\')" style="margin-right:36px;margin-top:6px;">💗 ثبت حس</button>' +
          '<span id="dp-emotion-feedback" style="margin-right:12px;font-size:11.5px;color:var(--muted);"></span>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="5" style="margin-right:36px;margin-top:10px;">✓ حسش را حس کردم</button>' +
        '</div>' +

        // مرحله ۶ — Become
        '<div class="dp-step">' +
          '<div class="dp-step-head"><span class="dp-step-num">۶</span><span class="dp-step-title" style="flex:1;">Become — تبدیل شو</span><span class="dp-check" data-dp-check="6" style="font-size:18px;color:var(--muted);">○</span></div>' +
          '<p class="bf-desc" style="margin-right:36px;">در همان حال بمان و همان آدمی که می‌خواهی بشوی را با تمام وجود تجربه کن. یک تأییدیه‌ی ساده بگو:</p>' +
          '<div style="margin-right:36px;padding:14px;background:var(--surface-2);border-radius:12px;text-align:center;font-size:13px;font-weight:700;color:var(--emerald-700);">«من همین حالا همینم.»</div>' +
          '<button type="button" class="btn tiny dp-mark" data-dp-step="6" style="margin-right:36px;margin-top:10px;">✓ تأیید می‌کنم</button>' +
        '</div>' +

        // موسیقی
        '<div style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);">' +
          '<div style="font-size:12px;font-weight:700;margin-bottom:8px;">🎵 موسیقی مدیتیشن (اختیاری)</div>' +
          '<label class="visual-upload-btn" for="meditation-audio-input">+ افزودن موسیقی</label>' +
          '<input type="file" id="meditation-audio-input" accept="audio/*" style="display:none" onchange="handleMeditationAudio(this.files)">' +
          '<div id="meditation-audio-wrap"></div>' +
        '</div>' +

        // دکمه‌ی نهایی
        '<button type="button" class="today-btn2" id="dp-complete-btn" style="width:100%;margin-top:18px;padding:14px;font-size:14px;cursor:not-allowed;opacity:.55;" disabled>🔒 امروز انجام دادم (اول ۶ مرحله را کامل کن)</button>' +

        // مسیر عصبی
        '<div style="margin:16px 0 6px;"><h2 style="font-size:13px;margin:0;">🧬 مدار کلی این پروتکل</h2></div>' +
        '<div class="neural-card" id="np-dispenza-mount"></div>' +

        // نگه‌داشتن b-visual-note مخفی برای سازگاری با renderBeliefsView قدیمی
        '<textarea id="b-visual-note" style="display:none;"></textarea>' +
      '</div>';

    topbar.insertAdjacentHTML('afterend', html);
  }

  // ============ ۵. جایگزینی renderAllNeuralPathways ============
  function overrideRenderAll(){
    window.renderAllNeuralPathways = function(){
      if (typeof renderNeuralPathway !== 'function') return;
      var safe = function(fn){ try { fn(); } catch(e){ console.warn('[neural]', e); } };
      if (document.getElementById('np-gratitude-mount')){
        safe(function(){ renderNeuralPathway('np-gratitude-mount', ensureGratitudeNeural(), { label:'شکرگذاری', practiceKey:'gratitude', showTodayPrompt:true, onChange:saveState }); });
      }
      if (document.getElementById('np-belief-mount')){
        safe(function(){ renderNeuralPathway('np-belief-mount', ensureBeliefNeural(), { label:'تمرین باب پراکتور', practiceKey:'belief', onChange:saveState }); });
      }
      if (document.getElementById('np-dispenza-mount')){
        safe(function(){ renderNeuralPathway('np-dispenza-mount', ensureDispenzaNeural(), { label:'مدیتیشن دیسپنزا', practiceKey:'dispenza', onChange:saveState }); });
      }
      if (document.getElementById('np-tracking-mount')){
        safe(function(){ renderNeuralPathway('np-tracking-mount', ensureTrackingNeural(), { label:'ردیابی RAS', practiceKey:'tracking', calendarLinked:true, isConfirmed:isTrackingConfirmedForKey, onChange:saveState }); });
      }
      if (document.getElementById('np-visual-mount')){
        safe(function(){ renderNeuralPathway('np-visual-mount', ensureVisualNeural(), { label:'تصویرسازی', practiceKey:'visual', calendarLinked:true, isConfirmed:isVisualConfirmedForKey, onChange:saveState }); });
      }
    };
  }

  // ============ ۶. رویدادها ============
  function wireEvents(){
    document.addEventListener('click', function(e){
      // مرحله‌ها
      var markBtn = e.target.closest('.dp-mark');
      if (markBtn){
        var step = markBtn.dataset.dpStep;
        var done = dpGetTodaySteps();
        var idx = done.indexOf(step);
        if (idx === -1) done.push(step); else done.splice(idx,1);
        saveState();
        dpRenderProgress();
        return;
      }
      // تایمر
      if (e.target.id === 'dp-timer-btn'){ dpStartTimer(); return; }
      // دکمه نهایی
      if (e.target.id === 'dp-complete-btn' && !e.target.disabled){
        var quality = getTodayEmotionQualityFor('dispenza');
        var fibers = 1;
        var msg = 'ثبت شد — یک رشته‌ی جدید ساخته شد 🧠';
        if (quality !== null){
          if (quality >= 500){ fibers = 2; msg = '🔥 کیفیت حس بالا بود — دو رشته ساخته شد!'; }
          else if (quality < 200){ fibers = -1; msg = '⚠️ حس امروز ضعیف بود — یک رشته کم شد. دفعه‌ی بعد عمیق‌تر حسش کن.'; }
        }
        var dn = ensureDispenzaNeural();
        if (fibers > 0){
          for (var i = 0; i < fibers; i++) neuralAddFiber(dn, {calendarLinked:false});
        } else if (fibers === -1){
          neuralRemoveFiber(dn);
        }
        var dk = dpTodayKey();
        if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
        if (state.dispenzaReadDays.indexOf(dk) === -1) state.dispenzaReadDays.push(dk);
        if (!state.futureReadDays) state.futureReadDays = [];
        if (state.futureReadDays.indexOf(dk) === -1) state.futureReadDays.push(dk);
        if (!state.futureStartDate) state.futureStartDate = dk;
        ensureDispenzaProgress()[dk] = [];
        saveState();
        dpRenderProgress();
        if (typeof renderFutureUI === 'function') renderFutureUI();
        if (typeof renderAllNeuralPathways === 'function') renderAllNeuralPathways();
        if (typeof toast === 'function') toast(msg);
      }
    });

    // ذخیره‌ی امکان‌ها
    ['dp-possibility-fear','dp-possibility-money','dp-possibility-approval'].forEach(function(id){
      document.addEventListener('input', function(e){
        if (e.target && e.target.id === id){
          var key = id.replace('dp-possibility-','possibility_');
          if (!state.dispenzaPossibilities) state.dispenzaPossibilities = {};
          state.dispenzaPossibilities[key] = e.target.value;
          saveState();
        }
      });
    });
  }

  // ============ ۷. رَپ renderBeliefsView ============
  function wrapRenderBeliefsView(){
    if (typeof window.renderBeliefsView !== 'function') return;
    if (window.renderBeliefsView.__patched) return;
    var original = window.renderBeliefsView;
    window.renderBeliefsView = function(){
      try { original.apply(this, arguments); } catch(e){ console.warn('[renderBeliefsView]', e); }
      try { dpRenderProgress(); } catch(e){}
      try { dpRestorePossibilities(); } catch(e){}
    };
    window.renderBeliefsView.__patched = true;
  }

  // ============ ۸. اجرا ============
  function boot(){
    if (!initState()){
      setTimeout(boot, 100);
      return;
    }
    injectHelpSection();
    rebuildBeliefsView();
    overrideRenderAll();
    wrapRenderBeliefsView();
    wireEvents();
    // اگه کاربر همین الان روی تب باورها هست، رفرش کن
    var bv = document.getElementById('view-beliefs');
    if (bv && bv.classList.contains('active')){
      try { window.renderBeliefsView(); } catch(e){}
    }
  }

  if (document.readyState === 'complete'){
    setTimeout(boot, 300);
  } else {
    window.addEventListener('load', function(){ setTimeout(boot, 300); });
  }
})();
