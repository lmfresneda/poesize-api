'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const populateNoPagination = [{path: 'category'}]

const CategoryPoeSchema = new Schema({
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  poe: { type: Schema.Types.ObjectId, ref: 'Poe' },
  times: [ { type: Schema.Types.ObjectId, ref: 'User' } ],
  times_count: { type: Number, default: 0 }
})

CategoryPoeSchema.statics.byPoeId = function(poe) {
  return this.find({ poe }).populate(populateNoPagination).exec()
}

CategoryPoeSchema.statics.byPoeIdAndCategory = function(poe, category) {
  return this.findOne({ poe, category }).populate(populateNoPagination).exec()
}

module.exports = mongoose.model('CategoryPoe', CategoryPoeSchema)
