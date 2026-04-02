const { Sequelize } = require("sequelize");
const { db } = require("./env");

const dialectOptions = {
  connectTimeout: db.connectTimeoutMs,
};

if (db.ssl) {
  dialectOptions.ssl = {
    rejectUnauthorized: db.sslRejectUnauthorized,
  };
}

const sequelize = new Sequelize(db.name, db.user, db.password, {
  host: db.host,
  port: db.port,
  dialect: db.dialect,
  dialectOptions,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: db.logging ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

async function connectDatabase() {
  await sequelize.authenticate();
  console.log("Ligacao a MariaDB estabelecida com sucesso.");
}

module.exports = {
  sequelize,
  connectDatabase,
};
