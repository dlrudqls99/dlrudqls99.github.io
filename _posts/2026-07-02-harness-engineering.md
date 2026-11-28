---
layout: post
title: "Harness Engineering: Building AI Working Environments That Deliver"
date: 2026-07-02
categories: [AI, Engineering, Best-Practices]
tags: [ai-agents, harness-engineering, prompt-engineering, context-management]
---

Sometimes I use the same model with almost the same prompt and get a much worse result than the day before. My first instinct was to blame the model.

This lecture argues the problem is usually somewhere else: the environment the AI is working in. The short version: in one LangChain case, performance improved by **14%** by improving only the harness — same model, same prompt environment. These are my notes from the lecture.

## The model is rented; the environment is ours

AI models are something we "rent" from external providers. We cannot directly control them.

The working environment is different. Developers can design and improve it themselves.

That is why environment design is such a practical path to better AI performance. It is the lever that is actually in our hands. Apparently, this is also where engineers in Silicon Valley put their effort: less on the model's limitations, more on the environment around it.

## A harness is the whole working environment, designed on purpose

**Harness engineering** is designing that environment: the context, the verification loops, the workflows, the rules, and everything else the AI needs to complete work effectively.

Done well, the AI can perform tasks more reliably and more independently.

A harness has four core elements:

**1. Context.** The project habits, rules, and background information the AI needs to know.

**2. Limitations.** Rules and restrictions, such as prohibiting pushes to the main branch.

**3. Workflow.** The sequence of work, including planning, execution, and verification loops.

**4. Verification.** The systems for confirming whether the AI completed the work properly, including testing and review processes.

## Prompt engineering stops at one conversation

Prompt engineering is a real skill, and it does improve the quality of responses. But it is optimized for individual conversations.

It is not well suited to long-term projects. In work that spans many sessions, explaining the same context and the same rules again and again becomes inefficient. I have felt this myself, re-typing the same background at the start of every session.

The lecture describes how this developed, in three stages:

| Stage | Description |
|---|---|
| Stage 1: Prompt Engineering | Writing effective prompts to improve the quality of AI responses |
| Stage 2: Context Engineering | Supplying the context, rules, and project information AI needs to work effectively |
| Stage 3: Harness Engineering | Designing the entire working environment, including verification loops, workflows, and environment orchestration |

## More context is not better

This part corrected an assumption of mine. I used to think giving the AI more context is always better. It is not.

What matters is supplying the necessary information at the right time and in the right place.

In Claude Code, configuration files are structured across three layers: user level, project level, and folder or module level. Rules in the lower-level layers take priority.

A `CLAUDE.md` file should stay lightweight, around **200 lines or fewer**. Longer documents should be separated into a rules folder and referenced only when needed.

The conversation window needs managing too. If token usage exceeds **40%**, the lecture recommends starting a new session. I have definitely let sessions run way past that.

## Harness design runs on six axes, in a cycle

The lecture divides harness design into six major axes, each one part of a continuous cycle:

1. **Structure Design** — folder structure, tools, and environment setup.
2. **Context Configuration** — loading and managing the information the AI needs.
3. **Planning** — determining what work should be done and how it should be approached.
4. **Execution** — coordinating work instructions, agent patterns, and related processes.
5. **Verification** — evaluating outputs and ensuring reliability.
6. **Improvement** — identifying issues and redesigning the environment through iteration.

## It is not only for coding

Harness engineering is not limited to coding. The lecture says it also applies to other repeated knowledge-work processes: YouTube content creation, research, data analysis, and webtoon production.

Two things are still unclear to me. The practical exercises are covered in later clips, and terms like MCP and skill management were only mentioned briefly. I need to look those up separately.

## What I took away

When the result gets worse, I check the environment before I blame the model. A harness is never finished — I improve it in cycles.

I keep `CLAUDE.md` under 200 lines, and I start a new session before the context window fills up.
