# Project skills

Drop skill files here so Claude Code picks them up automatically in this repo.

## Layout

```
.claude/
  skills/
    <skill-name>/
      SKILL.md          <- required: the instructions
      references/       <- optional: extra docs the skill can point to
  commands/             <- optional: /slash-command markdown files
  agents/               <- optional: custom subagent definitions
```

One folder per skill. The folder name is the skill name (kebab-case), and the
instructions must live in a file named `SKILL.md` inside it.

## SKILL.md format

```markdown
---
name: frontend
description: Use when making any frontend/UI change in this repo - covers component structure, Tailwind conventions, and styling rules.
---

# Frontend guidelines

...your directions here...
```

- `name` - kebab-case, must match the folder name.
- `description` - this is what Claude reads to decide when to load the skill, so
  say *when* to use it, not just what it is. Include trigger words
  ("component", "styling", "Tailwind", "layout", ...).

Body content is loaded only when the skill activates, so it can be long.

## Adding your file

Put your instructions in `.claude/skills/frontend/SKILL.md` (the folder is
already scaffolded), then start a new Claude Code session in this repo - or run
`/skill-doctor` to check it was picked up.
