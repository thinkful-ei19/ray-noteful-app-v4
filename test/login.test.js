'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI, JWT_SECRET } = require('../config');

const User = require('../models/user');

const seedUsers = require('../db/seed/users');

const expect = chai.expect;
chai.use(chaiHttp);

describe.only('Noteful API - Login', function() {
  let token;
  const fullname = 'Example User';
  const username = 'exampleUser';
  const password = 'examplePass';

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });
  
  beforeEach(function() {
    return User.hashPassword(password)
      .then(digest => {
        User.create({
          username,
          password: digest,
          fullname,
      })
    });
  });

  afterEach(function () {
    return User.remove();
    // alternatively you can drop the DB
    // return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('/api/login', function() {
    it('Should return a valid auth token', function() {
      return chai
        .request(app)
        .post('/api/login')
        .send({
          username,
          password,
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');

          const payload = jwt.verify(res.body.authToken, JWT_SECRET);
          
          expect(payload.user).to.not.have.property('password');
          expect(payload.user).to.have.keys('id', 'username', 'fullname');
          expect(payload.user.username).to.deep.equal(username);
          expect(payload.user.fullname).to.deep.equal(fullname);
        });
    });

    it('Should reject requests with no credentials', function() {
      return chai
        .request(app)
        .post('/api/login')
        .send({})
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if(err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(400);
        });
    });

    it('Should reject requests with incorrect usernames', function() {
      return chai
        .request(app)
        .post('/api/login')
        .send({
          username: 'incorrectUsername',
          password
        })
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if(err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        })
    });

    it('Should reject requests with incorrect passwords', function() {
      return chai
        .request(app)
        .post('/api/login')
        .send({
          username,
          password: 'incorrectPassword'
        })
        .then(() =>
          expect.fail(null, null, 'Request should not succeed')
        )
        .catch(err => {
          if(err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
        });
    });
  });
});

