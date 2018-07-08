'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const conn = require('../../src/db.conn');
const config = require('../../src/config');
const app = require('../../src/app');
const Category = require('../../src/models/category');
const User = require('../../src/models/user');
const CategoryPoe = require('../../src/models/category-poe');
const ProposedCategory = require('../../src/models/proposed-category');
const utils = require('../../src/services/utils');
const tokenService = require('../../src/services/token');

chai.use(chaiHttp);

const categoriesToCreate = [
	{ slug: 'cat1', description: 'Category 1' },
  { slug: 'cat2', description: 'Category 2' },
  { slug: 'othercat2', description: 'Other Category 2' },
  { slug: 'cat3', description: 'Category 3' }
];
const userToCreate = {
  user: 'poesize',
  email: 'poesize@poesize.com',
  active: true
}

describe('# Category', function(){
  var token, user;

	before(function(done) {
    conn.open().then(() => {
      return User.find({user: userToCreate.user}).remove().exec();
    }).then(() => {
      return (new User(userToCreate)).save();
    }).then((saved) => {
      user = saved;
      const userToken = {
        _id: user._id,
        user: user.user
      };
      token = tokenService.createToken(userToken);
      done();
    }).catch(done);
  });

  after(function(done){
    deleteCategories().then(() => conn.close())
    	.then(() => done()).catch(done);
  });

  beforeEach(function(done) {
  	deleteCategories().then(insertCategories).then(() => done()).catch(done);
  });

  describe('# By Text', function(){

    it(`GET /api/category/text/1 => with authorization incorrect => response 403`, function(done){

      chai.request(app)
        .get('/api/category/text/1')
        .set('Authorization', 'incorrect-token')
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Not authorized');
          done();
        }).catch(done);
    });

    it('GET /api/category/text/1 => w/o authorization header => response 403', function(done){
      chai.request(app)
        .get('/api/category/text/1')
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Not authorized');
          done();
        }).catch(done);
    });

    it(`GET '/api/category/text/2' => return 2 colors`, function(done){
      chai.request(app)
        .get('/api/category/text/2')
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
          expect(res.body.data).to.include.all.keys('categories');
          expect(res.body.data.categories).to.be.an('array').that.to.have.lengthOf(2);
          res.body.data.categories.forEach((category) => {
            expect(category).to.include.all.keys('slug', 'description');
            expect(['cat2', 'othercat2']).to.include(category.slug);
            expect(['Category 2', 'Other Category 2']).to.include(category.description);
          });
          done();
        })
        .catch((err) => {
           done(err);
        });
    });

    it(`GET '/api/category/text/nocolor' => return 0 colors`, function(done){
      chai.request(app)
        .get('/api/category/text/nocolor')
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
          expect(res.body.data).to.include.all.keys('categories');
          expect(res.body.data.categories).to.be.an('array').that.to.be.empty;
          done();
        })
        .catch((err) => {
           done(err);
        });
    });
  });

  describe('# By Slug', function(){

    it(`GET /api/category/slug/cat1 => with authorization incorrect => response 403`, function(done){

      chai.request(app)
        .get('/api/category/slug/cat1')
        .set('Authorization', 'incorrect-token')
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Not authorized');
          done();
        }).catch(done);
    });

    it('GET /api/category/slug/cat1 => w/o authorization header => response 403', function(done){
      chai.request(app)
        .get('/api/category/slug/cat1')
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Not authorized');
          done();
        }).catch(done);
    });

    it(`GET '/api/category/slug/cat2' => return 'cat2' color`, function(done){
      chai.request(app)
        .get('/api/category/slug/cat2')
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
          expect(res.body.data).to.include.all.keys('category');
          expect(res.body.data.category).to.be.an('object');
          expect(res.body.data.category).to.include.all.keys('slug', 'description');
          expect(res.body.data.category.slug).to.equal('cat2');
          expect(res.body.data.category.description).to.equal('Category 2');

          done();
        })
        .catch((err) => {
           done(err);
        });
    });

    it(`GET '/api/category/slug/nocolor' => return 0 colors`, function(done){
      chai.request(app)
        .get('/api/category/slug/nocolor')
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
          expect(res.body.data).to.include.all.keys('category');
          expect(res.body.data.category).to.be.null;
          done();
        })
        .catch((err) => {
           done(err);
        });
    });
  });

  describe('# Proposed', function(){

    it('POST /api/category/propose/newcategory => w/o authorization header => response 403', function(done){
      chai.request(app)
        .post('/api/category/propose/newcategory')
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Not authorized');
          done();
        }).catch(done);
    });

    it(`POST /api/category/propose/newcategory => with authorization incorrect => response 403`, function(done){

      chai.request(app)
        .post('/api/category/propose/newcategory')
        .set('Authorization', 'incorrect-token')
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('Not authorized');
          done();
        }).catch(done);
    });

    it(`POST /api/category/propose/New Category => response 201 and proposedCategory`, function(done){
      chai.request(app)
        .post('/api/category/propose/New Category')
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(201);
          expect(res.body).not.to.be.undefined;
          expect(res.body).not.to.be.null;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys('data', 'meta');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(201);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));
          expect(res.body.data).to.include.all.keys('proposedCategory');
          expect(res.body.data.proposedCategory).to.be.an('object');
          expect(res.body.data.proposedCategory).to.include.all.keys('_id', 'slug', 'description', 'user', 'date');
          const { proposedCategory } = res.body.data;
          expect(proposedCategory.description).to.equal('New Category');
          expect(proposedCategory.slug).to.equal(utils.slugify(proposedCategory.description).toLowerCase());
          expect(proposedCategory.user.toString()).to.equal(user._id.toString());
          done();
        }).catch(done);
    });

    it(`POST /api/category/propose/${categoriesToCreate[0].description} => response 200 and no body (exist)`, function(done){
      chai.request(app)
        .post(`/api/category/propose/${categoriesToCreate[0].description}`)
        .set('Authorization', token)
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body).not.to.be.undefined;
          expect(res.body).not.to.be.null;
          expect(res.body).to.be.an('object');
          expect(res.body).to.include.all.keys('meta');
          expect(res.body).not.to.include.keys('data');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(200);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
          done();
        }).catch(done);
    });
  });

  describe('# Get Trends', function(){
    it(`GET /api/category/trends?limit=5 => response 4 trends categories`, function(done){
      Category.find({}).then((cats) => {
        const cpoes = [];
        var c = 0;
        for (var i = 1; i <= 15; i++) {
          cpoes.push(new CategoryPoe({
            times_count: i * 3,
            category: cats[c]._id
          }));
          c += 1;
          if(c == cats.length) c = 0;
        }
        const arr = cpoes.map(c => c.save());

        Promise.all(arr).then(() => {
          CategoryPoe.find({}).exec().then((allCategories) => {
            //grouped categories by times_count

            var grouped = cats.reduce((prev, now, index) => {
              prev[now._id.toString()] = allCategories
                .filter(c => c.category.toString() == now._id.toString())
                .map(c => c.times_count)
                .reduce((p, n) => (p + n), 0);
              return prev;
            }, {});

            chai.request(app)
              .get('/api/category/trends')
              .query({limit: 5})
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
                expect(res.body.data).to.include.all.keys('categories');
                expect(res.body.data.categories).to.be.an('array').that.to.have.lengthOf(cats.length);
                for (var i = 0; i < cats.length; i++) {
                  const catPoe = res.body.data.categories[i];
                  expect(catPoe).to.include.all.keys('times_count', '_id', 'category');
                  expect(catPoe.category).to.be.an('object').that.not.to.be.empty;
                  expect(catPoe.category).to.include.all.keys('slug', '_id', 'description');
                  expect(catPoe.times_count).to.equal(grouped[catPoe._id.toString()]);
                }
                done();
              }).catch(done);
          });
        });
      });
    });

    it(`GET /api/category/trends?limit=2 => response 2 trends categories (but categories > 2)`, function(done){
      Category.find({}).then((cats) => {
        const cpoes = [];
        var c = 0;
        for (var i = 1; i <= 15; i++) {
          cpoes.push(new CategoryPoe({
            times_count: i * 3,
            category: cats[c]._id
          }));
          c += 1;
          if(c == cats.length) c = 0;
        }
        const arr = cpoes.map(c => c.save());

        Promise.all(arr).then(() => {
          CategoryPoe.find({}).exec().then((allCategories) => {
            //grouped categories by times_count

            var grouped = cats.reduce((prev, now, index) => {
              prev[now._id.toString()] = allCategories
                                          .filter(c => c.category.toString() == now._id.toString())
                                          .map(c => c.times_count)
                                          .reduce((p, n) => (p + n), 0);
              return prev;
            }, {});

            chai.request(app)
              .get('/api/category/trends')
              .query({limit: 2})
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
                expect(res.body.data).to.include.all.keys('categories');
                expect(res.body.data.categories).to.be.an('array').that.to.have.lengthOf(2);
                for (var i = 0; i < 2; i++) {
                  const catPoe = res.body.data.categories[i];
                  expect(catPoe).to.include.all.keys('times_count', '_id', 'category');
                  expect(catPoe.category).to.be.an('object').that.not.to.be.empty;
                  expect(catPoe.category).to.include.all.keys('slug', '_id', 'description');
                  expect(catPoe.times_count).to.equal(grouped[catPoe._id.toString()]);
                }
                done();
              }).catch(done);
          });
        });
      });
    });
  });
});

function deleteCategories(){
  return Promise.all([
    CategoryPoe.remove({}).exec(),
    Category.remove({}).exec()
  ]);
}

function insertCategories(){
	return utils.saveAll(categoriesToCreate.map(category => new Category(category)))
}
