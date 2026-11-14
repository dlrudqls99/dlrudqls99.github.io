---
layout: post
title: "How LLM Tool Calling Works: Building a Simple Agent Loop"
date: 2026-11-14
categories: [AI, Agents]
tags: [llm, tool-calling, agents, python, study-notes]
---

An LLM on its own can only talk. Tool calling is what lets it *do* things: search the web, run a calculation, query a database. The model never executes anything itself — it asks my code to execute a tool, and my code decides whether to comply. Understanding that loop precisely made a lot of agent frameworks suddenly look simple, so I wrote it down.

## The loop

```
1. Send the user's question + a list of tool definitions to the model.
2. The model either answers directly, or replies: "call tool X with these arguments."
3. My code runs the tool and gets a result.
4. Send the result back to the model.
5. The model answers using the result — or asks for another tool call.
   Repeat from 3 until there is a final answer (or a step limit hits).
```

That is the whole pattern. Agent frameworks add state, retries, and nicer APIs, but the skeleton is these five steps.

## A concrete example: a Wikipedia search tool

Say the user asks a factual question: *"Who was the second person to walk on the moon?"* The model may not know, so I give it one tool:

```python
tools = [{
    "name": "wikipedia_search",
    "description": "Search Wikipedia and return the top result's summary.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"}
        },
        "required": ["query"],
    },
}]
```

The tool itself is ordinary code. Wikipedia has a public API that needs no key:

```python
import requests

def wikipedia_search(query: str) -> str:
    resp = requests.get(
        "https://en.wikipedia.org/w/api.php",
        params={
            "action": "query",
            "list": "search",
            "srsearch": query,
            "format": "json",
        },
        headers={"User-Agent": "study-notes/1.0"},
        timeout=10,
    )
    results = resp.json()["query"]["search"]
    if not results:
        return "No results found."
    top = results[0]["title"]
    page = requests.get(
        "https://en.wikipedia.org/w/api.php",
        params={
            "action": "query",
            "prop": "extracts",
            "exintro": True,
            "explaintext": True,
            "titles": top,
            "format": "json",
        },
        headers={"User-Agent": "study-notes/1.0"},
        timeout=10,
    )
    pages = page.json()["query"]["pages"]
    return next(iter(pages.values()))["extract"]
```

And the loop, in pseudocode that maps onto any provider's API:

```python
def ask(question: str, max_steps: int = 5) -> str:
    messages = [{"role": "user", "content": question}]
    for _ in range(max_steps):
        response = chat(messages, tools=tools)          # provider call
        tool_call = response.tool_calls[0] if response.tool_calls else None
        if tool_call is None:
            return response.text                        # final answer
        # validate before executing — see below
        result = run_tool(tool_call.name, tool_call.arguments)
        messages.append(response.message)
        messages.append({"role": "tool", "content": result})
    return "Stopped: too many steps."
```

## The parts that actually matter in production

**Validate before you execute.** The arguments come from a model, which means they are untrusted input. Check the tool name against an allowlist, validate argument types, and treat anything with side effects (sending mail, deleting data, paying) as approval-required, not automatic.

**Cap the loop.** A `max_steps` limit and a timeout are not optional. Models can ping-pong between tools, and an agent that never stops is a billing incident with extra steps.

**Make tools boring and single-purpose.** "Search Wikipedia and return a summary" works. "Do research" does not. Small tools with clear descriptions get called correctly; vague tools get called creatively.

**Log every step.** Question, tool call, arguments, result, final answer. When an agent misbehaves, the trace is the only way to know whether the model chose badly, the tool returned junk, or my parsing was wrong.

**Keep a history.** Recording each question and answer costs almost nothing and pays for itself the first time someone asks "what did it tell the user yesterday?" In-memory storage is fine for a study project; the moment it matters, write down what breaks when the process restarts, and move to a real store.

## Why this pattern is worth studying

Strip away the framework logos and most "AI agents" are this loop plus engineering discipline: validation, limits, logging, and tools designed like good APIs. If I can build the loop by hand once, I can evaluate any framework by asking what it adds beyond these five steps — and notice when the answer is "not much."
