'use strict';

const _sequelize = require('sequelize');
const db = require('./db');
const Task = require('./Task');
const Registration = require('./Registration');

const TaskCompletion = db.define('TaskCompletion', {
	CompletedAt: {
		type: _sequelize.DATE,
		allowNull: false
	},
});

TaskCompletion.belongsTo(Task, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
Task.hasMany(TaskCompletion);

TaskCompletion.belongsTo(Registration, {foreignKey: {allowNull: false}, onDelete: 'SET NULL'});
Registration.hasMany(TaskCompletion);

module.exports = TaskCompletion;