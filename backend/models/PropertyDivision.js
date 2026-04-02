const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class PropertyDivision extends Model {}

PropertyDivision.init(
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
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    area: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "PropertyDivision",
    tableName: "property_divisions",
    timestamps: false,
  }
);

module.exports = PropertyDivision;
