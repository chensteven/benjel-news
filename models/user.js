var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	username: {
		type: String,
		required: true,
		trim: true,
		lowercase: true,
		unique: true
	},
	password: {
		type: String,
		trim: true
	},
	joined: {
		type: Date,
		default: Date.now
	},
	email: {
		type: String,
		trim: true,
		lowercase: true
	}
});

module.exports = mongoose.model('User', userSchema);