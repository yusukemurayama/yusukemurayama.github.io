(()=>{
const posts=window.ARCHIVE_POSTS;const $=id=>document.getElementById(id);
const form=$('filters'),search=$('search'),year=$('year'),type=$('type'),theme=$('theme'),results=$('results'),more=$('more'),dialog=$('detail');
let limit=24;const params=new URLSearchParams(location.search);
const legacyTypes={"講演・授業": "講演・講義", "対談・イベント・展示": "講演・講義", "出演・インタビュー": "メディア出演", "書評・メディア紹介": "お知らせ", "執筆・寄稿": "執筆・配信", "動画・音声配信": "執筆・配信", "映像制作・取材協力": "執筆・配信", "著書・出版": "お知らせ", "受賞": "お知らせ", "賞の候補・選考": "お知らせ", "活動のお知らせ": "お知らせ", "講演・イベント": "講演・講義", "出演・メディア掲載": "メディア出演", "動画・音声": "執筆・配信", "著書・受賞": "お知らせ", "記事": "執筆・配信", "出演": "メディア出演", "イベント": "講演・講義"};
if(legacyTypes[params.get('type')])params.set('type',legacyTypes[params.get('type')]);
const legacyThemes={"移民・難民と国境": "移民・難民", "ウクライナと戦争": "戦争・人道危機", "中東・シリア・ガザ": "戦争・人道危機", "開発・国際協力": "開発・援助", "取材・メディア": "ジャーナリズム", "アフリカ・開発": "開発・援助", "アフリカと開発": "開発・援助", "戦争・紛争": "戦争・人道危機", "政治・経済・社会": "そのほか", "米国と社会の分断": "そのほか", "子ども・教育・人権": "そのほか", "国際経済・資源・食料": "そのほか", "感染症と社会": "そのほか", "著作・受賞": "そのほか", "活動・キャリア": "そのほか"};
if(legacyThemes[params.get('theme')])params.set('theme',legacyThemes[params.get('theme')]);
if(params.get('type')==='media'){const option=document.createElement('option');option.value='media';option.textContent='メディア出演・寄稿';type.append(option);}
for(const [el,key] of [[search,'q'],[year,'year'],[type,'type'],[theme,'theme']]){const value=params.get(key);if(value)el.value=value;}
function text(tag,value,className){const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e;}
const labelTones={'執筆・配信':'ink','メディア出演':'plum','講演・講義':'sage','お知らせ':'sand','移民・難民':'ink','戦争・人道危機':'rose','開発・援助':'sage','ジャーナリズム':'plum','そのほか':'sand'};
function render(){const q=search.value.trim().normalize('NFKC').toLocaleLowerCase();const filtered=posts.filter(p=>(!year.value||p.year===year.value)&&(!type.value||(type.value==='media'?(p.categories.includes('メディア出演')||(p.detailedCategories||[]).includes('執筆・寄稿')):p.categories.includes(type.value)))&&(!theme.value||(theme.value==='テーマ情報なし'?!p.topics.length:p.topics.includes(theme.value)))&&(!q||(p.title+' '+p.text+' '+p.categories.join(' ')+' '+p.topics.join(' ')+' '+(p.detailedCategories||[]).join(' ')+' '+(p.detailedTopics||[]).join(' ')).normalize('NFKC').toLocaleLowerCase().includes(q)));results.replaceChildren();$('count').textContent=`${filtered.length}件 / 全${posts.length}件`;
for(const p of filtered.slice(0,limit)){const row=text('article','','archive-row');const date=text('time',p.date.replaceAll('-','.'));date.dateTime=p.date;row.append(date);const mid=document.createElement('div'),h=document.createElement('h2'),button=text('button',p.title);button.type='button';button.addEventListener('click',()=>openPost(p,button));h.append(button);mid.append(h);const tags=text('div','','tags');for(const tag of [p.categories[0],...p.topics].filter(Boolean).slice(0,3))tags.append(text('span',tag,'label-'+(labelTones[tag]||'sand')));mid.append(tags);row.append(mid);const featured = p.featuredImage;
if (featured) {
  const preview = document.createElement('button');
  preview.type = 'button';
  preview.className = 'archive-preview';
  preview.setAttribute('aria-label', p.title + '（写真付きの記事を開く）');
  const image = document.createElement('img');
  image.src = featured.thumbnail;
  image.alt = '';
  image.loading = 'lazy';
  preview.append(image);
  preview.addEventListener('click', () => openPost(p, preview));
  row.classList.add('with-photo');
  row.insertBefore(preview, mid);
}
results.append(row);}
if(!filtered.length)results.append(text('p','一致する記録がありません。キーワードや条件を変えてお試しください。','empty'));more.hidden=filtered.length<=limit;more.style.display=more.hidden?'none':'';
}
let opener;
function openPost(p,button){opener=button;$('detail-date').textContent=p.date;$('detail-title').textContent=p.title;window.archiveMedia.render($('detail-body'),p);const links=$('detail-links');links.replaceChildren();if(p.links.length){links.append(text('h3','本文内のリンク'));p.links.forEach((url,i)=>{const a=text('a',`${i+1}. ${url}`);a.href=url;a.target='_blank';a.rel='noopener';links.append(a);});}dialog.showModal();dialog.scrollTop=0;}
$('close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{if(opener)opener.focus();});
form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',()=>{limit=24;render();});form.addEventListener('change',()=>{limit=24;render();});form.addEventListener('reset',()=>setTimeout(()=>{limit=24;render();},0));more.addEventListener('click',()=>{limit+=24;render();});render();const selected=posts.find(p=>p.id===params.get('post'));if(selected)openPost(selected);
})();
