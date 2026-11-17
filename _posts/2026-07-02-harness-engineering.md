---
layout: post
title: "Harness Engineering: Building AI Working Environments That Deliver"
date: 2026-07-02
categories: [AI, Engineering, Best-Practices]
tags: [harness-engineering, ai-agents, context-management, prompt-engineering, workflow-design]
---

Sometimes I use the same model with almost the same prompt and get a much worse result than the day before. My first instinct was to blame the model. This lecture argues the problem is usually somewhere else: the environment the AI is working in.

These are my notes from the lecture.

## Same model, different results

Even with the same AI model and the same prompt, results can be inconsistent. The lecture's point is that this does not necessarily mean the model is the problem. The AI may be working in a different "environment" each time — a different **harness**.

Apparently, this is where engineers in Silicon Valley put their effort. Less on the model's limitations, more on improving the environment around the model.

## Where prompt engineering stops

Prompt engineering is a real skill, and it does improve the quality of responses. But it is optimized for individual conversations, and it is not well suited to long-term projects.

In large-scale work that spans many sessions, explaining the same context and the same rules again and again becomes inefficient. I have felt this myself, re-typing the same background at the start of every session.

## What harness engineering is

**Harness engineering** is the practice of designing that environment on purpose: the context, the verification loops, the workflows, the rules, and everything else the AI needs to complete work effectively. Done well, the AI can perform tasks more reliably and more independently.

The example that stuck with me: a LangChain case where performance improved by **14%** by improving only the harness, with the same model and the same prompt environment. The improvement was related to AI model orchestration based on chain-of-thought approaches.

## The three stages

The lecture describes how this developed, in three stages:

| Stage | Description |
|---|---|
| Stage 1: Prompt Engineering | Writing effective prompts to improve the quality of AI responses |
| Stage 2: Context Engineering | Supplying the context, rules, and project information AI needs to work effectively |
| Stage 3: Harness Engineering | Designing the entire working environment, including verification loops, workflows, and environment orchestration |

## Four core elements

A harness has four core elements.

**1. Context.** The project habits, rules, and background information the AI needs to know.

**2. Limitations.** Rules and restrictions, such as prohibiting pushes to the main branch.

**3. Workflow.** The sequence of work, including planning, execution, and verification loops.

**4. Verification.** The systems for confirming whether the AI completed the work properly, including testing and review processes.

## Designing a harness: six axes

The lecture divides harness design into six major axes, each one part of a continuous cycle:

1. **Structure Design** — folder structure, tools, and environment setup.
2. **Context Configuration** — loading and managing the information the AI needs.
3. **Planning** — determining what work should be done and how it should be approached.
4. **Execution** — coordinating work instructions, agent patterns, and related processes.
5. **Verification** — evaluating outputs and ensuring reliability.
6. **Improvement** — identifying issues and redesigning the environment through iteration.

## Context: more is not better

This part corrected an assumption of mine. I used to think giving the AI more context is always better. The lecture says it is not. What matters is supplying the necessary information at the right time and in the right place.

In Claude Code, configuration files are structured across three layers:

1. User level
2. Project level
3. Folder or module level

Rules in the lower-level layers take priority.

A `CLAUDE.md` file should be kept lightweight, around **200 lines or fewer**. Longer documents should be separated into a rules folder and referenced only when needed.

There is also a tip about the conversation window itself. Managing context usage during actual work matters, and if token usage exceeds **40%**, the lecture recommends starting a new session. I have definitely let sessions run way past that.

## The part we can actually change

AI models are something we "rent" from external providers. We cannot directly control them.

The working environment is different. It is something developers can design and improve themselves. That is why environment design is such a practical path to better AI performance: it is the lever that is actually in our hands.

## Not only for coding

Harness engineering is not limited to coding. The lecture says it can also be applied to other repeated knowledge-work processes, such as YouTube content creation, research, data analysis, and webtoon production.

## Words I wrote down

**Harness Engineering** — the practice of designing and managing a working environment where AI can operate independently, reliably, and consistently.

**Prompt Engineering** — the technique of designing effective prompts to improve the quality of AI responses.

**Context Engineering** — the practice of providing AI with project information, rules, and background context to improve understanding and performance.

**Verification Loop** — a process for automatically testing and reviewing AI outputs to ensure quality and reduce errors.

**`CLAUDE.md`** — a configuration and rules document referenced during AI work. It should remain lightweight and focused on essentials.

## What I took away

The key to using AI successfully lies less in the model itself and more in the design of the environment around it. Moving beyond prompt refinement means building strong context structures, designing workflows, and introducing verification loops. That whole discipline is harness engineering.

A harness matters especially for complex and large-scale projects, and it is never really finished. Through gradual improvement and cyclical iteration, it increases both AI performance and reliability. The lecture's claim is that as experience with AI grows, the ability to design effective harnesses becomes a competitive advantage — the kind that can determine the success or failure of a project.

And since the same thinking extends beyond coding to other forms of knowledge work, it is probably worth learning even outside of software.

## Things that were not clear

Practical exercises and more detailed case studies are expected to be covered in later clips, so this one stays at the concept level.

Some technical terms, such as MCP and skill management, were mentioned only briefly in the video, and their detailed explanations remain unclear to me. I need to look those up separately.
