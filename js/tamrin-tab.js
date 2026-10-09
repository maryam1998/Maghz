/* ---------------- فیلتر محتوای نامناسب ---------------- */
const BANNED_WORDS = [
  /* موضوعات سیاسی (عادی؛ بر اساس بخشی از متن) */
  'سیاسی','سیاست','انتخابات','رئیس‌جمهور','رییس جمهور',
  'رهبر انقلاب','حکومت','رژیم','اصلاح‌طلب','اصلاح طلب',
  'اصولگرا','براندازی','انقلاب','اعتراضات','تحریم',
  'مجلس','حزب','رفراندوم','جمهوری اسلامی','سلطنت‌طلب',
  'سلطنت طلب','دولت'
];
/* کلمات نامناسب به‌صورت متن خوانا در برنامه نیست؛ فقط اثرانگشتِ یک‌طرفه (هش) ذخیره شده
   و متن کاربر کلمه‌به‌کلمه با آن‌ها مقایسه می‌شود. بازیابیِ کلمه از روی هش ممکن نیست. */
const BANNED_HASHES = new Set([
  '01aaaabeca4efe6a','02a8a4237194c658','08a8ad9565bc9bf1','1578f7f93125f308',
  '1e4fcefe00425218','2c06520d1e615e90','30ffffdbe116a306','35dc92ca07288b0b',
  '41d872d80ffa9e59','47b3c5b5edf9f9a2','50c6245d1d8d25cc','57eac029e1c40db4',
  '6171c4b51d642e3f','61c91e8a80c227a0','62a0f7de07668fa6','6537d0941beed072',
  '6af77a1c8401b03a','6cd5e87b8a86223f','7c9ae63ffb604387','81602170e4611ac7',
  '909f228d53151e61','91b887d376a6c3d9','92a4ff902b393f7f','92f10755dc690691',
  '9879638adb82998c','988b1ec5fa118c27','a856eb338e0807fd','a9a1d1ddaecac09a',
  'b83ae030aefe0496','b99bf9867bd8b693','c27a98b047154dcb','c9747efa7888df7a',
  'cefa23cbc5fa7cbb','d95c3b1f43ced6d2','da26bf9e6555fcbe','dac84a0510cc3019',
  'e6774d4a8b4a2345','edb23f2e143a5c65','fbbc16bee6a17d01'
]);
const BANNED_STEM_HASHES = new Set([
  '1e4fcefe00425218','2c06520d1e615e90','30ffffdbe116a306','6171c4b51d642e3f',
  '909f228d53151e61','92f10755dc690691','9879638adb82998c','988b1ec5fa118c27',
  'b83ae030aefe0496','c27a98b047154dcb','da26bf9e6555fcbe','edb23f2e143a5c65'
]);
const BANNED_AMBIG = { '08a8ad9565bc9bf1': ['هیچ','هر','یک','چند','آن','این','همه','هرکس','هیچکس'] };
const BANNED_SUFFIX = ['ها','های','ام','ات','اش','تون','شون','مون','ان','ید','ین','یم','ی','م','ت','ش','ه','ا','ing','ed','er','es','s','y'];
function _bwHash(s){
  let h1 = 0x811c9dc5, h2 = 0x9e3779b1;
  for(let i=0;i<s.length;i++){
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ((c + i) >>> 0), 0x85ebca6b) >>> 0;
    h2 = (h2 ^ (h2 >>> 13)) >>> 0;
  }
  return ('00000000' + h1.toString(16)).slice(-8) + ('00000000' + h2.toString(16)).slice(-8);
}
function _bwTokenHit(tok, prev){
  const hh = _bwHash(tok);
  if(BANNED_HASHES.has(hh)){
    const amb = BANNED_AMBIG[hh];
    if(amb && prev && amb.indexOf(prev) !== -1) return false;
    return true;
  }
  /* پسوندهای رایج (فقط وقتی ریشه حداقل ۴ حرف باشد تا کلمات عادیِ کوتاه اشتباهی نگیرند) */
  let cur = [tok];
  for(let depth=0; depth<2; depth++){
    const next = [];
    cur.forEach(function(w){
      BANNED_SUFFIX.forEach(function(sf){
        if(w.length - sf.length >= 4 && w.endsWith(sf)){
          const b = w.slice(0, w.length - sf.length);
          if(BANNED_HASHES.has(_bwHash(b))) next.push('!'); else next.push(b);
        }
      });
    });
    if(next.indexOf('!') !== -1) return true;
    cur = next;
    if(!cur.length) break;
  }
  /* ریشه‌های بلند: کلمه‌ای که با آن‌ها شروع می‌شود */
  for(let L=5; L<=tok.length; L++){
    if(BANNED_STEM_HASHES.has(_bwHash(tok.slice(0, L)))) return true;
  }
  return false;
}
function containsProfanity(t){
  const toks = t.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  for(let i=0;i<toks.length;i++){
    if(_bwTokenHit(toks[i], i>0 ? toks[i-1] : '')) return true;
    for(let n=2;n<=3 && i+n<=toks.length;n++){
      const ph = toks.slice(i, i+n).join(' ');
      if(BANNED_HASHES.has(_bwHash(ph)) || BANNED_HASHES.has(_bwHash(ph.replace(/ /g,'')))) return true;
    }
  }
  return false;
}
function normalizeForFilter(str){
  return (str||'')
    .replace(/[\u064B-\u065F\u0670]/g,'')
    .replace(/ي/g,'ی').replace(/ك/g,'ک')
    .replace(/\u0640/g,'')
    .replace(/[\u200c]+/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase()
    .replace(/(.)\1{2,}/g,'$1');
}
function containsBannedContent(text){
  const t = normalizeForFilter(text);
  if(!t) return false;
  if(BANNED_WORDS.some(w => t.indexOf(normalizeForFilter(w)) !== -1)) return true;
  return containsProfanity(t);
}
function escapeHtml(str){
  return (str==null?'':String(str)).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function nl2br(str){ return String(str).replace(/\n/g, '<br>'); }
function autoGrowGratInput(el){
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

(function(){
  const HANDLERS = {
    'home-grat-input': function(){ return addGratitudeHome(); },
    'grat-input':      function(){ return addGratitude(); },
    'grat-edit-text':  function(){ return saveGratEdit(); }
  };
  const HOLD_MS = 500;
  let timer = null, fired = false, resetT = null;
  function clearTimer(){ if(timer){ clearTimeout(timer); timer = null; } }
  function fire(el){
    clearTimer();
    if(fired) return;
    fired = true;
    clearTimeout(resetT);
    resetT = setTimeout(function(){ fired = false; }, 1500);
    el.value = el.value.replace(/\n+$/, '');
    try{ if(navigator.vibrate) navigator.vibrate(25); }catch(e){}
    try{ HANDLERS[el.id](); }catch(err){}
  }
  function isEnter(e){ return e.key === 'Enter' || e.keyCode === 13; }
  document.addEventListener('keydown', function(e){
    const el = e.target;
    if(!el || !HANDLERS[el.id] || !isEnter(e) || e.isComposing && e.keyCode !== 13) return;
    if(e.ctrlKey || e.metaKey){ e.preventDefault(); fire(el); return; }
    if(e.shiftKey) return;
    if(fired){ e.preventDefault(); return; }
    if(e.repeat){ e.preventDefault(); fire(el); return; }
    if(!timer) timer = setTimeout(function(){ fire(el); }, HOLD_MS);
  }, true);
  document.addEventListener('keyup', function(e){
    if(!isEnter(e)) return;
    clearTimer();
    clearTimeout(resetT);
    resetT = setTimeout(function(){ fired = false; }, 50);
  }, true);
  document.addEventListener('focusout', function(e){
    if(e.target && HANDLERS[e.target.id]){ clearTimer(); fired = false; }
  }, true);
  let downAt = 0, breakAt = 0, lastBreak = 0;
  function isBreak(e){ return e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph'; }
  document.addEventListener('keydown', function(e){
    if(e.target && HANDLERS[e.target.id] && !e.repeat) downAt = Date.now();
  }, true);
  document.addEventListener('beforeinput', function(e){
    const el = e.target;
    if(!el || !HANDLERS[el.id] || !isBreak(e)) return;
    const now = Date.now();
    if(fired){ e.preventDefault(); return; }
    if(lastBreak && now - lastBreak < 150){ e.preventDefault(); lastBreak = 0; fire(el); return; }
    lastBreak = now; breakAt = now;
  }, true);
  function holdCheck(e){
    const el = e.target;
    if(!el || !HANDLERS[el.id] || !downAt) return;
    const now = Date.now();
    if(now - downAt >= HOLD_MS && breakAt >= downAt - 40 && breakAt <= now + 40 && !fired){
      downAt = 0; fire(el);
    }
  }
  document.addEventListener('keyup', holdCheck, true);
  document.addEventListener('touchend', function(e){ if(e.target && HANDLERS[e.target.id]) holdCheck(e); }, true);
})();

/* ===== موتور صوتی Nothing ===== */
let __audioCtx = null;
function getAudioCtx(){
  if(__audioCtx) return __audioCtx;
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return null;
    __audioCtx = new Ctx();
  }catch(e){ return null; }
  return __audioCtx;
}
function resumeAudio(){
  const ctx = getAudioCtx();
  if(ctx && ctx.state === 'suspended'){ ctx.resume().catch(()=>{}); }
  return ctx;
}
function isNothingSoundOn(){ return state.nothingSoundOn !== false; }
function toggleNothingSound(){
  state.nothingSoundOn = !isNothingSoundOn();
  saveState();
  const btn = document.getElementById('nothing-sound-toggle');
  if(btn) btn.textContent = isNothingSoundOn() ? '🔔' : '🔕';
  if(typeof toast === 'function'){
    toast(isNothingSoundOn() ? 'صدای تمرین روشن شد 🔔' : 'صدای تمرین خاموش شد 🔕');
  }
  if(isNothingSoundOn()) resumeAudio();
}
function playReleaseChime(index){
  if(!isNothingSoundOn()) return;
  const ctx = resumeAudio();
  if(!ctx) return;
  const freqs = [396, 480, 594, 720, 852];
  const base = freqs[Math.max(0, Math.min(4, index))] || 528;
  const now  = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const osc = ctx.createOscillator();
  osc.type = 'sine'; osc.frequency.value = base;
  const harm = ctx.createOscillator();
  harm.type = 'sine'; harm.frequency.value = base * 2.0;
  const harmGain = ctx.createGain(); harmGain.gain.value = 0.12;
  harm.connect(harmGain).connect(master);
  osc.connect(master);
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.22, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
  osc.start(now);  osc.stop(now + 1.8);
  harm.start(now); harm.stop(now + 1.8);
  if(navigator.vibrate) try{ navigator.vibrate(18); }catch(e){}
}
function playCompletionGong(){
  if(!isNothingSoundOn()) return;
  const ctx = resumeAudio();
  if(!ctx) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 136.1;
  const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 204.15;
  const o2g = ctx.createGain(); o2g.gain.value = 0.35;
  o2.connect(o2g).connect(master);
  o1.connect(master);
  const bufSize = ctx.sampleRate * 2.8;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for(let i = 0; i < bufSize; i++) data[i] = (Math.random()*2 - 1) * 0.08;
  const noise = ctx.createBufferSource(); noise.buffer = buf;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass'; noiseFilter.frequency.value = 420;
  const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.05;
  noise.connect(noiseFilter).connect(noiseGain).connect(master);
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.28, now + 0.06);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
  o1.start(now); o1.stop(now + 3.6);
  o2.start(now); o2.stop(now + 3.6);
  noise.start(now); noise.stop(now + 3.6);
  if(navigator.vibrate) try{ navigator.vibrate([22, 40, 60]); }catch(e){}
}
function playUndoSoft(){
  if(!isNothingSoundOn()) return;
  const ctx = resumeAudio();
  if(!ctx) return;
  const now = ctx.currentTime;
  const g = ctx.createGain(); g.gain.value = 0; g.connect(ctx.destination);
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(420, now);
  o.frequency.exponentialRampToValueAtTime(220, now + 0.22);
  o.connect(g);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.14, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  o.start(now); o.stop(now + 0.4);
  if(navigator.vibrate) try{ navigator.vibrate(10); }catch(e){}
}

const STORAGE_KEY = 'abundanceBankData';
let state = loadState();
var gratListLimit = { home: 40, hist: 40 };
let cart = [];
let pendingItems = [];
let customImage = null;
let tempCurrency = null;

const GRATITUDE_PHASES = [
  {
    name: 'ایمنی و بدن', short: 'آمیگدال',
    prompts: [
      'یک بخش از بدنت که امروز بدون درد کار کرد',
      'یک لحظه که در آن احساس امنیت کردی',
      'یک غذایی که امروز خوردی و بهت انرژی داد',
      'یک صدای آشنا که امروز شنیدی (باران، بچه‌ها، موسیقی)',
      'یک جای بدنت که قوی‌تر از چند سال پیش است',
      'یک نفس عمیق که امروز آگاهانه کشیدی',
      'یک لحظه که بدنت بهت سیگنال آرامش داد (خمیازه، کشش، گرم شدن)'
    ]
  },
  {
    name: 'پیوند و دیگران', short: 'mentalizing',
    prompts: [
      'یک نفر که امروز بدون این‌که بخواهی، حواسش بهت بود',
      'یک نفر که در گذشته بهت کمک کرد و هنوز فکرش را می‌کنی',
      'یک غریبه که امروز یک کار کوچک برات کرد (نگه‌داشتن در، لبخند، راهنمایی)',
      'یک نفر از خانواده‌ات — و چرا این کار را برات کرد؟ نیتش چه بود؟',
      'یک نفر که امروز به او کمک کردی و از این کار حس خوبی گرفتی',
      'یک دوست که مدتیه ندیدیش ولی حضورش را در زندگی‌ات حس می‌کنی',
      'یک نفر که نیتش برای کمکت، حتی از نتیجه‌اش مهم‌تر بود'
    ]
  },
  {
    name: 'چالش و رشد', short: 'بازآرزیابی',
    prompts: [
      'یک مشکل که امروز داشتی ولی ازش یاد گرفتی',
      'یک اشتباه قدیمی که امروز می‌بینی به نفعت تمام شد',
      'یک «نه» که بهت گفتن و بعداً فهمیدی چرا بهتر بود',
      'یک سختی که از پسش براومدی و الان قوی‌ترت کرد',
      'یک چیز که از دست دادی و بعدش فضای چیز بهتری باز شد',
      'یک انتقاد که شنیدی و بعداً دیدی درست بود',
      'یک روز بد که یک چیز کوچک توش نجاتت داد'
    ]
  },
  {
    name: 'هویت و وجود', short: 'DMN',
    prompts: [
      'یک استعدادی که داری و به آن عادت کردی',
      'یک انتخاب که در گذشته کردی و امروزت را ساختی',
      'یک لحظه که امروز از خودت راضی بودی',
      'یک بخش از شخصیتت که دوستش داری',
      'یک بار که به خودت سخت گرفتی و بعد بخشیدی',
      'این مسیر ۲۷ روزه — برای این‌که ادامه دادی',
      'خودِ زندگی — بدون هیچ دلیل خاصی'
    ]
  }
];

const GRATITUDE_THEMES = GRATITUDE_PHASES.map(p => ({ title: p.name, hint: p.prompts[0] }));
const GRATITUDE_ALL_PROMPTS = GRATITUDE_PHASES.reduce(function(acc, p){ return acc.concat(p.prompts); }, []);

function ensureGratitudePeriod(){
  if(!state.gratitudePeriod || typeof state.gratitudePeriod !== 'object') state.gratitudePeriod = { days: 28, startDate: null };
  if(!state.gratitudePeriod.days || state.gratitudePeriod.days < 1) state.gratitudePeriod.days = 28;
  if(!state.gratitudePeriod.startDate) state.gratitudePeriod.startDate = state.startDate || new Date().toISOString().slice(0,10);
  if(!Array.isArray(state.gratitudePeriod.past)) state.gratitudePeriod.past = [];
  return state.gratitudePeriod;
}
function gratitudePeriodDaysPassed(){
  const gp = ensureGratitudePeriod();
  const start = new Date(gp.startDate+'T00:00:00');
  const diff = Math.floor((todayMidnight()-start)/86400000)+1;
  return Math.max(1, diff);
}
function getGratitudePhaseInfo(){
  const gp = ensureGratitudePeriod();
  const totalDays = gp.days;
  const day = Math.max(1, Math.min(totalDays, gratitudePeriodDaysPassed()));
  const idxInCycle = (day - 1) % GRATITUDE_ALL_PROMPTS.length;
  const phaseIdx = Math.floor(idxInCycle / 7) % GRATITUDE_PHASES.length;
  const dayInPhase = idxInCycle % 7;
  const phase = GRATITUDE_PHASES[phaseIdx];
  return {
    day, totalDays,
    phaseName: phase.name, phaseShort: phase.short,
    phaseIndex: phaseIdx, dayInPhase: dayInPhase + 1,
    prompt: phase.prompts[dayInPhase]
  };
}
function currentThemeDay(){ return getGratitudePhaseInfo().day; }

function renderThemeBanner(){
  const info = getGratitudePhaseInfo();
  const tbProgress = document.getElementById('tb-progress');
  const tbTitle    = document.getElementById('tb-title');
  const tbHint     = document.getElementById('tb-hint');
  const tbBarFill  = document.getElementById('tb-bar-fill');
  const tbDayLabel = document.querySelector('.theme-banner .tb-day');

  if(tbProgress) tbProgress.textContent = 'روز ' + info.day.toLocaleString('fa-IR') + ' / ' + info.totalDays.toLocaleString('fa-IR');
  if(tbTitle)    tbTitle.textContent = 'فاز ' + (info.phaseIndex + 1).toLocaleString('fa-IR') + ' — ' + info.phaseName;
  if(tbHint)     tbHint.textContent = '🎯 ' + info.prompt;
  if(tbBarFill)  tbBarFill.style.width = (info.day / info.totalDays * 100) + '%';
  if(tbDayLabel){
    const pastCount = ensureGratitudePeriod().past.length;
    tbDayLabel.textContent = '🧭 دوره‌ی ' + (pastCount ? periodOrdFa(pastCount) + ' — ' : '') + info.totalDays.toLocaleString('fa-IR') + ' روزه — ' + info.phaseShort;
  }
  const input = document.getElementById('home-grat-input');
  if(input) input.placeholder = '🎯 ' + info.prompt;

  const hProgress = document.getElementById('hist-tb-progress');
  const hTitle    = document.getElementById('hist-tb-title');
  const hHint     = document.getElementById('hist-tb-hint');
  const hBarFill  = document.getElementById('hist-tb-bar-fill');
  const hDayLabel = document.getElementById('hist-tb-day');
  if(hProgress) hProgress.textContent = 'روز ' + info.day.toLocaleString('fa-IR') + ' / ' + info.totalDays.toLocaleString('fa-IR');
  if(hTitle)    hTitle.textContent = 'فاز ' + (info.phaseIndex + 1).toLocaleString('fa-IR') + ' — ' + info.phaseName;
  if(hHint)     hHint.textContent = '🎯 ' + info.prompt;
  if(hBarFill)  hBarFill.style.width = (info.day / info.totalDays * 100) + '%';
  if(hDayLabel){
    const hPast = ensureGratitudePeriod().past.length;
    hDayLabel.textContent = '🧭 دوره‌ی ' + (hPast ? periodOrdFa(hPast) + ' — ' : '') + info.totalDays.toLocaleString('fa-IR') + ' روزه — ' + info.phaseShort;
  }
  const histInput = document.getElementById('grat-input');
  if(histInput) histInput.placeholder = '🎯 ' + info.prompt;
  renderGratitudeMiniCal();
}

function gratitudeDoneDaySet(){
  const set = {};
  (state.gratitude || []).filter(function(g){ return g.iso && g.source !== 'purchase'; }).forEach(function(g){
    set[dayKeyFromIso(g.iso)] = true;
  });
  return set;
}

const MONTH_ORDINALS_FA = ['اول','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم','دهم','یازدهم','دوازدهم'];
function periodOrdFa(i){ return MONTH_ORDINALS_FA[i] || (i+1).toLocaleString('fa-IR'); }
function periodParseDays(input, max){
  const n = parseInt(normalizeDigits(String(input)), 10);
  return (n && n >= 1 && n <= max) ? n : 0;
}
function periodGridHtml(startKey, totalDays, doneSet, keyAttr, emoPk){
  const startDate = new Date(startKey+'T00:00:00');
  const today = todayMidnight();
  const todayKeyStr = dayKeyFromDate(new Date());
  const blockSize = 30;
  const fmt = function(dt){
    try{ return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {day:'numeric', month:'long'}).format(dt); }
    catch(e){ return ''; }
  };
  let html = '';
  let doneCount = 0;
  for(let d=0; d<totalDays; d++){
    const date = new Date(startDate);
    date.setDate(date.getDate()+d);
    const key = dayKeyFromDate(date);
    if(d % blockSize === 0){
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.min(d+blockSize, totalDays) - 1);
      html += '<div class="mini-cal-month"><b>ماه ' + periodOrdFa(Math.floor(d/blockSize)) + '</b>' +
        '<span>' + fmt(date) + ' تا ' + fmt(endDate) + '</span></div>';
    }
    const done = !!doneSet[key];
    if(done) doneCount++;
    let cls = 'mini-cal-day';
    if(done) cls += ' done';
    if(key === todayKeyStr) cls += ' today';
    if(date > today) cls += ' future';
    if((d % blockSize) === blockSize-1 || d === totalDays-1) cls += ' month-end';
    let emoStyle = '';
    if(emoPk && state.practiceEmotions && state.practiceEmotions[key] && state.practiceEmotions[key][emoPk]){
      const rec = state.practiceEmotions[key][emoPk];
      const eids = (rec.after && rec.after.length) ? rec.after : (rec.before || []);
      let dom = null;
      eids.forEach(function(id){ const e = EMOTION_BY_ID[id]; if(e && (!dom || e.freq > dom.freq)) dom = e; });
      if(dom) emoStyle = ' style="box-shadow:0 0 0 2px ' + dom.color + ';" title="' + eids.map(function(id){ return EMOTION_BY_ID[id] ? EMOTION_BY_ID[id].fa : ''; }).join('، ') + '"';
    }
    html += '<div class="' + cls + '" ' + keyAttr + '="' + key + '"' + emoStyle + '>' + (done ? '✓' : '') + '</div>';
  }
  return { html: html, doneCount: doneCount };
}
function periodOpenState(container){
  const m = {};
  container.querySelectorAll('details.mini-cal-past[open]').forEach(function(el){ m[el.dataset.i] = true; });
  return m;
}
function periodPastHtml(past, doneSet, keyAttr, openMap){
  if(!past || !past.length) return '';
  let html = '<div class="mini-cal-past-list">';
  for(let i=past.length-1; i>=0; i--){
    const r = periodGridHtml(past[i].startDate, past[i].days, doneSet, keyAttr);
    html += '<details class="mini-cal-past" data-i="' + i + '"' + (openMap && openMap[i] ? ' open' : '') + '>' +
      '<summary><span>✅ دوره‌ی ' + periodOrdFa(i) + ' — ' + past[i].days.toLocaleString('fa-IR') + ' روزه</span>' +
      '<span>' + r.doneCount.toLocaleString('fa-IR') + ' / ' + past[i].days.toLocaleString('fa-IR') + '</span></summary>' +
      '<div class="mini-cal-inner">' + r.html + '</div></details>';
  }
  return html + '</div>';
}
function periodInfoHtml(pd, finished, doneCount, doneWord, doneSet, keyAttr, newFn, setFn, openMap){
  const totalDays = pd.days;
  const ord = periodOrdFa(pd.past.length);
  let html = '';
  if(finished){
    html += '<div class="cal-finished">🎉🥳 دوره‌ی ' + ord + ' رو تموم کردی! ' + Math.min(doneCount, totalDays).toLocaleString('fa-IR') + ' روز از ' + totalDays.toLocaleString('fa-IR') + ' روز ' + doneWord + ' کردی.<br>برای ادامه دوره‌ی بعدی رو شروع کن — دوره‌های قبلی همین‌جا می‌مونن.</div>' +
      '<button type="button" class="btn tiny gold" style="width:100%;margin-top:8px;font-size:11.5px;padding:9px;" onclick="' + newFn + '()">▶️ شروع دوره‌ی ' + periodOrdFa(pd.past.length+1) + '</button>';
  } else {
    html += '<button type="button" class="btn tiny" style="width:100%;margin-top:8px;font-size:11.5px;padding:9px;" onclick="' + setFn + '()">⚙️ روزهای دوره (الان ' + totalDays.toLocaleString('fa-IR') + ' روزه)</button>';
  }
  return html + periodPastHtml(pd.past, doneSet, keyAttr, openMap);
}
function periodStartNext(pd, input, max){
  const n = periodParseDays(input, max);
  if(!n) return 0;
  pd.past.push({ days: pd.days, startDate: pd.startDate });
  pd.days = n;
  pd.startDate = dayKeyFromDate(new Date());
  return n;
}

