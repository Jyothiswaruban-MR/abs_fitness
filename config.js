require('dotenv').config({ path: './properties.env' });
const sql = require('mssql/msnodesqlv8');

const connectionString = `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=Yes;`;

console.log("  Connection string is:", connectionString);

const config = {
  connectionString: connectionString,
  driver: 'msnodesqlv8',
};

async function getConnection() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    throw err;
  }
}

module.exports = { getConnection, sql };
