---
layout: default
title: Home
---

<div class="home-hero">
  <div class="hero-copy">
    <p class="eyebrow">Engineering notes · AI · building in public</p>
    <h1 class="hero-title">Ideas that become<br><span>useful software.</span></h1>
    <p class="hero-subtitle">
      Practical notes from a Forward Deployed Engineer on software, AI, and the messy middle of shipping.
    </p>
    <div class="home-buttons">
      <a href="{{ '/posts/' | relative_url }}">Explore the notes <span aria-hidden="true">↗</span></a>
      <a href="{{ '/about/' | relative_url }}">About me</a>
    </div>
  </div>
  <div class="hero-profile">
    <div class="profile-image-wrapper">
      <img src="{{ '/assets/images/gpt-profil.jpeg' | relative_url }}" alt="Kyungbin Lee">
    </div>
    <p class="hero-profile-name">Kyungbin Lee</p>
    <p class="hero-profile-role">Forward Deployed Engineer</p>
  </div>
</div>

{% assign sorted_posts = site.posts | sort: 'date' | reverse %}
{% assign featured_post = sorted_posts | first %}

<section class="latest-section" aria-labelledby="latest-heading">
  <div class="section-heading-row">
    <div>
      <p class="eyebrow">Fresh from the desk</p>
      <h2 id="latest-heading" class="section-header">Latest thinking</h2>
    </div>
    <a class="section-link" href="{{ '/posts/' | relative_url }}">View all {{ site.posts.size }} notes <span aria-hidden="true">↗</span></a>
  </div>

  {% if featured_post %}
  <article class="featured-post">
    <div class="featured-post-copy">
      <div class="post-item-header">
        <span class="featured-label">Featured note</span>
        <time class="post-item-date" datetime="{{ featured_post.date | date_to_xmlschema }}">{{ featured_post.date | date: "%b %d, %Y" }}</time>
      </div>
      <h3 class="featured-title"><a href="{{ featured_post.url | relative_url }}">{{ featured_post.title }}</a></h3>
      <p class="post-excerpt">{{ featured_post.excerpt | strip_html | truncatewords: 38 }}</p>
      <a href="{{ featured_post.url | relative_url }}" class="read-more-link">Read the note <span aria-hidden="true">↗</span></a>
    </div>
    <div class="featured-mark" aria-hidden="true">✦</div>
  </article>
  {% endif %}
</section>

<section class="post-feed" aria-labelledby="recent-heading">
  <div class="section-heading-row compact-heading">
    <h2 id="recent-heading" class="section-header">More notes</h2>
    <span class="feed-count">Recently published</span>
  </div>

<div class="post-list">
{% for post in sorted_posts offset:1 limit:4 %}
  <article class="post-item">
    <div class="post-item-header">
      {% if post.categories.size > 0 %}
        <div class="post-item-tags">
          {% for category in post.categories limit:3 %}
            <span class="post-item-tag">{{ category }}</span>
          {% endfor %}
        </div>
      {% endif %}
      <time class="post-item-date" datetime="{{ post.date | date_to_xmlschema }}">
        {{ post.date | date: "%b %d, %Y" }}
      </time>
    </div>

    <h3 class="post-title">
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </h3>

    {% if post.excerpt %}
      <div class="post-excerpt">
        {{ post.excerpt | strip_html | truncatewords: 40 }}
      </div>
    {% endif %}

    <a href="{{ post.url | relative_url }}" class="read-more-link">Read the note <span aria-hidden="true">↗</span></a>
  </article>
{% endfor %}
</div>
</section>
