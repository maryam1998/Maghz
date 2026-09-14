/* =====================================================================
   مسیر عصبی (Neural Pathway) — موتور کامل ویجت رشد عادت
   نسخه‌ی ساده: دو نورون (رفتار/عادت) + رشته‌های نازک بینشون، بدون
   مرحله‌بندی میلین یا آکسون ضخیم‌شونده — دقیقاً مطابق طرحی که قبلاً
   در نسخه‌ی گیت‌هاب پیاده بود.
   نکته: این فایل باید بعد از تعریف `state`, `todayKey`, `dayKeyOffset`
   در index.html لود شود.
   ===================================================================== */

(function injectNeuralPathwayStyles(){
  var css = `
.neural-card{margin:0 0 4px; background:var(--surface, var(--panel-bg)); border-radius:16px; padding:14px 14px 12px; border:1px solid var(--line, var(--panel-border));}
#grat-root .neural-card{margin:0 18px 4px;}
.neural-card .np-fiber{transition:stroke-dashoffset .7s ease, opacity .4s ease;}
.neural-card .np-node-label{font-family:'Vazirmatn',Tahoma,sans-serif;}
.neural-card .np-stats-grid{display:flex; gap:10px; margin-top:12px;}
.neural-card .np-stat-box{flex:1; background:var(--surface-2, var(--input-bg)); border-radius:14px; padding:10px 8px; text-align:center;}
.neural-card .np-stat-label{font-size:11.5px; color:var(--muted, var(--text-dim)); margin-bottom:4px;}
.neural-card .np-stat-value{font-size:18px; font-weight:800; color:var(--ink, var(--text-main));}
.neural-card .np-status{font-size:12.5px; color:var(--ink-soft, var(--text-main)); margin-top:10px; text-align:center; line-height:1.6;}
.neural-card .np-habit-btn{width:100%;}

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

/* ---------------- مسیرهای عصبی: رشته‌های نازک بین دو نورون «رفتار» و «عادت» ----------------
   هر روز دقیقاً یکی از این سه حالته:
     true  = انجام شد        (دستی با دکمه، یا خودکار وقتی خودِ اقدام مربوطه ثبت بشه — مثلاً نوشتن شکرگذاری)
     false = انجام نشد       (دستی با دکمه‌ی «یک روز گذشت، انجام ندادم»، یا خودکار وقتی یک روز
                               بدون هیچ ثبتی بگذره و نرم‌افزار خودش موقع باز شدن تشخیص بده)
     نامشخص = روزی که هنوز نگذشته
   «رشته‌های ساخته‌شده» = (تعداد روزهای انجام‌شده − تعداد روزهای انجام‌نشده)، هیچ سقفی نداره،
   فقط منفی نمی‌شه. هر روز موفق یک رشته اضافه می‌کنه، هر روز ناموفق یکی کم می‌کنه. */
function ndKeyToDate(key){ const p=String(key).split('-').map(Number); return new Date(p[0], p[1]-1, p[2]); }
function ndKeyNext(key){ const d=ndKeyToDate(key); d.setDate(d.getDate()+1); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
const NEURAL_ONE_HOUR_MS = 60*60*1000;
function neuralEnsureContainer(container){
  if(!container.logs || typeof container.logs !== 'object') container.logs = {};
  if(!container.pendingManual || typeof container.pendingManual !== 'object') container.pendingManual = {};
  return container;
}
// وقتی یک مسیر عصبی به یک تقویم واقعی وصله (calendarLinked)، اگه کاربر با دکمه‌ی
// «امروز انجام دادم» یک روز رو دستی ثبت کنه ولی خودِ تقویم هنوز برای همون روز
// چیزی واقعی نداشته باشه، احتمالاً اشتباهی زده. یک ساعت بهش فرصت می‌دیم تا با
// ثبت واقعی توی تقویم تایید بشه؛ اگه نشد، خودکار پاکش می‌کنیم تا دوباره منتظر
// روز بعد (یا ثبت واقعی) بمونه. مسیرهای کاملاً دستی (مثل شکرگذاری/باور/ردیابی)
// اصلاً درگیر این محدودیت نمی‌شن و همیشه باز می‌مونن.
function neuralCleanupPending(container, opts){
  neuralEnsureContainer(container);
  if(!opts || !opts.calendarLinked) return false;
  let changed = false;
  Object.keys(container.pendingManual).forEach(function(key){
    const entry = container.pendingManual[key];
    // فرمت قدیمی: pendingManual[dayKey] = timestamp عددی، و خودِ key همون dayKey بود.
    // فرمت جدید: pendingManual[fiberKey] = {ts, dayKey}، چون هر کلیک یک رشته‌ی
    // جدا و مستقل می‌سازه (نه فقط یکی در روز)، پس هر رشته باید مهلت یک‌ساعته‌ی خودش رو داشته باشه.
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
// کلید یکتا برای هر رشته‌ی دستی — چون حالا هر کلیک (نامحدود در روز) باید رشته‌ی
// جدای خودش رو بسازه/کم کنه، نه اینکه فقط یک بار در روز قابل ثبت باشه.
function neuralFiberKey(){ return 'f'+Date.now()+'-'+Math.random().toString(36).slice(2,8); }
// «امروز انجام دادم»: نامحدود، وابسته به تقویم نیست — هر بار کلیک دقیقاً یک
// رشته‌ی جدید اضافه می‌کنه. اگه این مسیر عصبی به تقویم واقعی وصل باشه
// (calendarLinked)، این رشته «در انتظار تایید» می‌مونه و اگه تا یک ساعت دیگه
// با یک ثبت واقعی توی تقویم تایید نشه، خودکار حذف می‌شه.
function neuralAddFiber(container, opts){
  neuralEnsureContainer(container);
  const key = neuralFiberKey();
  container.logs[key] = true;
  if(opts && opts.calendarLinked){
    container.pendingManual[key] = { ts: Date.now(), dayKey: todayKey() };
  }
  return key;
}
// «یک روز گذشت، انجام ندادم»: این هم نامحدوده — هر کلیک دقیقاً یک رشته کم می‌کنه.
function neuralRemoveFiber(container){
  neuralEnsureContainer(container);
  const key = neuralFiberKey();
  container.logs[key] = false;
  return key;
}
// ثبت خودکارِ یک رشته وقتی خودِ اقدام مربوطه انجام می‌شه (مثلاً نوشتن یک
// شکرگذاری، ثبت متن باور، یا پایان مدیتیشن دیسپنزا) — بدون نیاز به کلیک روی
// دکمه‌ی «امروز انجام دادم». این‌ها هیچ‌وقت calendarLinked نیستن، برای همین
// مستقیم و بدون «در انتظار تایید» ثبت می‌شن.
function neuralAutoAddFiber(container){
  neuralEnsureContainer(container);
  return neuralAddFiber(container);
}
// روزهایی که گذشتن ولی نه دستی ثبت شدن نه خودکار، رو همینجا به‌عنوان
// «انجام نشد» علامت می‌زنه — اینجا تشخیص خودکار واقعی اتفاق می‌افته
// (هر بار که کاربر برنامه رو باز می‌کنه و به این مسیر عصبی می‌رسه).
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
// یک روز رو دستی انجام‌شده/انجام‌نشده می‌کنه؛ زدن دوباره‌ی همون دکمه، ثبت اون روز رو پاک می‌کنه.
function neuralMarkDay(container, key, done){
  neuralEnsureContainer(container);
  if(container.logs[key] === done) delete container.logs[key];
  else container.logs[key] = done;
}

// حداکثری که هم برای شمارش «از حداکثر …» و هم برای سقفِ ترسیم بصریِ رشته‌ها
// استفاده می‌شه (رشته‌های واقعی می‌تونن بیشتر از این باشن، ولی نمایش و درصد
// روی همین سقف حساب می‌شه — دقیقاً مطابق طرح).
const NEURAL_FIBER_CAP = 10;
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
  // رشته‌ها دیگه به ۱۰ تا محدود نمی‌شن — دقیقاً به تعداد واقعی رشته‌های ساخته‌شده
  // رسم می‌شن (نامحدود)؛ فقط برای اینکه با تعداد زیاد از کادر بیرون نزنن، فاصله‌ی
  // پخش‌شدنشون از یه حدی به بعد دوباره از اول تکرار می‌شه (چرخشی)، و چون تعدادشون
  // زیاد می‌شه، نازک‌تر و کم‌رنگ‌تر رسم می‌شن تا روی هم انباشته بشن (حس ضخیم‌ترشدنِ
  // مسیر عصبی رو بدن) نه اینکه از کادر بزنن بیرون.
  const drawnFibers = fiberCount;
  const SPREAD_CYCLE = 9;
  let fibersSvg = '';
  for(let i=0;i<drawnFibers;i++){
    const pairIdx = Math.floor(i/2) % SPREAD_CYCLE;
    const mag = 3+6*pairIdx;
    const off = (i%2===0 ? -1 : 1) * mag;
    const sY = 90+off*0.4, mY = 90+off, eY = 90+off*0.4;
    fibersSvg += '<path class="np-fiber" d="M71 '+sY+' Q190 '+mY+' 309 '+eY+'" fill="none" stroke="var(--accent)" stroke-width="1" stroke-linecap="round" opacity="0.55"/>';
  }
  const nodeStrong = habitFormed || fiberCount>=NEURAL_FIBER_CAP;
  const nodeMid = habitFormed || fiberCount>=Math.ceil(NEURAL_FIBER_CAP/3);
  const nodeFill = nodeStrong ? 'var(--emerald-100, #dcf3ee)' : 'var(--input-bg)';
  const nodeStroke = nodeMid ? 'var(--emerald-500, #2bbfab)' : 'var(--panel-border)';
  let status;
  if(habitFormed) status = 'این عادت کاملا جاافتاده، یک رشته عصبی واقعی 🎉';
  else if(fiberCount<=0) status = 'هنوز مسیر عصبی‌ای برای «'+label+'» شکل نگرفته — همین امروز انجامش بده.';
  else if(!nodeMid) status = 'اولین رشته‌های عصبی «'+label+'» شکل گرفتن، ادامه بده.';
  else if(!nodeStrong) status = 'رشته‌های «'+label+'» دارن کنار هم جمع و ضخیم می‌شن.';
  else status = '«'+label+'» یک مسیر عصبی محکم و جاافتاده شده — اگه حس می‌کنی واقعا عادت شده، می‌تونی قفلش کنی.';
  const showDayBtns = opts.showDayButtons !== false;
  // این دو دکمه دیگه به تقویم/تاریخ وابسته نیستن و هیچ سقفی ندارن: کاربر
  // می‌تونه هرچندبار که بخواد کلیک کنه، هر کلیک دقیقاً یک رشته اضافه/کم می‌کنه.
  const dayBtnsHtml = showDayBtns ?
    ('<div class="np-day-btns" style="display:flex;gap:8px;margin-top:8px;">'+
      '<button type="button" class="btn tiny np-day-yes" style="flex:1;">✨ امروز انجام دادم</button>'+
      '<button type="button" class="btn tiny np-day-no" style="flex:1;">یک روز گذشت، انجام ندادم</button>'+
    '</div>') : '';
  const showHabitBtn = fiberCount>0 || habitFormed;
  const habitBtnHtml = showHabitBtn ?
    ('<button type="button" class="btn tiny np-habit-btn" style="margin-top:8px;">'+
      (habitFormed ? '↩️ هنوز کافی نیست، ادامه بده' : '✅ همینه، این عادت جاافتاد')+
    '</button>') : '';
  mount.innerHTML =
    '<svg width="100%" viewBox="0 0 380 175" role="img" style="display:block;overflow:visible;">'+
      '<title>مسیر عصبی '+label+'</title>'+
      '<g>'+fibersSvg+'</g>'+
      '<circle cx="55" cy="90" r="15" fill="var(--input-bg)" stroke="var(--panel-border)" stroke-width="1"/>'+
      '<circle cx="325" cy="90" r="15" fill="'+nodeFill+'" stroke="'+nodeStroke+'" stroke-width="1.5"/>'+
      '<text class="np-node-label" x="55" y="128" text-anchor="middle" font-size="12" fill="var(--text-dim)">رفتار</text>'+
      '<text class="np-node-label" x="325" y="128" text-anchor="middle" font-size="12" fill="var(--text-dim)">عادت</text>'+
    '</svg>'+
    '<div class="np-stats-grid">'+
      '<div class="np-stat-box"><div class="np-stat-label">رشته‌های ساخته‌شده</div><div class="np-stat-value">'+fiberCount.toLocaleString('fa-IR')+'</div></div>'+
    '</div>'+
    '<div class="np-status">'+status+'</div>'+
    dayBtnsHtml +
    habitBtnHtml;
  const rerender = function(){ renderNeuralPathway(mountId, container, opts); };
  if(showDayBtns){
    mount.querySelector('.np-day-yes').addEventListener('click', function(){
      neuralAddFiber(container, opts);
      if(typeof opts.onChange === 'function') opts.onChange();
      rerender();
    });
    mount.querySelector('.np-day-no').addEventListener('click', function(){
      neuralRemoveFiber(container);
      if(typeof opts.onChange === 'function') opts.onChange();
      rerender();
    });
  }
  if(showHabitBtn){
    mount.querySelector('.np-habit-btn').addEventListener('click', function(){
      container.habitFormed = !habitFormed;
      if(typeof opts.onChange === 'function') opts.onChange();
      rerender();
    });
  }
}

/* ---------------- نشانگر کوچک «مسیر عصبی» روی نقشه‌ی اصلی ----------------
   یک تیک کوچیک کنار نقطه‌ی شاخه/زیرشاخه، فقط وقتی «این مسیر عصبی روی
   نقشه‌ی اصلی نشان داده شود» تیک خورده باشه. اگه رشته‌ای ساخته شده باشه یا
   عادت جاافتاده باشه، پر و با ✓ نشون داده می‌شه؛ با لمس/کلیک، پنل ویرایش
   شاخه (که شامل کارت کامل مسیر عصبیه) باز می‌شه. */
function neuralIndicatorSVG(action, goalId, nodeX, nodeY, handleR, color){
  const nn = (action.neural && typeof action.neural === 'object') ? action.neural : null;
  const fiberCount = (nn && typeof neuralFiberCount === 'function') ? neuralFiberCount(nn.logs) : 0;
  const habitFormed = !!(nn && nn.habitFormed);
  const built = habitFormed || fiberCount > 0;
  const cx = nodeX + handleR * 0.72;
  const cy = nodeY - handleR * 0.72;
  let html = `<g class="neural-indicator-widget">`;
  html += `<circle data-hit="action" data-goalid="${goalId}" data-id="${action.id}" cx="${cx}" cy="${cy}" r="10" fill="${built ? color : 'var(--input-bg, #12142a)'}" stroke="${color}" stroke-width="1.6" style="cursor:pointer;pointer-events:all;"/>`;
  html += `<text data-hit="action" data-goalid="${goalId}" data-id="${action.id}" x="${cx}" y="${cy+3.5}" text-anchor="middle" font-size="11" fill="${built ? '#12142a' : color}" style="pointer-events:none;">🧬</text>`;
  html += `</g>`;
  return html;
}
