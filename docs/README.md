# Documentation Index

Technical documentation written after a full analysis of the Codelabz repository. Covers architecture, codebase navigation, CI/CD pipeline, secrets management, identified improvements, notification system design, and the AI Tutorial Generator feature proposal.

---

## Documents

### [ARCHITECTURE.md](./ARCHITECTURE.md)
The big picture. Technology stack, how frontend/backend/databases connect, data flow through the system, and why certain architectural decisions were made — two databases, no REST server, client-side search.

### [CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md)
Folder-by-folder map of the repository. Covers every directory in `src/`, the Redux store structure and patterns, what each Cloud Function does, and which files you'll edit most often as a contributor.

### [CICD_PIPELINE.md](./CICD_PIPELINE.md)
Full explanation of the GitHub Actions deployment pipeline. All six workflows documented — triggers, step-by-step execution, environment differences between PR previews and production, and a complete secrets table.

### [ENVIRONMENT_AND_SECRETS.md](./ENVIRONMENT_AND_SECRETS.md)
Every environment variable and secret the project depends on — what it is, where it comes from, how it flows into code, and how to set up locally. Also explains the security model around Firebase API keys.

### [IMPROVEMENTS.md](./IMPROVEMENTS.md)
Analysis of the most significant gap in the CI/CD pipeline: tests do not block production deployments. Root cause, the exact YAML change needed to fix it, impact table, and three secondary improvements worth considering.

### [notification-system-design.md](./notification-system-design.md)
Full design for a scalable notification system built on the existing Firebase stack. Covers gaps in the current implementation, ER model, 12 notification types with priority levels, queue-based delivery architecture, Firestore schema, and a step-by-step example flow.

### [ai-tutorial-generator.md](./ai-tutorial-generator.md)
Feature proposal for an AI Assisted Tutorial Generator powered by Claude API. Problem statement, user value, full system architecture diagram, data flow from editor through Claude API to backend, new Firestore collections, rate limiting strategy, new Redux state, and a concrete example of generated scaffold output.

---

## Quick Reference

| I want to... | Read |
|---|---|
| Understand how the whole system fits together | ARCHITECTURE.md |
| Find where a specific feature is implemented | CODEBASE_GUIDE.md |
| Understand how deploys work | CICD_PIPELINE.md |
| Set up the project locally | ENVIRONMENT_AND_SECRETS.md |
| Understand what could be improved in CI/CD | IMPROVEMENTS.md |
| Design or extend the notification system | notification-system-design.md |
| Understand the AI Tutorial Generator proposal | ai-tutorial-generator.md |
