# Fullstack Project 6 - JSONPlaceholder Clone

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
- Build **incrementally** - one component/stage at a time, not the whole project at once.
- This is a course project I must fully understand and present. **Do not introduce libraries
  or patterns outside `fullstack_context.md` without asking me first.**
- Briefly **explain architectural decisions** as you go.
- When a session's decision changes or adds a project convention, **propose an update to
  this `CLAUDE.md` before finishing and ask me to confirm** - don't let it drift out of sync.

## Spec conventions

### Data model
- Resources: **users, todos, posts, comments**.
- A user has many todos and many posts; a post has many comments.
- A separate **users+passwords** table holds credentials, with **restricted access**.

### Server (mirrors jsonplaceholder)
- Routes: `/users`, `/todos`, `/posts`, `/comments` - full REST (**GET, POST, PUT, DELETE**) on each.
- **POST** returns the created object (including its new `id`); **DELETE** returns the deleted object.
- **PUT/DELETE on a post or comment is allowed only if it belongs to the active user.**

### Client
- Pages: `/login` and `/register`, plus an authenticated app area with informative internal
  URLs (e.g. `/users`, `/shlomo/posts`).

### Auth
- A valid user is one that exists in the DB with a **matching password**.
- On success: store the authenticated session in **Local Storage** and route to the app.
- On failure: show an error and **stay on the login page**.
- **Info** button shows the user's personal info (**never** the password).
- **Logout** clears Local Storage and returns to login.

## Locked decisions (Stage A)
Schema/seed live in `db/schema.sql`, `db/grants.sql`, `db/seed.sql` - don't duplicate them here.

- **Soft delete everywhere.** Each resource table (users, todos, posts, comments) has
  `deleted_at DATETIME NULL`. "Delete" = set `deleted_at = NOW()`; **every** read filters
  `WHERE deleted_at IS NULL`. The DELETE endpoint reads the row, returns it, then stamps it.
- **User states: active / blocked / deleted.** Tracked by two independent timestamps
  (`deleted_at`, `blocked_at`) - never collapse them into one flag. A blocked **or** deleted
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
  authenticate at all. `mysql2` is a drop-in - we keep the same **callback API** and the
  `util.promisify`-wrapped query helper; only the `require` changed. `fullstack_context.md`
  is the canonical course reference and is left as-is; this deviation lives only here.
- **Server lives at the repo root.** Entry `index.js`; `routes/`, `middleware/`,
  `validation/` alongside it. The React app stays in `client/`.
- **DB credentials in a gitignored `config.js`.** `config.example.js` (committed)
  documents the shape; the real `config.js` holds the `app_user` password and is never
  committed.
- **JWT config in `config.js`.** `config.example.js` documents `jwt.secret` and
  `jwt.expiresIn`; the real secret stays only in the gitignored `config.js`.
- **One promisified connection.** `db/connection.js` opens a single `app_user` connection
  and exports a `util.promisify`-wrapped `query()` helper; all routes use `async/await`
  with `?` placeholders. `CALL sp_*` returns the proc's rows under `result[0]`.
- **Registration is atomic.** `POST /register` wraps `INSERT users` + `CALL sp_set_password`
  in one transaction (COMMIT/ROLLBACK), so a `username`/`email` is never reserved without a
  usable password.
- **Login issues JWTs.** `POST /login` calls `sp_verify_login` and returns `{ user, token }`
  on success. The JWT payload is minimal: `id`, `username`.
- **Authenticated writes use `Authorization: Bearer ...`.** The client sends the JWT on API
  requests, and Express resolves the authenticated user from the token into
  `req.activeUserId` / `req.activeUser`.
- **Ownership checks use JWT auth.** Mutating `posts`, `comments`, and `todos` requests, plus
  `PUT/DELETE /users/:id`, rely on the authenticated user from the JWT.
