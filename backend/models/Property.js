const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Property extends Model {}

Property.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    objective: {
      type: DataTypes.ENUM("comprar", "arrendar"),
      allowNull: false,
    },
    propertyType: {
      type: DataTypes.ENUM("apartamento", "moradia", "terreno", "loja", "garagem"),
      allowNull: false,
      field: "property_type",
    },
    status: {
      type: DataTypes.ENUM("novo", "usado", "em_construcao", "para_recuperar"),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    district: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    county: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    parish: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    addressMap: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "address_map",
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    rooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usefulArea: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      field: "useful_area",
    },
    grossArea: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      field: "gross_area",
    },
    privativeGrossArea: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      field: "privative_gross_area",
    },
    lotArea: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "lot_area",
    },
    buildYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "build_year",
    },
    floor: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    elevator: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    parkingSpaces: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "parking_spaces",
    },
    evCharging: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "ev_charging",
    },
    energyCert: {
      type: DataTypes.ENUM("A", "B", "C", "D", "E", "F", "Isento"),
      allowNull: false,
      field: "energy_cert",
    },
    viewsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "views_count",
    },
    ownerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "owner_id",
    },
    agentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: "agent_id",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Property",
    tableName: "properties",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);

module.exports = Property;
