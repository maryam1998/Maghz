/* جستجوی سراسری — یک دکمه‌ی 🔍 در همه‌ی تب‌ها.
   • شناخت و تمرین: متن‌های دیده‌شده‌ی همان تب هایلایت می‌شوند (بدون دست‌زدن به DOM) + قبلی/بعدی
   • تمرین: شکرگذاری‌ها و متن باورها هم (حتی اگر پایین لیست باشند) پیدا می‌شوند
   • هدف‌گذاری: هدف‌ها، شاخه‌ها، زیرشاخه‌ها و «نزدیک شدن به هدف» روی نقشه پیدا و نمایش داده می‌شوند */
(function(){
  "use strict";
  function $(id){ return document.getElementById(id); }

  /* نرمال‌سازی یک‌به‌یک (طول متن عوض نمی‌شود تا جای تطبیق‌ها درست بماند) */
  function norm(s){
    return String(s == null ? '' : s).toLowerCase()
      .replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/ۀ/g, 'ه').replace(/ة/g, 'ه')
      .replace(/[۰-۹]/g, function(c){ return String(c.charCodeAt(0) - 0x06F0); })
      .replace(/[٠-٩]/g, function(c){ return String(c.charCodeAt(0) - 0x0660); })
      .replace(/[\u200c\u200d]/g, ' ');
  }
  function snippet(text, q){
    var t = String(text || '').replace(/\s+/g, ' ').trim();
    var i = norm(t).indexOf(q);
    if (i < 0) i = 0;
    var a = Math.max(0, i - 24), b = Math.min(t.length, i + q.length + 48);
    return (a > 0 ? '…' : '') + t.slice(a, b) + (b < t.length ? '…' : '');
  }

  var st = document.createElement('style');
  st.textContent =
    '::highlight(gs2-hit){background-color:rgba(244,197,66,.45);color:inherit;}'+
    '::highlight(gs2-cur){background-color:#f4c542;color:#12142a;}'+
    '#gs2-fab{position:fixed;left:12px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:9500;width:44px;height:44px;border-radius:50%;'+
      'border:1px solid var(--panel-border,rgba(255,255,255,.18));background:var(--card,#1b1f3a);color:var(--text-main,#eee);font-size:19px;cursor:pointer;'+
      'box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:0;-webkit-tap-highlight-color:transparent;}'+
    '#gs2-ui{position:fixed;top:0;left:0;right:0;z-index:9600;display:none;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 8px;'+
      'background:var(--card,#1b1f3a);border-bottom:1px solid var(--panel-border,rgba(255,255,255,.18));box-shadow:0 6px 18px rgba(0,0,0,.35);direction:rtl;font-family:inherit;}'+
    '#gs2-ui.open{display:block;}'+
    '#gs2-ui .gs2-bar{display:flex;align-items:center;gap:6px;}'+
    '#gs2-ui input{flex:1;min-width:0;height:38px;border-radius:10px;border:1px solid var(--panel-border,rgba(255,255,255,.2));'+
      'background:var(--input-bg,rgba(255,255,255,.06));color:var(--text-main,#eee);font-family:inherit;font-size:14px;padding:0 10px;outline:none;}'+
    '#gs2-ui .gs2-cnt{min-width:46px;text-align:center;font-size:12px;color:var(--text-dim,#999);white-space:nowrap;}'+
    '#gs2-ui button{flex:none;width:34px;height:34px;border-radius:9px;border:1px solid var(--panel-border,rgba(255,255,255,.2));'+
      'background:transparent;color:var(--text-main,#eee);font-size:15px;cursor:pointer;padding:0;}'+
    '#gs2-res{max-height:42vh;overflow-y:auto;margin-top:6px;}'+
    '#gs2-res .gs2-item{display:block;width:100%;text-align:right;height:auto;padding:8px 10px;margin:0 0 5px;border-radius:10px;font-size:13px;line-height:1.5;}'+
    '#gs2-res .gs2-item small{display:block;color:var(--text-dim,#999);font-size:11px;}'+
    '#gs2-res .gs2-h{font-size:11px;color:var(--text-dim,#999);margin:4px 2px;}';
  document.head.appendChild(st);

  var fab = document.createElement('button');
  fab.id = 'gs2-fab'; fab.type = 'button'; fab.setAttribute('aria-label', 'جستجو'); fab.textContent = '🔍';
  var ui = document.createElement('div');
  ui.id = 'gs2-ui';
  ui.innerHTML = '<div class="gs2-bar"><input id="gs2-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="جستجو…">'+
    '<span class="gs2-cnt" id="gs2-cnt"></span><button type="button" id="gs2-prev" aria-label="قبلی">▲</button>'+
    '<button type="button" id="gs2-next" aria-label="بعدی">▼</button><button type="button" id="gs2-close" aria-label="بستن">✕</button></div>'+
    '<div id="gs2-res"></div>';
  document.body.appendChild(fab);
  document.body.appendChild(ui);

  var input = $('gs2-q'), cnt = $('gs2-cnt'), resBox = $('gs2-res');
  var ranges = [], cur = -1, timer = null;
  var hasHL = !!(window.CSS && CSS.highlights && window.Highlight);

  function activeTab(){
    var sh = $('shenakht-root'), gr = $('grat-root');
    if (sh && sh.classList.contains('active')) return 'shenakht';
    if (gr && gr.classList.contains('active')) return 'grat';
    return 'map';
  }
  var TAB_NAME = { shenakht: 'شناخت', grat: 'تمرین', map: 'هدف‌گذاری' };

  function clearHL(){
    ranges = []; cur = -1;
    if (hasHL){ try { CSS.highlights.delete('gs2-hit'); CSS.highlights.delete('gs2-cur'); } catch(e){} }
  }

  function domFind(root, q){
    var out = [];
    if (!root) return out;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        var t = p.tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA' || t === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        if (p.closest('#gs2-ui')) return NodeFilter.FILTER_REJECT;
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n, seen = 0;
    while ((n = walker.nextNode())){
      if (++seen > 30000 || out.length >= 400) break;
      var nt = norm(n.nodeValue);
      var i = nt.indexOf(q);
      if (i < 0) continue;
      var p = n.parentElement;
      if (!p.getClientRects().length) continue; /* پنهان */
      while (i >= 0 && out.length < 400){
        var r = document.createRange();
        r.setStart(n, i); r.setEnd(n, i + q.length);
        out.push(r);
        i = nt.indexOf(q, i + q.length);
      }
    }
    return out;
  }

  function paint(){
    if (hasHL){
      try {
        CSS.highlights.set('gs2-hit', new Highlight(...ranges));
        if (cur >= 0) CSS.highlights.set('gs2-cur', new Highlight(ranges[cur]));
        else CSS.highlights.delete('gs2-cur');
      } catch(e){}
    } else if (cur >= 0){
      try { var s = window.getSelection(); s.removeAllRanges(); s.addRange(ranges[cur]); } catch(e){}
    }
  }

  function goTo(i){
    if (!ranges.length) return;
    cur = (i + ranges.length) % ranges.length;
    if (!ranges[cur].startContainer.isConnected){ run(false); return; }
    cnt.textContent = (cur + 1) + ' / ' + ranges.length;
    paint();
    var el = ranges[cur].startContainer.parentElement;
    if (el){ try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch(e){ el.scrollIntoView(); } }
  }

  function addItem(box, title, sub, act){
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'gs2-item';
    b.textContent = title;
    if (sub){ var s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
    b.addEventListener('click', act);
    box.appendChild(b);
  }

  function ensureTab(name){
    var id = name === 'grat' ? 'tab-btn-grat' : (name === 'map' ? 'tab-btn-map' : 'tab-btn-shenakht');
    if (activeTab() !== name){ var b = $(id); if (b) b.click(); }
  }

  function dataResults(q, tab){
    var out = [];
    if (tab === 'map' && window.__mapSearch){
      try {
        window.__mapSearch.find(function(s){ return norm(s).indexOf(q) >= 0; }).slice(0, 60).forEach(function(r){
          out.push({ title: r.label || '—', sub: r.kind + (r.host ? ' · ' + r.host : ''), act: function(){ close(); window.__mapSearch.focus(r); } });
        });
      } catch(e){}
    }
    if (tab === 'grat' && typeof state !== 'undefined' && state){
      try {
        var list = (state.gratitude || []).slice().reverse();
        list.forEach(function(g){
          if (out.length >= 40) return;
          if (norm(g.text).indexOf(q) < 0) return;
          out.push({ title: snippet(g.text, q), sub: 'شکرگذاری · ' + (g.day || '') + ' ' + (g.date || ''), act: function(){ openGrat(g.id, q); } });
        });
        var cb = state.currentBelief || {};
        if (norm(state.futureText).indexOf(q) >= 0)
          out.push({ title: snippet(state.futureText, q), sub: 'باورها · متن خواسته', act: function(){ openView('beliefs', q); } });
        (cb.trackingItems || []).forEach(function(t){
          if (norm(t.text).indexOf(q) >= 0) out.push({ title: snippet(t.text, q), sub: 'باورها · پیگیری', act: function(){ openView('beliefs', q); } });
        });
        if (norm(cb.visualNote).indexOf(q) >= 0)
          out.push({ title: snippet(cb.visualNote, q), sub: 'باورها · یادداشت', act: function(){ openView('beliefs', q); } });
      } catch(e){}
    }
    return out;
  }

  function openView(view, q){
    ensureTab('grat');
    try { goto(view); } catch(e){}
    setTimeout(function(){ run(true); }, 220);
  }
  function openGrat(id, q){
    ensureTab('grat');
    try {
      var idx = [].concat(state.gratitude).reverse().findIndex(function(x){ return x.id === id; });
      if (idx >= gratListLimit.hist) gratListLimit.hist = idx + 1;
    } catch(e){}
    try { goto('history'); } catch(e){}
    setTimeout(function(){
      run(false);
      var el = document.querySelector('#history-list .tx-item[data-gid="' + id + '"]');
      if (el && window.EditMark) EditMark.reveal(el, { flash: true });
    }, 220);
  }

  function run(jump){
    clearHL();
    resBox.innerHTML = '';
    var raw = input.value.trim();
    var tab = activeTab();
    input.placeholder = 'جستجو در «' + TAB_NAME[tab] + '»…';
    if (!raw){ cnt.textContent = ''; return; }
    var q = norm(raw);
    var found = 0;

    var data = dataResults(q, tab);
    if (data.length){
      var h = document.createElement('div'); h.className = 'gs2-h'; h.textContent = 'نتایج (' + data.length + ')';
      resBox.appendChild(h);
      data.forEach(function(d){ addItem(resBox, d.title, d.sub, d.act); });
      found += data.length;
    }
    if (tab !== 'map'){
      var root = $(tab === 'shenakht' ? 'shenakht-root' : 'grat-root');
      ranges = domFind(root, q);
      found += ranges.length;
      if (ranges.length){
        cur = 0; paint();
        cnt.textContent = '1 / ' + ranges.length;
        if (jump !== false){ goTo(0); }
      } else cnt.textContent = '';
    } else cnt.textContent = data.length ? String(data.length) : '';
    if (!found){
      var e = document.createElement('div'); e.className = 'gs2-h'; e.textContent = 'چیزی پیدا نشد.';
      resBox.appendChild(e);
    }
  }

  function open(){
    ui.classList.add('open');
    run(false);
    setTimeout(function(){ try { input.focus(); input.select(); } catch(e){} }, 30);
  }
  function close(){
    ui.classList.remove('open');
    clearHL();
    try { input.blur(); } catch(e){}
  }

  fab.addEventListener('click', function(){ ui.classList.contains('open') ? close() : open(); });
  $('gs2-close').addEventListener('click', close);
  $('gs2-next').addEventListener('click', function(){ if (cur < 0 && ranges.length) goTo(0); else goTo(cur + 1); });
  $('gs2-prev').addEventListener('click', function(){ if (cur < 0 && ranges.length) goTo(ranges.length - 1); else goTo(cur - 1); });
  input.addEventListener('input', function(){
    clearTimeout(timer);
    timer = setTimeout(function(){ run(true); }, 220);
  });
  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter'){ e.preventDefault(); if (e.shiftKey) goTo(cur - 1); else if (cur < 0) run(true); else goTo(cur + 1); }
    else if (e.key === 'Escape') close();
  });
  /* با عوض‌شدن تب، نتیجه‌ها دوباره برای همان تب ساخته می‌شوند */
  ['tab-btn-shenakht', 'tab-btn-map', 'tab-btn-grat'].forEach(function(id){
    var b = $(id);
    if (b) b.addEventListener('click', function(){ if (ui.classList.contains('open')) setTimeout(function(){ run(false); }, 350); });
  });
})();
