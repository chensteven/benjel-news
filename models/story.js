var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var storySchema = new Schema({
	title: String,
	link: String,
	comments: [{type: ObjectId, ref: 'Comment'}],
	author: {type: ObjectId, ref: 'User', required: true},
	created: { type: Date, default: Date.now },
	updated: {type: Date, default: Date.now }
});

module.exports = mongoose.model('Story', storySchema);