---
layout: post
title: "Designing a Production RAG System"
date: 2026-11-14
categories: [AI, System Design]
tags: [rag, system-design, llm, search, study-notes]
---

A demo RAG system is easy: load some documents, embed them, retrieve the top few chunks, and let the model answer. A production RAG system is a different problem. The documents are private, the permissions matter, the data changes, and "the model made it up" is not an acceptable answer when an engineer makes a decision based on the output.

These are my study notes on how I would design a RAG system for a real enterprise environment, and the trade-offs I keep coming back to.

## Start with requirements, not components

Before drawing boxes, I want answers to these:

- Who uses it, and what questions do they actually ask? (Lookup questions and research questions need different systems.)
- How many documents, and how fast do they change?
- Is the data confidential? Who is allowed to see which documents?
- What latency is acceptable? Is a cited, slightly slower answer better than a fast, unverifiable one?

In an enterprise setting, the answers usually are: the data is confidential, permissions are per-department or per-document, and every answer needs a source. Those three answers shape the whole design.

## The high-level shape

```
[Documents] → Ingestion → Chunking → Embedding → [Vector index + Keyword index]
                                                          ↓
[User question] → Query rewrite → Hybrid search → Rerank → Top chunks
                                                          ↓
                              Answer generation with citations → [User]
                                                          ↓
                                          Feedback + evaluation logs
```

Two pipelines, not one: an **ingestion pipeline** (offline, batch or event-driven) and a **query pipeline** (online, latency-sensitive). Keeping them separate lets you re-index, experiment with chunking, and backfill without touching the serving path.

## Chunking is a quality decision

Chunking decides the unit of retrieval, and it is where most RAG quality is won or lost.

- Too small, and a chunk has no context. Too large, and the embedding becomes a blurry average of several topics.
- I default to structure-aware splitting (by heading, section, or paragraph) before falling back to fixed-size windows, with a small overlap so a sentence cut in half still appears whole somewhere.
- Every chunk keeps metadata: document id, section, page, updated time, and the access-control list. Retrieval without metadata is a demo.

## Hybrid search and reranking

Dense (embedding) search is good at meaning, bad at exact terms: part numbers, error codes, product names. Keyword search (BM25) is the opposite. Production systems usually run both and merge the results.

Then a reranker re-scores the merged candidates against the question. Retrieval casts a wide net (say top 50), the reranker picks the real top 5. This two-stage shape is cheap to run and noticeably better than either stage alone.

## Citations are a feature, not decoration

If the answer has no source, the user cannot verify it, and in an enterprise setting an unverifiable answer is close to useless. So the prompt asks the model to answer only from the retrieved chunks and to cite them, and the UI shows the actual source text next to the answer.

The honest failure mode matters too: if nothing relevant was retrieved, the system should say "I could not find this in the documents" instead of improvising. Designing for that answer is a product decision, not just a prompt trick.

## Permissions: the part demos skip

Retrieval must respect access control. Two rules I follow:

1. **Filter by permission at retrieval time**, using the ACL stored with each chunk — not after generation. If the model never sees the chunk, it cannot leak it.
2. **Handle revocation.** If a document's access changes or it is deleted, its chunks must leave the index promptly. Indexing is easy to make eventually consistent; permission removal should not be.

## Caching

Exact-match caching rarely helps because people phrase the same question differently. **Semantic caching** — embedding the question and reusing an answer for a near-duplicate question — can help a lot in support-style workloads where the same questions repeat. The risk is a stale or subtly-wrong match, so I would cache only high-frequency, verified questions, with a conservative similarity threshold and a TTL tied to how fast the underlying documents change.

## Evaluation: how do you know it works?

"It feels better" is not an evaluation. I keep a small golden set of real questions with known-good answers and measure:

- **Retrieval**: did the right chunk appear in the top k? (recall@k)
- **Answer quality**: is the answer grounded in the cited chunks, and does it actually answer the question?
- **Refusals**: when the answer is not in the documents, does the system correctly say so?

Every thumbs-down from a user becomes a candidate for the golden set. That feedback loop is what makes the system improve after launch instead of slowly rotting.

## Trade-offs I keep in mind

- **Latency vs. quality**: reranking and multi-step retrieval improve answers and cost time. Streaming the answer hides some of it, not all.
- **Freshness vs. cost**: re-embedding everything on every change is simple and expensive; incremental indexing is efficient and easy to get wrong.
- **One shared index vs. per-tenant indexes**: shared is cheaper to operate; per-tenant is a stronger isolation story, which some customers will simply require.

## Closing thought

The model is the easy part. A production RAG system is mostly data engineering, permissions, and evaluation wearing an LLM as a hat — and that is exactly what makes it an interesting system to design.
