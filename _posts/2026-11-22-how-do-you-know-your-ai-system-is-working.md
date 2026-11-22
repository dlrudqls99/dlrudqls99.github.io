---
layout: post
title: "How Do You Know Your AI System Is Working?"
date: 2026-11-22
categories: [ai-agents]
tags: [llm, evaluation, system-design, rag]
---

A few weeks ago someone asked me how I know my RAG system is actually working. Not "does it run" — it runs. Not "do users like it" — they mostly do. The real question was: how do you know it is good, and how would you know if it got worse?

I did not have a good answer. I had vibes. I had a few examples I had tried by hand, and a general feeling that the answers looked right. That is not an answer. That is a hope with extra steps.

So I spent the week learning how evaluation actually works for LLM systems, and this post is my notes. The short version: you build a small test set before you need one, you measure more than one thing, and you never trust a single number.

## Start with a golden set, not with a metric

The first thing I got wrong was reaching for metrics first. Accuracy of what, exactly? Against which questions? The metric is the easy part. The hard part is the set of questions you measure against.

A golden set is just a list of questions with the right answers — or at least the documents that should back the answer. Twenty questions is enough to start. I pulled mine from real logs: the questions users actually asked, plus a few edge cases I knew were tricky, like questions with no answer in the documents. (Those matter more than the easy ones. A system that hallucinates confidently when it should say "I don't know" is worse than one that just gets things wrong.)

What surprised me: writing the golden set forced me to decide what "good" even means for each question. Is a short answer fine, or do users need the full context? Is it okay to quote the document, or should it summarize? I had never written any of that down. The eval set became a specification I did not know I was missing.

## Automatic metrics: useful, and easy to fool yourself with

For retrieval, the metrics are straightforward. Recall@k: is the right document in the top k results? That one I already had from the RAG post. Precision matters too, but honestly, recall is the one I watch first — if the right document never gets retrieved, nothing downstream can save the answer.

For the generated answer, it gets messier. There are two things I actually care about, and they pull in different directions:

**Faithfulness** — does the answer stick to what the retrieved documents actually say? You can check this by breaking the answer into claims and verifying each one against the source. If a claim has no support, it is a hallucination, even if it sounds right. Especially if it sounds right.

**Answer relevance** — does it actually answer the question that was asked? A faithful answer can still be useless. I have seen my system quote a perfectly accurate paragraph that had nothing to do with what the user wanted. Faithful, irrelevant, and confidently wrong in the way that matters.

There are also the cheap metrics: exact match, ROUGE, token overlap. They are fine for classification-style tasks, but for free-form answers they punish good paraphrases and reward copying. I use them as a smoke test, not as the verdict.

## LLM-as-judge: the tool I was suspicious of, and now use carefully

The idea is simple: you use a strong model to grade the outputs of the model you are evaluating. Give it the question, the answer, the source documents, and a rubric, and ask it to score.

I was suspicious of this at first. It felt circular — asking the thing to grade itself. And there is a real risk: the judge can share the same blind spots as the system it grades, and it tends to like long, fluent answers even when they are wrong.

What changed my mind is that the alternative is worse. Human grading is the gold standard, but it is slow and expensive, and I cannot re-run it every time I change a prompt. The judge lets me run the whole eval set in minutes, which means I actually run it. An imperfect metric you run every day beats a perfect one you run twice a year.

The trick is to keep the judge honest: a clear rubric with examples of each score, not just "rate this 1 to 5." Calibrate it against human grades on a small sample first — if the judge disagrees with people a lot, fix the rubric, not the system. And never let the judge be the only check on the questions that matter most. The high-stakes ones still get human eyes.

## Human evaluation: slow, expensive, irreplaceable

Some things only a person can judge. Is the tone right for the user? Is the answer actually helpful, or just technically correct? Would a domain expert trust this?

I do it in small batches. Ten answers, two reviewers, a simple rubric: correct, grounded, helpful. Disagreements get discussed, and the discussion usually teaches me more than the scores do. The pattern of disagreement is the signal — if two people keep arguing about whether an answer is "helpful enough," my definition of helpful is the problem, not the system.

