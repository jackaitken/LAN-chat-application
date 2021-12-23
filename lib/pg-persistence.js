const { dbQuery } = require('./db-query');
const bcrypt = require('bcrypt');

module.exports = class PgPersistence {
  constructor(sessionObj) {
    this.session = sessionObj;
  }

  async verifyCredentials(username, password) {
    debugger;
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
}