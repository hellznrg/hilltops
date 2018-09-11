'use strict';

const _sequelize = require('sequelize');
const db = require('./db');
const Task = require('./Task');

const TaskDataField = db.define('TaskDataField', {
	Name: {
		type: _sequelize.STRING,
		allowNull: false
	},
	DataType: {
		type: _sequelize.STRING,
		allowNull: false,
		defaultValue: 'STRING',
	},
	DisplayOrder: {
		type: _sequelize.FLOAT,
	}
});

TaskDataField.belongsTo(Task, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
Task.hasMany(TaskDataField);

module.exports = TaskDataField;