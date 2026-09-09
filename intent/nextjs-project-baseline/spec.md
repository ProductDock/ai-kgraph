# Spec: Next.js project baseline for `ai-kgraph`

- **Intent:** [`intent.md`](./intent.md) — *A ready-to-go Next.js baseline so new projects don't start from zero*
- **Originator:** Nemanja (nemanja.vasic@productdock.com)
- **Stage:** 2 — requirements & design (AI-Native SDLC, lesson 3)
- **Status:** awaiting product owner review

> **Read `## Areas of concern` before approving.** Three of the four policy inputs this
> spec was asked to apply do not exist in this repository. What was applied, what was
> substituted, and what could not be satisfied is recorded there and cross-referenced
> throughout.

---

## 1. Summary

Turn the `ai-kgraph` repository — today a documentation-and-automation repo for the
AI-Native SDLC — into a running Next.js application, without disturbing the SDLC
machinery that already works.

The deliverable is a repository where `npm run dev` and `npm run typecheck` both pass on
a clean clone, every structural decision named in the intent is already made and present
on disk, and those decisions are written down (in `CLAUDE.md` and in this spec) so that
neither Nemanja nor an AI agent has to re-derive them from memory on the next project.

This is a **foundation**, not a feature. It deliberately ships no product screens, no
data layer, no auth, and no content rendering. What it does ship is the seam those things
will attach to, so that adding them later is additive rather than a rewrite.

---

## 2. Scope

### 2.1 In scope

| # | Deliverable |
|---|---|
| S-1 | Next.js App Router application at the repository root, TypeScript strict |
| S-2 | The fixed stack from the intent, installed, wired and version-pinned |
| S-3 | The full directory layout named in the intent, present with real (not empty) files |
| S-4 | `@/*` path aliases resolving in `tsc`, Next, ESLint and the test runner |
| S-5 | `cn()` helper and a validated environment-variable pattern |
| S-6 | Route shell: root layout, page, `loading`, `error`, `global-error`, `not-found` |
| S-7 | Design tokens (light + dark), theme switching, base accessibility posture |
| S-8 | Provider composition for React Query and Zustand, with the client boundary correct |
| S-9 | Lint, format, typecheck, unit test and build scripts + one additive CI workflow |
| S-10 | Root `CLAUDE.md` recording conventions, commands and the state-management boundary |
| S-11 | Security baseline: env split, response headers, server-action policy, secret hygiene |
| S-12 | A content-adapter *seam* (types + one function) for later reading `docs/` and `intent/` |

### 2.2 Explicitly out of scope

