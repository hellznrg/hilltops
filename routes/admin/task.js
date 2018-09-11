'use strict';

var Promise = require('bluebird');
var express = require('express');
var router = express.Router();
var Person = require('../../model/Person');
var Task = require('../../model/Task');
var TaskSchedule = require('../../model/TaskSchedule');
var TaskDataField = require('../../model/TaskDataField');
var TaskAssignment = require('../../model/TaskAssignment');
var db = require('../../model/db');
var moment = require("moment-timezone");
var authentication = require('../../authentication');
var stream = require('stream');

router.get('/', authentication.authenticate, async function (req, res, next) {
	var tasks = await Task.findAll({
		include: [TaskSchedule, TaskDataField, TaskAssignment]
	});

	console.log("tasks", JSON.stringify(tasks));

	res.render('admin/task', {tasks: tasks, admin: req.session.admin});
});

router.get('/:id', authentication.authenticateApi, async function (req, res, next) {
	var task = await Task.findOne({
		where: {"id": req.params.id},
		include: [TaskSchedule, TaskDataField, {
			model: TaskAssignment, include: [{model: Person, attributes: ["ID", "Name"]}]
		}]
	});

	task = JSON.parse(JSON.stringify(task));

	var assignments = [];
	for (var a of task.TaskAssignments) {
		assignments.push(a.PersonID);
	}

	var persons = await Person.findAll({
		attributes: ['ID', 'Name'],
		where: {
			ID: {
				[db.Op.notIn]: assignments
			}
		}

	});

	persons = JSON.parse(JSON.stringify(persons));

	task.Persons = persons;

	console.log("task", JSON.stringify(task));

	res.send(task);
});

router.post('/add', authentication.authenticateApi, async function (req, res, next) {
	try {
		await Task.create({
			Name: req.body.Name,
		});
		res.send("Success fully added task.");
	} catch (error) {
		res.status(400).send(error);
	}
});

router.put('/edit/:id', authentication.authenticateApi, async function (req, res, next) {
	console.log('req', req.body);
	var task = await Task.findOne({
		where: {ID: req.params.id}
	});

	if (task.Name != req.body.Name) task.Name = req.body.Name;
	task = await task.save();

	res.send("Record successfully updated.");
});

router.delete('/remove/:id', authentication.authenticateApi, async function (req, res, next) {
	try {
		await Task.destroy({
			where: {'id': req.params.id}
		});
		res.send("Successfully deleted the record.");
	} catch (error) {
		res.status(404).send("No records were deleted:" + error);
	}
});

router.delete('/:taskid/dataField/:datafieldid/remove', authentication.authenticateApi, async function (req, res, next) {
	try {
		await TaskDataField.destroy({
			where: {'id': req.params.datafieldid, 'TaskId': req.params.taskid}
		});
		res.send("Successfully deleted the record.");
	} catch (error) {
		res.status(404).send("No records were deleted:" + error);
	}
});

router.post('/toggle_activation/:id', authentication.authenticateApi, function (req, res, next) {
	Person.findOne({
		where: {ID: req.params.id}
	}).then(person => {
		person.Active = !person.Active
		person.save();
	}).then(x => {
		res.send("Record successfully updated.");
	});
});

router.post('/:id/addDataField', authentication.authenticateApi, async function (req, res, next) {
	try {
		await TaskDataField.create({
			Name: req.body.TaskDataFieldName,
			TaskId: req.params.id,
			DataType: req.body.TaskDataFieldType
		});
		res.send("Successfully added data field to task.");
	} catch (error) {
		res.status(400).send(error);
	}
});

router.post('/:id/schedule/add', authentication.authenticateApi, async function (req, res, next) {
	try {
		await TaskSchedule.create({
			RepeatEvery: req.body.RepeatEvery,
			TaskId: req.params.id,
			RepeatUnits: req.body.RepeatUnits
		});
		res.send("Successfully scheduled the task.");
	} catch (error) {
		res.status(400).send(error);
	}
});

router.delete('/:taskid/schedule/:scheduleid/remove', authentication.authenticateApi, async function (req, res, next) {
	try {
		await TaskSchedule.destroy({
			where: {'id': req.params.scheduleid, 'TaskId': req.params.taskid}
		});
		res.send("Successfully deleted the record.");
	} catch (error) {
		res.status(404).send("No records were deleted:" + error);
	}
});

router.post('/:id/assignment/add', authentication.authenticateApi, async function (req, res, next) {
	try {
		await TaskAssignment.create({
			TaskId: req.params.id,
			PersonID: req.body.PersonId,
			Description: req.body.Description,
		});
		res.send("Successfully assigned the task.");
	} catch (error) {
		res.status(400).send(error);
	}
});

router.delete('/:taskid/assignment/:assignmentid/remove', authentication.authenticateApi, async function (req, res, next) {
	try {
		await TaskAssignment.destroy({
			where: {'id': req.params.assignmentid, 'TaskId': req.params.taskid}
		});
		res.send("Successfully deleted the record.");
	} catch (error) {
		res.status(404).send("No records were deleted:" + error);
	}
});

module.exports = router;
