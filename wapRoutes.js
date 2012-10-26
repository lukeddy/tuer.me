var config = require('./lib/config'),
index = require('./routes/wap/index'),
diary = require('./routes/wap/diary'),
set = require('./routes/wap/set'),
register = require('./routes/wap/register'),
comment = require('./routes/wap/comment'),
error = require('./routes/wap/error'),
user = require('./routes/wap/user'),
login = require('./routes/wap/login');

module.exports = function(app) {

    app.redirect('json_error','/500');
    app.redirect('404','/404');
    app.redirect('500','/500');

    app.get('*',function(req,res,next){
        if(!req.accepts("html") && req.accepts("application/xhtml+xml")){
            res.charset = 'UTF-8';
            res.header('Content-Type', 'application/xhtml+xml');
        }
        next();
    });

    app.post('/login',login.signin);
    app.get('/logout',login.logout);

    app.get('*',login.cookies);

	app.get('/',index.index);
	app.get('/index',index.index);

    app.get('/register',register.index);
    app.post('/register/invite', register.invite);
    app.get('/register/active/:active', register.active);


    app.get('/profile/:id',user.profile);
    app.get('/profile/:uid/diaries/:page?',user.diaries);

    app.get('/diary/:id',diary.detail);
    app.get('/diaries/:page?',diary.list);
    app.get('/diary/write',diary.write);
    app.get('/diary/edit/:id',diary.edit);
    app.post('/diary/save',diary.save);
    app.post('/diary/update',diary.update);
    app.post('/diary/remove',diary.remove);

    app.post('/comment/save',comment.save);
    app.post('/comment/remove',comment.remove);

    app.get('/set',set.index);
    app.get('/set/pwd',set.pwd);
    app.post('/set/update',set.update);
    app.post('/set/pwdSave',set.pwdSave);

    app.get('/404',error.notFound);
    app.get('/500',error.proError);
    app.get('*',error.notfound);
};
