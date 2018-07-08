'use strict'

const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
const moment = require('moment')
const conn = require('../../src/db.conn')
const config = require('../../src/config')
const app = require('../../src/app')
const User = require('../../src/models/user')
const Poeline = require('../../src/models/poeline')
const UserFollower = require('../../src/models/user-follower')
const utils = require('../../src/services/utils')
const tokenService = require('../../src/services/token')

chai.use(chaiHttp)
var user
var token

describe('# Profile Controller', function(){

	before(function(done) {
    conn.open().then(() => { done() }).catch(done)
  })

  after(function(done){
    deleteData().then(() => conn.close())
      .then(() => done()).catch(done);
  })
  beforeEach(function (done) { deleteData().then(createUser).then(() => done()).catch(done); });

  describe('# getTrends', function(){

    it(`GET /api/profile/trends?limit=3`, function(done){
      // crear 10 usuarios con diferentes seguidores
      const arPromises = []
      for (let i = 0; i < 10; i++) {
        const user = getNewUser()
        user.user = `${user.user}_${i}`
        user.email = `${i}${user.email}`
        user.followers_count = i * 5
        arPromises.push(new User(user).save())
      }
      Promise.all(arPromises).then(() => {
        return chai.request(app)
          .get('/api/profile/trends?limit=3')
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('users');
        expect(res.body.data.users).not.to.be.null;
        expect(res.body.data.users).not.to.be.undefined
        expect(res.body.data.users).to.be.an('array').that.to.have.lengthOf(3)
        const user9 = res.body.data.users[0]
        expect(user9.user).to.equal('poesize_9');
        expect(user9.followers_count).to.equal(45);
        const user8 = res.body.data.users[1]
        expect(user8.user).to.equal('poesize_8');
        expect(user8.followers_count).to.equal(40);
        const user7 = res.body.data.users[2]
        expect(user7.user).to.equal('poesize_7');
        expect(user7.followers_count).to.equal(35);

        done();
      }).catch(done);
    });
  })

  describe('# follow', function () {
    it(`GET /api/profile/follow/poesize2`, function (done) {
      // creamos un usuario para seguirle
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.email = `2${poesize2.email}`
      let saved

      new User(poesize2).save().then((userSaved) => {
        saved = userSaved
        return chai.request(app)
          .post('/api/profile/follow/poesize2')
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))

        return Poeline.findOne({ user: user._id }).lean().exec()

      }).then((poeline) => {
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(1)
        expect(poeline.poeline[0].user.toString()).to.equal(saved._id.toString())

        done()
      }).catch(done)
    })
  })

  describe('# unfollow', function () {
    it(`GET /api/profile/unfollow/poesize2`, function (done) {
      // creamos dos usuarios para seguirles
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.email = `2${poesize2.email}`
      const poesize3 = getNewUser()
      poesize3.user = 'poesize3'
      poesize3.email = `3${poesize3.email}`
      let saved
      Promise.all([
        new User(poesize2).save(),
        new User(poesize3).save()
      ]).then((result) => {
        saved = result
        // creamos el poeline al user
        return new Poeline({
          user: user._id, poeline: [
            { user: result[0]._id }, { user: result[1]._id }] }).save()

      }).then(() => {
        // buscamos el poeline para comprobaciones
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que seguimos a los dos
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())

        //hacemos el unfollow
        return chai.request(app)
          .post('/api/profile/unfollow/poesize2')
          .set('Authorization', token)
      }).then((res) => {
        // hacemos comprobaciones de la petición
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        // buscamos de nuevo el poeline
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que seguimos a poesize3
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(1)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[1]._id.toString())

        done()
      }).catch(done)
    })
  })

  describe('# fav', function () {
    it(`GET /api/profile/fav/poesize2`, function (done) {
      // creamos dos usuarios para seguirles
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.email = `2${poesize2.email}`
      const poesize3 = getNewUser()
      poesize3.user = 'poesize3'
      poesize3.email = `3${poesize3.email}`
      let saved
      Promise.all([
        new User(poesize2).save(),
        new User(poesize3).save()
      ]).then((result) => {
        saved = result
        // creamos el poeline al user
        return new Poeline({
          user: user._id, poeline: [
            { user: result[0]._id }, { user: result[1]._id }]
        }).save()

      }).then(() => {
        // buscamos el poeline para comprobaciones
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que seguimos a los dos y ninguno es fav
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].fav).to.be.false
        expect(poeline.poeline[1].fav).to.be.false

        //hacemos el fav
        return chai.request(app)
          .post('/api/profile/fav/poesize2')
          .set('Authorization', token)
      }).then((res) => {
        // hacemos comprobaciones de la petición
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        // buscamos de nuevo el poeline
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que poesize3 no es fav y poesize2 si
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].fav).to.be.true
        expect(poeline.poeline[1].fav).to.be.false

        done()
      }).catch(done)
    })
  })

  describe('# unfav', function () {
    it(`GET /api/profile/unfav/poesize2`, function (done) {
      // creamos dos usuarios para seguirles
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.email = `2${poesize2.email}`
      const poesize3 = getNewUser()
      poesize3.user = 'poesize3'
      poesize3.email = `3${poesize3.email}`
      let saved
      Promise.all([
        new User(poesize2).save(),
        new User(poesize3).save()
      ]).then((result) => {
        saved = result
        // creamos el poeline al user
        return new Poeline({
          user: user._id, poeline: [
            { user: result[0]._id, fav: true }, { user: result[1]._id, fav: true }]
        }).save()

      }).then(() => {
        // buscamos el poeline para comprobaciones
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que seguimos a los dos y son fav
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].fav).to.be.true
        expect(poeline.poeline[1].fav).to.be.true

        //hacemos el unfav
        return chai.request(app)
          .post('/api/profile/unfav/poesize2')
          .set('Authorization', token)
      }).then((res) => {
        // hacemos comprobaciones de la petición
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        // buscamos de nuevo el poeline
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que poesize3 es fav y poesize2 no
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].fav).to.be.false
        expect(poeline.poeline[1].fav).to.be.true

        done()
      }).catch(done)
    })
  })

  describe('# silence', function () {
    it(`GET /api/profile/silence/poesize2`, function (done) {
      // creamos dos usuarios para seguirles
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.email = `2${poesize2.email}`
      const poesize3 = getNewUser()
      poesize3.user = 'poesize3'
      poesize3.email = `3${poesize3.email}`
      let saved
      Promise.all([
        new User(poesize2).save(),
        new User(poesize3).save()
      ]).then((result) => {
        saved = result
        // creamos el poeline al user
        return new Poeline({
          user: user._id, poeline: [
            { user: result[0]._id }, { user: result[1]._id }]
        }).save()

      }).then(() => {
        // buscamos el poeline para comprobaciones
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que seguimos a los dos y ninguno es silence
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].silence).to.be.false
        expect(poeline.poeline[1].silence).to.be.false

        //hacemos el silence
        return chai.request(app)
          .post('/api/profile/silence/poesize2')
          .set('Authorization', token)
      }).then((res) => {
        // hacemos comprobaciones de la petición
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        // buscamos de nuevo el poeline
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que poesize3 no es silence y poesize2 si
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].silence).to.be.true
        expect(poeline.poeline[1].silence).to.be.false

        done()
      }).catch(done)
    })
  })

  describe('# unsilence', function () {
    it(`GET /api/profile/unsilence/poesize2`, function (done) {
      // creamos dos usuarios para seguirles
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.email = `2${poesize2.email}`
      const poesize3 = getNewUser()
      poesize3.user = 'poesize3'
      poesize3.email = `3${poesize3.email}`
      let saved
      Promise.all([
        new User(poesize2).save(),
        new User(poesize3).save()
      ]).then((result) => {
        saved = result
        // creamos el poeline al user
        return new Poeline({
          user: user._id, poeline: [
            { user: result[0]._id, silence: true }, { user: result[1]._id, silence: true }]
        }).save()

      }).then(() => {
        // buscamos el poeline para comprobaciones
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que seguimos a los dos y son silence
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].silence).to.be.true
        expect(poeline.poeline[1].silence).to.be.true

        //hacemos el unsilence
        return chai.request(app)
          .post('/api/profile/unsilence/poesize2')
          .set('Authorization', token)
      }).then((res) => {
        // hacemos comprobaciones de la petición
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        // buscamos de nuevo el poeline
        return Poeline.findOne({ user: user._id }).lean().exec()
      }).then((poeline) => {
        // comprobamos que poesize3 es silence y poesize2 no
        expect(poeline).not.to.be.null
        expect(poeline).not.to.be.undefined
        expect(poeline).to.include.all.keys('_id', 'user', 'poeline')
        expect(poeline.user.toString()).to.equal(user._id.toString())
        expect(poeline.poeline).to.be.an('array').that.to.have.lengthOf(2)
        expect(poeline.poeline[0].user.toString()).to.equal(saved[0]._id.toString())
        expect(poeline.poeline[1].user.toString()).to.equal(saved[1]._id.toString())
        expect(poeline.poeline[0].silence).to.be.false
        expect(poeline.poeline[1].silence).to.be.true

        done()
      }).catch(done)
    })
  })

  describe('# getByName', function () {
    it(`GET /api/profile/name/Nombre usuario`, function (done) {
      // creamos 3 usuarios
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.name = 'Usuario para búsqueda 1'
      poesize2.email = `2${poesize2.email}`
      const poesize3 = getNewUser()
      poesize3.user = 'poesize3'
      poesize3.name = 'Nombre diferente'
      poesize3.email = `3${poesize3.email}`
      const poesize4 = getNewUser()
      poesize4.user = 'poesize4'
      poesize4.name = 'Usuario para búsqueda 3'
      poesize4.email = `4${poesize4.email}`
      let saved
      Promise.all([
        new User(poesize2).save(),
        new User(poesize3).save(),
        new User(poesize4).save()
      ]).then((result) => {
          return chai.request(app)
            .get('/api/profile/name/para búsqueda')
            .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        expect(res.body.data).to.include.all.keys('users')
        expect(res.body.data.users).to.be.an('array').that.to.have.lengthOf(2)
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page')
        expect(res.body.pagination.total_count).to.equal(2)
        done()
      }).catch(done)
    })
  })

  describe('# getByUser', function () {
    it(`GET /api/profile/por_login`, function (done) {
      // creamos 3 usuarios
      const poesize2 = getNewUser()
      poesize2.user = 'poesize2'
      poesize2.name = 'Usuario para búsqueda 1'
      poesize2.email = `2${poesize2.email}`
      const poesize3 = getNewUser()
      poesize3.user = 'poesize3'
      poesize3.name = 'Nombre diferente'
      poesize3.email = `3${poesize3.email}`
      const poesize4 = getNewUser()
      poesize4.user = 'poesize4'
      poesize4.name = 'Usuario para búsqueda 3'
      poesize4.email = `4${poesize4.email}`
      let saved
      Promise.all([
        new User(poesize2).save(),
        new User(poesize3).save(),
        new User(poesize4).save()
      ]).then((result) => {
        return chai.request(app)
          .get('/api/profile/poesize3')
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('data', 'meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        expect(res.body.data).to.include.all.keys('user')
        expect(res.body.data.user.user).to.equal('poesize3')

        done()
      }).catch(done)
    })
  })

  describe('# getFollowingByUser', function () {
    it(`GET /api/profile/following/:user?limit=10`, function (done) {
      // creamos 20 usuarios
      let arPromises = []
      for (let i = 0; i < 20; i++) {
        const userToSave = getNewUser()
        userToSave.user = `poesize${i}`
        userToSave.name = `Usuario ${i}`
        userToSave.email = `a${i}${userToSave.email}`
        arPromises.push(new User(userToSave).save())
      }
      let saved
      Promise.all(arPromises).then((result) => {
        // creamos el poeline con todos ellos
        const poeline = new Poeline({
          user: user._id,
          poeline: result.map((following) => {
            return { user: following._id }
          })
        })
        return poeline.save()
      }).then((poelineSaved) => {

        // hacemos la petición
        return chai.request(app)
          .get(`/api/profile/following/${user.user}?limit=10`)
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(20);
        expect(res.body.pagination.limit).to.equal(10);
        expect(res.body.data).to.include.all.keys('following')
        expect(res.body.data.following).to.be.an('array').that.to.have.lengthOf(10);
        res.body.data.following.forEach((user) => {
          expect(parseInt(user.user.replace('poesize', ''))).to.be.within(0, 20)
        })

        done()
      }).catch(done)
    })
  })

  describe('# getFollowersByUser', function () {
    it(`GET /api/profile/followers/:user?limit=10`, function (done) {
      // creamos 20 usuarios
      let arPromises = []
      for (let i = 0; i < 20; i++) {
        const userToSave = getNewUser()
        userToSave.user = `poesize${i}`
        userToSave.name = `Usuario ${i}`
        userToSave.email = `a${i}${userToSave.email}`
        arPromises.push(new User(userToSave).save())
      }
      let saved
      Promise.all(arPromises).then((result) => {
        // le creamos los 20 followers a user
        arPromises = result.map((follower) => {
          return new UserFollower({
            user: user._id, follower: follower._id}).save()
        })
        return Promise.all(arPromises)
      }).then((followersSaved) => {

        // hacemos la petición
        return chai.request(app)
          .get(`/api/profile/followers/${user.user}?limit=10`)
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200)
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(20);
        expect(res.body.pagination.limit).to.equal(10);
        expect(res.body.data).to.include.all.keys('followers')
        expect(res.body.data.followers).to.be.an('array').that.to.have.lengthOf(10);
        res.body.data.followers.forEach(({ follower }) => {
          expect(parseInt(follower.user.replace('poesize', ''))).to.be.within(0, 20)
        })

        done()
      }).catch(done)
    })
  })

})

function deleteData(){
  return Promise.all([
    User.remove({}).exec()
  ])
}

function getNewUser(){
  return {
    user: 'poesize',
    email: 'poesize@poesize.com',
    password: '123456',
    birthdate: new Date('12/31/1983'),
    acceptTermsConditions: true,
    bio: 'Awesome bio',
    name: 'Poesize Api'
  }
}

function createUser() {
  return new Promise((resolve, reject) => {
    (new User({
      user: 'poesize',
      email: 'poesize@poesize.com',
      password: '123456',
      birthdate: new Date('12/31/1983'),
      acceptTermsConditions: true,
      bio: 'Awesome bio',
      name: 'Poesize Api'
    })).save().then((saved) => {
      user = saved;
      token = tokenService.createToken(user);
      resolve();
    });
  })
}

// api.get('/profile/following/:user', auth, profileCtrl.getFollowingByUser)
