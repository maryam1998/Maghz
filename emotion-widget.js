/* ============================================================
   ویجت شناور — دایره‌ی کوچک + پنل اسلایدری + تصویر SVG انسان
   ============================================================ */
(function () {
  'use strict';
  if (window.__echwLoaded) return;
  window.__echwLoaded = true;

  /* ================= ۱) CSS ================= */
  var CSS = `
    #echw{
      position:fixed;z-index:99999;touch-action:none;
      -webkit-user-select:none;user-select:none;
      -webkit-tap-highlight-color:transparent;
      width:32px;height:32px;
    }
    #echw .echw-btn{
      position:absolute;inset:0;width:32px;height:32px;border-radius:50%;
      background:linear-gradient(150deg,#38e0d8 0%,#4f7cf0 55%,#5b4fd6 100%);
      border:1px solid rgba(255,255,255,0.45);
      box-shadow:0 3px 12px rgba(60,90,210,0.4),0 0 0 1px rgba(255,255,255,0.05) inset,inset 0 1px 3px rgba(255,255,255,0.4);
      display:flex;align-items:center;justify-content:center;
      cursor:grab;color:#fff;line-height:1;
      transition:background .3s ease,box-shadow .3s ease,transform .18s ease;
      animation:echwBtnBreathe 2.8s ease-in-out infinite;
    }
    #echw .echw-btn::after{
      content:'';position:absolute;top:12%;left:16%;width:32%;height:22%;border-radius:50%;
      background:radial-gradient(circle,rgba(255,255,255,0.8) 0%,transparent 70%);pointer-events:none;
    }
    #echw.echw-dragging .echw-btn{cursor:grabbing;transform:scale(1.14);animation:none;}
    #echw.open .echw-btn{
      background:linear-gradient(150deg,#3a4256 0%,#1c2233 100%);
      box-shadow:0 3px 12px rgba(10,14,26,0.5),inset 0 1px 3px rgba(255,255,255,0.2);
      animation:none;
    }
    #echw .echw-icon{width:15px;height:15px;display:block;pointer-events:none;overflow:visible;}
    #echw .echw-icon .ic-dot{display:block;}
    #echw .echw-icon .ic-x{display:none;}
    #echw.open .echw-icon .ic-dot{display:none;}
    #echw.open .echw-icon .ic-x{display:block;}
    @keyframes echwBtnBreathe{0%,100%{transform:scale(1);}50%{transform:scale(1.06);}}
    #echw .echw-panel{
      position:fixed;opacity:0;pointer-events:none;
      transform:translate(var(--slide-x,0px),var(--slide-y,20px)) scale(.88);
      transform-origin:var(--slide-origin,center center);
      transition:transform .42s cubic-bezier(.34,1.42,.64,1),opacity .26s ease;
      will-change:transform,opacity;box-sizing:border-box;touch-action:none;
    }
    #echw.open .echw-panel{opacity:1;pointer-events:auto;transform:translate(0,0) scale(1);}

    /* ---- دکمه‌ی جابه‌جایی بین حالت «بدون پس‌زمینه» و «پس‌زمینه شیشه‌ای» ---- */
    #echw .echw-bgtoggle{
      position:absolute;top:6px;left:6px;z-index:3;
      width:24px;height:24px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:1px solid rgba(0,0,0,0.12);
      background:rgba(255,255,255,0.65);
      -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
      color:#20232b;cursor:pointer;padding:0;
      box-shadow:0 2px 8px rgba(0,0,0,0.14);
      transition:background .25s ease,color .25s ease,transform .15s ease,border-color .25s ease;
    }
    #echw .echw-bgtoggle:active{transform:scale(.9);}
    #echw .echw-bgtoggle.active{
      background:rgba(20,22,34,0.78);color:#eef1fb;border-color:rgba(255,255,255,0.28);
    }
    html[data-theme="dark"] #echw .echw-bgtoggle{
      background:rgba(255,255,255,0.10);border-color:rgba(255,255,255,0.18);color:#eef1fb;
    }
    html[data-theme="dark"] #echw .echw-bgtoggle.active{
      background:rgba(255,255,255,0.24);color:#0f1220;border-color:rgba(255,255,255,0.35);
    }
    #echw .echw-bgicon{width:13px;height:13px;display:block;pointer-events:none;overflow:visible;}
    #echw .echw-bgicon .bg-on{display:none;}
    #echw .echw-bgtoggle.active .echw-bgicon .bg-off{display:none;}
    #echw .echw-bgtoggle.active .echw-bgicon .bg-on{display:block;}

    /* ---- حالت پس‌زمینه‌ی شیشه‌ای (Glassmorphism) برای پنل ---- */
    #echw .echw-panel.echw-glass{
      padding:16px 12px 10px;border-radius:22px;
      background:rgba(255,255,255,0.16);
      -webkit-backdrop-filter:blur(22px) saturate(160%);
      backdrop-filter:blur(22px) saturate(160%);
      border:1px solid rgba(255,255,255,0.38);
      box-shadow:0 12px 36px rgba(20,30,60,0.22),inset 0 1px 0 rgba(255,255,255,0.35);
    }
    html[data-theme="dark"] #echw .echw-panel.echw-glass{
      background:rgba(16,18,30,0.46);
      border-color:rgba(255,255,255,0.14);
      box-shadow:0 14px 40px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.08);
    }
    #echw .echw-chart{width:100%;display:block;pointer-events:auto;filter:drop-shadow(0 8px 22px rgba(0,0,0,0.20));}
    #echw .echw-chart svg{display:block;width:100%;height:auto;overflow:visible;}
    #echw .echw-row{pointer-events:all;cursor:pointer;}
    #echw .echw-row:hover rect{fill:rgba(128,128,128,0.10);}
    #echw .echw-text{paint-order:stroke fill;stroke-linejoin:round;stroke-linecap:round;}
    @keyframes echwHeartBeat{0%,100%{transform:scale(1);opacity:.7;}50%{transform:scale(1.9);opacity:1;}}
    @keyframes echwHeartPulse{0%,100%{transform:scale(1);opacity:.55;}45%{transform:scale(1.22);opacity:1;}70%{transform:scale(1.06);opacity:.85;}}
    #echw .echw-capture-bar{
      margin-top:8px; padding:10px 10px 8px;
      border-radius:12px;
      background:linear-gradient(135deg, rgba(43,191,171,0.18), rgba(94,200,240,0.12));
      border:1px solid rgba(43,191,171,0.55);
      color:#0f5b53;
      font-family:'Vazirmatn',Tahoma,sans-serif;
      direction:rtl; text-align:right; box-sizing:border-box;
    }
    html[data-theme="dark"] #echw .echw-capture-bar{
      background:linear-gradient(135deg, rgba(43,191,171,0.22), rgba(94,200,240,0.14));
      border-color:rgba(84,201,184,0.55);
      color:#fff;
    }
    #echw .echw-capture-label{font-size:12px; font-weight:800; margin-bottom:3px;}
    #echw .echw-capture-count{font-size:10.5px; opacity:.8; margin-bottom:8px;}
    #echw .echw-capture-actions{display:flex; gap:6px;}
    #echw .echw-capture-actions button{
      flex:1; border:none; border-radius:9px; padding:8px;
      font-family:inherit; font-size:12px; font-weight:800; cursor:pointer;
    }
    #echw .echw-capture-actions button:active{transform:scale(.97);}
    #echw .echw-capture-save{background:linear-gradient(135deg,#0f5b53,#178a7c); color:#fff;}
    #echw .echw-capture-cancel{background:rgba(0,0,0,0.06); color:inherit;}
    html[data-theme="dark"] #echw .echw-capture-cancel{background:rgba(255,255,255,0.12); color:#fff;}
  `;
  var styleEl = document.createElement('style');
  styleEl.id = 'echwStyle';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ================= ۲) DOM ================= */
  function buildDom() {
    if (document.getElementById('echw')) return;
    var wrap = document.createElement('div');
    wrap.id = 'echw';
    wrap.innerHTML =
      '<div class="echw-panel" id="echw-panel">' +
        '<button type="button" class="echw-bgtoggle" id="echw-bgtoggle" title="پس‌زمینه شیشه‌ای">' +
          '<svg class="echw-bgicon" viewBox="0 0 16 16">' +
            '<rect class="bg-off" x="2" y="2" width="12" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.3"/>' +
            '<g class="bg-on">' +
              '<rect x="2" y="2" width="12" height="12" rx="3.5" fill="currentColor" fill-opacity="0.30" stroke="currentColor" stroke-width="1.1"/>' +
              '<circle cx="6.3" cy="6.1" r="1.15" fill="currentColor" fill-opacity="0.55"/>' +
            '</g>' +
          '</svg>' +
        '</button>' +
        '<div id="echw-chart" class="echw-chart"></div>' +
        '<div class="echw-capture-bar" id="echw-capture-bar" style="display:none;">' +
          '<div class="echw-capture-label" id="echw-capture-label"></div>' +
          '<div class="echw-capture-count" id="echw-capture-count"></div>' +
          '<div class="echw-capture-actions">' +
            '<button type="button" class="echw-capture-save" id="echw-capture-save">✓ ثبت</button>' +
            '<button type="button" class="echw-capture-cancel" id="echw-capture-cancel">انصراف</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="echw-btn" id="echw-btn">' +
        '<svg class="echw-icon" viewBox="0 0 16 16">' +
          '<path class="ic-dot" d="M1.8 8 L4.6 8 L6 4 L8.2 12 L9.7 8 L14.2 8" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path class="ic-x" d="M4 4 L12 12 M12 4 L4 12" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round"/>' +
        '</svg>' +
      '</div>';
    document.body.appendChild(wrap);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildDom);
  else buildDom();

  /* ================= ۳) بارگذاری SVG انسان ================= */
  var __bodySrc = null;
  var __bodyLoading = false;
  var __bodyCallbacks = [];

  function loadBodyImage(cb) {
    if (__bodySrc) { cb(__bodySrc); return; }
    __bodyCallbacks.push(cb);
    if (__bodyLoading) return;
    __bodyLoading = true;

    fetch('./body.svg')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (svgText) {
        /* حذف پس‌زمینه‌ی سفید احتمالی — اگه بود */
        var cleaned = svgText
          .replace(/<rect[^>]*fill=["']?#?fff(fff)?["']?[^>]*\/?>/gi, '')
          .replace(/<rect[^>]*fill=["']?white["']?[^>]*\/?>/gi, '');
        __bodySrc = cleaned;
        __bodyLoading = false;
        var cbs = __bodyCallbacks.slice(); __bodyCallbacks = [];
        cbs.forEach(function (fn) { fn(__bodySrc); });
      })
      .catch(function (err) {
        console.warn('SVG load failed:', err);
        __bodySrc = null;
        __bodyLoading = false;
        var cbs = __bodyCallbacks.slice(); __bodyCallbacks = [];
        cbs.forEach(function (fn) { fn(null); });
      });
  }

  /* ================= ۴) کنترل‌ها ================= */
  function initControls() {
    var KEY = 'echwState_v15';
    var wrap = document.getElementById('echw');
    var btn = document.getElementById('echw-btn');
    var panel = document.getElementById('echw-panel');
    var bgToggle = document.getElementById('echw-bgtoggle');
    if (!wrap || !btn || !panel) return;

    var BTN = 32;
    var PANEL_W_DEFAULT = 250;
    var PANEL_W_MIN = 170;
    var PANEL_W_MAX = 460;
    var PANEL_ASPECT = 400 / 260;
    var EDGE = 4, GAP = 6;
    var panelX = 0, panelY = 0, panelW = PANEL_W_DEFAULT, panelH = PANEL_W_DEFAULT * PANEL_ASPECT;

    function defaultState() {
      var vw = window.innerWidth, vh = window.innerHeight;
      return { left: vw - BTN - 16, top: vh - BTN - 100, w: PANEL_W_DEFAULT, open: false, panelLeft: null, panelTop: null, glass: false };
    }
    function load() {
      try {
        var s = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (!s) return defaultState();
        var d = defaultState();
        for (var k in d) if (!(k in s)) s[k] = d[k];
        return s;
      } catch (e) { return defaultState(); }
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

    var state = load();
    if (state.w < PANEL_W_MIN) state.w = PANEL_W_MIN;
    if (state.w > PANEL_W_MAX) state.w = PANEL_W_MAX;

    function clampButton() {
      var vw = window.innerWidth, vh = window.innerHeight;
      if (state.left < EDGE) state.left = EDGE;
      if (state.top < EDGE) state.top = EDGE;
      if (state.left + BTN > vw - EDGE) state.left = vw - BTN - EDGE;
      if (state.top + BTN > vh - EDGE) state.top = vh - BTN - EDGE;
    }
    function applyButtonPosition() {
      wrap.style.left = state.left + 'px';
      wrap.style.top = state.top + 'px';
    }
    function applyPanelPosition() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var btnCX = state.left + BTN / 2, btnCY = state.top + BTN / 2;
      var maxPW = vw - 2 * EDGE, maxPH = vh - 2 * EDGE;
      var pw = Math.min(state.w, maxPW);
      var ph = pw * PANEL_ASPECT;
      if (ph > maxPH) { ph = maxPH; pw = ph / PANEL_ASPECT; }

      var pl, pt;
      if (state.panelLeft != null && state.panelTop != null) {
        /* پنل به‌صورت آزاد جابه‌جا شده — دقیقاً همان‌جا می‌ماند، فقط به لبه‌ی واقعی صفحه محدود می‌شود (حتی گوشه‌ها) */
        pl = Math.max(EDGE, Math.min(vw - pw - EDGE, state.panelLeft));
        pt = Math.max(EDGE, Math.min(vh - ph - EDGE, state.panelTop));
      } else {
        /* حالت پیش‌فرض: کنار دکمه */
        if (btnCX + BTN / 2 + GAP + pw <= vw - EDGE) pl = btnCX + BTN / 2 + GAP;
        else if (btnCX - BTN / 2 - GAP - pw >= EDGE) pl = btnCX - BTN / 2 - GAP - pw;
        else pl = Math.max(EDGE, Math.min(vw - pw - EDGE, btnCX - pw / 2));

        if (btnCY + BTN / 2 + GAP + ph <= vh - EDGE) pt = btnCY + BTN / 2 + GAP;
        else if (btnCY - BTN / 2 - GAP - ph >= EDGE) pt = btnCY - BTN / 2 - GAP - ph;
        else pt = Math.max(EDGE, Math.min(vh - ph - EDGE, btnCY - ph / 2));
      }

      panel.style.left = pl + 'px';
      panel.style.top = pt + 'px';
      panel.style.width = pw + 'px';
      panelX = pl; panelY = pt; panelW = pw; panelH = ph;

      var pcX = pl + pw / 2, pcY = pt + ph / 2;
      var ox = (pcX > btnCX) ? 'left' : 'right';
      var oy = (pcY > btnCY) ? 'top' : 'bottom';
      panel.style.setProperty('--slide-origin', ox + ' ' + oy);
      panel.style.setProperty('--slide-x', ox === 'left' ? '-22px' : '22px');
      panel.style.setProperty('--slide-y', oy === 'top' ? '-22px' : '22px');
    }

    clampButton();
    applyButtonPosition();
    applyPanelPosition();
    panel.classList.toggle('echw-glass', !!state.glass);
    if (bgToggle) {
      bgToggle.classList.toggle('active', !!state.glass);
      bgToggle.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      bgToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        state.glass = !state.glass;
        panel.classList.toggle('echw-glass', state.glass);
        bgToggle.classList.toggle('active', state.glass);
        save();
      });
    }

    function setOpen(open) {
      if (!open && captureCtx) return;   // ← این خط
      state.open = !!open;
      wrap.classList.toggle('open', state.open);
      applyPanelPosition();
      save();
      if (state.open) render();
      else stopRender(); // پنل بسته شد → انیمیشن‌های SVG (قلب/موج) رو کاملاً از DOM حذف کن تا دیگه محاسبه/رندر نشن
    }

    var suppressClickUntil = 0;
    var DRAG_THRESHOLD = 3;

    var btnId = null, bSX = 0, bSY = 0, bSL = 0, bST = 0, bMoved = false;
    btn.addEventListener('pointerdown', function (e) {
      btnId = e.pointerId;
      bSX = e.clientX; bSY = e.clientY;
      bSL = state.left; bST = state.top;
      bMoved = false;
      wrap.classList.add('echw-dragging');
      try { btn.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault(); e.stopPropagation();
    });
    btn.addEventListener('pointermove', function (e) {
      if (btnId !== e.pointerId) return;
      var dx = e.clientX - bSX, dy = e.clientY - bSY;
      if (!bMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) bMoved = true;
      if (!bMoved) return;
      state.left = bSL + dx;
      state.top = bST + dy;
      clampButton(); applyButtonPosition();
      if (state.open) applyPanelPosition();
    });
    function endBtn(e) {
      if (btnId !== e.pointerId) return;
      btnId = null;
      wrap.classList.remove('echw-dragging');
      if (bMoved) { save(); suppressClickUntil = Date.now() + 120; }
      else {
        if (captureCtx) return;   // ← در حالت ثبت، دکمه کاری نمی‌کند
        setOpen(!state.open);
      }
    }
    btn.addEventListener('pointerup', endBtn);
    btn.addEventListener('pointercancel', endBtn);

    var panelId = null, pSX = 0, pSY = 0, pSL = 0, pST = 0, pMoved = false;
    var panelPointers = new Map();
    var pinchStartDist = 0, pinchStartW = 0;

    panel.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') {
        panelPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (panelPointers.size === 2) {
          panelId = null; pMoved = false;
          var pts = Array.from(panelPointers.values());
          pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          pinchStartW = state.w;
          return;
        }
      }
      if (panelPointers.size <= 1) {
        panelId = e.pointerId;
        pSX = e.clientX; pSY = e.clientY;
        pSL = panelX; pST = panelY;
        pMoved = false;
        try { panel.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });
    panel.addEventListener('pointermove', function (e) {
      if (panelPointers.has(e.pointerId)) {
        panelPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }
      if (panelPointers.size === 2 && pinchStartDist > 0) {
        var pts = Array.from(panelPointers.values());
        var d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        var nw = pinchStartW * (d / pinchStartDist);
        nw = Math.max(PANEL_W_MIN, Math.min(PANEL_W_MAX, nw));
        state.w = nw;
        applyPanelPosition();
        e.preventDefault();
        return;
      }
      if (panelId !== e.pointerId) return;
      var dx = e.clientX - pSX, dy = e.clientY - pSY;
      if (!pMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) pMoved = true;
      if (!pMoved) return;
      state.panelLeft = pSL + dx;
      state.panelTop = pST + dy;
      applyPanelPosition();
    });
    function endPanel(e) {
      panelPointers.delete(e.pointerId);
      if (panelPointers.size < 2) {
        if (pinchStartDist > 0) { save(); pinchStartDist = 0; }
      }
      if (panelId !== e.pointerId) return;
      panelId = null;
      if (pMoved) { save(); suppressClickUntil = Date.now() + 120; }
      pMoved = false;
    }
    panel.addEventListener('pointerup', endPanel);
    panel.addEventListener('pointercancel', endPanel);
    panel.addEventListener('pointerleave', endPanel);

    // توجه: پنل دیگر با کلیک/تپ بیرون، اسکرول، یا پینچ بسته نمی‌شود —
    // فقط با کلیک روی همان دایره‌ی شناور (دکمه‌ی echw-btn) جمع می‌شود، ر.ک endBtn بالا.

    window.addEventListener('resize', function () {
      clampButton(); applyButtonPosition(); applyPanelPosition();
    });

    wrap.classList.toggle('open', state.open);
    if (state.open) requestAnimationFrame(function () { render(); });

    window.__echwSetOpen = setOpen;

    var capSave = document.getElementById('echw-capture-save');
    var capCancel = document.getElementById('echw-capture-cancel');
    if (capSave) capSave.addEventListener('click', function(){ endCapture(true); });
    if (capCancel) capCancel.addEventListener('click', function(){ endCapture(false); });

    // اطمینان از ثابت موندن ویجت روی ویوپورت
    wrap.style.position = 'fixed';

    window.__echwShouldSuppressClick = function () { return Date.now() < suppressClickUntil; };
  }

  /* ================= ۵) رندر ================= */
  var STORAGE_KEY = 'echwSelectedEmotions_v5';
  var EMOTIONS = [
    { id: 'shame',       fa: 'شرم',            freq: 20,  color: '#5c0404' },
    { id: 'guilt',       fa: 'گناه',           freq: 30,  color: '#7a0a0a' },
    { id: 'despair',     fa: 'ناامیدی',        freq: 50,  color: '#8a0808' },
    { id: 'sadness',     fa: 'غم',             freq: 75,  color: '#a01010' },
    { id: 'fear',        fa: 'ترس',            freq: 100, color: '#b31000' },
    { id: 'lack',        fa: 'کمبود',          freq: 125, color: '#d81800' },
    { id: 'anger',       fa: 'خشم',            freq: 150, color: '#f22a00' },
    { id: 'pride',       fa: 'غرور',           freq: 175, color: '#f4470a' },
    { id: 'courage',     fa: 'شجاعت',          freq: 200, color: '#f2650a' },
    { id: 'neutral',     fa: 'خنثی بودن',      freq: 250, color: '#f08c00' },
    { id: 'readiness',   fa: 'آمادگی',         freq: 310, color: '#f0c400' },
    { id: 'acceptance',  fa: 'پذیرش',          freq: 350, color: '#f5e600' },
    { id: 'selfmastery', fa: 'تسلط بر خود',    freq: 400, color: '#9ee600' },
    { id: 'love',        fa: 'عشق',            freq: 500, color: '#12c93a' },
    { id: 'joy',         fa: 'شادی',           freq: 540, color: '#00c2c4' },
    { id: 'peace',       fa: 'آرامش',          freq: 600, color: '#1a2be8' },
    { id: 'beyond',      fa: 'فراتر از خود',   freq: 700, color: '#9b1fb0' }
  ];

  var selected = new Set();
  try {
    var ss = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(ss)) ss.forEach(function (id) { selected.add(id); });
  } catch (e) {}
  function saveSelection() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selected))); } catch (e) {} }
  function getTheme() { return document.documentElement.getAttribute('data-theme') || 'light'; }
  function isPanelOpen() {
    var w = document.getElementById('echw');
    return !!(w && w.classList.contains('open'));
  }
  function stopRender() {
    var container = document.getElementById('echw-chart');
    if (container) container.innerHTML = '';
  }
  function shouldSuppress() { return window.__echwShouldSuppressClick && window.__echwShouldSuppressClick(); }

  var BODY_DIMS = { headR: 12, headCY: -62, neckTopY: -50, neckBotY: -42, shoulderY: -38, shoulderW: 19, waistY: -6, waistW: 12, hipY: 10, hipW: 16, kneeY: 42, footY: 68, armEndY: 4, armHandY: 14 };
  /* مختصات دقیق حفره‌ی قلب داخل body.svg (اندازه‌گیری‌شده از خود فایل)، تبدیل‌شده به سیستم مختصات محلی بدن */
  var HEART_POS = { cx: 3, cy: -32, rx: 6.5, ry: 9 };

  function drawBodyShape(parent, fillColor, opts) {
    opts = opts || {};
    var outline = !!opts.outline, sw = opts.strokeWidth || 2;
    var skipHead = !!opts.skipHead, skipNeck = !!opts.skipNeck;
    function style(sel) {
      if (outline) sel.attr('fill', 'none').attr('stroke', fillColor).attr('stroke-width', sw).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
      else sel.attr('fill', fillColor);
      return sel;
    }
    var d = BODY_DIMS;
    if (!skipHead) style(parent.append('circle').attr('cx', 0).attr('cy', d.headCY).attr('r', d.headR));
    if (!skipNeck) style(parent.append('rect').attr('x', -5).attr('y', d.neckTopY).attr('width', 10).attr('height', d.neckBotY - d.neckTopY));
    style(parent.append('path').attr('d', 'M' + (-d.shoulderW) + ',' + d.shoulderY + ' Q0,' + (d.shoulderY - 5) + ' ' + d.shoulderW + ',' + d.shoulderY + ' L' + d.waistW + ',' + d.waistY + ' L' + d.hipW + ',' + d.hipY + ' Q0,' + (d.hipY + 3) + ' ' + (-d.hipW) + ',' + d.hipY + ' L' + (-d.waistW) + ',' + d.waistY + ' Z'));
    style(parent.append('path').attr('d', 'M' + (-d.shoulderW) + ',' + d.shoulderY + ' Q' + (-d.shoulderW - 4) + ',' + (d.shoulderY + 15) + ' ' + (-d.shoulderW - 2) + ',' + d.armEndY + ' L' + (-d.shoulderW + 4) + ',' + d.armEndY + ' Q' + (-d.shoulderW + 3) + ',' + (d.shoulderY + 15) + ' ' + (-d.waistW - 2) + ',' + (d.waistY + 3) + ' Z'));
    style(parent.append('path').attr('d', 'M' + d.shoulderW + ',' + d.shoulderY + ' Q' + (d.shoulderW + 4) + ',' + (d.shoulderY + 15) + ' ' + (d.shoulderW + 2) + ',' + d.armEndY + ' L' + (d.shoulderW - 4) + ',' + d.armEndY + ' Q' + (d.shoulderW - 3) + ',' + (d.shoulderY + 15) + ' ' + (d.waistW + 2) + ',' + (d.waistY + 3) + ' Z'));
    style(parent.append('ellipse').attr('cx', -d.shoulderW - 2).attr('cy', d.armHandY).attr('rx', 3.8).attr('ry', 5.5));
    style(parent.append('ellipse').attr('cx', d.shoulderW + 2).attr('cy', d.armHandY).attr('rx', 3.8).attr('ry', 5.5));
    style(parent.append('path').attr('d', 'M' + (-d.hipW) + ',' + d.hipY + ' L' + (-d.hipW + 1) + ',' + d.kneeY + ' L' + (-d.hipW + 2) + ',' + d.footY + ' L' + (-5) + ',' + d.footY + ' L' + (-4) + ',' + d.kneeY + ' L' + (-3) + ',' + d.hipY + ' Z'));
    style(parent.append('path').attr('d', 'M' + d.hipW + ',' + d.hipY + ' L' + (d.hipW - 1) + ',' + d.kneeY + ' L' + (d.hipW - 2) + ',' + d.footY + ' L' + 5 + ',' + d.footY + ' L' + 4 + ',' + d.kneeY + ' L' + 3 + ',' + d.hipY + ' Z'));
    style(parent.append('ellipse').attr('cx', -d.hipW / 2 - 1).attr('cy', d.footY + 3).attr('rx', 7).attr('ry', 3.5));
    style(parent.append('ellipse').attr('cx', d.hipW / 2 + 1).attr('cy', d.footY + 3).attr('rx', 7).attr('ry', 3.5));
  }

  /* ================= حالت ثبت برای «حس قبل/بعد از تمرین» ================= */
  var captureCtx = null;

  function updateCaptureBar(){
    var bar = document.getElementById('echw-capture-bar');
    if (!bar) return;
    if (!captureCtx){ bar.style.display = 'none'; return; }
    bar.style.display = 'block';
    var lbl = document.getElementById('echw-capture-label');
    var cnt = document.getElementById('echw-capture-count');
    var isBefore = captureCtx.phase === 'before';
    if (lbl) lbl.textContent = (isBefore ? '💗 قبل از تمرین' : '✨ بعد از تمرین') +
      ' — ' + (captureCtx.label || captureCtx.practiceKey);
    if (cnt) cnt.textContent = selected.size
      ? (selected.size + ' احساس انتخاب شد — دکمه ثبت را بزن')
      : 'از لیست کنار آدمک، یک یا چند احساس را انتخاب کن';
  }

  function beginCapture(opts){
    opts = opts || {};
    captureCtx = opts;
    if (Array.isArray(opts.initial)){
      selected.clear();
      opts.initial.forEach(function(id){
        if (EMOTIONS.some(function(e){ return e.id === id; })) selected.add(id);
      });
      saveSelection();
    }
    if (typeof window.__echwSetOpen === 'function') window.__echwSetOpen(true);
    render();
    updateCaptureBar();
  }

  function endCapture(commit){
    if (!captureCtx) return;
    var ctx = captureCtx;
    var ids = Array.from(selected);
    captureCtx = null;
    updateCaptureBar();
    if (typeof window.__echwSetOpen === 'function') window.__echwSetOpen(false);
    if (commit && typeof ctx.onSave === 'function'){
      try { ctx.onSave(ids, ctx); } catch(e){ console.warn(e); }
    }
  }

  window.__echwBeginCapture = beginCapture;
  window.__echwEndCapture = function(){ endCapture(false); };
  window.__echwIsCapturing = function(){ return !!captureCtx; };

  /* حس انتخاب‌شده روی ادمک، بعد از اینکه یک مسیر عصبی مصرفش کرد (رشته‌ی
     جدید با همون رنگ ساخته شد)، پاک می‌شه — ادمک برمی‌گرده به حالت «ریست»
     (بدون حس ثبت‌شده) تا برای دفعه‌ی بعد آماده باشه. */
  window.__echwResetSelection = function(){
    if (!selected.size) return;
    selected.clear();
    saveSelection();
    if (isPanelOpen()) render();
  };

  function render() {
    var container = document.getElementById('echw-chart');
    if (!container) return;
    if (typeof d3 === 'undefined') {
      container.innerHTML = '<div style="padding:14px;text-align:center;font-family:Vazirmatn,Tahoma,sans-serif;font-size:11px;color:#8b8fa8;">در حال بارگذاری…</div>';
      return;
    }

    var isDark = getTheme() === 'dark';
    var bodyColor = isDark ? '#f0f2fa' : '#1a1d2e';

    var textColor = isDark ? '#ffffff' : '#000000';
    var textStroke = isDark ? '#000000' : '#ffffff';
    var textSW = 3.2, textSWS = 2.6;
    var dimColor = isDark ? '#d8dbe8' : '#2a2d3a';
    var dimStroke = isDark ? '#000000' : '#ffffff';

    var W = 260, H = 400;
    var LIST_W = 100, ROW_H = 21, HEADER_H = 6;
    var BODY_CX = 185, BODY_CY = 195;

    var selectedEmotions = EMOTIONS.filter(function (e) { return selected.has(e.id); });
    var hasSelection = selectedEmotions.length > 0;

    d3.select(container).html('');

    var svg = d3.select(container).append('svg')
      .attr('viewBox', '0 0 ' + W + ' ' + H)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .style('font-family', "'Vazirmatn', Tahoma, sans-serif")
      .style('direction', 'ltr')
      .style('overflow', 'visible');

    var defs = svg.append('defs');

    var auraBlurFilter = defs.append('filter').attr('id', 'echwAuraBlur')
      .attr('x', '-150%').attr('y', '-150%').attr('width', '400%').attr('height', '400%');
    auraBlurFilter.append('feGaussianBlur').attr('stdDeviation', 5.5);

    var auraBlurSoft = defs.append('filter').attr('id', 'echwAuraBlurSoft')
      .attr('x', '-200%').attr('y', '-200%').attr('width', '500%').attr('height', '500%');
    auraBlurSoft.append('feGaussianBlur').attr('stdDeviation', 9);

    var waveGlowFilter = defs.append('filter').attr('id', 'echwWaveGlow')
      .attr('x', '-60%').attr('y', '-200%').attr('width', '220%').attr('height', '500%');
    waveGlowFilter.append('feGaussianBlur').attr('stdDeviation', 1.3);

    var heartGlowFilter = defs.append('filter').attr('id', 'echwHeartGlowBlur')
      .attr('x', '-100%').attr('y', '-100%').attr('width', '300%').attr('height', '300%');
    heartGlowFilter.append('feGaussianBlur').attr('stdDeviation', 2);

    /* گرادیانِ ثابتِ قرمز برای قلب — همیشه همین رنگه، چه چیزی انتخاب شده باشه چه نه */
    var hg = defs.append('linearGradient').attr('id', 'echwHeartRedGrad')
      .attr('x1', '0').attr('y1', '1').attr('x2', '0').attr('y2', '0');
    hg.append('stop').attr('offset', '0%').attr('stop-color', '#b4102a');
    hg.append('stop').attr('offset', '55%').attr('stop-color', '#ef2440');
    hg.append('stop').attr('offset', '100%').attr('stop-color', '#ff5468');

    /* ---------- لیست ---------- */
    var listG = svg.append('g').attr('transform', 'translate(6,' + HEADER_H + ')');
    EMOTIONS.forEach(function (em, idx) {
      /* فرکانس کم پایین، فرکانس زیاد بالا */
      var rowY = (EMOTIONS.length - 1 - idx) * ROW_H + 13;
      var isOn = selected.has(em.id);
      var rowG = listG.append('g').attr('class', 'echw-row').on('click', function () {
        if (shouldSuppress()) return;
        if (selected.has(em.id)) selected.delete(em.id); else selected.add(em.id);
        saveSelection(); render();
      });
      rowG.append('rect').attr('x', 2).attr('y', rowY - 9.5).attr('width', LIST_W - 6).attr('height', ROW_H - 2).attr('rx', 5)
        .attr('fill', isOn ? em.color : 'transparent').attr('opacity', isOn ? 0.14 : 1);
      rowG.append('rect').attr('x', 2).attr('y', rowY - 9.5).attr('width', 2.4).attr('height', ROW_H - 2).attr('rx', 1.2)
        .attr('fill', em.color).attr('opacity', isOn ? 0.95 : 0);
      var cbX = LIST_W - 13, cbY = rowY + 2.5;
      rowG.append('circle').attr('cx', cbX).attr('cy', cbY).attr('r', 7.2).attr('fill', textStroke).attr('opacity', 0.65);
      rowG.append('circle').attr('cx', cbX).attr('cy', cbY).attr('r', 5.4)
        .attr('fill', isOn ? em.color : 'transparent')
        .attr('stroke', isOn ? em.color : textColor).attr('stroke-width', 1.6);
      if (isOn) {
        rowG.append('path').attr('d', 'M' + (cbX - 2.7) + ',' + cbY + ' l2,2 l3.8,-4')
          .attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1.7)
          .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round');
      }
      var textX = cbX - 12.5;
      rowG.append('text').attr('class', 'echw-text').attr('x', textX).attr('y', rowY - 1)
        .attr('text-anchor', 'end').attr('font-size', 9).attr('font-weight', 800)
        .attr('fill', isOn ? em.color : textColor).attr('stroke', textStroke).attr('stroke-width', textSW)
        .attr('opacity', isOn ? 1 : 0.82)
        .text(em.fa);
      rowG.append('text').attr('class', 'echw-text').attr('x', textX).attr('y', rowY + 7.5)
        .attr('text-anchor', 'end').attr('font-size', 6.8).attr('font-weight', 700)
        .attr('fill', isOn ? em.color : dimColor).attr('stroke', dimStroke).attr('stroke-width', textSWS)
        .attr('opacity', isOn ? 1 : 0.75)
        .style('font-variant-numeric', 'tabular-nums').text(em.freq + ' Hz');
    });

    /* ---------- هاله ---------- */
    var auraG = svg.append('g').attr('class', 'echw-aura');
    var neutralAuraColor = isDark ? '#5a6178' : '#aab0c4';
    var auraLayers = hasSelection ? selectedEmotions.slice(0, 5) : [{ color: neutralAuraColor }];
    for (var ai = auraLayers.length - 1; ai >= 0; ai--) {
      var emA = auraLayers[ai], distance = ai;
      var scaleUp = 1.28 + distance * 0.30;
      var layerOp = (hasSelection ? 0.55 : 0.22) - distance * 0.06;
      var dur = (1.4 + distance * 0.3).toFixed(2);
      var blurFilter = distance >= 3 ? 'url(#echwAuraBlurSoft)' : 'url(#echwAuraBlur)';
      var outer = auraG.append('g')
        .attr('transform', 'translate(' + BODY_CX + ',' + BODY_CY + ') scale(' + scaleUp + ')')
        .attr('filter', blurFilter).attr('opacity', layerOp)
        .style('mix-blend-mode', 'screen');
      var pulseG = outer.append('g');
      pulseG.append('animateTransform').attr('attributeName', 'transform').attr('type', 'scale')
        .attr('values', '1;1.06;1').attr('dur', dur + 's').attr('repeatCount', 'indefinite');
      drawBodyShape(pulseG, emA.color, { outline: true, strokeWidth: 3.5 + distance * 0.8, skipHead: true, skipNeck: true });
    }

    /* ---------- امواج مغزی (طرح EEG حرفه‌ای) — همیشه فعال؛ بدون انتخاب خنثی/خاکستری، با انتخاب رنگی ---------- */
    var waveG = svg.append('g').attr('class', 'echw-waves');
    var neutralWaveColor = isDark ? '#7d84a0' : '#9fa5ba';
    var waveColors = hasSelection ? selectedEmotions.slice(0, 2) : [{ color: neutralWaveColor }, { color: neutralWaveColor }];
    var waveY0 = BODY_CY + BODY_DIMS.headCY - 20;
    var waveHalfW = 34;

    /* خط پایه‌ی ظریف، شبیه مانیتور EEG واقعی */
    waveG.append('line')
      .attr('x1', BODY_CX - waveHalfW - 4).attr('x2', BODY_CX + waveHalfW + 4)
      .attr('y1', waveY0).attr('y2', waveY0)
      .attr('stroke', neutralWaveColor).attr('stroke-width', 0.6).attr('opacity', 0.25)
      .attr('stroke-dasharray', '1.5,2');

    /* موجِ ترکیبی از چند هارمونیک، شبیه‌ی امواج EEG واقعی (نه یک سینوسِ تک‌فرکانس)
       irr (بی‌نظمی: ۰ = کاملاً منظم مثل عشق/آرامش، ۱ = کاملاً آشفته مثل شرم/خشم)
       کنترل می‌کند چقدر هارمونیک‌های اضافه و لرزش به موج پایه اضافه شود */
    function eegPath(cx, y, halfW, amp, cycles, phase, seed, irr) {
      var n = 60, pts = [];
      var h1 = 0.12 + 0.5 * irr;   /* هارمونیک درجه دو: در حالت منظم تقریباً صفر */
      var h2 = 0.04 + 0.4 * irr;   /* هارمونیک درجه سه */
      var h3 = irr > 0.32 ? 0.55 * irr : 0; /* لرزش ریز، فقط وقتی احساس واقعاً آشفته‌ست ظاهر می‌شه */
      for (var i = 0; i <= n; i++) {
        var t = i / n;
        var env = Math.sin(t * Math.PI); /* پاکت دامنه: صفر در دو سر، بیشینه در وسط */
        var x = cx - halfW + t * 2 * halfW;
        var main = Math.sin(t * cycles * Math.PI * 2 + phase);
        var harm1 = h1 * Math.sin(t * cycles * Math.PI * 2 * 2.3 + phase * 1.7 + seed);
        var harm2 = h2 * Math.sin(t * cycles * Math.PI * 2 * 4.1 + phase * 0.6 + seed * 2);
        var harm3 = h3 * Math.sin(t * cycles * Math.PI * 2 * 7.7 + phase * 2.4 + seed * 3);
        var yy = y - (main + harm1 + harm2 + harm3) * amp * env;
        pts.push([x, yy]);
      }
      return d3.line().curve(d3.curveBasis)(pts);
    }

    /* نگاشتِ فرکانسِ احساس (مقیاس هاوکینز، ۲۰ تا ۷۰۰) به «میزان نظم» موج، به‌صورت لگاریتمی */
    var FREQ_MIN = 20, FREQ_MAX = 700;
    function regularityFromFreq(freq) {
      var f = Math.max(FREQ_MIN, Math.min(FREQ_MAX, freq || 250));
      var reg = (Math.log(f) - Math.log(FREQ_MIN)) / (Math.log(FREQ_MAX) - Math.log(FREQ_MIN));
      return Math.max(0, Math.min(1, reg));
    }

      waveColors.forEach(function (em, wi) {
        var freq = em.freq || 250; /* برای حالت خنثی (بدون انتخاب)، فرکانس میانه */
        var reg = regularityFromFreq(freq);  /* ۰..۱ ، هرچی بیشتر یعنی منظم‌تر (عشق/آرامش) */
        var irr = 1 - reg;                    /* ۰..۱ ، هرچی بیشتر یعنی آشفته‌تر (شرم/خشم) */

        var halfW = waveHalfW - wi * 4;
        var amp = 5.2 - wi * 1.1;
        var cycles = 1.5 + reg * 3.6 + wi * 0.35; /* فرکانس بالاتر → موج فشرده‌تر و تندتر */
        var y = waveY0 - wi * 5.5;
        var seed = wi * 1.3 + (freq % 17) * 0.05;

        /* موج‌های منظم با یک رفت‌وبرگشت ساده، موج‌های آشفته با چند فاز نامتقارن که چرخه‌ی غیرقابل‌پیش‌بینی‌تری می‌سازند */
        var phases = irr > 0.45
          ? [0, Math.PI * 0.55, Math.PI * 1.35, Math.PI * 1.8, Math.PI * 2]
          : [0, Math.PI, Math.PI * 2];
        var frames = phases.map(function (ph) { return eegPath(BODY_CX, y, halfW, amp, cycles, ph, seed, irr); });
        var dA = frames[0];
        var values = frames.join(';');
        /* فرکانس بالاتر و منظم‌تر → حرکت نرم‌تر و آرام‌تر؛ آشفته‌تر → لرزش تندتر و عصبی‌تر */
        var dur = (1.15 + reg * 1.7 + wi * 0.35).toFixed(2) + 's';

        var glow = waveG.append('path').attr('d', dA).attr('fill', 'none')
          .attr('stroke', em.color).attr('stroke-width', 3.2).attr('stroke-linecap', 'round')
          .attr('opacity', (hasSelection ? 0.28 : 0.16) - wi * 0.06).attr('filter', 'url(#echwWaveGlow)');
        glow.append('animate').attr('attributeName', 'd').attr('dur', dur).attr('repeatCount', 'indefinite')
          .attr('values', values);

        var line = waveG.append('path').attr('d', dA).attr('fill', 'none')
          .attr('stroke', em.color).attr('stroke-width', 1).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
          .attr('opacity', (hasSelection ? 0.9 : 0.55) - wi * 0.15);
        line.append('animate').attr('attributeName', 'd').attr('dur', dur).attr('repeatCount', 'indefinite')
          .attr('values', values);
      });

    /* ---------- بدن انسان ---------- */
    var bodyG = svg.append('g').attr('class', 'echw-body')
      .attr('transform', 'translate(' + BODY_CX + ',' + BODY_CY + ')');

    if (__bodySrc) {
      /* --- قلب تپنده، درست زیر حفره‌ی قلب تصویر، تا از داخل حفره دیده شود --- */
      var heartEl = bodyG.append('ellipse')
        .attr('cx', HEART_POS.cx).attr('cy', HEART_POS.cy)
        .attr('rx', HEART_POS.rx).attr('ry', HEART_POS.ry)
        .attr('fill', 'url(#echwHeartRedGrad)')
        .attr('opacity', 1)
        .style('transform-origin', HEART_POS.cx + 'px ' + HEART_POS.cy + 'px')
        .style('animation', 'echwHeartPulse ' + (hasSelection ? '0.95s' : '1.35s') + ' ease-in-out infinite');

      /* --- تصویر SVG (حفره‌ی قلب آن روی شکل بالا قرار می‌گیرد) --- */
      var svgImageUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(__bodySrc);
      bodyG.append('image')
        .attr('href', svgImageUrl)
        .attr('xlink:href', svgImageUrl)
        .attr('x', -70).attr('y', -90)
        .attr('width', 140).attr('height', 180)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      /* --- درخشش رنگیِ احساساتِ انتخاب‌شده، روی سیلوئت و دورِ حفره‌ی قلب —
         تا کاربر ببینه رنگِ همون احساس‌ها وارد قلبش شده، نه فقط از توی حفره --- */
      if (hasSelection) {
        var energyGrad = defs.append('radialGradient').attr('id', 'echwHeartEnergyGlow')
          .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
        if (selectedEmotions.length === 1) {
          energyGrad.append('stop').attr('offset', '0%').attr('stop-color', selectedEmotions[0].color).attr('stop-opacity', 0.95);
          energyGrad.append('stop').attr('offset', '65%').attr('stop-color', selectedEmotions[0].color).attr('stop-opacity', 0.5);
        } else {
          selectedEmotions.slice(0, 5).forEach(function (em, i) {
            energyGrad.append('stop').attr('offset', (i / (Math.max(selectedEmotions.length, 2) - 1) * 65) + '%')
              .attr('stop-color', em.color).attr('stop-opacity', 0.85);
          });
        }
        energyGrad.append('stop').attr('offset', '100%').attr('stop-color', selectedEmotions[0].color).attr('stop-opacity', 0);

        bodyG.append('ellipse')
          .attr('class', 'echw-heart-energy')
          .attr('cx', HEART_POS.cx).attr('cy', HEART_POS.cy)
          .attr('rx', HEART_POS.rx * 1.35).attr('ry', HEART_POS.ry * 1.35)
          .attr('fill', 'url(#echwHeartEnergyGlow)')
          .attr('filter', 'url(#echwHeartGlowBlur)')
          .style('mix-blend-mode', 'screen')
          .style('transform-origin', HEART_POS.cx + 'px ' + HEART_POS.cy + 'px')
          .style('animation', 'echwHeartPulse 0.95s ease-in-out infinite');
      }
    } else {
      /* --- fallback: سیلوئت رسم‌شده --- */
      drawBodyShape(bodyG, bodyColor);
      bodyG.append('circle').attr('cx', 0).attr('cy', BODY_DIMS.shoulderY + 16).attr('r', 2.6)
        .attr('fill', 'url(#echwHeartRedGrad)')
        .style('transform-origin', '0px ' + (BODY_DIMS.shoulderY + 16) + 'px')
        .style('animation', 'echwHeartPulse ' + (hasSelection ? '0.95s' : '1.35s') + ' ease-in-out infinite');
    }
    if (typeof updateCaptureBar === 'function') updateCaptureBar();
  }

  /* ================= ۶) راه‌اندازی ================= */
  function bootstrap() {
    initControls();
    /* فقط وقتی پنل واقعاً بازه رندر کن — وگرنه انیمیشن‌های سنگین SVG از همون لحظه‌ی لود صفحه در پس‌زمینه اجرا می‌شن */
    if (isPanelOpen()) render();  /* اول سیلوئت، تا SVG لود بشه */
    loadBodyImage(function () { if (isPanelOpen()) render(); });  /* بعد از لود SVG، رندر مجدد (فقط اگر باز باشه) */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else setTimeout(bootstrap, 0);

  var themeObserver = new MutationObserver(function (muts) {
    var changed = false;
    muts.forEach(function (m) { if (m.attributeName === 'data-theme') changed = true; });
    if (changed && isPanelOpen()) render();  /* اگر پنل بسته‌ست، رندر لازم نیست؛ دفعه‌ی بعد که باز بشه با تم فعلی رندر می‌شه */
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  window.renderEmotionChart = render;
  window.getSelectedEmotions = function () { return Array.from(selected); };
  window.getSelectedEmotionColors = function () {
    return EMOTIONS.filter(function (e) { return selected.has(e.id); }).map(function (e) { return e.color; });
  };

  /* --- API جدید: هماهنگ‌سازی با اپ اصلی برای ثبت «حس قبل/بعد از تمرین» --- */
  window.__echwSetSelected = function (ids) {
    selected.clear();
    (Array.isArray(ids) ? ids : []).forEach(function (id) {
      if (EMOTIONS.some(function (e) { return e.id === id; })) selected.add(id);
    });
    saveSelection();
    if (isPanelOpen() && typeof render === 'function') render();
  };
  window.__echwGetSelected = function () { return Array.from(selected); };
  window.__echwToggleEmotion = function (id) {
    if (!EMOTIONS.some(function (e) { return e.id === id; })) return;
    if (selected.has(id)) selected.delete(id); else selected.add(id);
    saveSelection();
    if (isPanelOpen() && typeof render === 'function') render();
  };
})();
