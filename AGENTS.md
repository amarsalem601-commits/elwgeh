# Architecture decisions

- Persist AI assistant threads and messages in user-scoped public tables protected by RLS, and route all AI execution through authenticated server functions so histories and business actions remain private.
- Require explicit user confirmation before an AI assistant applies a business-data or appearance change, because conversational requests must not silently mutate the live system.
- Keep the two AI assistants as shared dashboard surfaces with role-aware capabilities, because admin and employee dashboards should offer the same core assistance without bypassing existing permissions.