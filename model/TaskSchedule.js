'use strict';

const _sequelize = require('sequelize');
const db = require('./db');
const Task = require('./Task');

const TaskSchedule = db.define('TaskSchedule', {
	RepeatEvery: {
		type: _sequelize.INTEGER,
		allowNull: false,
		defaultValue: 1
	},
	RepeatUnits: {
		type: _sequelize.STRING,
		allowNull: false,
		defaultValue: 'DAY'
	},
});

TaskSchedule.belongsTo(Task, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
Task.hasMany(TaskSchedule);

module.exports = TaskSchedule;