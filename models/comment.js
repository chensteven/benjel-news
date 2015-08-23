var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var commentSchema = new Schema({
	content: String,
	created: { type: Date, default: Date.now },
	updated: {type: Date, default: Date.now },
	author: {type: ObjectId, ref: 'User'},
	story: {type: ObjectId, ref: 'Story'}	
});

module.exports = mongoose.model('Comment', commentSchema);