The other thing humans catch that metrics miss: the failure mode you did not think to measure. A metric only finds what you told it to look for. A person reading real answers finds the weird stuff — the answer that is right but uses a term the users never use, the answer that quietly answers a different question, the one that is technically grounded in a document that is itself out of date.

## The loop: evals are not a one-time thing

This is the part I had completely backwards. I thought of evaluation as something you do once, before you ship, like a final exam. It is not. It is more like a smoke alarm — it has to keep running, because the system keeps changing. New documents, new prompts, a new model version. Every change is a chance to quietly break something that used to work.

So the shape of it is a loop:

1. **Collect** real traffic — sample actual user questions, anonymized, including the failures.
2. **Label** a small slice by hand, and let the automatic checks handle the rest.
3. **Measure** on every change, and fail the change if the numbers drop. Evals in CI, basically — if a prompt tweak drops faithfulness by five points, it does not ship.
4. **Review** the failures by hand, regularly, and sort them into types. Retrieval misses, grounding failures, bad questions, stale documents. The categories tell you what to fix next, instead of just "make it better."
5. **Grow** the golden set from the failures. Every real failure you find becomes a test case, so it can never come back silently.

That last step is my favorite. The eval set is not a fixed exam; it is a memory of every mistake the system has made. It only grows in the directions that matter.

## The numbers I would actually put on a dashboard

If someone asked me what to watch in production, after all this reading, my list is short: faithfulness rate, retrieval recall@k, the percentage of questions answered vs. declined (a system that never says "I don't know" is lying sometimes), user feedback rate — thumbs up and down, if you have it — and latency and cost per query, because a perfect answer that takes thirty seconds and costs a dollar is not a product.

No single number tells the story. The point of the dashboard is to notice when one of them moves and the others do not. Faithfulness drops but recall is fine? The generator is the problem, not retrieval. Recall drops but everything else is steady? Something changed in the documents.

## A small experiment: a ten-question eval harness

The thing I actually built this week, in about fifteen minutes. A tiny harness: ten questions, the document each one should come from, and a simple scorer that checks whether the answer mentions the key facts. It is not a real judge — it is a stand-in — but the harness is the point. Once the harness exists, swapping in a better scorer is easy. Not having the harness is the real problem.

```python
# eval_harness.py — a tiny eval loop you can grow
# Score each answer against the facts it should contain.

EVAL_SET = [
    {
        "question": "How do I reset the QA inspection flow?",
        "expected_doc": "doc_qa_reset",
        "must_mention": ["reset", "inspection"],
    },
    {
        "question": "What is the tolerance for the alignment step?",
        "expected_doc": "doc_alignment_spec",
        "must_mention": ["0.05", "mm"],
    },
    # ... add 8 more from your own logs, including
    # at least one question with no answer in the docs.
]

def score_answer(answer, must_mention):
    """Crude but honest: does the answer contain the key facts?"""
    found = [fact for fact in must_mention if fact.lower() in answer.lower()]
    return len(found) / len(must_mention)

def run_eval(answer_fn):
    scores = []
    for case in EVAL_SET:
        answer = answer_fn(case["question"])
        score = score_answer(answer, case["must_mention"])
        scores.append(score)
        if score < 1.0:
            print(f"weak: {case['question']!r} -> score {score:.2f}")
            print(f"   answer: {answer[:120]}")
    print(f"pass rate: {sum(s == 1.0 for s in scores)}/{len(scores)}")
    print(f"mean score: {sum(scores) / len(scores):.2f}")

# Replace this with your real system, or an LLM-as-judge call.
def my_system(question):
    return "TODO: wire up your answer function"

run_eval(my_system)
```

The rule I set for myself: run this before and after every prompt or retrieval change, and do not ship a change that makes it worse. It is a low bar. That is the point — a low bar you actually check beats a high bar you never measure.

## What I took away

"How do you know it works" turned out to be a better question than any of the technical ones I was preparing for. It forces you to say what good means, to write it down as test cases, and to keep checking it after you ship.

I am going into the interview with a golden set in my pocket — or at least, with the habit of building one. If someone asks me how I would know a system is working, I finally have an answer that is not vibes: a small set of real questions, a few metrics I can explain, a judge I calibrated against humans, and a loop that catches the next failure before the users do.
