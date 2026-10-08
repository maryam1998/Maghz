/* ===== ابزار برش عکس (Crop) ===== */
(function(){
  if (window.cropImage) return;
  var MAX_DIM = 2048;
  var css = [
    '.cropx-ov{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:rgba(8,10,18,.96);color:#fff;font-family:inherit;overscroll-behavior:contain;-webkit-user-select:none;user-select:none;}',
    '.cropx-ov *{box-sizing:border-box;}',
    '.cropx-top{padding:12px 12px 8px;display:flex;flex-direction:column;gap:8px;flex:0 0 auto;}',
    '.cropx-title{font-size:15px;font-weight:800;text-align:center;}',
    '.cropx-title small{font-weight:500;opacity:.7;margin-inline-start:8px;font-size:12px;}',
    '.cropx-ratios{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;justify-content:center;-webkit-overflow-scrolling:touch;}',
    '.cropx-chip{flex:0 0 auto;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;border-radius:999px;padding:6px 13px;font-size:12.5px;font-family:inherit;cursor:pointer;}',
    '.cropx-chip.on{background:var(--accent,#f4c542);border-color:var(--accent,#f4c542);color:#1a1a1a;font-weight:800;}',
    '.cropx-stage-wrap{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;padding:6px 12px;}',
    '.cropx-stage{position:relative;direction:ltr;overflow:hidden;line-height:0;touch-action:none;border-radius:4px;}',
    '.cropx-ov .cropx-img{display:block;max-width:calc(100vw - 24px);max-height:calc(100vh - 210px);max-height:calc(100dvh - 210px);width:auto;height:auto;pointer-events:none;-webkit-user-drag:none;margin:0;border-radius:0;}',
    '.cropx-box{position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.6);cursor:move;touch-action:none;',
    ' background-image:linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)),linear-gradient(rgba(255,255,255,.35),rgba(255,255,255,.35)),linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.35)),linear-gradient(90deg,rgba(255,255,255,.35),rgba(255,255,255,.35));',
    ' background-size:100% 1px,100% 1px,1px 100%,1px 100%;background-position:0 33.33%,0 66.66%,33.33% 0,66.66% 0;background-repeat:no-repeat;}',
    '.cropx-h{position:absolute;width:34px;height:34px;touch-action:none;}',
    '.cropx-h::after{content:"";position:absolute;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.4);}',
    '.cropx-h.nw{left:-17px;top:-17px;cursor:nwse-resize}.cropx-h.ne{right:-17px;top:-17px;cursor:nesw-resize}',
    '.cropx-h.sw{left:-17px;bottom:-17px;cursor:nesw-resize}.cropx-h.se{right:-17px;bottom:-17px;cursor:nwse-resize}',
    '.cropx-h.nw::after,.cropx-h.ne::after,.cropx-h.sw::after,.cropx-h.se::after{width:14px;height:14px;left:10px;top:10px;border-radius:3px;}',
    '.cropx-h.n{left:50%;top:-17px;margin-left:-20px;width:40px;cursor:ns-resize}.cropx-h.s{left:50%;bottom:-17px;margin-left:-20px;width:40px;cursor:ns-resize}',
    '.cropx-h.e{top:50%;right:-17px;margin-top:-20px;height:40px;cursor:ew-resize}.cropx-h.w{top:50%;left:-17px;margin-top:-20px;height:40px;cursor:ew-resize}',
    '.cropx-h.n::after,.cropx-h.s::after{left:8px;top:14px;width:24px;height:6px;border-radius:3px;}',
    '.cropx-h.e::after,.cropx-h.w::after{left:14px;top:8px;width:6px;height:24px;border-radius:3px;}',
    '.cropx-ov.locked .cropx-h.n,.cropx-ov.locked .cropx-h.s,.cropx-ov.locked .cropx-h.e,.cropx-ov.locked .cropx-h.w{display:none;}',
    '.cropx-actions{flex:0 0 auto;display:flex;gap:8px;padding:10px 12px calc(12px + env(safe-area-inset-bottom,0px));}',
    '.cropx-btn{flex:1;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;border-radius:12px;padding:12px 8px;font-size:14px;font-family:inherit;cursor:pointer;}',
    '.cropx-btn.primary{flex:1.4;background:var(--accent,#f4c542);border-color:var(--accent,#f4c542);color:#1a1a1a;font-weight:800;}'
  ].join('\n');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function readFile(file){
    return new Promise(function(res, rej){
      var r = new FileReader();
      r.onload = function(){ res(r.result); };
      r.onerror = function(){ rej(r.error); };
      r.readAsDataURL(file);
    });
  }
  function loadImg(src){
    return new Promise(function(res, rej){
      var im = new Image();
      im.onload = function(){ res(im); };
      im.onerror = rej;
      im.src = src;
    });
  }
  window.readFileAsDataURL = readFile;

  function openCropper(img, origUrl, mime, opts){
    return new Promise(function(resolve){
      var NW = img.naturalWidth, NH = img.naturalHeight;
      var ov = document.createElement('div');
      ov.className = 'cropx-ov';
      ov.setAttribute('dir', 'rtl');
      var counter = (opts.total > 1) ? '<small>' + (opts.index + 1).toLocaleString('fa-IR') + ' از ' + opts.total.toLocaleString('fa-IR') + '</small>' : '';
      ov.innerHTML =
        '<div class="cropx-top"><div class="cropx-title">برش عکس' + counter + '</div><div class="cropx-ratios"></div></div>' +
        '<div class="cropx-stage-wrap"><div class="cropx-stage"><img class="cropx-img" alt="" draggable="false">' +
        '<div class="cropx-box">' +
        ['nw','ne','sw','se','n','s','e','w'].map(function(d){ return '<div class="cropx-h ' + d + '" data-d="' + d + '"></div>'; }).join('') +
        '</div></div></div>' +
        '<div class="cropx-actions">' +
        '<button type="button" class="cropx-btn" data-a="cancel">انصراف</button>' +
        '<button type="button" class="cropx-btn" data-a="orig">بدون برش</button>' +
        '<button type="button" class="cropx-btn primary" data-a="ok">تأیید</button></div>';
      var view = ov.querySelector('.cropx-img');
      var box = ov.querySelector('.cropx-box');
      var chipsEl = ov.querySelector('.cropx-ratios');
      view.src = origUrl;

      var ratio = 0;
      var R = { x: NW * 0.05, y: NH * 0.05, w: NW * 0.9, h: NH * 0.9 };

      var ratios = [['آزاد', 0], ['۱:۱', 1], ['۴:۳', 4 / 3], ['۳:۴', 3 / 4], ['۱۶:۹', 16 / 9], ['۹:۱۶', 9 / 16]];
      if (opts.screen) ratios.push(['صفحه‌نمایش', (window.innerWidth || 1) / (window.innerHeight || 1)]);
      ratios.forEach(function(p){
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cropx-chip';
        b.textContent = p[0];
        b.addEventListener('click', function(){ setRatio(p[1]); });
        b._v = p[1];
        chipsEl.appendChild(b);
      });

      function k(){ return (view.clientWidth || NW) / NW; }
      function render(){
        var s = k();
        box.style.left = (R.x * s) + 'px';
        box.style.top = (R.y * s) + 'px';
        box.style.width = (R.w * s) + 'px';
        box.style.height = (R.h * s) + 'px';
      }
      function setRatio(v){
        ratio = v;
        ov.classList.toggle('locked', !!v);
        Array.prototype.forEach.call(chipsEl.children, function(c){ c.classList.toggle('on', c._v === v); });
        if (v){
          var cx = R.x + R.w / 2, cy = R.y + R.h / 2;
          var w = Math.min(NW, NH * v) * 0.9;
          var h = w / v;
          R = { x: clamp(cx - w / 2, 0, NW - w), y: clamp(cy - h / 2, 0, NH - h), w: w, h: h };
        }
        render();
      }

      var drag = null;
      function resize(d, r, dx, dy, s){
        var min = 24 / s;
        var west = d.indexOf('w') >= 0, east = d.indexOf('e') >= 0;
        var north = d.indexOf('n') >= 0, south = d.indexOf('s') >= 0;
        if (!ratio){
          var l = r.x, t = r.y, rt = r.x + r.w, b = r.y + r.h;
          if (west)  l  = clamp(r.x + dx, 0, rt - min);
          if (east)  rt = clamp(rt + dx, l + min, NW);
          if (north) t  = clamp(r.y + dy, 0, b - min);
          if (south) b  = clamp(b + dy, t + min, NH);
          R = { x: l, y: t, w: rt - l, h: b - t };
          return;
        }
        if (d.length !== 2) return;
        var ax = west ? r.x + r.w : r.x;
        var ay = north ? r.y + r.h : r.y;
        var px = clamp((west ? r.x : r.x + r.w) + dx, 0, NW);
        var py = clamp((north ? r.y : r.y + r.h) + dy, 0, NH);
        var maxW = west ? ax : NW - ax;
        var maxH = north ? ay : NH - ay;
        var cap = Math.min(maxW, maxH * ratio);
        var w2 = Math.max(Math.abs(px - ax), Math.abs(py - ay) * ratio);
        w2 = Math.min(w2, cap);
        w2 = Math.max(w2, Math.min(min, cap));
        var h2 = w2 / ratio;
        R = { x: west ? ax - w2 : ax, y: north ? ay - h2 : ay, w: w2, h: h2 };
      }
      box.addEventListener('pointerdown', function(e){
        var d = e.target.getAttribute && e.target.getAttribute('data-d');
        if (!d && e.target !== box) return;
        e.preventDefault();
        drag = { mode: d || 'move', sx: e.clientX, sy: e.clientY, id: e.pointerId, r: { x: R.x, y: R.y, w: R.w, h: R.h } };
        try { e.target.setPointerCapture(e.pointerId); } catch(_){}
      });
      box.addEventListener('pointermove', function(e){
        if (!drag || e.pointerId !== drag.id) return;
        var s = k();
        var dx = (e.clientX - drag.sx) / s, dy = (e.clientY - drag.sy) / s;
        var r = drag.r;
        if (drag.mode === 'move'){
          R = { x: clamp(r.x + dx, 0, NW - r.w), y: clamp(r.y + dy, 0, NH - r.h), w: r.w, h: r.h };
        } else {
          resize(drag.mode, r, dx, dy, s);
        }
        render();
      });
      function endDrag(e){ if (drag && e.pointerId === drag.id) drag = null; }
      box.addEventListener('pointerup', endDrag);
      box.addEventListener('pointercancel', endDrag);

      function cleanup(){
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', render);
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      }
      function finish(kind){
        var out = null;
        if (kind === 'ok'){
          var sw = Math.max(1, Math.round(R.w)), sh = Math.max(1, Math.round(R.h));
          var sc = Math.min(1, MAX_DIM / Math.max(sw, sh));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(sw * sc));
          c.height = Math.max(1, Math.round(sh * sc));
          var ctx = c.getContext('2d');
          var isPng = /png/i.test(mime || '');
          if (!isPng){ ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(img, R.x, R.y, R.w, R.h, 0, 0, c.width, c.height);
          try { out = c.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.92); } catch(_){ out = origUrl; }
        } else if (kind === 'orig'){
          out = origUrl;
        }
        cleanup();
        resolve(out);
      }
      function onKey(e){
        if (e.key === 'Escape'){ e.stopPropagation(); finish('cancel'); }
      }
      ov.addEventListener('click', function(e){
        var a = e.target.getAttribute && e.target.getAttribute('data-a');
        if (a) finish(a);
      });
      document.addEventListener('keydown', onKey, true);
      window.addEventListener('resize', render);

      document.body.appendChild(ov);
      var init = function(){
        if (opts.screen) setRatio((window.innerWidth || 1) / (window.innerHeight || 1));
        else setRatio(0);
      };
      init();
      requestAnimationFrame(render);
    });
  }

  window.cropImage = async function(file, opts){
    opts = opts || {};
    var dataUrl;
    try { dataUrl = await readFile(file); } catch(e){ return null; }
    if (/^image\/gif$/i.test(file.type)) return dataUrl;
    var img;
    try { img = await loadImg(dataUrl); } catch(e){ return dataUrl; }
    return openCropper(img, dataUrl, file.type, opts);
  };

  window.cropImages = async function(files, opts){
    var list = Array.prototype.slice.call(files || []);
    var out = [];
    for (var i = 0; i < list.length; i++){
      var o = Object.assign({}, opts || {}, { index: i, total: list.length });
      var r = await window.cropImage(list[i], o);
      if (r === null) break;
      out.push(r);
    }
    return out;
  };
})();
