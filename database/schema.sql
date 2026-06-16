-- ============================================================================
-- Project 6 — Stage A: schema (tables + stored procedures)
-- Run as a privileged user (root):  mysql -u root -p < database/schema.sql
-- Then run database/grants.sql, then database/seed.sql.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS project6
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE project6;

-- Drop in child-first order so the script is re-runnable.
DROP PROCEDURE IF EXISTS sp_verify_login;
DROP PROCEDURE IF EXISTS sp_set_password;
DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS albums;
DROP TABLE IF EXISTS user_actions;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS users_passwords;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------------
-- USERS: personal info only, NO password here.
-- Lifecycle: active / blocked / deleted, tracked by two independent timestamps.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  username   VARCHAR(50)  NOT NULL UNIQUE,    -- used in URLs (/users/maoz/posts)
  email      VARCHAR(255) NOT NULL UNIQUE,
  phone      VARCHAR(30),
  website    VARCHAR(255),
  is_admin   TINYINT(1)   NOT NULL DEFAULT 0, -- 1 = admin account (privileged, used later)
  blocked_at DATETIME     NULL,               -- NULL = not blocked; timestamp = when blocked
  deleted_at DATETIME     NULL                -- NULL = active;      timestamp = when soft-deleted
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- CREDENTIALS: 1-to-1 with users, isolated table (restricted access via grants).
-- ---------------------------------------------------------------------------
CREATE TABLE users_passwords (
  user_id       INT       PRIMARY KEY,        -- same PK as users.id (1:1)
  password_hash CHAR(64)  NOT NULL,           -- SHA2(...,256) => 64 hex chars
  salt          CHAR(36)  NOT NULL,           -- per-user random salt
  CONSTRAINT fk_pw_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- TODOS: many per user.
-- ---------------------------------------------------------------------------
CREATE TABLE todos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  title      VARCHAR(255) NOT NULL,
  completed  TINYINT(1)   NOT NULL DEFAULT 0,
  deleted_at DATETIME     NULL,               -- NULL = active (soft delete)
  CONSTRAINT fk_todo_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- POSTS: many per user.
-- ---------------------------------------------------------------------------
CREATE TABLE posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  deleted_at DATETIME     NULL,               -- NULL = active (soft delete)
  CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- COMMENTS: many per post, owned by a user (enables ownership checks in Stage E).
-- ---------------------------------------------------------------------------
CREATE TABLE comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT          NOT NULL,
  user_id    INT          NOT NULL,           -- author; "only if owned" PUT/DELETE
  body       TEXT         NOT NULL,
  deleted_at DATETIME     NULL,               -- NULL = active (soft delete)
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id),
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- ALBUMS: many per user (Stage F bonus). PRIVATE to their owner - every read is
-- scoped to the authenticated user, so albums are never shared like posts.
-- ---------------------------------------------------------------------------
CREATE TABLE albums (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  title      VARCHAR(255) NOT NULL,
  deleted_at DATETIME     NULL,               -- NULL = active (soft delete)
  CONSTRAINT fk_album_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- PHOTOS: many per album, owned by a user (author = album owner). PRIVATE too.
-- Soft-deleting an album cascades to its photos in server code (see server/db/albums.js).
-- ---------------------------------------------------------------------------
CREATE TABLE photos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  album_id      INT          NOT NULL,
  user_id       INT          NOT NULL,        -- author; "only if owned" PUT/DELETE
  title         VARCHAR(255) NOT NULL,
  url           TEXT         NOT NULL,         -- full-size image URL
  thumbnail_url TEXT         NOT NULL,         -- thumbnail image URL
  deleted_at    DATETIME     NULL,             -- NULL = active (soft delete)
  CONSTRAINT fk_photo_album FOREIGN KEY (album_id) REFERENCES albums(id),
  CONSTRAINT fk_photo_user  FOREIGN KEY (user_id)  REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- USER ACTIONS: audit log for major account/admin/user activity.
-- Stores summaries only; never store passwords, hashes, salts, or full sensitive content.
-- ---------------------------------------------------------------------------
CREATE TABLE user_actions (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  actor_user_id  INT          NULL,
  target_user_id INT          NULL,
  action_type    VARCHAR(50)  NOT NULL,
  resource_type  VARCHAR(50)  NULL,
  resource_id    INT          NULL,
  details        VARCHAR(255) NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_action_actor  FOREIGN KEY (actor_user_id)  REFERENCES users(id),
  CONSTRAINT fk_action_target FOREIGN KEY (target_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Stored procedures for credential access (SQL SECURITY DEFINER).
-- The app connects as app_user, which has NO direct rights on users_passwords
-- and can only CALL these (see database/grants.sql).
--
-- TODO (deferred hardening): these rely on the implicit root definer. Later,
-- create a dedicated minimally-privileged definer (e.g. 'auth_definer'@'localhost')
-- holding only the rights needed on users_passwords, and add DEFINER=... here.
-- ---------------------------------------------------------------------------
DELIMITER //

-- Verify a login. Rejects users that are deleted OR blocked; never exposes the hash.
CREATE PROCEDURE sp_verify_login (IN p_username VARCHAR(50), IN p_password VARCHAR(255))
  SQL SECURITY DEFINER
BEGIN
  SELECT u.id, u.name, u.username, u.email, u.phone, u.website, u.is_admin
  FROM users u
  JOIN users_passwords p ON p.user_id = u.id
  WHERE u.username = p_username
    AND u.deleted_at IS NULL          -- not deleted
    AND u.blocked_at IS NULL          -- not blocked
    AND p.password_hash = SHA2(CONCAT(p.salt, p_password), 256);
END //

-- Set / change a password (generates a fresh per-user salt).
CREATE PROCEDURE sp_set_password (IN p_user_id INT, IN p_password VARCHAR(255))
  SQL SECURITY DEFINER
BEGIN
  DECLARE v_salt CHAR(36);
  SET v_salt = UUID();
  INSERT INTO users_passwords (user_id, password_hash, salt)
  VALUES (p_user_id, SHA2(CONCAT(v_salt, p_password), 256), v_salt)
  ON DUPLICATE KEY UPDATE
    password_hash = SHA2(CONCAT(v_salt, p_password), 256),
    salt = v_salt;
END //

DELIMITER ;
