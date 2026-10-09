/* ===== اسلایدشوی خودکار «تصاویر» (عکس + ویدیو) =====
   - تایمر دلخواه: ثانیه / دقیقه / ساعت (بدون سقف)
   - ترتیب: به‌ترتیب یا تصادفی، با لوپ
   - لمس کوتاه روی تصویر = توقف/ادامه‌ی تعویض خودکار
   - «بعدی» / «قبلی» / کشیدن انگشت = رفتن به اسلاید دیگر و برگشت به حالت خودکار با همان تایمر */
(function(){
  var KEY = 'vizSlideshow';
  var UNIT_MS = { s: 1000, m: 60000, h: 3600000 };
  var def = { value: 5, unit: 's', order: 'seq', loop: true };

  function loadCfg(key){
    var c = {}; for (var k in def) c[k] = def[k];
    try{
      var o = JSON.parse(localStorage.getItem(key || KEY) || 'null') || {};
      for (var k2 in def) if (o[k2] !== undefined) c[k2] = o[k2];
    }catch(e){}
    return c;
  }
  function saveCfg(c, key){ try{ localStorage.setItem(key || KEY, JSON.stringify(c)); }catch(e){} }
  function intervalMs(c){
    var v = parseFloat(c.value);
    if (!isFinite(v) || v <= 0) v = def.value;
    return Math.max(500, v * (UNIT_MS[c.unit] || 1000));
  }
  function toFa(n){ return String(n).replace(/\d/g, function(d){ return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }

  /* ---- ویدیوها از همان IndexedDB برنامه ---- */
  var dbP = null, urls = {};
  function db(){
    if (dbP) return dbP;
    dbP = new Promise(function(res, rej){
      if (!window.indexedDB){ rej(new Error('no-idb')); return; }
      var r = indexedDB.open('beliefs-patch-media', 2);
      r.onupgradeneeded = function(){
        if (!r.result.objectStoreNames.contains('videos')) r.result.createObjectStore('videos');
        if (!r.result.objectStoreNames.contains('images')) r.result.createObjectStore('images');
      };
      r.onsuccess = function(){
        var d = r.result;
        d.onversionchange = function(){ try { d.close(); } catch(e){} dbP = null; };
        res(d);
      };
      r.onerror = function(){ rej(r.error); };
    });
    dbP.catch(function(){ dbP = null; });
    return dbP;
  }
  function videoUrl(id){
    if (urls[id]) return Promise.resolve(urls[id]);
    return db().then(function(d){ return new Promise(function(res, rej){
      var q = d.transaction('videos', 'readonly').objectStore('videos').get(id);
      q.onsuccess = function(){
        if (!q.result){ rej(new Error('missing')); return; }
        urls[id] = URL.createObjectURL(q.result); res(urls[id]);
      };
      q.onerror = function(){ rej(q.error); };
    }); });
  }

  /* ---- فهرست اسلایدها (عکس + ویدیو، به ترتیب زمان افزودن) ---- */
  function tsOf(id){
    var m = /(\d{10,})/.exec(String(id)); return m ? +m[1] : 0;
  }
  /* اسلایدهای شکرگذاری: عکس‌های همه‌ی موردهای دستی، به ترتیب ثبت */
  function slidesGratitude(){
    var out = [];
    var arr = (typeof state !== 'undefined' && state && state.gratitude) || [];
    arr.forEach(function(g, gi){
      if (!g || g.source !== 'manual') return;
      var imgs = (g.images && g.images.length) ? g.images : (g.image ? [{ src: g.image }] : []);
      imgs.forEach(function(im, i){
        if (im && im.src) out.push({ k: 'g' + gi + '_' + (im.id || i), t: 'img', src: im.src, ts: gi, n: i });
      });
    });
    return out;
  }
  function slides(source){
    if (source === 'gratitude') return slidesGratitude();
    var cb = (typeof state !== 'undefined' && state && state.currentBelief) || {};
    var out = [];
    (cb.visualImages || []).forEach(function(im, i){
      if (im && im.src) out.push({ k: 'i' + (im.id || i), t: 'img', src: im.src, ts: tsOf(im.id), n: i });
    });
    (cb.visualVideos || []).forEach(function(v, i){
      if (v && v.id) out.push({ k: 'v' + v.id, t: 'vid', id: v.id, ts: tsOf(v.id), n: 1e6 + i });
    });
    out.sort(function(a, b){ return (a.ts - b.ts) || (a.n - b.n); });
    return out;
  }

  /* ---- استایل ---- */
  var css = document.createElement('style');
  css.textContent = [
    '.vs-wrap{margin:4px 0 12px;}',
    '.vs-stage{position:relative;width:100%;aspect-ratio:4/3;max-height:62vh;border-radius:16px;overflow:hidden;background:#000;border:1px solid var(--line);touch-action:pan-y;-webkit-user-select:none;user-select:none;cursor:pointer;}',
    '.vs-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .7s ease;background:#000;pointer-events:none;}',
    '.vs-layer.on{opacity:1;}',
    '.vs-count{position:absolute;top:8px;left:8px;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;font-weight:700;pointer-events:none;}',
    '.vs-pause{position:absolute;top:50%;left:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;pointer-events:none;}',
    '.vs-stage.paused .vs-pause{opacity:0;}',
    '.vs-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(255,255,255,.18);pointer-events:none;}',
    '.vs-bar i{display:block;height:100%;width:0;background:var(--emerald-700,#c9962b);}',
    '.vs-nav{display:flex;gap:8px;margin-top:8px;}',
    '.vs-nav button{flex:1;padding:10px 0;border-radius:12px;border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;}',
    '.vs-nav button:active{opacity:.7;}',
    '.vs-set{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:var(--ink);}',
    '.vs-set input[type=number],.vs-set select{padding:7px 8px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-family:inherit;font-size:12.5px;}',
    '.vs-set input[type=number]{width:72px;text-align:center;}',
    '.vs-set label.vs-chk{display:flex;align-items:center;gap:5px;cursor:pointer;}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---- نمونه‌ی اسلایدشو ---- */
  function mount(root){
    if (root.getAttribute('data-vs') === '1') return;
    root.setAttribute('data-vs', '1');
    var source = root.getAttribute('data-vs-src') || 'beliefs';
    var cfgKey = source === 'gratitude' ? 'gratSlideshow' : KEY;
    var cfg = loadCfg(cfgKey);

    root.innerHTML =
      (source === 'gratitude' ? '<div class="items-title" style="margin:6px 0 8px;">🖼️ تصاویر شکرگذاری‌ها</div>' : '') +
      '<div class="vs-wrap">' +
        '<div class="vs-stage" id="vs-stage">' +
          '<img class="vs-layer" alt="" draggable="false"><video class="vs-layer" muted playsinline loop></video>' +
          '<img class="vs-layer" alt="" draggable="false"><video class="vs-layer" muted playsinline loop></video>' +
          '<div class="vs-count"></div>' +
          '<div class="vs-bar"><i></i></div>' +
        '</div>' +
        '<div class="vs-nav"><button type="button" data-vs="next">‹ بعدی</button><button type="button" data-vs="prev">قبلی ›</button></div>' +
        '<div class="vs-set">' +
          '<span>هر</span>' +
          '<input type="number" min="0.5" step="any" inputmode="decimal" data-f="value">' +
          '<select data-f="unit"><option value="s">ثانیه</option><option value="m">دقیقه</option><option value="h">ساعت</option></select>' +
          '<select data-f="order"><option value="seq">به‌ترتیب</option><option value="rnd">تصادفی</option></select>' +
          '<label class="vs-chk"><input type="checkbox" data-f="loop"><span>تکرار</span></label>' +
        '</div>' +
        (source === 'gratitude' ? '<div class="vs-nav"><button type="button" data-vs="album">مشاهده‌ی همه‌ی عکس‌ها ▦</button></div>' : '') +
      '</div>';

    var stage = root.querySelector('.vs-stage');
    var layers = [
      { img: stage.children[0], vid: stage.children[1] },
      { img: stage.children[2], vid: stage.children[3] }
    ];
    var countEl = root.querySelector('.vs-count');
    var barI = root.querySelector('.vs-bar i');
    var fVal = root.querySelector('[data-f=value]'), fUnit = root.querySelector('[data-f=unit]');
    var fOrder = root.querySelector('[data-f=order]'), fLoop = root.querySelector('[data-f=loop]');
    fVal.value = cfg.value; fUnit.value = cfg.unit; fOrder.value = cfg.order; fLoop.checked = !!cfg.loop;

    var list = [], order = [], pos = -1, cur = 0;   // cur = لایه‌ی فعال
    var timer = null, paused = false, remaining = 0, startedAt = 0, token = 0, sig = '';

    function sigOf(l){ return l.map(function(s){ return s.k; }).join('|'); }
    function shuffle(n, avoid){
      var a = []; for (var i = 0; i < n; i++) a.push(i);
      for (var j = n - 1; j > 0; j--){ var r = Math.floor(Math.random() * (j + 1)); var t = a[j]; a[j] = a[r]; a[r] = t; }
      if (n > 1 && a[0] === avoid){ var x = a[0]; a[0] = a[1]; a[1] = x; }
      return a;
    }
    function buildOrder(keepCurrentIdx){
      var n = list.length;
      if (cfg.order === 'rnd'){
        order = shuffle(n, -1);
        if (keepCurrentIdx != null && keepCurrentIdx >= 0){
          var at = order.indexOf(keepCurrentIdx); if (at > 0){ order.splice(at, 1); order.unshift(keepCurrentIdx); }
          pos = 0;
        }
      } else {
        order = []; for (var i = 0; i < n; i++) order.push(i);
        if (keepCurrentIdx != null && keepCurrentIdx >= 0) pos = keepCurrentIdx;
      }
    }
    function curIdx(){ return pos >= 0 && order[pos] != null ? order[pos] : -1; }

    function refreshList(){
      var l = slides(source), s = sigOf(l);
      if (s === sig) return false;
      var curKey = curIdx() >= 0 && list[curIdx()] ? list[curIdx()].k : null;
      list = l; sig = s;
      var keep = -1;
      if (curKey) for (var i = 0; i < list.length; i++) if (list[i].k === curKey){ keep = i; break; }
      buildOrder(keep);
      if (keep < 0) pos = -1;
      return true;
    }

    /* نوار پیشرفت */
    function barRun(ms, fromPct){
      barI.style.transition = 'none';
      barI.style.width = fromPct + '%';
      void barI.offsetWidth;
      barI.style.transition = 'width ' + ms + 'ms linear';
      barI.style.width = '100%';
    }
    function barFreeze(){
      var w = barI.getBoundingClientRect().width, tw = barI.parentNode.getBoundingClientRect().width || 1;
      barI.style.transition = 'none';
      barI.style.width = (w / tw * 100) + '%';
    }
    function barReset(){ barI.style.transition = 'none'; barI.style.width = '0%'; }

    function visible(){ return stage.isConnected && stage.offsetParent !== null && !document.hidden; }

    function clearT(){ if (timer){ clearTimeout(timer); timer = null; } }
    function schedule(ms){
      clearT();
      remaining = ms; startedAt = Date.now();
      if (list.length < 2){ barReset(); return; }
      var total = intervalMs(cfg);
      barRun(ms, (1 - ms / total) * 100);
      timer = setTimeout(onTick, ms);
    }
    function onTick(){
      timer = null;
      if (!stage.isConnected) return;
      if (!visible()){ schedule(intervalMs(cfg)); return; }   // وقتی دیده نمی‌شود صبر کن
      step(1, false);
    }

    /* نمایش یک اسلاید روی لایه‌ی پشتی و کراس‌فید */
    function showSlide(idx, tries){
      var tk = ++token;
      var s = list[idx]; if (!s) return;
      var nxt = 1 - cur, L = layers[nxt];
      function done(){
        if (tk !== token) return;
        layers[cur].img.classList.remove('on'); layers[cur].vid.classList.remove('on');
        try{ layers[cur].vid.pause(); }catch(e){}
        (s.t === 'img' ? L.img : L.vid).classList.add('on');
        (s.t === 'img' ? L.vid : L.img).classList.remove('on');
        cur = nxt;
        countEl.textContent = toFa(pos + 1) + ' / ' + toFa(list.length);
        if (s.t === 'vid' && !paused){ var p = L.vid.play(); if (p && p.catch) p.catch(function(){}); }
        if (s.t === 'vid' && paused){ try{ L.vid.pause(); }catch(e){} }
      }
      if (s.t === 'img'){
        L.img.onload = done; L.img.onerror = done;
        if (L.img.getAttribute('src') === s.src) done(); else L.img.src = s.src;
      } else {
        videoUrl(s.id).then(function(u){
          if (tk !== token) return;
          L.vid.oncanplay = function(){ L.vid.oncanplay = null; done(); };
          L.vid.onerror = function(){ L.vid.onerror = null; skip(); };
          if (L.vid.getAttribute('data-u') !== u){ L.vid.setAttribute('data-u', u); L.vid.src = u; }
          else { try{ L.vid.currentTime = 0; }catch(e){} done(); }
        }).catch(skip);
      }
      function skip(){
        if (tk !== token) return;
        if ((tries || 0) > list.length) return;   // همه خراب‌اند
        step(1, false, (tries || 0) + 1);
      }
    }

    /* dir: +1 / -1 ؛ manual=true یعنی کاربر زده → برگرد به حالت خودکار */
    function step(dir, manual, tries){
      refreshList();
      if (!list.length) return;
      var n = list.length;
      if (pos < 0){ pos = 0; }
      else {
        pos += dir;
        if (pos >= n){
          if (cfg.loop || manual){
            if (cfg.order === 'rnd') order = shuffle(n, order[n - 1]);
            pos = 0;
          } else { pos = n - 1; setPaused(true); return; }
        } else if (pos < 0){
          if (cfg.loop || manual) pos = n - 1; else pos = 0;
        }
      }
      showSlide(order[pos], tries);
      if (manual){ paused = false; stage.classList.remove('paused'); }
      if (!paused) schedule(intervalMs(cfg));
    }

    function setPaused(p){
      if (p === paused) return;
      paused = p;
      stage.classList.toggle('paused', paused);
      var s = list[curIdx()];
      if (paused){
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        clearT(); barFreeze();
        try{ layers[cur].vid.pause(); }catch(e){}
      } else {
        if (s && s.t === 'vid'){ var pr = layers[cur].vid.play(); if (pr && pr.catch) pr.catch(function(){}); }
        schedule(Math.max(300, remaining || intervalMs(cfg)));
      }
    }

    /* لمس / زوم = توقف (بدون هیچ دکمه‌ی توقفی) ؛ ورق‌زدن (کشیدن، قبلی/بعدی) = برگشت به حالت خودکار */
    var down = null, ptrs = 0;
    stage.addEventListener('pointerdown', function(e){
      ptrs++;
      if (ptrs > 1){ down = null; if (list.length) setPaused(true); return; }   // دو انگشت = زوم
      down = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    stage.addEventListener('pointerup', function(e){
      ptrs = Math.max(0, ptrs - 1);
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y, dt = Date.now() - down.t;
      down = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5){ step(dx < 0 ? 1 : -1, true); return; }
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 450){ if (list.length) setPaused(true); }
    });
    stage.addEventListener('pointercancel', function(){ ptrs = Math.max(0, ptrs - 1); down = null; });
    if (window.visualViewport) visualViewport.addEventListener('resize', function(){
      if (stage.isConnected && visualViewport.scale > 1.02 && list.length) setPaused(true);   // زومِ کل صفحه
    });

    var albumBtn = root.querySelector('[data-vs=album]');
    if (albumBtn) albumBtn.addEventListener('click', function(){
      if (typeof window.openGratAlbumAll === 'function'){
        var k = curIdx(); window.openGratAlbumAll(k >= 0 ? k : 0);
      }
    });
    root.querySelector('[data-vs=next]').addEventListener('click', function(){ step(1, true); });
    root.querySelector('[data-vs=prev]').addEventListener('click', function(){ step(-1, true); });

    /* تنظیمات */
    function onCfg(){
      var v = parseFloat(fVal.value);
      cfg.value = (isFinite(v) && v > 0) ? v : def.value;
      cfg.unit = fUnit.value; cfg.loop = fLoop.checked;
      var newOrder = fOrder.value, orderChanged = newOrder !== cfg.order;
      cfg.order = newOrder;
      saveCfg(cfg, cfgKey);
      if (orderChanged){ var k = curIdx(); buildOrder(k); if (k < 0) pos = -1; }
      if (!paused && list.length) schedule(intervalMs(cfg));
    }
    [fVal, fUnit, fOrder, fLoop].forEach(function(el){ el.addEventListener('change', onCfg); });
    fVal.addEventListener('input', function(){ var v = parseFloat(fVal.value); if (isFinite(v) && v > 0) onCfg(); });

    document.addEventListener('visibilitychange', function(){
      if (!stage.isConnected) return;
      var s = list[curIdx()];
      if (document.hidden){ try{ layers[cur].vid.pause(); }catch(e){} }
      else if (s && s.t === 'vid' && !paused){ var pr = layers[cur].vid.play(); if (pr && pr.catch) pr.catch(function(){}); }
    });

    /* شروع */
    refreshList();
    if (!list.length){ root.style.display = 'none'; }
    else { pos = (cfg.order === 'rnd') ? 0 : 0; showSlide(order[0]); schedule(intervalMs(cfg)); }

    /* اگر بعداً عکس/ویدیو اضافه شد، خودش را نشان بده */
    var poll = setInterval(function(){
      if (!stage.isConnected){ clearInterval(poll); return; }
      var had = list.length;
      if (refreshList()){
        if (list.length && root.style.display === 'none') root.style.display = '';
        if (!had && list.length){ pos = 0; showSlide(order[0]); if (!paused) schedule(intervalMs(cfg)); }
        else if (list.length && curIdx() < 0){ pos = 0; showSlide(order[0]); }
        else if (!list.length){ clearT(); barReset(); root.style.display = 'none'; }
        else if (list.length === 1){ clearT(); barReset(); }
        else if (!paused && !timer){ schedule(intervalMs(cfg)); }
      }
    }, 1500);
  }

  function scan(){
    ['vs-root', 'grat-vs-root'].forEach(function(id){
      var r = document.getElementById(id);
      if (r && r.getAttribute('data-vs') !== '1') mount(r);
    });
  }
  var pend = false;
  new MutationObserver(function(){
    if (pend) return; pend = true;
    setTimeout(function(){ pend = false; scan(); }, 80);
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();

/* ===== اسلایدشوی خودکار در آلبوم تمام‌صفحه‌ی عکس‌ها =====
   همان تنظیم (زمان/ترتیب/تکرار) اسلایدشوی بالا را استفاده می‌کند.
   لمس یا زوم = توقف ؛ ورق‌زدن (کشیدن یا دکمه‌ی قبلی/بعدی) = ادامه‌ی خودکار. دکمه‌ی توقف ندارد. */
(function(){
  var KEY = 'vizSlideshow';
  var UNIT_MS = { s: 1000, m: 60000, h: 3600000 };
  function cfg(){
    var c = { value: 5, unit: 's', order: 'seq', loop: true };
    try{ var o = JSON.parse(localStorage.getItem(KEY) || 'null') || {}; for (var k in c) if (o[k] !== undefined) c[k] = o[k]; }catch(e){}
    return c;
  }
  function ms(c){ var v = parseFloat(c.value); if (!isFinite(v) || v <= 0) v = 5; return Math.max(500, v * (UNIT_MS[c.unit] || 1000)); }

  var timer = null, running = false, paused = false, ignoreUntil = 0, ts = null;
  function viewer(){ return document.getElementById('vg-viewer'); }
  function isOpen(){ var v = viewer(); return !!(v && v.style.display === 'flex'); }
  function track(){ return document.getElementById('vg-track'); }
  function blocked(){
    var o = document.getElementById('vg-overview'), c = document.getElementById('vc-modal');
    if (o && o.style.display === 'flex') return true;
    if (c && getComputedStyle(c).display !== 'none') return true;
    return false;
  }
  function clearT(){ if (timer){ clearTimeout(timer); timer = null; } }
  function schedule(delay){
    clearT();
    if (!running || paused) return;
    timer = setTimeout(tick, delay == null ? ms(cfg()) : delay);
  }
  function tick(){
    timer = null;
    if (!running || !isOpen()) return;
    var t = track();
    if (!t || document.hidden || blocked() || paused){ schedule(); return; }
    var n = t.children.length;
    if (n < 2) return;
    var w = t.clientWidth || 1, idx = Math.round(t.scrollLeft / w), c = cfg(), next;
    if (c.order === 'rnd'){ do { next = Math.floor(Math.random() * n); } while (next === idx); }
    else { next = idx + 1; if (next >= n){ if (!c.loop){ return; } next = 0; } }
    ignoreUntil = Date.now() + 900;
    try{ t.scrollTo({ left: next * w, behavior: 'smooth' }); }catch(e){ t.scrollLeft = next * w; }
    schedule();
  }
  function pause(){ if (!running || paused) return; paused = true; clearT(); }
  function resume(delay){ if (!running) return; paused = false; schedule(delay); }

  function start(){ running = true; paused = false; schedule(); }
  function stop(){ running = false; paused = false; clearT(); }

  setInterval(function(){
    var open = isOpen();
    if (open && !running) start();
    else if (!open && running) stop();
  }, 400);

  /* لمس / زوم / ورق‌زدن */
  document.addEventListener('touchstart', function(e){
    if (!running || !viewer() || !viewer().contains(e.target)) return;
    if (e.target.closest && e.target.closest('button')) return;
    if (e.touches.length > 1){ ts = null; pause(); return; }   // دو انگشت = زوم
    var t0 = e.touches[0];
    ts = { x: t0.clientX, y: t0.clientY, t: Date.now() };
  }, { passive: true, capture: true });
  document.addEventListener('touchend', function(e){
    if (!running || !ts) return;
    var t1 = e.changedTouches[0], dx = t1.clientX - ts.x, dy = t1.clientY - ts.y, dt = Date.now() - ts.t;
    ts = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2){ resume(ms(cfg()) + 400); return; }   // ورق زد → ادامه
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 450) pause();                                    // لمس → توقف
  }, { passive: true, capture: true });
  document.addEventListener('click', function(e){
    if (!running) return;
    var b = e.target.closest && e.target.closest('[data-vg=prev],[data-vg=next]');
    if (b && viewer() && viewer().contains(b)) resume(ms(cfg()) + 400);
  }, true);
  if (window.visualViewport) visualViewport.addEventListener('resize', function(){
    if (running && visualViewport.scale > 1.02) pause();
  });
})();

