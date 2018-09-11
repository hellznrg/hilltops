'use strict';

const _sequelize = require('sequelize');
const db = require('./db');

const Task = db.define('Task', {
	Name: {
		type: _sequelize.STRING,
		allowNull: false
	},
});

module.exports = Task;