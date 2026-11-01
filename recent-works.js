for (const list of document.querySelectorAll('.work-log ol[data-home-section]')) {
  for (const post of window.HOME_SELECTION[list.dataset.homeSection]) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = 'archive.html?post=' + encodeURIComponent(post.id);
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
