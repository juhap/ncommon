var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
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
}

_.extend(Store.prototype, {
	_dbStatus: "disconnected",
	_db: null,
	initialize: function(){},

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


