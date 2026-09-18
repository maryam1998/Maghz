/* =====================================================================
   مسیر عصبی (Neural Pathway) — موتور کامل ویجت رشد عادت
   نسخه‌ی حرفه‌ای: دو نورون (رفتار/عادت) + رشته‌های نازک بینشون،
   با رنگ و ضخامتِ پویا بر اساس کیفیت احساس امروز.
   هر دو نورون با تکرار رشد می‌کنند — طبق قانون هب.
   ===================================================================== */

(function injectNeuralPathwayStyles(){
  var css = `
.neural-card{margin:0 0 4px; background:var(--surface, var(--panel-bg)); border-radius:16px; padding:14px 14px 12px; border:1px solid var(--line, var(--panel-border));}
#grat-root .neural-card{margin:0 18px 4px;}
.neural-card .np-fiber{transition:stroke-dashoffset .7s ease, opacity .4s ease, stroke .5s ease;}
.neural-card .np-node-label{font-family:'Vazirmatn',Tahoma,sans-serif;}
.neural-card .np-node{transition:fill .6s ease, stroke .6s ease, stroke-width .4s ease;}
.neural-card .np-node-text{transition:fill .6s ease;}
.neural-card .np-stats-grid{display:flex; gap:10px; margin-top:12px;}
.neural-card .np-stat-box{flex:1; background:var(--surface-2, var(--input-bg)); border-radius:14px; padding:10px 8px; text-align:center;}
.neural-card .np-stat-label{font-size:11.5px; color:var(--muted, var(--text-dim)); margin-bottom:4px;}
.neural-card .np-stat-value{font-size:18px; font-weight:800; color:var(--ink, var(--text-main));}
.neural-card .np-status{font-size:12.5px; color:var(--ink-soft, var(--text-main)); margin-top:10px; text-align:center; line-height:1.6;}
.neural-card .np-habit-btn{width:100%;}

/* پالس آرام برای نورون بالغ (وقتی عادت جاافتاده) */
@keyframes npPulseLock{
  0%,100%{ transform:scale(1); opacity:.9; }
  50%    { transform:scale(1.08); opacity:1; }
}
.neural-card .np-node-glow{
  transform-origin:center;
  transform-box:fill-box;
  animation:npPulseLock 3s ease-in-out infinite;
}

/* ---- HUD علمی زیر هر هدف (روی نقشه‌ی اصلی) ---- */
.goal-hud{
  font-family:'Vazirmatn',Tahoma,sans-serif;
  font-size:9.5px;
  fill:var(--text-dim);
  paint-order:stroke;
  stroke:#0a0c18;
  stroke-width:2.5px;
  pointer-events:none;
  letter-spacing:.2px;
}
html[data-theme="light"] .goal-hud{ stroke:#f4f6fb; }

/* ---- خط آکسون روی نقشه‌ی اصلی (پایه) ---- */
.axon-core{ opacity:.42; }
.axon-myelin{ opacity:.9; }

/* ---- بوتون سیناپسی روی نقشه‌ی اصلی ---- */
.synaptic-bouton{
  filter:drop-shadow(0 0 3px currentColor);
}

/* ---- حالت هرس (شاخه‌ی غیرفعال) روی نقشه‌ی اصلی ---- */
.pruned-twig{ opacity:.28; }
.pruned-twig text{ opacity:.5; }
`;
  var styleTag = document.createElement('style');
  styleTag.id = 'neural-pathway-styles';
  styleTag.textContent = css;
  document.head.appendChild(styleTag);
})();

/* ---------------- توابع کمکی پایه ----------------
   هر روز دقیقاً یکی از این سه حالته:
     true  = انجام شد        (دستی با دکمه، یا خودکار وقتی خودِ اقدام مربوطه ثبت بشه)
     false = انجام نشد       (دستی با دکمه‌ی «یک روز گذشت، انجام ندادم»، یا خودکار)
     نامشخص = روزی که هنوز نگذشته
   «رشته‌های ساخته‌شده» = (تعداد روزهای انجام‌شده − تعداد روزهای انجام‌نشده)،
   هیچ سقفی نداره، فقط منفی نمی‌شه. */
