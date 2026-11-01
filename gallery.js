(()=>{
const viewer=document.getElementById('photo-viewer');
if(!viewer)return;
let opener;
document.querySelectorAll('.field-photo').forEach(button=>button.addEventListener('click',()=>{
 opener=button;
 const source=button.querySelector('img');
 const large=document.getElementById('photo-large');
 large.src=button.dataset.photo;large.alt=source.alt;
 document.getElementById('photo-caption').textContent=source.alt;
 viewer.showModal();
}));
document.getElementById('photo-close').addEventListener('click',()=>viewer.close());
viewer.addEventListener('close',()=>opener?.focus());
viewer.addEventListener('click',event=>{if(event.target!==viewer)return;const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();});
})();