Named here so nobody has to guess, and so anything below becomes a **new intent** rather
than scope creep during Stage 3 (`plan-from-spec` rule: *"Anything the spec does not cover
is a new intent."*).

- Database, ORM, or any persistence layer.
- Authentication, authorisation, sessions, user accounts.
- Deployment target, hosting, domains, CDN, analytics, error reporting.
- The knowledge app's actual product surface — rendering, searching or visualising the
  SDLC docs, skills and workflows (intent open question 3; see §4, D-3).
- Any change to `.claude/skills/**`, `.github/workflows/spec-from-intent.yml` or
  `.github/workflows/plan-ready.yml` behaviour.
- Extracting the baseline into a reusable template or generator (intent open question 1;
  see §4, D-1).
- Charts and graph visualisations themselves. Their **standards** are fixed here (§9) and
  their **tokens** are provisioned (§8.4), but no chart is built.

### 2.3 Deferred with a named seam

These are not built, but the baseline is shaped so they land cleanly:

- **Content layer** — `src/lib/content/` ships types and one filesystem reader; no routes
  consume it yet (§7.8).
- **Visualisation layer** — token slots for categorical / sequential / diverging / status
  colour exist and are unused (§8.4).
- **E2E tests** — the unit-test setup is chosen so Playwright can be added without
  reworking it (§7.9).

---

## 3. How this sits in the existing repository

### 3.1 The hard constraint

The intent says the SDLC machinery *"must keep working untouched"*. That is not a
preference — three concrete couplings will break if files move:

| Coupling | Where | Breaks if |
|---|---|---|
| Path filter `intent/**/intent.md` | `.github/workflows/spec-from-intent.yml:18` | `intent/` moves |
| Path filter on `spec.md` | `.github/workflows/plan-ready.yml` | `intent/` moves |
| Relative links `../../../docs/…` | `.claude/skills/plan-from-spec/SKILL.md:87-88` | `docs/` or `.claude/` moves |
| Hard-coded `intent/<slug>/…` paths | both workflows, both skills, `intent/README.md` | either moves |
| `**Status:**` line `grep`/`sed` | `spec-from-intent.yml:60,114` | the intent template changes |

**Decision:** nothing existing moves. The app is added *around* the current tree. The
app reads `docs/`, `intent/` and `.claude/` **in place, read-only, at build time**, through
an adapter that owns that coupling in exactly one directory (§7.8).

This also satisfies the intent's third constraint — *"the existing SDLC docs, skills and
workflows become content and features of the app"* — without a migration. They become
content by being **read**, not by being **moved**.

### 3.2 Repository topology after this change

```
ai-kgraph/
├── .claude/skills/…            UNCHANGED — process skills (write-intent, plan-from-spec, grilling)
├── .github/workflows/          UNCHANGED — spec-from-intent.yml, plan-ready.yml
│   └── verify.yml              NEW — additive CI (§7.9)
├── docs/                       UNCHANGED — playbook notes, automation design
├── intent/                     UNCHANGED — the artifact chain (this file lives here)
├── src/                        NEW — the application (§7.1)
├── public/                     NEW — static assets
├── CLAUDE.md                   NEW — conventions for agents and for future-Nemanja (§7.10)
├── components.json             NEW — shadcn/ui generator config
├── next.config.ts              NEW
├── tsconfig.json               NEW
├── eslint.config.mjs           NEW
├── package.json / package-lock.json  NEW
├── .env.example                NEW — placeholders only, committed
├── .nvmrc                      NEW
├── .gitignore                  AMENDED — additive only (§7.11)
└── README.md                   AMENDED — additive app section
```

`src/` was chosen over a root-level `app/` specifically so that the application tree is
unambiguously separated from the SDLC tree. Without it, a root `app/` sits as a peer of
`docs/` and `intent/` and the boundary blurs — which is the same "structural decisions
re-made from memory" problem the intent is trying to eliminate.

---

## 4. Decisions that close the intent's open questions

The intent left seven open questions. Stage 2's job is to close them or hand them back
explicitly. Each decision below is the spec's proposal; **merging this spec is the
product owner's confirmation of all of them.** Where a decision is genuinely the PO's to
make rather than the spec's, it is marked ⚠ and repeated in §13.

| # | Open question | Decision | Rationale |
|---|---|---|---|
| **D-1** | Reusable scaffold, or is `ai-kgraph` just the first app? | **`ai-kgraph` is the app. Reuse is deferred, not abandoned.** No template repo, no generator. Instead, every structural decision is written down in `CLAUDE.md` + this spec, and the app tree is kept free of `ai-kgraph`-specific content so a future extraction is a copy, not an untangle. | The intent's own constraint says *"not a scaffold placed beside something else"*. Building the generic thing first is how the evening gets spent again. Writing the decisions down captures ~80% of the value at ~5% of the cost — the intent's stated pain is *re-deciding*, not *re-typing*. |
| **D-2** | How do `docs/`, `intent/`, `.claude/` relate to `src/`? | **They stay put. The app reads them in place, read-only, at build time, via `src/lib/content/`.** | Moving them breaks five documented couplings (§3.1) and violates the "untouched" constraint. |
| **D-3** | What does the knowledge app *do* with them? | **Unanswered — and correctly so. Out of scope; needs its own intent.** The baseline ships the read seam and nothing that consumes it. | This is a product question, not a baseline question. Answering it here would smuggle an unreviewed product design into an infrastructure spec. ⚠ **A second intent should be opened for it**; see §13, C-4. |
| **D-4** | Are lint / format / test / CI in scope for "production-grade"? | **Yes, at minimum viable weight:** ESLint, Prettier, `tsc --noEmit`, Vitest + Testing Library, and one CI workflow running all four. Playwright deferred. | The intent's acceptance criterion is *"`npm run dev` and a typecheck both pass immediately, with no manual fix-up step"* — that is only verifiable if the commands exist. And an unlinted baseline recreates the problem: the next project re-decides the lint config. ⚠ This is the largest scope judgement in the spec; see §13, C-5. |
| **D-5** | Data layer / auth / deployment target? | **Out of scope by intent, not by oversight.** Recorded as non-goals in §2.2 so they surface as new intents. | The intent's Constraints fix a stack that contains none of them. Adding any would be design debate the intent explicitly closed. Note the consequence: several security controls (§8) cannot be *fully* validated without a deployment target — see §13, C-6. |
| **D-6** | Write conventions down for AI agents specifically? | **Yes — a root `CLAUDE.md` is a required deliverable (S-10), not an optional extra.** | The intent names AI agents as a second consumer and says the missing conventions cost them. Playbook lesson 5 requires it, and `plan-from-spec` step 2 *reads* `CLAUDE.md` — so without it, this repo's own Stage 3 skill runs degraded. Directory structure alone is not enough: it encodes *where*, never *why* or *which of two overlapping tools*. |
| **D-7** | Who keeps it current as libraries release majors? | **Automated detection, human decision, single named owner (Nemanja).** Renovate or Dependabot, grouped, monthly, minor/patch auto-merged on green CI; **majors never auto-merged** — they open a PR that a human reads. | Exact-pinned versions (§7.2) mean staleness is silent otherwise. ⚠ The bus factor is one; see §13, C-7. |

---

## 5. Functional requirements

Each is independently verifiable. Verification commands are in §11.

**FR-1 — Fixed stack, installed and wired.** Next.js (App Router), TypeScript strict,
Tailwind CSS, `clsx`, `tailwind-merge`, shadcn/ui component architecture, `lucide-react`,
`@tanstack/react-query`, `zustand`. No substitutions, no additions beyond those named in
§7.2. The stack is not open for debate at Stage 3 either — the intent closed it.

**FR-2 — Directory layout present and non-empty.** Every location named in the intent
exists with at least one real file demonstrating its convention: app routes with layouts,
error boundary and loading states; UI components; shared application components; lib
utilities and API clients; custom hooks; global types; server actions. An empty directory
teaches nothing and git will not even track it.

**FR-3 — TypeScript strict + `@/*` aliases work on first run.** `strict: true` plus
`noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`. `@/*` resolves
identically in `tsc`, the Next bundler, ESLint's resolver and Vitest — a single source of
truth, not four copies drifting apart.

**FR-4 — `cn()` exists once, at `src/lib/utils.ts`.** Exact implementation in §7.4. It is
the only place `clsx` and `tailwind-merge` are imported.

**FR-5 — Environment-variable pattern with no real secrets.** `.env.example` committed
with placeholder values only; `.env.local` git-ignored; a validated, typed accessor with a
hard server/client split (§7.5). The intent states this as a requirement: *"The
environment pattern must hold no real secrets — only an example."*

**FR-6 — Route shell.** `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`,
`global-error.tsx`, `not-found.tsx` at the app root, each with real content demonstrating
the pattern (§7.6). `error.tsx` and `global-error.tsx` are client components with a
working reset action and **must not render raw error text in production** (§8.6).

**FR-7 — Provider composition with a correct client boundary.** React Query's provider is
isolated in a leaf client component so that `layout.tsx` and all children remain server
components by default (§7.7). This is the single most common App Router mistake and the
baseline must not encode it.

**FR-8 — Design tokens, light and dark.** Role-named CSS custom properties, both modes
authored deliberately, theme selectable by the viewer and defaulting to the OS setting,
with no flash of wrong theme (§8 of the UX section, §7.3).

**FR-9 — Scripts and CI.** `dev`, `build`, `start`, `lint`, `format`, `typecheck`, `test`
in `package.json`; a `verify.yml` workflow running `lint`, `typecheck`, `test`, `build` on
push and PR. Additive only — it must not alter when the two existing workflows fire.

**FR-10 — `CLAUDE.md` at the repository root, under one page.** Commands, conventions,
architecture, and the pitfalls list — including the state-management boundary (§7.7.2),
which is the decision most likely to be re-made wrongly.

**FR-11 — Content adapter seam.** `src/lib/content/` exports types and a read function
for `docs/`, `intent/` and `.claude/skills/`. **No route consumes it in this change.** It
exists so the deferred product work has a defined attachment point and so the coupling to
the SDLC tree lives in one reviewable directory.

---

## 6. Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-1 | Clean clone → running app with **no manual fix-up step** | §11, V-1…V-6 run in order on a fresh `git clone` |
| NFR-2 | `npm ci` is reproducible; lockfile committed; exact versions pinned | CI uses `npm ci`, never `npm install` |
| NFR-3 | No secret value is ever committed | `.env.example` placeholders only; secret-scanning enabled; §8.2 |
| NFR-4 | No server-only env var can reach the client bundle | §8.2, enforced by module-level guard + V-7 |
| NFR-5 | WCAG 2.2 AA for all shipped surfaces | §9.2 |
| NFR-6 | Both colour modes authored and validated, not auto-flipped | §9.1 |
| NFR-7 | Security response headers present on every route | §8.4, V-8 |
| NFR-8 | Zero state-changing server actions while auth is out of scope | §8.3 |
| NFR-9 | Node version pinned (`.nvmrc` + `engines`) | V-1 |
| NFR-10 | The two existing workflows behave identically before and after | §12, R-1 |

---

## 7. Design

### 7.1 Directory layout

```
src/
├── app/
│   ├── layout.tsx              root layout — server component; fonts, <html lang>, providers
│   ├── page.tsx                landing page — server component
│   ├── loading.tsx             route-level suspense fallback (skeleton, not a spinner)
│   ├── error.tsx               route error boundary — 'use client', reset(), no raw error in prod
│   ├── global-error.tsx        root error boundary — renders its own <html>/<body>
│   ├── not-found.tsx           404
│   ├── providers.tsx           'use client' — the ONLY client boundary in the root tree
│   └── globals.css             Tailwind entry + design tokens (§7.3)
├── components/
│   ├── ui/                     shadcn/ui primitives — GENERATED, see §7.12
│   └── common/                 shared application components (composed from ui/)
├── lib/
│   ├── utils.ts                cn() and nothing else (§7.4)
│   ├── env.ts                  validated env — the ONLY module reading process.env (§7.5)
│   ├── api/
│   │   ├── client.ts           typed fetch wrapper: base URL, timeout, error normalisation
│   │   └── errors.ts           ApiError type + narrowing helpers
│   ├── query/
│   │   ├── client.ts           makeQueryClient() — per-request on server, singleton on client
│   │   └── keys.ts             query-key factory — the one place keys are constructed
│   └── content/                the SDLC-tree read seam (§7.8) — no consumers yet
│       ├── types.ts
│       └── read.ts
├── hooks/
│   └── use-mounted.ts          one real hook establishing the convention
├── stores/
│   └── ui-store.ts             zustand — CLIENT UI STATE ONLY (§7.7.2)
├── types/
│   ├── index.ts                shared domain types
│   └── env.d.ts                ProcessEnv augmentation
└── actions/
    └── README.md               server-action rules; NO action ships in this change (§8.3)
```

Rules that make the layout self-enforcing, recorded in `CLAUDE.md`:

- `components/ui/**` is generator output. Do not hand-edit; re-generate or wrap it.
- `components/common/**` composes `ui/`, never the reverse.
- Anything imported by two or more routes moves to `components/common/`. Anything used by
  one route may live beside it as a private `_components/` folder.
- `lib/` is framework-agnostic and must not import from `app/` or `components/`.
- `process.env` appears in `src/lib/env.ts` and nowhere else (V-7 enforces this).

### 7.2 Dependencies and pinning

**Pin exact versions — no `^`, no `~`.** The intent's complaint is that results *"come out
subtly different from the last one"*; a caret range guarantees exactly that.

| Package | Role | Note for the plan |
|---|---|---|
| `next`, `react`, `react-dom` | framework | Use the current stable release |
| `typescript`, `@types/*` | types | — |
| `tailwindcss` | styling | ⚠ **v3 and v4 configure differently** — see below |
| `clsx`, `tailwind-merge` | `cn()` | `tailwind-merge` major must match the Tailwind major |
| `lucide-react` | icons | Import per-icon; never `import * as icons` |
| `@tanstack/react-query` | server state | + devtools as a dev dependency |
| `zustand` | client state | — |
| `eslint`, `eslint-config-next`, `prettier`, `prettier-plugin-tailwindcss` | tooling | — |
| `vitest`, `@testing-library/react`, `jsdom` | tests | — |
| `zod` | env + input validation | ⚠ **Addition to the fixed list** — see §13, C-3 |

> **Version resolution is a Stage 3 task, not a Stage 2 one.** This spec deliberately
> names no version numbers. Resolve each at implementation time, pin the exact resolved
> version, and **record the resolved set in `plan.md`** — that record is what makes the
> baseline reproducible next time.
>
> **The one compatibility check that must happen first:** Tailwind v4 moved theme
> configuration from `tailwind.config.ts` into CSS (`@theme`), and shadcn/ui's generator
> emits different output for v3 vs v4. Determine the Tailwind major **before** writing
> `globals.css` or running the shadcn init — getting this wrong is a rewrite of §7.3,
> not a tweak. Everything in §7.3 is authored as plain CSS custom properties precisely
> so it survives either answer; only the *bridge* to Tailwind's utility names differs.

### 7.3 Design tokens

Tokens are **role-named**, never value-named. `--surface-1`, never `--warm-gray-50`. This
is what makes a later brand swap a values-only edit — the rule the `dataviz` skill states
directly: *"To target your brand, read that file's structure and substitute its values —
touch nothing else."*

```css
/* src/app/globals.css */
:root {
  color-scheme: light;

  /* Surfaces & ink */
  --page:            #f9f9f7;
  --surface-1:       #fcfcfb;
  --text-primary:    #0b0b0b;
  --text-secondary:  #52514e;
  --text-muted:      #898781;
  --border:          rgb(11 11 11 / 0.10);
  --gridline:        #e1e0d9;

  /* Status — reserved, never reused as a series colour */
  --status-good:     #0ca30c;
  --status-warning:  #fab219;
  --status-serious:  #ec835a;
  --status-critical: #d03b3b;

  /* Focus */
  --focus-ring:      #2a78d6;
}

:root[data-theme='dark'],
:root:where(:not([data-theme='light'])) { /* under @media (prefers-color-scheme: dark) */
  color-scheme: dark;
  --page:            #0d0d0d;
  --surface-1:       #1a1a19;
  --text-primary:    #ffffff;
  --text-secondary:  #c3c2b7;
  --text-muted:      #898781;
  --border:          rgb(255 255 255 / 0.10);
  --gridline:        #2c2c2a;
  /* status steps are mode-invariant by design */
}
```

Dark values are declared under **both** the media query and the `[data-theme]` scope, so
an explicit user choice beats the OS setting in both directions. The `:where()` wrapper
keeps the media block's specificity at zero so the toggle always wins.

> **These hex values are placeholders, not `ai-kgraph` brand colours.** They are the
> `dataviz` skill's brand-neutral reference instance, adopted because no brand palette
> exists in this repository to adopt instead. See §13, **C-2** — this is a real gap, and
> the structure above is the mitigation, not the answer.

**Theme flash.** Reading the stored preference in `useEffect` produces a visible flash of
the wrong theme on every load. Set `data-theme` on `<html>` from a tiny inline script in
`layout.tsx` before first paint — and note that this script needs a CSP nonce (§8.5).

### 7.4 `cn()`

```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Verbatim, deliberately. It is the shadcn/ui convention; deviating from it means every
generated component has to be edited. Test: `cn('p-2', 'p-4') === 'p-4'` (V-9) — this
asserts `tailwind-merge` is actually resolving conflicts, which is the entire reason it
is a dependency and the thing that silently breaks on a major bump.

### 7.5 Environment variables

```ts
// src/lib/env.ts
import { z } from 'zod'

const server = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Add server-only vars here. NEVER prefix these NEXT_PUBLIC_.
})

