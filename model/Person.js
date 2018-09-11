'use strict';

const _sequelize = require('sequelize');

const db = require('./db');

const Person = db.define('Person', {
	ID: {
		type: _sequelize.INTEGER,
		primaryKey: true
	},
	Name: {
		type: _sequelize.STRING,
		allowNull: false
	},
	Passcode: {
		type: _sequelize.INTEGER,
		allowNull: false
	},
	Admin: {
		type: _sequelize.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	},
	JobTitle: {
		type: _sequelize.STRING,
	},
	PayRate: {
		type: _sequelize.FLOAT,
	},
	SuperRate: {
		type: _sequelize.FLOAT,
	},
	BankName: {
		type: _sequelize.STRING
	},
	BankBsb: {
		type: _sequelize.STRING
	},
	BankAccountNumber: {
		type: _sequelize.STRING
	},
	Phone1: {
		type: _sequelize.STRING
	},
	Phone2: {
		type: _sequelize.STRING
	},
	Active: {
		type: _sequelize.BOOLEAN,
		defaultValue: false,
		allowNull: false,
	}
});

module.exports = Person;