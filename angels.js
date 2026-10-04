/* ===== بک‌گراند سفارشی متحرک: تصویرهای کاربر روی همه‌ی تب‌ها حرکت می‌کنند ===== */
(function(){
  var KEY = 'appAngels';
  var MAX_BYTES = 10 * 1024 * 1024;
  var def = { on:true, size:140, speed:3, opacity:85, soft:true, blend:'normal' };
  var cfg = loadCfg();
  var items = [];      // {id, blob, url, el, x, y, vx, vy, ph}
  var raf = null, last = 0;

  function loadCfg(){
    try{
      var o = JSON.parse(localStorage.getItem(KEY) || 'null') || {};
      var c = {}; for (var k in def) c[k] = (o[k] === undefined ? def[k] : o[k]);
      return c;
    }catch(e){ var d = {}; for (var k2 in def) d[k2] = def[k2]; return d; }
  }
  function saveCfg(){ try{ localStorage.setItem(KEY, JSON.stringify(cfg)); }catch(e){} }

  /* ---- IndexedDB ---- */
  function idb(){
    return new Promise(function(res, rej){
      try{
        var r = indexedDB.open('appAngelsDB', 1);
        r.onupgradeneeded = function(){ r.result.createObjectStore('kv', { keyPath:'id' }); };
        r.onsuccess = function(){ res(r.result); };
        r.onerror = function(){ rej(r.error); };
      }catch(e){ rej(e); }
    });
  }
  function dbAll(){
    return idb().then(function(db){ return new Promise(function(res, rej){
      var q = db.transaction('kv','readonly').objectStore('kv').getAll();
      q.onsuccess = function(){ res(q.result || []); };
      q.onerror = function(){ rej(q.error); };
    }); });
  }
  function dbPut(rec){
    return idb().then(function(db){ return new Promise(function(res, rej){
      var tx = db.transaction('kv','readwrite'); tx.objectStore('kv').put(rec);
      tx.oncomplete = function(){ res(true); }; tx.onerror = function(){ rej(tx.error); };
    }); });
  }
  function dbDel(id){
    return idb().then(function(db){ return new Promise(function(res){
      var tx = db.transaction('kv','readwrite'); tx.objectStore('kv').delete(id);
      tx.oncomplete = function(){ res(true); }; tx.onerror = function(){ res(false); };
    }); }).catch(function(){});
  }

  /* ---- لایه ---- */
  var css = document.createElement('style');
  css.textContent = [
    '#angel-layer{position:fixed;inset:0;z-index:100;pointer-events:none;overflow:hidden;display:none;}',
    'body.angels-on #angel-layer{display:block;}',
    '#angel-layer img{position:absolute;left:0;top:0;height:auto;pointer-events:none;user-select:none;-webkit-user-drag:none;will-change:transform;}',
    '#angel-layer.soft img{-webkit-mask-image:radial-gradient(ellipse at center,#000 52%,transparent 72%);mask-image:radial-gradient(ellipse at center,#000 52%,transparent 72%);}',
    '#ang-field .ang-row{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;}',
    '#ang-field .ang-th{position:relative;width:58px;height:58px;border-radius:12px;overflow:hidden;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.12);}',
    '#ang-field .ang-th img{width:100%;height:100%;object-fit:cover;display:block;}',
    '#ang-field .ang-th button{position:absolute;top:2px;right:2px;width:20px;height:20px;border:none;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;font-size:11px;line-height:20px;padding:0;cursor:pointer;}',
    '#ang-field .ang-add{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:10px;border:1px dashed rgba(127,127,127,.55);cursor:pointer;font-size:13px;}',
    '#ang-field .ang-sl{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12.5px;}',
    '#ang-field .ang-sl span{min-width:62px;}',
    '#ang-field .ang-sl input[type=range]{flex:1;}',
    '#ang-field select{width:100%;padding:9px 10px;border-radius:10px;border:1px solid rgba(127,127,127,.35);background:rgba(127,127,127,.08);color:inherit;font-family:inherit;font-size:13px;margin-top:8px;}'
  ].join('\n');
  document.head.appendChild(css);

  var layer = document.createElement('div');
  layer.id = 'angel-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.appendChild(layer);

  function W(){ return window.innerWidth; }
  function H(){ return window.innerHeight; }

  function styleAll(){
    layer.classList.toggle('soft', !!cfg.soft);
    items.forEach(function(it){
      it.el.style.width = cfg.size + 'px';
      it.el.style.opacity = cfg.opacity / 100;
      it.el.style.mixBlendMode = cfg.blend === 'normal' ? 'normal' : cfg.blend;
    });
  }

  function spawn(rec){
    var url = URL.createObjectURL(rec.blob);
    var el = document.createElement('img');
    el.src = url; el.alt = ''; el.draggable = false;
    layer.appendChild(el);
    var a = Math.random() * Math.PI * 2;
    var it = {
      id: rec.id, blob: rec.blob, url: url, el: el,
      x: Math.random() * Math.max(10, W() - cfg.size),
      y: Math.random() * Math.max(10, H() - cfg.size),
      vx: Math.cos(a), vy: Math.sin(a), ph: Math.random() * 6.28
    };
    items.push(it);
    styleAll();
    return it;
  }

  function tick(t){
    raf = requestAnimationFrame(tick);
    var dt = Math.min(50, t - last) / 1000; last = t;
    var sp = cfg.speed * 14; // px/s
    var w = W(), h = H(), s = cfg.size;
    items.forEach(function(it){
      it.ph += dt * 0.7;
      // انحراف آرام مسیر
      var ang = Math.atan2(it.vy, it.vx) + Math.sin(it.ph) * dt * 0.8;
      it.vx = Math.cos(ang); it.vy = Math.sin(ang);
      it.x += it.vx * sp * dt;
      it.y += it.vy * sp * dt;
      var m = -s * 0.15;
      if (it.x < m){ it.x = m; it.vx = Math.abs(it.vx); }
      if (it.x > w - s * 0.85){ it.x = w - s * 0.85; it.vx = -Math.abs(it.vx); }
      if (it.y < m){ it.y = m; it.vy = Math.abs(it.vy); }
      if (it.y > h - s * 0.85){ it.y = h - s * 0.85; it.vy = -Math.abs(it.vy); }
      it.el.style.transform = 'translate3d(' + it.x.toFixed(1) + 'px,' + (it.y + Math.sin(it.ph * 2) * 6).toFixed(1) + 'px,0)';
    });
  }

  function run(){
    var active = cfg.on && items.length > 0 && !document.hidden;
    document.body.classList.toggle('angels-on', cfg.on && items.length > 0);
    if (active && !raf){ last = performance.now(); raf = requestAnimationFrame(tick); }
    if (!active && raf){ cancelAnimationFrame(raf); raf = null; }
  }
  document.addEventListener('visibilitychange', run);

  /* ---- UI تنظیمات ---- */
  var ui = {};
  function buildUI(){
    var anchor = document.getElementById('motiv-settings-field') ||
                 document.querySelector('#settings-modal-overlay .modal-actions');
    if (!anchor) return;
    var f = document.createElement('div');
    f.className = 'field'; f.id = 'ang-field';
    f.innerHTML =
      '<label>بک‌گراند متحرک</label>' +
      '<div class="ang-row" id="ang-thumbs"></div>' +
      '<label class="ang-add" for="ang-input">＋ افزودن</label>' +
      '<input type="file" id="ang-input" multiple accept="image/gif,image/png,image/webp,image/jpeg,.gif,.png,.webp,.jpg,.jpeg" style="display:none;">' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:10px;"><input type="checkbox" id="ang-on" style="width:18px;height:18px;"><span>نمایش روی همه‌ی تب‌ها</span></label>' +
      '<div class="ang-sl"><span>اندازه</span><input type="range" id="ang-size" min="60" max="320"></div>' +
      '<div class="ang-sl"><span>سرعت</span><input type="range" id="ang-speed" min="1" max="12"></div>' +
      '<div class="ang-sl"><span>شفافیت</span><input type="range" id="ang-op" min="20" max="100"></div>' +
      '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:10px;"><input type="checkbox" id="ang-soft" style="width:18px;height:18px;"><span>محو کردن لبه‌ها</span></label>' +
      '<select id="ang-blend">' +
        '<option value="normal">حالت: عادی</option>' +
        '<option value="screen">حالت: محو تیره‌ها</option>' +
        '<option value="multiply">حالت: محو سفیدها</option>' +
      '</select>';
    anchor.parentNode.insertBefore(f, anchor);
    ui.thumbs = f.querySelector('#ang-thumbs');
    ui.input = f.querySelector('#ang-input');
    ui.on = f.querySelector('#ang-on');
    ui.size = f.querySelector('#ang-size');
    ui.speed = f.querySelector('#ang-speed');
    ui.op = f.querySelector('#ang-op');
    ui.soft = f.querySelector('#ang-soft');
    ui.blend = f.querySelector('#ang-blend');

    function sync(){
      ui.on.checked = cfg.on; ui.size.value = cfg.size; ui.speed.value = cfg.speed;
      ui.op.value = cfg.opacity; ui.soft.checked = cfg.soft; ui.blend.value = cfg.blend;
    }
    function change(){
      cfg.on = ui.on.checked; cfg.size = +ui.size.value; cfg.speed = +ui.speed.value;
      cfg.opacity = +ui.op.value; cfg.soft = ui.soft.checked; cfg.blend = ui.blend.value;
      saveCfg(); styleAll(); run();
    }
    [ui.on, ui.size, ui.speed, ui.op, ui.soft, ui.blend].forEach(function(e){
      e.addEventListener('input', change); e.addEventListener('change', change);
    });

    ui.input.addEventListener('change', function(){
      var files = Array.prototype.slice.call(ui.input.files || []);
      ui.input.value = '';
      files.forEach(function(file){
        if (!/^image\//.test(file.type) && !/\.(gif|png|webp|jpe?g)$/i.test(file.name || '')) return;
        if (file.size > MAX_BYTES){ if (window.toast) toast('حجم هر فایل باید کمتر از ۱۰ مگابایت باشد'); return; }
        var rec = { id: 'a' + Date.now() + Math.random().toString(36).slice(2,6), blob: file };
        dbPut(rec).then(function(){ spawn(rec); renderThumbs(); run(); })
          .catch(function(){ if (window.toast) toast('ذخیره‌ی فایل ممکن نشد'); });
      });
    });

    var openBtn = document.getElementById('settings-btn');
    if (openBtn) openBtn.addEventListener('click', function(){ sync(); renderThumbs(); });
    sync();
  }

  function renderThumbs(){
    if (!ui.thumbs) return;
    ui.thumbs.innerHTML = '';
    items.forEach(function(it){
      var d = document.createElement('div'); d.className = 'ang-th';
      var im = document.createElement('img'); im.src = it.url; im.alt = '';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = '✕'; b.setAttribute('aria-label','حذف');
      b.addEventListener('click', function(){
        dbDel(it.id);
        try{ URL.revokeObjectURL(it.url); }catch(e){}
        it.el.remove();
        items = items.filter(function(x){ return x !== it; });
        renderThumbs(); run();
      });
      d.appendChild(im); d.appendChild(b); ui.thumbs.appendChild(d);
    });
  }

  buildUI();
  dbAll().then(function(recs){
    recs.forEach(spawn);
    renderThumbs(); run();
  }).catch(function(){});
})();
