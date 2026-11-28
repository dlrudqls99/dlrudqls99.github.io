---
layout: post
title: "Operating LLMs in Production: Latency, Limits, and Retries"
date: 2026-11-25
categories: [ai-agents]
tags: [llm, production, latency, reliability]
---

The demo worked. That is the easy part.

It ran on my laptop, with one user, no rate limits, and nobody watching the clock. Production is a different job. The short version: measure latency in pieces, design for rate limits, retry with backoff and jitter, cache what you can, and fail honestly when the model is gone.

## An eight-second request has four different fixes

Latency is not one number. A request that takes eight seconds could be slow for four different reasons, and each one has a different fix.

Time to first token (TTFT) is how long until the user sees anything. It is what makes a system feel fast or slow. Time per output token (TPOT) is how fast the rest of the answer streams in.

Then there is everything before the model starts: the request sitting in a queue, the retrieval step in a RAG system, the tools being called. Log TTFT, TPOT, retrieval time, and queue time separately.

If TTFT is the problem, the prompt may be too long, or the first token is waiting on slow retrieval. If TPOT is the problem, the model is generating a lot of tokens, and the answer should probably be shorter.

If the queue is the problem, you do not have a model problem. You have a capacity problem.

Long prompts hurt twice. They cost more, and they slow the first token, because the model has to process the whole prompt before it can say anything.

That is the argument for tight retrieval. Send the model the three passages it needs, not the twenty it might need.

## A 429 is a speed limit, not an error

Every LLM API has limits — requests per minute, tokens per minute — and you will hit them. A 429 is not something going wrong. It is the API telling you exactly how fast you are allowed to go.

The model that clicked for me is a token bucket. The bucket refills at a fixed rate, and every request takes tokens out of it.

A short request costs a little. A long one costs a lot. When the bucket is empty, you wait.

So design for the limit. Queue requests instead of firing them all at once. Track usage, so you know you are close before you hit it.

And when you get a 429, respect the Retry-After header. Do not hammer the API again immediately.

That sounds obvious. I have still done the wrong thing in code more than once.

## Instant retries make an overload worse

The naive retry is "try again, right away, three times." If the API is overloaded, three clients retrying instantly make it more overloaded. That is the thundering herd problem, and it is embarrassingly easy to cause by accident.

What works is exponential backoff with jitter. Wait a second, then two, then four — and add a random bit, so not everyone retries at the same moment.

The jitter is the part I used to skip. Without it, a hundred clients that failed together retry together. You get the same spike, just delayed.

Some requests should not be retried at all. A 400 means your request is wrong. Retrying it will not help.

The scary case is a request that went through but timed out on the way back. Retrying it might run the same operation twice. A retried request could double-charge something.

That is why idempotency keys matter. If an operation has a side effect, give it a key. The server can then tell a retry from a new request.

## Caching and batching are the cheapest speedups

Not every request needs to hit the model. If users keep asking the same question, cache the answer.

Some APIs also cache the prompt itself. If you send the same long system prompt every time, the provider may only charge you for processing it once.

I kept putting these off because they felt unglamorous. They are the cheapest way to make a system faster and cheaper at the same time.

Batching is the same idea on the other side. Fifty small jobs sent one at a time mean fifty round trips. Group them, or use a batch API where the provider offers one, and the overhead drops.

The tradeoff is latency for individual requests. Batching is great for background jobs. It is bad for a user waiting on a screen.

## A system that fails honestly beats one that hangs

Guardrails are the checks around the model: input filters for things like prompt injection, output checks for disallowed content or PII, and validation that the output is in the format you asked for.

I used to think of these as a security topic. In production they are an operations topic. They are what stands between a weird input and a bad outcome a user sees.

Graceful degradation is the plan for when the model is unavailable or too slow. Fall back to a smaller, cheaper model for non-critical requests. Serve a cached answer when the question has been seen before.

Return a partial answer with a note that it is incomplete, instead of nothing at all. And sometimes say "I cannot do that right now," clearly, instead of timing out silently after thirty seconds.

Users can work with "unavailable right now." They cannot work with a spinner that never ends.

## The retry wrapper took twenty minutes

What I built this week: a wrapper around an LLM call that retries with exponential backoff and jitter, logs the timing of each attempt, and gives up cleanly instead of hanging. It is small. It is also the kind of code I would want in production.

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

Two things stuck with me. The jitter line is one line of code, and it is the difference between a retry storm and a polite queue.

The "gave up cleanly" branch matters as much as the retry logic. A wrapper that retries forever is just a slower way to fail.

## What I took away

Measure latency in pieces, not as one number.
Retry with backoff and jitter, and never retry a bad request.
Cache what I can, and plan for the day the model is not there.
