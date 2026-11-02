(() => {
  'use strict';
  const languages = {
    ja: '日本語', en: 'English', es: 'Español', fr: 'Français',
    ru: 'Русский', 'zh-CN': '简体中文', ar: 'العربية', uk: 'Українська'
  };
  const translated = location.hostname.endsWith('.translate.goog');
  const revision = new URL(document.currentScript.src).searchParams.get('v');
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
  function originalLink() {
    const link = document.createElement('a');
    link.className = 'language-original notranslate';
    link.translate = false;
    link.lang = 'ja';
    link.textContent = '日本語原文 ↗';
    link.href = originalPage().href;
    // The translation proxy may rewrite href. Use the original host on normal activation.
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      location.assign(originalPage().href);
    });
    return link;
  }

  const navigation = document.querySelector('.site-header nav');
  navigation.after(translated ? originalLink() : selector());
  const close = document.querySelector('#detail #close');
  if (close) close.after(translated ? originalLink() : selector());
  document.addEventListener('archive:open', event => {
    articleId = event.detail.id;
    if (translated) {
      const url = originalPage();
      url.searchParams.set('post', articleId);
      document.querySelector('#detail .language-original').href = url.href;
    }
  });
})();
