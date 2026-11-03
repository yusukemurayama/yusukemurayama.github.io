(() => {
  'use strict';
  const languages = {
    ja: '日本語', en: 'English', es: 'Español', fr: 'Français',
    ru: 'Русский', 'zh-CN': '简体中文', ar: 'العربية', uk: 'Українська'
  };
  const translated = location.hostname.endsWith('.translate.goog');
  const revision = new URL(document.currentScript.src).searchParams.get('v');
  const params = new URLSearchParams(location.search);
  const requested = translated
    ? params.get('_x_tr_tl') || params.get('lang') || document.documentElement.lang
    : 'ja';
  const base = requested.toLowerCase().split('-')[0];
  const current = Object.keys(languages).find(code => code.split('-')[0] === base) || 'ja';
  let articleId;

  function originalPage() {
    const original = new URL(location.pathname + location.search + location.hash,
      translated ? 'https://yusukemurayama.github.io' : location.origin);
    for (const key of [...original.searchParams.keys()]) {
      if (key === 'mt' || key === 'lang' || key.startsWith('_x_tr_')) original.searchParams.delete(key);
    }
    if (document.querySelector('#detail[open]') && articleId) original.searchParams.set('post', articleId);
    return original;
  }

  function changeLanguage(code) {
    const original = originalPage();
    if (code === 'ja') {
      location.assign(original.href);
      return;
    }
    const target = new URL('https://translate.google.com/translate');
    if (revision) original.searchParams.set('mt', revision);
    original.searchParams.set('lang', code);
    target.search = new URLSearchParams({sl: 'ja', tl: code, u: original.href});
    location.assign(target.href);
  }

  function selector() {
    const control = document.createElement('label');
    control.className = 'language-control notranslate';
    control.translate = false;
    const face = document.createElement('span');
    face.setAttribute('aria-hidden', 'true');
    face.textContent = '🌐︎ ' + current.split('-')[0].toUpperCase() + ' ▾';
    const select = document.createElement('select');
    select.setAttribute('aria-label', '表示言語を選択 / Select language');
    for (const [code, name] of Object.entries(languages)) {
      const option = new Option(name, code);
      option.lang = code;
      select.add(option);
    }
    select.value = current;
    select.addEventListener('change', () => changeLanguage(select.value));
    window.addEventListener('pageshow', () => { select.value = current; });
    control.append(face, select);
    return control;
  }
  const navigation = document.querySelector('.site-header nav');
  navigation.after(selector());
  const close = document.querySelector('#detail #close');
  if (close) close.after(selector());
  document.addEventListener('archive:open', event => {
    articleId = event.detail.id;

  });
})();
