/**
 * Module dependencies.
 */

var express = require('express'),
rootdir = require('./lib/config').rootdir,
RedisStore = require('connect-redis')(express);
var app = express.createServer();
var wap = express.createServer();

// Configuration
function Configuration(app){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('view options',{layout:false});
	app.use(express.bodyParser({uploadDir:rootdir+'/public/images/'}));
	app.use(express.cookieParser());
	app.use(express.session({secret:'keyboard cat',store:new RedisStore}));
	app.use(express.methodOverride());
	app.use(express['static'](__dirname + '/public'));
    app.use(express.favicon(__dirname+'/public/favicon.ico'),{
        maxAge:2592000000    
    });
	app.use(app.router);
} 

function development(app){
	app.use(express.errorHandler({
		dumpExceptions: true,
		showStack: true
	}));
}

function production(app){
	app.use(express.errorHandler());
}

app.configure(function() {
    Configuration(app);
});

app.configure('development', function() {
    development(app);
});

app.configure('production', function() {
    production(app);
});

wap.configure(function() {
    Configuration(wap);
});

wap.configure('development', function() {
    development(wap);
});

wap.configure('production', function() {
    production(wap);
});

//controllers
require('./routes')(app);
require('./wapRoutes')(wap);
/*
//redirect
app.redirect('register','/register');
app.redirect('login','/login');
app.redirect('set','/set');
app.redirect('home','/');
app.redirect('404','/404');


// Routes
app.get('/tips',routes.tips);
app.post('/addfriend',routes.addFriend);
app.post('/removefriend',routes.removeFriend);

app.get('/about',routes.about);
app.get('/help',routes.help);

app.get('/avatar/:id',routes.avatar);
app.get('/art/:id',routes.art);

app.get('/', routes.index);
app.get('/search/', routes.search);

app.get('/profile/:id',routes.profile);

app.get('/register', routes.register);
app.post('/register/invite', routes.invite);
app.get('/register/active/:active', routes.active);

app.get('/login',routes.login);
app.post('/login',routes.signin);

app.get('/forgot',routes.forgot);
app.post('/forgot/findpwd',routes.findpwd);

app.get('/logout', routes.logout);
app.get('/set', routes.set);
app.post('/set', routes.saveset);

app.get('/diarys/:page?',routes.diarys);
app.get('/friend_diary/:page?',routes.friend_diary);

//app.get('/helpdb',routes.helpdb);

app.get('/follows/:uid',routes.followusers);
app.get('/followed/:uid',routes.followedusers);

app.get('/write',routes.write);
app.post('/savediary', routes.savediary);
app.get('/editdiary/:id', routes.editdiary);
app.post('/updatediary', routes.updatediary);
app.post('/deletediary', routes.deletediary);
app.get('/diary/:id/:page?', routes.diarylist);
app.get('/profile/:uid/diary/:id', routes.diarydetail);
app.get('/rss/diary/:uid', routes.diaryrss);
app.get('/ie',routes.ie);

app.get('/pag/comment/:page?',routes.commentpag);

app.post('/comment/save',routes.savecomment);
app.post('/comment/delete',routes.deletecomment);
app.get('/dbhelp',routes.dbhelp);

//404
app.get('404',routes.nofound);
app.get('*',routes.nofound);
*/
app.listen(3000);
wap.listen(3030);
//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
console.log('app server on 3000');
console.log('wap server on 3030');
