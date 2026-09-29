/* =====================================================================
   back-nav-fix.js
   دکمه‌ی برگشت (یا حرکت برگشت گوشی) باید فقط از همون قسمتی که توش
   هستیم بیرون بیاد (مثلاً از آلبوم تصاویر، فرم ویرایش، یا از یک
   تب به تب اصلی)، نه این‌که کل نرم‌افزار رو ببنده.

   نحوه‌ی کار: قبل از این‌که کاربر کاری بکنه، یک «پله»ی اضافه توی
   تاریخچه‌ی مرورگر می‌ذاریم (history.pushState). با هر بار برگشت،
   به‌جای این‌که واقعاً از صفحه خارج بشیم، همون پله برداشته می‌شه و ما
   با popstate می‌فهمیم. اونجا خودمون تصمیم می‌گیریم: اگه چیزی باز
   بود (آلبوم، پنجره‌ی برش، فرم و…) فقط همون بسته بشه؛ اگه تب فعلی
   خانه نبود، بریم خانه؛ فقط وقتی هیچ‌کدوم از این‌ها نبود، برگشت
   واقعی (خروج) اتفاق می‌افته.
   ===================================================================== */
(function(){
  'use strict';

  function isVisible(el){
    if (!el) return false;
    if (el.style && el.style.display === 'none') return false;
    var cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }
  function hasClass(el, c){ return !!el && el.classList.contains(c); }

  /* ترتیب مهمه: چیزی که روی بقیه باز می‌شه (مثل برش، روی آلبوم) باید اول چک بشه */
  var OVERLAYS = [
    { id: 'vc-modal', isOpen: function(el){ return isVisible(el); }, close: function(){ if (typeof window.vcClose === 'function') window.vcClose(); } },
    { id: 'vg-viewer', isOpen: function(el){ return isVisible(el); }, close: function(){ if (typeof window.vgClose === 'function') window.vgClose(); } },
    { id: 'img-viewer-modal', isOpen: function(el){ return hasClass(el, 'show'); }, close: function(){ if (typeof window.closeImageViewer === 'function') window.closeImageViewer(); } },
    { id: 'future-editor', isOpen: function(el){ return isVisible(el); }, close: function(){ if (typeof window.closeFutureEditor === 'function') window.closeFutureEditor(); } },
    { id: 'card-edit-modal', isOpen: function(el){ return hasClass(el, 'show'); }, close: function(){ if (typeof window.closeCardEditor === 'function') window.closeCardEditor(); } },
    { id: 'grat-edit-modal', isOpen: function(el){ return hasClass(el, 'show'); }, close: function(){ if (typeof window.closeGratEditor === 'function') window.closeGratEditor(); } },
    { id: 'bank-cal-modal', isOpen: function(el){ return hasClass(el, 'show'); }, close: function(){ if (typeof window.closeBankCalendar === 'function') window.closeBankCalendar(); } },
    { id: 'goal-modal-overlay', isOpen: function(el){ return !hasClass(el, 'hidden'); }, close: function(el){ el.classList.add('hidden'); } },
    { id: 'settings-modal-overlay', isOpen: function(el){ return !hasClass(el, 'hidden'); }, close: function(el){ el.classList.add('hidden'); } },
    { id: 'help-modal-overlay', isOpen: function(el){ return !hasClass(el, 'hidden'); }, close: function(el){ el.classList.add('hidden'); } }
  ];

  function findOpenOverlay(){
    for (var i = 0; i < OVERLAYS.length; i++){
      var o = OVERLAYS[i];
      var el = document.getElementById(o.id);
      if (el && o.isOpen(el)) return { def: o, el: el };
    }
    return null;
  }

  var HOME = 'home';
  function currentTab(){
    var el = document.querySelector('.view.active');
    return el ? el.id.replace('view-', '') : HOME;
  }

  /* یک پله‌ی اضافه می‌ذاریم تا برگشتِ بعدی از صفحه خارجمون نکنه، خودمون بگیریمش */
  function arm(){
    try { history.pushState({ maghzBack: true, t: Date.now() }, ''); } catch(e){}
  }

  arm();

  /* هر بار کاربر روی چیزی می‌زنه، یعنی احتمالاً یک قسمت جدید باز شده؛
     دوباره پله رو آماده می‌کنیم تا برگشت همیشه گرفته بشه، نه فقط بار اول */
  var lastArm = Date.now();
  document.addEventListener('click', function(){
    var now = Date.now();
    if (now - lastArm > 200){ arm(); lastArm = now; }
  }, true);

  window.addEventListener('popstate', function(){
    var found = findOpenOverlay();
    if (found){
      found.def.close(found.el);
      arm();
      return;
    }
    var tab = currentTab();
    if (tab !== HOME){
      try { goto(HOME); } catch(e){}
      arm();
      return;
    }
    /* همه‌چیز بسته و روی خانه‌ایم: دیگه پله رو دوباره نمی‌ذاریم،
       برگشتِ بعدی طبیعی عمل می‌کنه (خروج) */
  });
})();
