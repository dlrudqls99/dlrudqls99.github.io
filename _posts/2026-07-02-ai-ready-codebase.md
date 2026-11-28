---
layout: post
title: "AI-Ready Codebase Design and Token Cost Optimization"
date: 2026-07-02
categories: [AI, Engineering, Cost-Optimization]
tags: [ai-agents, token-optimization, codebase-design]
---

I used to think an AI coding agent reads some code, writes some code, and is done. This lecture broke that model.

Most of the cost, and most of the failures, happen before any code is written. The agent is just trying to find its way around.

The short version: cut exploration cost first with a map of the codebase, then cut repeat cost with cache discipline, and measure both at team level, not on your own.

## Exploration can eat 80% of the tokens

In one payment task, an agent missed 5 out of 40 related files. It modified duplicate payment code instead, and then broke the tests.

In cases like that, 80% of token usage can go to exploration. Only 20% goes to the actual change.

The failure was not poor code quality by itself. It was the cost of exploration and understanding. If the agent cannot find the right place, it reads code it does not need and builds things that already exist.

## An agent starts from zero every session

An AI-ready codebase is one an agent can enter in a new session and work in accurately, without losing its way.

A human developer may need about a week to learn a codebase. An agent has the same problem, except it has to re-evaluate its surroundings every time it enters a session.

That is why the work splits into two steps: check the codebase is healthy, then build it a map.

## A map is useless on an unhealthy codebase

Health comes first. That means test coverage, dead code removal, consistent conventions, and removing code smells.

If the codebase is unhealthy, an accurate exploration map is meaningless. The map would just describe the mess more precisely.

## Cartography gives the agent coordinates

The second step is cartography: a customized codebase map for agents.

It lists entry points, dependency graphs, and a domain glossary. It also marks disposable or safe-to-change areas, and gives accurate task paths.

The point is instruction coordinates. The agent should recognise the correct entry point at once, instead of searching for it. So the map is more than documentation: it also includes verification routines and path information.

An AI Readiness Cartography Skill automates this. It scores navigation, context quality, documentation level, dependency mapping, verification status, freshness, and outcomes, then presents the results as a report.

In the demo, on an actual project, navigation scored low and context document quality scored well. The generated map included `CLAUDE.md` and architecture documentation, showing the entry paths agents should reference.

The report also gave an ROI action plan. The suggested actions were splitting and refining `CLAUDE.md`, automating PR verification, introducing visualisation, and using ADRs (Architecture Decision Records).

One-time checks have limited effect, though. Diagnosis, reporting, PR creation, and code application should be automated, so checking stays regular and cheap.

## The old quality rules now do new jobs

Test coverage, conventions, and dead code removal still matter. In the AI era, they do different jobs.

Test coverage is a signal system. It lets an agent verify its own work. Test code is central here, because it lets agents detect and fix errors inside their feedback loops.

Consistent conventions let agents generalise and reuse patterns. Dead code removal stops agents following incorrect exploration routes. Removing code smells stops them reproducing low-quality code.

The practices were the ones I already knew. The reasons changed.

## Tokens turn into real money fast

The numbers from the lecture: 500,000 input tokens cost about 5 USD, with 100,000 output tokens included. Over 20 days, that is about 100 USD for one person a month.

For a team of 20, it is about 1,000 USD a month. Over 12 months, about 12,000 USD a year.

| Category | Approximate Token Count | Cost |
|---|---:|---:|
| Input tokens | 500,000 tokens | About 5 USD |
| Output tokens | 100,000 tokens | Included |
| Individual monthly usage | Based on 20 days | About 100 USD |
| Team usage | Based on 20 people | About 1,000 USD |
| Annual usage | Team basis, 12 months | About 12,000 USD |

In large organizations, costs can rise exponentially. Large codebases, second brains, and specification documents can consume hundreds of thousands of tokens.

Individuals tend to use AI carefully, because they pay the bill directly. At company level, people often lack cost awareness and use AI as if it were unlimited. That is why this needs leadership-level control policies, plus the dashboards and cost gates below.

