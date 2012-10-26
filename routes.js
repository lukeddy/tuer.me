var login = require('./routes/login'),
config = require('./lib/config'),
index = require('./routes/index'),
register = require('./routes/register'),
about = require('./routes/about'),
help = require('./routes/help'),
forgot = require('./routes/forgot'),
tips = require('./routes/tips'),
user = require('./routes/user'),
diary = require('./routes/diary'),
log = require('./routes/log'),
notebook = require('./routes/notebook'),
comment = require('./routes/comment'),
friend = require('./routes/friend'),
set = require('./routes/set'),
mail = require('./routes/mail'),
error = require('./routes/error'),
api = require('./routes/api'),
guest = require('./routes/guest'),
music = require('./routes/music'),
search = require('./routes/search');

module.exports = function(app) {

    app.redirect('home','/');
    app.redirect('login','/login');
    app.redirect('notebook','/notebook');
    app.redirect('set','/set');
    app.redirect('pwd','/set/pwd');
    app.redirect('avatar','/set/avatar');
    app.redirect('json_error','/500');
    app.redirect('404','/404');
    app.redirect('500','/500');


    app.get('/login',login.index);
    app.post('/login',login.signin);
    app.get('/logout',login.logout);

    app.get('*',login.cookies);

    app.get('/register', register.index);
    app.post('/register/invite', register.invite);
    app.get('/register/active/:active', register.active);

	app.get('/', index.index);
	app.get('/index', index.index);

    app.get('/about',about.index);
    app.get('/log',log.index);
    app.get('/help',help.index);

    app.get('/forgot',forgot.index);
    app.post('/forgot/findpwd',forgot.findpwd);

    app.get('/tips',tips.index);

    app.get('/user/profile/:id',user.profile);
    app.get('/user/:uid/diaries/:page?',user.diaries);
    app.get('/user/:uid/notebook/:id/:page?',user.notebook);
    app.get('/user/rss/:id', user.rss);
    app.get('/user/follows/:id', user.followusers);
    app.get('/user/followed/:id', user.followedusers);
    app.get('/user/avatar/:id', user.avatar);
    app.get('/user/art/:id', user.art);

    app.get('/diaries/:page?',diary.list);
    app.get('/diary/:id',diary.detail);
    app.get('/diary/write',diary.write);
    app.get('/diary/edit/:id',diary.edit);
    app.post('/diary/save',diary.save);
    app.post('/diary/update',diary.update);
    app.post('/diary/remove',diary.remove);
    app.get('/followed/diaries/:page?',diary.followedDiaries);

    app.get('/notebook',notebook.index);
    app.post('/notebook/save',notebook.save);
    app.post('/notebook/update',notebook.update);
    app.post('/notebook/remove',notebook.remove);
    
    app.get('/search/',search.index);

    app.post('/comment/save',comment.save);
    app.post('/comment/remove',comment.remove);

    app.post('/friend/add',friend.add);
    app.post('/friend/remove',friend.remove);

    app.get('/set',set.index);
    app.get('/set/avatar',set.avatar);
    app.get('/set/pwd',set.pwd);
    app.post('/set/avatarSave',set.avatarSave);
    app.post('/set/upload',set.avatarUpload);
    app.post('/set/pwd/save',set.pwdSave);
    app.post('/set/update',set.update);

    app.get('/mail/inbox',mail.inbox);
    app.get('/mail/outbox',mail.outbox);
    app.post('/mail/send',mail.send);
    app.post('/mail/remove',mail.remove);

    app.get('/guest/:uid/:page?',guest.index);
    app.post('/guest/save',guest.save);
    app.post('/guest/remove',guest.remove);

    app.get('/music/search',music.search);
    app.get('/music/check',music.check);

    app.get('/api',api.index);

    app.get('/404',error.notFound);
    app.get('/500',error.proError);
    app.get('*',error.notFound);

};
