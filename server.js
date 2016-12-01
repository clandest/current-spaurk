
var express					= require('express'),
		app							= express(),
		port						= process.env.PORT || 8080,
		mongoose				= require('mongoose'),
		nunjucks				= require('nunjucks'),
		flash						= require('connect-flash');

var bodyParser			= require('body-parser'),
		multer					= require('multer'),
		upload					= multer({ dest: __dirname + '/views/static/uploads/' }),
		session					= require('express-session');

//configure db
var configDB = require(__dirname + '/config/database.js');
mongoose.connect(configDB.url);
//mongoose.connect('mongodb://devyn:password@ds161505.mlab.com:61505/spaurk');

//configure sesion
app.use(session({
	secret: 'I tsgw 337',
	resave: true,
	saveUninitialized: true
}));

app.use(flash());

//moving html data around easier
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//set up routing and template engine
app.use(express.static(__dirname + '/views/static/'));
app.set('view engine', 'nunjucks');
require(__dirname + '/app/routes.js')(app, upload);

//configure nunjucks
nunjucks.configure('views', {
		autoescape: true,
		express: app
});

//listen for a connection
app.listen(port, function(){
		console.log('listening on port ' + port + '.');
});
