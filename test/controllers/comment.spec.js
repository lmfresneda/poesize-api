'use strict'

const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
const moment = require('moment')
const mongoose = require('mongoose')
const conn = require('../../src/db.conn')
const config = require('../../src/config')
const app = require('../../src/app')
const User = require('../../src/models/user')
const Poe = require('../../src/models/poe')
const Comment = require('../../src/models/comment')
const utils = require('../../src/services/utils')
const tokenService = require('../../src/services/token')

chai.use(chaiHttp)
let user
let token

describe('# Comment Controller', function(){

	before(function(done) { conn.open().then(() => { done(); }).catch(done); });
  after(function(done){ deleteData().then(() => conn.close()) .then(() => done()).catch(done); });
  beforeEach(function(done) { deleteData().then(createUser).then(() => done()).catch(done); });

// api.get('/comment/:commentId', auth, commentCtrl.getByID)
  describe('# getByID', function(){

    it(`GET api/comment/:commentId => return 200`, function(done){
      // creamos unos comentarios
      const arPromises = ['comment1', 'comment2', 'comment3'].map((commentText) => {
        return new Comment({
          user: user._id,
          text: commentText
        }).save()
      })
      Promise.all(arPromises).then((commentsSaved) => {
        // solicitamos
        chai.request(app)
          .get(`/api/comment/${commentsSaved[0]._id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).not.to.be.undefined;
            expect(res.body).not.to.be.null;
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.all.keys('data', 'meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(200);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
            expect(res.body.data).to.include.all.keys('comment');
            expect(res.body.data.comment._id.toString()).to.equal(commentsSaved[0]._id.toString())
            done();
          }).catch(done);
      })
    })

  })

// api.get('/comment/poe/:poeId', auth, commentCtrl.getByPoe)
  describe('# getByPoe', function () {

    it(`GET api/comment/poe/:poeId?limit=2 => return 200`, function (done) {
      let poe
      // creamos un poe
      (new Poe({
        user: user._id,
        text: 'Awesome poe'
      })).save().then((poeSaved) => {
        poe = poeSaved
        // le creamos unos comentarios
        const arPromises = ['comment1', 'comment2', 'comment3'].map((commentText) => {
          return new Comment({
            user: user._id,
            text: commentText,
            poe: poeSaved._id
          }).save()
        })
        return Promise.all(arPromises)
      }).then((commentsSaved) => {
        // solicitamos por poe
        chai.request(app)
          .get(`/api/comment/poe/${poe._id.toString()}?limit=2`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).not.to.be.undefined;
            expect(res.body).not.to.be.null;
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(200);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
            expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
            expect(res.body.pagination.total_count).to.equal(3);
            expect(res.body.pagination.limit).to.equal(2);
            expect(res.body.data).to.include.all.keys('comments');
            expect(res.body.data.comments).to.be.an('array').that.to.have.lengthOf(2);
            res.body.data.comments.forEach((comment) => {
              expect(commentsSaved.map(c => c.text)).include(comment.text)
              expect(commentsSaved.map(c => c._id.toString())).include(comment._id)
            })
            done();
          }).catch(done);
      })
    })

  });

// api.post('/comment', auth, commentCtrl.saveComment)
  describe('# saveComment with tags and mentions', function () {
    it(`POST api/comment => return 200`, function (done) {
      // creamos un poe
      (new Poe({
        user: user._id,
        text: 'Awesome poe'
      })).save().then((poeSaved) => {
        // solicitamos por poe
        chai.request(app)
          .post('/api/comment')
          .set('Authorization', token)
          .send({
            poe: poeSaved._id,
            text: 'Poe text with a #tag and @mention'
          }).then((res) => {
            expect(res).to.have.status(201);
            expect(res.body).not.to.be.undefined;
            expect(res.body).not.to.be.null;
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.all.keys('data', 'meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(201);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));
            expect(res.body.data).to.include.all.keys('comment');
            expect(res.body.data.comment).to.include.all.keys(
              'user', 'poe', 'text', 'tags', 'mentions', 'date');
            expect(res.body.data.comment.user.toString()).to.equal(user._id.toString())
            expect(res.body.data.comment.poe.toString()).to.equal(poeSaved._id.toString())
            expect(res.body.data.comment.tags).to.be.an('array').that.to.have.lengthOf(1);
            expect(res.body.data.comment.mentions).to.be.an('array').that.to.have.lengthOf(1);
            expect(res.body.data.comment.tags[0]).to.equal('#tag')
            expect(res.body.data.comment.mentions[0]).to.equal('@mention')
            done();
          }).catch(done);
      })
    })
  });

// api.delete('/comment/:commentId', auth, commentCtrl.deleteComment)
  describe('# deleteComment', function () {
    it(`DELETE api/comment/:commentId => return 200`, function (done) {
      // creamos un poe
      let poe
      let comments
      (new Poe({
        user: user._id,
        text: 'Awesome poe'
      })).save().then((poeSaved) => {
        poe = poeSaved
        // le creamos unos comentarios
        const arPromises = ['comment1', 'comment2', 'comment3'].map((commentText) => {
          return new Comment({
            user: user._id,
            text: commentText,
            poe: poeSaved._id
          }).save()
        })
        return Promise.all(arPromises)
      }).then((commentsSaved) => {
        comments = commentsSaved
        // creamos la petición de borrado
        return chai.request(app)
          .delete(`/api/comment/${commentsSaved[0]._id.toString()}`)
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200)
        expect(res.body).not.to.be.undefined
        expect(res.body).not.to.be.null
        expect(res.body).to.be.an('object')
        expect(res.body).to.include.all.keys('meta')
        expect(res.body.meta).to.include.all.keys('status', 'message')
        expect(res.body.meta.status).to.equal(200)
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200))

        // buscamos los comentarios del poe
        return Comment.find({poe: poe._id})
      }).then((commentsSaved) => {
        // comprobamos que sigue habiendo 3, es borrado lógico no físico
        expect(commentsSaved).to.be.an('array').that.to.have.lengthOf(3);
        const comment1 = commentsSaved.find(c => c.text === 'comment1')
        const comment2 = commentsSaved.find(c => c.text === 'comment2')
        const comment3 = commentsSaved.find(c => c.text === 'comment3')
        expect(comment1.deleted).to.be.true
        expect(comment2.deleted).to.be.false
        expect(comment3.deleted).to.be.false

        done()
      }).catch(done)
    })
  })

})




function deleteData(){
	return Promise.all([
    Poe.remove({}).exec(),
    User.remove({}).exec(),
    Comment.remove({}).exec()
  ]);
}

function createUser(){
  return new Promise((res, rej) => {
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
      res();
    });
  })
}
