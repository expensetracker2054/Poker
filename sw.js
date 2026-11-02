const APP = "poker";                 // unique per app
const CACHE = APP + "-v1";           // bump the number on each release
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(APP + "-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
function timeout(ms){ return new Promise((_, no) => setTimeout(() => no(new Error("timeout")), ms)); }
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin === self.location.origin){
    e.respondWith(Promise.race([fetch(req), timeout(5000)]).then(res => {
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch:true})
      .then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined))
      .then(r => r || Response.error())));
    return;
  }
  if(url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
