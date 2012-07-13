var bb = require('./backboneutils.js');
var _ = require('underscore')._;
var AmazonSES = require('amazon-ses');
var myenv = require('schema')('emailsesenv', {});
var winston = require("winston");

// Provides caching for selected methods in UserStore
var EmailSes = function(attributes) {
	if(!attributes.key) throw "Must include 'key' setting (amazon access key)";
	if(!attributes.secret) throw "Must include 'secret' setting (amazon secret key)";
	this.ses = new AmazonSES(attributes.key, attributes.secret);
	this.initialize.apply(this, arguments);
}
_.extend(EmailSes.prototype, {
	initialize: function(){},
	schemas: {
		email: myenv.Schema.create({
			type: "object",
			properties: {
				from: {
					type: "string",
					optional: false
				},
				to: {
					type: "string",
					optional: false
				}, 
				subject: {
					type: "string",
					optional: false
				},
				body: {
					type: "string",
					optional: false
				}				
			},
			// These will be just ignored when user is created
			additionalProperties: {}
		})
	},
	send: function(email, callback) {
		winston.info("Sending email " + email.from + " => " + email.to);
		this.ses.send({
			from: email.from
			,to: [email.to]
			,subject: email.subject
			,body: {
				text: email.body,
				html: email.body
			}
		}, callback);
	}
});

EmailSes.extend = bb.extend;
module.exports = EmailSes;