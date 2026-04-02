const User = require("./User");
const Property = require("./Property");
const PropertyImage = require("./PropertyImage");
const PropertyDivision = require("./PropertyDivision");
const Message = require("./Message");
const PasswordResetToken = require("./PasswordResetToken");

Property.belongsTo(User, {
  foreignKey: "ownerId",
  as: "owner",
});

Property.belongsTo(User, {
  foreignKey: "agentId",
  as: "agent",
});

Property.hasMany(PropertyImage, {
  foreignKey: "propertyId",
  as: "images",
});

PropertyImage.belongsTo(Property, {
  foreignKey: "propertyId",
  as: "property",
});

Property.hasMany(PropertyDivision, {
  foreignKey: "propertyId",
  as: "divisions",
});

PropertyDivision.belongsTo(Property, {
  foreignKey: "propertyId",
  as: "property",
});

Message.belongsTo(Property, {
  foreignKey: "propertyId",
  as: "property",
});

Message.belongsTo(User, {
  foreignKey: "senderId",
  as: "sender",
});

Property.hasMany(Message, {
  foreignKey: "propertyId",
  as: "messages",
});

PasswordResetToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(PasswordResetToken, {
  foreignKey: "userId",
  as: "passwordResetTokens",
});

module.exports = {
  User,
  Property,
  PropertyImage,
  PropertyDivision,
  Message,
  PasswordResetToken,
};
