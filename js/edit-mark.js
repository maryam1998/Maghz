/* نشانه‌گذاری ویرایش — بعد از ذخیره‌ی یک ویرایش، قسمت تغییرکرده را هایلایت می‌کند
   و صفحه را روی همان‌جا می‌برد تا کاربر خطش را گم نکند. */
(function(){
  "use strict";

  var st = document.createElement('style');
  st.textContent =
    '@keyframes em-flash-bg{0%{background:rgba(244,197,66,.50);box-shadow:0 0 0 3px rgba(244,197,66,.65);}'+
      '65%{background:rgba(244,197,66,.22);box-shadow:0 0 0 3px rgba(244,197,66,.30);}'+
      '100%{background:transparent;box-shadow:0 0 0 3px transparent;}}'+
    '.em-flash{animation:em-flash-bg 5s ease-out 1;border-radius:12px;}'+
    '@keyframes em-mark-fade{0%,60%{background:rgba(244,197,66,.55);}100%{background:transparent;}}'+
    'mark.em-mark{background:rgba(244,197,66,.55);color:inherit;border-radius:4px;padding:1px 0;'+
      '-webkit-box-decoration-break:clone;box-decoration-break:clone;animation:em-mark-fade 7s ease-out forwards;}'+
    '@keyframes em-caret-blink{0%,100%{opacity:1;}50%{opacity:.25;}}'+
    '@keyframes em-caret-gone{to{opacity:0;width:0;margin:0;}}'+
    '.em-caret{display:inline-block;width:3px;height:1.1em;vertical-align:text-bottom;margin:0 2px;border-radius:2px;'+
      'background:#f4c542;animation:em-caret-blink .9s ease-in-out 6,em-caret-gone .5s ease-out 5.4s forwards;}'+
    '.em-edited{display:inline-block;margin-inline-start:6px;padding:0 7px;border-radius:999px;font-size:10px;'+
      'border:1px solid var(--panel-border,rgba(128,128,128,.4));color:var(--text-dim,#888);}'+
    '@media (prefers-reduced-motion:reduce){.em-flash,mark.em-mark,.em-caret{animation:none;}'+
      '.em-flash{background:rgba(244,197,66,.25);}}';
  document.head.appendChild(st);

  /* محدوده‌ی تغییرکرده در متن جدید (با پیشوند/پسوند مشترک)؛ به مرز کلمه گسترش می‌یابد.
     اگر فقط حذف شده باشد، start === end برمی‌گردد (یک نشانه‌ی مکان). */
  function diffRange(oldT, newT){
    oldT = String(oldT == null ? '' : oldT);
    newT = String(newT == null ? '' : newT);
    if (oldT === newT) return null;
    var max = Math.min(oldT.length, newT.length), p = 0;
    while (p < max && oldT.charCodeAt(p) === newT.charCodeAt(p)) p++;
    var s = 0;
    while (s < max - p && oldT.charCodeAt(oldT.length - 1 - s) === newT.charCodeAt(newT.length - 1 - s)) s++;
    var start = p, end = newT.length - s;
    if (end > start){
      while (start > 0 && !/\s/.test(newT.charAt(start - 1))) start--;
      while (end < newT.length && !/\s/.test(newT.charAt(end))) end++;
    }
    return { start: start, end: end };
  }

  /* متن را escape می‌کند و محدوده را داخل <mark> (یا نشانه‌ی حذف) می‌گذارد */
  function markHtml(text, range, esc){
    text = String(text == null ? '' : text);
    esc = esc || function(x){ return String(x).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
    if (!range) return esc(text);
    var a = Math.max(0, Math.min(range.start, text.length));
    var b = Math.max(a, Math.min(range.end, text.length));
    if (b === a) return esc(text.slice(0, a)) + '<span class="em-caret" aria-hidden="true"></span>' + esc(text.slice(a));
    return esc(text.slice(0, a)) + '<mark class="em-mark">' + esc(text.slice(a, b)) + '</mark>' + esc(text.slice(b));
  }

  function scrollToCenter(el){
    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    catch(e){ try { el.scrollIntoView(); } catch(e2){} }
  }

  function reveal(el, opts){
    if (!el) return;
    opts = opts || {};
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        scrollToCenter(el);
        if (opts.flash){
          el.classList.remove('em-flash');
          void el.offsetWidth;
          el.classList.add('em-flash');
          setTimeout(function(){ el.classList.remove('em-flash'); }, 5200);
        }
      });
    });
  }

  /* داخل container اولین <mark> یا نشانه‌ی حذف را پیدا می‌کند، صفحه را روی آن می‌برد
     و بعد از چند ثانیه هایلایت را برمی‌دارد */
  function revealIn(container, doScroll){
    if (!container) return;
    var t = container.querySelector('mark.em-mark, .em-caret');
    if (!t) return;
    if (doScroll !== false) reveal(t, {});
    setTimeout(function(){
      try {
        var marks = container.querySelectorAll('mark.em-mark');
        for (var i = 0; i < marks.length; i++){
          var m = marks[i], par = m.parentNode;
          if (!par) continue;
          while (m.firstChild) par.insertBefore(m.firstChild, m);
          par.removeChild(m);
        }
        var cs = container.querySelectorAll('.em-caret');
        for (var j = 0; j < cs.length; j++) if (cs[j].parentNode) cs[j].parentNode.removeChild(cs[j]);
        container.normalize();
      } catch(e){}
    }, 8000);
  }

  /* آیتم شکرگذاری ویرایش‌شده در لیست */
  function revealGrat(id){
    setTimeout(function(){
      var el = document.querySelector('#history-list .tx-item[data-gid="' + id + '"]');
      if (el) reveal(el, { flash: true });
    }, 80);
  }

  window.EditMark = { diffRange: diffRange, markHtml: markHtml, reveal: reveal, revealIn: revealIn, revealGrat: revealGrat };
})();