function renderGratitudeMiniCal(){
  const gp = ensureGratitudePeriod();
  const totalDays = gp.days;
  const doneSet = gratitudeDoneDaySet();
  const startDate = new Date(gp.startDate+'T00:00:00');
  const today = todayMidnight();
  const cur = periodGridHtml(gp.startDate, totalDays, doneSet, 'data-cal-key', 'gratitude');
  const finished = today >= (function(){ const e = new Date(startDate); e.setDate(e.getDate()+totalDays); return e; })();

  [['gratitude-mini-cal','gratitude-mini-cal-info'], ['bank-cal-period-grid','bank-cal-period-info'], ['hist-gratitude-mini-cal','hist-gratitude-mini-cal-info']].forEach(function(ids){
    const wrap = document.getElementById(ids[0]);
    const info2 = document.getElementById(ids[1]);
    if(!wrap) return;
    wrap.innerHTML = cur.html;
    if(info2){
      info2.innerHTML = periodInfoHtml(gp, finished, cur.doneCount, 'شکرگذاری', doneSet, 'data-cal-key', 'startNewGratitudePeriod', 'setGratitudePeriodDays', periodOpenState(info2));
    }
  });
}

function setGratitudePeriodDays(){
  const gp = ensureGratitudePeriod();
  const input = window.prompt('دوره‌ی ' + periodOrdFa(gp.past.length) + ' چند روزه باشه؟', String(gp.days));
  if(input === null) return;
  const n = periodParseDays(input, Infinity);
  if(!n){
    if(typeof toast === 'function') toast('یه عدد معتبر بزرگ‌تر از صفر وارد کن');
    return;
  }
  gp.days = n;
  try{ saveState(); }catch(e){}
  renderThemeBanner();
  if(typeof toast === 'function') toast('دوره روی ' + n.toLocaleString('fa-IR') + ' روز تنظیم شد 🌱');
}
function startNewGratitudePeriod(){
  const gp = ensureGratitudePeriod();
  const input = window.prompt('دوره‌ی ' + periodOrdFa(gp.past.length+1) + ' چند روزه باشه؟', String(gp.days));
  if(input === null) return;
  const n = periodStartNext(gp, input, Infinity);
  if(!n){
    if(typeof toast === 'function') toast('یه عدد معتبر بزرگ‌تر از صفر وارد کن');
    return;
  }
  try{ saveState(); }catch(e){}
  renderThemeBanner();
  if(typeof toast === 'function') toast('دوره‌ی ' + periodOrdFa(gp.past.length) + ' شروع شد 🌱');
}

const MONTH_ORDINALS_FA_SHOP = ['اول','دوم','سوم','چهارم','پنجم','ششم','هفتم','هشتم','نهم','دهم','یازدهم','دوازدهم','سیزدهم'];
const SHOP_PERIOD_MAX_DAYS = 365;
function ensureShopPeriod(){
  if(!state.shopPeriod || typeof state.shopPeriod !== 'object') state.shopPeriod = { days: 28, startDate: null };
  if(!state.shopPeriod.days || state.shopPeriod.days < 1) state.shopPeriod.days = 28;
  if(!state.shopPeriod.startDate) state.shopPeriod.startDate = dayKeyFromDate(new Date());
  if(!Array.isArray(state.shopPeriod.past)) state.shopPeriod.past = [];
  return state.shopPeriod;
}
function renderShopMiniCal(){
  const wrap = document.getElementById('shop-mini-cal');
  if(!wrap) return;
  const info = document.getElementById('shop-mini-cal-info');
  const titleEl = document.getElementById('shop-period-title');
  const progEl = document.getElementById('shop-period-progress');
  const sp = ensureShopPeriod();
  const totalDays = Math.min(sp.days, SHOP_PERIOD_MAX_DAYS);
  const doneSet = {};
  (state.history || []).forEach(function(h){ if(h && h.iso) doneSet[dayKeyFromIso(h.iso)] = true; });
  const startDate = new Date(sp.startDate + 'T00:00:00');
  const today = todayMidnight();
  const cur = periodGridHtml(sp.startDate, totalDays, doneSet, 'data-shop-key');
  wrap.innerHTML = cur.html;
  const passed = Math.floor((today - startDate)/86400000) + 1;
  const dayNum = Math.max(1, Math.min(totalDays, passed));
  if(titleEl) titleEl.textContent = '🧭 دوره‌ی ' + (sp.past.length ? periodOrdFa(sp.past.length) + ' — ' : '') + totalDays.toLocaleString('fa-IR') + ' روزه';
  if(progEl)  progEl.textContent = 'روز ' + dayNum.toLocaleString('fa-IR') + ' / ' + totalDays.toLocaleString('fa-IR');
  if(info){
    const endOfPeriod = new Date(startDate); endOfPeriod.setDate(endOfPeriod.getDate() + totalDays);
    const finished = today >= endOfPeriod;
    info.innerHTML = periodInfoHtml(sp, finished, cur.doneCount, 'خرید ثبت', doneSet, 'data-shop-key', 'startNewShopPeriod', 'setShopPeriodDays', periodOpenState(info));
  }
}
function setShopPeriodDays(){
  const sp = ensureShopPeriod();
  const input = window.prompt('دوره‌ی ' + periodOrdFa(sp.past.length) + ' چند روزه باشه؟ (۱ تا ' + SHOP_PERIOD_MAX_DAYS.toLocaleString('fa-IR') + ')', String(sp.days));
  if(input === null) return;
  const n = periodParseDays(input, SHOP_PERIOD_MAX_DAYS);
  if(!n){
    if(typeof toast === 'function') toast('یه عدد بین ۱ تا ' + SHOP_PERIOD_MAX_DAYS.toLocaleString('fa-IR') + ' وارد کن');
    return;
  }
  sp.days = n;
  try{ saveState(); }catch(e){}
  renderShopMiniCal();
  if(typeof toast === 'function') toast('دوره روی ' + n.toLocaleString('fa-IR') + ' روز تنظیم شد 🌱');
}
function startNewShopPeriod(){
  const sp = ensureShopPeriod();
  const input = window.prompt('دوره‌ی ' + periodOrdFa(sp.past.length+1) + ' چند روزه باشه؟ (۱ تا ' + SHOP_PERIOD_MAX_DAYS.toLocaleString('fa-IR') + ')', String(sp.days));
  if(input === null) return;
  const n = periodStartNext(sp, input, SHOP_PERIOD_MAX_DAYS);
  if(!n){
    if(typeof toast === 'function') toast('یه عدد بین ۱ تا ' + SHOP_PERIOD_MAX_DAYS.toLocaleString('fa-IR') + ' وارد کن');
    return;
  }
  try{ saveState(); }catch(e){}
  renderShopMiniCal();
  if(typeof toast === 'function') toast('دوره‌ی ' + periodOrdFa(sp.past.length) + ' شروع شد 🌱');
}

function _abFmt(v){ return Math.round(toDisplay(v)).toLocaleString('en-US'); }
function openAbundanceSettings(){
  const a = ensureAbundance();
  document.getElementById('ab-start').value = _abFmt(a.startAmount);
  document.getElementById('ab-step').value = _abFmt(a.step);
  const upd = function(){
    const st = fromDisplay(parseInt(normalizeDigits(document.getElementById('ab-start').value).replace(/[^\d]/g,''),10)||0);
    const sp = fromDisplay(parseInt(normalizeDigits(document.getElementById('ab-step').value).replace(/[^\d]/g,''),10)||0);
    document.getElementById('ab-preview').textContent = (st>0 && sp>0) ? ('روز ۱: '+formatMoney(st)+' ← روز ۲: '+formatMoney(st+sp)+' ← روز ۳: '+formatMoney(st+2*sp)) : '';
  };
  document.getElementById('ab-start').addEventListener('input', upd);
  document.getElementById('ab-step').addEventListener('input', upd);
  upd();
  document.getElementById('abundance-modal').classList.add('show');
}
function closeAbundanceSettings(){ document.getElementById('abundance-modal').classList.remove('show'); }
function saveAbundanceSettings(){
  const st = fromDisplay(parseInt(normalizeDigits(document.getElementById('ab-start').value).replace(/[^\d]/g,''),10));
  const sp = fromDisplay(parseInt(normalizeDigits(document.getElementById('ab-step').value).replace(/[^\d]/g,''),10));
  if(!(st>0)){ toast('مبلغ شروع رو بنویس'); return; }
  if(!(sp>0)){ toast('مبلغ افزایش روزانه رو بنویس'); return; }
  const a = ensureAbundance();
  a.startAmount = st; a.step = sp;
  saveState();
  closeAbundanceSettings();
  toast('تنظیم بازی فراوانی ذخیره شد 🌿');
  try{ renderHome(); }catch(e){}
  try{ renderStoreBalance(); }catch(e){}
}

