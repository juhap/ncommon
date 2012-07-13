var crypto = require("crypto");
var winston = require("winston");
var bb = require('./backboneutils.js');
var _ = require('underscore')._;

// Provides caching for selected methods in UserStore
var UserStoreCache = function(attributes) {
	if(!attributes.userStore) throw "Must pass userStore instance in configuration";
	this.userStore = attributes.userStore;
	
	this.cacheConfig = {
		// Positive results are cached for 5 minutes
		positiveValidity: 5 * 60 * 1000,
		// Negative results are cached only for one second
		negativeValidity: 1000
	};
	this.cache = {};
	this.initialize.apply(this, arguments);
}
_.extend(UserStoreCache.prototype, {
	initialize: function(){},
	checkPassword: function(email, passwordClear, callback) {		
		var key = "checkPassword" + "#" + email + "#" + 
			crypto.createHash("sha1").update(passwordClear, "utf8").digest('hex');
		// The function definitions below shall mess up with "this", so we need a backup
		var cache = this.cache;
		var cacheConfig = this.cacheConfig;

		if(cache[key] && new Date().getTime() < cache[key].expiration) {
			winston.debug("Cache hit for key " + key);			
			cache[key].lastAccess = new Date();
			callback(null, cache[key].result);
		} else {
			winston.info("Cache miss for key " + JSON.stringify(cache[key]));
			this.userStore.checkPassword(email, passwordClear, function(error, result) {				
				if(error) callback(error);				
				else {
					var timeout;					
					if(result) timeout = cacheConfig.positiveValidity
					else timeout = cacheConfig.negativeValidity;
					cache[key] = { result : result, expiration: new Date().getTime() + timeout};
					callback(null, result);
				}				
			});
		}
	}
});

UserStoreCache.extend = bb.extend;
module.exports = UserStoreCache;
