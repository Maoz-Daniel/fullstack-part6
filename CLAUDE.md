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
<<<<<<< HEAD
- Routes: `/users`, `/todos`, `/posts`, `/comments` - full REST (**GET, POST, PUT, DELETE**) on each.
  **Exception:** `/users` has **no public read routes** (no `GET /users` list, no `GET /users/:id`) -
  they were unused by the client and would expose user details. Listing users is admin-only via
  `GET /admin/users`; `/users` keeps only `POST` (create) and authenticated `PUT`/`DELETE` (self).
=======
- Routes: `/todos`, `/posts`, `/comments` - full REST (**GET, POST, PUT, DELETE**).
  `/users` supports read/create/profile update/password change, but no self-delete route.
>>>>>>> 2dc6ab6 (changes on cach and transactions)
- **POST** returns the created object (including its new `id`); **DELETE** returns the deleted object.
- **PUT/DELETE on a post or comment is allowed only if it belongs to the active user.**

### Client
- Pages: `/login` and `/register`, plus an authenticated app area with informative internal
  URLs (e.g. `/users`, `/maoz/posts`).

### Auth
- A valid user is one that exists in the DB with a **matching password**.
- On success: store the authenticated session in **Local Storage** and route to the app.
- On failure: show an error and **stay on the login page**.
- **Info** button shows the user's personal info (**never** the password).
- **Logout** clears Local Storage and returns to login.

## Project structure
- **Client code lives in `client/`.** React/Vite application, services, pages, routing, and styles.
- **Server code lives in `server/`.** Entry point `server/index.js`, with `server/routes/`,
  `server/middleware/`, `server/validation/`, `server/utils/`, and `server/db/`.
- **Database setup scripts live in `database/`.** `database/schema.sql`,
  `database/grants.sql`, and `database/seed.sql` are infrastructure scripts, not runtime
  server modules.

## Locked decisions (Stage A)
Schema/seed live in `database/schema.sql`, `database/grants.sql`, `database/seed.sql` - don't duplicate them here.

- **Soft delete everywhere.** Each resource table (users, todos, posts, comments) has
  `deleted_at DATETIME NULL`. "Delete" = set `deleted_at = NOW()`; **every** read filters
  `WHERE deleted_at IS NULL`. The DELETE endpoint reads the row, returns it, then stamps it.
- **User states: active / blocked / deleted.** Tracked by two independent timestamps
  (`deleted_at`, `blocked_at`) - never collapse them into one flag. A blocked **or** deleted
  user cannot log in.
- **Admin.** `users.is_admin` marks a privileged account. Seed data uses a separate
  `admin` user for administration; `maoz` is a regular user.
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
- **Server lives under `server/`.** Entry `server/index.js`; `server/routes/`,
  `server/middleware/`, `server/validation/`, `server/utils/`, and `server/db/` are runtime
  server code. The React app stays in `client/`.
- **DB credentials in a gitignored `server/config.js`.** It exports
  `{ db: { host, user, password, database }, jwt: { secret, expiresIn } }`; the real file holds
  the `app_user` password and JWT secret and is never committed (no committed template file).
- **JWT config in `server/config.js`.** The gitignored `server/config.js` holds `jwt.secret`
  and `jwt.expiresIn`; the secret stays only in that local file.
- **One promisified connection.** `server/db/connection.js` opens a single `app_user` connection
  and exports a `util.promisify`-wrapped `query()` helper; all routes use `async/await`
  with `?` placeholders. `CALL sp_*` returns the proc's rows under `result[0]`.
- **Registration is atomic.** `POST /register` wraps `INSERT users` + `CALL sp_set_password`
  in one transaction (COMMIT/ROLLBACK), so a `username`/`email` is never reserved without a
  usable password.
- **Transactions are short and rare.** Manual transactions are used only for short
  multi-table operations that must be atomic. They contain only the required DB statements -
  no validation, HTTP work, logging, or non-DB logic inside the transaction.
- **Login issues JWTs.** `POST /login` calls `sp_verify_login` and returns `{ user, token }`
  on success. The JWT payload is minimal: `id`, `username`.
- **Profile update refreshes JWTs.** `PUT /users/:id` returns `{ user, token }` so a
  username change updates both Local Storage and the JWT without forcing a new login.
- **Password changes use the existing DB hashing path.** `PUT /users/:id/password` verifies
  `currentPassword` through `sp_verify_login`, then calls `sp_set_password` for the new
  password. No bcrypt is introduced unless the whole login/register/password stack migrates.
