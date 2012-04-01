var SessionStore = require("../lib/sessionstore-mongo");								   
var store = new SessionStore({
	hostname: "localhost",
	port: 27017,
	database: "flwtest"
});

exports.setUp = function(callback) {
	store.connect(function() {
		store.clearAll(function() {
			callback();
		});
	});	
};

exports.tearDown = function(callback) {	
	store.close(function() {
		callback();	
	});	
}

exports["Create and check session for validity"] = function(test) {	
	test.expect(3);
	store.initSession("userId111", function(error, sessionId) {
		test.ok(!error, "Init session error: " + error);
		store.checkSession(sessionId, function(error, result) {
			test.ok(!error, "checkSession error: " + error);
			test.ok(result, "Result is expected to be true");
			test.done();
		});
	});	
};

exports["Create, invalidate session. Check for validity"] = function(test) {	
	test.expect(4);
	store.initSession("userId111", function(error, sessionId) {
		test.ok(!error, "Init session error: " + error);
		store.invalidateSession(sessionId, function(error) {			
			test.ok(!error, "invalidateSession error: " + error);
			store.checkSession(sessionId, function(error, result) {
				test.ok(!error, "checkSession error: " + error);
				test.ok(!result, "Result is expected to be false");
				test.done();
			});	
		});
	});	
};

exports["Verify random session is not valid"] = function(test) {	
	test.expect(2);
	store.checkSession("abc123123", function(error, result) {
		test.ok(!error, "checkSession error: " + error);
		test.ok(!result, "Result is expected to be false");
		test.done();
	});	
};