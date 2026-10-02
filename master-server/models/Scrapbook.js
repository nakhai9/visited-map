const { DataTypes } = require("sequelize");
const sequelize = require("../configs/databaseConfig");

// Một scrapbook = bản đồ của một user cho một bản đồ địa điểm (locationCode).
const Scrapbook = sequelize.define(
    "Scrapbook",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "user_id",
        },
        locationCode: {
            type: DataTypes.STRING(100),
            allowNull: false,
            field: "location_code",
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        showLabel: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "show_label",
        },
        showStats: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "show_stats",
        },
        enableZoom: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "enable_zoom",
        },
        enablePan: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: "enable_pan",
        },
    },
    {
        tableName: "scrapbooks",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        indexes: [{ unique: true, name: "uq_scrapbook_user_location", fields: ["user_id", "location_code"] }],
    }
);

module.exports = Scrapbook;
