var tuerBase = require('../model/base'),
config = require('../lib/config'),
util = require('../lib/util'),
Rss = require('rss'),
Pag = require('../lib/pag').pag,
RGBcolor = require('../lib/RGBcolor'),
escape = require('jade').runtime.escape,
Avatar = require('../lib/avatar'),
EventProxy = require('eventproxy').EventProxy;

var profile = function(req, res) {
	var proxy = new EventProxy(),
	render = function(user, isSelf, diaryCount, userDiaryList, Follows, Followed, notebooks, defulatBook) {

		if (isSelf) req.session.template = 'myprofile';
        else req.session.template = 'profile';

        var bgcolor = '4d67d1';

		util.setDay(user);
		user.avatarUrl = Avatar.getArtUrl(user._id);
		user.smallAvatar = Avatar.getUrl(user._id);
        user.about = user.about ? escape(user.about).replace(/\r\n/g, '<br>') : undefined;
		user.isFriend = function() {
			if (!req.session.is_login) return false;
			var friends = req.session.userdata.firends;
			for (var i = 0; i < friends.length; i++) {
				if (friends[i] == user._id.toString()) return true;
			}
			return false;
		} ();

		userDiaryList.forEach(function(item) {
			util.setTime(item);
			item.created_user = user.nick;
			item.img = util.getpics(150, 1, item.filelist);
            item.content = item.content.length > 50 ? item.content.slice(0,50)+'...' : item.content;
		});

		Follows[0].forEach(function(item) {
			item.avatarUrl = Avatar.getUrl(item._id);
		});

		Followed.forEach(function(item) {
			item.avatarUrl = Avatar.getUrl(item._id);
		});

		defulatBook.size = function() {
			var total = diaryCount,
			othersize = function() {
				ret = 0;
				notebooks.forEach(function(item) {
					ret += item.size;
				});
				return ret;
			} ();
			return total - othersize;
		} ();

		notebooks.push(defulatBook);

        notebooks.forEach(function(item){
            if(item.bgcolor == undefined) item.bgcolor = bgcolor;
            var bgrgb = new RGBcolor('#'+item.bgcolor);
            item.fontcolor = 'rgb('+(255 - bgrgb.r)+','+(255-bgrgb.g)+','+(255-bgrgb.b)+')';
        });

		req.session.title = user.nick + '的个人主页';
		res.render('user/profile', {
			config: config,
			session: req.session,
			isSelf: isSelf,
            rss:{
                address:req.params.id,
                title:user.nick+'的日记'
            },
			user: user,
			diaryCount: diaryCount,
			userDiaryList: userDiaryList,
			Follows: Follows[0],
			FollowsCount: Follows[1],
			Followed: Followed,
			notebooks: notebooks,
			pag: new Pag({
				cur: 1,
				space: 6,
				url: '/user/' + user._id + '/diaries',
				total: diaryCount
			}).init()
		});
		if (!isSelf && req.session.is_login) tuerBase.removeFriendsTips(req.session.userdata._id, user._id);
	};

	proxy.assign('User', 'isSelf', 'DiaryCount', 'UserDiaryList', 'Follows', 'Followed', 'notebooks', 'defulatBook', render);

	var uid = req.params.id;

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {
			proxy.trigger('User', user);
			var uid = user._id.toString(),
			isSelf = req.session.is_login ? (req.session.userdata._id.toString() == uid) : false;

			proxy.trigger('isSelf', isSelf);

			tuerBase.findDiaryCount(uid, isSelf, function(err, DiaryCount) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('DiaryCount', DiaryCount);
				}
			});

			tuerBase.findDiaryByUserId(uid, isSelf, 0, 6, function(err, lists) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('UserDiaryList', lists);
				}
			});

			tuerBase.findFollows(uid, 10, function(err, follows, followscount) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('Follows', [follows, followscount]);
				}
			});

			tuerBase.findBy({
				_id: {
					'$in': user.firends
				}
			},
			'users', 10, function(err, users) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('Followed', users);
				}
			});

			tuerBase.findBy({
				owner: {
					'$in': [uid]
				}
			},
			'notebooks', user.notebook, function(err, notebooks) {
				if (err) {
					res.redirect('500');
				} else {
					tuerBase.getNotesCount(notebooks, function(err, notebooks) {
						if (err) res.redirect('500');
						else {
							proxy.trigger('notebooks', notebooks);
						}
					});
				}
			});

			tuerBase.findBy({
				owner: - 1
			},
			'notebooks', 1, function(err, notebooks) {
				if (err) res.redirect('500');
				else {
					proxy.trigger('defulatBook', notebooks[0]);
				}
			});
		}
	});
};

