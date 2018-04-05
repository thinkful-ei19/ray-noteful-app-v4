'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const User = require('../models/user');


// POST/Create a user
router.post('/users', (req,res,next) => {
  
  //Validate username and password are required
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));
  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: `${missingField}`
    });
    // const err = new Error(`Missing ${missingField} in request body`);
    // err.status = 422;
    // return next(err);
  }

  //Validate fields are type string
  const stringFields = ['fullname', 'username', 'password'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );
  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  //Validate username and password have no trailing whitespace & endpoint should NOT automatically trim the values
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );
  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  //Validate username min of 1 character
  //Validate password min of 8 and max of 72 characters
  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      // bcrypt truncates after 72 characters, so let's not give the illusion
      // of security by storing extra (unused) info
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  const {fullname, username, password} = req.body;

  return User.hashPassword(password)
  .then(digest => {
    const newUser = {
      username,
      password: digest,
      fullname
    };
    return User.create(newUser);
  })
  .then(result => {
    return res.status(201).location(`/api/users/${result.id}`).json(result);
  })
  .catch(err => {
    if (err.code === 11000) {
      err = new Error('The username already exists');
      err.status = 400;
    }
    next(err);
  });
});

module.exports = router;
