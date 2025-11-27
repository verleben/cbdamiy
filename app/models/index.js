const config = require('../config');
const LocalModel = require('./LocalModel');
const SqliteModel = require('./SqliteModel');
const MysqlModel = require('./MysqlModel');
const PostgresqlModel = require('./PostgresqlModel');

let modelInstance = null;

function getModel() {
  if (modelInstance) {
    return modelInstance;
  }

  const dbConnection = config.db.connection.toLowerCase();

  switch (dbConnection) {
    case 'local':
      modelInstance = new LocalModel();
      break;

    case 'sqlite':
      modelInstance = new SqliteModel();
      break;

    case 'mysql':
      modelInstance = new MysqlModel();
      break;

    case 'postgresql':
    case 'postgres':
      modelInstance = new PostgresqlModel();
      break;

    default:
      throw new Error(`Unsupported database connection type: ${dbConnection}`);
  }

  return modelInstance;
}

module.exports = { getModel };
