'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ProposedCategorySchema = new Schema({
  slug: String,
  description: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
})

ProposedCategorySchema.statics.byDescription = function(desc) {
  return this.find({ description: desc }).exec()
}

module.exports = mongoose.model('ProposedCategory', ProposedCategorySchema)
