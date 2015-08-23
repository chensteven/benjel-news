var express = require('express'); // server
var bodyParser = require('body-parser'); // parsing form contents
var mongodb = require('mongodb'); // database
var mongoose = require('mongoose'); // odm for database
var bcrypt = require('bcrypt'); // encryption
var flash = require('connect-flash'); // error messages
var morgan  = require('morgan'); // console logger
var session = require('express-session'); // session for express
var passport = require('passport'); // authentication
var LocalStrategy = require('passport-local').Strategy; // local strategy
var ObjectId = mongoose.Schema.Types.ObjectId;

var app = express();

// app & middelware configurations
app.set('view engine', 'jade'); // view engine, the template engine to use
app.set('views', __dirname + '/views'); // views, the directory where the template files are located
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(morgan('dev')); // middleware logger for http request/reponse
app.use(flash());
app.use(session({ name: 'coco', secret: 'coco', resave: false, saveUninitialized: true, cookie: { secure: false, maxAge: null }}));
app.use(passport.initialize()); // call this middleware to initialize Passport
app.use(passport.session()); // call this to use persistent login sessions
app.use(checkAuthenticationStatus);

var port = process.env.PORT || 4000;
app.listen(port, function() {
	console.log('Listening at ' + port);
});
mongoose.connect('mongodb://localhost/benjel');

var Story = require('./models/story');
var User = require('./models/user');
var Comment = require('./models/comment');
passport.use('local-register', new LocalStrategy({passReqToCallback: true}, function(req, username, password, done) {
	User.findOne({'username': username}, function(err, user) {
		if (err) {
			console.log(err);
			return done(err);
		}
		if (user) {
			console.log('user exists');
			return done(null, false, req.flash('registerMessage', 'Username exists already. Pick a new one.'))
		}
		else {
			var newUser = new User();
			newUser.username = username;
			newUser.password = generateHash(password);
			
			newUser.save(function(err) {
				if (err) {
					throw err;
				}
				return done(null, newUser);
			});
		}
	});
}));
passport.use('local-login', new LocalStrategy({passReqToCallback: true}, function(req, username, password, done) {
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
	});
}));
passport.serializeUser(function(user, done) {
	done(null, user.id);
});
passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

var generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};
var validPassword = function(user, password) {
	return bcrypt.compareSync(password, user.password);
};

app.get('/', function(req, res) {
	console.log(req.session);
	Story.find({}).sort({created: -1}).populate('author').lean().exec(function(err, stories) {
		if (err) throw err;
		stories.forEach(function(story) {
			story.commentsLength = story.comments.length;
			story.created = story._id.getTimestamp();
			story.timeAgo = timeHandler(story);
		});
		//console.log(stories);
		res.render('news', {data: stories});
	});
});
app.get('/submit', ensureAuthenticated, function(req, res) {
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
	story.title = req.body.title;
	story.link  = req.body.link;
	story.author = req.session.passport.user;
	function post(model, callback) {
		model.save(function(err, data) {
			if (err) {
				throw err;
			}
			callback(null, data);
		})
	}
	post(story, function(err, data) {
		var comment = new Comment();
		comment.author = req.session.passport.user;
		comment.content = req.body.comments;
		comment.story = data._id;
		post(comment, function(err, data) {
			if (err) {
				throw err;
				console.log(err);
			}
			Story.findOneAndUpdate({_id: data.story}, {$addToSet: {comments: {_id: data._id}}}, function(err, data) {
				res.redirect('/news/' + encodeURIComponent(data._id));
			});
		});
	})
})
app.get('/news/:id', function(req, res) {
	Story.findOne({"_id": req.params.id}).populate('author').exec(function(err, story) {
		if (err) throw err;
		story.timeAgo = timeHandler(story);
		story.commentsLength = story.comments.length;
		//console.log("Story:" + story);
		Comment.find({"story": req.params.id}).sort({created: -1}).populate('author').exec(function(err, comments) {
			if (err) throw err;
			comments.forEach(function(comment) {
				comment.timeAgo = timeHandler(comment);
			});
			var formAction = "/news/"+req.params.id+"/comment";
			res.render('news-single', {story: story, comments: comments, formAction: formAction });
		});	
	});
});
app.post('/news/:id/comment', function(req, res) {
	var comment = new Comment();
	comment.author = req.session.passport.user;
	comment.content = req.body.comments;
	comment.story = req.params.id;
	comment.save(function(err, data) {
		if (err) throw err;
		Story.findOneAndUpdate({'_id': req.params.id}, {$addToSet: {comments: {'_id': data._id}}}, function(err, story) {
			if (err) throw err;
			res.redirect('/news/' + encodeURIComponent(req.params.id));
		});
	});

	
	// Story.findOne({_id: req.params.id}, function(err, story) {
	// 	if(err) throw err;
	// 	story.comments.push(comment);
	// 	story.save(function(err, data){
	// 		if (err) {console.log(err); throw(err);}
	// 		console.log(story);
	// 	});
	// })

});
app.get('/register', function(req, res) {
	if (req.isAuthenticated()) {
		res.redirect('/');
	}
	else {
		res.render('register', {message: req.flash('registerMessage')});
	}

});
app.post('/register', passport.authenticate('local-register', {
	successRedirect: '/',
	failureRedirect: '/register',
	failureFlash: true
}));
app.get('/login', function(req, res) {
	if (req.isAuthenticated()) {
		res.redirect('/');
	} 
	else {
		res.render('login', {message: req.flash('loginMessage')});	
	}
});
app.post('/login', passport.authenticate('local-login', {
	successRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
}));
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});
app.get('/profile', ensureAuthenticated, function(req, res) {
	User.findOne({"_id": req.session.passport.user}, function(err, user) {
		if (err) throw err;
		console.log(user);
		res.render('profile', {user: user});
	});
});
app.get('/profile/:id', function(req, res) {
	User.findById({"_id": req.params.id}, function(err, user) {
		res.render('profile', {user: user});
	});
});
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
function timeHandler(data) {
	var date1 = data._id.getTimestamp();
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
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	}
	else {
		req.flash('Error', 'You must be logged in');
		res.redirect('/login');
	}
}
function checkAuthenticationStatus(req, res, next) {
	res.locals.isAuthenticated = req.isAuthenticated(); 
	next();
};