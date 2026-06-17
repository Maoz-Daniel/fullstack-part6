
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
