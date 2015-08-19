var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var flash = require('connect-flash');
var morgan  = require('morgan');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var ObjectId = mongoose.Types.ObjectId;
var app = express();


// middleware logger for http request/reponse
app.use(morgan('dev'));
// view engine, the template engine to use
app.set('view engine', 'jade');
// views, the directory where the template files are located
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(flash());
app.use(session({ secret: 'coco', cookie: { secure: false, maxAge: null }}));
app.use(passport.initialize()); // call this middleware to initialize Passport
app.use(passport.session()); // call this to use persistent login sessions

var port = process.env.PORT || 4000;
app.listen(port, function() {
	console.log('Listening at ' + port);
});

mongoose.connect('mongodb://localhost/benjel');

var Story = require('./models/story');
var User = require('./models/user');

passport.use('local', new LocalStrategy({passReqToCallback: true}, function(req, username, password, done) {
	User.findOne({'username': username}, function(err, user) {
		if (err) {
			console.log(err);
			return done(err);
		}
		if (!user) {
			console.log("no user");
			return done(null, false, req.flash('loginMessage', 'Incorrect username.'));
		}
		if (!validPassword(user, password)) {
			console.log("bad password");
			return done(null, false, req.flash('loginMessage', 'Incorrect password.'));
		}
		return done(null, user);
	})
}));
passport.serializeUser(function(user, done) {
	done(null, user.id);
});
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

var validPassword = function(user, password) {
	if (user.password == null) {
		user.password = "";
	}
	return bcrypt.compareSync(password, user.password);
}
// gonna need app.all()

app.get('/', function(req, res) {
	var sess = req.session;
	console.log(sess);
	console.log("Cookies: ", req.cookies);
	Story.find({}).sort({date: -1}).exec(function(err, stories) {
		if (err) throw err;

		for(var x=0; x < stories.length; x++) {
			// Gets the length of the comments array
			stories[x].commentsLength = stories[x].comments.length; 
			// Calculate the time from the date the post was posted
			stories[x].created = stories[x]._id.getTimestamp();
			stories[x].timeAgo = timeHandler(stories[x]);
		}
		res.render('news', {message: "Homepage", data: stories});
	})
});
app.get('/submit', function(req, res) {
	res.render('submit');
});

app.get('/news', function(req, res) {
	Story.find({}).sort({date: -1}).exec(function(err, stories) {
		if (err) {
			res.send(err);
		}
		res.render('news', {data: stories});
	})	
});
app.post('/news', function(req, res) {
	var story = new Story();
	var comment = {"author": "Steven", "content": req.body['comments']};
	story['title'] = req.body['title'];
	story['link']  = req.body['link'];
	story['author'] = 'Steven Chen';
	story['comments'].push(comment);
	story.save(function(err, data) {
		if (err) {
			console.log(err);
			res.send(err);
		}
		console.log(story);
		res.redirect('/news/' + encodeURIComponent(data._id));
	})
	
});
app.get('/news/:id', function(req, res) {
	Story.find({_id: req.params.id}, function(err, data) {
		if(err) throw err;
		res.locals.address = "http://localhost:4000/";
		data[0].timeAgo = timeHandler(data[0]);
		for(var x=0; x < data[0].comments.length; x++) {
			data[0].comments[x].timeAgo = timeHandler(data[0].comments[x]);
		}
		res.render('news-single', {data: data});
	})
});
app.post('/news/:id/comment', function(req, res) {
	var comment = {"author": 'Steven',"content": req.body.comment}
	
	// Story.findOne({_id: req.params.id}, function(err, story) {
	// 	if(err) throw err;
	// 	story.comments.push(comment);
	// 	story.save(function(err, data){
	// 		if (err) {console.log(err); throw(err);}
	// 		console.log(story);
	// 	});
	// })
	Story.findOneAndUpdate({_id: req.params.id}, {$addToSet: {comments: comment}}, 
	    function(err,data) { 
	       if(err) throw err; 
	    }
	)
	// var commentsLength = 0;
	// Story.find({"_id": req.params.id}, function(err, data) {
	// 	commentsLength = data[0].comments.length;
	// });
	Story.findById({"_id": req.params.id}).select({"comments": { "$slice": -1 }}).exec(function(err, data) {;
		data.comments[0].created = timeHandler(data.comments[0]);
		console.log(data.comments[0]);
		res.send(data.comments[0]);
	});

});
app.get('/login', function(req, res) {
	res.render('login', {message: req.flash('loginMessage')});
});
app.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
}));
app.get('/api', function(req, res) {
	res.render('api');
});


function bufferHandler() {
	var buffer = new Buffer("55cbf517a52629b3da527386");
	var s = buffer.toString('hex');
	console.log(s);
	var buffer = new Buffer('NTVjYmY1MTdhNTI2MjliM2RhNTI3Mzg2', 'base64');
	var s = buffer.toString('hex');
	console.log(s);
}
function timeHandler(story) {
	var date1 = story._id.getTimestamp();
	var date2 = new Date();
	var date3 = Math.abs(date2 - date1);
	return msToTime(date3);
}
function msToTime(duration) {
	var time = null;
	var timeType = "";
	var timeAgo = "";
	var ms = parseInt(duration);
	//console.log("ms:"+ms);
	var s = parseInt(ms / 1000);
	//console.log("s:"+s);
	var m = parseInt(s / 60);
	//console.log("m:"+m);
	var h = parseInt(m / 60);
	//console.log("h:"+h);
	var d = parseInt(d / 24);
	//console.log("d:"+d);
	if (d===0 || isNaN(d)) {
		//console.log("No Days");
		if (h===0 || isNaN(h)) {
			//console.log("No Hours");
			if(m===0 || isNaN(m)) {
				//console.log("No Minutes");
				if(s===0 || isNaN(s)) {
					//console.log("No Seconds");
					if(ms===0 || isNaN(ms)) {
						//console.log("No Milliseconds");
					}
					else {
						time = 1;
						timeType = "second";
					}
				}
				else {
					time = s;
					timeType = "seconds";
				}
			}
			else {
				time = m;
				timeType = "minutes";
			}
		}
		else {
			time = h;
			timeType = "hours";
		}
	} 
	else {
		time = d;
		timeType = "days";
	}
	timeAgo = time+" "+timeType+" ago";
	//console.log(timeAgo);
	return(timeAgo);
}