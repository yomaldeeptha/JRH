const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const config = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "Admin@1234",
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "JRH",
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: false, // For local development
    trustServerCertificate: true, // For self-signed certificates
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("Connected to MSSQL Database JRH successfully.");
    return pool;
  })
  .catch(err => {
    console.error("Database Connection Failed! Bad Config: ", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};
