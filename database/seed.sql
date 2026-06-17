-- ============================================================================
-- 4 users (admin is separate). Maoz/Dana/Yossi have todos/posts/comments seed data.
-- in each original album; other users have 7 photos per album.
-- All rows start active (deleted_at / blocked_at default NULL).
-- Passwords are set via the definer procedure, never a raw INSERT.
-- ============================================================================

USE project6;

INSERT INTO users (name, username, email, phone, website, is_admin) VALUES
  ('Maoz Cohen',   'maoz',   'maoz@example.com',   '050-1111111', 'maoz.dev',   0),
  ('Dana Levi',    'dana',   'dana@example.com',   '052-2222222', 'dana.io',    0),
  ('Yossi Mizrahi','yossi',  'yossi@example.com',  '054-3333333', 'yossi.net',  0),
  ('System Admin', 'admin',  'admin@example.com',  '050-0000000', 'admin.local', 1);


CALL sp_set_password(1, 'maoz123');
CALL sp_set_password(2, 'dana123');
CALL sp_set_password(3, 'yossi123');
CALL sp_set_password(4, 'admin123');

INSERT INTO todos (user_id, title, completed) VALUES
  (1, 'Finish Stage A schema', 1), (1, 'Review REST routes', 0), (1, 'Prep demo', 0),
  (2, 'Design login page',     1), (2, 'Wire up todos view', 0), (2, 'Test PUT todo', 0),
  (3, 'Set up MySQL locally',  1), (3, 'Seed sample data',   1), (3, 'Read FK docs', 0);

INSERT INTO posts (user_id, title, body) VALUES
  (1, 'My first post',      'Hello from Maoz.'),                             -- id 1
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


INSERT INTO albums (user_id, title) VALUES
  (1, 'Quiet Morning Walks'),  -- id 1 (maoz)
  (1, 'Workshop Snapshots'),   -- id 2 (maoz)
  (2, 'City Lights'),          -- id 3 (dana)
  (2, 'Coffee & Code'),        -- id 4 (dana)
  (3, 'Mountain Trails'),      -- id 5 (yossi)
  (3, 'Seed Data Gallery'),    -- id 6 (yossi)
  (1, 'Family Archive'),       -- id 7 (maoz)
  (1, 'Campus Notes'),         -- id 8 (maoz)
  (1, 'Weekend Projects'),     -- id 9 (maoz)
  (1, 'Reference Shots');      -- id 10 (maoz)

