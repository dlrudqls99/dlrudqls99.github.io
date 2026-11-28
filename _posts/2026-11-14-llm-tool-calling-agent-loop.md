---
layout: post
title: "How LLM Tool Calling Works: Building a Simple Agent Loop"
date: 2026-11-14
categories: [AI, Agents]
tags: [llm, tool-calling, ai-agents, python]
---

Tool calling confused me at first because the name sounds like the model runs code. It doesn't.

The short version: the model only writes a request — "call this tool with these arguments." My code runs the tool, and my code can also say no. Once I understood that, agent frameworks stopped looking like magic. Most of them are this one loop with better packaging.

## Five steps are the whole loop

```
1. Send the user's question + a list of tool definitions to the model.
2. The model either answers directly, or replies: "call tool X with these arguments."
3. My code runs the tool and gets a result.
4. Send the result back to the model.
5. The model answers using the result — or asks for another tool call.
   Repeat from 3 until there is a final answer (or a step limit hits).
```

That is really the whole thing. Frameworks add state, retries, and nicer APIs on top, but the skeleton is these five steps.

## One small tool is enough to learn it

Say the user asks: *"Who was the second person to walk on the moon?"* The model might not know, so I give it one tool:

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

The tool itself is just normal code. Wikipedia has a public API that needs no key:

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

And the loop. This is pseudocode, but it maps onto any provider's API:

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

## Model output is untrusted input, so check before you run anything

The arguments come from a model, so they are untrusted input, same as text from a web form. I check the tool name against a list of allowed tools and validate the argument types.

Anything with real side effects — sending mail, deleting data, paying for something — should need a human's approval, not run on its own.

## An uncapped loop just burns money

A step limit and a timeout are not optional. Models sometimes bounce between two tools forever, and an agent that never stops just burns money.

## Small, boring tools get called correctly

"Search Wikipedia and return a summary" works well. "Do research" does not.

Small tools with clear descriptions get called correctly. Vague tools get called in creative ways I did not expect.

## Without logs, you cannot tell what went wrong

Log every step: the question, the tool call, the arguments, the result, the final answer.

When an agent does something wrong, the log is the only way to tell what happened. Did the model choose the wrong tool, did the tool return junk, or was my parsing broken?

## History is cheap until the process restarts

Saving each question and answer costs almost nothing. It pays off the first time someone asks "what did it tell the user yesterday?"

In-memory storage is fine for a study project. The moment it matters, I move to a real database — everything in memory is gone when the process restarts.

## What I took away

Building the loop by hand once taught me more than reading about three frameworks.
Now I ask what a framework adds: validation, limits, logging, well-designed tools.
Sometimes the answer is "a lot." Sometimes it is "not much, but with nice docs."