- **Error/status conventions.** Joi-validated input (`400` on failure); duplicate
  identity -> `409`; unmatched route -> `404`; everything else flows through one central
  error handler (`500`). Errors are JSON: `{ "error": "..." }`.
- **Per-resource DB modules.** Each resource gets its own data-access module under `db/`
  (e.g. `db/todos.js`) exporting plain `async` functions that wrap the SQL; route files
  import these and stay thin (validate -> call -> respond). Reads filter
  `deleted_at IS NULL`; DELETE reads the row, returns it, then stamps `deleted_at`
  (soft delete). The shared `query()` helper in `db/connection.js` is unchanged. This is
  the template for all resources.

## Locked decisions (Stage C)
- **React Router is allowed.** The client uses `react-router-dom` for `/login`,
  `/register`, and authenticated app URLs such as `/users/:username/posts` and
  `/users/:username/todos`.
- **Client auth state.** The authenticated session is stored in Local Storage under
  `loggedInUser` as `{ user, token }`; the stored `user` must not include a password.
- **Two-server development setup.** The React client runs on `http://localhost:5173` and
  the Express API runs on `http://localhost:3000`. Client-side `fetch` calls use the full
  API origin (`http://localhost:3000/...`).
- **CORS allowlist.** During development, Express enables CORS only for
  `http://localhost:5173`.
- **Client data access goes through one `apiClient` wrapper.**
  `client/src/services/apiClient.js` wraps `fetch`: it prefixes the
  `http://localhost:3000` origin, attaches `Authorization: Bearer <token>` from the stored
  session when present, sets `Content-Type: application/json` only when there is a body,
  parses the JSON response, and on a non-2xx status throws an `Error` carrying `.status` and
  `.data`. Per-resource service modules (e.g. `services/todosService.js`) build on it and
  stay thin.
- **Session lives behind `utils/session.js` + the `useAuth` hook.** `utils/session.js` owns
  the Local Storage key `loggedInUser`, validates the `{ user, token }` shape on read/write,
  and strips any `password` field. The `useAuth` hook exposes `{ user, token, login, logout,
  isAuthenticated }` to components; no component touches `localStorage` directly.
- **Route guards.** `router/PublicOnlyRoute.jsx` bounces an already-logged-in user away from
  `/login` and `/register`; `router/ProtectedLayout.jsx` requires a session and forces the
  `:username` segment in the URL to match the active user (redirecting otherwise).
- **Info panel via hash, not a route.** The "Info" link appends `#user-info` to the current
  path; `ProtectedLayout` renders `UserInfoPanel` when that hash is present. It shows
  personal fields only, never the password. Logout clears Local Storage and returns to
  `/login`.

## Locked decisions (Stage D) — Todos feature (DONE)
- **Todos client feature is complete.** `pages/TodosPage.jsx` lists the active user's todos
  sorted by `id`, with a completion checkbox, inline title editing, delete, and an
  All / Active / Completed filter that maps to the server's `?completed=` query param.
  Creates default to `completed: false`; the owner is never sent from the client — the
  server derives it from the JWT.
- **`completed` is normalized to a real boolean client-side.** MySQL returns `TINYINT` 0/1,
  so `services/todosService.js` coerces `completed` with `Boolean(...)` on every todo it
  returns, keeping checkbox state correct.

## Locked decisions (Stage E) — Posts & Comments feature (DONE)
- **Posts & comments client feature is complete.** `pages/PostsPage.jsx` is the full UI
  (no longer a stub): a "My posts" / "All posts" toggle (mapped to the server's `?userId=`
  filter), create/edit/delete post, and per-post expandable comments with create/edit/delete.
  Everything is sorted by `id`. Edit/Delete controls render only when the row belongs to the
  active user (`item.user_id === user.id`); the server still enforces ownership, the client
  just hides what you can't do.
- **Comments load lazily and are cached per post.** Clicking "Comments" fetches that post's
  comments once via `getComments({ postId })` and stores them under `commentsByPostId[postId]`;
  reopening reuses the cache. This keeps client↔server round-trips down (the Stage F
  performance goal).
