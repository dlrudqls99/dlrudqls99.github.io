---
layout: default
title: "All notes"
permalink: /posts/
---

<div class="page">
  <h1>All notes</h1>
  <p class="lede">{{ site.posts.size }} notes, newest first. Press <kbd>Ctrl K</kbd> to search.</p>

  {% assign years = site.posts | group_by_exp: "p", "p.date | date: '%Y'" %}
  {% for y in years %}
  <h2 class="year">{{ y.name }}</h2>
  <ul class="note-list">
    {% for p in y.items %}
    <li>
      <a href="{{ p.url | relative_url }}">{{ p.title }}</a>
      <span class="muted">{{ p.categories | first }}</span>
      <time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%b %-d" }}</time>
    </li>
    {% endfor %}
  </ul>
  {% endfor %}
</div>