const client = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

// Fail fast and loudly at boot, listing every problem at once.
function parse<T extends z.ZodTypeAny>(schema: T, source: unknown, label: string) {
  const r = schema.safeParse(source)
  if (!r.success) {
    throw new Error(
      `Invalid ${label} environment:\n` +
        r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n'),
    )
  }
  return r.data
}

// Client vars must be referenced statically — Next inlines them at build time,
// so `process.env[key]` with a computed key silently yields undefined.
export const clientEnv = parse(
  client,
  { NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL },
  'client',
)

export const serverEnv = new Proxy({} as z.infer<typeof server>, {
  get(_t, prop: string) {
    if (typeof window !== 'undefined') {
      throw new Error(`serverEnv.${prop} was read in the browser. Use clientEnv.`)
    }
    return parse(server, process.env, 'server')[prop as keyof z.infer<typeof server>]
  },
})
```

Two properties matter more than the shape:

1. **The split is enforced at runtime, not by convention.** Importing `serverEnv` into a
   client component throws with a message naming the variable, instead of shipping a
   secret to the browser. Convention alone has a 100% historical failure rate here.
2. **Boot fails on a missing variable**, listing all problems at once. A `undefined` env
   var that surfaces as a 500 three screens deep costs an hour; this costs a second.

`.env.example` is committed and holds **placeholders only** — `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
`.env.local` and `.env*.local` are git-ignored. This is a stated intent requirement, not
a suggestion.

