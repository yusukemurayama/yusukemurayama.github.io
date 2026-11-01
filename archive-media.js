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
    const urls = [...(post.text.match(urlPattern) || []), ...(post.links || []), ...(post.bodyLinks || []).map(link => link.url)];
    return [...new Set(urls.map(url => videoId(url.replace(/[。、.,;:!?)）]+$/, ''))).filter(Boolean))];
  }

  function xStatus(raw) {
    let url;
    try { url = new URL(raw); } catch { return null; }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port ||
        !/^(?:(?:www|mobile|m)\.)?(?:x|twitter)\.com$/.test(url.hostname)) return null;
    const match = url.pathname.match(/^\/(?:([a-z0-9_]{1,15})\/status(?:es)?|i\/web\/status)\/(\d{1,20})(?:\/(?:photo|video)\/[1-9]\d*)?\/?$/i);
    if (!match) return null;
    const path = match[1] ? match[1] + '/status/' : 'i/web/status/';
    return { id: match[2], url: 'https://x.com/' + path + match[2] };
  }

  let widgetLoader;
  function xWidgets() {
    if (window.twttr?.widgets?.createTweet) return Promise.resolve(window.twttr.widgets);
    if (!widgetLoader) {
      widgetLoader = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.onload = () => {
          if (window.twttr?.ready) window.twttr.ready(api => resolve(api.widgets));
          else reject(new Error('X widgets unavailable'));
        };
        script.onerror = reject;
        document.head.append(script);
      });
    }
    return widgetLoader;
  }

  function appendXCard(container, status) {
    const card = document.createElement('div');
    card.className = 'archive-x-post';
    const host = document.createElement('div');
    const fallback = externalLink(status.url);
    fallback.textContent = 'Xで投稿を見る';
    card.append(host, fallback);
    container.append(card);
    xWidgets().then(widgets => {
      if (host.isConnected) return widgets.createTweet(status.id, host, {
        theme: 'dark', lang: 'ja', dnt: true, conversation: 'none'
      });
    }).catch(() => { /* The adjacent link also works when the widget is blocked. */ });
  }

  function safeUrl(value) {
    try { return ['https:', 'http:'].includes(new URL(value).protocol); }
    catch { return false; }
  }

  function externalLink(url) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function textSpans(body, links, videoIds) {
    const spans = links.filter(link => Number.isInteger(link.start) && link.start >= 0 &&
      link.text && body.startsWith(link.text, link.start))
      .map(link => ({ ...link, end: link.start + link.text.length }));
    for (const match of body.matchAll(/^[^\S\n]*(https?:\/\/[^\s]+)[^\S\n]*$/gm)) {
      const start = match.index, end = start + match[0].length;
      const id = videoId(match[1]);
      if (!videoIds.includes(id)) continue;
      const overlap = spans.filter(span => span.start < end && span.end > start);
      if (overlap.some(span => span.text.trim() !== match[1] || videoId(span.url) !== id)) continue;
      for (const span of overlap) spans.splice(spans.indexOf(span), 1);
      spans.push({start, end});
    }
    return spans.sort((a,b) => a.start - b.start);
  }

  function appendText(node, body, start, end, spans) {
    let cursor = start;
    for (const span of spans) {
      if (span.end <= cursor || span.start >= end) continue;
      const from = Math.max(cursor, span.start);
      node.append(body.slice(cursor, from));
      cursor = Math.min(end, span.end);
      if (span.url) {
        const link = externalLink(span.url);
        link.textContent = body.slice(from, cursor);
        node.append(link);
      }
    }
    node.append(body.slice(cursor, end));
  }

  function appendPhotos(container, body, photos, spans, links) {
    let cursor = 0;
    for (const photo of photos) {
      if (photo.at < cursor || photo.at > body.length) continue;
      appendText(container, body, cursor, photo.at, spans);
      cursor = photo.at;
      const figure = document.createElement('figure');
      figure.className = 'archive-photo';
      const img = document.createElement('img');
      img.src = photo.src;
      img.width = photo.width;
      img.height = photo.height;
      img.alt = photo.alt;
      const source = links.find(link => link.images?.includes(photo.src));
      if (source) {
        const anchor = externalLink(source.url);
        anchor.setAttribute('aria-label', img.alt || source.url);
        anchor.append(img);
        figure.append(anchor);
      } else figure.append(img);
      if (photo.captionStart === cursor && photo.captionEnd <= body.length) {
        const caption = document.createElement('figcaption');
        appendText(caption, body, cursor, photo.captionEnd, spans);
        figure.append(caption);
        cursor = photo.captionEnd;
      }
      container.append(figure);
    }
    appendText(container, body, cursor, body.length, spans);
  }

  function render(container, post, references) {
    container.replaceChildren();
    const photos = window.ARCHIVE_PHOTOS?.[post.id] || [];
    const featured = post.featuredImage;
    const figure = document.getElementById('detail-featured');
    figure.hidden = !featured;
    const image = figure.querySelector('img');
    if (featured) {
      image.src = featured.src;
      image.alt = featured.alt;
    } else {
      image.removeAttribute('src');
      image.alt = '';
    }
    const bodyPhotos = photos.filter(photo => !featured?.inlineMatches?.includes(photo.src));
    const links = (post.bodyLinks || []).filter(link => safeUrl(link.url));
    const videoIds = videos(post);
    appendPhotos(container, post.text, bodyPhotos, textSpans(post.text, links, videoIds), links);
    const inlineUrls = new Set([...container.querySelectorAll('a')].map(a => a.getAttribute('href')));
    const sources = new Set([...(post.links || []), ...links.map(link => link.url)]);
    // xPostUrl is an optional URL field for newly authored posts.
    const xPosts = new Map();
    for (const raw of [post.xPostUrl, ...sources, ...(post.text.match(urlPattern) || [])]) {
      const status = xStatus(raw);
      if (status) xPosts.set(status.id, status);
    }
    const remaining = [...sources].filter(url => safeUrl(url) && !xStatus(url) && !inlineUrls.has(url) && !videoIds.includes(videoId(url)));
    references.replaceChildren();
    if (remaining.length) {
      const heading = document.createElement('h3');
      heading.textContent = '関連リンク';
      references.append(heading);
      for (const url of remaining) {
        const anchor = externalLink(url);
        anchor.textContent = url;
        references.append(anchor);
      }
    }
    if (!photos.length && !post.text) container.append('本文の記載はありません。');
    for (const id of videoIds) {
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
    for (const status of xPosts.values()) appendXCard(container, status);
  }
  window.archiveMedia = { render, videos };
})();
