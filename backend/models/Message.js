const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Message extends Model {}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    propertyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "property_id",
    },
    senderName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "sender_name",
    },
    senderEmail: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "sender_email",
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "sender_id",
    },
    messageText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "message_text",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    senderPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "sender_phone",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_read",
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: false,
  }
);

module.exports = Message;
