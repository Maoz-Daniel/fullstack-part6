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
