---
layout: post
title: "Designing a Production RAG System"
date: 2026-11-14
categories: [AI, System Design]
tags: [rag, llm, system-design, search]
---
I build RAG systems at work, and RAG is the topic I get asked about most when I study system design. So I wrote down how I would design one for a real company.

A demo takes an afternoon. A production system is a different problem. The short version: the model is the easy part — most of the work is chunking, permissions, sources, and checking whether answers are right.

A demo is simple: load some documents, embed them, grab the top few chunks, let the model answer. In production the documents are private, permissions differ per person, and the data keeps changing. If the model makes something up, a real person might act on it.

## Three answers decide most of the design

Before I draw anything, I want four answers. Who uses it, and what do they actually ask? How many documents are there, and how often do they change? Is the data confidential, and who can see which documents? How fast does it need to be?

A lookup question ("what is the spec for X") and a research question ("compare these three reports") need different systems. A slower answer with sources can also beat a fast one without them.

In a company, the answers are usually: yes, it is confidential; permissions are per team or per document; and every answer needs a source. Those three answers decide most of the design.

## Keep the two pipelines separate

```
[Documents] → Ingestion → Chunking → Embedding → [Vector index + Keyword index]
                                                          ↓
[User question] → Query rewrite → Hybrid search → Rerank → Top chunks
                                                          ↓
                              Answer generation with citations → [User]
                                                          ↓
                                          Feedback + evaluation logs
```

There are two pipelines here, not one. The ingestion pipeline runs offline: it reads documents, chunks them, embeds them, and updates the index. The query pipeline runs when a user asks something, and it has to be fast.

I keep them separate on purpose. Then I can re-index everything or try a new chunking strategy without touching the part users depend on.

## Chunking is where most of the quality is won or lost

Chunking decides what one piece of retrieval is. If chunks are too small, each one has no context. Too big, and the embedding becomes an average of three different topics, which matches nothing well.

What I do: split by structure first — headings, sections, paragraphs — and only use fixed-size windows when the document has no structure. I add a small overlap, so a sentence cut in half still exists whole in the next chunk.

Every chunk also keeps metadata: document id, section, page, when it was updated, and who is allowed to see it. If you skip the metadata, you built a demo.

## Use both kinds of search, then rerank 50 down to 5

Embedding search is good at meaning and bad at exact words. It will miss part numbers, error codes, and product names — exactly the things people search for at work. Keyword search (BM25) is the opposite.

So most real systems run both and merge the results. This is called hybrid search.

Then a reranker scores the merged results against the question one more time. Retrieval casts a wide net, say the top 50. The reranker picks the real top 5.

Two stages like this are cheap to run and clearly better than one stage alone.

## An answer without a source is almost useless at work

If an answer has no source, the user cannot check it. So the model is told to answer only from the retrieved chunks and to cite them, and the UI shows the source text next to the answer. The user can click through and verify in seconds.

The other half is the honest failure. If nothing relevant comes back from search, the system should say "I couldn't find this in the documents" instead of guessing.

I learned this the hard way. A system that always answers will eventually answer wrong with full confidence, and that is worse than no answer.

## Filter by permission during retrieval, never after

This is the part every tutorial leaves out. In a real company it is often the hardest part.

First, filter by permission during retrieval, using the permission list stored with each chunk — not after the answer is made. If the model never sees the chunk, it cannot leak it.

Second, handle removal fast. When a document is deleted or someone loses access, its chunks need to leave the index quickly. Normal indexing can be slow and eventual. Permission removal should not be.

## Measure three things on a golden set, not a feeling

"It feels better" is not a test. I keep a small set of real questions with known good answers — a golden set — and measure three things:

- **Retrieval**: did the right chunk show up in the top k? (recall@k)
- **Answer quality**: is the answer actually based on the cited chunks, and does it answer the question?
- **Refusals**: when the answer is not in the documents, does the system say so?

Every thumbs-down from a user is a new candidate for the golden set. That loop is what makes the system get better after launch instead of slowly getting worse.

## Cache only common, verified questions

Caching exact questions rarely helps, because people ask the same thing in different words. Semantic caching is the better version: embed the question, and if a very similar question was answered before, reuse that answer.

This can help a lot when the same questions repeat, like in support. But a wrong match gives a confident wrong answer.

So I would only cache common, verified questions, keep the similarity threshold high, and set a TTL based on how fast the documents change.

## Every trade-off is speed, freshness, or isolation

Speed vs. quality comes first. Reranking and extra retrieval steps make answers better and slower. Streaming the answer hides some of the wait, not all of it.

Freshness vs. cost is next. Re-embedding everything on every change is simple and expensive. Incremental indexing is cheaper and much easier to get wrong.

One index vs. one per tenant is last. A shared index is cheaper to run. Separate indexes isolate customers better, and some customers will simply require that.

## What I took away

Treat production RAG as normal engineering, not magic.
Spend the effort on data, permissions, and checking answers.
The model is the easy part.
