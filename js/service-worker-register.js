if ('serviceWorker' in navigator) {
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(reg){
      reg.addEventListener('updatefound', function(){
        var newWorker = reg.installing;
        if(!newWorker) return;
        newWorker.addEventListener('statechange', function(){
          if(newWorker.state === 'installed' && navigator.serviceWorker.controller){ newWorker.postMessage('SKIP_WAITING'); }
        });
      });
      setInterval(function(){ reg.update(); }, 60000);
    }).catch(function(e){ console.warn('SW register failed', e); });
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function(){
      if(refreshing) return;
      refreshing = true;
      function doReload(){
        try{ if(typeof flushStateNow === 'function') flushStateNow(); }catch(e){}
        var done = function(){ window.location.reload(); };
        try{ (window.DS ? DS.flush() : Promise.resolve()).then(done, done); }catch(e){ done(); }
      }
      var ae = document.activeElement;
      if(ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName) && ae.value){
        document.addEventListener('visibilitychange', function h(){
          if(document.visibilityState === 'hidden'){ document.removeEventListener('visibilitychange', h); doReload(); }
        });
        return;
      }
      doReload();
    });
  });
}
