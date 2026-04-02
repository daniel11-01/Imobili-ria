const { Sequelize } = require("sequelize");
const { db } = require("./env");

const dialectOptions = db.ssl
  ? {
      ssl: {
        rejectUnauthorized: db.sslRejectUnauthorized,
      },
    }
  : undefined;

const sequelize = new Sequelize(db.name, db.user, db.password, {
  host: db.host,
  port: db.port,
  dialect: db.dialect,
  dialectOptions,
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
