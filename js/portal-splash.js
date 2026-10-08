(function(){
  var splash = document.getElementById("portal-splash");
  var card = document.getElementById("portal-card");
  var swirlWrap = document.getElementById("portal-swirl-wrap");
  var emailInput = document.getElementById("portal-input-email");
  var passInput = document.getElementById("portal-input-password");
  var errorEl = document.getElementById("portal-error");
  var infoEl = document.getElementById("portal-info");
  var enterBtn = document.getElementById("portal-enter-btn");
  var googleBtn = document.getElementById("portal-google-btn");
  var guestBtn = document.getElementById("portal-guest-btn");
  var forgotLink = document.getElementById("portal-forgot-link");
  var mode = "signin";

  var AUTH_FLAG_KEY = 'appAuthConfirmed';
  function setAuthConfirmed(v){
    try{ v ? localStorage.setItem(AUTH_FLAG_KEY,'1') : localStorage.removeItem(AUTH_FLAG_KEY); }catch(e){}
  }
  function isAuthConfirmed(){
    try{ return localStorage.getItem(AUTH_FLAG_KEY) === '1'; }catch(e){ return false; }
  }

  var HINTS = { signin: 'ایمیل و رمزت را بنویس تا وارد حسابت شوی.', signup: 'ایمیل و یک رمز جدید بنویس تا حسابت ساخته شود.' };
  var CTA_TEXT = { signin: 'ورود', signup: 'ساخت حساب' };
  var CTA_ICON = { signin: 'ico-lock', signup: 'ico-plus' };

  function setMode(m){
    mode = m;
    document.querySelectorAll('.portal-mode-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.mode === m); });
    var iconUse = enterBtn.querySelector('use');
    if (iconUse) iconUse.setAttribute('href', '#' + CTA_ICON[m]);
    var label = enterBtn.querySelector('span:last-child');
    if (label) label.textContent = CTA_TEXT[m];
    errorEl.textContent = ''; infoEl.textContent = '';
  }

  document.querySelectorAll('.portal-mode-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ setMode(btn.dataset.mode); });
  });

  function updateBodyPortalState(){
    if (splash.classList.contains('portal-hidden')) document.body.classList.remove('portal-active');
    else document.body.classList.add('portal-active');
  }

  function hideGate(){
    if (splash.classList.contains("portal-hidden")) return;
    swirlWrap.classList.add("portal-warp");
    card.classList.add("portal-warp-out");
    enterBtn.disabled = true;
    setTimeout(function(){
      splash.classList.add("portal-hidden");
      updateBodyPortalState();
    }, 900);
  }
  function showGateInstant(){
    if (!splash.classList.contains("portal-hidden")) return;
    swirlWrap.classList.remove("portal-warp");
    card.classList.remove("portal-warp-out");
    enterBtn.disabled = false;
    splash.classList.remove("portal-hidden");
    updateBodyPortalState();
  }

  function applySession(session){
    setAuthConfirmed(true);
    try{
      if (typeof state === "undefined") return;
      state.loginId = (session.user && (session.user.email || session.user.id)) || "";
      state.authUserId = session.user && session.user.id;
      if (typeof saveState === "function") saveState();
      var innerModal = document.getElementById("login-modal");
      if (innerModal) innerModal.classList.remove("show");
      if (typeof ensureSetup === "function"){
        var needsSetup = ensureSetup();
        if (!needsSetup && typeof renderHome === "function") renderHome();
      }
    }catch(e){}
  }

  function translateAuthError(msg){
    if (/Invalid login credentials/i.test(msg)) return "ایمیل یا رمز عبور اشتباه است";
    if (/User already registered/i.test(msg)) return "این ایمیل قبلاً ثبت‌نام کرده — از تب «ورود» استفاده کن";
    if (/Email not confirmed/i.test(msg)) return "اول ایمیلت را تایید کن (ایمیلت را چک کن)";
    if (/Password should be/i.test(msg)) return "رمز عبور باید حداقل ۶ کاراکتر باشد";
    return "مشکلی پیش آمد: " + msg;
  }

  window.appSignOut = function(){
    try{ setAuthConfirmed(false); }catch(e){}
    if (window.supabaseClient){ window.supabaseClient.auth.signOut(); }
  };

  function enterAsGuest(){
    try{
      if (typeof state !== "undefined"){
        state.loginId = 'guest-' + (localStorage.getItem('guestId') || (function(){
          var g = 'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
          try{ localStorage.setItem('guestId', g); }catch(e){}
          return g;
        })());
        state.authUserId = '';
        if (typeof saveState === "function") saveState();
      }
      var innerModal = document.getElementById("login-modal");
      if (innerModal) innerModal.classList.remove("show");
      if (typeof ensureSetup === "function") ensureSetup();
      if (typeof renderHome === "function") renderHome();
    }catch(e){}
    setAuthConfirmed(true);
    hideGate();
  }

  if (isAuthConfirmed()){
    splash.classList.add("portal-hidden");
    updateBodyPortalState();
  }

  if (!window.supabaseClient){
    if (googleBtn) googleBtn.disabled = true;
    enterBtn.disabled = true;
    infoEl.textContent = "ورود با ایمیل در حال حاضر فعال نیست — می‌توانی به‌عنوان مهمان وارد شوی.";
  } else {
    window.supabaseClient.auth.getSession().then(function(res){
      var session = res && res.data && res.data.session;
      if (session){
        applySession(session);
        setAuthConfirmed(true);
        splash.classList.add("portal-hidden");
        updateBodyPortalState();
      } else if (!isAuthConfirmed()){
        splash.classList.remove("portal-hidden");
        updateBodyPortalState();
      }
    });
    window.supabaseClient.auth.onAuthStateChange(function(event, session){
      if (event === "SIGNED_IN" && session){
        applySession(session);
        setAuthConfirmed(true);
        if (!splash.classList.contains("portal-hidden")) hideGate();
      }
      if (event === "SIGNED_OUT"){
        try{
          if (typeof state !== "undefined"){ state.loginId = ""; state.authUserId = ""; if (typeof saveState === "function") saveState(); }
        }catch(e){}
        setAuthConfirmed(false);
        showGateInstant();
      }
    });
  }

  enterBtn.addEventListener("click", async function(){
    if (!window.supabaseClient) return;
    var email = (emailInput.value || "").trim();
    var pass = passInput.value || "";
    errorEl.textContent = ""; infoEl.textContent = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ errorEl.textContent = "یک ایمیل معتبر بنویس"; return; }
    if (pass.length < 6){ errorEl.textContent = "رمز عبور باید حداقل ۶ کاراکتر باشد"; return; }
    enterBtn.disabled = true;
    try{
      if (mode === "signup"){
        var r = await window.supabaseClient.auth.signUp({ email: email, password: pass });
        if (r.error) throw r.error;
        if (!(r.data && r.data.session)){
          infoEl.textContent = "یک ایمیل تاییدیه برایت فرستاده شد. اول ایمیلت را تایید کن، بعد از تب «ورود» وارد شو.";
          enterBtn.disabled = false;
          return;
        }
        setAuthConfirmed(true);
        applySession(r.data.session);
        hideGate();
      } else {
        var r2 = await window.supabaseClient.auth.signInWithPassword({ email: email, password: pass });
        if (r2.error) throw r2.error;
        setAuthConfirmed(true);
        applySession(r2.data.session);
        hideGate();
      }
    }catch(e){
      errorEl.textContent = (e && e.message) ? translateAuthError(e.message) : "مشکلی پیش آمد، دوباره امتحان کن";
      enterBtn.disabled = false;
    }
  });

  if (googleBtn){
    googleBtn.addEventListener("click", async function(){
      if (!window.supabaseClient) return;
      errorEl.textContent = "";
      try{
        await window.supabaseClient.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
      }catch(e){ errorEl.textContent = "ورود با گوگل با مشکل مواجه شد"; }
    });
  }

  if (guestBtn){ guestBtn.addEventListener("click", enterAsGuest); }

  if (forgotLink){
    forgotLink.addEventListener("click", async function(){
      if (!window.supabaseClient) return;
      var email = (emailInput.value || "").trim();
      errorEl.textContent = ""; infoEl.textContent = "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ errorEl.textContent = "اول ایمیلت را بالا بنویس"; return; }
      try{
        await window.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
        infoEl.textContent = "لینک بازیابی رمز عبور به ایمیلت فرستاده شد.";
      }catch(e){ errorEl.textContent = "ارسال لینک بازیابی با مشکل مواجه شد"; }
    });
  }

  emailInput.addEventListener("keydown", function(e){ if (e.key === "Enter") e.preventDefault(); });
  passInput.addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); enterBtn.click(); } });

  setMode('signin');
  updateBodyPortalState();
})();
