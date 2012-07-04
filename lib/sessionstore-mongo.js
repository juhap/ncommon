var TokenStore = require('./tokenstore-mongo');
var crypto = require("crypto");
var winston = require("winston");

var SessionStore = TokenStore.extend({
	// Initliaze new session.Returns sessionId via the callback
	initSession: function(userId, callback) {
		winston.info("Initialize new session for userId " + userId);
		this.createToken("session", 24*60*60, { userId: userId}, callback);
	},
	/*
	// Initialize a new session, or resume existing	
	initOrResumeSession: function(userId, callback) {
		var that = this;
		this.findOne({type:"session", userId: userId}, function(error, result) {
			if(error) callback(error);
			else if(!result) that.initSession(userId, callback); // no existing found
			else callback(null, result.tokenId);
		});
	},
	*/
	createPasswordResetToken: function(userId, callback) {
		winston.info("Create password reset token for userId " + userId);
		this.createToken("pwreset", 24*60*60, {userId: userId}, callback);
	},
	// Check if session is still valid. Returns true/false via the callback
	checkSession: function(sessionId, callback) {	
		this.peekToken("session", sessionId, function(error, result) {			 
			if(error) throw error;
			else {
				if(result) callback(null, true);
				else callback(null, false);
			}
		});
	},
	//
	invalidateSession: function(sessionId, callback) {	
		this.popToken("session", sessionId, callback);
	},
	// Returns the userId associated with the password reset token
	popPasswordResetToken: function(token, callback) {
		winston.info("Consume password reset token: " + token);
		this.popToken("pwreset", token, callback);
	}
});

module.exports = SessionStore;