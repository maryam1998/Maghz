(function(){
  "use strict";

  const PALETTE = ["#f4c542","#5ec8f0","#f0708a","#8f7bf0","#63d6a8","#f0a15e","#e06bd6","#7bd0f0"];
  const FREQ_BANDS = {
    delta: { label:'دلتا',  hz:'۰.۵–۴',  color:'#7c4dff', speed:7.0, desc:'بازسازی و درمان عمیق' },
    theta: { label:'تتا',   hz:'۴–۸',    color:'#9c6bff', speed:4.8, desc:'مدیتیشن و خلاقیت' },
    alpha: { label:'آلفا',  hz:'۸–۱۲',   color:'#5ec8f0', speed:3.4, desc:'آرامش هوشیار' },
    beta:  { label:'بتا',   hz:'۱۲–۳۰',  color:'#63d6a8', speed:2.2, desc:'تمرکز فعال' },
    gamma: { label:'گاما',  hz:'۳۰+',    color:'#f4c542', speed:1.5, desc:'اوج تمرکز و بینش' }
  };
  function getFreq(goal){
    const key = goal && goal.freq && FREQ_BANDS[goal.freq] ? goal.freq : 'alpha';
    return { key, ...FREQ_BANDS[key] };
  }

  function getUserFrequencyState(){
    const safeCount = (c) => {
      try { return (typeof neuralFiberCount === 'function' && c) ? neuralFiberCount(c.logs || {}) : 0; }
      catch(e){ return 0; }
    };
    const bk = {
      gratitude: safeCount(state.gratitudeNeural),
      belief:    safeCount(state.currentBelief && state.currentBelief.neural),
      dispenza:  safeCount(state.dispenzaNeural),
      tracking:  safeCount(state.currentBelief && state.currentBelief.trackingNeural),
      visual:    safeCount(state.currentBelief && state.currentBelief.visualNeural),
      shop:      safeCount(state.shopNeural)
    };
    const total = Object.values(bk).reduce((a,b)=>a+b,0);
    const cap = 500;
    const progress = Math.min(1, total / cap);

    let band = 'delta';
    if (total >= 500) band = 'gamma';
    else if (total >= 300) band = 'beta';
    else if (total >= 150) band = 'alpha';
    else if (total >= 50) band = 'theta';

    let stage = 'بیداری';
    if (total >= 500) stage = 'اوج بینش';
    else if (total >= 300) stage = 'تمرکز فعال';
    else if (total >= 150) stage = 'آرامش هوشیار';
    else if (total >= 50) stage = 'شروع تغییر';

    return { total, progress, band, stage, breakdown: bk };
  }

  const RING_COLOR = "#2dd4bf";
  const DEFAULT_TEXT_COLOR = "#eef0fa";
  const NODE_FILL = "#12142a";
  const DEFAULT_IMG_SIZE = 50;

  const AUTO_TEXT_COLOR_MARKERS = [DEFAULT_TEXT_COLOR, '#ffffff', '#fff', '#000000', '#000'];
  function autoTextColor(){
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    return theme === 'light' ? '#000000' : '#ffffff';
  }
  function effectiveTextColor(){
    const c = (state.textColor || '').toLowerCase().trim();
    if (!c || AUTO_TEXT_COLOR_MARKERS.includes(c)) return autoTextColor();
    return state.textColor;
  }

  let state = {
    me: { color:"#f4c542", note:"", x:0, y:0, radius:34, images:[] },
    goals: [],
    rings: [],
    textColor: DEFAULT_TEXT_COLOR,
    fontSize: 14,
    showDateStamps: true,
    showTimeStamps: true
  };

  function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  function findHost(id){ return state.goals.find(g=>g.id===id) || state.rings.find(r=>r.id===id) || null; }
  function isRingHost(h){ return state.rings.indexOf(h) >= 0; }
  function ringsOfGoal(g){ return state.rings.filter(r=>r.goalId === g.id); }
  function goalBranchCount(g){
    let n = countAllActions(g.actions);
    ringsOfGoal(g).forEach(r=>{ n += countAllActions(r.actions); });
    return n;
  }
  function ringIsOrphan(r){ return !state.goals.some(x=>x.id === r.goalId); }
  /* نشانه‌ی بدون هدف (قدیمی) خودکار به نزدیک‌ترین هدف روی نقشه وصل می‌شود */
  function autoLinkRings(){
    if (!state.goals.length) return;
    let ch = false;
    state.rings.forEach(r=>{
      if (!ringIsOrphan(r)) return;
      let best = null;
      state.goals.forEach(g=>{ const d = Math.hypot(g.x - r.x, g.y - r.y); if (!best || d < best.d) best = { g, d }; });
      if (best){ r.goalId = best.g.id; ch = true; }
    });
    if (ch) scheduleMapSave();
  }
  function pickGoalDialog(title, cb){
    const old = document.getElementById('pick-goal-dlg'); if (old) old.remove();
    const gs = state.goals.filter(g=>!g.reached);
    const ov = document.createElement('div');
    ov.id = 'pick-goal-dlg'; ov.className = 'dur-ov';
    ov.innerHTML = '<div class="dur-box" role="dialog"><div class="dur-t">'+esc(title)+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:8px;margin:14px 0 10px;max-height:50vh;overflow:auto;">'+
      gs.map(g=>'<button type="button" data-pg="'+g.id+'" style="border:1.5px solid '+esc(g.color||'#c9972b')+';background:transparent;color:var(--text-main);border-radius:12px;padding:11px 10px;font-family:inherit;font-size:13.5px;cursor:pointer;">'+esc(g.icon||'🎯')+' '+esc(g.name||'هدف')+'</button>').join('')+
      '</div><div class="dur-b"><button type="button" data-pg="">لغو</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', e=>{
      if (e.target === ov){ ov.remove(); return; }
      const b = e.target.closest('[data-pg]'); if (!b) return;
      ov.remove();
      if (b.dataset.pg) cb(b.dataset.pg);
    });
  }
  function createRingForGoal(g){
    const R0 = (g.radius||20) + 120;
    let best = null;
    for (let i=0;i<16;i++){
      const ang = (i/16)*Math.PI*2 + Math.random()*0.3;
      const x = g.x + Math.cos(ang)*R0, y = g.y + Math.sin(ang)*R0;
      let d = Math.hypot(state.me.x-x, state.me.y-y);
      state.goals.forEach(o=>{ if (o !== g) d = Math.min(d, Math.hypot(o.x-x, o.y-y)); });
      state.rings.forEach(o=>{ d = Math.min(d, Math.hypot(o.x-x, o.y-y)); });
      if (!best || d > best.d) best = {x, y, d};
    }
    const nr = {
      id: uid(), label:'نزدیک شدن به هدف', color: RING_COLOR,
      x: best.x, y: best.y, radius: 30, note: '', images: [], icon: '🌟',
      actions: [], collapsed:false, logs:{}, lastActivity: Date.now(), branchStyle:'organic', goalId: g.id
    };
    state.rings.push(nr);
    return nr;
  }
  const BRANCH_STYLES = { organic:'طبیعی', straight:'مستقیم', curve:'قوسی', wave:'موجی', elbow:'زاویه‌دار', step:'پله‌ای', zigzag:'زیگزاگ' };
  /* نوع خطِ مسیر اهداف (تنه‌ی هر هدف) — هم پیش‌فرض کلی و هم برای هر هدف جدا قابل تغییره */
  const TRUNK_STYLES = { solid:'خط راست', dashed:'خط‌چین', dotted:'نقطه‌چین', dashdot:'خط‌نقطه', long:'خط‌چین بلند', double:'دو خطی', glow:'درخشان', taper:'باریک‌شونده' };
  function effTrunkStyle(host){
    const s = (host && host.trunkStyle) || state.trunkStyle || 'dashed';
    return TRUNK_STYLES[s] ? s : 'dashed';
  }
  function effStyle(host, action){
    const s = (action && action.style) || (host && host.branchStyle) || 'organic';
    return BRANCH_STYLES[s] ? s : 'organic';
  }

  function normalizeImages(arr){
    if (!Array.isArray(arr)) return [];
    return arr.map(item=>{
      if (typeof item === 'string') return { src: item, size: DEFAULT_IMG_SIZE, dx: 0, dy: 0 };
      if (item && typeof item === 'object'){
        if (typeof item.src !== 'string') item.src = '';
        if (typeof item.size !== 'number' || item.size < 16) item.size = DEFAULT_IMG_SIZE;
        if (typeof item.dx !== 'number') item.dx = 0;
        if (typeof item.dy !== 'number') item.dy = 0;
        return item;
      }
      return { src:'', size: DEFAULT_IMG_SIZE, dx: 0, dy: 0 };
    });
  }

  function normalizeActions(list){
    list.forEach(a=>{
      if (!Array.isArray(a.children)) a.children = [];
      if (typeof a.color === 'undefined') a.color = null;
      if (typeof a.weight !== 'number') a.weight = 5;
      if (typeof a.text !== 'string') a.text = '';
      a.images = normalizeImages(a.images);
      if (typeof a.labelDX !== 'number') a.labelDX = 0;
      if (typeof a.labelDY !== 'number') a.labelDY = 0;
      if (typeof a.labelSize !== 'number') a.labelSize = null;
      if (!a.logs || typeof a.logs !== 'object') a.logs = {};
      if (typeof a.isRoutine !== 'boolean') a.isRoutine = false;
      if (typeof a.detached !== 'boolean') a.detached = false;
      if (typeof a.style !== 'string' || (a.style && !BRANCH_STYLES[a.style])) a.style = '';
      if (a.detached) {
        if (typeof a.originX !== 'number') a.originX = 0;
        if (typeof a.originY !== 'number') a.originY = 0;
        if (typeof a.dir !== 'number') a.dir = 0;
        if (typeof a.len !== 'number') a.len = 30;
        if (typeof a.bend1 !== 'number') a.bend1 = 0;
        if (typeof a.bend2 !== 'number') a.bend2 = 0;
      }
      normalizeActions(a.children);
    });
  }
  function normalizeState(){
    if (typeof state.me.x !== 'number') state.me.x = 0;
    if (typeof state.me.y !== 'number') state.me.y = 0;
    if (typeof state.me.name !== 'string') state.me.name = 'من';
    if (typeof state.me.radius !== 'number' || state.me.radius < 20) state.me.radius = 34;
    state.me.images = normalizeImages(state.me.images);
    if (typeof state.me.labelDX !== 'number') state.me.labelDX = 0;
    if (typeof state.me.labelDY !== 'number') state.me.labelDY = 0;
    if (typeof state.me.labelSize !== 'number') state.me.labelSize = null;
    if (typeof state.textColor !== 'string') state.textColor = DEFAULT_TEXT_COLOR;
    if (typeof state.fontSize !== 'number' || state.fontSize < 8) state.fontSize = 14;
    if (typeof state.showDateStamps !== 'boolean') state.showDateStamps = true;
    if (typeof state.showTimeStamps !== 'boolean') state.showTimeStamps = true;
    if (typeof state.showEmotionWidget !== 'boolean') state.showEmotionWidget = true;
    if (typeof state.trunkStyle !== 'string' || !TRUNK_STYLES[state.trunkStyle]) state.trunkStyle = 'dashed';
    state.goals.forEach(g=>{
      if (typeof g.trunkStyle !== 'string' || (g.trunkStyle && !TRUNK_STYLES[g.trunkStyle])) g.trunkStyle = '';
      if (!Array.isArray(g.actions)) g.actions = [];
      if (typeof g.reached !== 'boolean') g.reached = false;
      if (typeof g.collapsed !== 'boolean') g.collapsed = false;
      if (typeof g.feeling !== 'string') g.feeling = '';
      if (typeof g.radius !== 'number' || g.radius < 12) g.radius = 20;
      if (typeof g.feelingOffsetX !== 'number') g.feelingOffsetX = 0;
      if (typeof g.feelingOffsetY !== 'number') g.feelingOffsetY = 0;
      if (typeof g.feelingScale !== 'number' || g.feelingScale < 0.5) g.feelingScale = 1;
      g.images = normalizeImages(g.images);
      if (typeof g.labelDX !== 'number') g.labelDX = 0;
      if (typeof g.labelDY !== 'number') g.labelDY = 0;
      if (typeof g.labelSize !== 'number') g.labelSize = null;
      if (!g.logs || typeof g.logs !== 'object') g.logs = {};
      if (typeof g.freq !== 'string' || !FREQ_BANDS[g.freq]) g.freq = 'alpha';
      if (typeof g.lastActivity !== 'number') g.lastActivity = g.createdAt || Date.now();
      if (typeof g.branchStyle !== 'string' || !BRANCH_STYLES[g.branchStyle]) g.branchStyle = 'organic';
      if (typeof g.icon !== 'string' || !g.icon) g.icon = '🎯';
      normalizeActions(g.actions);
    });
    if (!Array.isArray(state.rings)) state.rings = [];
    state.ringsCollapsed = false; /* نشانه‌ها همیشه روی مسیر هدف خودشان می‌مانند؛ فقط شاخه‌هایشان جمع می‌شود */
    state.rings.forEach(r=>{
      if (typeof r.x !== 'number') r.x = 0;
      if (typeof r.y !== 'number') r.y = 0;
      if (typeof r.label !== 'string') r.label = 'نزدیک شدن به هدف';
      if (typeof r.color !== 'string') r.color = RING_COLOR;
      if (typeof r.radius !== 'number' || r.radius < 15) r.radius = 30;
      if (typeof r.note !== 'string') r.note = '';
      r.images = normalizeImages(r.images);
      if (typeof r.labelDX !== 'number') r.labelDX = 0;
      if (typeof r.labelDY !== 'number') r.labelDY = 0;
      if (typeof r.labelSize !== 'number') r.labelSize = null;
      if (!Array.isArray(r.actions)) r.actions = [];
      if (typeof r.collapsed !== 'boolean') r.collapsed = false;
      if (!r.logs || typeof r.logs !== 'object') r.logs = {};
      if (typeof r.lastActivity !== 'number') r.lastActivity = Date.now();
      if (typeof r.branchStyle !== 'string' || !BRANCH_STYLES[r.branchStyle]) r.branchStyle = 'organic';
      if (typeof r.icon !== 'string' || !r.icon) r.icon = '🌟';
      if (typeof r.goalId !== 'string') r.goalId = '';
      normalizeActions(r.actions);
    });
  }

  function loadDefault(){
    state = {
      me:{ color:"#f4c542", note:"", x:0, y:0, radius:34, images:[] },
      goals:[],
      rings:[],
      textColor: DEFAULT_TEXT_COLOR,
      fontSize: 14,
      showDateStamps: true,
      showTimeStamps: true,
      showEmotionWidget: true
    };
  }

  const MAP_STORAGE_KEY = 'frequencyMapData';
  let mapBoot = { t:0, lite:false };
  function loadMapState(){
    try{
      const raw = localStorage.getItem(MAP_STORAGE_KEY);
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object'){
          mapBoot = { t: parsed._savedAt || 0, lite: !!parsed._lite };
          delete parsed._lite;
          state = parsed;
          return;
        }
      }
    }catch(e){}
    loadDefault();
  }
  function saveMapState(){
    try{ DS.persist(MAP_STORAGE_KEY, 'map:' + MAP_STORAGE_KEY, state); }catch(e){}
  }
  let mapSaveTimer = null;
  function scheduleMapSave(){
    clearTimeout(mapSaveTimer);
    mapSaveTimer = setTimeout(saveMapState, 400);
  }
  function flushMapNow(){
    clearTimeout(mapSaveTimer);
    saveMapState();
    try{ DS.flush(); }catch(e){}
  }
  window.addEventListener('beforeunload', flushMapNow);
  window.addEventListener('pagehide', flushMapNow);
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') flushMapNow(); });

  function applyEmotionWidgetVisibility(){
    document.body.classList.toggle('echw-hidden-by-setting', state.showEmotionWidget === false);
  }

  loadMapState();
  normalizeState();
  applyEmotionWidgetVisibility();

  (function hydrateMapState(){
    const KEY = 'map:' + MAP_STORAGE_KEY;
    function go(){
      DS.get(KEY).then(function(rec){
        const adopt = !!(rec && rec.json && (mapBoot.lite || rec.t > mapBoot.t));
        if(adopt){
          try{
            const parsed = JSON.parse(rec.json);
            if(parsed && typeof parsed === 'object'){
              delete parsed._lite;
              state = parsed;
              normalizeState();
              applyEmotionWidgetVisibility();
              DS.release(KEY, false);
              saveMapState();
              render();
              return;
            }
          }catch(e){ console.warn('map hydrate failed', e); }
        }
        const inSync = rec && rec.json && rec.t === mapBoot.t && !mapBoot.lite;
        DS.release(KEY, true);
        if(!inSync) saveMapState();
      });
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  })();

  const svg = document.getElementById('stage');
  const viewport = document.getElementById('viewport');
  let cam = { x: window.innerWidth/2, y: window.innerHeight/2, scale: 1 };

  function applyCam(){
    viewport.setAttribute('transform', `translate(${cam.x},${cam.y}) scale(${cam.scale})`);
    document.getElementById('zoom-readout').textContent = Math.round(cam.scale*100)+'٪';
    svg.classList.toggle('lod-far', cam.scale < 0.55);
    svg.classList.toggle('lod-xfar', cam.scale < 0.3);
  }

  function resizeSvg(){
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
  }
  resizeSvg();
  applyCam();
  window.addEventListener('resize', resizeSvg);

  function screenToWorld(sx, sy){
    return { x:(sx - cam.x)/cam.scale, y:(sy - cam.y)/cam.scale };
  }

  const pointers = new Map();
  let mode = null;
  let dragTarget = null;
  let dragStart = null;
  let panStart = null;
  let pinchStart = null;
  let resizeTarget = null;
  let rotateTarget = null;
  let elementDragTarget = null;
  let elementDragStart = null;
  let fontSizeAtPinchStart = 14;

  let longPressTimer = null;
  let longPressTriggered = false;
  let pendingActionClick = null;
  let detachInProgress = false;
  let holdArmed = false;

  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  function mid(a,b){ return {x:(a.x+b.x)/2, y:(a.y+b.y)/2}; }
  function angle(a,b){ return Math.atan2(b.y-a.y, b.x-a.x); }

  function getNodeRef(type, id, goalId){
    if (type === 'me') return state.me;
    if (type === 'goal') return findHost(id) || null;
    if (type === 'ring') return state.rings.find(r=>r.id===id) || null;
    if (type === 'action') {
      const g = findHost(goalId);
      if (!g) return null;
      const found = findActionNode(g.actions, id);
      return found ? found.node : null;
    }
    return null;
  }

  function getImagesArray(type, id, goalId){
    const node = getNodeRef(type, id, goalId);
    return node ? node.images : null;
  }

  function currentLabelSize(type, id){
    if (type === 'me') return Math.max(14, state.fontSize || 14) + 3;
    if (type === 'goal') return Math.max(14, state.fontSize || 14);
    if (type === 'ring') return Math.max(14, state.fontSize || 14) - 2;
    if (type === 'action') {
      const entry = actionGeomMap.get(id);
      const scale = entry ? entry.scale : 1;
      return Math.max(12, (state.fontSize || 14) * Math.min(1, scale + 0.3));
    }
    return state.fontSize || 14;
  }

  function getHitAtPoint(px, py) {
    const els = document.elementsFromPoint(px, py);
    for (let el of els) {
      const hit = el.closest && el.closest('[data-hit]');
      if (hit) return hit;
    }
    return null;
  }

  svg.addEventListener('pointerdown', (e)=>{
    if (e.target.closest('.feeling-textarea')) return;
    const routineToggle = e.target.closest('[data-routine-toggle]');
    if (routineToggle){
      e.preventDefault();
      toggleRoutineLog(routineToggle.dataset.routineToggle, todayCalKey());
      return;
    }
    const routineCell = e.target.closest('[data-routine-cell]');
    if (routineCell){
      e.preventDefault();
      toggleRoutineLog(routineCell.dataset.routineCell, routineCell.dataset.key);
      return;
    }
    const rShutter = e.target.closest('[data-rings-toggle]');
    if (rShutter){ e.preventDefault(); e.stopPropagation(); toggleRingsCollapse(); return; }
    const shutter = e.target.closest('[data-goal-toggle]');
    if (shutter){
      e.preventDefault();
      e.stopPropagation();
      toggleGoalCollapse(shutter.dataset.goalToggle);
      return;
    }
    svg.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});

    if (pointers.size === 2) {
      const pts = [...pointers.values()];
      const hit1 = getHitAtPoint(pts[0].x, pts[0].y);
      const hit2 = getHitAtPoint(pts[1].x, pts[1].y);

      if (hit1 && hit2 && hit1.dataset.img === '1' && hit2.dataset.img === '1' &&
          hit1.dataset.hit === hit2.dataset.hit && hit1.dataset.id === hit2.dataset.id &&
          (hit1.dataset.goalid||'') === (hit2.dataset.goalid||'') &&
          hit1.dataset.imgidx === hit2.dataset.imgidx) {
        const imgType = hit1.dataset.hit;
        const imgId = hit1.dataset.id;
        const imgGoalId = hit1.dataset.goalid || null;
        const idx = +hit1.dataset.imgidx;
        const arr = getImagesArray(imgType, imgId, imgGoalId);
        if (arr && arr[idx]) {
          mode = 'resize-image';
          resizeTarget = { imgType, imgId, imgGoalId, idx, startDist: dist(pts[0], pts[1]), startSize: arr[idx].size || DEFAULT_IMG_SIZE };
          svg.classList.add('resizing');
          return;
        }
      }

      if (hit1 && hit2 && hit1.dataset.label === '1' && hit2.dataset.label === '1' &&
          hit1.dataset.hit === hit2.dataset.hit && hit1.dataset.id === hit2.dataset.id &&
          (hit1.dataset.goalid||'') === (hit2.dataset.goalid||'')) {
        const type = hit1.dataset.hit;
        const id = hit1.dataset.id;
        const goalId = hit1.dataset.goalid || null;
        const node = getNodeRef(type, id, goalId);
        if (node) {
          mode = 'resize-label';
          resizeTarget = { type, id, goalId, startDist: dist(pts[0], pts[1]), startSize: node.labelSize || currentLabelSize(type, id) };
          svg.classList.add('resizing');
          return;
        }
      }

      if (hit1 && hit2 && hit1.dataset.hit === 'feeling' && hit2.dataset.hit === 'feeling' &&
          hit1.dataset.id === hit2.dataset.id) {
        const g = findHost(hit1.dataset.id);
        if (g) {
          mode = 'resize-feeling';
          resizeTarget = { id: g.id, startDist: dist(pts[0], pts[1]), startScale: g.feelingScale || 1 };
          svg.classList.add('resizing');
          return;
        }
      }

      if (hit1 && hit2 && hit1.dataset.hit === hit2.dataset.hit && hit1.dataset.id === hit2.dataset.id) {
        const type = hit1.dataset.hit;
        const id = hit1.dataset.id || null;
        if (type === 'me' || type === 'goal' || type === 'ring' || type === 'action') {
          let node = null;
          if (type === 'me') node = state.me;
          else if (type === 'goal') node = findHost(id);
          else if (type === 'ring') node = state.rings.find(r => r.id === id);
          else if (type === 'action') {
            const g = findHost(hit1.dataset.goalid);
            if (g) {
              const found = findActionNode(g.actions, id);
              if (found) node = found.node;
            }
          }
          if (node && typeof node.radius !== 'undefined') {
            mode = 'resize-node';
            resizeTarget = { type, id, goalId: hit1.dataset.goalid || null, startDist: dist(pts[0], pts[1]), startRadius: node.radius };
            svg.classList.add('resizing');
            return;
          }
        }
      }
    }

    const hit = getHitAtPoint(e.clientX, e.clientY);
    if (pointers.size === 1 && hit) {
      const type = hit.dataset.hit;
      const id = hit.dataset.id || null;
      const goalId = hit.dataset.goalid || null;

      if (type === 'feeling') {
        const g = findHost(id);
        if (g) {
          mode = 'drag-feeling';
          dragTarget = { type:'feeling', id };
          const w = screenToWorld(e.clientX, e.clientY);
          dragStart = { offX: w.x - g.x, offY: w.y - g.y, baseOffX: g.feelingOffsetX || 0, baseOffY: g.feelingOffsetY || 0 };
          svg.classList.add('node-drag');
        }
        return;
      }

      if (type === 'action') {
        const w = screenToWorld(e.clientX, e.clientY);
        const entry = actionGeomMap.get(id);
        if (!entry) {
          mode = 'pan';
          panStart = { camX:cam.x, camY:cam.y, px:e.clientX, py:e.clientY };
          svg.classList.add('grabbing');
          return;
        }

        const g = findHost(goalId);
        let isDetached = false;
        let foundNode = null;
        if (g) {
          const found = findActionNode(g.actions, id);
          if (found) {
            foundNode = found.node;
            isDetached = found.node.detached;
          }
        }

        const tapImgIdx = hit.dataset.img === '1' ? +hit.dataset.imgidx : null;
        const tapIsLabel = hit.dataset.label === '1';
        pendingActionClick = { goalId, actionId: id, dragImgIdx: tapImgIdx, dragLabel: tapIsLabel, sx: e.clientX, sy: e.clientY };
        longPressTriggered = false;
        detachInProgress = false;
        holdArmed = false;
        if (longPressTimer) clearTimeout(longPressTimer);
        /* نگه‌داشتن انگشت فقط شاخه را «آماده‌ی جدا شدن» می‌کند (با یک لرزش کوتاه).
           جدا شدن/وصل شدن واقعی فقط وقتی انجام می‌شود که بعد از نگه‌داشتن، انگشت را بکشی.
           اگر فقط نگه داشتی و رها کردی (یا آرام لمس کردی) هیچ چیز جدا نمی‌شود و پنل باز می‌شود. */
        longPressTimer = setTimeout(() => {
          holdArmed = true;
          try{ if (navigator.vibrate) navigator.vibrate(15); }catch(_){}
        }, 600);
        return;
      }

      if (hit.dataset.img === '1') {
        const idx = +hit.dataset.imgidx;
        const arr = getImagesArray(type, id, goalId);
        if (arr && arr[idx]) {
          const w = screenToWorld(e.clientX, e.clientY);
          mode = 'drag-image';
          elementDragTarget = { imgType: type, imgId: id, imgGoalId: goalId, idx };
          elementDragStart = { startDX: arr[idx].dx || 0, startDY: arr[idx].dy || 0, wx: w.x, wy: w.y };
          svg.classList.add('node-drag');
        }
        return;
      }

      if (hit.dataset.label === '1') {
        const node = getNodeRef(type, id, goalId);
        if (node) {
          const w = screenToWorld(e.clientX, e.clientY);
          mode = 'drag-label';
          elementDragTarget = { type, id, goalId };
          elementDragStart = { startDX: node.labelDX || 0, startDY: node.labelDY || 0, wx: w.x, wy: w.y };
          svg.classList.add('node-drag');
        }
        return;
      }

      mode = 'drag-node';
      dragTarget = { type, id };
      const w = screenToWorld(e.clientX, e.clientY);
      const node = type === 'me' ? state.me
        : type === 'ring' ? state.rings.find(r=>r.id===id)
        : findHost(id);
      if (node) {
        dragStart = { offX: w.x - node.x, offY: w.y - node.y };
        svg.classList.add('node-drag');
      } else {
        mode = 'pan';
        panStart = { camX:cam.x, camY:cam.y, px:e.clientX, py:e.clientY };
        svg.classList.add('grabbing');
      }
    } else if (pointers.size === 1) {
      mode = 'pan';
      panStart = { camX:cam.x, camY:cam.y, px:e.clientX, py:e.clientY };
      svg.classList.add('grabbing');
    } else if (pointers.size === 2) {
      mode = 'pinch';
      const pts = [...pointers.values()];
      pinchStart = {
        dist: dist(pts[0],pts[1]),
        scale: cam.scale,
        midScreen: mid(pts[0],pts[1]),
        camX: cam.x, camY: cam.y,
        fontSize: state.fontSize
      };
      fontSizeAtPinchStart = state.fontSize;
    }
  });

  svg.addEventListener('pointerup', (e)=>{
    holdArmed = false;
    if (longPressTimer && pendingActionClick) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      if (!longPressTriggered) {
        const { goalId, actionId } = pendingActionClick;
        openPanelForAction(goalId, actionId);
      }
      pendingActionClick = null;
    }
    if (detachInProgress) {
      detachInProgress = false;
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        mode = null; dragTarget = null; panStart = null; pinchStart = null; resizeTarget = null; rotateTarget = null;
        elementDragTarget = null; elementDragStart = null;
        svg.classList.remove('grabbing','node-drag','resizing','rotating');
      }
      return;
    }
    endPointer(e);
  });

  let rafQueued = false;
  let lastMoveEvent = null;

  svg.addEventListener('pointermove',(e)=>{
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    lastMoveEvent = e;
    if (!rafQueued){
      rafQueued = true;
      requestAnimationFrame(processMove);
    }
  });

  /* بعد از نگه‌داشتن + کشیدن: شاخه‌ی وصل را جدا می‌کند یا شاخه‌ی جداشده را به مسیر برمی‌گرداند */
  function holdToggleBranch(g, node, goalId, e, sx, sy){
    const id = node.id;
    if (node.detached){
      node.detached = false;
      delete node.dir; delete node.len; delete node.bend1; delete node.bend2;
      delete node.originX; delete node.originY;
      render();
    } else {
      const ent0 = actionGeomMap.get(id);
      if (!ent0) return;
      node.detached = true;
      node.originX = ent0.originPt.x;
      node.originY = ent0.originPt.y;
      if (typeof node.dir !== 'number') node.dir = 0;
      if (typeof node.len !== 'number') node.len = 30;
      if (typeof node.bend1 !== 'number') node.bend1 = 0;
      if (typeof node.bend2 !== 'number') node.bend2 = 0;
      render();
    }
    longPressTriggered = true;
    detachInProgress = true;
    const cur = screenToWorld(typeof sx === 'number' ? sx : e.clientX, typeof sy === 'number' ? sy : e.clientY);
    mode = 'drag-node';
    dragTarget = { type:'action', goalId, id, detached: !!node.detached };
    if (node.detached){
      dragStart = { offX: cur.x - node.originX, offY: cur.y - node.originY };
    } else {
      const ent = actionGeomMap.get(id);
      dragStart = ent ? { offX: cur.x - ent.end.x, offY: cur.y - ent.end.y } : { offX:0, offY:0 };
    }
    svg.classList.add('node-drag');
  }

  function processMove(){
    rafQueued = false;
    const e = lastMoveEvent;
    if (!e) return;

    if (mode === 'rotate-node' && rotateTarget && pointers.size === 2) {
      const pts = [...pointers.values()];
      const currentAngle = angle(pts[0], pts[1]);
      const delta = currentAngle - rotateTarget.startAngle;
      const g = findHost(rotateTarget.goalId);
      if (g) {
        const found = findActionNode(g.actions, rotateTarget.id);
        if (found && found.node.detached) {
          found.node.dir = rotateTarget.startDir + delta;
          render();
        }
      }
      return;
    }

    if (mode === 'pinch' && pointers.size === 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const m = mid(pts[0], pts[1]);
      let newScale = pinchStart.scale * (d/pinchStart.dist);
      newScale = Math.max(0.05, Math.min(4, newScale));
      const worldAtStart = { x:(pinchStart.midScreen.x-pinchStart.camX)/pinchStart.scale,
                              y:(pinchStart.midScreen.y-pinchStart.camY)/pinchStart.scale };
      cam.scale = newScale;
      cam.x = m.x - worldAtStart.x*newScale;
      cam.y = m.y - worldAtStart.y*newScale;

      const fontSizeFactor = newScale / pinchStart.scale;
      let newFontSize = Math.round(fontSizeAtPinchStart * fontSizeFactor);
      newFontSize = Math.max(8, Math.min(28, newFontSize));
      state.fontSize = newFontSize;

      applyCam();
      render();
      return;
    }

    if (longPressTimer && pendingActionClick) {
      /* لرزش ناخواسته‌ی انگشت (چند پیکسل) حرکت حساب نمی‌شود */
      const movedPx = Math.hypot(e.clientX - pendingActionClick.sx, e.clientY - pendingActionClick.sy);
      if (movedPx < (holdArmed ? 10 : 6)) return;
      clearTimeout(longPressTimer);
      longPressTimer = null;
      const { goalId, actionId, dragImgIdx, dragLabel, sx, sy } = pendingActionClick;
      const g = findHost(goalId);
      if (g) {
        const found = findActionNode(g.actions, actionId);
        if (found && holdArmed) {
          holdArmed = false;
          holdToggleBranch(g, found.node, goalId, e, sx, sy);
        } else if (found && found.node.detached) {
          /* شاخه‌ی جداشده: با کشیدن مستقیم جابه‌جا می‌شود */
          const ws = screenToWorld(sx, sy);
          mode = 'drag-node';
          dragTarget = { type:'action', goalId, id: actionId, detached: true };
          dragStart = { offX: ws.x - found.node.originX, offY: ws.y - found.node.originY };
          svg.classList.add('node-drag');
        } else if (found) {
          const w = screenToWorld(e.clientX, e.clientY);
          if (dragImgIdx !== null && dragImgIdx !== undefined && found.node.images && found.node.images[dragImgIdx]) {
            mode = 'drag-image';
            elementDragTarget = { imgType:'action', imgId: actionId, imgGoalId: goalId, idx: dragImgIdx };
            const img = found.node.images[dragImgIdx];
            elementDragStart = { startDX: img.dx || 0, startDY: img.dy || 0, wx: w.x, wy: w.y };
            svg.classList.add('node-drag');
          } else if (dragLabel) {
            mode = 'drag-label';
            elementDragTarget = { type:'action', id: actionId, goalId };
            elementDragStart = { startDX: found.node.labelDX || 0, startDY: found.node.labelDY || 0, wx: w.x, wy: w.y };
            svg.classList.add('node-drag');
          } else {
            /* کشیدن نوک شاخه‌ی وصل‌شده: جهت و طول از «مبدأ واقعی شاخه» (تنه یا شاخه‌ی مادر) حساب می‌شود */
            const ent = actionGeomMap.get(actionId);
            if (ent) {
              const ws = screenToWorld(sx, sy);
              mode = 'drag-node';
              dragTarget = { type:'action', goalId, id: actionId, detached: false };
              dragStart = { offX: ws.x - ent.end.x, offY: ws.y - ent.end.y };
              svg.classList.add('node-drag');
            }
          }
        }
      }
      pendingActionClick = null;
    }

    if (mode === 'resize-image' && resizeTarget && pointers.size === 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const ratio = d / resizeTarget.startDist;
      let newSize = resizeTarget.startSize * ratio;
      newSize = Math.max(16, Math.min(260, newSize));
      const arr = getImagesArray(resizeTarget.imgType, resizeTarget.imgId, resizeTarget.imgGoalId);
      if (arr && arr[resizeTarget.idx]) {
        arr[resizeTarget.idx].size = newSize;
        render();
      }
      return;
    }

    if (mode === 'resize-label' && resizeTarget && pointers.size === 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const ratio = d / resizeTarget.startDist;
      let newSize = resizeTarget.startSize * ratio;
      newSize = Math.max(8, Math.min(60, newSize));
      const node = getNodeRef(resizeTarget.type, resizeTarget.id, resizeTarget.goalId);
      if (node) {
        node.labelSize = newSize;
        render();
      }
      return;
    }

    if (mode === 'resize-feeling' && resizeTarget && pointers.size === 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const ratio = d / resizeTarget.startDist;
      let newScale = resizeTarget.startScale * ratio;
      newScale = Math.max(0.5, Math.min(3, newScale));
      const g = findHost(resizeTarget.id);
      if (g) {
        g.feelingScale = newScale;
        render();
      }
      return;
    }

    if (mode === 'resize-node' && resizeTarget && pointers.size === 2) {
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const ratio = d / resizeTarget.startDist;
      let newRadius = resizeTarget.startRadius * ratio;
      if (resizeTarget.type === 'me') newRadius = Math.max(20, Math.min(70, newRadius));
      else if (resizeTarget.type === 'goal') newRadius = Math.max(12, Math.min(90, newRadius));
      else if (resizeTarget.type === 'ring') newRadius = Math.max(15, Math.min(90, newRadius));
      else if (resizeTarget.type === 'action') newRadius = Math.max(8, Math.min(40, newRadius));

      let node = null;
      if (resizeTarget.type === 'me') node = state.me;
      else if (resizeTarget.type === 'goal') node = findHost(resizeTarget.id);
      else if (resizeTarget.type === 'ring') node = state.rings.find(r => r.id === resizeTarget.id);
      else if (resizeTarget.type === 'action') {
        const g = findHost(resizeTarget.goalId);
        if (g) {
          const found = findActionNode(g.actions, resizeTarget.id);
          if (found) node = found.node;
        }
      }
      if (node) {
        node.radius = newRadius;
        render();
      }
      return;
    }

    if (mode === 'drag-image' && elementDragTarget) {
      const w = screenToWorld(e.clientX, e.clientY);
      const arr = getImagesArray(elementDragTarget.imgType, elementDragTarget.imgId, elementDragTarget.imgGoalId);
      if (arr && arr[elementDragTarget.idx]) {
        arr[elementDragTarget.idx].dx = elementDragStart.startDX + (w.x - elementDragStart.wx);
        arr[elementDragTarget.idx].dy = elementDragStart.startDY + (w.y - elementDragStart.wy);
        render();
      }
      return;
    }

    if (mode === 'drag-label' && elementDragTarget) {
      const w = screenToWorld(e.clientX, e.clientY);
      const node = getNodeRef(elementDragTarget.type, elementDragTarget.id, elementDragTarget.goalId);
      if (node) {
        node.labelDX = elementDragStart.startDX + (w.x - elementDragStart.wx);
        node.labelDY = elementDragStart.startDY + (w.y - elementDragStart.wy);
        render();
      }
      return;
    }

    if (mode === 'drag-feeling' && dragTarget) {
      const w = screenToWorld(e.clientX, e.clientY);
      const g = findHost(dragTarget.id);
      if (g) {
        g.feelingOffsetX = w.x - g.x - dragStart.offX + dragStart.baseOffX;
        g.feelingOffsetY = w.y - g.y - dragStart.offY + dragStart.baseOffY;
        render();
      }
      return;
    }

    if (mode==='drag-node' && dragTarget){
      const w = screenToWorld(e.clientX, e.clientY);

      if (dragTarget.type==='goal'){
        const g = findHost(dragTarget.id);
        if (g){ g.x = w.x - dragStart.offX; g.y = w.y - dragStart.offY; render(); }
      } else if (dragTarget.type==='me'){
        state.me.x = w.x - dragStart.offX; state.me.y = w.y - dragStart.offY; render();
      } else if (dragTarget.type==='ring'){
        const r = state.rings.find(r=>r.id===dragTarget.id);
        if (r){
          let best = null;
          state.goals.forEach(g=>{
            const cp = trunkControlPoints(g);
            const res = nearestOnBezier(cp, {x: w.x - dragStart.offX, y: w.y - dragStart.offY});
            if (!best || res.dist < best.dist) best = res;
          });
          const snapThreshold = 18 / cam.scale;
          if (best && best.dist < snapThreshold){
            r.x = best.pt.x; r.y = best.pt.y;
          } else {
            r.x = w.x - dragStart.offX; r.y = w.y - dragStart.offY;
          }
          render();
        }
      } else if (dragTarget.type==='action'){
        const g = findHost(dragTarget.goalId);
        if (!g) return;
        const found = findActionNode(g.actions, dragTarget.id);
        if (!found) return;
        const node = found.node;

        if (node.detached) {
          node.originX = w.x - dragStart.offX;
          node.originY = w.y - dragStart.offY;
          render();
        } else {
          const ent = actionGeomMap.get(node.id);
          if (!ent) return;
          const dx = (w.x - dragStart.offX) - ent.originPt.x;
          const dy = (w.y - dragStart.offY) - ent.originPt.y;
          node.dir = Math.atan2(dy, dx);
          node.len = Math.max(8, Math.hypot(dx, dy));
          render();
        }
      }
    } else if (mode==='pan' && pointers.size===1){
      const dx = e.clientX - panStart.px;
      const dy = e.clientY - panStart.py;
      cam.x = panStart.camX + dx;
      cam.y = panStart.camY + dy;
      applyCam();
    }
  }

  function endPointer(e){
    holdArmed = false;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    pointers.delete(e.pointerId);
    if (pointers.size===0){
      mode=null; dragTarget=null; panStart=null; pinchStart=null; resizeTarget=null; rotateTarget=null;
      elementDragTarget=null; elementDragStart=null;
      svg.classList.remove('grabbing','node-drag','resizing','rotating');
      pendingActionClick = null;
    } else if (pointers.size===1){
      const [id,p] = [...pointers.entries()][0];
      mode='pan';
      panStart = { camX:cam.x, camY:cam.y, px:p.x, py:p.y };
    }
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('pointerleave', (e)=>{ if(e.buttons===0) endPointer(e); });

  svg.addEventListener('wheel', (e)=>{
    const hit = getHitAtPoint(e.clientX, e.clientY);

    if (hit && hit.dataset.img === '1') {
      e.preventDefault();
      const imgType = hit.dataset.hit;
      const imgId = hit.dataset.id;
      const imgGoalId = hit.dataset.goalid || null;
      const idx = +hit.dataset.imgidx;
      const arr = getImagesArray(imgType, imgId, imgGoalId);
      if (arr && arr[idx]) {
        const factor = Math.exp(-e.deltaY*0.0018);
        let newSize = (arr[idx].size || DEFAULT_IMG_SIZE) * factor;
        newSize = Math.max(16, Math.min(260, newSize));
        arr[idx].size = newSize;
        render();
      }
      return;
    }

    if (hit && hit.dataset.label === '1') {
      e.preventDefault();
      const type = hit.dataset.hit;
      const id = hit.dataset.id;
      const goalId = hit.dataset.goalid || null;
      const node = getNodeRef(type, id, goalId);
      if (node) {
        const factor = Math.exp(-e.deltaY*0.0018);
        let newSize = (node.labelSize || currentLabelSize(type, id)) * factor;
        newSize = Math.max(8, Math.min(60, newSize));
        node.labelSize = newSize;
        render();
      }
      return;
    }

    if (hit && hit.dataset.hit === 'feeling') {
      e.preventDefault();
      const g = findHost(hit.dataset.id);
      if (g) {
        const factor = Math.exp(-e.deltaY*0.0018);
        let newScale = (g.feelingScale || 1) * factor;
        newScale = Math.max(0.5, Math.min(3, newScale));
        g.feelingScale = newScale;
        render();
      }
      return;
    }

    e.preventDefault();
    const factor = Math.exp(-e.deltaY*0.0015);
    let newScale = Math.max(0.05, Math.min(4, cam.scale*factor));
    const w = screenToWorld(e.clientX, e.clientY);
    cam.scale = newScale;
    cam.x = e.clientX - w.x*newScale;
    cam.y = e.clientY - w.y*newScale;
    applyCam();
  }, {passive:false});

  svg.addEventListener('click', (e)=>{
    const hit = e.target.closest('[data-hit]');
    if (!hit) return;
    if (hit.dataset.hit === 'action') return;
    if (hit.dataset.hit === 'feeling') {
      const ta = hit.querySelector('.feeling-textarea');
      if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; }
      return;
    }
    if (hit.dataset.hit==='me') openPanelForMe();
    else if (hit.dataset.hit==='goal') openPanelForGoal(hit.dataset.id);
    else if (hit.dataset.hit==='ring') openPanelForRing(hit.dataset.id);
  });

  (function(){
    const moreBtn = document.getElementById('more-btn');
    const moreMenu = document.getElementById('more-menu');
    moreBtn.addEventListener('click', ()=> moreMenu.classList.toggle('open'));
    moreMenu.addEventListener('click', ()=> moreMenu.classList.remove('open'));
    document.addEventListener('pointerdown', (e)=>{
      if (!moreMenu.classList.contains('open')) return;
      if (moreMenu.contains(e.target) || moreBtn.contains(e.target)) return;
      moreMenu.classList.remove('open');
    });
  })();

  svg.addEventListener('pointerdown', ()=> cancelAnimationFrame(camAnimId));
  svg.addEventListener('wheel', ()=> cancelAnimationFrame(camAnimId), {passive:true});

  document.getElementById('fp-exit').addEventListener('click', exitFocus);
  document.getElementById('panel-focus-btn').addEventListener('click', ()=>{
    const id = currentPanelGoalId;
    panel.classList.remove('open');
    if (id) focusGoal(id);
  });

  /* ---- فهرست اهداف (بدون نشانه‌های نزدیکی) ---- */
  (function(){
    const ov = document.getElementById('goals-sheet-overlay');
    const listEl = document.getElementById('gs-list');
    const searchEl = document.getElementById('gs-search');
    const countEl = document.getElementById('gs-count');
    let sortKey = 'recent';
    let tabKey = 'active';
    const OPEN = new Set();
    let addingFor = null;
    let orderCache = null;
    const ICO_CHEV_DOWN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    const ICO_CHEV_UP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>';
    const ICO_EDIT = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>';
    const ICO_TROPHY = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8.5 20h7M10 17h4"/></svg>';
    const ICO_CHECK = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/></svg>';
    const ICO_MAP = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>';
    const norm = (t)=> String(t||'').toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک');
    function findInActions(list, q){
      for (const a of (list||[])){
        if (norm(a.text).includes(q)) return a.text;
        const r = findInActions(a.children, q);
        if (r) return r;
      }
      return null;
    }
    function ago(ts){
      if (!ts) return '';
      const d = Math.floor((Date.now() - ts) / 86400000);
      if (d <= 0) return 'امروز';
      if (d === 1) return 'دیروز';
      return toFa(d) + ' روز پیش';
    }

    function periodInfo(g){
      const gp = ensureGoalPeriod(g);
      const start = pcParseKey(gp.startDate);
      const today = new Date(); today.setHours(0,0,0,0);
      const total = gp.days;
      const passed = Math.floor((today - start)/86400000) + 1;
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate()+total);
      return { gp, start, today, total, dayNum: Math.max(1, Math.min(total, passed)),
               finished: today >= end, todayJK: pcJKey(today), todayGK: pcLocalKey(today) };
    }
    function askDays(question, def){
      const input = window.prompt(question, String(def));
      if (input === null) return 0;
      const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
      const norm2 = String(input).replace(/[۰-۹٠-٩]/g, c=>{ const i = fa.indexOf(c); return i > -1 ? i : ar.indexOf(c); });
      const n = parseInt(norm2, 10);
      if (!n || n < 1 || n > PC_MAX_DAYS){ if (typeof toast === 'function') toast('یه عدد بین ۱ تا ' + toFa(PC_MAX_DAYS) + ' وارد کن'); return 0; }
      return n;
    }
    function allNodes(g){ return pcCollect(g.actions, []); }
    function goalTodayCount(g, jk){ return allNodes(g).filter(n=> n.logs && n.logs[jk]).length; }

    function cellsHTML(node, color, pi){
      let h = '', done = 0;
      for (let d=0; d<pi.total; d++){
        const date = new Date(pi.start.getFullYear(), pi.start.getMonth(), pi.start.getDate()+d);
        const jk = pcJKey(date);
        const j = toJalaali(date.getFullYear(), date.getMonth()+1, date.getDate());
        const has = !!(node.logs && node.logs[jk]);
        if (has) done++;
        const future = date > pi.today;
        const isToday = pcLocalKey(date) === pi.todayGK;
        h += '<button type="button" class="gs-day'+(has?' done':'')+((DAYSEL[node.id]||pi.todayJK)===jk?' sel':'')+(isToday?' today':'')+(future?' future':'')+'" data-jk="'+jk+'"'+(future?' disabled':'')+
             (has ? ' style="background:'+esc(color)+';border-color:'+esc(color)+';"' : '')+'>'+(has ? '✓' : toFa(j.jd))+'</button>';
      }
      return { h, done };
    }
    function addRowHTML(forId, label){
      return '<div class="gs-addrow"><input class="gs-addin" data-for="'+forId+'" placeholder="'+label+'..." autocomplete="off">'+
             '<button type="button" class="gs-mini gold" data-gact="addok" data-for="'+forId+'">افزودن</button>'+
             '<button type="button" class="gs-mini" data-gact="addcancel">لغو</button></div>';
    }
    const DAYSEL = {};
    function dayTimeHTML(n, pi){
      const jk = DAYSEL[n.id] || pi.todayJK;
      const ts = nodeDaySecs(n, jk);
      return '<div class="gs-tchips"><button type="button" class="gs-tchip" data-nact="settime" data-jk="'+jk+'" title="ویرایش زمان این روز">⏱ '+jkLabel(jk)+' · '+(ts ? fmtDur(ts) : 'زمانی ثبت نشده')+' ✎</button></div>'+
             (rangesText(n, jk) ? '<div class="pc-rng">🕒 '+rangesText(n, jk)+'</div>' : '');
    }
    function jkLabel(jk){
      const p = String(jk).split('-').map(Number);
      if (p.length !== 3 || p.some(isNaN)) return String(jk);
      return toFa(p[2]) + ' ' + JALALI_MONTHS[p[1]-1];
    }
    function jkOrder(jk){ const p = String(jk).split('-').map(Number); return p[0]*10000 + p[1]*100 + p[2]; }
    function timeChipsHTML(n){
      const ks = Object.keys(n.time || {}).filter(k=> +n.time[k] > 0).sort((a,b)=> jkOrder(b) - jkOrder(a));
      let h = '<div class="gs-tchips"><span class="gs-tlbl">⏱ زمان‌ها:</span>';
      ks.slice(0, 10).forEach(k=>{
        h += '<button type="button" class="gs-tchip" data-nact="settime" data-jk="'+k+'" title="ویرایش زمان این روز">'+jkLabel(k)+' · '+fmtDur(n.time[k])+(rangesText(n, k) ? ' · 🕒 '+rangesText(n, k) : '')+' ✎</button>';
      });
      if (ks.length > 10) h += '<span class="gs-tlbl">و '+toFa(ks.length-10)+' روز دیگر</span>';
      h += '<button type="button" class="gs-tchip add" data-nact="timeday" title="ثبت یا ویرایش زمان برای یک روز دیگر">＋ روز دیگر</button></div>';
      return h;
    }
    const DAYS_TOG = new Set();
    function nodeTotalSecs(n){
      let t = nodeSecs(n, null);
      (n.children||[]).forEach(ch=>{ t += nodeTotalSecs(ch); });
      return t;
    }
    function nodeHTML(n, g, pi, depth, parentName){
      if (n.achieved){
        let hh = '';
        (n.children||[]).forEach(ch=>{ hh += nodeHTML(ch, g, pi, depth, parentName); });
        return hh;
      }
      const color = n.color || hcolor(g);
      const c = cellsHTML(n, color, pi);
      const todayDone = !!(n.logs && n.logs[pi.todayJK]);
      const kids = (n.children||[]).filter(k=>!k.achieved);
      const daysOpen = DAYS_TOG.has(n.id);
      if (depth > 0){
        const ts = nodeDaySecs(n, pi.todayJK);
        let mh = '<div class="gs-grp">'+
        '<div class="gs-node sub mini" data-nid="'+n.id+'" style="border-inline-start-color:'+esc(color)+';">'+
          '<div class="gs-mrow">'+
            '<button type="button" class="gs-tick" data-nact="today" aria-label="امروز انجام دادم" style="border-color:'+esc(color)+';background:'+(todayDone?esc(color):'transparent')+';">'+(todayDone?'✓':'')+'</button>'+
            '<input class="gs-ntext" data-nid="'+n.id+'" value="'+esc(n.text)+'" placeholder="نام (مثلاً یوتیوب)..." autocomplete="off">'+
            (ts ? '<span class="gs-mtime on" title="زمان امروز">'+fmtDur(ts)+'</span>' : '')+
            '<button type="button" class="gs-nbtn" data-nact="addtime" aria-label="ثبت زمان" title="ثبت زمان امروز">⌚</button>'+
            '<button type="button" class="gs-nbtn" data-nact="cal" aria-label="روزها" title="روزها و زمان‌ها">📅</button>'+
            '<button type="button" class="gs-nbtn" data-nact="del" aria-label="حذف" title="حذف">✕</button>'+
          '</div>'+
          (daysOpen ? '<div class="gs-days">'+c.h+'</div>'+dayTimeHTML(n, pi) : '')+
        '</div>';
        if (addingFor === n.id) mh += '<div class="gs-kids">'+addRowHTML(n.id, 'نام')+'</div>';
        if ((n.children||[]).length){
          mh += '<div class="gs-kids">';
          (n.children||[]).forEach(ch=>{ mh += nodeHTML(ch, g, pi, depth+1, n.text || 'بدون نام'); });
          mh += '</div>';
        }
        return mh + '</div>';
      }
      const total = nodeTotalSecs(n);
      let h = '<div class="gs-grp">'+
      '<div class="gs-node main" data-nid="'+n.id+'" style="border-inline-start-color:'+esc(color)+';">'+
        '<div class="gs-mrow">'+
          '<button type="button" class="gs-tick" data-nact="today" aria-label="امروز انجام دادم" style="border-color:'+esc(color)+';background:'+(todayDone?esc(color):'transparent')+';">'+(todayDone?'✓':'')+'</button>'+
          '<input class="gs-ntext" data-nid="'+n.id+'" value="'+esc(n.text)+'" placeholder="نام..." autocomplete="off">'+
          '<button type="button" class="gs-mtime'+(total?' on':'')+'" data-nact="addtime" title="ثبت زمان امروز (ساعت و دقیقه)">⌚'+(total ? ' '+fmtDur(total) : '')+'</button>'+
          '<button type="button" class="gs-nbtn" data-nact="add" aria-label="افزودن" title="افزودن">＋</button>'+
          '<button type="button" class="gs-nbtn" data-nact="cal" aria-label="روزها" title="روزها و زمان‌ها">📅</button>'+
          '<button type="button" class="gs-nach" data-nact="achieve" aria-label="دستاورد" title="دستاورد">'+ICO_TROPHY+'</button>'+
          '<button type="button" class="gs-nbtn" data-nact="del" aria-label="حذف" title="حذف">✕</button>'+
        '</div>'+
        (daysOpen ? '<div class="gs-days">'+c.h+'</div>'+dayTimeHTML(n, pi) : '')+
      '</div>';
      if (addingFor === n.id) h += '<div class="gs-kids">'+addRowHTML(n.id, 'نام')+'</div>';
      if (kids.length || (n.children||[]).length){
        h += '<div class="gs-kids">';
        (n.children||[]).forEach(ch=>{ h += nodeHTML(ch, g, pi, depth+1, n.text || 'بدون نام'); });
        h += '</div>';
      }
      return h + '</div>';
    }
    let TSEL = null;
    let ICONSEL = null;
    function collectAch(list, parent, out){
      (list||[]).forEach(n=>{
        if (n.achieved) out.push({ node:n, parent:parent });
        collectAch(n.children, n.text || 'بدون نام', out);
      });
      return out;
    }
    let RSEL = null;
    function ringsOf(g){ return state.rings.filter(r=>r.goalId === g.id); }
    /* ---- نام/رنگ/آیکون یکسان برای هدف و نشانه‌ی نزدیکی ---- */
    function hname(h){ return isRingHost(h) ? (h.label || 'نزدیک شدن به هدف') : (h.name || ''); }
    function hcolor(h){ return h.color || RING_COLOR; }
    function hiconHTML(h){
      const img = h.images && h.images[0] && h.images[0].src;
      if (img) return '<img src="'+esc(img)+'" alt="" draggable="false">';
      return '<span>'+esc(h.icon || (isRingHost(h) ? '🌟' : '🎯'))+'</span>';
    }
    function iconEditHTML(h){
      let th = '';
      (h.images||[]).forEach((im, i)=>{
        th += '<span class="gs-ithumb"><img src="'+esc(im.src)+'" alt="" draggable="false"><button type="button" data-gact="iconimgdel" data-hid="'+h.id+'" data-idx="'+i+'" aria-label="حذف عکس">✕</button></span>';
      });
      return '<div class="gs-iedit">'+
             '<input class="gs-iemoji" data-hid="'+h.id+'" value="'+esc(h.icon || '')+'" maxlength="8" placeholder="ایموجی" autocomplete="off">'+
             '<button type="button" class="gs-mini gold" data-gact="iconimg" data-hid="'+h.id+'">عکس</button>'+th+'</div>';
    }
    (function(){
      if (document.getElementById('gs-hostui-css')) return;
      const st = document.createElement('style'); st.id = 'gs-hostui-css';
      st.textContent =
        '.gs-ico{--ic:#2dd4bf;width:34px;height:34px;flex:none;border-radius:50%;border:2px solid var(--ic);display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;overflow:hidden;background:rgba(0,0,0,.12);}'+
        '.gs-ico img{width:100%;height:100%;object-fit:cover;pointer-events:none;}'+
        '.gs-ico span{pointer-events:none;}'+
        '.gs-iedit{display:flex;align-items:center;flex-wrap:wrap;gap:8px;}'+
        '.dur-ov{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:20px;}'+
      '.dur-box{width:100%;max-width:330px;background:var(--panel-bg,#fff);color:var(--text-main);border:1px solid var(--panel-border);border-radius:20px;padding:18px 16px 14px;box-shadow:0 12px 40px rgba(0,0,0,.35);direction:rtl;text-align:center;}'+
      '.dur-t{font-size:15px;font-weight:700;}'+
      '.dur-s{font-size:11.5px;color:var(--text-dim);margin-top:3px;}'+
      '.dur-in{display:flex;align-items:center;justify-content:center;gap:8px;margin:16px 0 12px;}'+
      '.dur-in b{font-size:22px;color:var(--text-dim);}'+
      '.dur-in label{display:flex;flex-direction:column;align-items:center;gap:4px;}'+
      '.dur-in input{width:78px;height:54px;text-align:center;font-size:24px;font-weight:700;font-family:inherit;border:1px solid var(--panel-border);border-radius:14px;background:transparent;color:var(--text-main);}'+
      '.dur-in span{font-size:11px;color:var(--text-dim);}'+
      '.dur-q{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:14px;}'+
      '.dur-q button{border:1px solid var(--panel-border);background:transparent;color:var(--text-main);border-radius:999px;padding:5px 11px;font-family:inherit;font-size:11.5px;cursor:pointer;}'+
      '.dur-tabs{display:flex;gap:6px;margin-top:12px;}'+
      '.dur-tabs button{flex:1;border:1px solid var(--panel-border);background:transparent;color:var(--text-dim);border-radius:10px;padding:7px 4px;font-family:inherit;font-size:11.5px;cursor:pointer;}'+
      '.dur-tabs button.on{background:rgba(201,151,43,.18);border-color:#c9972b;color:var(--text-main);font-weight:700;}'+
      '.dur-in input[type=time]{width:112px;font-size:20px;direction:ltr;}'+
      '.dur-rinfo{font-size:12px;color:var(--text-dim);margin:-2px 0 14px;}'+
      '.pc-rng{font-size:11px;color:var(--text-dim);margin-top:2px;}'+
      '.dur-b{display:flex;gap:8px;}'+
      '.dur-b button{flex:1;border:1px solid var(--panel-border);background:transparent;color:var(--text-main);border-radius:12px;padding:10px 6px;font-family:inherit;font-size:13px;cursor:pointer;}'+
      '.dur-b .ok{background:#c9972b;border-color:#c9972b;color:#fff;font-weight:700;flex:1.4;}'+
      '.dur-b .del{color:#e5484d;border-color:#e5484d;}'+
      '.gs-ico-btn{cursor:pointer;}'+
        '.gs-day.sel{outline:2px solid var(--text-main);outline-offset:1px;}'+
        '.gs-iconpop{padding:8px 12px 10px;border-top:1px dashed var(--panel-border);}'+
        '.gs-iemoji{width:64px;text-align:center;border:1px solid var(--panel-border);border-radius:10px;background:transparent;color:var(--text-main);font-family:inherit;font-size:16px;padding:5px 4px;box-sizing:border-box;}'+
        '.gs-ithumb{position:relative;width:34px;height:34px;flex:none;}'+
        '.gs-ithumb img{width:100%;height:100%;object-fit:cover;border-radius:8px;border:1px solid var(--panel-border);}'+
        '.gs-ithumb button{position:absolute;top:-6px;inset-inline-end:-6px;width:16px;height:16px;border-radius:50%;border:none;background:#e5484d;color:#fff;font-size:9px;line-height:16px;padding:0;cursor:pointer;}'+
        '.gs-rnote{width:100%;box-sizing:border-box;min-height:54px;resize:vertical;border:1px solid var(--panel-border);border-radius:10px;background:transparent;color:var(--text-main);font-family:inherit;font-size:13px;padding:7px 9px;}'+
        '.gs-tag.rg{border-color:#2dd4bf;color:#2dd4bf;}';
      document.head.appendChild(st);
    })();
    function ringIconHTML(r){
      const img = r.images && r.images[0] && r.images[0].src;
      if (img) return '<img src="'+esc(img)+'" alt="" draggable="false">';
      return '<span>'+esc(r.icon || '🌟')+'</span>';
    }
    function ringsRowHTML(g){
      const rs = ringsOf(g);
      if (!rs.length) return '';
      let h = '<div class="gs-rings"><div class="gs-trophies-h gs-rings-h">'+ICO_MAP+' نشانه‌های نزدیکی · '+toFa(rs.length)+(rs.length > 1 ? '<span class="gs-rhint">با انگشت جابه‌جا کن</span>' : '')+'</div><div class="gs-rrow">';
      rs.forEach(r=>{
        h += '<button type="button" class="gs-ring'+(RSEL===r.id?' sel':'')+'" data-gact="ring" data-rid="'+r.id+'" title="'+esc(r.label||'')+'" style="--rc:'+esc(r.color || RING_COLOR)+'">'+
             '<span class="ric">'+ringIconHTML(r)+'</span><span class="tnm">'+esc(r.label||'نزدیک شدن به هدف')+'</span></button>';
      });
      h += '</div>';
      const r = rs.find(x=>x.id===RSEL);
      if (r){
        const kids = countAllActions(r.actions||[]);
        h += '<div class="gs-tdetail gs-rdetail" style="--rc:'+esc(r.color || RING_COLOR)+'">'+
             '<div class="trow"><span>'+(kids ? toFa(kids) : '')+'</span><span>· متصل به «'+esc(g.name||'هدف')+'»</span></div>'+
             '<div class="gs-rbtns">'+
               '<button type="button" class="gs-mini gold" data-gact="ringmap" data-rid="'+r.id+'">نمایش روی نقشه</button>'+
               '<button type="button" class="gs-mini" data-gact="ringedit" data-rid="'+r.id+'">ویرایش</button>'+
               (state.goals.filter(x=>!x.reached).length > 1 ? '<button type="button" class="gs-mini" data-gact="ringunlink" data-rid="'+r.id+'">انتقال به هدف دیگر</button>' : '')+
               '<button type="button" class="gs-mini" data-gact="ringdel" data-rid="'+r.id+'">حذف</button>'+
             '</div><div class="gs-sub" data-host="'+r.id+'">'+bodyHTML(r)+'</div></div>';
      }
      return h + '</div>';
    }
    function trophiesHTML(g){
      const ringsH = ringsRowHTML(g);
      const arr = collectAch(g.actions, g.name || g.label || 'نشانه', []);
      if (!arr.length && !ringsH) return '';
      arr.sort((a,b)=> (a.node.achievedAt||0) - (b.node.achievedAt||0));
      let h = '<div class="gs-trophies">'+ringsH;
      if (arr.length){
        h += '<div class="gs-trophies-h">'+ICO_TROPHY+' دستاوردها · '+toFa(arr.length)+'</div><div class="gs-tgrid">';
        arr.forEach(({node})=>{
          h += '<button type="button" class="gs-trophy'+(TSEL===node.id?' sel':'')+'" data-gact="trophy" data-tid="'+node.id+'" title="'+esc(node.text||'')+'">'+
               '<span class="tic">'+ICO_TROPHY+'</span><span class="tnm">'+esc(node.text||'بدون نام')+'</span></button>';
        });
        h += '</div>';
      }
      const sel = arr.find(x=>x.node.id===TSEL);
      if (sel){
        const n = sel.node;
        let when = '';
        if (n.achievedAt){ const d = new Date(n.achievedAt); const j = toJalaali(d.getFullYear(), d.getMonth()+1, d.getDate()); when = toFa(j.jy)+'/'+toFa(j.jm)+'/'+toFa(j.jd); }
        const days = Object.keys(n.logs||{}).filter(k=>n.logs[k]).length;
        const kids = countAllActions(n.children||[]);
        h += '<div class="gs-tdetail"><b class="tt">'+esc(n.text||'بدون نام')+'</b><div class="trow">'+
             '<span>زیرِ: '+esc(sel.parent)+'</span>'+(when?'<span>· رسیده‌ای در '+when+'</span>':'')+'</div>'+
             '<div class="trow"><span>'+toFa(days)+' روز انجام شده</span>'+(kids?'<span>· '+toFa(kids)+'</span>':'')+'</div>'+
             '<div><button type="button" class="gs-mini" data-gact="unach" data-tid="'+n.id+'">بازگرداندن</button></div></div>';
      }
      return h + '</div>';
    }
    function bodyHTML(g){
      const pi = periodInfo(g);
      const nTotal = countAllActions(g.actions);
      const todayCnt = goalTodayCount(g, pi.todayJK);
      let h = '<div class="gs-body">';
      if (isRingHost(g)){
        h += '<input class="gs-rname" data-rid="'+g.id+'" value="'+esc(g.label||'')+'" placeholder="نام نشانه..." autocomplete="off">'+
             '<textarea class="gs-rnote" data-rid="'+g.id+'" placeholder="نوشته‌ی زیر نشانه روی نقشه...">'+esc(g.note||'')+'</textarea>';
      }
      if (isRingHost(g)) h += iconEditHTML(g);
      h += '<div class="gs-psum"><span>دوره‌ی <b>'+toFa(pi.total)+' روزه</b> · روز <b>'+toFa(pi.dayNum)+'</b></span>'+
           '<span>· امروز <b>'+toFa(todayCnt)+'</b> کار</span>'+
           '<span>· ⏱ امروز <b>'+fmtDur(allNodes(g).reduce((a,n)=>a+nodeDaySecs(n, pi.todayJK),0))+'</b> · دوره <b>'+fmtDur(allNodes(g).reduce((a,n)=>a+nodeSecs(n, pcPeriodKeys(pi.gp.startDate, pi.gp.days)),0))+'</b></span><span class="sp"></span>'+
           (pi.finished ? '' : '<button type="button" class="gs-mini" data-gact="days">تنظیم روزهای دوره</button>')+'</div>';
      if (pi.finished){
        h += '<div class="gs-done-banner">دوره‌ی '+pcOrd(pi.gp.past.length)+' تموم شد! برای ادامه، دوره‌ی بعدی را شروع کن؛ دوره‌های قبلی نگه داشته می‌شوند.<br>'+
             '<button type="button" class="gs-mini gold" data-gact="newperiod" style="margin-top:6px;">شروع دوره‌ی '+pcOrd(pi.gp.past.length+1)+'</button></div>';
      }
      if (!nTotal && addingFor !== g.id){
        h += '<div class="gs-empty" style="padding:10px 4px;">با ＋ شروع کن؛ مثلاً «گوش دادن به پادکست».</div>';
      }
      (g.actions||[]).forEach(a=>{ h += nodeHTML(a, g, pi, 0); });
      h += trophiesHTML(g);
      if (addingFor === g.id) h += addRowHTML(g.id, 'نام (مثلاً گوش دادن به پادکست)');
      else h += '<div class="gs-addbtns"><button type="button" class="gs-mini gold" data-gact="addbranch" aria-label="افزودن">＋</button>'+
                (isRingHost(g) ? '' : '<button type="button" class="gs-mini ring" data-gact="addring">'+ICO_MAP+' ＋ نزدیک شدن به هدف</button>')+'</div>';
      h += '</div>';
      return h;
    }

    function draw(){
      autoLinkRings();
      const q = norm(searchEl.value.trim());
      const activeGoals = state.goals.filter(g=>!g.reached);
      const reachedGoals = state.goals.filter(g=>g.reached);
      const rn = document.getElementById('gs-reached-n');
      if (rn) rn.textContent = reachedGoals.length ? '(' + toFa(reachedGoals.length) + ')' : '';
      const isReachedTab = tabKey === 'reached';
      const pool = isReachedTab ? reachedGoals : activeGoals.concat(state.rings.filter(r=> !state.goals.some(x=>x.id===r.goalId)));
      let rows = pool.map(g=>({ g, hit: q ? (norm(hname(g)).includes(q) ? '' : findInActions(g.actions, q)) : '' }))
                            .filter(r=> !q || r.hit !== null);
      if (orderCache){
        const ix = id => { const i = orderCache.indexOf(id); return i < 0 ? 1e9 : i; };
        rows.sort((a,b)=> ix(a.g.id) - ix(b.g.id));
      } else {
        rows.sort((a,b)=>{
          if (sortKey === 'growth') return goalPower(b.g) - goalPower(a.g);
          if (sortKey === 'name') return String(hname(a.g)).localeCompare(String(hname(b.g)), 'fa');
          return (b.g.lastActivity||0) - (a.g.lastActivity||0);
        });
        orderCache = rows.map(r=>r.g.id);
      }
      countEl.textContent = pool.length ? (isReachedTab ? toFa(pool.length) + ' هدف' : toFa(activeGoals.length) + ' هدف' + (pool.length > activeGoals.length ? ' · ' + toFa(pool.length - activeGoals.length) + ' نزدیکی بدون هدف' : '')) : '';
      if (!rows.length){
        listEl.innerHTML = `<div class="gs-empty">${q ? 'موردی پیدا نشد.' : (isReachedTab ? 'هنوز هدفی به مرحله‌ی «محقق‌شده» نرسیده.<br>وقتی به یک هدف رسیدی، با دکمه‌ی ✓ کنار آن، به این فهرست منتقل می‌شود.' : (state.goals.length ? 'همه‌ی اهدافت محقق شده‌اند 🎉<br>با دکمه‌ی «＋ هدف جدید» هدف تازه‌ای بساز.' : 'هنوز هدفی نساخته‌ای.<br>با دکمه‌ی «＋ هدف جدید» شروع کن.'))}</div>`;
        return;
      }
      const scrollTop = listEl.scrollTop;
      if (isReachedTab){
        listEl.innerHTML = rows.map(({g})=>{
          const n = countAllActions(g.actions);
          let when = '';
          if (g.reachedAt){
            const d = new Date(g.reachedAt); const j = toJalaali(d.getFullYear(), d.getMonth()+1, d.getDate());
            when = ' · محقق‌شده در ' + toFa(j.jy) + '/' + toFa(j.jm) + '/' + toFa(j.jd);
          }
          return `<div class="gs-item gs-reached-item" data-gid="${g.id}" style="--gs-c:${esc(g.color)}">
            <div class="gs-row" data-act="none">
              <span class="gs-dot" style="background:${g.color}"></span>
              <div class="gs-main">
                <div class="gs-name">${esc(g.name)}<span class="gs-tag ok">محقق شد ✓</span></div>
                <div class="gs-meta">${when ? when.replace(/^\s*·\s*/, '') : ''}</div>
              </div>
              <button class="gs-mini" data-act="unreach" type="button">بازگرداندن</button>
              <button class="gs-ic" data-act="map" aria-label="نمایش روی نقشه">${ICO_MAP}</button>
              <button class="gs-ic" data-act="edit" aria-label="ویرایش">${ICO_EDIT}</button>
            </div>
          </div>`;
        }).join('');
        listEl.scrollTop = scrollTop;
        return;
      }
      listEl.innerHTML = rows.map(({g, hit})=>{
        const n = countAllActions(g.actions);
        const p = goalPower(g);
        const stale = g.lastActivity && (Date.now() - g.lastActivity) > 30*86400000;
        const isR = isRingHost(g);
        const hc = hcolor(g);
        const lg = isR && g.goalId ? state.goals.find(x=>x.id===g.goalId) : null;
        const tags = (isR ? '<span class="gs-tag rg">نزدیک شدن به هدف' + (lg ? ' · «' + esc(lg.name || 'هدف') + '»' : '') + '</span>' : '') + (stale ? '<span class="gs-tag">کم‌فعالیت</span>' : '');
        const isOpen = OPEN.has(g.id) || (q && hit);
        return `<div class="gs-item${isOpen ? ' open' : ''}" data-gid="${g.id}" style="--gs-c:${esc(hc)}">
          <div class="gs-row" data-act="toggle">
            <span class="gs-ico${isR ? '' : ' gs-ico-btn'}" ${isR ? '' : 'data-act="icon" title="تغییر آیکون یا عکس"'} style="--ic:${esc(hc)}">${hiconHTML(g)}</span>
            <div class="gs-main">
              <div class="gs-name"><span class="gs-nm">${esc(hname(g))}</span>${tags}</div>
              <div class="gs-meta">${g.lastActivity ? ago(g.lastActivity) : ''}</div>
              ${hit ? `<div class="gs-hit">↳ ${esc(hit)}</div>` : ''}
              <div class="gs-bar"><i style="width:${p}%;background:${hc}"></i></div>
            </div>
            <button class="gs-ic" data-act="toggle" aria-label="باز یا بسته کردن">${isOpen ? ICO_CHEV_UP : ICO_CHEV_DOWN}</button>
            ${isR ? '' : `<button class="gs-ic" data-act="reach" aria-label="به این هدف رسیدم" title="به این هدف رسیدم">${ICO_CHECK}</button>`}
            <button class="gs-ic" data-act="map" aria-label="نمایش روی نقشه">${ICO_MAP}</button>
            <button class="gs-ic" data-act="edit" aria-label="ویرایش">${ICO_EDIT}</button>
          </div>
          ${(!isR && ICONSEL === g.id) ? '<div class="gs-body gs-iconpop">' + iconEditHTML(g) + '</div>' : ''}
          ${isOpen ? bodyHTML(g) : ''}
        </div>`;
      }).join('');
      listEl.scrollTop = scrollTop;
    }
    window.__reopenGoalsSheet = ()=>{ open(); };
    function open(){ searchEl.value=''; orderCache = null; draw(); ov.classList.add('open'); }
    function close(){ ov.classList.remove('open'); }
    function touch(g){ g.lastActivity = Date.now(); scheduleMapSave(); }
    document.getElementById('goals-list-btn').addEventListener('click', open);
    document.getElementById('gs-tabs').addEventListener('click', (e)=>{
      const b = e.target.closest('.gs-chip'); if (!b) return;
      tabKey = b.dataset.tab; orderCache = null;
      [...document.querySelectorAll('#gs-tabs .gs-chip')].forEach(x=>x.classList.toggle('on', x===b));
      draw();
    });
    document.getElementById('gs-add').addEventListener('click', ()=>{
      tabKey = 'active';
      [...document.querySelectorAll('#gs-tabs .gs-chip')].forEach(x=>x.classList.toggle('on', x.dataset.tab==='active'));
      close();
      document.dispatchEvent(new CustomEvent('maghz-add-goal'));
    });
    document.getElementById('gs-close').addEventListener('click', close);
    ov.addEventListener('pointerdown', (e)=>{ if (e.target === ov) close(); });
    searchEl.addEventListener('input', ()=>{ orderCache = null; draw(); });
    { const so = document.getElementById('gs-sort'); if (so && so.id !== 'gs-tabs') so.remove(); }
    if (document.getElementById('gs-sort')) document.getElementById('gs-sort').addEventListener('click', (e)=>{
      const b = e.target.closest('.gs-chip'); if (!b) return;
      sortKey = b.dataset.sort; orderCache = null;
      [...document.querySelectorAll('#gs-sort .gs-chip')].forEach(x=>x.classList.toggle('on', x===b));
      draw();
    });

    function focusAddInput(){
      const el = listEl.querySelector('.gs-addin');
      if (el) setTimeout(()=>{ try{ el.focus(); }catch(e){} }, 30);
    }
    function commitAdd(g, forId, text){
      text = String(text||'').trim();
      if (!text) return;
      const isGoal = (forId === g.id);
      const node = { id:uid(), text, weight:5, color:null, children:[], detached:false, images:[], radius:isGoal?12:10, createdAt:Date.now(), logs:{} };
      if (isGoal) g.actions.push(node);
      else {
        const f = findActionNode(g.actions, forId);
        if (!f) return;
        f.node.children = f.node.children || [];
        f.node.children.push(node);
      }
      g.collapsed = false;
      touch(g);
      render();
      draw();
      focusAddInput();
    }

    function celebrate(color, x, y, big){
      try{
        const fl = document.createElement('div');
        fl.className = 'fx-flash';
        fl.style.setProperty('--fx-x', x+'px'); fl.style.setProperty('--fx-y', y+'px');
        document.body.appendChild(fl); setTimeout(()=>fl.remove(), 800);
        const cols = [color || '#ffd45a', '#ffd45a', '#ff7aa8', '#5ec8f0', '#7ee0a0', '#b79bff'];
        const N = big ? 70 : 44;
        for (let i=0;i<N;i++){
          const c = document.createElement('i');
          c.className = 'fx-confetti';
          c.style.background = cols[i % cols.length];
          document.body.appendChild(c);
          const ang = (-Math.PI/2) + (Math.random()-.5) * Math.PI * 1.25;
          const sp = (big?340:260) * (.45 + Math.random()*.75);
          const dx = Math.cos(ang)*sp, dy = Math.sin(ang)*sp;
          const rot = (Math.random()-.5) * 900;
          const fall = 260 + Math.random()*220;
          const anim = c.animate([
            { transform:'translate('+x+'px,'+y+'px) rotate(0deg) scale(1)', opacity:1 },
            { transform:'translate('+(x+dx*.7)+'px,'+(y+dy*.7)+'px) rotate('+(rot*.6)+'deg) scale(1)', opacity:1, offset:.45 },
            { transform:'translate('+(x+dx)+'px,'+(y+dy+fall)+'px) rotate('+rot+'deg) scale(.7)', opacity:0 }
          ], { duration: 1100 + Math.random()*700, easing:'cubic-bezier(.2,.7,.3,1)' });
          anim.onfinish = ()=> c.remove();
        }
      }catch(e){}
      try{ if (navigator.vibrate) navigator.vibrate(big ? [30,50,30,50,90] : [25,40,70]); }catch(e){}
      try{
        if (typeof isNothingSoundOn === 'function' && !isNothingSoundOn()) return;
        const ctx = (typeof resumeAudio === 'function') ? resumeAudio() : null;
        if (!ctx) return;
        const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [659.25, 783.99, 1046.5];
        const t0 = ctx.currentTime;
        notes.forEach((f, i)=>{
          const o = ctx.createOscillator(), o2 = ctx.createOscillator(), gn = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = f;
          o2.type = 'sine'; o2.frequency.value = f*2;
          const st = t0 + i*0.085;
          gn.gain.setValueAtTime(0.0001, st);
          gn.gain.exponentialRampToValueAtTime(0.16, st+0.02);
          gn.gain.exponentialRampToValueAtTime(0.0001, st + (i===notes.length-1 ? 0.9 : 0.35));
          o.connect(gn); o2.connect(gn); gn.connect(ctx.destination);
          o.start(st); o2.start(st); o.stop(st+1); o2.stop(st+1);
        });
      }catch(e){}
    }
    function onBodyClick(e, g){
      const subEl = e.target.closest('.gs-sub');
      if (subEl){ const hh = findHost(subEl.dataset.host); if (hh) g = hh; }
      const gact = e.target.closest('[data-gact]');
      if (gact){
        const a = gact.dataset.gact;
        if (a === 'days'){
          const pi = periodInfo(g);
          const n = askDays('دوره‌ی ' + pcOrd(pi.gp.past.length) + ' چند روزه باشه؟ (۱ تا ' + toFa(PC_MAX_DAYS) + ')', pi.gp.days);
          if (n){ pi.gp.days = n; scheduleMapSave(); draw(); if (typeof toast === 'function') toast('دوره روی ' + toFa(n) + ' روز تنظیم شد'); }
        } else if (a === 'newperiod'){
          const pi = periodInfo(g);
          const n = askDays('دوره‌ی ' + pcOrd(pi.gp.past.length+1) + ' چند روزه باشه؟ (۱ تا ' + toFa(PC_MAX_DAYS) + ')', pi.gp.days);
          if (n){
            pi.gp.past.push({ days: pi.gp.days, startDate: pi.gp.startDate });
            pi.gp.days = n; pi.gp.startDate = pcLocalKey(new Date());
            scheduleMapSave(); draw();
            if (typeof toast === 'function') toast('دوره‌ی ' + pcOrd(pi.gp.past.length) + ' شروع شد');
          }
        } else if (a === 'trophy'){
          TSEL = (TSEL === gact.dataset.tid) ? null : gact.dataset.tid; draw();
        } else if (a === 'unach'){
          const f2 = findActionNode(g.actions, gact.dataset.tid);
          if (f2){ f2.node.achieved = false; delete f2.node.achievedAt; TSEL = null; touch(g); draw(); if (typeof toast === 'function') toast('برگشت'); }
        } else if (a === 'addring'){
          if (isRingHost(g)) return;
          const nr = createRingForGoal(g);
          state.ringsCollapsed = false;
          RSEL = nr.id;
          touch(g); render(); draw();
          if (typeof toast === 'function') toast('نشانه‌ی نزدیکی به هدف و نقشه وصل شد');
          setTimeout(()=>{ const el = listEl.querySelector('.gs-rname[data-rid="'+nr.id+'"]'); if (el){ try{ el.focus(); el.select(); }catch(e){} } }, 40);
        } else if (a === 'ring'){
          if (suppressRingClick) return;
          RSEL = (RSEL === gact.dataset.rid) ? null : gact.dataset.rid; draw();
        } else if (a === 'ringmap'){
          const r = state.rings.find(x=>x.id===gact.dataset.rid); if (!r) return;
          close();
          state.ringsCollapsed = false; r.collapsed = false; g.collapsed = false;
          render();
          animateCamTo(viewForPoints(goalPoints(g).concat(goalPoints(r)), 1.3));
          const hh = document.getElementById('hint'); if (hh) hh.style.display = 'none';
        } else if (a === 'ringedit'){
          close(); openPanelForRing(gact.dataset.rid);
        } else if (a === 'ringunlink'){
          const r = state.rings.find(x=>x.id===gact.dataset.rid); if (!r) return;
          pickGoalDialog('این نشانه زیر کدام هدف باشد؟', gid=>{
            r.goalId = gid; RSEL = null; const ng = state.goals.find(x=>x.id===gid); if (ng) touch(ng); touch(g); render(); draw();
            if (typeof toast === 'function') toast('به هدف انتخابی منتقل شد');
          });
        } else if (a === 'ringdel'){
          const r = state.rings.find(x=>x.id===gact.dataset.rid); if (!r) return;
          if (!window.confirm('«' + (r.label || 'نشانه') + '» حذف بشه؟')) return;
          state.rings = state.rings.filter(x=>x.id!==r.id); RSEL = null; touch(g); render(); draw();
        } else if (a === 'iconimg'){
          const hh = findHost(gact.dataset.hid); if (!hh) return;
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none';
          document.body.appendChild(inp);
          inp.addEventListener('change', async ()=>{
            const files = Array.from(inp.files || []);
            inp.remove();
            if (!files.length) return;
            const srcs = await cropImages(files);
            if (!srcs.length) return;
            hh.images = normalizeImages(hh.images);
            hh.images = srcs.map(src=> ({ src, size: DEFAULT_IMG_SIZE, dx: 0, dy: 0 })).concat(hh.images);
            touch(hh); render(); draw();
          });
          inp.click();
        } else if (a === 'iconimgdel'){
          const hh = findHost(gact.dataset.hid); if (!hh || !Array.isArray(hh.images)) return;
          hh.images.splice(+gact.dataset.idx, 1);
          touch(hh); render(); draw();
        } else if (a === 'addbranch'){ addingFor = g.id; draw(); focusAddInput(); }
        else if (a === 'addcancel'){ addingFor = null; draw(); }
        else if (a === 'addok'){
          const inp = listEl.querySelector('.gs-addin[data-for="'+gact.dataset.for+'"]');
          commitAdd(g, gact.dataset.for, inp ? inp.value : '');
        }
        return;
      }
      const nodeEl = e.target.closest('.gs-node');
      if (!nodeEl) return;
      const nid = nodeEl.dataset.nid;
      const found = findActionNode(g.actions, nid);
      if (!found) return;
      const nact = e.target.closest('[data-nact]');
      const dayEl = e.target.closest('.gs-day');
      if (dayEl){
        if (dayEl.disabled || dayEl.classList.contains('future')) return;
        DAYSEL[found.node.id] = dayEl.dataset.jk;
        doToggle(g, found.node, dayEl.dataset.jk, null);
        return;
      }
      if (!nact) return;
      if (nact.dataset.nact === 'today'){
        const pi = periodInfo(g);
        doToggle(g, found.node, pi.todayJK, nact);
      } else if (nact.dataset.nact === 'achieve'){
        const node = found.node;
        if (node.achieved){ node.achieved = false; delete node.achievedAt; touch(g); draw(); return; }
        const r = nact.getBoundingClientRect();
        node.achieved = true; node.achievedAt = Date.now(); TSEL = null;
        touch(g); draw();
        celebrate(node.color || g.color, r.left + r.width/2, r.top + r.height/2);
        if (typeof toast === 'function') toast('🏆 به آرشیو دستاوردها رفت');
      } else if (nact.dataset.nact === 'timer'){
        /* تایمر حذف شد؛ دکمه‌ها حالا پنجره‌ی ثبت زمان را باز می‌کنند */
        return;
      } else if (nact.dataset.nact === 'addtime'){
        const fnode = found.node, todayJK = periodInfo(g).todayJK;
        askDuration({ title:'چقدر زمان ثبت بشه؟', sub:'امروز · ' + (fnode.text || ''), defMin:60 }, mm=>{
          if (mm){ addMinutes(fnode, todayJK, mm); touch(g); render(); draw(); }
        });
      } else if (nact.dataset.nact === 'cal'){
        if (DAYS_TOG.has(nid)) DAYS_TOG.delete(nid); else DAYS_TOG.add(nid);
        draw();
      } else if (nact.dataset.nact === 'settime'){
        const jk = nact.dataset.jk;
        const cur = Math.round(nodeDaySecs(found.node, jk) / 60);
        const snode = found.node;
        askDuration({ title:jkLabel(jk), sub:'زمان این روز · ' + (snode.text || ''), defMin:cur, allowZero:true, deletable:cur > 0 }, mm=>{
          setDayMinutes(snode, jk, mm); touch(g); render(); draw();
        });
      } else if (nact.dataset.nact === 'timeday'){
        const pi = periodInfo(g);
        const dn = window.prompt('کدوم روزِ دوره؟ (۱ تا ' + toFa(pi.total) + ' — امروز روز ' + toFa(pi.dayNum) + ' است)', String(pi.dayNum));
        if (dn === null) return;
        const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
        const di = parseInt(String(dn).replace(/[۰-۹٠-٩]/g, c=>{ const i = fa.indexOf(c); return i > -1 ? i : ar.indexOf(c); }), 10);
        if (!di || di < 1 || di > pi.total || di > pi.dayNum){ if (typeof toast === 'function') toast('یه روز معتبر از دوره وارد کن'); return; }
        const jk = pcJKey(new Date(pi.start.getFullYear(), pi.start.getMonth(), pi.start.getDate() + di - 1));
        const cur = Math.round(nodeDaySecs(found.node, jk) / 60);
        const tnode = found.node;
        askDuration({ title:jkLabel(jk), sub:'زمان این روز · ' + (tnode.text || ''), defMin:cur || 60, allowZero:true, deletable:cur > 0 }, mm=>{
          setDayMinutes(tnode, jk, mm); touch(g); render(); draw();
        });
      } else if (nact.dataset.nact === 'add'){
        addingFor = nid; draw(); focusAddInput();
      } else if (nact.dataset.nact === 'del'){
        const hasKids = (found.node.children||[]).length;
        if (!window.confirm('«' + (found.node.text || 'بدون نام') + '» ' + (hasKids ? 'همراه با زیرمجموعه‌اش ' : '') + 'حذف بشه؟')) return;
        found.list.splice(found.list.indexOf(found.node), 1);
        touch(g); render(); draw();
      }
    }
    function doToggle(g, node, jk, btn){
      toggleRoutineLog(node.id, jk);
      const nowDone = !!(node.logs && node.logs[jk]);
      if (nowDone) touch(g); else scheduleMapSave();
      draw();
      if (nowDone){
        if (btn){ const nb = listEl.querySelector('.gs-node[data-nid="'+node.id+'"] .gs-tick'); if (nb) nb.classList.add('pop'); }
      }
    }

    listEl.addEventListener('click', (e)=>{
      const item = e.target.closest('.gs-item'); if (!item) return;
      const id = item.dataset.gid;
      const g = findHost(id); if (!g) return;
      if (e.target.closest('.gs-body')){ onBodyClick(e, g); return; }
      const act = e.target.closest('[data-act]');
      const kind = act ? act.dataset.act : 'toggle';
      if (kind === 'none') return;
      if (kind === 'icon'){ ICONSEL = (ICONSEL === id) ? null : id; draw(); return; }
      if (kind === 'reach'){
        const rb = act.getBoundingClientRect();
        g.reached = true; g.reachedAt = Date.now(); OPEN.delete(id); touch(g); render(); draw();
        celebrate(g.color, rb.left + rb.width/2, rb.top + rb.height/2, true);
        if (typeof toast === 'function') toast('🏆 هدف محقق شد!');
        return;
      }
      if (kind === 'unreach'){
        g.reached = false; delete g.reachedAt; touch(g); render(); draw();
        if (typeof toast === 'function') toast('برگشت به اهداف در جریان');
        return;
      }
      if (isRingHost(g)){
        if (kind === 'edit'){ close(); openPanelForRing(id); return; }
        if (kind === 'map'){
          close();
          state.ringsCollapsed = false; g.collapsed = false;
          render();
          animateCamTo(viewForPoints(goalPoints(Object.assign({}, g, {x:g.x, y:g.y})), 1.4));
          const h = document.getElementById('hint'); if (h) h.style.display = 'none';
          return;
        }
      }
      if (kind === 'edit'){ close(); openPanelForGoal(id); return; }
      if (kind === 'map'){ close(); focusGoal(id); return; }
      if (OPEN.has(id)){ OPEN.delete(id); if (addingFor && (addingFor === id || findActionNode(g.actions, addingFor))) addingFor = null; }
      else OPEN.add(id);
      draw();
    });
    listEl.addEventListener('input', (e)=>{
      const t = e.target;
      if (!t.classList || !t.classList.contains('gs-iemoji')) return;
      const hh = findHost(t.dataset.hid); if (!hh) return;
      const v = t.value.trim();
      hh.icon = v || (isRingHost(hh) ? '🌟' : '🎯');
      if (v && hh.images && hh.images.length) hh.images = [];
      const ed = t.closest('.gs-iedit');
      if (ed){
        ed.querySelectorAll('.gs-ithumb').forEach(x=>x.remove());
        const ic = ed.querySelector('.gs-ico'); if (ic) ic.innerHTML = hiconHTML(hh);
      }
      const rowIc = listEl.querySelector('.gs-item[data-gid="'+hh.id+'"] .gs-row .gs-ico'); if (rowIc) rowIc.innerHTML = hiconHTML(hh);
      touch(hh); render();
    });
    listEl.addEventListener('change', (e)=>{
      const t = e.target;
      if (t.classList && t.classList.contains('gs-rname')){
        const r = state.rings.find(x=>x.id===t.dataset.rid); if (!r) return;
        r.label = t.value.trim() || 'نزدیک شدن به هدف';
        r.lastActivity = Date.now();
        const nm = listEl.querySelector('.gs-ring[data-rid="'+r.id+'"] .tnm'); if (nm) nm.textContent = r.label;
        const nm2 = listEl.querySelector('.gs-item[data-gid="'+r.id+'"] .gs-nm'); if (nm2) nm2.textContent = r.label;
        scheduleMapSave(); render();
        return;
      }
      if (t.classList && t.classList.contains('gs-rnote')){
        const r = state.rings.find(x=>x.id===t.dataset.rid); if (!r) return;
        r.note = t.value; r.lastActivity = Date.now();
        scheduleMapSave(); render();
        return;
      }

      if (!t.classList || !t.classList.contains('gs-ntext')) return;
      const item = t.closest('.gs-item'); if (!item) return;
      const sub = t.closest('.gs-sub');
      const g = findHost(sub ? sub.dataset.host : item.dataset.gid); if (!g) return;
      const found = findActionNode(g.actions, t.dataset.nid);
      if (!found) return;
      found.node.text = t.value.trim() || 'بدون عنوان';
      touch(g); render();
    });
    /* جابه‌جایی نشانه‌های نزدیکی در ردیف با انگشت (یا ماوس) */
    let suppressRingClick = false;
    (function(){
      let drag = null;
      function chipAt(x, y, except){
        const chips = [...listEl.querySelectorAll('.gs-ring')];
        for (const c of chips){
          if (c === except) continue;
          const b = c.getBoundingClientRect();
          if (x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) return c;
        }
        return null;
      }
      listEl.addEventListener('pointerdown', (e)=>{
        const chip = e.target.closest('.gs-ring');
        if (!chip || (e.pointerType === 'mouse' && e.button !== 0)) return;
        drag = { chip, id: chip.dataset.rid, x0: e.clientX, y0: e.clientY, moving:false, over:null, pid:e.pointerId };
        try{ chip.setPointerCapture(e.pointerId); }catch(_){}
      });
      listEl.addEventListener('pointermove', (e)=>{
        if (!drag || e.pointerId !== drag.pid) return;
        const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.moving){
          if (Math.hypot(dx, dy) < 7) return;
          drag.moving = true; drag.chip.classList.add('dragging');
        }
        e.preventDefault();
        drag.chip.style.transform = 'translate('+dx+'px,'+dy+'px) scale(1.08)';
        const over = chipAt(e.clientX, e.clientY, drag.chip);
        if (over !== drag.over){
          if (drag.over) drag.over.classList.remove('drop');
          if (over) over.classList.add('drop');
          drag.over = over;
        }
      });
      function finish(e, cancel){
        if (!drag || e.pointerId !== drag.pid) return;
        const d = drag; drag = null;
        try{ d.chip.releasePointerCapture(d.pid); }catch(_){}
        if (!d.moving) return;
        suppressRingClick = true; setTimeout(()=>{ suppressRingClick = false; }, 350);
        d.chip.classList.remove('dragging'); d.chip.style.transform = '';
        if (d.over) d.over.classList.remove('drop');
        if (cancel || !d.over) return;
        const from = state.rings.findIndex(r=>r.id === d.id);
        const to = state.rings.findIndex(r=>r.id === d.over.dataset.rid);
        if (from < 0 || to < 0 || from === to) return;
        const [mv] = state.rings.splice(from, 1);
        state.rings.splice(to, 0, mv);
        scheduleMapSave(); render(); draw();
      }
      listEl.addEventListener('pointerup', (e)=> finish(e, false));
      listEl.addEventListener('pointercancel', (e)=> finish(e, true));
    })();
    listEl.addEventListener('keydown', (e)=>{
      const t = e.target;
      if (e.key !== 'Enter' || !t.classList) return;
      if (t.classList.contains('gs-addin')){
        e.preventDefault();
        const item = t.closest('.gs-item'); if (!item) return;
        const sub = t.closest('.gs-sub');
        const g = findHost(sub ? sub.dataset.host : item.dataset.gid); if (!g) return;
        commitAdd(g, t.dataset.for, t.value);
      } else if (t.classList.contains('gs-ntext') || t.classList.contains('gs-rname') || t.classList.contains('gs-iemoji')){
        e.preventDefault(); t.blur();
      }
    });
  })();

  document.getElementById('collapse-all-btn').addEventListener('click', ()=>{
    const collapse = document.getElementById('collapse-all-btn').dataset.mode === 'collapse';
    state.goals.forEach(g=>{ if (goalBranchCount(g)) g.collapsed = collapse; });
    state.rings.forEach(r=>{ if (ringIsOrphan(r) && r.actions && r.actions.length) r.collapsed = collapse; });
    state.ringsCollapsed = false;
    render();
  });

  document.getElementById('recenter-btn').addEventListener('click', ()=>{
    focusGoalId = null;
    render();
    fitAllView();
    document.getElementById('hint').style.display = 'none';
  });

  /* ---------------- rendering ---------------- */
  function esc(s){
    return String(s??"").replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function seeded(seedStr){
    let h = 1779033703 ^ seedStr.length;
    for (let i=0;i<seedStr.length;i++){
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function(){
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  function haloSVG(cx, cy, color, r, pulseFactor, freqKey){
    const pf = pulseFactor || 1;
    const freq = freqKey && FREQ_BANDS[freqKey] ? FREQ_BANDS[freqKey] : FREQ_BANDS.alpha;
    const baseDur = freq.speed;
    const innerDur = (baseDur * 0.8).toFixed(2);
    const midDur   = baseDur.toFixed(2);
    const outerDur = (baseDur * 1.35).toFixed(2);

    return `
      <circle cx="${cx}" cy="${cy}" r="${r*1.95*pf}" fill="${color}" opacity="0.10" filter="url(#glow)">
        <animate attributeName="r" values="${r*1.7*pf};${r*2.2*pf};${r*1.7*pf}" dur="${outerDur}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.07;0.16;0.07" dur="${outerDur}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${cx}" cy="${cy}" r="${r*1.4*pf}" fill="${color}" opacity="0.15" filter="url(#glow)">
        <animate attributeName="r" values="${r*1.25*pf};${r*1.55*pf};${r*1.25*pf}" dur="${midDur}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.13;0.24;0.13" dur="${midDur}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${cx}" cy="${cy}" r="${r*1.0*pf}" fill="none" stroke="${color}" stroke-width="1.4" opacity="0.6">
        <animate attributeName="r" values="${r*0.88*pf};${r*1.08*pf};${r*0.88*pf}" dur="${innerDur}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.45;0.75;0.45" dur="${innerDur}s" repeatCount="indefinite"/>
      </circle>
    `;
  }

  function userAuraSVG(cx, cy, r, userState){
    const band = FREQ_BANDS[userState.band] || FREQ_BANDS.delta;
    const freq = band.speed;
    const progress = userState.progress;
    const color = band.color;

    const rippleCount = 3;
    let ripples = '';
    for (let i = 0; i < rippleCount; i++){
      const delay = (i * freq / rippleCount).toFixed(2);
      const dur   = (freq * 1.4).toFixed(2);
      const op    = (0.35 + progress * 0.45).toFixed(2);
      ripples +=
        '<circle class="me-aura-ripple" cx="' + cx + '" cy="' + cy +
        '" fill="none" stroke="' + color + '" stroke-width="' +
        (1.4 + progress * 1.6).toFixed(2) + '" opacity="0">' +
          '<animate attributeName="r" values="' + (r*1.15) + ';' + (r*3.2) + '" dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"/>' +
          '<animate attributeName="opacity" values="' + op + ';0" dur="' + dur + 's" begin="' + delay + 's" repeatCount="indefinite"/>' +
        '</circle>';
    }

    const glowR = r * (1.6 + progress * 0.9);
    const glowOp = (0.15 + progress * 0.25).toFixed(2);
    const glow =
      '<circle class="me-aura-glow" cx="' + cx + '" cy="' + cy + '" r="' + glowR.toFixed(1) +
      '" fill="' + color + '" opacity="' + glowOp + '"/>' +
      '<circle class="me-aura-glow" cx="' + cx + '" cy="' + cy + '" r="' + (glowR*0.6).toFixed(1) +
      '" fill="#ffffff" opacity="' + (glowOp * 0.55).toFixed(2) + '"/>';

    return glow + ripples;
  }

  function addPhotoPlaceholderSVG(cx, cy, r, color){
    const s = r * 0.42;
    const cy2 = cy - r * 0.12;
    return `
      <g style="pointer-events:none;">
        <circle cx="${cx}" cy="${cy2}" r="${s}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 3" opacity="0.85"/>
        <line x1="${(cx - s*0.5).toFixed(1)}" y1="${cy2.toFixed(1)}" x2="${(cx + s*0.5).toFixed(1)}" y2="${cy2.toFixed(1)}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
        <line x1="${cx}" y1="${(cy2 - s*0.5).toFixed(1)}" x2="${cx}" y2="${(cy2 + s*0.5).toFixed(1)}" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    `;
  }

  function userAvatarSVG(cx, cy, r, color){
    const headR  = r * 0.22;
    const headY  = cy - r * 0.34;
    const bodyT  = cy - r * 0.08;
    const bodyB  = cy + r * 0.42;
    const bodyW  = r * 0.34;

    return `
      <g class="me-avatar-silhouette" style="color:${color};">
        <circle cx="${cx}" cy="${headY.toFixed(1)}" r="${headR.toFixed(1)}"/>
        <path d="M${(cx - bodyW).toFixed(1)} ${bodyT.toFixed(1)}
                 Q${cx} ${(bodyT + r*0.06).toFixed(1)} ${(cx + bodyW).toFixed(1)} ${bodyT.toFixed(1)}
                 L${(cx + bodyW*1.12).toFixed(1)} ${bodyB.toFixed(1)}
                 Q${cx} ${(bodyB + r*0.08).toFixed(1)} ${(cx - bodyW*1.12).toFixed(1)} ${bodyB.toFixed(1)} Z"/>
      </g>
    `;
  }

  function userBandBadgeSVG(cx, cy, r, userState){
    const band = FREQ_BANDS[userState.band] || FREQ_BANDS.delta;
    const badgeY = cy - r - 22;
    const textColor = effectiveTextColor();
    const progressPct = Math.round(userState.progress * 100);
    const barW = 68;
    const barX = cx - barW/2;
    const barY = badgeY + 8;

    return `
      <text x="${cx}" y="${badgeY}" text-anchor="middle" class="me-band-badge"
            font-size="11" font-weight="700" fill="${textColor}">
        ${band.label} · ${userState.stage}
      </text>
      <rect x="${barX}" y="${barY}" width="${barW}" height="4" rx="2"
            fill="rgba(255,255,255,0.15)"/>
      <rect x="${barX}" y="${barY}" width="${(barW * userState.progress).toFixed(1)}" height="4" rx="2"
            fill="${band.color}"/>
      <text x="${cx}" y="${barY + 15}" text-anchor="middle" class="me-band-badge"
            font-size="9" opacity="0.75" fill="${textColor}">
        رشد مدار · ${progressPct}٪
      </text>
    `;
  }

  function bezierPoint(p0,p1,p2,p3,t){
    const mt=1-t;
    return {
      x: mt*mt*mt*p0.x + 3*mt*mt*t*p1.x + 3*mt*t*t*p2.x + t*t*t*p3.x,
      y: mt*mt*mt*p0.y + 3*mt*mt*t*p1.y + 3*mt*t*t*p2.y + t*t*t*p3.y
    };
  }
  function bezierTangentAngle(p0,p1,p2,p3,t){
    const mt=1-t;
    const dx = 3*mt*mt*(p1.x-p0.x) + 6*mt*t*(p2.x-p1.x) + 3*t*t*(p3.x-p2.x);
    const dy = 3*mt*mt*(p1.y-p0.y) + 6*mt*t*(p2.y-p1.y) + 3*t*t*(p3.y-p2.y);
    return Math.atan2(dy,dx);
  }

  function nearestOnBezier(cp, pt){
    let bestT=0, bestD=Infinity, bestPt=cp.p0;
    const N=40;
    for(let i=0;i<=N;i++){
      const t=i/N;
      const p=bezierPoint(cp.p0,cp.p1,cp.p2,cp.p3,t);
      const d=Math.hypot(p.x-pt.x,p.y-pt.y);
      if(d<bestD){bestD=d;bestT=t;bestPt=p;}
    }
    let lo=Math.max(0,bestT-1/N), hi=Math.min(1,bestT+1/N);
    for(let iter=0; iter<14; iter++){
      const t1=lo+(hi-lo)/3, t2=hi-(hi-lo)/3;
      const p1=bezierPoint(cp.p0,cp.p1,cp.p2,cp.p3,t1);
      const p2=bezierPoint(cp.p0,cp.p1,cp.p2,cp.p3,t2);
      const d1=Math.hypot(p1.x-pt.x,p1.y-pt.y);
      const d2=Math.hypot(p2.x-pt.x,p2.y-pt.y);
      if(d1<d2){ hi=t2; if(d1<bestD){bestD=d1;bestPt=p1;} }
      else { lo=t1; if(d2<bestD){bestD=d2;bestPt=p2;} }
    }
    return { pt:bestPt, dist:bestD };
  }

  let actionGeomMap = new Map();

  function trunkControlPoints(goal){
    if (isRingHost(goal)){
      const R = goal.radius || 30;
      const a = Math.atan2(goal.y - state.me.y, goal.x - state.me.x);
      const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, LL = 130;
      const q0 = {x:goal.x+ux*R, y:goal.y+uy*R};
      const rr = seeded(goal.id+'-trunk');
      const k1 = (rr()*0.5-0.25)*LL*0.3, k2 = (rr()*0.5-0.25)*LL*0.3;
      return { p0:q0,
        p1:{x:q0.x+ux*LL*0.33+px*k1, y:q0.y+uy*LL*0.33+py*k1},
        p2:{x:q0.x+ux*LL*0.66+px*k2, y:q0.y+uy*LL*0.66+py*k2},
        p3:{x:q0.x+ux*LL, y:q0.y+uy*LL} };
    }
    const p0={x:state.me.x,y:state.me.y}, p3={x:goal.x,y:goal.y};
    const dx=p3.x-p0.x, dy=p3.y-p0.y;
    const len=Math.hypot(dx,dy)||1;
    const ux=dx/len, uy=dy/len;
    const px=-uy, py=ux;
    const rnd=seeded(goal.id+'-trunk');
    const o1=(rnd()*0.5-0.25)*len*0.4;
    const o2=(rnd()*0.5-0.25)*len*0.4;
    const p1={x:p0.x+ux*len*0.33+px*o1, y:p0.y+uy*len*0.33+py*o1};
    const p2={x:p0.x+ux*len*0.66+px*o2, y:p0.y+uy*len*0.66+py*o2};
    return {p0,p1,p2,p3};
  }

  function trunkSVG(cp, color, style){
    const P = a => a.x.toFixed(1) + ' ' + a.y.toFixed(1);
    const D = c => 'M' + P(c.p0) + ' C' + P(c.p1) + ' ' + P(c.p2) + ' ' + P(c.p3);
    const path = (c, w, op, dash, cap) =>
      '<path d="' + D(c) + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" opacity="' + op + '"' +
      ' stroke-linecap="' + (cap || 'round') + '" stroke-linejoin="round"' +
      (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' pointer-events="none"/>';
    let body = '';
    switch (style){
      case 'solid':   body = path(cp, 3, 0.9); break;
      case 'dotted':  body = path(cp, 3.6, 0.9, '0.1 8'); break;
      case 'dashdot': body = path(cp, 3, 0.9, '14 7 2 7', 'butt'); break;
      case 'long':    body = path(cp, 3, 0.9, '26 13', 'butt'); break;
      case 'double': {
        const dx = cp.p3.x - cp.p0.x, dy = cp.p3.y - cp.p0.y, L = Math.hypot(dx, dy) || 1;
        const nx = -dy / L * 2.6, ny = dx / L * 2.6;
        const sh = k => ({ p0:{x:cp.p0.x+nx*k,y:cp.p0.y+ny*k}, p1:{x:cp.p1.x+nx*k,y:cp.p1.y+ny*k}, p2:{x:cp.p2.x+nx*k,y:cp.p2.y+ny*k}, p3:{x:cp.p3.x+nx*k,y:cp.p3.y+ny*k} });
        body = path(sh(1), 1.6, 0.9) + path(sh(-1), 1.6, 0.9); break;
      }
      case 'glow':    body = path(cp, 9, 0.16) + path(cp, 2.8, 0.95); break;
      case 'taper':   body = taperedPath(cp.p0, cp.p1, cp.p2, cp.p3, color, 5.2, 1.6, 0.9); break;
      case 'dashed':
      default:        body = path(cp, 3, 0.9, '9 9', 'butt');
    }
    return '<g class="goal-path" data-trunk-style="' + (style || 'dashed') + '">' + body + '</g>';
  }

  function wrapText(str, maxChars){
    const words = String(str).split(/\s+/).filter(Boolean);
    const lines = []; let cur='';
    words.forEach(w=>{
      if ((cur+' '+w).trim().length > maxChars && cur){ lines.push(cur.trim()); cur=w; }
      else cur = (cur+' '+w).trim();
    });
    if (cur) lines.push(cur);
    if (!lines.length) lines.push('');
    if (lines.length > 4){ lines.length = 4; lines[3] = lines[3].slice(0, maxChars-1)+'…'; }
    return lines;
  }

  function taperedPath(p0,p1,p2,p3,color,baseWidth,tipWidth,opacity){
    const SEG = 7;
    let out = '';
    for (let s=0; s<SEG; s++){
      const t0 = s/SEG, t1 = (s+1)/SEG;
      const a = bezierPoint(p0,p1,p2,p3,t0);
      const b = bezierPoint(p0,p1,p2,p3,t1);
      const w = baseWidth + (tipWidth-baseWidth)*((s+0.5)/SEG);
      out += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${color}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" opacity="${opacity}"/>`;
    }
    return out;
  }

  function polyCum(pts){ const c=[0]; for(let i=1;i<pts.length;i++) c.push(c[i-1]+Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y)); return c; }
  function polyPointAt(pts, t){
    const c = polyCum(pts), T = c[c.length-1]*Math.max(0,Math.min(1,t));
    for(let i=1;i<pts.length;i++){
      if (T <= c[i] || i === pts.length-1){
        const seg = (c[i]-c[i-1]) || 1, f = Math.max(0,Math.min(1,(T-c[i-1])/seg));
        return { pt:{ x:pts[i-1].x+(pts[i].x-pts[i-1].x)*f, y:pts[i-1].y+(pts[i].y-pts[i-1].y)*f },
                 angle:Math.atan2(pts[i].y-pts[i-1].y, pts[i].x-pts[i-1].x) };
      }
    }
    return { pt:pts[0], angle:0 };
  }
  function taperedPoly(pts, color, w0, w1, opacity){
    const c = polyCum(pts), tot = c[c.length-1] || 1;
    let out = '';
    for(let i=1;i<pts.length;i++){
      const f = ((c[i-1]+c[i])/2)/tot;
      const w = w0 + (w1-w0)*f;
      out += `<line x1="${pts[i-1].x.toFixed(1)}" y1="${pts[i-1].y.toFixed(1)}" x2="${pts[i].x.toFixed(1)}" y2="${pts[i].y.toFixed(1)}" stroke="${color}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
    }
    return out;
  }
  function applyBranchStyle(geom, style, side){
    if (!style || style === 'organic') return geom;
    const o = geom.originPt, e = geom.end, L = geom.length || 1, dir = geom.dir;
    const dvx = Math.cos(dir), dvy = Math.sin(dir), px = -dvy, py = dvx, sd = side || 1;
    const at = (a,b)=>({ x:o.x+dvx*L*a+px*L*b, y:o.y+dvy*L*a+py*L*b });
    switch(style){
      case 'straight': geom.c1 = at(0.33,0); geom.c2 = at(0.72,0); break;
      case 'curve':    geom.c1 = at(0.22,0.40*sd); geom.c2 = at(0.78,0.40*sd); break;
      case 'wave':     geom.c1 = at(0.25,0.45*sd); geom.c2 = at(0.75,-0.45*sd); break;
      case 'elbow': {
        const horiz = Math.abs(e.x-o.x) >= Math.abs(e.y-o.y);
        geom.poly = [o, horiz ? {x:e.x,y:o.y} : {x:o.x,y:e.y}, e]; break;
      }
      case 'step': {
        const horiz = Math.abs(e.x-o.x) >= Math.abs(e.y-o.y);
        geom.poly = horiz ? [o,{x:(o.x+e.x)/2,y:o.y},{x:(o.x+e.x)/2,y:e.y},e] : [o,{x:o.x,y:(o.y+e.y)/2},{x:e.x,y:(o.y+e.y)/2},e]; break;
      }
      case 'zigzag': {
        const n = 6, amp = Math.min(0.13*L, 13), pts = [o];
        for(let i=1;i<n;i++){ const k = (i%2?1:-1)*sd*amp; const b = at(i/n,0); pts.push({x:b.x+px*k, y:b.y+py*k}); }
        pts.push(e); geom.poly = pts; break;
      }
    }
    return geom;
  }

  function computeTwigGeom(goal, action, originPt, originDir, side, scale){
    if (action.detached) {
      const origin = {x: action.originX, y: action.originY};
      const dir = action.dir;
      const length = action.len;
      const dvx = Math.cos(dir), dvy = Math.sin(dir);
      const perpx = -dvy, perpy = dvx;
      const bend1 = action.bend1 || 0;
      const bend2 = action.bend2 || 0;
      const c1 = { x: origin.x + dvx*length*0.33 + perpx*bend1, y: origin.y + dvy*length*0.33 + perpy*bend1 };
      const c2 = { x: origin.x + dvx*length*0.72 + perpx*bend2, y: origin.y + dvy*length*0.72 + perpy*bend2 };
      const end = { x: origin.x + dvx*length, y: origin.y + dvy*length };
      return { originPt: origin, dir, length, c1, c2, end };
    } else {
      if (typeof action.dir !== 'number' || typeof action.len !== 'number'){
        const rnd = seeded(goal.id+'-'+action.id);
        const angleOff = side*(0.8 + rnd()*0.5);
        const weight = action.weight || 5;
        action.dir = originDir + angleOff;
        action.len = (18 + weight*8) * scale;
        action.bend1 = side*(5+rnd()*9)*scale;
        action.bend2 = side*(-4+rnd()*12)*scale;
      }
      const dir = action.dir;
      const length = action.len;
      const dvx = Math.cos(dir), dvy = Math.sin(dir);
      const perpx = -dvy, perpy = dvx;
      const bend1 = action.bend1||0, bend2 = action.bend2||0;
      const c1 = { x: originPt.x + dvx*length*0.33 + perpx*bend1, y: originPt.y + dvy*length*0.33 + perpy*bend1 };
      const c2 = { x: originPt.x + dvx*length*0.72 + perpx*bend2, y: originPt.y + dvy*length*0.72 + perpy*bend2 };
      const end = { x: originPt.x + dvx*length, y: originPt.y + dvy*length };
      return { originPt, dir, length, c1, c2, end };
    }
  }

  function renderImagesAtNode(cx, cy, images, radius, hitType, hitId, goalId) {
    if (!images || !images.length) return '';
    if (hitType === 'me') {
      const img = images[0];
      const clipId = `me-avatar-clip-${hitId || 'x'}`;
      return `
        <defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${radius}"/></clipPath></defs>
        <image x="${cx - radius}" y="${cy - radius}" width="${radius*2}" height="${radius*2}" href="${img.src}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" data-hit="${hitType}" data-id="${hitId}" data-goalid="${goalId || ''}" data-img="1" data-imgidx="0" style="cursor:pointer;"/>
      `;
    }
    let out = '';
    const count = Math.min(images.length, 6);
    for (let i = 0; i < count; i++) {
      const img = images[i];
      const size = img.size || DEFAULT_IMG_SIZE;
      const angle = (i / count) * Math.PI * 2 - Math.PI/2;
      const offX = Math.cos(angle) * radius * 0.6 + (img.dx || 0);
      const offY = Math.sin(angle) * radius * 0.6 + (img.dy || 0);
      const imgX = cx + offX - size/2;
      const imgY = cy + offY - size/2;
      out += `<image x="${imgX}" y="${imgY}" width="${size}" height="${size}" href="${img.src}" preserveAspectRatio="xMidYMid meet" data-hit="${hitType}" data-id="${hitId}" data-goalid="${goalId || ''}" data-img="1" data-imgidx="${i}" style="cursor:pointer;"/>`;
    }
    if (images.length > 6) {
      out += `<text x="${cx + radius * 0.5}" y="${cy + radius * 0.5 + 5}" text-anchor="middle" font-size="12" fill="${effectiveTextColor()}" stroke="#0a0c18" stroke-width="2" paint-order="stroke">+${images.length-6}</text>`;
    }
    return out;
  }

  /* ========== تابع آیکون هدف/نشانه: عکس > ایموجی > دایره‌ی نرم ========== */
  function nodeIconSVG(cx, cy, r, images, icon, color, hitType, hitId, label, labelOffset, goalId, node, stampTs){
    let content = '';

    if (images && images.length && images[0] && images[0].src){
      const img = images[0];
      const clipId = 'iconclip-' + hitType + '-' + String(hitId || 'x').replace(/[^a-zA-Z0-9_-]/g, '');
      content = '<defs><clipPath id="' + clipId + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath></defs>' +
        '<image x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + (r*2) + '" height="' + (r*2) + '" href="' + img.src + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + clipId + ')" style="pointer-events:none;"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="2" opacity="0.55" style="pointer-events:none;"/>';
    } else if (icon && String(icon).trim()){
      const fontSize = (r * 1.7).toFixed(1);
      content = '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" dy="0.36em" font-size="' + fontSize + '" style="pointer-events:none;user-select:none;font-family:\'Apple Color Emoji\',\'Segoe UI Emoji\',\'Noto Color Emoji\',Vazirmatn,sans-serif;">' + esc(icon) + '</text>';
    } else {
      content = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '" opacity="0.85"/>';
    }

    const hitArea = '<circle data-hit="' + hitType + '" data-id="' + (hitId || '') + '" data-goalid="' + (goalId || '') + '" cx="' + cx + '" cy="' + cy + '" r="' + (r + 8) + '" fill="#fff" fill-opacity="0.001" style="cursor:pointer;pointer-events:all;"/>';

    const n = node || {};
    const labelX = cx + (n.labelDX || 0);
    const labelY = cy + (labelOffset || 0) + (n.labelDY || 0);
    const textColor = effectiveTextColor();
    const fs = n.labelSize || currentLabelSize(hitType, hitId);
    const stamp = (state.showDateStamps !== false || state.showTimeStamps !== false) ? formatStamp(stampTs) : '';
    const stampTspan = stamp ? '<tspan x="' + labelX + '" dy="' + ((+fs*1.15).toFixed(1)) + '" font-size="' + Math.max(9, (+fs)*0.62).toFixed(1) + '" fill-opacity="0.6" direction="ltr">' + esc(stamp) + '</tspan>' : '';

    return content + hitArea + (label
      ? '<text x="' + labelX + '" y="' + labelY + '" text-anchor="middle" class="node-label" font-size="' + fs + '" font-weight="' + (hitType === 'me' ? 700 : 600) + '" data-hit="' + hitType + '" data-id="' + (hitId || '') + '" data-goalid="' + (goalId || '') + '" data-label="1" style="cursor:pointer;" fill="' + textColor + '">' + esc(label) + stampTspan + '</text>'
      : '');
  }

  function nodeWithImages(cx, cy, r, images, color, hitType, hitId, label, labelOffset, goalId, node, stampTs){
    let imgTag = '';
    if (images && images.length) {
      imgTag = renderImagesAtNode(cx, cy, images, r, hitType, hitId, goalId);
    }
    const n = node || {};
    const labelX = cx + (n.labelDX || 0);
    const labelY = cy + (labelOffset || 6) + (n.labelDY || 0);
    const textColor = effectiveTextColor();
    const fillColor = (images && images.length) ? 'transparent' : color;
    const fs = n.labelSize || currentLabelSize(hitType, hitId);
    const stamp = (state.showDateStamps !== false || state.showTimeStamps !== false) ? formatStamp(stampTs) : '';
    const stampTspan = stamp ? `<tspan x="${labelX}" dy="${(+fs*1.15).toFixed(1)}" font-size="${Math.max(9, (+fs)*0.62).toFixed(1)}" fill-opacity="0.6" direction="ltr">${esc(stamp)}</tspan>` : '';
    const isMeWithPhoto = hitType === 'me' && images && images.length;
    return `
      ${isMeWithPhoto ? '' : `<circle data-hit="${hitType}" data-id="${hitId}" data-goalid="${goalId || ''}" cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="${color}" stroke-width="${hitType === 'me' ? 3.5 : 3}" style="cursor:pointer;"/>`}
      ${imgTag}
      ${isMeWithPhoto ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="3.5" style="pointer-events:none;"/>` : ''}
      ${label ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" class="node-label" font-size="${fs}" font-weight="${hitType === 'me' ? 700 : 600}" data-hit="${hitType}" data-id="${hitId}" data-goalid="${goalId || ''}" data-label="1" style="cursor:pointer;" fill="${textColor}">${esc(label)}${stampTspan}</text>` : ''}
    `;
  }

  function reachedFeelingSVG(g){
    const scale = g.feelingScale || 1;
    const boxW = 220 * scale, boxH = 76 * scale;
    const offX = g.feelingOffsetX || 0;
    const offY = g.feelingOffsetY || 0;
    const cx = g.x + offX;
    const cy = g.y + offY;
    const fs = Math.max(12, (state.fontSize || 14) - 2) * scale;
    const labelY = cy - 16 * scale;
    const boxX = cx - boxW/2;
    const boxY = cy + 6 * scale;
    const textColor = effectiveTextColor();
    return `
      <g data-hit="feeling" data-id="${g.id}" style="cursor:pointer;">
        <text x="${cx}" y="${labelY}" text-anchor="middle" class="feeling-label" font-size="${fs}" fill="${textColor}" pointer-events="none">
          حالا که به این هدف رسیده‌ای، چه حسی داری؟
        </text>
        <foreignObject x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" pointer-events="none">
          <div xmlns="http://www.w3.org/1999/xhtml" class="feeling-box" style="font-size:${13*scale}px;">
            <textarea class="feeling-textarea" data-goalid="${g.id}" placeholder="همین‌جا بنویسش..." style="color:${textColor};font-size:${13*scale}px;">${esc(g.feeling||'')}</textarea>
          </div>
        </foreignObject>
        <circle cx="${cx}" cy="${boxY + boxH/2}" r="${70*scale}" fill="#fff" fill-opacity="0.001" pointer-events="all"/>
      </g>
    `;
  }

  function branchesSVG(goal, trunkOnly){
    const cp = trunkControlPoints(goal);
    let out = isRingHost(goal)
      ? `<g class="ring-stem">${taperedPath(cp.p0,cp.p1,cp.p2,cp.p3,goal.color||RING_COLOR,3.2,1.6,0.6)}</g>`
      : trunkSVG(cp, goal.color, effTrunkStyle(goal));
    const n = goal.actions.length;
    if (!trunkOnly) goal.actions.forEach((a,i)=>{
      const t = Math.min(0.9, 0.15 + i*0.09);
      const originPt = bezierPoint(cp.p0,cp.p1,cp.p2,cp.p3,t);
      const originDir = bezierTangentAngle(cp.p0,cp.p1,cp.p2,cp.p3,t);
      const side = i%2===0 ? 1 : -1;
      out += twigRecursive(goal, originPt, originDir, a, side, 1);
    });
    return out;
  }

  function twigRecursive(goal, originPt, originDir, action, side, scale){
    const weight = action.weight || 5;
    const color = action.color || goal.color;
    const geom = computeTwigGeom(goal, action, originPt, originDir, side, scale);
    applyBranchStyle(geom, effStyle(goal, action), side);
    const { c1, c2, end } = geom;
    actionGeomMap.set(action.id, { goalId: goal.id, originPt: geom.originPt, end, scale });

    const baseWidth = Math.max(1, (1.9 + weight*1.05) * scale);
    const tipWidth = Math.max(0.7, baseWidth*0.38);

    const goalNode = findHost(goal.id);
    const isPruned = goalNode && goalNode.lastActivity &&
                     (Date.now() - goalNode.lastActivity) > 30 * 86400000;
    const twigClass = isPruned ? 'pruned-twig' : '';

    let out = `<g class="${twigClass}"><title>${esc(action.text||'(بدون توضیح)')} — قطر ${weight}</title>`;
    out += geom.poly ? taperedPoly(geom.poly, color, baseWidth, tipWidth, 0.92) : taperedPath(geom.originPt, c1, c2, end, color, baseWidth, tipWidth, 0.92);
    out += footprintsSVG(goal, action, geom, color, scale);

    const handleR = Math.max(15, 18*scale);
    out += `<circle data-hit="action" data-goalid="${goal.id}" data-id="${action.id}" cx="${end.x}" cy="${end.y}" r="${handleR}" fill="#fff" fill-opacity="0.001" style="cursor:pointer;pointer-events:all;"/>`;

    const kids = action.children || [];
    let childrenSvg = '';
    if (kids.length){
      out += `<circle cx="${end.x}" cy="${end.y}" r="${Math.max(2, 2.6*scale)}" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.55"/>`;
      kids.forEach((child,i)=>{
        const cSide = i%2===0 ? 1 : -1;
        const tt = 0.5 + ((i+1)/(kids.length+1))*0.45;
        let childOrigin, childDir;
        if (geom.poly){ const q = polyPointAt(geom.poly, tt); childOrigin = q.pt; childDir = q.angle; }
        else { childOrigin = bezierPoint(geom.originPt,c1,c2,end,tt); childDir = bezierTangentAngle(geom.originPt,c1,c2,end,tt); }
        childrenSvg += twigRecursive(goal, childOrigin, childDir, child, cSide, scale*0.72);
      });
    } else {
      const radius = Math.max(1.8, 2 + weight * 0.28 * scale);
      if (action.images && action.images.length) {
        const count = Math.min(action.images.length, 3);
        for (let i = 0; i < count; i++) {
          const imgEntry = action.images[i];
          const imgSize = imgEntry.size || DEFAULT_IMG_SIZE;
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const offX = Math.cos(angle) * radius * 0.7 + (imgEntry.dx || 0);
          const offY = Math.sin(angle) * radius * 0.7 + (imgEntry.dy || 0);
          const imgX = end.x + offX - imgSize / 2;
          const imgY = end.y + offY - imgSize / 2;
          out += `<image x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" href="${imgEntry.src}" preserveAspectRatio="xMidYMid meet" data-hit="action" data-goalid="${goal.id}" data-id="${action.id}" data-img="1" data-imgidx="${i}" style="cursor:pointer;"/>`;
        }
        if (action.images.length > 3) {
          out += `<text x="${end.x + radius * 0.7}" y="${end.y + radius * 0.7 + 4}" text-anchor="middle" font-size="10" fill="${effectiveTextColor()}" stroke="#0a0c18" stroke-width="2" paint-order="stroke">+${action.images.length - 3}</text>`;
        }
      } else {
        /* سرِ شاخه: یک نقطه‌ی ساده و تمیز؛ برای «کار روتین» یک حلقه‌ی پیشرفت هفتگی دور آن */
        out += `<circle cx="${end.x}" cy="${end.y}" r="${radius}" fill="${color}" pointer-events="none"/>`;
        if (action.isRoutine) out += routineTipSVG(action, end.x, end.y, radius, color, scale);
      }
    }
    out += `</g>` + childrenSvg;

    const lines = wrapText(action.text, Math.max(10, Math.round(18*Math.min(1,scale+0.35))));
    const anchor = side>0 ? 'start' : 'end';
    const labelX = end.x + (side>0 ? 8 : -8) + (action.labelDX || 0);
    const labelYBase = end.y + 4 + (action.labelDY || 0);
    const fsize = action.labelSize || currentLabelSize('action', action.id);
    const textColor = effectiveTextColor();
    let text = `<text data-hit="action" data-goalid="${goal.id}" data-id="${action.id}" data-label="1" x="${labelX}" y="${labelYBase}" text-anchor="${anchor}" class="branch-label" font-size="${(+fsize).toFixed(1)}" fill="${textColor}">`;
    lines.forEach((line,i)=>{
      text += `<tspan x="${labelX}" dy="${i===0?0:16}">${esc(line)}</tspan>`;
    });
    const stamp = (state.showDateStamps !== false || state.showTimeStamps !== false) ? formatStamp(action.createdAt) : '';
    if (stamp){
      text += `<tspan x="${labelX}" dy="16" font-size="${Math.max(9, (+fsize)*0.62).toFixed(1)}" fill-opacity="0.6" direction="ltr">${esc(stamp)}</tspan>`;
    }
    text += `</text>`;
    out += text;

    return out;
  }

  let revealGoalId = null;
  function countAllActions(list){
    return (list || []).reduce((n, a) => n + 1 + countAllActions(a.children), 0);
  }
  function toggleGoalCollapse(id, force){
    const g = findHost(id);
    if (!g) return;
    g.collapsed = (typeof force === 'boolean') ? force : !g.collapsed;
    if (!g.collapsed) revealGoalId = g.id;
    render();
  }
  function updateCollapseAllBtn(){
    const btn = document.getElementById('collapse-all-btn');
    if (!btn) return;
    const withBranches = state.goals.filter(g => goalBranchCount(g));
    const orphanBr = state.rings.filter(r => ringIsOrphan(r) && r.actions && r.actions.length);
    btn.style.display = (withBranches.length || orphanBr.length) ? '' : 'none';
    const anyOpen = withBranches.some(g => !g.collapsed) || orphanBr.some(r => !r.collapsed);
    btn.dataset.mode = anyOpen ? 'collapse' : 'expand';
    const lbl = btn.querySelector('.lbl');
    if (lbl) lbl.textContent = anyOpen ? 'جمع همه' : 'باز همه';
    btn.classList.toggle('is-collapsed', !anyOpen);
  }
  function goalShutterSVG(g, r){
    const n = goalBranchCount(g);
    if (!n) return '';
    const cx = g.x, cy = g.y + r + 15;
    const col = g.color;
    const num = n.toLocaleString('fa-IR');
    const open = !g.collapsed;
    const tc = effectiveTextColor();
    const chev = open ? 'M-4 1.8 L0 -2.2 L4 1.8' : 'M-4 -1.8 L0 2.2 L4 -1.8';
    return `<g class="goal-shutter ${open ? 'is-open' : 'is-closed'}" data-goal-toggle="${g.id}" style="cursor:pointer;">
      <title>${open ? 'جمع کردن مسیر' : 'باز کردن مسیر'} (${num} شاخه)</title>
      <rect x="${cx-34}" y="${cy-19}" width="68" height="38" rx="14" fill="#fff" fill-opacity="0.001"/>
      <rect class="gs-pill" x="${cx-27}" y="${cy-11}" width="54" height="22" rx="11"
            fill="${open ? 'none' : col}" fill-opacity="${open ? 0 : 0.92}" stroke="${col}" stroke-width="1.6" stroke-opacity="${open ? 0.75 : 1}"/>
      <path d="${chev}" transform="translate(${cx-14},${cy})" fill="none" stroke="${open ? tc : '#1b1400'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${open ? 0.75 : 0.95}"/>
      <text x="${cx+7}" y="${cy+4.3}" text-anchor="middle" font-size="12" font-weight="700" fill="${open ? tc : '#1b1400'}" fill-opacity="${open ? 0.8 : 1}" style="pointer-events:none;">${num}</text>
    </g>`;
  }
  let focusGoalId = null;
  let camAnimId = 0;
  function animateCamTo(t, ms){
    cancelAnimationFrame(camAnimId);
    ms = ms || 520;
    const s0 = { x:cam.x, y:cam.y, scale:cam.scale };
    const t0 = performance.now();
    (function step(now){
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      cam.x = s0.x + (t.x - s0.x) * e;
      cam.y = s0.y + (t.y - s0.y) * e;
      cam.scale = s0.scale + (t.scale - s0.scale) * e;
      applyCam();
      if (k < 1) camAnimId = requestAnimationFrame(step);
    })(t0);
  }
  function viewForPoints(pts, maxScale){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    pts.forEach(p=>{ x0=Math.min(x0,p.x-p.r); y0=Math.min(y0,p.y-p.r); x1=Math.max(x1,p.x+p.r); y1=Math.max(y1,p.y+p.r); });
    const W = window.innerWidth, H = window.innerHeight - 190;
    const sc = Math.max(0.12, Math.min(maxScale || 1.2, Math.min(W/(x1-x0), H/(y1-y0))));
    return { scale: sc, x: W/2 - ((x0+x1)/2)*sc, y: 70 + H/2 - ((y0+y1)/2)*sc };
  }
  function goalPoints(g){
    const pts = [{x:g.x, y:g.y, r:(g.radius||20)+70}];
    if (!g.collapsed){
      (function walk(list){ (list||[]).forEach(a=>{ const e = actionGeomMap.get(a.id); if (e && e.end) pts.push({x:e.end.x, y:e.end.y, r:80}); walk(a.children); }); })(g.actions);
    }
    return pts;
  }
  function focusGoal(id){
    const g = findHost(id);
    if (!g) return;
    focusGoalId = id;
    g.collapsed = false;
    revealGoalId = id;
    render();
    animateCamTo(viewForPoints(goalPoints(g), 1.4));
    const h = document.getElementById('hint'); if (h) h.style.display = 'none';
  }
  function exitFocus(){
    focusGoalId = null;
    render();
    fitAllView();
  }
  function goalPower(g){
    const w = (function sumW(list){ return (list||[]).reduce((s,a)=> s + (a.weight||0) + sumW(a.children), 0); })(g.actions);
    return Math.min(100, w*3);
  }
  function toggleRingsCollapse(force){
    state.ringsCollapsed = (typeof force === 'boolean') ? force : !state.ringsCollapsed;
    render();
  }
  function ringsShutterSVG(){
    const n = state.rings.length;
    if (!n) return '';
    const open = !state.ringsCollapsed;
    const col = RING_COLOR;
    const cx = state.me.x, cy = state.me.y + (state.me.radius || 34) + 58;
    const num = n.toLocaleString('fa-IR');
    const tc = effectiveTextColor();
    const chev = open ? 'M-4 1.8 L0 -2.2 L4 1.8' : 'M-4 -1.8 L0 2.2 L4 -1.8';
    return `<g class="goal-shutter ${open ? 'is-open' : 'is-closed'}" data-rings-toggle="1" style="cursor:pointer;">
      <title>${open ? 'جمع کردن' : 'باز کردن'} نشانه‌های نزدیکی (${num})</title>
      <rect x="${cx-48}" y="${cy-19}" width="96" height="38" rx="14" fill="#fff" fill-opacity="0.001"/>
      <rect class="gs-pill" x="${cx-42}" y="${cy-11}" width="84" height="22" rx="11"
            fill="${open ? 'none' : col}" fill-opacity="${open ? 0 : 0.92}" stroke="${col}" stroke-width="1.6" stroke-dasharray="${open ? '4 3' : 'none'}"/>
      <path d="${chev}" transform="translate(${cx-30},${cy})" fill="none" stroke="${open ? tc : '#04201c'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>
      <text x="${cx+8}" y="${cy+4.2}" text-anchor="middle" font-size="11" font-weight="700" fill="${open ? tc : '#04201c'}" style="pointer-events:none;">نزدیکی ${num}</text>
    </g>`;
  }
  function fitAllView(){
    const pts = [{x:state.me.x, y:state.me.y, r:(state.me.radius||34)+60}];
    state.goals.forEach(g=>{ goalPoints(g).forEach(p=>pts.push(p)); });
    if (!state.ringsCollapsed) state.rings.forEach(r=>{ pts.push({x:r.x,y:r.y,r:(r.radius||30)+30}); (function walk(list){ (list||[]).forEach(a=>{ const e = actionGeomMap.get(a.id); if (e && e.end) pts.push({x:e.end.x,y:e.end.y,r:80}); walk(a.children); }); })(r.actions); });
    animateCamTo(viewForPoints(pts, 1.2));
  }
  function pickGoalSpot(){
    const R = 210 + Math.min(state.goals.length, 12) * 12;
    let best = null;
    for (let i=0;i<48;i++){
      const a = (i/48)*Math.PI*2;
      const x = state.me.x + Math.cos(a)*R, y = state.me.y + Math.sin(a)*R;
      let d = 1e9;
      state.goals.forEach(g=>{ d = Math.min(d, Math.hypot(g.x-x, g.y-y)); });
      if (!best || d > best.d) best = {x,y,d};
    }
    return best;
  }
  /* خطِ اتصالِ «نشانه‌ی نزدیکی» به هدفش روی نقشه */
  function ringLinkSVG(g, r){
    const col = r.color || RING_COLOR;
    const dx = r.x - g.x, dy = r.y - g.y, d = Math.hypot(dx, dy) || 1;
    const ux = dx/d, uy = dy/d;
    const x1 = g.x + ux*((g.radius||20)+6), y1 = g.y + uy*((g.radius||20)+6);
    const x2 = r.x - ux*((r.radius||30)+6), y2 = r.y - uy*((r.radius||30)+6);
    const mx = (x1+x2)/2 - uy*d*0.12, my = (y1+y2)/2 + ux*d*0.12;
    return `<path class="ring-link" d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round" opacity="0.6" pointer-events="none"/>`;
  }
  function collapsedLinkSVG(g){
    return `<line x1="${state.me.x}" y1="${state.me.y}" x2="${g.x}" y2="${g.y}" stroke="${g.color}" stroke-width="1.2" stroke-dasharray="3 6" stroke-linecap="round" opacity="0.28" pointer-events="none"/>`;
  }

  function render(){
    let html = '';
    actionGeomMap = new Map();
    autoLinkRings();

    if (focusGoalId && !state.goals.some(x=>x.id===focusGoalId)) focusGoalId = null;
    state.goals.forEach(g=>{
      const cls = [ (revealGoalId === g.id) ? 'np-reveal' : '', (focusGoalId === g.id) ? 'is-focus' : '' ].filter(Boolean).join(' ');
      const clsAttr = cls ? ` class="${cls}"` : '';
      /* جمع‌شده: مسیر (تنه) می‌ماند، فقط شاخه‌ها و زیرشاخه‌ها پنهان می‌شوند */
      html += `<g data-goal-branches="${g.id}"${clsAttr}>${branchesSVG(g, !!(g.collapsed && g.actions.length))}</g>`;
    });
    if (!state.ringsCollapsed) state.rings.forEach(r=>{
      const lg = r.goalId && state.goals.find(x=>x.id===r.goalId);
      if (lg) html += ringLinkSVG(lg, r);
    });
    if (!state.ringsCollapsed) state.rings.forEach(r=>{
      if (r.actions && r.actions.length){
        const lgR = r.goalId && state.goals.find(x=>x.id===r.goalId);
        html += `<g data-goal-branches="${r.id}">${branchesSVG(Object.assign(r,{color:r.color||RING_COLOR}), !!(r.collapsed || (lgR && lgR.collapsed)))}</g>`;
      }
    });
    revealGoalId = null;

    const textColor = effectiveTextColor();
    const fs = Math.max(14, state.fontSize || 14);

    const mx = state.me.x, my = state.me.y;
    const meR = state.me.radius || 34;
    const userState = getUserFrequencyState();
    const userBand = FREQ_BANDS[userState.band] || FREQ_BANDS.delta;

    html += userAuraSVG(mx, my, meR, userState);
    html += haloSVG(mx, my, userBand.color, meR, 1, userState.band);

    const meColor = state.me.color || userBand.color;
    if (!state.me.images || !state.me.images.length){
      html += `<circle data-hit="me" cx="${mx}" cy="${my}" r="${meR}"
                       fill="${meColor}" stroke="${meColor}" stroke-width="3.5"
                       style="cursor:pointer;"/>`;
      html += addPhotoPlaceholderSVG(mx, my, meR, effectiveTextColor());
      html += `<text x="${mx}" y="${my + meR*0.62}" text-anchor="middle"
                    font-size="${Math.max(9, (state.fontSize||14) - 4)}"
                    font-weight="${700}" fill="${effectiveTextColor()}"
                    data-hit="me" data-label="1" style="cursor:pointer;">${esc(state.me.name)}</text>`;
    } else {
      html += nodeWithImages(mx, my, meR, state.me.images, meColor, 'me', '', state.me.name, 6, '', state.me);
    }

    html += userBandBadgeSVG(mx, my, meR, userState);

    /* اهداف */
    state.goals.forEach(g=>{
      const r = g.radius || 20;
      html += `<g class="gnode${focusGoalId === g.id ? ' is-focus' : ''}" data-gn="${g.id}">`;
      html += haloSVG(g.x, g.y, g.color, r, 1, g.freq);
      html += nodeIconSVG(g.x, g.y, r, g.images, g.icon, g.color, 'goal', g.id, g.name, -(r + 22), '', g, g.createdAt);

      const freq = getFreq(g);
      const weightSum = (function sumW(list){
        return (list || []).reduce((s, a) => s + (a.weight || 0) + sumW(a.children), 0);
      })(g.actions);
      const circuitPower = Math.min(100, weightSum * 3);
      const hasBranches = g.actions && g.actions.length;
      const hudY = g.y + r + (hasBranches ? 46 : 42);
      html += `<text class="goal-hud" x="${g.x}" y="${hudY}" text-anchor="middle">
        ${g.collapsed && hasBranches ? `رشد ${circuitPower}٪` : `${freq.label} — ${freq.desc} · رشد ${circuitPower}٪`}
      </text>`;
      html += goalShutterSVG(g, r);
      if (g.reached){
        html += reachedFeelingSVG(g);
      }
      html += `</g>`;
    });

    (state.ringsCollapsed ? [] : state.rings).forEach(r=>{
      html += '<g class="rnode">';
      const rad = r.radius || 30;
      const ringColor = r.color || RING_COLOR;
      html += haloSVG(r.x, r.y, ringColor, rad, 1.2);
      html += nodeIconSVG(r.x, r.y, rad, r.images, r.icon, ringColor, 'ring', r.id, '', 0, '', r);
      if (r.label){
        const lines = wrapText(r.label, 16);
        let lx = r.x + (r.labelDX || 0);
        let ly = r.y - (rad + 20) + (r.labelDY || 0);
        const fsize = r.labelSize || currentLabelSize('ring', r.id);
        let text = `<text data-hit="ring" data-id="${r.id}" data-label="1" x="${lx}" y="${ly}" text-anchor="middle" class="feeling-label" font-size="${fsize}" font-weight="700" style="cursor:pointer;fill:${ringColor};" fill="${ringColor}">`;
        lines.forEach((line,i)=>{
          text += `<tspan x="${lx}" dy="${i===0?0:16}">${esc(line)}</tspan>`;
        });
        text += `</text>`;
        html += text;
      }
      if (r.note){
        const lines = wrapText(r.note, 22);
        let ly = r.y + rad + 18;
        let text = `<text x="${r.x}" y="${ly}" text-anchor="middle" class="branch-label" font-size="${fs-3}" fill="${textColor}">`;
        lines.forEach((line,i)=>{
          text += `<tspan x="${r.x}" dy="${i===0?0:16}">${esc(line)}</tspan>`;
        });
        text += `</text>`;
        html += text;
      }
      html += '</g>';
    });

    viewport.innerHTML = html;
    svg.classList.toggle('focus-on', !!focusGoalId);
    (function(){
      const pill = document.getElementById('focus-pill');
      if (!pill) return;
      const fg = focusGoalId && findHost(focusGoalId);
      pill.classList.toggle('show', !!fg);
      if (fg) document.getElementById('fp-name').textContent = 'تمرکز: ' + fg.name;
    })();
    updateCollapseAllBtn();
    scheduleMapSave();
  }

  let renderDebounceTimer = null;
  function debouncedRender(){
    clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(render, 220);
  }

  /* ---------------- modals ---------------- */
  const goalOverlay = document.getElementById('goal-modal-overlay');
  const goalNameInput = document.getElementById('goal-name-input');
  const goalIconInput = document.getElementById('goal-icon-input');
  const goalColorInput = document.getElementById('goal-color-input');
  const swatchesWrap = document.getElementById('goal-swatches');

  PALETTE.forEach(c=>{
    const sw = document.createElement('div');
    sw.className='swatch'; sw.style.background=c;
    sw.addEventListener('click', ()=>{
      goalColorInput.value = c;
      [...swatchesWrap.children].forEach(x=>x.classList.remove('active'));
      sw.classList.add('active');
    });
    swatchesWrap.appendChild(sw);
  });

  document.addEventListener('maghz-add-goal', ()=>{
    goalNameInput.value='';
    goalIconInput.value = '🎯';
    goalColorInput.value = PALETTE[Math.floor(Math.random()*PALETTE.length)];
    goalOverlay.classList.remove('hidden');
    setTimeout(()=>goalNameInput.focus(), 50);
  });
  document.getElementById('goal-cancel-btn').addEventListener('click', ()=>{
    goalOverlay.classList.add('hidden');
    if (window.__reopenGoalsSheet) window.__reopenGoalsSheet();
  });
  document.getElementById('goal-create-btn').addEventListener('click', ()=>{
    const name = goalNameInput.value.trim();
    if (!name) { goalNameInput.focus(); return; }
    const iconVal = (goalIconInput.value || '').trim() || '🎯';
    const spot = pickGoalSpot();
    state.goals.push({
      id: uid(), name, color: goalColorInput.value,
      x: spot.x,
      y: spot.y,
      icon: iconVal,
      actions: [], reached:false, feeling:'', radius:20,
      feelingOffsetX: 0, feelingOffsetY: 0,
      images: [], createdAt: Date.now()
    });
    goalOverlay.classList.add('hidden');
    render();
    if (window.__reopenGoalsSheet) window.__reopenGoalsSheet();
  });

  document.getElementById('add-ring-btn').addEventListener('click', ()=>{
    const act = state.goals.filter(g=>!g.reached);
    const finish = (g)=>{
      state.ringsCollapsed = false;
      if (g){
        const nr = createRingForGoal(g); g.collapsed = false; g.lastActivity = Date.now();
        render();
        if (typeof toast === 'function') toast('نشانه‌ی نزدیکی به «' + (g.name || 'هدف') + '» وصل شد');
      } else {
        const rnd = Math.random()*40-20;
        state.rings.push({
          id: uid(), label:'نزدیک شدن به هدف', color: RING_COLOR,
          x: state.me.x + rnd, y: state.me.y + 130,
          radius: 30, note: '', images: [], icon: '🌟',
          actions: [], collapsed:false, logs:{}, lastActivity: Date.now(), branchStyle:'organic'
        });
        render();
      }
    };
    if (act.length > 1) pickGoalDialog('این نشانه‌ی نزدیکی زیر کدام هدف باشد؟', gid=>{ finish(state.goals.find(x=>x.id===gid)); });
    else if (act.length === 1) finish(act[0]);
    else finish(null);
  });

  const settingsOverlay = document.getElementById('settings-modal-overlay');
  const settingsTextColor = document.getElementById('settings-text-color');
  const settingsFontSize = document.getElementById('settings-font-size');
  const settingsFontSizeVal = document.getElementById('settings-font-size-val');
  const settingsSwatches = document.getElementById('settings-swatches');
  const settingsShowDates = document.getElementById('settings-show-dates');
  const settingsShowTimes = document.getElementById('settings-show-times');
  const settingsShowEmotionWidget = document.getElementById('settings-show-emotion-widget');
  let settingsTrunkStyle = 'dashed';

  PALETTE.forEach(c=>{
    const sw = document.createElement('div');
    sw.className='swatch'; sw.style.background=c;
    sw.addEventListener('click', ()=>{
      settingsTextColor.value = c;
      [...settingsSwatches.children].forEach(x=>x.classList.remove('active'));
      sw.classList.add('active');
    });
    settingsSwatches.appendChild(sw);
  });

  settingsFontSize.addEventListener('input', ()=>{
    settingsFontSizeVal.textContent = settingsFontSize.value;
  });

  document.getElementById('settings-btn').addEventListener('click', ()=>{
    settingsTextColor.value = effectiveTextColor();
    settingsFontSize.value = state.fontSize || 14;
    settingsFontSizeVal.textContent = settingsFontSize.value;
    settingsShowDates.checked = state.showDateStamps !== false;
    if (settingsShowTimes) settingsShowTimes.checked = state.showTimeStamps !== false;
    settingsShowEmotionWidget.checked = state.showEmotionWidget !== false;
    settingsTrunkStyle = effTrunkStyle(null);
    buildTrunkPicker(document.getElementById('settings-trunk-style-picker'), settingsTrunkStyle, false, v=>{ settingsTrunkStyle = v; });
    try{
      const info = (window.getProfileInfo && window.getProfileInfo()) || {name:'', email:''};
      document.getElementById('settings-profile-name').value = info.name;
      document.getElementById('settings-account-email').textContent = info.email || '—';
      if(window.getProfileEmail){
        window.getProfileEmail().then(function(em){
          if(em) document.getElementById('settings-account-email').textContent = em;
        });
      }
    }catch(e){}
    settingsOverlay.classList.remove('hidden');
  });
  document.getElementById('settings-cancel-btn').addEventListener('click', ()=>{
    settingsOverlay.classList.add('hidden');
  });
  document.getElementById('settings-save-btn').addEventListener('click', ()=>{
    state.textColor = settingsTextColor.value;
    state.fontSize = +settingsFontSize.value;
    state.showDateStamps = !!settingsShowDates.checked;
    if (settingsShowTimes) state.showTimeStamps = !!settingsShowTimes.checked;
    state.showEmotionWidget = !!settingsShowEmotionWidget.checked;
    state.trunkStyle = TRUNK_STYLES[settingsTrunkStyle] ? settingsTrunkStyle : 'dashed';
    try{
      if(window.setProfileName) window.setProfileName(document.getElementById('settings-profile-name').value);
    }catch(e){}
    applyEmotionWidgetVisibility();
    scheduleMapSave();
    settingsOverlay.classList.add('hidden');
    render();
    try{
      document.documentElement.style.setProperty('--ink', state.textColor);
      document.documentElement.style.setProperty('--app-font-scale', (state.fontSize/14));
      localStorage.setItem('appAppearance', JSON.stringify({textColor: state.textColor, fontSize: state.fontSize}));
    }catch(e){}
  });

  const helpOverlay = document.getElementById('help-modal-overlay');
  document.getElementById('help-btn').addEventListener('click', ()=> helpOverlay.classList.remove('hidden'));
  document.getElementById('help-close-btn').addEventListener('click', ()=> helpOverlay.classList.add('hidden'));

  /* ---------------- side panel ---------------- */
  const panel = document.getElementById('panel');
  const panelTitle = document.getElementById('panel-title');
  const panelDot = document.getElementById('panel-dot');
  const panelName = document.getElementById('panel-name');
  const panelColor = document.getElementById('panel-color');
  const panelNameColorWrap = document.getElementById('panel-name-color-wrap');
  const panelIconWrap = document.getElementById('panel-icon-wrap');
  const panelIcon = document.getElementById('panel-icon');
  const panelNote = document.getElementById('panel-note');
  const panelGoalOnly = document.getElementById('panel-goal-only');
  const panelRingOnly = document.getElementById('panel-ring-only');
  const panelRingNote = document.getElementById('panel-ring-note');
  const panelRingColor = document.getElementById('panel-ring-color');
  const panelActionOnly = document.getElementById('panel-action-only');
  const panelActionText = document.getElementById('panel-action-text');
  const panelActionColor = document.getElementById('panel-action-color');
  const panelActionWeight = document.getElementById('panel-action-weight');
  const panelActionWeightVal = document.getElementById('panel-action-weight-val');
  const panelDeleteBtn = document.getElementById('panel-delete-btn');
  const actionsListEl = document.getElementById('panel-actions-list');
  const panelActionChildrenListEl = document.getElementById('panel-action-children-list');

  const panelImageInput = document.getElementById('panel-image-input');

  function buildPanelSwatches(container, colorInput){
    if (!container) return;
    container.innerHTML = '';
    PALETTE.forEach(c=>{
      const sw = document.createElement('div');
      sw.className = 'swatch';
      sw.style.background = c;
      sw.dataset.color = c;
      sw.addEventListener('click', ()=>{
        colorInput.value = c;
        [...container.children].forEach(x=>x.classList.remove('active'));
        sw.classList.add('active');
      });
      container.appendChild(sw);
    });
  }
  function syncPanelSwatches(container, activeColor){
    if (!container) return;
    const norm = (activeColor||'').toLowerCase();
    let matched = false;
    [...container.children].forEach(x=>{
      const isMatch = x.dataset.color.toLowerCase() === norm;
      x.classList.toggle('active', isMatch);
      if (isMatch) matched = true;
    });
    if (!matched) [...container.children].forEach(x=>x.classList.remove('active'));
  }

  const panelColorSwatches       = document.getElementById('panel-color-swatches');
  const panelRingColorSwatches   = document.getElementById('panel-ring-color-swatches');
  const panelActionColorSwatches = document.getElementById('panel-action-color-swatches');
  buildPanelSwatches(panelColorSwatches,       panelColor);
  buildPanelSwatches(panelRingColorSwatches,   panelRingColor);
  buildPanelSwatches(panelActionColorSwatches, panelActionColor);

  function liveRingPreview(){
    if (!panelTarget || panelTarget.type !== 'ring') return;
    const r = state.rings.find(x=>x.id===panelTarget.id);
    if (!r) return;
    r.label = panelName.value.trim() || r.label;
    r.color = panelColor.value || r.color;
    r.note = panelRingNote.value;
    r.icon = (panelIcon.value || '').trim() || '🌟';
    panelDot.style.background = r.color;
    debouncedRender();
  }
  panelName.addEventListener('input', liveRingPreview);
  panelColor.addEventListener('input', liveRingPreview);
  panelRingNote.addEventListener('input', liveRingPreview);
  panelIcon.addEventListener('input', liveRingPreview);
  panelColorSwatches.addEventListener('click', ()=> setTimeout(liveRingPreview, 0));
  svg.addEventListener('pointerdown', ()=>{ const h = document.getElementById('hint'); if (h) h.style.display = 'none'; }, {once:true});

  const panelImageContainer = document.getElementById('panel-image-preview-container');
  let currentImages = [];

  function updateImagePreviews(images){
    currentImages = images || [];
    panelImageContainer.innerHTML = '';
    if (currentImages.length) {
      currentImages.forEach((entry, idx) => {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.display = 'inline-block';
        const img = document.createElement('img');
        img.src = entry.src;
        img.className = 'img-thumb';
        const del = document.createElement('button');
        del.className = 'del';
        del.textContent = '✕';
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          currentImages.splice(idx, 1);
          updateImagePreviews(currentImages);
        });
        div.appendChild(img);
        div.appendChild(del);
        panelImageContainer.appendChild(div);
      });
    }
  }

  panelImageInput.addEventListener('change', async (e)=>{
    const files = Array.from(e.target.files || []);
    panelImageInput.value = '';
    if (!files.length) return;
    const srcs = await cropImages(files);
    if (!srcs.length) return;
    srcs.forEach(src=> currentImages.push({ src, size: DEFAULT_IMG_SIZE }));
    updateImagePreviews(currentImages);
  });

  let panelTarget = null;
  let currentPanelGoalId = null;
  let currentEditingAction = null;

  const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  function toFa(n){ return String(n).split('').map(d=> faDigits[+d] ?? d).join(''); }
  function formatStamp(ts){
    if (!ts) return '';
    try{
      const d = new Date(ts);
      const parts = [];
      if (state.showDateStamps !== false) parts.push(d.toLocaleDateString('fa-IR'));
      if (state.showTimeStamps !== false) parts.push(d.toLocaleTimeString('fa-IR', { hour:'2-digit', minute:'2-digit' }));
      return parts.join(' - ');
    }catch(e){ return ''; }
  }

  const BS_THUMB = {
    '':'M6 32 L58 8',
    organic:'M6 32 C18 34 22 12 36 20 S52 14 58 8',
    straight:'M6 32 L58 8',
    curve:'M6 32 Q14 4 58 8',
    wave:'M6 32 C22 6 40 42 58 8',
    elbow:'M6 32 L58 32 L58 8',
    step:'M6 32 L32 32 L32 8 L58 8',
    zigzag:'M6 32 L18 14 L28 30 L40 12 L50 28 L58 8'
  };
  (function(){
    const st = document.createElement('style');
    st.textContent = '.bs-picker{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0 4px;}'+
      '.bs-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:58px;padding:5px 2px;border-radius:12px;border:1.5px solid var(--panel-border);background:var(--input-bg);color:var(--text-main);font-family:inherit;font-size:11px;cursor:pointer;}'+
      '.bs-opt svg{width:46px;height:30px;}.bs-opt svg path{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;}'+
      '.bs-opt svg circle{fill:var(--accent);}'+
      '.bs-opt.on{border-color:var(--accent);background:rgba(244,197,66,.16);font-weight:700;}'+
      '.bs-opt:focus-visible{outline:3px solid var(--accent);outline-offset:2px;}'+
      '.bs-opt:active{transform:scale(.97);}'+
      '@media (prefers-reduced-motion:reduce){.bs-opt:active{transform:none;}}';
    document.head.appendChild(st);
  })();
  function buildStylePicker(el, current, allowInherit, onPick){
    if (!el) return;
    const keys = (allowInherit ? [''] : []).concat(Object.keys(BRANCH_STYLES));
    const name = k => k === '' ? 'مثل مجموعه' : BRANCH_STYLES[k];
    el.className = 'bs-picker';
    el.setAttribute('role','radiogroup');
    el.setAttribute('aria-label','شکل شاخه');
    el.innerHTML = keys.map(k=>{
      const on = k === current;
      return `<button type="button" class="bs-opt${on?' on':''}" role="radio" aria-checked="${on}" tabindex="${on?0:-1}" data-bs="${k}" aria-label="${name(k)}">`+
        `<svg viewBox="0 0 64 40" aria-hidden="true"><path d="${BS_THUMB[k]}"${k===''?' stroke-dasharray="4 4"':''}/><circle cx="58" cy="8" r="3.6"/></svg><span>${name(k)}</span></button>`;
    }).join('');
    const pick = b=>{
      el.querySelectorAll('.bs-opt').forEach(x=>{ const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
      onPick(b.dataset.bs);
    };
    el.onclick = e=>{ const b = e.target.closest('.bs-opt'); if (b) pick(b); };
    el.onkeydown = e=>{
      const k = e.key;
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)) return;
      const btns = Array.from(el.querySelectorAll('.bs-opt'));
      let i = btns.indexOf(document.activeElement); if (i < 0) i = btns.findIndex(x=>x.classList.contains('on'));
      const rtl = getComputedStyle(el).direction === 'rtl';
      const fwd = (k === 'ArrowDown') || (k === (rtl ? 'ArrowLeft' : 'ArrowRight'));
      const nb = btns[(i + (fwd ? 1 : -1) + btns.length) % btns.length];
      e.preventDefault(); nb.focus(); pick(nb);
    };
  }
  /* ---- انتخابگر نوع خط مسیر اهداف ---- */
  const TRUNK_THUMB = {
    solid:   '<path d="M6 32 L58 8" style="stroke-width:3"/>',
    dashed:  '<path d="M6 32 L58 8" style="stroke-width:3" stroke-dasharray="8 6" stroke-linecap="butt"/>',
    dotted:  '<path d="M6 32 L58 8" style="stroke-width:3.4" stroke-dasharray="0.1 6.5"/>',
    dashdot: '<path d="M6 32 L58 8" style="stroke-width:3" stroke-dasharray="11 5 1.5 5" stroke-linecap="butt"/>',
    long:    '<path d="M6 32 L58 8" style="stroke-width:3" stroke-dasharray="17 8" stroke-linecap="butt"/>',
    double:  '<path d="M4.7 29.3 L56.7 5.3" style="stroke-width:1.6"/><path d="M7.3 34.7 L59.3 10.7" style="stroke-width:1.6"/>',
    glow:    '<path d="M6 32 L58 8" style="stroke-width:9;opacity:.25"/><path d="M6 32 L58 8" style="stroke-width:2.6"/>',
    taper:   '<path d="M6 36 L6 28 L58 8.6 L58 7.4 Z" style="fill:currentColor;stroke:none"/>'
  };
  function buildTrunkPicker(el, current, allowInherit, onPick){
    if (!el) return;
    const keys = (allowInherit ? [''] : []).concat(Object.keys(TRUNK_STYLES));
    const name = k => k === '' ? 'مثل پیش‌فرض' : TRUNK_STYLES[k];
    el.className = 'bs-picker';
    el.setAttribute('role','radiogroup');
    el.setAttribute('aria-label','نوع خط مسیر');
    el.innerHTML = keys.map(k=>{
      const on = k === current;
      const thumb = TRUNK_THUMB[k === '' ? effTrunkStyle(null) : k];
      return `<button type="button" class="bs-opt${on?' on':''}" role="radio" aria-checked="${on}" tabindex="${on?0:-1}" data-ts="${k}" aria-label="${name(k)}">`+
        `<svg viewBox="0 0 64 40" aria-hidden="true"${k===''?' style="opacity:.6"':''}>${thumb}<circle cx="58" cy="8" r="3.6"/></svg><span>${name(k)}</span></button>`;
    }).join('');
    const pick = b=>{
      el.querySelectorAll('.bs-opt').forEach(x=>{ const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
      onPick(b.dataset.ts);
    };
    el.onclick = e=>{ const b = e.target.closest('.bs-opt'); if (b) pick(b); };
    el.onkeydown = e=>{
      const k = e.key;
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)) return;
      const btns = Array.from(el.querySelectorAll('.bs-opt'));
      let i = btns.indexOf(document.activeElement); if (i < 0) i = btns.findIndex(x=>x.classList.contains('on'));
      const rtl = getComputedStyle(el).direction === 'rtl';
      const fwd = (k === 'ArrowDown') || (k === (rtl ? 'ArrowLeft' : 'ArrowRight'));
      const nb = btns[(i + (fwd ? 1 : -1) + btns.length) % btns.length];
      e.preventDefault(); nb.focus(); pick(nb);
    };
  }
  function mountTrunkBlock(g){
    buildTrunkPicker(document.getElementById('trunk-style-picker'), g.trunkStyle || '', true, v=>{
      g.trunkStyle = v; render(); scheduleMapSave();
    });
  }
  function mountBranchesBlock(kind, host){
    const block = document.getElementById('branches-block');
    const slot = kind === 'ring' ? document.getElementById('ring-branches-slot') : document.getElementById('panel-goal-only');
    if (block && slot && block.parentNode !== slot) slot.appendChild(block);
    const lbl = document.getElementById('bs-label');
    if (lbl) lbl.textContent = kind === 'ring' ? 'شاخه‌های این نشانه — شکل شاخه‌ها' : 'شکل شاخه‌ها (برای همه‌ی شاخه‌های این مجموعه)';
    buildStylePicker(document.getElementById('branch-style-picker'), host.branchStyle || 'organic', false, v=>{
      host.branchStyle = v; render();
    });
  }

  function openPanelForAction(goalId, actionId){
    const g = findHost(goalId);
    if (!g) return;
    const found = findActionNode(g.actions, actionId);
    if (!found) return;
    const action = found.node;
    panelTarget = {type:'action', goalId, actionId};
    currentEditingAction = {goalId, actionId};
    panelTitle.textContent = 'ویرایش';
    panelDot.style.background = action.color || g.color;
    panelName.value = action.text || '';
    panelName.disabled = false;
    panelColor.value = action.color || g.color;
    panelNote.value = '';
    updateImagePreviews(action.images || []);
    document.getElementById('panel-note-wrap').classList.add('hidden');
    document.getElementById('panel-image-wrap').style.display = 'flex';
    panelNameColorWrap.classList.add('hidden');
    panelIconWrap.classList.add('hidden');
    panelGoalOnly.classList.add('hidden');
    panelRingOnly.classList.add('hidden');
    panelActionOnly.classList.remove('hidden');
    panelActionText.value = action.text || '';
    panelActionColor.value = action.color || g.color;
    syncPanelSwatches(panelActionColorSwatches, action.color || g.color);
    panelActionWeight.value = action.weight || 5;
    panelActionWeightVal.textContent = toFa(action.weight || 5);
    document.getElementById('panel-action-routine').checked = !!action.isRoutine;
    panelDeleteBtn.classList.remove('hidden');
    panelDeleteBtn.textContent = 'حذف';
    buildStylePicker(document.getElementById('panel-action-style'), action.style || '', true, v=>{ action.style = v; render(); });
    refreshActionChildrenPanel();
    panel.classList.add('open');
  }

  function openPanelForMe(){
    panelTarget = {type:'me'};
    currentEditingAction = null;
    panelTitle.textContent = 'من';
    panelDot.style.background = state.me.color;
    panelName.value = state.me.name;
    panelName.disabled = false;
    panelColor.value = state.me.color;
    syncPanelSwatches(panelColorSwatches, state.me.color);
    panelNote.value = state.me.note||'';
    updateImagePreviews(state.me.images || []);
    panelNameColorWrap.classList.remove('hidden');
    panelIconWrap.classList.add('hidden');
    panelGoalOnly.classList.add('hidden');
    panelRingOnly.classList.add('hidden');
    panelActionOnly.classList.add('hidden');
    document.getElementById('panel-note-wrap').classList.remove('hidden');
    document.getElementById('panel-image-wrap').style.display = 'flex';
    panelDeleteBtn.classList.add('hidden');
    panel.classList.add('open');
  }

  function openPanelForGoal(id){
    const g = findHost(id);
    if (!g) return;
    panelTarget = {type:'goal', id};
    currentEditingAction = null;
    panelTitle.textContent = g.name;
    panelDot.style.background = g.color;
    panelName.value = g.name;
    panelName.disabled = false;
    panelColor.value = g.color;
    syncPanelSwatches(panelColorSwatches, g.color);
    panelNote.value = '';
    updateImagePreviews(g.images || []);
    document.getElementById('panel-note-wrap').classList.add('hidden');
    document.getElementById('panel-image-wrap').style.display = 'flex';
    panelNameColorWrap.classList.remove('hidden');
    panelIconWrap.classList.remove('hidden');
    panelIcon.value = g.icon || '🎯';
    panelGoalOnly.classList.remove('hidden');
    panelRingOnly.classList.add('hidden');
    panelActionOnly.classList.add('hidden');
    panelDeleteBtn.classList.remove('hidden');
    panelDeleteBtn.textContent = 'حذف هدف';
    document.getElementById('panel-reached').checked = !!g.reached;
    document.getElementById('panel-goal-freq').value = g.freq || 'alpha';
    currentPanelGoalId = id;
    mountBranchesBlock('goal', g);
    mountTrunkBlock(g);
    refreshActionsPanel(g);
    panel.classList.add('open');
  }

  function openPanelForRing(id){
    const r = state.rings.find(r=>r.id===id);
    if (!r) return;
    panelTarget = {type:'ring', id};
    currentEditingAction = null;
    panelTitle.textContent = r.label || 'نشانه';
    panelDot.style.background = r.color;
    panelName.value = r.label;
    panelName.disabled = false;
    panelColor.value = r.color || RING_COLOR;
    syncPanelSwatches(panelColorSwatches, r.color || RING_COLOR);
    panelRingNote.value = r.note || '';
    panelRingColor.value = r.color || RING_COLOR;
    syncPanelSwatches(panelRingColorSwatches, r.color || RING_COLOR);
    updateImagePreviews(r.images || []);
    document.getElementById('panel-note-wrap').classList.add('hidden');
    document.getElementById('panel-image-wrap').style.display = 'flex';
    panelNameColorWrap.classList.remove('hidden');
    panelIconWrap.classList.remove('hidden');
    panelIcon.value = r.icon || '🌟';
    panelGoalOnly.classList.add('hidden');
    panelRingOnly.classList.remove('hidden');
    panelActionOnly.classList.add('hidden');
    panelDeleteBtn.classList.remove('hidden');
    panelDeleteBtn.textContent = 'حذف نشانه';
    currentPanelGoalId = id;
    mountBranchesBlock('ring', r);
    refreshActionsPanel(r);
    panel.classList.add('open');
  }

  function findActionNode(list, id){
    for (const item of list){
      if (item.id === id) return { node:item, list };
      if (item.children && item.children.length){
        const found = findActionNode(item.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  function renderActionTree(list, depth, goalColor){
    if (!list.length){
      return depth===0 ? `<p style="font-size:12px;color:var(--text-dim);">هنوز شاخه‌ای ثبت نشده.</p>` : '';
    }
    return list.map(a=>{
      const imgCount = (a.images && a.images.length) || 0;
      const imgHtml = a.images && a.images.length ? a.images.map((entry, i) =>
        `<img src="${entry.src}" class="img-preview" style="width:24px;height:24px;margin-left:2px;" data-idx="${i}">`
      ).join('') : '';
      return `
      <div class="action-node" style="margin-inline-end:${depth*14}px;">
        <div class="action-row">
          <input type="color" class="a-color" data-aid="${a.id}" value="${a.color||goalColor}">
          <input type="text" class="a-text" data-aid="${a.id}" value="${esc(a.text)}" placeholder="این اقدام چی بود؟">
          <button class="adel" data-aid="${a.id}" title="حذف">×</button>
        </div>
        <div class="a-sw-row">${PALETTE.map(c=>`<span class="a-sw${(a.color||goalColor).toLowerCase()===c.toLowerCase()?' active':''}" data-aid="${a.id}" data-color="${c}" style="background:${c}"></span>`).join('')}</div>
        <div class="weight-row-mini">
          <span class="small">قطر شاخه</span>
          <input type="range" class="a-weight" data-aid="${a.id}" min="1" max="10" value="${a.weight}">
          <span class="aw-val" data-aid="${a.id}">${toFa(a.weight)}</span>
        </div>
        <div class="img-upload" style="margin:4px 0;">
          <label for="action-img-${a.id}">📷 افزودن عکس (چندگانه)</label>
          <input type="file" id="action-img-${a.id}" accept="image/*" multiple style="display:none;" data-aid="${a.id}">
          <div class="img-thumbnails">${imgHtml}</div>
          ${imgCount > 0 ? `<button class="img-remove" data-aid="${a.id}" style="font-size:11px;">پاک کردن همه</button>` : ''}
        </div>
        <label class="small" style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:4px 0;">
          <input type="checkbox" class="a-routine" data-aid="${a.id}" style="width:14px;height:14px;" ${a.isRoutine ? 'checked' : ''}>
          <span style="font-size:11px;">این یه کار روتینه</span>
        </label>
        <button class="btn tiny add-sub" data-aid="${a.id}">＋</button>
        <div class="children">${renderActionTree(a.children||[], depth+1, a.color||goalColor)}</div>
      </div>
    `}).join('');
  }

  function refreshActionsPanel(g){
    try{ renderPanelPeriodCal(); }catch(e){}
    actionsListEl.innerHTML = renderActionTree(g.actions, 0, g.color);
    actionsListEl.querySelectorAll('.img-upload input[type=file]').forEach(inp=>{
      inp.addEventListener('change', async (e)=>{
        const files = Array.from(e.target.files || []);
        inp.value = '';
        if (!files.length) return;
        const aid = inp.dataset.aid;
        const srcs = await cropImages(files);
        if (!srcs.length) return;
        const found = findActionNode(g.actions, aid);
        if (!found) return;
        if (!Array.isArray(found.node.images)) found.node.images = [];
        srcs.forEach(src=> found.node.images.push({ src, size: DEFAULT_IMG_SIZE }));
        refreshActionsPanel(g);
        render();
      });
    });
    actionsListEl.querySelectorAll('.img-remove').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const aid = btn.dataset.aid;
        const found = findActionNode(g.actions, aid);
        if (!found) return;
        found.node.images = [];
        refreshActionsPanel(g);
        render();
      });
    });
  }

  function focusNewField(id){
    setTimeout(()=>{
      const inp = actionsListEl.querySelector(`.a-text[data-aid="${id}"]`);
      if (inp){ inp.focus(); try{ inp.scrollIntoView({block:'center', behavior:'smooth'}); }catch(_){} }
    }, 30);
  }

  function focusNewFieldIn(containerEl, id){
    setTimeout(()=>{
      const inp = containerEl.querySelector(`.a-text[data-aid="${id}"]`);
      if (inp){ inp.focus(); try{ inp.scrollIntoView({block:'center', behavior:'smooth'}); }catch(_){} }
    }, 30);
  }

  function refreshActionChildrenPanel(){
    try{ renderPanelPeriodCal(); }catch(e){}
    if (!currentEditingAction) { panelActionChildrenListEl.innerHTML = ''; return; }
    const g = findHost(currentEditingAction.goalId);
    if (!g) return;
    const found = findActionNode(g.actions, currentEditingAction.actionId);
    if (!found) return;
    const node = found.node;
    node.children = node.children || [];
    panelActionChildrenListEl.innerHTML = renderActionTree(node.children, 0, node.color || g.color);
    panelActionChildrenListEl.querySelectorAll('.img-upload input[type=file]').forEach(inp=>{
      inp.addEventListener('change', async (e)=>{
        const files = Array.from(e.target.files || []);
        inp.value = '';
        if (!files.length) return;
        const aid = inp.dataset.aid;
        const srcs = await cropImages(files);
        if (!srcs.length) return;
        const f2 = findActionNode(g.actions, aid);
        if (!f2) return;
        if (!Array.isArray(f2.node.images)) f2.node.images = [];
        srcs.forEach(src=> f2.node.images.push({ src, size: DEFAULT_IMG_SIZE }));
        refreshActionChildrenPanel();
        render();
      });
    });
    panelActionChildrenListEl.querySelectorAll('.img-remove').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const aid = btn.dataset.aid;
        const f2 = findActionNode(g.actions, aid);
        if (!f2) return;
        f2.node.images = [];
        refreshActionChildrenPanel();
        render();
      });
    });
  }

  function quickSwatchClick(e, g, container){
    const sw = e.target.closest('.a-sw');
    if (!sw) return false;
    const found = findActionNode(g.actions, sw.dataset.aid);
    if (!found) return true;
    found.node.color = sw.dataset.color;
    const row = sw.parentNode;
    [...row.children].forEach(x=>x.classList.toggle('active', x===sw));
    const ci = container.querySelector(`.a-color[data-aid="${sw.dataset.aid}"]`);
    if (ci) ci.value = sw.dataset.color;
    debouncedRender();
    return true;
  }

  panelActionChildrenListEl.addEventListener('click', (e)=>{
    if (!currentEditingAction) return;
    const g = findHost(currentEditingAction.goalId);
    if (!g) return;
    if (quickSwatchClick(e, g, panelActionChildrenListEl)) return;
    const delBtn = e.target.closest('.adel');
    const addSubBtn = e.target.closest('.add-sub');
    if (delBtn){
      const found = findActionNode(g.actions, delBtn.dataset.aid);
      if (found) found.list.splice(found.list.indexOf(found.node), 1);
      refreshActionChildrenPanel();
      render();
    } else if (addSubBtn){
      const found = findActionNode(g.actions, addSubBtn.dataset.aid);
      if (found){
        found.node.children = found.node.children || [];
        const child = { id:uid(), text:'', weight:5, color:null, children:[], detached:false, images:[], radius:10, createdAt: Date.now() };
        found.node.children.push(child);
        g.collapsed = false;
        refreshActionChildrenPanel();
        render();
        focusNewFieldIn(panelActionChildrenListEl, child.id);
      }
    }
  });

  panelActionChildrenListEl.addEventListener('input', (e)=>{
    if (!currentEditingAction) return;
    const g = findHost(currentEditingAction.goalId);
    if (!g) return;
    const t = e.target;
    if (t.classList.contains('a-text')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){ found.node.text = t.value; g.lastActivity = Date.now(); debouncedRender(); }
    } else if (t.classList.contains('a-weight')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){
        found.node.weight = +t.value;
        const span = panelActionChildrenListEl.querySelector(`.aw-val[data-aid="${t.dataset.aid}"]`);
        if (span) span.textContent = toFa(t.value);
        debouncedRender();
      }
    } else if (t.classList.contains('a-color')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){ found.node.color = t.value; debouncedRender(); }
    } else if (t.classList.contains('a-routine')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){ found.node.isRoutine = t.checked; render(); }
    }
  });

  document.getElementById('add-branch-btn').addEventListener('click', ()=>{
    const g = findHost(currentPanelGoalId);
    if (!g) return;
    const a = { id:uid(), text:'', weight:5, color:null, children:[], detached:false, images:[], radius:12, createdAt: Date.now() };
    g.actions.push(a);
    g.collapsed = false;
    g.lastActivity = Date.now();
    refreshActionsPanel(g);
    render();
    focusNewField(a.id);
  });

  actionsListEl.addEventListener('click', (e)=>{
    const g = findHost(currentPanelGoalId);
    if (!g) return;
    if (quickSwatchClick(e, g, actionsListEl)) return;
    const delBtn = e.target.closest('.adel');
    const addSubBtn = e.target.closest('.add-sub');
    if (delBtn){
      const found = findActionNode(g.actions, delBtn.dataset.aid);
      if (found) found.list.splice(found.list.indexOf(found.node), 1);
      refreshActionsPanel(g);
      render();
    } else if (addSubBtn){
      const found = findActionNode(g.actions, addSubBtn.dataset.aid);
      if (found){
        found.node.children = found.node.children || [];
        const child = { id:uid(), text:'', weight:5, color:null, children:[], detached:false, images:[], radius:10, createdAt: Date.now() };
        found.node.children.push(child);
        g.collapsed = false;
        refreshActionsPanel(g);
        render();
        focusNewField(child.id);
      }
    }
  });

  actionsListEl.addEventListener('input', (e)=>{
    const g = findHost(currentPanelGoalId);
    if (!g) return;
    const t = e.target;
    if (t.classList.contains('a-text')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){ found.node.text = t.value; g.lastActivity = Date.now(); debouncedRender(); }
    } else if (t.classList.contains('a-weight')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){
        found.node.weight = +t.value;
        const span = actionsListEl.querySelector(`.aw-val[data-aid="${t.dataset.aid}"]`);
        if (span) span.textContent = toFa(t.value);
        debouncedRender();
      }
    } else if (t.classList.contains('a-color')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){ found.node.color = t.value; debouncedRender(); }
    } else if (t.classList.contains('a-routine')){
      const found = findActionNode(g.actions, t.dataset.aid);
      if (found){ found.node.isRoutine = t.checked; render(); }
    }
  });

  document.getElementById('panel-close').addEventListener('click', ()=>{
    panel.classList.remove('open');
    document.getElementById('panel-note-wrap').classList.remove('hidden');
    panelActionOnly.classList.add('hidden');
    panelActionChildrenListEl.innerHTML = '';
  });

  panelActionWeight.addEventListener('input', ()=>{
    panelActionWeightVal.textContent = toFa(+panelActionWeight.value);
  });

  document.getElementById('panel-action-add-sub').addEventListener('click', ()=>{
    if (!currentEditingAction) return;
    const g = findHost(currentEditingAction.goalId);
    if (!g) return;
    const found = findActionNode(g.actions, currentEditingAction.actionId);
    if (!found) return;
    found.node.children = found.node.children || [];
    const child = { id:uid(), text:'', weight:5, color:null, children:[], detached:false, images:[], radius:10, createdAt: Date.now() };
    found.node.children.push(child);
    g.collapsed = false;
    refreshActionChildrenPanel();
    render();
    focusNewFieldIn(panelActionChildrenListEl, child.id);
  });

  document.getElementById('panel-save-btn').addEventListener('click', ()=>{
    if (!panelTarget) return;
    const images = currentImages.slice();

    if (panelTarget.type==='me'){
      const newMeName = panelName.value.trim();
      state.me.name = newMeName;
      state.me.color = panelColor.value;
      state.me.note = panelNote.value;
      state.me.images = images;
    } else if (panelTarget.type==='ring'){
      const r = state.rings.find(r=>r.id===panelTarget.id);
      if (r){
        const newLabel = panelName.value.trim();
        r.label = newLabel || 'نشانه';
        r.color = panelColor.value || panelRingColor.value;
        r.note = panelRingNote.value;
        r.images = images;
        r.icon = (panelIcon.value || '').trim() || '🌟';
      }
    } else if (panelTarget.type==='goal'){
      const g = findHost(panelTarget.id);
      if (g){
        const newName = panelName.value.trim();
        if (newName) g.name = newName;
        g.color = panelColor.value;
        const wasReached = !!g.reached;
        g.reached = document.getElementById('panel-reached').checked;
        if (g.reached && !wasReached) g.reachedAt = Date.now();
        if (!g.reached) delete g.reachedAt;
        g.images = images;
        g.freq = document.getElementById('panel-goal-freq').value || 'alpha';
        g.icon = (panelIcon.value || '').trim() || '🎯';
      }
    } else if (panelTarget.type==='action'){
      const g = findHost(panelTarget.goalId);
      if (g){
        const found = findActionNode(g.actions, panelTarget.actionId);
        if (found){
          found.node.text = panelActionText.value.trim() || 'بدون عنوان';
          found.node.color = panelActionColor.value;
          found.node.weight = +panelActionWeight.value;
          found.node.images = images;
          found.node.isRoutine = document.getElementById('panel-action-routine').checked;
          g.lastActivity = Date.now();
        }
      }
    }
    render();
    panel.classList.remove('open');
    document.getElementById('panel-note-wrap').classList.remove('hidden');
    panelActionOnly.classList.add('hidden');
  });

  panelDeleteBtn.addEventListener('click', ()=>{
    if (panelTarget && panelTarget.type==='goal'){
      state.rings.forEach(r=>{ if (r.goalId === panelTarget.id) r.goalId = ''; });
      state.goals = state.goals.filter(g=>g.id!==panelTarget.id);
      render();
      panel.classList.remove('open');
    } else if (panelTarget && panelTarget.type==='ring'){
      state.rings = state.rings.filter(r=>r.id!==panelTarget.id);
      render();
      panel.classList.remove('open');
    } else if (panelTarget && panelTarget.type==='action'){
      const g = findHost(panelTarget.goalId);
      if (g){
        const found = findActionNode(g.actions, panelTarget.actionId);
        if (found){
          found.list.splice(found.list.indexOf(found.node), 1);
          render();
          panel.classList.remove('open');
          panelActionOnly.classList.add('hidden');
        }
      }
    }
  });

  const importFile = document.getElementById('import-file');
  importFile.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if (data && data.me && Array.isArray(data.goals)){
          state = data;
          normalizeState();
          render();
        } else {
          alert('فایل معتبر نیست.');
        }
      }catch(err){
        alert('خواندن فایل با خطا مواجه شد.');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  document.addEventListener('input', (e)=>{
    const t = e.target;
    if (t.classList && t.classList.contains('feeling-textarea')){
      const g = findHost(t.dataset.goalid);
      if (g) g.feeling = t.value;
    }
  });

  /* ================= تقویم ================= */
  const JALALI_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const JALALI_WEEKDAYS = ['ش','ی','د','س','چ','پ','ج'];

  function calDiv(a,b){ return ~~(a/b); }
  function calMod(a,b){ return a - ~~(a/b)*b; }
  function jalCal(jy){
    const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
    const bl=breaks.length; let gy=jy+621, leapJ=-14, jp=breaks[0], jm, jump=0, leap, n, i;
    for (i=1;i<bl;i+=1){ jm=breaks[i]; jump=jm-jp; if (jy<jm) break; leapJ=leapJ+calDiv(jump,33)*8+calDiv(calMod(jump,33),4); jp=jm; }
    n=jy-jp;
    leapJ=leapJ+calDiv(n,33)*8+calDiv(calMod(n,33)+3,4);
    if (calMod(jump,33)===4 && jump-n===4) leapJ+=1;
    const leapG=calDiv(gy,4)-calDiv((calDiv(gy,100)+1)*3,4)-150;
    const march=20+leapJ-leapG;
    if (jump-n<6) n=n-jump+calDiv(jump,33)*33;
    leap=calMod(calMod(n+1,33)-1,4);
    if (leap===-1) leap=4;
    return {leap:leap, gy:gy, march:march};
  }
  function calG2d(gy,gm,gd){
    let d=calDiv((gy+calDiv(gm-8,6)+100100)*1461,4)+calDiv(153*calMod(gm+9,12)+2,5)+gd-34840408;
    d=d-calDiv(calDiv(gy+100100+calDiv(gm-8,6),100)*3,4)+752;
    return d;
  }
  function calD2g(jdn){
    let j=4*jdn+139361631;
    j=j+calDiv(calDiv(4*jdn+183187720,146097)*3,4)*4-3908;
    const i=calDiv(calMod(j,1461),4)*5+308;
    const gd=calDiv(calMod(i,153),5)+1;
    const gm=calMod(calDiv(i,153),12)+1;
    const gy=calDiv(j,1461)-100100+calDiv(8-gm,6);
    return {gy:gy,gm:gm,gd:gd};
  }
  function calJ2d(jy,jm,jd){
    const r=jalCal(jy);
    return calG2d(r.gy,3,r.march)+(jm-1)*31-calDiv(jm,7)*(jm-7)+jd-1;
  }
  function calD2j(jdn){
    const gy=calD2g(jdn).gy; let jy=gy-621;
    const r=jalCal(jy);
    const jdn1f=calG2d(gy,3,r.march);
    let k=jdn-jdn1f, jm, jd;
    if (k>=0){
      if (k<=185){ jm=1+calDiv(k,31); jd=calMod(k,31)+1; return {jy:jy,jm:jm,jd:jd}; }
      k-=186;
    } else {
      jy-=1; k+=179;
      if (r.leap===1) k+=1;
    }
    jm=7+calDiv(k,30);
    jd=calMod(k,30)+1;
    return {jy:jy,jm:jm,jd:jd};
  }
  function toJalaali(gy,gm,gd){ return calD2j(calG2d(gy,gm,gd)); }
  function toGregorianCal(jy,jm,jd){ return calD2g(calJ2d(jy,jm,jd)); }
  function isLeapJalaaliYear(jy){ return jalCal(jy).leap===0; }
  function jalaaliMonthLength(jy,jm){
    if (jm<=6) return 31;
    if (jm<=11) return 30;
    return isLeapJalaaliYear(jy)?30:29;
  }
  function jalaaliWeekDay(jy,jm,jd){
    const g = toGregorianCal(jy,jm,jd);
    const dow = new Date(g.gy, g.gm-1, g.gd).getDay();
    return (dow+1)%7;
  }
  function calDKey(jy,jm,jd){ return jy+'-'+jm+'-'+jd; }

  function jalaaliCurrentWeekDates(){
    const now = new Date();
    const todayJ = toJalaali(now.getFullYear(), now.getMonth()+1, now.getDate());
    const todayWd = jalaaliWeekDay(todayJ.jy, todayJ.jm, todayJ.jd);
    const g0 = toGregorianCal(todayJ.jy, todayJ.jm, todayJ.jd);
    const startDate = new Date(g0.gy, g0.gm-1, g0.gd);
    startDate.setDate(startDate.getDate() - todayWd);
    const days = [];
    for (let i=0;i<7;i++){
      const d = new Date(startDate);
      d.setDate(d.getDate()+i);
      const j = toJalaali(d.getFullYear(), d.getMonth()+1, d.getDate());
      days.push({ jy:j.jy, jm:j.jm, jd:j.jd, key: calDKey(j.jy,j.jm,j.jd) });
    }
    return days;
  }

  function todayCalKey(){
    const now = new Date();
    const j = toJalaali(now.getFullYear(), now.getMonth()+1, now.getDate());
    return calDKey(j.jy, j.jm, j.jd);
  }

  const ROUTINE_DONE_MARK = 'انجام شد ✓';

  /* حلقه‌ی پیشرفت هفتگیِ کار روتین: ۷ قوس = ۷ روز هفته (شنبه تا جمعه)
     قوس پر = انجام شده، امروز با ضخامت بیشتر مشخص است، نقطه‌ی وسط فقط وقتی امروز انجام شده پر می‌شود
     و اگر چند روز پشت‌سرهم انجام شده باشد عدد «روزهای پیاپی» بالای حلقه می‌آید. */
  function routineStreak(action){
    if (!action.logs) return 0;
    const d = new Date(); d.setHours(0,0,0,0);
    let n = 0;
    if (!action.logs[pcJKey(d)]) d.setDate(d.getDate() - 1);
    for (let i = 0; i < 90; i++){
      if (!action.logs[pcJKey(d)]) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function routineTipSVG(action, cx, cy, radius, color, scale){
    if (!action.logs || typeof action.logs !== 'object') action.logs = {};
    const days = jalaaliCurrentWeekDates();
    const tKey = todayCalKey();
    const R = radius + 5.5 * Math.max(0.8, scale);
    const sw = 2.2 * Math.max(0.8, scale);
    const step = (Math.PI * 2) / 7, gap = 0.34;
    let done = 0, html = '';
    days.forEach((d, i)=>{
      const has = !!action.logs[d.key];
      const isToday = d.key === tKey;
      if (has) done++;
      const a0 = -Math.PI/2 + i*step + gap/2, a1 = -Math.PI/2 + (i+1)*step - gap/2;
      const x0 = cx + R*Math.cos(a0), y0 = cy + R*Math.sin(a0);
      const x1 = cx + R*Math.cos(a1), y1 = cy + R*Math.sin(a1);
      html += `<path d="M${x0.toFixed(2)} ${y0.toFixed(2)} A${R.toFixed(2)} ${R.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}" fill="none" stroke="${color}" stroke-width="${(isToday ? sw*1.45 : sw).toFixed(2)}" stroke-linecap="round" opacity="${has ? 0.95 : (isToday ? 0.55 : 0.2)}"/>`;
    });
    const todayDone = !!action.logs[tKey];
    const streak = routineStreak(action);
    let badge = '';
    if (streak >= 2){
      badge = `<text x="${cx}" y="${(cy - R - 3.5).toFixed(1)}" text-anchor="middle" font-size="${(8.5*Math.max(0.9,scale)).toFixed(1)}" font-weight="700" fill="${color}" stroke="#0a0c18" stroke-width="2" paint-order="stroke" style="pointer-events:none;">${toFa(streak)}</text>`;
    }
    const tip = `روتین: ${toFa(done)} از ۷ روزِ این هفته${streak ? ' · ' + toFa(streak) + ' روز پیاپی' : ''}`;
    return `<g class="routine-tip" pointer-events="none"><title>${tip}</title>` +
           (todayDone ? '' : `<circle cx="${cx}" cy="${cy}" r="${(radius*0.55).toFixed(2)}" fill="#0a0c18" opacity="0.55"/>`) +
           html + badge + `</g>`;
  }

  function findActionAnywhere(actionId){
    for (const g of state.goals.concat(state.rings)){
      const found = findActionNode(g.actions || [], actionId);
      if (found) return { node: found.node, goal: g };
    }
    return null;
  }

  function toggleRoutineLog(actionId, key){
    const res = findActionAnywhere(actionId);
    if (!res) return;
    const node = res.node;
    if (!node.logs || typeof node.logs !== 'object') node.logs = {};
    if (node.logs[key]) delete node.logs[key];
    else node.logs[key] = ROUTINE_DONE_MARK;
    scheduleMapSave();
    render();
    try{ renderPanelPeriodCal(); }catch(e){}
  }

  var PC_MONTH_ORD = ['اول','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم','دهم','یازدهم','دوازدهم','سیزدهم'];
  var PC_MAX_DAYS = 365;
  var pcSelectedKey = null;

  function pcLocalKey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function pcParseKey(k){ const p = String(k).split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
  function pcJKey(date){ const j = toJalaali(date.getFullYear(), date.getMonth()+1, date.getDate()); return calDKey(j.jy, j.jm, j.jd); }
  function pcFaDate(date){ const j = toJalaali(date.getFullYear(), date.getMonth()+1, date.getDate()); return toFa(j.jd)+' '+JALALI_MONTHS[j.jm-1]; }
  function pcCollect(list, out){ (list||[]).forEach(n=>{ out.push(n); pcCollect(n.children, out); }); return out; }

  function ensureGoalPeriod(g){
    if (!g.period || typeof g.period !== 'object') g.period = { days: 28, startDate: null };
    const n = parseInt(g.period.days, 10);
    g.period.days = (n >= 1) ? Math.min(n, PC_MAX_DAYS) : 28;
    if (!g.period.startDate){ g.period.startDate = pcLocalKey(new Date()); scheduleMapSave(); }
    if (!Array.isArray(g.period.past)) g.period.past = [];
    return g.period;
  }

  function pcContext(){
    if (!panelTarget) return null;
    if (panelTarget.type === 'goal'){
      const g = findHost(panelTarget.id);
      if (!g) return null;
      return { kind:'goal', goal:g, node:null, p:'gp-goal', color:g.color, sources:pcCollect(g.actions, []) };
    }
    if (panelTarget.type === 'action'){
      const g = findHost(panelTarget.goalId);
      if (!g) return null;
      const f = findActionNode(g.actions, panelTarget.actionId);
      if (!f) return null;
      return { kind:'action', goal:g, node:f.node, p:'gp-action', color:(f.node.color || g.color), sources:pcCollect(f.node.children, []) };
    }
    return null;
  }

  /* ================= زمان‌سنج روزانه + ردپا روی نقشه ================= */
  function pcCache(){ return window.__pcKeyCache || (window.__pcKeyCache = new Map()); }
  function pcPeriodKeys(startDate, days){
    const c = pcCache(), ck = startDate + '|' + days;
    let st = c.get(ck);
    if (!st){
      st = new Set();
      const d0 = pcParseKey(startDate);
      for (let d=0; d<days; d++) st.add(pcJKey(new Date(d0.getFullYear(), d0.getMonth(), d0.getDate()+d)));
      if (c.size > 40) c.clear();
      c.set(ck, st);
    }
    return st;
  }
  function hostPeriodKeys(g){ const gp = ensureGoalPeriod(g); return pcPeriodKeys(gp.startDate, gp.days); }
  function nodeLogCount(n, keys){ let c = 0; if (n.logs) for (const k in n.logs){ if (n.logs[k] && (!keys || keys.has(k))) c++; } return c; }
  function nodeSecs(n, keys){ let t = 0; if (n.time) for (const k in n.time){ if (!keys || keys.has(k)) t += (+n.time[k] || 0); } return t; }
  function nodeDaySecs(n, jk){ return (n.time && +n.time[jk]) || 0; }
  /* بازه‌های ساعتی هر روز: n.ranges[jk] = [{s:دقیقه‌ی شروع از نیمه‌شب, e:دقیقه‌ی پایان}] */
  let PENDING_RANGE = null;
  function fmtHM(min){ min = ((Math.round(min) % 1440) + 1440) % 1440; const h = Math.floor(min/60), m = min % 60; return toFa(String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0')); }
  function nodeDayRanges(n, jk){ return (n.ranges && Array.isArray(n.ranges[jk])) ? n.ranges[jk] : []; }
  function rangesText(n, jk){ return nodeDayRanges(n, jk).map(r=> fmtHM(r.s) + ' تا ' + fmtHM(r.e)).join('، '); }
  function pushRange(n, jk, r){
    if (!r) return;
    if (!n.ranges || typeof n.ranges !== 'object') n.ranges = {};
    if (!Array.isArray(n.ranges[jk])) n.ranges[jk] = [];
    n.ranges[jk].push({ s:r.s, e:r.e });
  }
  function fmtDur(sec){
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60);
    if (!h && !m) return sec ? toFa(sec) + ' ثانیه' : toFa(0) + ' دقیقه';
    return (h ? toFa(h) + ' ساعت' : '') + (h && m ? ' و ' : '') + (m ? toFa(m) + ' دقیقه' : '');
  }
  function fmtClock(sec){
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), x = sec%60;
    const p = v => String(v).padStart(2, '0');
    return toFa(h ? h + ':' + p(m) + ':' + p(x) : p(m) + ':' + p(x));
  }
  function timerRunning(n){ return typeof n.timerStart === 'number' && n.timerStart > 0; }
  function timerLiveHTML(n){ return '<span class="tm-live" data-start="' + n.timerStart + '">' + fmtClock((Date.now() - n.timerStart)/1000) + '</span>'; }
  function autoTick(n, jk){ if (!(n.logs && n.logs[jk])) toggleRoutineLog(n.id, jk); }
  function startTimer(n){ n.timerStart = Date.now(); scheduleMapSave(); }
  function stopTimer(n){
    if (!timerRunning(n)) return 0;
    const el = Math.max(0, Math.floor((Date.now() - n.timerStart)/1000));
    const jk = pcJKey(new Date(n.timerStart));
    delete n.timerStart;
    if (el > 0){
      if (!n.time || typeof n.time !== 'object') n.time = {};
      n.time[jk] = (n.time[jk] || 0) + el;
      autoTick(n, jk);
    }
    scheduleMapSave();
    return el;
  }
  function addMinutes(n, jk, mins){
    const secs = Math.round(mins * 60);
    if (!secs) return;
    if (!n.time || typeof n.time !== 'object') n.time = {};
    n.time[jk] = Math.max(0, (n.time[jk] || 0) + secs);
    if (!n.time[jk]) delete n.time[jk];
    if (secs > 0){ autoTick(n, jk); pushRange(n, jk, PENDING_RANGE); }
    scheduleMapSave();
  }
  function setDayMinutes(node, jk, mins){
    if (!node.time || typeof node.time !== 'object') node.time = {};
    const secs = Math.round(mins * 60);
    if (node.ranges) delete node.ranges[jk];
    if (secs > 0){ node.time[jk] = secs; autoTick(node, jk); pushRange(node, jk, PENDING_RANGE); }
    else delete node.time[jk];
    scheduleMapSave();
  }
  /* پنجره‌ی ثبت زمان: ساعت + دقیقه (به‌جای prompt) */
  function askDuration(opts, cb){
    const old = document.getElementById('dur-dlg'); if (old) old.remove();
    const d0 = Math.max(0, Math.round(opts.defMin || 0));
    const p2 = v => String(v).padStart(2, '0');
    const nowD = new Date(), startH = nowD.getHours();
    const defFrom = p2(startH) + ':00', defTo = p2((startH + 1) % 24) + ':00';
    const ov = document.createElement('div');
    ov.id = 'dur-dlg'; ov.className = 'dur-ov';
    ov.innerHTML =
      '<div class="dur-box" role="dialog" aria-label="ثبت زمان">'+
        '<div class="dur-t">'+esc(opts.title || 'ثبت زمان')+'</div>'+
        (opts.sub ? '<div class="dur-s">'+esc(opts.sub)+'</div>' : '')+
        '<div class="dur-tabs"><button type="button" class="on" data-mode="dur">مدت زمان</button><button type="button" data-mode="range">بازه‌ی ساعت (از … تا …)</button></div>'+
        '<div class="dur-in dur-mode-dur">'+
          '<label><input id="dur-h" type="number" inputmode="numeric" min="0" max="24" value="'+Math.floor(d0/60)+'"><span>ساعت</span></label>'+
          '<b>:</b>'+
          '<label><input id="dur-m" type="number" inputmode="numeric" min="0" max="59" value="'+(d0%60)+'"><span>دقیقه</span></label>'+
        '</div>'+
        '<div class="dur-in dur-mode-range" style="display:none;">'+
          '<label><input id="dur-from" type="time" value="'+defFrom+'"><span>از ساعت</span></label>'+
          '<b>←</b>'+
          '<label><input id="dur-to" type="time" value="'+defTo+'"><span>تا ساعت</span></label>'+
        '</div>'+
        '<div class="dur-rinfo dur-mode-range" style="display:none;"></div>'+
        '<div class="dur-q dur-mode-dur">'+[15,30,60,120].map(m=>'<button type="button" data-q="'+m+'">'+(m<60 ? toFa(m)+' دقیقه' : toFa(m/60)+' ساعت')+'</button>').join('')+'</div>'+
        '<div class="dur-b">'+
          '<button type="button" class="ok" data-d="ok">ثبت</button>'+
          (opts.deletable ? '<button type="button" class="del" data-d="del">حذف زمان</button>' : '')+
          '<button type="button" data-d="no">لغو</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(ov);
    const hEl = ov.querySelector('#dur-h'), mEl = ov.querySelector('#dur-m');
    const close = ()=>{ ov.remove(); };
    const fromEl = ov.querySelector('#dur-from'), toEl = ov.querySelector('#dur-to');
    const rInfo = ov.querySelector('.dur-rinfo');
    let mode = 'dur';
    const hm2min = v => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; };
    const readRange = ()=>{
      const a = hm2min(fromEl.value), b = hm2min(toEl.value);
      if (a === null || b === null) return null;
      let e = b; if (e <= a) e += 1440; /* مثلاً ۲۳ تا ۱ بامداد */
      return { s:a, e:e, mins:e - a };
    };
    const updRInfo = ()=>{
      const r = readRange();
      rInfo.textContent = r ? ('مدت: ' + fmtDur(r.mins * 60)) : 'ساعت شروع و پایان را انتخاب کن';
    };
    fromEl.addEventListener('input', updRInfo); toEl.addEventListener('input', updRInfo); updRInfo();
    const total = ()=>{
      const h = Math.max(0, Math.min(24, parseInt(hEl.value, 10) || 0));
      const m = Math.max(0, Math.min(59, parseInt(mEl.value, 10) || 0));
      return h * 60 + m;
    };
    ov.addEventListener('click', e=>{
      if (e.target === ov){ close(); return; }
      const md = e.target.closest('[data-mode]');
      if (md){
        mode = md.dataset.mode;
        ov.querySelectorAll('[data-mode]').forEach(x=> x.classList.toggle('on', x === md));
        ov.querySelectorAll('.dur-mode-dur').forEach(x=>{ x.style.display = mode === 'dur' ? '' : 'none'; });
        ov.querySelectorAll('.dur-mode-range').forEach(x=>{ x.style.display = mode === 'range' ? '' : 'none'; });
        return;
      }
      const q = e.target.closest('[data-q]');
      if (q){ const m = +q.dataset.q; hEl.value = Math.floor(m/60); mEl.value = m % 60; return; }
      const b = e.target.closest('[data-d]'); if (!b) return;
      if (b.dataset.d === 'no'){ close(); return; }
      if (b.dataset.d === 'del'){ close(); PENDING_RANGE = null; cb(0); return; }
      if (mode === 'range'){
        const r = readRange();
        if (!r || r.mins <= 0){ if (typeof toast === 'function') toast('ساعت شروع و پایان را درست انتخاب کن'); return; }
        close(); PENDING_RANGE = { s:r.s % 1440, e:r.e % 1440 };
        try{ cb(r.mins); } finally { PENDING_RANGE = null; }
        return;
      }
      const t = total();
      if (t <= 0 && !opts.allowZero){ if (typeof toast === 'function') toast('ساعت یا دقیقه رو وارد کن'); return; }
      close(); PENDING_RANGE = null; cb(t);
    });
    setTimeout(()=>{ try{ hEl.focus(); hEl.select(); }catch(e){} }, 60);
  }
  (function(){
    if (document.getElementById('tm-css')) return;
    const st = document.createElement('style'); st.id = 'tm-css';
    st.textContent =
      '.pc-time-btns{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;}'+
      '.pc-time-btns .btn{flex:1;font-size:11.5px;padding:8px;}'+
      '.gs-tmr{font-size:11px;white-space:nowrap;}'+
      '.gs-tmr.on{color:#e5484d;border-color:#e5484d;}'+
      '.gs-tsum{color:var(--text-dim);}'+
      '.gs-grp{display:flex;flex-direction:column;gap:6px;}'+
      '.gs-kids{display:flex;flex-direction:column;gap:6px;margin-inline-start:12px;padding-inline-start:10px;border-inline-start:2px dashed rgba(127,127,127,.35);}'+
      '.gs-node.main{padding:10px 12px;box-shadow:0 1px 0 rgba(127,127,127,.15);}'+
      '.gs-node.sub{background:rgba(127,127,127,.04);padding:7px 9px;}'+
      '.gs-node.main .gs-mrow .gs-ntext{font-size:14px;font-weight:700;}'+
      '.gs-node.main .gs-mtime{padding:3px 8px;}'+
      '.gs-node.mini{padding:5px 8px;}'+
      '.gs-mrow{display:flex;align-items:center;gap:5px;}'+
      '.gs-mrow .gs-ntext{flex:1;min-width:0;font-size:12.5px;font-weight:600;}'+
      '.gs-mrow .gs-nach{width:24px;height:24px;border-radius:8px;}'+
      '.gs-mrow .gs-nach svg{width:14px;height:14px;}'+
      '.gs-mrow .gs-tick{width:24px;height:24px;flex:none;}'+
      '.gs-mrow .gs-nbtn{width:24px;height:24px;font-size:13px;}'+
      '.gs-mtime{flex:none;border:1px solid var(--panel-border);background:transparent;color:var(--text-dim);border-radius:999px;padding:3px 8px;font-family:inherit;font-size:10.5px;cursor:pointer;white-space:nowrap;}'+
      '.gs-mtime.on{color:var(--text-main);}'+
      '.gs-node.sub .gs-ntext{font-size:12.5px;font-weight:600;}'+
      '.gs-nname{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;}'+
      '.gs-lvl{display:flex;align-items:center;flex-wrap:wrap;gap:5px;font-size:10px;}'+
      '.gs-badge{padding:1px 8px;border-radius:999px;font-weight:700;color:#12142a;font-size:9.5px;}'+
      '.gs-badge.sub{background:transparent;border:1px solid;}'+
      '.gs-par{color:var(--text-dim);}'+
      '.gs-foot{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;}'+
      '.gs-fbtn{border:1px solid var(--panel-border);background:transparent;color:var(--text-main);border-radius:999px;padding:4px 10px;font-family:inherit;font-size:11px;cursor:pointer;}'+
      '.pc-sub-tick{flex:none;width:26px;height:26px;border-radius:50%;border:2px solid var(--panel-border);background:transparent;color:#12142a;font-weight:800;cursor:pointer;padding:0;}'+
      '.pc-sub-set{flex:none;border:1px solid var(--panel-border);background:transparent;color:var(--text-main);border-radius:999px;padding:4px 9px;font-family:inherit;font-size:10.5px;cursor:pointer;}'+
      '.gs-tchips{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-top:6px;}'+
      '.gs-tlbl{font-size:10.5px;color:var(--text-dim);}'+
      '.gs-tchip{border:1px solid var(--panel-border);background:transparent;color:var(--text-main);border-radius:999px;padding:3px 9px;font-family:inherit;font-size:10.5px;cursor:pointer;}'+
      '.gs-tchip.add{border-style:dashed;color:var(--text-dim);}'+
      '.pc-sub-row{display:flex;align-items:center;gap:6px;margin-top:5px;}'+
      '.pc-sub-nm{flex:1;min-width:0;color:var(--text-main);}'+
      '.pc-sub-t{color:var(--text-dim);font-size:10.5px;}'+
      '.pc-sub-row .btn{flex:none;padding:6px 10px;font-size:11px;}'+
      '.pc-sub-add{display:flex;gap:6px;margin-top:8px;}'+
      '.pc-sub-in{flex:1;min-width:0;border:1px solid var(--panel-border);background:transparent;color:var(--text-main);border-radius:10px;padding:7px 9px;font-family:inherit;font-size:12.5px;}'+
      '.pc-foot{display:flex;align-items:center;gap:8px;margin-top:8px;}';
    document.head.appendChild(st);
  })();

  /* ردپا: هر روزِ تیک‌خورده = یک جفت کفش روی مسیر شاخه، از سرِ شاخه به سمت هدف */
  function stepPoint(geom, t){
    if (geom.poly){ const q = polyPointAt(geom.poly, t); return { x:q.pt.x, y:q.pt.y, a:q.angle }; }
    const pt = bezierPoint(geom.originPt, geom.c1, geom.c2, geom.end, t);
    return { x:pt.x, y:pt.y, a:bezierTangentAngle(geom.originPt, geom.c1, geom.c2, geom.end, t) };
  }
  function footprintsSVG(goal, action, geom, color, scale){
    /* همه‌ی روزهای تیک‌خورده از ابتدا (همه‌ی دوره‌ها)؛ با شروع دوره‌ی جدید ردپاها پاک نمی‌شوند */
    const N = nodeLogCount(action, null);
    if (!N) return '';
    const col = goal.footColor || color;
    const fid = 'fpf' + String(col).replace(/[^a-zA-Z0-9]/g, '');
    const todayJK = pcJKey(new Date());
    const todayDone = !!(action.logs && action.logs[todayJK]);
    const L = (Math.hypot(geom.end.x - geom.originPt.x, geom.end.y - geom.originPt.y) * 1.1) || 1;
    const fs = Math.max(11, 15*scale);
    let sp = Math.max(fs*0.95, 14*scale);
    const usable = L * 0.86;
    if (N*sp > usable) sp = usable / N;
    const span = sp / L;
    let out = '<g class="foot-trail" filter="url(#' + fid + ')" style="pointer-events:none;">' +
      '<defs><filter id="' + fid + '" x="-30%" y="-30%" width="160%" height="160%"><feFlood flood-color="' + col + '" result="f"/><feComposite in="f" in2="SourceAlpha" operator="in"/></filter></defs>';
    for (let i=0; i<N; i++){
      const t = Math.max(0.05, 0.95 - i*span);
      const p = stepPoint(geom, t);
      const a = p.a + Math.PI;
      const deg = (a*180/Math.PI + 90).toFixed(0);
      const newest = (i === N-1);
      const op = (newest && todayDone) ? 1 : (0.5 + 0.35 * (N > 1 ? i/(N-1) : 1));
      out += '<text x="' + p.x.toFixed(1) + '" y="' + p.y.toFixed(1) + '" text-anchor="middle" dy="0.35em" font-size="' + fs.toFixed(1) + '" opacity="' + op.toFixed(2) + '" transform="rotate(' + deg + ' ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')">👣</text>';
    }
    return out + '</g>';
  }

  function pcOrd(i){ return PC_MONTH_ORD[i] || toFa(i+1); }

  function renderPanelPeriodCal(){
    const ctx = pcContext();
    if (!ctx) return;
    const grid = document.getElementById(ctx.p+'-cal');
    if (!grid) return;
    const gp = ensureGoalPeriod(ctx.goal);
    const total = gp.days;
    const past = gp.past;
    const start = pcParseKey(gp.startDate);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayKey = pcLocalKey(new Date());
    const isGoal = ctx.kind === 'goal';

    function gridFor(startKey, days){
      const st = pcParseKey(startKey);
      let html = '', doneCount = 0;
      for (let d=0; d<days; d++){
        const date = new Date(st.getFullYear(), st.getMonth(), st.getDate()+d);
        const gKey = pcLocalKey(date), jKey = pcJKey(date);
        if (d % 30 === 0){
          const endDate = new Date(st.getFullYear(), st.getMonth(), st.getDate()+Math.min(d+29, days-1));
          const mIdx = d/30;
          html += '<div class="pc-month"><b>ماه '+pcOrd(mIdx)+'</b><span>'+pcFaDate(date)+' تا '+pcFaDate(endDate)+'</span></div>';
        }
        const own = !isGoal && !!(ctx.node.logs && ctx.node.logs[jKey]);
        let subCnt = 0;
        ctx.sources.forEach(n=>{ if (n.logs && n.logs[jKey]) subCnt++; });
        const done = isGoal ? subCnt > 0 : own;
        const sub = !isGoal && !own && subCnt > 0;
        if (done || sub) doneCount++;
        const future = date > today;
        let cls = 'pc-day';
        if (done) cls += ' done';
        if (sub) cls += ' sub';
        if (gKey === todayKey) cls += ' today';
        if (future) cls += ' future';
        if (!future) cls += ' tap';
        if (d % 30 === 29 || d === days-1) cls += ' month-end';
        if (gKey === pcSelectedKey) cls += ' sel';
        html += '<div class="'+cls+'" data-pc-key="'+gKey+'"'+((done||sub) ? ' style="background:'+esc(ctx.color)+';"' : '')+'>'+((done||sub) ? '✓' : '')+'</div>';
      }
      return { html: html, doneCount: doneCount };
    }

    const cur = gridFor(gp.startDate, total);
    grid.innerHTML = cur.html;

    const passed = Math.floor((today - start)/86400000) + 1;
    const dayNum = Math.max(1, Math.min(total, passed));
    document.getElementById(ctx.p+'-title').textContent = '🧭 دوره‌ی '+(past.length ? pcOrd(past.length)+' — ' : '')+toFa(total)+' روزه';
    document.getElementById(ctx.p+'-progress').textContent = 'روز '+toFa(dayNum)+' / '+toFa(total);
    document.getElementById(ctx.p+'-hint').textContent = isGoal
      ? 'گزارشِ کارهای همه‌ی این هدف. برای دیدن جزئیات هر روز، روی آن بزن.'
      : ('روی هر روز بزن تا انجام‌شدنش ثبت یا برداشته شود.' + (ctx.sources.length ? ' روزهای کم‌رنگ یعنی فقط موارد داخلش انجام شده‌اند.' : ''));

    const infoEl = document.getElementById(ctx.p+'-info');
    const openPast = {};
    infoEl.querySelectorAll('details.pc-past[open]').forEach(el=>{ openPast[el.dataset.i] = true; });

    let info = '';
    if (isGoal && pcSelectedKey){
      const date = pcParseKey(pcSelectedKey), jKey = pcJKey(date);
      const rows = ctx.sources.filter(n=>n.logs && n.logs[jKey]);
      info += '<div class="pc-info"><b>'+pcFaDate(date)+'</b> — ' + (rows.length ? (toFa(rows.length)+' کار انجام شد') : 'کاری ثبت نشده') +
        (rows.length ? '<ul>'+rows.map(n=>{
          const v = n.logs[jKey];
          const ts = nodeDaySecs(n, jKey);
          return '<li>'+esc(n.text || 'بدون نام')+(v && v !== ROUTINE_DONE_MARK ? ' — '+esc(v) : '')+(ts ? ' · ⏱ '+fmtDur(ts) : '')+(rangesText(n, jKey) ? ' · 🕒 '+rangesText(n, jKey) : '')+'</li>';
        }).join('')+'</ul>' : '') + '</div>';
    }
    {
      const todayJK = pcJKey(new Date());
      const keys = pcPeriodKeys(gp.startDate, total);
      let selJK = todayJK, selDate = new Date();
      if (pcSelectedKey){ const d = pcParseKey(pcSelectedKey), jk = pcJKey(d); if (keys.has(jk)){ selJK = jk; selDate = d; } }
      const srcNodes = isGoal ? ctx.sources : [ctx.node].concat(ctx.sources);
      const daySecs = srcNodes.reduce((a,n)=> a + nodeDaySecs(n, selJK), 0);
      const perSecs = srcNodes.reduce((a,n)=> a + nodeSecs(n, keys), 0);
      const dayLabel = selJK === todayJK ? 'امروز' : pcFaDate(selDate);
      info += '<div class="pc-info pc-time"><b>⏱ زمان</b><div>'+dayLabel+': <b>'+fmtDur(daySecs)+'</b> · مجموع دوره: <b>'+fmtDur(perSecs)+'</b>'+(!isGoal && ctx.sources.length ? ' <span>(با موارد داخلش)</span>' : '')+'</div>';
      {
        const rr = srcNodes.filter(n=> nodeDayRanges(n, selJK).length);
        if (rr.length) info += '<ul class="pc-rng-list" style="margin:6px 0 0;padding-inline-start:18px;font-size:11.5px;">'+rr.map(n=>'<li>'+esc(n.text || 'بدون نام')+' — 🕒 '+rangesText(n, selJK)+'</li>').join('')+'</ul>';
      }
      if (!isGoal){
        const nn = ctx.node;
        info += '<div class="pc-time-btns">'+
          '<button type="button" class="btn gold" data-pc-addtime="'+selJK+'">＋ زمان ('+dayLabel+')</button></div>';
      }
      {
        const rawC = ctx.goal.footColor || (ctx.node && ctx.node.color) || ctx.goal.color || '#2dd4bf';
        const hex = /^#[0-9a-f]{6}$/i.test(rawC) ? rawC : '#2dd4bf';
        info += '<div class="pc-foot">👣 رنگ ردپا: <input type="color" data-pc-footcolor="1" value="'+hex+'"><button type="button" class="btn" data-pc-footreset="1" style="padding:5px 10px;font-size:11px;">پیش‌فرض</button></div>';
      }
      info += '</div>';
      if (!isGoal){
        info += '<div class="pc-info pc-subs"><b>'+dayLabel+'</b>';
        const kidsList = ctx.node.children || [];
        if (!kidsList.length) info += '<div class="pc-hint" style="margin-top:6px;">مثلاً «یوتیوب» یا «کتاب» را اضافه کن، بعد هر روز تیک بزن و زمانش را ثبت کن.</div>';
        kidsList.forEach(c=>{
          const run = timerRunning(c), ts = nodeDaySecs(c, selJK), dn = !!(c.logs && c.logs[selJK]);
          const kc = c.color || ctx.color;
          info += '<div class="pc-sub-row"><button type="button" class="pc-sub-tick" data-pc-subtick="'+c.id+'" data-jk="'+selJK+'" aria-label="تیک" style="border-color:'+esc(kc)+';background:'+(dn ? esc(kc) : 'transparent')+';">'+(dn ? '✓' : '')+'</button>'+
            '<span class="pc-sub-nm">'+esc(c.text || 'بدون نام')+'</span>'+
            '<button type="button" class="pc-sub-set" data-pc-subset="'+c.id+'" data-jk="'+selJK+'" title="ثبت یا ویرایش زمان">'+(ts ? '⏱ '+fmtDur(ts)+' ✎' : '＋ زمان')+'</button></div>'+
            (rangesText(c, selJK) ? '<div class="pc-rng">🕒 '+rangesText(c, selJK)+'</div>' : '');
        });
        info += '<div class="pc-sub-add"><input type="text" class="pc-sub-in" placeholder="مثلاً یوتیوب" autocomplete="off"><button type="button" class="btn gold" data-pc-subadd="1">افزودن</button></div></div>';
      }
    }
    const endOfPeriod = new Date(start.getFullYear(), start.getMonth(), start.getDate()+total);
    const finished = today >= endOfPeriod;
    if (finished){
      info += '<div class="pc-finished">🎉🥳 دوره‌ی '+pcOrd(past.length)+' رو تموم کردی! '+toFa(Math.min(cur.doneCount, total))+' روز از '+toFa(total)+' روز انجام دادی.<br>برای ادامه دوره‌ی بعدی رو شروع کن — دوره‌های قبلی همین‌جا می‌مونن.</div>';
      info += '<button type="button" class="btn full gold" data-pc-new="1" style="margin-top:8px;font-size:11.5px;padding:9px;">▶️ شروع دوره‌ی '+pcOrd(past.length+1)+'</button>';
    } else {
      info += '<button type="button" class="btn full" data-pc-settings="1" style="margin-top:8px;font-size:11.5px;padding:9px;">⚙️ روزهای دوره (الان '+toFa(total)+' روزه)</button>';
    }
    if (past.length){
      info += '<div class="pc-past-list">';
      for (let i=past.length-1; i>=0; i--){
        const r = gridFor(past[i].startDate, past[i].days);
        info += '<details class="pc-past" data-i="'+i+'"'+(openPast[i] ? ' open' : '')+'><summary><span>✅ دوره‌ی '+pcOrd(i)+' — '+toFa(past[i].days)+' روزه</span><span>'+toFa(r.doneCount)+' / '+toFa(past[i].days)+'</span></summary><div class="pc-hgrid">'+r.html+'</div></details>';
      }
      info += '</div>';
    }
    infoEl.innerHTML = info;
  }

  function pcAskDays(question){
    const input = window.prompt(question, String(pcContext() ? ensureGoalPeriod(pcContext().goal).days : 28));
    if (input === null) return 0;
    const fa = '۰۱۲۳۴۵۶۷۸۹', ar = '٠١٢٣٤٥٦٧٨٩';
    const norm = String(input).replace(/[۰-۹٠-٩]/g, c=>{ const i = fa.indexOf(c); return i > -1 ? i : ar.indexOf(c); });
    const n = parseInt(norm, 10);
    if (!n || n < 1 || n > PC_MAX_DAYS){
      if (typeof toast === 'function') toast('یه عدد بین ۱ تا '+toFa(PC_MAX_DAYS)+' وارد کن');
      return 0;
    }
    return n;
  }

  function pcSetDays(){
    const ctx = pcContext();
    if (!ctx) return;
    const gp = ensureGoalPeriod(ctx.goal);
    const n = pcAskDays('دوره‌ی '+pcOrd(gp.past.length)+' چند روزه باشه؟ (۱ تا '+toFa(PC_MAX_DAYS)+' — برای همه‌ی شاخه‌های این هدف یکسانه)');
    if (!n) return;
    gp.days = n;
    scheduleMapSave();
    renderPanelPeriodCal();
    if (typeof toast === 'function') toast('دوره روی '+toFa(n)+' روز تنظیم شد 🌱');
  }

  function pcNewPeriod(){
    const ctx = pcContext();
    if (!ctx) return;
    const gp = ensureGoalPeriod(ctx.goal);
    const n = pcAskDays('دوره‌ی '+pcOrd(gp.past.length+1)+' چند روزه باشه؟ (۱ تا '+toFa(PC_MAX_DAYS)+')');
    if (!n) return;
    gp.past.push({ days: gp.days, startDate: gp.startDate });
    gp.days = n;
    gp.startDate = pcLocalKey(new Date());
    pcSelectedKey = null;
    scheduleMapSave();
    renderPanelPeriodCal();
    if (typeof toast === 'function') toast('دوره‌ی '+pcOrd(gp.past.length)+' شروع شد 🌱');
  }

  function pcOnClick(e){
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('[data-pc-settings]')){ pcSetDays(); return; }
    if (t.closest('[data-pc-new]')){ pcNewPeriod(); return; }
    const tb = t.closest('[data-pc-timer]');
    if (tb){
      const c0 = pcContext();
      if (c0 && c0.node){
        if (tb.dataset.pcTimer === 'start') startTimer(c0.node); else stopTimer(c0.node);
        render(); renderPanelPeriodCal();
      }
      return;
    }
    const ab = t.closest('[data-pc-addtime]');
    if (ab){
      const c0 = pcContext();
      if (c0 && c0.node){
        const pnode = c0.node, pjk = ab.dataset.pcAddtime;
        askDuration({ title:'چقدر زمان ثبت بشه؟', sub:jkLabel(pjk) + ' · ' + (pnode.text || ''), defMin:60 }, m=>{
          if (m){ addMinutes(pnode, pjk, m); render(); renderPanelPeriodCal(); }
        });
      }
      return;
    }
    if (t.closest('[data-pc-footreset]')){
      const c0 = pcContext();
      if (c0){ delete c0.goal.footColor; scheduleMapSave(); render(); renderPanelPeriodCal(); }
      return;
    }
    const sa = t.closest('[data-pc-subadd]');
    if (sa){
      const c0 = pcContext();
      if (c0 && c0.node){
        const box = sa.closest('.pc-subs'), inp = box && box.querySelector('.pc-sub-in');
        const txt = ((inp && inp.value) || '').trim();
        if (!txt){ if (typeof toast === 'function') toast('یه اسم بنویس'); return; }
        if (!Array.isArray(c0.node.children)) c0.node.children = [];
        c0.node.children.push({ id:uid(), text:txt, weight:5, color:null, children:[], detached:false, images:[], radius:10, createdAt:Date.now(), logs:{} });
        c0.goal.lastActivity = Date.now();
        scheduleMapSave(); render(); renderPanelPeriodCal();
        try{ refreshActionChildrenPanel(); }catch(err){}
      }
      return;
    }
    const sT = t.closest('[data-pc-subtimer]');
    if (sT){
      const c0 = pcContext();
      const kid = c0 && c0.node ? findActionNode(c0.node.children || [], sT.dataset.pcSubtimer) : null;
      if (kid){
        const n = kid.node;
        if (timerRunning(n)){ const jk = pcJKey(new Date(n.timerStart)); stopTimer(n); autoTick(c0.node, jk); }
        else startTimer(n);
        render(); renderPanelPeriodCal();
      }
      return;
    }
    const sTk = t.closest('[data-pc-subtick]');
    if (sTk){
      const c0 = pcContext();
      const kid = c0 && c0.node ? findActionNode(c0.node.children || [], sTk.dataset.pcSubtick) : null;
      if (kid){
        toggleRoutineLog(kid.node.id, sTk.dataset.jk);
        if (kid.node.logs && kid.node.logs[sTk.dataset.jk]) autoTick(c0.node, sTk.dataset.jk);
        render(); renderPanelPeriodCal();
      }
      return;
    }
    const sSet = t.closest('[data-pc-subset]');
    if (sSet){
      const c0 = pcContext();
      const kid = c0 && c0.node ? findActionNode(c0.node.children || [], sSet.dataset.pcSubset) : null;
      if (kid){
        const jk = sSet.dataset.jk;
        const kcur = Math.round(nodeDaySecs(kid.node, jk)/60);
        const knode = kid.node, hostNode = c0.node;
        askDuration({ title:jkLabel(jk), sub:'زمان این روز · ' + (knode.text || ''), defMin:kcur || 60, allowZero:true, deletable:kcur > 0 }, mm=>{
          setDayMinutes(knode, jk, mm); if (mm > 0) autoTick(hostNode, jk); render(); renderPanelPeriodCal();
        });
      }
      return;
    }
    const sM = t.closest('[data-pc-subtime]');
    if (sM){
      const c0 = pcContext();
      const kid = c0 && c0.node ? findActionNode(c0.node.children || [], sM.dataset.pcSubtime) : null;
      if (kid){
        const knode2 = kid.node, hostNode2 = c0.node, kjk = sM.dataset.jk;
        askDuration({ title:'چقدر زمان ثبت بشه؟', sub:jkLabel(kjk) + ' · ' + (knode2.text || ''), defMin:60 }, m=>{
          if (m){ addMinutes(knode2, kjk, m); autoTick(hostNode2, kjk); render(); renderPanelPeriodCal(); }
        });
      }
      return;
    }
    const cell = t.closest('.pc-day[data-pc-key]');
    if (!cell || cell.classList.contains('future')) return;
    const ctx = pcContext();
    if (!ctx) return;
    if (ctx.kind === 'action'){
      const jk = pcJKey(pcParseKey(cell.dataset.pcKey));
      const cur = ctx.node.logs && ctx.node.logs[jk];
      if (cur && cur !== ROUTINE_DONE_MARK && !window.confirm('برای این روز یک یادداشت ثبت شده:\n«'+String(cur).slice(0,80)+'»\nبرداشته بشه؟')) return;
      pcSelectedKey = cell.dataset.pcKey;
      toggleRoutineLog(panelTarget.actionId, jk);
    } else {
      pcSelectedKey = (pcSelectedKey === cell.dataset.pcKey) ? null : cell.dataset.pcKey;
      renderPanelPeriodCal();
    }
  }
  ['gp-goal-card','gp-action-card'].forEach(id=>{
    const el = document.getElementById(id);
    if (el){
      el.addEventListener('click', pcOnClick);
      el.addEventListener('input', (e)=>{
        const t = e.target;
        if (!t || !t.matches || !t.matches('[data-pc-footcolor]')) return;
        const c0 = pcContext();
        if (c0){ c0.goal.footColor = t.value; scheduleMapSave(); render(); }
      });
    }
  });

  function cleanupLegacyCalNotes(){
    let changed = false;
    function hasContent(n){
      return (Array.isArray(n.children) && n.children.length > 0) ||
        (n.logs && Object.keys(n.logs).length > 0);
    }
    function dropTracked(owner, list){
      const ids = owner.logBranchIds;
      if (!ids || typeof ids !== 'object') return;
      Object.keys(ids).forEach(key=>{
        const f = findActionNode(list || [], ids[key]);
        if (f && !hasContent(f.node)) f.list.splice(f.list.indexOf(f.node), 1);
      });
      delete owner.logBranchIds;
      changed = true;
    }
    function stripNotes(owner){
      if (!owner.logs || typeof owner.logs !== 'object') return;
      Object.keys(owner.logs).forEach(k=>{
        const v = owner.logs[k];
        if (typeof v === 'string' && v !== ROUTINE_DONE_MARK){ owner.logs[k] = ROUTINE_DONE_MARK; changed = true; }
      });
    }
    function walk(list){
      (list || []).slice().forEach(n=>{
        dropTracked(n, n.children);
        stripNotes(n);
        walk(n.children);
      });
    }
    (state.goals || []).forEach(g=>{
      dropTracked(g, g.actions);
      if (g.logs && Object.keys(g.logs).length){ g.logs = {}; changed = true; }
      walk(g.actions);
    });
    if (changed) scheduleMapSave();
  }
  try{ cleanupLegacyCalNotes(); }catch(e){ console.warn('[cal-cleanup]', e); }

  window.frequencyMapRender = render;

  render();
})();
