---
layout: post
title: "Practical Python Patterns I Keep Reusing"
date: 2026-11-14
categories: [Programming, Python]
tags: [python, algorithms]
---

When I practice problem solving, I keep coming back to the same handful of patterns. Then I noticed the same patterns show up in my real work too — rate limiters, stream parsers, schedulers. So I wrote them down in one place, each with the smallest example that shows the idea.

## 1. Top-K with a heap

**When:** "the k most frequent / largest / most recent" anything.

Counting is a `Counter`. Picking the top k is `heapq.nlargest`, which is O(n log k) instead of sorting the whole thing.

```python
from collections import Counter
import heapq

def top_k_frequent(items, k):
    counts = Counter(items)
    return heapq.nlargest(k, counts.items(), key=lambda x: x[1])
```

## 2. Sliding window

**When:** a condition over a continuous range — longest substring without repeats, max sum of a fixed-size window, "at most N events in any 60 seconds."

```python
def longest_unique(s: str) -> int:
    seen = {}
    left = best = 0
    for right, ch in enumerate(s):
        if ch in seen and seen[ch] >= left:
            left = seen[ch] + 1
        seen[ch] = right
        best = max(best, right - left + 1)
    return best
```

The window only moves forward, so the whole scan is O(n). Change the characters to timestamps and this same shape becomes a sliding-window rate limiter.

## 3. BFS as a template

**When:** shortest path in an unweighted graph or grid, or anything level by level.

```python
from collections import deque

def bfs(start, graph):
    q = deque([start])
    seen = {start}
    order = []
    while q:
        node = q.popleft()
        order.append(node)
        for nxt in graph[node]:
            if nxt not in seen:
                seen.add(nxt)
                q.append(nxt)
    return order
```

One detail I got wrong before: mark nodes as seen when they go *into* the queue, not when they come out. Otherwise the same node gets added again and again and the work blows up.

## 4. Token bucket rate limiter

**When:** any "allow N operations per second" rule — API quotas, job dispatch, retry pacing. This one is worth knowing as real code, not just as an interview answer.

```python
import time

class TokenBucket:
    def __init__(self, rate_per_sec: float, capacity: float):
        self.rate = rate_per_sec
        self.capacity = capacity
        self.tokens = capacity
        self.updated = time.monotonic()

    def allow(self) -> bool:
        now = time.monotonic()
        self.tokens = min(
            self.capacity,
            self.tokens + (now - self.updated) * self.rate,
        )
        self.updated = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False
```

Tokens refill over time, and each request spends one. Simple, and it handles short bursts up to the bucket size without falling over.

## 5. Decoder sampling: greedy, top-k, top-p

**When:** understanding how an LLM picks its next token. I wrote this while studying for interviews, because sampling questions kept coming up. Given logits, the whole thing is a small piece of NumPy:

```python
import numpy as np

def sample(logits, temperature=1.0, top_k=0, top_p=1.0, rng=None):
    rng = rng or np.random.default_rng()
    probs = np.exp((logits - logits.max()) / temperature)
    probs /= probs.sum()

    if top_k:                                   # keep only the k best
        idx = np.argpartition(-probs, top_k)[:top_k]
        mask = np.zeros_like(probs); mask[idx] = 1
        probs = probs * mask; probs /= probs.sum()

    if top_p < 1.0:                             # keep the smallest set
        order = np.argsort(-probs)             # whose mass reaches top_p
        cum = np.cumsum(probs[order])
        keep = order[cum - probs[order] < top_p]
        mask = np.zeros_like(probs); mask[keep] = 1
        probs = probs * mask; probs /= probs.sum()

    return int(rng.choice(len(probs), p=probs))
```

Greedy decoding is just the special case where you always take the argmax. Writing this once taught me more about temperature and top-p than any diagram did. The knobs finally made sense when I saw they are just ways of cutting the tail of a probability distribution.

## 6. Retry with exponential backoff

**When:** calling anything over a network. If every client retries at the same fixed interval, they all hit the server at the same time and make the problem worse. Backoff with a bit of randomness spreads them out.

```python
import random, time

def call_with_retry(fn, attempts=4, base=0.5):
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1:
                raise
            time.sleep(base * (2 ** i) + random.uniform(0, 0.1))
```

## What I took away

Every pattern here is a trade. A heap trades a full sort for O(n log k). A sliding window trades remembering positions for a single pass. A token bucket trades perfect fairness for being simple. Most of problem solving, for me, is noticing which trade the problem is asking for. After that, the code is usually short.
