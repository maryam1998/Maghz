var deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault();
  deferredInstallPrompt = e;
  var btn = document.getElementById('pwa-install-btn');
  if(btn) btn.style.display = 'inline-flex';
});
window.installPWA = function(){
  var btn = document.getElementById('pwa-install-btn');
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(function(){
      deferredInstallPrompt = null;
      if(btn) btn.style.display = 'none';
    });
  } else {
    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    alert(isIOS
      ? 'برای نصب: دکمهٔ اشتراک‌گذاری Safari رو بزن و «Add to Home Screen» رو انتخاب کن.'
      : 'برای نصب: از منوی مرورگر (⋮) گزینهٔ «Install App» یا «افزودن به صفحه اصلی» رو بزن.');
  }
};
window.addEventListener('appinstalled', function(){
  var btn = document.getElementById('pwa-install-btn');
  if(btn) btn.style.display = 'none';
  deferredInstallPrompt = null;
});