function loadState(rawOverride){
  try{
    const raw = rawOverride || localStorage.getItem(STORAGE_KEY);
    if(raw){
      const s = JSON.parse(raw);
      loadState.meta = { t: s._savedAt || 0, lite: !!s._lite };
      delete s._lite;
      if(!s.gratitude) s.gratitude = [];
      if(!s.history) s.history = [];
      if(!s.beliefs) s.beliefs = [];
      if(!s.currentBelief) s.currentBelief = defaultCurrentBelief();
      if(!s.currentBelief.trackingItems) s.currentBelief.trackingItems = [];
      if(!s.currentBelief.visualImages) s.currentBelief.visualImages = [];
      if(!s.currentBelief.neural || typeof s.currentBelief.neural !== 'object') s.currentBelief.neural = {logs:{}, lastSyncKey:null, habitFormed: !!s.currentBelief.habitFormed};
      if(!s.currentBelief.trackingNeural || typeof s.currentBelief.trackingNeural !== 'object') s.currentBelief.trackingNeural = {logs:{}, lastSyncKey:null, habitFormed:false};
      if(!s.evidenceLog) s.evidenceLog = [];
      if(!s.streakHistory) s.streakHistory = [];
      if(!s.practiceLog) s.practiceLog = [];
      if(!s.gratitudeNeural || typeof s.gratitudeNeural !== 'object') s.gratitudeNeural = {logs:{}, lastSyncKey:null, habitFormed: !!s.gratitudeHabitFormed};
      if(!s.shopNeural || typeof s.shopNeural !== 'object') s.shopNeural = {logs:{}, lastSyncKey:null, habitFormed:false};
      if(!s.dispenzaNeural || typeof s.dispenzaNeural !== 'object') s.dispenzaNeural = {logs:{}, lastSyncKey:null, habitFormed:false};
      if(!s.nothingProgress || typeof s.nothingProgress !== 'object') s.nothingProgress = {};
      if(typeof s.nothingSoundOn !== 'boolean') s.nothingSoundOn = true;
      if(!s.loginId) s.loginId = 'local-guest';
      if(typeof s.alarmEnabled !== 'boolean') s.alarmEnabled = false;
      if(!s.alarmTime) s.alarmTime = '20:00';
      if(!s.bankName) s.bankName = 'بانک فراوانی';
      if(!s.cardNumber) s.cardNumber = '5859 8312 8347 6690';
      if(!s.cardExpiry) s.cardExpiry = '∞ / ∞';
      if(!s.cardCVV) s.cardCVV = '۱۴۰';
      if(!s.cardTheme) s.cardTheme = 'emerald';
      if(typeof s.futureText !== 'string') s.futureText = '';
      if(!s.futureStartDate) s.futureStartDate = null;
      if(!s.futureReadDays) s.futureReadDays = [];
      if(typeof s.shareGratitude !== 'boolean') s.shareGratitude = false;
      if(!s.authUserId) s.authUserId = '';
      if(!s.gratitudePeriod || typeof s.gratitudePeriod !== 'object') s.gratitudePeriod = { days: 28, startDate: null };
      if(!s.gratitudePeriod.days || s.gratitudePeriod.days < 1) s.gratitudePeriod.days = 28;
      if(!s.shopPeriod || typeof s.shopPeriod !== 'object') s.shopPeriod = { days: 28, startDate: null };
      if(!s.shopPeriod.days || s.shopPeriod.days < 1) s.shopPeriod.days = 28;
      return s;
    }
  }catch(e){
    try{ const bad = localStorage.getItem(STORAGE_KEY); if(bad) localStorage.setItem(STORAGE_KEY + '_corrupt', bad); }catch(e2){}
  }
  return { name:'', currency:'', startDate:'', history:[], gratitude:[], beliefs:[], currentBelief:defaultCurrentBelief(), evidenceLog:[], streakHistory:[], practiceLog:[], loginId:'local-guest', alarmEnabled:false, alarmTime:'20:00',
    bankName:'بانک فراوانی', cardNumber:'5859 8312 8347 6690', cardExpiry:'∞ / ∞', cardCVV:'۱۴۰', cardTheme:'emerald', futureText:'', futureStartDate:null, futureReadDays:[], shareGratitude:false, authUserId:'', gratitudeNeural:{logs:{}, lastSyncKey:null, habitFormed:false}, shopNeural:{logs:{}, lastSyncKey:null, habitFormed:false}, dispenzaNeural:{logs:{}, lastSyncKey:null, habitFormed:false}, nothingProgress:{}, nothingSoundOn:true, gratitudePeriod:{ days: 28, startDate: null } };
}
function defaultCurrentBelief(){
  return { trackingItems:[], trackingActive:false, attentionLever:50, visualNote:'', visualImages:[], audioTrack:null, neural:{logs:{}, lastSyncKey:null, habitFormed:false}, trackingNeural:{logs:{}, lastSyncKey:null, habitFormed:false}, visualNeural:{logs:{}, lastSyncKey:null, habitFormed:false} };
}
function saveStateSync(){
  let res = 'fail';
  try { res = DS.persist(STORAGE_KEY, 'state:' + STORAGE_KEY, state); }
  catch(e){ console.error('saveState failed:', e); }
  if (res === 'fail' && DS.ok === false && typeof toast === 'function') {
    toast('⚠️ حافظه‌ی گوشی پره و ذخیره نشد — چند عکس یا صدای قدیمی رو پاک کن');
  }
  return res;
}
let __saveTimer = null, __lastSaveRes = 'full';
function saveState(){
  if(__saveTimer) return __lastSaveRes;
  __saveTimer = setTimeout(function(){ __saveTimer = null; __lastSaveRes = saveStateSync(); }, 300);
  return __lastSaveRes;
}
function flushSaveState(){
  if(__saveTimer){ clearTimeout(__saveTimer); __saveTimer = null; __lastSaveRes = saveStateSync(); }
}
window.addEventListener('pagehide', flushSaveState);
window.addEventListener('beforeunload', flushSaveState);
document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') flushSaveState(); });
(function hydrateMainState(){
  const KEY = 'state:' + STORAGE_KEY;
  const meta = loadState.meta || { t:0, lite:false };
  function go(){
    DS.get(KEY).then(function(rec){
      let lsLen = 0; try{ lsLen = (localStorage.getItem(STORAGE_KEY) || '').length; }catch(e){}
      const adopt = !!(rec && rec.json && (meta.lite || rec.t > meta.t || rec.json.length > lsLen + 20000));
      if(adopt){
        try{
          const cur = state;
          const s = loadState(rec.json);
          if(cur.loginId && cur.loginId !== 'local-guest') s.loginId = cur.loginId;
          if(cur.authUserId) s.authUserId = cur.authUserId;
          state = s;
          DS.release(KEY, false);
          saveState();
          try{ refreshCurrentView(); }catch(e){}
          try{ renderAllNeuralPathways(); }catch(e){}
          return;
        }catch(e){ console.warn('hydrate failed', e); }
      }
      const inSync = rec && rec.json && rec.t === meta.t && !meta.lite;
      DS.release(KEY, true);
      if(!inSync) saveState();
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
function flushStateNow(){
  try{ saveState(); }catch(e){}
  try{ DS.flush(); }catch(e){}
}
document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') flushStateNow(); });
window.addEventListener('pagehide', flushStateNow);

function normalizeDigits(str){
  const fa='۰۱۲۳۴۵۶۷۸۹', ar='٠١٢٣٤٥٦٧٨٩';
  return String(str).replace(/[۰-۹٠-٩]/g, d=>{
    let i = fa.indexOf(d); if(i>-1) return String(i);
    i = ar.indexOf(d); if(i>-1) return String(i);
    return d;
  });
}
function formatCardNumberInput(el){
  const digits = normalizeDigits(el.value).replace(/\D/g,'').slice(0,16);
  el.value = digits.replace(/(.{1,4})/g,'$1 ').trim();
}
function formatAmountInput(el){
  const digits = normalizeDigits(el.value).replace(/\D/g,'');
  el.value = digits ? Number(digits).toLocaleString('en-US') : '';
}

const CARD_THEMES = [
  {id:'emerald', c1:'#0a3d38', c2:'#63d6a8'},
  {id:'navy',    c1:'#0b1d3a', c2:'#6fb3ff'},
  {id:'plum',    c1:'#2c0f3a', c2:'#c07be0'},
  {id:'rose',    c1:'#3a0f16', c2:'#e8748c'},
  {id:'charcoal',c1:'#14161c', c2:'#9aa0b2'},
  {id:'gold',    c1:'#6b4a12', c2:'#f3d98a'}
];
function applyCardTheme(){
  const card = document.getElementById('home-bank-card');
  if(!card) return;
  CARD_THEMES.forEach(t=>card.classList.remove('theme-'+t.id));
  card.classList.add('theme-'+(state.cardTheme||'emerald'));
}
function buildCardThemeGrid(){
  const grid = document.getElementById('card-theme-grid');
  grid.innerHTML = CARD_THEMES.map(t=>`
    <div class="card-theme-swatch${state.cardTheme===t.id?' active':''}" data-theme="${t.id}"
         style="background:linear-gradient(135deg, ${t.c1}, ${t.c2});"
         onclick="pickCardTheme('${t.id}')"></div>
  `).join('');
}
function pickCardTheme(id){
  state.cardTheme = id;
  document.querySelectorAll('#card-theme-grid .card-theme-swatch').forEach(el=>{
    el.classList.toggle('active', el.dataset.theme===id);
  });
}
function openCardEditor(){
  document.getElementById('edit-bank-name').value = state.bankName;
  document.getElementById('edit-holder-name').value = state.name || '';
  document.getElementById('edit-card-number').value = state.cardNumber;
  document.getElementById('edit-card-expiry').value = state.cardExpiry;
  document.getElementById('edit-card-cvv').value = state.cardCVV;
  buildCardThemeGrid();
  document.getElementById('card-edit-modal').classList.add('show');
}
function closeCardEditor(){ document.getElementById('card-edit-modal').classList.remove('show'); }
function saveCardEdit(){
  const name   = document.getElementById('edit-bank-name').value.trim();
  const holder = document.getElementById('edit-holder-name').value.trim();
  const num    = document.getElementById('edit-card-number').value.trim();
  const exp    = document.getElementById('edit-card-expiry').value.trim();
  const cvv    = document.getElementById('edit-card-cvv').value.trim();
  state.bankName    = name   || 'بانک فراوانی';
  state.name         = holder || 'کاربر فراوانی';
  state.cardNumber  = num    || '5859 8312 8347 6690';
  state.cardExpiry  = exp    || '∞ / ∞';
  state.cardCVV     = cvv    || '۱۴۰';
  saveState();
  renderHome();
  closeCardEditor();
  toast('کارتت ذخیره شد 💳');
}

window.getProfileInfo = function(){
  const id = state.loginId || '';
  return { name: state.name || '', email: /@/.test(id) ? id : '' };
};
window.getProfileEmail = async function(){
  try{
    if(window.supabaseClient){
      const { data } = await window.supabaseClient.auth.getSession();
      const em = data && data.session && data.session.user && data.session.user.email;
      if(em) return em;
    }
  }catch(e){}
  try{
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(/^sb-.*-auth-token$/.test(k)){
        const v = JSON.parse(localStorage.getItem(k) || '{}');
        const em = (v.user && v.user.email) || (v.currentSession && v.currentSession.user && v.currentSession.user.email);
        if(em) return em;
      }
    }
  }catch(e){}
  return /@/.test(state.loginId || '') ? state.loginId : '';
};
window.setProfileName = async function(value){
  const n = (value || '').trim().slice(0,24);
  if(!n || n === state.name) return;
  state.name = n;
  saveState();
  try{ renderHome(); }catch(e){}
  try{
    if(window.supabaseClient){
      await window.supabaseClient.from('public_gratitude')
        .update({ display_name: n })
        .eq('device_id', state.authUserId || state.loginId || 'local-guest');
    }
  }catch(e){ console.warn('friends name sync failed', e); }
  toast('نام ذخیره شد ✓');
};

function toman(n){ return Math.round(n).toLocaleString('fa-IR'); }
function toDisplay(tomanVal){ return state.currency==='dollar' ? tomanVal/100000 : tomanVal; }
function formatMoney(tomanVal){
  const v = toDisplay(tomanVal);
  const neg = v<0;
  const abs = Math.abs(v);
  if(state.currency==='dollar'){
    return (neg?'−':'')+'$'+abs.toLocaleString('en-US', {maximumFractionDigits:2});
  }
  return (neg?'−':'')+toman(abs)+' تومان';
}

function todayMidnight(){ const d=new Date(); d.setHours(0,0,0,0); return d; }
const ABUNDANCE_DEFAULT_START = 1000000;
function ensureAbundance(){
  if(!state.abundance || typeof state.abundance !== 'object') state.abundance = {};
  const a = state.abundance;
  if(!(a.startAmount > 0)) a.startAmount = ABUNDANCE_DEFAULT_START;
  if(!(a.step > 0)) a.step = a.startAmount;
  if(!a.startDate) a.startDate = state.startDate || dayKeyFromDate(new Date());
  return a;
}
function daysPassed(){
  const a = ensureAbundance();
  const start = new Date(a.startDate+'T00:00:00');
  const diff = Math.floor((todayMidnight()-start)/86400000)+1;
  return Math.max(1, diff);
}
function depositForDay(n){ const a = ensureAbundance(); return a.startAmount + (Math.max(1,n)-1)*a.step; }
function todayDepositToman(){ return depositForDay(daysPassed()); }
function spentTodayToman(){
  const k = dayKeyFromDate(new Date());
  return (state.history||[]).reduce(function(sum,h){ return (h && h.iso && dayKeyFromIso(h.iso)===k) ? sum + (h.total||0) : sum; }, 0);
}
function spentToman(){ return state.history.reduce((s,h)=>s+h.total,0); }
function balanceToman(){ return Math.max(0, todayDepositToman()-spentTodayToman()); }
function fromDisplay(v){ return state.currency==='dollar' ? v*100000 : v; }

function nowParts(){
  const d = new Date();
  let date, day, time;
  try{ date = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {year:'numeric', month:'long', day:'numeric'}).format(d); }
  catch(e){ date = d.toLocaleDateString('fa-IR'); }
  try{ day = new Intl.DateTimeFormat('fa-IR', {weekday:'long'}).format(d); }
  catch(e){ day = ''; }
  try{ time = new Intl.DateTimeFormat('fa-IR', {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(d); }
  catch(e){ time = d.toLocaleTimeString('fa-IR'); }
  return {date, day, time, iso:d.toISOString()};
}
function randomTrack(){
  return Array.from({length:12}, ()=>Math.floor(Math.random()*10)).join('').replace(/\d/g, x=>'۰۱۲۳۴۵۶۷۸۹'[x]);
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove('show'), 1600);
}
function greetingWord(){
  const h = new Date().getHours();
  if(h<6) return 'شب بخیر ✦';
  if(h<12) return 'صبح بخیر ✦';
  if(h<17) return 'ظهر بخیر ✦';
  if(h<20) return 'عصر بخیر ✦';
  return 'شب بخیر ✦';
}
function iconOrImage(item){
  if(item.image) return `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;">`;
  return item.icon || '🌿';
}
function gratIconOrImage(item){
  if(item.image) return `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;cursor:pointer;" onclick="event.stopPropagation();openGratImageViewer(${item.id},0)">`;
  return item.icon || '🌿';
}
window.openGratImageViewer = function(gid, idx){ openGratEntryAlbum(gid, idx||0); };
function gratRowClick(id){
  const g = (state.gratitude||[]).find(x=>x.id===id);
  if(!g) return;
  openGratEditor(id);
}
function viewGratReceipt(){
  const g = (state.gratitude||[]).find(x=>x.id===editingGratId);
  if(!g || !g.txId) return;
  const tx = (state.history||[]).find(h=>h.id===g.txId);
  if(!tx) return;
  closeGratEditor();
  showReceipt(tx); goto('receipt');
}
window.viewGratReceipt = viewGratReceipt;
(function(){
  var modal, imgEl, scale=1, startDist=0, startScale=1, lastX=0, lastY=0, offX=0, offY=0, dragging=false, lastTapTime=0;
  var viewerImages=[], viewerIndex=0, swipeStartX=0, swipeStartY=0;
  function ensureViewer(){
    if(modal) return;
    modal = document.getElementById('img-viewer-modal');
    imgEl = document.getElementById('img-viewer-img');
    imgEl.addEventListener('touchstart', onTouchStart, {passive:false});
    imgEl.addEventListener('touchmove', onTouchMove, {passive:false});
    imgEl.addEventListener('touchend', onTouchEnd, {passive:false});
  }
  function dist(t1,t2){ return Math.hypot(t1.clientX-t2.clientX, t1.clientY-t2.clientY); }
  function applyTransform(){ imgEl.style.transform = 'translate('+offX+'px,'+offY+'px) scale('+scale+')'; }
  function onTouchStart(e){
    if(e.touches.length===2){ startDist = dist(e.touches[0], e.touches[1]); startScale = scale; }
    else if(e.touches.length===1){
      dragging = true;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      swipeStartX = lastX; swipeStartY = lastY;
      var now = Date.now();
      if(now - lastTapTime < 300){ scale = scale>1 ? 1 : 2.5; offX=0; offY=0; applyTransform(); }
      lastTapTime = now;
    }
    e.preventDefault();
  }
  function onTouchMove(e){
    if(e.touches.length===2 && startDist){
      var d = dist(e.touches[0], e.touches[1]);
      scale = Math.min(5, Math.max(1, startScale * (d/startDist)));
      applyTransform();
    } else if(e.touches.length===1 && dragging && scale>1){
      var dx = e.touches[0].clientX - lastX;
      var dy = e.touches[0].clientY - lastY;
      offX += dx; offY += dy;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      applyTransform();
    }
    e.preventDefault();
  }
  function onTouchEnd(e){
    dragging = false; startDist = 0;
    if(e.touches.length===0){
      var t = (e.changedTouches && e.changedTouches[0]) || null;
      var endX = t ? t.clientX : lastX, endY = t ? t.clientY : lastY;
      if(scale<1.02){
        scale=1; offX=0; offY=0; applyTransform();
        if(viewerImages.length>1){
          var dx = endX - swipeStartX, dy = endY - swipeStartY;
          if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)*1.5){
            if(dx < 0) showNextViewerImage(); else showPrevViewerImage();
          }
        }
      }
    }
  }
  function updateViewerImage(){
    imgEl.src = viewerImages[viewerIndex];
    var counterEl = document.getElementById('img-viewer-counter');
    var gridBtn = document.getElementById('img-viewer-grid-btn');
    var multi = viewerImages.length > 1;
    if(counterEl){
      counterEl.style.display = multi ? 'block' : 'none';
      counterEl.textContent = multi ? ((viewerIndex+1).toLocaleString('fa-IR') + ' / ' + viewerImages.length.toLocaleString('fa-IR')) : '';
    }
    if(gridBtn) gridBtn.style.display = multi ? 'flex' : 'none';
  }
  function hideViewerGrid(){
    var gridEl = document.getElementById('img-viewer-grid');
    if(gridEl) gridEl.classList.remove('show');
  }
  function showNextViewerImage(){
    if(!viewerImages.length) return;
    viewerIndex = (viewerIndex + 1) % viewerImages.length;
    scale=1; offX=0; offY=0; applyTransform();
    updateViewerImage();
  }
  function showPrevViewerImage(){
    if(!viewerImages.length) return;
    viewerIndex = (viewerIndex - 1 + viewerImages.length) % viewerImages.length;
    scale=1; offX=0; offY=0; applyTransform();
    updateViewerImage();
  }
  window.openImageViewer = function(srcOrArr, startIndex){
    ensureViewer();
    viewerImages = Array.isArray(srcOrArr) ? srcOrArr : [srcOrArr];
    viewerIndex = startIndex || 0;
    if(viewerIndex < 0) viewerIndex = 0;
    if(viewerIndex >= viewerImages.length) viewerIndex = viewerImages.length - 1;
    scale=1; offX=0; offY=0; applyTransform();
    updateViewerImage();
    hideViewerGrid();
    modal.classList.add('show');
  };
  window.closeImageViewer = function(){ if(modal) modal.classList.remove('show'); hideViewerGrid(); };
  window.toggleImageViewerGrid = function(){
    var gridEl = document.getElementById('img-viewer-grid');
    if(!gridEl) return;
    if(gridEl.classList.contains('show')){ hideViewerGrid(); return; }
    gridEl.innerHTML = viewerImages.map(function(src, i){
      return '<div class="ivg-item' + (i===viewerIndex ? ' active' : '') + '" onclick="event.stopPropagation();selectViewerImage(' + i + ')"><img src="' + src + '"></div>';
    }).join('');
    gridEl.classList.add('show');
  };
  window.selectViewerImage = function(i){
    viewerIndex = i;
    scale=1; offX=0; offY=0; applyTransform();
    updateViewerImage();
    hideViewerGrid();
  };
})();

let loginTab = 'phone';
function ensureLogin(){ return false; }
function switchLoginTab(tab){
  loginTab = tab;
  document.getElementById('tab-phone').classList.toggle('active', tab==='phone');
  document.getElementById('tab-email').classList.toggle('active', tab==='email');
  document.getElementById('field-phone').classList.toggle('active', tab==='phone');
  document.getElementById('field-email').classList.toggle('active', tab==='email');
}
function confirmLogin(){
  let val = '';
  if(loginTab==='phone'){
    val = (document.getElementById('login-phone').value||'').trim();
    if(!/^0?9\d{9}$/.test(val.replace(/\s/g,''))){ toast('شماره تماس معتبر بنویس'); return; }
  }else{
    val = (document.getElementById('login-email').value||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)){ toast('یک ایمیل معتبر بنویس'); return; }
  }
  state.loginId = val;
  saveState();
  document.getElementById('login-modal').classList.remove('show');
  ensureSetup();
  if(!document.getElementById('setup-modal').classList.contains('show')) renderHome();
}

function ensureSetup(){
  if(ensureLogin()) return true;
  if(!state.name || !state.currency){
    if(!state.name) state.name = 'من';
    if(!state.currency) state.currency = 'toman';
    if(!state.startDate) state.startDate = new Date().toISOString().slice(0,10);
    saveState();
  }
  return false;
}
function pickCurrency(c){
  tempCurrency = c;
  document.getElementById('cur-toman').classList.toggle('picked', c==='toman');
  document.getElementById('cur-dollar').classList.toggle('picked', c==='dollar');
}
function confirmSetup(){
  const nameVal = (document.getElementById('setup-name').value||'').trim();
  if(!nameVal){ toast('اسمت رو بنویس'); return; }
  if(!tempCurrency){ toast('واحد پول رو انتخاب کن'); return; }
  state.name = nameVal;
  state.currency = tempCurrency;
  if(!state.startDate) state.startDate = new Date().toISOString().slice(0,10);
  saveState();
  document.getElementById('setup-modal').classList.remove('show');
  renderHome();
}
function toggleCurrency(){
  if(!state.currency) return;
  state.currency = state.currency==='toman' ? 'dollar' : 'toman';
  saveState();
  toast('واحد پول به '+(state.currency==='toman'?'تومان':'دلار')+' تغییر کرد');
  refreshCurrentView();
}
function refreshCurrentView(){
  const active = document.querySelector('.view.active').id.replace('view-','');
  goto(active);
}
function openMapHelpFromBeliefs(){
  var mapHelp = document.getElementById('help-modal-overlay');
  if (mapHelp) mapHelp.classList.remove('hidden');
}

function goto(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+view).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.nav===view));
  window.scrollTo(0,0);
  var __gr = document.getElementById('grat-root'); if (__gr) __gr.scrollTop = 0;
  if(view==='home') renderHome();
  if(view==='store'){ renderPendingList(); renderCart(); renderShopNeural(); renderShopMiniCal(); }
  if(view==='shop-history') renderShopHistory();
  if(view==='pay') renderPay();
  if(view==='history') renderHistory();
  if(view==='beliefs') renderBeliefsView();
  if(view==='friends') renderFriends();
}

