const { dbQuery } = require('./db-query');

module.exports = class PgPersistence {
  constructor(sessionObj) {
    this.session = sessionObj;
  }

  async verifyCredentials(username, password) {
    const FIND_USER = `SELECT * FROM users
                        WHERE username = $1 AND password = $2`;

    let result = await dbQuery(FIND_USER, username, password);

    return result.rowCount === 1;
  }
}