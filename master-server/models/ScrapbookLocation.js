const { DataTypes } = require("sequelize");
const sequelize = require("../configs/databaseConfig");

// Một địa điểm (tỉnh/quốc gia) đã đến trong scrapbook. Chỉ một trong
// areaColor / areaBackgroundUrl có giá trị.
const ScrapbookLocation = sequelize.define(
    "ScrapbookLocation",
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        scrapbookId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
            field: "scrapbook_id",
        },
        codename: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        visitedAt: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "visited_at",
        },
        areaColor: {
            type: DataTypes.STRING(9),
            allowNull: true,
            field: "area_color",
        },
        areaBackgroundUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            field: "area_background_url",
        },
        areaBackgroundPublicId: {
            type: DataTypes.STRING,
            allowNull: true,
            field: "area_background_public_id",
        },
    },
    {
        tableName: "scrapbook_locations",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        charset: "utf8mb4",
        collate: "utf8mb4_unicode_ci",
        indexes: [{ unique: true, name: "uq_scrapbook_codename", fields: ["scrapbook_id", "codename"] }],
        validate: {
            exactlyOneAreaStyle() {
                if (Boolean(this.areaColor) === Boolean(this.areaBackgroundUrl)) {
                    throw new Error("Chỉ được chọn một trong areaColor hoặc areaBackground");
                }
            },
        },
    }
);

module.exports = ScrapbookLocation;
