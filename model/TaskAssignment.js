'use strict';

const _sequelize = require('sequelize');
const db = require('./db');
const Task = require('./Task');
const Person = require('./Person');

const TaskAssignment = db.define('TaskAssignment', {
	Description: {
		type: _sequelize.STRING,
	},
});

TaskAssignment.belongsTo(Task, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
TaskAssignment.belongsTo(Person, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
Task.hasMany(TaskAssignment);
Person.hasMany(TaskAssignment);

module.exports = TaskAssignment;