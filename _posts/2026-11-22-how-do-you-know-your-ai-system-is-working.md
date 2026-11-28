---
layout: post
title: "How Do You Know Your AI System Is Working?"
date: 2026-11-22
categories: [ai-agents]
tags: [llm, evaluation, system-design, rag]
---

Someone asked me how I know my RAG system is actually working. My honest answer was: vibes. I had tried a few questions by hand, and the answers looked right.

That is not evidence. So I spent a week learning how evaluation works for LLM systems. The short version: build a small test set before you need one, measure more than one thing, and never trust a single number.

## Start with 20 golden questions, not a metric

My first mistake was reaching for metrics. Accuracy of what, against which questions? The metric is the easy part. The questions are the work.

A golden set is a list of questions with the right answers — or at least the documents that should back each answer. Twenty is enough to start. I pulled mine from real logs, plus edge cases I knew were tricky, like questions with no answer in the documents.

The edge cases matter most. A system that hallucinates confidently, when it should say "I don't know," is worse than one that simply gets things wrong.

Writing the set forced a decision I had never written down: what does "good" mean for each question? Is a short answer fine, or do users need the full context? The eval set became a specification I did not know I was missing.

## Run the eval on every change, not once before shipping

I had this backwards. I treated evaluation like a final exam: do it once, then ship. It is a smoke alarm — it has to keep running, because the system keeps changing. New documents, new prompts, a new model version.

So the shape of it is a loop:

1. **Collect** real traffic — actual user questions, anonymized, failures included.
2. **Label** a small slice by hand, and let the automatic checks handle the rest.
3. **Measure** on every change, and fail the change if the numbers drop. If a prompt tweak drops faithfulness by five points, it does not ship.
4. **Review** the failures by hand and sort them into types: retrieval misses, grounding failures, bad questions, stale documents. The categories tell you what to fix next, instead of just "make it better."
5. **Grow** the golden set from the failures. Every real failure becomes a test case, so it can never come back silently.

That last step is my favorite. The eval set is not a fixed exam. It is a memory of every mistake the system has made.

## Two scores matter most: recall and faithfulness

For retrieval, one number comes first: recall@k. Is the right document in the top k results? If the right document is never retrieved, nothing downstream can save the answer.

For the answer itself, I watch faithfulness. Break the answer into claims and check each claim against the source documents. A claim with no support is a hallucination, even if it sounds right. Especially if it sounds right.

The second score is answer relevance: does it answer the question that was asked? A faithful answer can still be useless. I have seen my system quote a perfectly accurate paragraph that had nothing to do with what the user wanted.

The cheap metrics — exact match, ROUGE, token overlap — I use only as a smoke test. For free-form answers they punish good paraphrases and reward copying. They are not the verdict.

## Let a model grade, after humans check the grading

An LLM judge is simple: a strong model grades my system's answers, given the question, the source documents, and a rubric. I was suspicious of it at first. It felt circular — the thing grading itself.

The risks are real. The judge can share the system's blind spots. It also likes long, fluent answers, even when they are wrong.

The alternative is worse. Human grading is the gold standard, but it is slow and expensive, and I cannot rerun it every time I change a prompt. The judge runs the whole set in minutes, so I actually run it. An imperfect metric you run every day beats a perfect one you run twice a year.

Two safeguards keep the judge honest. First, a rubric with examples of each score, not just "rate this 1 to 5." Second, calibration: grade a small sample by hand first, and if the judge disagrees with people a lot, fix the rubric, not the system.

Humans still get the last word. Tone, real helpfulness, whether a domain expert would trust the answer — only a person can judge those. I grade in small batches: ten answers, two reviewers, three words — correct, grounded, helpful.

People also catch what no metric looks for. The answer that is right but uses a term users never use. The one grounded in a document that is itself out of date. The high-stakes questions always get human eyes.

## Five numbers are enough for a dashboard

In production, I would watch five things: faithfulness rate, retrieval recall@k, the share of questions answered versus declined, user feedback rate, and latency and cost per query. A perfect answer that takes thirty seconds and costs a dollar is not a product.

The answered-versus-declined share matters more than it looks. A system that never says "I don't know" is lying some of the time.

No single number tells the story. The signal is one number moving while the others stay still. Faithfulness drops but recall is fine? The generator is the problem, not retrieval. Recall drops but everything else is steady? Something changed in the documents.

## The harness took fifteen minutes

What I actually built this week: ten questions, the document each one should come from, and a simple scorer that checks whether the answer mentions the key facts. It is not a real judge — it is a stand-in. But once the harness exists, swapping in a better scorer is easy.

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

My rule: run it before and after every prompt or retrieval change, and do not ship a change that makes it worse. It is a low bar, on purpose. A low bar you actually check beats a high bar you never measure.

## What I took away

No change ships if the eval gets worse. Every failure we find becomes a test case. Vibes are not a metric.
