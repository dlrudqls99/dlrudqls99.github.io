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
  var base = document.querySelector('script[src*="kb.js"]').getAttribute('src').replace(/assets\/js\/kb\.js(\?.*)?$/, '');

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

/* Note hover preview (Obsidian-style): hover an internal note link, get a peek. */
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var script = document.querySelector('script[src*="kb.js"]');
  if (!script) return;
  var base = script.getAttribute('src').replace(/assets\/js\/kb\.js(\?.*)?$/, '');
  var map = null, loading = false, waiters = [];
  var card = null, timer = null, currentA = null;

  function ensureCard() {
    if (card) return card;
    card = document.createElement('div');
    card.className = 'note-preview';
    card.innerHTML = '<p class="np-title"></p><p class="np-meta"></p><p class="np-body"></p>';
    document.body.appendChild(card);
    return card;
  }
  function load(cb) {
    if (map) return cb(map);
    waiters.push(cb);
    if (loading) return;
    loading = true;
    fetch(base + 'search.json').then(function (r) { return r.json(); }).then(function (d) {
      map = {};
      d.forEach(function (p) { map[p.url] = p; });
      waiters.forEach(function (w) { w(map); });
      waiters = [];
    }).catch(function () { loading = false; waiters = []; });
  }
  function show(a, p) {
    ensureCard();
    card.querySelector('.np-title').textContent = p.title;
    var tags = (p.tags || '').split(' ').filter(Boolean).map(function (t) { return '#' + t; }).join(' ');
    card.querySelector('.np-meta').textContent = p.date + (p.category ? ' · ' + p.category : '') + (tags ? ' · ' + tags : '');
    card.querySelector('.np-body').textContent = (p.body || '').slice(0, 200) + '…';
    var r = a.getBoundingClientRect();
    card.style.display = 'block';
    var x = Math.min(r.left, window.innerWidth - 332);
    var y = r.bottom + 8;
    if (y + 160 > window.innerHeight) y = Math.max(8, r.top - 168);
    card.style.left = Math.max(8, x) + 'px';
    card.style.top = y + 'px';
  }
  function hide() { if (card) card.style.display = 'none'; currentA = null; }

  document.addEventListener('mouseover', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    clearTimeout(timer);
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    var path;
    try { path = new URL(href, location.origin).pathname; } catch (err) { return; }
    if (path === location.pathname) return;
    timer = setTimeout(function () {
      load(function (m) {
        var p = m[path];
        if (p && a.isConnected) { currentA = a; show(a, p); }
      });
    }, 320);
  });
  document.addEventListener('mouseout', function (e) {
    if (currentA && e.target === currentA && !currentA.contains(e.relatedTarget)) hide();
  });
  document.addEventListener('click', function () { clearTimeout(timer); hide(); });
  window.addEventListener('scroll', hide, { passive: true });
})();

/* Keyboard navigation (g then h/a/g/d) */
(function () {
  var script = document.querySelector('script[src*="kb.js"]');
  if (!script) return;
  var base = script.getAttribute('src').replace(/assets\/js\/kb\.js(\?.*)?$/, '');
  var seq = '', timer = null;
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (document.querySelector('dialog[open]')) return;
    if (e.key.length !== 1) return;
    var k = e.key.toLowerCase();
    if (seq === 'g') {
      clearTimeout(timer); seq = '';
      if (k === 'h') location.href = base;
      else if (k === 'a') location.href = base + 'posts/';
      else if (k === 'g') location.href = base + 'graph/';
      else if (k === 'd') location.href = base + 'garden/';
      return;
    }
    if (k === 'g') { seq = 'g'; timer = setTimeout(function () { seq = ''; }, 600); }
  });
})();

