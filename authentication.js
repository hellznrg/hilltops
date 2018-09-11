var exports = {};

exports.authenticate = function (req, res, next) {
	if (req.session.logged_in_id == null) {
		res.redirect("/security/login");
	} else {
		req.session._garbage = Date();
		req.session.touch();
		next();
	}
}

exports.authenticateApi = function (req, res, next) {
	if (req.session.logged_in_id == null) {
		res.status(401).send("/security/login");
	} else {
		req.session._garbage = Date();
		req.session.touch();
		next();
	}
}

module.exports = exports;