# Architecture Decision Records

This folder contains Architecture Decision Records for NEWAX Core.

Architecture Decision Records, or ADRs, document important technical and architectural decisions that affect NEWAX Core as a reusable business infrastructure foundation.

ADRs are intended for decisions that have long-term impact on architecture, module ownership, data boundaries, permissions, security, scalability, maintainability, client customization, or platform evolution.

## What Architecture Decision Records Are

An ADR is a concise record of an important architecture decision.

It should explain:

- The context behind the decision.
- The problem being solved.
- The decision that was made.
- The reasoning and alternatives considered.
- The expected consequences.
- The impact on NEWAX Core and client systems.
- The approving stakeholders.

ADRs help future engineers understand why the system was shaped a certain way, not only what was changed.

## When To Create An ADR

Create an ADR when a decision affects one or more of the following:

- Core architecture direction.
- Module boundaries or dependency rules.
- Database ownership or data isolation.
- Permission architecture.
- Security or audit requirements.
- Multi-tenancy direction.
- Reusable module standards.
- Client customization strategy.
- Versioning or upgrade strategy.
- Scalability or future service extraction.
- Cross-module communication patterns.

Do not create an ADR for every small code change, minor documentation update, simple refactor, or local implementation detail.

## Who Should Approve ADRs

ADR approval depends on the scope of the decision.

Typical approvers may include:

- Engineering leadership for architecture and module boundary decisions.
- Product leadership when product behavior, client impact, or platform direction changes.
- Security reviewers when permissions, access control, auditability, data handling, or privacy are affected.
- Relevant module owners when the decision changes module responsibilities or contracts.

An ADR should not be marked `Accepted` until the appropriate stakeholders have reviewed and approved it.

## Why ADRs Matter For NEWAX Core

NEWAX Core is intended to become a private, reusable business infrastructure foundation.

ADRs protect that foundation by creating a durable record of important decisions. They help preserve:

- Long-term maintainability.
- Engineering clarity.
- Accountability.
- Consistent decision-making.
- Reliable module ownership.
- Safer client customization.
- Upgrade discipline.
- Security and scalability awareness.

Without ADRs, major decisions can become hidden in conversations, commits, or short-term delivery pressure.

## ADR Scope Discipline

ADRs should be practical and selective.

Use ADRs for important architecture decisions only. Do not use ADRs as a replacement for normal code review, implementation notes, pull request descriptions, or routine documentation.

A good ADR should be clear enough that a future NEWAX engineer can understand the decision without needing the original discussion.

## Template

Use [ADR-TEMPLATE.md](./ADR-TEMPLATE.md) when creating a new Architecture Decision Record.
