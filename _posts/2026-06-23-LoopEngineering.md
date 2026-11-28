---
layout: post
title: "Understanding Loop Engineering in AI"
date: 2026-06-23
categories: [AI, Engineering, Automation]
tags: [ai-agents, loop-engineering, prompt-engineering]
---

First there was prompt engineering, then context engineering, then harness engineering. Now I keep seeing "loop engineering," so I watched a video by a developer from Anthropic to find out what is actually new.

The short version: a loop replaces my back-and-forth with an AI — prompt, check, prompt again — with a system that runs that cycle by itself. It only works if it has two things written down first: a trigger and a goal it can verify.

These are my notes, so I can come back to them instead of rewatching the whole thing.

## A loop is not a cronjob

A cronjob runs a fixed script on a schedule. A loop is different.

A loop uses a model that knows the current state and makes decisions along the way. That difference sounded small to me at first. It is not.

The system manages, executes, and verifies tasks through AI agents, with much less human input in the middle.

## No trigger and no verifiable goal, no loop

Two parts cannot be skipped. First, a trigger: a clear rule for when the loop starts. A failed test. A score below a threshold. Something concrete, defined in advance.

Second, a verifiable goal: a measurable finish point, like tests passing or a performance score being reached.

Without verification, a loop has no way to know it is done. It just keeps going, consuming tokens and money, and yields nothing. The goal is what stops it from running forever.

## The maker never grades its own work

A loop has two layers. The inner loop runs inside one agent: set a goal, execute, check the result, repeat.

The outer loop sits above it. It coordinates multiple inner loops or tasks on its own, ideally without a human stepping in.

Separating generation and evaluation into different roles improves quality and reduces bias. A generator cannot grade its own work honestly. A separate evaluator can.

## A well-designed loop has six parts

According to Eddy Ousmani, the six components are:

- **Automation** — triggers the loop and schedules it, based on conditions or events.
- **Work Tree** — manages parallel agents and tasks so they do not conflict. Optional, mostly needed when things run at the same time.
- **Skill** — the encoded project knowledge, rules, or prompts that guide how the agent behaves.
- **Connector** — the interface to external tools and environments, like APIs and CLIs.
- **Sub-agent** — specialized agents that split the work, for example one that generates and one that validates.
- **Memory** — the stored outcomes and states from earlier runs, used to improve the next iterations.

## The demo cut a page from 179KB to 68KB

The concrete example was a lecture website. The goal was a Lighthouse score of 90 or higher — Google's metric for page performance, accessibility, best practices, and SEO.

The loop assessed the site, modified it, and re-evaluated it, over and over. File sizes dropped step by step: **179KB → 134KB → 68KB**.

Separate sub-agents handled the modification and the scoring. The agent making changes was not the one grading them.

Costs stayed controlled with a capped number of iterations and manual triggers. The loop ran about three times and stopped when the improvement plateaued. The stopping matters as much as the improving.

## Loops are practical now for four reasons

Recent models like GPT-4 and Claude can run long autonomous tasks reliably. Earlier models lost track of the work or failed early, so loops were not practical before.

Verification models have also advanced, so a loop can now actually "know" when its goal is met.

And loops enable workflows that keep improving without a human in each round. The example given was **auto research**: agents run iterative experiments, keep the memory of what happened, and improve over time on their own.

## Start supervised, and set hard limits

Do not fully automate a loop from day one. Begin with supervised runs and increase the autonomy little by little.

Set hard limits: maximum iterations, budget thresholds, and escalation protocols for when a human needs to step in. An unattended loop without proper checks can quietly burn through tokens and money.

Use loops for the right work. They fit repetitive tasks with clear verification: code refactoring, migration, review, optimization, integration. Be cautious with subjective or one-off work. Not everything should use one.

## What I took away

Before I automate anything, I write down a goal I can verify and a limit I can enforce. If I cannot write those down, I am not ready for a loop.

The value is not the loop itself. It is the measured improvement — the score that went up, the file size that went down.
