---
layout: post
title: "Building a GitHub Blog from Scratch: A Step-by-Step Guide"
date: 2025-11-23
categories:
  - Tutorial
tags:
  - GitHub Pages
  - Jekyll
---

I wanted one place to keep my study notes, somewhere I could come back to later. A blog on **GitHub Pages** with **Jekyll** made sense to me: it is free, posts are just Markdown files, and I already use GitHub every day.

These are the steps I followed to set mine up from nothing. The theme is [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/), a clean theme that also works well on mobile.

## Prerequisites

You need three things first:
1. A [GitHub account](https://github.com/).
2. [Git](https://git-scm.com/) installed on your computer.
3. A basic understanding of using the terminal.

---

## Step 1: Create a GitHub Repository

1. Log in to GitHub and create a new repository.
2. Name the repository `username.github.io`, where `username` is your actual GitHub username. 
   > **Important**: This exact naming convention is required for GitHub Pages to work automatically.
3. Make it **Public**.
4. Check "Initialize this repository with a README".
5. Click **Create repository**.

## Step 2: Clone the Repository Locally

Open your terminal and clone the repository to your local machine:

```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io
```

*(Replace `username` with your actual GitHub username)*

## Step 3: Install Jekyll and Dependencies

Jekyll is a Ruby tool, so the dependencies go in a `Gemfile`.

1. Create a file named `Gemfile` in the root of your repository with the following content:

   ```ruby
   source "https://rubygems.org"

   gem "github-pages", group: :jekyll_plugins
   ```

2. Install the dependencies. Run this command in your terminal:

   ```bash
   bundle install
   ```

   > **Note for Mac Users (M1/M2)**: If you encounter architecture errors, try running:
   > ```bash
   > arch -x86_64 bundle install
   > ```

## Step 4: Configure the Blog

The `_config.yml` file in the root directory holds all the blog's settings.

This is the basic configuration I started with, using the Minimal Mistakes theme:

```yaml
title: "My Awesome Blog"
author:
  name: "Your Name"
  bio: "Software Engineer"
  avatar: "/assets/images/profile.png" # We'll add this later
description: "A blog about tech and life."
url: "https://username.github.io" # Replace with your URL

# Build settings
remote_theme: mmistakes/minimal-mistakes
plugins:
  - jekyll-feed
  - jekyll-sitemap
```

## Step 5: Create Your First Post

Jekyll looks for blog posts in a `_posts` directory.

1. Create a folder named `_posts`.
2. Inside `_posts`, create a file named `2025-11-23-hello-world.md`. The filename format `YYYY-MM-DD-title.md` is strictly enforced.
3. Add the following content:

   ```markdown
   ---
   title: "Hello World"
   date: 2025-11-23
   categories:
     - General
   ---

   Welcome to my new blog! This is my very first post.
   ```

## Step 6: Run Locally

At this point I run it locally, to catch problems before pushing anything:

```bash
bundle exec jekyll serve
```

> **Mac M1/M2 Users**:
> ```bash
> arch -x86_64 bundle exec jekyll serve
> ```

Open `http://127.0.0.1:4000` in your browser. If the blog shows up there, the setup works.

## Step 7: Adding an About Page

1. Create a folder named `_pages`.
2. Inside `_pages`, create `about.md`:

   ```markdown
   ---
   permalink: /about/
   title: "About Me"
   ---

   Hi, I'm a developer passionate about...
   ```

3. To make it appear in the navigation, you might need to adjust `_config.yml` or add navigation data, but Minimal Mistakes often picks up pages automatically or via `_data/navigation.yml`.

## Step 8: Deploy to GitHub

When it looks right locally, push it and the blog goes live.

```bash
git add .
git commit -m "Initial blog setup"
git push origin main
```

Wait a minute or two, then visit `https://username.github.io`. The blog is live.

---

## Troubleshooting

- **404 Error**: Make sure your repository is named exactly `username.github.io`.
- **Ruby Errors**: Ensure you have a compatible Ruby version installed. Using `rbenv` or `rvm` is recommended.

## Looking Back

The setup took me longer than writing my first post. Most of my problems were Ruby version issues, not Jekyll issues. But once it runs, publishing is just writing a Markdown file and pushing it, which is exactly what I wanted.
