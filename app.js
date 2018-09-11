var express = require('express');
var helmet = require("helmet");

var app = express();
app.use(helmet());

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

//routes

var index = require('./routes/index');
var users = require('./routes/admin/user');
var register = require('./routes/register');
var admin_task = require('./routes/admin/task');
var completed_task = require("./routes/admin/completed_task");
var admin = require('./routes/admin');
var security = require('./routes/security');
var task = require('./routes/task');
var report = require('./routes/admin/report');

//model

var db = require('./model/db');
var persons = require('./model/Person');
var registrations = require('./model/Registration');
var tasks = require('./model/Task');
var task_data_fields = require('./model/TaskDataField');
var task_schedules = require('./model/TaskSchedule');
var task_completions = require('./model/TaskCompletion');
var task_assignments = require('./model/TaskAssignment');
var task_data = require('./model/TaskData');
db.sync();

/* .then(function() {
	    persons.create({
	        Name: "Admin",
	        ID: 9001,
	        Passcode: 1009,
	        Admin: true,
	        Active: true
	    });
    });
*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: "Tel$0ftTmCBJ6",
	cookie: {maxAge: 180000},
	resave: false,
	saveUninitialized: false,
}));

app.use('/', index);
app.use('/admin/user', users);
app.use('/register', register);
app.use('/admin/task', admin_task);
app.use('/admin/completed_task', completed_task);
app.use('/admin', admin);
app.use('/security', security);
app.use('/task', task);
app.use('/admin/report', report);

app.use('/scripts/chartist', express.static(__dirname + "/node_modules/chartist/dist/"));
app.use('/scripts/chartist-plugin-axistitle', express.static(__dirname + "/node_modules/chartist-plugin-axistitle/dist/"));
app.use('/scripts/chartist-plugin-legend', express.static(__dirname + "/node_modules/chartist-plugin-legend/"));
app.use('/scripts/moment', express.static(__dirname + "/node_modules/moment/"));
app.use('/scripts/moment-timezone', express.static(__dirname + "/node_modules/moment-timezone"));
app.use('/scripts/jquery', express.static(__dirname + "/node_modules/jquery/dist/"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
