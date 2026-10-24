/* HabitOS service worker
   - HTML  : network-first (always the newest version when online, cached copy when offline)
   - assets: stale-while-revalidate
   - Firebase SDK scripts: cached so the app shell opens even offline
   - Firestore / Auth / Google APIs: never touched (always straight to the network)
   Bump VERSION only if you change the list of cached files below. Normal app updates
   (new index.html) reach users automatically — no change here needed. */
const VERSION = 'v1';
const SHELL_CACHE = 'habitos-shell-' + VERSION;
const CDN_CACHE = 'habitos-cdn-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function(c){ return Promise.all(SHELL.map(function(u){ return c.add(new Request(u,{cache:'reload'})).catch(function(){}); })); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.filter(function(k){ return k.indexOf('habitos-shell-')===0 && k!==SHELL_CACHE; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.clients.claim(); })
  );
});

function networkFirst(req){
  return caches.open(SHELL_CACHE).then(function(cache){
    var timeout = new Promise(function(_,rej){ setTimeout(function(){ rej(new Error('timeout')); }, 6000); });
    return Promise.race([fetch(req.url, {cache:'no-cache'}), timeout]).then(function(res){
      if(res && res.ok){ cache.put('./index.html', res.clone()); return res; }
      throw new Error('bad response');
    }).catch(function(){
      return cache.match('./index.html').then(function(hit){ return hit || cache.match('./') || Response.error(); });
    });
  });
}

function staleWhileRevalidate(event, cacheName){
  var req = event.request;
  return caches.open(cacheName).then(function(cache){
    return cache.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && (res.ok || res.type==='opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function(){ return hit; });
      if(hit){ event.waitUntil(net); return hit; }
      return net;
    });
  });
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  if(url.origin === self.location.origin){
    if(url.pathname.indexOf('/__/') !== -1) return;          // Firebase Hosting reserved paths (auth handler etc.)
    if(url.pathname.slice(-6) === '/sw.js') return;          // let the browser check for a new service worker itself
    if(req.mode === 'navigate'){ event.respondWith(networkFirst(req)); return; }
    event.respondWith(staleWhileRevalidate(event, SHELL_CACHE));
    return;
  }
  if(url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0){
    event.respondWith(staleWhileRevalidate(event, CDN_CACHE));
  }
  // everything else (Firestore, Auth, Google APIs…) goes straight to the network
});
