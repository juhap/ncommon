var MongoStore = require('./mongostore');
var crypto = require("crypto");
var winston = require("winston");	
var _ = require('underscore')._;

// Create random salt
function createTokenId() {
	var buf = crypto.randomBytes(24);
    return buf.toString('hex');
}

var TokenStore = MongoStore.extend({
	defaults: {
		collectionName: "tokens"
	},
	// Create new token of given type, return the id of created token
	// Attributes can be used to include extra information, like userId
	createToken: function(type, validitySecs, attributes, callback) {
		var tokenInfo = {
			type: type,
			tokenId : createTokenId(),			
			createdAt: new Date(),
			validUntil: new Date(new Date().getTime() + 1000 * validitySecs)
		};
		tokenInfo = _.extend(tokenInfo, attributes);
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
	// Update the validity of an existing token. 
	updateToken: function(type, tokenId, validitySecs, callback) {
		this.update(
			{tokenId: tokenId, type: type}, 
			{"$set" : { validUntil: new Date(new Date().getTime() + 1000 * validitySecs)} },
			callback);
	},	
	// Try to retrieve given token, leave it to datastore. Expired tokens are not returned
	peekToken: function(tokenType, tokenId, callback) {
		this.findOne({
			tokenId: tokenId, 
			type: tokenType,
			validUntil: {"$gt" : new Date() }
		}, callback);
	},
	// Retrieve and remove given token. 
	// Due to the way this is implemented, there is a slight change 
	// that the same token could be popped twice
	popToken: function(tokenType, tokenId, callback) {
		var that = this;
		this.peekToken(tokenType, tokenId, function(error, tokenInfo) {
			if(error) callback(error, null);
			else {
				if(!tokenInfo) callback(null, null);
				else {
					// After retrieving we remove the token so that it cannot be 
					// reused. If removing fails that is not a major problem, just
					// log error and continue.
					that.remove({_id: tokenInfo._id}, function(error) {
						if(error) winston.error("Error removing token, _id: " + tokenInfo._id);
						callback(null, tokenInfo);
					});					
				}
			}
		});
	}
}); 

module.exports = TokenStore;