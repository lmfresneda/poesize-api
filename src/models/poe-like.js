'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PoeLikeSchema = new Schema({
  poe: { type: Schema.Types.ObjectId, ref: 'Poe' },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
})

PoeLikeSchema.statics.countByPoe = function(poe) {
	return new Promise((resolve, reject) => {
    this.count({ poe }, (err, count) => {
      if(err) {
        console.error(err)
        return reject(err)
      }
      resolve(count)
    })
	})
}

PoeLikeSchema.statics.byUserAndPoe = function(user, poe) {
  return this.findOne({ poe, user }).exec()
}

module.exports = mongoose.model('PoeLike', PoeLikeSchema)
