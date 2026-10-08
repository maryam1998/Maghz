(function(){
  var gratRoot = document.getElementById("grat-root");
  var shenakhtRoot = document.getElementById("shenakht-root");
  var btnShenakht = document.getElementById("tab-btn-shenakht");
  var btnMap = document.getElementById("tab-btn-map");
  var btnGrat = document.getElementById("tab-btn-grat");
  var shenakhtMounted = false;
  var shenakhtWaitTimer = null;

  function clearActive(){
    gratRoot.classList.remove("active");
    shenakhtRoot.classList.remove("active");
    document.body.classList.add("map-hidden");
    btnShenakht.classList.remove("active");
    btnMap.classList.remove("active");
    btnGrat.classList.remove("active");
  }
  function mountShenakhtWhenReady(){
    if (shenakhtMounted) return;
    if (window.ShenakhtApp){
      window.ShenakhtApp.mount(shenakhtRoot);
      shenakhtMounted = true;
      return;
    }
    if (!shenakhtWaitTimer){
      shenakhtRoot.innerHTML = '<div style="width:100%;text-align:center;padding:60px 16px;font-family:Vazirmatn,Tahoma,sans-serif;font-size:14px;color:#8b8fa8;">در حال بارگذاری…</div>';
      shenakhtWaitTimer = setInterval(function(){
        if (window.ShenakhtApp){
          clearInterval(shenakhtWaitTimer);
          shenakhtWaitTimer = null;
          shenakhtRoot.innerHTML = '';
          window.ShenakhtApp.mount(shenakhtRoot);
          shenakhtMounted = true;
        }
      }, 150);
    }
  }
  function showShenakht(){ clearActive(); mountShenakhtWhenReady(); shenakhtRoot.classList.add("active"); btnShenakht.classList.add("active"); }
  function showMap(){ clearActive(); document.body.classList.remove("map-hidden"); btnMap.classList.add("active"); }
  function showGrat(){ clearActive(); gratRoot.classList.add("active"); btnGrat.classList.add("active"); }
  btnShenakht.addEventListener("click", showShenakht);
  btnMap.addEventListener("click", showMap);
  btnGrat.addEventListener("click", showGrat);
})();
