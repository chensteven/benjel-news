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
var connectEnsureLogin = require('connect-ensure-login');
var ObjectId = mongoose.Schema.Types.ObjectId;

var app = express();

// app & middelware configurations
app.set('view engine', 'jade'); // view engine, the template engine to use
app.set('views', __dirname + '/views'); // views, the directory where the template files are located
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/bower_components'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(morgan('dev')); // middleware logger for http request/reponse
app.use(flash());
app.use(session({ name: 'coco', secret: 'coco', resave: false, saveUninitialized: true, cookie: { secure: false, maxAge: null }}));
app.use(passport.initialize()); // call this middleware to initialize Passport
app.use(passport.session()); // call this to use persistent login sessions
app.use(checkAuthenticationStatus);
app.use(checkNotifications);

var port = process.env.PORT || 4000;
app.listen(port, function() {
	console.log('Listening at ' + port);
});
mongoose.connect('mongodb://localhost/benjel');

var Story = require('./models/story');
var User = require('./models/user');
var Comment = require('./models/comment');
var Notification = require('./models/notification');

passport.use('local-register', new LocalStrategy({passReqToCallback: true, usernameField: 'login-username', passwordField: 'login-password'}, function(req, username, password, done) {
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
passport.use('local-login', new LocalStrategy({passReqToCallback: true, usernameField: 'login-username', passwordField: 'login-password'}, function(req, username, password, done) {
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
var storyPerPage = 10;
app.get('/', function(req, res) {
	console.log(req.session);
	Story.count({}, function(err, count) {
		if (err) throw err;
		var pages = Math.ceil((count / storyPerPage));
		var page = 1;
		Story.find({}).sort({created: -1}).populate('author').skip(storyPerPage * (page - 1)).limit(storyPerPage).lean().exec(function(err, stories) {
			if (err) throw err;
			stories.forEach(function(story) {
				story.commentsLength = story.comments.length;
				story.created = story._id.getTimestamp();
				story.timeAgo = timeHandler(story);
				if (story.link) {
					story.displayLink = displayUrl(story.link);
				}
			});
			if (req.session.passport.user) {
				User.findOne({"_id": req.session.passport.user}).populate('favPosts').exec(function(err, user) {
					if (err) throw err;
					res.render('index', {data: stories, favPosts: user.favPosts, pages: pages, page: page});
				});
			}
			else {
					//console.log(stories);
				res.render('index', {data: stories, pages: pages, page: page});
			}
		});
	});
});
app.post('/clrnotif', function(req, res) {
	Notification.find({"user": req.session.passport.user, "read": false}).populate('story user comment').exec(function(err, notifications) {
		if (err) {
			res.sendStatus(400);
			throw err;
		}
		notifications.forEach(function(notif) {
			notif.read = true;
			notif.save();
		});
		console.log(notifications);
		res.json(notifications);
	});
});
app.get('/page/:page', function(req, res) {
	var _number = parseInt(req.params.page);
	if (_number==1) {
		res.redirect('/');	
	}
	if (Number.isInteger(_number)) {
		Story.count({}, function(err, count) {
			if (err) throw err;
			var pages = Math.ceil((count / storyPerPage));
			var page = Math.max(0, req.params.page);
			Story.find({}).sort({created: -1}).populate('author').skip(storyPerPage * (page - 1)).limit(storyPerPage).lean().exec(function(err, stories) {
				if (err) throw err;
				stories.forEach(function(story) {
					story.commentsLength = story.comments.length;
					story.created = story._id.getTimestamp();
					story.timeAgo = timeHandler(story);
					if (story.link) {
						story.displayLink = displayUrl(story.link);
					}
				});
				if (req.session.passport.user) {
					User.findOne({"_id": req.session.passport.user}).populate('favPosts').exec(function(err, user) {
						if (err) throw err;
						res.render('index', {data: stories, favPosts: user.favPosts, pages: pages, page: page});
					});
				}
				else {
						//console.log(stories);
					res.render('index', {data: stories, pages: pages, page: page});
				}
			});
		});
	}
	else {
		res.render('401');
	}
});
app.get('/fav', connectEnsureLogin.ensureLoggedIn('/login'), function(req, res) {
	User.findOne({"_id": req.session.passport.user}).populate('favPosts').lean().exec(function(err, data) {
		if (err) throw err;
		User.populate(data, {path: 'favPosts.author', model: 'User'}, function(err, data) {
			if (err) throw err;
			data.favPosts.reverse();
			res.render('fav', {data: data});
		});
	});
});
app.post('/fav/:id', connectEnsureLogin.ensureLoggedIn('/login'), function(req, res) {
	User.findByIdAndUpdate({"_id": req.session.passport.user}, {$addToSet: {favPosts: req.params.id}}).exec(function(err, data) {
		if (err) {
			res.sendStatus(400);
			throw err;
		}
		res.sendStatus(200);
	});
});
app.delete('/fav/:id', connectEnsureLogin.ensureLoggedIn('/login'), function(req, res) {
	User.findByIdAndUpdate({"_id": req.session.passport.user}, {$pull: {favPosts: req.params.id}}).exec(function(err, data) {
		if (err) {
			res.sendStatus(400);
			throw err;
		}
		res.sendStatus(200);
	});
});
app.get('/news', function(req, res) {
console.log(req.session);
	Story.count({}, function(err, count) {
		if (err) throw err;
		var pages = Math.ceil((count / storyPerPage));
		var page = 1;
		Story.find({}).sort({upvote: -1}).populate('author').skip(storyPerPage * (page - 1)).limit(storyPerPage).lean().exec(function(err, stories) {
			if (err) throw err;
			stories.forEach(function(story) {
				story.commentsLength = story.comments.length;
				story.created = story._id.getTimestamp();
				story.timeAgo = timeHandler(story);
				if (story.link) {
					story.displayLink = displayUrl(story.link);
				}
			});
			if (req.session.passport.user) {
				User.findOne({"_id": req.session.passport.user}).populate('favPosts').exec(function(err, user) {
					if (err) throw err;
					res.render('news', {data: stories, favPosts: user.favPosts, pages: pages, page: page});
				});
			}
			else {
					//console.log(stories);
				res.render('news', {data: stories, pages: pages, page: page});
			}
		});
	});
});
app.post('/news', function(req, res) {
	var story = new Story();
	story.author = req.session.passport.user;
	story.title = req.body['story-title'];
	story.save(function(err, story) {
		if (err) throw err;
		if (req.body['story-link']) {
			story.link = urlHandler(req.body['story-link']);
		} else {
			story.link = urlHandler("news/"+(story._id));
		}
		if (req.body['story-comment']) {
			story.content = req.body['story-comment']
		}
		story.save(function(err, data) {
			if (err) throw err;
			User.findByIdAndUpdate({'_id': req.session.passport.user}, {$addToSet: {stories: data._id}}).exec(function(err, user) {
				res.redirect('/news/' + encodeURIComponent(data._id));
			});
		});	
	})
})
app.get('/news/:id', function(req, res) {
	Story.findOne({"_id": req.params.id}).populate('author comments').lean().exec(function(err, story) {
		if (err) {
			throw err;
			console.log("cant find document:" + err);
		}
		if (story) {
			story.timeAgo = timeHandler(story);
			story.commentsLength = story.comments.length;
			story.displayLink = displayUrl(story.link);
			if (story.author._id == req.session.passport.user) {
				story.sameAuthor = true;
			}
			Comment.find({"story": req.params.id}).sort({created: -1}).populate('author childrenComments').exec(function(err, comments) {
				if (err) throw err;
				comments.forEach(function(comment) {
					comment.timeAgo = timeHandler(comment);
					if (comment.author._id == req.session.passport.user) {
						comment.sameAuthor = true;
					}
				});
				var formAction = "/news/"+req.params.id+"/comment";
				if (req.session.passport.user) {
					User.findOne({"_id": req.session.passport.user}).populate('favPosts').exec(function(err, user) {
						if (err) throw err;
						res.render('news-single', {story: story, comments: comments, formAction: formAction, favPosts: user.favPosts });
					});
				} 
				else {
					res.render('news-single', {story: story, comments: comments, formAction: formAction});	
				}

			});	
		}
		else {
			res.render('401.jade');
		}
	});
});
app.delete('/news/:id', function(req, res) {
	User.findByIdAndUpdate({'_id': req.session.passport.user}, {$pull: {stories: req.params.id, votedPosts: req.params.id}}).exec(function(err, data) {
		Comment.find({'story': req.params.id}, function(err, comments) {
			if (err) {
				throw err;
				res.sendStatus(400);
			}
			comments.forEach(function(comment) {
				User.find({'comments': comment._id}, function(err, users) {
					if (err) throw err;
					 users.forEach(function(user) {
						 user.update({$pull: {comments: comment._id, votedPosts: req.params.id}}, function(err) {
							 if (err) throw err;
						 });
					 })
				});
				comment.remove(function(err) {
					if(err) throw err;
				})
			});
		});
		Story.findByIdAndRemove({'_id': req.params.id}).exec(function(err, story) {
			if (err) {
				throw err;
				res.sendStatus(400);
			}
			else {
				res.sendStatus(200);
			}
		})

	});	
})
app.get('/news/:id/edit', ensureAuthenticated ,function(req, res) {
	Story.findOne({"_id": req.params.id}).exec(function(err, story) {
		var formAction = "/news/"+req.params.id+"/edit";
		res.render('news-edit', {story: story, formAction: formAction});
	})
});
app.post('/news/:id/edit', function(req, res) {
	Story.findByIdAndUpdate({"_id": req.params.id}, {title: req.body['story-title'], link: urlHandler(req.body['story-link']), content: req.body['story-comment']}).exec(function(err, story) {
		if (err) throw err;
		res.redirect('/news/' + encodeURIComponent(story._id));
	});
});

app.post('/news/:id/upvote', function(req, res) {
	if (req.session.passport.user) {
		User.findById({'_id': req.session.passport.user}, 'votedPosts', function(err, data) {
			var flag = false;
			for(var post in data.votedPosts) {
				if (req.params.id == data.votedPosts[post]) {
					flag = true;
				}
			}
			if (!flag) {
				User.update({'_id': req.session.passport.user}, {$addToSet: {votedPosts: req.params.id}}, function(err, data) {
					Story.findByIdAndUpdate({'_id': req.params.id}, {$inc: { upvote: 1}}, function(err, data) {
						if (err) throw err;
						res.end();
					});	
				});	
			} 
			else {
				res.status(401).end();
			}
		});
	}
	else {
		// TODO: send error  message
		res.status(401).end();
	}

});
app.post('/news/:id/downvote', function(req, res) {
	if (req.session.passport.user) {
		User.findById({'_id': req.session.passport.user}, 'votedPosts', function(err, data) {
			var flag = false;
			for (var post in data.votedPosts) {
				if (req.params.id == data.votedPosts[post]) {
					flag = true;
				}
			}
			if (flag) {
				User.update({'_id': req.session.passport.user}, {$pull: {votedPosts: req.params.id}}, function(err, data) {
					Story.findByIdAndUpdate({'_id': req.params.id}, {$inc: { upvote: -1}}, function(err, data) {
						if (err) throw err;
						res.end();
					});		
				});
			}
			else {
				res.status(401).end();
			}
		});
	}
	else {
		res.status(401).end();
	}
});
app.post('/news/:id/comment', function(req, res) {
	var comment = new Comment();
	comment.author = req.session.passport.user;
	comment.content = req.body.comments;
	comment.story = req.params.id;
	if (req.body.parentId) {
		comment.parentComment = req.body.parentId;
	}
	comment.save(function(err, data) {
		if (err) throw err;
		Story.findOneAndUpdate({'_id': req.params.id}, {$addToSet: {comments: {'_id': data._id}}}, function(err, story) {
			if (err) throw err;
			User.findOneAndUpdate({'_id': req.session.passport.user}, {$addToSet: {comments: {'_id': data._id }}}, function(err, user) {
				if (err) throw err;
				// once the comment is made to the story, the original poster gets a notification
					// find the poster's id
					// add one notification to the poster
					// click the button and it sends a request back to the server to delete
						// need to create a get method and ajax post
				if ((story.author)!=(req.session.passport.user)){
					var notification = new Notification();
					notification.user = story.author;
					notification.story = story._id;
					notification.comment = data._id;
					notification.save(function(err, notif) {
						if (err) throw err;
						User.findOneAndUpdate({'_id': story.author}, {$addToSet : { notifications: notif._id }}).exec(function(err, userData) {
							if (err) throw err;
						});
					});
				}
				res.redirect('/news/' + encodeURIComponent(req.params.id));
			});
		});
	});
});
app.get('/comment/:id/edit', ensureAuthenticated, function(req, res) {
	Comment.findOne({"_id": req.params.id}).populate('story').exec(function(err, comment) {
		if (err) throw err;
		Story.findOne({"_id": comment.story._id}).populate('author').exec(function(err, story) {
			if (err) throw err;
			story.timeAgo = timeHandler(story);
			var formAction = "/comment/"+req.params.id+"/edit";
			res.render('comment-edit', {comment: comment, story: story, formAction: formAction});
		});
	});
});
app.post('/comment/:id/edit', function(req, res) {
	Comment.findByIdAndUpdate({"_id": req.params.id}, {content: req.body['comments']}).exec(function(err, data) {
		if (err) throw err;
		res.redirect('/news/' + encodeURIComponent(data.story));
	});
});
app.delete('/comment/:id', function(req, res) {
	Comment.findOne({'_id': req.params.id}).exec(function(err, comment) {
		comment.remove(function(err) {
			if (err) throw err;
		})
		Story.findOneAndUpdate({'_id': comment.story }, {$pull: {comments: req.params.id}}).exec(function(err, story) {
			User.findByIdAndUpdate({'_id': req.session.passport.user}, {$pull: {comments: req.params.id}}).exec(function(err, user) {
				if (err) {
					throw err;
					res.sendStatus(400);
				}
				res.sendStatus(200);
			});
		})
	});
});
app.get('/submit', connectEnsureLogin.ensureLoggedIn('/login'), function(req, res) {
	res.render('submit');
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
	successReturnToOrRedirect: '/',
	failureRedirect: '/login',
	failureFlash: true
}));
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});
app.get('/profile', ensureAuthenticated, function(req, res) {
	User.findOne({"_id": req.session.passport.user}).populate('favPosts votedPosts stories').exec(function(err, user) {
		if (err) throw err;
		console.log(user);
		Comment.find({"author": user._id}).populate('story').exec(function(err, comments) {
			if (err) throw err;
			res.render('profile', {user: user, comments: comments});
		})
	});
});
app.get('/profile/:id', function(req, res) {
	User.findById({"_id": req.params.id}).populate('favPosts votedPosts stories').exec(function(err, user) {
		if (err) throw err;
		console.log(user);
		Comment.find({'author': user._id}).populate('story').exec(function(err, comments) {
			if (err) throw err;
			res.render('profile', {user: user, comments: comments});
		})

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
	var d = parseInt(h / 24);
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
function checkNotifications(req, res, next) {
	if (req.session.passport.user) {
		Notification.find({"user": req.session.passport.user, "read": false}).populate('story user comment').lean().exec(function(err, notifications) {
			if (err) {
				throw err;
			}
			Notification.populate(notifications, {path: 'comment.author', model: 'User'}, function(err, data) {
				if (err) throw err;
				notifications.forEach(function(notif) {
					notif.timeAgo = timeHandler(notif);
				});
				notifications.length = notifications.length;
				req.session.notifications = notifications;
				res.locals.notifications = req.session.notifications;
				console.log(res.locals);
			});
		});
	}
	next();
}
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	}
	else {
		res.redirect('/');
	}
}
function checkAuthenticationStatus(req, res, next) {
	console.log(req.isAuthenticated());
	if (req.isAuthenticated()) {
		User.findOne({"_id": req.session.passport.user}).exec(function(err, user) {
			res.locals.username = user.username;
			res.locals.isAuthenticated = req.isAuthenticated();	
			console.log(res.locals);
		});
	}
	next();
}
function trump(str, pattern) {
  var trumped = "";  // default return for invalid string and pattern

  if (str && str.length) {
    trumped = str;
    if (pattern && pattern.length) {
      var idx = str.indexOf(pattern);
      if (idx != -1) {
        trumped = str.substring(0, idx);
      }
    }
  }
  return (trumped);
}
function urlHandler(_str) {
	var str = _str;
	console.log(str);
	if (str.indexOf("news") == 0) {
		str = str.replace(/^/, "/");
	}
	else {
		var pattern = "www.";
		str = str.replace(/.*?:\/\//g, "");
		var index = str.indexOf(pattern);
		if (index != -1) {
			str = str.replace(/^www./,'http://');
		}
		else {
			str = str.replace(/^/, 'http://');
		}
	}
	console.log(str);
	return str;
};
function displayUrl(_str) {
	var str = _str;
	if (str.indexOf("news") == 1) {
		str = "";
	} else {
		str = str.replace(/.*?:\/\//g, "").replace(/^www./,'http://');
		str = trump(str, "/");	
	}
	return str;
};