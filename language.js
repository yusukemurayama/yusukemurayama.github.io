(()=>{
'use strict';
const languages=[["ja", "日本語", "", "", "", ""], ["en", "English", "This is an automatic translation for reference only. Please refer to the Japanese original for accurate information.", "Open Google Translate", "Japanese original", "This page is in Japanese. Translation opens on an external site; article content and embedded forms may not translate correctly."], ["es", "Español", "Esta traducción automática se ofrece solo como referencia. Para obtener información precisa, consulte el original en japonés.", "Abrir Google Traductor", "Original en japonés", "Esta página está en japonés. La traducción se abre en un sitio externo; el contenido de los artículos y los formularios incrustados pueden no traducirse correctamente."], ["fr", "Français", "Cette traduction automatique est fournie à titre indicatif. Pour des informations exactes, veuillez consulter la version originale japonaise.", "Ouvrir Google Traduction", "Original japonais", "Cette page est en japonais. La traduction s’ouvre sur un site externe ; les articles et les formulaires intégrés peuvent ne pas être traduits correctement."], ["ru", "Русский", "Этот автоматический перевод предоставлен только для справки. Для получения точной информации обратитесь к японскому оригиналу.", "Открыть Google Переводчик", "Японский оригинал", "Эта страница на японском языке. Перевод откроется на внешнем сайте; статьи и встроенные формы могут переводиться некорректно."], ["zh-CN", "简体中文", "此自动翻译仅供参考。准确内容请以日语原文为准。", "打开 Google 翻译", "日语原文", "本页为日语。翻译将在外部网站打开；文章内容和嵌入式表单可能无法正确翻译。"], ["ar", "العربية", "هذه ترجمة آلية للاستئناس فقط. يُرجى الرجوع إلى النص الياباني الأصلي للحصول على معلومات دقيقة.", "فتح ترجمة Google", "النص الياباني الأصلي", "هذه الصفحة باللغة اليابانية. ستُفتح الترجمة على موقع خارجي؛ وقد لا تُترجم المقالات والنماذج المضمّنة بشكل صحيح."], ["uk", "Українська", "Це автоматичний переклад лише для довідки. Щоб отримати точну інформацію, зверніться до японського оригіналу.", "Відкрити Google Перекладач", "Японський оригінал", "Ця сторінка японською мовою. Переклад відкриється на зовнішньому сайті; статті та вбудовані форми можуть перекладатися некоректно."]];
const allowed=new Set(languages.map(row=>row[0]));
const params=new URL(location.href).searchParams;
const marker=params.get('mt');
let translationSource=allowed.has(marker)&&marker!=='ja';
let language=translationSource?marker:(allowed.has(params.get('lang'))?params.get('lang'):'ja');
let article=null;
const views=[];
function sourceURL(isArticle){
 const url=new URL(location.href);
 // Resolve the Japanese original even when Google serves the page on its proxy.
 const originalHosts={'yusukemurayama-github-io.translate.goog':'yusukemurayama.github.io','murayamayusuke-com.translate.goog':'murayamayusuke.com','www-murayamayusuke-com.translate.goog':'www.murayamayusuke.com'};
 if(originalHosts[url.hostname])url.hostname=originalHosts[url.hostname];
 for(const key of [...url.searchParams.keys()])if(key==='lang'||key==='mt'||key.startsWith('_x_tr_'))url.searchParams.delete(key);
 if(isArticle&&article)url.searchParams.set('post',article);
 return url;
}
function choose(value){
 language=allowed.has(value)?value:'ja';
 if(translationSource&&language==='ja'){location.assign(sourceURL(!!document.querySelector('#detail[open]')).href);return;}
 translationSource=false;
 const url=new URL(location.href);url.searchParams.delete('mt');if(language==='ja')url.searchParams.delete('lang');else url.searchParams.set('lang',language);
 history.replaceState(history.state,'',url);
 refresh();
}
function refresh(){
 const row=languages.find(row=>row[0]===language);
 for(const view of views){
  view.select.value=language;view.notice.hidden=language==='ja';
  view.notice.lang=language;view.notice.dir=language==='ar'?'rtl':'ltr';
  view.message.textContent=row[2];view.status.textContent=translationSource?'':row[5];view.status.hidden=translationSource;view.external.hidden=translationSource;
  const original=sourceURL(view.isArticle);view.original.href=original.href;view.original.textContent=row[4]+' ↗';
  const translationURL=new URL(original);translationURL.searchParams.set('mt',language);
  const external=new URL('https://translate.google.com/translate');external.searchParams.set('sl','ja');external.searchParams.set('tl',language);external.searchParams.set('u',translationURL.href);
  view.external.href=external.href;view.external.textContent=row[3]+' ↗';
 }
}
function createView(isArticle){
 const bar=document.createElement('div');bar.className='language-bar notranslate';bar.translate=false;
 const label=document.createElement('label');label.append('Language / 言語 ');
 const select=document.createElement('select');select.setAttribute('aria-label','Language / 言語');
 for(const [code,name] of languages){const option=document.createElement('option');option.value=code;option.textContent=name;option.lang=code;select.append(option);}
 select.addEventListener('change',()=>choose(select.value));label.append(select);bar.append(label);
 const notice=document.createElement('aside');notice.className='translation-notice notranslate';notice.translate=false;notice.hidden=true;notice.setAttribute('aria-live','polite');
 const message=document.createElement('p'),status=document.createElement('p'),links=document.createElement('div');status.className='translation-status';
 const external=document.createElement('a');external.target='_blank';external.rel='noopener noreferrer';
 const original=document.createElement('a');original.rel='noopener noreferrer';
 links.append(external,original);notice.append(message,status,links);
 views.push({select,notice,message,status,external,original,isArticle});return {bar,notice};
}
const header=document.querySelector('.site-header');if(!header)return;
const main=createView(false);header.after(main.bar,main.notice);
const dialog=document.querySelector('#detail');
if(dialog){const detail=createView(true);dialog.querySelector('#detail-date').before(detail.bar,detail.notice);}
document.addEventListener('archive:open',event=>{article=String(event.detail.id);refresh();});
refresh();
})();
