# AGENTS.md

## Project

Continuity is an experimental React project about preserving interface identity across multiple states.

## Current objective

Validate one interaction:

```
compact ↔ preview ↔ player
```

Do not expand scope until this experiment is convincing.

## Rules

- Prefer evidence from the working interaction over speculative abstractions.
- Do not build a component library yet.
- Do not create a large public API before implementation exposes repeated structure.
- Use Motion for v0.
- Keep accessibility and reduced motion in the experiment, not as later cleanup.
- Optimize for interruptible interaction.
- Keep dependencies minimal.
- Treat Base UI or other primitives as collaborators, not targets to replace.
- Preserve the distinction between semantic identity and animation implementation.
- Keep visual design quiet; the interaction should be the demo.

## Product references

Read `product.md` before changing architecture.
Read `docs/research.md` before proposing a competing abstraction.
