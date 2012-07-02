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
		console.log("Closing connection");
		callback();	
		console.log("Closed");
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

exports["Create and consume password reset token"] = function(test) {
	test.expect(5);
	store.createPasswordResetToken("user1", function(error, token) {
		test.ok(!error);
		test.ok(token);
		store.popPasswordResetToken(token, function(error, result) {
			test.ok(!error);
			test.ok(result);
			test.ok(result == "user1", "UserId is: " + result);
			test.done();
		});
	});
};

exports["Resume existing session"] = function(test) {
	test.expect(5);
	var userid = "userId555";
	store.initSession(userid, function(error, originalSessionId) {
		test.ok(!error, "Init session error: " + error);
		test.ok(originalSessionId);
		store.initOrResumeSession(userid, function(error, newSessionId) {
			test.ok(!error, error);
			test.ok(newSessionId);
			test.ok(originalSessionId == newSessionId);
			test.done();			
		});
	});
};
