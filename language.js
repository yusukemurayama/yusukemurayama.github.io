(() => {
  'use strict';
  const languages = {
    ja: '日本語', en: 'English', es: 'Español', fr: 'Français',
    ru: 'Русский', 'zh-CN': '简体中文', ar: 'العربية', uk: 'Українська'
  };
  // Google serves translated documents (including article dialogs) on this origin family.
  if (location.hostname.endsWith('.translate.goog') || location.hostname === 'translate.goog') return;

  let articleId;

  function changeLanguage(code) {
    const original = new URL(location.href);
    for (const key of [...original.searchParams.keys()]) {
      if (key === 'mt' || key === 'lang' || key.startsWith('_x_tr_')) original.searchParams.delete(key);
    }
    if (document.querySelector('#detail[open]') && articleId) original.searchParams.set('post', articleId);
    else original.searchParams.delete('post');
    if (code === 'ja') {
      location.assign(original.href);
      return;
    }
    const target = new URL('https://translate.google.com/translate');
    target.search = new URLSearchParams({sl: 'ja', tl: code, u: original.href});
    location.assign(target.href);
  }

  function selector() {
    const control = document.createElement('label');
    control.className = 'language-control notranslate';
    control.translate = false;
    const face = document.createElement('span');
    face.setAttribute('aria-hidden', 'true');
    face.textContent = '🌐︎ JA ▾';
    const select = document.createElement('select');
    select.setAttribute('aria-label', '表示言語を選択 / Select language');
    for (const [code, name] of Object.entries(languages)) {
      const option = new Option(name, code);
      option.lang = code;
      select.add(option);
    }
    select.addEventListener('change', () => changeLanguage(select.value));
    window.addEventListener('pageshow', () => { select.value = 'ja'; });
    control.append(face, select);
    return control;
  }
  document.querySelector('.site-header nav').before(selector());
  const close = document.querySelector('#detail #close');
  if (close) close.after(selector());
  document.addEventListener('archive:open', event => { articleId = event.detail.id; });
})();
