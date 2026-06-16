-- ============================================================================
-- Project 6 — Stage A: privileges (the DB-level access restriction)
-- Run as root AFTER db/schema.sql (the procedures must already exist):
--   mysql -u root -p < db/grants.sql
--
-- app_user is the account the running app connects as. It gets CRUD on the four
-- resource tables but NO privileges of any kind on users_passwords. Credential
-- work is possible only via the SQL SECURITY DEFINER procedures it can EXECUTE.
-- ============================================================================

-- NOTE: change this password before using in any real environment.
CREATE USER IF NOT EXISTS 'app_user'@'localhost'
  IDENTIFIED BY 'aaaaa';

GRANT SELECT, INSERT, UPDATE, DELETE ON project6.users    TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON project6.todos    TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON project6.posts    TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON project6.comments TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON project6.albums   TO 'app_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON project6.photos   TO 'app_user'@'localhost';

-- Deliberately NO grant of any kind on project6.users_passwords.

GRANT EXECUTE ON PROCEDURE project6.sp_verify_login TO 'app_user'@'localhost';
GRANT EXECUTE ON PROCEDURE project6.sp_set_password TO 'app_user'@'localhost';

FLUSH PRIVILEGES;
