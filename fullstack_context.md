# Fullstack Node.js — LLM Project Context Document

> **Purpose:** This is the primary reference file for any LLM model (Claude Code, Codex, etc.) working on this project. Read this file at the start of every session. It contains all tools, APIs, patterns, and conventions the model must know to contribute effectively.

---

## Table of Contents

1. [Node.js Core](#1-nodejs-core)
2. [Module System & npm](#2-module-system--npm)
3. [File System (fs)](#3-file-system-fs)
4. [HTTP Server](#4-http-server)
5. [REST API Design](#5-rest-api-design)
6. [Express Framework](#6-express-framework)
7. [SQL (MySQL)](#7-sql-mysql)
8. [Node.js + MySQL Integration](#8-nodejs--mysql-integration)
9. [MongoDB](#9-mongodb)
10. [Universal Rules & Best Practices](#10-universal-rules--best-practices)

---

## 1. Node.js Core

### What It Is
JavaScript runtime built on the **V8 engine**. Executes JS outside the browser. Ideal for I/O-heavy, real-time, data-intensive backends. **Not** suitable for CPU-intensive tasks (e.g., video encoding).

### Architecture
- **Single-threaded** with an **Event Queue** for async operations.
- **Non-blocking I/O:** Does not wait for DB/disk operations — processes other requests concurrently.
- No `window` or `document` globals; instead has `process`, `global`, and built-in OS/network APIs.

### Execution
```bash
node filename.js        # Run a script
node                    # Open interactive REPL
```

### Key Globals
| Object | Purpose |
|--------|---------|
| `global` | Top-level scope (equivalent to `window` in browsers) |
| `process` | Info/control over the running Node process |
| `process.env.NODE_ENV` | `'development'` or `'production'` |
| `process.argv` | CLI arguments array (custom args start at index `2`) |
| `process.memoryUsage()` | Current memory stats |

### Useful Built-ins
```js
const os   = require('os');
os.totalmem();  // Total system memory in bytes
os.freemem();   // Free system memory in bytes

const util = require('util');
util.promisify(fn);  // Convert callback-based fn to Promise
```

---

## 2. Module System & npm

### How Modules Work
Every file is a **module**. Node wraps each file in an IIFE that injects 5 parameters:
```
(exports, require, module, __filename, __dirname) => { /* your code */ }
```
- `__filename` — absolute path to current file
- `__dirname` — absolute path to current directory
- Variables defined in a file are **private** (not on `global`)

### Exporting & Importing
```js
// logger.js — export
module.exports = { log, error };   // or module.exports = function() {}

// app.js — import (always use const to prevent accidental overwrite)
const logger = require('./logger');
```

### npm Workflow
```bash
npm init -y                    # Create package.json (skip prompts)
npm i <package>                # Install local dependency
npm i <package> -D             # Dev-only dependency (devDependencies)
npm i <package> -g             # Global CLI tool
npm i                          # Install all deps from package.json
npm i --production             # Skip devDependencies
```

**Important:** Add `node_modules/` to `.gitignore`. Never commit it.

### Key Packages
| Package | Use |
|---------|-----|
| `express` | Web framework |
| `nodemon` | Auto-restart on file save (dev only, `-g` install) |
| `joi` | Schema-based input validation |
| `mysql` | MySQL database driver |
| `mongoose` | MongoDB ODM |
| `http-server` | Zero-config static file server |

### Built-in Core Modules
```js
const path   = require('path');
const fs     = require('fs');           // or require('fs/promises')
const os     = require('os');
const http   = require('http');
const util   = require('util');
```

### Path Utilities
```js
path.dirname(filePath)                         // Parent directory
path.basename(filePath)                        // Filename with ext
path.basename(filePath, path.extname(filePath))// Filename without ext
path.extname(filePath)                         // Extension (.js)
path.join('/dir', 'sub', 'file.txt')           // OS-safe path join
path.resolve('./relative')                     // → absolute path
path.normalize('/dir//sub/../file')            // Clean messy paths
```

---

## 3. File System (fs)

### API Flavors — Use Promises
```js
// ✅ Preferred: async/await
const fs = require('fs/promises');
await fs.readFile('file.txt', 'utf8');

// ⚠️ Legacy callback style (still used)
const fs = require('fs');
fs.readFile('file.txt', 'utf8', (err, data) => { });

// ❌ Never in production servers — blocks the thread
fs.readFileSync('file.txt', 'utf8');
```

### Common Operations
```js
// Read
const data = await fs.readFile('file.txt', 'utf8');  // Always specify encoding!

// Write (overwrites)
await fs.writeFile('file.txt', content, 'utf8');

// Append
await fs.appendFile('log.txt', newLine);
// Or via flag:
await fs.writeFile('log.txt', newLine, { flag: 'a' });

// Directory listing
const files = await fs.readdir('./');
const entries = await fs.readdir('./', { withFileTypes: true });
// entries[0].isFile() / entries[0].isDirectory()

// Stats (metadata)
const stats = await fs.stat('file.txt');
stats.isFile();        // boolean
stats.isDirectory();   // boolean
stats.isSymbolicLink();// boolean
stats.size;            // bytes

// Create directory
if (!fs.existsSync(dirPath)) await fs.mkdir(dirPath);

// Delete directory (recursive)
await fs.rm(dirPath, { recursive: true, force: true });  // Node 14.14+

// Move file (with cross-device fallback)
try {
  await fs.rename(src, dest);
} catch (err) {
  if (err.code === 'EXDEV') {  // Cross-device move
    await fs.copyFile(src, dest);
    await fs.unlink(src);
  }
}
```

### Streams (Large Files)
```js
const { pipeline } = require('stream/promises');

// Read large file in chunks (no RAM overload)
const readStream = fs.createReadStream('bigfile.dat');
for await (const chunk of readStream) { /* process chunk */ }

// Pipe network response to disk
await pipeline(response.body, fs.createWriteStream('output.dat'));
// If it fails: response.body?.cancel() to prevent memory leaks
```

### File Flags Reference
| Flag | Behavior |
|------|---------|
| `'r'` | Read (fails if not exists) |
| `'r+'` | Read + write (fails if not exists) |
| `'w'` | Write, truncate/create |
| `'w+'` | Read + write, truncate/create |
| `'a'` | Append, create if missing |
| `'a+'` | Read + append, create if missing |
| `'wx'` | Write, fail if already exists |

### File Descriptors (Low-Level)
```js
const fh = await fs.open('file.txt', 'r');
try {
  // use fh.read(), fh.write(), etc.
} finally {
  await fh.close();  // ALWAYS close in finally block
}
```

---

## 4. HTTP Server

### Creating a Raw Server
```js
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/api/courses') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify([1, 2, 3]));
  }
});

server.listen(3000, () => console.log('Listening on port 3000'));
```

### URL Parsing
```js
const { URL } = require('url');
const parsed = new URL('https://example.com/path?sort=name');
parsed.hostname;      // 'example.com'
parsed.pathname;      // '/path'
parsed.searchParams;  // URLSearchParams { 'sort' => 'name' }

const qs = require('querystring');
qs.parse('sort=name&page=2');  // { sort: 'name', page: '2' }
```

### HTTP Concepts
| Concept | Description |
|---------|------------|
| `req` | Incoming request: method, url, headers, body |
| `res` | Outgoing response: statusCode, headers, body |
| TCP | Reliable ordered delivery (standard HTTP) |
| UDP | Faster, tolerates packet loss (streaming media) |
| HTTPS | HTTP over TLS encryption |
| Status 200 | OK |
| Status 201 | Created |
| Status 204 | No Content |
| Status 400 | Bad Request |
| Status 404 | Not Found |
| Status 500 | Internal Server Error |

> **Use Express instead of raw `http` for anything beyond a simple demo.** Manual `if/else` routing is unmaintainable.

---

## 5. REST API Design

### Core Principles
- **Stateless:** Every request must include all context; server stores no session state.
- **Client-Server Separation:** Frontend and backend evolve independently.
- **Resources as Nouns:** URLs represent things, not actions.

### URL & Verb Conventions
```
GET    /api/customers          → List all
GET    /api/customers/:id      → Get one
POST   /api/customers          → Create new (body = JSON payload)
PUT    /api/customers/:id      → Full update (body = full object)
DELETE /api/customers/:id      → Delete
```

Nested resources: `/api/customers/123/orders`

### Response Rules
- `GET` success → `200 OK` + data
- `POST` success → `201 Created` + newly created object (with its new `id`)
- `PUT` success → `200 OK` + updated object
- `DELETE` success → `200 OK` + deleted object
- Resource not found → `404 Not Found`
- Invalid input → `400 Bad Request` + error message
- Use `Content-Type: application/json` for JSON responses

---

## 6. Express Framework

### Setup
```bash
npm init -y
npm i express
npm i -g nodemon   # dev tool: auto-restart on save
```

```js
// index.js
const express = require('express');
const app = express();

app.use(express.json());  // ← REQUIRED to parse JSON request bodies

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
```

Start dev server: `nodemon index.js`

### Environment Variables
```js
// Read host-assigned port, fallback to 3000 locally
const port = process.env.PORT || 3000;

// Set on Mac/Linux:  export PORT=5000
// Set on Windows:    set PORT=5000
```

### Routing
```js
// Route parameters (:id) — required, embedded in path
app.get('/api/courses/:id', (req, res) => {
  const id = parseInt(req.params.id);  // req.params is always a string!
});

// Query parameters — optional, after ?
// GET /api/posts?sortBy=name
app.get('/api/posts', (req, res) => {
  const sortBy = req.query.sortBy;
});
```

### Full CRUD Example Pattern
```js
const courses = [
  { id: 1, name: 'Course A' },
  { id: 2, name: 'Course B' },
];

// GET all
app.get('/api/courses', (req, res) => {
  res.send(courses);
});

// GET one
app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).send('Course not found');
  res.send(course);
});

// POST — create
app.post('/api/courses', (req, res) => {
  const { error } = validateCourse(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const course = { id: courses.length + 1, name: req.body.name };
  courses.push(course);
  res.send(course);  // Return created object (client needs the new ID)
});

// PUT — update
app.put('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).send('Course not found');

  const { error } = validateCourse(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  course.name = req.body.name;
  res.send(course);
});

// DELETE
app.delete('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (!course) return res.status(404).send('Course not found');

  const index = courses.indexOf(course);
  courses.splice(index, 1);
  res.send(course);  // Return deleted object
});
```

> **Critical:** `res.send()` / `res.status()` does **not** stop function execution. Always `return` early when sending error responses, or the function will continue running and crash.

### Input Validation with Joi
```js
const Joi = require('joi');

function validateCourse(course) {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
  });
  return schema.validate(course);
}

// Usage in a route:
const { error } = validateCourse(req.body);
if (error) return res.status(400).send(error.details[0].message);
```

**Golden Rule: Never trust client input. Always validate before processing.**

### Middleware
```js
app.use(express.json());          // Parse JSON bodies
app.use(express.urlencoded());    // Parse form data
app.use(express.static('public'));// Serve static files
app.use(myCustomMiddleware);      // Custom function(req, res, next) {}
```

---

## 7. SQL (MySQL)

### DDL — Structure
```sql
CREATE TABLE customers (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(255) NOT NULL,
  email   VARCHAR(255) UNIQUE,
  status  VARCHAR(50)  DEFAULT 'active'
);

ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
DROP TABLE IF EXISTS customers;
```

### DML — Data
```sql
-- Create
INSERT INTO customers (name, email) VALUES ('Alice', 'alice@example.com');
INSERT INTO customers (name, email) VALUES ('Bob', 'bob@example.com'), ('Carol', 'carol@example.com');

-- Read
SELECT * FROM customers;
SELECT name, email AS contact FROM customers WHERE status = 'active';
SELECT DISTINCT status FROM customers;

-- Update
UPDATE customers SET status = 'inactive' WHERE id = 3;

-- Delete  ⚠️ ALWAYS include WHERE or you delete everything
DELETE FROM customers WHERE id = 3;
```

### Filtering & Sorting
```sql
WHERE age BETWEEN 20 AND 30
WHERE name LIKE 'A%'     -- starts with A
WHERE name LIKE '_ob'    -- exactly 3 chars, ends in 'ob'
WHERE phone IS NULL
WHERE phone IS NOT NULL
ORDER BY name ASC        -- or DESC
LIMIT 10
LIMIT 10 OFFSET 20       -- pagination: skip 20, take 10
```

### Aggregation
```sql
SELECT COUNT(*), COUNT(email), SUM(price), AVG(price), MIN(price), MAX(price)
FROM orders;

SELECT category, COUNT(*) AS total
FROM products
GROUP BY category
HAVING COUNT(*) > 5;    -- filter AFTER grouping (WHERE filters BEFORE)

-- Pipeline: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
```

### Joins
```sql
-- INNER JOIN: only rows with match in both tables
SELECT customers.name, orders.amount
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id;

-- LEFT JOIN: all customers, even without orders (NULL for missing)
SELECT customers.name, orders.amount
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;

-- CROSS JOIN: every row × every row (Cartesian product)
SELECT * FROM colors CROSS JOIN sizes;
```

### CTEs
```sql
WITH recent_orders AS (
  SELECT * FROM orders WHERE date > '2024-01-01'
)
SELECT customer_id, COUNT(*) FROM recent_orders GROUP BY customer_id;
```

---

## 8. Node.js + MySQL Integration

### Setup
```bash
npm i mysql
```

### Connection
```js
const mysql = require('mysql');

const con = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: 'secret',
  database: 'mydb',        // optional — can be set later via query
});

con.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});
```

### Executing Queries
```js
// Basic query
con.query('SELECT * FROM customers', (err, result, fields) => {
  if (err) throw err;
  console.log(result);          // Array of row objects
  console.log(result[2].name);  // Access specific row/column
  console.log(fields);          // Column metadata
});

// With callback shape: always (err, result)
```

### CRUD via Driver
```js
// INSERT single
con.query("INSERT INTO customers (name) VALUES ('Alice')", (err, result) => {
  console.log(result.insertId);       // Auto-generated PK
  console.log(result.affectedRows);   // Should be 1
});

// Bulk INSERT with placeholders (safe against injection)
const values = [['Alice', 'Oslo'], ['Bob', 'London']];
con.query('INSERT INTO customers (name, address) VALUES ?', [values], cb);

// SELECT with filter
con.query("SELECT * FROM customers WHERE address LIKE 'S%'", cb);

// UPDATE
con.query("UPDATE customers SET address = 'Oslo' WHERE name = 'Alice'", cb);

// DELETE  ⚠️ check result.affectedRows afterward
con.query("DELETE FROM customers WHERE name = 'Alice'", cb);

// ORDER BY / LIMIT / OFFSET
con.query('SELECT * FROM customers ORDER BY name LIMIT 5 OFFSET 10', cb);
```

### SQL Injection Prevention
```js
// ✅ Method 1: mysql.escape()
const safeVal = mysql.escape(userInput);
con.query(`SELECT * FROM users WHERE name = ${safeVal}`, cb);

// ✅ Method 2: Placeholder ? (preferred)
con.query('SELECT * FROM users WHERE name = ? AND city = ?', [name, city], cb);

// ❌ Never concatenate raw user input into SQL strings
con.query(`SELECT * FROM users WHERE name = '${userInput}'`, cb);  // DANGER
```

### JOIN via Driver
```js
const sql = `
  SELECT users.name, products.name AS fav
  FROM users
  LEFT JOIN products ON users.favProduct = products.id
`;
con.query(sql, (err, result) => {
  console.log(result);
});
```

---

## 9. MongoDB

### Core Concepts
| MongoDB | SQL Equivalent |
|---------|---------------|
| Database | Database |
| Collection | Table |
| Document (JSON/BSON) | Row |
| Field | Column |
| `_id` (ObjectId) | Primary Key |

**Schema-less:** Documents in the same collection can have different fields. Nested objects and arrays are first-class.

### Shell Commands (mongosh)
```js
show dbs
use mydb                            // switch (or create) database
db.dropDatabase()

show collections
db.createCollection('posts')

// Insert
db.posts.insertOne({ title: 'Hello', views: 0 })
db.posts.insertMany([{ title: 'A' }, { title: 'B' }])

// Find
db.posts.find()
db.posts.find({ name: 'Kyle' })                         // filter
db.posts.find({ name: 'Kyle' }, { age: 1, _id: 0 })    // projection
db.posts.find().sort({ name: 1 })                       // 1=ASC, -1=DESC
db.posts.find().limit(5).skip(10)                       // pagination

// Update — MUST use atomic operators ($set, $inc, etc.)
db.posts.updateOne({ title: 'Hello' }, { $set: { views: 10 } })
db.posts.updateMany({}, { $inc: { views: 1 } })

// Delete
db.posts.deleteOne({ name: 'John' })
db.posts.deleteMany({ age: { $exists: false } })
```

### Query Operators
```js
// Comparison
{ age: { $eq: 25 } }   // equal
{ age: { $ne: 25 } }   // not equal
{ age: { $gt: 18 } }   // greater than
{ age: { $lte: 65 } }  // less than or equal
{ status: { $in: ['active', 'pending'] } }

// Field existence
{ phone: { $exists: true } }

// Logical
{ $and: [{ age: { $gt: 18 } }, { age: { $lt: 65 } }] }
{ $or:  [{ city: 'Oslo' }, { city: 'London' }] }
{ age: { $not: { $gt: 30 } } }

// Array
{ tags: { $elemMatch: { $eq: 'node' } } }
```

### Update Operators
```js
{ $set:    { name: 'Bob' } }      // Set field value
{ $unset:  { phone: '' } }        // Remove field
{ $inc:    { views: 2 } }         // Increment number
{ $rename: { oldKey: 'newKey' } } // Rename field
{ $push:   { tags: 'mongodb' } }  // Add to array
{ $pull:   { tags: 'sql' } }      // Remove from array
```

### Text Search
```js
// Create index first
db.posts.createIndex({ title: 'text' })

// Then search
db.posts.find({ $text: { $search: 'mongodb tutorial' } })
```

### MongoDB Atlas (Cloud)
1. Create cluster (M0 = free tier)
2. Create a database user with password
3. Whitelist IP (`0.0.0.0/0` for dev)
4. Copy connection string → use in `mongoose.connect()` or `MongoClient`

---

## 10. Universal Rules & Best Practices

### Node.js
- **Always use async/await** over callbacks or `.then()` chains for readability.
- **Never use `*Sync` methods** (e.g., `readFileSync`) in production server code — they block the single thread.
- **Always specify encoding** (`'utf8'`) when reading text files or you get a raw `Buffer`.
- **Close file handles** in `finally` blocks to prevent resource leaks.
- **Use `const`** for imports and values that won't be reassigned. Use `let` only when reassignment is needed.

### Express
- **Always `return`** before error responses: `return res.status(404).send(...)` — otherwise execution continues.
- **Always add `app.use(express.json())`** near the top, or `req.body` will be `undefined`.
- **Validate all input** with Joi (or similar) before processing. Never trust `req.body`.
- **Use `process.env.PORT`** for the port; never hardcode for production.
- **Use `nodemon`** during development to avoid manual restarts.

### SQL / MySQL
- **Always include `WHERE`** on `UPDATE` and `DELETE`, or you affect every row.
- **Use `?` placeholders** (not string concatenation) to prevent SQL injection.
- **Check `result.affectedRows`** after mutations to confirm changes.
- **Use pagination** (`LIMIT` / `OFFSET`) — never load an entire large table into memory.
- **`WHERE` filters rows before grouping; `HAVING` filters groups after `GROUP BY`.**

### MongoDB
- **Always use atomic operators** (`$set`, `$push`, etc.) when updating — passing a plain object overwrites the entire document.
- **Use indexes** for any field queried frequently (including text indexes for search).
- **Use `.skip()` + `.limit()`** for pagination.

### General
- **DRY:** Extract repeated logic into functions (e.g., `validateCourse`).
- **HTTP status codes matter:** `200` OK, `201` Created, `400` Bad Request, `404` Not Found, `500` Server Error.
- **REST resource URLs use plural nouns:** `/api/courses`, not `/api/course`.
- **Return the affected object** from POST (created) and DELETE (removed) endpoints.
- **Destructure for cleaner code:** `const { error } = validate(req.body)` instead of `const result = validate(...); result.error`.
