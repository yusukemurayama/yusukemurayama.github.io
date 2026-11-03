(() => {
  'use strict';
  const id = 'G-V6HM7RVPLL';
  const pages = { '/': '/', '/index.html': '/', '/archive.html': '/archive.html',
    '/contact/': '/contact/', '/contact/index.html': '/contact/' };
  const path = pages[location.pathname];
  if (!path) return;

  const params = new URLSearchParams(location.search);
  const language = location.hostname.endsWith('.translate.goog')
    ? (params.get('_x_tr_tl') || params.get('lang') || document.documentElement.lang)
    : 'ja';
  const code = language.toLowerCase().split('-')[0];
  const page = new URL(path, 'https://murayamayusuke.com');
  const base = {
    page_location: page.href,
    page_referrer: document.referrer ? new URL(document.referrer).origin : '',
    site_language: ['ja','en','es','fr','ru','zh','ar','uk'].includes(code) ? code : 'unknown'
  };

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', id, { ...base, send_page_view: false, allow_google_signals: false,
    allow_ad_personalization_signals: false });

  function view(post) {
    const url = new URL(page);
    if (post) url.searchParams.set('post', post.id);
    gtag('event', 'page_view', { ...base, send_to: id, page_location: url.href,
      page_title: post ? post.title : document.title });
  }

  let initialArticleOpened = false;
  document.addEventListener('archive:open', event => {
    const post = window.ARCHIVE_POSTS.find(item => item.id === event.detail.id);
    if (post) {
      initialArticleOpened = true;
      view(post);
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    if (!initialArticleOpened) view();
  }, { once: true });

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.append(tag);
})();
