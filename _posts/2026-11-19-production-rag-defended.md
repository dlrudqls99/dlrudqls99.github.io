---
layout: post
title: "A Production RAG System, Defended: Decisions and Tradeoffs"
date: 2026-11-19
categories: [ai-agents]
tags: [rag, llm, system-design, evaluation]
---

I built a RAG system at work. It runs in production, real users ask it real questions, and it mostly works. So when I started preparing for interviews, I thought this part would be easy. I would just describe what I built.

Then I tried explaining it out loud, and it fell apart fast. "Why did you chunk the documents that way?" I had an answer, but it was more of a shrug than a reason. "Why not fine-tune instead?" I had never really compared the two properly. I had made a lot of decisions, but I had not defended any of them.

So this post is me doing that homework. Not the code, exactly — the reasoning behind the code.

## Chunking: the boring decision that decides everything

When I started, I chunked documents into fixed-size pieces, about 500 tokens each, with roughly 20% overlap. It felt arbitrary at the time. Honestly, it was a guess I copied from a tutorial.

What I learned later is that chunk size is a tradeoff, not a setting. Small chunks give you precise retrieval — the exact paragraph, nothing extra. But they break context. A table split across two chunks is useless in both. Large chunks keep the context intact, but they drag in noise, and noise eats your context window and confuses the model.

The overlap was the part I almost skipped. It looked wasteful — why store the same sentence twice? Then I found a case where the answer sat exactly on a chunk boundary, split in half, and neither half retrieved well. Overlap is insurance for boundaries. It costs storage, which is cheap. Missing the answer costs trust, which is not.

I also tried sentence-based splitting for a while. It sounded cleaner. In practice it hurt recall on the spec documents I was working with, where a single sentence means nothing without the paragraph around it. I dropped it. That is the kind of thing I want to be able to say in an interview: I tried it, here is what happened, here is why I went back.

## Retrieval: why I did not trust the vector search alone

Pure dense retrieval felt like the modern answer, so that is what I started with. It worked well for questions phrased like the documents. It failed quietly on the exact stuff: part numbers, error codes, product names. Embeddings are good at meaning and bad at spelling.

So I added BM25 keyword search next to it and combined the scores. Hybrid search is not a fancy idea. It is just admitting that two imperfect tools cover each other's blind spots. The keyword side catches the exact terms, the vector side catches the paraphrases.

Then I added a reranker on top of the merged top results. Retrieval gives you candidates; reranking actually reads the question against each one. It costs a little latency, but it fixed the most embarrassing failure mode: the right document retrieved at rank 8, below seven almost-right ones, and the model answering from the wrong one.

If someone asks me why top-k is 5 and not 10 or 20: more context is not more knowledge. Past a point, extra chunks just add contradictions, and the model has to guess which one to believe. Five was where our eval numbers stopped improving.

## "What if it grows 100x?"

This is the question I am most afraid of in interviews, so I thought about it properly.

At 100x the documents, the first thing that breaks is not the model — it is the index. A single flat index gets slower and harder to update. The honest answer is sharding the index, and tuning the approximate search so recall does not quietly fall off a cliff as the corpus grows.

The second thing that breaks is freshness. Re-indexing everything every night stops being cute at that size. You need incremental indexing: only the documents that changed, with a way to prove nothing went stale.

And the third is cost. Every retrieved chunk costs tokens, and tokens cost money on every single question. Caching the most common questions, and the embeddings of the most common documents, is the unglamorous fix. I like that answer because it is boring and true.

## The locked room

One constraint shaped the whole system: the deployment environment had no internet access, and the data could not leave it. That ruled out hosted APIs entirely — no calling an outside model, no outside embedding service. Everything had to run inside: a smaller local model, local embeddings, strict allowlists on what the system could touch.

I used to think of that as a limitation to apologize for. Now I think it is the most interesting part of the design, because constraints are what make a design a design. Anyone can build a RAG system with unlimited budget and an open network. The choices only matter when something is off the table.

## What I said no to

Fine-tuning: our data was too small and changed too often. Every document update would have meant retraining, and retrieval already solved the knowledge problem. Fine-tuning is for teaching behavior, not for storing facts. That sentence took me a while to earn.

A giant context window instead of retrieval: tempting, and it would have skipped the whole chunking problem. But it is slow, expensive, and the model still gets lost in the middle of long contexts. Retrieval is a way of saying "you only need to read this part."

Graph RAG: genuinely cool, genuinely overkill for our corpus. I like the idea, and I will probably write about it separately. For this system it would have added a whole layer of complexity for a problem we did not have.

## A small experiment: measuring recall@k

The habit that changed how I think about all of this: build a tiny eval set before arguing about settings. Twenty questions, each with the document that should answer it. Then measure how often the right document shows up in the top k.

```python
# eval_recall.py — a tiny recall@k check for your retriever
# You need: a list of (question, expected_doc_id) pairs
# and a retrieve(question, k) function that returns doc ids.

def recall_at_k(eval_set, retrieve, k=5):
    hits = 0
    for question, expected_id in eval_set:
        retrieved = retrieve(question, k)
        if expected_id in retrieved:
            hits += 1
        else:
            print(f"miss: {question!r} -> got {retrieved}")
    return hits / len(eval_set)

eval_set = [
    ("How do I reset the QA inspection flow?", "doc_qa_reset"),
    ("What is the tolerance for the alignment step?", "doc_alignment_spec"),
    # ... add 15-20 real questions from your own logs
]

for k in [3, 5, 10]:
    print(f"recall@{k}: {recall_at_k(eval_set, retrieve, k):.2f}")
```

This is the part I would actually run before an interview, with my own questions. It turns "I think chunk size 500 is fine" into "recall@5 went from 0.70 to 0.85 when I changed the chunking." That is a much better sentence to say out loud.

## What I took away

Building the system was maybe half the work. The other half is knowing why it looks the way it does — and being able to say which alternatives I tried, which ones I rejected, and what would break first if it grew.

That is what I am practicing now: not just what I built, but the story of the decisions behind it. It is harder than writing the code was, but it is also the part that actually shows how I think.
