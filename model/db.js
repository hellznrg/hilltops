'use strict';

const _sequelize = require('sequelize');
const sequelize = new _sequelize('hilltops', 'telsoft', 'telsoft', {
	host: 'localhost',
	dialect: 'sqlite',
	storage: './model/hilltops.db',
	operatorsAliases: false
});

module.exports = sequelize;