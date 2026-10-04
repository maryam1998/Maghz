/* ===== نوار ثابت جمله‌های انگیزشی (بالای همه‌ی تب‌ها) — انتخاب / بایگانی / حذف ===== */
(function(){
  var KEY = 'appMotivation';
  var ROTATE_MS = 7000;
  var cfg = load();
  var idx = 0, timer = null, showArch = false;

  function uid(){ return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  function load(){
    try{
      var o = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
      var lines = (Array.isArray(o.lines) ? o.lines : []).map(function(x){
        if (typeof x === 'string') return { id: uid(), text: x, on: true, arch: false };
        return { id: x.id || uid(), text: String(x.text || ''), on: x.on !== false, arch: !!x.arch };
      }).filter(function(x){ return x.text; });
      return { on: !!o.on, lines: lines };
    }catch(e){ return { on:false, lines:[] }; }
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(cfg)); }catch(e){} }
  function pool(){ return cfg.lines.filter(function(x){ return x.on && !x.arch; }).map(function(x){ return x.text; }); }

  var css = document.createElement('style');
  css.textContent = [
    '#motiv-bar{position:fixed;top:0;left:0;right:0;z-index:150;display:none;align-items:center;justify-content:center;',
    '  padding:calc(7px + env(safe-area-inset-top,0px)) 14px 7px;min-height:34px;box-sizing:border-box;',
    '  background:var(--panel-bg);border-bottom:1px solid var(--panel-border);',
    '  box-shadow:0 2px 12px rgba(0,0,0,.12);cursor:pointer;',
    '  -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}',
    'body.motiv-on #motiv-bar{display:flex;}',
    '#motiv-bar .mb-txt{font-family:"Vazirmatn",Tahoma,sans-serif;font-size:12.5px;font-weight:600;line-height:1.7;',
    '  color:var(--text-main);text-align:center;direction:rtl;transition:opacity .35s;',
    '  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '#motiv-bar .mb-txt.fade{opacity:0;}',
    '#motiv-bar .mb-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);flex:none;margin-inline-start:10px;}',
    'body.motiv-on #topbar{top:calc(16px + var(--motiv-h,0px));}',
    'body.motiv-on #grat-root, body.motiv-on #shenakht-root{top:var(--motiv-h,0px);}',
    /* تنظیمات */
    '#motiv-settings-field .mv-add{display:flex;gap:8px;align-items:center;}',
    '#motiv-settings-field .mv-add input{flex:1;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.08);color:inherit;font-family:inherit;font-size:13px;box-sizing:border-box;}',
    '#motiv-settings-field .mv-add .btn{flex:none;padding:10px 14px;}',
    '#motiv-list,#motiv-arch-list{display:flex;flex-direction:column;gap:6px;margin-top:8px;}',
    '.mv-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;border:1px solid rgba(127,127,127,.3);background:rgba(127,127,127,.06);}',
    '.mv-item input[type=checkbox]{width:18px;height:18px;flex:none;}',
    '.mv-item .mv-t{flex:1;min-width:0;font-size:13px;line-height:1.7;direction:rtl;text-align:right;word-break:break-word;}',
    '.mv-item.off .mv-t{opacity:.5;}',
    '.mv-item button{flex:none;width:30px;height:30px;border:none;border-radius:8px;background:transparent;color:inherit;font-size:15px;cursor:pointer;padding:0;}',
    '.mv-item button:active{background:rgba(127,127,127,.2);}',
    '.mv-arch-toggle{margin-top:10px;border:none;background:transparent;color:inherit;font-family:inherit;font-size:12.5px;cursor:pointer;padding:6px 2px;opacity:.8;}'
  ].join('\n');
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.id = 'motiv-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span class="mb-txt"></span><span class="mb-dot"></span>';
  document.body.appendChild(bar);
  var txt = bar.querySelector('.mb-txt');

  function setHeight(){
    var h = document.body.classList.contains('motiv-on') ? bar.offsetHeight : 0;
    document.documentElement.style.setProperty('--motiv-h', h + 'px');
  }
  if (window.ResizeObserver) new ResizeObserver(setHeight).observe(bar);
  window.addEventListener('resize', setHeight);

  function show(i, animate){
    var p = pool(); if (!p.length) return;
    idx = ((i % p.length) + p.length) % p.length;
    if (!animate){ txt.textContent = p[idx]; setHeight(); return; }
    txt.classList.add('fade');
    setTimeout(function(){
      var q = pool(); if (!q.length) return;
      txt.textContent = q[idx % q.length];
      txt.classList.remove('fade');
      setHeight();
    }, 350);
  }

  function startTimer(){
    clearInterval(timer); timer = null;
    if (pool().length > 1) timer = setInterval(function(){ show(idx + 1, true); }, ROTATE_MS);
  }

  function apply(){
    var p = pool();
    var active = cfg.on && p.length > 0;
    document.body.classList.toggle('motiv-on', active);
    clearInterval(timer); timer = null;
    if (active){
      show(Math.floor(Math.random() * p.length), false);
      startTimer();
    }
    setTimeout(setHeight, 0);
  }

  bar.addEventListener('click', function(){
    if (pool().length > 1){ show(idx + 1, true); startTimer(); }
  });

  /* ---- UI ---- */
  var el = {};
  function item(l, archived){
    var d = document.createElement('div');
    d.className = 'mv-item' + (!archived && !l.on ? ' off' : '');
    var html = '';
    if (!archived) html += '<input type="checkbox"' + (l.on ? ' checked' : '') + '>';
    html += '<span class="mv-t"></span>';
    html += '<button type="button" data-a="arch" aria-label="' + (archived ? 'بازگردانی' : 'بایگانی') + '">' + (archived ? '↩' : '🗂') + '</button>';
    html += '<button type="button" data-a="del" aria-label="حذف">✕</button>';
    d.innerHTML = html;
    d.querySelector('.mv-t').textContent = l.text;
    var cb = d.querySelector('input');
    if (cb) cb.addEventListener('change', function(){ l.on = cb.checked; save(); render(); apply(); });
    d.querySelector('[data-a="arch"]').addEventListener('click', function(){ l.arch = !l.arch; if (!l.arch) l.on = true; save(); render(); apply(); });
    d.querySelector('[data-a="del"]').addEventListener('click', function(){
      cfg.lines = cfg.lines.filter(function(x){ return x !== l; }); save(); render(); apply();
    });
    return d;
  }
  function render(){
    if (!el.list) return;
    el.list.innerHTML = ''; el.arch.innerHTML = '';
    var act = cfg.lines.filter(function(x){ return !x.arch; });
    var arc = cfg.lines.filter(function(x){ return x.arch; });
    act.forEach(function(l){ el.list.appendChild(item(l, false)); });
    arc.forEach(function(l){ el.arch.appendChild(item(l, true)); });
    el.toggle.style.display = arc.length ? '' : 'none';
    if (!arc.length) showArch = false;
    el.toggle.textContent = (showArch ? '▾ ' : '▸ ') + 'بایگانی (' + arc.length + ')';
    el.arch.style.display = showArch ? 'flex' : 'none';
  }
  function add(){
    var v = (el.input.value || '').trim();
    if (!v) return;
    cfg.lines.unshift({ id: uid(), text: v, on: true, arch: false });
    el.input.value = '';
    save(); render(); apply();
  }

  function wire(){
    el.list = document.getElementById('motiv-list');
    el.arch = document.getElementById('motiv-arch-list');
    el.toggle = document.getElementById('motiv-arch-toggle');
    el.input = document.getElementById('motiv-new');
    el.addBtn = document.getElementById('motiv-add');
    el.chk = document.getElementById('motiv-show');
    var openBtn = document.getElementById('settings-btn');
    if (!el.list || !el.chk || !openBtn) return;
    openBtn.addEventListener('click', function(){ el.chk.checked = cfg.on; render(); });
    el.chk.addEventListener('change', function(){ cfg.on = el.chk.checked; save(); apply(); });
    el.addBtn.addEventListener('click', add);
    el.input.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); add(); } });
    el.toggle.addEventListener('click', function(){ showArch = !showArch; render(); });
  }

  wire();
  save();
  apply();
})();
