/* =====================================================================
   beliefs-patch.js — نسخه‌ی ساده و حرفه‌ای
   
   ساختار تب باورها:
     ۱. 📜 متن آینده (ویرایش داخل خود کادر + تقویم ۹۰ روزه + آرشیو)
     ۲. 🌌 جلسه‌ی روزانه (یک دکمه شروع، تایمر خودکار، بدون چک‌لیست خسته‌کننده)
     ۳. 🔔 یادآوری (فقط آیکون زنگ در گوشه‌ی بالا سمت راست)
   
   نصب: <script src="beliefs-patch.js"></script> قبل از </body>
   ===================================================================== */
(function(){
  'use strict';

  /* ============ مقداردهی state ============ */
  function ensureState(){
    if (typeof state === 'undefined' || !state) return false;

    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (!state.practiceEmotions) state.practiceEmotions = {};

    // نسخه‌های متن آینده
    if (!Array.isArray(state.futureTextVersions)){
      state.futureTextVersions = [];
      if (state.futureText && String(state.futureText).trim()){
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
    if (!state.activeFutureVersionId){
      var act = state.futureTextVersions.filter(function(v){ return !v.endDate; })[0];
      state.activeFutureVersionId = act ? act.id : null;
    }

    try { if (typeof saveState === 'function') saveState(); } catch(e){}
    return true;
  }

  /* ============ توابع کمکی ============ */
  function dpTodayKey(){
    if (typeof dayKeyFromDate === 'function') return dayKeyFromDate(new Date());
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  }

  function fa(n){
    try { return Number(n).toLocaleString('fa-IR'); } catch(e){ return String(n); }
  }

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function getActiveVersion(){
    if (!state.activeFutureVersionId) return null;
    return state.futureTextVersions.filter(function(v){
      return v.id === state.activeFutureVersionId;
    })[0] || null;
  }

  function getTodayEmotionQualityFor(pk){
    var em = state.practiceEmotions || {};
    var rec = em[dpTodayKey()] && em[dpTodayKey()][pk];
    if (!rec || !rec.after || !rec.after.length) return null;
    var mx = 0;
    rec.after.forEach(function(id){
      var e = (typeof EMOTION_BY_ID !== 'undefined') ? EMOTION_BY_ID[id] : null;
      if (e && e.freq > mx) mx = e.freq;
    });
    return mx;
  }
  window.getTodayEmotionQualityFor = getTodayEmotionQualityFor;

  function getStreakDays(){
    var days = (state.dispenzaReadDays || []).slice().sort();
    if (!days.length) return 0;
    var s = 1;
    for (var i = days.length - 1; i > 0; i--){
      var a = new Date(days[i]);
      var b = new Date(days[i-1]);
      if ((a - b) / 86400000 === 1) s++;
      else break;
    }
    return s;
  }

  function daysSinceStart(){
    var v = getActiveVersion();
    if (!v || !v.startDate) return 0;
    var start = new Date(v.startDate);
    return Math.floor((new Date() - start) / 86400000) + 1;
  }

  /* ============ بخش راهنما — بازنویسی کامل و ساده ============ */
  function injectHelpSection(){
    var helpOverlay = document.getElementById('help-modal-overlay');
    if (!helpOverlay) return;
    if (helpOverlay.querySelector('[data-our-help="v3"]')) return;
    var modalActions = helpOverlay.querySelector('.modal-actions');
    if (!modalActions) return;

    var section = document.createElement('div');
    section.className = 'help-section';
    section.setAttribute('data-our-help', 'v3');
    section.innerHTML =
      '<h3>💡 یک قانون ساده که همه‌چیز را عوض می‌کند</h3>' +
      '<p>وقتی می‌گویی «کاش این را داشتم»، مغزت یک پیام واضح می‌گیرد: <b>«تو نداری»</b>. ' +
      'و همان را تقویت می‌کند. این اسمش «آرزو کردن» است — و مغز را در همان جای قبلی نگه می‌دارد.</p>' +
      '<p>به‌جایش بپرس: <b>«چه چیزی ممکن است؟»</b> — این سوال، مغزت را به حرکت درمی‌آورد. ' +
      'این اسمش «پرسیدن» است، نه آرزو کردن.</p>' +
      '<p style="background:rgba(43,191,171,.10);padding:10px 14px;border-radius:10px;border-right:3px solid #2bbfab;">' +
        '<b>یک جمله، دو مسیر:</b><br>' +
        '❌ «کاش پول کافی داشتم» → بدن در حالت نگرانی، مغز به دنبال کمبود<br>' +
        '✅ «چه راهی ممکن است؟» → بدن در حالت آرامش، مغز به دنبال راه' +
      '</p>' +
      '<p style="margin-top:14px;"><b>پس چرا باید ۹۰ روز ادامه بدهم؟</b><br>' +
      'مغزت هر روز یک رشته‌ی نازک بین «حالا» و «هدف» می‌سازد. ' +
      '۳۰ روز اول: مغز با مسیر جدید آشنا می‌شود. ۳۰ روز دوم: مسیر ضخیم‌تر می‌شود. ' +
      '۳۰ روز سوم: مسیر خودکار می‌شود — دیگر لازم نیست یادت بیفتد.</p>';

    modalActions.parentNode.insertBefore(section, modalActions);
  }

  /* ============ بازسازی تب باورها ============ */
  function rebuildBeliefsView(){
    var bv = document.getElementById('view-beliefs');
    if (!bv) return;

    // حذف همه چیز داخل view به جز topbar
    var children = Array.from(bv.children);
    children.forEach(function(ch){
      if (!ch.classList.contains('topbar')){
        ch.parentNode.removeChild(ch);
      }
    });

    var topbar = bv.querySelector('.topbar');
    if (!topbar) return;

    // پاکسازی topbar و ساخت دکمه‌های جدید
    topbar.innerHTML =
      '<button class="icon-btn" onclick="goto(\'home\')">‹</button>' +
      '<div style="flex:1;"></div>' +
      '<button class="icon-btn" id="belief-bell-btn" title="یادآوری روزانه">🔔</button>';

    // پاپ‌اور یادآوری (مخفی، بالای صفحه)
    var popoverHtml =
      '<div id="reminder-popover" class="reminder-popover" style="display:none;">' +
        '<div style="font-size:13px;font-weight:800;margin-bottom:10px;">🔔 یادآوری روزانه</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
          '<span style="font-size:12px;color:var(--muted);">فعال باشد</span>' +
          '<div class="switch" id="alarm-switch" onclick="toggleAlarm()"><div class="knob"></div></div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
          '<span style="font-size:12px;color:var(--muted);">ساعت</span>' +
          '<input type="time" id="alarm-time" value="20:00" onchange="setAlarmTime(this.value)" style="border:1px solid var(--line);border-radius:8px;padding:5px 10px;font-family:inherit;font-size:12px;">' +
        '</div>' +
        '<div style="font-size:10.5px;color:var(--muted);line-height:1.7;text-align:center;">' +
          'حتی ۵ دقیقه کافیه. تداوم مهم‌تر از مدته.' +
        '</div>' +
      '</div>';

    // محتوای اصلی
    var mainHtml =
      '<div id="beliefs-content" style="padding:14px 18px 100px;">' +
        // کارت ۱ — متن آینده
        '<div class="b-card" id="future-text-card">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
            '<div style="font-size:14px;font-weight:800;">📜 متن آینده‌ی من</div>' +
            '<button id="future-archive-btn" class="btn tiny" style="padding:4px 10px;font-size:10.5px;">📚 نسخه‌ها</button>' +
          '</div>' +

          '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">' +
            'متن آینده‌ات را این‌جا بنویس. هر روز صبح و شب می‌خوانی‌اش.' +
          '</div>' +

          '<div id="future-text-display" style="display:none;"></div>' +
          '<div id="future-edit-wrap">' +
            '<textarea id="future-text-input" rows="4" placeholder="بسیار خوشحال و سپاسگزارم حالا که..." style="width:100%;font-family:inherit;font-size:13px;line-height:1.9;border:1px solid var(--line);border-radius:12px;padding:12px;outline:none;background:var(--surface);resize:vertical;"></textarea>' +
            '<div style="display:flex;gap:8px;margin-top:8px;">' +
              '<button id="future-save-btn" class="btn tiny gold" style="flex:1;padding:9px;">💾 ذخیره</button>' +
              '<button id="future-edit-btn" class="btn tiny" style="padding:9px 14px;">✏️ ویرایش</button>' +
            '</div>' +
          '</div>' +

          // تقویم ۹۰ روزه
          '<div id="future-calendar-wrap" style="margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<span style="font-size:12px;font-weight:700;">📅 پیشرفت ۹۰ روزه</span>' +
              '<span id="future-progress-label" style="font-size:11px;color:var(--muted);">۰ از ۹۰</span>' +
            '</div>' +
            '<div id="future-calendar-grid" class="future-cal-grid"></div>' +
          '</div>' +

          '<div id="future-neural-wrap" style="margin-top:16px;">' +
            '<div class="neural-card" id="np-future-mount"></div>' +
          '</div>' +
        '</div>' +

        // کارت ۲ — جلسه‌ی روزانه
        '<div class="b-card" id="session-card" style="margin-top:14px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
            '<div style="font-size:14px;font-weight:800;">🌌 جلسه‌ی امروز</div>' +
            '<span id="session-streak-badge" style="font-size:10.5px;color:var(--emerald-700);background:rgba(43,191,171,.12);padding:3px 10px;border-radius:20px;font-weight:700;">شروع کن</span>' +
          '</div>' +

          // حالت آماده
          '<div id="session-idle">' +
            '<p style="font-size:12px;color:var(--muted);line-height:1.8;margin:0 0 14px;">' +
              'یک جلسه‌ی ۱۵ دقیقه‌ای که تو را از ذهن روزمره به حالت خلاق می‌برد. ' +
              'کافیه یک بار شروع کنی — بقیه‌اش خودکار پیش می‌ره.' +
            '</p>' +
            '<button id="session-start-btn" class="primary-btn" style="margin:0;width:100%;padding:16px;font-size:14.5px;border-radius:14px;">' +
              '▶️ شروع جلسه‌ی امروز' +
            '</button>' +
          '</div>' +

          // حالت در حال اجرا
          '<div id="session-running" style="display:none;">' +
            '<div style="text-align:center;margin-bottom:16px;">' +
              '<div id="session-timer" style="font-size:32px;font-weight:800;font-variant-numeric:tabular-nums;color:var(--emerald-700);">۱۵:۰۰</div>' +
              '<div id="session-stage-name" style="font-size:13px;font-weight:700;margin-top:8px;">آماده‌سازی</div>' +
              '<div id="session-stage-desc" style="font-size:11.5px;color:var(--muted);margin-top:4px;line-height:1.6;"></div>' +
            '</div>' +
            '<div id="session-progress-dots" style="display:flex;justify-content:center;gap:8px;margin-bottom:16px;"></div>' +
            '<div style="display:flex;gap:8px;">' +
              '<button id="session-next-btn" class="primary-btn" style="margin:0;flex:1;padding:12px;font-size:13px;">مرحله بعد ›</button>' +
              '<button id="session-stop-btn" class="ghost-btn" style="margin:0;width:auto;padding:12px 16px;font-size:12px;">✕</button>' +
            '</div>' +
          '</div>' +

          // حالت اتمام
          '<div id="session-done" style="display:none;">' +
            '<div style="text-align:center;padding:14px 0;">' +
              '<div style="font-size:42px;margin-bottom:8px;">✓</div>' +
              '<div style="font-size:14px;font-weight:800;margin-bottom:6px;">جلسه تمام شد</div>' +
              '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;">حست را ثبت کن تا نتیجه بهتر بشه</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:14px;">' +
              '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'جلسه‌ی روزانه\')" style="flex:1;padding:12px;">💗 ثبت حس</button>' +
              '<button id="session-save-btn" class="btn tiny gold" style="flex:1;padding:12px;">✅ ذخیره</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div style="margin-top:14px;">' +
          '<div class="neural-card" id="np-dispenza-mount"></div>' +
        '</div>' +
      '</div>';

    topbar.insertAdjacentHTML('afterend', popoverHtml + mainHtml);

    // استایل اضافی
    if (!document.getElementById('beliefs-pro-style')){
      var st = document.createElement('style');
      st.id = 'beliefs-pro-style';
      st.textContent =
        '.b-card{background:var(--surface,var(--panel-bg));border:1px solid var(--line,var(--panel-border));border-radius:16px;padding:16px;}' +
        '.future-cal-grid{display:grid;grid-template-columns:repeat(15,1fr);gap:3px;}' +
        '.future-cal-cell{aspect-ratio:1;border-radius:3px;background:var(--surface-2,var(--input-bg));border:1px solid var(--line,var(--panel-border));transition:.15s;}' +
        '.future-cal-cell.done{background:var(--emerald-500,#2bbfab);border-color:var(--emerald-500,#2bbfab);}' +
        '.future-cal-cell.today{outline:2px solid var(--gold-500,#c9a24b);outline-offset:1px;}' +
        '.session-dot{width:10px;height:10px;border-radius:50%;background:var(--line);transition:.3s;}' +
        '.session-dot.done{background:var(--emerald-500,#2bbfab);}' +
        '.session-dot.active{background:var(--gold-500,#c9a24b);transform:scale(1.4);}' +
        '.reminder-popover{position:absolute;top:52px;left:12px;right:12px;z-index:100;background:var(--card,#fff);border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.15);max-width:280px;margin-inline-start:auto;}' +
        'html[data-theme="dark"] .b-card{background:var(--surface,#20232f);}' +
        'html[data-theme="dark"] .future-cal-cell{background:var(--surface-2,#282c3b);}' +
        'html[data-theme="dark"] .reminder-popover{background:var(--card,#20232f);}';
      document.head.appendChild(st);
    }
  }

  /* ============ رندر متن آینده ============ */
  function renderFutureText(){
    var v = getActiveVersion();
    var display = document.getElementById('future-text-display');
    var editWrap = document.getElementById('future-edit-wrap');
    var input = document.getElementById('future-text-input');
    var editBtn = document.getElementById('future-edit-btn');
    var archiveCount = document.getElementById('future-archive-btn');

    if (!v || !v.text || !v.text.trim()){
      // حالت اولیه — ادیتور باز
      if (display) display.style.display = 'none';
      if (editWrap) editWrap.style.display = 'block';
      if (input && !input.value) input.value = '';
      if (editBtn) editBtn.style.display = 'none';
    } else {
      // متن وجود دارد — نمایش، ادیتور مخفی
      if (display){
        display.style.display = 'block';
        display.innerHTML = '<div style="background:var(--card,#fff);border:1px solid var(--line);border-radius:12px;padding:14px;font-size:13px;line-height:1.9;font-style:italic;white-space:pre-wrap;margin-bottom:8px;">«' + escapeHtml(v.text) + '»</div>';
      }
      if (editWrap) editWrap.style.display = 'none';
      if (input) input.value = v.text;
      if (editBtn) editBtn.style.display = 'inline-flex';
    }

    if (archiveCount){
      archiveCount.textContent = '📚 نسخه‌ها (' + fa((state.futureTextVersions || []).length) + ')';
    }

    renderFutureCalendar();
  }

  function renderFutureCalendar(){
    var grid = document.getElementById('future-calendar-grid');
    var label = document.getElementById('future-progress-label');
    if (!grid) return;

    var v = getActiveVersion();
    var readDays = v && v.readDays ? v.readDays : [];
    var readSet = {};
    readDays.forEach(function(k){ readSet[k] = true; });

    var today = dpTodayKey();
    var daysSince = v && v.startDate ? Math.min(90, Math.floor((new Date() - new Date(v.startDate)) / 86400000)) : 0;

    var cells = '';
    for (var i = 0; i < 90; i++){
      var dayKey = '';
      if (v && v.startDate){
        var d = new Date(v.startDate);
        d.setDate(d.getDate() + i);
        dayKey = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      }
      var isDone = !!readSet[dayKey];
      var isToday = dayKey === today;
      var isFuture = i > daysSince;
      var cls = 'future-cal-cell';
      if (isDone) cls += ' done';
      if (isToday) cls += ' today';
      if (isFuture) cls += ' future';
      cells += '<div class="' + cls + '" title="روز ' + (i+1) + '"></div>';
    }
    grid.innerHTML = cells;

    if (label){
      var doneCount = readDays.length;
      label.textContent = fa(doneCount) + ' از ۹۰ روز';
    }
  }

  /* ============ آرشیو ============ */
  function openArchive(){
    var versions = state.futureTextVersions || [];
    if (!versions.length){
      if (typeof toast === 'function') toast('هنوز نسخه‌ای نداری');
      return;
    }
    // نمایش آرشیو داخل کارت، به صورت لیست بازشو
    var wrap = document.getElementById('future-text-card');
    if (!wrap) return;

    var existing = document.getElementById('archive-dropdown');
    if (existing){ existing.parentNode.removeChild(existing); return; }

    var html = '<div id="archive-dropdown" style="margin-top:12px;padding:12px;background:var(--surface-2);border-radius:12px;">';
    html += '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">📚 نسخه‌های متن آینده</div>';
    versions.forEach(function(v, i){
      var isActive = v.id === state.activeFutureVersionId;
      var preview = v.text.length > 60 ? v.text.slice(0, 60) + '...' : v.text;
      html += '<div style="padding:8px 10px;background:' + (isActive ? 'rgba(43,191,171,.10)' : 'var(--card)') + ';border:1px solid ' + (isActive ? 'var(--emerald-500)' : 'var(--line)') + ';border-radius:10px;margin-bottom:6px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
          '<span style="font-size:11px;font-weight:700;color:' + (isActive ? 'var(--emerald-700)' : 'var(--ink)') + ';">نسخه ' + fa(i+1) + (isActive ? ' ✓ (فعال)' : '') + '</span>' +
          '<span style="font-size:9.5px;color:var(--muted);">' + v.startDate + ' → ' + (v.endDate || 'اکنون') + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:6px;font-style:italic;">«' + escapeHtml(preview) + '»</div>' +
        (!isActive ? '<button class="btn tiny" onclick="window.__activateVersion(\'' + v.id + '\')" style="padding:4px 10px;font-size:10.5px;">فعال کن</button>' : '') +
      '</div>';
    });
    html += '<button id="archive-close-btn" class="btn tiny" style="width:100%;margin-top:6px;padding:6px;">بستن</button>';
    html += '</div>';

    wrap.insertAdjacentHTML('beforeend', html);
    document.getElementById('archive-close-btn').addEventListener('click', function(){
      var el = document.getElementById('archive-dropdown');
      if (el) el.parentNode.removeChild(el);
    });
  }

  window.__activateVersion = function(id){
    var versions = state.futureTextVersions || [];
    versions.forEach(function(v){
      if (!v.endDate && v.id !== id) v.endDate = dpTodayKey();
    });
    var chosen = versions.filter(function(v){ return v.id === id; })[0];
    if (!chosen) return;
    chosen.endDate = null;
    state.activeFutureVersionId = chosen.id;
    state.futureText = chosen.text;
    state.futureStartDate = chosen.startDate;
    state.futureReadDays = chosen.readDays || [];
    try { saveState(); } catch(e){}
    // رفرش
    var arch = document.getElementById('archive-dropdown');
    if (arch) arch.parentNode.removeChild(arch);
    renderFutureText();
    renderOurNeuralPathways();
    if (typeof toast === 'function') toast('نسخه فعال شد ✓');
  };

  /* ============ ذخیره متن آینده ============ */
  function saveFutureText(){
    var input = document.getElementById('future-text-input');
    if (!input) return;
    var txt = (input.value || '').trim();
    if (!txt){
      if (typeof toast === 'function') toast('متن نمی‌تونه خالی باشه');
      return;
    }

    var v = getActiveVersion();

    if (!v){
      // نسخه‌ی جدید
      var nv = {
        id: 'v_' + Date.now(),
        text: txt,
        startDate: dpTodayKey(),
        endDate: null,
        readDays: []
      };
      state.futureTextVersions.push(nv);
      state.activeFutureVersionId = nv.id;
      state.futureText = txt;
      state.futureStartDate = nv.startDate;
      state.futureReadDays = nv.readDays;
      if (typeof toast === 'function') toast('متن آینده ثبت شد ✨');
    } else if (v.text !== txt){
      // نسخه‌ی جدید با حفظ قبلی
      v.endDate = dpTodayKey();
      var nv2 = {
        id: 'v_' + Date.now(),
        text: txt,
        startDate: dpTodayKey(),
        endDate: null,
        readDays: []
      };
      state.futureTextVersions.push(nv2);
      state.activeFutureVersionId = nv2.id;
      state.futureText = txt;
      state.futureStartDate = nv2.startDate;
      state.futureReadDays = nv2.readDays;
      if (typeof toast === 'function') toast('نسخه‌ی جدید ثبت شد — قبلی در آرشیو موند 📚');
    } else {
      if (typeof toast === 'function') toast('تغییری نبود');
    }

    try { saveState(); } catch(e){}
    renderFutureText();
    renderOurNeuralPathways();
  }

  /* ============ جلسه‌ی روزانه ============ */
  var SESSION_STAGES = [
    { name: 'آماده‌سازی', desc: 'سه نفس عمیق. یک شکرگذاری قلبی بگو.' },
    { name: 'آرام شدن', desc: 'از بدن، افکار، و زمان فاصله بگیر. فقط باش.' },
    { name: 'پرسیدن', desc: 'بپرس: «چه چیزی ممکن است؟» — دنبال راه بگرد، نه کمبود.' },
    { name: 'دیدن', desc: 'متن آینده‌ات را در ذهنت ببین. خودت را داخل صحنه.' },
    { name: 'حس کردن', desc: 'حسِ «همه‌چیز درست است» را در بدنت فراخوانی کن.' }
  ];
  var STAGE_DURATION = 3 * 60; // ۳ دقیقه هر مرحله = ۱۵ دقیقه کل

  var sessionTimer = null;
  var sessionSeconds = STAGE_DURATION * 5;
  var sessionStage = 0;
  var sessionRunning = false;

  function startSession(){
    sessionStage = 0;
    sessionSeconds = STAGE_DURATION * 5;
    sessionRunning = true;
    document.getElementById('session-idle').style.display = 'none';
    document.getElementById('session-running').style.display = 'block';
    document.getElementById('session-done').style.display = 'none';
    updateSessionUI();

    if (sessionTimer) clearInterval(sessionTimer);
    sessionTimer = setInterval(function(){
      sessionSeconds--;
      if (sessionSeconds <= 0){
        endSession();
        return;
      }
      // تشخیص تغییر مرحله
      var elapsed = STAGE_DURATION * 5 - sessionSeconds;
      var newStage = Math.min(SESSION_STAGES.length - 1, Math.floor(elapsed / STAGE_DURATION));
      if (newStage !== sessionStage){
        sessionStage = newStage;
        if (navigator.vibrate) try { navigator.vibrate(30); } catch(e){}
      }
      updateSessionUI();
    }, 1000);
  }

  function updateSessionUI(){
    var m = Math.floor(sessionSeconds / 60);
    var s = sessionSeconds % 60;
    var timer = document.getElementById('session-timer');
    if (timer) timer.textContent = m + ':' + String(s).padStart(2, '0');

    var nameEl = document.getElementById('session-stage-name');
    var descEl = document.getElementById('session-stage-desc');
    var st = SESSION_STAGES[sessionStage];
    if (nameEl) nameEl.textContent = st.name;
    if (descEl) descEl.textContent = st.desc;

    var dots = document.getElementById('session-progress-dots');
    if (dots){
      var html = '';
      for (var i = 0; i < SESSION_STAGES.length; i++){
        var cls = 'session-dot';
        if (i < sessionStage) cls += ' done';
        else if (i === sessionStage) cls += ' active';
        html += '<div class="' + cls + '"></div>';
      }
      dots.innerHTML = html;
    }
  }

  function nextStage(){
    if (sessionStage < SESSION_STAGES.length - 1){
      sessionStage++;
      // زمان را جلو ببر
      var elapsed = STAGE_DURATION * sessionStage;
      sessionSeconds = STAGE_DURATION * 5 - elapsed;
      updateSessionUI();
    } else {
      endSession();
    }
  }

  function endSession(){
    if (sessionTimer) clearInterval(sessionTimer);
    sessionTimer = null;
    sessionRunning = false;
    document.getElementById('session-idle').style.display = 'none';
    document.getElementById('session-running').style.display = 'none';
    document.getElementById('session-done').style.display = 'block';
    if (navigator.vibrate) try { navigator.vibrate([200,100,200]); } catch(e){}
    if (typeof playCompletionGong === 'function') playCompletionGong();
  }

  function stopSession(){
    if (sessionTimer) clearInterval(sessionTimer);
    sessionTimer = null;
    sessionRunning = false;
    document.getElementById('session-idle').style.display = 'block';
    document.getElementById('session-running').style.display = 'none';
    document.getElementById('session-done').style.display = 'none';
  }

  function saveSession(){
    var quality = getTodayEmotionQualityFor('dispenza');
    var fibers = 1;
    var msg = 'ثبت شد — یک رشته‌ی جدید 🧠';
    if (quality !== null){
      if (quality >= 500){ fibers = 2; msg = '🔥 حس پرقدرت — دو رشته!'; }
      else if (quality < 200){ fibers = -1; msg = '⚠️ حس ضعیف — یک رشته کم شد'; }
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

    var v = getActiveVersion();
    if (v){
      if (!Array.isArray(v.readDays)) v.readDays = [];
      if (v.readDays.indexOf(dk) === -1) v.readDays.push(dk);
    }
    if (!state.futureReadDays) state.futureReadDays = [];
    if (state.futureReadDays.indexOf(dk) === -1) state.futureReadDays.push(dk);
    if (!state.futureStartDate) state.futureStartDate = dk;

    try { saveState(); } catch(e){}

    // بازگشت به حالت اولیه
    document.getElementById('session-done').style.display = 'none';
    document.getElementById('session-idle').style.display = 'block';
    sessionSeconds = STAGE_DURATION * 5;
    sessionStage = 0;

    renderFutureCalendar();
    updateStreakBadge();
    renderOurNeuralPathways();
    if (typeof toast === 'function') toast(msg);
  }

  function updateStreakBadge(){
    var badge = document.getElementById('session-streak-badge');
    if (!badge) return;
    var streak = getStreakDays();
    if (streak === 0) badge.textContent = 'شروع کن';
    else if (streak === 1) badge.textContent = 'روز اول ✓';
    else badge.textContent = fa(streak) + ' روز پیوسته';
  }

  /* ============ مسیر عصبی ============ */
  function renderOurNeuralPathways(){
    if (typeof renderNeuralPathway !== 'function') return;

    // متن آینده
    if (document.getElementById('np-future-mount')){
      try {
        if (!state.futureNeural) state.futureNeural = { logs:{}, lastSyncKey:null, habitFormed:false };
        var v = getActiveVersion();
        if (v && Array.isArray(v.readDays)){
          Object.keys(state.futureNeural.logs || {}).forEach(function(k){
            delete state.futureNeural.logs[k];
          });
          v.readDays.forEach(function(dayKey){
            var d = new Date(dayKey);
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

    // مدار پروتکل
    if (document.getElementById('np-dispenza-mount')){
      try {
        var dn = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
        if (dn){
          renderNeuralPathway('np-dispenza-mount', dn, {
            label: 'مدار جلسات روزانه',
            practiceKey: 'dispenza',
            onChange: saveState
          });
        }
      } catch(e){ console.warn('[np-dispenza]', e); }
    }
  }

  function overrideRenderAll(){
    window.renderAllNeuralPathways = function(){
      renderOurNeuralPathways();
    };
  }

  /* ============ wrap renderBeliefsView ============ */
  function wrapRenderBeliefsView(){
    if (typeof window.renderBeliefsView !== 'function') return;
    if (window.renderBeliefsView.__patchedV3) return;
    var original = window.renderBeliefsView;
    window.renderBeliefsView = function(){
      // فقط رفرش UI خودمان
      try { renderFutureText(); } catch(e){}
      try { updateStreakBadge(); } catch(e){}
      try { renderOurNeuralPathways(); } catch(e){}
      var sw = document.getElementById('alarm-switch');
      if (sw) sw.classList.toggle('on', !!state.alarmEnabled);
      var at = document.getElementById('alarm-time');
      if (at) at.value = state.alarmTime || '20:00';
    };
    window.renderBeliefsView.__patchedV3 = true;
  }

  /* ============ رویدادها ============ */
  function wireEvents(){
    document.addEventListener('click', function(e){
      var id = e.target.id;

      // دکمه‌ی زنگ
      if (id === 'belief-bell-btn'){
        var pop = document.getElementById('reminder-popover');
        if (pop) pop.style.display = pop.style.display === 'none' ? 'block' : 'none';
        return;
      }

      // بستن پاپ‌اور با کلیک بیرون
      var pop = document.getElementById('reminder-popover');
      if (pop && pop.style.display !== 'none' && !e.target.closest('#reminder-popover') && id !== 'belief-bell-btn'){
        pop.style.display = 'none';
      }

      // ذخیره متن آینده
      if (id === 'future-save-btn'){ saveFutureText(); return; }

      // ویرایش متن آینده
      if (id === 'future-edit-btn'){
        var display = document.getElementById('future-text-display');
        var editWrap = document.getElementById('future-edit-wrap');
        if (display) display.style.display = 'none';
        if (editWrap) editWrap.style.display = 'block';
        var inp = document.getElementById('future-text-input');
        if (inp) inp.focus();
        return;
      }

      // آرشیو
      if (id === 'future-archive-btn'){ openArchive(); return; }

      // جلسه
      if (id === 'session-start-btn'){ startSession(); return; }
      if (id === 'session-next-btn'){ nextStage(); return; }
      if (id === 'session-stop-btn'){ stopSession(); return; }
      if (id === 'session-save-btn'){ saveSession(); return; }
    });

    // Enter در textarea → ذخیره (Ctrl+Enter)
    document.addEventListener('keydown', function(e){
      if (e.target && e.target.id === 'future-text-input' && (e.ctrlKey || e.metaKey) && e.key === 'Enter'){
        e.preventDefault();
        saveFutureText();
      }
    });
  }

  /* ============ اجرا ============ */
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

    try { renderFutureText(); } catch(e){}
    try { updateStreakBadge(); } catch(e){}
    try { renderOurNeuralPathways(); } catch(e){}
  }

  if (document.readyState === 'complete'){
    setTimeout(boot, 300);
  } else {
    window.addEventListener('load', function(){ setTimeout(boot, 300); });
  }
})();
