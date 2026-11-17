---
layout: default
title: "Graph"
permalink: /graph/
---

<div class="page graph-page">
  <h1>🕸️ Graph</h1>
  <p class="lede">How the notes connect. Two notes are linked when they share a tag — the more tags they share, the stronger the pull. Drag a node to move it, click a node to open the note. Colors are top-level topics.</p>
  <div class="graph-wrap">
    <canvas id="graph-canvas"></canvas>
  </div>
  <div class="graph-legend" id="graph-legend"></div>
</div>

<script id="graph-data" type="application/json">
{"nodes":[{% for p in site.posts %}{"title":{{ p.title | jsonify }},"url":{{ p.url | relative_url | jsonify }},"cat":{{ p.categories | first | default: 'Misc' | jsonify }},"tags":{{ p.tags | jsonify }}}{% unless forloop.last %},{% endunless %}{% endfor %}]}
</script>
<script>
(function () {
  var canvas = document.getElementById('graph-canvas');
  if (!canvas) return;
  var data = { nodes: [] };
  try { data = JSON.parse(document.getElementById('graph-data').textContent); } catch (e) { return; }

  var nodes = data.nodes.map(function (n, i) {
    return { title: n.title, url: n.url, cat: n.cat || 'Misc', tags: n.tags || [], x: 0, y: 0, vx: 0, vy: 0, deg: 0 };
  });
  var edges = [];
  for (var i = 0; i < nodes.length; i++) {
    for (var j = i + 1; j < nodes.length; j++) {
      var shared = nodes[i].tags.filter(function (t) { return nodes[j].tags.indexOf(t) >= 0; }).length;
      if (shared > 0) {
        edges.push({ a: i, b: j, w: shared });
        nodes[i].deg++; nodes[j].deg++;
      }
    }
  }
  nodes.forEach(function (n) { n.r = 5 + Math.min(n.deg, 6) * 1.4; });

  var VAR_NAMES = ['--accent', '--accent-2', '--green', '--orange', '--yellow', '--red'];
  var FALLBACK = ['#93b4e0', '#c7d5ec', '#9cc5a5', '#afa8e8', '#9fbf8f', '#de7a6d'];
  var catColor = {}, fgColor = '#edf1f7', borderColor = '#1e2a44';
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    var cats = [];
    nodes.forEach(function (n) { if (cats.indexOf(n.cat) < 0) cats.push(n.cat); });
    cats.forEach(function (c, k) {
      var v = cs.getPropertyValue(VAR_NAMES[k % VAR_NAMES.length]).trim();
      catColor[c] = v || FALLBACK[k % FALLBACK.length];
    });
    fgColor = cs.getPropertyValue('--fg').trim() || fgColor;
    borderColor = cs.getPropertyValue('--border').trim() || borderColor;
    var legend = document.getElementById('graph-legend');
    if (legend) {
      legend.innerHTML = cats.map(function (c) {
        return '<span class="gleg"><span class="gdot" style="background:' + catColor[c] + '"></span>' + c + '</span>';
      }).join('');
    }
  }
  readColors();
  var toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', function () { setTimeout(readColors, 60); });

  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  nodes.forEach(function (n, k) {
    var ang = (k / nodes.length) * Math.PI * 2;
    n.x = 0.5 + 0.32 * Math.cos(ang);
    n.y = 0.5 + 0.32 * Math.sin(ang);
  });

  var hover = null, drag = null, dragMoved = false;

  function step() {
    var i, j;
    for (i = 0; i < nodes.length; i++) {
      for (j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy + 0.0001;
        var f = 0.0016 / d2;
        if (f > 0.05) f = 0.05;
        var d = Math.sqrt(d2);
        var fx = dx / d * f, fy = dy / d * f;
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
      }
    }
    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      var dx = b.x - a.x, dy = b.y - a.y;
      var d = Math.sqrt(dx * dx + dy * dy) + 0.0001;
      var rest = 0.26;
      var f = (d - rest) * 0.012 * (1 + e.w * 0.25);
      a.vx += dx / d * f * d; a.vy += dy / d * f * d;
      b.vx -= dx / d * f * d; b.vy -= dy / d * f * d;
    });
    nodes.forEach(function (n) {
      n.vx += (0.5 - n.x) * 0.0016;
      n.vy += (0.5 - n.y) * 0.0016;
      if (drag === n) return;
      n.vx *= 0.86; n.vy *= 0.86;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(0.03, Math.min(0.97, n.x));
      n.y = Math.max(0.04, Math.min(0.96, n.y));
    });
  }

  function draw() {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      var hot = hover && (nodes.indexOf(hover) === e.a || nodes.indexOf(hover) === e.b);
      ctx.strokeStyle = catColor[a.cat];
      ctx.globalAlpha = hot ? 0.85 : 0.22 + Math.min(e.w, 3) * 0.08;
      ctx.lineWidth = hot ? 1.8 : 1 + Math.min(e.w, 3) * 0.4;
      ctx.beginPath();
      ctx.moveTo(a.x * W, a.y * H);
      ctx.lineTo(b.x * W, b.y * H);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    nodes.forEach(function (n) {
      var x = n.x * W, y = n.y * H;
      ctx.beginPath();
      ctx.arc(x, y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = catColor[n.cat];
      ctx.fill();
      ctx.lineWidth = hover === n ? 2.5 : 1.2;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
      ctx.font = (hover === n ? '600 ' : '') + '11px Inter, sans-serif';
      ctx.fillStyle = fgColor;
      ctx.textAlign = 'center';
      var label = n.title.length > 34 ? n.title.slice(0, 33) + '…' : n.title;
      ctx.fillText(label, x, y + n.r + 14);
    });
  }

  function loop() { step(); draw(); requestAnimationFrame(loop); }
  loop();

  function pick(ev) {
    var rect = canvas.getBoundingClientRect();
    var mx = (ev.clientX - rect.left) / rect.width;
    var my = (ev.clientY - rect.top) / rect.height;
    var best = null, bd = 1e9;
    nodes.forEach(function (n) {
      var dx = n.x - mx, dy = n.y - my;
      var d = Math.sqrt(dx * dx + dy * dy);
      var thresh = (n.r + 6) / rect.width;
      if (d < thresh && d < bd) { bd = d; best = n; }
    });
    return { node: best, mx: mx, my: my };
  }
  canvas.addEventListener('pointerdown', function (ev) {
    var p = pick(ev);
    if (p.node) { drag = p.node; dragMoved = false; canvas.setPointerCapture(ev.pointerId); }
  });
  canvas.addEventListener('pointermove', function (ev) {
    var p = pick(ev);
    if (drag) {
      drag.x = p.mx; drag.y = p.my; drag.vx = 0; drag.vy = 0; dragMoved = true;
    } else {
      hover = p.node;
      canvas.style.cursor = hover ? 'pointer' : 'grab';
    }
  });
  canvas.addEventListener('pointerup', function (ev) {
    if (drag && !dragMoved) { window.location.href = drag.url; }
    drag = null;
  });
  canvas.addEventListener('pointerleave', function () { hover = null; drag = null; });
})();
</script>
