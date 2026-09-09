# Intent: A ready-to-go Next.js baseline so new projects don't start from zero

- **Originator:** Nemanja (nemanja.vasic@productdock.com)
- **Date:** 2026-09-09
- **Status:** awaiting product owner review

## Problem

Every new project starts from zero. Each time I begin a Next.js app I hand-assemble the
same thing again: run `create-next-app`, install the same handful of libraries, set up
path aliases, write the same `cn()` helper, decide again where components, hooks, types,
server actions and API clients should live. It takes a chunk of time before any product
work happens, and the result comes out subtly different from the last one, because the
structural decisions get re-made from memory rather than read off something written down.

The concrete example that prompted this: I sat down to start a modern, production-grade
Next.js app in TypeScript and my first question wasn't about the product at all — it was
"what are the exact commands and what does the directory tree look like this time?"

This is solo friction — just me — but it recurs on every new project. [assumed] It also
costs me when I drive AI agents in a fresh project, since there are no written conventions
for them to follow either.

## Proposed outcome

I can go from nothing to a running, typechecking Next.js app in minutes rather than an
evening, without making any structural decisions along the way.

Observably:

- The stack below is already installed and wired, not chosen per project.
- The directory layout is already decided and present, so nothing has to be invented:
  app routes with layouts, error boundary and loading states; UI components; shared
  application components; lib utilities and API clients; custom hooks; global types;
  server actions.
- TypeScript strict mode and `@/*` path aliases work on first run.
- The `cn()` helper and an environment-variable pattern exist rather than being retyped.
- `npm run dev` and a typecheck both pass immediately, with no manual fix-up step.

## Affected users and systems

- **Users / roles:** me, as the only originator and consumer today. [assumed] AI coding
  agents working in the app are a second consumer, and [assumed] eventual readers of the
  knowledge app are a third.
- **Systems / services:** `ai-kgraph` itself — the Next.js app being built. It is a
  knowledge app about AI, and the AI-Native SDLC docs, the skills and the workflows are
  part of that app rather than separate repository furniture. Node/npm toolchain. The
  listed third-party libraries.
- **Data:** none. No customer, sensitive or regulated data is involved. The environment
  pattern must hold no real secrets — only an example.

## Constraints

- The stack is fixed and is not open for design debate: Next.js (App Router),
  TypeScript in strict mode, Tailwind CSS with `clsx` / `tailwind-merge`, shadcn/ui
  component architecture, `lucide-react` icons, `@tanstack/react-query` for server state,
  `zustand` for global client state. Reason: these are already my settled preferences;
  re-deciding them per project is part of the problem, not part of the solution.
- The existing SDLC machinery must keep working untouched. Adding the app around the
  documentation, the skills and the GitHub workflows must not break how they behave today.
- This is the `ai-kgraph` app itself, not a scaffold placed beside something else — the
  existing SDLC docs, skills and workflows become content and features of the app.

## Open questions

- [ ] The problem is stated as "every new project starts from zero", but the thing being
      built is one specific app. Is the reusable part meant to survive as something a
      future project can start from, or is `ai-kgraph` simply the first app to get the
      layout right and reuse comes later? — *owner:* Nemanja
- [ ] How do the existing `docs/`, `intent/` and `.claude/` trees relate to the app's own
      `src/` tree — do they stay where they are and get read by the app, or do they move
      into it as content? — *owner:* Nemanja
- [ ] What does the knowledge app actually do with the SDLC docs, skills and workflows —
      render them, search them, visualise them? The baseline stack has no answer for this
      yet and it may imply a data or content layer. — *owner:* Nemanja
- [ ] Nothing was said about linting, formatting, testing or CI. Are those in scope for
      "production-grade", or deliberately out? — *owner:* Nemanja
- [ ] The stack names no data layer, auth, or deployment target. Are those out of scope
      for this first step by intent, or just not thought about yet? — *owner:* Nemanja
- [ ] Should the conventions be written down for AI agents specifically (e.g. a
      `CLAUDE.md` in the baseline), or is the directory structure alone enough? — *owner:* Nemanja
- [ ] Does this need to stay current as the listed libraries release new major versions,
      and if so, who maintains it? — *owner:* Nemanja
