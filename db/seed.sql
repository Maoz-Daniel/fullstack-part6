-- ============================================================================
-- Project 6 — Stage A: seed data
-- Run as root AFTER db/schema.sql:  mysql -u root -p < db/seed.sql
--
-- 3 users (shlomo = admin) · 3 todos each · 2 posts each · 2 comments per post.
-- Stage F: 2 albums each · 7 photos per album.
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

-- ---------------------------------------------------------------------------
-- ALBUMS + PHOTOS (Stage F bonus). 2 albums per user; 7 photos per album so
-- pagination (default limit 6) shows a second page. Photos are private to the
-- album owner (photos.user_id = album owner).
-- ---------------------------------------------------------------------------
INSERT INTO albums (user_id, title) VALUES
  (1, 'Quiet Morning Walks'),  -- id 1 (shlomo)
  (1, 'Workshop Snapshots'),   -- id 2 (shlomo)
  (2, 'City Lights'),          -- id 3 (dana)
  (2, 'Coffee & Code'),        -- id 4 (dana)
  (3, 'Mountain Trails'),      -- id 5 (yossi)
  (3, 'Seed Data Gallery');    -- id 6 (yossi)

-- Photos use picsum.photos: /seed/<n>/600/600 (full) and /150/150 (thumbnail).
-- album_id, user_id (= album owner), title, url, thumbnail_url.
INSERT INTO photos (album_id, user_id, title, url, thumbnail_url) VALUES
  (1, 1, 'Dawn over the park',  'https://picsum.photos/seed/a1p1/600/600', 'https://picsum.photos/seed/a1p1/150/150'),
  (1, 1, 'Empty bench',         'https://picsum.photos/seed/a1p2/600/600', 'https://picsum.photos/seed/a1p2/150/150'),
  (1, 1, 'Frosty leaves',       'https://picsum.photos/seed/a1p3/600/600', 'https://picsum.photos/seed/a1p3/150/150'),
  (1, 1, 'River fog',           'https://picsum.photos/seed/a1p4/600/600', 'https://picsum.photos/seed/a1p4/150/150'),
  (1, 1, 'Stone path',          'https://picsum.photos/seed/a1p5/600/600', 'https://picsum.photos/seed/a1p5/150/150'),
  (1, 1, 'Morning birds',       'https://picsum.photos/seed/a1p6/600/600', 'https://picsum.photos/seed/a1p6/150/150'),
  (1, 1, 'First light',         'https://picsum.photos/seed/a1p7/600/600', 'https://picsum.photos/seed/a1p7/150/150'),
  (2, 1, 'Soldering iron',      'https://picsum.photos/seed/a2p1/600/600', 'https://picsum.photos/seed/a2p1/150/150'),
  (2, 1, 'Breadboard',          'https://picsum.photos/seed/a2p2/600/600', 'https://picsum.photos/seed/a2p2/150/150'),
  (2, 1, 'Wire spools',         'https://picsum.photos/seed/a2p3/600/600', 'https://picsum.photos/seed/a2p3/150/150'),
  (2, 1, 'Finished board',      'https://picsum.photos/seed/a2p4/600/600', 'https://picsum.photos/seed/a2p4/150/150'),
  (2, 1, 'Workbench mess',      'https://picsum.photos/seed/a2p5/600/600', 'https://picsum.photos/seed/a2p5/150/150'),
  (2, 1, 'Schematic sketch',    'https://picsum.photos/seed/a2p6/600/600', 'https://picsum.photos/seed/a2p6/150/150'),
  (2, 1, 'Tool drawer',         'https://picsum.photos/seed/a2p7/600/600', 'https://picsum.photos/seed/a2p7/150/150'),
  (3, 2, 'Neon alley',          'https://picsum.photos/seed/a3p1/600/600', 'https://picsum.photos/seed/a3p1/150/150'),
  (3, 2, 'Skyline dusk',        'https://picsum.photos/seed/a3p2/600/600', 'https://picsum.photos/seed/a3p2/150/150'),
  (3, 2, 'Crosswalk',           'https://picsum.photos/seed/a3p3/600/600', 'https://picsum.photos/seed/a3p3/150/150'),
  (3, 2, 'Rainy window',        'https://picsum.photos/seed/a3p4/600/600', 'https://picsum.photos/seed/a3p4/150/150'),
  (3, 2, 'Bus stop glow',       'https://picsum.photos/seed/a3p5/600/600', 'https://picsum.photos/seed/a3p5/150/150'),
  (3, 2, 'Bridge lights',       'https://picsum.photos/seed/a3p6/600/600', 'https://picsum.photos/seed/a3p6/150/150'),
  (3, 2, 'Late diner',          'https://picsum.photos/seed/a3p7/600/600', 'https://picsum.photos/seed/a3p7/150/150'),
  (4, 2, 'Espresso shot',       'https://picsum.photos/seed/a4p1/600/600', 'https://picsum.photos/seed/a4p1/150/150'),
  (4, 2, 'Laptop & mug',        'https://picsum.photos/seed/a4p2/600/600', 'https://picsum.photos/seed/a4p2/150/150'),
  (4, 2, 'Latte art',           'https://picsum.photos/seed/a4p3/600/600', 'https://picsum.photos/seed/a4p3/150/150'),
  (4, 2, 'Notebook page',       'https://picsum.photos/seed/a4p4/600/600', 'https://picsum.photos/seed/a4p4/150/150'),
  (4, 2, 'Beans close-up',      'https://picsum.photos/seed/a4p5/600/600', 'https://picsum.photos/seed/a4p5/150/150'),
  (4, 2, 'Window seat',         'https://picsum.photos/seed/a4p6/600/600', 'https://picsum.photos/seed/a4p6/150/150'),
  (4, 2, 'Refill time',         'https://picsum.photos/seed/a4p7/600/600', 'https://picsum.photos/seed/a4p7/150/150'),
  (5, 3, 'Summit view',         'https://picsum.photos/seed/a5p1/600/600', 'https://picsum.photos/seed/a5p1/150/150'),
  (5, 3, 'Pine ridge',          'https://picsum.photos/seed/a5p2/600/600', 'https://picsum.photos/seed/a5p2/150/150'),
  (5, 3, 'Switchback',          'https://picsum.photos/seed/a5p3/600/600', 'https://picsum.photos/seed/a5p3/150/150'),
  (5, 3, 'Trail marker',        'https://picsum.photos/seed/a5p4/600/600', 'https://picsum.photos/seed/a5p4/150/150'),
  (5, 3, 'Alpine lake',         'https://picsum.photos/seed/a5p5/600/600', 'https://picsum.photos/seed/a5p5/150/150'),
  (5, 3, 'Rocky pass',          'https://picsum.photos/seed/a5p6/600/600', 'https://picsum.photos/seed/a5p6/150/150'),
  (5, 3, 'Valley below',        'https://picsum.photos/seed/a5p7/600/600', 'https://picsum.photos/seed/a5p7/150/150'),
  (6, 3, 'Row of rows',         'https://picsum.photos/seed/a6p1/600/600', 'https://picsum.photos/seed/a6p1/150/150'),
  (6, 3, 'Primary key',         'https://picsum.photos/seed/a6p2/600/600', 'https://picsum.photos/seed/a6p2/150/150'),
  (6, 3, 'Foreign key',         'https://picsum.photos/seed/a6p3/600/600', 'https://picsum.photos/seed/a6p3/150/150'),
  (6, 3, 'Null island',         'https://picsum.photos/seed/a6p4/600/600', 'https://picsum.photos/seed/a6p4/150/150'),
  (6, 3, 'Index scan',          'https://picsum.photos/seed/a6p5/600/600', 'https://picsum.photos/seed/a6p5/150/150'),
  (6, 3, 'Join party',          'https://picsum.photos/seed/a6p6/600/600', 'https://picsum.photos/seed/a6p6/150/150'),
  (6, 3, 'Commit point',        'https://picsum.photos/seed/a6p7/600/600', 'https://picsum.photos/seed/a6p7/150/150');
