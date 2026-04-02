const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class PropertyImage extends Model {}

PropertyImage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    propertyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "property_id",
    },
    imageUrl: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "image_url",
    },
    isMain: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_main",
    },
  },
  {
    sequelize,
    modelName: "PropertyImage",
    tableName: "property_images",
    timestamps: false,
  }
);

module.exports = PropertyImage;