-- Photos use picsum.photos: /seed/<n>/600/600 (full) and /150/150 (thumbnail).
-- album_id, title, url, thumbnail_url (owner is derived from the album).
INSERT INTO photos (album_id, title, url, thumbnail_url) VALUES
  (1, 'Dawn over the park',  'https://picsum.photos/seed/a1p1/600/600', 'https://picsum.photos/seed/a1p1/150/150'),
  (1, 'Empty bench',         'https://picsum.photos/seed/a1p2/600/600', 'https://picsum.photos/seed/a1p2/150/150'),
  (1, 'Frosty leaves',       'https://picsum.photos/seed/a1p3/600/600', 'https://picsum.photos/seed/a1p3/150/150'),
  (1, 'River fog',           'https://picsum.photos/seed/a1p4/600/600', 'https://picsum.photos/seed/a1p4/150/150'),
  (1, 'Stone path',          'https://picsum.photos/seed/a1p5/600/600', 'https://picsum.photos/seed/a1p5/150/150'),
  (1, 'Morning birds',       'https://picsum.photos/seed/a1p6/600/600', 'https://picsum.photos/seed/a1p6/150/150'),
  (1, 'First light',         'https://picsum.photos/seed/a1p7/600/600', 'https://picsum.photos/seed/a1p7/150/150'),
  (2, 'Soldering iron',      'https://picsum.photos/seed/a2p1/600/600', 'https://picsum.photos/seed/a2p1/150/150'),
  (2, 'Breadboard',          'https://picsum.photos/seed/a2p2/600/600', 'https://picsum.photos/seed/a2p2/150/150'),
  (2, 'Wire spools',         'https://picsum.photos/seed/a2p3/600/600', 'https://picsum.photos/seed/a2p3/150/150'),
  (2, 'Finished board',      'https://picsum.photos/seed/a2p4/600/600', 'https://picsum.photos/seed/a2p4/150/150'),
  (2, 'Workbench mess',      'https://picsum.photos/seed/a2p5/600/600', 'https://picsum.photos/seed/a2p5/150/150'),
  (2, 'Schematic sketch',    'https://picsum.photos/seed/a2p6/600/600', 'https://picsum.photos/seed/a2p6/150/150'),
  (2, 'Tool drawer',         'https://picsum.photos/seed/a2p7/600/600', 'https://picsum.photos/seed/a2p7/150/150'),
  (1, 'Copper sunrise',       'https://picsum.photos/seed/a1p8/600/600', 'https://picsum.photos/seed/a1p8/150/150'),
  (1, 'Wet pavement',         'https://picsum.photos/seed/a1p9/600/600', 'https://picsum.photos/seed/a1p9/150/150'),
  (1, 'Garden gate',          'https://picsum.photos/seed/a1p10/600/600', 'https://picsum.photos/seed/a1p10/150/150'),
  (1, 'Quiet corner',         'https://picsum.photos/seed/a1p11/600/600', 'https://picsum.photos/seed/a1p11/150/150'),
  (1, 'Misty bridge',         'https://picsum.photos/seed/a1p12/600/600', 'https://picsum.photos/seed/a1p12/150/150'),
  (1, 'Sunlit trail',         'https://picsum.photos/seed/a1p13/600/600', 'https://picsum.photos/seed/a1p13/150/150'),
  (1, 'Wooden fence',         'https://picsum.photos/seed/a1p14/600/600', 'https://picsum.photos/seed/a1p14/150/150'),
  (1, 'Blue hour path',       'https://picsum.photos/seed/a1p15/600/600', 'https://picsum.photos/seed/a1p15/150/150'),
  (1, 'Soft rain',            'https://picsum.photos/seed/a1p16/600/600', 'https://picsum.photos/seed/a1p16/150/150'),
  (1, 'Small pond',           'https://picsum.photos/seed/a1p17/600/600', 'https://picsum.photos/seed/a1p17/150/150'),
  (1, 'Leaf shadows',         'https://picsum.photos/seed/a1p18/600/600', 'https://picsum.photos/seed/a1p18/150/150'),
  (1, 'Park lantern',         'https://picsum.photos/seed/a1p19/600/600', 'https://picsum.photos/seed/a1p19/150/150'),
  (1, 'Gravel bend',          'https://picsum.photos/seed/a1p20/600/600', 'https://picsum.photos/seed/a1p20/150/150'),
  (1, 'Morning steps',        'https://picsum.photos/seed/a1p21/600/600', 'https://picsum.photos/seed/a1p21/150/150'),
  (1, 'Fern wall',            'https://picsum.photos/seed/a1p22/600/600', 'https://picsum.photos/seed/a1p22/150/150'),
  (1, 'Red leaves',           'https://picsum.photos/seed/a1p23/600/600', 'https://picsum.photos/seed/a1p23/150/150'),
  (1, 'Long shadows',         'https://picsum.photos/seed/a1p24/600/600', 'https://picsum.photos/seed/a1p24/150/150'),
  (1, 'Water rail',           'https://picsum.photos/seed/a1p25/600/600', 'https://picsum.photos/seed/a1p25/150/150'),
  (1, 'Cloud break',          'https://picsum.photos/seed/a1p26/600/600', 'https://picsum.photos/seed/a1p26/150/150'),
  (1, 'Stone arch',           'https://picsum.photos/seed/a1p27/600/600', 'https://picsum.photos/seed/a1p27/150/150'),
  (1, 'Last morning lap',     'https://picsum.photos/seed/a1p28/600/600', 'https://picsum.photos/seed/a1p28/150/150'),
  (2, 'Oscilloscope trace',   'https://picsum.photos/seed/a2p8/600/600', 'https://picsum.photos/seed/a2p8/150/150'),
  (2, 'Component bins',       'https://picsum.photos/seed/a2p9/600/600', 'https://picsum.photos/seed/a2p9/150/150'),
  (2, 'Printed labels',       'https://picsum.photos/seed/a2p10/600/600', 'https://picsum.photos/seed/a2p10/150/150'),
  (2, 'Desk lamp',            'https://picsum.photos/seed/a2p11/600/600', 'https://picsum.photos/seed/a2p11/150/150'),
  (2, 'Cable tester',         'https://picsum.photos/seed/a2p12/600/600', 'https://picsum.photos/seed/a2p12/150/150'),
  (2, 'Power supply',         'https://picsum.photos/seed/a2p13/600/600', 'https://picsum.photos/seed/a2p13/150/150'),
  (2, 'Serial monitor',       'https://picsum.photos/seed/a2p14/600/600', 'https://picsum.photos/seed/a2p14/150/150'),
  (2, 'Debug notes',          'https://picsum.photos/seed/a2p15/600/600', 'https://picsum.photos/seed/a2p15/150/150'),
  (2, 'Spare sensors',        'https://picsum.photos/seed/a2p16/600/600', 'https://picsum.photos/seed/a2p16/150/150'),
  (2, 'Jumper rainbow',       'https://picsum.photos/seed/a2p17/600/600', 'https://picsum.photos/seed/a2p17/150/150'),
  (2, 'Heat shrink',          'https://picsum.photos/seed/a2p18/600/600', 'https://picsum.photos/seed/a2p18/150/150'),
  (2, 'Open enclosure',       'https://picsum.photos/seed/a2p19/600/600', 'https://picsum.photos/seed/a2p19/150/150'),
  (2, 'Prototype stack',      'https://picsum.photos/seed/a2p20/600/600', 'https://picsum.photos/seed/a2p20/150/150'),
  (2, 'Tiny screws',          'https://picsum.photos/seed/a2p21/600/600', 'https://picsum.photos/seed/a2p21/150/150'),
  (2, 'Label maker',          'https://picsum.photos/seed/a2p22/600/600', 'https://picsum.photos/seed/a2p22/150/150'),
  (2, 'Sensor board',         'https://picsum.photos/seed/a2p23/600/600', 'https://picsum.photos/seed/a2p23/150/150'),
  (2, 'Bench notebook',       'https://picsum.photos/seed/a2p24/600/600', 'https://picsum.photos/seed/a2p24/150/150'),
  (2, 'Firmware checklist',   'https://picsum.photos/seed/a2p25/600/600', 'https://picsum.photos/seed/a2p25/150/150'),
  (2, 'Power leads',          'https://picsum.photos/seed/a2p26/600/600', 'https://picsum.photos/seed/a2p26/150/150'),
  (2, 'Final inspection',     'https://picsum.photos/seed/a2p27/600/600', 'https://picsum.photos/seed/a2p27/150/150'),
  (2, 'Packed prototype',     'https://picsum.photos/seed/a2p28/600/600', 'https://picsum.photos/seed/a2p28/150/150'),
  (3, 'Neon alley',          'https://picsum.photos/seed/a3p1/600/600', 'https://picsum.photos/seed/a3p1/150/150'),
  (3, 'Skyline dusk',        'https://picsum.photos/seed/a3p2/600/600', 'https://picsum.photos/seed/a3p2/150/150'),
  (3, 'Crosswalk',           'https://picsum.photos/seed/a3p3/600/600', 'https://picsum.photos/seed/a3p3/150/150'),
  (3, 'Rainy window',        'https://picsum.photos/seed/a3p4/600/600', 'https://picsum.photos/seed/a3p4/150/150'),
  (3, 'Bus stop glow',       'https://picsum.photos/seed/a3p5/600/600', 'https://picsum.photos/seed/a3p5/150/150'),
  (3, 'Bridge lights',       'https://picsum.photos/seed/a3p6/600/600', 'https://picsum.photos/seed/a3p6/150/150'),
  (3, 'Late diner',          'https://picsum.photos/seed/a3p7/600/600', 'https://picsum.photos/seed/a3p7/150/150'),
  (4, 'Espresso shot',       'https://picsum.photos/seed/a4p1/600/600', 'https://picsum.photos/seed/a4p1/150/150'),
  (4, 'Laptop & mug',        'https://picsum.photos/seed/a4p2/600/600', 'https://picsum.photos/seed/a4p2/150/150'),
  (4, 'Latte art',           'https://picsum.photos/seed/a4p3/600/600', 'https://picsum.photos/seed/a4p3/150/150'),
  (4, 'Notebook page',       'https://picsum.photos/seed/a4p4/600/600', 'https://picsum.photos/seed/a4p4/150/150'),
  (4, 'Beans close-up',      'https://picsum.photos/seed/a4p5/600/600', 'https://picsum.photos/seed/a4p5/150/150'),
  (4, 'Window seat',         'https://picsum.photos/seed/a4p6/600/600', 'https://picsum.photos/seed/a4p6/150/150'),
  (4, 'Refill time',         'https://picsum.photos/seed/a4p7/600/600', 'https://picsum.photos/seed/a4p7/150/150'),
  (5, 'Summit view',         'https://picsum.photos/seed/a5p1/600/600', 'https://picsum.photos/seed/a5p1/150/150'),
  (5, 'Pine ridge',          'https://picsum.photos/seed/a5p2/600/600', 'https://picsum.photos/seed/a5p2/150/150'),
  (5, 'Switchback',          'https://picsum.photos/seed/a5p3/600/600', 'https://picsum.photos/seed/a5p3/150/150'),
  (5, 'Trail marker',        'https://picsum.photos/seed/a5p4/600/600', 'https://picsum.photos/seed/a5p4/150/150'),
  (5, 'Alpine lake',         'https://picsum.photos/seed/a5p5/600/600', 'https://picsum.photos/seed/a5p5/150/150'),
  (5, 'Rocky pass',          'https://picsum.photos/seed/a5p6/600/600', 'https://picsum.photos/seed/a5p6/150/150'),
  (5, 'Valley below',        'https://picsum.photos/seed/a5p7/600/600', 'https://picsum.photos/seed/a5p7/150/150'),
  (6, 'Row of rows',         'https://picsum.photos/seed/a6p1/600/600', 'https://picsum.photos/seed/a6p1/150/150'),
  (6, 'Primary key',         'https://picsum.photos/seed/a6p2/600/600', 'https://picsum.photos/seed/a6p2/150/150'),
  (6, 'Foreign key',         'https://picsum.photos/seed/a6p3/600/600', 'https://picsum.photos/seed/a6p3/150/150'),
  (6, 'Null island',         'https://picsum.photos/seed/a6p4/600/600', 'https://picsum.photos/seed/a6p4/150/150'),
  (6, 'Index scan',          'https://picsum.photos/seed/a6p5/600/600', 'https://picsum.photos/seed/a6p5/150/150'),
  (6, 'Join party',          'https://picsum.photos/seed/a6p6/600/600', 'https://picsum.photos/seed/a6p6/150/150'),
  (6, 'Commit point',        'https://picsum.photos/seed/a6p7/600/600', 'https://picsum.photos/seed/a6p7/150/150');
