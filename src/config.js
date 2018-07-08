module.exports = {
  port: process.env.PORT || 3001,
  db: process.env.MONGODB_URI || 'mongodb://localhost:27017/poesize',
  db_test: 'mongodb://localhost:27017/poesizetest',
  db_dev: 'mongodb://localhost:27017/poesizedev',
  DB_VERSION: '3.4.4',
  USE_MONGO_CLIENT: true,
  SECRET_TOKEN: 'miclavedetokens',
  ADMIN_TOKEN: '1234',
  MAX_POES_GET_BY_POELINE_USER: 3
}
