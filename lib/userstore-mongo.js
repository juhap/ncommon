var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var MongoStore = require('./mongostore');
var myenv = require('schema')('userstoreenv', {});
var crypto = require('crypto');

function createSalt() {
	var buf = crypto.randomBytes(8);
    return buf.toString('hex');
}

function createHash(algorithm, salt, passwordClear) {
	return crypto.createHash(algorithm).update(salt).update(passwordClear, "utf8").digest('hex');
}

function securePassword(passwordClear) {
	var salt = createSalt();
	var algorithm = "sha1";
	return {
		salt: salt,
		password: createHash(algorithm, salt, passwordClear),
		algorithm: algorithm
	};
}

function verifyPassword(passwordClear, passwordInfo) {
	var hash = createHash(passwordInfo.algorithm, passwordInfo.salt, passwordClear);
	console.log(passwordInfo.password);
	console.log(hash);
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
		this.getCollection(function(error, user_collection) {
			if(error) callback(error)
			else {
				user_collection.findOne({email : email}, function(error, result) {
					if(error) callback(error)
					else callback(null, result)
				});
			}
		})
	},
	checkPassword: function(email, passwordClear, callback) {
		this.getCollection(function(error, user_collection) {
				if(error) callback(error);
				else {
					user_collection.findOne({email: email}, function(error, result) {
						if(error) callback(error);
						else {
							console.log(result.passwordInfo);
							callback(null, verifyPassword(passwordClear, result.passwordInfo));
						}
					});						
				}
		});
	},
	removeUser: function(user, callback) {
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
		var validation = this.schemas.user.validate(userdata);
		if(validation.isError()) throw "Validation error: " + JSON.stringify(validation.errors);
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
					callback(null, user);
				});
			}
		});
	}
});

module.exports = UserStore;
