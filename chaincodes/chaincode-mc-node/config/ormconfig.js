const Users = require('../entities/Users')

const { PG_HOST, PG_PORT, PG_DB, PG_USERNAME, PG_PASSWORD } = process.env

module.exports = {
    type: "postgres",
    host: PG_HOST,
    port: Number(PG_PORT),
    username: PG_USERNAME,
    password: PG_PASSWORD,
    database: PG_DB,
    synchronize: false,
    logging: false,
    entities: [
        Users
    ],
    subscribers: []
}