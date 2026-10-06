/* ── K9Labz — Articles ────────────────────────────────────
   Renders an article page from window.ARTICLE.

   ARTICLE = {
     title, kicker, summary, author, published, meta, accentColor,
     heroImage,
     blocks: [ { type: "...", heading: "...", ... }, ... ]
   }

   Block types (every block takes an optional `heading`):
     text      { text: "para" | ["para", ...] }
     score     { score, outOf, headline, text }
     cards     { items: [{ kicker, title, text, image, swatch }] }  // swatch: CSS color instead of photo
     ratings   { items: [{ label, value }] }          // value 0–10
     facts     { items: [{ label, value }] }          // two-column table
     items     { items: [{ title, meta, text }] }     // stacked boxes
     steps     { items: ["step", ...] }                // numbered list
     list      { items: ["point", ...] }               // bullet list
     proscons  { pros: [...], cons: [...], prosLabel, consLabel }
     callout   { label, text, link: { href, label } }
     quote     { text, cite }
     image     { src, caption }
     gallery   { items: [{ src, caption }] }
     video     { youtubeId, title }
     sources   { items: [{ title, publisher, url, note }] }  // numbered list

   Citations: put [1], [2], ... in any body text to link to the
   matching entry in the page's `sources` block.
   ──────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var A = window.ARTICLE;
  if (!A) return;

  document.documentElement.style.setProperty('--k9-accent', A.accentColor || '#C9A44A');

  var root = document.getElementById('k9-root');
  if (!root) return;

  var RENDERERS = {
    text: renderText,
    score: renderScore,
    cards: renderCards,
    ratings: renderRatings,
    facts: renderFacts,
    items: renderItems,
    steps: renderSteps,
    list: renderList,
    proscons: renderProsCons,
    callout: renderCallout,
    quote: renderQuote,
    image: renderImage,
    gallery: renderGallery,
    video: renderVideo,
    sources: renderSources
  };

  root.innerHTML = renderHeader() + renderPage();

  /* ── Page ──────────────────────────────────────────── */

  function renderHeader() {
    return (
      '<div class="k9-header">' +
        '<a href="../../index.html"><img src="../../logo.png" alt="K9Labz"></a>' +
        '<span class="k9-header-title">Articles</span>' +
        '<span class="k9-header-spacer"></span>' +
        '<a href="../index.html" class="k9-header-back">← All Articles</a>' +
      '</div>'
    );
  }

  function renderPage() {
    var blocks = A.blocks || [];
    var body = '';
    for (var i = 0; i < blocks.length; i++) body += renderBlock(blocks[i]);
    return (
      '<article class="k9-page">' +
        renderHero() +
        body +
        '<div class="k9-page-footer">&copy; 2026 <a href="https://craz.com">Crabtree Labz</a></div>' +
      '</article>'
    );
  }

  function renderHero() {
    var meta = [A.author, A.published].concat(A.meta || []).filter(Boolean).map(esc).join(' · ');
    var img = A.heroImage === undefined ? null : A.heroImage;
    return (
      '<header class="k9-hero">' +
        (A.kicker ? '<div class="k9-hero-kicker">' + esc(A.kicker) + '</div>' : '') +
        '<h1 class="k9-hero-title">' + esc(A.title) + '</h1>' +
        '<div class="k9-hero-accent-bar"></div>' +
        (A.summary ? '<p class="k9-hero-summary">' + esc(A.summary) + '</p>' : '') +
        (meta ? '<div class="k9-hero-meta">' + meta + '</div>' : '') +
        (img === false ? '' :
          '<div class="k9-hero-image">' +
            (img
              ? '<img src="' + esc(img) + '" alt="' + esc(A.title) + '">'
              : '<div class="k9-placeholder">Hero Photo<br>Coming Soon</div>') +
          '</div>') +
      '</header>'
    );
  }

  function renderBlock(b) {
    var fn = b && RENDERERS[b.type];
    if (!fn) return '';
    var body = fn(b);
    if (!body) return '';
    return (
      '<section class="k9-section">' +
        (b.heading ? '<h2>' + esc(b.heading) + '</h2>' : '') +
        body +
      '</section>'
    );
  }

  /* ── Blocks ────────────────────────────────────────── */

  function renderText(b) {
    var parts = [].concat(b.text || []);
    var html = '';
    for (var i = 0; i < parts.length; i++) html += '<p>' + cite(parts[i]) + '</p>';
    return html;
  }

  function renderScore(b) {
    return (
      '<div class="k9-score">' +
        '<div class="k9-score-score">' + esc(b.score) + '<small>/' + esc(b.outOf || 10) + '</small></div>' +
        '<div class="k9-score-text">' +
          (b.headline ? '<strong>' + esc(b.headline) + '</strong>' : '') +
          cite(b.text) +
        '</div>' +
      '</div>'
    );
  }

  function renderCards(b) {
    var list = b.items || [];
    if (!list.length) return '';
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      html += (
        '<div class="k9-card">' +
          (c.image
            ? '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '">'
            : c.swatch
              ? '<div class="k9-card-swatch" style="background:' + esc(c.swatch) + '"></div>'
              : '<div class="k9-placeholder">' + esc(c.kicker || c.title) + '</div>') +
          '<div class="k9-card-body">' +
            (c.kicker ? '<div class="k9-card-kicker">' + esc(c.kicker) + '</div>' : '') +
            '<div class="k9-card-title">' + esc(c.title) + '</div>' +
            (c.text ? '<div class="k9-card-text">' + cite(c.text) + '</div>' : '') +
          '</div>' +
        '</div>'
      );
    }
    return '<div class="k9-cards">' + html + '</div>';
  }

  function renderRatings(b) {
    var list = b.items || [];
    if (!list.length) return '';
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var pct = Math.max(0, Math.min(10, r.value)) * 10;
      html += (
        '<div class="k9-rating">' +
          '<div class="k9-rating-label">' + esc(r.label) + '</div>' +
          '<div class="k9-rating-track"><div class="k9-rating-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="k9-rating-value">' + esc(r.value) + '</div>' +
        '</div>'
      );
    }
    return '<div class="k9-ratings">' + html + '</div>';
  }

  function renderFacts(b) {
    var list = b.items || [];
    if (!list.length) return '';
    var rows = '';
    for (var i = 0; i < list.length; i++) {
      rows += '<tr><th>' + esc(list[i].label) + '</th><td>' + cite(list[i].value) + '</td></tr>';
    }
    return '<table class="k9-facts">' + rows + '</table>';
  }

  function renderItems(b) {
    var list = b.items || [];
    if (!list.length) return '';
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      html += (
        '<div class="k9-item">' +
          '<h3>' + esc(s.title) + '</h3>' +
          (s.meta ? '<div class="k9-item-meta">' + esc(s.meta) + '</div>' : '') +
          '<p>' + cite(s.text) + '</p>' +
        '</div>'
      );
    }
    return '<div class="k9-items">' + html + '</div>';
  }

  function renderSteps(b) {
    var list = b.items || [];
    if (!list.length) return '';
    return '<ol class="k9-steps">' + listItems(list) + '</ol>';
  }

  function renderList(b) {
    var list = b.items || [];
    if (!list.length) return '';
    return '<ul class="k9-list">' + listItems(list) + '</ul>';
  }

  function renderProsCons(b) {
    return (
      '<div class="k9-proscons">' +
        '<div class="k9-pros"><h3>' + esc(b.prosLabel || 'Strengths') + '</h3><ul>' + listItems(b.pros || []) + '</ul></div>' +
        '<div class="k9-cons"><h3>' + esc(b.consLabel || 'Weaknesses') + '</h3><ul>' + listItems(b.cons || []) + '</ul></div>' +
      '</div>'
    );
  }

  function renderCallout(b) {
    return (
      '<div class="k9-callout">' +
        (b.label ? '<div class="k9-label">' + esc(b.label) + '</div>' : '') +
        '<p>' + cite(b.text) + '</p>' +
        (b.link ? '<p><a href="' + esc(b.link.href) + '">' + esc(b.link.label) + ' →</a></p>' : '') +
      '</div>'
    );
  }

  function renderQuote(b) {
    return (
      '<blockquote class="k9-quote">' +
        cite(b.text) +
        (b.cite ? '<cite>— ' + esc(b.cite) + '</cite>' : '') +
      '</blockquote>'
    );
  }

  function renderImage(b) {
    return (
      '<figure class="k9-figure">' +
        (b.src
          ? '<img src="' + esc(b.src) + '" alt="' + esc(b.caption) + '" loading="lazy">'
          : '<div class="k9-placeholder">Photo Coming Soon</div>') +
        (b.caption ? '<figcaption>' + esc(b.caption) + '</figcaption>' : '') +
      '</figure>'
    );
  }

  function renderGallery(b) {
    var g = b.items || [];
    if (!g.length) return '';
    var html = '';
    for (var i = 0; i < g.length; i++) {
      html += (
        '<figure>' +
          '<img src="' + esc(g[i].src) + '" alt="' + esc(g[i].caption) + '" loading="lazy">' +
          (g[i].caption ? '<figcaption>' + esc(g[i].caption) + '</figcaption>' : '') +
        '</figure>'
      );
    }
    return '<div class="k9-gallery">' + html + '</div>';
  }

  function renderVideo(b) {
    if (!b.youtubeId) return '';
    return (
      '<div class="k9-video">' +
        '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(b.youtubeId) + '" title="' + esc(b.title) + '" allowfullscreen loading="lazy"></iframe>' +
      '</div>' +
      (b.title ? '<div class="k9-video-title">' + esc(b.title) + '</div>' : '')
    );
  }

  function renderSources(b) {
    var list = b.items || [];
    if (!list.length) return '';
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var src = list[i];
      html += (
        '<li id="src-' + (i + 1) + '">' +
          '<a href="' + esc(src.url) + '" target="_blank" rel="noopener">' + esc(src.title) + '</a>' +
          (src.publisher ? ' — ' + esc(src.publisher) : '') +
          (src.note ? '<div class="k9-source-note">' + esc(src.note) + '</div>' : '') +
        '</li>'
      );
    }
    return '<ol class="k9-sources">' + html + '</ol>';
  }

  /* ── Helpers ───────────────────────────────────────── */

  // Escapes text, then turns [1], [2] ... into links to the sources list.
  function cite(s) {
    return esc(s).replace(/(\[\d+\])+/g, function (run) {
      return '<sup class="k9-cite">' + run.replace(/\[(\d+)\]/g, '<a href="#src-$1">[$1]</a>') + '</sup>';
    });
  }

  function listItems(items) {
    var html = '';
    for (var i = 0; i < items.length; i++) html += '<li>' + cite(items[i]) + '</li>';
    return html;
  }

  function esc(s) {
    if (s === null || s === undefined) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(s)));
    return d.innerHTML;
  }
})();
