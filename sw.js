/* HabitOS migration worker.
   The app now lives at /app/ with its own service worker. Browsers that still have the OLD
   worker registered for "/" would keep serving the old cached app instead of the new website.
   When such a browser re-checks /sw.js it receives THIS file, which clears the old caches,
   unregisters itself, and reloads open tabs so they get the live site. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(event){
  event.waitUntil((async function(){
    try{ var keys = await caches.keys(); await Promise.all(keys.map(function(k){ return caches.delete(k); })); }catch(e){}
    try{ await self.registration.unregister(); }catch(e){}
    try{
      var cs = await self.clients.matchAll({type:'window'});
      cs.forEach(function(c){ try{ c.navigate(c.url); }catch(e){} });
    }catch(e){}
  })());
});
self.addEventListener('fetch', function(){ /* never intercept: always network */ });
