var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var MongoStore = require('./mongostore');

var UserStore = MongoStore.extend({
	defaults: {
		collectionName: "users"
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
				if(error) callback(error)
				else {
					user_collection.find({
						email: email,
						password: passwordClear
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
	registerUser: function(user, callback) {
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
