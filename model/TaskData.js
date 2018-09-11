'use strict';

const _sequelize = require('sequelize');
const db = require('./db');
const TaskDataField = require('./TaskDataField');
const TaskCompletion = require('./TaskCompletion');

const TaskData = db.define('TaskData', {
	Value: {
		type: _sequelize.STRING,
		allowNull: false
	},
});

TaskData.belongsTo(TaskCompletion, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
TaskCompletion.hasMany(TaskData);

TaskData.belongsTo(TaskDataField, {foreignKey: {allowNull: false}, onDelete: 'CASCADE'});
TaskDataField.hasMany(TaskData);

module.exports = TaskData;