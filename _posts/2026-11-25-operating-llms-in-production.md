---
layout: post
title: "Operating LLMs in Production: Latency, Limits, and Retries"
date: 2026-11-25
categories: [ai-agents]
tags: [llm, production, latency, reliability]
---

The demo worked. That is the easy part. The demo runs on my laptop, with one user, no rate limits, and nobody watching the clock. Production is a different job entirely, and it is the part I had thought the least about until recently.

I started this topic because of a question I kept dodging in my own head: what happens when the model is slow, or the API says no, or the whole thing falls over at 2pm on a Tuesday? "It works" is not an answer to any of those. So I spent a few days learning how people actually operate LLM systems, and these are my notes.

## Latency: first, find out where the time goes

The first mistake I made was treating latency as one number. It is not. A request that takes eight seconds could be slow for four completely different reasons, and each one has a different fix.

The useful split is roughly this. Time to first token (TTFT) is how long until the user sees anything at all — this is what makes a system feel fast or slow. Time per output token (TPOT) is how fast the rest of the answer streams in. Then there is everything before the model even starts: the request sitting in a queue, the retrieval step in a RAG system, the tools being called.

What I found helpful is a simple rule: measure the pieces, not the total. Log TTFT, TPOT, retrieval time, and queue time separately. If TTFT is the problem, the prompt might be too long, or the first token is waiting on a slow retrieval. If TPOT is the problem, the model is generating a lot of tokens, and maybe the answer should be shorter. If the queue is the problem, you do not have a model problem at all — you have a capacity problem.

One thing that surprised me: long prompts hurt twice. They cost more, and they slow down the first token, because the model has to process the whole prompt before it can say anything. That is the argument for keeping retrieval tight — send the model the three passages it needs, not the twenty it might need.

## Rate limits: the 429 is not an error, it is a fact of life

Every LLM API has limits — requests per minute, tokens per minute — and you will hit them. I used to think of a 429 as something going wrong. It is not. It is the API telling you exactly how fast you are allowed to go.

The mental model that clicked for me is a token bucket. You have a bucket that refills at a fixed rate, and every request takes some tokens out of it. A short request costs a little, a long one costs a lot. When the bucket is empty, you wait. The point is not to avoid the limit — it is to design for it.

In practice that means three things. Queue requests instead of firing them all at once. Track your usage so you know you are close to the limit before you hit it. And when you do get a 429, respect the Retry-After header instead of hammering the API again immediately. That last one sounds obvious, and I have still done the wrong thing in code more than once.

## Retries: the part everyone gets wrong

The naive retry is "try again, right away, three times." It feels reasonable and it is often the worst thing you can do. If the API is overloaded, three clients all retrying instantly just makes it more overloaded. This is the thundering herd problem, and it is embarrassingly easy to cause by accident.

The shape that actually works is exponential backoff with jitter. Wait a second, then two, then four — and add a random bit so not everyone retries at the same moment. The jitter is the part I used to skip. Without it, a hundred clients that failed together retry together, and you get the same spike, just delayed.

There are also times when you should not retry at all. A 400 means your request is wrong — retrying it will not help. A request that already went through but timed out on the way back is the scary one: retrying it might run the same operation twice. That is why idempotency keys matter. If the operation has a side effect, give it a key, and the server can tell a retry from a new request. I never thought about this until I realized a retried request could double-charge something.

## Caching and batching: the boring wins

Not every request needs to hit the model. If users keep asking the same question, cache the answer. Some APIs also cache the prompt itself — if you send the same long system prompt every time, the provider may only charge you for processing it once. Both of these are easy wins that I kept putting off because they felt unglamorous. They are also the cheapest way to make a system faster and cheaper at the same time.

Batching is the same idea on the other side. If you have fifty small jobs, sending them one at a time means fifty round trips. Grouping them, or using a batch API where the provider offers one, cuts the overhead. The tradeoff is latency for individual requests — batching is great for background jobs, bad for a user waiting on a screen.

