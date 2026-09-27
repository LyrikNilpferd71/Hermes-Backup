---
name: preference-intake
description: "Interview a user for durable preferences, separate temporary state from long-term facts, and produce a reusable markdown user profile."
version: 1.0.0
author: Hermes Agent + Teknium
license: MIT
metadata:
  hermes:
    tags: [onboarding, preferences, personalization, memory, note-taking, profile]
---

# Preference Intake

Use this skill when the user wants the assistant to learn them better, capture durable preferences, or turn a conversation into a reusable `user-profile.md` / `USER.md` style document.

This is a *classification and synthesis* workflow:
- ask targeted questions first,
- identify durable preferences vs temporary context,
- write a clean profile document,
- update memory only for stable facts,
- keep transient details out of long-term storage.

## When to use

- The user says: "learn me", "remember my preferences", "make a user profile", "build a USER.md", or similar.
- The user wants the assistant to adapt style, tone, verbosity, or decision-making to them.
- The user wants a durable personalization file for future sessions.

## Core workflow

1. **Start with a short intake interview.**
   - Ask only the questions needed to learn stable preferences.
   - Prefer concise numbered questions.
   - Let the user answer in free form if they want.

2. **Separate durable facts from temporary state.**
   - Durable: name, language preference, tone, working style, environment, recurring goals, tool preferences.
   - Temporary: exam dates, one-off projects, short-lived experiments, session-specific context.
   - Do not force temporary items into the profile.

3. **Synthesize into a markdown profile.**
   - Use clear headings.
   - Group by: address, language, response style, domains, environment, decision style, feedback style, boundaries.
   - Keep it readable and easy to skim.

4. **Store only stable facts in long-term memory.**
   - Save durable preferences that will matter later.
   - Exclude secrets, credentials, and short-term tasks.

5. **If the user asked for it, provide a separate summary of their ideas.**
   - Put the summary in a distinct message or section.
   - Do not mix the idea-summary with the durable profile if that would make the profile noisy.

## Question bank

Use only the subset that is relevant. Good defaults:
- How should I address you?
- What language should I use by default?
- How concise or detailed should I be?
- What do you want help with most?
- What are your current high-level goals?
- What response style do you dislike?
- What tools or environments should I know?
- What decision style do you prefer?
- What should I avoid remembering or mentioning?

## Output shape

When creating the profile, include:
- `user-profile.md` content with headings
- a short bullet summary of what was learned
- a note about what was intentionally *not* saved if the user asked for exclusions

## Pitfalls

- **Do not overwrite temporary context into durable memory.**
  Example: an exam deadline or a single project milestone may be important right now but should usually stay out of the permanent profile unless the user explicitly wants it remembered.

- **Do not turn the profile into a transcript.**
  The profile should be a compact operating manual for future sessions.

- **Do not accept vague preferences as final if they need clarification.**
  Example: "be helpful" is too broad; ask for how the user wants help in practice.

- **Do not store secrets, passwords, card data, or one-time sensitive info.**

## Verification

Before finalizing:
- Check that the profile reflects stable preferences only.
- Check that sensitive or temporary items were excluded.
- Check that the wording is usable as a future-session reference.

## Support files

- `templates/user-profile.md` — reusable markdown skeleton for a personal profile file.
