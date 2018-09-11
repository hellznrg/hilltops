'use strict';

const _sequelize = require('sequelize');
const db = require('./db');
const Person = require('./Person');

const Registration = db.define('Registration', {
	TimeIn: {
		type: _sequelize.DATE,
		allowNull: false
	},
	TimeOut: {
		type: _sequelize.DATE
	}
});

Registration.belongsTo(Person, {foreignKey: {allowNull: false}, onDelete: 'SET NULL'});
Person.hasMany(Registration);

module.exports = Registration;