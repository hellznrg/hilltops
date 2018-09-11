'use strict';

const _sequelize = require('sequelize');
const db = require('./db');
const Person = require('./Person');

const Payslip = db.define('Payslip', {
	PayPeriodStart: {
		type: _sequelize.DATE,
		allowNull: false
	},
	PayPeriodEnd: {
		type: _sequelize.DATE,
		allowNull: false
	},
	JobTitle: {
		type: _sequelize.STRING,
		allowNull: false
	},

});

Payslip.belongsTo(Person, {foreignKey: {allowNull: false}, onDelete: 'SET NULL'});
Person.hasMany(Payslip);

module.exports = Payslip;