'use strict';
const $=id=>document.getElementById(id);
const example='https://sultanios.alwaysdata.net/vavoTV.php?ID=Turkey';
function message(text){$('message').textContent=text;}
function renderSource(){
  const state=ChannelStore.describe();
  $('activeSource').textContent=state.mode==='remote' ? 'Etkin kaynak: Eklediğin liste adresi · son kayıtta '+state.count+' kanal' :
    state.mode==='local' ? 'Etkin kaynak: Bu tarayıcıdaki yerel kanallar' : 'Etkin kaynak: GitHub channels.json listesi';
  if(state.mode==='remote')$('sourceUrl').value=state.url;
}
function busy(value){document.querySelectorAll('button,input').forEach(el=>el.disabled=value);$('sourceForm').setAttribute('aria-busy',String(value));}
function resultText(data){
  const groups=new Set(data.channels.map(c=>c.group)).size;
  const http=data.channels.filter(c=>c.url.startsWith('http:')).length;
  return data.channels.length+' kanal, '+groups+' kategori bulundu.'+
    (data.skipped?' '+data.skipped+' geçersiz kayıt atlandı.':'')+
    (http?' '+http+' yayın HTTP kullanıyor; HTML oynatmada engellenebilir.':'');
}
$('sourceForm').onsubmit=async event=>{
  event.preventDefault();
  const action=event.submitter?.value || 'test';
  busy(true);message('Liste kontrol ediliyor…');
  try{
    const value=$('sourceUrl').value.trim();
    const data=action==='test'?await ChannelStore.testSource(value):await ChannelStore.setSource(value);
    if(action==='test')message(resultText(data)+' Kontrol başarılı; kaydetmek için Kaydet ve kullan düğmesine bas.');
    else {renderSource();message(resultText(data)+' Kaynak bu tarayıcıya kaydedildi.');if(action==='watch')location.href='index.html';}
  }catch(error){message(error.message+' Önceki kaynak korunuyor.');}
  finally{busy(false);}
};
$('exampleSource').onclick=()=>{$('sourceUrl').value=example;$('sourceUrl').focus();message('Örnek adres dolduruldu. Bağlantıyı kontrol et düğmesiyle doğrulayabilirsin.');};
$('githubSource').onclick=async()=>{
  busy(true);message('GitHub listesi kontrol ediliyor…');
  try{const data=await ChannelStore.useGitHub();$('sourceUrl').value='';renderSource();message(data.channels.length+' kanallı GitHub listesi seçildi. Yerel kanalların korundu.');}
  catch(error){message(error.message+' Önceki kaynak korunuyor.');}finally{busy(false);}
};
renderSource();
