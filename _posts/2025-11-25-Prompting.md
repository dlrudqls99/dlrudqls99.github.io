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

One thing I liked right away: you don't need to be a data scientist to write a prompt. Anyone can do it. But writing a prompt that actually works takes testing, because everything depends on how the model predicts the next token.

These are the parts that stood out to me.

## It’s All About the Configuration
The first thing that surprised me: prompting is not just about the words you type. It is also about the "knobs" in the model configuration.

* **The "Creativity" Knobs:** **Temperature** controls randomness. Low temperature gives steady, factual answers. High temperature gives more varied and unexpected ones.
* **Sampling Controls:** **Top-K** and **Top-P** decide which tokens the model can pick from. Top-K keeps only the top *K* most likely tokens. Top-P keeps tokens until their combined probability reaches P.
* **The "Goldilocks" Setting:** The paper suggests a starting point that is coherent but still a bit creative: Temperature 0.2, Top-P 0.95, and Top-K 30. If you want just facts, like math, set Temperature to 0.

## Moving Beyond Basic Prompts
The paper then moves from simple prompts to more complex ones.

### 1. The "Shot" Methodology
**Zero-shot** is just asking the model to do something without examples, like "Classify this movie review." When that is not enough, **Few-shot** usually works better: give 3 to 5 examples and the model follows the pattern.

### 2. Role & Context
The difference between **System**, **Contextual**, and **Role** prompting confused me at first, but it is simple once you see it:
* **System prompts** set the big picture: what the model is for and what it can do.
* **Role prompting** gives the model a persona, like a "travel guide" or a "cynical editor," which changes the style and tone.
* **Contextual prompts** give the background info needed for this one specific task.

## The Advanced Stuff: Making the AI "Think"
This was the part I enjoyed most. There are ways to make the model reason better instead of just answering quickly.

* **Step-Back Prompting:** Ask a general question about the topic *first*, then do the specific task. The model answers the specific part better when the background is already there.
* **Chain of Thought (CoT):** Models are bad at jumping straight to an answer for math and logic. CoT makes the model write the steps in between — literally "think step by step" — and accuracy goes up a lot.
* **Tree of Thoughts (ToT):** Instead of one straight line of reasoning, the model explores several paths at once, like a tree.
* **ReAct:** Short for "Reason and Act." The model reasons about a problem, then takes an action — using a tool or a search — then reasons again with the result.

## Coding and Automation
The paper also covers Gemini as a coding helper. It can write code, explain it, translate it to another language, and debug it. There is also **Automatic Prompt Engineering (APE)**, where the model writes its own prompt variants and tests them to find the best one. A model improving its own prompts felt a bit strange to me, but it works.

## My Favorite Best Practices
These tips from the "Best Practices" section are the ones I actually use:

1.  **Be Positive:** Tell the model what *to* do instead of only what *not* to do. Instructions work better than a list of bans.
2.  **Use JSON:** When you extract data, asking for JSON output forces structure and limits made-up answers.
3.  **Document Your Work:** This one matters most to me. Track your prompts, settings (temperature, etc.), and results in a spreadsheet. Otherwise you never know which change actually helped.
4.  **JSON Repair:** If the output gets cut off in the middle, a library like `json-repair` can fix the broken JSON instead of throwing it away.

## Final Thoughts
My biggest takeaway is that prompt engineering is an **iterative process**. You try something, look at the output, fix the prompt, and try again. It does not matter much whether the prompt is a simple zero-shot or a long reasoning chain like ReAct. What matters is the loop of testing and refining.

## References
- Boonstra, L. (Google). *Prompt Engineering Whitepaper*. [Available on Google Drive](https://drive.google.com/file/d/1AbaBYbEa_EbPelsT40-vj64L-2IwUJHy/view?pli=1)
