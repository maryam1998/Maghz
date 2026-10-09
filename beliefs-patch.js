/* =====================================================================
   beliefs-patch.js — با پنج لایه روی دایره‌ی آگاهی خالص
   ===================================================================== */
(function(){
  'use strict';

  var ARCHIVE_OPEN = false;
  var RAS_ARCHIVE_OPEN = false;
  var waveAnimFrame = null;
  var wavePhase = 0;
  var lastWaveFrame = 0;
  var waveAmpCurrent = {};
  var pureAmpCurrent = null;
  var WAVE_EASE = 0.09;

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
  function dpKeyFromDate(date){
    if (typeof dayKeyFromDate === 'function') return dayKeyFromDate(date);
    return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
  }
  function dpFmtTime(ms){
    try { return new Date(ms).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }); }
    catch(e){ return ''; }
  }
  function dpFmtDateFa(date, opts){
    try {
      var parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', opts).formatToParts(date);
      var m = {};
      parts.forEach(function(p){ m[p.type] = p.value; });
      return [m.weekday, m.day, m.month, m.year].filter(Boolean).join(' ');
    } catch(e){ return date.toLocaleDateString(); }
  }
  function dpMarkRead(v, dk){
    if (!v) return;
    if (!Array.isArray(v.readDays)) v.readDays = [];
    if (v.readDays.indexOf(dk) === -1) v.readDays.push(dk);
    if (!v.readTimes || typeof v.readTimes !== 'object') v.readTimes = {};
    if (!v.readTimes[dk]) v.readTimes[dk] = Date.now();
  }
  var CAL_SELECTED = null;

  var FUTURE_DEFAULT_DAYS = 90, FUTURE_MAX_DAYS = 365;
  var MONTH_ORD_FA = ['اول','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم','دهم','یازدهم','دوازدهم','سیزدهم'];
  function getFutureDays(){
    var n = parseInt(state && state.futureCalDays, 10);
    if (!n || n < 1) return FUTURE_DEFAULT_DAYS;
    return Math.min(n, FUTURE_MAX_DAYS);
  }

  function dpGetNeural(){
    var dn = null;
    try { if (typeof ensureDispenzaNeural === 'function') dn = ensureDispenzaNeural(); } catch(e){ console.warn('[dispenza-neural]', e); }
    if (!dn || typeof dn !== 'object'){
      if (!state.dispenzaNeural || typeof state.dispenzaNeural !== 'object') state.dispenzaNeural = {};
      dn = state.dispenzaNeural;
    }
    if (!dn.logs || typeof dn.logs !== 'object') dn.logs = {};
    if (!dn.pendingManual || typeof dn.pendingManual !== 'object') dn.pendingManual = {};
    return dn;
  }

  function ensureState(){
    if (typeof state === 'undefined' || !state) return false;
    if (!state.dispenzaDailyProgress) state.dispenzaDailyProgress = {};
    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (!state.dispenzaPossibilities) state.dispenzaPossibilities = {};
    if (!state.practiceEmotions) state.practiceEmotions = {};
    if (!Array.isArray(state.rasSignals)) state.rasSignals = [];
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
      if (!Array.isArray(state.currentBelief.visualVideos)) state.currentBelief.visualVideos = [];
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

  var FEEL_LEVEL_FA = { strong: 'پرقدرت', normal: 'معمولی', weak: 'ضعیف' };
  function dpDayEmotion(dk){
    var em = state.practiceEmotions || {};
    var rec = em[dk] && em[dk].dispenza;
    if (!rec || !rec.after || !rec.after.length) return null;
    var maxFreq = 0, names = [];
    rec.after.forEach(function(id){
      var e = (typeof EMOTION_BY_ID !== 'undefined') ? EMOTION_BY_ID[id] : null;
      if (!e) return;
      names.push(e.fa);
      if (e.freq > maxFreq) maxFreq = e.freq;
    });
    if (maxFreq <= 0) return null;
    var level = maxFreq >= 500 ? 'strong' : (maxFreq < 200 ? 'weak' : 'normal');
    return { level: level, names: names };
  }
  var HEART_SVG = '<svg viewBox="0 0 24 24" width="62%" height="62%" aria-hidden="true" style="display:block;">' +
    '<path fill="#fff" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

  /* ============ راهنما ============ */
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
        '<h3>🌱 این اپ چیه؟</h3>' +
        '<p>این اپ یه فضای شخصیه. سه بخش داره که با هم کار می‌کنن:</p>' +
        '<ul>' +
          '<li><b>شناخت:</b> اینجا الگوهای ذهنی‌ات رو می‌شناسی. طرحواره‌ها، موقعیت‌ها، چرخه‌های تکرارشونده.</li>' +
          '<li><b>هدف‌گذاری (نقشه):</b> روی نقشه، هدف‌هات رو می‌بینی و مسیرت رو ترسیم می‌کنی.</li>' +
          '<li><b>تمرین (باورها و فراوانی):</b> تمرین‌هایی که بهت کمک می‌کنن حس و حالت درونت رو ببینی و نگه داری.</li>' +
        '</ul>' +
        '<p>هدف اصلی، <b>شناختن خودته</b>. تمرین‌های دیگه فقط ابزارن — کمک می‌کنن با چشم باز، احساست رو ببینی و توی لحظه بمونی.</p>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🌌 قلمرو ممکن‌ها چیه؟</h3>' +
        '<p>این یه <b>استعاره</b>ست که از فیزیک کوانتوم وام گرفته‌ایم تا بتونیم درباره‌ی ذهن حرف بزنیم. در فیزیک، «برهم‌نهی» یعنی یک ذره تا وقتی اندازه‌گیری نشده، در همه‌ی حالت‌های ممکن به‌طور هم‌زمان قرار داره.</p>' +
        '<p>ما همین ایده رو به <b>ذهن</b> تعمیم می‌دیم: مغز تو هم پر از مسیرهای عصبیِ بالقوه‌ست که هنوز فعال نشدن. واقعیت امروز تو، فقط عادت‌ترین مسیر عصبیِ فعلی‌ست — بقیه هنوز به‌صورت «موج» در ذهنت وجود دارن.</p>' +
        '<p style="background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;"><b>یه نکته:</b> تو چیز جدیدی از بیرون «نمی‌سازی» — فقط با تمرین، مسیرهای عصبی تازه‌ای رو در ذهنت تقویت می‌کنی.</p>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🕳️ «هیچ شدن» یعنی چی؟</h3>' +
        '<p>عبارت «No body, no one, no thing, no where, in no time» یعنی: بدون بدن، بدون شخص، بدون چیز، بدون مکان، توی هیچ زمانی. این‌ها معنای فیزیکی ندارن — یعنی <b>رها کردن هویت‌هایی که بهشون عادت کردی</b>.</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin:10px 0;">' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">🫀 بدن — من بدنم نیستم</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">توجهت از درد، خستگی و حس‌های جسمی جدا می‌شه.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">👤 هویت — من اون شخص نیستم</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">اسم، نقش، شغل، گذشته — همه‌شون یه لایه‌ن. می‌ذاریشون کنار.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">📦 اشیا — وابستگی رو رها کن</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">به دارایی‌ها و چیزهای بیرونی گره نمی‌خوری.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">📍 مکان — اینجا و آنجا معنی نداره</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">آگاهی به یه جای خاص گره نخورده.</div></div>' +
          '<div style="padding:10px 12px;background:rgba(43,191,171,.06);border-right:3px solid var(--emerald-300);border-radius:8px;"><div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:3px;">⏳ زمان — فقط حال می‌مونه</div><div style="font-size:11.5px;color:var(--ink-soft);line-height:1.75;">گذشته و آینده رها می‌شن. همین لحظه کافیه.</div></div>' +
        '</div>' +
        '<p style="background:rgba(244,197,66,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #f4c542;"><b>این «هیچ» منفی نیست.</b> مثل صفحه‌ی سفیده — همه‌چیز رو توی خودش جا می‌ده.</p>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🔗 «هیچ شدن» و «درخواست» چطور به هم ربط دارن؟</h3>' +
        '<p>درخواست یعنی التماس از یه نیروی بیرونی؟ نه.</p>' +
        '<p>درخواست واقعی، فرستادن یه سیگنال مشخص به میدانه. ولی این سیگنال، فقط وقتی درست فرستاده می‌شه که تو «هیچ» شده باشی.</p>' +
        '<p>وقتی «هیچ» می‌شی، از جای <b>کلیت</b> و <b>فراوانی</b> حرف می‌زنی — نه از جای کمبود.</p>' +
      '</div>' +
      '<div class="help-section">' +
        '<h3>🧘 پنج مرحله‌ی عملی</h3>' +
        '<ol style="padding-inline-start:20px;line-height:2;font-size:12.5px;color:var(--text-dim);">' +
          '<li><b>رهاسازی:</b> بدنت رو آروم می‌کنی. از حالت «بقا» بیرون میای.</li>' +
          '<li><b>هیچ شدن:</b> توجه رو از بدن، محیط و هویت «من» برمی‌داری.</li>' +
          '<li><b>اتصال:</b> توی همین خالی بودن، آگاهیت رو به قلمرو ممکن‌ها وصل می‌کنی.</li>' +
          '<li><b>کاشتن بذر:</b> یه تصویر واضح از واقعیت دلخواهت توی ذهن می‌کاری.</li>' +
          '<li><b>احساس فراوانی:</b> حسِ اون واقعیت رو توی بدنت می‌سازی — تا فرکانست هماهنگ شه.</li>' +
        '</ol>' +
      '</div>';
    modalActions.parentNode.insertBefore(wrap, modalActions);
  }

  /* ============ قالب‌بندی متن ============ */
  var FMT_MIN = 10, FMT_MAX = 40;
  var FMT_DEFAULT = { font: '', size: 13, align: 'right', bold: false, italic: true };
  var FUTURE_FONTS = [
    { id: '',         label: 'پیش‌فرض',          css: '' },
    { id: 'nazanin',  label: 'بی نازنین (B Nazanin)', css: "'bp-nazanin','B Nazanin',serif" },
    { id: 'titr',     label: 'بی تیتر (B Titr)',     css: "'bp-titr','B Titr',serif" },
    { id: 'nastaliq', label: 'نستعلیق',              css: "'bp-nastaliq','IranNastaliq','Noto Nastaliq Urdu',serif" },
    { id: 'zar',      label: 'بی زر (B Zar)',        css: "'bp-zar','B Zar',serif" },
    { id: 'arial',    label: 'Arial',                css: "Arial,'Helvetica Neue',sans-serif" },
    { id: 'times',    label: 'Times New Roman',      css: "'Times New Roman',Times,serif" }
  ];
  function fmtFontCss(id){
    for (var i = 0; i < FUTURE_FONTS.length; i++) if (FUTURE_FONTS[i].id === id) return FUTURE_FONTS[i].css;
    return '';
  }
  function getFutureFmt(){
    if (!state.futureTextFmt || typeof state.futureTextFmt !== 'object') state.futureTextFmt = {};
    var f = state.futureTextFmt;
    Object.keys(FMT_DEFAULT).forEach(function(k){ if (f[k] === undefined) f[k] = FMT_DEFAULT[k]; });
    f.size = Math.max(FMT_MIN, Math.min(FMT_MAX, parseInt(f.size, 10) || FMT_DEFAULT.size));
    if (['right','center','left'].indexOf(f.align) === -1) f.align = 'right';
    return f;
  }
  function fmtAlignSvg(type){
    var w = { right: [14, 9, 12], center: [14, 9, 12], left: [14, 9, 12] }[type];
    var lines = '';
    for (var i = 0; i < 3; i++){
      var len = w[i], x = type === 'right' ? 16 - len : (type === 'left' ? 2 : 9 - len / 2);
      lines += '<rect x="' + x + '" y="' + (3 + i * 5) + '" width="' + len + '" height="2" rx="1" fill="currentColor"/>';
    }
    return '<svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">' + lines + '</svg>';
  }
  function fmtBarHtml(){
    var opts = FUTURE_FONTS.map(function(f){ return '<option value="' + f.id + '">' + f.label + '</option>'; }).join('');
    return '<div id="future-fmt-bar" class="fmt-bar">' +
      '<select id="fmt-font" class="fmt-select" aria-label="فونت">' + opts + '</select>' +
      '<div class="fmt-row">' +
        '<button type="button" class="fmt-btn" data-fmt="size-" title="کوچک‌تر">A−</button>' +
        '<span id="fmt-size-val" class="fmt-size-val">۱۳</span>' +
        '<button type="button" class="fmt-btn" data-fmt="size+" title="بزرگ‌تر">A+</button>' +
        '<span class="fmt-sep"></span>' +
        '<button type="button" class="fmt-btn" data-fmt="align-right" title="راست‌چین">' + fmtAlignSvg('right') + '</button>' +
        '<button type="button" class="fmt-btn" data-fmt="align-center" title="وسط‌چین">' + fmtAlignSvg('center') + '</button>' +
        '<button type="button" class="fmt-btn" data-fmt="align-left" title="چپ‌چین">' + fmtAlignSvg('left') + '</button>' +
        '<span class="fmt-sep"></span>' +
        '<button type="button" class="fmt-btn" data-fmt="bold" title="بولد" style="font-weight:900;">B</button>' +
        '<button type="button" class="fmt-btn" data-fmt="italic" title="ایتالیک" style="font-style:italic;font-family:Georgia,serif;">I</button>' +
      '</div>' +
    '</div>';
  }
  function applyFutureFmt(){
    if (typeof state === 'undefined' || !state) return;
    var f = getFutureFmt();
    var css = fmtFontCss(f.font);
    ['future-display', 'future-editor-input'].forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      el.style.fontFamily = css || (id === 'future-editor-input' ? 'inherit' : '');
      el.style.fontSize = f.size + 'px';
      el.style.fontWeight = f.bold ? '800' : '400';
      el.style.fontStyle = f.italic ? 'italic' : 'normal';
      el.style.textAlign = f.align;
    });
    var sel = document.getElementById('fmt-font');
    if (sel) sel.value = f.font;
    var sv = document.getElementById('fmt-size-val');
    if (sv) sv.textContent = toFa(f.size);
    document.querySelectorAll('.fmt-btn[data-fmt]').forEach(function(b){
      var a = b.getAttribute('data-fmt'), on = false;
      if (a === 'bold') on = f.bold;
      else if (a === 'italic') on = f.italic;
      else if (a.indexOf('align-') === 0) on = f.align === a.slice(6);
      b.classList.toggle('active', on);
    });
  }
  function saveFutureFmt(f){
    state.futureTextFmt = f;
    try { saveState(); } catch(e){}
    applyFutureFmt();
    var input = document.getElementById('future-editor-input');
    if (input && input.offsetParent !== null) fgrow(input);
  }
  function handleFmtClick(btn){
    var f = getFutureFmt();
    var a = btn.getAttribute('data-fmt');
    if (a === 'size-') f.size = Math.max(FMT_MIN, f.size - 1);
    else if (a === 'size+') f.size = Math.min(FMT_MAX, f.size + 1);
    else if (a === 'bold') f.bold = !f.bold;
    else if (a === 'italic') f.italic = !f.italic;
    else if (a.indexOf('align-') === 0) f.align = a.slice(6);
    saveFutureFmt(f);
  }

  /* ============ ویدیو در تصویرسازی ============ */
  var VV_MAX_MB = 300;
  var vvDbPromise = null;
  var vvUrls = {};

  function vvDb(){
  if (vvDbPromise) return vvDbPromise;
  vvDbPromise = new Promise(function(resolve, reject){
    if (!window.indexedDB){ reject(new Error('no-idb')); return; }
    var req;
    /* بدون شماره‌ی نسخه باز می‌کنیم تا ارتقای اجباری پشت تب/اتصال قدیمی گیر نکند */
    try { req = indexedDB.open('beliefs-patch-media'); } catch(e){ reject(e); return; }
    req.onupgradeneeded = function(){
      var db = req.result;
      if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos');
    };
    req.onsuccess = function(){
      var db = req.result;
      db.onversionchange = function(){ try { db.close(); } catch(e){} vvDbPromise = null; };
      db.onclose = function(){ vvDbPromise = null; };
      resolve(db);
    };
    req.onerror = function(){ reject(req.error); };
    req.onblocked = function(){};
  });
  vvDbPromise.catch(function(){ vvDbPromise = null; });
  return vvDbPromise;
}
  function vvTx(mode, fn){
    return vvDb().then(function(db){
      return new Promise(function(resolve, reject){
        var tx = db.transaction('videos', mode);
        var out = fn(tx.objectStore('videos'));
        tx.oncomplete = function(){ resolve(out && out.result); };
        tx.onerror = function(){ reject(tx.error); };
        tx.onabort = function(){ reject(tx.error); };
      });
    });
  }
  function vvPut(id, blob){ return vvTx('readwrite', function(st){ return st.put(blob, id); }); }
  function vvGet(id){ return vvTx('readonly', function(st){ return st.get(id); }); }
  function vvDel(id){ return vvTx('readwrite', function(st){ return st.delete(id); }); }
   
