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

router.get('/', authentication.authenticate, function (req, res, next) {
	Person.findAll().then(persons => {
		res.render('admin/user', {persons: persons, admin: req.session.admin});
	});
});

router.get('/:id', authentication.authenticateApi, function (req, res, next) {
	Person.findOne({
		where: {"ID": req.params.id}
	}).then(person => {
		res.send(person);
	});
});

router.post('/add', authentication.authenticateApi, function (req, res, next) {
	Person.create({
		Name: req.body.Name,
		ID: req.body.ID,
		Passcode: req.body.PIN,
		Admin: req.body.Admin,
		Active: req.body.Active,
		JobTitle: req.body.JobTitle,
		PayRate: req.body.PayRate == '' ? null : req.body.PayRate,
		SuperRate: req.body.SuperRate == '' ? null : req.body.SuperRate,
		BankName: req.body.BankName,
		BankBsb: req.body.BankBsb,
		BankAccountNumber: req.body.BankAccountNumber,
		Phone1: req.body.Phone1,
		Phone2: req.body.Phone2
	}).then(x => {
		res.send("Success fully added user.");
	}).catch(function (err) {
		console.log(err);
		res.status(400).send("Error");
	});
});

router.put('/edit/:id', authentication.authenticateApi, function (req, res, next) {
	Person.findOne({
		where: {ID: req.params.id}
	}).then(person => {
		if (person.ID != req.body.ID) person.ID = req.body.ID;
		if (person.Name != req.body.Name) person.Name = req.body.Name;
		if (person.Passcode != req.body.PIN) person.Passcode = req.body.PIN;
		if (person.Admin != req.body.Admin) person.Admin = req.body.Admin;
		if (person.Active != req.body.Active) person.Active = req.body.Active;
		if (person.JobTitle != req.body.JobTitle) person.JobTitle = req.body.JobTitle;
		if (person.PayRate != req.body.PayRate) if (req.body.PayRate == '') person.PayRate = null; else person.PayRate = req.body.PayRate;
		if (person.SuperRate != req.body.SuperRate) if (req.body.SuperRate == '') person.SuperRate = null; else person.SuperRate = req.body.SuperRate;
		if (person.BankName != req.body.BankName) person.BankName = req.body.BankName;
		if (person.BankBsb != req.body.BankBsb) person.BankBsb = req.body.BankBsb;
		if (person.BankAccountNumber != req.body.BankAccountNumber) person.BankAccountNumber = req.body.BankAccountNumber;
		if (person.Phone1 != req.body.Phone1) person.Phone1 = req.body.Phone1;
		if (person.Phone2 != req.body.Phone2) person.Phone2 = req.body.Phone2;
		person.save();
	}).then(x => {
		res.json("Record successfully updated.");
	});
});

router.delete('/remove/:id', authentication.authenticateApi, function (req, res, next) {
	Registration.destroy({
		where: {'PersonID': req.params.id}
	}).then(x => {
		Person.destroy({
			where: {'ID': req.params.id}
		}).then(x => {
			if (x >= 1) {
				res.send("Successfully deleted the record.");
			} else {
				res.status(404).send("No records were deleted");
			}
		});
	})
});

router.post('/toggle_activation/:id', authentication.authenticateApi, function (req, res, next) {
	Person.findOne({
		where: {ID: req.params.id}
	}).then(person => {
		person.Active = !person.Active;
		person.save();
	}).then(x => {
		res.send("Record successfully updated.");
	});
});

module.exports = router;