var notebook = function(req, res) {
	var page = req.params.page,
	space = 6,
	bookid = req.params.id,
	uid = req.params.uid;
	if (page && isNaN(page)) {
		res.redirect('404');
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}

	var proxy = new EventProxy(),
	render = function(user, notebook,isSelf, diaryCount, userDiaryList) {
		userDiaryList.forEach(function(item) {
			util.setTime(item);
			item.created_user = user.nick;
			item.img = util.getpics(150, 1, item.filelist);
            item.content = item.content.length > 50 ? item.content.slice(0,50)+'...' : item.content;
            item.weather = item.weather ? config.weather[item.weather].value : undefined;
            item.mood = item.mood ? config.mood[item.mood].value : undefined;
		});
		req.session.title = notebook.name;
		req.session.template = 'diarylist';

		res.render('notebook/notebooklist', {
			config: config,
            notebook:notebook,
			session: req.session,
			isSelf: isSelf,
			user: user,
			diaryCount: diaryCount,
			userDiaryList: userDiaryList,
			pag: new Pag({
				cur: page + 1,
				space: space,
				total: diaryCount,
				url: '/user/' + uid + '/notebook/'+bookid
			}).init()
		});

	};

	proxy.assign('user','notebook' ,'isSelf', 'diaryCount', 'UserDiaryList', render);
    
    tuerBase.findById(bookid,'notebooks',function(err,notebook){
        if(err) res.redirect('500');
        else{
             proxy.trigger('notebook',notebook);
        }
    });    

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {

			proxy.trigger('user', user);

			var uid = user._id.toString(),
			isSelf = req.session.is_login ? (req.session.userdata._id.toString() == uid) : false;

			proxy.trigger('isSelf', isSelf);            

            var Selector ={
                userid:uid.toString(),
                notebook:bookid
            };
            if(!isSelf) Selector['privacy'] = 0;
			tuerBase.getCount(Selector,'diary', function(err, count) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('diaryCount', count);
				}
			});

			var split = page * space;

			tuerBase.findBySlice(Selector, 'diary', split, split + space, function(err, lists) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('UserDiaryList', lists);
				}
			});
		}
	});
};

var diaries = function(req, res, next) {
	var page = req.params.page,
	space = 6,
	uid = req.params.uid;
	if (page && isNaN(page)) {
		res.redirect('404');
		return;
	} else if (page == undefined || page == 1) {
		page = 0;
	} else {
		page = page - 1;
	}

	var proxy = new EventProxy(),
	render = function(user, isSelf, diaryCount, userDiaryList) {

		userDiaryList.forEach(function(item) {
			util.setTime(item);
			item.created_user = user.nick;
			item.img = util.getpics(150, 1, item.filelist);
            item.content = item.content.length > 50 ? item.content.slice(0,50)+'...' : item.content;
            item.avatarUrl = Avatar.getUrl(item.userid);
            item.isSelf = req.session.is_login ? item.userid == req.session.userdata._id.toString() : false;
		});

		req.session.title = user.nick + '的日记列表页';
		req.session.template = 'diarylist';

		res.render('diary/diaries', {
			config: config,
			session: req.session,
			isSelf: isSelf,
			user: user,
			diaryCount: diaryCount,
			diaries: userDiaryList,
			pag: new Pag({
				cur: page + 1,
				space: space,
				total: diaryCount,
				url: '/user/' + uid + '/diaries'
			}).init()
		});
	};

	proxy.assign('user', 'isSelf', 'diaryCount', 'UserDiaryList', render);

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('500');
		} else {

			proxy.trigger('user', user);

			var uid = user._id.toString(),
			isSelf = req.session.is_login ? (req.session.userdata._id.toString() == uid) : false;

			proxy.trigger('isSelf', isSelf);

			tuerBase.findDiaryCount(uid, isSelf, function(err, count) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('diaryCount', count);
				}
			});

			var split = page * space;

			tuerBase.findDiaryByUserId(uid, isSelf, split, split + space, function(err, lists) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('UserDiaryList', lists);
				}
			});

		}
	});

};