/* --- ذخیره‌ی عکس‌ها در IndexedDB جداگانه (با زمان‌سنج تا هیچ‌وقت گیر نکند) --- */
var vgDbPromise = null;
function vgDb(){
  if (vgDbPromise) return vgDbPromise;
  vgDbPromise = new Promise(function(resolve, reject){
    if (!window.indexedDB){ reject(new Error('no-idb')); return; }
    var req;
    try { req = indexedDB.open('beliefs-patch-images', 1); } catch(e){ reject(e); return; }
    req.onupgradeneeded = function(){
      var db = req.result;
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
    };
    req.onsuccess = function(){
      var db = req.result;
      db.onversionchange = function(){ try { db.close(); } catch(e){} vgDbPromise = null; };
      db.onclose = function(){ vgDbPromise = null; };
      resolve(db);
    };
    req.onerror = function(){ reject(req.error); };
  });
  vgDbPromise.catch(function(){ vgDbPromise = null; });
  return vgDbPromise;
}
function vgWithTimeout(p, ms){
  return new Promise(function(resolve, reject){
    var done = false;
    var tm = setTimeout(function(){ if (!done){ done = true; reject(new Error('timeout')); } }, ms || 6000);
    p.then(function(v){ if (!done){ done = true; clearTimeout(tm); resolve(v); } },
           function(e){ if (!done){ done = true; clearTimeout(tm); reject(e); } });
  });
}
function vgTx(mode, fn){
  return vgWithTimeout(vgDb().then(function(db){
    return new Promise(function(resolve, reject){
      var tx = db.transaction('images', mode);
      var out = fn(tx.objectStore('images'));
      tx.oncomplete = function(){ resolve(out && out.result); };
      tx.onerror = function(){ reject(tx.error); };
      tx.onabort = function(){ reject(tx.error); };
    });
  }), 8000);
}
/* عکس‌های نسخه‌ی قبلی ممکن است توی دیتابیس مدیا بوده باشند؛ بدون ارتقا فقط می‌خوانیم */
function vgLegacyGet(id){
  return vgWithTimeout(vvDb().then(function(db){
    if (!db.objectStoreNames.contains('images')) return null;
    return new Promise(function(resolve, reject){
      var tx = db.transaction('images', 'readonly');
      var rq = tx.objectStore('images').get(id);
      tx.oncomplete = function(){ resolve(rq.result || null); };
      tx.onerror = function(){ reject(tx.error); };
      tx.onabort = function(){ reject(tx.error); };
    });
  }), 4000).catch(function(){ return null; });
}
function vgPutBlob(id, blob){ return vgTx('readwrite', function(st){ return st.put(blob, id); }); }
function vgGetBlob(id){
  return vgTx('readonly', function(st){ return st.get(id); }).then(function(b){
    return b || vgLegacyGet(id);
  }, function(){ return vgLegacyGet(id); });
}
function vgDelBlob(id){ return vgTx('readwrite', function(st){ return st.delete(id); }); }

  function vvList(){
    var cb = state && state.currentBelief;
    if (!cb) return [];
    if (!Array.isArray(cb.visualVideos)) cb.visualVideos = [];
    return cb.visualVideos;
  }
  function vvIsReferenced(id){
    if (vvList().some(function(v){ return v.id === id; })) return true;
    return (state.dpSeedArchive || []).some(function(it){
      return (it.videos || []).some(function(v){ return v.id === id; });
    });
  }
  function vvCleanup(list){
    (list || []).forEach(function(v){
      if (vvIsReferenced(v.id)) return;
      if (vvUrls[v.id]){ try { URL.revokeObjectURL(vvUrls[v.id]); } catch(e){} delete vvUrls[v.id]; }
      vvDel(v.id).catch(function(){});
    });
  }
  function vvFmtSize(b){
    if (!b) return '';
    var mb = b / 1048576;
    return toFa(mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10) + ' مگابایت';
  }

  function vvAddFiles(files){
    if (!files || !files.length) return;
    var list = Array.prototype.slice.call(files).filter(function(f){
      return f && ((f.type && f.type.indexOf('video/') === 0) || /\.(mp4|mov|m4v|webm|3gp|mkv)$/i.test(f.name || ''));
    });
    if (!list.length){ if (typeof toast === 'function') toast('فقط فایل ویدیو انتخاب کن'); return; }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}
    var added = 0, tooBig = 0, failed = 0;
    list.reduce(function(chain, f){
      return chain.then(function(){
        if (f.size > VV_MAX_MB * 1048576){ tooBig++; return; }
        var id = 'vid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        return vvPut(id, f).then(function(){
          vvList().push({ id: id, name: f.name || 'video', type: f.type || 'video/mp4', size: f.size, date: dpTodayKey() });
          added++;
        }).catch(function(){ failed++; });
      });
    }, Promise.resolve()).then(function(){
      if (added){ try { saveState(); } catch(e){} autoPracticeFiber('visual'); }
      renderVisualVideos();
      if (typeof toast !== 'function') return;
      if (added && !tooBig && !failed) toast(added > 1 ? toFa(added) + ' ویدیو اضافه شد 🎬' : 'ویدیو اضافه شد 🎬');
      else if (tooBig) toast('ویدیو بزرگ‌تر از ' + toFa(VV_MAX_MB) + ' مگابایت اضافه نمی‌شه');
      else if (failed) toast('ذخیره‌ی ویدیو ممکن نشد (حافظه یا مرورگر)');
    });
  }

  function vvRemove(id){
    if (!window.confirm('این ویدیو حذف شود؟')) return;
    var arr = vvList();
    var removed = arr.filter(function(v){ return v.id === id; });
    var cb = state.currentBelief;
    cb.visualVideos = arr.filter(function(v){ return v.id !== id; });
    try { saveState(); } catch(e){}
    vvCleanup(removed);
    renderVisualVideos();
    if (typeof toast === 'function') toast('ویدیو حذف شد');
  }

  function renderVisualVideos(){
    var box = document.getElementById('visual-video-gallery');
    if (!box) return;
    var vids = vvList();
    var sig = vids.map(function(v){ return v.id; }).join('|');
    if (box.getAttribute('data-sig') === sig && box.getAttribute('data-built') === '1') return;
    box.setAttribute('data-sig', sig);
    box.setAttribute('data-built', '1');
    if (!vids.length){ box.innerHTML = ''; return; }
    box.innerHTML = vids.map(function(v){
      return '<div class="vv-item">' +
        '<video controls playsinline preload="metadata" data-vv="' + v.id + '"></video>' +
        '<button type="button" class="vv-del" data-vv-del="' + v.id + '" title="حذف ویدیو">×</button>' +
        '<div class="vv-cap">🎬 ' + escapeHtml(v.name || 'video') + (v.size ? ' • ' + vvFmtSize(v.size) : '') + '</div>' +
      '</div>';
    }).join('');
    vids.forEach(function(v){
      var el = box.querySelector('video[data-vv="' + v.id + '"]');
      if (!el) return;
      if (vvUrls[v.id]){ el.src = vvUrls[v.id]; return; }
      vvGet(v.id).then(function(blob){
        if (!blob) throw new Error('missing');
        vvUrls[v.id] = URL.createObjectURL(blob);
        el.src = vvUrls[v.id];
      }).catch(function(){
        var item = el.closest('.vv-item');
        if (item){
          var msg = document.createElement('div');
          msg.className = 'vv-missing';
          msg.textContent = 'فایل این ویدیو روی این دستگاه پیدا نشد.';
          el.replaceWith(msg);
        }
      });
    });
  }

  /* ============ آلبوم عکس‌ها ============ */
  var VG_MAX_DIM = 1400, VG_QUALITY = 0.82, VG_CROP_MAX = 1600, VC_MIN = 30;
  var VG_VIEW = { idx: 0, open: false, prevOverflow: '' };
  var VC = null;
  var VG_SRC = null;

  function vgClamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function vgImages(){
    if (VG_SRC) return VG_SRC.get() || [];
    if (!state.currentBelief) state.currentBelief = {};
    var cb = state.currentBelief;
    if (!Array.isArray(cb.visualImages)) cb.visualImages = [];
    return cb.visualImages;
  }

  function vgFileToBlob(file){
  return new Promise(function(resolve, reject){
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function(){
      try {
        var w = img.naturalWidth, h = img.naturalHeight;
        var sc = Math.min(1, VG_MAX_DIM / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * sc)), ch = Math.max(1, Math.round(h * sc));
        var c = document.createElement('canvas'); c.width = cw; c.height = ch;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        c.toBlob(function(blob){
          if (blob) resolve({ blob: blob, w: cw, h: ch });
          else reject(new Error('blob'));
        }, 'image/jpeg', VG_QUALITY);
      } catch(e){ URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}

  function vgAddFiles(files){
  if (!files || !files.length) return;
  var list = Array.prototype.slice.call(files).filter(function(f){
    return f && ((f.type && f.type.indexOf('image/') === 0) || /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(f.name || ''));
  });
  if (!list.length){ if (typeof toast === 'function') toast('فقط فایل عکس انتخاب کن'); return; }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}
  var added = 0, failed = 0;
  list.reduce(function(chain, f){
    return chain.then(function(){
      return vgFileToBlob(f).then(function(res){
        var id = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        return vgPutBlob(id, res.blob).then(function(){
          vgImages().push({ id: id, w: res.w, h: res.h });
          added++;
        });
      }).catch(function(){ failed++; });
    });
  }, Promise.resolve()).then(function(){
    if (added){ try { saveState(); } catch(e){} autoPracticeFiber('visual'); }
    renderVisualGalleryMine();
    if (typeof toast !== 'function') return;
    if (added && !failed) toast(added > 1 ? toFa(added) + ' عکس اضافه شد 🖼️' : 'عکس اضافه شد 🖼️');
    else if (added) toast(toFa(added) + ' عکس اضافه شد؛ ' + toFa(failed) + ' تا خوانده نشد');
    else toast('عکس خوانده نشد (فرمت پشتیبانی نمی‌شه)');
  });
}

  function vgDataUrlToBlob(u){
    try {
      var m = /^data:([^;,]+)?(;base64)?,(.*)$/.exec(u);
      if (!m) return null;
      var bin = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
      var arr = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: m[1] || 'image/jpeg' });
    } catch(e){ return null; }
  }
  var vgThumbUrls = {};
  function vgMarkMissing(el){
    if (!el) return;
    var b = el.closest ? el.closest('.vg-thumb') : null;
    if (b){ b.classList.add('vg-missing'); }
    try { el.removeAttribute('src'); } catch(e){}
  }
  function vgLoadThumb(im, box, tries){
    var el = box.querySelector('img[data-img-id="' + im.id + '"]');
    if (!el) return;
    if (vgThumbUrls[im.id]){ el.src = vgThumbUrls[im.id]; return; }
    vgGetBlob(im.id).then(function(blob){
      if (!blob){ vgMarkMissing(el); vgShowCleanup(); return; }
      vgThumbUrls[im.id] = URL.createObjectURL(blob);
      el.src = vgThumbUrls[im.id];
    }).catch(function(){
      if ((tries || 0) < 2) setTimeout(function(){ vgLoadThumb(im, box, (tries || 0) + 1); }, 600 * ((tries || 0) + 1));
      else { vgMarkMissing(el); vgShowCleanup(); }
    });
  }

  function vgShowCleanup(){
    var box = document.getElementById('visual-gallery');
    if (!box || box.querySelector('#vg-clean-btn')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'vg-clean-btn'; b.className = 'btn tiny';
    b.style.cssText = 'margin-top:8px;width:100%;';
    b.textContent = '🧹 پاک‌کردن عکس‌های خراب/خالی';
    b.addEventListener('click', function(ev){
      ev.stopPropagation();
      var bad = box.querySelectorAll('.vg-thumb.vg-missing');
      if (!bad.length){ b.remove(); return; }
      if (!window.confirm(bad.length + ' عکس خالی پاک شود؟')) return;
      var ids = {};
      bad.forEach(function(x){ var i = x.querySelector('img'); if (i) ids[i.getAttribute('data-img-id') || ''] = 1; });
      var list = vgImages();
      var keep = list.filter(function(im){ return !(im.id ? ids[im.id] : (!im.src && ids[''])); });
      if (VG_SRC){ list.length = 0; keep.forEach(function(x){ list.push(x); }); }
      else state.currentBelief.visualImages = keep;
      try { saveState(); } catch(e){}
      box.removeAttribute('data-sig');
      renderVisualGalleryMine();
      if (typeof toast === 'function') toast('عکس‌های خالی پاک شد');
    });
    box.appendChild(b);
  }

  function renderVisualGalleryMine(){
  var box = document.getElementById('visual-gallery');
  if (!box || typeof state === 'undefined' || !state) return;
  var imgs = vgImages();
  var sig = imgs.map(function(x){ return x.id || (x.src ? 'src-' + x.src.length : ''); }).join('|');
  if (box.getAttribute('data-sig') === sig && (!imgs.length || box.querySelector('.vg-grid'))) return;
  box.setAttribute('data-sig', sig);
  if (!imgs.length){ box.innerHTML = ''; return; }
  box.innerHTML =
    '<div class="vg-grid">' +
      imgs.map(function(im, i){
        var src = im.src ? escapeHtml(im.src) : '';
        return '<button type="button" class="vg-thumb" data-vg-open="' + i + '"><img data-img-id="' + (im.id || '') + '"' + (src ? ' src="' + src + '"' : '') + ' alt="" draggable="false"></button>';
      }).join('') +
    '</div>';
  imgs.forEach(function(im){
    /* عکس‌های قدیمیِ base64 را یک‌بار به IndexedDB منتقل می‌کنیم تا با ریستارت خراب نشوند */
    if (im.src && !im.id && /^data:/.test(im.src)){
      var b = vgDataUrlToBlob(im.src);
      if (b){
        var nid = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        vgPutBlob(nid, b).then(function(){
          im.id = nid; delete im.src;
          try { saveState(); } catch(e){}
        }).catch(function(){});
      }
      return;
    }
    if (im.src || !im.id){
      if (!im.src && !im.id){
        var el0 = box.querySelector('img[data-img-id=""]');
        vgMarkMissing(el0);
      }
      return;
    }
    vgLoadThumb(im, box, 0);
  });
  }

  function vgEnsureViewer(){
    var v = document.getElementById('vg-viewer');
    if (v) return v;
    v = document.createElement('div');
    v.id = 'vg-viewer'; v.className = 'vg-viewer';
    v.innerHTML =
      '<div class="vg-top"><button type="button" id="vg-counter" class="vg-counter" data-vg="grid"></button>' +
        '<button type="button" class="vg-x" data-vg="close" aria-label="بستن">×</button></div>' +
      '<div class="vg-track" id="vg-track"></div>' +
      '<div class="vg-overview" id="vg-overview"></div>' +
      '<button type="button" class="vg-nav vg-prev" data-vg="prev" aria-label="قبلی">‹</button>' +
      '<button type="button" class="vg-nav vg-next" data-vg="next" aria-label="بعدی">›</button>' +
      '<div class="vg-bottom">' +
        '<button type="button" class="vg-act" data-vg="crop">✂️ برش</button>' +
        '<button type="button" class="vg-act vg-danger" data-vg="del">🗑 حذف</button>' +
      '</div>';
    document.body.appendChild(v);
    var track = v.querySelector('#vg-track'), timer = null;
    track.addEventListener('scroll', function(){ clearTimeout(timer); timer = setTimeout(vgSyncIndex, 60); });
    return v;
  }
  function vgUpdateCounter(){
    var c = document.getElementById('vg-counter');
    if (c) c.textContent = '▦  ' + toFa(VG_VIEW.idx + 1) + ' / ' + toFa(vgImages().length);
  }
  function vgBuildSlides(){
  var track = document.getElementById('vg-track');
  if (!track) return;
  var imgs = vgImages();
  track.innerHTML = imgs.map(function(im){
    var src = im.src ? escapeHtml(im.src) : '';
    return '<div class="vg-slide"><img data-img-id="' + (im.id || '') + '" src="' + src + '" alt="" draggable="false"></div>';
  }).join('');
  imgs.forEach(function(im){
    if (im.src || !im.id) return;
    vgGetBlob(im.id).then(function(blob){
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var el = track.querySelector('img[data-img-id="' + im.id + '"]');
      if (el) el.src = url;
    }).catch(function(){});
  });
}
  function vgSyncIndex(){
    var track = document.getElementById('vg-track');
    if (!track) return;
    var n = vgImages().length;
    VG_VIEW.idx = vgClamp(Math.round(track.scrollLeft / (track.clientWidth || 1)), 0, Math.max(0, n - 1));
    vgUpdateCounter();
  }
  function vgGoto(i, smooth){
    var track = document.getElementById('vg-track');
    if (!track) return;
    i = vgClamp(i, 0, Math.max(0, vgImages().length - 1));
    VG_VIEW.idx = i;
    try { track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' }); }
    catch(e){ track.scrollLeft = i * track.clientWidth; }
    vgUpdateCounter();
  }
  function vgPersist(){
    if (VG_SRC){ try { VG_SRC.changed(); } catch(e){} return; }
    try { saveState(); } catch(e){}
    renderVisualGalleryMine();
  }
  function vgOpenFrom(src, i){
    VG_SRC = src || null;
    vgOpen(i || 0);
    if (!VG_VIEW.open) VG_SRC = null;
  }
  function vgOpen(i){
    if (!vgImages().length) return;
    var v = vgEnsureViewer();
    vgBuildSlides();
    vgOverviewHide();
    v.style.display = 'flex';
    if (!VG_VIEW.open){ VG_VIEW.prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    VG_VIEW.open = true;
    vgGoto(i, false);
    if (window.requestAnimationFrame) requestAnimationFrame(function(){ vgGoto(i, false); });
  }
  function vgClose(){
    var v = document.getElementById('vg-viewer');
    vgOverviewHide();
    if (v) v.style.display = 'none';
    if (VG_VIEW.open) document.body.style.overflow = VG_VIEW.prevOverflow || '';
    VG_VIEW.open = false;
    VG_SRC = null;
  }
  function vgDeleteCurrent(){
  var imgs = vgImages(), im = imgs[VG_VIEW.idx];
  if (!im) return;
  if (!window.confirm('این عکس حذف شود؟')) return;
  if (VG_SRC){
    if (typeof VG_SRC.remove === 'function') VG_SRC.remove(im);
    else { var at = imgs.indexOf(im); if (at >= 0) imgs.splice(at, 1); }
    vgPersist();
  } else {
    state.currentBelief.visualImages = imgs.filter(function(x){ return x !== im; });
    if (im.id) vgDelBlob(im.id).catch(function(){});
    vgPersist();
  }
  var left = vgImages().length;
  if (!left){ vgClose(); if (typeof toast === 'function') toast('عکس حذف شد'); return; }
  vgBuildSlides();
  vgGoto(Math.min(VG_VIEW.idx, left - 1), false);
  if (typeof toast === 'function') toast('عکس حذف شد');
}
  function vgOverviewHide(){
    var o = document.getElementById('vg-overview');
    if (o) o.style.display = 'none';
  }
  function vgOverviewToggle(){
  var o = document.getElementById('vg-overview');
  if (!o) return;
  if (o.style.display === 'flex'){ o.style.display = 'none'; return; }
  var imgs = vgImages();
  o.innerHTML = imgs.map(function(im, i){
    var src = im.src ? escapeHtml(im.src) : '';
    return '<button type="button" class="vg-ov-thumb' + (i === VG_VIEW.idx ? ' active' : '') + '" data-vg-go="' + i + '"><img data-img-id="' + (im.id || '') + '" src="' + src + '" alt="" draggable="false"></button>';
  }).join('');
  o.style.display = 'flex';
  imgs.forEach(function(im){
    if (im.src || !im.id) return;
    vgGetBlob(im.id).then(function(blob){
      if (!blob) return;
      var url = URL.createObjectURL(blob);
      var el = o.querySelector('img[data-img-id="' + im.id + '"]');
      if (el) el.src = url;
    }).catch(function(){});
  });
  var cur = o.querySelector('.active');
  if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
}
  function vgAction(a){
    if (a === 'grid'){ vgOverviewToggle(); return; }
    if (a === 'close') vgClose();
    else if (a === 'prev') vgGoto(VG_VIEW.idx - 1, true);
    else if (a === 'next') vgGoto(VG_VIEW.idx + 1, true);
    else if (a === 'crop') vcOpen(VG_VIEW.idx);
    else if (a === 'del') vgDeleteCurrent();
  }

  /* ============ ابزار برش ============ */
  function vcEnsure(){
    var m = document.getElementById('vc-modal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'vc-modal'; m.className = 'vc-modal';
    m.innerHTML =
      '<div class="vc-ratios" id="vc-ratios">' +
        '<button type="button" class="vc-ratio active" data-vc-ratio="0">آزاد</button>' +
        '<button type="button" class="vc-ratio" data-vc-ratio="1">۱:۱</button>' +
        '<button type="button" class="vc-ratio" data-vc-ratio="1.3333">۴:۳</button>' +
        '<button type="button" class="vc-ratio" data-vc-ratio="0.75">۳:۴</button>' +
        '<button type="button" class="vc-ratio" data-vc-ratio="1.7778">۱۶:۹</button>' +
        '<button type="button" class="vc-ratio" data-vc-ratio="0.5625">۹:۱۶</button>' +
      '</div>' +
      '<div class="vc-stage" id="vc-stage"><div class="vc-box" id="vc-box">' +
        '<img id="vc-img" alt="" draggable="false">' +
        '<div class="vc-rect" id="vc-rect"><i class="vc-h" data-h="nw"></i><i class="vc-h" data-h="ne"></i><i class="vc-h" data-h="sw"></i><i class="vc-h" data-h="se"></i></div>' +
      '</div></div>' +
      '<div class="vc-actions">' +
        '<button type="button" data-vc="cancel">انصراف</button>' +
        '<button type="button" class="vc-apply" data-vc="apply">✓ اعمال برش</button>' +
      '</div>';
    document.body.appendChild(m);

    m.addEventListener('click', function(e){
      var t = e.target;
      if (!t || !t.closest) return;
      var rb = t.closest('[data-vc-ratio]');
      if (rb){ vcSetRatio(parseFloat(rb.getAttribute('data-vc-ratio')) || 0); return; }
      var ab = t.closest('[data-vc]');
      if (ab){
        var a = ab.getAttribute('data-vc');
        if (a === 'cancel') vcClose(); else if (a === 'apply') vcApply();
      }
    });

    var rectEl = m.querySelector('#vc-rect');
    rectEl.addEventListener('pointerdown', function(e){
      if (!VC) return;
      e.preventDefault();
      var h = e.target && e.target.getAttribute ? e.target.getAttribute('data-h') : null;
      var br = m.querySelector('#vc-box').getBoundingClientRect();
      var start = { mode: h || 'move', cx: e.clientX, cy: e.clientY, bx: br.left, by: br.top,
        r: { x: VC.rect.x, y: VC.rect.y, w: VC.rect.w, h: VC.rect.h } };
      var mv = function(ev){ ev.preventDefault(); vcDrag(start, ev); };
      var up = function(){
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
      };
      window.addEventListener('pointermove', mv, { passive: false });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
    return m;
  }
  function vcApplyRect(){
    var r = document.getElementById('vc-rect');
    if (!r || !VC) return;
    r.style.left = VC.rect.x + 'px'; r.style.top = VC.rect.y + 'px';
    r.style.width = VC.rect.w + 'px'; r.style.height = VC.rect.h + 'px';
  }
  function vcDrag(st, ev){
    var W = VC.dispW, H = VC.dispH, r = st.r, rect = VC.rect;
    if (st.mode === 'move'){
      rect.w = r.w; rect.h = r.h;
      rect.x = vgClamp(r.x + ev.clientX - st.cx, 0, W - r.w);
      rect.y = vgClamp(r.y + ev.clientY - st.cy, 0, H - r.h);
    } else {
      var m = st.mode;
      var ax = (m === 'nw' || m === 'sw') ? r.x + r.w : r.x;
      var ay = (m === 'nw' || m === 'ne') ? r.y + r.h : r.y;
      var px = vgClamp(ev.clientX - st.bx, 0, W), py = vgClamp(ev.clientY - st.by, 0, H);
      var w = Math.max(Math.abs(px - ax), VC_MIN), h = Math.max(Math.abs(py - ay), VC_MIN);
      if (VC.ratio){ if (w / h > VC.ratio) w = h * VC.ratio; else h = w / VC.ratio; }
      w = Math.min(w, W); h = Math.min(h, H);
      rect.w = w; rect.h = h;
      rect.x = vgClamp(px >= ax ? ax : ax - w, 0, W - w);
      rect.y = vgClamp(py >= ay ? ay : ay - h, 0, H - h);
    }
    vcApplyRect();
  }
  function vcSetRatio(ratio){
    if (!VC) return;
    VC.ratio = ratio || null;
    document.querySelectorAll('#vc-ratios .vc-ratio').forEach(function(b){
      b.classList.toggle('active', Math.abs((parseFloat(b.getAttribute('data-vc-ratio')) || 0) - (VC.ratio || 0)) < 0.001);
    });
    if (VC.ratio){
      var r = VC.rect, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      var w = r.w, h = w / VC.ratio;
      if (h > r.h){ h = r.h; w = h * VC.ratio; }
      r.w = w; r.h = h;
      r.x = vgClamp(cx - w / 2, 0, VC.dispW - w);
      r.y = vgClamp(cy - h / 2, 0, VC.dispH - h);
      vcApplyRect();
    }
  }
  function vcOpen(idx){
  var im = vgImages()[idx];
  if (!im) return;
  var m = vcEnsure();
  var img = m.querySelector('#vc-img');
  VC = { idx: idx, ratio: null, rect: { x: 0, y: 0, w: 0, h: 0 }, dispW: 0, dispH: 0 };
  document.querySelectorAll('#vc-ratios .vc-ratio').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-vc-ratio') === '0');
  });
  m.style.display = 'flex';
  img.onload = function(){
    var st = m.querySelector('#vc-stage');
    var sw = Math.max(50, st.clientWidth - 24), sh = Math.max(50, st.clientHeight - 24);
    var sc = Math.min(sw / img.naturalWidth, sh / img.naturalHeight);
    VC.dispW = Math.round(img.naturalWidth * sc);
    VC.dispH = Math.round(img.naturalHeight * sc);
    var box = m.querySelector('#vc-box');
    box.style.width = VC.dispW + 'px'; box.style.height = VC.dispH + 'px';
    VC.rect = { x: 0, y: 0, w: VC.dispW, h: VC.dispH };
    vcApplyRect();
  };
  if (im.src){ img.src = im.src; }
  else if (im.id){
    vgGetBlob(im.id).then(function(blob){
      if (!blob) return;
      img.src = URL.createObjectURL(blob);
    }).catch(function(){});
  }
}
  function vcClose(){
    var m = document.getElementById('vc-modal');
    if (m) m.style.display = 'none';
    VC = null;
  }
  function vcApply(){
  if (!VC) return;
  var idx = VC.idx;
  try {
    var img = document.getElementById('vc-img');
    var k = img.naturalWidth / VC.dispW;
    var sx = VC.rect.x * k, sy = VC.rect.y * k, sw = VC.rect.w * k, sh = VC.rect.h * k;
    var out = Math.min(1, VG_CROP_MAX / Math.max(sw, sh));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(sw * out)); c.height = Math.max(1, Math.round(sh * out));
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    var im = vgImages()[idx];
    if (!im) throw new Error('no-image');

    c.toBlob(function(newBlob){
      if (!newBlob){ if (typeof toast === 'function') toast('برش انجام نشد'); return; }
      if (im.id){
        im.w = c.width; im.h = c.height;
        vgPutBlob(im.id, newBlob).then(function(){
          vcClose();
          vgPersist();
          var track = document.getElementById('vg-track');
          var slide = track && track.children[idx];
          if (slide){
            var ii = slide.querySelector('img[data-img-id="' + im.id + '"]');
            if (ii){
              try { URL.revokeObjectURL(ii.src); } catch(e){}
              ii.src = URL.createObjectURL(newBlob);
            }
          }
          if (typeof toast === 'function') toast('برش اعمال شد ✂️');
        }).catch(function(){
          if (typeof toast === 'function') toast('برش انجام نشد');
        });
      } else if (im.src){
        var fr = new FileReader();
        fr.onload = function(){
          im.src = fr.result;
          vcClose();
          vgPersist();
          if (typeof toast === 'function') toast('برش اعمال شد ✂️');
        };
        fr.readAsDataURL(newBlob);
      }
    }, 'image/jpeg', 0.9);
  } catch(e){
    if (typeof toast === 'function') toast('برش انجام نشد');
  }
}
  
/* =====================================================================
   موج‌های سینوسی نامنظم
   ===================================================================== */
var LAYER_WAVE = {
  body:  { baseR: 105, amp: 11.0, freq: 3, phase: 0.0 },
  one:   { baseR: 88,  amp: 9.5,  freq: 4, phase: 0.8 },
  thing: { baseR: 72,  amp: 8.0,  freq: 5, phase: 1.6 },
  where: { baseR: 56,  amp: 6.5,  freq: 6, phase: 2.4 },
  time:  { baseR: 40,  amp: 5.0,  freq: 7, phase: 3.2 }
};
var PURE_WAVE = { baseR: 26, amp: 1.6, freq: 8, phase: 0 };

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
  if (typeof state === 'undefined' || !state || !state.nothingProgress) return [];
  var k = dpTodayKey();
  return Array.isArray(state.nothingProgress[k]) ? state.nothingProgress[k].slice() : [];
}

function animateNothingWaves(t){
  if (!lastWaveFrame || t - lastWaveFrame > 42){
    wavePhase += 0.045;
    lastWaveFrame = t;
    var done = getDoneNothingLayers();
    Object.keys(LAYER_WAVE).forEach(function(k){
      var p = LAYER_WAVE[k];
      var isDone = done.indexOf(k) !== -1;
      var path = document.getElementById('nw-' + k);
      if (!path) return;

      if (waveAmpCurrent[k] === undefined) waveAmpCurrent[k] = isDone ? 0 : p.amp;

      var targetAmp = isDone ? 0 : p.amp;
      waveAmpCurrent[k] += (targetAmp - waveAmpCurrent[k]) * WAVE_EASE;
      if (Math.abs(waveAmpCurrent[k] - targetAmp) < 0.02) waveAmpCurrent[k] = targetAmp;
      var amp = waveAmpCurrent[k];

      var settled = isDone && amp <= 0.03;
      var freq = settled ? PURE_WAVE.freq : p.freq;
      var basePhase = settled ? PURE_WAVE.phase : p.phase;
      var phase = basePhase + wavePhase * (settled ? 1.8 : 1);
      path.setAttribute('d', buildSinePath(p.baseR, amp, freq, phase));

      var ratio = p.amp > 0 ? Math.max(0, Math.min(1, amp / p.amp)) : 0;
      path.style.opacity = (0.4 + ratio * 0.38).toFixed(2);
    });
    var pure = document.getElementById('nw-pure');
    if (pure){
      var allDone = done.length >= 5;
      if (pureAmpCurrent === null) pureAmpCurrent = allDone ? 0 : PURE_WAVE.amp;
      var targetPureAmp = allDone ? 0 : PURE_WAVE.amp;
      pureAmpCurrent += (targetPureAmp - pureAmpCurrent) * WAVE_EASE;
      if (Math.abs(pureAmpCurrent - targetPureAmp) < 0.02) pureAmpCurrent = targetPureAmp;
      var wiggle = Math.sin(wavePhase * 2) * 0.5 * (pureAmpCurrent / PURE_WAVE.amp);
      pure.setAttribute('d', buildSinePath(
        PURE_WAVE.baseR,
        pureAmpCurrent + wiggle,
        PURE_WAVE.freq,
        PURE_WAVE.phase + wavePhase * 2.4
      ));
    }
  }
  waveAnimFrame = requestAnimationFrame(animateNothingWaves);
}
function startNothingWaves(){
  if (waveAnimFrame) return;
  waveAnimFrame = requestAnimationFrame(animateNothingWaves);
}
function stopNothingWaves(){
  if (waveAnimFrame){ cancelAnimationFrame(waveAnimFrame); waveAnimFrame = null; }
}

function buildNothingDust(){
  Object.keys(LAYER_WAVE).forEach(function(k){
    var group = document.getElementById('dust-' + k);
    if (!group) return;
    var r = LAYER_WAVE[k].baseR;
    var html = '';
    var count = 18;
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

function syncNothingChips(){
  var done = getDoneNothingLayers();
  document.querySelectorAll('.nothing-layer-chip').forEach(function(chip){
    var key = chip.dataset.nothing;
    chip.classList.toggle('is-checked', done.indexOf(key) !== -1);
  });
}

function refreshNothingVisual(){
  try { updateNothingDustVisibility(); } catch(e){}
  try { syncNothingChips(); } catch(e){}
  var done = getDoneNothingLayers();
  var stage = document.getElementById('nothing-stage');
  if (stage) stage.style.setProperty('--progress', (done.length / 5).toFixed(2));
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
    '<div class="belief-flow-card" data-new-card="1" style="background:linear-gradient(135deg,rgba(43,191,171,.08),rgba(94,200,240,.05));border-color:rgba(43,191,171,.3);">' +
      '<div class="bf-head" style="font-size:13.5px;margin-bottom:8px;">🌌 قلمرو ممکن‌ها</div>' +
      '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">تصور کن در <b>ذهنِ</b> تو فضایی شبیه به یک «میدان احتمالات» وجود دارد. <b>علم اعصاب</b> به ما می‌گوید مغز ثابت نیست — از خاصیت <b>نوروپلاستیسیتی</b> (انعطاف‌پذیری عصبی) برخوردار است؛ مثل زمینی که آماده‌ی کشت است. هر <b>قصد</b> و <b>حسِ</b> متمرکزی، اتصالات عصبی‌ات را از نظر فیزیکی بازسازی می‌کند.</p>' +
      '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">واقعیت امروز تو، فقط عادت‌ترین مسیرِ عصبیِ فعلی توست. <b>استعاره‌ی «موج احتمالات»</b> — که از فیزیک کوانتوم وام گرفته‌ایم — یادآوری می‌کند: تا وقتی آن احتمال را با <b>باور و احساس</b> واقعی «انتخاب» نکرده‌ای، سایر مسیرها در ذهنت به‌صورت بالقوه باقی می‌مانند.</p>' +
      '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0;background:rgba(43,191,171,.10);padding:10px 12px;border-radius:10px;border-right:3px solid #2bbfab;"><b>یه نکته:</b> تو این تمرین‌ها چیز جدیدی از بیرون «نمی‌سازی» — فقط مسیرهای عصبیِ تازه‌ای را در ذهن خودت تقویت می‌کنی که تا حالا فعال نبودند.</p>' +
    '</div>' +

    '<div class="belief-flow-card" data-new-card="1" style="margin-top:14px;">' +
      '<div class="bf-head" style="font-size:13.5px;margin-bottom:8px;">🕳️ چرا باید «هیچ» شوی؟</div>' +
      '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0 0 8px;">اگر از «منِ قدیمی» شروع کنی، مغزت همون الگوهای عصبیِ قدیمی رو دوباره اجرا می‌کنه. باید اول «هیچ» شی — یعنی موقتاً از هویت قدیمی، از ترس‌ها و از داستان‌های تکرارشونده فاصله بگیری. در اون سکوت و خالی بودن، <b>شبکه‌ی حالت پیش‌فرض مغز (DMN)</b> — همون بخشی که مدام با خودش حرف می‌زنه — آروم می‌شه.</p>' +
      '<p style="font-size:12px;color:var(--ink-soft);line-height:1.9;margin:0;">وقتی «هیچ» می‌شی، <b>RAS</b> (سیستم فعال‌ساز شبکه‌ای مغزت) دوباره تنظیم می‌شه و می‌تونه اون نشانه‌ها و فرصت‌هایی رو ببینه که قبلاً از فیلتر توجهت رد می‌شدن. این یعنی گفت‌وگو با <b>انعطاف‌پذیری مغزت</b> — نه با کائنات.</p>' +
    '</div>' +

    '<div class="belief-flow-card" id="dispenza-protocol-card" data-new-card="1" style="margin-top:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
        '<div class="bf-head" style="margin:0;">🌌 تمرین روزانه</div>' +
        '<span id="dp-session-count" style="font-size:10.5px;color:var(--muted);">۰ جلسه</span>' +
      '</div>' +
      '<p style="font-size:11px;color:var(--muted);line-height:1.7;margin:0 0 14px;">شش مرحله. هر کدوم رو جدا تیک بزن. لازم نیست یه‌جا انجام بدی.</p>' +

      '<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:1px dashed var(--line);">' +
        '<div style="font-size:11px;font-weight:700;margin-bottom:8px;">🎵 موسیقی مدیتیشن (اختیاری)</div>' +
        '<label class="visual-upload-btn" for="meditation-audio-input" style="font-size:11px;padding:6px 12px;">+ افزودن موسیقی</label>' +
        '<input type="file" id="meditation-audio-input" accept="audio/*" style="display:none" onchange="handleMeditationAudio(this.files)">' +
        '<div id="meditation-audio-wrap"></div>' +
      '</div>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface-2);border-radius:12px;padding:8px 12px;margin-bottom:16px;">' +
        '<span style="font-size:11.5px;font-weight:700;">⏱️ زمان تمرین</span>' +
        '<span id="dp-timer-display" style="font-size:14px;font-weight:800;font-variant-numeric:tabular-nums;">۱۵:۰۰</span>' +
        '<button type="button" id="dp-timer-btn" class="btn tiny" style="padding:4px 12px;font-size:11px;">شروع</button>' +
      '</div>' +

      /* مرحله ۱ */
      '<div class="dp-step">' +
        '<div class="dp-step-head">' +
          '<button type="button" class="dp-check-btn" data-dp-check="1">○</button>' +
          '<span class="dp-step-num">۱</span>' +
          '<span class="dp-step-title">رهاسازی — آرام شدن</span>' +
        '</div>' +
        '<div class="dp-why-box">' +
          '<span class="dp-def-chip">📖 <b>رهاسازی (Relaxation):</b> بدنت رو عمیقاً آروم کن تا از حالت آماده‌باش و تنش فاصله بگیری.</span>' +
          'وقتی بدن آروم می‌شه، توجهت از فشارها و فکرهای روزمره جدا می‌شه. ذهنت آماده می‌شه برای تمرکز، تجسم و تجربه‌ی درونی.' +
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

      /* ============ مرحله ۲ — هیچ شدن ============ */
      '<div class="dp-step">' +
        '<div class="dp-step-head">' +
          '<button type="button" class="dp-check-btn" data-dp-check="2">○</button>' +
          '<span class="dp-step-num">۲</span>' +
          '<span class="dp-step-title">هیچ شدن</span>' +
          '<button type="button" id="nothing-sound-toggle" class="nothing-sound-btn" onclick="toggleNothingSound()" style="margin-inline-start:auto;" title="قطع/وصل صدا">🔔</button>' +
        '</div>' +
        '<div class="dp-why-box">' +
          '<span class="dp-def-chip">📖 <b>هیچ شدن (Becoming Nothing):</b> توجهت رو از بدن، محیط و هویت «من» برمی‌داری و به آگاهی محض اجازه می‌دی گسترش پیدا کنه.</span>' +
          'وقتی خودت رو با اسم، شغل، بدن، خاطرات گذشته و نگرانی‌های آینده تعریف می‌کنی، داری سیگنالی از «گذشته» به میدان می‌فرستی. «هیچ شدن» یعنی رها کردن این هویت‌های شرطی‌شده.' +
        '</div>' +

        '<div class="dp-step-content" style="margin-top:12px;">' +
          '<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--ink);">پنج لایه رو یکی‌یکی رها کن — با هر تیک، غبار کمتر و آگاهی روشن‌تر:</div>' +
        '</div>' +

        '<div class="nothing-stage" id="nothing-stage">' +
          '<svg class="nothing-waves-svg" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">' +
            '<path id="nw-body"  fill="none" stroke="#8b8fa8" stroke-width="1.1" opacity="0.78"/>' +
            '<path id="nw-one"   fill="none" stroke="#a0a4b8" stroke-width="1.1" opacity="0.78"/>' +
            '<path id="nw-thing" fill="none" stroke="#b0b4c8" stroke-width="1.1" opacity="0.78"/>' +
            '<path id="nw-where" fill="none" stroke="#c0c4d8" stroke-width="1.1" opacity="0.78"/>' +
            '<path id="nw-time"  fill="none" stroke="#d0d4e8" stroke-width="1.1" opacity="0.78"/>' +
            '<path id="nw-pure"  fill="none" stroke="#f4c542" stroke-width="1.6" opacity="0.9"/>' +
          '</svg>' +

          '<svg class="nothing-dust-svg" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">' +
            '<g id="dust-body"></g>' +
            '<g id="dust-one"></g>' +
            '<g id="dust-thing"></g>' +
            '<g id="dust-where"></g>' +
            '<g id="dust-time"></g>' +
          '</svg>' +

          '<div class="nothing-core" id="nothing-core">' +
            '<div class="nothing-core-glow"></div>' +
            '<div class="nothing-core-ring"></div>' +
            '<div class="nothing-core-dot"></div>' +
            '<div class="nothing-labels-overlay">' +
              '<span class="nothing-layer-chip" data-nothing="body">بدن</span>' +
              '<span class="nothing-layer-chip" data-nothing="one">هویت</span>' +
              '<span class="nothing-layer-chip" data-nothing="thing">اشیا</span>' +
              '<span class="nothing-layer-chip" data-nothing="where">مکان</span>' +
              '<span class="nothing-layer-chip" data-nothing="time">زمان</span>' +
            '</div>' +
            '<span class="nothing-core-label">آگاهی خالص</span>' +
          '</div>' +
        '</div>' +

        '<div class="nothing-steps" id="nothing-steps" style="margin:14px auto 0;max-width:340px;">' +
          '<button type="button" class="nothing-step" data-nothing-step="body">' +
            '<span class="nothing-step-num">۱</span>' +
            '<span class="nothing-step-txt"><b>No body</b><br><span style="font-size:10.5px;color:var(--muted);">من بدنم نیستم. توجه از بدن، دردها و حس‌های جسمی جدا می‌شه.</span></span>' +
            '<span class="nothing-step-check">○</span>' +
          '</button>' +
          '<button type="button" class="nothing-step" data-nothing-step="one">' +
            '<span class="nothing-step-num">۲</span>' +
            '<span class="nothing-step-txt"><b>No one</b><br><span style="font-size:10.5px;color:var(--muted);">من اون شخصیت، اسم، نقش، گذشته و داستان‌هام نیستم.</span></span>' +
            '<span class="nothing-step-check">○</span>' +
          '</button>' +
          '<button type="button" class="nothing-step" data-nothing-step="thing">' +
            '<span class="nothing-step-num">۳</span>' +
            '<span class="nothing-step-txt"><b>No thing</b><br><span style="font-size:10.5px;color:var(--muted);">وابستگی به اشیا، دارایی‌ها و شرایط بیرونی رها می‌شه.</span></span>' +
            '<span class="nothing-step-check">○</span>' +
          '</button>' +
          '<button type="button" class="nothing-step" data-nothing-step="where">' +
            '<span class="nothing-step-num">۴</span>' +
            '<span class="nothing-step-txt"><b>No where</b><br><span style="font-size:10.5px;color:var(--muted);">آگاهی به اینجا و آنجا گره نخورده.</span></span>' +
            '<span class="nothing-step-check">○</span>' +
          '</button>' +
          '<button type="button" class="nothing-step" data-nothing-step="time">' +
            '<span class="nothing-step-num">۵</span>' +
            '<span class="nothing-step-txt"><b>In no time</b><br><span style="font-size:10.5px;color:var(--muted);">گذشته و آینده رها می‌شن و فقط حالِ بی‌زمان می‌مونه.</span></span>' +
            '<span class="nothing-step-check">○</span>' +
          '</button>' +
        '</div>' +

        '<div class="nothing-final" id="nothing-final" style="text-align:center;margin-top:12px;"><span class="nothing-final-pulse"></span>Pure consciousness — آگاهی خالص</div>' +

        '<div class="dp-step-content" style="margin-top:14px;padding:10px 12px;background:rgba(244,197,66,.08);border-right:3px solid var(--gold-500);border-radius:8px;">' +
          '<div style="font-size:11px;color:var(--ink-soft);line-height:1.75;">این «هیچ» منفی نیست — مثل صفحه‌ی سفیده که همه‌چیز رو توی خودش جا می‌ده.</div>' +
        '</div>' +
        '<div style="text-align:center;margin-top:8px;">' +
          '<button type="button" class="nothing-reset" onclick="resetNothingPractice()">↺ شروع دوباره</button>' +
        '</div>' +
      '</div>' +

      /* مرحله ۳ */
      '<div class="dp-step">' +
        '<div class="dp-step-head">' +
          '<button type="button" class="dp-check-btn" data-dp-check="3">○</button>' +
          '<span class="dp-step-num">۳</span>' +
          '<span class="dp-step-title">اتصال به قلمرو ممکن‌ها</span>' +
        '</div>' +
        '<div class="dp-why-box">' +
          '<span class="dp-def-chip">📖 <b>اتصال (Connection):</b> در این حالت خالی و آروم، <b>RAS</b> مغزت دوباره تنظیم می‌شه و می‌تونه فرصت‌ها و نشانه‌هایی رو ببینه که قبلاً از فیلتر توجهت رد می‌شدن.</span>' +
          'این یه تمرین ذهن‌آگاهی برای بازکردن کانال توجهه — نه ارسال سیگنال به یک میدان بیرونی.' +
        '</div>' +

        '<div class="quantum-connect-wrap">' +
          '<div class="electric-aura" aria-hidden="true"></div>' +
          '<svg class="quantum-connect-svg" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">' +
            '<defs>' +
              '<radialGradient id="qcore-grad" cx="50%" cy="50%" r="50%">' +
                '<stop offset="0%" stop-color="#f4c542" stop-opacity="0.95"/>' +
                '<stop offset="60%" stop-color="#2bbfab" stop-opacity="0.4"/>' +
                '<stop offset="100%" stop-color="#2bbfab" stop-opacity="0"/>' +
              '</radialGradient>' +
              '<radialGradient id="qfield-grad" cx="50%" cy="50%" r="50%">' +
                '<stop offset="0%" stop-color="#5ec8f0" stop-opacity="0"/>' +
                '<stop offset="70%" stop-color="#5ec8f0" stop-opacity="0.15"/>' +
                '<stop offset="100%" stop-color="#8f7bf0" stop-opacity="0.35"/>' +
              '</radialGradient>' +
            '</defs>' +
            '<g class="qsparks">' +
              '<circle class="qspark" cx="25" cy="30"  r="1.2" fill="#5ec8f0"/>' +
              '<circle class="qspark" cx="280" cy="45"  r="1.0" fill="#a29bff"/>' +
              '<circle class="qspark" cx="150" cy="22"  r="1.4" fill="#5ec8f0"/>' +
              '<circle class="qspark" cx="15" cy="175"  r="1.3" fill="#8f7bf0"/>' +
              '<circle class="qspark" cx="285" cy="170" r="1.1" fill="#a29bff"/>' +
              '<circle class="qspark" cx="200" cy="15"  r="1.2" fill="#5ec8f0"/>' +
              '<circle class="qspark" cx="80"  cy="190" r="1.0" fill="#a29bff"/>' +
              '<circle class="qspark" cx="240" cy="185" r="1.3" fill="#5ec8f0"/>' +
              '<circle class="qspark" cx="45"  cy="100" r="1.1" fill="#8f7bf0"/>' +
              '<circle class="qspark" cx="260" cy="100" r="1.2" fill="#5ec8f0"/>' +
              '<circle class="qspark" cx="120" cy="185" r="1.0" fill="#a29bff"/>' +
              '<circle class="qspark" cx="180" cy="190" r="1.1" fill="#8f7bf0"/>' +
            '</g>' +
            '<circle cx="70" cy="100" r="55" fill="url(#qfield-grad)" class="qfield-glow"/>' +
            '<circle cx="70" cy="100" r="38" fill="none" stroke="#8f7bf0" stroke-width="0.8" class="qfield-ring qfield-ring-1"/>' +
            '<circle cx="70" cy="100" r="28" fill="none" stroke="#8f7bf0" stroke-width="0.6" class="qfield-ring qfield-ring-2"/>' +
            '<circle cx="70" cy="100" r="18" fill="none" stroke="#8f7bf0" stroke-width="0.6" class="qfield-ring qfield-ring-3"/>' +
            '<path class="qwave qwave-left" d="M 105 100 Q 115 80, 125 100 T 145 100" fill="none" stroke="#8f7bf0" stroke-width="1.4" stroke-linecap="round"/>' +
            '<circle cx="150" cy="100" r="26" fill="url(#qcore-grad)" class="qcore-glow"/>' +
            '<circle cx="150" cy="100" r="14" fill="none" stroke="#f4c542" stroke-width="1.5" class="qcore-ring qcore-ring-1"/>' +
            '<circle cx="150" cy="100" r="9" fill="none" stroke="#f4c542" stroke-width="1.2" class="qcore-ring qcore-ring-2"/>' +
            '<circle cx="150" cy="100" r="4" fill="#f4c542" class="qcore-dot"/>' +
            '<path class="qlink" d="M 70 100 Q 110 70, 150 100 Q 190 130, 230 100" fill="none" stroke="url(#qcore-grad)" stroke-width="1.2" stroke-dasharray="4 3"/>' +
            '<path class="qwave qwave-right" d="M 195 100 Q 185 120, 175 100 T 155 100" fill="none" stroke="#f4c542" stroke-width="1.4" stroke-linecap="round"/>' +
            '<circle cx="230" cy="100" r="55" fill="url(#qfield-grad)" class="qfield-glow qfield-glow-right"/>' +
            '<circle cx="230" cy="100" r="38" fill="none" stroke="#f4c542" stroke-width="0.8" class="qfield-ring qfield-ring-r1"/>' +
            '<circle cx="230" cy="100" r="28" fill="none" stroke="#f4c542" stroke-width="0.6" class="qfield-ring qfield-ring-r2"/>' +
            '<circle cx="230" cy="100" r="18" fill="none" stroke="#f4c542" stroke-width="0.6" class="qfield-ring qfield-ring-r3"/>' +
          '</svg>' +
          '<div class="quantum-connect-caption">' +
            '<div class="qc-labels">' +
              '<span class="qc-side qc-left">🕳️ آگاهی خالص</span>' +
              '<span class="qc-center">هم‌فرکانسی</span>' +
              '<span class="qc-side qc-right">🌌 قلمرو ممکن‌ها</span>' +
            '</div>' +
            '<div class="qc-desc">وقتی آگاهیت با فرکانس قلمرو ممکن‌ها یکی می‌شه، سیگنالت به میدان می‌رسه — و واقعیت دلخواهت شروع می‌کنه به شکل گرفتن.</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* مرحله ۴ */
      '<div class="dp-step">' +
        '<div class="dp-step-head">' +
          '<button type="button" class="dp-check-btn" data-dp-check="4">○</button>' +
          '<span class="dp-step-title"></span>' +
          '<button type="button" class="dp-expand-icon" data-toggle-box="dp-possibilities" title="یادداشت بذر امروز">▾</button>' +
        '</div>' +
        '<div class="dp-step-content" style="margin-top:12px;">' +
          '<div id="future-box" style="position:relative;margin-bottom:10px;">' +
            '<div id="future-display" style="background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 14px 42px;min-height:60px;font-size:13px;line-height:1.9;color:var(--ink);white-space:pre-wrap;font-style:italic;"></div>' +
            '<button type="button" id="future-rec-btn" class="future-rec-btn" title="ضبط صدا">🎙️</button>' +
          '</div>' +
          '<div id="future-editor" style="display:none;margin-bottom:10px;">' +
            fmtBarHtml() +
            '<textarea id="future-editor-input" rows="5" style="width:100%;font-family:inherit;font-size:13px;line-height:1.8;border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--card);color:var(--ink);resize:none;overflow:hidden;outline:none;min-height:120px;" placeholder="بسیار خوشحال و سپاسگزارم حالا که..."></textarea>' +
            '<div style="display:flex;gap:6px;margin-top:8px;position:sticky;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:5;padding:8px 0;background:linear-gradient(to top,var(--bg-1,#fff) 70%,transparent);">' +
              '<button type="button" id="future-save-btn" class="btn gold" style="flex:1;font-size:12.5px;padding:10px;">💾 ذخیره</button>' +
              '<button type="button" id="future-cancel-btn" class="btn" style="flex:1;font-size:12.5px;padding:10px;">لغو</button>' +
            '</div>' +
          '</div>' +
          '<div id="future-actions" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
            '<button type="button" id="edit-future-btn" class="btn tiny" style="flex:1;min-width:80px;">ویرایش</button>' +
            '<button type="button" id="archive-future-btn" class="btn tiny" style="flex:1;min-width:80px;">📚 آرشیو (<span id="archive-count">۰</span>)</button>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' +
            '<button type="button" class="btn tiny" onclick="openEmotionCapture(\'dispenza\',\'after\',\'تمرین روزانه\')">💗 ثبت حس</button>' +
            '<span id="future-emotion-feedback" style="font-size:11px;color:var(--muted);"></span>' +
          '</div>' +
          '<button type="button" id="future-register-btn" style="width:100%;padding:12px;font-size:13px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:12px;cursor:pointer;box-shadow:0 6px 16px rgba(15,91,83,.18);margin-bottom:12px;">✅ امروز خوندم — ثبت کن</button>' +
          '<div id="future-archive-box" style="display:none;margin-bottom:10px;padding:10px;background:var(--surface-2);border-radius:12px;max-height:260px;overflow-y:auto;"></div>' +
          '<div style="padding-top:12px;border-top:1px dashed var(--line);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<span style="font-size:11.5px;font-weight:700;">📅 پیشرفت روزانه</span>' +
              '<span style="font-size:10.5px;color:var(--muted);"><b id="future-day-num" style="color:var(--ink);">۰</b> از <span id="future-day-total">۹۰</span></span>' +
            '</div>' +
            '<div class="tb-bar" style="margin:0 0 10px;height:4px;"><div class="tb-bar-fill" id="future-progress-bar" style="width:0%;"></div></div>' +
            '<div id="future-mini-cal" class="mini-cal-grid"></div>' +
          '</div>' +
        '</div>' +
        '<div id="dp-possibilities" class="dp-toggle-body" style="display:none;margin-top:12px;">' +
          '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:10px;">بذری که امروز می‌کاری رو این‌جا بنویس. با «همین حالا...» شروع کن.</div>' +
          '<div style="display:flex;flex-direction:column;gap:10px;">' +
            '<div><label style="font-size:11.5px;display:block;margin-bottom:4px;">بذر اصلی امروز:</label><textarea id="dp-possibility-fear" rows="3" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="همین حالا من..."></textarea></div>' +
            '<div><label style="font-size:11.5px;display:block;margin-bottom:4px;">چطور حسش می‌کنم اگه همین حالا حقیقت داشت؟</label><textarea id="dp-possibility-money" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="حس می‌کنم که..."></textarea></div>' +
            '<div><label style="font-size:11.5px;display:block;margin-bottom:4px;">چی رو رها می‌کنم؟</label><textarea id="dp-possibility-approval" rows="2" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;" placeholder="رها می‌کنم..."></textarea></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* مرحله ۵ */
      '<div class="dp-step">' +
        '<div class="dp-step-head">' +
          '<button type="button" class="dp-check-btn" data-dp-check="5">○</button>' +
          '<span class="dp-step-num">۴</span>' +
          '<span class="dp-step-title">تصاویر</span>' +
        '</div>' +
        '<div class="dp-why-box">' +
          '<span class="dp-def-chip">📖 <b>کاشتن بذر (Seeding):</b> یه تصویر واضح از واقعیت دلخواهت توی ذهن می‌کاری — بدون حس نیاز یا کمبود.</span>' +
          'خودت رو توی صحنه‌ای ببین که به خواسته‌ات رسیدی. هر تعداد عکس یا ویدیو که دوست داری اضافه کن.' +
          '<br><span class="dp-def-chip" style="margin-top:8px;display:inline-block;">📖 <b>احساس فراوانی (Embodying):</b> حسِ اون واقعیت رو توی بدنت بساز — شادی، سلامتی، آرامش — تا فرکانست هماهنگ شه.</span>' +
          '<br>وقتی خودت رو «کسی که رسیده» می‌بینی و حسش می‌کنی، رفتارهایت خودبه‌خود با همون هویت هم‌راستا می‌شن.' +
        '</div>' +
        '<div class="dp-step-content">' +
          '<textarea id="seed-text-input" rows="3" style="width:100%;font-family:inherit;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:9px 11px;background:var(--card);color:var(--ink);resize:vertical;margin-bottom:10px;" placeholder="توضیح این تصویرسازی (اختیاری)..."></textarea>' +
          '<div id="vs-root"></div>' +
          '<label class="visual-upload-btn" for="visual-image-input">+ افزودن عکس</label>' +
          '<input type="file" id="visual-image-input" accept="image/*" multiple style="display:none">' +
          '<label class="visual-upload-btn" for="visual-video-input" style="margin-inline-start:6px;">+ افزودن ویدیو</label>' +
          '<input type="file" id="visual-video-input" accept="video/*" multiple style="display:none">' +
          '<div class="vg-wrap" id="visual-gallery"></div>' +
          '<div class="vv-gallery" id="visual-video-gallery"></div>' +
          '<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);">' +
            '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">🧠 مدار عصبی تمرین</div>' +
            '<div class="neural-card" id="np-dispenza-mount"></div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--line);">' +
            '<button type="button" id="archive-seed-btn" class="btn tiny" style="flex:1;min-width:80px;">📚 آرشیو (<span id="seed-archive-count">۰</span>)</button>' +
          '</div>' +
          '<div id="seed-archive-box" style="display:none;margin-top:10px;padding:10px;background:var(--surface-2);border-radius:12px;max-height:260px;overflow-y:auto;"></div>' +
        '</div>' +
      '</div>' +

      /* مأموریت به ذهن — طراحی جدید */
      '<div class="dp-step dp-bonus-step dp-mission-step" style="margin-top:18px;">' +
        '<div class="dp-step-head">' +
          '<span style="font-size:16px;">🎯</span>' +
          '<span class="dp-step-title">مأموریت ذهن</span>' +
          '<button type="button" class="dp-expand-icon" data-toggle-box="ras-mission-box" style="margin-inline-start:auto;" title="باز/بسته کردن">▾</button>' +
        '</div>' +
        '<div id="ras-mission-box" style="display:none;margin-top:12px;">' +
          '<p style="font-size:11.5px;color:var(--muted);line-height:1.75;margin:0 0 14px;">ذهنت رو برای دیدن چیزی که تا حالا ازش رد می‌شدی، آموزش بده.</p>' +
          '<div id="ras-mission-content"></div>' +
          '<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);">' +
            '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">🧠 مدار عصبی مأموریت</div>' +
            '<div class="neural-card" id="np-tracking-mount"></div>' +
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
  try { refreshNothingVisual(); } catch(e){}
  try { startNothingWaves(); } catch(e){}
}
  
/* =====================================================================
   استایل‌ها
   ===================================================================== */
function getStyles(){
  return '' +
    '.future-rec-btn{position:absolute;bottom:8px;right:8px;min-width:32px;height:32px;padding:0 9px;border-radius:16px;border:none;background:transparent;color:var(--ink);font-family:inherit;font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;box-shadow:none;}' +
    '.future-rec-btn.recording{background:#e5484d;color:#fff;font-size:12px;animation:recPulse 1.2s ease-in-out infinite;}' +
    '@keyframes recPulse{0%,100%{box-shadow:0 0 0 0 rgba(229,72,77,.5);}50%{box-shadow:0 0 0 7px rgba(229,72,77,0);}}' +
    '.mini-cal-grid{display:grid;grid-template-columns:repeat(15,1fr);gap:3px;max-width:100%;}' +
    '.mini-cal-day{aspect-ratio:1;border-radius:4px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;line-height:1;cursor:pointer;}' +
    '.mini-cal-day.done{background:var(--emerald-500);}' +
    '.mini-cal-day.feel-strong{background:var(--emerald-500);}' +
    '.mini-cal-day.feel-normal{background:var(--emerald-300);}' +
    '.mini-cal-day.feel-weak{background:var(--gold-500);}' +
    '.cal-legend{display:flex;align-items:center;gap:14px;margin-top:10px;font-size:11px;color:var(--muted);}' +
    '.cal-legend span{display:inline-flex;align-items:center;gap:5px;}' +
    '.cal-legend i{width:11px;height:11px;border-radius:3px;display:inline-block;flex:none;}' +
    '.mini-cal-day.month-end{box-shadow:inset 0 -3px 0 var(--gold-500);}' +
    '.mini-cal-day.selected{outline:2px solid var(--ink);outline-offset:1px;}' +
    '.mini-cal-day.just{animation:calPop .5s ease-out;}' +
    '@keyframes calPop{0%{transform:scale(.4);}60%{transform:scale(1.3);}100%{transform:scale(1);}}' +
    '.mini-cal-month{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;font-size:10.5px;color:var(--ink-soft);padding:6px 2px 2px;}' +
    '.mini-cal-month:first-child{padding-top:0;}' +
    '.mini-cal-month b{font-size:11px;color:var(--ink);}' +
    '.cal-finished{margin-top:10px;padding:9px 11px;border-radius:10px;background:rgba(244,197,66,.16);border:1px solid rgba(244,197,66,.45);font-size:11.5px;font-weight:700;line-height:1.8;color:var(--ink);}' +
    '#future-cal-info{margin-top:10px;padding:8px 10px;border-radius:10px;background:var(--surface-2);font-size:11px;line-height:1.7;color:var(--ink-soft);}' +
    '#future-register-btn.is-done{background:var(--surface-2)!important;color:var(--emerald-700,#0f5b53)!important;border:1.5px solid var(--emerald-500)!important;box-shadow:none!important;}' +
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

    '@font-face{font-family:"bp-nazanin";src:local("B Nazanin"),local("BNazanin"),url("fonts/BNazanin.woff2") format("woff2"),url("fonts/BNazanin.ttf") format("truetype");}' +
    '@font-face{font-family:"bp-titr";src:local("B Titr"),local("BTitr"),url("fonts/BTitr.woff2") format("woff2"),url("fonts/BTitr.ttf") format("truetype");}' +
    '@font-face{font-family:"bp-zar";src:local("B Zar"),local("BZar"),url("fonts/BZar.woff2") format("woff2"),url("fonts/BZar.ttf") format("truetype");}' +
    '@font-face{font-family:"bp-nastaliq";src:local("IranNastaliq"),local("Iran Nastaliq"),local("Noto Nastaliq Urdu"),url("fonts/Nastaliq.woff2") format("woff2"),url("fonts/Nastaliq.ttf") format("truetype");}' +
    '.fmt-bar{margin-bottom:8px;padding:8px;background:var(--surface-2);border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;gap:8px;}' +
    '.fmt-select{width:100%;font-family:inherit;font-size:12.5px;padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);outline:none;}' +
    '.fmt-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}' +
    '.fmt-btn{min-width:34px;height:34px;padding:0 8px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-family:inherit;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;}' +
    '.fmt-btn.active{background:var(--emerald-500);border-color:var(--emerald-500);color:#fff;}' +
    '.fmt-size-val{min-width:26px;text-align:center;font-size:12.5px;font-weight:800;color:var(--ink);}' +
    '.fmt-sep{width:1px;height:22px;background:var(--line);margin:0 2px;}' +
    '.vv-gallery{display:flex;flex-direction:column;gap:10px;margin-top:10px;}' +
    '.vv-gallery:empty{display:none;}' +
    '.vv-item{position:relative;border-radius:12px;overflow:hidden;background:#000;border:1px solid var(--line);}' +
    '.vv-item video{width:100%;max-height:320px;display:block;background:#000;}' +
    '.vv-del{position:absolute;top:6px;left:6px;width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:17px;line-height:1;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;padding:0;}' +
    '.vv-cap{padding:6px 10px;font-size:10.5px;color:#d8dbe6;background:rgba(18,20,38,.92);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.vv-missing{padding:18px 12px;font-size:11.5px;color:var(--muted);text-align:center;background:var(--surface-2);}' +
    '.vg-wrap{margin-top:10px;}' +
    '.vg-grid{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-start;direction:rtl;}' +
    '.vg-thumb{flex:none;width:68px;height:68px;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface-2);cursor:pointer;display:block;}' +
    '.vg-thumb img{width:100%;height:100%;object-fit:cover;display:block;-webkit-user-drag:none;}' +
    '.vg-thumb img:not([src]){visibility:hidden;}' +
    '.vg-thumb.vg-missing::after{content:"🖼️";display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:20px;opacity:.35;}' +
    '.vg-viewer{position:fixed;inset:0;z-index:9999;background:#000;display:none;flex-direction:column;}' +
    '.vg-top{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;z-index:3;background:linear-gradient(to bottom,rgba(0,0,0,.6),transparent);color:#fff;}' +
    '.vg-counter{font-family:inherit;font-size:13px;font-weight:800;color:#fff;background:rgba(255,255,255,.16);border:none;border-radius:16px;padding:8px 14px;cursor:pointer;}' +
    '.vg-overview{position:absolute;inset:0;z-index:2;background:#000;overflow-y:auto;padding:calc(64px + env(safe-area-inset-top,0px)) 10px 24px;display:none;flex-wrap:wrap;gap:6px;align-content:flex-start;direction:rtl;}' +
    '.vg-ov-thumb{flex:none;width:calc((100% - 18px) / 4);aspect-ratio:1;padding:0;border:2px solid transparent;border-radius:8px;overflow:hidden;background:#111;cursor:pointer;display:block;}' +
    '.vg-ov-thumb.active{border-color:var(--emerald-500,#2bbfab);}' +
    '.vg-ov-thumb img{width:100%;height:100%;object-fit:cover;display:block;-webkit-user-drag:none;}' +
    '.vg-x{width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,.16);color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:0;}' +
    '.vg-track{flex:1;min-height:0;display:flex;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;direction:ltr;-webkit-overflow-scrolling:touch;scrollbar-width:none;}' +
    '.vg-track::-webkit-scrollbar{display:none;}' +
    '.vg-slide{flex:0 0 100%;width:100%;height:100%;scroll-snap-align:center;scroll-snap-stop:always;display:flex;align-items:center;justify-content:center;padding:60px 0 84px;box-sizing:border-box;}' +
    '.vg-slide img{max-width:100%;max-height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none;}' +
    '.vg-nav{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;border:none;background:rgba(255,255,255,.16);color:#fff;font-size:24px;line-height:1;cursor:pointer;z-index:3;padding:0;}' +
    '.vg-prev{left:8px;}.vg-next{right:8px;}' +
    '@media (hover:none){.vg-nav{display:none;}}' +
    '.vg-bottom{position:absolute;bottom:0;left:0;right:0;display:flex;gap:10px;justify-content:center;padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px));background:linear-gradient(to top,rgba(0,0,0,.65),transparent);z-index:3;}' +
    '.vg-act{min-width:110px;padding:10px 16px;border-radius:12px;border:none;background:rgba(255,255,255,.16);color:#fff;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;}' +
    '.vg-danger{background:rgba(229,72,77,.75);}' +
    '.vc-modal{position:fixed;inset:0;z-index:10000;background:#0b0c14;display:none;flex-direction:column;color:#fff;}' +
    '.vc-ratios{display:flex;gap:6px;overflow-x:auto;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 8px;flex:none;scrollbar-width:none;position:relative;z-index:2;}' +
    '.vc-ratio{flex:none;padding:7px 12px;border-radius:16px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;font-family:inherit;font-size:12px;cursor:pointer;}' +
    '.vc-ratio.active{background:var(--emerald-500,#2bbfab);border-color:transparent;}' +
    '.vc-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:12px;}' +
    '.vc-box{position:relative;touch-action:none;user-select:none;}' +
    '.vc-box img{display:block;width:100%;height:100%;pointer-events:none;-webkit-user-drag:none;}' +
    '.vc-rect{position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.6);touch-action:none;cursor:move;box-sizing:border-box;}' +
    '.vc-h{position:absolute;width:34px;height:34px;touch-action:none;}' +
    '.vc-h::after{content:"";position:absolute;left:10px;top:10px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px rgba(0,0,0,.35);}' +
    '.vc-h[data-h="nw"]{left:-17px;top:-17px;cursor:nwse-resize;}' +
    '.vc-h[data-h="ne"]{right:-17px;top:-17px;cursor:nesw-resize;}' +
    '.vc-h[data-h="sw"]{left:-17px;bottom:-17px;cursor:nesw-resize;}' +
    '.vc-h[data-h="se"]{right:-17px;bottom:-17px;cursor:nwse-resize;}' +
    '.vc-actions{display:flex;gap:10px;padding:10px 14px calc(14px + env(safe-area-inset-bottom,0px));flex:none;position:relative;z-index:2;}' +
    '.vc-actions button{flex:1;padding:12px;border-radius:12px;border:none;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer;background:rgba(255,255,255,.14);color:#fff;}' +
    '.vc-actions .vc-apply{background:var(--emerald-500,#2bbfab);}' +
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
    '.nothing-stage{position:relative;width:100%;max-width:300px;height:300px;margin:16px auto 0;--progress:0;}' +
    '.nothing-waves-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}' +
    '.nothing-waves-svg path{transition:opacity .8s ease;}' +
    '#nw-pure{filter:drop-shadow(0 0 5px rgba(244,197,66,.75));transition:opacity .8s ease, stroke-width .8s ease;}' +
    '.nothing-dust-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}' +
    '.dust-p{opacity:0.5;}' +

    /* آگاهی خالص */
    '.nothing-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:150px;height:150px;display:flex;align-items:center;justify-content:center;z-index:5;}' +
    '.nothing-core-glow{position:absolute;inset:-6px;border-radius:50%;' +
      'background:radial-gradient(circle, rgba(244,197,66,calc(0.20 + var(--progress) * 0.55)) 0%, rgba(43,191,171,calc(0.08 + var(--progress) * 0.35)) 42%, transparent 72%);' +
      'opacity:calc(0.55 + var(--progress) * 0.45);' +
      'animation:coreGlowPulse 3.5s ease-in-out infinite;pointer-events:none;transition:opacity .8s ease, background .8s ease;}' +
    '@keyframes coreGlowPulse{0%,100%{transform:scale(0.96);}50%{transform:scale(1.10);}}' +
    '.nothing-core-ring{position:absolute;inset:26px;border-radius:50%;' +
      'border:calc(1px + var(--progress) * 1.2px) solid rgba(244,197,66, calc(0.45 + var(--progress) * 0.5));' +
      'box-shadow:inset 0 0 calc(8px + var(--progress) * 16px) rgba(244,197,66, calc(0.15 + var(--progress) * 0.4)), 0 0 calc(6px + var(--progress) * 14px) rgba(244,197,66, calc(0.2 + var(--progress) * 0.5));' +
      'animation:coreBreathe 4s ease-in-out infinite;transition:border-color .8s ease, box-shadow .8s ease;}' +
    '.nothing-core-ring::after{content:"";position:absolute;inset:10px;border-radius:50%;border:1px solid rgba(84,201,184, calc(0.4 + var(--progress) * 0.5));opacity:.7;}' +
    '@keyframes coreBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.06);}}' +
    '.nothing-core-dot{width:16px;height:16px;border-radius:50%;' +
      'background:radial-gradient(circle at 35% 30%, #ffffff, #f4c542 70%);' +
      'box-shadow:0 0 calc(14px + var(--progress) * 20px) rgba(244,197,66, 0.8), 0 0 calc(28px + var(--progress) * 30px) rgba(244,197,66, 0.4);' +
      'position:relative;z-index:2;animation:coreDotPulse 2.4s ease-in-out infinite;transition:box-shadow .8s ease;}' +
    '@keyframes coreDotPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.15);}}' +

    '.nothing-labels-overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:3px;max-width:110px;z-index:8;pointer-events:none;}' +
    '.nothing-layer-chip{font-family:inherit;font-size:9.5px;font-weight:800;color:#fff;' +
      'background:rgba(18,20,38,0.85);padding:3px 8px;border-radius:12px;white-space:nowrap;letter-spacing:.2px;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.4);' +
      'cursor:pointer;pointer-events:auto;user-select:none;' +
      'transition:opacity .5s ease, transform .5s ease, filter .5s ease, background .5s ease, color .5s ease, box-shadow .5s ease;}' +
    'html[data-theme="light"] .nothing-layer-chip{background:rgba(255,255,255,0.92);color:#0f5b53;box-shadow:0 2px 8px rgba(0,0,0,0.12);}' +
    '.nothing-layer-chip.is-checked{opacity:0;transform:scale(0.6);pointer-events:none;}' +
    '.nothing-core-label{position:absolute;bottom:-24px;left:50%;transform:translateX(-50%);font-size:10.5px;font-weight:800;' +
      'color:var(--emerald-700,#0f5b53);letter-spacing:.4px;white-space:nowrap;z-index:7;' +
      'opacity:calc(0.55 + var(--progress) * 0.45);' +
      'text-shadow:0 0 calc(4px + var(--progress) * 8px) rgba(244,197,66, calc(0.2 + var(--progress) * 0.5));' +
      'transition:opacity .8s ease, text-shadow .8s ease;}' +

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

    /* ============== قلمرو ممکن‌ها ============== */
    '.quantum-connect-wrap{position:relative;margin:16px 0 0;padding:14px;background:radial-gradient(ellipse at 50% 50%, rgba(143,123,240,.10), rgba(94,200,240,.03) 70%, transparent);border-radius:16px;border:1px solid rgba(143,123,240,.22);overflow:hidden;}' +
    '.electric-aura{position:absolute;inset:0;pointer-events:none;opacity:0.55;' +
      'background-image:' +
        'repeating-linear-gradient(90deg, transparent 0px, transparent 38px, rgba(94,200,240,0.06) 38px, rgba(94,200,240,0.06) 39px, transparent 39px, transparent 78px),' +
        'repeating-linear-gradient(0deg, transparent 0px, transparent 52px, rgba(143,123,240,0.05) 52px, rgba(143,123,240,0.05) 53px, transparent 53px, transparent 105px);' +
      'animation:electricScan 7s linear infinite;}' +
    '@keyframes electricScan{' +
      '0%{background-position:0 0, 0 0;opacity:0.4;}' +
      '50%{background-position:39px 26px, 26px 52px;opacity:0.75;}' +
      '100%{background-position:78px 52px, 52px 105px;opacity:0.4;}' +
    '}' +
    '.electric-aura::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 40%, rgba(94,200,240,0.10), transparent 45%),radial-gradient(circle at 70% 60%, rgba(143,123,240,0.10), transparent 45%);animation:electricFloat 5s ease-in-out infinite;}' +
    '@keyframes electricFloat{0%,100%{transform:scale(1) translate(0,0);opacity:0.5;}50%{transform:scale(1.08) translate(6px,-4px);opacity:0.9;}}' +
    '.quantum-connect-svg{position:relative;width:100%;height:auto;display:block;max-height:220px;z-index:1;}' +
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
    '.qspark{animation:qsparkFlash 2.6s ease-in-out infinite;}' +
    '.qspark:nth-child(1){animation-delay:0s;}' +
    '.qspark:nth-child(2){animation-delay:0.4s;}' +
    '.qspark:nth-child(3){animation-delay:0.8s;}' +
    '.qspark:nth-child(4){animation-delay:1.2s;}' +
    '.qspark:nth-child(5){animation-delay:1.6s;}' +
    '.qspark:nth-child(6){animation-delay:2s;}' +
    '.qspark:nth-child(7){animation-delay:2.4s;}' +
    '.qspark:nth-child(8){animation-delay:2.8s;}' +
    '.qspark:nth-child(9){animation-delay:0.6s;}' +
    '.qspark:nth-child(10){animation-delay:1.4s;}' +
    '.qspark:nth-child(11){animation-delay:1.8s;}' +
    '.qspark:nth-child(12){animation-delay:0.2s;}' +
    '@keyframes qsparkFlash{0%,100%{opacity:0.05;transform:scale(0.8);}50%{opacity:0.8;transform:scale(1.4);}}' +
    '.qwave{opacity:0.85;animation:qwaveTravel 2.8s ease-in-out infinite;}' +
    '.qwave-left{animation-delay:0s;}' +
    '.qwave-right{animation-delay:1.4s;}' +
    '@keyframes qwaveTravel{0%,100%{opacity:0.3;transform:translateX(0);}50%{opacity:1;transform:translateX(6px);}}' +
    '.qcore-glow{animation:qcoreBreathe 2.6s ease-in-out infinite;}' +
    '@keyframes qcoreBreathe{0%,100%{opacity:0.7;transform:scale(0.96);transform-origin:150px 100px;}50%{opacity:1;transform:scale(1.06);}}' +
    '.qcore-ring{transform-origin:150px 100px;}' +
    '.qcore-ring-1{animation:qcoreRing 2.4s ease-in-out infinite;}' +
    '.qcore-ring-2{animation:qcoreRing 2.4s ease-in-out infinite;animation-delay:0.4s;}' +
    '@keyframes qcoreRing{0%,100%{opacity:0.4;transform:scale(0.95);}50%{opacity:1;transform:scale(1.08);}}' +
    '.qcore-dot{animation:qcoreDot 1.8s ease-in-out infinite;}' +
    '@keyframes qcoreDot{0%,100%{r:4;opacity:0.9;}50%{r:5.5;opacity:1;}}' +
    '.qlink{opacity:0.6;animation:qlinkDash 3s linear infinite;}' +
    '@keyframes qlinkDash{to{stroke-dashoffset:-14;}}' +
    '.quantum-connect-caption{position:relative;margin-top:12px;padding-top:10px;border-top:1px dashed rgba(143,123,240,.25);z-index:2;}' +
    '.qc-labels{display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:800;margin-bottom:8px;}' +
    '.qc-side{color:var(--ink);}' +
    '.qc-center{font-size:10.5px;color:var(--emerald-700);background:rgba(43,191,171,.12);padding:3px 10px;border-radius:12px;letter-spacing:.3px;}' +
    '.qc-desc{font-size:11.5px;color:var(--ink-soft);line-height:1.8;text-align:center;}' +

    /* ============== مأموریت ذهن (جدید) ============== */
    '.ras-empty{padding:16px;background:linear-gradient(135deg,rgba(43,191,171,.06),rgba(94,200,240,.03));border:1px dashed rgba(43,191,171,.35);border-radius:14px;text-align:center;}' +
    '.ras-empty-icon{font-size:32px;margin-bottom:8px;display:block;}' +
    '.ras-empty-title{font-size:13px;font-weight:800;color:var(--ink);margin-bottom:6px;}' +
    '.ras-empty-desc{font-size:11.5px;color:var(--ink-soft);line-height:1.7;margin-bottom:14px;}' +
    '.ras-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:12px;}' +
    '.ras-chip{padding:8px 12px;border-radius:20px;border:1.5px solid var(--line);background:var(--card);color:var(--ink);font-family:inherit;font-size:11.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:.2s;}' +
    '.ras-chip:active{transform:scale(.96);}' +
    '.ras-chip.selected{background:var(--emerald-500,#2bbfab);border-color:var(--emerald-500,#2bbfab);color:#fff;box-shadow:0 4px 12px rgba(43,191,171,.3);}' +
    '.ras-custom-input{width:100%;font-family:inherit;font-size:12px;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);margin-bottom:12px;outline:none;resize:vertical;min-height:44px;box-sizing:border-box;}' +
    '.ras-custom-input:focus{border-color:var(--emerald-500,#2bbfab);}' +
    '.ras-start-btn{width:100%;padding:12px;font-size:13px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:12px;cursor:pointer;box-shadow:0 6px 16px rgba(15,91,83,.18);transition:.2s;}' +
    '.ras-start-btn:active{transform:scale(.98);}' +
    '.ras-start-btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;}' +
    '.ras-active{padding:16px;background:linear-gradient(135deg,rgba(43,191,171,.08),rgba(244,197,66,.04));border:1px solid rgba(43,191,171,.3);border-radius:14px;}' +
    '.ras-active-header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px;}' +
    '.ras-active-label{font-size:13.5px;font-weight:800;color:var(--ink);line-height:1.5;flex:1;}' +
    '.ras-active-label small{display:block;font-size:10.5px;color:var(--muted);font-weight:600;margin-top:4px;}' +
    '.ras-change-btn{flex:none;width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--muted);cursor:pointer;font-size:14px;padding:0;display:flex;align-items:center;justify-content:center;}' +
    '.ras-change-btn:hover{background:var(--surface-2);}' +
    '.ras-record-btn{width:100%;padding:14px;font-size:13.5px;font-weight:800;background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;border:none;border-radius:12px;cursor:pointer;box-shadow:0 6px 16px rgba(15,91,83,.2);display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px;}' +
    '.ras-record-btn:active{transform:scale(.98);}' +
    '.ras-record-btn.pulse{animation:rasPulse 2s ease-in-out infinite;}' +
    '@keyframes rasPulse{0%,100%{box-shadow:0 6px 16px rgba(15,91,83,.2);}50%{box-shadow:0 6px 24px rgba(43,191,171,.5),0 0 0 8px rgba(43,191,171,.08);}}' +
    '.ras-stats{display:flex;gap:6px;margin-bottom:14px;}' +
    '.ras-stat{flex:1;padding:8px 6px;background:var(--card);border:1px solid var(--line);border-radius:10px;text-align:center;}' +
    '.ras-stat-num{font-size:16px;font-weight:800;color:var(--emerald-700,#0f5b53);display:block;line-height:1.2;}' +
    '.ras-stat-lbl{font-size:9.5px;color:var(--muted);font-weight:700;margin-top:2px;display:block;}' +
    '.ras-heatmap{display:flex;gap:5px;margin-bottom:22px;justify-content:space-between;}' +
    '.ras-heat-day{flex:1;aspect-ratio:1;border-radius:8px;background:var(--surface-2);border:1.5px solid transparent;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--muted);position:relative;}' +
    '.ras-heat-day.l1{background:rgba(43,191,171,.25);color:var(--emerald-700,#0f5b53);}' +
    '.ras-heat-day.l2{background:rgba(43,191,171,.5);color:#fff;}' +
    '.ras-heat-day.l3{background:var(--emerald-500,#2bbfab);color:#fff;}' +
    '.ras-heat-day.today{border-color:var(--gold-500,#f4c542);}' +
    '.ras-heat-day small{position:absolute;bottom:-16px;font-size:9px;font-weight:600;color:var(--muted);}' +
    '.ras-feed-title{font-size:11.5px;font-weight:800;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;}' +
    '.ras-feed-title span{font-size:10px;color:var(--muted);font-weight:600;}' +
    '.ras-feed-item{padding:10px 12px;border-radius:10px;background:var(--card);border:1px solid var(--line);margin-bottom:6px;position:relative;}' +
    '.ras-feed-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;gap:8px;}' +
    '.ras-feed-time{font-size:10.5px;color:var(--muted);font-weight:700;}' +
    '.ras-feed-feel{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:10px;flex:none;}' +
    '.ras-feel-normal{background:rgba(120,120,140,.12);color:var(--ink-soft);}' +
    '.ras-feel-calm{background:rgba(94,200,240,.18);color:#1d7ba0;}' +
    '.ras-feel-bright{background:rgba(244,197,66,.2);color:#8a6b00;}' +
    '.ras-feel-strong{background:rgba(43,191,171,.2);color:#0f5b53;}' +
    '.ras-feed-text{font-size:12px;color:var(--ink);line-height:1.7;white-space:pre-wrap;padding-left:22px;}' +
    '.ras-feed-del{position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:50%;border:none;background:transparent;color:var(--muted);font-size:14px;cursor:pointer;line-height:1;padding:0;}' +
    '.ras-feed-empty{text-align:center;font-size:11px;color:var(--muted);padding:14px;background:var(--surface-2);border-radius:10px;line-height:1.7;}' +

    /* Bottom Sheet */
    '.ras-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:none;align-items:flex-end;justify-content:center;backdrop-filter:blur(2px);}' +
    '.ras-sheet-overlay.open{display:flex;animation:rasFadeIn .2s ease;}' +
    '@keyframes rasFadeIn{from{opacity:0;}to{opacity:1;}}' +
    '.ras-sheet-card{width:100%;max-width:500px;background:var(--card);border-radius:20px 20px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0));box-shadow:0 -10px 40px rgba(0,0,0,.3);animation:rasSlideUp .3s cubic-bezier(.2,.9,.3,1);box-sizing:border-box;}' +
    '@keyframes rasSlideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}' +
    '.ras-sheet-handle{width:40px;height:4px;background:var(--line);border-radius:2px;margin:0 auto 14px;}' +
    '.ras-sheet-title{font-size:14px;font-weight:800;color:var(--ink);margin-bottom:14px;text-align:center;}' +
    '.ras-sheet-text{width:100%;font-family:inherit;font-size:13px;padding:12px;border:1.5px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--ink);resize:none;min-height:80px;outline:none;line-height:1.75;box-sizing:border-box;}' +
    '.ras-sheet-text:focus{border-color:var(--emerald-500,#2bbfab);background:var(--card);}' +
    '.ras-sheet-feel-lbl{font-size:11.5px;font-weight:800;color:var(--ink);margin:14px 0 8px;}' +
    '.ras-sheet-feels{display:flex;gap:6px;flex-wrap:wrap;}' +
    '.ras-sheet-feel{flex:1;min-width:70px;padding:10px 6px;border-radius:10px;border:1.5px solid var(--line);background:var(--card);color:var(--ink-soft);font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;transition:.15s;}' +
    '.ras-sheet-feel span:first-child{font-size:18px;}' +
    '.ras-sheet-feel.selected{background:var(--emerald-500,#2bbfab);border-color:var(--emerald-500,#2bbfab);color:#fff;transform:scale(1.03);}' +
    '.ras-sheet-actions{display:flex;gap:8px;margin-top:16px;}' +
    '.ras-sheet-actions button{flex:1;padding:12px;border-radius:12px;border:none;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;}' +
    '.ras-sheet-cancel{background:var(--surface-2);color:var(--ink-soft);}' +
    '.ras-sheet-save{background:linear-gradient(135deg,var(--emerald-700,#0f5b53),var(--emerald-500,#2bbfab));color:#fff;box-shadow:0 4px 12px rgba(15,91,83,.2);}' +
    '.ras-sheet-save:disabled{opacity:.4;cursor:not-allowed;box-shadow:none;}';
}
  
/* =====================================================================
   بقیه‌ی توابع (متن آینده، بذر، تقویم، مأموریت ذهن)
   ===================================================================== */
function renderFutureText(){
  var v = getActiveVersion();
  var display = document.getElementById('future-display');
  var archiveCount = document.getElementById('archive-count');
  if (display){
    var hasText = v && v.text && v.text.trim();
    var hasAudio = v && v.audio;
    if (hasText || hasAudio){
      display.innerHTML = (hasText ? '«' + escapeHtml(v.text) + '»' : '') +
        (hasAudio ? '<audio controls preload="metadata" src="' + v.audio + '" style="width:100%;height:36px;display:block;' + (hasText ? 'margin-top:10px;' : '') + '"></audio>' : '');
    } else {
      display.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:14px 0;font-style:normal;">هنوز چیزی ثبت نکردی.<br><span style="font-size:11px;">روی همین کادر بزن و بنویس، یا با 🎙️ ویس بگذار.</span></div>';
    }
  }
  if (archiveCount) archiveCount.textContent = toFa((state.futureTextVersions || []).length);
  renderMiniCal();
  updateRegisterBtn();
  renderArchiveBox();
  try { applyFutureFmt(); } catch(e){}
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
  var totalDays = getFutureDays();
  var html = '';
  for (var d = 0; d < totalDays; d++){
    var date = new Date(startDate);
    date.setDate(date.getDate() + d);
    var key = dpKeyFromDate(date);
    if (d % 30 === 0){
      var endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.min(d + 29, totalDays - 1));
      var mIdx = d / 30;
      html += '<div class="mini-cal-month">' +
        '<b>ماه ' + (MONTH_ORD_FA[mIdx] || toFa(mIdx + 1)) + '</b>' +
        '<span>' + dpFmtDateFa(date, { day: 'numeric', month: 'long' }) + ' تا ' + dpFmtDateFa(endDate, { day: 'numeric', month: 'long' }) + '</span>' +
      '</div>';
    }
    var done = !!readSet[key];
    var feel = dpDayEmotion(key);
    var isToday = key === todayKeyStr;
    var isFuture = date > today;
    var cls = 'mini-cal-day';
    if (done) cls += ' done';
    if (feel) cls += ' feel feel-' + feel.level;
    if (isToday) cls += ' today';
    if (isFuture) cls += ' future';
    if (d % 30 === 29 || d === totalDays - 1) cls += ' month-end';
    if (key === CAL_SELECTED) cls += ' selected';
    html += '<div class="' + cls + '" data-cal-key="' + key + '" data-cal-idx="' + d + '">' + (feel ? HEART_SVG : (done ? '✓' : '')) + '</div>';
  }
  wrap.innerHTML = html;

  var legend = document.getElementById('future-cal-legend');
  if (!legend){
    legend = document.createElement('div');
    legend.id = 'future-cal-legend';
    legend.className = 'cal-legend';
    legend.innerHTML =
      '<span><i style="background:var(--emerald-500);"></i>' + FEEL_LEVEL_FA.strong + '</span>' +
      '<span><i style="background:var(--emerald-300);"></i>' + FEEL_LEVEL_FA.normal + '</span>' +
      '<span><i style="background:var(--gold-500);"></i>' + FEEL_LEVEL_FA.weak + '</span>';
  }
  if (legend.previousSibling !== wrap) wrap.parentNode.insertBefore(legend, wrap.nextSibling);

  var info = document.getElementById('future-cal-info');
  if (!info){
    info = document.createElement('div');
    info.id = 'future-cal-info';
  }
  if (info.previousSibling !== legend) wrap.parentNode.insertBefore(info, legend.nextSibling);
  var rst = document.getElementById('future-cal-reset');
  if (!rst){
    rst = document.createElement('div');
    rst.id = 'future-cal-reset';
    var infoEl = document.getElementById('future-cal-info');
    infoEl.parentNode.insertBefore(rst, infoEl.nextSibling);
  }
  var endOfCycle = new Date(startDate); endOfCycle.setDate(endOfCycle.getDate() + totalDays);
  var finished = !!v && today >= endOfCycle;
  var doneCnt = readDays.filter(function(k){ return true; }).length;
  rst.innerHTML =
    (finished ? '<div class="cal-finished">🎉 این دوره‌ی ' + toFa(totalDays) + ' روزه تموم شد — ' + toFa(Math.min(doneCnt, totalDays)) + ' روز از ' + toFa(totalDays) + ' روز خوندی. برای شروع دوره‌ی تازه، تقویم رو ریست کن.</div>' : '') +
    '<div style="display:flex;gap:6px;margin-top:8px;">' +
      '<button type="button" id="future-cal-days-btn" class="btn tiny" style="flex:1;font-size:11.5px;padding:9px;">⚙️ روزهای دوره (الان ' + toFa(totalDays) + ' روزه)</button>' +
      '<button type="button" id="future-cal-reset-btn" class="btn tiny' + (finished ? ' gold' : '') + '" style="flex:1;font-size:11.5px;padding:9px;">🔄 ریست تقویم</button>' +
    '</div>';
  renderCalInfo();
}

function resetFutureCalendar(){
  var v = getActiveVersion();
  if (!v){ if (typeof toast === 'function') toast('اول متن خواسته‌ات را بنویس'); return; }
  var msg = 'تقویم از امروز از نو شروع بشه؟\nثبت‌های این دوره در تاریخچه‌ی همین نسخه نگه داشته می‌شن. متن و مسیر عصبی دست نمی‌خورن.';
  var ok = true;
  try { ok = window.confirm(msg); } catch(e){}
  if (!ok) return;
  doResetFutureCalendar(v);
}

function setFutureCalDays(){
  var cur = getFutureDays();
  var input = null;
  try { input = window.prompt('دوره‌ی خواندن چند روزه باشه؟ (۱ تا ' + toFa(FUTURE_MAX_DAYS) + ')', String(cur)); } catch(e){}
  if (input === null) return;
  var fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
  var norm = String(input).replace(/[۰-۹]/g, function(c){ return fa.indexOf(c); }).replace(/[٠-٩]/g, function(c){ return ar.indexOf(c); });
  var n = parseInt(norm, 10);
  if (!n || n < 1 || n > FUTURE_MAX_DAYS){
    if (typeof toast === 'function') toast('یه عدد بین ۱ تا ' + toFa(FUTURE_MAX_DAYS) + ' وارد کن');
    return;
  }
  var changed = n !== cur;
  state.futureCalDays = n;
  var v = getActiveVersion();
  if (changed && v){
    var restart = false;
    try { restart = window.confirm('دوره از امروز از نو شروع بشه؟\nثبت‌های این دوره در تاریخچه‌ی همین نسخه نگه داشته می‌شن.'); } catch(e){}
    if (restart){ doResetFutureCalendar(v, true); }
  }
  try { saveState(); } catch(e){}
  renderFutureText(); dpRenderProgress();
  if (typeof toast === 'function') toast('دوره روی ' + toFa(n) + ' روز تنظیم شد 🌱');
}

function doResetFutureCalendar(v, silent){
  if (!Array.isArray(v.cycles)) v.cycles = [];
  if ((v.readDays || []).length){
    v.cycles.push({ startDate: v.startDate, endDate: dpTodayKey(), readDays: (v.readDays || []).slice(), readTimes: Object.assign({}, v.readTimes || {}) });
  }
  v.startDate = dpTodayKey();
  v.readDays = [];
  v.readTimes = {};
  state.futureStartDate = v.startDate;
  state.futureReadDays = v.readDays;
  CAL_SELECTED = null;
  try { saveState(); } catch(e){}
  renderFutureText(); dpRenderProgress();
  if (!silent && typeof toast === 'function') toast('تقویم ریست شد — دوره‌ی تازه از امروز 🌱');
}

function renderCalInfo(){
  var info = document.getElementById('future-cal-info');
  if (!info) return;
  if (!CAL_SELECTED){ info.style.display = 'none'; info.innerHTML = ''; return; }
  var v = getActiveVersion();
  var date = ndKeyToDate(CAL_SELECTED);
  var today = new Date(); today.setHours(0,0,0,0);
  var read = !!(v && (v.readDays || []).indexOf(CAL_SELECTED) !== -1);
  var ms = read && v.readTimes ? v.readTimes[CAL_SELECTED] : null;
  var dateTxt = dpFmtDateFa(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    ' <span style="opacity:.6;">(' + CAL_SELECTED + ')</span>';
  var status;
  if (read) status = '<b style="color:var(--emerald-700,#0f5b53);">✓ خوانده شد</b> — ساعت ' + (ms ? dpFmtTime(ms) : '<span style="opacity:.6;">ثبت نشده (قدیمی)</span>');
  else if (date > today) status = '<span style="opacity:.7;">هنوز نرسیده</span>';
  else status = '<span style="opacity:.7;">خوانده نشده</span>';
  var feel = dpDayEmotion(CAL_SELECTED);
  var feelTxt = feel
    ? '<div style="margin-top:3px;">💗 حس ثبت‌شده: <b>' + FEEL_LEVEL_FA[feel.level] + '</b>' + (feel.names.length ? ' — ' + feel.names.join('، ') : '') + '</div>'
    : '';
  info.style.display = 'block';
  info.innerHTML = '<div>' + dateTxt + '</div><div style="margin-top:3px;">' + status + '</div>' + feelTxt;
}

function updateRegisterBtn(){
  var btn = document.getElementById('future-register-btn');
  if (!btn) return;
  var v = getActiveVersion();
  var dk = dpTodayKey();
  var read = !!(v && (v.readDays || []).indexOf(dk) !== -1);
  var ms = read && v.readTimes ? v.readTimes[dk] : null;
  btn.classList.toggle('is-done', read);
  btn.innerHTML = read
    ? '✓ امروز ثبت شد' + (ms ? ' — ساعت ' + dpFmtTime(ms) : '')
    : '✅ امروز خوندم — ثبت کن';
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
      (v.text ? '<div style="font-size:11px;color:var(--ink-soft);line-height:1.6;padding:6px 8px;background:var(--surface-2);border-radius:8px;font-style:italic;margin-bottom:6px;">«' + escapeHtml(v.text.length > 100 ? v.text.slice(0, 100) + '...' : v.text) + '»</div>' : '') +
      (v.audio ? '<audio controls preload="none" src="' + v.audio + '" style="width:100%;height:32px;display:block;margin-bottom:6px;"></audio>' : '') +
      (isActive ? '' : '<div style="display:flex;gap:6px;"><button type="button" class="btn tiny" data-activate-version="' + v.id + '" style="flex:1;font-size:10.5px;padding:6px;">فعال کردن</button>' +
        '<button type="button" class="btn tiny" data-delete-version="' + v.id + '" style="flex:0 0 auto;font-size:10.5px;padding:6px 12px;color:#c0392b;">🗑 حذف</button></div>') +
    '</div>';
  });
  box.innerHTML = html;
}

var SEED_ARCHIVE_OPEN = false;

function renderSeedSection(){
  if (!state.currentBelief) return;
  var textInput = document.getElementById('seed-text-input');
  if (textInput && document.activeElement !== textInput){
    textInput.value = state.currentBelief.visualNote || '';
  }
  var archiveCount = document.getElementById('seed-archive-count');
  if (archiveCount) archiveCount.textContent = toFa((state.dpSeedArchive || []).length);
  try { renderVisualGalleryMine(); } catch(e){}
  try { renderVisualVideos(); } catch(e){}
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
  var videos = vvList().slice();
  if (!text && !images.length && !videos.length){
    if (typeof toast === 'function') toast('اول متن، عکس یا ویدیویی اضافه کن');
    return;
  }
  if (!Array.isArray(state.dpSeedArchive)) state.dpSeedArchive = [];
  state.dpSeedArchive.push({ id: 'seed_' + Date.now(), text: text, images: images, videos: videos, date: dpTodayKey() });
  cb.visualNote = '';
  cb.visualImages = [];
  cb.visualVideos = [];
  try { saveState(); } catch(e){}
  var textInput = document.getElementById('seed-text-input');
  if (textInput) textInput.value = '';
  if (typeof renderVisualGallery === 'function'){ try { renderVisualGallery(); } catch(e){} }
  renderVisualVideos();
  renderSeedSection();
  if (typeof toast === 'function') toast('بذر قبلی آرشیو شد — بذر تازه شروع کن 🌱');
}

function deleteSeedFromArchive(id){
  if (!window.confirm('این بذر آرشیوشده برای همیشه حذف شود؟')) return;
  var removedItem = (state.dpSeedArchive || []).filter(function(v){ return v.id === id; })[0];
  state.dpSeedArchive = (state.dpSeedArchive || []).filter(function(v){ return v.id !== id; });
  if (removedItem) vvCleanup(removedItem.videos);
  try { saveState(); } catch(e){}
  renderSeedSection();
  if (typeof toast === 'function') toast('بذر حذف شد');
}

function deleteFutureVersion(id){
  if (id === state.activeFutureVersionId) return;
  if (!window.confirm('این نسخه از آرشیو برای همیشه حذف شود؟')) return;
  state.futureTextVersions = (state.futureTextVersions || []).filter(function(v){ return v.id !== id; });
  try { saveState(); } catch(e){}
  renderFutureText();
  if (typeof toast === 'function') toast('نسخه حذف شد');
}

function toggleSeedArchive(){ SEED_ARCHIVE_OPEN = !SEED_ARCHIVE_OPEN; renderSeedArchiveBox(); }

function restoreSeedFromArchive(id){
  var items = state.dpSeedArchive || [];
  var item = items.filter(function(v){ return v.id === id; })[0];
  var cb = state.currentBelief;
  if (!item || !cb) return;
  cb.visualNote = item.text || '';
  if (!Array.isArray(cb.visualVideos)) cb.visualVideos = [];
  (item.videos || []).forEach(function(vd){
    if (!cb.visualVideos.some(function(x){ return x.id === vd.id; })) cb.visualVideos.push(vd);
  });
if (!Array.isArray(cb.visualImages)) cb.visualImages = [];
(item.images || []).forEach(function(img){
  cb.visualImages.push({ id: img.id, w: img.w, h: img.h });
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
        '<span style="font-size:9.5px;color:var(--muted);">' + v.date + ' • ' + toFa(imgs.length) + ' عکس' + ((v.videos || []).length ? ' • ' + toFa(v.videos.length) + ' ویدیو' : '') + '</span>' +
      '</div>' +
      (v.text ? '<div style="font-size:11px;color:var(--ink-soft);line-height:1.6;padding:6px 8px;background:var(--surface-2);border-radius:8px;font-style:italic;margin-bottom:6px;">«' + escapeHtml(v.text.length > 100 ? v.text.slice(0, 100) + '...' : v.text) + '»</div>' : '') +
      (imgs.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">' + imgs.slice(0, 6).map(function(img){ return '<img src="' + img.src + '" style="width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid var(--line);">'; }).join('') + '</div>' : '') +
      ((v.videos || []).length ? '<div style="font-size:10.5px;color:var(--ink-soft);line-height:1.7;margin-bottom:6px;">' + v.videos.slice(0, 3).map(function(x){ return '🎬 ' + escapeHtml(x.name || 'video'); }).join('<br>') + (v.videos.length > 3 ? '<br>…' : '') + '</div>' : '') +
      '<div style="display:flex;gap:6px;"><button type="button" class="btn tiny" data-restore-seed="' + v.id + '" style="flex:1;font-size:10.5px;padding:6px;">بازگردانی</button>' +
      '<button type="button" class="btn tiny" data-delete-seed="' + v.id + '" style="flex:0 0 auto;font-size:10.5px;padding:6px 12px;color:#c0392b;">🗑 حذف</button></div>' +
    '</div>';
  });
  box.innerHTML = html;
}

/* =====================================================================
   مأموریت ذهن — نسخه‌ی جدید
   ===================================================================== */
function rasDayKeyFromTs(ts){
  var d = new Date(ts);
  return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
}

var RAS_MISSIONS = [
  { id: 'opportunity', label: 'فرصت‌های کوچیک', emoji: '✨' },
  { id: 'calm',        label: 'لحظه‌های آرامش',  emoji: '😌' },
  { id: 'beauty',      label: 'زیبایی',           emoji: '🌸' },
  { id: 'kindness',    label: 'مهربانی',          emoji: '💗' },
  { id: 'growth',      label: 'رشد',              emoji: '🌱' },
  { id: 'signs',       label: 'نشانه‌های کوچیک',  emoji: '🌀' }
];

var RAS_FEELS = [
  { id: 'normal', label: 'معمولی', emoji: '🙂' },
  { id: 'calm',   label: 'آروم',    emoji: '😌' },
  { id: 'bright', label: 'روشن',    emoji: '✨' },
  { id: 'strong', label: 'قوی',     emoji: '🔥' }
];

var RAS_WEEK_DAYS = ['ش','ی','د','س','چ','پ','ج'];

function rasGetMission(){
  return (state && state.rasMission) ? state.rasMission : null;
}

function rasMissionDayCount(){
  var m = rasGetMission();
  if (!m) return 0;
  try {
    var start = ndKeyToDate(m.startDate);
    var today = new Date(); today.setHours(0,0,0,0);
    var diff = Math.floor((today - start) / 86400000) + 1;
    return Math.max(1, diff);
  } catch(e){ return 1; }
}

function rasSignalsForDay(dk){
  var all = Array.isArray(state.rasSignals) ? state.rasSignals : [];
  return all.filter(function(s){ return rasDayKeyFromTs(s.ts) === dk; });
}

function rasSignalsForLast7Days(){
  var out = [];
  var today = new Date(); today.setHours(0,0,0,0);
  for (var i = 6; i >= 0; i--){
    var d = new Date(today); d.setDate(d.getDate() - i);
    var dk = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
    out.push({ date: d, key: dk, count: rasSignalsForDay(dk).length });
  }
  return out;
}

function rasStartMission(chipId, customLabel){
  var label = customLabel || '';
  if (!label && chipId){
    for (var i = 0; i < RAS_MISSIONS.length; i++){
      if (RAS_MISSIONS[i].id === chipId){ label = RAS_MISSIONS[i].label; break; }
    }
  }
  if (!label) return;
  if (!state.rasMission || typeof state.rasMission !== 'object') state.rasMission = {};
  state.rasMission = {
    label: label,
    chip: chipId || 'custom',
    startDate: dpTodayKey(),
    endedAt: null
  };
  try { saveState(); } catch(e){}
  rasRenderMission();
  if (typeof toast === 'function') toast('مأموریت شروع شد 🎯');
}

function rasEndMission(){
  var m = rasGetMission();
  if (!m) return;
  if (!window.confirm('مأموریت فعلی رو تموم کنی و یکی جدید انتخاب کنی؟')) return;
  if (!Array.isArray(state.rasMissionHistory)) state.rasMissionHistory = [];
  state.rasMissionHistory.push({
    label: m.label, chip: m.chip,
    startDate: m.startDate, endedAt: dpTodayKey()
  });
  state.rasMission = null;
  try { saveState(); } catch(e){}
  rasRenderMission();
}

var rasSheetSelectedFeel = 'normal';

function rasOpenRecordSheet(){
  var overlay = document.getElementById('ras-record-sheet');
  if (!overlay){
    overlay = document.createElement('div');
    overlay.id = 'ras-record-sheet';
    overlay.className = 'ras-sheet-overlay';
    overlay.innerHTML = rasRecordSheetHtml();
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) rasCloseRecordSheet();
    });
  }
  overlay.classList.add('open');
  rasSheetSelectedFeel = 'normal';
  rasSheetUpdateFeelUI();
  var ta = document.getElementById('ras-sheet-text');
  if (ta){ ta.value = ''; setTimeout(function(){ try { ta.focus(); } catch(e){} }, 120); }
  var sb = document.getElementById('ras-sheet-save');
  if (sb) sb.disabled = true;
}

function rasCloseRecordSheet(){
  var overlay = document.getElementById('ras-record-sheet');
  if (overlay) overlay.classList.remove('open');
  try { document.activeElement && document.activeElement.blur(); } catch(e){}
}

function rasSheetUpdateFeelUI(){
  var btns = document.querySelectorAll('#ras-record-sheet .ras-sheet-feel');
  for (var i = 0; i < btns.length; i++){
    btns[i].classList.toggle('selected', btns[i].getAttribute('data-feel') === rasSheetSelectedFeel);
  }
}

function rasSheetCheckSave(){
  var ta = document.getElementById('ras-sheet-text');
  var sb = document.getElementById('ras-sheet-save');
  if (!ta || !sb) return;
  sb.disabled = !ta.value.trim();
}

function rasSaveFromSheet(){
  var ta = document.getElementById('ras-sheet-text');
  if (!ta) return;
  var text = ta.value.trim();
  if (!text) return;
  if (!Array.isArray(state.rasSignals)) state.rasSignals = [];
  state.rasSignals.push({
    id: 'sig_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
    ts: Date.now(),
    text: text,
    feel: rasSheetSelectedFeel || 'normal'
  });
  try { saveState(); } catch(e){}
  rasCloseRecordSheet();
  rasRenderMission();
  autoPracticeFiber('tracking');
  if (typeof toast === 'function') toast('ثبت شد ✨');
}

function rasDeleteSignal(id){
  if (!Array.isArray(state.rasSignals)) return;
  state.rasSignals = state.rasSignals.filter(function(s){ return s.id !== id; });
  try { saveState(); } catch(e){}
  rasRenderMission();
}

function rasFeedLast3(){
  var all = Array.isArray(state.rasSignals) ? state.rasSignals.slice() : [];
  all.sort(function(a,b){ return b.ts - a.ts; });
  return all.slice(0, 3);
}

function rasFeelingMeta(id){
  for (var i = 0; i < RAS_FEELS.length; i++) if (RAS_FEELS[i].id === id) return RAS_FEELS[i];
  return RAS_FEELS[0];
}

function rasRecordSheetHtml(){
  var feelsHtml = RAS_FEELS.map(function(f){
    return '<button type="button" class="ras-sheet-feel" data-feel="' + f.id + '">' +
      '<span>' + f.emoji + '</span><span>' + f.label + '</span>' +
    '</button>';
  }).join('');
  return '<div class="ras-sheet-card">' +
    '<div class="ras-sheet-handle"></div>' +
    '<div class="ras-sheet-title">✋ چی دیدی؟</div>' +
    '<textarea id="ras-sheet-text" class="ras-sheet-text" placeholder="مثلاً: یه لبخند از یه غریبه توی صف نون..."></textarea>' +
    '<div class="ras-sheet-feel-lbl">حست چی بود؟</div>' +
    '<div class="ras-sheet-feels">' + feelsHtml + '</div>' +
    '<div class="ras-sheet-actions">' +
      '<button type="button" class="ras-sheet-cancel" data-ras-sheet="cancel">لغو</button>' +
      '<button type="button" class="ras-sheet-save" id="ras-sheet-save" data-ras-sheet="save" disabled>ذخیره</button>' +
    '</div>' +
  '</div>';
}

function rasEmptyStateHtml(){
  var chipsHtml = RAS_MISSIONS.map(function(m){
    return '<button type="button" class="ras-chip" data-ras-chip="' + m.id + '">' +
      '<span>' + m.emoji + '</span><span>' + m.label + '</span>' +
    '</button>';
  }).join('');
  return '<div class="ras-empty">' +
    '<span class="ras-empty-icon">👁️</span>' +
    '<div class="ras-empty-title">امروز می‌خوای چه چیزی رو بیشتر ببینی؟</div>' +
    '<div class="ras-empty-desc">ذهن تو هر لحظه داره فیلتر می‌کنه. اگه بدونی دنبال چی می‌گردی، همون چیز یهو «همه‌جا» ظاهر می‌شه.</div>' +
    '<div class="ras-chips" id="ras-chips">' + chipsHtml + '</div>' +
    '<textarea class="ras-custom-input" id="ras-custom-input" placeholder="یا خودت بنویس: چیزی که می‌خوام ببینم..."></textarea>' +
    '<button type="button" class="ras-start-btn" id="ras-start-btn" disabled>🚀 شروع مأموریت</button>' +
  '</div>';
}

function rasActiveStateHtml(m){
  var day = rasMissionDayCount();
  var todayCount = rasSignalsForDay(dpTodayKey()).length;
  var weekCount = rasSignalsForLast7Days().reduce(function(s,d){ return s + d.count; }, 0);
  var totalCount = Array.isArray(state.rasSignals) ? state.rasSignals.length : 0;

  var heatDays = rasSignalsForLast7Days();
  var todayKey = dpTodayKey();
  var heatHtml = heatDays.map(function(d, i){
    var lvl = d.count === 0 ? '' : (d.count <= 2 ? 'l1' : (d.count <= 4 ? 'l2' : 'l3'));
    var isToday = d.key === todayKey;
    return '<div class="ras-heat-day ' + lvl + (isToday ? ' today' : '') + '" title="' + d.key + ' — ' + d.count + '">' +
      (d.count > 0 ? d.count : '') +
      '<small>' + RAS_WEEK_DAYS[i] + '</small>' +
    '</div>';
  }).join('');

  var feed = rasFeedLast3();
  var feedHtml = '';
  if (!feed.length){
    feedHtml = '<div class="ras-feed-empty">امروز هنوز چیزی ندیدی؟<br>چشم‌هات رو باز کن 👀</div>';
  } else {
    feedHtml = feed.map(function(s){
      var d = new Date(s.ts);
      var timeStr = d.toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit'});
      var dateStr = rasDayKeyFromTs(s.ts) === todayKey ? 'امروز' : d.toLocaleDateString('fa-IR');
      var feel = rasFeelingMeta(s.feel || 'normal');
      return '<div class="ras-feed-item">' +
        '<div class="ras-feed-meta">' +
          '<span class="ras-feed-time">🌀 ' + dateStr + ' ' + timeStr + '</span>' +
          '<span class="ras-feed-feel ras-feel-' + feel.id + '">' + feel.emoji + ' ' + feel.label + '</span>' +
        '</div>' +
        '<div class="ras-feed-text">' + escapeHtml(s.text) + '</div>' +
        '<button type="button" class="ras-feed-del" data-ras-del="' + s.id + '" title="حذف">×</button>' +
      '</div>';
    }).join('');
  }

  var recordBtnClass = 'ras-record-btn' + (todayCount === 0 ? ' pulse' : '');

  return '<div class="ras-active">' +
    '<div class="ras-active-header">' +
      '<div class="ras-active-label">✨ ' + escapeHtml(m.label) +
        '<small>روز ' + toFa(day) + ' • از ' + m.startDate + '</small>' +
      '</div>' +
      '<button type="button" class="ras-change-btn" id="ras-change-btn" title="تغییر مأموریت">↻</button>' +
    '</div>' +
    '<button type="button" class="' + recordBtnClass + '" id="ras-record-btn">' +
      '✋ ' + (todayCount === 0 ? 'امروز چیزی دیدی؟ ثبت کن' : 'ثبت نشانه‌ی جدید') +
    '</button>' +
    '<div class="ras-stats">' +
      '<div class="ras-stat"><span class="ras-stat-num">' + toFa(todayCount) + '</span><span class="ras-stat-lbl">امروز</span></div>' +
      '<div class="ras-stat"><span class="ras-stat-num">' + toFa(weekCount) + '</span><span class="ras-stat-lbl">این هفته</span></div>' +
      '<div class="ras-stat"><span class="ras-stat-num">' + toFa(totalCount) + '</span><span class="ras-stat-lbl">کل</span></div>' +
    '</div>' +
    '<div class="ras-feed-title">📊 پیشرفت هفته<span>هفته‌ی اخیر</span></div>' +
    '<div class="ras-heatmap">' + heatHtml + '</div>' +
    '<div class="ras-feed-title">📖 آخرین نشانه‌ها<span>' + toFa(feed.length) + ' از ' + toFa(totalCount) + '</span></div>' +
    feedHtml +
  '</div>';
}

function rasRenderMission(){
  var box = document.getElementById('ras-mission-content');
  if (!box) return;
  var m = rasGetMission();
  if (!m){ box.innerHTML = rasEmptyStateHtml(); wireRasEmptyState(); }
  else { box.innerHTML = rasActiveStateHtml(m); }
}

function wireRasEmptyState(){
  var chips = document.querySelectorAll('#ras-chips .ras-chip');
  var input = document.getElementById('ras-custom-input');
  var btn = document.getElementById('ras-start-btn');
  var selectedChip = null;

  function refresh(){
    var hasCustom = input && input.value.trim().length > 0;
    var hasChip = !!selectedChip;
    if (btn) btn.disabled = !(hasCustom || hasChip);
    if (input) input.style.borderColor = '';
  }

  for (var i = 0; i < chips.length; i++){
    (function(chip){
      chip.addEventListener('click', function(){
        var id = chip.getAttribute('data-ras-chip');
        if (selectedChip === id){ selectedChip = null; chip.classList.remove('selected'); }
        else {
          for (var j = 0; j < chips.length; j++) chips[j].classList.remove('selected');
          chip.classList.add('selected');
          selectedChip = id;
          if (input) input.value = '';
        }
        refresh();
      });
    })(chips[i]);
  }
  if (input){
    input.addEventListener('input', function(){
      if (input.value.trim()){
        selectedChip = null;
        for (var j = 0; j < chips.length; j++) chips[j].classList.remove('selected');
      }
      refresh();
    });
  }
  if (btn){
    btn.addEventListener('click', function(){
      if (input && input.value.trim()) rasStartMission(null, input.value.trim());
      else if (selectedChip) rasStartMission(selectedChip, null);
    });
  }
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
    if (hint) hint.textContent = toFa(done.length) + ' از ۵ مرحله';

    var periodDays = getFutureDays();
    var totalDays = Math.min((state.dispenzaReadDays || []).length, periodDays);
    var countEl = document.getElementById('dp-session-count');
    if (countEl) countEl.textContent = toFa(totalDays * 2) + ' جلسه';

    var v = getActiveVersion();
    var readDays = v && v.readDays ? v.readDays.length : 0;
    var doneCount = Math.min(readDays, periodDays);
    var numEl = document.getElementById('future-day-num');
    var totEl = document.getElementById('future-day-total');
    var pbar = document.getElementById('future-progress-bar');
    if (numEl) numEl.textContent = toFa(doneCount);
    if (totEl) totEl.textContent = toFa(periodDays);
    if (pbar) pbar.style.width = (doneCount / periodDays * 100) + '%';

    var em = document.getElementById('dp-emotion-feedback');
    if (em){
      var q = getTodayEmotionQualityFor('dispenza');
      if (q === null) em.textContent = '';
      else if (q >= 500) em.textContent = '🔥 حس پرقدرت';
      else if (q < 200) em.textContent = '⚠️ حس ضعیف';
      else em.textContent = '✓ ثبت شد';
    }

    var fem = document.getElementById('future-emotion-feedback');
    if (fem){
      var fq = getTodayEmotionQualityFor('dispenza');
      if (fq === null) fem.textContent = '';
      else if (fq >= 500) fem.textContent = '🔥 حس پرقدرت — رشته‌ی بعدی ضخیم‌تر می‌شه';
      else if (fq < 200) fem.textContent = '⚠️ حس ضعیف';
      else fem.textContent = '✓ ثبت شد';
    }

    var bem = document.getElementById('belief-emotion-feedback');
    if (bem){
      var bq = getTodayEmotionQualityFor('belief');
      if (bq === null) bem.textContent = '';
      else if (bq >= 500) bem.textContent = '🔥 حس پرقدرت';
      else if (bq < 200) bem.textContent = '⚠️ حس ضعیف';
      else bem.textContent = '✓ ثبت شد';
    }

    try { rasRenderMission(); } catch(e){}
    try { refreshNothingVisual(); } catch(e){}
  }

  var dpTimerInterval = null;
  var dpTimerSeconds = 15 * 60;

  function dpStartTimer(){
    var btn = document.getElementById('dp-timer-btn');
    var disp = document.getElementById('dp-timer-display');
    if (!btn || !disp) return;
    if (dpTimerInterval){ clearInterval(dpTimerInterval); dpTimerInterval = null; btn.textContent = 'ادامه'; return; }
    btn.textContent = 'توقف';
    dpTimerInterval = setInterval(function(){
      dpTimerSeconds--;
      if (dpTimerSeconds <= 0){
        clearInterval(dpTimerInterval); dpTimerInterval = null;
        disp.textContent = '۰۰:۰۰'; btn.textContent = 'پایان';
        if (navigator.vibrate) try { navigator.vibrate([200,100,200]); } catch(e){}
        if (typeof playCompletionGong === 'function') playCompletionGong();
        return;
      }
      var m = Math.floor(dpTimerSeconds/60).toString().padStart(2,'0');
      var s = (dpTimerSeconds%60).toString().padStart(2,'0');
      disp.textContent = m + ':' + s;
    }, 1000);
  }

  var breathTimer = null;
  var breathPhase = 'idle';

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
    if (phase === 'idle'){ prog.style.strokeDashoffset = 289; return; }
    if (phase === 'inhale'){ circle.classList.add('inhale'); prog.style.strokeDashoffset = 0; }
    else if (phase === 'hold'){ prog.style.strokeDashoffset = 0; }
    else if (phase === 'exhale'){ circle.classList.add('exhale'); prog.style.strokeDashoffset = 289; }
  }

  function runBreathCycle(){
    breathPhase = 'inhale'; setBreathUI('inhale', 4);
    breathTimer = setTimeout(function(){
      breathPhase = 'hold'; setBreathUI('hold', 7);
      breathTimer = setTimeout(function(){
        breathPhase = 'exhale'; setBreathUI('exhale', 8);
        breathTimer = setTimeout(function(){ runBreathCycle(); }, 8000);
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

  function fgScrollers(el){
    var list = [], n = el ? el.parentNode : null;
    while (n && n.nodeType === 1 && n !== document.body && n !== document.documentElement){
      try {
        var oy = getComputedStyle(n).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) list.push(n);
      } catch(e){}
      n = n.parentNode;
    }
    list.push(document.scrollingElement || document.documentElement);
    return list;
  }
  function fgKeepTop(el, top0){
    if (!el || top0 === null || top0 === undefined) return;
    var sc = fgScrollers(el);
    for (var i = 0; i < sc.length; i++){
      var d = el.getBoundingClientRect().top - top0;
      if (Math.abs(d) < 1) return;
      sc[i].scrollTop += d;
    }
  }
  function fgHoldAnchor(el){
    var top0 = el.getBoundingClientRect().top;
    var fix = function(){ try { fgKeepTop(el, top0); } catch(e){} };
    if (window.requestAnimationFrame) requestAnimationFrame(fix);
    [40, 120, 260, 500].forEach(function(ms){ setTimeout(fix, ms); });
  }
  function fgrow(el){
    if (!el) return;
    var top0 = el.getBoundingClientRect().top;
    var host = el.parentNode;
    if (host && host.style) host.style.minHeight = host.offsetHeight + 'px';
    el.style.height = 'auto';
    el.style.height = Math.max(el.scrollHeight + 4, 120) + 'px';
    if (host && host.style) host.style.minHeight = '';
    fgKeepTop(el, top0);
  }
  function caretFromPoint(x, y, display){
    try {
      var node = null, off = 0;
      if (document.caretPositionFromPoint){
        var cp = document.caretPositionFromPoint(x, y);
        if (cp){ node = cp.offsetNode; off = cp.offset; }
      } else if (document.caretRangeFromPoint){
        var r = document.caretRangeFromPoint(x, y);
        if (r){ node = r.startContainer; off = r.startOffset; }
      }
      if (!node || node.nodeType !== 3 || node !== display.firstChild) return null;
      return Math.max(0, off - 1);
    } catch(e){ return null; }
  }
  function openFutureEditor(caretPos){
    var v = getActiveVersion();
    var editorBox = document.getElementById('future-editor');
    var input = document.getElementById('future-editor-input');
    var display = document.getElementById('future-display');
    var actions = document.getElementById('future-actions');
    if (!editorBox || !input) return;
    var beforeTop = display ? display.getBoundingClientRect().top : null;
    input.value = v ? v.text : '';
    editorBox.style.display = 'block';
    if (display) display.style.display = 'none';
    if (actions) actions.style.display = 'none';
    var recB = document.getElementById('future-rec-btn'); if (recB) recB.style.display = 'none';
    try { applyFutureFmt(); } catch(e){}
    fgrow(input);
    if (beforeTop !== null){
      window.scrollBy(0, input.getBoundingClientRect().top - beforeTop);
    }
    var pos = (typeof caretPos === 'number') ? Math.min(caretPos, input.value.length) : input.value.length;
    try { input.focus({ preventScroll: true }); input.setSelectionRange(pos, pos); }
    catch(e){ try { input.focus(); } catch(e2){} }
  }
  function closeFutureEditor(){
    var editorBox = document.getElementById('future-editor');
    var display = document.getElementById('future-display');
    var actions = document.getElementById('future-actions');
    if (editorBox) editorBox.style.display = 'none';
    if (display) display.style.display = 'block';
    if (actions) actions.style.display = 'flex';
    var recB = document.getElementById('future-rec-btn'); if (recB) recB.style.display = 'flex';
  }
  document.addEventListener('input', function(e){
    var t = e.target;
    if (t && t.tagName === 'TEXTAREA' && (t.id === 'future-editor-input' || t.id === 'dp-possibility-fear' ||
        t.id === 'dp-possibility-money' || t.id === 'dp-possibility-approval' || t.id === 'seed-text-input')){
      fgrow(t);
    }
  });
  document.addEventListener('click', function(e){
    var d = e.target && e.target.closest ? e.target.closest('#future-display') : null;
    if (!d || e.target.tagName === 'AUDIO') return;
    var sel = window.getSelection && window.getSelection();
    if (sel && String(sel).length > 0) return;
    var v = getActiveVersion();
    if (!v || !v.text) return;
    openFutureEditor(caretFromPoint(e.clientX, e.clientY, d));
  });
  function saveFutureText(){
    var input = document.getElementById('future-editor-input');
    if (!input) return;
    var newText = (input.value || '').trim();
    if (!newText){ if (typeof toast === 'function') toast('متن نمی‌تونه خالی باشه'); return; }
    var v = getActiveVersion();
    if (v && newText === v.text){ closeFutureEditor(); return; }
    if (v){
      if (!Array.isArray(v.prevTexts)) v.prevTexts = [];
      v.prevTexts.push({ text: v.text, at: Date.now() });
      v.text = newText;
      state.futureText = newText;
      state.futureStartDate = v.startDate;
      state.futureReadDays = v.readDays || [];
      try { saveState(); } catch(e){}
      closeFutureEditor(); renderFutureText(); dpRenderProgress();
      if (typeof toast === 'function') toast('متن ویرایش شد ✏️ (دوره و تقویم همان‌طور ماند)');
      return;
    }
    var newV = { id: 'v_' + Date.now(), text: newText, startDate: dpTodayKey(), endDate: null, readDays: [] };
    if (!Array.isArray(state.futureTextVersions)) state.futureTextVersions = [];
    state.futureTextVersions.push(newV);
    state.activeFutureVersionId = newV.id;
    state.futureText = newText;
    state.futureStartDate = newV.startDate;
    state.futureReadDays = newV.readDays;
    try { saveState(); } catch(e){}
    closeFutureEditor(); renderFutureText(); dpRenderProgress();
    if (typeof toast === 'function') toast('متن خواسته‌ات ثبت شد ✨');
  }
  var recState = { rec: null, stream: null, chunks: [], timer: null, sec: 0 };

  function recPickMime(){
    if (typeof MediaRecorder === 'undefined') return null;
    var list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (var i = 0; i < list.length; i++){
      try { if (MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch(e){}
    }
    return '';
  }

  function recSetBtn(recording){
    var btn = document.getElementById('future-rec-btn');
    if (!btn) return;
    btn.classList.toggle('recording', !!recording);
    if (!recording){ btn.textContent = '🎙️'; btn.title = 'ضبط صدا'; return; }
    var m = Math.floor(recState.sec / 60), s2 = recState.sec % 60;
    btn.textContent = '⏹ ' + toFa(m) + ':' + toFa(s2 < 10 ? '0' + s2 : s2);
    btn.title = 'پایان ضبط';
  }

  function recCleanup(){
    if (recState.timer){ clearInterval(recState.timer); recState.timer = null; }
    if (recState.stream){ recState.stream.getTracks().forEach(function(t){ try { t.stop(); } catch(e){} }); }
    recState.stream = null; recState.rec = null; recState.sec = 0;
    recSetBtn(false);
  }

  function saveFutureAudio(dataUrl){
    var v = getActiveVersion();
    if (v) v.endDate = dpTodayKey();
    var newV = { id: 'v_' + Date.now(), text: '', audio: dataUrl, startDate: dpTodayKey(), endDate: null, readDays: [] };
    if (!Array.isArray(state.futureTextVersions)) state.futureTextVersions = [];
    state.futureTextVersions.push(newV);
    state.activeFutureVersionId = newV.id;
    state.futureText = '';
    state.futureStartDate = newV.startDate;
    state.futureReadDays = newV.readDays;
    try { saveState(); } catch(e){}
    renderFutureText(); dpRenderProgress();
    if (typeof toast === 'function') toast('ویس ثبت شد 🎙️');
  }

  function toggleFutureRecording(){
    if (recState.rec){
      try { recState.rec.stop(); } catch(e){ recCleanup(); }
      return;
    }
    var mime = recPickMime();
    if (mime === null || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      if (typeof toast === 'function') toast('مرورگر از ضبط صدا پشتیبانی نمی‌کنه');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream){
      var opts = { audioBitsPerSecond: 32000 };
      if (mime) opts.mimeType = mime;
      var rec;
      try { rec = new MediaRecorder(stream, opts); }
      catch(e){ try { rec = new MediaRecorder(stream); } catch(e2){
        stream.getTracks().forEach(function(t){ t.stop(); });
        if (typeof toast === 'function') toast('ضبط صدا شروع نشد');
        return;
      } }
      recState.stream = stream; recState.rec = rec; recState.chunks = []; recState.sec = 0;
      rec.ondataavailable = function(ev){ if (ev.data && ev.data.size) recState.chunks.push(ev.data); };
      rec.onstop = function(){
        var type = rec.mimeType || mime || 'audio/webm';
        var blob = new Blob(recState.chunks, { type: type });
        recCleanup();
        if (!blob.size) return;
        var fr = new FileReader();
        fr.onload = function(){ saveFutureAudio(fr.result); };
        fr.readAsDataURL(blob);
      };
      rec.start();
      recSetBtn(true);
      recState.timer = setInterval(function(){
        recState.sec++;
        recSetBtn(true);
      }, 1000);
    }).catch(function(){
      if (typeof toast === 'function') toast('اجازه‌ی میکروفون داده نشد');
    });
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
    if (!v || (!v.text && !v.audio)){ if (typeof toast === 'function') toast('اول متن خواسته‌ات را بنویس یا ویس ضبط کن'); return; }
    dpMarkRead(v, dk);
    CAL_SELECTED = dk;
    if (!state.futureReadDays) state.futureReadDays = [];
    if (state.futureReadDays.indexOf(dk) === -1) state.futureReadDays.push(dk);
    if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
    if (state.dispenzaReadDays.indexOf(dk) === -1) state.dispenzaReadDays.push(dk);
    var dn = dpGetNeural();
    if (typeof neuralAddFiber === 'function') neuralAddFiber(dn, {calendarLinked:false});
    else { dn.logs['f' + Date.now() + '-' + Math.random().toString(36).slice(2,8)] = true; }
    try { saveState(); } catch(e){}
    renderFutureText(); dpRenderProgress(); renderOurNeuralPathways();
    if (typeof toast === 'function') toast('✓ امروز ثبت شد — ساعت ' + dpFmtTime(v.readTimes[dk]));
  }

  function autoDailyFiber(container){
    try {
      if (!container || typeof neuralAddFiber !== 'function') return false;
      if (!container.autoDays || typeof container.autoDays !== 'object') container.autoDays = {};
      var dk = dpTodayKey();
      if (container.autoDays[dk]) return false;
      container.autoDays[dk] = true;
      neuralAddFiber(container, { calendarLinked: false });
      return true;
    } catch(e){ console.warn('[auto-fiber]', e); return false; }
  }
  function autoPracticeFiber(kind){
    var c = null;
    try {
      if (kind === 'tracking' && typeof ensureTrackingNeural === 'function') c = ensureTrackingNeural();
      if (kind === 'visual' && typeof ensureVisualNeural === 'function') c = ensureVisualNeural();
    } catch(e){}
    if (!c) return;
    if (autoDailyFiber(c)){
      try { saveState(); } catch(e){}
      try { renderOurNeuralPathways(); } catch(e){}
    }
  }

  function renderOurNeuralPathways(){
    if (typeof renderNeuralPathway !== 'function') return;
    if (document.getElementById('np-dispenza-mount')){
      try {
        var dn = dpGetNeural();
        renderNeuralPathway('np-dispenza-mount', dn, {
          label: 'تمرین', practiceKey: 'dispenza', showDayButtons: false, onChange: saveState
        });
      } catch(e){ console.warn('[np-dispenza]', e); }
    }
    if (document.getElementById('np-tracking-mount') && typeof ensureTrackingNeural === 'function'){
      try {
        renderNeuralPathway('np-tracking-mount', ensureTrackingNeural(), {
          label: 'ردیابی RAS', practiceKey: 'tracking', showDayButtons: false, onChange: saveState
        });
      } catch(e){ console.warn('[np-tracking]', e); }
    }
    if (document.getElementById('np-visual-mount') && typeof ensureVisualNeural === 'function'){
      try {
        renderNeuralPathway('np-visual-mount', ensureVisualNeural(), {
          label: 'تصاویر', practiceKey: 'visual', showDayButtons: false, onChange: saveState
        });
      } catch(e){ console.warn('[np-visual]', e); }
    }
  }
  function overrideRenderAll(){
    var orig = window.renderAllNeuralPathways;
    if (orig && orig.__chainedV1) return;
    var chained = function(){
      if (typeof orig === 'function'){
        try { orig.apply(this, arguments); } catch(e){ console.warn('[render-all-neural]', e); }
      }
      renderOurNeuralPathways();
    };
    chained.__chainedV1 = true;
    window.renderAllNeuralPathways = chained;
  }
  function wrapRenderBeliefsView(){
    if (typeof window.renderBeliefsView !== 'function') return;
    if (window.renderBeliefsView.__patchedV13) return;
    var original = window.renderBeliefsView;
    window.renderBeliefsView = function(){
      try { original.apply(this, arguments); } catch(e){}
      try { renderFutureText(); } catch(e){}
      try { renderSeedSection(); } catch(e){}
      try { dpRenderProgress(); } catch(e){}
      try { renderOurNeuralPathways(); } catch(e){}
      try { buildNothingDust(); } catch(e){}
      try { refreshNothingVisual(); } catch(e){}
      try { startNothingWaves(); } catch(e){}
    };
    window.renderBeliefsView.__patchedV13 = true;
  }

  function wrapEmotionSave(){
    if (typeof window.saveEmotionCaptureFromWidget !== 'function') return;
    if (window.saveEmotionCaptureFromWidget.__calPatched) return;
    var original = window.saveEmotionCaptureFromWidget;
    window.saveEmotionCaptureFromWidget = function(){
      var r;
      try { r = original.apply(this, arguments); } catch(e){ console.warn('[emotion-save]', e); }
      try { renderMiniCal(); } catch(e){}
      try { dpRenderProgress(); } catch(e){}
      return r;
    };
    window.saveEmotionCaptureFromWidget.__calPatched = true;
  }

  function wireEvents(){
    document.addEventListener('click', function(e){
      var t = e.target;
      if (!t || !t.closest) return;

      var vgOpenBtn = t.closest('[data-vg-open]');
      if (vgOpenBtn){ e.stopPropagation(); VG_SRC = null; vgOpen(parseInt(vgOpenBtn.getAttribute('data-vg-open'), 10) || 0); return; }
      var vgGoBtn = t.closest('[data-vg-go]');
      if (vgGoBtn){ e.stopPropagation(); vgOverviewHide(); vgGoto(parseInt(vgGoBtn.getAttribute('data-vg-go'), 10) || 0, false); return; }
      var vgActBtn = t.closest('[data-vg]');
      if (vgActBtn){ e.stopPropagation(); vgAction(vgActBtn.getAttribute('data-vg')); return; }

      var vvDelBtn = t.closest('[data-vv-del]');
      if (vvDelBtn){ e.stopPropagation(); vvRemove(vvDelBtn.getAttribute('data-vv-del')); return; }

      var fmtBtn = t.closest('.fmt-btn[data-fmt]');
      if (fmtBtn){ e.stopPropagation(); handleFmtClick(fmtBtn); return; }

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

      var chip = t.closest('.nothing-layer-chip');
      if (chip){
        var chipKey = chip.dataset.nothing;
        if (typeof toggleNothingStep === 'function'){
          toggleNothingStep(chipKey);
        }
        setTimeout(function(){ try { refreshNothingVisual(); } catch(e){} }, 80);
        return;
      }

      var nothingStep = t.closest('.nothing-step');
      if (nothingStep){
        setTimeout(function(){ try { refreshNothingVisual(); } catch(e){} }, 80);
        return;
      }

      /* ---- مأموریت ذهن (جدید) ---- */
      if (t.id === 'ras-record-btn'){ rasOpenRecordSheet(); return; }
      if (t.id === 'ras-change-btn'){ rasEndMission(); return; }

      var sheetBtn = t.closest('[data-ras-sheet]');
      if (sheetBtn){
        var act = sheetBtn.getAttribute('data-ras-sheet');
        if (act === 'cancel') rasCloseRecordSheet();
        else if (act === 'save') rasSaveFromSheet();
        return;
      }

      var feelBtn = t.closest('#ras-record-sheet .ras-sheet-feel');
      if (feelBtn){
        rasSheetSelectedFeel = feelBtn.getAttribute('data-feel') || 'normal';
        rasSheetUpdateFeelUI();
        return;
      }

      var delBtn = t.closest('[data-ras-del]');
      if (delBtn){ rasDeleteSignal(delBtn.dataset.rasDel); return; }

      if (t.id === 'breath-start-btn'){ startBreathing(); return; }
      if (t.id === 'dp-timer-btn'){ dpStartTimer(); return; }
      if (t.closest('#future-rec-btn')){ toggleFutureRecording(); return; }
      if (t.id === 'edit-future-btn'){ openFutureEditor(); return; }
      if (t.id === 'future-save-btn'){ saveFutureText(); return; }
      if (t.id === 'future-cancel-btn'){ closeFutureEditor(); return; }
      if (t.id === 'archive-future-btn'){ toggleArchive(); return; }
      if (t.closest('#future-register-btn')){ registerTodayRead(); return; }
      if (t.closest('#future-cal-reset-btn')){ resetFutureCalendar(); return; }
      if (t.closest('#future-cal-days-btn')){ setFutureCalDays(); return; }
      var calCell = t.closest('.mini-cal-day[data-cal-key]');
      if (calCell){
        CAL_SELECTED = calCell.dataset.calKey;
        document.querySelectorAll('.mini-cal-day.selected').forEach(function(x){ x.classList.remove('selected'); });
        calCell.classList.add('selected');
        renderCalInfo();
        return;
      }
      var delVerBtn = t.closest('[data-delete-version]');
      if (delVerBtn){ deleteFutureVersion(delVerBtn.dataset.deleteVersion); return; }
      var actBtn = t.closest('[data-activate-version]');
      if (actBtn){ activateVersion(actBtn.dataset.activateVersion); return; }

      if (t.id === 'new-seed-btn'){ archiveSeedVersion(); return; }
      if (t.id === 'archive-seed-btn'){ toggleSeedArchive(); return; }
      var delSeedBtn = t.closest('[data-delete-seed]');
      if (delSeedBtn){ deleteSeedFromArchive(delSeedBtn.dataset.deleteSeed); return; }
      var restoreSeedBtn = t.closest('[data-restore-seed]');
      if (restoreSeedBtn){ restoreSeedFromArchive(restoreSeedBtn.dataset.restoreSeed); return; }

      if (t.id === 'dp-complete-btn'){
        var quality = getTodayEmotionQualityFor('dispenza');
        var done2 = dpGetTodaySteps();
        var count = done2.length;
        var fibers = 1;
        var msg = 'ثبت شد — یک مسیر تازه 🧠';
        if (count === 0){ fibers = 0; msg = 'اول حداقل یک مرحله را تیک بزن'; }
        else if (count === 6 && quality !== null){
          if (quality >= 500){ fibers = 2; msg = '🔥 همه مراحل + حس پرقدرت — دو مسیر ساخته شد!'; }
          else if (quality < 200){ fibers = 0; msg = '⚠️ حس ضعیف — دفعه‌ی بعد عمیق‌تر'; }
        }
        var dn2 = (typeof ensureDispenzaNeural === 'function') ? ensureDispenzaNeural() : null;
        if (dn2 && fibers > 0){
          for (var i = 0; i < fibers; i++){
            if (typeof neuralAddFiber === 'function') neuralAddFiber(dn2, {calendarLinked:false});
          }
        }
        var dk = dpTodayKey();
        if (!state.dispenzaReadDays) state.dispenzaReadDays = [];
        if (state.dispenzaReadDays.indexOf(dk) === -1) state.dispenzaReadDays.push(dk);
        var v = getActiveVersion();
        if (v) dpMarkRead(v, dk);
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
      if (id === 'seed-text-input'){ onSeedTextInput(e.target.value); }
      if (id === 'ras-sheet-text'){ rasSheetCheckSave(); return; }
    });

    document.addEventListener('keydown', function(e){
      if (VC){ if (e.key === 'Escape') vcClose(); return; }
      if (!VG_VIEW.open) return;
      if (e.key === 'Escape') vgClose();
      else if (e.key === 'ArrowLeft') vgGoto(VG_VIEW.idx - 1, true);
      else if (e.key === 'ArrowRight') vgGoto(VG_VIEW.idx + 1, true);
    });

    ['cut', 'copy', 'paste'].forEach(function(evName){
      document.addEventListener(evName, function(e){
        var t = e.target;
        if (t && t.tagName === 'TEXTAREA') fgHoldAnchor(t);
      }, true);
    });

    document.addEventListener('change', function(e){
      if (e.target && e.target.id === 'visual-image-input'){
        vgAddFiles(e.target.files);
        try { e.target.value = ''; } catch(e2){}
        return;
      }
      if (e.target && e.target.id === 'visual-video-input'){
        vvAddFiles(e.target.files);
        try { e.target.value = ''; } catch(e2){}
        return;
      }
      if (e.target && e.target.id === 'fmt-font'){
        var f = getFutureFmt(); f.font = e.target.value; saveFutureFmt(f);
      }
    });

    document.addEventListener('visibilitychange', function(){
      if (document.hidden) stopNothingWaves();
      else startNothingWaves();
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

  function boot(){
    if (!ensureState()){ setTimeout(boot, 100); return; }
    window.handleVisualImages = vgAddFiles;
    window.renderVisualGallery = renderVisualGalleryMine;
    if (typeof window.__keepScroll === 'function'){
      var ks = window.__keepScroll;
      try { renderFutureText = ks(renderFutureText); } catch(e){}
      try { renderSeedSection = ks(renderSeedSection); } catch(e){}
      try { renderSeedArchiveBox = ks(renderSeedArchiveBox); } catch(e){}
      try { renderArchiveBox = ks(renderArchiveBox); } catch(e){}
      try { renderVisualGalleryMine = ks(renderVisualGalleryMine); } catch(e){}
      try { renderVisualVideos = ks(renderVisualVideos); } catch(e){}
      try { dpRenderProgress = ks(dpRenderProgress); } catch(e){}
      try { saveFutureText = ks(saveFutureText); } catch(e){}
      try { archiveSeedVersion = ks(archiveSeedVersion); } catch(e){}
      try { deleteSeedFromArchive = ks(deleteSeedFromArchive); } catch(e){}
      try { restoreSeedFromArchive = ks(restoreSeedFromArchive); } catch(e){}
      window.renderVisualGallery = renderVisualGalleryMine;
    }
    window.vgClose = vgClose;
    window.vgOpenFrom = vgOpenFrom;
    window.vcClose = vcClose;
    window.closeFutureEditor = closeFutureEditor;
    injectHelpSection();
    rebuildBeliefsView();
    overrideRenderAll();
    wrapRenderBeliefsView();
    wrapEmotionSave();
    wireEvents();
    dpRestorePossibilities();
    try { rasRenderMission(); } catch(e){}
    try { renderFutureText(); } catch(e){}
    try { renderSeedSection(); } catch(e){}
    try { dpRenderProgress(); } catch(e){}
    try { renderOurNeuralPathways(); } catch(e){}
    try { buildNothingDust(); } catch(e){}
    try { refreshNothingVisual(); } catch(e){}
    try { startNothingWaves(); } catch(e){}
    var bv = document.getElementById('view-beliefs');
    if (bv && bv.classList.contains('active') && typeof window.renderBeliefsView === 'function'){
      try { window.renderBeliefsView(); } catch(e){}
    }
  }

  if (document.readyState === 'complete') setTimeout(boot, 300);
  else window.addEventListener('load', function(){ setTimeout(boot, 300); });
})();

/* =====================================================================
   پچ: نگه‌داری پایدار موسیقی مدیتیشن در IndexedDB
   ===================================================================== */
(function(){
  'use strict';

  var DB_NAME = 'beliefs-patch-audio';
  var DB_VER  = 1;
  var STORE   = 'audio';
  var KEY     = 'meditation_main';

  var dbPromise = null;
  var audioUrl  = null;

  function openDb(){
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function(resolve, reject){
      if (!window.indexedDB){ reject(new Error('no-idb')); return; }
      var req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function(){
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function(){ resolve(req.result); };
      req.onerror   = function(){ reject(req.error); };
    });
    dbPromise.catch(function(){ dbPromise = null; });
    return dbPromise;
  }
  function tx(mode, fn){
    return openDb().then(function(db){
      return new Promise(function(resolve, reject){
        var t = db.transaction(STORE, mode);
        var out = fn(t.objectStore(STORE));
        t.oncomplete = function(){ resolve(out && out.result); };
        t.onerror    = function(){ reject(t.error); };
        t.onabort    = function(){ reject(t.error); };
      });
    });
  }
  function put(blob){ return tx('readwrite', function(st){ return st.put(blob, KEY); }); }
  function get()    { return tx('readonly',  function(st){ return st.get(KEY); }); }
  function del()    { return tx('readwrite', function(st){ return st.delete(KEY); }); }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function toast(msg){ if (typeof window.toast === 'function') window.toast(msg); }

  function render(){
    var wrap = document.getElementById('meditation-audio-wrap');
    if (!wrap) return;

    var st = window.state;
    var meta = st && st.meditationAudio;
    if (!meta || !meta.name){
      if (wrap.innerHTML) wrap.innerHTML = '';
      wrap.removeAttribute('data-sig');
      return;
    }

    var sig = (meta.name || '') + ':' + (meta.size || 0);
    var hasAudioEl = !!wrap.querySelector('audio');
    if (wrap.getAttribute('data-sig') === sig && hasAudioEl){
      var el0 = document.getElementById('meditation-audio-el');
      if (el0 && !el0.src && audioUrl) el0.src = audioUrl;
      return;
    }
    wrap.setAttribute('data-sig', sig);

    wrap.innerHTML =
      '<div style="margin-top:8px;padding:8px 8px 8px 36px;background:var(--surface-2);border-radius:10px;position:relative;">' +
        '<div style="font-size:11px;color:var(--muted);margin-bottom:6px;">🎵 ' + esc(meta.name) + '</div>' +
        '<audio id="meditation-audio-el" controls preload="metadata" style="width:100%;height:36px;display:block;"></audio>' +
        '<button type="button" id="meditation-audio-del" title="حذف موسیقی" ' +
          'style="position:absolute;top:6px;left:6px;width:24px;height:24px;border-radius:50%;border:none;' +
          'background:rgba(0,0,0,.08);color:var(--ink);font-size:14px;cursor:pointer;line-height:1;padding:0;">×</button>' +
      '</div>';

    var el = document.getElementById('meditation-audio-el');
    if (audioUrl){ el.src = audioUrl; return; }
    get().then(function(blob){
      if (!blob) return;
      audioUrl = URL.createObjectURL(blob);
      el.src = audioUrl;
    }).catch(function(){});
  }

  window.handleMeditationAudio = function(files){
    if (!files || !files.length) return;
    var f = files[0];
    if (!f) return;
    var okType = (f.type && f.type.indexOf('audio/') === 0) ||
      /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba|webm|amr|3gp|mp4)$/i.test(f.name || '');
    if (!okType){
      toast('فقط فایل صوتی انتخاب کن');
      return;
    }
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}

    var putP = new Promise(function(res, rej){
      var tm = setTimeout(function(){ rej(new Error('timeout')); }, 10000);
      put(f).then(function(v){ clearTimeout(tm); res(v); }, function(e){ clearTimeout(tm); rej(e); });
    });
    putP.then(function(){
      var st = window.state;
      if (!st) return;
      st.meditationAudio = {
        name: f.name || 'audio',
        size: f.size || 0,
        date: Date.now()
      };
      try { if (typeof window.saveState === 'function') window.saveState(); } catch(e){}

      if (audioUrl){ try { URL.revokeObjectURL(audioUrl); } catch(e){} audioUrl = null; }
      var wrap = document.getElementById('meditation-audio-wrap');
      if (wrap) wrap.removeAttribute('data-sig');
      render();
      toast('موسیقی ذخیره شد 🎵');
    }).catch(function(err){
      /* اگه ذخیره‌ی دائمی نشد، حداقل برای همین نشست پخش بشه */
      try {
        var st2 = window.state;
        if (st2){ st2.meditationAudio = { name: f.name || 'audio', size: f.size || 0, date: Date.now() }; }
        if (audioUrl){ try { URL.revokeObjectURL(audioUrl); } catch(e){} }
        audioUrl = URL.createObjectURL(f);
        var wrap2 = document.getElementById('meditation-audio-wrap');
        if (wrap2) wrap2.removeAttribute('data-sig');
        render();
      } catch(e2){}
      toast('موسیقی فقط برای همین بار ذخیره شد (حافظه‌ی مرورگر اجازه نداد)');
    });
  };

  document.addEventListener('click', function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#meditation-audio-del')){
      if (!window.confirm('این موسیقی حذف شود؟')) return;
      del().catch(function(){});
      if (window.state){
        delete window.state.meditationAudio;
        try { if (typeof window.saveState === 'function') window.saveState(); } catch(e){}
      }
      if (audioUrl){ try { URL.revokeObjectURL(audioUrl); } catch(e){} audioUrl = null; }
      var wrap = document.getElementById('meditation-audio-wrap');
      if (wrap){ wrap.removeAttribute('data-sig'); wrap.innerHTML = ''; }
      toast('موسیقی حذف شد');
    }
  });

  function hook(){
    if (typeof window.renderBeliefsView === 'function' && !window.renderBeliefsView.__medAudioPatched){
      var orig = window.renderBeliefsView;
      window.renderBeliefsView = function(){
        var r = orig.apply(this, arguments);
        try { render(); } catch(e){}
        return r;
      };
      window.renderBeliefsView.__medAudioPatched = true;
    }
    try { render(); } catch(e){}
  }

  if (document.readyState === 'complete') setTimeout(hook, 700);
  else window.addEventListener('load', function(){ setTimeout(hook, 700); });
})();

/* =====================================================================
   حبابِ تاریخ برای همه‌ی تقویم‌ها
   ===================================================================== */
(function(){
  var CELL_SEL = '.mini-cal-day[data-cal-key], .mini-cal-day[data-shop-key], .pc-day[data-pc-key]';
  var bubble = null, hideTimer = null;

  function ensureStyle(){
    if (document.getElementById('cal-date-bubble-style')) return;
    var st = document.createElement('style');
    st.id = 'cal-date-bubble-style';
    st.textContent =
      '#cal-date-bubble{position:fixed;z-index:100000;pointer-events:none;direction:rtl;max-width:240px;' +
      'padding:7px 11px;border-radius:10px;background:#12303a;color:#fff;font-size:12px;font-weight:700;line-height:1.7;' +
      'text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.28);opacity:0;transform:translateY(4px);' +
      'transition:opacity .15s ease,transform .15s ease;white-space:nowrap;}' +
      '#cal-date-bubble.show{opacity:1;transform:translateY(0);}' +
      '#cal-date-bubble small{display:block;font-size:10.5px;font-weight:600;opacity:.8;}' +
      '#cal-date-bubble:after{content:"";position:absolute;left:var(--arrow-x,50%);width:8px;height:8px;background:#12303a;' +
      'transform:translateX(-50%) rotate(45deg);}' +
      '#cal-date-bubble.above:after{bottom:-4px;}' +
      '#cal-date-bubble.below:after{top:-4px;}';
    document.head.appendChild(st);
  }

  function keyToDate(k){
    var p = String(k).split('-').map(Number);
    if (p.length !== 3 || !p[0]) return null;
    return new Date(p[0], p[1]-1, p[2]);
  }

  function faDate(date){
    try {
      var parts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).formatToParts(date);
      var m = {};
      parts.forEach(function(x){ m[x.type] = x.value; });
      return [m.weekday, m.day, m.month, m.year].filter(Boolean).join(' ');
    } catch(e){ return date.toLocaleDateString(); }
  }

  function hideBubble(){
    clearTimeout(hideTimer);
    if (bubble) bubble.classList.remove('show');
  }

  function showBubble(cell){
    var key = cell.getAttribute('data-cal-key') || cell.getAttribute('data-shop-key') || cell.getAttribute('data-pc-key');
    var date = keyToDate(key);
    if (!date) return;
    ensureStyle();
    if (!bubble){
      bubble = document.createElement('div');
      bubble.id = 'cal-date-bubble';
      document.body.appendChild(bubble);
    }
    var today = new Date(); today.setHours(0,0,0,0);
    var cls = cell.className || '';
    var status = '';
    if (date > today) status = 'هنوز نرسیده';
    else if (/\b(done|sub)\b/.test(cls) || /feel/.test(cls)) status = '✓ ثبت شده';
    else status = 'ثبت نشده';
    if (/\btoday\b/.test(cls)) status = 'امروز — ' + status;
    bubble.innerHTML = faDate(date) + '<small>' + status + '</small>';

    var r = cell.getBoundingClientRect();
    bubble.style.left = '0px'; bubble.style.top = '0px';
    var bw = bubble.offsetWidth, bh = bubble.offsetHeight;
    var vw = document.documentElement.clientWidth;
    var cx = r.left + r.width / 2;
    var left = Math.max(8, Math.min(vw - bw - 8, cx - bw / 2));
    var above = r.top - bh - 10 >= 8;
    var top = above ? r.top - bh - 10 : r.bottom + 10;
    bubble.style.left = left + 'px';
    bubble.style.top = top + 'px';
    bubble.style.setProperty('--arrow-x', Math.max(12, Math.min(bw - 12, cx - left)) + 'px');
    bubble.classList.toggle('above', above);
    bubble.classList.toggle('below', !above);
    bubble.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideBubble, 2600);
  }

  document.addEventListener('click', function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    var cell = t.closest(CELL_SEL);
    if (!cell){ hideBubble(); return; }
    var key = cell.getAttribute('data-cal-key') || cell.getAttribute('data-shop-key') || cell.getAttribute('data-pc-key');
    var attr = cell.hasAttribute('data-cal-key') ? 'data-cal-key' : (cell.hasAttribute('data-shop-key') ? 'data-shop-key' : 'data-pc-key');
    setTimeout(function(){
      var live = cell.isConnected ? cell : null;
      if (!live){
        var all = document.querySelectorAll('[' + attr + '="' + key + '"]');
        for (var i = 0; i < all.length; i++){
          var rr = all[i].getBoundingClientRect();
          if (rr.width && rr.top >= 0 && rr.top < window.innerHeight){ live = all[i]; break; }
        }
      }
      if (live) showBubble(live);
    }, 30);
  }, true);

  window.addEventListener('scroll', hideBubble, { passive: true, capture: true });
})();
