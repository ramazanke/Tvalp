const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../channel-store.js'),'utf8');
function fixture() {
  const values=new Map(), state={text:JSON.stringify({channels:[{name:'GitHub',url:'https://media.example/live.m3u8',group:'Ulusal'}]}),fail:false,finalUrl:null,writes:0};
  const storage={getItem:key=>values.has(key)?values.get(key):null,setItem(key,value){state.writes++;values.set(key,value)},removeItem:key=>values.delete(key)};
  const context={window:{},location:{href:'https://ramazanke.github.io/Tvalp/settings.html',protocol:'https:'},
    URL,AbortController,TextDecoder,setTimeout,clearTimeout,Date,localStorage:storage,
    fetch:async address=>{
      if(state.fail)throw new TypeError('Failed to fetch');
      return {ok:true,status:200,url:state.finalUrl||address,headers:{get:()=>null},text:async()=>state.text};
    }};
  vm.createContext(context);vm.runInContext(source,context);
  return {store:context.window.ChannelStore,values,state,context};
}
const m3u='#EXTM3U\n#EXTINF:-1 tvg-name="Ad, alternatif" tvg-logo="/logos/a.png" group-title="Ulusal",Kanal A\nhttps://media.example/a.m3u8\n#EXTINF:-1,Kanal B\n#EXTGRP:Spor\nhttps://media.example/b.m3u8';
test('published GitHub list is the initial default',async()=>{
  const {store}=fixture();const data=await store.load();assert.equal(data.source,'github');assert.equal(data.channels[0].name,'GitHub');
});
test('M3U names, attributes, category and relative logo survive',()=>{
  const {store}=fixture();const data=store.parseList(m3u,'https://lists.example/folder/list.m3u');
  assert.equal(data.channels.length,2);assert.equal(data.channels[0].name,'Kanal A');
  assert.equal(data.channels[0].logo,'https://lists.example/logos/a.png');assert.equal(data.channels[1].group,'Spor');
});
test('quotes containing commas do not change the channel title',()=>{
  const {store}=fixture();const data=store.parseList('#EXTM3U\n#EXTINF:-1 group-title="Haber, Türkiye",Ad, virgüllü\nhttps://media.example/a.m3u8','https://lists.example/a');
  assert.equal(data.channels[0].name,'Ad, virgüllü');assert.equal(data.channels[0].group,'Haber, Türkiye');
});
test('M3U trims BOM and skips bad streams without discarding valid channels',()=>{
  const {store}=fixture();const data=store.parseList('\ufeff#EXTM3U\n#EXTINF:-1 tvg-logo="javascript:bad",Güvenli\nhttps://media.example/live\n#EXTINF:-1,Geçersiz\njavascript:alert(1)','https://lists.example');
  assert.equal(data.channels.length,1);assert.equal(data.channels[0].logo,'');assert.equal(data.skipped,1);
});
test('HTML, HLS segment playlists, HLS variant playlists and empty JSON are rejected',()=>{
  const {store}=fixture();
  for(const text of ['<!doctype html><title>Web player</title>','#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6,\nsegment.ts','#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=123\nlive.m3u8','{"channels":[]}']){
    assert.throws(()=>store.parseList(text,'https://lists.example'));
  }
});
test('JSON array and channels object are accepted',()=>{
  const {store}=fixture();const c=[{name:'A',url:'https://media.example/a'}];
  assert.equal(store.parseList(JSON.stringify(c),'https://lists.example').channels.length,1);
  assert.equal(store.parseList(JSON.stringify({channels:c}),'https://lists.example').format,'json');
});
test('checking does not change source or existing local channels',async()=>{
  const {store,state,values}=fixture();store.save({channels:[{name:'Yerel',url:'https://media.example/local'}]});
  const before=JSON.stringify([...values]);state.text=m3u;await store.testSource('https://lists.example/list.php');
  assert.equal(JSON.stringify([...values]),before);
});
test('failed save preserves previous local data and mode',async()=>{
  const {store,state,values}=fixture();store.save({channels:[{name:'Yerel',url:'https://media.example/local'}]});
  const before=JSON.stringify([...values]);state.text='<html>Not a list</html>';
  await assert.rejects(store.setSource('https://lists.example/list.php'));
  assert.equal(JSON.stringify([...values]),before);
});
test('saved remote source takes priority over old local list',async()=>{
  const {store,state,values}=fixture();store.save({channels:[{name:'Yerel',url:'https://media.example/local'}]});
  state.text=m3u;await store.setSource('https://lists.example/list.php');
  assert.equal(store.describe().mode,'remote');assert.equal((await store.load()).channels.length,2);
  assert.ok(values.has(store.key),'old local data remains');
});
test('outage uses cached last working remote list and is labelled stale',async()=>{
  const {store,state}=fixture();state.text=m3u;await store.setSource('https://lists.example/list.php');state.fail=true;
  const data=await store.load();assert.equal(data.stale,true);assert.equal(data.channels[0].name,'Kanal A');assert.equal(store.describe().mode,'remote');
});
test('unchanged remote reads do not cause storage-event loops',async()=>{
  const {store,state}=fixture();state.text=m3u;await store.setSource('https://lists.example/list.php');const before=state.writes;
  await store.load();await store.load();assert.equal(state.writes,before);
});
test('returning to GitHub does not delete local channels',async()=>{
  const {store,state,values}=fixture();store.save({channels:[{name:'Yerel',url:'https://media.example/local'}]});
  await store.useGitHub();assert.equal(store.describe().mode,'github');assert.ok(values.has(store.key));assert.equal((await store.load()).source,'github');
});
test('failed return to GitHub keeps active remote source',async()=>{
  const {store,state,values}=fixture();state.text=m3u;await store.setSource('https://lists.example/list.php');
  const before=values.get(store.sourceKey);state.fail=true;await assert.rejects(store.useGitHub());assert.equal(values.get(store.sourceKey),before);
});
test('HTTP source, unsafe protocols and URL credentials are rejected on HTTPS page',()=>{
  const {store}=fixture();
  for(const address of ['http://lists.example/list.m3u','javascript:alert(1)','https://user:pass@lists.example/a'])assert.throws(()=>store.sourceUrl(address));
  assert.equal(store.sourceUrl(' https://github.com/owner/repo/blob/main/channels.json '),'https://raw.githubusercontent.com/owner/repo/main/channels.json');
});
test('HTTP redirects cannot replace an active source',async()=>{
  const {store,state,values}=fixture();const before=JSON.stringify([...values]);
  state.text=m3u;state.finalUrl='http://lists.example/list.m3u';
  await assert.rejects(store.setSource('https://lists.example/list.php'));
  assert.equal(JSON.stringify([...values]),before);
});
test('editing local channels switches off the remote selection without changing the URL data',async()=>{
  const {store,state}=fixture();state.text=m3u;await store.setSource('https://lists.example/list.php');
  store.save({channels:[{name:'Düzenlenen',url:'https://media.example/edit'}]});
  assert.equal(store.describe().mode,'local');assert.equal((await store.load()).channels[0].name,'Düzenlenen');
});
test('source storage failures do not partially overwrite the previous selection',async()=>{
  const {store,state,context,values}=fixture();store.save({channels:[{name:'Yerel',url:'https://media.example/local'}]});
  const before=JSON.stringify([...values]);state.text=m3u;
  context.localStorage.setItem=()=>{throw new Error('Quota exceeded')};
  await assert.rejects(store.setSource('https://lists.example/list.php'));assert.equal(JSON.stringify([...values]),before);
});
test('web scripts compile',()=>{
  for(const name of ['channel-store.js','settings.js','app.js','admin.js'])new vm.Script(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),{filename:name});
});

test('a downloaded M3U can be imported locally when CORS blocks remote fetching',async()=>{
  const {store,state}=fixture();
  store.save(store.parseList(m3u,'https://lists.example/playlist.php'));
  state.fail=true;
  const result=await store.load();
  assert.equal(result.local,true);assert.equal(result.channels.length,2);assert.equal(result.channels[0].name,'Kanal A');
});
