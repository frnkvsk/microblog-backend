/** MicroBlog express app. */

const express = require("express");
const morgan = require("morgan");
const postsRoutes = require("./routes/posts");
const postCommentsRoutes = require("./routes/postComments");
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const cors = require("cors");

const app = express();

app.use(morgan("tiny"));
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if(req.method === 'OPTION') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});

app.use("/api/posts/comments", postCommentsRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/", authRoutes);


/** 404 Not Found handler. */

app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

/** Generic error handler. */

app.use(function (err, req, res, next) {
  if (err.stack) console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message,
  });
});


module.exports = app;
