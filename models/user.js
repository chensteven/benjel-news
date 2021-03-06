var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

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
		trim: true,
		required: true
	},
	joined: {
		type: Date,
		default: Date.now
	},
	email: {
		type: String,
		trim: true,
		lowercase: true
	},
	stories: [{
		type: ObjectId,
		ref: 'Story'
	}],
	comments: [{
		type: ObjectId,
		ref: 'Comment'
	}],
	votedPosts: [{
		type: ObjectId,
		ref: 'Story'
	}],
	favPosts: [{
		type: ObjectId,
		ref: 'Story'
	}],
	notifications: [{
		type: ObjectId,
		ref: 'Notification'
	}]
});

module.exports = mongoose.model('User', userSchema);