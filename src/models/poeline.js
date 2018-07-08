'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Poe = require('./poe')
// const User = require('./user')
const utils = require('../services/utils')
const config = require('../config')

/**
 * Cada usuario tiene su Poeline, que consiste en un array de
 * todos los usuarios a los que sigue, ordenados en el array
 * por fecha de seguimiento.
 *
 * La app solicita un nº máximo de poes y la última fecha de lectura.
 * El algoritmo lo que hace es, consultar primero los poes de los
 * usuarios favoritos no marcados como "read", siempre un máximo de Poes,
 * por ejemplo, 3 en cada consulta. Se van marcando como "read" cuando
 * el usuario no tiene más Poes que ofrecer. Cuando están todos marcados como "read" se
 * empieza a buscar en los usuarios NO favoritos, primero los usuarios no
 * marcados con "read", mismo sistema, 3 Poes máximo de cada uno, se van
 * marcando como "read" también cuando no tienen más Poes que ofrecer,
 * terminamos cuando hemos conseguido el nº de Poes solicitado o están todos
 * marcados como "read". Esto último originará que a todo el Poeline se le
 * desmarque el "read".
 *
 * Siempre será obligatorio indicar una fecha desde la que se quieren Poes.
 */
// FIXME es horriblemente ineficiente....
const PoelineSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  poeline: [
    {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      fromDate: { type: Date, default: Date.now },
      fav: { type: Boolean, default: false },
      silence: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      lastRead: { type: Date, default: Date.now }
    }
  ]
})

/**
 * options = {
 * 		"num": number, //required
 *    "fromDate": Date (< now) //required
 * 	  "toDate": Date (< now) //optional
 *    "maxByUser": number // optional, config.MAX_POES_GET_BY_POELINE_USER by default
 * }
 */
// FIXME es horriblemente ineficiente....
PoelineSchema.statics.getPoeline = function(user, options) {
	return new Promise((resolve, reject) => {
    if(isInvalidOptsGetPoeline(options))
      return reject(new Error(isInvalidOptsGetPoeline(options)))

		let { num, fromDate, toDate } = options
    if(!toDate) toDate = Date.now()

		this.findOne({ user }).exec().then((poelineUser) => {
      const update = []
      // sacamos los usuarios que no han sido silenciados
      const notSilence = poelineUser.poeline.filter(u => !u.silence)
      // recogemos los favoritos
      const favs = notSilence.filter(u => u.fav)
      // recogemos los favoritos que aun no hemos leido
      let favsUnread = favs.filter(u => !u.read)
      // recogemos los NO favoritos
      const nofavs = notSilence.filter(u => !u.fav)
      // recogemos los NO favoritos que aun no hemos leido
      let nofavsUnread = nofavs.filter(u => !u.read)
      const max = options.maxByUser || config.MAX_POES_GET_BY_POELINE_USER
			let poesResponse = []
      // si no quedan favoritos sin leer, marcamos todos como NO leidos
      if(!favsUnread.length) {
        favs.forEach((f) => { f.read = false; update.push(f) })
        favsUnread = favs
      }
      // si no queda NO favoritos sin leer, marcamos todos como NO leidos
      if(!nofavsUnread.length) {
        nofavs.forEach((nf) => { nf.read = false; update.push(nf) })
        nofavsUnread = nofavs
      }

      // a jugar

      // consultamos de los favoritos
      function consultarFavs(){
        const _favsUnread = favsUnread.filter(u => !u.read)
        const _favsUnread2 = []

        // si no quedan favoritos sin leer, pasamos a NO favoritos
        if(!_favsUnread.length) { consultaNoFavs() }
        else{
          // si quedan favoritos sin leer, continuamos
          const promises = [Promise.resolve()]
          for (var i = 0; i < (num / max) - (poesResponse.length / max); i++) {
            if (!_favsUnread[i]) continue
            // TODO mejorar recorrido (pueden ir más o menos poes de los solicitados por "poesResponse.length / max")
            const prom = Poe.find({
              user: _favsUnread[i].user,
              date: {
                $gte: fromDate,
                $lte: toDate} }).limit(parseInt(max)).exec()

            promises.push(prom)
            _favsUnread2.push(_favsUnread[i])
          }

          Promise.all(promises).then((results) => {
            // results es una matriz
            results.filter(r => !!r).forEach((r) => {
              poesResponse = poesResponse.concat(r)
            })

            // marcar leidos los de _favsUnread2
            _favsUnread2.forEach((favUnread) => {
              const favToRead = favsUnread.find(fav => fav.user == favUnread.user)
              favToRead.read = true
              favToRead.lastRead = Date.now()
              update.push(favToRead)
            })

            if(poesResponse.length >= num) fin()
            else consultarFavs()

          })
        }
      }

      function consultaNoFavs(){
        const _nofavsUnread = nofavsUnread.filter(u => !u.read)
        const _nofavsUnread2 = []

        if(!_nofavsUnread.length) fin()
        else{
          const promises = [Promise.resolve()]
          for (var i = 0; i < (num / max) - (poesResponse.length / max); i++) {
            // TODO mejorar recorrido (pueden ir más o menos poes de los solicitados por "poesResponse.length / max")
            if (!_nofavsUnread[i]) continue
            const prom = Poe.find({
              user: _nofavsUnread[i].user,
              date: {
                $gte: fromDate ,
                $lte: toDate
              }
            }).limit(parseInt(max)).exec()

            promises.push(prom)
            _nofavsUnread2.push(_nofavsUnread[i])
          }

          Promise.all(promises).then((results) => {
            // results es una matriz
            results.filter(r => !!r).forEach((r) => {
              poesResponse = poesResponse.concat(r)
            })

            // marcar leidos los de _nofavsUnread2
            _nofavsUnread2.forEach((favUnread) => {
              const noFavToRead = nofavsUnread.find(fav => fav.user == favUnread.user)
              noFavToRead.read = true
              noFavToRead.lastRead = Date.now()
              update.push(noFavToRead)
            })

            if(poesResponse.length >= num) fin()
            else consultaNoFavs()

          })
        }
      }

      function fin(){
        //ordenar response por fecha publicacion desc
        poesResponse.sort((a, b) => b.date - a.date)

        // antes de nada, responder
        process.nextTick(() => {
          //actualizar los registros por los que hemos ido pasando
          const arPromises = update.map((elem) => elem.save())
          Promise.all(arPromises).then(() => {
            console.log('Documentos actualizados ' + arPromises.length)
          }).catch((err) => {
            console.error('Error al actualizar documentos: ', err)
          })
        })

        // responder
        resolve(poesResponse)
      }

      consultarFavs()


		}).catch(reject)

	})
}

