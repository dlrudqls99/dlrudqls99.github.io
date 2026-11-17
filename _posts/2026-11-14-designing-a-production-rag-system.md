---
layout: post
title: "Designing a Production RAG System"
date: 2026-11-14
categories: [AI, System Design]
tags: [rag, system-design, llm, search, study-notes]
growth: growing
---

I build RAG systems at work, and RAG is also the topic I get asked about most when I study system design. So I wrote down how I would design one for a real company.

A demo is easy. Load some documents, embed them, grab the top few chunks, let the model answer. Done in an afternoon. A production system is a different problem. The documents are private. Different people can see different documents. The data keeps changing. And if the model makes something up, a real person might make a real decision based on it. That changes the design a lot.

## Start with questions, not boxes

Before I draw anything, I want to know:

- Who uses it, and what do they actually ask? A lookup question ("what is the spec for X") and a research question ("compare these three reports") need different systems.
- How many documents are there, and how often do they change?
- Is the data confidential? Who can see which documents?
- How fast does it need to be? Is a slower answer with sources better than a fast one without?

In a company, the answers are usually: yes it's confidential, permissions are per team or per document, and every answer needs a source. Those three answers decide most of the design.

## The overall shape

```
[Documents] → Ingestion → Chunking → Embedding → [Vector index + Keyword index]
                                                          ↓
[User question] → Query rewrite → Hybrid search → Rerank → Top chunks
                                                          ↓
                              Answer generation with citations → [User]
                                                          ↓
                                          Feedback + evaluation logs
```

There are two pipelines here, not one. The **ingestion pipeline** runs offline: it reads documents, chunks them, embeds them, and updates the index. The **query pipeline** runs when a user asks something, and it has to be fast.

I keep them separate on purpose. Then I can re-index everything or try a new chunking strategy without touching the part users depend on.

## Chunking matters more than people think

Chunking decides what one "piece" of retrieval is, and in my experience this is where most of the quality is won or lost.

If chunks are too small, each one has no context. Too big, and the embedding becomes an average of three different topics, which matches nothing well.

What I do: split by structure first — headings, sections, paragraphs — and only use fixed-size windows when the document has no structure. I add a small overlap so a sentence that gets cut in half still exists whole in the next chunk.

Every chunk also keeps metadata: document id, section, page, when it was updated, and who is allowed to see it. If you skip the metadata, you built a demo.

## Search: use both kinds

Embedding search is good at meaning and bad at exact words. It will miss part numbers, error codes, and product names — exactly the things people search for at work. Keyword search (BM25) is the opposite. So most real systems run both and merge the results. This is called **hybrid search**.

Then a **reranker** scores the merged results against the question one more time. Retrieval casts a wide net, say the top 50. The reranker picks the real top 5. Two stages like this are cheap to run and clearly better than one stage alone.

## Answers need sources

If an answer has no source, the user can't check it. At work, an answer nobody can check is almost useless.

So the model is told to answer only from the retrieved chunks and to cite them, and the UI shows the source text next to the answer. The user can click through and verify in seconds.

The other half of this is the honest failure. If nothing relevant comes back from search, the system should say "I couldn't find this in the documents" instead of guessing. I learned this the hard way: a system that always answers will eventually answer wrong with full confidence, and that's worse than no answer.

## Permissions: the part demos skip

This is the part every tutorial leaves out, and in a real company it's often the hardest part.

Two rules I follow:

1. **Filter by permission during retrieval**, using the permission list stored with each chunk. Not after the answer is made. If the model never sees the chunk, it can't leak it.
2. **Handle removal fast.** When a document is deleted or someone loses access, its chunks need to leave the index quickly. Normal indexing can be a bit slow and eventual. Permission removal should not be.

## Caching, carefully

Caching exact questions rarely helps, because people ask the same thing in different words. **Semantic caching** is the better version: embed the question, and if a very similar question was answered before, reuse that answer.

This can help a lot when the same questions repeat, like in support. But a wrong match gives a confident wrong answer, so I would only cache common, verified questions, keep the similarity threshold high, and set a TTL based on how fast the documents change.

## How do you know it works?

"It feels better" is not a test. I keep a small set of real questions with known good answers — a golden set — and measure three things:

- **Retrieval**: did the right chunk show up in the top k? (recall@k)
- **Answer quality**: is the answer actually based on the cited chunks, and does it answer the question?
- **Refusals**: when the answer is not in the documents, does the system say so?

Every thumbs-down from a user is a new candidate for the golden set. That loop is what makes the system get better after launch instead of slowly getting worse.

## Trade-offs I keep coming back to

- **Speed vs. quality.** Reranking and extra retrieval steps make answers better and slower. Streaming the answer hides some of the wait, not all of it.
- **Freshness vs. cost.** Re-embedding everything on every change is simple and expensive. Incremental indexing is cheaper and much easier to get wrong.
- **One index vs. one per tenant.** A shared index is cheaper to run. Separate indexes isolate customers better, and some customers will simply require that.

## What I took away

The model is the easy part. Most of a production RAG system is data work, permissions, and checking whether the answers are right. Once I understood that, designing one stopped feeling like magic and started feeling like normal engineering — just with an LLM in the middle.
