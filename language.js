(() => {
  'use strict';
  const languages = {
    ja: '日本語', en: 'English', es: 'Español', fr: 'Français',
    ru: 'Русский', 'zh-CN': '简体中文', ar: 'العربية', uk: 'Українська'
  };
  const originalHosts = {
    'yusukemurayama-github-io.translate.goog': 'yusukemurayama.github.io',
    'murayamayusuke-com.translate.goog': 'murayamayusuke.com',
    'www-murayamayusuke-com.translate.goog': 'www.murayamayusuke.com'
  };
  const translated = Object.hasOwn(originalHosts, location.hostname);
  const params = new URLSearchParams(location.search);
  const current = translated ? params.get('_x_tr_tl') || params.get('mt') : 'ja';
  let articleId;

  function changeLanguage(code) {
    const original = new URL(location.href);
    if (translated) original.hostname = originalHosts[location.hostname];
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
    const bar = document.createElement('div');
    bar.className = 'language-bar notranslate';
    bar.translate = false;
    const label = document.createElement('label');
    label.append('Language / 言語 ');
    const select = document.createElement('select');
    for (const [code, name] of Object.entries(languages)) {
      const option = new Option(name, code);
      option.lang = code;
      select.add(option);
    }
    select.value = Object.hasOwn(languages, current) ? current : 'ja';
    select.addEventListener('change', () => changeLanguage(select.value));
    // A browser may restore the control's last selection when navigating back.
    window.addEventListener('pageshow', () => { select.value = Object.hasOwn(languages, current) ? current : 'ja'; });
    label.append(select);
    bar.append(label);
    return bar;
  }
  document.querySelector('.site-header').after(selector());
  const date = document.querySelector('#detail-date');
  if (date) date.before(selector());
  document.addEventListener('archive:open', event => { articleId = event.detail.id; });
})();
