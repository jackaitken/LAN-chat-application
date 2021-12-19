const config = require('./config');
const { Client } = require('pg');

function logQuery(statement, parameters) {
  let timestamp = new Date();
  let formattedTimeStamp = timestamp.toString().slice(4, 24);
  console.log(formattedTimeStamp, statement, parameters);
}

module.exports = {
  async dbQuery(statement, ...parameters) {
    let client = new Client({ database: config.DATABASE });

    await client.connect();
    logQuery(statement, parameters);
    let result = await client.query(statement, parameters);
    await client.end();

    return result;
  }
};