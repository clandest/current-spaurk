
models = require(__dirname + '/models/user');

var User = models.User;
var Post = models.Post;

module.exports = function(app, upload){

	app.get('/', function(req, res){
		res.render('index.html', {
			title: 'Spaurk.net',
			messages: req.flash('alert'),
			user: req.session.user,
			isLogged: req.session.isLogged
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

	app.post('/register', function(req, res){
		var password = req.body.password;
		var username = req.body.username;
		var email = req.body.email;
		var date = new Date();
		var user = new User();

		user.username = username;
		user.password = user.generateHash(password);
		user.email    = email;
		user.created_at = date;

		user.save(function(err, newUser){
			if(err) throw err;

			if(newUser){
				req.session.regenerate(function(){
					req.session.user = newUser.username;
					req.session.isLogged = true;
					console.log(req.session.user);
					res.redirect('/');
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
				isLogged: req.session.isLogged
			});
		}
	});

	app.get('/p/:user', function(req, res){
		res.render('profile.html', {
			title: req.params.user + ' Profile',
			messages: req.flash('alert'),
			user: req.session.user,
			isLogged: req.session.isLogged,
			userProfile: req.params.user
		});
	});

	app.get('/p/:user/watchlist', function(req, res){
		res.render('watchlist.html', {
				title: req.params.user + ' Watchlist',
				message: req.flash('alert'),
				user: req.session.user,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
		});
	});

	app.get('/p/:user/following', function(req, res){
		res.render('following.html', {
				title: req.params.user + ' Following',
				message: req.flash('alert'),
				user: req.session.user,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
		});
	});

	app.get('/p/:user/comments', function(req, res){
		res.render('comments.html', {
				title: req.params.user + ' Comments',
				message: req.flash('alert'),
				user: req.session.user,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
		});
	});

	app.post('/p/:user/comments', function(req, res){
		console.log("ok");
	});

	app.get('/p/:user/support', function(req, res){
		res.render('support.html', {
				title: req.params.user + ' Support',
				message: req.flash('alert'),
				user: req.session.user,
				isLogged: req.session.isLogged,
				userProfile: req.params.user
		});
	});

};
