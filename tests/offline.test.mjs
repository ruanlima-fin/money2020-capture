import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const dist=new URL('../dist/',import.meta.url);
test('Service Worker instala todos os recursos e reabre sem rede no subdiretório Pages',async()=>{
 const handlers={},stores=new Map(),base='https://user.github.io/money2020-capture/';let network=true,claimed=false;
 const caches={open:async key=>{if(!stores.has(key))stores.set(key,new Map());const data=stores.get(key);return {addAll:async urls=>{for(const url of urls){const filename=url===base?'index.html':url.slice(base.length);const bytes=await readFile(new URL(filename,dist));data.set(url,new Response(bytes));}},match:async(request)=>data.get(typeof request==='string'?request:request.url.split('?')[0])?.clone()};},keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key)};
 stores.set('unrelated-cache',new Map());stores.set('money2020-capture-/other/-v1',new Map());stores.set('money2020-capture-/money2020-capture/-v0',new Map());
 const context={URL,caches,fetch:async()=>{if(!network)throw Error('offline');return new Response('network');},self:{location:base+'sw.js',clients:{claim:async()=>{claimed=true;}},addEventListener:(name,fn)=>handlers[name]=fn}};
 vm.runInNewContext(await readFile(new URL('sw.js',dist),'utf8'),context);
 await new Promise((resolve,reject)=>handlers.install({waitUntil:p=>p.then(resolve,reject)}));await new Promise((resolve,reject)=>handlers.activate({waitUntil:p=>p.then(resolve,reject)}));assert.ok(claimed);assert.ok(stores.has('unrelated-cache'));assert.ok(stores.has('money2020-capture-/other/-v1'));assert.ok(!stores.has('money2020-capture-/money2020-capture/-v0'));network=false;
 const cached=async(url,mode)=>new Promise((resolve,reject)=>handlers.fetch({request:{url,method:'GET',mode},respondWith:p=>p.then(resolve,reject)}));
 assert.match(await (await cached(base,'navigate')).text(),/Money20\/20 Capture/);
 for(const asset of ['app.js','db.js','zip.js','transfer.js','style.css','manifest.webmanifest','icons/icon-192.png'])assert.equal((await cached(base+asset,'cors')).status,200);
 assert.match(await (await cached(base+'unknown-route','navigate')).text(),/Money20\/20 Capture/);
 let intercepted=false;handlers.fetch({request:{url:'https://other.test/a',method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
