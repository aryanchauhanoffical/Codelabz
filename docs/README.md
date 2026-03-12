# Documentation Index

This folder contains technical documentation written after a full analysis of the Codelabz repository. It covers architecture, codebase navigation, the CI/CD pipeline, secrets management, and identified improvements.

---

## Documents

### [ARCHITECTURE.md](./ARCHITECTURE.md)
The big picture. Explains the technology stack, how the frontend, backend, and databases are connected, the data flow through the system, and why certain architectural decisions were made (two databases, no REST server, client-side search, etc.). Start here if you're new to the project.

### [CODEBASE_GUIDE.md](./CODEBASE_GUIDE.md)
A folder-by-folder map of the repository. Covers every major directory in `src/`, the Redux store structure and patterns, what each Cloud Function does, and which files you'll edit most often as a contributor. Use this as a reference when navigating the codebase.

### [CICD_PIPELINE.md](./CICD_PIPELINE.md)
Full explanation of the GitHub Actions deployment pipeline. Documents all six workflows, what triggers each one, every step they execute, how environments differ between PR previews and production, and a complete table of all secrets used. Read this before touching anything in `.github/workflows/`.

### [ENVIRONMENT_AND_SECRETS.md](./ENVIRONMENT_AND_SECRETS.md)
Covers every environment variable and secret the project depends on — what it is, where it comes from, where it's used in code, and how to set it up locally. Also explains the security model around Firebase API keys and which secrets are actually sensitive versus which ones are safe to share.

### [IMPROVEMENTS.md](./IMPROVEMENTS.md)
An honest analysis of the most significant gap in the current CI/CD pipeline: tests do not block production deployments. Documents the root cause, the exact code change needed to fix it, and the impact of that fix. Also notes three secondary improvements worth considering.

---

## Quick Reference

| I want to... | Read |
|---|---|
| Understand how the whole system fits together | ARCHITECTURE.md |
| Find where a specific feature is implemented | CODEBASE_GUIDE.md |
| Understand how deploys work | CICD_PIPELINE.md |
| Set up the project locally | ENVIRONMENT_AND_SECRETS.md |
| Understand what could be improved | IMPROVEMENTS.md |
