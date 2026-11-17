---
layout: default
permalink: /about/
title: "About"
---

<div class="page about">
  <div class="who">
    <img src="{{ site.author_image | relative_url }}" alt="{{ site.author }}" width="56" height="56">
    <div>
      <h1>{{ site.author }}</h1>
      <p class="muted">{{ site.author_role }} · <a href="https://github.com/{{ site.github_username }}">github.com/{{ site.github_username }}</a></p>
    </div>
  </div>

  <p>This is my knowledge base. I write down what I learn so I don't have to learn it twice, and I keep it public in case it saves someone else a few hours.</p>

  <h2>What's in here</h2>
  <ul>
    <li><strong>AI engineering</strong>: agents, prompting, harness and loop engineering, token costs.</li>
    <li><strong>Software</strong>: setup notes, design decisions, deployment gotchas.</li>
    <li><strong>Frontend</strong>: study notes as I build my own apps.</li>
  </ul>

  <h2>How it's organized</h2>
  <p>The left tree groups notes by topic. Tags cross-link them, and every note ends with the notes it's linked to. <kbd>Ctrl K</kbd> searches everything.</p>

  <h2>Handy features</h2>
  <ul>
    <li><strong>Garden</strong>: notes mature over time — 🌱 Seedling, 🌿 Growing, 🌳 Evergreen — judged automatically by length and age. The <a href="{{ '/garden/' | relative_url }}">Garden page</a> shows the whole picture.</li>
    <li><strong>Graph</strong>: the <a href="{{ '/graph/' | relative_url }}">graph view</a> draws notes as nodes and shared tags as edges. Each note also has a small local graph at the bottom.</li>
    <li><strong>Hover previews</strong>: hover any note link to peek at it, Obsidian-style.</li>
    <li><strong>Keyboard</strong>: <kbd>g</kbd> then <kbd>h</kbd> home, <kbd>a</kbd> all notes, <kbd>g</kbd> graph, <kbd>d</kbd> garden.</li>
    <li><strong>Callouts</strong>: in Markdown, start a blockquote with <code>[!NOTE]</code>, <code>[!TIP]</code>, <code>[!WARNING]</code>, <code>[!IMPORTANT]</code>, <code>[!EXAMPLE]</code>, <code>[!QUESTION]</code>, <code>[!SUCCESS]</code>, <code>[!DANGER]</code>, <code>[!INFO]</code> or <code>[!QUOTE]</code> — optionally followed by a title — and it renders as a styled callout box.</li>
  </ul>
</div>
