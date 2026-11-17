---
layout: default
title: "Garden"
permalink: /garden/
---

<div class="page garden">
  <h1>🌱 Garden</h1>
  <p class="lede">How this knowledge base is growing. Notes mature over time — 🌱 Seedling (fresh, still rough), 🌿 Growing (developing), 🌳 Evergreen (polished and stable). Pin a stage with <code>growth:</code> in a note's front matter; otherwise it is estimated from length and age.</p>

  {% assign total_words = 0 %}
  {% assign n_seed = 0 %}{% assign n_grow = 0 %}{% assign n_ever = 0 %}
  {% for p in site.posts %}
    {% assign w = p.content | strip_html | number_of_words %}
    {% assign total_words = total_words | plus: w %}
    {% capture g %}{% include growth.html post=p raw=true %}{% endcapture %}
    {% if g == 'evergreen' %}{% assign n_ever = n_ever | plus: 1 %}{% elsif g == 'growing' %}{% assign n_grow = n_grow | plus: 1 %}{% else %}{% assign n_seed = n_seed | plus: 1 %}{% endif %}
  {% endfor %}
  <p><button class="random-btn" type="button" data-random-note>🎲 랜덤 노트 다시 읽기</button></p>

  {% assign total = site.posts.size %}
  {% assign pc_seed = n_seed | times: 100.0 | divided_by: total %}
  {% assign pc_grow = n_grow | times: 100.0 | divided_by: total %}
  {% assign pc_ever = n_ever | times: 100.0 | divided_by: total %}

  <div class="garden-stats">
    <div class="gstat"><span class="gstat-num">{{ total }}</span><span class="gstat-label">notes</span></div>
    <div class="gstat"><span class="gstat-num">{{ total_words }}</span><span class="gstat-label">words</span></div>
    <div class="gstat"><span class="gstat-num">{{ site.categories.size }}</span><span class="gstat-label">topics</span></div>
    <div class="gstat"><span class="gstat-num">{{ site.tags.size }}</span><span class="gstat-label">tags</span></div>
    <div class="gstat"><span class="gstat-num">{{ site.posts.last.date | date: "%b %Y" }}</span><span class="gstat-label">first note</span></div>
    <div class="gstat"><span class="gstat-num">{{ site.posts.first.date | date: "%b %-d, %Y" }}</span><span class="gstat-label">latest note</span></div>
  </div>

  <h2>Maturity</h2>
  <div class="stage-bar">
    <span class="seg seg-seed" style="width: {{ pc_seed }}%"></span><span class="seg seg-grow" style="width: {{ pc_grow }}%"></span><span class="seg seg-ever" style="width: {{ pc_ever }}%"></span>
  </div>
  <ul class="stage-legend">
    <li>🌱 Seedling · {{ n_seed }}</li>
    <li>🌿 Growing · {{ n_grow }}</li>
    <li>🌳 Evergreen · {{ n_ever }}</li>
  </ul>

  <h2>Writing activity</h2>
  <div class="heatmap" id="heatmap"></div>
  <div class="heatmap-legend">Less <span class="hm-cell lvl0"></span><span class="hm-cell lvl1"></span><span class="hm-cell lvl2"></span><span class="hm-cell lvl3"></span> More</div>

  <h2>Orphan notes</h2>
  <p class="muted">Notes that share no tags with any other note — good candidates for linking.</p>
  {% assign orphans = 0 %}
  <ul class="note-list">
  {% for p in site.posts %}
    {% assign linked = false %}
    {% if p.tags.size > 0 %}
      {% for q in site.posts %}
        {% if q.url == p.url %}{% continue %}{% endif %}
        {% for t in p.tags %}{% if q.tags contains t %}{% assign linked = true %}{% endif %}{% endfor %}
      {% endfor %}
    {% endif %}
    {% unless linked %}
      {% assign orphans = orphans | plus: 1 %}
      <li><a href="{{ p.url | relative_url }}">{{ p.title }}</a><span class="muted">{{ p.categories | first }}</span><time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%b %-d, %Y" }}</time></li>
    {% endunless %}
  {% endfor %}
  </ul>
  {% if orphans == 0 %}<p>None — every note is connected. 🎉</p>{% endif %}

  <h2>All notes by stage</h2>
  {% assign stages = "evergreen,growing,seedling" | split: "," %}
  {% for s in stages %}
    {% if s == 'evergreen' %}{% assign semoji = '🌳' %}{% assign slabel = 'Evergreen' %}{% elsif s == 'growing' %}{% assign semoji = '🌿' %}{% assign slabel = 'Growing' %}{% else %}{% assign semoji = '🌱' %}{% assign slabel = 'Seedling' %}{% endif %}
    <h3>{{ semoji }} {{ slabel }}</h3>
    <ul class="note-list">
    {% for p in site.posts %}
      {% assign w = p.content | strip_html | number_of_words %}
      {% capture g %}{% include growth.html post=p raw=true %}{% endcapture %}
      {% if g == s %}
      <li><a href="{{ p.url | relative_url }}">{{ p.title }}</a><span class="muted">{{ w }} words</span><time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%b %-d, %Y" }}</time></li>
      {% endif %}
    {% endfor %}
    </ul>
  {% endfor %}
</div>

{% assign by_day = site.posts | group_by_exp: "p", "p.date | date: '%Y-%m-%d'" %}
<script id="garden-days" type="application/json">{ {% for d in by_day %}"{{ d.name }}": {{ d.items.size }}{% unless forloop.last %}, {% endunless %}{% endfor %} }</script>
<script>
(function () {
  var el = document.getElementById('heatmap');
  if (!el) return;
  var days = {};
  try { days = JSON.parse(document.getElementById('garden-days').textContent); } catch (e) {}
  function keyOf(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var start = new Date(today);
  start.setDate(start.getDate() - (52 * 7 + today.getDay()));
  var d = new Date(start);
  while (d <= today) {
    var col = document.createElement('div');
    col.className = 'hm-col';
    for (var i = 0; i < 7; i++) {
      var cell = document.createElement('span');
      cell.className = 'hm-cell';
      var c = days[keyOf(d)] || 0;
      cell.classList.add('lvl' + Math.min(c, 3));
      cell.title = keyOf(d) + (c ? ' — ' + c + (c > 1 ? ' notes' : ' note') : '');
      if (d > today) cell.classList.add('hm-future');
      col.appendChild(cell);
      d.setDate(d.getDate() + 1);
    }
    el.appendChild(col);
  }
})();
</script>
