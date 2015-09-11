var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var notificationSchema = new Schema({
	user: {type: ObjectId, ref: 'User'},
	story: {type: ObjectId, ref: 'Story'},
	comment: {type: ObjectId, ref: 'Comment'},
	date: {type: Date, default: Date.now},
	read: {type: Boolean, default: false}
});

module.exports  = mongoose.model('Notification', notificationSchema);