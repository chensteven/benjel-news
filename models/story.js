var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var storySchema = new Schema({
	title: {type: String, required: true},
	link: {type: String},
	content: {type: String},
	comments: [{type: ObjectId, ref: 'Comment'}],
	author: {type: ObjectId, ref: 'User', required: true},
	created: { type: Date, default: Date.now },
	updated: {type: Date, default: Date.now },
	upvote: {type: Number, default: 0}
});

module.exports = mongoose.model('Story', storySchema);