'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DeviceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' }
})

DeviceSchema.query.byUser = function(user) {
  return this.findOne({ user }).exec()
}

module.exports = mongoose.model('Device', DeviceSchema)
