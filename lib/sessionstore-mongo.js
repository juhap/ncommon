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
	createToken: function(type, userId, validitySecs, callback) {
		var tokenInfo = {
			type: type,
			tokenId : createSessionId(),
			userId: userId,
			createdAt: new Date(),
			validUntil: new Date(new Date().getTime() + 1000 * validitySecs)
		};
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else {			
				collection.insert(tokenInfo, function() {
					winston.info("New token created with id " + tokenInfo.tokenId);
					callback(null, tokenInfo.tokenId);
				});
			}
		});

	},
	// Initliaze new session.Returns sessionId via the callback
	initSession: function(userId, callback) {
		winston.info("Initialize new session for userId " + userId);
		this.createToken("session", userId, 24*60*60, callback);
	},
	// Initialize a new session, or resume existing	
	initOrResumeSession: function(userId, callback) {
		var that = this;
		this.findOne({type:"session", userId: userId}, function(error, result) {
			if(error) callback(error);
			else if(!result) that.initSession(userId, callback); // no existing found
			else callback(null, result.tokenId);
		});
	},
	createPasswordResetToken: function(userId, callback) {
		winston.info("Create password reset token for userId " + userId);
		this.createToken("pwreset", userId, 24*60*60, callback);
	},
	// Check if session is still valid. Returns true/false via the callback
	checkSession: function(sessionId, callback) {	
		this.findOne({tokenId: sessionId}, function(error, result) {
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
		this.remove({tokenId:sessionId}, callback);
	},
	// Returns the userId associated with the password reset token
	popPasswordResetToken: function(token, callback) {
		winston.info("Consume password reset token: " + token);
		var that = this;
		this.findOne({tokenId: token, type: "pwreset"}, function(error, tokenInfo) {
			if(error) callback(error,null);
			else {
				if(!tokenInfo) callback(null, null);
				else {
					// After retrieving we remove the token so that it cannot be 
					// reused. If removing fails that is not a major problem, just
					// log error and continue.
					that.remove({_id: tokenInfo._id}, function(error) {
						if(error) winston.error("Error removing token, _id: " + tokenInfo._id);
						callback(null, tokenInfo.userId);
					});
				}
			}
		});
	}
});

module.exports = SessionStore;