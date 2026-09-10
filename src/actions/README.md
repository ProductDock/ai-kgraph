# Server actions

This directory ships no server action in this baseline - only these rules, for when
actions do arrive. This is a security decision, not laziness: a Next.js server action
compiles to a publicly reachable POST endpoint. It looks like a function call, so it
invites the assumption that it inherits the caller's context. It does not. With auth
explicitly out of scope, any state-changing action shipped here would be an
unauthenticated write endpoint - and a "placeholder" one is worse, because nobody reviews
placeholders.

1. Every action validates its input with a schema before touching anything. Arguments are
   attacker-controlled - the type signature is erased at runtime.
2. Every action re-checks authorisation *inside* the action. UI-level gating is decoration.
3. Actions return typed results; they never return raw exceptions to the client.
4. State-changing actions require the auth layer to exist. Until then: read-only or none.
