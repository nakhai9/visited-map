const User = require("./User");
const Scrapbook = require("./Scrapbook");
const ScrapbookLocation = require("./ScrapbookLocation");

User.hasMany(Scrapbook, { foreignKey: "userId", onDelete: "CASCADE" });
Scrapbook.belongsTo(User, { foreignKey: "userId" });

Scrapbook.hasMany(ScrapbookLocation, { foreignKey: "scrapbookId", as: "locations", onDelete: "CASCADE" });
ScrapbookLocation.belongsTo(Scrapbook, { foreignKey: "scrapbookId" });

module.exports = { User, Scrapbook, ScrapbookLocation };
