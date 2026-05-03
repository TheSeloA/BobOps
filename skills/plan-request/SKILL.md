---
name: plan-request
description: Use this when the user gives a request, idea, bug, feature, or task and wants Bob to decide which skills are needed, ask clarifying questions if necessary, and produce a detailed implementation plan.
---

# Plan Request

You are coordinating the available Bob skills for a user request.

## Goal

Take the user's raw request and turn it into a clear, detailed, actionable plan. Use all relevant skills before producing the plan.

## Required Workflow

1. Restate the user's goal in one concise paragraph.
2. Identify which available skills apply.
3. Activate each necessary skill with `use_skill`.
4. If the request is ambiguous, risky, missing requirements, or has multiple reasonable interpretations, ask targeted clarifying questions before planning.
5. If enough information is available, create a detailed plan.

## Skill Selection Guide

Use `brainstorming` when:
- The user is asking for a new feature, design, app, workflow, UI, product idea, or behavior change.
- Requirements are unclear or need shaping.

Use `writing-plans` when:
- The user wants a detailed plan before implementation.
- The task has multiple steps, files, systems, or decisions.

Use `systematic-debugging` when:
- The user reports a bug, error, failure, unexpected behavior, broken test, crash, or regression.

Use `test-driven-development` when:
- The task involves implementing a feature or fixing a bug in code.
- Tests can reasonably be written before or alongside the fix.

Use `code-review` when:
- The user asks for review, audit, critique, security review, or quality check.

Use `verification-before-completion` when:
- Producing a final plan that includes implementation or validation steps.
- The user expects confidence that the work can be checked.

Use `executing-plans` only when:
- The user explicitly asks Bob to implement or execute the plan.

Use `requesting-code-review` and `receiving-code-review` only when:
- The workflow includes human or AI review before merging.

Use `using-git-worktrees` when:
- The task needs isolated branches, parallel experiments, or risky changes.

Use `dispatching-parallel-agents` or `subagent-driven-development` only when:
- Bob has access to parallel agent tools and the task can be split safely.

## Clarifying Questions

Ask questions only when the answer affects the plan. Prefer 1-3 questions at a time.

Ask about:
- Desired outcome
- Constraints
- Target users
- Existing files, repo, or system involved
- Success criteria
- Deadline or scope
- Whether Bob should only plan or also implement

Do not ask questions whose answers can be discovered from the repo or current context.

## Output Format

If clarification is needed, output:

```text
I need a few details before planning:

1. ...
2. ...
3. ...
```

If enough information is available, output:

```text
Goal:
...

Skills used:
- ...
- ...

Assumptions:
- ...

Detailed plan:
1. ...
2. ...
3. ...

Validation:
- ...

Open questions:
- ...
```

## Important Rules

Do not implement unless the user explicitly asks for implementation.

Do not skip skill activation. If a listed skill is relevant, use `use_skill` before planning.

If skills conflict, user instructions take priority.