/* Obsidian-style callouts: > [!NOTE] Title */
(function () {
  var TYPES = {
    note: ['✎', 'Note'], info: ['ℹ️', 'Info'], tip: ['💡', 'Tip'],
    success: ['✅', 'Success'], question: ['❓', 'Question'],
    warning: ['⚠️', 'Warning'], danger: ['⛔', 'Danger'],
    important: ['❗', 'Important'], example: ['📌', 'Example'], quote: ['❝', 'Quote']
  };
  document.querySelectorAll('.note-body blockquote').forEach(function (bq) {
    var p = bq.querySelector('p');
    if (!p) return;
    var parts = p.innerHTML.split(/<br\s*\/?>|\n/);
    var m = parts[0].match(/^\s*\[!([a-zA-Z]+)\]\s*(.*)$/);
    if (!m) return;
    var type = m[1].toLowerCase();
    if (!TYPES[type]) return;
    var title = m[2].replace(/<[^>]*>/g, '').trim() || TYPES[type][1];
    parts[0] = '';
    var rest = parts.join('<br>').replace(/^(<br>)+/, '');
    if (rest.trim()) { p.innerHTML = rest; } else { p.remove(); }
    bq.classList.add('callout', 'callout-' + type);
    var head = document.createElement('div');
    head.className = 'callout-title';
    head.innerHTML = '<span class="callout-icon"></span><span></span>';
    head.querySelector('.callout-icon').textContent = TYPES[type][0];
    head.querySelector('span:last-child').textContent = title;
    bq.insertBefore(head, bq.firstChild);
  });
})();

/* GoatCounter per-note view count (shows only when counts are public) */
(function () {
  var countEl = document.querySelector('[data-views-count]');
  if (!countEl) return;
  fetch('https://dlrudqls99.goatcounter.com/counter' + location.pathname + '.json')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || d.count == null) return;
      countEl.textContent = d.count;
      document.querySelectorAll('[data-views]').forEach(function (el) { el.hidden = false; });
    })
    .catch(function () {});
})();

/* Maturity, part 2: reads can promote a note's stage.
   The stage baked into the HTML is purely time-based (age + tending, see
   _includes/growth.html) — length counts for nothing. GoatCounter's counts
   are public for this site, so fetch each note's unique views and promote —
   never demote — a note that is genuinely read:
     >= 10 unique views   seedling -> growing
     >= 50 unique views   growing  -> evergreen
   Any failure (offline, counts made private) leaves the time stage as-is. */
