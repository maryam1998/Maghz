// emoji-to-svg.js
(function() {
  // نقشه تبدیل ایموجی‌ها به آیکون‌های SVG
  const EMOJI_MAP = {
    '🌙': 'ico-moon',
    '؟': 'ico-help',
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
    '🎨': 'ico-palette'
  };

  // تابع جایگزینی ایموجی‌ها در گره‌های متنی
  function replaceEmojisInNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      let hasEmoji = false;
      let newHtml = text;

      // بررسی وجود ایموجی در متن
      for (const [emoji, iconId] of Object.entries(EMOJI_MAP)) {
        if (newHtml.includes(emoji)) {
          hasEmoji = true;
          // جایگزینی ایموجی با تگ SVG
          newHtml = newHtml.split(emoji).join(`<svg class="ico"><use href="#${iconId}"/></svg>`);
        }
      }

      if (hasEmoji) {
        const span = document.createElement('span');
        span.className = 'emoji-replaced';
        span.innerHTML = newHtml;
        node.parentNode.replaceChild(span, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // صرف‌نظر کردن از تگ‌های اسکریپت، استایل و خود SVG
      if (['SCRIPT', 'STYLE', 'SVG', 'PATH', 'USE'].includes(node.tagName)) return;
      if (node.tagName === 'svg') return;

      // بررسی فرزندان
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        replaceEmojisInNode(node.childNodes[i]);
      }
    }
  }

  // اجرای تابع پس از بارگذاری کامل صفحه
  window.addEventListener('DOMContentLoaded', () => {
    replaceEmojisInNode(document.body);
  });

  // برای محتوایی که به صورت داینامیک اضافه می‌شود (مثل مودال‌ها یا لیست‌ها)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        replaceEmojisInNode(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
