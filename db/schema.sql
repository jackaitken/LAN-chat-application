CREATE TABLE users (
  id serial PRIMARY KEY,
  username text,
  password text NOT NULL,
  date_created timestamp DEFAULT(CURRENT_TIMESTAMP),
);

CREATE TABLE messages (
  id serial PRIMARY KEY,
  message text,
  date_sent timestamp DEFAULT(CURRENT_TIMESTAMP),
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE
);