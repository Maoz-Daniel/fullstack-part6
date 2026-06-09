-- ============================================================================
-- Project 6 — Stage A: seed data
-- Run as root AFTER db/schema.sql:  mysql -u root -p < db/seed.sql
--
-- 3 users (shlomo = admin) · 3 todos each · 2 posts each · 2 comments per post.
-- All rows start active (deleted_at / blocked_at default NULL).
-- Passwords are set via the definer procedure, never a raw INSERT.
-- ============================================================================

USE project6;

INSERT INTO users (name, username, email, phone, website, is_admin) VALUES
  ('Shlomo Cohen', 'shlomo', 'shlomo@example.com', '050-1111111', 'shlomo.dev', 1),  -- admin
  ('Dana Levi',    'dana',   'dana@example.com',   '052-2222222', 'dana.io',    0),
  ('Yossi Mizrahi','yossi',  'yossi@example.com',  '054-3333333', 'yossi.net',  0);
-- => ids 1=shlomo (admin), 2=dana, 3=yossi

-- Passwords via the definer procedure (never a raw INSERT).
CALL sp_set_password(1, 'shlomo123');
CALL sp_set_password(2, 'dana123');
CALL sp_set_password(3, 'yossi123');

INSERT INTO todos (user_id, title, completed) VALUES
  (1, 'Finish Stage A schema', 1), (1, 'Review REST routes', 0), (1, 'Prep demo', 0),
  (2, 'Design login page',     1), (2, 'Wire up todos view', 0), (2, 'Test PUT todo', 0),
  (3, 'Set up MySQL locally',  1), (3, 'Seed sample data',   1), (3, 'Read FK docs', 0);

INSERT INTO posts (user_id, title, body) VALUES
  (1, 'My first post',      'Hello from Shlomo.'),                           -- id 1
  (1, 'Thoughts on REST',   'Resources are nouns, verbs are HTTP methods.'), -- id 2
  (2, 'Learning React',     'Components + state are clicking now.'),         -- id 3
  (2, 'MySQL joins',        'INNER vs LEFT finally makes sense.'),           -- id 4
  (3, 'Hello world',        'Yossi here, first post.'),                      -- id 5
  (3, 'Soft delete > hard', 'A deleted_at timestamp is handy.');             -- id 6

INSERT INTO comments (post_id, user_id, body) VALUES
  (1, 2, 'Nice first post!'),        (1, 3, 'Welcome aboard.'),
  (2, 2, 'Great explanation.'),      (2, 3, 'Bookmarked.'),
  (3, 1, 'React is fun.'),           (3, 3, 'Same boat here.'),
  (4, 1, 'Joins are tricky.'),       (4, 3, 'LEFT JOIN saved me.'),
  (5, 1, 'Hi Yossi!'),               (5, 2, 'Hello!'),
  (6, 1, 'Agreed on soft delete.'),  (6, 2, 'Good call.');
