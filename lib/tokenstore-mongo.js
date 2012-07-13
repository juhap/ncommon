var MongoStore = require('./mongostore');
var crypto = require("crypto");
var winston = require("winston");	
var _ = require('underscore')._;

/**
	Tokens can be used for multiple purposes. They can be used for example as
	"invitations" or session identifiers. 

	Tokens always have a identifier, but this does not have to be unique. It is 
	possible to for example create 10 tokens with the same identifier to be used
	as "invites". 

	type
	tokenId
	createdAt
	validUntil

*/
var TokenStore = MongoStore.extend({
	defaults: {
		collectionName: "tokens"
	},
	/** 
	* Create random identifier for a token
	*
	* @param {number} length of generated token in bytes
	* @param {string} generated token in hexadecimal
	*/
	createTokenId: function(length) {
		var buf = crypto.randomBytes(24);
	    return buf.toString('hex');
	},
	// 
	/**
	* Create new token of given type and with specified id
	* Attributes can be used to include extra information, like userId
	*
	* param {string} type
	* param {string} tokenId
	* param {number} validitySecs how long the token is valid (from this moment)
	* param {Object.<string,string>} attributes Extra attributes to be included
	* return {string} tokenId
	*/ 
	createToken: function(type, tokenId, validitySecs, attributes, callback) {
		var tokenInfo = {
			type: type,
			tokenId :tokenId ,			
			createdAt: new Date(),
			validUntil: new Date(new Date().getTime() + 1000 * validitySecs),
			attributes: attributes
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