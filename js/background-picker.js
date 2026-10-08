(function(){
  var KEY = 'appBackgroundMode';
  var IMG_KEY = 'appBackgroundImage';
  var defaults = { mode:'calm', blur:0, opacity:50, kind:'image' };
  var MAX_IMG_BYTES = 4 * 1024 * 1024;
  var MAX_VID_BYTES = 60 * 1024 * 1024;

  function idb(){
    return new Promise(function(res, rej){
      try{
        var r = indexedDB.open('appBgDB', 1);
        r.onupgradeneeded = function(){ r.result.createObjectStore('kv'); };
        r.onsuccess = function(){ res(r.result); };
        r.onerror = function(){ rej(r.error); };
      }catch(e){ rej(e); }
    });
  }
  function idbGet(k){
    return idb().then(function(db){ return new Promise(function(res, rej){
      var q = db.transaction('kv','readonly').objectStore('kv').get(k);
      q.onsuccess = function(){ res(q.result || null); };
      q.onerror = function(){ rej(q.error); };
    }); });
  }
  function idbSet(k, v){
    return idb().then(function(db){ return new Promise(function(res, rej){
      var tx = db.transaction('kv','readwrite');
      tx.objectStore('kv').put(v, k);
      tx.oncomplete = function(){ res(true); };
      tx.onerror = function(){ rej(tx.error); };
      tx.onabort = function(){ rej(tx.error); };
    }); });
  }
  function idbDel(k){
    return idb().then(function(db){ return new Promise(function(res){
      var tx = db.transaction('kv','readwrite');
      tx.objectStore('kv').delete(k);
      tx.oncomplete = function(){ res(true); };
      tx.onerror = function(){ res(false); };
    }); }).catch(function(){ return false; });
  }
  function load(){
    try{
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      var cfg = {};
      for (var k in defaults) cfg[k] = defaults[k];
      if (saved) for (var k2 in saved) cfg[k2] = saved[k2];
      try{ cfg.imageData = localStorage.getItem(IMG_KEY) || null; }catch(e){ cfg.imageData = null; }
      cfg.videoUrl = null;
      return cfg;
    }catch(e){
      var cfg2 = {}; for (var k3 in defaults) cfg2[k3] = defaults[k3];
      cfg2.imageData = null; cfg2.videoUrl = null;
      return cfg2;
    }
  }
  function save(cfg){
    try{ localStorage.setItem(KEY, JSON.stringify({ mode:cfg.mode, blur:cfg.blur, opacity:cfg.opacity, kind:cfg.kind })); }catch(e){}
  }
  function saveImage(dataUrl){
    try{ if (dataUrl) localStorage.setItem(IMG_KEY, dataUrl); else localStorage.removeItem(IMG_KEY); return true; }
    catch(e){ return false; }
  }

  window.appBgConfig = load();

  function forceMute(v){ if (!v) return; v.muted = true; v.defaultMuted = true; v.volume = 0; v.setAttribute('muted', ''); }
  function playVid(v){ if (!v) return; forceMute(v); var p = v.play(); if (p && p.catch) p.catch(function(){}); }

  function applyBg(cfg){
    var hasVideo = cfg.kind === 'video' && !!cfg.videoUrl;
    var hasImage = cfg.kind !== 'video' && !!cfg.imageData;
    var active = cfg.mode === 'image' && (hasVideo || hasImage);
    document.body.classList.toggle('bg-mode-image', active);
    document.documentElement.style.setProperty('--amb-opacity', (cfg.opacity/100));
    document.documentElement.style.setProperty('--amb-blur', cfg.blur + 'px');
    var imgLayer = document.getElementById('ambient-bg-img');
    if (imgLayer) imgLayer.style.backgroundImage = hasImage ? 'url(' + cfg.imageData + ')' : 'none';
    var vid = document.getElementById('ambient-bg-video');
    if (vid){
      forceMute(vid);
      if (hasVideo){
        if (vid.getAttribute('data-src') !== cfg.videoUrl){ vid.setAttribute('data-src', cfg.videoUrl); vid.src = cfg.videoUrl; }
        vid.style.display = 'block';
        if (active && !document.hidden) playVid(vid); else vid.pause();
      } else { vid.pause(); vid.style.display = 'none'; }
    }
    var calmBtn = document.getElementById('bgmode-calm-btn');
    var imageBtn = document.getElementById('bgmode-image-btn');
    var imageOpts = document.getElementById('bgmode-image-options');
    if (calmBtn) calmBtn.classList.toggle('active', cfg.mode === 'calm');
    if (imageBtn) imageBtn.classList.toggle('active', cfg.mode === 'image');
    if (imageOpts) imageOpts.style.display = (cfg.mode === 'image') ? 'block' : 'none';
    var preview = document.getElementById('bgimg-preview');
    if (preview){
      if (hasImage){ preview.src = cfg.imageData; preview.style.display = 'block'; }
      else { preview.style.display = 'none'; }
    }
    var vprev = document.getElementById('bgvid-preview');
    if (vprev){
      forceMute(vprev);
      if (hasVideo){
        if (vprev.getAttribute('data-src') !== cfg.videoUrl){ vprev.setAttribute('data-src', cfg.videoUrl); vprev.src = cfg.videoUrl; }
        vprev.style.display = 'block';
        playVid(vprev);
      } else { vprev.pause(); vprev.style.display = 'none'; }
    }
    var removeBtn = document.getElementById('bgimg-remove-btn');
    if (removeBtn) removeBtn.style.display = (hasImage || hasVideo) ? 'inline-block' : 'none';
    var blurRange = document.getElementById('bgmode-blur');
    if (blurRange) blurRange.value = cfg.blur;
    var opRange = document.getElementById('bgmode-opacity');
    if (opRange) opRange.value = cfg.opacity;
  }

  window.setAppBgMode = function(mode){
    window.appBgConfig.mode = mode;
    applyBg(window.appBgConfig);
    save(window.appBgConfig);
  };

  applyBg(window.appBgConfig);

  if (window.appBgConfig.kind === 'video'){
    idbGet('video').then(function(blob){
      if (!blob) return;
      window.appBgConfig.videoUrl = URL.createObjectURL(blob);
      applyBg(window.appBgConfig);
    }).catch(function(){});
  }

  document.addEventListener('visibilitychange', function(){ applyBg(window.appBgConfig); });
  document.addEventListener('touchstart', function(){
    var v = document.getElementById('ambient-bg-video');
    if (v && v.paused && document.body.classList.contains('bg-mode-image') && window.appBgConfig.kind === 'video') playVid(v);
  }, { passive:true });

  function wireUI(){
    var calmBtn = document.getElementById('bgmode-calm-btn');
    var imageBtn = document.getElementById('bgmode-image-btn');
    if (calmBtn) calmBtn.addEventListener('click', function(){ window.setAppBgMode('calm'); });
    if (imageBtn) imageBtn.addEventListener('click', function(){ window.setAppBgMode('image'); });
    var fileInput = document.getElementById('bgmode-image-input');
    if (fileInput) fileInput.addEventListener('change', function(){
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      if (/^video\//.test(file.type) || /\.(mp4|webm|mov|m4v)$/i.test(file.name || '')){
        if (file.size > MAX_VID_BYTES){ if (window.toast) toast('حجم ویدیو باید کمتر از ۶۰ مگابایت باشد'); return; }
        idbSet('video', file).then(function(){
          if (window.appBgConfig.videoUrl){ try{ URL.revokeObjectURL(window.appBgConfig.videoUrl); }catch(e){} }
          saveImage(null);
          window.appBgConfig.imageData = null;
          window.appBgConfig.videoUrl = URL.createObjectURL(file);
          window.appBgConfig.kind = 'video';
          window.appBgConfig.mode = 'image';
          applyBg(window.appBgConfig);
          save(window.appBgConfig);
        }).catch(function(){ if (window.toast) toast('ذخیره ویدیو ممکن نشد (فضای گوشی یا حجم زیاد است)'); });
        return;
      }
      if (!/^image\/(jpeg|png|gif)$/.test(file.type)){ if (window.toast) toast('فقط عکس (jpg، png، gif) یا ویدیو (mp4، webm، mov) مجاز است'); return; }
      cropImage(file, { screen: true }).then(function(dataUrl){
        if (!dataUrl) return;
        if (dataUrl.length * 0.75 > MAX_IMG_BYTES){ if (window.toast) toast('حجم تصویر باید کمتر از ۴ مگابایت باشد'); return; }
        var ok = saveImage(dataUrl);
        if (!ok){ if (window.toast) toast('ذخیره تصویر ممکن نشد (حجم زیاد است)'); return; }
        idbDel('video');
        if (window.appBgConfig.videoUrl){ try{ URL.revokeObjectURL(window.appBgConfig.videoUrl); }catch(e){} }
        window.appBgConfig.videoUrl = null;
        window.appBgConfig.imageData = dataUrl;
        window.appBgConfig.kind = 'image';
        window.appBgConfig.mode = 'image';
        applyBg(window.appBgConfig);
        save(window.appBgConfig);
      });
    });
    var removeBtn = document.getElementById('bgimg-remove-btn');
    if (removeBtn) removeBtn.addEventListener('click', function(){
      saveImage(null);
      idbDel('video');
      if (window.appBgConfig.videoUrl){ try{ URL.revokeObjectURL(window.appBgConfig.videoUrl); }catch(e){} }
      window.appBgConfig.imageData = null;
      window.appBgConfig.videoUrl = null;
      window.appBgConfig.kind = 'image';
      applyBg(window.appBgConfig);
      save(window.appBgConfig);
    });
    var blurRange = document.getElementById('bgmode-blur');
    if (blurRange) blurRange.addEventListener('input', function(){
      window.appBgConfig.blur = parseInt(blurRange.value, 10) || 0;
      applyBg(window.appBgConfig);
      save(window.appBgConfig);
    });
    var opRange = document.getElementById('bgmode-opacity');
    if (opRange) opRange.addEventListener('input', function(){
      window.appBgConfig.opacity = parseInt(opRange.value, 10) || 50;
      applyBg(window.appBgConfig);
      save(window.appBgConfig);
    });
  }
  if (document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', wireUI); } else { wireUI(); }
})();
