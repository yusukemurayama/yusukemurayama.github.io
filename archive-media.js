(() => {
  const urlPattern = /https?:\/\/[^\s<>"'「」【】（）]+/gi;
  const youtubeHosts = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com']);

  function videoId(raw) {
    let url;
    try { url = new URL(raw); } catch { return null; }
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const parts = url.pathname.split('/').filter(Boolean);
    let id;
    if (['youtu.be', 'www.youtu.be'].includes(url.hostname)) id = parts[0];
    else if (youtubeHosts.has(url.hostname)) {
      if (parts[0] === 'watch') id = url.searchParams.get('v');
      else if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) id = parts[1];
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  function videos(post) {
    const urls = [...(post.text.match(urlPattern) || []), ...post.links];
    return [...new Set(urls.map(url => videoId(url.replace(/[。、.,;:!?)）]+$/, ''))).filter(Boolean))];
  }

  function appendPhotos(container, body, photos) {
    let cursor = 0;
    for (const photo of photos) {
      if (photo.at < cursor || photo.at > body.length) continue;
      container.append(body.slice(cursor, photo.at));
      cursor = photo.at;
      const figure = document.createElement('figure');
      figure.className = 'archive-photo';
      const img = document.createElement('img');
      img.src = photo.src;
      img.width = photo.width;
      img.height = photo.height;
      img.alt = photo.alt;
      figure.append(img);
      if (photo.captionStart === cursor && photo.captionEnd <= body.length) {
        const caption = document.createElement('figcaption');
        caption.textContent = body.slice(cursor, photo.captionEnd);
        figure.append(caption);
        cursor = photo.captionEnd;
      }
      container.append(figure);
    }
    container.append(body.slice(cursor));
  }

  function render(container, post) {
    container.replaceChildren();
    const photos = window.ARCHIVE_PHOTOS?.[post.id] || [];
    appendPhotos(container, post.text, photos);
    if (!photos.length && !post.text) container.append('本文の記載はありません。元記事をご覧ください。');
    for (const id of videos(post)) {
      const link = document.createElement('a');
      link.className = 'archive-video';
      link.href = 'https://www.youtube.com/watch?v=' + id;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const img = document.createElement('img');
      img.alt = '';
      img.addEventListener('error', () => img.remove());
      img.addEventListener('load', () => {
        if (img.naturalWidth <= 120) img.remove();
      });
      img.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
      link.append(img, 'YouTubeで動画を見る ↗');
      container.append(link);
    }
  }
  window.archiveMedia = { render, videos };
})();
