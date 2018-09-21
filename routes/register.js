'use strict';

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();
var Person = require('../model/Person');
var Registration = require('../model/Registration');
var db = require('../model/db');
var moment = require("moment-timezone");
var authentication = require('../authentication');

router.post('/signin', authentication.authenticateApi, function (req, res, next) {
	Person.findById(req.session.logged_in_id)
		.then(person => {
			if (person == null) {
				res.status(401).send('User not logged in.');
			} else {
				Registration.findAll({
					where: {
						PersonID: person.ID,
						TimeOut: {
							[db.Op.eq]: null
						}
					}
				}).then(registrations => {
					if (registrations.length > 0) {
						res.status(403).send("You are already clocked in.");
						return;
					} else {
						Registration.create({
							TimeIn: moment(),
							PersonID: person.ID
						});
						res.send(person.Name + ' successfully clocked in.');
					}
				});

			}
		});
});

router.post('/signout', authentication.authenticateApi, function (req, res, next) {
	Person.findById(req.session.logged_in_id)
		.then(person => {
			if (person == null) {
				res.status(401).send('You are not logged in.');
				return;
			} else {
				Registration.findAll({
					where: {
						PersonID: person.ID,
						TimeOut: {
							[db.Op.eq]: null
						}
					}
				}).then(registrations => {
					if (registrations.length == 0) {
						res.status(403).send("You are not clocked in.");
						return;
					}
					var registration = registrations[0];
					registration.TimeOut = moment();
					registration.save();
					res.send(person.Name + ' successfully clocked out.');
				});
			}
		});
});

module.exports = router;
