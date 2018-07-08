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
const Category = require('../../src/models/category')
const CategoryPoe = require('../../src/models/category-poe')
const Poeline = require('../../src/models/poeline')
const PoeLike = require('../../src/models/poe-like')
const Comment = require('../../src/models/comment')
const utils = require('../../src/services/utils')
const tokenService = require('../../src/services/token')

chai.use(chaiHttp)
var user
var token

describe('# Poe Controller', function(){

	before(function(done) { conn.open().then(() => { done(); }).catch(done); });
  after(function(done){ deleteData().then(() => conn.close()) .then(() => done()).catch(done); });
  beforeEach(function(done) { deleteData().then(createUser).then(() => done()).catch(done); });

  describe('# getByID', function(){
    it(`GET api/poe/:poeId => return 404 (poe not exist)`, function(done){
      const id = mongoose.Types.ObjectId();
      chai.request(app)
        .get(`/api/poe/${id.toString()}`)
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(404);
          done();
        }).catch((err) => {
          expect(err).to.have.status(404);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(404);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Poe not found');
          done();
        }).catch(done);
    });

    it(`GET api/poe/:poeId => return 404 (poe is deleted)`, function(done){
      (new Poe({
        user: user._id,
        text: 'Poe text',
        deleted: true
      })).save().then((poeSaved) => {
        return chai.request(app)
          .get(`/api/poe/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(404);
        done();
      }).catch((err) => {
        expect(err).to.have.status(404);
        expect(err.response.body).to.include.all.keys('data', 'meta');
        expect(err.response.body.meta).to.include.all.keys('status', 'message');
        expect(err.response.body.meta.status).to.equal(404);
        expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
        expect(err.response.body.data).to.include.all.keys('message');
        expect(err.response.body.data.message).to.equal('Poe not found');
        done();
      }).catch(done);
    });

    it(`GET api/poe/:poeId => return 200 with Poe`, function(done){
      let poeSaved;
      (new Poe({
        user: user._id,
        text: 'Poe text'
      })).save().then((_poeSaved) => {
        poeSaved = _poeSaved;
        return chai.request(app)
          .get(`/api/poe/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poe');
        expect(res.body.data.poe).not.to.be.null;
        expect(res.body.data.poe).not.to.be.undefined;
        expect(res.body.data.poe).to.include.all.keys('user', 'text', '_id', 'date');
        expect(res.body.data.poe._id.toString()).to.equal(poeSaved._id.toString());
        expect(res.body.data.poe.user.toString()).to.equal(poeSaved.user.toString());
        expect(res.body.data.poe.text).to.equal(poeSaved.text);

        done();
      }).catch(done);
    });
  });

  describe('# deletePoe', function(){
    it('DELETE api/poe/:poeId => return 404 (poe not exist)', function(done){
      const id = mongoose.Types.ObjectId();
      chai.request(app)
        .delete(`/api/poe/${id.toString()}`)
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(404);
          done();
        }).catch((err) => {
          expect(err).to.have.status(404);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(404);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Poe not found');
          done();
        }).catch(done);
    });

    it('DELETE api/poe/:poeId => return 404 (poe is deleted previously)', function(done){
      (new Poe({
        user: user._id,
        text: 'Poe text',
        deleted: true
      })).save().then((poeSaved) => {
        return chai.request(app)
          .delete(`/api/poe/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(404);
        done();
      }).catch((err) => {
        expect(err).to.have.status(404);
        expect(err.response.body).to.include.all.keys('data', 'meta');
        expect(err.response.body.meta).to.include.all.keys('status', 'message');
        expect(err.response.body.meta.status).to.equal(404);
        expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
        expect(err.response.body.data).to.include.all.keys('message');
        expect(err.response.body.data.message).to.equal('Poe not found');
        done();
      }).catch(done);
    });

    it('DELETE api/poe/:poeId => return 403 (user is not owner)', function(done){
      const id = mongoose.Types.ObjectId();
      (new Poe({
        user: id,
        text: 'Poe text'
      })).save().then((poeSaved) => {
        return chai.request(app)
          .delete(`/api/poe/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(403);
        done();
      }).catch((err) => {
        expect(err).to.have.status(403);
        expect(err.response.body).to.include.all.keys('data', 'meta');
        expect(err.response.body.meta).to.include.all.keys('status', 'message');
        expect(err.response.body.meta.status).to.equal(403);
        expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
        expect(err.response.body.data).to.include.all.keys('message');
        expect(err.response.body.data.message).to.equal('User isn\'t owner of the Poe');
        done();
      }).catch(done);
    });

    it('DELETE api/poe/:poeId => return 200', function(done){
      let poeSaved;
      (new Poe({
        user: user._id,
        text: 'Poe text'
      })).save().then((_poeSaved) => {
        poeSaved = _poeSaved;
        return chai.request(app)
          .delete(`/api/poe/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        return Poe.findById(poeSaved._id).exec();
      }).then((poe) => {

        expect(poe.deleted).to.be.ok;
        done();

      }).catch(done);
    });

    it('DELETE api/poe/:poeId => with comments, return 200 and comments delete too', function(done){

      let poeSaved;
      (new Poe({ user: user._id, text: 'Poe text' })).save().then((_poeSaved) => {
        poeSaved = _poeSaved;
        //guardamos 2 comentarios
        return Promise.all([
          (new Comment({ user: user._id, text: 'Poe text', poe: poeSaved._id })).save(),
          (new Comment({ user: user._id, text: 'Poe text', poe: poeSaved._id })).save()
        ]);
      }).then((comments) => {
        return chai.request(app)
          .delete(`/api/poe/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        return Poe.findById(poeSaved._id).exec();
      }).then((poe) => {
        expect(poe.deleted).to.be.ok;
        return Comment.find({poe: poeSaved._id}).exec();
      }).then((commentsDeleted) => {
        commentsDeleted.forEach((comment) => {
          expect(comment.deleted).to.be.ok;
        });
        done();
      }).catch(done);
    });
  });

  describe('# savePoe', function(){
    it('POST api/poe => return 400 (not body)', function(done){
      chai.request(app)
        .post('/api/poe')
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(400);
          done();
        }).catch((err) => {
          expect(err).to.have.status(400);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(400);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(400));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Body request is not valid');
          done();
        }).catch(done);
    });

    it('POST api/poe => return 201 and poe is saved', function(done){
      let poeSaved;
      chai.request(app)
        .post('/api/poe')
        .set('Authorization', token)
        .send({ user: user._id, text: 'Poe text' })
        .then((res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.include.all.keys('data', 'meta');
          expect(res.body.data).to.include.all.keys('poe');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(201);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));

          poeSaved = res.body.data.poe;
          expect(poeSaved).to.include.all.keys('_id', 'user', 'text');
          expect(poeSaved.user.toString()).to.equal(user._id.toString());
          expect(poeSaved.text).to.equal('Poe text');
          return Poe.findById(res.body.data.poe._id).exec()
        }).then((poeSaved2) => {
          expect(poeSaved2).not.to.be.undefined;
          expect(poeSaved2).not.to.be.null;
          expect(poeSaved2).not.to.be.empty;
          expect(poeSaved2._id.toString()).to.equal(poeSaved._id.toString());

          done();
        }).catch(done);
    });

    it('POST api/poe => return 201 and include tags and mentions', function(done){
      let poeSaved;
      chai.request(app)
        .post('/api/poe')
        .set('Authorization', token)
        .send({ user: user._id, text: 'Poe text with a @mention and #thistag and #othertag' })
        .then((res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.include.all.keys('data', 'meta');
          expect(res.body.data).to.include.all.keys('poe');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(201);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));

          poeSaved = res.body.data.poe;
          expect(poeSaved).to.include.all.keys('_id', 'user', 'text', 'tags', 'mentions');
          expect(poeSaved.user.toString()).to.equal(user._id.toString());
          expect(poeSaved.tags).to.be.an('array').that.to.have.lengthOf(2);
          expect(poeSaved.mentions).to.be.an('array').that.to.have.lengthOf(1);

          expect(poeSaved.mentions[0]).to.equal('@mention');
          expect(poeSaved.tags[0]).to.equal('#thistag');
          expect(poeSaved.tags[1]).to.equal('#othertag');
          done();
        }).catch(done);
    });
  });

  describe('# getPoesByTag', function(){
    it('GET api/poe/tag/:tag => w/o pagination => return 200 with 3 poes (and pagination)', function(done){
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe with #thetag', tags: utils.getTags('Poe with #thetag')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #tog and #thetag too', tags: utils.getTags('Poe with #tog and #thetag too')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #othertag', tags: utils.getTags('Poe with #othertag')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #thetag too', tags: utils.getTags('Poe with #thetag too')})).save()
      ]).then((poesSaved) => {
        return chai.request(app)
          .get('/api/poe/tag/thetag')
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poes');
        expect(res.body.data.poes).to.be.an('array').that.to.have.lengthOf(3);
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(3);
        done();
      }).catch(done);
    });

    it('GET api/poe/tag/:tag => w/ page=2&limit=2 => return 200 with 2 poes', function(done){
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe with #thetag', tags: utils.getTags('Poe with #thetag')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #tog and #thetag too', tags: utils.getTags('Poe with #tog and #thetag too')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #othertag', tags: utils.getTags('Poe with #othertag')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #thetag too', tags: utils.getTags('Poe with #thetag too')})).save()
      ]).then((poesSaved) => {
        return chai.request(app)
          .get('/api/poe/tag/thetag?page=1&limit=2')
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poes');
        expect(res.body.data.poes).to.be.an('array').that.to.have.lengthOf(2);
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(3);
        expect(res.body.pagination.page).to.equal(1);
        expect(res.body.pagination.limit).to.equal(2);
        done();
      }).catch(done);
    });

    it('GET api/poe/tag/:tag => w/ page=1&limit=2 => return 200 with 1 poes', function(done){
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe with #thetag', tags: utils.getTags('Poe with #thetag')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #tog and #thetag too', tags: utils.getTags('Poe with #tog and #thetag too')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #othertag', tags: utils.getTags('Poe with #othertag')})).save(),
        (new Poe({ user: user._id, text: 'Poe with #thetag too', tags: utils.getTags('Poe with #thetag too')})).save()
      ]).then((poesSaved) => {
        return chai.request(app)
          .get('/api/poe/tag/thetag?page=2&limit=2')
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poes');
        expect(res.body.data.poes).to.be.an('array').that.to.have.lengthOf(1);
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(3);
        expect(res.body.pagination.page).to.equal(2);
        expect(res.body.pagination.limit).to.equal(2);
        done();
      }).catch(done);
    });
  });

  describe('# getLiteByText', function(){
    it('GET api/poe/text/:text => w/o pagination => return 200 with 3 poes (and pagination)', function(done){
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe with a text'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a some text for test'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a text for people'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a text for the universe'})).save()
      ]).then((poesSaved) => {
        return chai.request(app)
          .get('/api/poe/text/with a text')
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poes');
        expect(res.body.data.poes).to.be.an('array').that.to.have.lengthOf(3);
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(3);
        done();
      }).catch(done);
    });

    it('GET api/poe/text/:text => w/ page=1&limit=2 => return 200 with 2 poes', function(done){
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe with a text'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a some text for test'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a text for people'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a text for the universe'})).save()
      ]).then((poesSaved) => {
        return chai.request(app)
          .get('/api/poe/text/with a text?page=1&limit=2')
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poes');
        expect(res.body.data.poes).to.be.an('array').that.to.have.lengthOf(2);
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(3);
        expect(res.body.pagination.page).to.equal(1);
        expect(res.body.pagination.limit).to.equal(2);
        done();
      }).catch(done);
    });

    it('GET api/poe/text/:text => w/ page=2&limit=2 => return 200 with 1 poes', function(done){
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe with a text'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a some text for test'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a text for people'})).save(),
        (new Poe({ user: user._id, text: 'Poe with a text for the universe'})).save()
      ]).then((poesSaved) => {
        return chai.request(app)
          .get('/api/poe/text/with a text?page=2&limit=2')
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poes');
        expect(res.body.data.poes).to.be.an('array').that.to.have.lengthOf(1);
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(3);
        expect(res.body.pagination.page).to.equal(2);
        expect(res.body.pagination.limit).to.equal(2);
        done();
      }).catch(done);
    });
  });

  describe('# like', function(){
    it('POST api/poe/like/:poeId => return 404 (poe not exist)', function(done){
      const id = mongoose.Types.ObjectId();
      chai.request(app)
        .post(`/api/poe/like/${id.toString()}`)
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(404);
          done();
        }).catch((err) => {
          expect(err).to.have.status(404);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(404);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Poe not found');
          done();
        }).catch(done);
    });

    it('POST api/poe/like/:poeId => return 404 (poe is deleted)', function(done){
      (new Poe({
        user: user._id,
        text: 'Poe text',
        deleted: true
      })).save().then((poeSaved) => {
        return chai.request(app)
          .post(`/api/poe/like/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(404);
        done();
      }).catch((err) => {
        expect(err).to.have.status(404);
        expect(err.response.body).to.include.all.keys('data', 'meta');
        expect(err.response.body.meta).to.include.all.keys('status', 'message');
        expect(err.response.body.meta.status).to.equal(404);
        expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
        expect(err.response.body.data).to.include.all.keys('message');
        expect(err.response.body.data.message).to.equal('Poe not found');
        done();
      }).catch(done);
    });

    it('POST api/poe/like/:poeId => return 201', function(done){
      let poeSaved;
      (new Poe({
        user: user._id,
        text: 'Poe text'
      })).save().then((_poeSaved) => {
        poeSaved = _poeSaved;
        return chai.request(app)
          .post(`/api/poe/like/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.include.all.keys('data', 'meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(201);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));
        expect(res.body.data).to.include.all.keys('poe', 'likes');
        expect(res.body.data.poe).not.to.be.undefined;
        expect(res.body.data.poe).not.to.be.null;
        expect(res.body.data.poe).not.to.be.empty;
        expect(res.body.data.poe._id.toString()).to.equal(poeSaved._id.toString());
        expect(res.body.data.likes).to.equal(1);

        return PoeLike.byUserAndPoe(user._id, poeSaved._id);
      }).then((poeLike) => {
        poeLike = poeLike.toObject();
        expect(poeLike).not.to.be.undefined;
        expect(poeLike).not.to.be.null;
        expect(poeLike).not.to.be.empty;
        expect(poeLike).to.include.all.keys('_id', 'poe', 'user');
        expect(poeLike.poe.toString()).to.equal(poeSaved._id.toString());
        expect(poeLike.user.toString()).to.equal(user._id.toString());

        done();

      }).catch(done);
    });

    it('POST api/poe/like/:poeId => return 200 (previously like it)', function(done){
      let poeSaved;
      (new Poe({
        user: user._id,
        text: 'Poe text'
      })).save().then((_poeSaved) => {
        poeSaved = _poeSaved;
        return (new PoeLike({poe: poeSaved._id, user: user._id})).save();
      }).then(() => {
        return chai.request(app)
          .post(`/api/poe/like/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poe', 'likes');
        expect(res.body.data.poe).not.to.be.undefined;
        expect(res.body.data.poe).not.to.be.null;
        expect(res.body.data.poe).not.to.be.empty;
        expect(res.body.data.poe._id.toString()).to.equal(poeSaved._id.toString());
        expect(res.body.data.likes).to.equal(1);

        return PoeLike.byUserAndPoe(user._id, poeSaved._id);
      }).then((poeLike) => {
        poeLike = poeLike.toObject();
        expect(poeLike).not.to.be.undefined;
        expect(poeLike).not.to.be.null;
        expect(poeLike).not.to.be.empty;
        expect(poeLike).to.include.all.keys('_id', 'poe', 'user');
        expect(poeLike.poe.toString()).to.equal(poeSaved._id.toString());
        expect(poeLike.user.toString()).to.equal(user._id.toString());

        done();

      }).catch(done);
    });
  });

  describe('# unlike', function(){
    it('POST api/poe/unlike/:poeId => return 404 (poe not exist)', function(done){
      const id = mongoose.Types.ObjectId();
      chai.request(app)
        .post(`/api/poe/unlike/${id.toString()}`)
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(404);
          done();
        }).catch((err) => {
          expect(err).to.have.status(404);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(404);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Poe not found');
          done();
        }).catch(done);
    });

    it('POST api/poe/unlike/:poeId => return 404 (poe is deleted)', function(done){
      (new Poe({
        user: user._id,
        text: 'Poe text',
        deleted: true
      })).save().then((poeSaved) => {
        return chai.request(app)
          .post(`/api/poe/unlike/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(404);
        done();
      }).catch((err) => {
        expect(err).to.have.status(404);
        expect(err.response.body).to.include.all.keys('data', 'meta');
        expect(err.response.body.meta).to.include.all.keys('status', 'message');
        expect(err.response.body.meta.status).to.equal(404);
        expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
        expect(err.response.body.data).to.include.all.keys('message');
        expect(err.response.body.data.message).to.equal('Poe not found');
        done();
      }).catch(done);
    });

    it('POST api/poe/unlike/:poeId => return 200', function(done){
      let poeSaved;
      (new Poe({
        user: user._id,
        text: 'Poe text'
      })).save().then((_poeSaved) => {
        poeSaved = _poeSaved;
        return (new PoeLike({poe: poeSaved._id, user: user._id})).save()
      }).then(() => {
        return chai.request(app)
          .post(`/api/poe/unlike/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poe', 'likes');
        expect(res.body.data.poe).not.to.be.undefined;
        expect(res.body.data.poe).not.to.be.null;
        expect(res.body.data.poe).not.to.be.empty;
        expect(res.body.data.poe._id.toString()).to.equal(poeSaved._id.toString());
        expect(res.body.data.likes).to.equal(0);

        done();

      }).catch(done);
    });

    it('POST api/poe/unlike/:poeId => return 200 (not like before)', function(done){
      let poeSaved;
      (new Poe({
        user: user._id,
        text: 'Poe text'
      })).save().then((_poeSaved) => {
        poeSaved = _poeSaved;
        return chai.request(app)
          .post(`/api/poe/unlike/${poeSaved._id.toString()}`)
          .set('Authorization', token);
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('data', 'meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('poe', 'likes');
        expect(res.body.data.poe).not.to.be.undefined;
        expect(res.body.data.poe).not.to.be.null;
        expect(res.body.data.poe).not.to.be.empty;
        expect(res.body.data.poe._id.toString()).to.equal(poeSaved._id.toString());
        expect(res.body.data.likes).to.equal(0);

        done();
      }).catch(done);
    });
  });

  describe('# categorize', function(){
    it('POST api/poe/categorize/:poeId/:categoryId => return 404 (poe not exist)', function(done){
      const id = mongoose.Types.ObjectId();
      const id2 = mongoose.Types.ObjectId();
      chai.request(app)
        .post(`/api/poe/categorize/${id.toString()}/${id2.toString()}`)
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(404);
          done();
        }).catch((err) => {
          expect(err).to.have.status(404);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(404);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Poe not found');
          done();
        }).catch(done);
    });

    it('POST api/poe/categorize/:poeId/:categoryId => return 404 (category not found)', function(done){
      const id = mongoose.Types.ObjectId();
      (new Poe({ user: user._id, text: 'Poe text' })).save().then((poeSaved) => {
        chai.request(app)
          .post(`/api/poe/categorize/${poeSaved._id.toString()}/${id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(404);
            done();
          }).catch((err) => {
            expect(err).to.have.status(404);
            expect(err.response.body).to.include.all.keys('data', 'meta');
            expect(err.response.body.meta).to.include.all.keys('status', 'message');
            expect(err.response.body.meta.status).to.equal(404);
            expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
            expect(err.response.body.data).to.include.all.keys('message');
            expect(err.response.body.data.message).to.equal('Category not found');
            done();
          }).catch(done);
      })
    });

    it('POST api/poe/categorize/:poeId/:categoryId => return 201 and has 1 category', function(done){
      let poeSaved, catSaved;
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe text' })).save(),
        (new Category({ slug: 'category1', 'description': 'Category 1' })).save()
      ]).then((saves) => {
        poeSaved = saves[0];
        catSaved = saves[1];
        chai.request(app)
          .post(`/api/poe/categorize/${poeSaved._id.toString()}/${catSaved._id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(201);
            expect(res.body).to.include.all.keys('data', 'meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(201);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));
            expect(res.body.data).to.include.all.keys('category');
            expect(res.body.data.category).to.include.all.keys('category', 'poe', '_id', 'times_count', 'times');
            expect(res.body.data.category.category.toString()).to.equal(catSaved._id.toString());
            expect(res.body.data.category.poe.toString()).to.equal(poeSaved._id.toString());
            expect(res.body.data.category.times_count).to.equal(1);
            expect(res.body.data.category.times).to.be.an('array').that.to.have.lengthOf(1);
            expect(res.body.data.category.times[0].toString()).to.equal(user._id.toString());
            done();
          }).catch(done);
      }).catch(done);
    });

    it('POST api/poe/categorize/:poeId/:categoryId => return 200 and has 1 category (previously categorize)', function(done){
      let poeSaved, catSaved;
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe text' })).save(),
        (new Category({ slug: 'category1', 'description': 'Category 1' })).save()
      ]).then((saves) => {
        poeSaved = saves[0];
        catSaved = saves[1];
        return (new CategoryPoe({ category: catSaved._id,
          poe: poeSaved._id, times: [user._id], times_count: 1 })).save();
      }).then(() => {
        chai.request(app)
          .post(`/api/poe/categorize/${poeSaved._id.toString()}/${catSaved._id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.include.all.keys('data', 'meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(200);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
            expect(res.body.data).to.include.all.keys('message');
            expect(res.body.data.message).to.equal('The user has already categorized this Poe');
            done();
          }).catch(done);
      }).catch(done);
    });

    it('POST api/poe/categorize/:poeId/:categoryId => return 201 and has 2 categories', function(done){
      let poeSaved, catSaved;
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe text' })).save(),
        (new Category({ slug: 'category1', 'description': 'Category 1' })).save()
      ]).then((saves) => {
        poeSaved = saves[0];
        catSaved = saves[1];
        const id = mongoose.Types.ObjectId();
        return (new CategoryPoe({ category: catSaved._id,
          poe: poeSaved._id, times: [id], times_count: 1 })).save();
      }).then((catPoe) => {
        chai.request(app)
          .post(`/api/poe/categorize/${poeSaved._id.toString()}/${catSaved._id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(201);
            expect(res.body).to.include.all.keys('data', 'meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(201);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));
            expect(res.body.data).to.include.all.keys('category');
            expect(res.body.data.category).to.include.all.keys('category', 'poe', '_id', 'times_count', 'times');
            expect(res.body.data.category.category.toString()).to.equal(catSaved._id.toString());
            expect(res.body.data.category.poe.toString()).to.equal(poeSaved._id.toString());
            expect(res.body.data.category.times_count).to.equal(2);
            expect(res.body.data.category.times).to.be.an('array').that.to.have.lengthOf(2);
            expect(res.body.data.category.times[1].toString()).to.equal(user._id.toString());
            done();
          }).catch(done);
      }).catch(done);
    });
  });

  describe('# uncategorize', function(){
    it('POST api/poe/uncategorize/:poeId => return 404 (poe not exist)', function(done){
      const id = mongoose.Types.ObjectId();
      chai.request(app)
        .post(`/api/poe/uncategorize/${id.toString()}`)
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(404);
          done();
        }).catch((err) => {
          expect(err).to.have.status(404);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(404);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Poe not found');
          done();
        }).catch(done);
    });

    it('POST api/poe/uncategorize/:poeId => return 200 (not categorize)', function(done){
      let poeSaved;
      (new Poe({ user: user._id, text: 'Poe text' })).save().then((poe) => {
        poeSaved = poe;
        chai.request(app)
          .post(`/api/poe/uncategorize/${poeSaved._id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.include.all.keys('data', 'meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(200);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
            expect(res.body.data).to.include.all.keys('message');
            expect(res.body.data.message).to.equal('The user has not categorized this Poe');
            done();
          }).catch(done);
      }).catch(done);
    });

    it('POST api/poe/uncategorize/:poeId => return 200 and is uncategorize', function(done){
      let poeSaved, catSaved;
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe text' })).save(),
        (new Category({ slug: 'category1', 'description': 'Category 1' })).save()
      ]).then((saves) => {
        poeSaved = saves[0];
        catSaved = saves[1];
        return (new CategoryPoe({ category: catSaved._id,
          poe: poeSaved._id, times: [user._id], times_count: 1 })).save();
      }).then(() => {
        chai.request(app)
          .post(`/api/poe/uncategorize/${poeSaved._id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.include.all.keys('meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(200);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));

            return CategoryPoe.find({ poe: poeSaved._id, times: user._id }).exec();

          }).then((catsSaved) => {
            expect(catsSaved).to.be.empty;
            done();
          }).catch(done);
      }).catch(done);
    });

    it('POST api/poe/uncategorize/:poeId => return 200 and has 1 category', function(done){
      const id = mongoose.Types.ObjectId();
      let poeSaved, catSaved;
      Promise.all([
        (new Poe({ user: user._id, text: 'Poe text' })).save(),
        (new Category({ slug: 'category1', 'description': 'Category 1' })).save()
      ]).then((saves) => {
        poeSaved = saves[0];
        catSaved = saves[1];
        return (new CategoryPoe({ category: catSaved._id,
          poe: poeSaved._id, times: [id, user._id], times_count: 2 })).save();
      }).then(() => {
        chai.request(app)
          .post(`/api/poe/uncategorize/${poeSaved._id.toString()}`)
          .set('Authorization', token)
          .then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.include.all.keys('meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(200);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));

            return CategoryPoe.find({ poe: poeSaved._id }).exec();

          }).then((catsSaved) => {
            expect(catsSaved).not.to.be.empty;
            expect(catsSaved).to.be.an('array').that.to.have.lengthOf(1);
            expect(catsSaved[0].times_count).to.equal(1);
            expect(catsSaved[0].times).to.be.an('array').that.to.have.lengthOf(1);
            expect(catsSaved[0].times[0].toString()).to.equal(id.toString());
            done();
          }).catch(done);
      }).catch(done);
    });
  });

  describe('# getMyPoeline', function(){

    it('GET api/poe/timeline?&num=10 => return 200', function(done){
      // crear 5 usuarios
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      let arrPromises = users.map((userToFollow) => {
        return (new User({
          user: userToFollow,
          email: `${userToFollow}@poesize.com`,
          password: userToFollow,
          birthdate: new Date('12/31/1983'),
          acceptTermsConditions: true,
          bio: `Awesome bio ${userToFollow}`,
          name: `Poesize ${userToFollow}`
        })).save();
      });
      Promise.all(arrPromises).then((usersSaved) => {
        // crear el poeline
        const poelineUser = new Poeline({ user: user._id, poeline: [] });
        let fav = false;
        poelineUser.poeline = usersSaved.map((userSaved) => {
          fav = !fav;
          return {
            user: userSaved._id,
            fromDate: Date.now() - 10000,
            fav: fav,
            silence: false,
            read: false,
            lastRead: Date.now() - 10000
          };
        });
        poelineUser.poeline[0].read = true;
        poelineUser.poeline[0].lastRead = Date.now();
        poelineUser.save().then((poelineSaved) => {
          //crearles poes a 4 de los 5 usuarios, incluyendo al leido
          arrPromises = [];
          const userToWritePoes = usersSaved.filter((u) => u.user != 'user4');
          userToWritePoes.forEach((userToWrite) => {
            for (var i = 0; i < 4; i++) {
              const poe = new Poe({
                user: userToWrite._id,
                text: `Poe number ${i} by user ${userToWrite.user}`
              })
              arrPromises.push(poe.save())
            }
          })
          Promise.all(arrPromises).then((poesSaved) => {
            chai.request(app)
              .get(`/api/poe/timeline?&num=10&fromDate=${Date.now() - 10000}`)
              .set('Authorization', token)
              .then((res) => {
                console.log('OK')
                expect(res).to.have.status(200);
                expect(res.body).not.to.be.undefined;
                expect(res.body).not.to.be.null;
                expect(res.body).to.be.an('object');
                expect(res.body).to.include.all.keys('data', 'meta');
                expect(res.body.meta).to.include.all.keys('status', 'message');
                expect(res.body.meta.status).to.equal(200);
                expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
                expect(res.body.data).to.include.all.keys('poeline');
                expect(res.body.data.poeline).to.be.an('array')
                  .that.to.have.lengthOf.within(1, 16);
                // revisar que de user1 no tenemos nada
                const ofUser1 = res.body.data.poeline.filter(p =>
                  p.user == usersSaved.find(u => u.user == 'user1')._id)
                expect(ofUser1).to.have.lengthOf(0)
                done();
              }).catch((err) => {
                console.log(err.response.error)
                done(err);
              }).catch(done);
          });
        });
      });
    });

    it('GET api/poe/timeline?&num=20 => return 200', function (done) {
      // crear 10 usuarios
      let arrPromises = []
      for (let i = 1; i <= 10; i++) {
        arrPromises.push((new User({
          user: `user${i}`,
          email: `user${i}@poesize.com`,
          password: `user${i}`,
          birthdate: new Date('12/31/1983'),
          acceptTermsConditions: true,
          bio: `Awesome bio user${i}`,
          name: `Poesize user${i}`
        })).save())
      }
      Promise.all(arrPromises).then((usersSaved) => {
        // crear el poeline
        const poelineUser = new Poeline({ user: user._id, poeline: [] });
        let fav = false;
        poelineUser.poeline = usersSaved.map((userSaved) => {
          fav = !fav;
          return {
            user: userSaved._id,
            fromDate: Date.now() - 10000,
            fav: fav,
            silence: false,
            read: false,
            lastRead: Date.now() - 10000
          };
        });
        // marcamos user2 y user6 como leidos
        const user2 = poelineUser.poeline[1].user
        poelineUser.poeline[1].read = true;
        poelineUser.poeline[1].lastRead = Date.now();
        const user6 = poelineUser.poeline[5].user
        poelineUser.poeline[5].read = true;
        poelineUser.poeline[5].lastRead = Date.now();
        poelineUser.save().then((poelineSaved) => {
          //crearles poes a 7 de los 10 usuarios, incluyendo al leido
          arrPromises = [];
          const userToWritePoes = usersSaved.filter((u) =>
            u.user != 'user4' && u.user != 'user5' && u.user != 'user6');
          userToWritePoes.forEach((userToWrite) => {
            for (var i = 0; i < 4; i++) {
              const poe = new Poe({
                user: userToWrite._id,
                text: `Poe number ${i} by user ${userToWrite.user}`
              })
              arrPromises.push(poe.save())
            }
          })
          Promise.all(arrPromises).then((poesSaved) => {
            return chai.request(app)
              .get(`/api/poe/timeline?&num=20&fromDate=${Date.now() - 10000}`)
              .set('Authorization', token)
          }).then((res) => {
            expect(res).to.have.status(200);
            expect(res.body).not.to.be.undefined;
            expect(res.body).not.to.be.null;
            expect(res.body).to.be.an('object');
            expect(res.body).to.include.all.keys('data', 'meta');
            expect(res.body.meta).to.include.all.keys('status', 'message');
            expect(res.body.meta.status).to.equal(200);
            expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
            expect(res.body.data).to.include.all.keys('poeline');
            expect(res.body.data.poeline).to.be.an('array')
              .that.to.have.lengthOf.within(1, 28);
            // revisar que de user1 no tenemos nada
            const ofUser2 = res.body.data.poeline.filter(p => p.user == user2)
            expect(ofUser2).to.have.lengthOf(0)
            const ofUser6 = res.body.data.poeline.filter(p => p.user == user6)
            expect(ofUser6).to.have.lengthOf(0)
            done();
          }).catch((err) => {
            console.log(err.response.error)
            done(err);
          })
        });
      });
    });

  });

  describe('# getCategories', function () {
    it('GET api/poe/categories/:poeId => return 200', function (done) {
      const idPoe1 = mongoose.Types.ObjectId()
      const idPoe2 = mongoose.Types.ObjectId()
      // crear 5 categorías
      const categories =
        ['category1', 'category2', 'category3', 'category4', 'category5'];
      let arrPromises = categories.map((cat) =>
        (new Category({ slug: cat, description: cat })).save());

      Promise.all(arrPromises).then((catsSaved) => {
        // crear 3 CategoryPoe para un poe, y 3 para otro poe
        arrPromises = [
          new CategoryPoe({ category: catsSaved[0], poe: idPoe1 }).save(),
          new CategoryPoe({ category: catsSaved[1], poe: idPoe1 }).save(),
          new CategoryPoe({ category: catsSaved[2], poe: idPoe1 }).save(),
          new CategoryPoe({ category: catsSaved[3], poe: idPoe2 }).save(),
          new CategoryPoe({ category: catsSaved[4], poe: idPoe2 }).save(),
          new CategoryPoe({ category: catsSaved[0], poe: idPoe2 }).save()
        ]

        return Promise.all(arrPromises)
      }).then((categoryPoesSaved) => {
        return chai.request(app)
          .get(`/api/poe/categories/${idPoe1.toString()}`)
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).not.to.be.undefined;
        expect(res.body).not.to.be.null;
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.all.keys('data', 'meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.data).to.include.all.keys('categories');
        expect(res.body.data.categories).to.be.an('array').that.to.have.lengthOf(3);
        res.body.data.categories.forEach((cat) => {
          expect(cat).to.include.all.keys('category', 'poe', 'times', 'times_count');
          expect(cat.poe.toString()).to.equal(idPoe1.toString())
          expect(['category1', 'category2', 'category3'])
            .include(cat.category.slug)
        })

        done();
      }).catch(done);
    });
  })

  describe('# getPoelineUser', function () {
    it('GET api/poe/timeline/:user?limit=3 => return 200', function (done) {
      // crear 5 poes
      const poes =
        ['poe1', 'poe2', 'poe3', 'poe4', 'poe5'];
      let arrPromises = poes.map((poeText) =>
        (new Poe({ user: user._id, text: poeText })).save());
      let poesSaved = []

      Promise.all(arrPromises).then((_poesSaved) => {
        poesSaved = _poesSaved
        return chai.request(app)
          .get(`/api/poe/timeline/${user.user}?limit=3`)
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).not.to.be.undefined;
        expect(res.body).not.to.be.null;
        expect(res.body).to.be.an('object');
        expect(res.body).to.include.all.keys('data', 'meta', 'pagination');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        expect(res.body.pagination).to.include.all.keys('total_count', 'limit', 'page');
        expect(res.body.pagination.total_count).to.equal(5);
        expect(res.body.pagination.limit).to.equal(3);
        expect(res.body.data).to.include.all.keys('poeline');
        expect(res.body.data.poeline).to.be.an('array').that.to.have.lengthOf(3);
        res.body.data.poeline.forEach((poe) => {
          expect(poe.user._id.toString()).to.equal(user._id.toString())
          expect(['poe1', 'poe2', 'poe3', 'poe4', 'poe5']).include(poe.text)
        })

        done();
      }).catch(done);
    });
  })

});



function deleteData(){
	return Promise.all([
    Poe.remove({}).exec(),
    User.remove({}).exec(),
    Category.remove({}).exec(),
    CategoryPoe.remove({}).exec(),
    Poeline.remove({}).exec(),
    PoeLike.remove({}).exec(),
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
