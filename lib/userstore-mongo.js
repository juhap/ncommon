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
					optional: false
				},
				passwordClear: {
					type: "string",
					optional: false
				}, 
				firstname: {
					type: "string",
					optional: true
				},
				lastname: {
					type: "string",
					optional: true
				},
				name: {
					type: "string",
					optional: true
				}				
			},
			// These will be just ignored when user is created
			additionalProperties: {}
		})
	},
	findUserByEmail: function(email, callback) {
		winston.info("Find user by email: " + email);
		this.findOne({email: email}, callback);		
	},
	findUserById: function(userid, callback) {
		winston.info("Find user by id: " + userid);
		this.findOne({_id: userid}, callback);		
	},	
	// Check user password. If check is successfull, returns the user via callback.
	// If check fails, false is returned
	checkPassword: function(email, passwordClear, callback) {
		winston.info("checking password for email: " + email);
		this.findUserByEmail(email, function(error, user) {
			if(error) callback(error);
			else if(!user) callback(null, false) // User does not exist
			else if(verifyPassword(passwordClear, user.passwordInfo)) callback(null, user);
			else callback(null, false);										
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
		console.log(userdata);
		winston.info("registerUser " + userdata.email);
		var validation = this.schemas.user.validate(userdata);
		if(validation.isError()) {
			winston.info("Validation error occured in registerUser for object:\n" 
				+ JSON.stringify(userdata) + "\n" 
				+ JSON.stringify(validation.errors));
			throw "Validation error: " + JSON.stringify(validation.errors);
		}
		var user = {
			email: userdata.email,
			passwordInfo: securePassword(userdata.passwordClear),
			firstname: userdata.firstname,
			lastname: userdata.lastname
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
	},
	/*
	createPasswordResetToken: function(userId, callback) {
		var token = createToken(12);
		winston.info("Create password reset token for email");
		this.getCollection(function(error, user_collection) {
			if(error) callback(error) else {
				// Add one entry to the reset tokens list
				user_collection.update(
					{_id: userId},
					{$push: { resetTokens: token } }
				);
			}
		});
		this.findUserById(userId, function(error, user) {
			if(error) callback(error);
			else {

			}
		});
	}
	*/
});

module.exports = UserStore;
