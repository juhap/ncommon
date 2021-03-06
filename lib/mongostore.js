var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSONPure;
var _ = require('underscore')._;
var bb = require('./backboneutils.js');

var getValue = function(object, prop) {
	if (!(object && object[prop])) return null;
	return _.isFunction(object[prop]) ? object[prop]() : object[prop];
};

var Store = function(attributes) {
	attributes || (attributes = {});
	 if (defaults = bb.getValue(this, 'defaults')) {
     	attributes = _.extend({}, defaults, attributes);     
    }    
    if(!attributes.collectionName) throw "Collection name not specified";
    if(!attributes.database) throw "No database given";
    if(!attributes.hostname) throw "Database host missing";
    if(!attributes.port) throw "Database port missing";   

    this.config = attributes;

    this.initialize.apply(this, arguments);
    this.connect();
}

_.extend(Store.prototype, {
	_dbStatus: "disconnected",
	_db: null,
	initialize: function(){},

	// Convert string representation of id to native id before query
	toObjectId: function(hexString) {		
		return new BSON.ObjectID(hexString);
	},
	connect: function(callback) {		
		this._db = new Db(this.config.database, new Server(this.config.hostname, this.config.port, {auto_reconnect: true}));
		this._dbStatus = "connecting";
		var _this = this;
		this._db.open(function() {
			_this._dbStatus = "connected";			
			if(callback) callback();
		});			
	},
	getCollection: function(callback, retry) {
		if(this._dbStatus != "connecting" && this._dbStatus != "connected") {
			throw "Database connection is not initialized, status is " + this._dbStatus;
		}
		if(!retry) retry = 1;
		if(retry >= 5) {
			throw "Too many connection attemps for mongodb";
		}
		if(this._dbStatus == "connecting") {
			console.log("Mongodb connection not ready, attempt " + retry + ". Waiting.");
			setTimeout(function(_this) {				
				_this.getCollection(callback, retry+1);
			}, 1000, this);
		} else {
			this._db.collection(this.config.collectionName, function(error, collection) {
				if(error) callback(error)
				else callback(null, collection);
			});
		}
	},
	// Find one item from datastore
	findOne: function(searchSpec, callback) {
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else collection.findOne(searchSpec, callback);
		});
	},
	findMany: function(searchSpec, callback) {
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else collection.find(searchSpec, callback);
		});
	},
	// Find items, convert the resulting cursor into an array
	findManyAsArray: function(searchSpec, callback) {
		this.findMany(searchSpec, function(error, result) {
			if(error) callback(error, null);
			else {
				result.toArray(callback);
			}
		});
	},
	// Remove items from store
	remove: function(removeSpec, callback) {
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else collection.remove(removeSpec, callback);
		});
	},
	insert: function(object, callback) {
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else {
				collection.insert(object, callback);
			}
		});
	},
	// Update object  matching the searcspec with update statement specified in update
	update: function(searchSpec, update, callback) {
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else collection.update(
				searchSpec, 
				update, 
				{safe: true, upsert: false, multi: true}, 
				callback);		
		});
	},
	// Perform insert/update
	upsert: function(searchSpec, update, callback) {
		this.getCollection(function(error, collection) {
			if(error) callback(error);
			else collection.update(
				searchSpec, 
				update, 
				{safe: true, upsert: true, multi: true}, 
				callback);		
		});
	},
	// Clear whole collection (to be used with integration tests)
	clearAll: function(callback) {
		this.getCollection(function(error, collection) {
			if(error) callback(error)
			else {
				collection.drop();
				callback();
			}
		});
	},
	close: function(callback) {
		this._dbStatus = "disconnecting";
		var _this = this
		this._db.close(function() {
			_this._dbStatus =" disconnected";
			if(callback) callback();
		});
}
});

Store.extend = bb.extend;

module.exports = Store;


