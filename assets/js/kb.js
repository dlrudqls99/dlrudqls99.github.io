(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var html = document.documentElement;

  // Theme
  $('#theme-toggle').addEventListener('click', function () {
    var next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // Mobile sidebar
  var navToggle = $('#nav-toggle'), backdrop = $('#backdrop');
  function closeNav() { document.body.classList.remove('nav-open'); navToggle.setAttribute('aria-expanded', 'false'); }
  navToggle.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  backdrop.addEventListener('click', closeNav);

  // Keep the active note visible in the tree
  var active = $('.sb-nav .sb-link.active');
  if (active && active.scrollIntoView) active.scrollIntoView({ block: 'center' });

  // Outline (right column)
  var tocList = $('#toc-list');
  if (tocList) {
    var heads = document.querySelectorAll('.note-body h2, .note-body h3');
    if (heads.length < 2) { $('#toc').hidden = true; }
    else {
      var links = [];
      heads.forEach(function (h, i) {
        if (!h.id) h.id = 'h-' + i;
        var a = document.createElement('a');
        a.href = '#' + h.id; a.textContent = h.textContent; a.className = h.tagName === 'H3' ? 'lvl3' : '';
        var li = document.createElement('li'); li.appendChild(a); tocList.appendChild(li); links.push(a);
      });
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('on', l.hash === '#' + e.target.id); });
        });
      }, { rootMargin: '0px 0px -75% 0px' });
      heads.forEach(function (h) { io.observe(h); });
    }
  }

  // Copy button on code blocks
  document.querySelectorAll('.note-body pre').forEach(function (pre) {
    var b = document.createElement('button');
    b.className = 'copy'; b.type = 'button'; b.textContent = 'copy';
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.innerText).then(function () {
        b.textContent = 'copied'; setTimeout(function () { b.textContent = 'copy'; }, 1200);
      });
    });
    pre.appendChild(b);
  });

  // Search palette
  var dlg = $('#palette'), input = $('#palette-input'), list = $('#palette-list');
  var index = null, results = [], cursor = 0;
  var base = document.querySelector('script[src$="kb.js"]').getAttribute('src').replace(/assets\/js\/kb\.js$/, '');

  function openPalette() {
    closeNav();
    if (!index) fetch(base + 'search.json').then(function (r) { return r.json(); }).then(function (d) { index = d; render(); });
    dlg.showModal(); input.value = ''; render(); input.focus();
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function snippet(body, q) {
    var i = body.toLowerCase().indexOf(q);
    if (i < 0) return body.slice(0, 110);
    var s = Math.max(0, i - 50);
    return (s ? '…' : '') + body.slice(s, i) + '<mark>' + body.slice(i, i + q.length) + '</mark>' + body.slice(i + q.length, i + 70);
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    if (!index) { list.innerHTML = '<li class="empty">Loading…</li>'; return; }
    results = index.filter(function (p) {
      if (!q) return true;
      return (p.title + ' ' + p.category + ' ' + p.tags + ' ' + p.body).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) {
      var at = a.title.toLowerCase().indexOf(q) >= 0, bt = b.title.toLowerCase().indexOf(q) >= 0;
      return at === bt ? 0 : at ? -1 : 1;
    }).slice(0, 8);
    cursor = 0;
    if (!results.length) { list.innerHTML = '<li class="empty">No notes match.</li>'; return; }
    list.innerHTML = results.map(function (p, i) {
      return '<li role="option"' + (i === 0 ? ' class="on"' : '') + '><a href="' + p.url + '">' +
        '<span class="t">' + esc(p.title) + '</span><span class="m">' + esc(p.category || '') + ' · ' + p.date + '</span>' +
        (q ? '<span class="x">' + snippet(esc(p.body), q) + '</span>' : '') + '</a></li>';
    }).join('');
  }
  function move(d) {
    var items = list.querySelectorAll('li[role=option]'); if (!items.length) return;
    items[cursor].classList.remove('on');
    cursor = (cursor + d + items.length) % items.length;
    items[cursor].classList.add('on'); items[cursor].scrollIntoView({ block: 'nearest' });
  }
  document.querySelectorAll('[data-search-open]').forEach(function (b) { b.addEventListener('click', openPalette); });
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && results[cursor]) { e.preventDefault(); location.href = results[cursor].url; }
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openPalette(); }
    else if (e.key === '/' && !dlg.open && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openPalette(); }
  });
})();
