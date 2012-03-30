var UserStore = require("../lib/userstore-mongo");
var us = new UserStore({
	hostname: "localhost",
	port: 27017,
	database: "flwtest"
});

exports.setUp = function(callback) {
	us.connect(function() {
		us.clearAll(function() {
			callback();
		});
	});	
};

exports.tearDown = function(callback) {	
	us.close(function() {
		callback();	
	});	
}

exports["Create and find user by email"] = function(test) {	
	test.expect(2);
	us.registerUser({
		email: "testi@example.org",
		passwordClear: "salasana",
		name: "Testaaja"
	}, function(error, user) {
		test.ok(!error, "user registered");
		us.findUserByEmail("testi@example.org", function(error, result) {		
			if(error) test.ok(false, "error finding registered user");
			//console.log("result: " + JSON.stringify(result));
			test.ok(result.created_at);
			test.done();
		});
	});
};

exports["Check password verification with incorrect password"] = function(test) {
	test.expect(3);
	us.registerUser({
		email: "testuser1@example.org",
		passwordClear: "passw0rd"
	}, function(error, user) {	
		test.ok(!error, "user registered");
		us.checkPassword("testuser1@example.org", "wrongpassword", function(error, result) {
			test.ok(!error);
			test.ok(!result, "wrong password was used");			
			test.done();
		});		
	});
}

exports["Check password verification with correct password"] = function(test) {
	test.expect(3);
	us.registerUser({
		email: "testuser2@example.org",
		passwordClear: "passw0rd"
	}, function(error, user) {	
		test.ok(!error, "user registered");
		us.checkPassword("testuser2@example.org", "passw0rd", function(error, result) {
			test.ok(!error, "error detected: " + error);
			test.ok(result, "correct password");			
			test.done();
		});		
	});
}