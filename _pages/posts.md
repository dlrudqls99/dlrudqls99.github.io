---
layout: default
title: "Posts"
permalink: /posts/
---

<div class="posts-header">
  <h1 class="posts-page-title">All Posts</h1>
  <p class="posts-page-subtitle">{{ site.posts.size }} articles on software engineering, AI, and development practices.</p>
</div>

<!-- Filter Bar -->
<div class="filter-bar">
  <input 
    type="text" 
    id="search-input" 
    class="filter-input" 
    placeholder="Search posts by title, category, or content..."
    aria-label="Search posts"
  />
  <div class="category-filters" id="category-filters">
    <button class="category-filter-btn active" data-category="all">All</button>
    {% assign all_categories = site.posts | map: 'categories' | join: ',' | split: ',' | uniq | sort %}
    {% for category in all_categories %}
      {% if category != "" %}
        <button class="category-filter-btn" data-category="{{ category }}">{{ category }}</button>
      {% endif %}
    {% endfor %}
  </div>
</div>

{% assign sorted_posts = site.posts | sort: 'date' | reverse %}

<div class="posts-grid" id="posts-grid">
{% for post in sorted_posts %}
  <article class="post-card" 
    data-title="{{ post.title | downcase }}"
    data-categories="{{ post.categories | join: ',' | downcase }}"
    data-excerpt="{{ post.excerpt | strip_html | downcase }}">
    <a href="{{ post.url | relative_url }}" class="post-card-link">
      <div class="post-card-header">
        {% if post.categories.size > 0 %}
          <div class="post-tags">
            {% for category in post.categories limit:3 %}
              <span class="post-tag">{{ category }}</span>
            {% endfor %}
          </div>
        {% endif %}
        <time class="post-date" datetime="{{ post.date | date_to_xmlschema }}">
          {{ post.date | date: "%b %d, %Y" }}
        </time>
      </div>

      <h2 class="post-card-title">{{ post.title }}</h2>

      {% if post.excerpt %}
        <p class="post-card-excerpt">
          {{ post.excerpt | strip_html | truncatewords: 25 }}
        </p>
      {% endif %}

      <div class="post-card-footer">
        <span class="read-more">Read more →</span>
      </div>
    </a>
  </article>
{% endfor %}
</div>

<div id="no-results" style="display: none; text-align: center; padding: 48px 0; color: var(--text-secondary);">
  <p>No posts found matching your search.</p>
</div>

<script>
(function() {
  const searchInput = document.getElementById('search-input');
  const postsGrid = document.getElementById('posts-grid');
  const noResults = document.getElementById('no-results');
  const categoryFilters = document.querySelectorAll('.category-filter-btn');
  const allPosts = document.querySelectorAll('.post-card');
  
  let currentCategory = 'all';
  let currentSearch = '';

  function filterPosts() {
    let visibleCount = 0;
    
    allPosts.forEach(post => {
      const title = post.dataset.title || '';
      const categories = post.dataset.categories || '';
      const excerpt = post.dataset.excerpt || '';
      
      const matchesSearch = !currentSearch || 
        title.includes(currentSearch) || 
        categories.includes(currentSearch) ||
        excerpt.includes(currentSearch);
      
      const matchesCategory = currentCategory === 'all' || 
        categories.split(',').includes(currentCategory);
      
      if (matchesSearch && matchesCategory) {
        post.style.display = '';
        visibleCount++;
      } else {
        post.style.display = 'none';
      }
    });
    
    if (visibleCount === 0) {
      postsGrid.style.display = 'none';
      noResults.style.display = 'block';
    } else {
      postsGrid.style.display = '';
      noResults.style.display = 'none';
    }
  }

  searchInput.addEventListener('input', function(e) {
    currentSearch = e.target.value.toLowerCase();
    filterPosts();
  });

  categoryFilters.forEach(btn => {
    btn.addEventListener('click', function() {
      categoryFilters.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentCategory = this.dataset.category;
      filterPosts();
    });
  });
})();
</script>
