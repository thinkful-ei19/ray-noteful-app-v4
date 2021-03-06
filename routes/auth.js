'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const {JWT_SECRET, JWT_EXPIRY} = require('../config');
const jwt = require('jsonwebtoken');

const options = {session: false, failWithError: true};

//Checking username and password  
const localAuth = passport.authenticate('local', options);

const createAuthToken = function (user) {
  return jwt.sign({ user }, JWT_SECRET, {
    subject: user.username,
    expiresIn: JWT_EXPIRY
  });
};

//Protected endpoint
router.post('/login', localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

//Using passport library method .authenticate to protect endpoint
const jwtAuth = passport.authenticate('jwt', { session: false, failWithError: true });

router.post('/refresh', jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = router;
