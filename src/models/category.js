'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CategorySchema = new Schema({
  slug: { type: String, unique: true, lowercase: true, index: true },
  description: { type: String, index: true }
})

CategorySchema.statics.byLikeDescription = function(desc) {
  return this.find({ description: new RegExp(desc, 'i') }).exec()
}

CategorySchema.statics.byDescription = function(desc) {
  return this.find({ description: desc }).exec()
}

module.exports = mongoose.model('Category', CategorySchema)
