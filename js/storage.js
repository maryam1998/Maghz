(function(){
  var DB_NAME='maghz-durable', STORE='kv', dbp=null;
  var DS = window.DS = { ok:null };
  var timers={}, pending={}, held={};

  function open(){
    if(dbp) return dbp;
    dbp = new Promise(function(resolve){
      try{
        if(!window.indexedDB){ DS.ok=false; return resolve(null); }
        var rq = indexedDB.open(DB_NAME,1);
        rq.onupgradeneeded=function(){ try{ rq.result.createObjectStore(STORE); }catch(e){} };
        rq.onsuccess=function(){ DS.ok=true; resolve(rq.result); };
        rq.onerror=function(){ DS.ok=false; resolve(null); };
        rq.onblocked=function(){ DS.ok=false; resolve(null); };
      }catch(e){ DS.ok=false; resolve(null); }
    });
    return dbp;
  }
  DS.get = function(key){
    return open().then(function(db){
      if(!db) return null;
      return new Promise(function(resolve){
        try{
          var rq = db.transaction(STORE,'readonly').objectStore(STORE).get(key);
          rq.onsuccess=function(){ resolve(rq.result==null?null:rq.result); };
          rq.onerror=function(){ resolve(null); };
        }catch(e){ resolve(null); }
      });
    });
  };
  function write(key, rec){
    return open().then(function(db){
      if(!db) return false;
      return new Promise(function(resolve){
        try{
          var tx = db.transaction(STORE,'readwrite');
          tx.objectStore(STORE).put(rec, key);
          tx.oncomplete=function(){ resolve(true); };
          tx.onerror=tx.onabort=function(){ resolve(false); };
        }catch(e){ resolve(false); }
      });
    });
  }
  function flushKey(key){
    clearTimeout(timers[key]);
    var rec = pending[key];
    if(!rec) return Promise.resolve(false);
    delete pending[key];
    return write(key, rec);
  }
  DS.save = function(key, json, t){
    pending[key] = { t:t, json:json };
    if(held[key]) return;
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function(){ flushKey(key); }, 200);
  };
  DS.flush = function(){
    return Promise.all(Object.keys(pending).map(function(k){ return held[k] ? false : flushKey(k); }));
  };
  DS.hold = function(key){ held[key] = true; };
  DS.release = function(key, keepPending){
    delete held[key];
    if(!keepPending){ delete pending[key]; clearTimeout(timers[key]); }
    else if(pending[key]){ timers[key] = setTimeout(function(){ flushKey(key); }, 50); }
  };
  DS.lite = function(obj){
    return JSON.stringify(obj, function(k,v){
      return (typeof v==='string' && v.length>3000 && v.indexOf('data:')===0) ? '' : v;
    });
  };
  DS.persist = function(lsKey, idbKey, obj){
    obj._savedAt = Date.now();
    if(held[idbKey]){
      var resH = 'lite';
      try{ localStorage.setItem(lsKey, DS.lite(Object.assign({}, obj, { _lite:true }))); }catch(eH){ resH = 'fail'; }
      return resH;
    }
    var json = JSON.stringify(obj), res = 'full';
    try{ localStorage.setItem(lsKey, json); }
    catch(e){
      try{ localStorage.setItem(lsKey, DS.lite(Object.assign({}, obj, { _lite:true }))); res = 'lite'; }
      catch(e2){ res = 'fail'; }
    }
    DS.save(idbKey, json, obj._savedAt);
    if(res !== 'full' && !held[idbKey]) flushKey(idbKey);
    return res;
  };

  DS.hold('state:abundanceBankData');
  DS.hold('map:frequencyMapData');
  open();
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
})();
