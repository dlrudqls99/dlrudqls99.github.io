---
layout: default
title: "Topics"
permalink: /categories/
---

<div class="page">
  <h1>Topics</h1>
  {% assign cats = site.categories | sort %}
  {% for c in cats %}
  <h2 id="{{ c[0] | slugify }}">{{ c[0] }}</h2>
  <ul class="note-list">
    {% for p in c[1] %}
    <li><a href="{{ p.url | relative_url }}">{{ p.title }}</a><time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y-%m-%d" }}</time></li>
    {% endfor %}
  </ul>
  {% endfor %}
</div>
