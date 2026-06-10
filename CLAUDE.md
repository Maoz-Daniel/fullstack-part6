# Fullstack Project 6 — JSONPlaceholder Clone

A course full-stack project: a JSONPlaceholder-style app with a **React client**, a
**Node.js + Express REST server**, and a **MySQL** database. The server exposes a REST API
that the React SPA consumes. The project is built incrementally and must be fully understood
for presentation.

## Start of every session
**Read @fullstack_context.md first.** It is the mandatory source of truth for the tools,
libraries, patterns, and conventions allowed in this project. Do not rely on outside
knowledge where this doc specifies an approach.

## Working style
- I work in **Plan Mode**. Always present a plan and wait for my approval before writing code.
- Build **incrementally** — one component/stage at a time, not the whole project at once.
- This is a course project I must fully understand and present. **Do not introduce libraries
  or patterns outside `fullstack_context.md` without asking me first.**
- Briefly **explain architectural decisions** as you go.
- When a session's decision changes or adds a project convention, **propose an update to
  this `CLAUDE.md` before finishing and ask me to confirm** — don't let it drift out of sync.

## Spec conventions

### Data model
- Resources: **users, todos, posts, comments**.
- A user has many todos and many posts; a post has many comments.
- A separate **users+passwords** table holds credentials, with **restricted access**.

### Server (mirrors jsonplaceholder)
- Routes: `/users`, `/todos`, `/posts`, `/comments` — full REST (**GET, POST, PUT, DELETE**) on each.
- **POST** returns the created object (including its new `id`); **DELETE** returns the deleted object.
- **PUT/DELETE on a post or comment is allowed only if it belongs to the active user.**

### Client
- Pages: `/login` and `/register`, plus an authenticated app area with informative internal
  URLs (e.g. `/users`, `/shlomo/posts`).

### Auth
- A valid user is one that exists in the DB with a **matching password**.
- On success: store the logged-in user in **Local Storage** and route to the app.
- On failure: show an error and **stay on the login page**.
- **Info** button shows the user's personal info (**never** the password).
- **Logout** clears Local Storage and returns to login.

## Locked decisions (Stage A)
Schema/seed live in `db/schema.sql`, `db/grants.sql`, `db/seed.sql` — don't duplicate them here.

- **Soft delete everywhere.** Each resource table (users, todos, posts, comments) has
  `deleted_at DATETIME NULL`. "Delete" = set `deleted_at = NOW()`; **every** read filters
  `WHERE deleted_at IS NULL`. The DELETE endpoint reads the row, returns it, then stamps it.
- **User states: active / blocked / deleted.** Tracked by two independent timestamps
  (`deleted_at`, `blocked_at`) — never collapse them into one flag. A blocked **or** deleted
  user cannot log in.
- **Admin.** `users.is_admin` marks a privileged account.
- **Password storage.** Hashed as `SHA2(CONCAT(salt, password), 256)` with a per-row salt,
  stored **only** in the separate `users_passwords` table. Never plaintext, never in `users`.
- **Credentials access.** The app connects as `app_user`, which has **no** rights on
  `users_passwords`. All credential work goes through `SQL SECURITY DEFINER` procedures
  (`sp_verify_login`, `sp_set_password`); `app_user` has only `EXECUTE`. Never read or write
  `users_passwords` directly from app code.
- **Soft-delete cascade is in server code, not the DB.** E.g. soft-deleting a post also
  stamps its comments' `deleted_at`. Only `users_passwords` uses `ON DELETE CASCADE`.
- **`username` and `email` are UNIQUE across all rows** (including soft-deleted / blocked),
  so those identities stay reserved and can't be reused on registration.

## Locked decisions (Stage B)
- **MySQL driver: `mysql2`, not `mysql`.** `fullstack_context.md` specifies the `mysql`
  driver, but the server is MySQL 9.7, which removed `mysql_native_password` (gone since
  MySQL 9.0). The legacy `mysql` driver can't do `caching_sha2_password`, so it cannot
  authenticate at all. `mysql2` is a drop-in — we keep the same **callback API** and the
  `util.promisify`-wrapped query helper; only the `require` changed. `fullstack_context.md`
  is the canonical course reference and is left as-is; this deviation lives only here.
- **Server lives at the repo root.** Entry `index.js`; `routes/`, `middleware/`,
  `validation/` alongside it. The React app stays in `client/`.
- **DB credentials in a gitignored `config.js`.** `config.example.js` (committed)
  documents the shape; the real `config.js` holds the `app_user` password and is never
  committed.
- **One promisified connection.** `db/connection.js` opens a single `app_user` connection
  and exports a `util.promisify`-wrapped `query()` helper; all routes use `async/await`
  with `?` placeholders. `CALL sp_*` returns the proc's rows under `result[0]`.
- **Registration is atomic.** `POST /register` wraps `INSERT users` + `CALL sp_set_password`
  in one transaction (COMMIT/ROLLBACK), so a `username`/`email` is never reserved without a
  usable password.
- **Login is stateless and generic.** `POST /login` calls `sp_verify_login` and returns the
  user (never a password) on success; any failure — wrong password, blocked, or deleted —
  is one `401 "Invalid username or password"`. No sessions/JWT; the client stores the user
  in Local Storage (Stage C).
- **Temporary active-user identification for Stage B.** Until the client auth flow is wired
  end-to-end, mutating `posts`/`comments` requests identify the active user via the
  `x-user-id` request header. `POST`, `PUT`, and `DELETE` on those resources use that header
  for ownership checks server-side.
- **Error/status conventions.** Joi-validated input (`400` on failure); duplicate
  identity → `409`; unmatched route → `404`; everything else flows through one central
  error handler (`500`). Errors are JSON: `{ "error": "..." }`.
- **Per-resource DB modules.** Each resource gets its own data-access module under `db/`
  (e.g. `db/todos.js`) exporting plain `async` functions that wrap the SQL; route files
  import these and stay thin (validate → call → respond). Reads filter
  `deleted_at IS NULL`; DELETE reads the row, returns it, then stamps `deleted_at`
  (soft delete). The shared `query()` helper in `db/connection.js` is unchanged. This is
  the template for all resources.
