---
layout: post
title: "Practical Python Patterns I Keep Reusing"
date: 2026-11-14
categories: [Programming, Python]
tags: [python, algorithms, patterns, study-notes]
---

I noticed my problem-solving practice kept circling back to the same handful of patterns — and that the same patterns show up in real systems code: rate limiters, stream parsers, schedulers. These are my notes on the ones I use most, each with the smallest example that captures the idea.

## 1. Top-K with a heap

**When:** "the k most frequent / largest / most recent" anything.

Counting is a `Counter`; selecting the top k is `heapq.nlargest`, which is O(n log k) instead of sorting everything.

```python
from collections import Counter
import heapq

def top_k_frequent(items, k):
    counts = Counter(items)
    return heapq.nlargest(k, counts.items(), key=lambda x: x[1])
```

## 2. Sliding window

**When:** a condition over a contiguous range — longest substring without repeats, max sum of a fixed-size window, "at most N events in any 60 seconds."

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

The window only moves forward, so the whole scan is O(n). The same shape, with timestamps instead of characters, is a sliding-window rate limiter.

## 3. BFS as a template

**When:** shortest path in an unweighted graph or grid, level-by-level anything.

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

Mark nodes as seen when they enter the queue, not when they leave it — that one detail prevents exponential duplicate work.

## 4. Token bucket rate limiter

**When:** any "allow N operations per second" rule — API quotas, job dispatch, retry pacing. This pattern is worth knowing as production code, not just as an interview answer.

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

Refill continuously, spend one token per request. Simple, and it degrades gracefully under bursts up to the bucket size.

## 5. Decoder sampling: greedy, top-k, top-p

**When:** implementing or even just understanding how an LLM picks its next token. Given logits, sampling is a small piece of NumPy:

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

Greedy is the special case where you always take the argmax. Writing this once taught me more about what temperature and nucleus sampling actually do than any diagram.

## 6. Retry with exponential backoff

**When:** calling anything over a network. Fixed-interval retries create thundering herds; backoff with jitter spreads them out.

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

## The meta-pattern

Every pattern above is a trade: a heap trades a full sort for O(n log k); a sliding window trades memory of positions for a single pass; a token bucket trades perfect fairness for simplicity. Noticing *which trade a problem is asking for* is most of problem solving — the code afterwards is usually short.