## A token is not a word, and Korean costs more

A token is the smallest unit of text a model processes. Text is split with a BPE (Byte Pair Encoding) vocabulary, so it does not match words one-to-one.

English runs at about 0.75 words per token. Code is similar. Korean runs at about 1.5 to 2 characters per token, roughly twice as costly.

Korean can be used. But English is recommended when cost efficiency is the priority.

## Cache reads cost about a tenth of cache writes

When the same prefix is sent again and again, the server caches the computation. That prefix is then handled as a cache read, not a normal input token.

A cache read is much cheaper than a cache write, roughly one-tenth of the cost. Repeated text across sessions, such as `CLAUDE.md` and system prompts, should use caching.

The cache TTL (Time To Live) is about 5 minutes. After that it expires and must be written again, so long continuous sessions get the most benefit.

Reconnecting during work, or changing the prefix, can raise cost sharply. Switching models mid-session, from Opus to Sonnet for example, can remove the cache benefit entirely. When a session is restored, token limits may force re-input, which is another sudden increase. The lecture gave a real case where Claude Code asked the user whether cache loss was acceptable, and recommended compacting the session instead.

So the writing rule is simple. Fixed information, such as `CLAUDE.md` and second-brain content, goes in the cacheable area. Variable information, such as the current time or the user message, goes in the cache-miss area. Putting the current time later in the prompt maximizes the cacheable area.

## Six techniques cover most of the saving

1. Read large files once and use cache effectively. Claude Code handles some of this automatically.
2. Place `CLAUDE.md` near the top of the document structure for quick reference.
3. Delegate heavy exploration tasks to separate sub-agents to prevent excessive output token usage during exploration.
4. Use compacting for long sessions, while recognizing that starting a new session is sometimes more efficient.
5. Do not change the prefix or model in the middle of a session.
6. Reuse results from the same engine call to avoid duplicate token consumption.

These work better when users understand the basics of how agents work. The anti-patterns are the mirror image: repeatedly sending large files every session, duplicating context input, keeping a prefix cache that will not be used within 5 minutes, frequent `CLAUDE.md` and session resets, careless offloading, and simply retaining completed work nodes, which wastes context.

One warning matters. Cutting cost too aggressively can also cut AI performance.

## A good dashboard starts with cache utilisation

The lecture parses JSON log files from Claude Code sessions automatically. The logs hold input tokens, output tokens, and cache read and write information, and the script turns them into token and cost dashboard reports.

It visualizes session-level and project-level efficiency, cost, cache hit rate, and tool call frequency. Scoring is rubric-based, and each team can customize it.

| Metric | Description | Top Score Standard |
|---|---|---|
| Cache utilization | Ratio of cache read tokens compared to input tokens | 0.85 or higher |
| Output token density | Ratio of input tokens to output tokens | If too low, it may indicate excessive exploration |
| Tool call frequency | Number of tool calls per 1K output tokens | 2 to 10 is appropriate; 20 or more indicates excessive exploration |
| Total cost | USD-converted cost by session and project | Varies by situation; teams should identify an appropriate level |

The higher the cache utilisation, the less unnecessary retransmission, and the greater the saving.

In a test project, there were 31 active sessions and 347 USD in total cost, an average of 11 USD per session. The cache hit rate was 89%, the average number of tool calls was 13, and the score was around 90 points. That was acceptable overall, but it could decline as the amount of work increases.

The dashboard also surfaces fixes. Too many cache misses, insufficient compacting, or excessive offloading.

## Dashboards explain the past; cost gates act now

A dashboard visualizes past cost data. A cost gate monitors cost in real time, with proactive alerts or controls.

At session level, a gate can warn or stop execution when token usage passes a threshold. At PR level, if cumulative session cost passes a threshold, it can trigger labelling and follow-up optimisation actions.

Together, the gate and the dashboard combine real-time control with post-work improvement.

## What I took away

I fix exploration before I blame the model.
I keep the prefix and the model stable inside a session.
I watch cost at team level, because one careful person does not fix a team's bill.
