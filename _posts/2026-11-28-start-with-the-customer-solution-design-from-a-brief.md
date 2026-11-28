---
layout: post
title: "Start With the Customer: Solution Design From a Brief"
date: 2026-11-28
categories: [ai-agents]
tags: [solution-design, discovery, fde, system-design]
---

I used to start a design problem the same way every time: someone gives me a brief, and I start drawing boxes. Database here, API there, maybe a vector store if it sounds like a RAG problem. It felt productive. It was also backwards.

The thing I kept missing is that a brief is not a spec. A brief is a sentence someone wrote when they were in a hurry, about a problem they feel more than they can describe. If I jump straight to architecture, I am solving the sentence, not the problem. And the sentence is usually wrong in at least one important way.

I started this topic because an interviewer once asked me something that sounded simple — "a customer wants an AI system that reads their documents and answers questions" — and I answered with an architecture before I asked a single question about the customer. Looking back, that was the whole mistake. The architecture was fine. The answer was still wrong, because I had no idea what "works" meant to them.

## The discovery questions I now ask first

I keep a short list now, and I actually write it down before a design discussion so I do not skip it under pressure. Four groups of questions.

First, who is this for and what do they actually do today? Not "what is the use case" in the abstract — what does a person do on a Tuesday afternoon, and where does it hurt? A support agent answering the same question forty times a day has a different problem from a compliance officer who needs one answer a month to be exactly right. Same brief, completely different system.

Second, what does success look like, in a number? "Faster" is not a number. "Answer in under five seconds, correct 95% of the time, and cut escalations by a third" is a number, and it changes the design. If the customer cannot give me a number yet, that is fine — but then the first deliverable is finding the number, not building the system. I learned this the slow way: I once built something that was technically good and nobody could tell whether it helped, because we had never agreed on what "helped" meant.

Third, what are the constraints that will actually decide the design? This is the part I used to treat as an afterthought. Where does the data live, and can it leave that place? Who is allowed to see the answers? How much can it cost per request? What happens when the system is wrong — is a wrong answer annoying, or is it a compliance incident? In a locked-down environment, the answer to "can the data leave the building" can rule out half the architectures before you start. I would rather find that out in minute ten than in week six.

Fourth, who decides, and what happens after I leave? A system that only works while I am in the room is not a delivered system. Who owns it, who maintains the eval set, who gets paged when it breaks — if those questions have no answer, the design is not finished, no matter how clean the diagram looks.

## From answers to architecture — but only after

Only after those questions do I start drawing boxes, and the nice thing is that the drawing gets easier. The discovery answers do most of the deciding for you.

If the data cannot leave the customer's network, you are looking at an on-prem or VPC deployment, and that rules out a whole class of managed services. If the answers need citations, retrieval is not optional, and you need to think about chunking and evaluation from day one. If the main pain is volume — hundreds of near-identical questions — caching and a small model might beat a big model with a fancy pipeline. If the pain is accuracy on rare, high-stakes questions, you spend your effort on evaluation and human review instead.

The order matters more than the boxes. I have started thinking of it as a rule for myself: no architecture before I can write down the user, the success metric, and the one constraint that would kill the design. If I cannot write those three things down, I am not ready to design yet. I am still guessing.

There is also a smaller, practical habit that has helped me: write the brief back to the customer in my own words before proposing anything. "Here is what I heard you need, here is what success looks like, here is what I am assuming." It takes five minutes, and it catches misunderstandings when they are still cheap. People correct you generously at this stage. They correct you much less generously after you have built the wrong thing.

## A small exercise: turning a vague brief into a checklist

The thing I actually tried this week, in about fifteen minutes. Take a one-line brief — "build an AI assistant that answers questions about our product docs" — and turn it into a structured checklist with a tiny script. The point is not the code. The point is the habit of refusing to design from one sentence.

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

Run it with everything marked "unknown" and it says the honest thing: do not design yet. Fill in a few answers — say, the docs cannot leave the customer's network, and a wrong answer is a compliance problem — and suddenly the architecture starts to narrow itself. That is the whole point. The checklist is not bureaucracy. It is the thing that stops you building a cloud RAG system for a customer whose data is not allowed to leave the building.

## What I took away

Solution design does not start with a diagram. It starts with four questions: who is this for, what does success look like in a number, what constraints would kill the design, and who owns it after I leave. If I cannot answer those, I am guessing, and guessing with a nice architecture diagram is still guessing.

The habit I want to keep is small: write the brief back in my own words, and do not draw a box until I can write down the user, the metric, and the one constraint that matters most. It feels slower than starting with the design. It is faster than rebuilding the wrong system.
