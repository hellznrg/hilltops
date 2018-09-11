const st = require("supertest");
const app = require("../app");
const server = st.agent(app);

var should = require('chai').should();
var addTwoNumbers = require('../testdemo');

describe('addTwoNumbers()', function () {
	it('should add two numbers', function () {
		// arrange
		let x = 2;
		let y = 3;
		let sum1 = 5;

		// act
		let sum2 = addTwoNumbers(x, y);

		// assert
		sum2.should.be.equal(sum1);
	});
});


describe("POST /admin/user/add", function () {
	it("login", loginUser());

	let data = {
		Name: "req.body.Name",
		ID: 5040,
		PIN: 5040,
		Admin: true,
		Active: true,
		JobTitle: "req.body.JobTitle",
		PayRate: 7.5,
		SuperRate: 9.45,
		BankName: "req.body.BankName",
		BankBsb: "req.body.BankBsb",
		BankAccountNumber: "req.body.BankAccountNumber",
		Phone1: "req.body.Phone1",
		Phone2: "req.body.Phone2"
	};

	it("should add a new user", function (done) {
		server
			.post("/admin/user/add")
			.send(data)
			.set("Accept", "application/json")
			.expect(200)
			.end(function (err) {
				if (err) return done(err);
				done();
			})
	});
});


describe("DELETE /admin/user/remove", function () {
	it("login", loginUser());

	it("should delete the test user", function (done) {
		server
			.delete("/admin/user/remove/5040")
			.expect(200)
			.end(function (err) {
				if (err) return done(err);
				done();
			})
	});
});


function loginUser() {
	return function (done) {
		let login = {Passcode: "1009"};
		server
			.post("/security/login/9001")
			.send(login)
			.expect(200)
			.end(onResponse);

		function onResponse(err, res) {
			if (err) return done(err);
			return done();
		}
	}
}