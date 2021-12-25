const { dbQuery } = require('./db-query');
const bcrypt = require('bcrypt');

module.exports = class PgPersistence {
  constructor(sessionObj) {
    this.session = sessionObj;
  }

  async verifyCredentials(username, password) {
    let user = await this.findUser(username);
    if (!user) return false;

    const FIND_USER_PASSWORD = `SELECT password FROM users WHERE username = $1`;

    let result = await dbQuery(FIND_USER_PASSWORD, username);
    if (!result) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  async createNewUser(username, password) {
    let userExists = await this.findUser(username);

    if (userExists) return false;

    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);

    const CREATE_USER = `INSERT INTO users (username, password)
                          VALUES ($1, $2)`;

    let result = await dbQuery(CREATE_USER, username, hash);
    return result.rowCount > 0;
  }

  async findUser(username) {
    const FIND_USER = `SELECT null FROM users WHERE username = $1`;

    let result = await dbQuery(FIND_USER, username);

    return result.rowCount > 0;
  }

  async findUserId(username) {
    const GET_ID = `SELECT id FROM users WHERE username = $1`;

    let result = await dbQuery(GET_ID, username);

    return result.rows[0].id;
  }

  async addMessage(username, message) {
    const userId = await this.findUserId(username);

    const NEW_MESSAGE = `INSERT INTO messages (message, user_id)
                          VALUES ($1, $2)`;

    let result = await dbQuery(NEW_MESSAGE, message, userId);

    return result.rowCount > 0;
  }

  async getAccountCreationDate(username) {
    const GET_TIMESTAMP = `SELECT date_created FROM users
                            WHERE username = $1`;

    let result = await dbQuery(GET_TIMESTAMP, username);

    return result.rows[0].date_created;
  }

  async loadMessages(username) {
    /*
    Only messages from after the users join date
    should be shown. 
    */

    let date_created = await this.getAccountCreationDate(username);

    const MESSAGES = `SELECT users.username, messages.message FROM users
                      INNER JOIN messages ON 
                      messages.user_id = users.id
                      WHERE messages.date_sent >= $1
                      ORDER BY messages.date_sent ASC`;

    let result = await dbQuery(MESSAGES, date_created);

    return result.rows;
  }
}