function ndKeyToDate(key){ const p=String(key).split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
function ndKeyNext(key){ const d=ndKeyToDate(key); d.setDate(d.getDate()+1); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
const NEURAL_ONE_HOUR_MS = 60*60*1000;

function neuralEnsureContainer(container){
  if(!container.logs || typeof container.logs !== 'object') container.logs = {};
  if(!container.pendingManual || typeof container.pendingManual !== 'object') container.pendingManual = {};
  return container;
}

/* وقتی یک مسیر عصبی به یک تقویم واقعی وصله (calendarLinked)، اگه کاربر با دکمه‌ی
   «امروز انجام دادم» یک روز رو دستی ثبت کنه ولی خودِ تقویم هنوز برای همون روز
   چیزی واقعی نداشته باشه، احتمالاً اشتباهی زده. یک ساعت بهش فرصت می‌دیم تا با
   ثبت واقعی توی تقویم تایید بشه؛ اگه نشد، خودکار پاکش می‌کنیم. */
function neuralCleanupPending(container, opts){
  neuralEnsureContainer(container);
  if(!opts || !opts.calendarLinked) return false;
  let changed = false;
  Object.keys(container.pendingManual).forEach(function(key){
    const entry = container.pendingManual[key];
    const isObj = entry && typeof entry === 'object';
    const ts = isObj ? entry.ts : entry;
    const dayKey = isObj ? entry.dayKey : key;
    if(Date.now() - ts < NEURAL_ONE_HOUR_MS) return;
    const confirmed = typeof opts.isConfirmed === 'function' && opts.isConfirmed(dayKey);
    if(confirmed){
      delete container.pendingManual[key];
    }else{
      if(container.logs[key] === true) delete container.logs[key];
      delete container.pendingManual[key];
      changed = true;
    }
  });
  return changed;
}

function neuralFiberCount(logs){
  let n = 0;
  Object.keys(logs||{}).forEach(function(k){ if(logs[k]===true) n++; else if(logs[k]===false) n--; });
  return Math.max(0, n);
}

/* کلید یکتا برای هر رشته‌ی دستی — چون هر کلیک (نامحدود در روز) باید رشته‌ی
   جدای خودش رو بسازه/کم کنه، نه اینکه فقط یک بار در روز قابل ثبت باشه. */
function neuralFiberKey(){ return 'f'+Date.now()+'-'+Math.random().toString(36).slice(2,8); }

/* «امروز انجام دادم»: نامحدود، وابسته به تقویم نیست — هر بار کلیک دقیقاً یک
   رشته‌ی جدید اضافه می‌کنه. */
function neuralAddFiber(container, opts){
  neuralEnsureContainer(container);
  const key = neuralFiberKey();
  container.logs[key] = true;
  if(opts && opts.calendarLinked){
    container.pendingManual[key] = { ts: Date.now(), dayKey: todayKey() };
  }
  return key;
}

/* «یک روز گذشت، انجام ندادم»: هر کلیک دقیقاً یک رشته کم می‌کنه. */
function neuralRemoveFiber(container){
  neuralEnsureContainer(container);
  const key = neuralFiberKey();
  container.logs[key] = false;
  return key;
}

/* نسخه‌ی «خودکار» neuralAddFiber — وقتی خودِ اقدام (مثلاً ثبت شکرگذاری،
   تکمیل مدیتیشن دیسپنزا، یا خوندن روزانه‌ی متن باور) یک رشته‌ی جدید می‌سازه،
   بدون این‌که کاربر دکمه‌ی «امروز انجام دادم» رو جدا بزنه.
   تشخیص «یک‌بار در روز/هر بار» به عهده‌ی خودِ صدازننده‌ست؛ این تابع فقط
   دقیقاً یک رشته اضافه می‌کنه. */
function neuralAutoAddFiber(container, opts){
  return neuralAddFiber(container, opts);
}

/* روزهایی که گذشتن ولی نه دستی ثبت شدن نه خودکار، رو همین‌جا به‌عنوان
   «انجام نشد» علامت می‌زنه — تشخیص خودکار واقعی هر بار که کاربر برنامه رو باز کنه. */
function neuralAutoSync(container){
  neuralEnsureContainer(container);
  const yesterday = dayKeyOffset(-1);
  if(!container.lastSyncKey){ container.lastSyncKey = yesterday; return false; }
  if(container.lastSyncKey === yesterday) return false;
  let cursor = container.lastSyncKey, changed = false, guard = 0;
  while(cursor !== yesterday && guard < 3650){
    cursor = ndKeyNext(cursor);
    guard++;
    if(!(cursor in container.logs)){ container.logs[cursor] = false; changed = true; }
  }
  container.lastSyncKey = yesterday;
  return changed;
}

/* یک روز رو دستی انجام‌شده/انجام‌نشده می‌کنه؛ زدن دوباره‌ی همون دکمه، ثبت اون روز رو پاک می‌کنه. */
function neuralMarkDay(container, key, done){
  neuralEnsureContainer(container);
  if(container.logs[key] === done) delete container.logs[key];
  else container.logs[key] = done;
}

/* حداکثری که هم برای شمارش «از حداکثر …» و هم برای سقفِ ترسیم بصریِ رشته‌ها
   استفاده می‌شه. */
const NEURAL_FIBER_CAP = 10;

/* =====================================================================
   تعریف «تیِر» رشد برای هر نورون
   ---------------------------------------------------------------------
   هر نورون، با تکرار، از یه تیِر به تیِر بالاتر می‌ره. طبق قانون هب،
   هر دو نورون (رفتار و عادت) رشد می‌کنن — ولی با یه تفاوت:
     • نورون رفتار: با تعداد تکرارها، ظرفیت و آمادگیش بیشتر می‌شه.
     • نورون عادت: علاوه بر تکرار، وقتی «قفل» شد (habitFormed)، به بالاترین تیِر می‌رسه.
   ===================================================================== */
function neuralTier(fiberCount, habitFormed){
  if(habitFormed) return 3;
  if(fiberCount <= 0) return 0;
  if(fiberCount >= NEURAL_FIBER_CAP) return 3;
  if(fiberCount >= Math.ceil(NEURAL_FIBER_CAP/2)) return 2;
  return 1;
}

/* رنگ و ظاهر هر تیِر — مشترک بین دو نورون */
function neuralTierStyle(tier, isHabitNode){
  // رنگ‌های پایه
  var base = {
    fill:   'var(--input-bg)',
    stroke: 'var(--panel-border)',
    text:   'var(--muted)',
    char:   '○',
    glow:   false
  };
  if(tier === 1){
    return {
      fill:   'rgba(84,201,184,.10)',
      stroke: 'rgba(84,201,184,.55)',
      text:   'var(--emerald-300, #54c9b8)',
      char:   '◔',
      glow:   false
    };
  }
  if(tier === 2){
    return {
      fill:   'rgba(43,191,171,.18)',
      stroke: 'var(--emerald-300, #54c9b8)',
      text:   'var(--emerald-500, #2bbfab)',
      char:   '◐',
      glow:   false
    };
  }
  if(tier === 3){
    // تیِر بالا: اگه نورون عادت باشه، پالس می‌گیره
    return {
      fill:   'rgba(43,191,171,.28)',
      stroke: 'var(--emerald-500, #2bbfab)',
      text:   'var(--emerald-700, #0f5b53)',
      char:   isHabitNode ? '◉' : '◕',
      glow:   isHabitNode
    };
  }
  return base;
}

/* =====================================================================
   تابع اصلی رندر مسیر عصبی — نسخه‌ی حرفه‌ای
   ===================================================================== */
function renderNeuralPathway(mountId, container, opts){
  opts = opts || {};
  const label = opts.label || '';
  const mount = document.getElementById(mountId);
  if(!mount) return;
  neuralEnsureContainer(container);
  const changed = neuralAutoSync(container);
  const cleaned = neuralCleanupPending(container, opts);
  if((changed || cleaned) && typeof opts.onChange === 'function') opts.onChange();

  const fiberCount = neuralFiberCount(container.logs);
  const habitFormed = !!container.habitFormed;

  // ---- کیفیت احساس امروز — برای رنگ و ضخامت رشته‌ها ----
  let quality = null;
  if(opts.practiceKey && typeof getTodayEmotionQualityFor === 'function'){
    try{ quality = getTodayEmotionQualityFor(opts.practiceKey); }catch(e){}
  }
  const warm = quality !== null && quality >= 500;
  const weak = quality !== null && quality < 200;
  const fiberColor = warm ? 'var(--emerald-500,#2bbfab)'
                     : weak ? 'var(--gold-500,#c9a24b)'
                     : 'var(--accent)';
  const fiberOpacity = warm ? 0.78 : weak ? 0.32 : 0.55;
  const fiberWidth   = warm ? 1.6  : weak ? 0.8  : 1;

  // ---- رشته‌ها — به تعداد واقعی، با فاصله‌ی چرخشی از هم ----
  const drawnFibers = fiberCount;
  const SPREAD_CYCLE = 9;
  let fibersSvg = '';
  for(let i=0;i<drawnFibers;i++){
    const pairIdx = Math.floor(i/2) % SPREAD_CYCLE;
    const mag = 3 + 6*pairIdx;
    const off = (i%2===0 ? -1 : 1) * mag;
    const sY = 90+off*0.4, mY = 90+off, eY = 90+off*0.4;
    fibersSvg += '<path class="np-fiber" d="M71 '+sY+' Q190 '+mY+' 309 '+eY+'" fill="none" stroke="'+fiberColor+'" stroke-width="'+fiberWidth+'" stroke-linecap="round" opacity="'+fiberOpacity+'"/>';
  }

  // ---- تیِرهای رشد دو نورون ----
  // نورون رفتار: فقط با تکرار رشد می‌کنه
  const behaviorTier = neuralTier(fiberCount, false);
  const behaviorStyle = neuralTierStyle(behaviorTier, false);

  // نورون عادت: با تکرار + قفل شدن کامل می‌شه
  const habitTier = neuralTier(fiberCount, habitFormed);
  const habitStyle = neuralTierStyle(habitTier, true);

  // ---- وضعیت کلامی ----
  let status;
  if(habitFormed)        status = '🎉 این عادت کاملاً جاافتاده — یک مدار عصبی واقعی.';
  else if(fiberCount<=0) status = 'هنوز مداری برای «'+label+'» شکل نگرفته — امروز اولین قدم را بردار.';
  else if(fiberCount < 3) status = 'اولین رشته‌های «'+label+'» شکل گرفته — ادامه بده.';
  else if(fiberCount < NEURAL_FIBER_CAP) status = 'رشته‌های «'+label+'» دارن کنار هم جمع و ضخیم می‌شن.';
  else                   status = '«'+label+'» یک مسیر محکم شده — اگر واقعاً عادت شده، قفلش کن.';

  // ---- بج کیفیت احساس امروز ----
  let qualityBadge = '';
  if(quality !== null){
    const badgeColor = warm ? '#2bbfab' : weak ? '#c9a24b' : '#5ec8f0';
    const badgeText = warm ? '🔥 حس پرقدرت امروز — رشته‌ها ضخیم‌تر شدن'
                    : weak ? '⚠️ حس امروز ضعیف بود — دفعه‌ی بعد عمیق‌تر'
                    : '✓ حس امروز ثبت شد';
    qualityBadge = '<div style="margin-top:8px;padding:7px 10px;background:'+badgeColor+'15;border:1px solid '+badgeColor+'40;border-radius:10px;font-size:11px;color:'+badgeColor+';text-align:center;font-weight:700;">'+badgeText+'</div>';
  }

  // ---- دکمه‌ها ----
  const showDayBtns = opts.showDayButtons !== false;
  const dayBtnsHtml = showDayBtns ?
    ('<div class="np-day-btns" style="display:flex;gap:8px;margin-top:8px;">'+
      '<button type="button" class="btn tiny np-day-yes" style="flex:1;">✨ امروز انجام دادم</button>'+
      '<button type="button" class="btn tiny np-day-no" style="flex:1;">یک روز گذشت، انجام ندادم</button>'+
    '</div>') : '';
  const showHabitBtn = fiberCount>0 || habitFormed;
  const habitBtnHtml = showHabitBtn ?
    ('<button type="button" class="btn tiny np-habit-btn" style="margin-top:8px;">'+
      (habitFormed ? '↩️ هنوز کافی نیست، ادامه بده' : '✅ همین‌ست، این عادت جاافتاد')+
    '</button>') : '';

  // ---- HTML نهایی ----
  // نکته: اگه نورون عادت در تیِر ۳ باشه (قفل شده)، بهش پالس می‌دیم (class np-node-glow)
  const habitNodeGlowClass = habitStyle.glow ? ' class="np-node np-node-glow"' : ' class="np-node"';

  mount.innerHTML =
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'+
      '<span style="font-size:12.5px;font-weight:800;color:var(--ink)">🧠 '+label+'</span>'+
      '<span style="font-size:11px;color:var(--muted)">'+fiberCount.toLocaleString('fa-IR')+' رشته</span>'+
    '</div>'+
    '<svg width="100%" viewBox="0 0 380 175" role="img" style="display:block;overflow:visible;">'+
      '<title>مسیر عصبی '+label+'</title>'+
      '<g>'+fibersSvg+'</g>'+

      /* ─── نورون رفتار (پیش‌سیناپسی) ─── */
      '<circle class="np-node" cx="55" cy="90" r="15" '+
        'fill="'+behaviorStyle.fill+'" '+
        'stroke="'+behaviorStyle.stroke+'" '+
        'stroke-width="1.5"/>'+
      '<text class="np-node-text" x="55" y="94" text-anchor="middle" font-size="10" '+
        'fill="'+behaviorStyle.text+'">'+behaviorStyle.char+'</text>'+

      /* ─── نورون عادت (پس‌سیناپسی) ─── */
      '<circle'+habitNodeGlowClass+' cx="325" cy="90" r="15" '+
        'fill="'+habitStyle.fill+'" '+
        'stroke="'+habitStyle.stroke+'" '+
        'stroke-width="1.5"/>'+
      '<text class="np-node-text" x="325" y="94" text-anchor="middle" font-size="10" '+
        'fill="'+habitStyle.text+'">'+habitStyle.char+'</text>'+

      /* ─── برچسب‌ها ─── */
      '<text class="np-node-label" x="55" y="128" text-anchor="middle" font-size="12" fill="var(--text-dim)">رفتار</text>'+
      '<text class="np-node-label" x="325" y="128" text-anchor="middle" font-size="12" fill="var(--text-dim)">عادت</text>'+
    '</svg>'+
    '<div class="np-status">'+status+'</div>'+
    qualityBadge +
    dayBtnsHtml +
    habitBtnHtml;

  // ---- رویدادها ----
  const rerender = function(){ renderNeuralPathway(mountId, container, opts); };

  if(showDayBtns){
    const yesBtn = mount.querySelector('.np-day-yes');
    const noBtn  = mount.querySelector('.np-day-no');
    if(yesBtn) yesBtn.addEventListener('click', function(){
      neuralAddFiber(container, opts);
      if(typeof opts.onChange === 'function') opts.onChange();
      rerender();
    });
    if(noBtn) noBtn.addEventListener('click', function(){
      neuralRemoveFiber(container);
      if(typeof opts.onChange === 'function') opts.onChange();
      rerender();
    });
  }
  if(showHabitBtn){
    const hb = mount.querySelector('.np-habit-btn');
    if(hb) hb.addEventListener('click', function(){
      container.habitFormed = !habitFormed;
      if(typeof opts.onChange === 'function') opts.onChange();
      rerender();
    });
  }
}

/* ---------------- نشانگر کوچک «مسیر عصبی» روی نقشه‌ی اصلی ----------------
   یک تیک کوچیک کنار نقطه‌ی شاخه/زیرشاخه، فقط وقتی «این مسیر عصبی روی
   نقشه‌ی اصلی نشان داده شود» تیک خورده باشه. */
function neuralIndicatorSVG(action, goalId, nodeX, nodeY, handleR, color){
  const nn = (action.neural && typeof action.neural === 'object') ? action.neural : null;
  const fiberCount = (nn && typeof neuralFiberCount === 'function') ? neuralFiberCount(nn.logs) : 0;
  const habitFormed = !!(nn && nn.habitFormed);
  const built = habitFormed || fiberCount > 0;
  const cx = nodeX + handleR * 0.72;
  const cy = nodeY - handleR * 0.72;
  let html = '<g class="neural-indicator-widget">';
  html += '<circle data-hit="action" data-goalid="'+goalId+'" data-id="'+action.id+'" cx="'+cx+'" cy="'+cy+'" r="10" fill="'+(built ? color : 'var(--input-bg, #12142a)')+'" stroke="'+color+'" stroke-width="1.6" style="cursor:pointer;pointer-events:all;"/>';
  html += '<text data-hit="action" data-goalid="'+goalId+'" data-id="'+action.id+'" x="'+cx+'" y="'+(cy+3.5)+'" text-anchor="middle" font-size="11" fill="'+(built ? '#12142a' : color)+'" style="pointer-events:none;">🧬</text>';
  html += '</g>';
  return html;
}
