for (const list of document.querySelectorAll('.work-log ol[data-home-section]')) {
  const selected = window.HOME_SELECTION[list.dataset.homeSection];
  // Sort a copy so equal dates retain the CMS order and other consumers are unaffected.
  const posts = [...selected].sort((a, b) => {
    const first = Date.parse(a.date);
    const second = Date.parse(b.date);
    if (!Number.isFinite(first)) return Number.isFinite(second) ? 1 : 0;
    if (!Number.isFinite(second)) return -1;
    return second - first;
  });
  for (const post of posts) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    // Google Translate sets document.baseURI to the Japanese site.
    const article = new URL('archive.html', location.href);
    article.searchParams.set('post', post.id);
    if (location.hostname.endsWith('.translate.goog')) {
      for (const [key, value] of new URLSearchParams(location.search)) {
        if (key.startsWith('_x_tr_') || key === 'mt') article.searchParams.set(key, value);
      }
    }
    link.href = article.href;
    const date = document.createElement('time');
    date.dateTime = post.date;
    date.textContent = post.date.replaceAll('-', '.');
    const title = document.createElement('span');
    title.textContent = post.title;
    if (post.compact) {
      item.classList.add('compact-headline');
      link.title = post.title;
    }
    link.append(date, title);
    item.append(link);
    list.append(item);
  }
}
