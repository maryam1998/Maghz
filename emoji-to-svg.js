// emoji-to-svg.js
(function() {
  // نقشه تبدیل ایموجی‌ها به آیکون‌های SVG
  const EMOJI_MAP = {
    '🌙': 'ico-moon',
    '＋': 'ico-plus',
    '⚙': 'ico-settings',
    '📅': 'ico-calendar',
    '✏️': 'ico-edit',
    '🗑': 'ico-trash',
    '🌿': 'ico-spark', // جایگزین برای لوگو
    '🙏': 'ico-hands',
    '🧠': 'ico-brain',
    '📖': 'ico-book',
    '🚪': 'ico-logout',
    '💳': 'ico-card',
    '✓': 'ico-check',
    '✕': 'ico-close',
    '📷': 'ico-camera',
    '🖼️': 'ico-image',
    '➕': 'ico-plus',
    '🛍️': 'ico-bag',
    '🔔': 'ico-bell',
    '🔕': 'ico-bell-off',
    '📍': 'ico-map',
    '💞': 'ico-users',
    '🔄': 'ico-history',
    '🕊️': 'ico-dove',
    '✨': 'ico-spark',
    '📲': 'ico-plus', // یا هر آیکون مناسب دیگر
    '🔍': 'ico-search',
    '💭': 'ico-note',
    '🌱': 'ico-seedling',
    '🎯': 'ico-target',
    '🧪': 'ico-flask',
    '🗣️': 'ico-sound-on',
    '🔗': 'ico-link',
    '⚠️': 'ico-warning',
    '💙': 'ico-heart',
    '⭐': 'ico-star',
    '📊': 'ico-chart',
    '📝': 'ico-edit',
    '⏸️': 'ico-pause',
    '⏱️': 'ico-clock',
    '⚖️': 'ico-scale',
    '🔬': 'ico-microscope',
    '💧': 'ico-drop',
    '🔁': 'ico-refresh',
    '⚡': 'ico-flame',
    '💡': 'ico-bulb',
    '❌': 'ico-x',
    '✅': 'ico-check-circle',
    '🔒': 'ico-lock',
    '🌍': 'ico-globe',
    '🥇': 'ico-star',
    '📈': 'ico-chart',
    '📉': 'ico-chart',
    '🔮': 'ico-spark',
    '🎨': 'ico-palette',
    '🧬': 'ico-dna',
    '❤️': 'ico-heart',
    '❤': 'ico-heart',
    '💗': 'ico-heart',
    '💚': 'ico-heart',
    '🔐': 'ico-lock',
    '↺': 'ico-refresh',
    '✦': 'ico-spark',
    '💼': 'ico-briefcase',
    '🏠': 'ico-home',
    '👥': 'ico-users',
    '💪': 'ico-muscle',
    '📱': 'ico-phone',
    '🌐': 'ico-globe'
  };

  // یک regex واحد (بلندترین کلیدها اول) به‌جای ده‌ها بار includes برای هر گره‌ی متنی
  const EMOJI_KEYS = Object.keys(EMOJI_MAP).sort(function(a, b){ return b.length - a.length; });
  const EMOJI_RE = new RegExp(EMOJI_KEYS.map(function(k){ return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
  const EMOJI_TEST = new RegExp(EMOJI_RE.source);
  const SKIP_TAGS = { SCRIPT:1, STYLE:1, SVG:1, svg:1, PATH:1, USE:1, TEXTAREA:1, INPUT:1, AUDIO:1, VIDEO:1, IMG:1, CANVAS:1, SELECT:1, OPTION:1 };
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function makeIcon(iconId){
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'ico');
    const use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + iconId);
    svg.appendChild(use);
    return svg;
  }

  // تابع جایگزینی ایموجی‌ها در گره‌های متنی
  function replaceEmojisInNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (!text || !EMOJI_TEST.test(text) || !node.parentNode) return;
      if (node.parentNode.namespaceURI === SVG_NS) return; /* متنِ داخل SVG (نقشه) را دست نزن؛ span داخل SVG نمایش داده نمی‌شود */
      const span = document.createElement('span');
      span.className = 'emoji-replaced';
      let last = 0, m;
      EMOJI_RE.lastIndex = 0;
      while ((m = EMOJI_RE.exec(text)) !== null) {
        if (m.index > last) span.appendChild(document.createTextNode(text.slice(last, m.index)));
        span.appendChild(makeIcon(EMOJI_MAP[m[0]]));
        last = m.index + m[0].length;
      }
      if (last < text.length) span.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(span, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (SKIP_TAGS[node.tagName] || node.namespaceURI === SVG_NS || (node.classList && node.classList.contains('emoji-replaced'))) return;
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        replaceEmojisInNode(node.childNodes[i]);
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    replaceEmojisInNode(document.body);
  });

  // محتوای داینامیک: تغییرات پشت‌سرهم جمع می‌شن و یک‌جا در فریم بعدی پردازش می‌شن
  let queue = [], scheduled = false;
  function flush() {
    scheduled = false;
    const nodes = queue; queue = [];
    nodes.forEach(function(n){ if (n.isConnected) replaceEmojisInNode(n); });
  }
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1 && node.classList && node.classList.contains('emoji-replaced')) return;
        queue.push(node);
      });
    });
    if (queue.length && !scheduled) {
      scheduled = true;
      (window.requestAnimationFrame || setTimeout)(flush);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
