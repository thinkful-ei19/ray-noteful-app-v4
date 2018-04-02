'use strict';

const passport = require('passport');
const {Strategy: LocalStrategy} = require('passport-local');

const User = require('../models/user');

const localStrategy = new LocalStrategy((username, password, done) => {
  let user;
  User
    .findOne({ username })
    .then(results => {
    user = results;
    if (!user) {
      // Removed for brevity
    }
      return user.validatePassword(password);
    })
    .then(isValid => {
      if (!isValid) {
        // Removed for brevity
      }
      return done(null, user);
    })
    .catch(err => {
      // Removed for brevity
    });
});

module.exports = localStrategy;
