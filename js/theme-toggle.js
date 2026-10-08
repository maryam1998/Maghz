(function(){
  var THEME_KEY = 'appTheme';
  function applyIcon(theme){
    var icon = theme === 'light' ? '☀️' : '🌙';
    document.querySelectorAll('.theme-toggle-btn, .theme-toggle-btn-grat').forEach(function(btn){ btn.textContent = icon; });
  }
  window.setAppTheme = function(theme){
    document.documentElement.setAttribute('data-theme', theme);
    try{ localStorage.setItem(THEME_KEY, theme); }catch(e){}
    applyIcon(theme);
    if (typeof window.frequencyMapRender === 'function') window.frequencyMapRender();
  };
  window.toggleAppTheme = function(){
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    window.setAppTheme(current === 'dark' ? 'light' : 'dark');
  };
  applyIcon(document.documentElement.getAttribute('data-theme') || 'light');
})();
