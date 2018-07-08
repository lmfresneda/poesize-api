'use strict'

const mongoose = require('mongoose')
const config = require('./config')
mongoose.Promise = global.Promise

mongoose.connection.once('error', (err) => {
  console.error(err)
  close()
})

function open(){
	return new Promise((resolve, reject) => {
    mongoose.set('debug', process.env.MONGOOSE_DEBUG !== undefined && process.env.MONGOOSE_DEBUG == 'true')

    if(process.env.DEBUG !== undefined && process.env.DEBUG == 'true'){
      // test
      var Mockgoose = require('mockgoose').Mockgoose
      var mockgoose = new Mockgoose(mongoose)
      mockgoose.helper.setDbVersion(process.env.DB_VERSION || config.DB_VERSION)
      mockgoose.prepareStorage().then(function() {
        mongoose.connect(config.db_test, {useMongoClient: config.USE_MONGO_CLIENT}, (err) => {
          if (err) return reject(err)
          resolve()
        })
      }).catch(reject)
    }else{
      // mongod
      mongoose.connect(process.env.NODE_ENV == 'production' ? config.db : config.db_dev,
                       {useMongoClient: config.USE_MONGO_CLIENT}, (err) => {
        if (err) return reject(err)
        resolve()
      })
    }
	})
}

function close(){
	return mongoose.disconnect()
}

module.exports = {
  close,
  open
}

