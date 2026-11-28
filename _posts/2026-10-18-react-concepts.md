---
layout: post
title: "My Notes on \"Every React Concept Explained in 12 Minutes\""
date: 2026-10-18
categories: [Frontend, React]
tags: [react, javascript, hooks]
---
I kept nodding at words like "reconciliation" and "hydration" without really getting them. Then a 12-minute video from Coding2GO filled in the gaps.

That helped because React is one loop, not a pile of terms. The short version: components hold props and state, a state change triggers a re-render, and reconciliation makes that re-render cheap.

<iframe width="560" height="315" src="https://www.youtube.com/embed/mOfWjc3SP6A" title="Every React Concept Explained in 12 Minutes" frameborder="0" allowfullscreen></iframe>

These are my notes from the video, so I can come back here instead of watching it again.

## Everything is a component, and components are just functions

A component is a JavaScript function that returns markup. A button is a component. A navbar is a component. A whole page is a component.

You build small pieces and put them together like Lego.

```jsx
function Greeting() {
  return <h1>Hello!</h1>;
}
```

Props pass data into a component, like function arguments.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

<Greeting name="KB" />
```

The special prop is `children`. Anything between the opening and closing tags goes into `children`. That is how you make layout components and wrappers.

## JSX looks like HTML, but it is JavaScript

JSX is not real HTML. It gets compiled to JavaScript calls.

Three differences confused me at first. It uses `className` instead of `class`. Attributes are camelCase — `onClick`, not `onclick`. And a component can return only one parent element.

For that last rule, wrap things in a Fragment (`<>...</>`) so you do not add an extra `div`. Curly braces `{}` put JavaScript inside JSX: variables, function calls, and ternaries for conditional rendering.

## Pass the function, do not call it

You attach events with props like `onClick` or `onChange` and pass a function. Pass the function itself. Do not call it:

```jsx
<button onClick={handleClick}>Click</button>   // good
<button onClick={handleClick()}>Click</button> // runs on every render
```

I made this mistake more than once.

Lists have a similar trap. When you render a list with `.map()`, each item needs a unique `key`, so React knows which item is which when the list changes.

I used the array index at first. It works until you reorder or delete items, and then weird bugs show up. Use a real ID.

## State changes are what make React fast — and predictable

React does not touch the real DOM every time something changes. It follows four steps:

1. State changes.
2. React builds a new virtual DOM, a lightweight copy in memory.
3. It compares the new one with the old one. This is diffing.
4. It updates only the parts of the real DOM that actually changed.

The whole process is called reconciliation. That is why React stays fast even when the UI updates a lot.

State is the data a component remembers between renders. A normal variable resets every render, so React gives us `useState`:

```jsx
const [count, setCount] = useState(0);
```

Always update state with the setter. Changing `count` directly does nothing, because React does not know it changed and will not re-render.

Controlled components follow the same rule. A form input shows the state, and `onChange` updates the state. The state is the single source of truth.

## Hooks follow two rules, and two of them do most of the work

Hooks are functions that start with `use`. Call them only at the top level of a component, never inside loops or `if` statements.

The video groups them roughly like this:

- **State hooks**: `useState`, `useReducer`
- **Context hook**: `useContext`
- **Ref hook**: `useRef`
- **Effect hook**: `useEffect`
- **Performance hooks**: `useMemo`, `useCallback`

I will not need all of them right away. So far, `useState` and `useEffect` are the ones I use every day.

## Effects are for leaving React, so use them only when you must

`useEffect` is for talking to things outside React: fetching data, timers, subscriptions, browser APIs.

```jsx
useEffect(() => {
  fetchUser(id);
}, [id]);
```

The array at the end is the dependency array. The effect runs again only when those values change.

The video's advice is the rule I am trying to follow: if you can do it without an effect, do it without an effect. A lot of my early `useEffect` calls were unnecessary.

Refs solve a different problem. `useRef` gives you a box that keeps a value between renders without causing a re-render. The common use is grabbing a real DOM element, for example to focus an input.

## Pure components make bugs easier to find

A React component should be pure. Same input (props), same output (JSX). It should not change outside variables while rendering.

Strict Mode helps catch mistakes during development. It renders components twice on purpose, so impure code shows up.

At first I thought my code was broken because my `console.log` ran twice. Nope, it was just Strict Mode.

## Context, portals, and fallbacks each fix one specific pain

Passing props down five levels to reach one component is called prop drilling. It gets messy fast.

Context fixes it. Wrap part of the tree in a provider, and any component inside can read the value with `useContext`. Theme and logged-in user are the classic examples.

A portal renders a component somewhere else in the DOM, outside its parent. It is useful for modals, tooltips, and dropdowns that would otherwise get cut off by the parent's CSS.

Suspense shows a fallback, like a spinner, while a component or its data is still loading. Error Boundaries catch errors in part of the tree and show a fallback UI instead of crashing the whole app with a blank white screen.

## Server Components send less JavaScript, and hydration makes the page live

Server Components run on the server. They can fetch data directly and send less JavaScript to the browser.

Hydration is what happens next. React takes HTML already rendered on the server and attaches the event handlers in the browser, so it becomes interactive.

You mostly see these when using a framework like Next.js.

## What I took away

Build a small app and use these ideas, instead of just reading about them.
State changes, re-renders, and reconciliation are the loop to remember.
If I can do it without an effect, I will.