(function () {
  var GC = 'https://dlrudqls99.goatcounter.com/counter';
  var STAGES = ['seedling', 'growing', 'evergreen'];
  var EMOJI = { seedling: '🌱', growing: '🌿', evergreen: '🌳' };
  var LABEL = { seedling: 'Seedling', growing: 'Growing', evergreen: 'Evergreen' };
  var marks = document.querySelectorAll('[data-growth]');
  var garden = document.querySelector('.page.garden');
  if (!marks.length && !garden) return;

  function stageOfMark(el) {
    for (var i = 0; i < STAGES.length; i++) {
      if (el.classList.contains('growth-' + STAGES[i])) return STAGES[i];
      if (el.getAttribute('title') === LABEL[STAGES[i]]) return STAGES[i];
    }
    return 'seedling';
  }
  function promoted(base, views) {
    var i = STAGES.indexOf(base);
    if (views != null && views >= 10 && i < 1) i = 1;
    if (views != null && views >= 50 && i < 2) i = 2;
    return STAGES[i];
  }
  function applyToMark(el, stage) {
    if (el.classList.contains('growth-badge')) {
      el.classList.remove('growth-seedling', 'growth-growing', 'growth-evergreen');
      el.classList.add('growth-' + stage);
      el.textContent = EMOJI[stage] + ' ' + LABEL[stage];
    } else {
      el.textContent = EMOJI[stage];
      el.setAttribute('title', LABEL[stage]);
    }
  }
  function fetchViews(path) {
    var key = 'kb-gc:' + path;
    try {
      var hit = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (hit && Date.now() - hit.t < 6 * 3600 * 1000) return Promise.resolve(hit.v);
    } catch (e) {}
    return fetch(GC + path + '.json').then(function (r) { return r.json(); }).then(function (d) {
      var v = parseInt(d && (d.count_unique != null ? d.count_unique : d.count), 10);
      if (isNaN(v)) return null;
      try { sessionStorage.setItem(key, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
      return v;
    }).catch(function () { return null; });
  }

  // Base (time) stage per note path. Garden sections (below) are
  // authoritative; rendered marks only fill paths the sections did not cover.
  var base = {};

  // On the Garden page, also collect the by-stage lists so they can be
  // regrouped, and take base stages from the sections for any note the
  // sidebar did not cover.
  var sections = null, items = [];
  if (garden) {
    sections = {};
    garden.querySelectorAll('h3').forEach(function (h) {
      var ul = h.nextElementSibling;
      if (!ul || ul.tagName !== 'UL') return;
      STAGES.forEach(function (s) {
        if (h.textContent.indexOf(LABEL[s]) >= 0) sections[s] = ul;
      });
    });
    if (!sections.seedling || !sections.growing || !sections.evergreen) sections = null;
    if (sections) {
      STAGES.forEach(function (s) {
        sections[s].querySelectorAll('li').forEach(function (li) {
          var a = li.querySelector('a[href]');
          if (!a) return;
          var path;
          try { path = new URL(a.getAttribute('href'), location.origin).pathname; } catch (e) { return; }
          var time = li.querySelector('time');
          items.push({ li: li, path: path, when: time ? time.getAttribute('datetime') || '' : '' });
          base[path] = s;
        });
      });
    }
  }

  marks.forEach(function (el) {
    var p = el.getAttribute('data-path');
    if (!(p in base)) base[p] = stageOfMark(el);
  });

  var paths = Object.keys(base);
  if (!paths.length) return;
  Promise.all(paths.map(function (p) {
    return fetchViews(p).then(function (v) { return { path: p, views: v }; });
  })).then(function (rows) {
    var finalStage = {};
    rows.forEach(function (r) { finalStage[r.path] = promoted(base[r.path], r.views); });

    marks.forEach(function (el) {
      var s = finalStage[el.getAttribute('data-path')];
      if (s && s !== stageOfMark(el)) applyToMark(el, s);
    });

    if (sections) {
      // Redistribute the by-stage list items, newest first within a stage.
      items.sort(function (a, b) { return a.when < b.when ? 1 : a.when > b.when ? -1 : 0; });
      var counts = { seedling: 0, growing: 0, evergreen: 0 };
      items.forEach(function (it) {
        var s = finalStage[it.path] || base[it.path];
        counts[s]++;
        sections[s].appendChild(it.li);
      });
      var total = items.length || 1;
      var bar = { seedling: '.seg-seed', growing: '.seg-grow', evergreen: '.seg-ever' };
      STAGES.forEach(function (s) {
        var seg = garden.querySelector(bar[s]);
        if (seg) seg.style.width = (counts[s] * 100 / total) + '%';
      });
      garden.querySelectorAll('.stage-legend li').forEach(function (li) {
        STAGES.forEach(function (s) {
          if (li.textContent.indexOf(LABEL[s]) >= 0) li.textContent = EMOJI[s] + ' ' + LABEL[s] + ' · ' + counts[s];
        });
      });
    }
  }).catch(function () {});
})();

/* Local graph: this note and its tag-neighbours */
(function () {
  var canvas = document.getElementById('local-graph');
  if (!canvas) return;
  var script = document.querySelector('script[src*="kb.js"]');
  if (!script) return;
  var base = script.getAttribute('src').replace(/assets\/js\/kb\.js(\?.*)?$/, '');
  fetch(base + 'search.json').then(function (r) { return r.json(); }).then(function (posts) {
    var me = null;
    posts.forEach(function (p) { if (p.url === location.pathname) me = p; });
    if (!me) return;
    function tags(p) { return (p.tags || '').split(' ').filter(Boolean); }
    function shared(a, b) { return tags(a).filter(function (t) { return tags(b).indexOf(t) >= 0; }).length; }
    var nodes = [me];
    posts.forEach(function (p) { if (p.url !== me.url && shared(me, p) > 0) nodes.push(p); });
    if (nodes.length < 2) return;
    var sec = document.getElementById('local-graph-sec');
    if (sec) sec.hidden = false;

    var VAR_NAMES = ['--accent', '--accent-2', '--green', '--orange', '--yellow', '--red'];
    var FALLBACK = ['#ff6ca4', '#bda0ff', '#36dec6', '#ff9550', '#ffd05a', '#ff7365'];
    var cs = getComputedStyle(document.documentElement);
    var cats = [];
    nodes.forEach(function (n) { if (cats.indexOf(n.category) < 0) cats.push(n.category); });
    var catColor = {};
    cats.forEach(function (c, k) { catColor[c] = cs.getPropertyValue(VAR_NAMES[k % VAR_NAMES.length]).trim() || FALLBACK[k % FALLBACK.length]; });
    var fgColor = cs.getPropertyValue('--fg').trim() || '#f8eef6';
    var borderColor = cs.getPropertyValue('--border').trim() || '#3a2158';

    var ns = nodes.map(function (p, i) {
      return { url: p.url, title: p.title, cat: p.category, x: 0.5 + 0.3 * Math.cos(i / nodes.length * Math.PI * 2), y: 0.5 + 0.3 * Math.sin(i / nodes.length * Math.PI * 2), vx: 0, vy: 0, r: i === 0 ? 9 : 6, center: i === 0 };
    });
    var edges = [];
    for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
      var w = shared(nodes[i], nodes[j]);
      if (w > 0) edges.push({ a: i, b: j, w: w });
    }
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    var hover = null;
    function step() {
      var i, j;
      for (i = 0; i < ns.length; i++) for (j = i + 1; j < ns.length; j++) {
        var a = ns[i], b = ns[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy + 0.0001;
        var f = Math.min(0.0016 / d2, 0.05), d = Math.sqrt(d2);
        a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
      }
      edges.forEach(function (e) {
        var a = ns[e.a], b = ns[e.b];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d = Math.sqrt(dx * dx + dy * dy) + 0.0001;
        var f = (d - 0.34) * 0.012 * (1 + e.w * 0.25);
        a.vx += dx / d * f * d; a.vy += dy / d * f * d; b.vx -= dx / d * f * d; b.vy -= dy / d * f * d;
      });
      ns.forEach(function (n) {
        var pull = n.center ? 0.03 : 0.0016;
        n.vx += (0.5 - n.x) * pull; n.vy += (0.5 - n.y) * pull;
        n.vx *= 0.86; n.vy *= 0.86;
        n.x = Math.max(0.04, Math.min(0.96, n.x + n.vx));
        n.y = Math.max(0.05, Math.min(0.93, n.y + n.vy));
      });
    }
    function draw() {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      edges.forEach(function (e) {
        var a = ns[e.a], b = ns[e.b];
        ctx.strokeStyle = catColor[a.cat];
        ctx.globalAlpha = 0.3 + Math.min(e.w, 3) * 0.1;
        ctx.lineWidth = 1 + Math.min(e.w, 3) * 0.4;
        ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      ns.forEach(function (n) {
        var x = n.x * W, y = n.y * H;
        ctx.beginPath(); ctx.arc(x, y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = catColor[n.cat]; ctx.fill();
        ctx.lineWidth = n.center ? 3 : (hover === n ? 2.5 : 1.2);
        ctx.strokeStyle = n.center ? fgColor : borderColor; ctx.stroke();
        ctx.font = (n.center || hover === n ? '600 ' : '') + '11px Inter, sans-serif';
        ctx.fillStyle = fgColor; ctx.textAlign = 'center';
        var label = n.title.length > 30 ? n.title.slice(0, 29) + '…' : n.title;
        ctx.fillText(label, x, y + n.r + 14);
      });
    }
    (function loop() { step(); draw(); requestAnimationFrame(loop); })();
    function pick(ev) {
      var rect = canvas.getBoundingClientRect();
      var mx = (ev.clientX - rect.left) / rect.width, my = (ev.clientY - rect.top) / rect.height;
      var best = null, bd = 1e9;
      ns.forEach(function (n) {
        var d = Math.sqrt((n.x - mx) * (n.x - mx) + (n.y - my) * (n.y - my));
        if (d < (n.r + 6) / rect.width && d < bd) { bd = d; best = n; }
      });
      return best;
    }
    canvas.addEventListener('pointermove', function (ev) { hover = pick(ev); canvas.style.cursor = hover && !hover.center ? 'pointer' : 'default'; });
    canvas.addEventListener('click', function (ev) { var n = pick(ev); if (n && !n.center) location.href = n.url; });
    canvas.addEventListener('pointerleave', function () { hover = null; });
  }).catch(function () {});
})();