PoelineSchema.statics.followingByUser = function(user, { page = 1, limit = 10, sortby = "fromDate", dir = -1 }) {
  page = parseInt(page)
  limit = parseInt(limit)
  if(page > 0) page -= 1
  return new Promise((resolve, reject) => {

    this.findOne({ user }).exec().then((poelineUser) => {
      const result = {
        docs: [],
        total: 0,
        page: page + 1,
        limit
      }
      if(!poelineUser || !poelineUser.poeline) return resolve(result)

      poelineUser.poeline = utils.sortBy(poelineUser.poeline, sortby, dir == -1)
      result.docs = poelineUser.poeline.slice(page * limit, (page * limit) + limit)
      result.total = poelineUser.poeline.length
      resolve(result)

    }).catch(reject)
  })
}

PoelineSchema.statics.getFollowUser = function(user, follow) {
  return new Promise((resolve, reject) => {
    this.aggregate(
      { $match: {user, 'poeline.user': follow} },
      { $unwind: '$poeline' },
      { $match: {'poeline.user': follow} }
    ).exec().then((records) => {
      if(records && records.length) resolve(records[0].poeline)
      else resolve(null)
    }).catch(reject)
  })
}

function isInvalidOptsGetPoeline(options){
  if(!options) return 'Param [options] is required'
  const { num, fromDate, toDate } = options
  if(num === undefined) return 'Param [options.num] is required'
  if(num <= 0) return 'Param [options.num] should be greater than 0'
  if(fromDate === undefined) return 'Param [options.fromDate] is required'
  if(fromDate >= Date.now()) return 'Param [options.fromDate] should be less than now'
  if(toDate !== undefined){
    if(toDate > Date.now()) return 'Param [options.toDate] should be less or equal than now'
    if(toDate <= fromDate) return 'Param [options.toDate] should be greater than [options.fromDate]'
  }
  return false
}

module.exports = mongoose.model('Poeline', PoelineSchema)
