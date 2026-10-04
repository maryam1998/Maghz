/* ===== نوار ثابت جمله‌های انگیزشی (بالای همه‌ی تب‌ها) ===== */
(function(){
  var KEY = 'appMotivation';
  var ROTATE_MS = 7000;
  var cfg = load();
  var idx = 0, timer = null;

  function load(){
    try{
      var o = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
      return { on: !!o.on, lines: Array.isArray(o.lines) ? o.lines : [] };
    }catch(e){ return { on:false, lines:[] }; }
  }
  function save(){
    try{ localStorage.setItem(KEY, JSON.stringify(cfg)); }catch(e){}
  }

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
    'body.motiv-on #grat-root, body.motiv-on #shenakht-root{top:var(--motiv-h,0px);}'
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
    if (!cfg.lines.length) return;
    idx = ((i % cfg.lines.length) + cfg.lines.length) % cfg.lines.length;
    if (!animate){ txt.textContent = cfg.lines[idx]; setHeight(); return; }
    txt.classList.add('fade');
    setTimeout(function(){
      txt.textContent = cfg.lines[idx];
      txt.classList.remove('fade');
      setHeight();
    }, 350);
  }

  function apply(){
    clearInterval(timer); timer = null;
    var active = cfg.on && cfg.lines.length > 0;
    document.body.classList.toggle('motiv-on', active);
    if (active){
      show(Math.floor(Math.random() * cfg.lines.length), false);
      if (cfg.lines.length > 1){
        timer = setInterval(function(){ show(idx + 1, true); }, ROTATE_MS);
      }
    }
    setTimeout(setHeight, 0);
  }

  bar.addEventListener('click', function(){
    if (cfg.lines.length > 1){
      show(idx + 1, true);
      clearInterval(timer);
      timer = setInterval(function(){ show(idx + 1, true); }, ROTATE_MS);
    }
  });

  function parseLines(v){
    return String(v || '').split(/\r?\n/).map(function(x){ return x.trim(); }).filter(Boolean);
  }

  function wire(){
    var openBtn = document.getElementById('settings-btn');
    var saveBtn = document.getElementById('settings-save-btn');
    var ta = document.getElementById('motiv-lines');
    var chk = document.getElementById('motiv-show');
    if (!openBtn || !saveBtn || !ta || !chk) return;
    openBtn.addEventListener('click', function(){
      ta.value = cfg.lines.join('\n');
      chk.checked = cfg.on;
    });
    saveBtn.addEventListener('click', function(){
      cfg.lines = parseLines(ta.value);
      cfg.on = !!chk.checked;
      save();
      apply();
    });
  }

  wire();
  apply();
})();
