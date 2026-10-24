/* HabitOS public site — shared helpers.
   The website talks to the SAME Firebase project as the app, so pricing, plan
   limits and payment numbers edited in the app's Backend show up here live. */
(function(){
  var FIREBASE_CONFIG = {
  apiKey: "AIzaSyAz1UQFPttBPXa4gMQlqcK1ECk4eqTVCHA",
  authDomain: "habitos-v1.firebaseapp.com",
  projectId: "habitos-v1",
  storageBucket: "habitos-v1.firebasestorage.app",
  messagingSenderId: "141936447832",
  appId: "1:141936447832:web:1cc9ab3db338561d42552d"
};
  var HOS = window.HOS = {};

  /* ---- theme (night default, same tokens as the app) ---- */
  try{ if(localStorage.getItem('hos-theme')==='day') document.documentElement.classList.add('day'); }catch(e){}
  HOS.toggleTheme = function(){
    var day = document.documentElement.classList.toggle('day');
    try{ localStorage.setItem('hos-theme', day ? 'day' : 'night'); }catch(e){}
  };

  /* ---- firebase ---- */
  var db = null, auth = null;
  try{
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    if(firebase.auth) auth = firebase.auth();
  }catch(e){ console.error('Firebase init failed', e); }
  HOS.db = db; HOS.auth = auth;

  /* ---- plans: defaults match the app; live values from config/pricing override ---- */
  HOS.PLANS = [
    { id:'m1', label:'1 month',  months:1,  price:100 },
    { id:'m3', label:'3 months', months:3,  price:280 },
    { id:'m6', label:'6 months', months:6,  price:550 },
    { id:'y1', label:'1 year',   months:12, price:1050 }
  ];
  HOS.LIMITS = { freeMaxActiveHabits:15, freeMaxGoals:5, freeTemplatesAccess:false, freeAchievementsFull:false, freeTrialDays:3 };
  HOS.PAYMENT = { bkashNumber:'', nagadNumber:'', note:'' };

  function cfgGet(id){
    if(!db) return Promise.resolve(null);
    return db.collection('config').doc(id).get().then(function(d){ return d.exists ? d.data() : null; }).catch(function(){ return null; });
  }
  HOS.loadPricing = function(){
    return cfgGet('pricing').then(function(d){
      if(d) HOS.PLANS.forEach(function(p){ var v = Number(d[p.id]); if(v>0) p.price = Math.round(v); });
      return HOS.PLANS;
    });
  };
  HOS.loadLimits = function(){
    return cfgGet('planLimits').then(function(d){ if(d) Object.keys(HOS.LIMITS).forEach(function(k){ if(d[k]!==undefined) HOS.LIMITS[k] = d[k]; }); return HOS.LIMITS; });
  };
  HOS.loadPayment = function(){
    return cfgGet('payment').then(function(d){ if(d) Object.keys(HOS.PAYMENT).forEach(function(k){ if(typeof d[k]==='string') HOS.PAYMENT[k] = d[k]; }); return HOS.PAYMENT; });
  };
  HOS.plan = function(id){ for(var i=0;i<HOS.PLANS.length;i++) if(HOS.PLANS[i].id===id) return HOS.PLANS[i]; return null; };
  HOS.bdt = function(n){ return '৳' + Number(n).toLocaleString('en-US', {maximumFractionDigits:0}); };

  /* ---- ui helpers ---- */
  HOS.toast = function(msg){
    var t = document.getElementById('toast'); if(!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(HOS._tt); HOS._tt = setTimeout(function(){ t.classList.remove('show'); }, 3600);
  };
  HOS.esc = function(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };

  document.addEventListener('DOMContentLoaded', function(){
    var tb = document.getElementById('themeBtn'); if(tb) tb.addEventListener('click', HOS.toggleTheme);
    var mb = document.getElementById('menuBtn'), nav = document.getElementById('nav');
    if(mb && nav){
      mb.addEventListener('click', function(){ var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      nav.querySelectorAll('.nav-links a').forEach(function(a){ a.addEventListener('click', function(){ nav.classList.remove('open'); }); });
    }
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.12});
      document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
    } else document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    /* signed-in visitors: "Log in" becomes "Open app" (same origin => same Firebase session) */
    if(auth){
      auth.onAuthStateChanged(function(u){
        if(!u) return;
        document.querySelectorAll('[data-login]').forEach(function(a){ a.textContent = 'Open app'; });
      });
    }
  });
})();
