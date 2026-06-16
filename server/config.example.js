// Template for config.js — copy this to config.js and fill in the real password.
// config.js holds the real app_user credentials and is gitignored (never committed).
//
// The app connects as app_user, which has CRUD on users/todos/posts/comments and
// EXECUTE on the credential procedures only — no access to users_passwords.
module.exports = {
  db: {
    host: 'localhost',
    user: 'app_user',
    password: 'CHANGE_ME',
    database: 'project6',
  },
  jwt: {
    secret: 'CHANGE_ME',
    expiresIn: '7d',
  },
};