- **List/read responses carry the author's email (`user_email`).** `db/posts.js` and
  `db/comments.js` `JOIN users` and select `users.email AS user_email` on every read, so the
  client can show who wrote a post/comment without a second request. `services/postsService.js`
  normalizes `id` / `user_id` / `post_id` to `Number` on every post and comment it returns.
- **Soft-delete cascade for posts is a real transaction.** `db/posts.js` `softDeletePost`
  stamps the post's comments' `deleted_at` and then the post's, inside one
  `START TRANSACTION` / `COMMIT` (rolling back on error) — implementing the Stage A
  "cascade in server code" decision for the posts → comments edge.
- **Comment creation validates its parent post.** `POST /comments` rejects a `post_id` that
  doesn't reference an existing active post with `400` before inserting.

## Locked decisions (Stage F) — Albums & Photos bonus (DONE)
This bonus bundles three goals: new **albums + photos** resources (DB/server/client),
**advanced URL queries** handled server-side, and **fewer round-trips**. Albums follow the
posts pattern (parent, soft-delete cascade), photos follow the comments pattern (child).
- **Albums & photos are PRIVATE to their owner** (unlike posts, which are public). **Every**
  albums/photos route — reads included — requires `authenticateToken`, and reads are scoped
  to `req.activeUserId` at the SQL level (`db/albums.js`/`db/photos.js` always filter
  `user_id = ?`). The owner is never a query param, so it can't be spoofed. A tampered
  `:albumId`/`?albumId` for someone else's data returns `404`/empty, never their rows.
  `GET /albums/:id` (and photos) return **`404` (not `403`)** for a row you don't own, so
  existence isn't leaked.
- **Pagination via `Link` header, not an envelope.** `GET /albums` and `GET /photos` return
  a **bare array** (same shape as posts/comments) plus, when more pages exist, an RFC-5988
  `Link: <…?page=N&limit=…>; rel="next"` header. The DB layer fetches **`limit + 1`** rows
  and the route derives `hasNext` from the extra row — **no `COUNT(*)` / `X-Total-Count`**.
  Helper: `middleware/pagination.js` `sendPaginated()`. Query params: `?page=` (default 1),
  `?limit=` (default 6, max 50), `?q=` (album title `LIKE` search), `?albumId=` (photos).
- **CORS exposes `Link`.** `index.js` sets `cors({ ..., exposedHeaders: ['Link'] })` so the
  browser's `fetch` can read the pagination header cross-origin (Vite `:5173` → Express
  `:3000`).
- **`apiClient` opts into pagination.** `client/src/services/apiClient.js` gained a
  `withPagination` option: when set it parses the `Link` header and returns
  `{ data, nextPage }`. Default callers (posts/todos/comments) still get the bare body —
  unchanged.
- **`photo_count` via a correlated subquery** (NOT `JOIN` + `GROUP BY`): `listAlbums` selects
  `(SELECT COUNT(*) FROM photos WHERE album_id = albums.id AND deleted_at IS NULL)` so the
  albums grid shows photo counts with no per-album request (N+1 avoided). The `JOIN users`
  remains, only for `user_email`.
- **Client page cache cuts repeat round-trips.** `services/cacheStore.js` is a session
  `Map`; `albumsService`/`photosService` cache each page under
  `albums:user:<id>:q:<q>:page:<n>` / `photos:album:<id>:page:<n>` and invalidate by prefix
  on any write. Re-opening a visited album/page is served from cache.
- **Pagination UI via `hooks/usePaginatedItems.js`** ("Load more", merge-by-id). Photos
  carry `title`, `url`, `thumbnail_url`.
- **Drill-in routes.** `/users/:username/albums` (grid) and
  `/users/:username/albums/:albumId/photos` (`AlbumsPage` / `AlbumPhotosPage`). The photos
  page redirects to the grid on a 404 album load, but that's only UX — the server is the
  real gate.
