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
	us.registerUser({
		email: "testi@example.org",
		passwordClear: "salasana"
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

