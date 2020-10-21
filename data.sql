DROP DATABASE IF EXISTS "microblog";

CREATE DATABASE "microblog";

\c "microblog"

CREATE TABLE users (
    username text PRIMARY KEY,
    password text NOT NULL,
    first_name text,
    last_name text,
    email text,
    photo_url text,
    is_admin boolean DEFAULT false NOT NULL
);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY, 
  title TEXT NOT NULL, 
  description TEXT NOT NULL,
  body TEXT,
  username TEXT NOT NULL
);
                    
CREATE TABLE comments (
  id SERIAL PRIMARY KEY, 
  text TEXT NOT NULL, 
  post_id INT NOT NULL REFERENCES posts ON DELETE CASCADE
);

CREATE TABLE comment_user (
  comment_id INT,
  username text,
  PRIMARY KEY (comment_id, username)
);

CREATE TABLE votes (
  post_id INT NOT NULL REFERENCES posts ON DELETE CASCADE,
  username text NOT NULL REFERENCES users ON DELETE CASCADE,
  direction INT,
  PRIMARY KEY (post_id, username)
);
