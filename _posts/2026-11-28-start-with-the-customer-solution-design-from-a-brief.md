---
layout: post
title: "Start With the Customer: Solution Design From a Brief"
date: 2026-11-28
categories: [ai-agents]
tags: [solution-design, discovery, fde, system-design]
---

I used to start every design problem the same way: someone gives me a brief, and I start drawing boxes. Database here, API there, maybe a vector store if it sounds like a RAG problem.

It felt productive. It was backwards. The short version: a brief is not a spec, so ask who it is for, what success is in a number, what constraint could kill the design, and who owns it after you leave — before any architecture.

A brief is a sentence someone wrote in a hurry, about a problem they feel more than they can describe. If I jump straight to architecture, I solve the sentence, not the problem. The sentence is usually wrong in at least one important way.

I learned this the slow way. A customer "wants an AI system that reads their documents and answers questions," and I answered with an architecture before asking a single question.

The architecture was fine. The answer was still wrong, because I had no idea what "works" meant to them.

I keep a short list now. I write it down before a design discussion, so I do not skip it under pressure.

## Forty answers a day is not one exact answer a month

First: who is this for, and what do they actually do today? Not "the use case" in the abstract — what a person does on a Tuesday afternoon, and where it hurts.

A support agent answering the same question forty times a day has a different problem from a compliance officer who needs one answer a month to be exactly right. Same brief. Completely different system.

## "Faster" is not a success metric

Second: what does success look like, in a number? "Faster" is not a number.

"Answer in under five seconds, correct 95% of the time, and cut escalations by a third" is a number. It changes the design.

If the customer cannot give a number yet, that is fine. Then the first deliverable is finding the number, not building the system.

I once built something technically good, and nobody could tell whether it helped. We had never agreed on what "helped" meant.

## One constraint can rule out half the architectures

Third: what are the constraints that will actually decide the design? I used to treat this as an afterthought.

Where does the data live, and can it leave that place? Who is allowed to see the answers? How much can it cost per request?

And what happens when the system is wrong? Is a wrong answer annoying, or is it a compliance incident?

The answer to "can the data leave the building" can rule out half the architectures before you start. I would rather find that out in minute ten than in week six.

## A system nobody owns after handover is not finished

Fourth: who decides, and what happens after I leave? A system that only works while I am in the room is not a delivered system.

Who owns it? Who maintains the eval set? Who gets paged when it breaks?

If those questions have no answer, the design is not finished. It does not matter how clean the diagram looks.

## The discovery answers do most of the designing

Only after those questions do I draw boxes. The drawing gets easier, because the answers do most of the deciding.

If the data cannot leave the customer's network, you are looking at on-prem or VPC deployment. That rules out a whole class of managed services.

If the answers need citations, retrieval is not optional. You need to think about chunking and evaluation from day one.

If the pain is volume — hundreds of near-identical questions — caching and a small model might beat a big model with a fancy pipeline. If the pain is accuracy on rare, high-stakes questions, you spend the effort on evaluation and human review instead.

My rule: no architecture before I can write down the user, the success metric, and the one constraint that would kill the design. If I cannot write those three things down, I am not ready to design. I am still guessing.

One smaller habit helps: write the brief back to the customer in my own words before proposing anything. "Here is what I heard you need, here is what success looks like, here is what I am assuming."

It takes five minutes, and it catches misunderstandings while they are still cheap. People correct you generously at this stage — much less generously after you have built the wrong thing.

## The checklist took fifteen minutes

What I tried this week: take a one-line brief — "build an AI assistant that answers questions about our product docs" — and turn it into a structured checklist with a tiny script. The point is not the code. The point is refusing to design from one sentence.

```python
# brief_checklist.py — turn a vague brief into discovery questions
# before any architecture. Fill in what you know; the gaps are the work.

BRIEF = "Build an AI assistant that answers questions about our product docs."

# Four groups. Each question gets an answer, or the string "unknown".
DISCOVERY = {
    "user_and_workflow": [
        "Who asks the questions, and how often?",
        "What do they do today when they cannot find the answer?",
        "Where does the pain actually show up — time, errors, escalations?",
    ],
    "success_metric": [
        "What number would make this project a success?",
        "How will we measure it — and how often?",
        "What is good enough for version one?",
    ],
    "constraints": [
        "Where does the data live? Can it leave that network?",
        "Who may see the answers? Any PII or regulated content?",
        "What is the cost budget per question? Latency budget?",
        "What happens when the system gives a wrong answer?",
    ],
    "ownership": [
        "Who owns this after handover?",
        "Who maintains the eval set and reviews failures?",
        "Who gets paged when it breaks?",
    ],
}

ANSWERS = {
    "user_and_workflow": ["unknown", "unknown", "unknown"],
    "success_metric": ["unknown", "unknown", "unknown"],
    "constraints": ["unknown", "unknown", "unknown", "unknown"],
    "ownership": ["unknown", "unknown", "unknown"],
}


def report(answers):
    """Print what we know, and count what we still need to find out."""
    total_unknown = 0
    for group, questions in DISCOVERY.items():
        print(f"\n[{group}]")
        for q, a in zip(questions, answers[group]):
            mark = "OK " if a != "unknown" else "?? "
            if a == "unknown":
                total_unknown += 1
            print(f"  {mark}{q} -> {a}")
    print(f"\n{total_unknown} questions still unanswered.")
    if total_unknown:
        print("Do not design yet. Go ask.")
    else:
        print("Ready to sketch the architecture.")


if __name__ == "__main__":
    report(ANSWERS)
```

Run it with everything marked "unknown" and it says the honest thing: do not design yet.

Fill in a few answers — the docs cannot leave the customer's network, and a wrong answer is a compliance problem — and the architecture starts to narrow itself.

The checklist is not bureaucracy. It is what stops you building a cloud RAG system for a customer whose data is not allowed to leave the building.

## What I took away

No box until I can write down the user, the metric, and the one constraint that matters most.
I write the brief back in my own words before I propose anything.
If I cannot answer those, I am still guessing.
