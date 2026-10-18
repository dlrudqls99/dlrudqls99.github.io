---
layout: default
title: Home
---

<div class="home">
  <p class="eyebrow">~/notes</p>
  <h1>Hi, I'm Kyungbin.</h1>
  <p class="lede">{{ site.description }} Written mostly for future me, shared in case it helps you.</p>
  <p class="stats"><span>{{ site.posts.size }} notes</span><span>{{ site.categories.size }} topics</span><span>{{ site.tags.size }} tags</span><span>updated {{ site.posts.first.date | date: "%b %-d, %Y" }}</span></p>

  <section>
    <div class="row-head"><h2>Recently updated</h2><a href="{{ '/posts/' | relative_url }}">all notes →</a></div>
    <ul class="note-list">
      {% for p in site.posts limit: 6 %}
      <li>
        <a href="{{ p.url | relative_url }}">{{ p.title }}</a>
        <span class="muted">{{ p.categories | first }}</span>
        <time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y-%m-%d" }}</time>
      </li>
      {% endfor %}
    </ul>
  </section>

  <section>
    <div class="row-head"><h2>Browse by topic</h2></div>
    <div class="chips">
      {% assign cats = site.categories | sort %}
      {% for c in cats %}<a class="chip" href="{{ '/categories/' | relative_url }}#{{ c[0] | slugify }}">{{ c[0] }} <span class="count">{{ c[1].size }}</span></a>{% endfor %}
    </div>
  </section>
</div>
