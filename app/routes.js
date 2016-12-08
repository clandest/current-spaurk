
models = require(__dirname + '/models/user');

var User = models.User;
var Post = models.Post;
var Profile = models.Profile;
var ProfileComment = models.ProfileComment;
var ProfileReply = models.ProfileReply;
var fs = require('fs');

module.exports = function(app, upload){

	app.get('/', function(req, res, done){
		Post.find({}).populate('_user').exec(function(err, allPosts){
			if(!err){
				res.render('index.html', {
					posts: allPosts,
					title: 'Spaurk.net',
					isLogged: req.session.isLogged,
					user: req.session.user,
					accountImage: req.session.accountImage,
					messages: req.flash('alert')
				});
			}else
				return done(err);
		});
	});

	app.get('/id/:id', function(req, res, done){
		Post.findById(req.params.id, function(err, post){
			if(err)
				return done(err);
			if(!post)
				return res.send(404);

			post.remove(function(err){
				if(err)
					return done(err);
				fs.unlink('views/static/uploads/' + post.audioFile);
				if(typeof post.imageFile != 'undefined')
					fs.unlink('views/static/uploads/' + post.imageFile);
				res.redirect('/');
			});
		});
	});

	app.post('/login/', function(req, res){
		var username = req.body.username;
		var password = req.body.password;

		User.findOne({ username: username }, function(err, user){
			if(err) throw err;

			if(user && user.validPassword(password) == true){
				req.session.regenerate(function(){
					req.session.user = user.username;
					req.session.accountImage = user.profileImage;
					req.session.isLogged = true;
					res.redirect('/');
				});
			}else{
				req.flash('alert', 'Invalid username or password');
				res.redirect('/register');
			}
		});
	});

	app.get('/logout', function(req, res){
		req.session.destroy(function(){
			res.redirect('/');
		});
	});

	app.get('/register', function(req, res){
		res.render('register.html', {
			title: 'Register Account',
			messages: req.flash('alert')
		});
	});

	app.post('/register', upload.single('image'), function(req, res){
		var password = req.body.password;
		var username = req.body.username;
		if(req.file)
			var profileImage = req.file.filename; 
		var email = req.body.email;
		var date = new Date();
		var user = new User();

		user.username = username;
		user.password = user.generateHash(password);
		if(profileImage)
			user.profileImage = profileImage;
		user.email    = email;
		user.created_at = date;

		user.save(function(err, newUser){
			if(err) throw err;

			if(newUser){
				var profile = new Profile();
				profile._user = newUser._id;

				profile.save(function(err, newProfile){
					if(err)
						throw err;

					if(newProfile){
						req.session.regenerate(function(){
							req.session.user = newUser.username;
							req.session.accountImage = newUser.profileImage;
							req.session.isLogged = true;
							res.redirect('/');
						});
					}
				});
			}
		});
	});

	app.get('/upload', function(req, res){
		if(!req.session.isLogged){
			req.flash('alert', 'Login to make a new upload');
			res.redirect('/')
		} else {
			res.render('upload.html', {
				title: 'New Upload',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				isLogged: req.session.isLogged
			});
		}
	});

	var manageUpload = upload.fields([{ name: 'fileElem', maxCount: 1 }, { name: 'imageElem', maxCount: 1 } ]);
	app.post('/upload', manageUpload, function(req, res){
		var post = new Post();
		var query = req.query;

		User.findOne({ username: req.session.user }, function(err, newUser){
			if(err)
				throw err;

			post.audioFile = req.files['fileElem'][0].filename;

			if(typeof req.files['imageElem'] !== "undefined")
				post.imageFile = req.files['imageElem'][0].filename;

			post._user = newUser._id;
			post.title = req.body.title;
			post.artist = req.body.artist;
			post.start = req.body.start;
			post.stop = req.body.stop;
			post.genre = req.body.genre;
			post.tags = req.body.tags;
			post.category = req.body.categoryList;
			
			post.save(function(err, newPost){
				if(err)
					throw err;
				if(newPost){
					req.flash('alert', 'succesfull upload');
					res.redirect('/');
				}
			});

		});
	});

	app.get('/p/:user', function(req, res){
		User.findOne({ username: req.params.user }, function(err, profileUser){
			res.render('profile.html', {
				title: req.params.user + ' Profile',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileUser.profileImage,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
			});
		});
	});

	app.get('/p/:user/watchlist', function(req, res){
		User.findOne({ username: req.params.user }, function(err, profileUser){
			res.render('watchlist.html', {
				title: req.params.user + ' Watchlist',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileUser.profileImage,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
			});
		});
	});

	app.get('/p/:user/following', function(req, res){
		User.findOne({ username: req.params.user }, function(err, profileUser){
			res.render('following.html', {
				title: req.params.user + ' Following',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileUser.profileImage,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
			});
		});
	});

	app.get('/p/:user/comments', function(req, res){
		User.findOne({ username: req.params.user }, function(err, profileUser){
			Profile.findOne({ _user: profileUser._id }, function(err, profile){
				ProfileComment.find({ _profile: profileUser._id }).sort('-created_at').populate('_replies').populate('_user').exec(function(err, comments){
					res.render('comments.html', {
						title: req.params.user + ' Comments',
						messages: req.flash('alert'),
						user: req.session.user,
						profileImage: profileUser.profileImage,
						profileComments: comments,
						isLogged: req.session.isLogged,
						userProfile: req.params.user
					});
			});

			});
		});
	});

	app.post('/p/:user/comments', function(req, res){
		User.findOne({ username: req.params.user }, function(err, profileUser){
			if(err)
				throw err;

			User.findOne({ username: req.session.user }, function(err, commentUser){
				if(err)
					throw err;

				var comment = new ProfileComment({
					_user:  commentUser._id,	
					_profile: profileUser._id,
					body: req.body.newComment,
					created_at: new Date()
				});
			
				comment.save(function(err, newComment){
					if(err)
						throw err;
					if(newComment){
						Profile.findOne({ _user: profileUser._id }, function(err, profile){
							if(err)
								throw err;

							profile._comments.push(newComment);
							profile.save();
							});
						}
				});

			});

		});

	});

	app.post('/p/:user/comments/reply', function(req, res){

		User.findOne({ username: req.session.user }, function(err, replyUser){
			if(err)
				throw err;

			var reply = new ProfileReply({
				_user:  replyUser._id,	
				body: req.body.newReply,
				_comments: req.body.commentId,
				created_at: new Date()
			});
		
			reply.save(function(err, newReply){
				if(err)
					throw err;

				if(newReply){
					ProfileComment.findOne({ _id: req.body.commentId }, function(err, replyComment){
						if(err)
							throw err;
						replyComment._replies.push(newReply._id);

						replyComment.save(function(err, commentReply){
							if(err)
								throw err;
						});
					});
				}

			});

		});

	});

	app.get('/p/:user/support', function(req, res){
		User.findOne({ username: req.params.user }, function(err, profileUser){
			res.render('support.html', {
				title: req.params.user + ' Support',
				messages: req.flash('alert'),
				user: req.session.user,
				accountImage: req.session.accountImage,
				profileImage: profileUser.profileImage,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
			});
		});
	});
	
};