### 7.6 Route shell

- `loading.tsx` renders a **skeleton matching the page's layout**, not a centred spinner.
  A spinner tells the user nothing and causes a layout shift when content arrives.
- `error.tsx` is `'use client'`, takes `{ error, reset }`, and renders a recovery action.
  In production it renders a generic message plus `error.digest` — never `error.message`
  (§8.6).
- `global-error.tsx` renders its own `<html>` and `<body>`; it replaces the root layout
  when that layout itself throws, and cannot rely on anything the layout provides —
  including the theme tokens. Give it inline styles.
- `not-found.tsx` returns a real 404 with a route back to `/`.

The landing page for this change is a deliberate placeholder: it states what the app is,
confirms the baseline is alive, and links to the SDLC docs. It is **not** a product
screen — see D-3.

### 7.7 State management

#### 7.7.1 Provider composition

```tsx
// src/app/providers.tsx
'use client'
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient)   // NOT useMemo, NOT module scope
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

`layout.tsx` stays a **server component** and renders `<Providers>{children}</Providers>`.
Because `children` is passed in as a prop rather than imported inside the client module,
the children remain server components. Marking `layout.tsx` itself `'use client'` would
turn the entire application into a client bundle — silently, with no error.

`makeQueryClient` must return a **new client per request on the server** and a **cached
singleton in the browser**. A module-scope client on the server leaks one user's cached
data into another user's request. That is a data-isolation bug, not a performance one.

#### 7.7.2 The boundary that must be written down

The fixed stack contains three overlapping ways to hold state. The intent's core
complaint is that structural decisions get re-made from memory; this is the decision most
likely to be re-made differently every time. It is resolved here, once:

| State | Owner | Never |
|---|---|---|
| Data fetched on the server for initial render | **React Server Components + `fetch`** | Not React Query |
| Client-side server state — mutations, polling, infinite lists, optimistic UI | **React Query** | Not Zustand |
| Client UI state — theme, sidebar, modals, filters | **Zustand** | Never holds a copy of server data |
| One component's own state | **`useState`** | Not a global store |

**Default to the top row.** React Query earns its place only when the interaction is
genuinely client-side. This table goes into `CLAUDE.md` verbatim (FR-10).

Query keys are constructed **only** through the factory in `lib/query/keys.ts`. Ad-hoc
string arrays make invalidation unreliable in a way that presents as a flaky UI, not as
an error.

### 7.8 Content adapter seam

`src/lib/content/` exposes types and a read function over `docs/`, `intent/` and
`.claude/skills/`. Rules, set now because they are cheap now and expensive later:

- **Read-only, build-time only.** The app never writes to those trees. They are the SDLC's
  artifacts; the app is a reader.
- **Path construction is allow-listed.** A slug arriving from a URL is resolved against a
  known set, never interpolated into a path. Filesystem reads driven by user input are a
  path-traversal primitive (§8.7).
- **All coupling to the SDLC tree lives in this directory.** When a doc is renamed, one
  directory needs updating and one place needs a test.

⚠ **Naming this seam creates a coupling worth stating plainly:** once the app renders
`docs/` and `intent/`, renaming or deleting a markdown file becomes a build-breaking
change to the application, and every merged spec PR becomes an app content change. That
is acceptable and probably desirable — but it is a real change to what "just editing a
doc" means. See §13, C-8.

### 7.9 Tooling and CI

Scripts: `dev`, `build`, `start`, `lint`, `lint:fix`, `format`, `format:check`,
`typecheck` (`tsc --noEmit`), `test`, `test:watch`.

`.github/workflows/verify.yml` — **additive, and shaped like the workflows already here**:

```yaml
on:
  push:        { branches: [main] }
  pull_request: {}
