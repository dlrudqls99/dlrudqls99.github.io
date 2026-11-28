---
layout: post
title: "My Deep Dive into Prompt Engineering: Thoughts on Google’s Latest"
date: 2025-11-25
categories:
  - Knowledge Base
tags:
  - prompt-engineering
  - llm
---

I read Google's prompt engineering whitepaper by Lee Boonstra and wrote down the parts I wanted to remember.

One thing I liked right away: you don't need to be a data scientist to write a prompt. Anyone can do it. The short version: a prompt is the words plus the model configuration, examples beat bare instructions, and nothing works without testing — because everything depends on how the model predicts the next token.

## The knobs matter as much as the words

This surprised me first. Prompting is not just about the words you type. It is also about the configuration.

**Temperature** controls randomness. Low gives steady, factual answers. High gives more varied, unexpected ones.

**Top-K** and **Top-P** decide which tokens the model can pick from. Top-K keeps only the top *K* most likely tokens. Top-P keeps tokens until their combined probability reaches P.

A starting point that is coherent but still a bit creative: Temperature 0.2, Top-P 0.95, Top-K 30. If you want just facts, like math, set Temperature to 0.

## Three to five examples beat no examples

**Zero-shot** is asking the model to do something without examples, like "Classify this movie review."

When that is not enough, **Few-shot** usually works better. Give 3 to 5 examples, and the model follows the pattern.

## System, role, and context prompts do three different jobs

This confused me at first. It is simple once you see it side by side.

**System prompts** set the big picture: what the model is for and what it can do.

**Role prompting** gives the model a persona, like a "travel guide" or a "cynical editor," which changes the style and tone.

**Contextual prompts** give the background info needed for this one specific task.

## Four tricks make the model reason before it answers

This was the part I enjoyed most.

**Step-Back Prompting:** Ask a general question about the topic *first*, then do the specific task. The model answers the specific part better when the background is already there.

**Chain of Thought (CoT):** Models are bad at jumping straight to an answer for math and logic. CoT makes the model write the steps in between — literally "think step by step" — and accuracy goes up a lot.

**Tree of Thoughts (ToT):** Instead of one straight line of reasoning, the model explores several paths at once, like a tree.

**ReAct:** Short for "Reason and Act." The model reasons, takes an action — a tool or a search — then reasons again with the result.

## The model can write code, and even its own prompts

The paper also covers Gemini as a coding helper. It can write code, explain it, translate it, and debug it.

There is also **Automatic Prompt Engineering (APE)**, where the model writes its own prompt variants and tests them to find the best one. A model improving its own prompts felt strange to me, but it works.

## Four practices are the ones I actually use

**Be Positive:** Tell the model what *to* do instead of only what *not* to do. Instructions work better than bans.

**Use JSON:** When you extract data, asking for JSON output forces structure and limits made-up answers.

**Document Your Work:** This one matters most to me. Track your prompts, settings, and results in a spreadsheet. Otherwise you never know which change helped.

**JSON Repair:** If the output gets cut off mid-way, a library like `json-repair` can fix the broken JSON instead of throwing it away.

## References

- Boonstra, L. (Google). *Prompt Engineering Whitepaper*. [Available on Google Drive](https://drive.google.com/file/d/1AbaBYbEa_EbPelsT40-vj64L-2IwUJHy/view?pli=1)

## What I took away

Prompt engineering is a loop: try something, look at the output, fix the prompt, try again.
I write down every prompt, setting, and result.
Zero-shot or a long reasoning chain — the loop matters more than the technique.
