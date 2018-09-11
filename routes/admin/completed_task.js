'use strict';

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();
var Person = require('../../model/Person');
var Registration = require('../../model/Registration');
var db = require('../../model/db');
var moment = require("moment-timezone");
var authentication = require('../../authentication');
var stream = require('stream');

router.get('/', authentication.authenticate, async function (req, res, next) {
	var data = await getCompletedTasks(req.query.FromDate, req.query.ToDate);
	console.log(data);
	res.render("admin/completed_task", {CompletedTasks: data});
});

const CT_HEADER_ROW = ['Worker ID', 'Worker name', 'Job title', 'Task name', 'Date completed', 'Clock in', 'Completed at', 'Clock out', 'Data'];

router.get('/csv', authentication.authenticate, async function (req, res, next) {
	console.log('test', 'test');
	var output = [CT_HEADER_ROW];

	output = output.concat(await getCompletedTasks("", "", "csv"));

	output = output.join('\n');

	var readStream = new stream.PassThrough();
	readStream.end(output);

	res.set('Content-disposition', 'attachment; filename=completed_tasks.csv');
	res.set('Content-type', 'text/csv');

	readStream.pipe(res);
});

async function getCompletedTasks(from_date, to_date, output_format = 'object') {
	var min_date, max_date, result;

	try {
		result = await Registration.findOne({
			attributes: [[db.fn('MIN', db.col('TimeIn')), 'EarliestTime'], [db.fn('MAX', db.col('TimeOut')), 'LatestTime']],
			raw: true,
		});

		min_date = new moment(from_date == "" ? result.EarliestTime : from_date).tz('Australia/Sydney').startOf('day');
		max_date = new moment(to_date == "" ? result.LatestTime : to_date).tz('Australia/Sydney').startOf('day');
	} catch (error) {
		console.log("error", error);
	}

	var _q1 = `
		select tc.id as TaskCompletionId, p.ID as WorkerID, p.Name as WorkerName, p.JobTitle as JobTitle, tc.CompletedAt as CompletedAt, r.TimeIn as ClockIn, r.TimeOut as ClockOut,
		t.Name as TaskName
		from TaskCompletions tc
		inner join Registrations r on tc.RegistrationId = r.id
		inner join People p on r.PersonID = p.ID
		inner join Tasks t on t.id = tc.TaskId
	`;

	var _q2 = `
		select tc.id as TaskCompletionId, tdf.Name as TaskDataFieldName, tdf.DataType as TaskDataFieldType, td.Value as TaskDataFieldValue
		from TaskCompletions tc
		inner join TaskData td on tc.id = td.TaskCompletionId 
		inner join TaskDataFields tdf on td.TaskDataFieldId = tdf.Id
	`;

	var _result1 = db.query(_q1, {type: db.QueryTypes.SELECT});
	var _result2 = db.query(_q2, {type: db.QueryTypes.SELECT});

	_result1 = await _result1;
	_result2 = await _result2;

	_result1 = JSON.parse(JSON.stringify(_result1));
	_result2 = JSON.parse(JSON.stringify(_result2));

	result = {};
	var csv = [];
	for (let c of _result1) {
		c.TaskData = [];
		c.Date = moment(c.ClockIn).format("DD-MM-YYYY");
		c.ClockIn = moment(c.ClockIn).tz('Australia/Sydney').format("HH:mm");
		c.ClockOut = c.ClockOut == null ? null : moment(c.ClockOut).tz('Australia/Sydney').format("HH:mm");
		c.CompletedAt = moment(c.CompletedAt).tz('Australia/Sydney').format("HH:mm");
		result[c.TaskCompletionId] = c;
	}

	for (let c of _result2) {
		result[c.TaskCompletionId].TaskData.push(c);
	}

	if (output_format == 'csv') {
		for (var _c in result) {
			let c = result[_c];
			var csv_row = [];
			csv_row.push(c.WorkerID, c.WorkerName, c.JobTitle, c.TaskName, c.Date, c.ClockIn, c.CompletedAt, c.ClockOut);
			for (var c2 of c.TaskData) {
				csv_row.push(c2.TaskDataFieldName, c2.TaskDataFieldValue);
			}
			csv.push(csv_row.join(','));
		}
		return csv;
	}


	return result;
}

module.exports = router;