var rss = function(req, res) {
	var uid = req.params.id,
	proxy = new EventProxy(),
	render = function(user, diaries) {
		var feed = new Rss({
			title: user.nick + '\'s diaries',
			description: user.nick + '\'s diaries in the tuer web site',
			feed_url: 'http://www.tuer.me/rss/diary/' + uid,
			site_url: 'http://www.tuer.me/profile/' + uid,
			author: user.nick
		});

		diaries.forEach(function(item) {
			feed.item({
				title: item.title,
				description: item.content,
				url: 'http://www.tuer.me/profile/' + uid + '/diary/' + item._id,
				author: user.nick,
				data: item.created_at
			});
		});
		res.header('Content-Type', 'text/xml');
		res.send(feed.xml());
	};

	proxy.assign('user', 'diaries', render);

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('404');
		} else {
			proxy.trigger('user', user);

			var isSelf = req.session.is_login ? req.session.userdata._id.toString() == user._id.toString(): false;

			tuerBase.findDiaryByUserId(user._id, isSelf, 0, 10, function(err, diaries) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('diaries', diaries);
				}
			});
		}
	});

};

var followusers = function(req, res) {
	var uid = req.params.id,
	proxy = new EventProxy(),
	render = function(user, Follows) {

		req.session.title = '关注' + user.nick + '的人';
		req.session.template = 'userslist';

		user.avatarUrl = Avatar.getUrl(user._id);

		Follows.forEach(function(item) {
			item.avatarUrl = Avatar.getUrl(item._id);
		});

		res.render('user/userslist', {
			config: config,
			session: req.session,
			user: user,
			users: Follows
		});
	};

	proxy.assign('user', 'Follows', render);

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('404');
		} else {
			proxy.trigger('user', user);
			var len = user.firends.length;
			if (len) {
				tuerBase.findBy({
					_id: {
						'$in': user.firends
					}
				},
				'users', len, function(err, users) {
					if (err) {
						res.redirect('500');
					} else {
						proxy.trigger('Follows', users);
					}
				});
			} else {
				proxy.trigger('Follows', []);
			}
		}
	});
};

var followedusers = function(req, res) {
	var uid = req.params.id,
	proxy = new EventProxy(),
	render = function(user, Follows) {

		req.session.title = user.nick + '关注的人';
		req.session.template = 'userslist';

		user.avatarUrl = Avatar.getUrl(user._id);

		Follows.forEach(function(item) {
			item.avatarUrl = Avatar.getUrl(item._id);
		});

		res.render('user/userslist', {
			config: config,
			session: req.session,
			user: user,
			users: Follows
		});
	};

	proxy.assign('user', 'Follows', render);

	tuerBase.findUser(uid, function(err, user) {
		if (err) {
			res.redirect('404');
		} else {
			proxy.trigger('user', user);
			var uid = user._id;
			tuerBase.findFollows(uid, user.firends.length, function(err, users) {
				if (err) {
					res.redirect('500');
				} else {
					proxy.trigger('Follows', users);
				}
			});
		}
	});
};

var avatar = function(req, res) {
	var uid = req.params.id;
	Avatar.getAvatar(uid, 48, 48, function(err, buf, lastMod) {
		if (err) res.redirect('500');
		else {
			var ifModifiedSince = 'if-modified-since',
			D = new Date(),
			year = 1000 * 60 * 60 * 24,
			lastModified = new Date(D.valueOf() - year).toString(),
			Expires = new Date(D.valueOf() + year).toString();

			if (req.headers[ifModifiedSince] && lastMod == req.headers[ifModifiedSince]) {
				res.writeHead(304, "Not Modified");
				res.end();
				return;
			}
			res.header('Content-Type', 'image/png');
			res.header('Last-Modified', lastMod);
			res.header('Expires', Expires);
			res.header('Date', D.toString());
			res.header('Cache-Control', 'max-age=' + year);
			res.send(buf);
		}
	});
};

var art = function(req, res) {
	var uid = req.params.id;
	Avatar.getAvatar(uid, null, null, function(err, buf, lastMod) {
		if (err) res.redirect('500');
		else {
			var ifModifiedSince = 'if-modified-since',
			D = new Date(),
			year = 1000 * 60 * 60 * 24,
			lastModified = new Date(D.valueOf() - year).toString(),
			Expires = new Date(D.valueOf() + year).toString();

			if (req.headers[ifModifiedSince] && lastMod == req.headers[ifModifiedSince]) {
				res.writeHead(304, "Not Modified");
				res.end();
				return;
			}
			res.header('Content-Type', 'image/png');
			res.header('Last-Modified', lastMod);
			res.header('Expires', Expires);
			res.header('Date', D.toString());
			res.header('Cache-Control', 'max-age=' + year);
			res.send(buf);
		}
	});
};

exports.profile = profile;
exports.diaries = diaries;
exports.notebook = notebook;
exports.rss = rss;
exports.followusers = followusers;
exports.followedusers = followedusers;
exports.avatar = avatar;
exports.art = art;

