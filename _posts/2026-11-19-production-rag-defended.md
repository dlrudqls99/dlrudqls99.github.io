---
layout: post
title: "A Production RAG System, Defended: Decisions and Tradeoffs"
date: 2026-11-19
categories: [ai-agents]
tags: [rag, llm, system-design, evaluation]
---

I built a RAG system at work. It runs in production, real users ask it real questions, and it mostly works — so I thought explaining it would be easy.

Then I tried explaining it out loud, and it fell apart fast. The short version: I had made a lot of decisions, but I had not defended any of them. This post is that homework — not the code, the reasoning behind the code.

## Chunk size is a tradeoff, not a setting

I started with fixed-size chunks, about 500 tokens each, with roughly 20% overlap. It felt arbitrary at the time. Honestly, it was a guess I copied from a tutorial.

Small chunks give precise retrieval: the exact paragraph, nothing extra. But they break context. A table split across two chunks is useless in both.

Large chunks keep context intact. But they drag in noise, and noise eats the context window and confuses the model.

## Overlap is insurance for boundaries

The overlap was the part I almost skipped. It looked wasteful — why store the same sentence twice?

Then I found a case where the answer sat exactly on a chunk boundary, split in half. Neither half retrieved well.

Overlap costs storage, which is cheap. Missing the answer costs trust, which is not.

I also tried sentence-based splitting for a while. It sounded cleaner, but it hurt recall on the spec documents I was working with, where a single sentence means nothing without the paragraph around it. I dropped it.

That is the kind of thing I want to be able to say out loud: I tried it, here is what happened, here is why I went back.

## Vector search alone missed the exact terms

Pure dense retrieval is what I started with. It worked well for questions phrased like the documents.

It failed quietly on the exact stuff: part numbers, error codes, product names. Embeddings are good at meaning and bad at spelling.

So I added BM25 keyword search next to it and combined the scores. Hybrid search is not a fancy idea. It is just admitting that two imperfect tools cover each other's blind spots: the keyword side catches the exact terms, the vector side catches the paraphrases.

## Reranking fixed the most embarrassing failure

Retrieval gives candidates. A reranker actually reads the question against each one.

It costs a little latency. But it fixed the worst failure mode: the right document retrieved at rank 8, below seven almost-right ones, and the model answering from the wrong one.

Top-k is 5 for the same reason. More context is not more knowledge. Past a point, extra chunks add contradictions, and the model has to guess which one to believe. Five was where our eval numbers stopped improving.

## At 100x, the index breaks before the model

This is the question I thought about most carefully, because it is the one I was most afraid of getting wrong.

At 100x the documents, the first thing that breaks is not the model. It is the index. A single flat index gets slower and harder to update, so the honest answer is sharding the index, and tuning the approximate search so recall does not quietly fall off a cliff as the corpus grows.

The second thing that breaks is freshness. Re-indexing everything every night stops being cute at that size. You need incremental indexing: only the documents that changed, with a way to prove nothing went stale.

The third is cost. Every retrieved chunk costs tokens, and tokens cost money on every single question. Caching the most common questions, and the embeddings of the most common documents, is the unglamorous fix. I like that answer because it is boring and true.

## No internet shaped the whole design

One constraint shaped the whole system: the deployment environment had no internet access, and the data could not leave it.

That ruled out hosted APIs entirely. No calling an outside model, no outside embedding service. Everything had to run inside: a smaller local model, local embeddings, and strict allowlists on what the system could touch.

I used to think of that as a limitation to apologize for. Now I think it is the most interesting part of the design, because constraints are what make a design a design. Anyone can build a RAG system with unlimited budget and an open network. The choices only matter when something is off the table.

## Three options I said no to

Fine-tuning: our data was too small and changed too often. Every document update would have meant retraining, and retrieval already solved the knowledge problem. Fine-tuning is for teaching behavior, not for storing facts. That sentence took me a while to earn.

A giant context window instead of retrieval: tempting, and it would have skipped the whole chunking problem. But it is slow and expensive, and the model still gets lost in the middle of long contexts. Retrieval is a way of saying "you only need to read this part."

Graph RAG: genuinely cool, genuinely overkill for our corpus. I like the idea, and I will probably write about it separately. For this system it would have added a whole layer of complexity for a problem we did not have.

## Twenty questions turned opinions into numbers

The habit that changed how I think about all of this: build a tiny eval set before arguing about settings.

Twenty questions, each with the document that should answer it. Then measure how often the right document shows up in the top k.

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

This turns "I think chunk size 500 is fine" into "recall@5 went from 0.70 to 0.85 when I changed the chunking." That is a much better sentence to say out loud.

## What I took away

I do not ship a RAG setting I cannot defend out loud.
I measure with 20 real questions before I argue about chunking or top-k.
Every "no" needs a reason I can say in one sentence.
