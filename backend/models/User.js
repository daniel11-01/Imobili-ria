const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "last_name",
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "uq_users_email",
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    phoneEncrypted: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "phone_encrypted",
    },
    publicPhone: {
      type: DataTypes.STRING(25),
      allowNull: true,
      field: "public_phone",
    },
    licenseNumber: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: "license_number",
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "avatar_url",
    },
    role: {
      type: DataTypes.ENUM("cliente", "admin"),
      allowNull: false,
      defaultValue: "cliente",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: false,
  }
);

module.exports = User;
