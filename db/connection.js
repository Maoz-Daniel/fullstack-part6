// Single MySQL connection as app_user, wrapped with util.promisify so routes can use
// async/await with ? placeholders.
//
// DEVIATION from fullstack_context.md: we use the `mysql2` driver instead of `mysql`.
// The server is MySQL 9.7, which removed mysql_native_password (MySQL 9.0+); the legacy
// `mysql` driver can't do caching_sha2_password, so it cannot authenticate at all.
// `mysql2` is a drop-in: the callback API used here is identical.
const mysql = require('mysql2');
const util = require('util');
const { db } = require('../config');

const con = mysql.createConnection(db);

con.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL as app_user');
});

// query('SELECT ... WHERE x = ?', [val]) -> resolves to the rows array.
// For CALL sp_x(?, ?), the result is nested: result[0] holds the proc's SELECT rows.
const query = util.promisify(con.query).bind(con);

module.exports = { con, query };
