---
layout: post
title: "Hash Tables in Practice: Collisions, Load Factor, and the LRU Cache"
date: 2026-11-17
categories: [Programming, Fundamentals]
tags: [hash-table, data-structures, python, caching, study-notes]
---

I'm starting a slow review of CS fundamentals, one topic a day, and day one is the data structure I probably use more than any other without thinking about it: the hash table. Caches, deduplication, session stores, database indexes — underneath all of them is the same idea. These are my notes on how it actually works, and where the "average O(1)" claim comes from.

## 1. The basic idea

A hash table stores key–value pairs in an array of *buckets*. To place a key, you run it through a **hash function** that returns a number, take that number modulo the array size, and use the result as the index.

```python
index = hash(key) % len(buckets)
```

If the hash function spreads keys evenly, each bucket holds very few entries, and lookup is just: hash, jump to the bucket, check one or two items. That is the whole trick — trade a small amount of computation (the hash) for avoiding a search.

## 2. Collisions are normal

Two different keys will sometimes hash to the same bucket. This is not an edge case; with enough keys it is guaranteed. There are two classic ways to handle it:

- **Chaining** — each bucket holds a small list of entries. Lookup scans that short list.
- **Open addressing** — if the bucket is taken, probe the next slots (linear probing is the simplest version) until you find the key or an empty slot.

A minimal chaining implementation:

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

The failure mode is worth remembering: if the hash function is bad — or an attacker deliberately crafts colliding keys — every entry lands in one bucket and the table degrades to a linked list with O(n) lookups. This is a real attack (hash flooding), and it is why Python randomizes string hashing per process (SipHash with a random seed).

## 3. Load factor and rehashing

The **load factor** is `entries / buckets`. As it grows, buckets get crowded and collisions multiply. Implementations pick a threshold — 0.75 is a common one — and when the table crosses it, they allocate a bigger array and **rehash** every key into it.

Rehashing is O(n), which sounds like it breaks the O(1) promise. It doesn't, because of amortization: if you double the array each time, the expensive resize happens rarely, and spreading its cost over all the inserts that caused it leaves each insert at average O(1). "Average-case O(1)" really means "O(1) as long as the hash is decent and the load factor stays bounded."

## 4. Python dicts specifically

A few facts about the implementation I use every day:

- `dict` uses open addressing with a compact, insertion-ordered layout (order preservation is a language guarantee since Python 3.7).
- Keys must be hashable — which is why lists can't be dict keys but tuples can.
- String and bytes hashes are randomized per process, so iteration order and collision patterns differ between runs. Never depend on a specific hash value.

## 5. Where I actually use this

- **Deduplication** — when indexing documents for a RAG pipeline, a set of content hashes drops duplicates before embedding. A hash table doing quiet janitor work.
- **Response caching** — keying an LLM response cache by a hash of the normalized prompt. The cache *policy* (what to evict) is separate from the table itself, which leads to the exercise below.
- **Counting and grouping** — `Counter` and `defaultdict` are just dicts with a policy attached.

## 6. Exercise: an LRU cache

The standard interview-flavoured exercise, and a genuinely useful pattern: a cache with a fixed capacity that evicts the **least recently used** entry. `OrderedDict` gives O(1) move-to-end and pop-from-front, so both operations stay O(1):

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

The design point: the hash table gives O(1) access, and the ordering gives O(1) eviction. Most real caches (and the classic interview follow-ups — add a TTL, make it thread-safe) are variations on this pairing.

## Questions I should be able to answer

- What happens when collisions pile up, and how does that change the complexity?
- Why is lookup "average O(1)" rather than just O(1)?
- What triggers a resize, and why doesn't rehashing ruin the average?
- Why can an attacker hurt a hash table, and what do languages do about it?

If I can answer those without hand-waving, the fundamentals are actually back.
