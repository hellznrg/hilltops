'use strict';

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();
var Person = require('../model/Person');
var Registration = require('../model/Registration');
var Task = require('../model/Task');
var TaskAssignment = require('../model/TaskAssignment');
var TaskSchedule = require('../model/TaskSchedule');
var TaskCompletion = require('../model/TaskCompletion');
var TaskDataField = require('../model/TaskDataField');
var TaskData = require('../model/TaskData');
var db = require('../model/db');
var moment = require("moment-timezone");
var authentication = require('../authentication');
var stream = require('stream');

router.get('/', authentication.authenticate, function (req, res, next) {
	res.render('admin');
});

router.get('/timesheet', authentication.authenticate, function (req, res, next) {
	Person.findAll({
		attributes: ['ID', 'Name']
	}).then(workers => {
		res.render('admin/timesheet', {workers: workers, admin: req.session.admin});
	});
});

const TIMESHEET_HEADER_ROW = ['ID', 'Name', 'Job title', 'Date', 'Start time', 'End time', 'Worked (hours)', 'Breaks (hours)'];

router.get('/timesheet/worker/:id', authentication.authenticateApi, async function (req, res, next) {
	var output = {};
	output.HeaderRow = TIMESHEET_HEADER_ROW;

	try {
		output.DataRows = await getTimesheet(req.params.id, req.query.FromDate, req.query.ToDate);
	} catch (error) {
		console.log('error', error);
	}

	res.send(output);
});

router.get('/timesheet/csv', authentication.authenticate, async function (req, res, next) {
	console.log('test', 'test');
	var output = [TIMESHEET_HEADER_ROW];
	var persons = await Person.findAll({
		raw: true
	});

	console.log('persons', persons);

	for (var cp of persons) {
		output = output.concat(await getTimesheet(cp.ID, "", "", "csv"));
	}

	output = output.join('\n');

	console.log('csv', output);

	var readStream = new stream.PassThrough();
	readStream.end(output);

	res.set('Content-disposition', 'attachment; filename=timesheet.csv');
	res.set('Content-type', 'text/csv');

	readStream.pipe(res);
});

async function getTimesheet(id, from_date, to_date, output_format = 'object') {
	var person;
	var output = [];

	try {
		person = await Person.findById(id, {
			raw: true
		});
	} catch (error) {
		console.log("error", error);
	}

	var min_date, max_date, result;

	try {
		result = await Registration.findOne({
			attributes: [[db.fn('MIN', db.col('TimeIn')), 'EarliestTime'], [db.fn('MAX', db.col('TimeOut')), 'LatestTime']],
			raw: true,
			where: {
				PersonID: id,
			}
		});

		min_date = new moment(from_date == "" ? result.EarliestTime : from_date).tz('Australia/Sydney').startOf('day');
		max_date = new moment(to_date == "" ? result.LatestTime : to_date).tz('Australia/Sydney').startOf('day');
	} catch (error) {
		console.log("error", error);
	}

	console.log('min_date', min_date);
	console.log('hello', max_date);

	for (var cdate = min_date; cdate <= max_date; cdate.add(1, 'day')) {
		console.log('cdate', cdate);
		var registrations;
		try {
			registrations = await Registration.findAll({
				where: {
					PersonID: id,
					TimeIn: {
						[db.Op.gte]: cdate,
						[db.Op.lt]: moment(cdate).add(1, 'day')
					}
				},
				raw: true
			});
		} catch (error) {
			console.log("error", error);
		}

		console.log('registrations', registrations);

		if (registrations.length > 0) {
			var day_start = moment(registrations[0].TimeIn).tz('Australia/Sydney'),
				day_end = moment(registrations[0].TimeIn).tz('Australia/Sydney'),
				work_time = moment.duration(0, 'seconds'),
				break_time = moment.duration(0, 'seconds');
			for (var r of registrations) {
				r.TimeIn = moment(r.TimeIn).tz('Australia/Sydney');
				r.TimeOut = (r.TimeOut == null ? moment() : moment(r.TimeOut)).tz('Australia/Sydney');
				if (day_start > r.TimeIn) day_start = r.TimeIn;
				if (day_end < r.TimeOut) day_end = r.TimeOut;
				work_time = work_time + (r.TimeOut - r.TimeIn);
			}
			break_time = (day_end - day_start) - work_time;

			if (output_format == 'object') {
				output.push({
					PersonID: id,
					PersonName: person.Name,
					PersonJobTitle: person.JobTitle,
					Date: cdate.format('DD-MM-YYYY'),
					StartTime: day_start.format('HH:mm'),
					EndTime: day_end.format('HH:mm'),
					WorkTime: Math.ceil(moment.duration(work_time).asHours() * 1000) / 1000,
					BreakTime: Math.ceil(moment.duration(break_time).asHours() * 1000) / 1000
				});
			} else if (output_format == 'csv') {
				output.push([id, person.Name, person.JobTitle, cdate.format('DD-MM-YYYY'), day_start.format('HH:mm'),
					day_end.format('HH:mm'), Math.ceil(moment.duration(work_time).asHours() * 1000) / 1000,
					Math.ceil(moment.duration(break_time).asHours() * 1000) / 1000].join(','));
			}

		} else {
			if (output_format == 'csv') {
				output.push([id, person.Name, person.JobTitle, cdate.format('DD-MM-YYYY'), "", "", "", ""].join(','));
			} else if (output_format == 'object') {
				output.push({
					PersonID: id,
					PersonName: person.Name,
					PersonJobTitle: person.JobTitle,
					Date: cdate.format('DD-MM-YYYY'),
					StartTime: '',
					EndTime: '',
					WorkTime: '',
					BreakTime: ''
				});
			}
		}
	}
	return output;
}

router.get('/task', authentication.authenticate, function (req, res, next) {
	res.render('admin/task', {admin: req.session.admin});
});


router.get('/db', authentication.authenticate, function (req, res, next) {
	res.render('admin/db', {admin: req.session.admin});
});

//authentication.authenticate
router.post('/db/reset', authentication.authenticateApi, async function (req, res, next) {
	console.log(req.body);

	if (req.body.clear_taskcompletions == "true") {
		await TaskData.sync({force: true});
		await TaskCompletion.sync({force: true});
		if (req.body.clear_registrations == "true") {
			await Registration.sync({force: true});
		}
	}

	if (req.body.clear_taskassignments == "true") {
		await TaskAssignment.sync({force: true});
	}

	if (req.body.clear_taskschedules == "true") {
		await TaskSchedule.sync({force: true});
	}

	if (req.body.clear_taskcompletions == "true" && req.body.clear_registrations == "true" && req.body.clear_taskassignments == "true" && req.body.clear_workers == "true") {
		await Person.sync({force: true});
		await Person.create({
			Name: "Admin",
			ID: 9001,
			Passcode: 1009,
			Admin: true,
			Active: true
		});
	}

	if (req.body.clear_taskassignments == "true" && req.body.clear_taskschedules == "true" && req.body.clear_taskcompletions == "true" && req.body.clear_tasks == "true") {
		await TaskDataField.sync({force: true})
		await Task.sync({force: true});
	}

	res.send('Database reset.');
});

module.exports = router;
