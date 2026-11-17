---
layout: post
title: "My Notes on \"Every React Concept Explained in 12 Minutes\""
date: 2026-10-18
categories: [Frontend, React]
tags: [react, javascript, hooks, study-notes]
---
I've been studying React so I can start building my own apps. I kept running into words like "reconciliation" or "hydration" and nodding along without really getting them. Then I found this video from Coding2GO, and it helped a lot.

<iframe width="560" height="315" src="https://www.youtube.com/embed/mOfWjc3SP6A" title="Every React Concept Explained in 12 Minutes" frameborder="0" allowfullscreen></iframe>

It's only 12 minutes, but it covers almost everything. These are my notes. I wrote them so I can come back here later instead of watching it again.

## Components

Everything in React is a component. A component is just a JavaScript function that returns markup. A button is a component, a navbar is a component, a whole page is a component. You build small pieces and put them together like Lego.

```jsx
function Greeting() {
  return <h1>Hello!</h1>;
}
```

## JSX

The thing that looks like HTML inside JavaScript is JSX. It's not real HTML. It gets compiled to JavaScript calls. A few differences confused me at first:

- `className` instead of `class`
- attributes are camelCase (`onClick`, not `onclick`)
- a component can only return **one** parent element

For that last rule you can wrap things in a **Fragment** (`<>...</>`) so you don't add an extra `div` to the page.

Curly braces `{}` let you put JavaScript inside JSX. Variables, function calls, ternaries for conditional rendering, all of it goes in there.

## Props

Props are how you pass data into a component. They work like function arguments.

```jsx
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

<Greeting name="KB" />
```

There's a special prop called `children`. Anything you put between the opening and closing tags goes into `children`. This is how you make layout components or wrappers.

## Keys

When you render a list with `.map()`, each item needs a unique `key`. React uses it to know which item is which when the list changes. I used the array index at first. It works until you reorder or delete items, and then weird bugs start showing up. Use a real ID.

## Rendering and the Virtual DOM

This part finally made it click for me. React doesn't touch the real DOM directly every time something changes. It goes like this:

1. State changes
2. React builds a new **virtual DOM** (a lightweight copy in memory)
3. It compares the new one with the old one. This is called **diffing**
4. It updates only the parts of the real DOM that actually changed

The whole process is called **reconciliation**. That's why React is fast even when the UI updates a lot.

## Event Handling

You attach events with props like `onClick` or `onChange` and pass a function. Pass the function itself, don't call it:

```jsx
<button onClick={handleClick}>Click</button>   // good
<button onClick={handleClick()}>Click</button> // runs on every render
```

I made this mistake more than once.

## State

State is the data a component remembers between renders. A normal variable gets reset every render, so React gives us `useState`:

```jsx
const [count, setCount] = useState(0);
```

You always update it with the setter. Changing `count` directly does nothing, because React doesn't know it changed and won't re-render.

**Controlled components** are form inputs whose value comes from state. The input shows the state, and `onChange` updates the state. Then the state is the single source of truth.

## Hooks

Hooks are functions that start with `use`. They can only be called at the top level of a component, not inside loops or `if` statements. The video groups them roughly like this:

- **State hooks**: `useState`, `useReducer`
- **Context hook**: `useContext`
- **Ref hook**: `useRef`
- **Effect hook**: `useEffect`
- **Performance hooks**: `useMemo`, `useCallback`

I won't need all of them right away. `useState` and `useEffect` are the ones I use every day so far.

## Purity and Strict Mode

A React component should be **pure**. Same input (props), same output (JSX). It shouldn't change outside variables while rendering.

**Strict Mode** helps catch mistakes during development. It renders components twice on purpose so impure code shows up. At first I thought my code was broken because my `console.log` ran twice. Nope, it was just Strict Mode.

## Effects

`useEffect` is for talking to things outside React: fetching data, timers, subscriptions, browser APIs.

```jsx
useEffect(() => {
  fetchUser(id);
}, [id]);
```

The array at the end is the dependency array. The effect runs again only when those values change. The video's advice, which I'm trying to follow: if you can do it without an effect, do it without an effect. A lot of my early `useEffect` calls were unnecessary.

## Refs

`useRef` gives you a box that keeps a value between renders **without** causing a re-render. The common use is grabbing a real DOM element, for example to focus an input.

## Context

Passing props down five levels just to reach one component is called **prop drilling**, and it gets messy fast. Context fixes this. You wrap a part of the tree in a provider, and any component inside can read the value with `useContext`. Theme and logged-in user are classic examples.

## Portals

A portal lets you render a component somewhere else in the DOM, outside its parent. Useful for modals, tooltips, and dropdowns that would otherwise get cut off by the parent's CSS.

## Suspense and Error Boundaries

**Suspense** shows a fallback (like a spinner) while a component or its data is still loading.

**Error Boundaries** catch errors in part of the tree and show a fallback UI instead of crashing the whole app with a blank white screen.

## Server Components and Hydration

The last part was about newer stuff. **Server Components** run on the server, so they can fetch data directly and send less JavaScript to the browser. **Hydration** is when React takes HTML that was already rendered on the server and attaches the event handlers in the browser so it becomes interactive. You mostly see these when using a framework like Next.js.

## What I Took Away

What I liked about this video is that it shows how everything connects. Components use props and state, state changes trigger a re-render, and reconciliation makes that re-render cheap. Once that loop made sense, hooks and effects felt much less random.

My plan now is to build a small app and actually use these instead of just reading about them. I'll probably come back and fix these notes once I get things wrong in practice.
