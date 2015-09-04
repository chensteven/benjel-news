var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var commentSchema = new Schema({
	content: {
		 type: String
	},
	created: { 
		type: Date, 
		default: Date.now 
	},
	updated: {
		type: Date, 
		default: Date.now
	},
	author: {
		type: ObjectId, 
		ref: 'User', 
		required: true
	},
	story: {
		type: ObjectId, 
		ref: 'Story', 
		required: true
	},
	parentComment: {
		type: ObjectId,
		ref: 'Comment'
	}
});

module.exports = mongoose.model('Comment', commentSchema);