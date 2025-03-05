const { DataSource } = require("typeorm")
const ORMPGConfigs = require("../config/ormconfig")

const AppDataSource = new DataSource({ ...ORMPGConfigs });
module.exports = {
    AppDataSource
}