async function syncGratitudeShare(entry){
  try{
    if(!entry || !entry.shared) return;
    if(!window.supabaseClient) return;
    const text = (entry.text || '').trim();
    if(!text){ return; }
    if(containsBannedContent(text)){ toast('این متن قابل اشتراک‌گذاری نیست ⚠️'); return; }
    const { error } = await window.supabaseClient.from('public_gratitude').insert({
      device_id: state.authUserId || state.loginId || 'local-guest',
      display_name: (state.name || 'کاربر فراوانی').slice(0,40),
      text: text.slice(0,300),
      iso: entry.iso || null
    });
    if(error){ console.warn('gratitude share sync failed', error); toast('اشتراک‌گذاری با دوستان با مشکل مواجه شد ⚠️'); }
  }catch(e){ console.warn('gratitude share sync failed', e); toast('اشتراک‌گذاری با دوستان با مشکل مواجه شد ⚠️'); }
}
async function unsyncGratitudeShare(entry){
  try{
    if(!window.supabaseClient || !entry) return;
    await window.supabaseClient.from('public_gratitude').delete().match({
      device_id: state.authUserId || state.loginId || 'local-guest',
      iso: entry.iso || null,
      text: (entry.text || '').trim().slice(0,300)
    });
  }catch(e){ console.warn('gratitude unshare failed', e); }
}
async function bulkSyncExistingGratitude(){
  if(!window.supabaseClient) return;
  const sharedEntries = (state.gratitude||[]).filter(g=>g.shared);
  for(const g of sharedEntries){ await syncGratitudeShare(g); }
}
function toggleGratitudeShare(id){
  const g = (state.gratitude||[]).find(x=>x.id===id);
  if(!g) return;
  g.shared = !g.shared;
  saveState();
  if(g.shared){
    if(!window.supabaseClient){ toast('این قابلیت هنوز فعال نشده 🌱'); g.shared = false; saveState(); return; }
    syncGratitudeShare(g);
    toast('این شکرگذاری با دوستان هم‌فرکانسی به اشتراک گذاشته شد 🌊');
  } else {
    unsyncGratitudeShare(g);
    toast('اشتراک‌گذاری این مورد خاموش شد');
  }
  renderHistory();
  renderHome();
}
async function renderFriends(){
  const noBackend = document.getElementById('friends-no-backend');
  const loading = document.getElementById('friends-loading');
  const list = document.getElementById('friends-feed');
  const empty = document.getElementById('friends-empty');
  if(!window.supabaseClient){
    noBackend.style.display = 'block';
    loading.style.display = 'none';
    list.innerHTML = '';
    empty.style.display = 'none';
    return;
  }
  noBackend.style.display = 'none';
  list.innerHTML = '';
  empty.style.display = 'none';
  loading.style.display = 'block';
  try{
    const { data, error } = await window.supabaseClient
      .from('public_gratitude')
      .select('display_name, text, iso, created_at')
      .order('created_at', { ascending:false })
      .limit(100);
    loading.style.display = 'none';
    if(error) throw error;
    if(!data || data.length===0){ empty.style.display = 'block'; return; }
    data.forEach(row=>{
      const div = document.createElement('div');
      div.className = 'tx-item';
      div.innerHTML = `
        <div class="ic">🙏</div>
        <div class="mid">
          <div class="t1">${escapeHtml(row.text)}</div>
          <div class="t2">${escapeHtml(row.display_name || 'یکی از دوستان هم‌فرکانسی')}</div>
        </div>`;
      list.appendChild(div);
    });
  }catch(e){
    loading.style.display = 'none';
    empty.style.display = 'block';
    empty.textContent = 'مشکلی در دریافت لیست پیش اومد. بعداً دوباره امتحان کن.';
  }
}

