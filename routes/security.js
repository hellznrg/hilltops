'use strict';

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();
var Person = require('../model/Person');
var session = require('express-session');
var authentication = require('../authentication');

router.get('/ping', async function (req, res, next) {
	var person = await Person.findById(req.session.logged_in_id);

	if (person === null) {
		res.status(403).send('Authentication expired.');
	} else {
		res.send("Authenticated.");
	}
});

router.get('/login', function (req, res, next) {
	req.session.destroy(function (err) {
	});
	res.render('login');
});

router.post('/login/:id', function (req, res, next) {
	Person.findById(req.params.id)
		.then(person => {
			if (person === null) {
				req.session.destroy(function (err) {
					res.status(403).send('Unknown user.');
				});
			} else if (!person.Active) {
				req.session.destroy(function (err) {
					res.status(403).send('Account disabled.');
				});
			} else if (person.Passcode != req.body.Passcode) {
				req.session.destroy(function (err) {
					res.status(403).send('Incorrect password.');
				});
			} else {
				req.session.regenerate(function (err) {
					req.session.logged_in_id = req.params.id;
					req.session.admin = person.Admin;
					res.send({Redirect: '/index'});
				});
			}
		});
});

router.get('/changePin', authentication.authenticate, function (req, res, next) {
	res.render('change_pin');
});

router.post('/changepin/:id', authentication.authenticateApi, function (req, res, next) {
	Person.findById(req.params.id)
		.then(person => {
			if (person === null || person.Passcode != req.body.OldPin) {
				req.session.destroy(function (err) {
					res.status(403).send('Login failed.');
				});
			} else {
				person.Passcode = req.body.NewPin;
				person.save().then(() => {
					res.send({Redirect: '/index'});
				});
			}
		});
});

module.exports = router;
