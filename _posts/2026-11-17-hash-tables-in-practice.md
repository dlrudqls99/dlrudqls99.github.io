---
layout: post
title: "Hash Tables in Practice: Collisions, Load Factor, and the LRU Cache"
date: 2026-11-17
categories: [Programming, Fundamentals]
tags: [hash-table, data-structures, python, caching, study-notes]
---

I started reviewing CS basics again, one topic a day. Day 1 is hash tables.

I use dicts every single day, but when I tried to explain *why* they are fast, my answer was just "because lookup is O(1)." That felt weak, so I went back to the basics. These are my notes.

## 1. The basic idea

A hash table stores key–value pairs in an array of *buckets*. To place a key, you run it through a **hash function**, get a number, and take that number modulo the array size. The result is the index.

```python
index = hash(key) % len(buckets)
```

If the hash function spreads keys out evenly, each bucket has only one or two entries. Lookup is then simple: hash the key, jump to the bucket, check a couple of items. You pay a small cost (computing the hash) to skip searching through everything.

## 2. Collisions are normal

Two different keys sometimes land in the same bucket. This is not a rare edge case. With enough keys, it always happens. There are two classic ways to handle it:

- **Chaining** — each bucket holds a small list of entries, and lookup scans that short list.
- **Open addressing** — if the bucket is taken, check the next slots until you find the key or an empty slot. Linear probing is the simplest version.

A tiny chaining implementation:

```python
class HashMap:
    def __init__(self, size=8):
        self.buckets = [[] for _ in range(size)]

    def _index(self, key):
        return hash(key) % len(self.buckets)

    def put(self, key, value):
        bucket = self.buckets[self._index(key)]
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value)
                return
        bucket.append((key, value))

    def get(self, key, default=None):
        for k, v in self.buckets[self._index(key)]:
            if k == key:
                return v
        return default
```

The bad case is worth remembering. If the hash function is poor — or an attacker makes many keys collide on purpose — everything ends up in one bucket and the table becomes a slow linked list with O(n) lookups. This attack is real (it's called hash flooding), and it is why Python randomizes the hash of strings for each process.

## 3. Load factor and rehashing

The **load factor** is `entries / buckets`. As the table fills up, buckets get crowded and collisions grow. So implementations set a limit — 0.75 is common — and when the table passes it, they make a bigger array and **rehash** every key into the new one.

Rehashing costs O(n), which sounds like it breaks the O(1) story. It doesn't, because of how rarely it happens. If the array doubles each time, the expensive resize is spread over all the inserts that came before it. So each insert is O(1) *on average*. That is the honest version of the claim: average O(1), if the hash is decent and the load factor stays under control.

## 4. Python dicts, specifically

Things I checked about the dict I use every day:

- `dict` uses open addressing, and since Python 3.7 it also remembers insertion order — that is a language guarantee, not luck.
- Keys must be hashable. That is why lists can't be dict keys but tuples can.
- String hashes are randomized per process, so never depend on a specific hash value.

## 5. Where I actually use this

- **Deduplication.** When I index documents for a RAG pipeline, I keep a set of content hashes and drop duplicates before embedding them. A hash table doing quiet cleanup work.
- **Caching.** An LLM response cache keys answers by a hash of the normalized prompt. The table gives fast lookup; the eviction policy is a separate problem (see the exercise below).
- **Counting and grouping.** `Counter` and `defaultdict` are just dicts with a small policy on top.

## 6. Exercise: an LRU cache

This is the classic exercise, and it is also a pattern I really use: a cache with fixed size that removes the **least recently used** entry first. `OrderedDict` can move an entry to the end and pop from the front, both in O(1), so `get` and `put` stay O(1):

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)  # mark as recently used
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)  # evict least recently used
```

The point I wrote down for myself: the hash table gives O(1) access, and the ordering gives O(1) eviction. Most real caches are this pair, plus extras — a TTL, a lock for threads, and so on.

## Questions I should be able to answer

- What happens when collisions pile up, and how does the complexity change?
- Why do we say "average O(1)" instead of just O(1)?
- What triggers a resize, and why doesn't rehashing ruin the average?
- How can an attacker hurt a hash table, and what do languages do about it?

If I can answer these without waving my hands, day 1 did its job.
