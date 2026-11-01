const shortHeadlines = {
  '1973': '日本テレビ系列「真相報道　バンキシャ！」で山本美香さん銃撃事件の特集を放送',
  '2082': 'TBSラジオ「荻上チキ・Session」にアフリカから8週連続出演'
};
for (const list of document.querySelectorAll('.work-log ol[data-category]')) {
  const archive = window.ARCHIVE_POSTS;
  const posts = list.dataset.selected
    ? list.dataset.selected.split(',').map(id => archive.find(post => String(post.id) === id)).filter(Boolean)
    : archive.filter(post => post.categories.includes(list.dataset.category) && String(post.id) !== list.dataset.featured);
  posts.sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id));
  for (const post of posts.slice(0, 5)) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = 'archive.html?post=' + encodeURIComponent(post.id);
    const date = document.createElement('time');
    date.dateTime = post.date;
    date.textContent = post.date.replaceAll('-', '.');
    const title = document.createElement('span');
    title.textContent = shortHeadlines[post.id] ?? post.title;
    if (shortHeadlines[post.id]) {
      item.classList.add('compact-headline');
      link.title = title.textContent;
    }
    link.append(date, title);
    item.append(link);
    list.append(item);
  }
}