function updateGratitudeNumbers() {
    const nextNum = (state.gratitude.length + 1).toLocaleString('fa-IR');
    const homeNumEl = document.getElementById('home-grat-number');
    const gratNumEl = document.getElementById('grat-number');
    if (homeNumEl) homeNumEl.textContent = nextNum;
    if (gratNumEl) gratNumEl.textContent = nextNum;
}
function renderHome(){
  if(ensureSetup()) return;
  updateGratitudeNumbers();
  document.getElementById('home-hi').textContent = greetingWord();
  document.getElementById('home-name').textContent = state.name;
  document.getElementById('home-holder').textContent = state.name;
  document.getElementById('home-bank-name').textContent = state.bankName;
  document.getElementById('home-card-number').textContent = state.cardNumber;
  document.getElementById('home-cvv').textContent = state.cardCVV;
  document.getElementById('home-expiry').textContent = state.cardExpiry;
  applyCardTheme();
  document.getElementById('home-balance').textContent = formatMoney(balanceToman());
  document.getElementById('home-today-deposit').textContent = balanceToman()<=0
    ? '🎉 امروز همه‌ی '+formatMoney(todayDepositToman())+' رو خرج کردی؛ فردا مبلغ بزرگ‌تری منتظرته'
    : 'امروز '+formatMoney(todayDepositToman())+' به حسابت اضافه شد ✨ — باید همین امروز خرجش کنی';
  document.getElementById('home-day-tag').textContent = 'روز '+daysPassed().toLocaleString('fa-IR');
  renderThemeBanner();
  renderAllNeuralPathways();

  const wrap = document.getElementById('home-recent');
  wrap.innerHTML = '';
  const allFull = [...state.gratitude].reverse();
  const all = allFull.slice(0, gratListLimit.home);
  if(allFull.length===0){
    wrap.innerHTML = '<div class="empty-hint">هنوز شکرگذاری‌ای ثبت نکردی. یا از بازی فراوانی بخر یا همین‌جا بنویس 🌱</div>';
    return;
  }
  all.forEach(g=>{
    const row = document.createElement('div');
    row.className = 'tx-item';
    row.onclick = ()=>{
      goto('history'); openGratEditor(g.id);
    };
    row.style.cursor = 'pointer';
    row.innerHTML = `
      <div class="ic">${gratIconOrImage(g)}</div>
      <div class="mid">
        <div class="t1">${nl2br(escapeHtml(gratDisplayText(g.text, g)))}</div>
        <div class="t2">${g.day} ${g.date} - ${g.time}</div>
        ${(g.images && g.images.length) ? `<div class="gv-grid">${g.images.map((im,idx)=>`<button type="button" class="gv-thumb" onclick="event.stopPropagation();openGratEntryAlbum(${g.id},${idx})"><img src="${im.src}" alt="" draggable="false" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
        ${(g.audios && g.audios.length) ? g.audios.map(a=>`<div class="audio-player-box" onclick="event.stopPropagation()"><audio controls preload="none" src="${a.src}"></audio><span class="ap-name">${escapeHtmlSafe(a.name||'')}</span></div>`).join('') : ''}
        ${(g.videos && g.videos.length) ? g.videos.map(v=>`<div class="gv-vid" onclick="event.stopPropagation()"><video controls playsinline preload="metadata" data-gvid="${v.id}"></video></div>`).join('') : ''}
      </div>
      ${g.amount ? `<div class="amt">${formatMoney(g.amount)}</div>` : ''}`;
    wrap.appendChild(row);
  });
  if(allFull.length > all.length){
    const more = document.createElement('button');
    more.type = 'button'; more.className = 'ghost-btn'; more.style.cssText = 'margin:10px auto;display:block;';
    more.textContent = 'نمایش بیشتر (' + (allFull.length - all.length).toLocaleString('fa-IR') + ' مورد دیگر)';
    more.onclick = function(){ gratListLimit.home += 40; renderHome(); };
    wrap.appendChild(more);
  }
  gratHydrateVideos(wrap);
}
async function addGratitudeHome(){
  const input = document.getElementById('home-grat-input');
  const val = (input.value||'').trim();
  const hasImages = gratHomeImages.length > 0;
  const hasAudios = gratHomeAudios.length > 0;
  const hasVideos = gratHomeVideos.length > 0;
  if(!val && !hasImages && !hasAudios && !hasVideos){ toast('یه متن، عکس، ویدیو یا صدا وارد کن 🌱'); return; }
  if(window.__gratHomeSaving) return;
  window.__gratHomeSaving = true;
  try{
    const savedVideos = hasVideos ? await gratCommitVideos(gratHomeVideos) : [];
    if(!val && !hasImages && !hasAudios && !savedVideos.length) return;
    const visRadio = document.querySelector('input[name="home-vis"]:checked');
    const shared = !!(visRadio && visRadio.value === 'public');
    const np = nowParts();
    const newEntry = {
      id: Date.now()+Math.random(),
      text: val, icon:'🙏', image: hasImages ? gratHomeImages[0].src : null, amount:null,
      images: gratHomeImages.slice(), audios: gratHomeAudios.slice(), videos: savedVideos,
      date: np.date, day: np.day, time: np.time, iso: np.iso, source:'manual',
      shared: shared
    };
    state.gratitude.push(newEntry);
    updateGratitudeNumbers();
    state.shareGratitude = shared;
    neuralAutoAddFiber(ensureGratitudeNeural());
    saveState();
    input.value='';
    autoGrowGratInput(input);
    resetGratHomeMedia();
    renderHome();
    renderHistory();
    toast(shared ? 'ثبت شد و با بقیه به اشتراک گذاشته شد 🌍' : 'ثبت شد — فقط برای خودم 🤫');
    if(shared) syncGratitudeShare(newEntry);
  } finally {
    window.__gratHomeSaving = false;
  }
}

async function handleCustomFile(e){
  const input = e.target;
  const file = input.files[0];
  input.value = '';
  if(!file) return;
  const src = await cropImage(file);
  if(!src) return;
  customImage = src;
  updateCustomPreview();
}
function handleCustomUrl(){
  const url = document.getElementById('custom-image-url').value.trim();
  if(url){ customImage = url; updateCustomPreview(); }
}
function updateCustomPreview(){
  const box = document.getElementById('custom-image-preview');
  if(customImage){
    box.innerHTML = `<img src="${customImage}" onerror="this.parentElement.textContent='تصویر بارگذاری نشد'"><button class="clear-img" onclick="event.stopPropagation(); clearCustomImage()">✕</button>`;
  } else {
    box.textContent = 'تصویری انتخاب نشده';
  }
}
function clearCustomImage(){
  customImage = null;
  document.getElementById('custom-image-url').value='';
  document.getElementById('custom-file').value='';
  updateCustomPreview();
}

function addToPendingList(){
  const nameEl = document.getElementById('custom-name');
  const priceEl = document.getElementById('custom-price');
  const name = nameEl.value.trim();
  const price = fromDisplay(parseInt(normalizeDigits(priceEl.value||'').replace(/[^\d]/g,''), 10));
  if(!name){ toast('یک اسم برای این خرید بنویس'); return; }
  if(!price || price<=0){ toast('یک مبلغ معتبر بنویس'); return; }
  pendingItems.push({id:'pend-'+Date.now()+Math.random(), name, icon:'✨', image:customImage, price});
  nameEl.value=''; priceEl.value='';
  clearCustomImage();
  renderPendingList();
  toast('به لیست خریدت اضافه شد ✨');
}
function removeFromPending(id){
  pendingItems = pendingItems.filter(p=>p.id!==id);
  renderPendingList();
}
function renderPendingList(){
  renderStoreBalance();
  const wrap = document.getElementById('pending-list-wrap');
  const list = document.getElementById('pending-list');
  const btn = document.getElementById('pending-checkout-btn');
  list.innerHTML = '';
  if(pendingItems.length===0){ wrap.style.display='none'; btn.disabled = true; return; }
  wrap.style.display='block';
  btn.disabled = false;
  let total = 0;
  pendingItems.forEach(it=>{
    total += it.price;
    const row = document.createElement('div');
    row.className = 'pending-row';
    row.innerHTML = `
      <div class="ic">${iconOrImage(it)}</div>
      <div class="mid">
        <div class="n">${it.name}</div>
        <div class="p">${formatMoney(it.price)}</div>
      </div>
      <button class="pending-remove" onclick="removeFromPending('${it.id}')">✕</button>`;
    list.appendChild(row);
  });
  document.getElementById('pending-total-amt').textContent = formatMoney(total);
}
function addAllToCart(){
  if(pendingItems.length===0) return;
  pendingItems.forEach(it=>{
    cart.push({id:it.id, name:it.name, icon:it.icon, image:it.image, price:it.price, qty:1});
  });
  const count = pendingItems.length;
  pendingItems = [];
  updateCartBadge();
  renderPendingList();
  renderCart();
  toast('🛍️ '+count.toLocaleString('fa-IR')+' مورد به سبد خرید اضافه شد');
}

function updateCartBadge(){
  const count = cart.reduce((s,c)=>s+c.qty,0);
  const badge = document.getElementById('nav-cart-badge');
  if(count>0){ badge.style.display='flex'; badge.textContent = count.toLocaleString('fa-IR'); }
  else{ badge.style.display='none'; }
}
function changeQty(id, delta){
  const it = cart.find(c=>c.id===id);
  if(!it) return;
  it.qty += delta;
  if(it.qty<=0) cart = cart.filter(c=>c.id!==id);
  updateCartBadge();
  renderCart();
}
function removeFromCart(id){
  cart = cart.filter(c=>c.id!==id);
  updateCartBadge();
  renderCart();
}
function renderStoreBalance(){
  const el = document.getElementById('store-balance-banner');
  if(!el) return;
  const pendingTotal = (typeof pendingItems!=='undefined' ? pendingItems : []).reduce((t,i)=>t+i.price,0);
  const cartSum = cart.reduce((t,c)=>t+c.qty*c.price,0);
  const left = balanceToman() - cartSum - pendingTotal;
  el.innerHTML = '<span>💳 باقی‌مانده‌ی امروز</span><b>'+formatMoney(Math.max(0,left))+'</b>';
  el.classList.toggle('over', left < 0);
  const hint = document.getElementById('store-balance-hint');
  if(hint) hint.textContent = left < 0 ? 'جمع لیست از موجودی امروزت بیشتره؛ یک مورد رو کم کن.' : (left === 0 ? '✓ دقیقاً همه‌ی مبلغ امروز خرج شد — موجودی صفر!' : 'هدف: امروز همه‌ی '+formatMoney(todayDepositToman())+' رو خرج کنی تا به صفر برسه.');
}
function renderCart(){
  renderStoreBalance();
  if(ensureSetup()) return;
  const list = document.getElementById('cart-list');
  const empty = document.getElementById('cart-empty');
  const summary = document.getElementById('cart-summary');
  const btn = document.getElementById('cart-checkout-btn');
  list.innerHTML = '';
  if(cart.length===0){ empty.style.display='block'; summary.style.display='none'; btn.disabled = true; return; }
  empty.style.display='none'; summary.style.display='block'; btn.disabled = false;
  let count=0, total=0;
  cart.forEach(c=>{
    count += c.qty; total += c.qty*c.price;
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="ic">${iconOrImage(c)}</div>
      <div class="mid">
        <div class="n">${c.name}</div>
        <div class="p">${formatMoney(c.price)}</div>
      </div>
      <div class="stepper">
        <button onclick="changeQty('${c.id}',-1)">−</button>
        <span>${c.qty.toLocaleString('fa-IR')}</span>
        <button onclick="changeQty('${c.id}',1)">+</button>
      </div>
      <button class="cart-remove" onclick="removeFromCart('${c.id}')">✕</button>`;
    list.appendChild(row);
  });
  document.getElementById('cart-count').textContent = count.toLocaleString('fa-IR');
  document.getElementById('cart-total').textContent = formatMoney(total);
}

function cartTotal(){ return cart.reduce((s,c)=>s+c.qty*c.price,0); }
function renderPay(){
  if(ensureSetup()) return;
  document.getElementById('pay-amount').textContent = formatMoney(cartTotal());
  document.getElementById('pay-card').value = state.cardNumber;
  document.getElementById('pay-exp').value = state.cardExpiry;
  document.getElementById('pay-cvv').value = state.cardCVV;
  document.getElementById('pay-overlay').classList.remove('show');
  sendFakeOtp();
}
function sendFakeOtp(){
  const otpEl = document.getElementById('pay-otp');
  if(!otpEl) return;
  otpEl.value = '';
  otpEl.placeholder = 'در حال ارسال رمز پویا...';
  setTimeout(()=>{
    const code = Math.floor(10000 + Math.random()*90000);
    otpEl.value = code.toLocaleString('fa-IR', {useGrouping:false});
    otpEl.placeholder = 'ارسال شد به قلب شما 💚';
  }, 900);
}
function processPayment(){
  if(cart.length===0){ toast('سبد خریدت خالیه'); goto('store'); return; }
  if(cartTotal() > balanceToman()){ toast('این مبلغ از موجودی امروزت بیشتره — باقی‌مانده: '+formatMoney(balanceToman())); goto('store'); return; }
  const overlay = document.getElementById('pay-overlay');
  overlay.classList.add('show');
  setTimeout(()=>{
    const np = nowParts();
    const record = {
      id: Date.now(),
      date: np.date, day: np.day, time: np.time, iso: np.iso,
      track: randomTrack(),
      card: document.getElementById('pay-card').value || '•••• •••• •••• ۵۸۵۹',
      items: cart.map(c=>({name:c.name, icon:c.icon, image:c.image, qty:c.qty, price:c.price})),
      total: cartTotal()
    };
    state.history.push(record);
    syncShopNeuralFromHistory();
    record.items.forEach(it=>{
      state.gratitude.push({
        id: Date.now()+Math.random(),
        text: it.name, icon: it.icon, image: it.image || null,
        amount: it.qty*it.price,
        date: record.date, day: record.day, time: record.time, iso: record.iso,
        source:'purchase', txId: record.id
      });
    });
    saveState();
    cart = [];
    updateCartBadge();
    overlay.classList.remove('show');
    showReceipt(record);
    goto('receipt');
  }, 1700);
}

function showReceipt(r){
  document.getElementById('rc-amount').textContent = formatMoney(r.total);
  document.getElementById('rc-date').textContent = r.date;
  document.getElementById('rc-day').textContent = r.day;
  document.getElementById('rc-time').textContent = r.time;
  document.getElementById('rc-track').textContent = r.track;
  document.getElementById('rc-card').textContent = r.card;
  document.getElementById('rc-bank').textContent = state.bankName;
  const wrap = document.getElementById('rc-items');
  wrap.innerHTML = '';
  r.items.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'r-item';
    row.innerHTML = `
      <div class="ic">${iconOrImage(it)}</div>
      <div class="n">${it.name}</div>
      <div class="q">×${it.qty.toLocaleString('fa-IR')}</div>
      <div class="p">${formatMoney(it.qty*it.price)}</div>`;
    wrap.appendChild(row);
  });
}

let gratHomeImages = [];
let gratHomeAudios = [];
let gratHomeVideos = [];
function gratElId(mode, base){ return (mode === 'edit' ? 'grat-edit-' : mode === 'home' ? 'home-grat-' : 'grat-') + base; }
let gratNewImages = [];
let gratEditImages = [];
let gratNewAudios = [];
let gratEditAudios = [];
let gratRecorder = null;
let gratRecordStream = null;
let gratRecordChunks = [];
let gratRecordingMode = null;

function gratImagesArr(mode){ return mode === 'edit' ? gratEditImages : mode === 'home' ? gratHomeImages : gratNewImages; }
function gratAudiosArr(mode){ return mode === 'edit' ? gratEditAudios : mode === 'home' ? gratHomeAudios : gratNewAudios; }

const GRAT_IMG_MAX_DIM = 1400, GRAT_IMG_QUALITY = 0.82;
function gratFileToDataUrl(file){
  return new Promise(function(resolve, reject){
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function(){
      try{
        const w = img.naturalWidth, h = img.naturalHeight;
        const sc = Math.min(1, GRAT_IMG_MAX_DIM / Math.max(w, h));
        const cw = Math.max(1, Math.round(w*sc)), ch = Math.max(1, Math.round(h*sc));
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', GRAT_IMG_QUALITY));
      }catch(e){ URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('img')); };
    img.src = url;
  });
}
async function handleGratMedia(files, mode){
  if(!files || !files.length) return;
  const list = Array.from(files);
  const inputEl = document.getElementById(gratElId(mode, 'media-input'));
  if(inputEl) inputEl.value = '';
  const imgArr = gratImagesArr(mode);
  const audArr = gratAudiosArr(mode);
  let addedImgs = 0, failedImgs = 0;
  for(const file of list){
    const isImage = file.type.indexOf('image/') === 0 || /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(file.name || '');
    const isAudio = file.type.indexOf('audio/') === 0;
    if(!isImage && !isAudio){ toast('فقط فایل عکس یا صدا قابل اضافه شدنه'); continue; }
    if(isImage){
      try{
        const src = await gratFileToDataUrl(file);
        imgArr.push({ id: 'gimg_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), src });
        addedImgs++;
      }catch(err){ failedImgs++; }
    } else {
      try{
        const src = await readFileAsDataURL(file);
        audArr.push({ src, name: 'صدا ' + (audArr.length+1).toLocaleString('fa-IR') });
      }catch(err){}
    }
  }
  renderGratImageThumbs(mode);
  renderGratAudioList(mode);
  if(addedImgs && !failedImgs) toast(addedImgs > 1 ? addedImgs.toLocaleString('fa-IR') + ' عکس اضافه شد 🖼️' : 'عکس اضافه شد 🖼️');
  else if(addedImgs) toast(addedImgs.toLocaleString('fa-IR') + ' عکس اضافه شد؛ ' + failedImgs.toLocaleString('fa-IR') + ' تا خوانده نشد');
  else if(failedImgs) toast('عکس خوانده نشد (فرمت پشتیبانی نمی‌شه)');
}
function renderGratImageThumbs(mode){
  const wrap = document.getElementById(gratElId(mode, 'image-thumbs'));
  if(!wrap) return;
  const arr = gratImagesArr(mode);
  wrap.innerHTML = arr.map((img, idx)=>`<button type="button" class="gv-thumb" onclick="openGratAlbum('${mode}', ${idx})"><img src="${img.src}" alt="" draggable="false"></button>`).join('');
}
function gratAlbumOpen(source, idx){
  if(typeof window.vgOpenFrom === 'function') window.vgOpenFrom(source, idx);
  else { const arr = source.get(); if(arr[idx]) openImageViewer(arr.map(im=>im.src), idx); }
}
function openGratAlbum(mode, idx){
  gratAlbumOpen({
    get: function(){ return gratImagesArr(mode); },
    changed: function(){ renderGratImageThumbs(mode); }
  }, idx);
}
function gratSyncEntryImages(g){ g.image = (g.images && g.images.length) ? g.images[0].src : null; }
function openGratEntryAlbum(gid, idx){
  const g = (state.gratitude||[]).find(x=>x.id===gid);
  if(!g) return;
  if((!g.images || !g.images.length) && g.image && g.source === 'manual') g.images = [{ id: 'gimg_' + Date.now(), src: g.image }];
  if(!g.images || !g.images.length) return;
  gratAlbumOpen({
    get: function(){ return g.images || []; },
    changed: function(){ gratSyncEntryImages(g); saveState(); renderHistory(); renderHome(); }
  }, idx || 0);
}
function gratAllImages(){
  const out = [];
  (state.gratitude || []).forEach(function(g){
    if(g.source !== 'manual') return;
    if((!g.images || !g.images.length) && g.image) g.images = [{ id: 'gimg_' + String(g.id).replace(/\D/g,''), src: g.image }];
    (g.images || []).forEach(function(im){ if(im && im.src) out.push(im); });
  });
  return out;
}
function openGratAlbumAll(idx){
  if(!gratAllImages().length) return;
  gratAlbumOpen({
    get: gratAllImages,
    remove: function(im){
      (state.gratitude || []).forEach(function(g){
        if(!g.images) return;
        const at = g.images.indexOf(im);
        if(at >= 0){ g.images.splice(at, 1); gratSyncEntryImages(g); }
      });
    },
    changed: function(){
      (state.gratitude || []).forEach(gratSyncEntryImages);
      saveState(); renderHistory(); renderHome();
    }
  }, idx || 0);
}
function toggleGratRecording(mode){
  if(gratRecorder && gratRecorder.state === 'recording'){ gratRecorder.stop(); return; }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('دستگاهت از ضبط صدا پشتیبانی نمی‌کنه'); return; }
  navigator.mediaDevices.getUserMedia({ audio:true }).then(stream=>{
    gratRecordStream = stream;
    gratRecordingMode = mode;
    gratRecordChunks = [];
    try{ gratRecorder = new MediaRecorder(stream); }
    catch(e){ toast('ضبط صدا روی این دستگاه ممکن نیست'); stream.getTracks().forEach(t=>t.stop()); return; }
    gratRecorder.ondataavailable = (e)=>{ if(e.data && e.data.size) gratRecordChunks.push(e.data); };
    gratRecorder.onstop = ()=>{
      const blob = new Blob(gratRecordChunks, { type: gratRecorder.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.onload = (ev)=>{
        const arr = gratAudiosArr(gratRecordingMode);
        arr.push({ src: ev.target.result, name: 'صدا ' + (arr.length+1).toLocaleString('fa-IR') });
        renderGratAudioList(gratRecordingMode);
      };
      reader.readAsDataURL(blob);
      if(gratRecordStream) gratRecordStream.getTracks().forEach(t=>t.stop());
      gratRecordStream = null;
      gratRecorder = null;
      setGratRecordBtn(mode, false);
    };
    gratRecorder.start();
    setGratRecordBtn(mode, true);
  }).catch(()=>{ toast('اجازه‌ی دسترسی به میکروفون داده نشد 🎙'); });
}
function setGratRecordBtn(mode, recording){
  const btn = document.getElementById(gratElId(mode, 'record-btn'));
  if(!btn) return;
  btn.classList.toggle('rec', !!recording);
  btn.title = recording ? 'پایان ضبط' : 'ضبط صدا';
}
function renderGratAudioList(mode){
  const wrap = document.getElementById(gratElId(mode, 'audio-list'));
  if(!wrap) return;
  const arr = gratAudiosArr(mode);
  wrap.innerHTML = arr.map((a, idx)=>`
    <div class="audio-player-box">
      <audio controls src="${a.src}"></audio>
      <span class="ap-name">${escapeHtmlSafe(a.name||'')}</span>
      <button type="button" class="ap-rm" onclick="removeGratAudio(${idx}, '${mode}')">×</button>
    </div>
  `).join('');
}
function removeGratAudio(idx, mode){ const arr = gratAudiosArr(mode); arr.splice(idx, 1); renderGratAudioList(mode); }

const GRAT_VID_MAX_MB = 300;
let gratNewVideos = [];
let gratEditVideos = [];
function gratVideosArr(mode){ return mode === 'edit' ? gratEditVideos : mode === 'home' ? gratHomeVideos : gratNewVideos; }
let gratVidDbP = null;
const gratVidUrls = {};
function gratVidDb(){
  if(gratVidDbP) return gratVidDbP;
  gratVidDbP = new Promise(function(res, rej){
    if(!window.indexedDB){ rej(new Error('no-idb')); return; }
    const r = indexedDB.open('grat-media', 1);
    r.onupgradeneeded = function(){ if(!r.result.objectStoreNames.contains('videos')) r.result.createObjectStore('videos'); };
    r.onsuccess = function(){ res(r.result); };
    r.onerror = function(){ rej(r.error); };
  });
  gratVidDbP.catch(function(){ gratVidDbP = null; });
  return gratVidDbP;
}
function gratVidTx(mode, fn){
  return gratVidDb().then(function(db){ return new Promise(function(res, rej){
    const tx = db.transaction('videos', mode);
    const out = fn(tx.objectStore('videos'));
    tx.oncomplete = function(){ res(out && out.result); };
    tx.onerror = function(){ rej(tx.error); };
    tx.onabort = function(){ rej(tx.error); };
  }); });
}
function gratVidUrl(v){
  if(gratVidUrls[v.id]) return Promise.resolve(gratVidUrls[v.id]);
  if(v.blob){ gratVidUrls[v.id] = URL.createObjectURL(v.blob); return Promise.resolve(gratVidUrls[v.id]); }
  return gratVidTx('readonly', function(st){ return st.get(v.id); }).then(function(blob){
    if(!blob) throw new Error('missing');
    gratVidUrls[v.id] = URL.createObjectURL(blob);
    return gratVidUrls[v.id];
  });
}
function gratVidDelete(list){
  (list || []).forEach(function(v){
    if(gratVidUrls[v.id]){ try{ URL.revokeObjectURL(gratVidUrls[v.id]); }catch(e){} delete gratVidUrls[v.id]; }
    gratVidTx('readwrite', function(st){ return st.delete(v.id); }).catch(function(){});
  });
}
function handleGratVideos(files, mode){
  const inputEl = document.getElementById(gratElId(mode, 'video-input'));
  const list = Array.from(files || []).filter(function(f){
    return f && ((f.type && f.type.indexOf('video/') === 0) || /\.(mp4|mov|m4v|webm|3gp|mkv)$/i.test(f.name || ''));
  });
  if(inputEl) inputEl.value = '';
  if(!list.length){ toast('فقط فایل ویدیو انتخاب کن'); return; }
  try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  const arr = gratVideosArr(mode);
  let added = 0, tooBig = 0;
  list.forEach(function(f){
    if(f.size > GRAT_VID_MAX_MB * 1048576){ tooBig++; return; }
    arr.push({ id: 'gvid_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), name: f.name || 'video', type: f.type || 'video/mp4', size: f.size, blob: f });
    added++;
  });
  renderGratVideoList(mode);
  if(added) toast(added > 1 ? added.toLocaleString('fa-IR') + ' ویدیو اضافه شد 🎬' : 'ویدیو اضافه شد 🎬');
  else if(tooBig) toast('ویدیو بزرگ‌تر از ' + GRAT_VID_MAX_MB.toLocaleString('fa-IR') + ' مگابایت اضافه نمی‌شه');
}
function gratHydrateVideos(root){
  if(!root) return;
  root.querySelectorAll('video[data-gvid]').forEach(function(el){
    if(el.getAttribute('data-ok') === '1') return;
    const id = el.getAttribute('data-gvid');
    gratVidUrl({ id: id }).then(function(u){ el.src = u; el.setAttribute('data-ok','1'); }).catch(function(){
      const box = el.closest('.gv-vid');
      if(box){
        const m = document.createElement('div'); m.className = 'gv-vid-miss';
        m.textContent = 'فایل این ویدیو روی این دستگاه پیدا نشد.';
        el.replaceWith(m);
      }
    });
  });
}
function renderGratVideoList(mode){
  const wrap = document.getElementById(gratElId(mode, 'video-list'));
  if(!wrap) return;
  const arr = gratVideosArr(mode);
  wrap.innerHTML = arr.map(function(v, idx){
    return '<div class="gv-vid"><video controls playsinline preload="metadata" data-gvid="' + v.id + '"></video>' +
      '<button type="button" class="gv-vid-del" title="حذف ویدیو" onclick="event.stopPropagation();removeGratVideo(' + idx + ', \'' + mode + '\')">×</button></div>';
  }).join('');
  arr.forEach(function(v){
    const el = wrap.querySelector('video[data-gvid="' + v.id + '"]');
    if(!el) return;
    gratVidUrl(v).then(function(u){ el.src = u; el.setAttribute('data-ok','1'); }).catch(function(){
      const m = document.createElement('div'); m.className = 'gv-vid-miss';
      m.textContent = 'فایل این ویدیو روی این دستگاه پیدا نشد.';
      el.replaceWith(m);
    });
  });
}
function removeGratVideo(idx, mode){
  if(!window.confirm('این ویدیو حذف شود؟')) return;
  const arr = gratVideosArr(mode);
  const v = arr[idx];
  arr.splice(idx, 1);
  if(v && v.blob && gratVidUrls[v.id]){ try{ URL.revokeObjectURL(gratVidUrls[v.id]); }catch(e){} delete gratVidUrls[v.id]; }
  renderGratVideoList(mode);
}
async function gratCommitVideos(arr){
  const out = []; let failed = 0;
  for(const v of arr){
    if(v.blob){
      try{ await gratVidTx('readwrite', function(st){ return st.put(v.blob, v.id); }); }
      catch(e){ failed++; continue; }
    }
    out.push({ id: v.id, name: v.name, type: v.type, size: v.size });
  }
  if(failed) toast('ذخیره‌ی ویدیو ممکن نشد (حافظه یا مرورگر)');
  return out;
}
function resetGratNewMedia(){
  gratNewImages = []; gratNewAudios = []; gratNewVideos = [];
  renderGratVideoList('new'); renderGratImageThumbs('new'); renderGratAudioList('new');
}
function resetGratHomeMedia(){
  gratHomeImages = []; gratHomeAudios = []; gratHomeVideos = [];
  renderGratVideoList('home'); renderGratImageThumbs('home'); renderGratAudioList('home');
}

async function addGratitude(){
  const input = document.getElementById('grat-input');
  const val = (input.value||'').trim();
  const hasImages = gratNewImages.length > 0;
  const hasAudios = gratNewAudios.length > 0;
  const hasVideos = gratNewVideos.length > 0;
  if(!val && !hasImages && !hasAudios && !hasVideos){ toast('یه متن، عکس، ویدیو یا صدا وارد کن 🌱'); return; }
  const savedVideos = hasVideos ? await gratCommitVideos(gratNewVideos) : [];
  if(!val && !hasImages && !hasAudios && !savedVideos.length) return;
  const visRadio = document.querySelector('input[name="grat-vis"]:checked');
  const shared = !!(visRadio && visRadio.value === 'public');
  const np = nowParts();
  const newEntry = {
    id: Date.now()+Math.random(),
    text: val, icon:'🙏', image: gratNewImages.length ? gratNewImages[0].src : null, amount:null,
    images: gratNewImages.slice(), audios: gratNewAudios.slice(), videos: savedVideos,
    date: np.date, day: np.day, time: np.time, iso: np.iso, source:'manual', shared: shared
  };
  state.gratitude.push(newEntry);
  updateGratitudeNumbers();
  state.shareGratitude = shared;
  neuralAutoAddFiber(ensureGratitudeNeural());
  saveState();
  input.value='';
  autoGrowGratInput(input);
  resetGratNewMedia();
  renderHistory();
  renderHome();
  renderAllNeuralPathways();
  toast(shared ? 'ثبت شد و با بقیه به اشتراک گذاشته شد 🌍' : 'ثبت شد — فقط برای خودم 🤫');
  if(shared) syncGratitudeShare(newEntry);
}
function gratDisplayText(text, g){
  if(g && g.source === 'purchase'){
    const nm = (text || '').trim();
    if(!nm) return '🛍 خرید';
    return nm;
  }
  if(!text || !text.trim()) return '🙏 شکرگذاری';
  return text.startsWith('خدایا شکرت که') ? text : `خدایا شکرت که: ${text}`;
}
function renderHistory(){
  if(ensureSetup()) return;
  updateGratitudeNumbers();
  renderThemeBanner();
  try{ renderAllNeuralPathways(); }catch(e){}
  const list = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  const counterCard = document.getElementById('grat-counter-card');
  list.innerHTML = '';
  const totalCount = state.gratitude.length;
  const faTotal = totalCount.toLocaleString('fa-IR');
  if (counterCard) {
    counterCard.innerHTML = `<div class="grat-user-count">لطف خدا رو <b>${faTotal}</b> بار شکر کردم</div>`;
  }
  if(totalCount===0){ empty.style.display='block'; updateGlobalGratCount(faTotal); return; }
  empty.style.display='none';
  updateGlobalGratCount(faTotal);
  let itemsHTML = '';
  const histAll = [...state.gratitude].reverse();
  histAll.slice(0, gratListLimit.hist).forEach(g=>{
    const displayText = gratDisplayText(g.text, g);
    itemsHTML += `
      <div class="tx-item" style="cursor:pointer;" onclick="gratRowClick(${g.id})">
        <div class="ic">${gratIconOrImage(g)}</div>
        <div class="mid">
          <div class="t1">${nl2br(escapeHtml(displayText))}</div>
          <div class="t2">${g.day} ${g.date} - ${g.time}</div>
          ${(g.images && g.images.length) ? `<div class="gv-grid">${g.images.map((im,idx)=>`<button type="button" class="gv-thumb" onclick="event.stopPropagation();openGratEntryAlbum(${g.id},${idx})"><img src="${im.src}" alt="" draggable="false" loading="lazy" decoding="async"></button>`).join('')}</div>` : ''}
          ${(g.audios && g.audios.length) ? g.audios.map(a=>`<div class="audio-player-box" onclick="event.stopPropagation()"><audio controls preload="none" src="${a.src}"></audio><span class="ap-name">${escapeHtmlSafe(a.name||'')}</span></div>`).join('') : ''}
          ${(g.videos && g.videos.length) ? g.videos.map(v=>`<div class="gv-vid" onclick="event.stopPropagation()"><video controls playsinline preload="metadata" data-gvid="${v.id}"></video></div>`).join('') : ''}
        </div>
        ${g.amount ? `<div class="amt">${formatMoney(g.amount)}</div>` : ''}
      </div>
    `;
  });
  if(histAll.length > gratListLimit.hist){
    itemsHTML += '<button type="button" class="ghost-btn" style="margin:10px auto;display:block;" onclick="gratListLimit.hist+=40;renderHistory()">نمایش بیشتر (' + (histAll.length - gratListLimit.hist).toLocaleString('fa-IR') + ' مورد دیگر)</button>';
  }
  list.innerHTML = itemsHTML;
  gratHydrateVideos(list);
}
function updateGlobalGratCount(fallbackFa){
  if(window.supabaseClient){
    window.supabaseClient.from('public_gratitude').select('*', { count: 'exact', head: true })
      .then(({ count })=>{
        const globalEl = document.getElementById('global-grat-count');
        if(globalEl && count !== null) globalEl.textContent = count.toLocaleString('fa-IR');
      }).catch(()=>{
        const globalEl = document.getElementById('global-grat-count');
        if(globalEl) globalEl.textContent = fallbackFa;
      });
  } else {
    const globalEl = document.getElementById('global-grat-count');
    if(globalEl) globalEl.textContent = fallbackFa;
  }
}

function renderShopHistory(){
  if(ensureSetup()) return;
  const list = document.getElementById('shop-history-list');
  const empty = document.getElementById('shop-history-empty');
  list.innerHTML = '';
  document.getElementById('shop-hist-total').textContent = formatMoney(spentToman());
  const records = state.history || [];
  if(records.length===0){ empty.style.display='block'; return; }
  empty.style.display='none';
  [...records].reverse().forEach(r=>{
    (r.items||[]).forEach(it=>{
      const qty = it.qty || 1;
      const row = document.createElement('div');
      row.className = 'shx-item';
      row.onclick = ()=>{ showReceipt(r); goto('receipt'); };
      row.innerHTML = `
        <div class="ic">${iconOrImage(it)}</div>
        <div class="mid">
          <div class="t1">${escapeHtml(it.name||'')}</div>
          <div class="t2">${r.day} ${r.date} - ${r.time}${qty>1 ? ' · ×'+qty.toLocaleString('fa-IR') : ''}</div>
        </div>
        <div class="amt">${formatMoney(qty*(it.price||0))}${qty>1 ? '<small>هر کدام '+formatMoney(it.price||0)+'</small>' : ''}</div>`;
      list.appendChild(row);
    });
  });
}

let editingGratId = null;
function openGratEditor(id){
  const g = (state.gratitude||[]).find(x=>x.id===id);
  if(!g) return;
  editingGratId = id;
  let rawText = g.text || '';
  if(rawText.startsWith('خدایا شکرت که: ')) rawText = rawText.replace('خدایا شکرت که: ', '');
  else if(rawText.startsWith('خدایا شکرت که')) rawText = rawText.replace('خدایا شکرت که', '');
  const isPurchase = g.source === 'purchase';
  document.getElementById('grat-edit-text').value = rawText;
  document.getElementById('grat-edit-text').placeholder = isPurchase ? 'متن این خرید را بنویس یا ویرایش کن...' : 'متن شکرگذاری...';
  const rcB = document.getElementById('grat-edit-receipt-btn'); if(rcB) rcB.style.display = (isPurchase && g.txId) ? '' : 'none';
  const visB = document.getElementById('grat-edit-vis-box'); if(visB) visB.style.display = isPurchase ? 'none' : '';
  const ttl = document.getElementById('grat-edit-title'); if(ttl) ttl.textContent = isPurchase ? 'ویرایش خرید' : 'ویرایش شکرگذاری';
  gratEditImages = (g.images || []).slice();
  gratEditAudios = (g.audios || []).slice();
  gratEditVideos = (g.videos || []).map(v=>Object.assign({}, v));
  renderGratVideoList('edit');
  renderGratImageThumbs('edit');
  renderGratAudioList('edit');
  setGratRecordBtn('edit', false);
  const evr = document.querySelector('input[name="grat-edit-vis"][value="' + (g.shared ? 'public' : 'private') + '"]'); if(evr) evr.checked = true;
  document.getElementById('grat-edit-modal').classList.add('show');
}
function closeGratEditor(){
  if(gratRecorder && gratRecorder.state === 'recording'){ gratRecorder.stop(); }
  editingGratId = null;
  gratEditImages = []; gratEditAudios = []; gratEditVideos = [];
  const evl = document.getElementById('grat-edit-video-list'); if(evl) evl.innerHTML = '';
  document.getElementById('grat-edit-modal').classList.remove('show');
}
async function saveGratEdit(){
  if(editingGratId==null) return;
  const g = (state.gratitude||[]).find(x=>x.id===editingGratId);
  if(!g) return;
  let newText = (document.getElementById('grat-edit-text').value||'').trim();
  const hasImages = gratEditImages.length > 0;
  const hasAudios = gratEditAudios.length > 0;
  const hasVideos = gratEditVideos.length > 0;
  if(!newText && !hasImages && !hasAudios && !hasVideos){ toast('یه متن، عکس، ویدیو یا صدا وارد کن 🌱'); return; }
  const keepIds = gratEditVideos.map(v=>v.id);
  const removedVideos = (g.videos || []).filter(v=>keepIds.indexOf(v.id) < 0);
  const savedVideos = await gratCommitVideos(gratEditVideos);
  const wasShared = g.shared;
  const oldEntrySnapshot = Object.assign({}, g);
  g.text = newText;
  g.images = gratEditImages.slice();
  g.audios = gratEditAudios.slice();
  g.videos = savedVideos;
  gratVidDelete(removedVideos);
  g.image = g.images.length ? g.images[0].src : null;
  const visR = document.querySelector('input[name="grat-edit-vis"]:checked');
  let wantShared = (g.source === 'purchase') ? !!wasShared : (visR ? visR.value === 'public' : wasShared);
  if(wantShared && !wasShared && !window.supabaseClient){ wantShared = false; toast('این قابلیت هنوز فعال نشده 🌱'); }
  g.shared = wantShared;
  saveState();
  if(wasShared){
    unsyncGratitudeShare(oldEntrySnapshot);
    if(wantShared) syncGratitudeShare(g);
  } else if(wantShared){
    syncGratitudeShare(g);
  }
  closeGratEditor();
  renderHistory();
  renderHome();
  toast('شکرگذاری ویرایش شد');
}
function deleteGratEntry(){
  if(editingGratId==null) return;
  const g = (state.gratitude||[]).find(x=>x.id===editingGratId);
  if(!g) return;
  if(g.shared) unsyncGratitudeShare(g);
  gratVidDelete(g.videos);
  state.gratitude = state.gratitude.filter(x=>x.id!==editingGratId);
  saveState();
  closeGratEditor();
  renderHistory();
  renderHome();
  toast('شکرگذاری حذف شد 🗑');
}

function updateBeliefField(field, value){
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  const numericFields = ['attentionLever'];
  state.currentBelief[field] = numericFields.includes(field) ? Number(value) : value;
  saveState();
}
function addTrackingItem(){
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  const el = document.getElementById('b-tracking');
  const text = el.value.trim();
  if(!text){ toast('یه چیزی بنویس'); el.focus(); return; }
  if(!state.currentBelief.trackingItems) state.currentBelief.trackingItems = [];
  state.currentBelief.trackingItems.push({ id: Date.now()+Math.random(), text });
  state.currentBelief.trackingActive = true;
  el.value = '';
  saveState();
  renderTrackingList();
  renderTrackingState();
  toast('اضافه شد ✨');
}
function removeTrackingItem(id){
  state.currentBelief.trackingItems = (state.currentBelief.trackingItems||[]).filter(t=>t.id!==id);
  saveState();
  renderTrackingList();
}
function renderTrackingList(){
  const list = document.getElementById('tracking-list');
  const items = (state.currentBelief && state.currentBelief.trackingItems) || [];
  list.innerHTML = items.map(t=>`
    <div class="tracking-item">
      <span>${escapeHtmlSafe(t.text)}</span>
      <button class="rm" onclick="removeTrackingItem(${t.id})">×</button>
    </div>
  `).join('');
}
function escapeHtmlSafe(s){
  return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function handleVisualImages(files){
  if(!files || !files.length) return;
  const list = Array.from(files);
  document.getElementById('visual-image-input').value = '';
  const srcs = await cropImages(list);
  if(!srcs.length) return;
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  if(!state.currentBelief.visualImages) state.currentBelief.visualImages = [];
  srcs.forEach(src=>{ state.currentBelief.visualImages.push({ id: Date.now()+Math.random(), src }); });
  saveState();
  renderVisualGallery();
  toast('عکس اضافه شد ✨');
}
function removeVisualImage(id){
  state.currentBelief.visualImages = (state.currentBelief.visualImages||[]).filter(i=>i.id!==id);
  saveState();
  renderVisualGallery();
}
function renderVisualGallery(){
  const gallery = document.getElementById('visual-gallery');
  const imgs = (state.currentBelief && state.currentBelief.visualImages) || [];
  gallery.innerHTML = imgs.map(i=>`
    <div class="vg-item">
      <img src="${i.src}" alt="">
      <button class="vg-rm" onclick="removeVisualImage(${i.id})">×</button>
    </div>
  `).join('');
}
function handleMeditationAudio(files){
  if(!files || !files.length) return;
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  const f = files[0];
  const r = new FileReader();
  r.onload = ()=>{
    state.currentBelief.audioTrack = { name: f.name, src: r.result };
    renderMeditationAudio();
    document.getElementById('meditation-audio-input').value = '';
    const res = saveStateSync();
    if(!(res === 'fail' && DS.ok === false)) toast('موسیقی اضافه شد 🎵');
  };
  r.readAsDataURL(f);
}
function removeMeditationAudio(){
  if(!state.currentBelief) return;
  state.currentBelief.audioTrack = null;
  saveState();
  renderMeditationAudio();
}
function renderMeditationAudio(){
  const wrap = document.getElementById('meditation-audio-wrap');
  if(!wrap) return;
  const track = state.currentBelief && state.currentBelief.audioTrack;
  if(!track){ wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <div class="audio-player-box">
      <audio controls src="${track.src}"></audio>
      <span class="ap-name">${escapeHtmlSafe(track.name||'')}</span>
      <button class="ap-rm" onclick="removeMeditationAudio()">×</button>
    </div>
  `;
}
function toggleTracking(){
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  state.currentBelief.trackingActive = !state.currentBelief.trackingActive;
  saveState();
  renderTrackingState();
  toast(state.currentBelief.trackingActive ? 'ردیابی فعال شد 📡' : 'ردیابی متوقف شد');
}
function renderTrackingState(){
  const active = !!(state.currentBelief && state.currentBelief.trackingActive);
  const btn = document.getElementById('ras-activate-btn');
  const radar = document.getElementById('ras-radar');
  btn.textContent = active ? 'ردیابی فعاله ✓' : 'فعال کردن ردیابی';
  btn.classList.toggle('active', active);
  radar.classList.toggle('spin', active);
}
function todayKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function dayKeyOffset(off){ const d=new Date(); d.setDate(d.getDate()+off); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }

function ensureGratitudeNeural(){
  if(!state.gratitudeNeural || typeof state.gratitudeNeural !== 'object') state.gratitudeNeural = {logs:{}, lastSyncKey:null, habitFormed:false};
  return state.gratitudeNeural;
}
function ensureBeliefNeural(){
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  if(!state.currentBelief.neural || typeof state.currentBelief.neural !== 'object') state.currentBelief.neural = {logs:{}, lastSyncKey:null, habitFormed:false};
  return state.currentBelief.neural;
}
function ensureTrackingNeural(){
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  if(!state.currentBelief.trackingNeural || typeof state.currentBelief.trackingNeural !== 'object') state.currentBelief.trackingNeural = {logs:{}, lastSyncKey:null, habitFormed:false};
  return state.currentBelief.trackingNeural;
}
function ensureShopNeural(){
  if(!state.shopNeural || typeof state.shopNeural !== 'object') state.shopNeural = {logs:{}, lastSyncKey:null, habitFormed:false};
  return state.shopNeural;
}
function ensureDispenzaNeural(){
  if(!state.dispenzaNeural || typeof state.dispenzaNeural !== 'object'){ state.dispenzaNeural = {logs:{}, lastSyncKey:null, habitFormed:false}; }
  return state.dispenzaNeural;
}
function ensureVisualNeural(){
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  if(!state.currentBelief.visualNeural || typeof state.currentBelief.visualNeural !== 'object') state.currentBelief.visualNeural = {logs:{}, lastSyncKey:null, habitFormed:false};
  return state.currentBelief.visualNeural;
}
function todayDispenzaKey(){ return dayKeyFromDate(new Date()); }
function ensureNothingProgress(){
  if(!state.nothingProgress || typeof state.nothingProgress !== 'object'){ state.nothingProgress = {}; }
  return state.nothingProgress;
}
function getTodayNothingSteps(){
  const prog = ensureNothingProgress();
  const k = todayDispenzaKey();
  if(!Array.isArray(prog[k])) prog[k] = [];
  return prog[k];
}
function renderNothingPractice(){
  const stage  = document.getElementById('nothing-stage');
  const steps  = document.getElementById('nothing-steps');
  const finalEl= document.getElementById('nothing-final');
  if(!stage || !steps) return;
  const done = getTodayNothingSteps();
  stage.querySelectorAll('.nothing-layer').forEach(layer=>{
    const key = layer.dataset.nothing;
    layer.classList.toggle('is-gone', done.includes(key));
  });
  steps.querySelectorAll('.nothing-step').forEach(btn=>{
    const key = btn.dataset.nothingStep;
    const isDone = done.includes(key);
    btn.classList.toggle('is-done', isDone);
    const check = btn.querySelector('.nothing-step-check');
    if(check) check.textContent = isDone ? '✓' : '○';
  });
  const allDone = done.length === 5;
  if(finalEl) finalEl.classList.toggle('is-visible', allDone);
  const soundBtn = document.getElementById('nothing-sound-toggle');
  if(soundBtn) soundBtn.textContent = isNothingSoundOn() ? '🔔' : '🔕';
}
function toggleNothingStep(key){
  resumeAudio();
  const prog = ensureNothingProgress();
  const k = todayDispenzaKey();
  if(!Array.isArray(prog[k])) prog[k] = [];
  const list = prog[k];
  const idx = list.indexOf(key);
  const wasDone = idx !== -1;
  if(wasDone){ list.splice(idx, 1); playUndoSoft(); }
  else {
    list.push(key);
    const stepOrder = ['body','one','thing','where','time'];
    const stepIdx  = Math.max(0, stepOrder.indexOf(key));
    playReleaseChime(stepIdx);
  }
  saveState();
  renderNothingPractice();
  if(!wasDone && list.length === 5){
    setTimeout(()=>{
      playCompletionGong();
      const finalEl = document.getElementById('nothing-final');
      if(finalEl && finalEl.scrollIntoView){ finalEl.scrollIntoView({behavior:'smooth', block:'center'}); }
    }, 350);
  }
}
function resetNothingPractice(){
  const prog = ensureNothingProgress();
  prog[todayDispenzaKey()] = [];
  saveState();
  renderNothingPractice();
}
function markDispenzaDone(){
  const done = getTodayNothingSteps();
  if(done.length < 5){
    if(typeof toast === 'function'){ toast('اول پنج مرحله‌ی «هیچ‌شدن» رو کامل کن — ' + (5 - done.length) + ' مرحله مونده'); }
    return;
  }
  neuralAutoAddFiber(ensureDispenzaNeural());
  saveState();
  renderAllNeuralPathways();
  if(typeof toast === 'function'){ toast('ثبت شد — مدار عصبی مدیتیشن دیسپنزا یک گام قوی‌تر شد 🧠'); }
  renderNothingPractice();
}
document.addEventListener('click', function(e){
  const stepBtn = e.target.closest('.nothing-step');
  if(stepBtn){ e.preventDefault(); toggleNothingStep(stepBtn.dataset.nothingStep); }
});

function isGratitudeConfirmedForKey(dayKey){
  const dk = dayKeyFromDate(ndKeyToDate(dayKey));
  return (state.gratitude||[]).some(function(g){ return g.source!=='purchase' && g.iso && dayKeyFromIso(g.iso)===dk; });
}
function isBeliefConfirmedForKey(dayKey){
  const dk = dayKeyFromDate(ndKeyToDate(dayKey));
  return (state.futureReadDays||[]).includes(dk);
}
function isTrackingConfirmedForKey(dayKey){
  const dk = dayKeyFromDate(ndKeyToDate(dayKey));
  const items = (state.currentBelief && state.currentBelief.trackingItems) || [];
  return items.some(function(it){ return dayKeyFromDate(new Date(Math.floor(it.id))) === dk; });
}
function isVisualConfirmedForKey(dayKey){
  const dk = dayKeyFromDate(ndKeyToDate(dayKey));
  const imgs = (state.currentBelief && state.currentBelief.visualImages) || [];
  return imgs.some(function(im){ return dayKeyFromDate(new Date(Math.floor(im.id))) === dk; });
}
function syncShopNeuralFromHistory(){
  const sn = ensureShopNeural();
  (state.history||[]).forEach(function(h){
    if(!h.iso) return;
    const d = new Date(h.iso);
    const k = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    if(sn.logs[k] !== true) sn.logs[k] = true;
  });
  Object.keys(sn.logs).forEach(function(k){ if(sn.logs[k] === false && /^\d{4}-\d{1,2}-\d{1,2}$/.test(k)) delete sn.logs[k]; });
  return sn;
}
function renderAllNeuralPathways(){
  if(document.getElementById('np-gratitude-mount')){
    renderNeuralPathway('np-gratitude-mount', ensureGratitudeNeural(), { label: 'شکرگذاری', practiceKey: 'gratitude', showTodayPrompt: true, onChange: saveState });
  }
  if(document.getElementById('np-gratitude-hist-mount')){
    renderNeuralPathway('np-gratitude-hist-mount', ensureGratitudeNeural(), { label: 'شکرگذاری', practiceKey: 'gratitude', showDayButtons: false, onChange: saveState });
  }
  if(document.getElementById('np-belief-mount')){
    renderNeuralPathway('np-belief-mount', ensureBeliefNeural(), { label: 'تمرین باب پراکتور', practiceKey: 'belief', onChange: saveState });
  }
  if(document.getElementById('np-dispenza-mount')){
    renderNeuralPathway('np-dispenza-mount', ensureDispenzaNeural(), { label: 'مدیتیشن دیسپنزا', practiceKey: 'dispenza', onChange: saveState });
  }
  if(document.getElementById('np-tracking-mount')){
    renderNeuralPathway('np-tracking-mount', ensureTrackingNeural(), { label: 'ردیابی RAS', practiceKey: 'tracking', calendarLinked: true, isConfirmed: isTrackingConfirmedForKey, onChange: saveState });
  }
  if(document.getElementById('np-visual-mount')){
    renderNeuralPathway('np-visual-mount', ensureVisualNeural(), { label: 'تصویرسازی', practiceKey: 'visual', calendarLinked: true, isConfirmed: isVisualConfirmedForKey, onChange: saveState });
  }
}
function renderShopNeural(){
  if(!document.getElementById('np-shop-mount')) return;
  syncShopNeuralFromHistory();
  renderNeuralPathway('np-shop-mount', ensureShopNeural(), {label:'بازی فراوانی', practiceKey: 'shop', onChange: saveState, showDayButtons:false, noMissPenalty:true});
}

const EMOTIONS_LIST = [
  { id:'shame',       fa:'شرم',          freq: 20, color:'#5c0404' },
  { id:'guilt',       fa:'گناه',         freq: 30, color:'#7a0a0a' },
  { id:'despair',     fa:'ناامیدی',      freq: 50, color:'#8a0808' },
  { id:'sadness',     fa:'غم',           freq: 75, color:'#a01010' },
  { id:'fear',        fa:'ترس',          freq:100, color:'#b31000' },
  { id:'lack',        fa:'کمبود',        freq:125, color:'#d81800' },
  { id:'anger',       fa:'خشم',          freq:150, color:'#f22a00' },
  { id:'pride',       fa:'غرور',         freq:175, color:'#f4470a' },
  { id:'courage',     fa:'شجاعت',        freq:200, color:'#f2650a' },
  { id:'neutral',     fa:'خنثی بودن',    freq:250, color:'#f08c00' },
  { id:'readiness',   fa:'آمادگی',       freq:310, color:'#f0c400' },
  { id:'acceptance',  fa:'پذیرش',        freq:350, color:'#f5e600' },
  { id:'selfmastery', fa:'تسلط بر خود',  freq:400, color:'#9ee600' },
  { id:'love',        fa:'عشق',          freq:500, color:'#12c93a' },
  { id:'joy',         fa:'شادی',         freq:540, color:'#00c2c4' },
  { id:'peace',       fa:'آرامش',        freq:600, color:'#1a2be8' },
  { id:'beyond',      fa:'فراتر از خود', freq:700, color:'#9b1fb0' }
];
const EMOTION_BY_ID = EMOTIONS_LIST.reduce(function(m,e){ m[e.id]=e; return m; }, {});
function ensurePracticeEmotions(){
  if(!state.practiceEmotions || typeof state.practiceEmotions !== 'object') state.practiceEmotions = {};
  return state.practiceEmotions;
}
function openEmotionCapture(practiceKey, phase, label){
  if (typeof window.__echwBeginCapture !== 'function'){
    if (typeof toast === 'function') toast('ویجت احساسات در حال بارگذاری است…');
    return;
  }
  const em = ensurePracticeEmotions();
  const dk = dayKeyFromDate(new Date());
  const rec = (em[dk] && em[dk][practiceKey]) || {};
  let initial = rec[phase];
  if(!initial || !initial.length){
    if(phase === 'after' && rec.before && rec.before.length) initial = rec.before.slice();
    else initial = [];
  }
  window.__echwBeginCapture({ practiceKey, phase, label: label || practiceKey, initial, onSave: function(ids, ctx){ saveEmotionCaptureFromWidget(ids, ctx); } });
}
function saveEmotionCaptureFromWidget(ids, ctx){
  const pk = ctx.practiceKey;
  const ph = ctx.phase;
  const lbl = ctx.label;
  const em = ensurePracticeEmotions();
  const dk = dayKeyFromDate(new Date());
  if(!em[dk]) em[dk] = {};
  if(!em[dk][pk]) em[dk][pk] = {};
  em[dk][pk][ph] = ids.slice();
  em[dk][pk].label = lbl;
  em[dk][pk].at = Date.now();
  saveState();
  if(typeof toast === 'function') toast('حس و حالت ثبت شد 💗');
  try{ if(document.getElementById('bank-cal-grid')) renderBankCal(); }catch(e){}
}
window.openEmotionCapture = openEmotionCapture;

function echwFiberIsToday(k){
  if(k === todayKey()) return true;
  const m = /^f(\d{10,})-/.exec(k);
  if(!m) return false;
  return dayKeyFromDate(new Date(+m[1])) === dayKeyFromDate(new Date());
}
function echwApplyFeelingToContainer(c, ids, dom, createIfConfirmed){
  neuralEnsureContainer(c);
  if(!c.fiberEmotions || typeof c.fiberEmotions !== 'object') c.fiberEmotions = {};
  const felt = function(){ return { ids: ids.slice(), color: dom.color, freq: dom.freq }; };
  const keys = Object.keys(c.logs).filter(function(k){ return c.logs[k] === true && echwFiberIsToday(k); });
  if(!keys.length){
    if(!createIfConfirmed) return null;
    const nk = neuralFiberKey();
    c.logs[nk] = true;
    c.fiberEmotions[nk] = felt();
    return { done:true, applied:true };
  }
  let applied = false;
  keys.forEach(function(k){ if(!c.fiberEmotions[k]){ c.fiberEmotions[k] = felt(); applied = true; } });
  return { done:true, applied:applied };
}
window.addEventListener('echw:commit', function(ev){
  try{
    const ids = (ev.detail && ev.detail.ids) || [];
    if(!ids.length || typeof state === 'undefined' || !state) return;
    let dom = null;
    ids.forEach(function(id){ const e = EMOTION_BY_ID[id]; if(e && (!dom || e.freq > dom.freq)) dom = e; });
    if(!dom) return;
    const tk = todayKey();
    syncShopNeuralFromHistory();
    const practices = [
      { pk:'gratitude', label:'شکرگذاری',          c:ensureGratitudeNeural(), create:isGratitudeConfirmedForKey(tk) },
      { pk:'belief',    label:'تمرین باب پراکتور',  c:ensureBeliefNeural(),    create:isBeliefConfirmedForKey(tk) },
      { pk:'dispenza',  label:'مدیتیشن دیسپنزا',    c:ensureDispenzaNeural(),  create:false },
      { pk:'tracking',  label:'ردیابی RAS',         c:ensureTrackingNeural(),  create:false },
      { pk:'visual',    label:'تصویرسازی',          c:ensureVisualNeural(),    create:false },
      { pk:'shop',      label:'بازی فراوانی',       c:ensureShopNeural(),      create:false }
    ];
    const doneList = [];
    practices.forEach(function(p){
      const r = echwApplyFeelingToContainer(p.c, ids, dom, p.create);
      if(r) doneList.push({ pk:p.pk, label:p.label, applied:r.applied });
    });
    (ev.detail.done || []).forEach(function(d){ doneList.push(d); });
    if(!doneList.length) return;
    const em = ensurePracticeEmotions();
    const dk = dayKeyFromDate(new Date());
    if(!em[dk]) em[dk] = {};
    doneList.forEach(function(d){
      if(!em[dk][d.pk]) em[dk][d.pk] = {};
      em[dk][d.pk].after = ids.slice();
      em[dk][d.pk].label = d.label;
      em[dk][d.pk].at = Date.now();
    });
    saveState();
    try{ renderAllNeuralPathways(); }catch(e){}
    try{ renderShopNeural(); }catch(e){}
    try{ renderGratitudeMiniCal(); }catch(e){}
    try{ if(document.getElementById('bank-cal-modal') && document.getElementById('bank-cal-modal').classList.contains('show') && document.getElementById('bank-cal-grid').style.display !== 'none') renderBankCal(); }catch(e){}
    if(typeof window.__echwResetSelection === 'function') window.__echwResetSelection();
    if(typeof toast === 'function') toast('حس ثبت شد و رشته‌ی عصبی ساخته شد 🧠');
  }catch(e){ console.warn(e); }
});

function renderBeliefsView(){
  if(!state.currentBelief) state.currentBelief = defaultCurrentBelief();
  const cb = state.currentBelief;
  document.getElementById('b-visual-note').value = cb.visualNote || '';
  renderTrackingList();
  renderTrackingState();
  renderAllNeuralPathways();
  renderNothingPractice();
  renderFutureUI();
  const sw = document.getElementById('alarm-switch');
  sw.classList.toggle('on', !!state.alarmEnabled);
  document.getElementById('alarm-time').value = state.alarmTime;
  setTimeout(function(){ renderVisualGallery(); renderMeditationAudio(); }, 0);
}

function updateFutureText(val){ state.futureText = val; saveState(); }
function dayKeyFromDate(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function startFutureProtocol(){
  if(!(state.futureText||'').trim()){ toast('اول متنت رو بنویس 📜'); return; }
  if(!state.futureStartDate) state.futureStartDate = dayKeyFromDate(new Date());
  saveState();
  renderFutureUI();
  toast('دوره‌ی ۹۰ روزه شروع شد ✨');
}
function markFutureRead(){
  if(!state.futureStartDate) return;
  const t = dayKeyFromDate(new Date());
  if(!state.futureReadDays) state.futureReadDays = [];
  if(!state.futureReadDays.includes(t)){
    state.futureReadDays.push(t);
    neuralAutoAddFiber(ensureBeliefNeural());
    saveState();
    toast('ثبت شد — یک رشته‌ی میلینی جدید در مدار باب پراکتور ساخته شد 🧠');
  }
  renderFutureUI();
  if(typeof renderAllNeuralPathways === 'function') renderAllNeuralPathways();
}
function renderFutureUI(){
  const textEl = document.getElementById('b-future-text');
  if(textEl) textEl.value = state.futureText || '';
  const startBtn = document.getElementById('future-start-btn');
  const readBtn = document.getElementById('future-read-btn');
  const progressWrap = document.getElementById('future-progress-wrap');
  if(!startBtn) return;
  if(state.futureStartDate){
    startBtn.style.display = 'none';
    readBtn.style.display = '';
    progressWrap.style.display = '';
    const readCount = Math.min((state.futureReadDays||[]).length, 90);
    const t = dayKeyFromDate(new Date());
    const doneToday = (state.futureReadDays||[]).includes(t);
    readBtn.textContent = doneToday ? '📖 امروز خواندم ✓' : '📖 امروز خواندم';
    document.getElementById('future-day-num').textContent = readCount.toLocaleString('fa-IR');
    document.getElementById('future-day-pct').textContent = Math.round(readCount/90*100).toLocaleString('fa-IR')+'٪';
    document.getElementById('future-progress-bar').style.width = (readCount/90*100)+'%';
  }else{
    startBtn.style.display = '';
    readBtn.style.display = 'none';
    progressWrap.style.display = 'none';
  }
}

let bankCalKind = 'gratitude';
let bankCalCursor = new Date();
function dayKeyFromIso(iso){
  if(!iso) return '';
  const d = new Date(iso);
  return dayKeyFromDate(d);
}
function openBankCalendar(kind){
  bankCalKind = kind;
  bankCalCursor = new Date();
  bankCalCursor.setDate(1);
  const titles = { gratitude:'📅 تقویم شکرگذاری', shop:'📅 تقویم بازی فراوانی', beliefs:'📅 تقویم خواندن متن آینده', tracking:'📅 تقویم ردیابی' };
  document.getElementById('bank-cal-title').textContent = titles[kind] || '📅 تقویم';
  document.getElementById('bank-cal-modal').classList.add('show');
  const isPeriod = kind === 'gratitude';
  const nav = document.getElementById('bank-cal-nav');
  const weekdays = document.getElementById('bank-cal-weekdays');
  const grid = document.getElementById('bank-cal-grid');
  const dayDetail = document.getElementById('bank-cal-day-detail');
  const periodWrap = document.getElementById('bank-cal-period-wrap');
  if(nav) nav.style.display = isPeriod ? 'none' : 'flex';
  if(weekdays) weekdays.style.display = isPeriod ? 'none' : 'grid';
  if(grid) grid.style.display = isPeriod ? 'none' : 'grid';
  if(dayDetail) dayDetail.style.display = isPeriod ? 'none' : 'block';
  if(periodWrap) periodWrap.style.display = isPeriod ? 'block' : 'none';
  if(isPeriod) renderGratitudeMiniCal();
  else renderBankCal();
}
function closeBankCalendar(){ document.getElementById('bank-cal-modal').classList.remove('show'); }
function bankCalNav(delta){
  bankCalCursor.setMonth(bankCalCursor.getMonth()+delta);
  renderBankCal();
}
function bankCalEntriesByDay(){
  const byDay = {};
  const push = function(key, item){ if(!key) return; (byDay[key] = byDay[key] || []).push(item); };
  (state.gratitude || []).filter(function(g){ return g.iso && g.source !== 'purchase'; }).forEach(function(g){
    const k = dayKeyFromIso(g.iso);
    push(k, { __kind: 'gratitude', data: g });
  });
  (state.history || []).filter(function(h){ return h.iso; }).forEach(function(h){
    const k = dayKeyFromIso(h.iso);
    push(k, { __kind: 'shop', data: h });
  });
  (state.futureReadDays || []).forEach(function(k){ push(k, { __kind: 'beliefs', data: { read: true } }); });
  const ddp = state.dispenzaDailyProgress || {};
  Object.keys(ddp).forEach(function(k){ push(k, { __kind: 'dispenza', data: { steps: ddp[k] || [] } }); });
  const trackItems = (state.currentBelief && state.currentBelief.trackingItems) || [];
  trackItems.forEach(function(it){
    const ts = Math.floor(it.id);
    if(!isNaN(ts) && ts > 0){ const k = dayKeyFromDate(new Date(ts)); push(k, { __kind: 'tracking', data: it }); }
  });
  const visualImgs = (state.currentBelief && state.currentBelief.visualImages) || [];
  visualImgs.forEach(function(im){
    const ts = Math.floor(im.id);
    if(!isNaN(ts) && ts > 0){ const k = dayKeyFromDate(new Date(ts)); push(k, { __kind: 'visual', data: im }); }
  });
  const pem = state.practiceEmotions || {};
  Object.keys(pem).forEach(function(k){
    const day = pem[k];
    if(day && Object.keys(day).length){ push(k, { __kind: 'emotion', data: day }); }
  });
  return byDay;
}
function renderBankCal(){
  const grid = document.getElementById('bank-cal-grid');
  const label = document.getElementById('bank-cal-label');
  const y = bankCalCursor.getFullYear(), m = bankCalCursor.getMonth();
  try{ label.textContent = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {year:'numeric', month:'long'}).format(bankCalCursor); }
  catch(e){ label.textContent = (m+1)+'/'+y; }
  const byDay = bankCalEntriesByDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const startWeekday = new Date(y, m, 1).getDay();
  const todayKeyStr = dayKeyFromDate(new Date());
  let html = '';
  for(let i=0;i<startWeekday;i++) html += '<span class="cal-cell empty"></span>';
  for(let d=1; d<=daysInMonth; d++){
    const dateObj = new Date(y, m, d);
    const key = dayKeyFromDate(dateObj);
    const has = !!byDay[key];
    const isToday = key === todayKeyStr;
    let faDay;
    try{ faDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {day:'numeric'}).format(dateObj); }
    catch(e){ faDay = String(d); }
    html += `<button type="button" class="cal-cell${has?' has-log':''}${isToday?' is-today':''}" data-key="${key}">${faDay}${has?'<i class="cal-dot"></i>':''}</button>`;
  }
  grid.innerHTML = html;
  grid.querySelectorAll('.cal-cell[data-key]').forEach(btn=>{
    btn.addEventListener('click', ()=> showBankCalDay(btn.dataset.key, byDay[btn.dataset.key]||[]));
  });
  document.getElementById('bank-cal-day-detail').innerHTML = '';
}
function showBankCalDay(key, items){
  const detail = document.getElementById('bank-cal-day-detail');
  if(!detail) return;
  if(!items || !items.length){ detail.innerHTML = '<div class="empty-hint" style="padding:10px 0;">چیزی برای این روز ثبت نشده.</div>'; return; }
  const groups = { emotion: [], gratitude: [], shop: [], beliefs: [], dispenza: [], tracking: [], visual: [] };
  items.forEach(function(it){ const kind = it.__kind; if(groups[kind]) groups[kind].push(it); });
  const esc = function(s){ return (s == null ? '' : String(s)).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  let html = '';
  if(groups.emotion.length){
    groups.emotion.forEach(function(em){
      const dayEm = em.data;
      const rows = Object.keys(dayEm).map(function(pk){
        const rec = dayEm[pk];
        const chip = function(id){
          const e = EMOTION_BY_ID[id];
          if(!e) return '';
          return '<span style="display:inline-block;padding:2px 8px;border-radius:12px;background:' + e.color + '22;color:' + e.color + ';border:1px solid ' + e.color + '55;font-size:10.5px;margin:2px 2px 2px 0;">' + e.fa + '</span>';
        };
        const row = function(ids, label){
          if(!ids || !ids.length) return '';
          return '<div style="margin:4px 0;font-size:11.5px;"><b>' + label + ':</b> ' + ids.map(chip).join('') + '</div>';
        };
        return '<div style="padding:6px 0;border-bottom:1px dashed var(--line);"><div style="font-size:11.5px;font-weight:800;margin-bottom:4px;">💗 ' + esc(rec.label || pk) + '</div>' + row(rec.before, 'قبل') + row(rec.after,  'بعد') + '</div>';
      }).join('');
      if(rows) html += '<div class="sh-item" style="margin-bottom:8px;"><div style="font-size:12px;font-weight:800;margin-bottom:6px;">💗 حس‌های قبل و بعد از تمرین</div>' + rows + '</div>';
    });
  }
  if(groups.gratitude.length){
    html += '<div class="sh-item" style="margin-bottom:8px;"><div style="font-size:12px;font-weight:800;margin-bottom:6px;">🙏 شکرگذاری</div>';
    groups.gratitude.forEach(function(g){
      const d = g.data;
      html += '<div style="padding:6px 0;border-bottom:1px dashed var(--line);"><div style="font-size:11px;color:var(--muted);">' + esc(d.time || '') + '</div><div style="font-size:12.5px;color:var(--ink);margin-top:3px;white-space:pre-wrap;">' + (d.icon ? d.icon + ' ' : '') + esc(d.text || '') + '</div>' + (d.amount ? '<div style="font-size:11px;color:var(--emerald-700);margin-top:2px;">' + formatMoney(d.amount) + '</div>' : '') + (d.shared ? '<div style="font-size:10.5px;color:var(--emerald-700);margin-top:2px;">🌍 با دوستان هم‌فرکانسی به اشتراک گذاشته شد</div>' : '') + '</div>';
    });
    html += '</div>';
  }
  if(groups.shop.length){
    html += '<div class="sh-item" style="margin-bottom:8px;"><div style="font-size:12px;font-weight:800;margin-bottom:6px;">🛍️ خریدهای فراوانی</div>';
    groups.shop.forEach(function(h){
      const d = h.data;
      html += '<div style="padding:6px 0;border-bottom:1px dashed var(--line);"><div style="font-size:11px;color:var(--muted);">' + esc(d.time || '') + '</div>';
      (d.items || []).forEach(function(it){
        html += '<div style="font-size:12.5px;color:var(--ink);margin-top:3px;">' + (it.icon || '🛍️') + ' ' + esc(it.name) + ' <span style="color:var(--emerald-700);">— ' + formatMoney(it.qty * it.price) + '</span></div>';
      });
      html += '</div>';
    });
    html += '</div>';
  }
  if(groups.beliefs.length){
    html += '<div class="sh-item" style="margin-bottom:8px;"><div style="font-size:12px;font-weight:800;margin-bottom:6px;">📖 متن آینده</div><div style="font-size:12px;color:var(--ink-soft);">✅ این روز متن آینده‌ات را خواندی</div></div>';
  }
  if(groups.dispenza.length){
    const stepNames = { '1': 'رهاسازی', '2': 'هیچ شدن', '3': 'اتصال', '4': 'انتخاب واقعیت', '5': 'تصویرسازی', '6': 'احساس فراوانی' };
    groups.dispenza.forEach(function(dp){
      const steps = (dp.data && dp.data.steps) || [];
      html += '<div class="sh-item" style="margin-bottom:8px;"><div style="font-size:12px;font-weight:800;margin-bottom:6px;">🌌 پروتکل دیسپنزا</div>';
      if(!steps.length){ html += '<div style="font-size:12px;color:var(--ink-soft);">✨ جلسه‌ی این روز کامل ثبت شد</div>'; }
      else {
        html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
        steps.forEach(function(s){
          html += '<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:rgba(43,191,171,.15);color:var(--emerald-700);font-size:11px;">✓ ' + (stepNames[String(s)] || ('مرحله ' + s)) + '</span>';
        });
        html += '</div>';
      }
      html += '</div>';
    });
  }
  if(groups.tracking.length){
    html += '<div class="sh-item" style="margin-bottom:8px;"><div style="font-size:12px;font-weight:800;margin-bottom:6px;">📡 نشانه‌هایی که دیدی</div>';
    groups.tracking.forEach(function(t){
      html += '<div style="font-size:12.5px;color:var(--ink);padding:5px 0;border-bottom:1px dashed var(--line);white-space:pre-wrap;">🌀 ' + esc(t.data.text || '') + '</div>';
    });
    html += '</div>';
  }
  if(groups.visual.length){
    html += '<div class="sh-item" style="margin-bottom:8px;"><div style="font-size:12px;font-weight:800;margin-bottom:6px;">✨ عکس‌های تصویرسازی</div><div style="display:flex;flex-wrap:wrap;gap:6px;">';
    groups.visual.forEach(function(v){
      html += '<img src="' + v.data.src + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--line);">';
    });
    html += '</div></div>';
  }
  if(!html){ html = '<div class="empty-hint" style="padding:10px 0;">چیزی برای این روز ثبت نشده.</div>'; }
  detail.innerHTML = html;
}

function toggleReminderPanel(){
  var panel = document.getElementById('reminder-panel');
  if (!panel) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
}
document.addEventListener('click', function(e){
  var panel = document.getElementById('reminder-panel');
  var btn = document.getElementById('reminder-icon-btn');
  if (!panel || panel.style.display === 'none') return;
  if (panel.contains(e.target) || (btn && btn.contains(e.target))) return;
  panel.style.display = 'none';
});
function toggleAlarm(){
  if(!state.alarmEnabled){
    if(!('Notification' in window)){ toast('مرورگرت از نوتیفیکیشن پشتیبانی نمی‌کنه'); return; }
    Notification.requestPermission().then(perm=>{
      if(perm==='granted'){
        state.alarmEnabled = true;
        saveState();
        document.getElementById('alarm-switch').classList.add('on');
        toast('یادآوری روزانه فعال شد 🔔');
      }else{ toast('اجازه نوتیفیکیشن داده نشد'); }
    });
  }else{
    state.alarmEnabled = false;
    saveState();
    document.getElementById('alarm-switch').classList.remove('on');
    toast('یادآوری روزانه خاموش شد');
  }
}
function setAlarmTime(val){ state.alarmTime = val; saveState(); }
let lastAlarmFireDate = '';
function checkAlarm(){
  if(!state.alarmEnabled || !state.alarmTime) return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const nowStr = hh+':'+mm;
  const todayStr = todayKey();
  if(nowStr===state.alarmTime && lastAlarmFireDate!==todayStr){
    lastAlarmFireDate = todayStr;
    if('Notification' in window && Notification.permission==='granted'){
      new Notification('یادآوری بازنویسی باور 🧠', { body:'وقتشه پروتکل روزانه‌ات رو انجام بدی: مدیتیشن، تجسم، تکرار باور جدید.' });
    }
  }
}
setInterval(checkAlarm, 20000);

ensureSetup();
renderHome();
updateCartBadge();

(function warmUpAudio(){
  let warmed = false;
  const warm = ()=>{
    if(warmed) return;
    warmed = true;
    resumeAudio();
    document.removeEventListener('touchstart', warm);
    document.removeEventListener('mousedown', warm);
    document.removeEventListener('keydown', warm);
  };
  document.addEventListener('touchstart', warm, {passive:true, once:true});
  document.addEventListener('mousedown',  warm, {once:true});
  document.addEventListener('keydown',    warm, {once:true});
})();

/* ===== حفظ جای اسکرول بعد از ویرایش/تأیید =====
   لیست‌ها با innerHTML دوباره ساخته می‌شوند؛ لحظه‌ای ارتفاع صفحه کم می‌شود و
   مرورگر اسکرول #grat-root را به بالا می‌پراند. این پوشش، جای اسکرول را قبل از
   عملیات می‌خواند و بعدش (و چند بار با تأخیر، برای محتوای دیرتر لود شونده) برمی‌گرداند.
   اگر کاربر در این فاصله خودش لمس/اسکرول کند، دیگر چیزی را برنمی‌گرداند. */
(function(){
  var token = 0;
  function bump(){ token++; }
  ['touchstart','touchmove','wheel','mousedown','keydown'].forEach(function(ev){
    document.addEventListener(ev, bump, {passive:true, capture:true});
  });
  function keepScroll(fn){
    if (typeof fn !== 'function' || fn.__ks) return fn;
    var w = function(){
      var el = document.getElementById('grat-root');
      var top = el ? el.scrollTop : 0, my = token;
      var restore = function(){
        if (my !== token) return;
        var e = document.getElementById('grat-root');
        if (e && top > 0 && Math.abs(e.scrollTop - top) > 1) e.scrollTop = top;
      };
      var after = function(){
        restore();
        if (window.requestAnimationFrame) requestAnimationFrame(restore);
        setTimeout(restore, 80); setTimeout(restore, 300);
      };
      var r;
      try { r = fn.apply(this, arguments); }
      finally { after(); }
      if (r && typeof r.then === 'function') r.then(after, function(){});
      return r;
    };
    w.__ks = true;
    return w;
  }
  window.__keepScroll = keepScroll;
  renderHistory = keepScroll(renderHistory);
  renderHome = keepScroll(renderHome);
  renderShopHistory = keepScroll(renderShopHistory);
  renderPendingList = keepScroll(renderPendingList);
  renderCart = keepScroll(renderCart);
  renderTrackingList = keepScroll(renderTrackingList);
  renderTrackingState = keepScroll(renderTrackingState);
  renderFutureUI = keepScroll(renderFutureUI);
  renderVisualGallery = keepScroll(renderVisualGallery);
  renderMeditationAudio = keepScroll(renderMeditationAudio);
  saveGratEdit = keepScroll(saveGratEdit);
  deleteGratEntry = keepScroll(deleteGratEntry);
  addTrackingItem = keepScroll(addTrackingItem);
})();
