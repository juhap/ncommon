var MongoStore = require('./mongostore');
var crypto = require("crypto");
var winston = require("winston");	

// Create random salt
function createSessionId() {
	var buf = crypto.randomBytes(24);
    return buf.toString('hex');
}

var SessionStore = MongoStore.extend({
	defaults: {
		collectionName: "sessions"
	},
	// Initliaze new session.Returns sessionId via the callback
	initSession: function(userId, callback) {
		var sessionInfo = {
			sessionId : createSessionId(),
			userId: userId,
			createdAt: new Date()
		};
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else {			
				collection.insert(sessionInfo, function() {
					winston.info("SessionInfo created for session " + sessionInfo.sessionId);
					callback(null, sessionInfo.sessionId);
				});
			}
		});
	},	
	// Check if session is still valid. Returns true/false via the callback
	checkSession: function(sessionId, callback) {	
		this.findOne({sessionId: sessionId}, function(error, result) {
			if(error) throw error;
			else {
				// check timestamp here
				if(result) callback(null, true);
				else callback(null, false);
			}
		});
	},
	//
	invalidateSession: function(sessionId, callback) {	
		this.remove({sessionId:sessionId}, callback);
	}
});

module.exports = SessionStore;