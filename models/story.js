var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commentSchema = new Schema({
	content: String,
	created: { type: Date, default: Date.now },
	updated: {type: Date, default: Date.now },
	author: String	
});
var storySchema = new Schema({
	title: String,
	link: String,
	comments: [commentSchema],
	author: String,
	created: { type: Date, default: Date.now },
	updated: {type: Date, default: Date.now }
});

module.exports = mongoose.model('Story', storySchema);