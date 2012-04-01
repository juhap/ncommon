var MongoStore = require('./mongostore');
var myenv = require('schema')('userstoreenv', {});
var crypto = require('crypto');
var winston = require('winston');

// Create random salt
function createSalt() {
	var buf = crypto.randomBytes(8);
    return buf.toString('hex');
}

function createSessionId() {
	var buf = crypto.randomBytes(24);
    return buf.toString('hex');
}

// Hash given cleartext password with given salt, using specified algorithm
function createHash(algorithm, salt, passwordClear) {
	return crypto.createHash(algorithm).update(salt).update(passwordClear, "utf8").digest('hex');
}

// Return password structure based on cleartext password
function securePassword(passwordClear) {
	var salt = createSalt();
	var algorithm = "sha1";
	return {
		salt: salt,
		password: createHash(algorithm, salt, passwordClear),
		algorithm: algorithm
	};
}

// Verify cleartext password against given passwordInfo structure
function verifyPassword(passwordClear, passwordInfo) {
	var hash = createHash(passwordInfo.algorithm, passwordInfo.salt, passwordClear);
	winston.debug("Compare passwords: " + passwordInfo.password + "==" + hash);
	return passwordInfo.password == hash;
}

var UserStore = MongoStore.extend({
	defaults: {
		collectionName: "users"
	},
	schemas: {
		user: myenv.Schema.create({
			type: "object",
			properties: {
				email: {
					type: "string",
					required: true
				},
				/*
				name: {
					type: "string",
					required: false,
				},
				*/
				passwordClear: {
					type: "string",
					required: true
				}
			},
			additionalProperties: false
		})
	},
	findUserByEmail: function(email, callback) {
		winston.info("Find user by email: " + email);
		this.findOne({email: email}, callback);
	},
	checkPassword: function(email, passwordClear, callback) {
		winston.info("checking password for email: " + email);
		this.findUserByEmail(email, function(error, result) {
			if(error) callback(error);
			else {
				callback(null, verifyPassword(passwordClear, result.passwordInfo));
			}
		});
	},
	removeUser: function(user, callback) {
		winston.info("removing user with id: " + user._id);
		this.getCollection(function(error, user_collection) {
			if(error) callback(error)
			else {
				user_collection.remove({_id : user_collection.db.bson_serializer.ObjectID.createFromHexString(user._id)}, function(error, result) {
					if(error) callback(error)
					else callback(null, result);
				});
			}
		});
	},
	findAll: function(callback) {
		this.getCollection(function(error, user_collection) {
			if(error) callback(error)
	 		else {
	 			user_collection.find().toArray(function(error, results) { 			
	 				if(error) callback(error)
	 				else callback(null, results)
	 			});
	 		}
		});
	},
	// email
	// passwordClear
	// name
	registerUser: function(userdata, callback) {		
		winston.info("registerUser " + userdata.email);
		var validation = this.schemas.user.validate(userdata);
		if(validation.isError()) {
			winston.info("Validation error occured in registerUser: " + validation.errors);
			throw "Validation error: " + JSON.stringify(validation.errors);
		}
		var user = {
			email: userdata.email,
			passwordInfo: securePassword(userdata.passwordClear),
			name: userdata.name
		}
		this.getCollection(function(error, user_collection) {
			if(error) callback(error)
			else {
				user.created_at = new Date();
				user_collection.insert(user, function() {
					winston.info("Register user completed succesfully.");
					callback(null, user);
				});
			}
		});
	}
});

module.exports = UserStore;