## Guardrails and graceful degradation

This is the part I like most, honestly, because it is about what the system does when things go wrong, and that is where good engineering shows.

Guardrails are the checks around the model: input filters for things like prompt injection, output checks for disallowed content or PII, and validation that the output is in the format you asked for. I used to think of these as a separate security topic. In production they are an operations topic — they are what stands between a weird input and a bad outcome that a user sees.

Graceful degradation is the plan for when the model is unavailable or too slow. A few options I actually like: fall back to a smaller, cheaper model for non-critical requests. Serve a cached answer when the question has been seen before. Return a partial answer with a note that it is incomplete, instead of nothing at all. And sometimes the right answer is to say "I cannot do that right now" clearly, instead of timing out silently after thirty seconds.

The principle I keep coming back to: a system that fails honestly is better than a system that fails slowly. Users can work with "unavailable right now." They cannot work with a spinner that never ends.

## A small experiment: a retry wrapper with backoff and a latency log

The thing I actually built this week, in about twenty minutes. A wrapper around an LLM call that retries with exponential backoff and jitter, logs the timing of each attempt, and gives up cleanly instead of hanging. It is small, but it is the kind of code I would want in production — and the kind I would want to explain in an interview.

```python
# llm_client.py — a retry wrapper with backoff, jitter, and timing
# Replace `call_model` with your real API call.

import random
import time


def call_model(prompt):
    """Stand-in for a real LLM API call. Raise on failure."""
    raise NotImplementedError("wire this up to your provider")


def timed_call(prompt, max_retries=3, base_delay=1.0):
    """Call the model, retrying rate-limit / transient errors
    with exponential backoff and jitter. Never retry a bad request."""
    attempt = 0
    while True:
        started = time.monotonic()
        try:
            answer = call_model(prompt)
            elapsed = time.monotonic() - started
            print(f"ok in {elapsed:.2f}s (attempt {attempt + 1})")
            return answer
        except Exception as e:
            elapsed = time.monotonic() - started
            # In real code, check the status code: retry 429/5xx,
            # never retry 400.
            retryable = "rate limit" in str(e).lower() or "429" in str(e)
            attempt += 1
            print(f"attempt {attempt} failed after {elapsed:.2f}s: {e}")
            if not retryable or attempt > max_retries:
                raise
            delay = base_delay * (2 ** (attempt - 1))
            delay += random.uniform(0, delay * 0.5)  # jitter
            print(f"waiting {delay:.2f}s before retry...")
            time.sleep(delay)


# A cheap guardrail for the other side of the call:
# fail fast on an empty or absurdly long prompt before spending money.
def validate_prompt(prompt, max_chars=8000):
    if not prompt.strip():
        raise ValueError("empty prompt — nothing to send")
    if len(prompt) > max_chars:
        raise ValueError(f"prompt too long ({len(prompt)} chars), trim retrieval first")
    return prompt


# try:
#     answer = timed_call(validate_prompt("Explain backoff in one sentence."))
#     print(answer)
# except Exception as e:
#     print(f"gave up cleanly: {e}")
#     # Fallback here: cached answer, smaller model, or an honest error.
```

Two things I want to remember from writing this. First, the jitter line is one line of code and it is the difference between a retry storm and a polite queue. Second, the "gave up cleanly" branch matters as much as the retry logic. A wrapper that retries forever is just a slower way to fail.

## What I took away

Operating an LLM system is mostly not about the model. It is about the edges: how long things take and where the time goes, what happens when the API says no, and what the user sees when something breaks. None of that is glamorous, and all of it is the difference between a demo and a product.

If someone asks me in an interview how I would run an LLM system in production, I finally have an answer that is not just "it works on my machine": measure the latency in pieces, design for the rate limit instead of being surprised by it, retry with backoff and jitter and never retry a bad request, cache what you can, and have a plan for the day the model is not there.

