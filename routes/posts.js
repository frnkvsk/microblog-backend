/** API routes for posts. */

const db = require("../db");
const express = require("express");
const router = new express.Router();
const { ensureCorrectUser, authRequired } = require("../middleware/auth");

/** GET /   get overview of posts
 *
 * Returns:
 *
 * => [ { id,
 *        title,
 *        description,
 *        votes,
 *      },
 *      ...
 *    ]
 *
 */

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT p.id,
              p.title,
              p.description,
              COALESCE(SUM(v.direction),0) votes
       FROM posts p
       LEFT JOIN votes v ON p.id = v.post_id
       GROUP BY p.id
       ORDER BY p.id;
      `
    );
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  get detail on post w/comments
 *
 * Returns:
 *
 * =>   { id,
 *        title,
 *        description,
 *        body,
 *        username,
 *        comments: [ { id, text }, ... ],
 *      }
 */

router.get("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT p.id,
              p.title,
              p.description,
              p.body,
              p.username,               
              CASE WHEN COUNT(c.id) = 0 THEN JSON '[]' ELSE JSON_AGG(
                    JSON_BUILD_OBJECT('id', c.id, 'text', c.text)
                ) END AS comments
        FROM posts p 
        LEFT JOIN comments c ON c.post_id = $1
      WHERE p.id = $1   
      GROUP BY p.id    
      ORDER BY p.id
      `, [req.params.id]
    );
    const votes = await db.query(
      `SELECT COALESCE(SUM(v.direction),0) votes
      FROM votes v
      WHERE post_id = $1`,
      [req.params.id]
    );
    result.rows[0].votes = votes;
    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});


/** POST /[id]/vote/(up|down)    Update up/down as post
 *
 * => {  }
 *
 */

router.post("/:id/vote/:direction", authRequired, async function (req, res, next) {
  try {
    const delta = req.params.direction === "up" ? +1 : -1;
    const username= req.username;
    const result = await db.query(
      `INSERT INTO votes (post_id, username, direction) 
        VALUES ($1, $2, $3)
        ON CONFLICT (post_id, username) DO UPDATE
        SET direction = $3`,
      [req.params.id, username, delta]);
    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});


/** POST /     add a new post
 *
 * { title, body, description, username }  =>  { id, title, body, description, username }
 *
 */

router.post("/", authRequired, async function (req, res, next) {
  try {
    const {title, body, description} = req.body;
    const username = req.username;
    const result = await db.query(
      `INSERT INTO posts (title, description, body, username) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, title, description, body, username`,
      [title, description, body, username]);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});


/** PUT /[id]     update existing post
 *
 * { title, description, body }  =>  { id, title, description, body, username }
 *
 */

router.put("/:id", ensureCorrectUser, async function (req, res, next) {
  try {
    const {title, body, description} = req.body;
    const result = await db.query(
      `UPDATE posts SET title=$1, description=$2, body=$3
        WHERE id = $4 
        RETURNING id, title, description, body, username`,
      [title, description, body, req.params.id]);
    return res.json(result.rows[0]);
  } catch (e) {
    return next(e);
  }
});


/** DELETE /[id]     delete post
 *
 * => { message: "deleted" }
 *
 */

router.delete("/:id", ensureCorrectUser, async (req, res, next) => {
  try {
    await db.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
    return res.json({ message: "deleted" });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
