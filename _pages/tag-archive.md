---
layout: default
title: "Tags"
permalink: /tags/
---

<div class="page">
  <h1>Tags</h1>
  <div class="chips">
    {% assign tags = site.tags | sort %}
    {% for t in tags %}<a class="chip" href="#{{ t[0] | slugify }}">#{{ t[0] }} <span class="count">{{ t[1].size }}</span></a>{% endfor %}
  </div>

  {% for t in tags %}
  <h2 id="{{ t[0] | slugify }}">#{{ t[0] }}</h2>
  <ul class="note-list">
    {% for p in t[1] %}
    <li><a href="{{ p.url | relative_url }}">{{ p.title }}</a><time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y-%m-%d" }}</time></li>
    {% endfor %}
  </ul>
  {% endfor %}
</div>
