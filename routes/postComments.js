/** Routes for post comment. */

const db = require("../db");
const express = require("express");
const router = express.Router({ mergeParams: true });
const { ensureCorrectUser, authRequired } = require("../middleware/auth");

/** GET /        get comments for post
 *
 * => { id, text }
 *
 */

router.get("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT id, text 
       FROM comments 
       WHERE post_id = $1 
       ORDER BY id`,
      [req.params.id]);
    return res.json(result.rows);
  } catch (err) {
    return next(err);
  }
});


/** POST /      add a comment
 *
 * => { id, text }
 *
 */

router.post("/:id", authRequired, async function (req, res, next) {
  try {
    const result = await db.query(
      `INSERT INTO comments (text, post_id) 
       VALUES ($1, $2) 
       RETURNING id, text`,
       [req.body.text, req.params.id]);
    const comment_id = result.rows[0].id;
    await db.query(`INSERT INTO comment_user (comment_id, username) 
                    VALUES ($1, $2)`,
                    [comment_id, req.username]);
      
    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});


/** PUT /[id]      update comment
 *
 * => { id, text }
 *
 */

router.put("/:id", ensureCorrectUser, async function (req, res, next) {
  try {
    const result = await db.query(
      `UPDATE comments 
       SET text=$1 
       WHERE id = $2 
       RETURNING id, text`,
      [req.body.text, req.params.id]);
    return res.json(result.rows[0]);
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[id]      delete comment
 *
 * => { message: "deleted" }
 *
 */

router.delete("/:id", ensureCorrectUser, async function (req, res, next) {
  try {

    const del = await db.query(`DELETE FROM comment_user 
                    WHERE comment_id=$1 
                    AND username=$2
                    RETURNING *`,
                    [req.params.id, req.username]);
    if(+del.rows[0].comment_id != +req.params.id) 
      throw new Error();            
    await db.query(`DELETE FROM comments 
                    WHERE id=$1`, 
                    [req.params.id]);
    return res.json({ message: "deleted" });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
