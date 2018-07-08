'use strict'

const mentionHashtag = require('mention-hashtag')
const _slugify = require('slugify')

/**
 * Guarda todos los documentos pasados paralelamente
 * @param  {Array<Model>} documents - Array de documentos a guardar
 * @return {Array<Model>}           - Array de documentos guardados. No necesariamente
 *                                    guardará el mismo orden que el array recibido.
 */
function saveAll(documents) {
	return new Promise((resolve, reject) => {
		const result = []

		const arrPromise = documents.map((record) => {
			return new Promise((_resolve, _reject) => {
				record.save().then((saved) => {
					result.push(saved)
					_resolve()
				}).catch((err) => {
					_reject(err)
				})
			})
		})

		Promise.all(arrPromise)
			.then(() => { resolve(result) })
			.catch((err) => { reject(err) })
	})
}

function getTags(text, unique = true){
	const h = mentionHashtag(text, { type: '#', unique })
  return h
}
function getMentions(text, unique = true){
	const h =  mentionHashtag(text, { type: '@', unique })
  return h
}

function sortBy(arr, field, reverse = false){
	let res = arr.sort((a, b) => {
		if(a[field] > b[field]) return 1
		if(a[field] < b[field]) return -1
		return 0
	})
	if(reverse) return res.reverse()
	return res
}

function take(arr, num, start = 0){
	// thanks https://stackoverflow.com/a/5463520
	var current = (start >= arr.length) ? (start - arr.length) : start,
      len = arr.length
  return function() {
    var end = current + num
    var part = arr.slice(current,end)
    if(end > len) {
        end = end % len
        part = part.concat(arr.slice(0, end))
    }
    current = end
    return part
  }
}

const res = {
	OK: (responser, arg, pagination) => {
		return _res(responser, arg, 200, pagination)
	},
	Created: (responser, arg) => {
		return _res(responser, arg, 201)
	},
	BadRequest: (responser, msg) => {
		return _res(responser, msg, 400)
	},
	Forbidden: (responser, msg) => {
		return _res(responser, msg, 403)
	},
	NotFound: (responser, msg) => {
		return _res(responser, msg, 404)
	},
	Conflict: (responser, msg) => {
		return _res(responser, msg, 409)
	},
	Error: (responser, msg) => {
		return _res(responser, msg, 500)
	},
}

function _res(responser, response, status, pagination){

	responser.sendWrapped(
    status,
    getMessageFromStatus(status),
    status >= 400
      ? { message: response }
      : response,
    pagination
  )
}

function getMessageFromStatus(status){
	switch(status){
		case 200: return 'OK'
		case 201: return 'Created'
		case 204: return 'No Content'
		case 400: return 'Bad Request'
		case 401: return 'Unauthorized'
		case 403: return 'Forbidden'
		case 404: return 'Not Found'
		case 409: return 'Conflict'
		case 500: return 'Internal Server Error'
		default: return ''
	}
}

function expressSendWrapped(status, message, data, pag) {
	let res = {}
  if(data) res.data = data
  res.meta = { status, message }
  if(pag) res.pagination = pag
  return this.status(status).json(res)
}

function slugify(text){
	return _slugify(text)
}

module.exports = {
	saveAll,
	getTags,
	getMentions,
	res,
	take,
	sortBy,
	expressSendWrapped,
	slugify,
	getMessageFromStatus
}
