'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const conn = require('../../src/db.conn');
const config = require('../../src/config');
const app = require('../../src/app');
const Color = require('../../src/models/color');
const utils = require('../../src/services/utils');

chai.use(chaiHttp);

const coloresaCrear = [
	{ color: '#FF00DB', slug: 'purple', description: 'Púrpura' },
	{ color: '#00FFEC', slug: 'cyan', description: 'Celeste'	},
	{ color: '#FFA500', slug: 'orange', description: 'Naranja'	}
];

describe('# Color', function(){

	before(function(done) {
    conn.open().then(() => done()).catch(done);
  });

  after(function(done){
    deleteColors().then(() => conn.close())
    	.then(() => done()).catch(done);
  });

  beforeEach(function(done) {
  	deleteColors().then(insertColors).then(() => done()).catch(done);
  });

	it(`GET /api/color => has ${coloresaCrear.length} colors`, function(done){

		chai.request(app)
			.get('/api/color')
			.then((res) => {
		    expect(res).to.have.status(200);
		    expect(res.body).not.to.be.undefined;
		    expect(res.body).not.to.be.null;
		    expect(res.body).to.be.an('object');
				expect(res.body).to.include.all.keys('data', 'meta');
				expect(res.body.meta).to.include.all.keys('status', 'message');
				expect(res.body.meta.status).to.equal(200);
				expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
				expect(res.body.data).to.include.all.keys('colors');
		    expect(res.body.data.colors).to.be.an('array').that.to.have.lengthOf(coloresaCrear.length);
		    res.body.data.colors.forEach((color) => {
					expect(color).to.include.all.keys('color', 'slug', 'description');
					expect(coloresaCrear.map(c => c.color)).to.include(color.color);
					expect(coloresaCrear.map(c => c.slug)).to.include(color.slug);
					expect(coloresaCrear.map(c => c.description)).to.include(color.description);
		    });
		    done();
		  })
		  .catch((err) => {
		     done(err);
		  });
	});

	it('POST /api/color => w/o authorization header => response 403', function(done){
		chai.request(app)
			.post('/api/color')
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

	it('POST /api/color => with authorization incorrect => response 403', function(done){
		chai.request(app)
			.post('/api/color')
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

	it('POST /api/color => w/o body => response 400', function(done){
		chai.request(app)
			.post('/api/color')
			.set('Authorization', config.ADMIN_TOKEN)
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

	it(`POST /api/color => with colors => response 200 and has the ${coloresaCrear.length} colors saved`, function(done){
		deleteColors().then(() => {
			return chai.request(app)
				.post('/api/color')
				.set('Authorization', config.ADMIN_TOKEN)
				.send({ colors: coloresaCrear })
		}).then((res) => {
	    expect(res).to.have.status(201);
	    return Color.all();
	  }).then((colors) => {
	  	expect(colors).to.be.an('array').that.to.have.lengthOf(coloresaCrear.length);
	    colors.forEach((color) => {
				expect(color).to.include.all.keys('color', 'slug', 'description');
				expect(coloresaCrear.map(c => c.color)).to.include(color.color);
				expect(coloresaCrear.map(c => c.slug)).to.include(color.slug);
				expect(coloresaCrear.map(c => c.description)).to.include(color.description);
	    });
	    done();
	  }).catch(done);
	});

	it('DELETE /api/color => w/o authorization header => response 403', function(done){
		chai.request(app)
			.delete('/api/color/orange')
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

	it('DELETE /api/color => with authorization incorrect => response 403', function(done){
		chai.request(app)
			.delete('/api/color/orange')
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

	it('DELETE /api/color => with incorrect color => response 404', function(done){
		chai.request(app)
			.delete('/api/color/___colornotfound___')
			.set('Authorization', config.ADMIN_TOKEN)
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
				expect(err.response.body.data.message).to.equal('Color not found');
		    done();
		  }).catch(done);
	});

	it(`DELETE /api/color => with color => response 200 and removed 'orange' color`, function(done){
		Color.find({}).lean().exec().then((colors) => {
	    expect(colors).to.be.an('array').that.to.have.lengthOf(coloresaCrear.length);
	    const colorOrange = colors.find(c => c.slug == 'orange');
	    expect(colorOrange).not.to.be.null;
	    expect(colorOrange).not.to.be.undefined;
	    expect(colorOrange.color).to.equal('#FFA500');

	    chai.request(app)
				.delete('/api/color/orange')
				.set('Authorization', config.ADMIN_TOKEN)
				.then((res) => {
			    expect(res).to.have.status(200);
			    expect(res.body).not.to.be.null;
			    expect(res.body).not.to.be.undefined;
			    expect(res.body).to.be.an('object');
					expect(res.body).to.include.all.keys('meta');
					expect(res.body.meta).to.include.all.keys('status', 'message');
					expect(res.body.meta.status).to.equal(200);
					expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
					Color.find({}).lean().exec().then((colors) => {
				    expect(colors).to.be.an('array').that.to.have.lengthOf(coloresaCrear.length - 1);
				    const colorOrange = colors.find(c => c.slug == 'orange');
				    expect(colorOrange).to.be.undefined;
			    	done();
					});
			  }).catch(done);

		});

	});
});

function deleteColors(){
	return Color.remove({}).exec();
}

function insertColors(){
	return utils.saveAll(coloresaCrear.map(color => new Color(color)))
}
