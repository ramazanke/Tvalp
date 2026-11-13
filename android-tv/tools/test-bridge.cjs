const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app/src/main/assets/native-player.js'), 'utf8');

function fixture(isTv) {
  const nodes = new Map(), sent = [], keys = [], classes = new Set();
  function element(id) {
    const item = { hidden: false, textContent: '', children: [], attrs: {},
      classList: {add(v){classes.add(v)},remove(v){classes.delete(v)}},
      setAttribute(k,v){this.attrs[k]=v}, append(...items){this.children.push(...items)},
      pause(){},load(){},removeAttribute(){} };
    Object.defineProperty(item,'id',{get(){return this._id},set(v){this._id=v;nodes.set(v,this)}});
    if(id)item.id=id;
    return item;
  }
  ['video','welcome','channelName','categoryLabel','status','closeCategories','closeChannels'].forEach(element);
  const body=element('body'), head=element('head');
  const document = {body,head,getElementById:id=>nodes.get(id)||null,createElement:()=>element(),
    addEventListener(){},dispatchEvent:event=>keys.push(event.key)};
  const channels=[{name:'Ulusal 1',url:'http://example.com/vavo.php?ID=1'},
    {name:'Ulusal 2',url:'https://example.com/2.m3u8'}];
  const context = {document,location:{origin:'https://ramazanke.github.io',pathname:'/Tvalp/'},
    AlpicaNative:{postMessage:raw=>sent.push(JSON.parse(raw))},
    AlpicaDevice:{isTv}, channels:()=>channels, play(){},tryPlay(){},wake(){},
    fullscreen(){},isFullscreen(){return false},openingFullscreenPending:true,
    hls:null,playToken:0,channelIndex:0,groupIndex:0,groups:[{name:'Ulusal'}],
    playbackFailed:false,sourceReady:false,usingNative:false,menu:null,
    showMenu(type){context.menu=type},closeMenu(){context.menu=null},
    failPlayback(){context.playbackFailed=true},setTimeout(){return 1},clearTimeout(){},
    KeyboardEvent:function(type,options){Object.assign(this,{type},options)}};
  context.window=context;
  vm.createContext(context);vm.runInContext(source,context);
  return {context,nodes,sent,keys,classes};
}
const tv=fixture(true);
assert.equal(tv.nodes.has('nativeTouchControls'),false,'TV must not show mobile buttons');
assert.equal(tv.classes.has('native-mobile'),false);
assert.equal(tv.sent[0].action,'ready');
assert.equal(tv.sent[1].url,'http://example.com/vavo.php?ID=1','Native playback preserves HTTP PHP URL');
tv.context.AlpicaAndroid.key('ArrowRight');
assert.equal(tv.context.menu,'channels','Right opens the channel list');
tv.context.AlpicaAndroid.key('ArrowLeft');
assert.equal(tv.context.menu,'categories','Left opens groups');
tv.context.AlpicaAndroid.back();
tv.context.AlpicaAndroid.key('ArrowUp');
assert.equal(tv.context.channelIndex,1);
assert.equal(tv.context.menu,null);
tv.context.AlpicaAndroid.key('ArrowDown');
assert.equal(tv.context.channelIndex,0);
tv.context.AlpicaAndroid.key('Enter');
assert.equal(tv.context.menu,'categories');
assert.equal(source.includes('tvChannelBar'),false,'Bottom channel bar is removed');
tv.context.menu='categories';
assert.equal(tv.context.AlpicaAndroid.back(),true);
assert.equal(tv.context.menu,null);
assert.equal(tv.context.AlpicaAndroid.back(),false);

const phone=fixture(false);
assert.ok(phone.nodes.has('nativeTouchControls'));
assert.ok(phone.classes.has('native-mobile'));
phone.nodes.get('nativeCategories').onclick();
assert.equal(phone.context.menu,'categories','Touch categories opens menu');
phone.nodes.get('nativeChannels').onclick();
assert.equal(phone.context.menu,'channels','Touch channel list opens menu');
assert.equal(phone.context.AlpicaAndroid.back(),true);
phone.nodes.get('nativeNext').onclick();
assert.equal(phone.context.channelIndex,1);
assert.equal(phone.sent.at(-1).url,'https://example.com/2.m3u8');
phone.nodes.get('nativeNext').onclick();
assert.equal(phone.context.channelIndex,0,'Next channel wraps');
phone.nodes.get('nativePrevious').onclick();
assert.equal(phone.context.channelIndex,1,'Previous channel wraps');
phone.nodes.get('nativePause').onclick();
assert.equal(phone.sent.at(-1).action,'togglePause');
phone.context.AlpicaAndroid.state(phone.context.playToken,'paused','Duraklatıldı');
assert.equal(phone.nodes.get('nativePause').attrs['aria-label'],'Yayını oynat');
phone.context.AlpicaAndroid.state(phone.context.playToken,'playing','CANLI');
assert.equal(phone.nodes.get('nativePause').attrs['aria-label'],'Yayını duraklat');
phone.context.AlpicaAndroid.state(phone.context.playToken-1,'error','Old error');
assert.equal(phone.context.playbackFailed,false,'Late errors cannot affect current channel');
phone.context.AlpicaAndroid.digit(1);
phone.context.AlpicaAndroid.key('Enter');
assert.equal(phone.context.channelIndex,0,'Number keys continue to work on mobile too');
console.log('TV/mobile bridge checks passed: mode detection, touch controls, remote controls, menus, channel wrap, pause, URL preservation and stale events.');