permissions:
  contents: read          # least privilege — this job only reads
concurrency:
  group: verify-${{ github.ref }}
  cancel-in-progress: true
```

Steps: checkout → `setup-node` with `cache: npm` and `node-version-file: .nvmrc` →
`npm ci` → `lint` → `typecheck` → `test` → `build`.

Two deliberate choices:

- **`cancel-in-progress: true`**, the opposite of `spec-from-intent.yml`. That workflow
  must never be cancelled mid-generation because it makes an API call with side effects;
  a verify run is pure and superseded runs are waste.
- **`permissions: contents: read`** — the minimum this job needs, matching the posture
  `plan-ready.yml` already sets. New workflows declare permissions explicitly rather than
  inheriting the repository default.

**Do not modify the two existing workflows.** `verify.yml` will now also run on the
spec-bot's commits; that is correct and harmless.

### 7.10 `CLAUDE.md`

Under one page (lesson 5). Contents: the four commands that matter; the state-management
table from §7.7.2; the directory rules from §7.1; the env rule; the "`components/ui` is
generated" rule; and a short pitfalls list — the client-boundary trap, the per-request
QueryClient, the Tailwind-major dependency, and `serverEnv` in client code.

It documents the app. It does **not** restate the SDLC process — `README.md`, `docs/` and
the skills already own that, and duplicating it creates two sources of truth that will
drift.

### 7.11 `.gitignore`

Additive only: `node_modules/`, `.next/`, `out/`, `next-env.d.ts`, `.env*.local`,
`coverage/`, `.turbo/`.

⚠ **One live footgun in the existing file.** The CI scratch-file entries — `changed.txt`,
`todo.txt`, `specs.txt`, `issues.txt`, `concerns.md`, `pr-body.md`, `body.md` — have no
leading slash, so **git ignores them at every depth**. A `src/lib/content/body.md` fixture
or any `todo.txt` inside `src/` would be silently untracked, and the failure mode is "it
works locally, the build fails in CI". Anchor them to the root (`/changed.txt`, …) as part
of this change. This edits a file the SDLC uses but changes no SDLC behaviour: the
workflows write those files to the runner workspace root, which is exactly what the
anchored patterns still match.

### 7.12 shadcn/ui

shadcn/ui is **not a dependency** — it is a generator that copies component source into
your repository, which you then own. Consequences the plan must account for:

- `components.json` is committed and is the real configuration artifact.
- Seed a small, honest set: `button`, `card`, `skeleton`. Enough to prove the pipeline
  (generator → `cn()` → tokens → dark mode) end-to-end; not a component library nobody
  asked for.
- Every vendored component is **maintained code**, and it does not update itself. This is
  the concrete answer to intent open question 7 (D-7): dependency automation will never
  see these files. Note it in `CLAUDE.md`.
- The generator writes into `src/components/ui/`; confirm its Tailwind-major output
  matches §7.2 before generating.

---

## 8. Security design

> **Applied policy source: none available.** This repository contains no security skill.
> Everything below is derived from the intent's own stated constraints plus
> platform-standard practice for this stack. It has **not** been reviewed by a policy
> owner and must not be read as organisational policy. See §13, **C-1**.

The intent states: *"No customer, sensitive or regulated data is involved"* — so the
threat model is small. It is not empty.

### 8.1 Threat model

| Asset | Threat | Control |
|---|---|---|
| API keys / future secrets | Committed to a public repo | §8.2 |
| Server-only env vars | Inlined into the client bundle | §8.2 |
| Server actions | Publicly reachable unauthenticated write endpoints | §8.3 |
| The rendered app | XSS via injected content | §8.5 |
| Error output | Stack traces / internals leaked to users | §8.6 |
| The SDLC tree | Path traversal through a content route | §8.7 |
| Dependencies | Supply-chain compromise | §8.8 |
| Personal data in `intent/**` | Published if content routes ship | §8.9 ⚠ |

### 8.2 Secrets and environment

- `.env.example` holds **placeholders only** and is committed. No real value ever.
- `.env.local` / `.env*.local` git-ignored (§7.11).
- **`NEXT_PUBLIC_` is a publication decision, not a naming convention.** Any variable so
  prefixed is inlined into JavaScript served to every visitor. `src/lib/env.ts` makes this
  structural: two schemas, and `serverEnv` throws if read in the browser (§7.5).
- Enable GitHub **secret scanning and push protection** on the repository.
- The one secret in play today is `ANTHROPIC_API_KEY`, used by `spec-from-intent.yml`. It
  is a repository secret and the app has no reason to read it — **`ANTHROPIC_API_KEY`
  must never appear in `src/lib/env.ts`.** State that in the file as a comment.

### 8.3 Server actions

`src/actions/` ships **no server action in this change**, only a `README.md` stating the
rules. This is a security decision, not laziness.

A Next.js server action compiles to a **publicly reachable POST endpoint**. It looks like
a function call, so it invites the assumption that it inherits the caller's context. It
does not. With auth explicitly out of scope (D-5), any state-changing action shipped in
this baseline is an unauthenticated write endpoint, and a "placeholder" one is worse
because nobody reviews placeholders.

Rules recorded for when actions do arrive:

1. Every action validates its input with a schema before touching anything. Arguments are
   attacker-controlled — the type signature is erased at runtime.
2. Every action re-checks authorisation *inside* the action. UI-level gating is decoration.
3. Actions return typed results; they never return raw exceptions to the client.
4. State-changing actions require the auth layer to exist. Until then: read-only or none.

### 8.4 Response headers

Set in `next.config.ts` `headers()` for all routes:

| Header | Value | Why |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Blocks MIME confusion |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits URL leakage |
| `X-Frame-Options` | `DENY` | Clickjacking (kept alongside CSP `frame-ancestors` for older agents) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Denies unused capabilities |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | ⚠ Only once a TLS host exists — see §13, C-6 |

### 8.5 Content Security Policy — a genuine conflict

A strict CSP and Next.js's App Router are in real tension. Next injects inline scripts for
hydration and streaming, and the theme-flash script (§7.3) is inline by design. Neither
works under `script-src 'self'`.

Three options, honestly stated:

| Option | Cost |
|---|---|
| `'unsafe-inline'` scripts | Defeats CSP's main purpose. **Rejected.** |
| Nonce via middleware + `'strict-dynamic'` | Correct, but **middleware forces dynamic rendering**, losing static optimisation on every route |
| Start in `Content-Security-Policy-Report-Only` | Full observability, zero enforcement, no rendering cost |

**Recommendation:** ship **Report-Only** now, with the nonce middleware written but
unattached. Enforcement is switched on when a deployment target exists to collect the
reports and to measure the dynamic-rendering cost against real routes (D-5 put the target
out of scope). `style-src` will likely need `'unsafe-inline'` regardless — Next and
Tailwind both emit inline styles — which is a materially weaker guarantee than the script
directive and should be stated in the review, not glossed over. Recorded as §13, **C-6**.

### 8.6 Error output

`error.tsx` and `global-error.tsx` render a generic message plus `error.digest` in
production. Next already redacts server error messages in production builds, but
client-side errors are **not** redacted, and it is trivially easy to render `error.message`
"just while debugging" and ship it. Make the production branch explicit in the component
rather than relying on the framework's default.

### 8.7 Filesystem reads

The content adapter (§7.8) reads from the repository at build time. When routes eventually
consume it, a slug from the URL must resolve through an **allow-list** of known documents,
never through string interpolation into a path. `../` in a route parameter is the oldest
trick there is, and `path.join` does not protect against it.

Rendering markdown: no `dangerouslySetInnerHTML` on unsanitised content. Even
first-party markdown can carry raw HTML, and "we wrote it ourselves" stops being true the
moment a spec is generated by an agent from an intent someone else filed.

### 8.8 Supply chain

- Exact-pinned versions + committed lockfile + `npm ci` in CI (NFR-2).
- `npm audit --audit-level=high` in `verify.yml`, non-blocking initially — a blocking
  audit on a solo project with no triage rota just teaches you to bypass CI.
- Renovate/Dependabot per D-7: minors and patches auto-merge on green; majors never.
- **New workflows pin actions by commit SHA.** The existing workflows use `@v4` tags,
  which are mutable. Not changed here — the intent forbids touching them — but flagged as
  an inconsistency the owner should close deliberately (§13, C-9).

### 8.9 Personal data in the SDLC tree ⚠

The intent states *"No customer, sensitive or regulated data is involved."* That is true
of the app's data model. It is **not** true of the content it is being pointed at.

`intent/nextjs-project-baseline/intent.md:3` contains a named individual and a work email
address. `spec.provenance.yml` files carry generation metadata. The `write-intent`
template will put the same field in every future intent. **If the app renders `intent/**`
and is deployed publicly, it publishes personal data** — a live email address, indexed and
scraped, and personal data under GDPR for an EU-based originator.

This is not a blocker for the baseline, which renders nothing. It **is** a blocker for the
first content route, and it is much cheaper to decide now:

- **Option A** — strip the `Originator` line in the content adapter before render.
- **Option B** — keep attribution but deploy behind auth (needs D-5 reversed).
- **Option C** — change the `write-intent` template to record a name or handle without an
  email. Cheapest and most durable, but it edits SDLC machinery.

Recorded as §13, **C-10**. The decision belongs to the originator, who is also the data
subject here.

---

## 9. UX and visual standards

> **Applied policy source: the `dataviz` skill only.** No brand-guideline or UX-standard
> skill exists in this repository. `dataviz` is a genuine, validated standard and is
> directly relevant — `ai-kgraph` is a knowledge-*graph* app whose likely first product
> surface is a visualisation. It covers colour, accessibility and chart form. It does
> **not** cover typography scale, spacing, voice and tone, logo usage, or component
> behaviour. Those gaps are real. See §13, **C-2**.

### 9.1 Colour rules adopted now (they are cheapest to adopt before anything is drawn)

- **Role-named tokens only** (§7.3). A brand swap becomes a values-only edit.
- **Dark mode is authored, not flipped.** Both modes get chosen values, validated against
  their own surface. An automatic inversion produces the wrong contrast in both.
- **Status colours are reserved.** `good` / `warning` / `serious` / `critical` are never
  reused as a category or series colour, and always ship with an **icon plus a label** —
  never colour alone. On the light surface `warning` and `serious` sit below 3:1 by
  design; the icon-and-label pairing is precisely the mitigation.
- **Categorical hues are assigned in fixed order, never cycled.** Slot order is the
  colour-vision-deficiency safety mechanism, not decoration.
- **Text wears text tokens, never a series colour.**
- **Never a dual-axis chart.** Two measures of different scale means two charts.
- **Run the validator before any palette ships.** The `dataviz` skill's
  `scripts/validate_palette.js` is the gate — colourblind-safety is computable, so it gets
  computed, not eyeballed. The placeholder palette in §7.3 carries the skill's own
  measured results; **a brand palette substituted later must be re-validated against
  `ai-kgraph`'s own surfaces**, and the report recorded in the PR.

### 9.2 Accessibility (NFR-5)

WCAG 2.2 AA on every shipped surface. Concretely, for this baseline:

- `<html lang="en">` set in the root layout.
- One `<h1>` per page; headings nest without skipping levels.
- Visible focus indication on every interactive element, using `--focus-ring` and
  `:focus-visible`. Never `outline: none` without a replacement.
- Full keyboard operability; a skip-to-content link in the root layout.
- `color-scheme` declared on both themes so form controls and scrollbars follow.
- `prefers-reduced-motion: reduce` honoured globally in `globals.css` — one rule, written
  once, and it never has to be remembered again.
- Interactive targets at least 24×24 CSS pixels (WCAG 2.2 AA, 2.5.8).
- Loading skeletons carry `aria-busy` / `aria-live="polite"`; a spinner with no accessible
  name announces nothing.
- Icons from `lucide-react` are decorative by default — `aria-hidden="true"` — and an
  icon-only control carries an accessible name.

### 9.3 Typography

System sans (`system-ui, -apple-system, "Segoe UI", sans-serif`) as the placeholder, with
`font-variant-numeric: tabular-nums` reserved for columns that must align vertically.
⚠ There is no brand typeface to specify (C-2). Using the system stack is the honest
placeholder: it is fast, needs no licence, and swapping it later is one token.

---

## 10. What "done" means

The intent's success condition is *"from nothing to a running, typechecking Next.js app in
minutes rather than an evening, without making any structural decisions along the way."*
That is met when a clean clone passes §11 with no manual step, **and** when the questions
that used to require a decision — where does a hook go, which state tool, how do env vars
work — are answered by a file on disk or a line in `CLAUDE.md`.

---

## 11. Verification

Every step runs on a **fresh `git clone`**, in order, with no manual intervention. This
sequence is the intent's acceptance criterion made executable, and it becomes the Stage 4
feedback loop.

| # | Check | Command | Pass |
|---|---|---|---|
| V-1 | Toolchain pinned | `node -v` vs `.nvmrc` | match |
| V-2 | Reproducible install | `npm ci` | exit 0, no lockfile change |
| V-3 | **Typecheck passes immediately** | `npm run typecheck` | exit 0 |
| V-4 | Lint passes | `npm run lint` | exit 0 |
| V-5 | Tests pass | `npm test` | exit 0 |
| V-6 | **`npm run dev` works immediately** | `npm run dev`, then `curl -sf localhost:3000` | HTTP 200 |
| V-7 | Env access is centralised | `rg -n 'process\.env\.' src --glob '!src/lib/env.ts'` | no matches |
| V-8 | Security headers present | `curl -sI localhost:3000` | §8.4 headers present |
| V-9 | `cn()` merges conflicts | unit test: `cn('p-2','p-4') === 'p-4'` | pass |
| V-10 | Env validation fails loudly | unset a required var, `npm run build` | non-zero, names the var |
| V-11 | Server env is not in the client bundle | `rg` the built client chunks for a server-only value | no matches |
| V-12 | Dark mode has no flash | load with OS dark, record first paint | no light frame |
| V-13 | Aliases resolve everywhere | an `@/` import in a route, a test and a lib file | all resolve |
| V-14 | Production build succeeds | `npm run build` | exit 0 |
| V-15 | **SDLC machinery unchanged** | `git diff --stat main -- .github/workflows/spec-from-intent.yml .github/workflows/plan-ready.yml .claude/skills/` | empty |
| V-16 | Keyboard path is complete | tab through the landing page | focus always visible, skip link reachable |

V-3, V-6 and V-15 are the three that map directly to the intent's stated requirements.
V-15 is the constraint check — if it is non-empty, the change has violated the intent.

---

## 12. Risks and rollback

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | A root `package.json` changes how the existing workflows behave | Low | High | They install `@anthropic-ai/claude-code` globally and never run `npm ci` in the repo — no interaction. V-15 confirms. |
| R-2 | Tailwind major mismatch with shadcn/ui output | **Medium** | **High** | Resolve the major *before* writing `globals.css` or running the generator (§7.2). Tokens are plain CSS so only the bridge changes. |
| R-3 | Client boundary drawn wrong → whole app becomes a client bundle | Medium | High | §7.7.1 is prescriptive; add a bundle-size assertion to `verify.yml`. |
| R-4 | Module-scope QueryClient leaks data between server requests | Low | **High** | `makeQueryClient` in `lib/query/client.ts` is the only construction site; covered in `CLAUDE.md` pitfalls. |
| R-5 | Scope creeps into product features (D-3) | **Medium** | Medium | §2.2 is explicit; `plan-from-spec` treats uncovered work as a new intent. |
| R-6 | Placeholder palette hardens into the de facto brand | **Medium** | Medium | Role-named tokens; C-2 filed; a swap is a values-only edit. |
| R-7 | Pinned versions go stale silently | Medium | Medium | D-7 automation. |
| R-8 | Content routes publish personal data | Low **now**, High **later** | High | §8.9, C-10 — decided before the first content route, not after. |

**Rollback.** Every change is additive except the `.gitignore` anchoring (§7.11). Reverting
the merge commit restores the repository exactly, and the SDLC machinery is untouched
throughout, so no rollback of it is possible or needed. There is no data migration and no
deployed surface to drain.

---

## 13. Handoff to engineering

Read with [`intent.md`](./intent.md) and `/plan-from-spec nextjs-project-baseline`.

**Resolve before writing `plan.md`:**

1. The Tailwind major and the matching shadcn/ui generator output (R-2) — everything in
   §7.3 and §7.12 depends on the answer.
2. The exact resolved version of every package in §7.2. **Record the set in `plan.md`** —
   that record is what makes this baseline reproducible on the next project (D-1).
3. Whether `zod` is accepted as an addition to the fixed stack (C-3).

**Suggested sequence** — each step independently verifiable, per `plan-from-spec` step 4:
scaffold + TS strict + aliases (V-3) → `cn()` + tokens + dark mode (V-9, V-12) → route
shell → env module (V-7, V-10) → providers + state boundary (V-11) → shadcn seed →
lint/format/test → `CLAUDE.md` → headers + CSP Report-Only (V-8) → content seam →
`verify.yml` (V-15).

`plan-from-spec` step 2 requires raising a non-empty `## Areas of concern` with the policy
owner before planning. **C-1, C-2 and C-3 below are unresolved and belong to the product
owner.** Do not plan around them silently.

---

## Areas of concern

**C-1 — The security policy this spec was asked to apply does not exist. (Highest.)**
The generating prompt says *"Apply the skills available to you so the plan conforms to our
brand guidelines, security policies and UX standards."* `.claude/skills/` contains
`write-intent`, `plan-from-spec` and `grilling` — all process skills. **No security,
brand, compliance or UX policy skill is present, and none is installed as a plugin.**
This repository's own documentation predicts exactly this outcome:
`docs/spec-from-intent-automation.md:86-88` lists *"the org's policy skills present in
`.claude/skills/` or installed as a plugin"* as a prerequisite and warns that *"without
them the prompt has nothing to constrain it and the spec will be generic — this is the one
prerequisite lesson 3 names explicitly."* Section 8 is therefore **platform-standard
practice plus the intent's own constraints, not organisational policy**, and it has had no
policy-owner review. Treat it as a starting proposal. *The durable fix is to write the
policy skills* (lesson 6) *— which, notably, would itself be a good early feature of a
knowledge app about the AI-native SDLC.*

**C-2 — There are no brand guidelines to conform to, and the placeholder will harden.**
No palette, typeface, spacing scale, logo or voice guidance exists in the repository. The
only design standard available is the `dataviz` skill, whose palette is explicitly a
*brand-neutral placeholder* — the skill itself says *"swap that file's values for your
brand's."* §7.3 adopts those placeholder values and §9.3 adopts the system font stack.
Mitigation is structural (role-named tokens make a swap a values-only edit) but it is not
a fix: placeholders that ship tend to become the brand by default (R-6). `dataviz` also
covers only colour, chart form and accessibility — it says nothing about typography scale,
spacing, motion, voice, or component behaviour, so those parts of "UX standards" are
**unaddressed rather than satisfied**. Someone must own a brand decision before the first
user-facing screen.

**C-3 — `zod` is an addition to a stack the intent declared closed.** The intent says the
stack *"is fixed and is not open for design debate."* §7.5 and §8.3 both depend on schema
validation, which nothing in the fixed list provides. The security value is high — it is
what makes the env split and the server-action rule enforceable rather than aspirational —
but this is a scope decision, not a technical one, and it is the PO's. **If rejected**, env
validation degrades to a hand-written checker (workable, ~30 lines, no types derived from
the schema) and the §8.3 rules become advisory. Contradiction to note plainly: *"apply our
security policies"* and *"the stack is fixed"* cannot both be fully honoured here.

**C-4 — The app's actual purpose is undefined, and the baseline cannot supply it.**
Intent open question 3 — *"What does the knowledge app actually do with the SDLC docs,
skills and workflows — render them, search them, visualise them?"* — is unanswered, and
the intent itself notes the stack *"has no answer for this yet and it may imply a data or
content layer."* This spec deliberately does not invent one (D-3), which means the baseline
is being built without knowing what it must eventually carry. Search implies an index;
graph visualisation implies a parse-and-relate step; both may imply persistence that D-5
put out of scope. §7.8 is a seam, not insurance. **Recommend opening a second intent for
the product surface before or alongside Stage 3**, so the baseline's assumptions get
tested against a real requirement rather than a guess.

**C-5 — Lint, format, test and CI are a spec judgement, not an intent requirement.**
Intent open question 4 asked whether these are in scope; D-4 answered *yes, minimally*.
That is the single largest piece of scope this spec added beyond what was explicitly
asked. The justification is that the intent's own acceptance criterion ("a typecheck
passes") presupposes the commands exist, and that an unconfigured baseline recreates the
"decide again from memory" problem. But it is added work and the PO may prefer it split
into its own intent. **Explicitly confirm or cut D-4 at this gate** — it is much cheaper
to cut now than after Stage 3 plans around it.

**C-6 — Several security controls cannot be completed or validated without a deployment
target.** D-5 puts hosting out of scope, which leaves three controls half-finished: HSTS
cannot be set safely without a TLS host; the CSP ships **Report-Only** with no enforcement
and no report collector, so it provides observability rather than protection; and
`style-src` will likely require `'unsafe-inline'` for Next and Tailwind regardless of how
scripts are handled, which is a materially weaker guarantee than the script directive.
Enforcement also carries an unmeasured cost — nonce middleware forces dynamic rendering on
every route. **The baseline is not "secured", it is "prepared to be secured."** Anyone
reading V-8 as proof of a hardened app would be wrong. This must be revisited when a
deployment target is chosen.

**C-7 — Bus factor of one on a baseline whose whole purpose is to outlive one project.**
D-7 assigns dependency currency to Nemanja, who is also the originator, the product owner,
the sole consumer and the only reviewer. Automation detects staleness; it does not decide.
An unmaintained pinned baseline is worse than no baseline, because it looks authoritative
while being wrong — and the vendored shadcn/ui components (§7.12) are invisible to
dependency tooling entirely, so they will *only* ever be updated deliberately. Worth
naming now, while the answer is still "yes, and I accept that."

**C-8 — Making the SDLC tree into app content couples documentation edits to the build.**
The intent requires it (*"the existing SDLC docs, skills and workflows become content and
features of the app"*), and §7.8 is the cheapest way to satisfy it. The consequence is
real: once routes render `docs/` and `intent/`, renaming a heading or deleting a file can
break the application build, and every merged spec PR becomes an app content change that
triggers a rebuild. There is also a latent tension between the intent's two constraints —
*"must keep working untouched"* and *"become content and features of the app"* — because
once a skill file is a product surface, editing that skill acquires a second review
audience. Concentrating the coupling in one directory limits the blast radius; it does not
remove it.

**C-9 — Existing workflows pin GitHub Actions by mutable tag.**
`spec-from-intent.yml` and `plan-ready.yml` use `actions/checkout@v4`. Tags are mutable,
so this trusts the action publisher continuously rather than at a point in time. Separately,
both workflows interpolate the `workflow_dispatch` input `${{ inputs.slug }}` directly into
a `run:` block (`spec-from-intent.yml:47`, `plan-ready.yml:46`), where GitHub substitutes it
*before* the shell parses the line — a script-injection shape. Exploiting it requires write
access to the repository, so severity is low today, and **this spec changes neither**: the
intent forbids touching the
SDLC machinery and neither is in scope. Flagged so the choice to leave them is deliberate
rather than unnoticed. New workflows added here pin by SHA and take least-privilege
permissions (§7.9, §8.8), which makes the inconsistency visible in the diff.

**C-10 — The app would publish personal data the intent assumed was absent.**
The intent states *"No customer, sensitive or regulated data is involved."* True of the
app's data model; not true of the content it points at. `intent.md:3` carries a named
individual and a work email, `spec.provenance.yml` carries generation metadata, and the
`write-intent` template reproduces the same field in every future intent. A public
deployment rendering `intent/**` publishes a live email address — scrapeable, indexed, and
personal data under GDPR for an EU-based originator. Not a blocker for this change, which
renders nothing; **a blocker for the first content route.** Options in §8.9: strip the
field in the adapter (A), deploy behind auth (B), or change the `write-intent` template to
record a handle instead of an email (C — cheapest and most durable, but it edits SDLC
machinery). Decide before building the content layer, not after.