- **User action summaries.** Major account actions are written to `user_actions` as short
  summaries only. Successful logins are not logged because they flood the admin screen;
  failed logins are logged. The table is created by `database/schema.sql` and granted in
  `database/grants.sql`.
- **Admin management lives under `/admin`.** Authenticated admin-only routes expose:
  `GET /admin/users`, `PUT /admin/users/:id/block`, `PUT /admin/users/:id/unblock`,
  and paginated `GET /admin/actions`.
- **Admin safety rules.** Admin users cannot be blocked through the admin routes, and an
  admin cannot block their own account.
- **Authenticated writes use `Authorization: Bearer ...`.** The client sends the JWT on API
  requests, and Express resolves the authenticated user from the token into
  `req.activeUserId` / `req.activeUser`.
- **Ownership checks use JWT auth.** Mutating `posts`, `comments`, and `todos` requests, plus
  `PUT /users/:id`, rely on the authenticated user from the JWT.
- **Error/status conventions.** Joi-validated input (`400` on failure); duplicate
  identity -> `409`; unmatched route -> `404`; everything else flows through one central
  error handler (`500`). Errors are JSON: `{ "error": "..." }`.
- **Per-resource DB modules.** Each resource gets its own data-access module under `server/db/`
  (e.g. `server/db/todos.js`) exporting plain `async` functions that wrap the SQL; route files
  import these and stay thin (validate -> call -> respond). Reads filter
  `deleted_at IS NULL`; DELETE reads the row, returns it, then stamps `deleted_at`
  (soft delete). The shared `query()` helper in `server/db/connection.js` is unchanged. This is
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
- **Info popup via hash, not a route.** The "Info" link appends `#user-info` to the current
  path; `ProtectedLayout` renders `UserInfoPanel` when that hash is present. It renders as a
  **modal popup** (dark backdrop + centered dialog) closable via the **X** button, **Esc**,
  or a **backdrop click** — each clears the `#user-info` hash. It shows personal fields and
  lets the user edit their profile and change their password, but never displays the stored
  password. Logout clears Local Storage and returns to `/login`.

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
- **List/read responses carry the author's email (`user_email`).** `server/db/posts.js` and
  `server/db/comments.js` `JOIN users` and select `users.email AS user_email` on every read, so the
  client can show who wrote a post/comment without a second request. `services/postsService.js`
  normalizes `id` / `user_id` / `post_id` to `Number` on every post and comment it returns.
- **Soft-delete cascade for posts is a real transaction.** `server/db/posts.js` `softDeletePost`
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
  to `req.activeUserId` at the SQL level. The owner is never a query param, so it can't be
  spoofed. A tampered `:albumId`/`?albumId` for someone else's data returns `404`/empty,
  never their rows. `GET /albums/:id` (and photos) return **`404` (not `403`)** for a row you
  don't own, so existence isn't leaked.
- **A photo's owner is its album's owner (photo → album → user); `photos` has no `user_id`.**
  Only `albums` carries `user_id`. `server/db/albums.js` scopes reads with `albums.user_id = ?`;
  `server/db/photos.js` scopes by **joining albums** (`albums.user_id = ?`), and the photo
  routes check ownership via the photo's album (`albums.getAlbumById`). Photo reads return only
  photo columns (`id, album_id, title, url, thumbnail_url`) — no `user_id`/`user_email`.
- **Pagination via `Link` header, not an envelope.** `GET /albums` and `GET /photos` return
  a **bare array** (same shape as posts/comments) plus, when more pages exist, an RFC-5988
  `Link: <…?page=N&limit=…>; rel="next"` header. The DB layer fetches **`limit + 1`** rows
  and the route derives `hasNext` from the extra row — **no `COUNT(*)` / `X-Total-Count`**.
  Helper: `server/middleware/pagination.js` `sendPaginated()`. Query params: `?page=` (default 1),
  `?limit=` (albums default 3, photos default 8, max 50), `?q=` (album title `LIKE` search), `?albumId=` (photos).
- **CORS exposes `Link`.** `server/index.js` sets `cors({ ..., exposedHeaders: ['Link'] })` so the
  browser's `fetch` can read the pagination header cross-origin (Vite `:5173` → Express
  `:3000`).
- **`apiClient` opts into pagination.** `client/src/services/apiClient.js` gained a
  `withPagination` option: when set it parses the `Link` header and returns
  `{ data, nextPage }`. Default callers (posts/todos/comments) still get the bare body —
  unchanged.
