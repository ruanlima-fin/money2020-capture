const BASE=new URL('./',self.location).href;
const PREFIX=`money2020-capture-${new URL(BASE).pathname}-`;
const CACHE=PREFIX+'v2';
const ASSETS=['./','./index.html','./style.css','./app.js','./db.js','./zip.js','./transfer.js','./manifest.webmanifest','./icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||!event.request.url.startsWith(BASE))return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;
    try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return cache.match(new URL('index.html',BASE).href);throw error;}
  }));
});
