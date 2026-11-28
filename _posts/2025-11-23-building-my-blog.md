---
layout: post
title: "Building a GitHub Blog from Scratch: A Step-by-Step Guide"
date: 2025-11-23
categories:
  - Tutorial
tags:
  - github-pages
  - jekyll
  - blogging
---

I wanted one place to keep my study notes. Writing a Markdown file and pushing it was all the publishing I wanted.

That is why I picked **GitHub Pages** with **Jekyll**. The short version: it is free, posts are just Markdown files, and I already use GitHub every day. The setup below took me longer than my first post — and most of the trouble was Ruby, not Jekyll.

You need three things first: a [GitHub account](https://github.com/), [Git](https://git-scm.com/) installed, and a basic understanding of the terminal.

## Name the repository exactly right, or Pages will not work

Create a new repository on GitHub and name it `username.github.io`, where `username` is your actual GitHub username. This exact naming convention is required for GitHub Pages to work automatically.

Make it **Public**. Check "Initialize this repository with a README," then click **Create repository**.

Clone it locally:

```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io
```

*(Replace `username` with your actual GitHub username)*

## Jekyll is a Ruby tool, so the Gemfile comes next

Create a file named `Gemfile` in the root of your repository:

   ```ruby
   source "https://rubygems.org"

   gem "github-pages", group: :jekyll_plugins
   ```

Then install the dependencies:

   ```bash
   bundle install
   ```

   > **Note for Mac Users (M1/M2)**: If you encounter architecture errors, try running:
   > ```bash
   > arch -x86_64 bundle install
   > ```

## One file, `_config.yml`, holds all the settings

I started with this basic configuration. The theme is [Minimal Mistakes](https://mmistakes.github.io/minimal-mistakes/), which is clean and works well on mobile.

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

## Posts live in `_posts`, and the filename format is strict

Create a folder named `_posts`. Inside it, create a file named `2025-11-23-hello-world.md` — the filename format `YYYY-MM-DD-title.md` is strictly enforced.

   ```markdown
   ---
   title: "Hello World"
   date: 2025-11-23
   categories:
     - General
   ---

   Welcome to my new blog! This is my very first post.
   ```

## Run it locally before you push anything

A local run catches problems before they go live:

```bash
bundle exec jekyll serve
```

> **Mac M1/M2 Users**:
> ```bash
> arch -x86_64 bundle exec jekyll serve
> ```

Open `http://127.0.0.1:4000` in your browser. If the blog shows up there, the setup works.

## An About page takes one more folder

Create a folder named `_pages`, and inside it, `about.md`:

   ```markdown
   ---
   permalink: /about/
   title: "About Me"
   ---

   Hi, I'm a developer passionate about...
   ```

To make it appear in the navigation, you might need to adjust `_config.yml` or add navigation data. Minimal Mistakes often picks up pages automatically, or via `_data/navigation.yml`.

## One push deploys the whole blog

When it looks right locally, push it and the blog goes live:

```bash
git add .
git commit -m "Initial blog setup"
git push origin main
```

Wait a minute or two, then visit `https://username.github.io`. The blog is live.

## Two problems cover most failures

- **404 Error**: Make sure your repository is named exactly `username.github.io`.
- **Ruby Errors**: Ensure you have a compatible Ruby version installed. Using `rbenv` or `rvm` is recommended.

## What I took away

I run the blog locally before every push.
Most setup problems are Ruby problems, not Jekyll problems.
Once it runs, publishing is one Markdown file and one push.
