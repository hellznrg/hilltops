var express = require('express');
var router = express.Router();
var session = require('express-session');
var Person = require('../model/Person');
var Registration = require('../model/Registration');
var Task = require('../model/Task');
var TaskAssignment = require('../model/TaskAssignment');
var TaskCompletion = require('../model/TaskCompletion');
var TaskDataField = require('../model/TaskDataField');
var TaskSchedule = require('../model/TaskSchedule');
var TaskData = require('../model/TaskData');
var db = require('../model/db');
var moment = require("moment-timezone");
var authentication = require('../authentication');

router.delete('/task_completion/:tc_id/remove', authentication.authenticateApi, async function (req, res, next) {
	TaskData.destroy({
		where: {
			TaskCompletionId: req.params.tc_id
		}
	});

	TaskCompletion.destroy({
		where: {
			id: req.params.tc_id
		}
	});

	res.send("Successfully deleted the records.")
});

router.post('/:task_id/complete', authentication.authenticateApi, async function (req, res, next) {
	let completion_date = req.body.data['TaskCompletionDate'];
	var _tdf = await TaskDataField.findAll({
		raw: true
	});

	var tdf = {};
	for (var ctdf of _tdf) {
		tdf[ctdf.id] = ctdf;
	}

	var task_data = req.body.data;
	delete task_data['TaskCompletionDate'];
	let _empty = 1;
	for (let td in task_data) {
		if (task_data[td] != "") {
			_empty = 0;
		}
		if (tdf[td].DataType == "NUMBER" && isNaN(task_data[td])) {
			res.status(400).send('Expected number but "' + task_data[td] + '" was entered.');
			return;
		}
	}

	if (_empty) {
		res.status(400).send('No data was entered. At least one of the fields should be entered.');
		return;
	}

	var reg = await Registration.findOne({
		where: {
			TimeOut: {
				[db.Op.eq]: null
			},
			PersonID: {
				[db.Op.eq]: req.session.logged_in_id
			}
		}
	});

	if (reg == null) {
		res.status(403).send('You are currently clocked out. You must clock in first in order to complete tasks.');
		return;
	}

	var tc = await TaskCompletion.create({
		RegistrationId: reg.id,
		CompletedAt: moment(completion_date),
		TaskId: req.params.task_id
	});

	for (let td in task_data) {
		if (task_data[td] != "") {
			TaskData.create({
				TaskCompletionId: tc.id,
				TaskDataFieldId: td,
				Value: task_data[td]
			});
		}
	}

	res.send('Task successfully completed');
});

router.get('/', authentication.authenticate, async function (req, res, next) {

	var today = new moment().startOf('day');
	var tomorrow = new moment(today).add(1, 'day');

	var registrations = await Registration.findAll({
		where: {
			PersonID: {
				[db.Op.eq]: req.session.logged_in_id
			},
			TimeIn: {
				[db.Op.gte]: today,
				[db.Op.lt]: tomorrow
			}
		},
	});

	var reg_ids = [];
	for (var r of registrations) {
		reg_ids.push(r.id);
	}

	var task_assignments = await TaskAssignment.findAll({
		attributes: ['TaskId'],
		where: {
			PersonID: {
				[db.Op.eq]: req.session.logged_in_id
			}
		}
	});

	var ta_ids = [];
	for (var ta of task_assignments) {
		ta_ids.push(ta.TaskId);
	}

	var task_schedules = await TaskSchedule.findAll({
		where: {
			TaskId: {
				[db.Op.in]: ta_ids
			}
		}
	});

	var ts_ids = [];
	for (var ts of task_schedules) {
		ts_ids.push(ts.TaskId);
	}

	var task_completions = await TaskCompletion.findAll({
		include: [{
			model: TaskData,
			include: TaskDataField
		}, Task],
		where: {
			RegistrationId: {[db.Op.in]: reg_ids}
		},
		order: [
			[TaskData, TaskDataField, 'DisplayOrder', 'ASC']
		]
	}).catch(e => console.log(e));

	var tc_ids = [];
	for (var tc of task_completions) {
		tc_ids.push(tc.TaskId);
	}

	var tasks = await Task.findAll({
		include: [TaskDataField, TaskSchedule],
		where: {
			id: {
				[db.Op.in]: ts_ids,
				//[db.Op.notIn]: tc_ids,
			}
		},
		order: [
			['Name', 'ASC'],
			[TaskDataField, 'DisplayOrder', 'ASC']
		]
	});
	tasks = JSON.parse(JSON.stringify(tasks));

	let results = [];
	for (let _t = 0; _t < tasks.length; _t++) {
		var _q = `
select t."id" as "TaskId", max(tc."CompletedAt") as "WhenLastCompleted", 
			min(ts."RepeatEvery") as "RepeatEvery"
			from "Tasks" t 
			inner join "TaskSchedules" ts on t.id = ts."TaskId"
			inner join "TaskAssignments" ta on t.id = ta."TaskId"
			left join "TaskCompletions" tc on t.id = tc."TaskId"
			left join "Registrations" r on tc."RegistrationId" = r."id"
			where t."id" = '` + tasks[_t].id + `'
			group by t."id"
		`;

		results.push(db.query(_q, {type: db.QueryTypes.SELECT}));
	}

	results = await Promise.all(results);

	for (let _tc = 0; _tc < tasks.length; _tc++) {
		let _result = results[_tc];
		let _t = tasks[_tc];
		_result = JSON.parse(JSON.stringify(_result))[0];

		if (_result.WhenLastCompleted == null) {
			_result.DueOn = moment();
			_result.Due = true;
		} else {
			_result.WhenLastCompleted = moment(_result.WhenLastCompleted);
			_result.DueOn = moment(_result.WhenLastCompleted).add(_result.RepeatEvery, 'days');
			if (_result.DueOn <= moment().startOf('day')) {
				_result.Due = true;
			} else {
				_result.Due = false;
			}
		}

		_t.WhenLastCompleted = _result.WhenLastCompleted == null ? "(never)" : _result.WhenLastCompleted.format("DD-MM-YYYY");
		_t.RepeatEvery = _result.RepeatEvery;
		_t.DueOn = _result.DueOn.format("DD-MM-YYYY");
		_t.Due = _result.Due;
	}

	res.render('task', {tasks: tasks, completed_tasks: task_completions, admin: req.session.admin});
});

module.exports = router;
