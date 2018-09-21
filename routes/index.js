var express = require('express');
var router = express.Router();
var session = require('express-session');
var Person = require('../model/Person');
var Registration = require('../model/Registration');
var db = require('../model/db');
var moment = require("moment-timezone");
var authentication = require('../authentication');

/* GET home page. */
router.get('/', function (req, res, next) {
	res.redirect('/security/login');
});

router.get('/index', authentication.authenticate, function (req, res, next) {
	res.render('index', {
		title: 'Express',
		logged_in_id: req.session.logged_in_id,
		admin: req.session.admin,
		indexPage: true
	});
});

router.get('/index/status', authentication.authenticateApi, function (req, res, next) {
	Person.findById(req.session.logged_in_id)
		.then(person => {
			if (person == null) {
				res.send('User not logged in.');
				return;
			} else {
				Registration.findAll({
					where: {
						PersonID: req.session.logged_in_id,
					},
					order: [
						['TimeIn', 'DESC']
					],
					limit: 1
				}).then(registrations => {
					console.log('registrations.length', registrations.length);
					if (registrations.length == 0) {
						res.send({status: person.Name + ', you are currently clocked out.'});
						return;
					}
					var r = registrations[0];
					if (r.TimeOut == null) {
						res.send({status: person.Name + ", you clocked in at " + moment(r.TimeIn).format("YYYY-MMM-DD HH:mm:ss") + "."});
						return;
					} else {
						res.send({status: person.Name + ', you clocked out at ' + moment(r.TimeOut).format("YYYY-MMM-DD HH:mm:ss") + "."});
						return;
					}
				});

			}
		});
});

module.exports = router;
