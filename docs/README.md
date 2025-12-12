# Project Documentation Index

This index organizes the `docs/` folder into logical sections to make it easy to explore the project's specifications, audits, backlog and plans.

Structure
- specs/: canonical product specifications (API, auth, DB, feed, uploads)
- audits/: audits and gap reports produced by the engineering review
- backlog/: feature backlog and CSV for issue import
- mapping/: API→code mapping and short spec summary
- plans/: sprint plan and roadmap

How to use
- Read `specs/` first to understand product requirements.
- Open `audits/` to see where the implementation departs from the spec and recommended fixes.
- Use `backlog/` to create issue tickets (CSV included).
- `mapping/` helps you see which code files implement each endpoint.
- `plans/` contains sprint plans and implementation milestones.

Quick links
- Specs
  - ./specs/API-Specification.md — API endpoints, request/response shapes
  - ./specs/Authentication-Specification.md — auth flows and token rules
  - ./specs/Database-Schema.md — canonical DB schemas and indexes
  - ./specs/Feed-Algorithm-Specification.md — feed scoring and caching
  - ./specs/File-Upload-Specification.md — upload flow and validation

- Audits
  - ./audits/AUTH_SECURITY_AUDIT.md — auth & security findings
  - ./audits/UPLOAD_STORAGE_AUDIT.md — upload middleware audit
  - ./audits/FEED_ALGORITHM_INTEGRATION.md — feed integration plan
  - ./audits/MODEL_SCHEMA_GAP_REPORT.md — model vs schema gaps

- Backlog
  - ./backlog/feature-backlog.md — epics and stories
  - ./backlog/feature-backlog.csv — CSV for issues import

- Mapping & Summary
  - ./mapping/API_ROUTE_MAPPING.md — mapping of spec endpoints to repo routes/controllers
  - ./mapping/SPEC_SUMMARY.md — one-page spec summary

- Plans
  - ./plans/sprint-plan.md — split sprint plan & acceptance criteria

