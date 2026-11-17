---
layout: post
title: "Understanding Loop Engineering in AI"
date: 2026-06-23
categories: [AI, Engineering, Automation]
tags: [loop-engineering, ai-agents, autonomous-systems, prompt-engineering]
---

I keep seeing the words "loop engineering" lately. First there was prompt engineering, then context engineering, then harness engineering, and now loops. I wanted to know what is actually new here, so I watched this video by a developer from Anthropic and took notes.

These are my notes, so I can come back to them later instead of rewatching the whole thing.

## What a loop actually is

Loop engineering means replacing the back-and-forth I do with an AI — I type a prompt, check the result, type again — with a system that runs that cycle by itself. The system manages, executes, and verifies tasks through AI agents, with much less human input in the middle.

It grew out of the earlier ideas:

- **Prompt Engineering**: writing good inputs to get good responses.
- **Context Engineering**: giving the AI enough context so its answers get better.
- **Harness Engineering**: controlling the AI's unintended outputs through management layers around it.

A loop system does four things. It starts tasks on a trigger. It runs in iterations, checking against the goal as it goes. It verifies results through a separate validation process. And it records memories, so future runs can improve on their own.

This is also where a loop is different from a **cronjob**. A cronjob just runs a fixed script on a schedule. A loop uses a model that is aware of the current state and makes decisions along the way. That difference sounded small to me at first. It is not.

## Two layers

The video splits a loop into two layers.

The **inner loop** is what happens inside one agent: it sets a goal, executes the task, checks the result, and repeats.

The **outer loop** sits above it. It coordinates multiple inner loops or tasks on its own, ideally without a human stepping in.

## The six parts of a loop

According to Eddy Ousmani, a well-designed loop has six components:

- **Automation** — triggers the loop and schedules it, based on conditions or events.
- **Work Tree** — manages parallel agents and tasks so they do not conflict with each other. Optional, mostly needed when things run at the same time.
- **Skill** — the encoded project knowledge, rules, or prompts that guide how the agent behaves.
- **Connector** — the interface to external tools and environments, like APIs and CLIs, so the agent can actually communicate with the real world.
- **Sub-agent** — specialized agents that split the work, for example one that generates and one that validates.
- **Memory** — the stored outcomes and states from earlier runs, used to inform and improve the next iterations.

## Two things a loop cannot skip

First, **trigger conditions**: a clear rule for when the loop starts. A failed test. A score below a threshold. Something concrete and defined in advance.

Second, a **verifiable goal**: a clear, measurable finish point, like tests passing or a performance score being reached. This is what stops the loop from running forever and wasting cost.

The video is blunt about this part. Without verification, a loop has no way to know it is done. It just keeps going, consuming tokens and money, and yields nothing.

## Why this is everywhere right now

As I understood it, there are four reasons.

Recent models like GPT-4 and Claude can run long autonomous tasks reliably. Earlier models frequently lost track of the work or failed early, so loops were not practical before.

Separating generation and evaluation into different roles improves quality and reduces bias. A generator cannot grade its own work honestly; a separate evaluator can.

Loops enable workflows that keep improving without a human in each round. The example given was **auto research**: agents run iterative experiments, keep the memory of what happened, and improve over time on their own.

And verification models have advanced, so a loop can now actually "know" when its goal is met.

## The demo: a website optimization loop

The concrete example was optimizing a lecture website's **Lighthouse score**. Lighthouse is Google's metric for page performance, accessibility, best practices, and SEO. The goal was a score of 90 or higher.

The loop assessed the site, modified it, and re-evaluated it, over and over. File sizes dropped step by step: **179KB → 134KB → 68KB**. Separate sub-agents handled the modification and the scoring, so the agent making changes was not the one grading them.

Costs were controlled with a capped number of iterations and manual triggers. In the end, the loop ran about three times, the scores improved stepwise, and it stopped when the improvement plateaued. That stopping part matters as much as the improving part.

## Advice I wrote down

**Start manually.** Do not fully automate a loop from day one. Begin with supervised runs and increase the autonomy little by little.

**Set hard limits.** Maximum iterations, budget thresholds, and escalation protocols for when a human needs to step in. An unattended loop without proper checks can quietly burn through tokens and money.

**Validation has to be accurate.** A loop is only as good as its checker. Without an accurate way to verify results, the loop just wastes resources producing meaningless output, faster.

**Use loops for the right work.** They fit repetitive tasks with clear verification: code refactoring, migration, review, optimization, integration. Be cautious with subjective or one-off work. A task with no clear verification, or a strictly one-time action, is a poor candidate for a loop. Not everything should use one.

## What I took away

The shift here is that the agents supervise themselves. A good loop combines the trigger, the task generation, the verification, the memory, and the separation between the agent that makes things and the agent that checks them. Put together well, that is what makes long-running work safe to leave alone.

But the point I underlined is this: the true value is not in knowing how to build loops. It is in the **impact measured by concrete improvements** — the score that actually went up, the file size that actually went down. AI is a tool to complete work efficiently, not an end in itself. Understanding the workflow comes before adopting the tool.

And even in the video's own framing, human oversight remains critical for some tasks. Loops do not replace all forms of quality control. They work best exactly where the goals are clear and the outcomes can be verified.

For me, the practical lesson is smaller. Before I automate anything, I need two things written down: a goal I can verify, and a limit I can enforce. If I cannot write those down, I am not ready for a loop.