- **`photo_count` via a correlated subquery** (NOT `JOIN` + `GROUP BY`): `listAlbums` selects
  `(SELECT COUNT(*) FROM photos WHERE album_id = albums.id AND deleted_at IS NULL)` so the
  albums grid shows photo counts with no per-album request (N+1 avoided). Albums reads return
  only `id, user_id, title, photo_count` — no `JOIN users`/`user_email` (albums are always the
  active user's own, so the owner email was redundant and unused by the client).
- **Client page cache cuts repeat round-trips and restores loaded views.** `services/cacheStore.js`
  is a session `Map`. `todosService`, `postsService`, `albumsService`, and `photosService`
  cache paginated API pages and invalidate by prefix on writes. `TodosPage`, `PostsPage`,
  `AlbumsPage`, and `AlbumPhotosPage` also cache a view snapshot (`items`, `nextPage`) so
  returning to a page restores the rows already loaded with "Load more" instead of starting
  again from page 1.
- **Pagination UI via `hooks/usePaginatedItems.js`** ("Load more", merge-by-id). Photos
  carry `title`, `url`, `thumbnail_url`.
- **Drill-in routes.** `/users/:username/albums` (grid) and
  `/users/:username/albums/:albumId/photos` (`AlbumsPage` / `AlbumPhotosPage`). The photos
  page redirects to the grid on a 404 album load, but that's only UX — the server is the
  real gate.

## Locked decisions (Stage F) — User management & Admin (DONE)
Implements the Stage B admin/account locked decisions in code, plus a few extensions. Also
the project layout now matches the **Project structure** section above: server code under
`server/`, SQL infra under `database/` (the earlier root-level `db/`, `routes/`, etc. were
moved; `node server/index.js` / `npm run dev` is the entry point).
- **Self-service account management (client `services/usersService.js`).** `PUT /users/:id`
  updates profile fields and returns `{ user, token }` (fresh JWT so a username change keeps
  Local Storage and the token in sync). `PUT /users/:id/password` verifies `currentPassword`
  via `sp_verify_login` then sets the new one via `sp_set_password` — both gated to the
  active user (`existing.id === req.activeUserId`, else `403`).
- **Admin routes (`server/routes/admin.js`) are double-gated** by
  `authenticateToken` **then** `requireAdmin` (`server/middleware/requireAdmin.js`, checks
  `req.activeUser.is_admin === 1`, else `403`). Exposes `GET /admin/users`,
  `PUT /admin/users/:id/block`, `.../unblock`, `.../make-admin`, and paginated
  `GET /admin/actions`.
- **`make-admin` is new beyond the Stage B list.** `PUT /admin/users/:id/make-admin`
  promotes a user, with guards: can't promote yourself (`403`), `409` if already admin,
  `403` if the user is blocked (unblock first). Block/unblock keep the Stage B safety rules
  (admins can't be blocked; you can't block your own account).
- **`user_actions` is an actor/target audit log.** Columns: `actor_user_id`,
  `target_user_id` (both nullable FKs to `users`), `action_type`, `resource_type`,
  `resource_id`, `details`, `created_at`. `server/db/userActions.js` `listActions` `LEFT JOIN`s
  users twice (actor + target) for usernames/emails, orders by `id DESC`, and paginates with
  the same `Link`-header helper. `GET /admin/actions` filters: `?userId=` (matches actor OR
  target), `?actionType=`, `?resourceType=` (default `limit` 10).
- **Logging is best-effort via `safeLogAction`.** It wraps `logAction` in try/catch and only
  `console.error`s on failure, so a logging error never breaks the real request. Logged
  events now include `profile_update`, `password_change`, `admin_block_user`,
  `admin_unblock_user`, `admin_make_admin` (plus the Stage B failed-login records; successful
  logins are still not logged).
- **`createAuthToken` is shared.** Extracted to `server/utils/createAuthToken.js` and used by
  both `routes/auth.js` (login/register) and `routes/users.js` (profile update), instead of
  re-signing inline.
- **Client admin UI.** `pages/AdminPage.jsx` + `services/adminService.js`; an `Admin`
  nav link renders only when `user.is_admin` (`ProtectedNavigation.jsx`), routed at
  `/users/:username/admin`. `adminService` normalizes ids and reuses the `withPagination`
  Link-header flow for the actions log.
