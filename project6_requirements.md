# Project 6 — Full-Stack REST API Application
## MySQL + Express + Node.js (Units 13–18)

> **Purpose:** This file defines the exact requirements for Project 6. Any LLM working on this project must read this file to understand the expected scope, architecture, and feature set before writing any code.

---

## Project Overview

Build a full client-server application in the style of [jsonplaceholder.typicode.com](https://jsonplaceholder.typicode.com):

| Layer | Technology |
|-------|-----------|
| Client | React (SPA) |
| Server | Node.js + Express (REST API) |
| Database | MySQL (or MongoDB) |

The server exposes a REST API identical in structure to jsonplaceholder. The React client consumes that API.

---

## Stage A — MySQL Database

### Tables Required
- `users` — user accounts with personal details
- `todos` — todo items, each belonging to a user
- `posts` — posts, each belonging to a user
- `comments` — comments, each belonging to a post
- `users_passwords` — separate table for credentials (**access must be restricted**)

### Relationships
```
users ──< todos        (one user → many todos)
users ──< posts        (one user → many posts)
posts ──< comments     (one post → many comments)
```

### Guidelines
- Plan table architecture carefully before implementation.
- Data volume can be moderate (no need to replicate jsonplaceholder's full dataset).
- The `users_passwords` table must be designed with access restrictions in mind.

---

## Stage B — Node.js Server + Express REST API

### Server Requirements
- Connect Node.js to the MySQL database.
- Write dedicated functions for each data operation and test them independently.
- Build an Express router that mirrors the route structure of jsonplaceholder.

### REST Endpoints to Implement
All routes must support the relevant HTTP verbs:

| Resource | GET | POST | PUT | DELETE |
|----------|-----|------|-----|--------|
| `/users` | ✅ | ✅ | ✅ | ✅ |
| `/users/:id` | ✅ | — | ✅ | ✅ |
| `/todos` | ✅ | ✅ | ✅ | ✅ |
| `/todos/:id` | ✅ | — | ✅ | ✅ |
| `/posts` | ✅ | ✅ | ✅ | ✅ |
| `/posts/:id` | ✅ | — | ✅ | ✅ |
| `/comments` | ✅ | ✅ | ✅ | ✅ |
| `/comments/:id` | ✅ | — | ✅ | ✅ |

### Testing
Use **Postman** to test all route types (GET, POST, PUT, DELETE) against the live server and database before connecting the client.

---

## Stage C — React Client

### Pages & Routes

| Page | Client URL | Purpose |
|------|-----------|---------|
| Login | `./login` | Authenticate existing user |
| Register | `./register` | Register new user |
| App | `./users/:username/posts` etc. | Main application (post-login) |

### Authentication Flow
1. Login and Register pages contain forms with `username`, `password`, and additional fields.
2. A **valid user** = one that exists in the database with a matching password.
3. **Unauthorized attempts** → rejected with an error message; user stays on the login page.
4. **Authorized login** → user object (excluding password) is saved to **LocalStorage (LS)** and user is redirected to the app page.
5. **Info button** → displays the logged-in user's personal info (never the password).
6. **Logout button** → clears the user from LocalStorage, redirects to login page.

### URL Structure
Every view must have a descriptive internal URL, for example:
```
./users/shlomo/posts
./users/shlomo/todos
```

---

## Stage D — Todos Feature

### UI Behavior
- **Todos button** → displays the active user's todo list.
- Items are sorted by `id`.
- Each item shows a **checkbox** indicating completed (`true`) or not (`false`).

### API Operations Required (Client + Server)
| Operation | HTTP Verb | Description |
|-----------|-----------|-------------|
| Fetch todos | `GET` | With optional filter criteria / query params |
| Add todo | `POST` | Create a new todo with relevant fields |
| Update todo | `PUT` | Edit content, toggle completion status, etc. |
| Delete todo | `DELETE` | Remove a todo from the database |

> **Think about:** What does "delete" actually mean in this context? Hard delete vs. soft delete (marking as deleted)?

---

## Stage E — Posts & Comments Feature

### UI Behavior
- **Posts button** → displays the active user's post list, sorted by `id`.
- On demand, show the **comments** for each post.

### API Operations Required (Client + Server)

| Operation | HTTP Verb | Ownership restriction |
|-----------|-----------|----------------------|
| Fetch posts / comments | `GET` | None (read is open) |
| Add post | `POST` | Assigned to active user |
| Add comment | `POST` | Assigned to active user |
| Update post | `PUT` | **Only if owned by active user** |
| Update comment | `PUT` | **Only if owned by active user** |
| Delete post | `DELETE` | **Only if owned by active user** |
| Delete comment | `DELETE` | **Only if owned by active user** |

> **Think about:** What does "delete" mean here? If a post is deleted, what happens to its comments?

---

## Stage F — Advanced Features (Bonus)

These extend the core project for higher completeness:

- **Performance:** Minimize round-trips between client↔server and server↔database.
- **Albums & Photos:** Add `albums` and `photos` resources — in the database, server, and client.
- **Advanced queries:** Support URL query parameters (e.g., `?userId=3&completed=true`) and handle them properly server-side.
- **User management:** Change password, update profile details, block a user.
- **Admin account:** A privileged user that can manage the system, view activity logs, etc.

---

## Project Workflow

Follow these phases in order:

1. **Specification** — Define the project; sketch UI wireframes and user-flow scenarios.
2. **Planning** — Plan all components and how they integrate.
3. **Research** — Identify required technologies, libraries, and existing code patterns.
4. **Implementation** — Build each part; then integrate into a complete project.
5. **Testing** — Test individual parts, edge cases, and the system as a whole.
6. **Preparation** — Final fixes and polish; plan the project presentation.
7. **Presentation** — Demo to evaluators; collect feedback.

---

## Implementation Constraints

- The project is built in **pairs**. Each partner contributes equally to all components and technologies.
- **No code sharing** between pairs (inside or outside the course).
- Both partners present the project jointly.

---

## Key Architecture Decisions to Make Early

Before writing code, the team must decide:

- [ ] Hard delete or soft delete for todos/posts/comments?
- [ ] How to store and verify passwords securely (hashing)?
- [ ] How to restrict access to `users_passwords` at the database level?
- [ ] How to enforce ownership checks (server-side) for PUT/DELETE on posts and comments?
- [ ] What query parameters to support on collection endpoints?
- [ ] How to structure LocalStorage data (what to store, what to exclude)?
